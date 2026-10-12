/**
 * Deterministic chronology solver (SPEC 12.3) — a Simple Temporal Network.
 *
 * Every dated thing (event, reign, period) has two time points, `<id>:start` and `<id>:end`, measured in
 * fractional astronomical years. Each constraint becomes one or more difference bounds
 *     lo ≤ x_to − x_from ≤ hi
 * Anchors are bounds against a fixed origin. Bellman–Ford shortest paths give the tightest feasible interval
 * for every point; a negative cycle is a contradiction and is reported with the constraints that cause it.
 *
 * - Uncertainty is preserved: results are intervals, never single invented dates.
 * - Points with no path to an anchor stay unbounded (SPEC 12.8 #8).
 * - Only constraints of the selected model (or model-independent ones) are loaded (SPEC 12.8 #9).
 * - Every bound carries its derivation: the chain of constraints that produced it (SPEC 12.9).
 * - Disjunctive alternatives (e.g. competing regnal reckonings) are solved per combination and all feasible
 *   combinations are retained (SPEC 12.3).
 */
import type { ConstraintRelation } from '@atlas/shared';
import { regnalYearWindow, type RegnalConvention } from './regnal.ts';

export const ORIGIN = '__origin__';
const EPS = 1 / 365; // "strictly before" = at least one day earlier
const INF = Number.POSITIVE_INFINITY;

export type Precision =
  | 'day' | 'month' | 'year' | 'regnal_year' | 'decade' | 'reign' | 'generation' | 'century' | 'period' | 'undated';

const PRECISION_RANK: Record<Precision, number> = {
  day: 0, month: 1, year: 2, regnal_year: 3, decade: 4, reign: 5, generation: 6, century: 7, period: 8, undated: 9,
};

export interface Anchor {
  id: string;
  subject: string; // entity id
  point?: 'start' | 'end' | 'both'; // default 'both' (the whole item lies within the window)
  earliest: number | null; // astronomical year (inclusive)
  latest: number | null; // astronomical year (inclusive)
  precision: Precision;
  modelId: string | null;
  isEvidence?: boolean; // independent external evidence — never overridden by a model
  source?: string | undefined;
}

export interface Constraint {
  id: string;
  subject: string;
  relation: ConstraintRelation;
  object: string; // entity id (or reign id for within_reign / in_regnal_year)
  offsetMin?: number | null;
  offsetMax?: number | null;
  unit?: 'days' | 'months' | 'years' | null;
  precision: Precision;
  modelId: string | null;
  textualAssertion: string;
  regnalYear?: number; // for in_regnal_year
  /** The reckoning used by this statement's author; overrides the reign's convention (SPEC 12.4). */
  convention?: RegnalConvention;
  /** Members of the same alternativeGroup are mutually exclusive alternatives (one is chosen per solve). */
  alternativeGroup?: string;
  isEvidence?: boolean;
}

export interface ReignConvention {
  reign: string;
  convention: RegnalConvention;
  modelId: string | null;
  alternativeGroup?: string;
  id: string;
}

export interface SolveInput {
  modelId: string | null;
  anchors: Anchor[];
  constraints: Constraint[];
  conventions?: ReignConvention[];
  /** Entities whose start == end (instantaneous). Others have end ≥ start. */
  pointEvents?: string[];
}

export interface Bound {
  value: number | null; // null = unbounded
  derivation: string[]; // constraint/anchor ids, in order from the origin
}

export interface ComputedInterval {
  subject: string;
  start: { earliest: Bound; latest: Bound };
  end: { earliest: Bound; latest: Bound };
  /** Whole astronomical years spanned by the entity's feasible start window. */
  years: { earliest: number | null; latest: number | null };
  precision: Precision;
}

export interface Contradiction {
  cycle: string[]; // constraint/anchor ids forming the infeasible cycle
  message: string;
}

export interface SolveResult {
  modelId: string | null;
  choice: Record<string, string>; // alternativeGroup → chosen constraint/convention id
  feasible: boolean;
  intervals: Map<string, ComputedInterval>;
  contradictions: Contradiction[];
  excluded: string[]; // ids excluded because they belong to a different model
}

interface Edge {
  from: string;
  to: string;
  w: number; // x_to − x_from ≤ w
  id: string;
}

/** Internal bookkeeping edges (not evidence) are excluded from derivations and diagnostics. */
const isInternal = (id: string) => /#(duration|instant|super)$/.test(id);

const S = (id: string) => `${id}:start`;
const E = (id: string) => `${id}:end`;

function unitToYears(unit: Constraint['unit']): number {
  if (unit === 'days') return 1 / 365.25;
  if (unit === 'months') return 1 / 12;
  return 1;
}

/** Turn a constraint into difference edges. */
function constraintEdges(c: Constraint): Edge[] {
  const out: Edge[] = [];
  // add lo ≤ x_b − x_a ≤ hi
  const diff = (a: string, b: string, lo: number, hi: number) => {
    if (hi !== INF) out.push({ from: a, to: b, w: hi, id: c.id });
    if (lo !== -INF) out.push({ from: b, to: a, w: -lo, id: c.id });
  };
  const sub = c.subject;
  const obj = c.object;
  const k = unitToYears(c.unit ?? 'years');
  const omin = (c.offsetMin ?? 0) * k;
  const omax = (c.offsetMax ?? c.offsetMin ?? 0) * k;
  switch (c.relation) {
    case 'before': diff(S(sub), S(obj), EPS, INF); break; // subject starts strictly before object starts
    case 'after': diff(S(obj), S(sub), EPS, INF); break;
    case 'ends_before': diff(E(sub), S(obj), 0, INF); break;
    case 'begins_after': diff(E(obj), S(sub), 0, INF); break;
    case 'immediately_follows': diff(E(obj), S(sub), 0, 1 / 12); break; // within a month; documented assumption
    case 'during':
    case 'within_reign':
    case 'within_dated_range':
      diff(S(obj), S(sub), 0, INF);
      diff(E(sub), E(obj), 0, INF);
      break;
    case 'overlaps':
      diff(S(sub), E(obj), 0, INF);
      diff(S(obj), E(sub), 0, INF);
      break;
    case 'same_year': diff(S(obj), S(sub), -1, 1); break;
    case 'same_approximate_period': diff(S(obj), S(sub), -25, 25); break; // ±25y; documented assumption
    case 'days_later':
    case 'months_later':
    case 'years_later':
      diff(S(obj), S(sub), omin, omax + (c.unit === 'years' || c.relation === 'years_later' ? 1 : k));
      break;
    case 'years_earlier': diff(S(sub), S(obj), omin, omax + 1); break;
    case 'in_regnal_year': break; // handled separately (needs the reign's accession interval)
  }
  return out;
}

function anchorEdges(a: Anchor): Edge[] {
  const out: Edge[] = [];
  const pts = a.point === 'start' ? [S(a.subject)] : a.point === 'end' ? [E(a.subject)] : [S(a.subject), E(a.subject)];
  for (const p of pts) {
    if (a.latest !== null) out.push({ from: ORIGIN, to: p, w: a.latest + 1 - EPS, id: a.id }); // x ≤ latest year end
    if (a.earliest !== null) out.push({ from: p, to: ORIGIN, w: -a.earliest, id: a.id }); // x ≥ earliest
  }
  return out;
}

interface Paths {
  dist: Map<string, number>;
  pred: Map<string, Edge>;
  negativeCycle: string[] | null;
}

function bellmanFord(nodes: string[], edges: Edge[], source: string): Paths {
  const dist = new Map<string, number>(nodes.map((n) => [n, INF]));
  const pred = new Map<string, Edge>();
  dist.set(source, 0);
  for (let i = 0; i < nodes.length - 1; i++) {
    let changed = false;
    for (const e of edges) {
      const du = dist.get(e.from)!;
      if (du === INF) continue;
      if (du + e.w < dist.get(e.to)! - 1e-12) {
        dist.set(e.to, du + e.w);
        pred.set(e.to, e);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const e of edges) {
    const du = dist.get(e.from)!;
    if (du !== INF && du + e.w < dist.get(e.to)! - 1e-9) {
      // Walk predecessors n times to land inside the cycle, then collect it.
      pred.set(e.to, e);
      let v = e.to;
      for (let i = 0; i < nodes.length && pred.has(v); i++) v = pred.get(v)!.from;
      const ids: string[] = [];
      let u = v;
      do {
        const pe = pred.get(u);
        if (!pe) break;
        ids.push(pe.id);
        u = pe.from;
      } while (u !== v && ids.length <= nodes.length);
      return { dist, pred, negativeCycle: [...new Set(ids.reverse())] };
    }
  }
  return { dist, pred, negativeCycle: null };
}

function chain(pred: Map<string, Edge>, target: string, source: string): string[] {
  const ids: string[] = [];
  let v = target;
  const seen = new Set<string>();
  while (v !== source && pred.has(v) && !seen.has(v)) {
    seen.add(v);
    const e = pred.get(v)!;
    ids.push(e.id);
    v = e.from;
  }
  return [...new Set(ids.reverse())];
}

function coarsest(...ps: Precision[]): Precision {
  return ps.reduce((a, b) => (PRECISION_RANK[b] > PRECISION_RANK[a] ? b : a), 'day' as Precision);
}

function solveOnce(
  input: SolveInput,
  constraints: Constraint[],
  anchors: Anchor[],
  conventions: ReignConvention[],
  choice: Record<string, string>,
  excluded: string[],
): SolveResult {
  const subjects = new Set<string>();
  for (const c of constraints) {
    subjects.add(c.subject);
    subjects.add(c.object);
  }
  for (const a of anchors) subjects.add(a.subject);
  const points = new Set(input.pointEvents ?? []);
  const baseEdges: Edge[] = [];
  for (const s of subjects) {
    // end ≥ start; instantaneous events have end == start
    baseEdges.push({ from: E(s), to: S(s), w: 0, id: `${s}#duration` });
    if (points.has(s)) baseEdges.push({ from: S(s), to: E(s), w: 0, id: `${s}#instant` });
  }
  const staticEdges = [
    ...baseEdges,
    ...anchors.flatMap(anchorEdges),
    ...constraints.filter((c) => c.relation !== 'in_regnal_year').flatMap(constraintEdges),
  ];
  const nodes = [ORIGIN, ...[...subjects].flatMap((s) => [S(s), E(s)])];
  const regnal = constraints.filter((c) => c.relation === 'in_regnal_year');
  const conventionOf = new Map(conventions.map((c) => [c.reign, c]));

  // Global contradiction check: a virtual source reaches every node, so cycles among undated items are found too.
  const SUPER = '__super__';
  const globalCheck = bellmanFord([SUPER, ...nodes], [...staticEdges, ...nodes.map((n) => ({ from: SUPER, to: n, w: 0, id: '#super' }))], SUPER);

  let derived: Edge[] = [];
  let fwd!: Paths;
  let bwd!: Paths;
  // Fixpoint: regnal-year windows depend on accession intervals, which may tighten as windows are applied.
  for (let iter = 0; iter < 8; iter++) {
    const edges = [...staticEdges, ...derived];
    fwd = bellmanFord(nodes, edges, ORIGIN);
    if (fwd.negativeCycle) break;
    bwd = bellmanFord(nodes, edges.map((e) => ({ ...e, from: e.to, to: e.from })), ORIGIN);
    if (bwd.negativeCycle) break;
    const next: Edge[] = [];
    for (const c of regnal) {
      const conv = c.convention ? { id: `${c.id}#own-convention`, convention: c.convention } : conventionOf.get(c.object);
      if (!conv || c.regnalYear === undefined) continue;
      const lo = -(bwd.dist.get(S(c.object)) ?? INF);
      const hi = fwd.dist.get(S(c.object)) ?? INF;
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue; // accession not anchored → no absolute window
      const w = regnalYearWindow({ earliest: lo, latest: hi }, c.regnalYear, conv.convention);
      const id = `${c.id}|${conv.id}`;
      next.push({ from: ORIGIN, to: S(c.subject), w: w.latest, id });
      next.push({ from: S(c.subject), to: ORIGIN, w: -w.earliest, id });
    }
    const same =
      next.length === derived.length && next.every((e, i) => Math.abs(e.w - derived[i]!.w) < 1e-9 && e.to === derived[i]!.to);
    derived = next;
    if (same) break;
  }

  const contradictions: Contradiction[] = [];
  const cycle = globalCheck.negativeCycle ?? fwd.negativeCycle ?? bwd?.negativeCycle ?? null;
  if (cycle) {
    contradictions.push({
      cycle: cycle.filter((id) => !isInternal(id)),
      message: `Infeasible constraint set: ${cycle.filter((id) => !isInternal(id)).join(' → ')}`,
    });
  }

  const intervals = new Map<string, ComputedInterval>();
  if (!cycle) {
    const precisionOf = new Map<string, Precision>();
    for (const a of anchors) precisionOf.set(a.id, a.precision);
    for (const c of constraints) precisionOf.set(c.id, c.precision);
    const bound = (p: string, upper: boolean): Bound => {
      const paths = upper ? fwd : bwd;
      const d = paths.dist.get(p) ?? INF;
      if (d === INF) return { value: null, derivation: [] };
      return { value: upper ? d : -d, derivation: chain(paths.pred, p, ORIGIN).filter((id) => !isInternal(id)) };
    };
    for (const s of subjects) {
      const start = { earliest: bound(S(s), false), latest: bound(S(s), true) };
      const end = { earliest: bound(E(s), false), latest: bound(E(s), true) };
      const used = [...start.earliest.derivation, ...start.latest.derivation].map((id) => precisionOf.get(id.split('|')[0]!));
      const precision =
        start.earliest.value === null && start.latest.value === null
          ? 'undated'
          : coarsest('day', ...used.filter((p): p is Precision => p !== undefined));
      intervals.set(s, {
        subject: s,
        start,
        end,
        years: {
          earliest: start.earliest.value === null ? null : Math.floor(start.earliest.value + 1e-9),
          latest: start.latest.value === null ? null : Math.floor(start.latest.value - 1e-9),
        },
        precision,
      });
    }
  }
  return { modelId: input.modelId, choice, feasible: !cycle, intervals, contradictions, excluded };
}

/**
 * Solve a chronology model. Returns one result per combination of alternatives (max 64 combinations);
 * infeasible combinations are kept with their contradiction diagnostics.
 */
export function solve(input: SolveInput): SolveResult[] {
  const inModel = <T extends { modelId: string | null; id: string }>(xs: T[]) => xs.filter((x) => x.modelId === null || x.modelId === input.modelId);
  const excluded = [...input.anchors, ...input.constraints, ...(input.conventions ?? [])]
    .filter((x) => x.modelId !== null && x.modelId !== input.modelId)
    .map((x) => x.id);
  const anchors = inModel(input.anchors);
  const constraints = inModel(input.constraints);
  const conventions = inModel(input.conventions ?? []);

  // Group alternatives.
  const groups = new Map<string, string[]>();
  for (const x of [...constraints, ...conventions]) {
    if (x.alternativeGroup) groups.set(x.alternativeGroup, [...(groups.get(x.alternativeGroup) ?? []), x.id]);
  }
  const groupNames = [...groups.keys()].sort();
  let combos: Record<string, string>[] = [{}];
  for (const g of groupNames) {
    combos = combos.flatMap((c) => groups.get(g)!.map((id) => ({ ...c, [g]: id })));
    if (combos.length > 64) throw new Error('Too many alternative combinations (> 64); split the model.');
  }
  return combos.map((choice) => {
    const chosen = new Set(Object.values(choice));
    const keep = <T extends { id: string; alternativeGroup?: string }>(x: T) => !x.alternativeGroup || chosen.has(x.id);
    return solveOnce(input, constraints.filter(keep), anchors, conventions.filter(keep), choice, excluded);
  });
}

/** Contradictions that involve explicit evidence or model-independent text — these must be surfaced, never overridden. */
export function evidenceConflicts(result: SolveResult, input: SolveInput): Contradiction[] {
  const evidenceIds = new Set(
    [...input.anchors, ...input.constraints].filter((x) => x.isEvidence || x.modelId === null).map((x) => x.id),
  );
  return result.contradictions.filter((c) => c.cycle.some((id) => evidenceIds.has(id.split('|')[0]!)));
}

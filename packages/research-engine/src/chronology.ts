/** Bridge between research files and the deterministic chronology solver (SPEC 12.3). */
import { type Anchor, type Constraint, type ReignConvention, type SolveInput, type SolveResult, solve } from '@atlas/chronology-engine';
import type { ContextDossier } from './schemas.ts';
import type { ResearchStore } from './store.ts';

export function buildSolveInput(store: ResearchStore, modelId: string | null): SolveInput {
  const anchors: Anchor[] = [];
  const constraints: Constraint[] = [];
  const conventions: ReignConvention[] = [];
  for (const e of store.entities()) {
    if (e.kind !== 'reign') continue; // fixtures are rejected by validation/export, not silently dropped here
    anchors.push({ id: `${e.id}#start`, subject: e.id, point: 'start', earliest: e.start.earliest, latest: e.start.latest, precision: e.precision, modelId: e.model_id, source: e.citations[0] });
    anchors.push({ id: `${e.id}#end`, subject: e.id, point: 'end', earliest: e.end.earliest, latest: e.end.latest, precision: e.precision, modelId: e.model_id, source: e.citations[0] });
    if (e.regnal_convention) {
      conventions.push({
        id: `${e.id}#convention:${e.regnal_convention.reckoning}-${e.regnal_convention.new_year}`,
        reign: e.id,
        modelId: e.model_id,
        convention: { reckoning: e.regnal_convention.reckoning, newYear: e.regnal_convention.new_year },
        ...(e.regnal_convention.alternative_group ? { alternativeGroup: e.regnal_convention.alternative_group } : {}),
      });
    }
  }
  const pointEvents: string[] = [];
  // External synchronisms anchor their subject with an independently established date (SPEC 12.1).
  for (const e of store.entities()) {
    if (e.kind !== 'synchronism' || !e.anchor_subject) continue;
    if (e.independent_date.earliest === null && e.independent_date.latest === null) continue;
    anchors.push({ id: e.id, subject: e.anchor_subject, earliest: e.independent_date.earliest, latest: e.independent_date.latest, precision: e.precision, modelId: null, isEvidence: true, source: e.external_source_id ?? e.citations[0] });
  }
  for (const id of store.eventIds()) {
    if (!store.event(id).is_period) pointEvents.push(id);
    const ctx = store.context(id);
    if (!ctx) continue;
    for (const h of ctx.date_hypotheses) {
      // Sourced date hypotheses act as anchors within their model.
      anchors.push({ id: h.id, subject: id, earliest: h.interval.earliest, latest: h.interval.latest, precision: h.precision, modelId: h.model_id, isEvidence: false, source: h.citations[0] });
    }
    for (const c of ctx.constraints) {
      constraints.push({
        id: c.id,
        subject: c.subject,
        relation: c.relation,
        object: c.object,
        offsetMin: c.offset?.min ?? null,
        offsetMax: c.offset?.max ?? null,
        unit: c.unit,
        precision: c.precision,
        modelId: c.model_id,
        textualAssertion: c.textual_assertion,
        ...(c.regnal_year !== null ? { regnalYear: c.regnal_year } : {}),
        ...(c.regnal_convention ? { convention: { reckoning: c.regnal_convention.reckoning, newYear: c.regnal_convention.new_year } } : {}),
        ...(c.alternative_group ? { alternativeGroup: c.alternative_group } : {}),
        isEvidence: c.verification === 'source_checked',
      });
    }
  }
  return { modelId, anchors, constraints, conventions, pointEvents };
}

export function modelIds(store: ResearchStore): (string | null)[] {
  return [null, ...store.entities().filter((e) => e.kind === 'chronology_model' && !e.is_fixture).map((e) => e.id)];
}

export function solveAllModels(store: ResearchStore): Map<string | null, SolveResult[]> {
  const out = new Map<string | null, SolveResult[]>();
  for (const m of modelIds(store)) out.set(m, solve(buildSolveInput(store, m)));
  return out;
}

export interface DerivationStep {
  id: string;
  kind: 'constraint' | 'reign_anchor' | 'synchronism' | 'date_hypothesis' | 'derived' | 'other';
  label: string;
  passage: string | null;
  model_id: string | null;
  assumptions: string[];
  citations: string[];
}

/** Resolve solver derivation ids into human-readable steps (SPEC 12.9). */
export function derivationResolver(store: ResearchStore): (id: string) => DerivationStep {
  const constraints = new Map<string, { c: ContextDossier['constraints'][number]; event: string }>();
  const hypotheses = new Map<string, ContextDossier['date_hypotheses'][number]>();
  for (const eid of store.eventIds()) {
    const ctx = store.context(eid);
    for (const c of ctx?.constraints ?? []) constraints.set(c.id, { c, event: eid });
    for (const h of ctx?.date_hypotheses ?? []) hypotheses.set(h.id, h);
  }
  const entities = new Map(store.entities().map((e) => [e.id, e]));
  const nameOf = (id: string): string => {
    const e = entities.get(id);
    if (!e) {
      try {
        return store.event(id).title;
      } catch {
        return id;
      }
    }
    if (e.kind === 'reign') return `reign of ${nameOf(e.person_id)}`;
    if (e.kind === 'person') return e.canonical_name;
    if (e.kind === 'place') return e.primary_name;
    if ('name' in e) return e.name;
    if ('title' in e) return e.title;
    return id;
  };
  return (raw: string) => {
    const [base, conv] = raw.split('|');
    const id = base!;
    const hit = constraints.get(id);
    if (hit) {
      const { c } = hit;
      return {
        id: raw, kind: 'constraint',
        label: `“${c.textual_assertion}” — ${nameOf(c.subject)} ${c.relation.replaceAll('_', ' ')} ${nameOf(c.object)}${c.regnal_year ? ` (year ${c.regnal_year})` : ''}${c.regnal_convention ? ` [reckoned ${c.regnal_convention.reckoning.replace('_', '-')}, ${c.regnal_convention.new_year} new year]` : conv ? ` [convention ${conv.split('#convention:')[1] ?? conv}]` : ''}`,
        passage: c.passage, model_id: c.model_id, assumptions: c.assumptions, citations: c.citations,
      };
    }
    if (id.includes('#start') || id.includes('#end')) {
      const rid = id.split('#')[0]!;
      const r = entities.get(rid);
      if (r?.kind === 'reign') {
        const which = id.endsWith('#start') ? r.start : r.end;
        const fmt = (y: number | null) => (y === null ? '?' : y <= 0 ? `${1 - y} BC` : `AD ${y}`);
        return {
          id: raw, kind: 'reign_anchor',
          label: `${nameOf(rid)} ${id.endsWith('#start') ? 'began' : 'ended'} ${fmt(which.earliest)}${which.latest !== which.earliest ? `–${fmt(which.latest)}` : ''} (${r.model_id ? nameOf(r.model_id) : 'model-independent'})`,
          passage: r.stated_length_passage, model_id: r.model_id, assumptions: r.notes ? [r.notes] : [], citations: r.citations,
        };
      }
    }
    const syn = entities.get(id);
    if (syn?.kind === 'synchronism') {
      const fmt = (y: number | null) => (y === null ? '?' : y <= 0 ? `${1 - y} BC` : `AD ${y}`);
      const d = syn.independent_date;
      return {
        id: raw, kind: 'synchronism' as const,
        label: `Synchronism: ${syn.title} — independently dated ${fmt(d.earliest)}${d.latest !== d.earliest ? `–${fmt(d.latest)}` : ''} (${syn.dating_method})`,
        passage: syn.passage, model_id: null, assumptions: syn.assumptions, citations: syn.citations,
      };
    }
    const h = hypotheses.get(id);
    if (h) return { id: raw, kind: 'date_hypothesis', label: h.derivation, passage: null, model_id: h.model_id, assumptions: [], citations: h.citations };
    return { id: raw, kind: 'other', label: id, passage: null, model_id: null, assumptions: [], citations: [] };
  };
}

const toYear = (v: number | null, upper: boolean) => (v === null ? null : upper ? Math.floor(v - 1e-9) : Math.floor(v + 1e-9));

export function serializeResults(results: SolveResult[], resolve?: (id: string) => DerivationStep) {
  const steps = (ids: string[]) => (resolve ? ids.map(resolve) : ids);
  return results.map((r) => ({
    model_id: r.modelId,
    choice: r.choice,
    feasible: r.feasible,
    contradictions: r.contradictions.map((c) => ({ ...c, steps: steps(c.cycle) })),
    excluded: r.excluded,
    intervals: [...r.intervals.values()].map((i) => ({
      subject: i.subject,
      years: i.years,
      start: { earliest: toYear(i.start.earliest.value, false), latest: toYear(i.start.latest.value, true) },
      end: { earliest: toYear(i.end.earliest.value, false), latest: toYear(i.end.latest.value, true) },
      precision: i.precision,
      derivation: {
        earliest: steps(i.start.earliest.derivation),
        latest: steps(i.start.latest.derivation),
        end_earliest: steps(i.end.earliest.derivation),
        end_latest: steps(i.end.latest.derivation),
      },
    })),
  }));
}

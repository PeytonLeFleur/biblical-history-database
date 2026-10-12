/** Bridge between research files and the deterministic chronology solver (SPEC 12.3). */
import { type Anchor, type Constraint, type ReignConvention, type SolveInput, type SolveResult, solve } from '@atlas/chronology-engine';
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
  for (const id of store.eventIds()) {
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

export function serializeResults(results: SolveResult[]) {
  return results.map((r) => ({
    model_id: r.modelId,
    choice: r.choice,
    feasible: r.feasible,
    contradictions: r.contradictions,
    excluded: r.excluded,
    intervals: [...r.intervals.values()].map((i) => ({
      subject: i.subject,
      years: i.years,
      precision: i.precision,
      derivation: { earliest: i.start.earliest.derivation, latest: i.start.latest.derivation },
    })),
  }));
}

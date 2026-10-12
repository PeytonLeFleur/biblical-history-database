/**
 * Per-event research audit and publication decision (rules/05, SPEC 16).
 * Passing the audit means the record is well-formed and procedurally complete — not that the history is correct.
 */
import { VERIFICATION_LEVELS } from '@atlas/shared';
import type { PublicationLevel } from '@atlas/shared';
import { EventRecord, ValidationResult } from './schemas.ts';
import { today, type ResearchStore } from './store.ts';
import { validateRepository } from './validate.ts';

const STAGES = ['scripture_extraction', 'historical_reconstruction', 'external_evidence', 'cross_referencing', 'publication_validation'] as const;

export interface AuditOutcome {
  result: ValidationResult;
  written: boolean;
}

export function auditEvent(store: ResearchStore, id: string, opts: { write?: boolean; allowFixtures?: boolean } = {}): AuditOutcome {
  const ev = store.event(id);
  const ctx = store.context(id);
  const evd = store.evidence(id);
  const xr = store.crossrefs(id);
  const sources = new Map(store.sources().map((s) => [s.id, s]));
  const repo = validateRepository(store, { allowFixtures: opts.allowFixtures ?? false });
  const mine = repo.issues.filter((i) => i.file.includes(id) || i.file === 'chronology' || i.file.startsWith('research/sources') || i.file.startsWith('research/entities'));
  const errors = mine.filter((i) => i.severity === 'error');

  const checks: ValidationResult['checks'] = [];
  const add = (name: string, details: string[]) => checks.push({ name, passed: details.length === 0, details });

  add('repository_validation', errors.map((e) => `${e.file}: ${e.message}`));
  add('references_resolve', errors.filter((e) => /resolve/.test(e.message)).map((e) => e.message));
  add('summary_present', ev.summary.trim() ? [] : ['empty summary']);

  // Stage completion (stage 5 is completed by this audit itself).
  const incomplete = STAGES.filter((s) => s !== 'publication_validation')
    .filter((s) => !['complete', 'not_applicable'].includes(ev.stages[s].status))
    .map((s) => `${s}: ${ev.stages[s].status}`);
  add('stages_complete', incomplete);
  add('stage_files_complete', [
    ...(ctx?.status === 'complete' ? [] : ['context.json not complete']),
    ...(evd?.status === 'complete' ? [] : ['evidence.json not complete']),
    ...(xr?.status === 'complete' ? [] : ['crossrefs.json not complete']),
  ]);

  // Important claims must rest on sources whose claim support was actually checked (SPEC 16.2).
  const unchecked: string[] = [];
  for (const c of evd?.claims ?? []) {
    if (!['independently_corroborated', 'strongly_supported', 'contradicted_by_available_evidence'].includes(c.classification)) continue;
    for (const eid of [...c.supporting_evidence, ...c.counterevidence]) {
      const e = evd!.evidence.find((x) => x.id === eid);
      const s = e ? sources.get(e.source_id) : undefined;
      if (!s || VERIFICATION_LEVELS.indexOf(s.verification_level) < VERIFICATION_LEVELS.indexOf('claim_checked')) {
        unchecked.push(`${c.id} relies on ${e?.source_id ?? eid} below claim_checked`);
      }
    }
  }
  add('important_claims_source_checked', unchecked);
  add('competing_positions_represented', ctx && (ctx.competing_reconstructions.length > 0 || ctx.not_applicable['competing_reconstructions']) ? [] : ['no competing reconstructions recorded (or not_applicable reason)']);

  const reviews = store.reviews();
  const relatedIds = new Set([id, ...(evd?.claims.map((c) => c.id) ?? [])]);
  const openReviews = reviews.filter((r) => relatedIds.has(r.record_id) && r.status === 'open').map((r) => r.id);
  const approvedNow = reviews.some(
    (r) => r.record_kind === 'event' && r.record_id === id && r.decisions.some((d) => d.decision === 'approve' && d.record_revision === ev.revision),
  );

  const preliminaryOk = ['repository_validation', 'references_resolve', 'summary_present'].every((n) => checks.find((c) => c.name === n)!.passed);
  const researchedOk = checks.every((c) => c.passed);
  let level: PublicationLevel = 'unpublished';
  if (preliminaryOk) level = 'preliminary';
  if (researchedOk) level = 'researched';
  if (researchedOk && approvedNow) level = 'human_reviewed';

  const result = ValidationResult.parse({
    event_id: id,
    revision: ev.revision,
    validated_at: today(),
    checks,
    publication_level: level,
    open_reviews: openReviews,
    research_gaps: evd?.research_gaps ?? [],
    disputes: (evd?.claims ?? []).filter((c) => c.classification === 'disputed').map((c) => c.statement),
    export_eligible: level !== 'unpublished' && !ev.is_fixture,
  });

  if (opts.write) {
    store.write(ValidationResult, store.eventFile(id, 'validation'), result);
    const status = level === 'unpublished' ? 'validating' : openReviews.length ? 'needs_review' : 'publishable';
    store.write(EventRecord, store.eventFile(id, 'event'), {
      ...ev,
      publication_level: level,
      research_status: status,
      stages: { ...ev.stages, publication_validation: { status: researchedOk ? 'complete' : 'in_progress', updated: today(), reason: null } },
    });
  }
  return { result, written: !!opts.write };
}

/**
 * End-to-end research-engine tests on a temporary store.
 * EVERY record here is a SYNTHETIC FIXTURE (is_fixture: true). None of it is research.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '@atlas/shared';
import {
  ChapterExtraction,
  ContextDossier,
  CrossrefDossier,
  Entity,
  EventRecord,
  EvidenceDossier,
  ResearchStore,
  SourceFile,
  advanceVerification,
  auditEvent,
  decide,
  detectDuplicateEvents,
  exportPublic,
  findEntityMatches,
  longQuotes,
  prepareChapter,
  queueReview,
  registerSource,
  renderDossier,
  validateRepository,
} from './index.ts';

let root: string;
let store: ResearchStore;
const day = '2026-10-12';

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atlas-test-'));
  store = new ResearchStore(root);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const ok = (s: ResearchStore) => {
  const r = validateRepository(s, { allowFixtures: true });
  return { ok: r.ok, errors: r.issues.filter((i) => i.severity === 'error').map((i) => `${i.file}: ${i.message}`) };
};

function fixtureSource(title: string, level: 'source_accessed' | 'claim_checked' = 'claim_checked', doi?: string) {
  const { source } = registerSource(store, {
    title,
    source_type: 'scientific_paper',
    authors: ['Fixture, A.'],
    doi: doi ?? null,
    is_fixture: true,
    verification_level: 'source_accessed',
    verification_method: 'fixture',
  });
  return level === 'claim_checked' ? advanceVerification(store, source.id, 'claim_checked', 'fixture check, p. 1') : source;
}

const stages = (status: 'complete' | 'not_started') => ({
  scripture_extraction: { status, updated: day, reason: null },
  historical_reconstruction: { status, updated: day, reason: null },
  external_evidence: { status, updated: day, reason: null },
  cross_referencing: { status, updated: day, reason: null },
  publication_validation: { status: 'not_started' as const, updated: null, reason: null },
});

function fixtureEvent(opts: { complete?: boolean } = {}) {
  const id = newId('event');
  store.write(EventRecord, store.eventFile(id, 'event'), {
    id,
    slug: `fixture-${id.slice(-6).toLowerCase()}`,
    title: 'Fixture earthquake',
    summary: 'Synthetic test event.',
    is_fixture: true,
    literary_classification: 'historical_reference',
    narrative_mode: 'reference_to_other_event',
    categories: ['natural_disaster'],
    priority: 'high',
    research_status: 'validating',
    mentions: [{ passage: 'Amos.1.1', mention_type: 'reference', notes: null }],
    stages: stages(opts.complete === false ? 'not_started' : 'complete'),
    created_at: day,
    updated_at: day,
  });
  return id;
}

describe('chapter preparation (Rule 01 infrastructure)', () => {
  it('creates a skeleton covering every canonical verse as not_reviewed', () => {
    const p = prepareChapter(store, 'amos', 1);
    expect(p.created).toBe(true);
    const ch = store.read(ChapterExtraction, p.file);
    expect(ch.verse_coverage.map((v) => v.ref)).toEqual(Array.from({ length: 15 }, (_, i) => `Amos.1.${i + 1}`));
    expect(ch.verse_coverage.every((v) => v.status === 'not_reviewed')).toBe(true);
    expect(ok(store).ok).toBe(true);
    expect(prepareChapter(store, 'amos', 1).created).toBe(false); // idempotent
    expect(store.jobs()).toHaveLength(1);
  });

  it('rejects marking a chapter complete while verses remain unreviewed', () => {
    const p = prepareChapter(store, 'amos', 1);
    const ch = store.read(ChapterExtraction, p.file);
    store.write(ChapterExtraction, p.file, { ...ch, status: 'complete' });
    expect(ok(store).errors.some((e) => e.includes('not_reviewed in a complete chapter'))).toBe(true);
  });

  it('rejects vision content classified as a narrated occurrence', () => {
    const r = ChapterExtraction.safeParse({
      book: 'Dan', chapter: 7, status: 'in_progress', resume_from: 'Dan.7.1', text_edition: 'WEB',
      verse_coverage: [],
      candidates: [{
        id: newId('candidate'), title: 'Four beasts', passage: 'Dan.7.2-Dan.7.8', description: 'x',
        record_type: 'vision', literary_classification: 'apocalyptic_vision', narrative_mode: 'narrated_occurrence', research_priority: 'high',
      }],
    });
    expect(r.success).toBe(false);
  });
});

describe('sources (SPEC 10)', () => {
  it('deduplicates by DOI and enforces the verification ladder', () => {
    const a = registerSource(store, { title: 'Paper', source_type: 'scientific_paper', doi: '10.1/X', verification_method: 'found in search', is_fixture: true });
    const b = registerSource(store, { title: 'Paper (copy)', source_type: 'scientific_paper', doi: 'https://doi.org/10.1/x', verification_method: 'again', is_fixture: true });
    expect(b.duplicate).toBe(true);
    expect(b.source.id).toBe(a.source.id);
    expect(() => advanceVerification(store, a.source.id, 'claim_checked', 'skip')).toThrow(/one step/);
    expect(() => advanceVerification(store, a.source.id, 'human_reviewed', 'nope')).toThrow(/review workflow/);
    const s = advanceVerification(store, a.source.id, 'metadata_verified', 'Crossref lookup');
    expect(s.verification_log.map((l) => l.level)).toEqual(['discovered', 'metadata_verified']);
  });

  it('refuses coordinates without a source (never invent coordinates)', () => {
    const r = Entity.safeParse({
      kind: 'place', id: newId('location'), slug: 'x', primary_name: 'X', is_fixture: true,
      hypotheses: [{ id: newId('locationHypothesis'), label: 'guess', lat: 31, lon: 35, confidence: 'possible' }],
    });
    expect(r.success).toBe(false);
  });
});

describe('five-stage pipeline (fixture)', () => {
  function buildResearchedEvent() {
    const id = fixtureEvent();
    const s1 = fixtureSource('Fixture study one', 'claim_checked', '10.0/one');
    const s2 = fixtureSource('Fixture study two', 'claim_checked', '10.0/two');
    const kgd = newId('kingdom');
    const per = newId('person');
    const rgn = newId('reign');
    for (const e of [
      { kind: 'kingdom', id: kgd, slug: 'fixture-kingdom', name: 'Fixture Kingdom', is_fixture: true },
      { kind: 'person', id: per, slug: 'fixture-king', canonical_name: 'Uzziah', aliases: [{ alias: 'Azariah', passage: '2Kgs.15.1' }], is_fixture: true },
      { kind: 'reign', id: rgn, slug: 'fixture-reign', person_id: per, kingdom_id: kgd, start: { earliest: -790, latest: -785 }, end: { earliest: -740, latest: -735 }, precision: 'year', is_fixture: true, citations: [s1.id] },
    ]) store.write(Entity, store.entityFile(e.id), e as never);
    store.write(ContextDossier, store.eventFile(id, 'context'), {
      event_id: id, status: 'complete',
      text_summary: { layer: 'text', body: 'Fixture summary.', passage: 'Amos.1.1' },
      setting: { period: 'Fixture period', body: 'Fixture setting.', citations: [s1.id] },
      rulers: [{ person_id: per, reign_id: rgn, role: 'king', citations: [s1.id] }],
      constraints: [{ id: newId('constraint'), subject: id, object: rgn, relation: 'within_reign', textual_assertion: 'in the days of Uzziah', passage: 'Amos.1.1', precision: 'reign', verification: 'text_direct' }],
      competing_reconstructions: [{ label: 'Fixture A', proponents: ['Fixture'], summary: 'x', citations: [s2.id] }],
    });
    const clm = newId('claim');
    const e1 = newId('evidence');
    const e2 = newId('evidence');
    store.write(EvidenceDossier, store.eventFile(id, 'evidence'), {
      event_id: id, status: 'complete',
      search_log: [{ date: day, query: 'fixture query', engine: 'none', useful_results: 2 }],
      claims: [{ id: clm, statement: 'A fixture earthquake happened.', layer: 'reconstruction', classification: 'strongly_supported', reasoning: 'Two fixture lines.', supporting_evidence: [e1, e2], reviewer_status: 'machine_proposed', review_required: false, research_date: day }],
      evidence: [
        { id: e1, claim_ids: [clm], source_id: s1.id, stance: 'supports', strength: 'indirect', finding: 'Fixture finding one.', proposed_connection_by: 'author', independent_line: 'line-1' },
        { id: e2, claim_ids: [clm], source_id: s2.id, stance: 'supports', strength: 'indirect', finding: 'Fixture finding two.', proposed_connection_by: 'author', independent_line: 'line-2' },
      ],
      research_gaps: ['Fixture gap.'],
    });
    store.write(CrossrefDossier, store.eventFile(id, 'crossrefs'), {
      event_id: id, status: 'complete',
      relationships: [{ id: newId('relationship'), type: 'direct_reference', from: { kind: 'passage', ref: 'Zech.14.5' }, to: { kind: 'event', id }, confidence: 'high', layer: 'text', rationale: 'Fixture.', provenance: { method: 'text_reading' } }],
    });
    return { id, clm, s1, rgn };
  }

  it('audits a complete fixture event as researched, renders a dossier, and the export rejects fixtures', () => {
    const { id } = buildResearchedEvent();
    expect(ok(store)).toEqual({ ok: true, errors: [] });
    const { result } = auditEvent(store, id, { write: true, allowFixtures: true });
    expect(result.checks.filter((c) => !c.passed)).toEqual([]);
    expect(result.publication_level).toBe('researched');
    expect(store.event(id).research_status).toBe('publishable');
    const md = renderDossier(store, id);
    expect(md).toContain('Researched — not human reviewed');
    expect(md).toContain('Zechariah 14:5');
    expect(md).toContain('Fixture study one');
    const s = exportPublic(store, join(root, 'exports'));
    expect(s.events).toBe(0); // fixture event excluded
    expect(s.excludedEvents).toEqual([id]);
    expect(JSON.parse(readFileSync(join(root, 'exports/events.json'), 'utf8'))).toEqual([]);
    expect(JSON.parse(readFileSync(join(root, 'exports/sources.json'), 'utf8'))).toEqual([]);
  });

  it('downgrades to preliminary when important claims rest on unchecked sources', () => {
    const { id, s1 } = buildResearchedEvent();
    const src = store.read(SourceFile, store.sourceFile(s1.id));
    store.write(SourceFile, store.sourceFile(s1.id), { ...src, verification_level: 'source_accessed', verification_log: src.verification_log.slice(0, 1) });
    const { result } = auditEvent(store, id, { allowFixtures: true });
    expect(result.publication_level).toBe('preliminary');
    expect(result.checks.find((c) => c.name === 'important_claims_source_checked')!.passed).toBe(false);
  });

  it('rejects independently_corroborated without direct claim-checked evidence', () => {
    const { id } = buildResearchedEvent();
    const ev = store.evidence(id)!;
    store.write(EvidenceDossier, store.eventFile(id, 'evidence'), { ...ev, claims: ev.claims.map((c) => ({ ...c, classification: 'independently_corroborated' as const })) });
    expect(ok(store).errors.some((e) => e.includes('independently_corroborated needs direct'))).toBe(true);
  });

  it('requires a queued review for disputed claims, and approval only for the reviewed revision', () => {
    const { id, clm } = buildResearchedEvent();
    const ev = store.evidence(id)!;
    store.write(EvidenceDossier, store.eventFile(id, 'evidence'), { ...ev, claims: ev.claims.map((c) => ({ ...c, classification: 'disputed' as const, review_required: true })) });
    expect(ok(store).errors.some((e) => e.includes('no review item is queued'))).toBe(true);
    const item = queueReview(store, { record_kind: 'claim', record_id: clm, record_revision: 1, reason: 'disputed classification', triggers: ['disputed'] });
    expect(ok(store).ok).toBe(true);
    // Record changes after queueing → approval refused.
    const e = store.event(id);
    store.write(EventRecord, store.eventFile(id, 'event'), { ...e, revision: 2 });
    expect(() => decide(store, item.id, 'approve', 'owner', null)).toThrow(/revision/);
    store.write(EventRecord, store.eventFile(id, 'event'), { ...e, revision: 1 });
    decide(store, item.id, 'approve', 'owner', 'looks right');
    expect(store.evidence(id)!.claims[0]!.reviewer_status).toBe('human_approved');
  });

  it('flags human_approved claims without a recorded owner decision', () => {
    const { id } = buildResearchedEvent();
    const ev = store.evidence(id)!;
    store.write(EvidenceDossier, store.eventFile(id, 'evidence'), { ...ev, claims: ev.claims.map((c) => ({ ...c, reviewer_status: 'human_approved' as const })) });
    expect(ok(store).errors.some((e) => e.includes('without a recorded owner decision'))).toBe(true);
  });

  it('reports chronology contradictions found in research files', () => {
    const { id } = buildResearchedEvent();
    const ctx = store.context(id)!;
    store.write(ContextDossier, store.eventFile(id, 'context'), {
      ...ctx,
      date_hypotheses: [{ id: newId('dateHypothesis'), model_id: null, interval: { earliest: -600, latest: -590 }, precision: 'decade', derivation: 'fixture', citations: [] }],
    });
    expect(ok(store).errors.some((e) => e.startsWith('chronology'))).toBe(true);
  });
});

describe('entity resolution and duplicates', () => {
  it('matches aliases exactly and similar spellings as possible identities', () => {
    const per = { kind: 'person' as const, id: newId('person'), slug: 'n', canonical_name: 'Nebuchadnezzar', aliases: [{ alias: 'Nebuchadrezzar', language: null, source_id: null, passage: null }], is_fixture: true, revision: 1, citations: [], notes: null, description: null, kingdom_id: null };
    const m = findEntityMatches([per], 'Nebuchadrezzar');
    expect(m[0]?.exact).toBe(true);
    const fuzzy = findEntityMatches([per], 'Nebuchadnezar');
    expect(fuzzy[0]?.exact).toBe(false);
    expect(findEntityMatches([per], 'Belshazzar')).toHaveLength(0);
  });

  it('flags overlapping, similarly titled events as possible duplicates', () => {
    const mk = (title: string, passage: string) => ({ id: newId('event'), title, mentions: [{ passage, mention_type: 'narration' as const, notes: null }], parent_event_id: null });
    const d = detectDuplicateEvents([mk("Belshazzar's feast", 'Dan.5.1-Dan.5.4'), mk('Feast of Belshazzar', 'Dan.5.1'), mk('Fall of Babylon', 'Dan.5.30')]);
    expect(d).toHaveLength(1);
  });
});

describe('copyright guard', () => {
  it('detects quotations over 25 words', () => {
    expect(longQuotes('He wrote “short phrase here”.')).toEqual([]);
    expect(longQuotes(`“${'word '.repeat(26).trim()}”`)).toHaveLength(1);
  });
});

describe('global prophecy and synchronism records', () => {
  it('requires an owner review item for every proposed fulfillment (SPEC 9.3 #5)', () => {
    const src = fixtureSource('Fixture commentary', 'claim_checked', '10.0/proph');
    const ful = newId('fulfillment');
    const pro = newId('prophecy');
    store.write(Entity, store.entityFile(pro), {
      kind: 'prophecy', id: pro, slug: 'fixture-prophecy', title: 'Fixture prophecy', passage: 'Dan.7.17-Dan.7.27', description: 'x', is_fixture: true,
      interpretations: [{ id: ful, label: 'Fixture reading', approach: 'preterist', proponents: ['Fixture'], summary: 'x', is_proposed_fulfillment: true, citations: [src.id] }],
    } as never);
    expect(ok(store).errors.some((e) => e.includes('has no review item'))).toBe(true);
    queueReview(store, { record_kind: 'fulfillment', record_id: ful, record_revision: 1, reason: 'Proposed fulfillment', triggers: ['proposed_fulfillment'] });
    expect(ok(store).ok).toBe(true);
    decide(store, store.reviews()[0]!.id, 'reject', 'owner', null);
    const p = store.entities().find((e) => e.id === pro);
    expect(p?.kind === 'prophecy' && p.interpretations[0]!.reviewer_status).toBe('human_rejected');
  });

  it('anchors synchronism subjects as external evidence in the solver', async () => {
    const { buildSolveInput } = await import('./chronology.ts');
    const id = fixtureEvent();
    const src = fixtureSource('Fixture chronicle', 'claim_checked', '10.0/chron');
    const syn = newId('synchronism');
    store.write(Entity, store.entityFile(syn), {
      kind: 'synchronism', id: syn, slug: 'fixture-sync', title: 'Fixture synchronism', type: 'documentary_correlation', external_entity: 'Fixture tablet',
      external_source_id: src.id, proposed_synchronization: 'x', independent_date: { earliest: -604, latest: -604 }, precision: 'year', dating_method: 'fixture',
      direct: true, evidence_strength: 'strong', anchor_subject: id, is_fixture: true,
    } as never);
    const input = buildSolveInput(store, null);
    expect(input.anchors.find((a) => a.id === syn)).toMatchObject({ subject: id, earliest: -604, isEvidence: true });
  });
});

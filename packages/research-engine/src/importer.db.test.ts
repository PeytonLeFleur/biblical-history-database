/**
 * Importer test against the live dev database, run as a dry run (transaction rolled back).
 * All records are SYNTHETIC FIXTURES; nothing persists.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { newId } from '@atlas/shared';
import { connect } from '@atlas/database';
import { ChapterExtraction, ContextDossier, Entity, EventRecord, EvidenceDossier, ResearchStore, importResearch, prepareChapter, registerSource } from './index.ts';

const root = mkdtempSync(join(tmpdir(), 'atlas-import-'));
const store = new ResearchStore(root);
afterAll(() => rmSync(root, { recursive: true, force: true }));
const day = '2026-10-12';

describe('importer (dry run)', () => {
  it('imports every record type and rolls back', async () => {
    const p = prepareChapter(store, 'amos', 1);
    const ch = store.read(ChapterExtraction, p.file);
    store.write(ChapterExtraction, p.file, { ...ch, verse_coverage: ch.verse_coverage.map((v) => ({ ...v, status: 'reviewed_no_candidate' as const })), status: 'complete', resume_from: null });

    const { source } = registerSource(store, { title: 'Fixture paper', source_type: 'scientific_paper', doi: '10.0/fixture-import', verification_method: 'fixture', is_fixture: true });
    const kgd = newId('kingdom');
    const per = newId('person');
    const loc = newId('location');
    for (const e of [
      { kind: 'kingdom', id: kgd, slug: 'fixture-import-kingdom', name: 'Fixture Kingdom', is_fixture: true },
      { kind: 'person', id: per, slug: 'fixture-import-person', canonical_name: 'Fixture King', aliases: [{ alias: 'Fixture Alias' }], is_fixture: true },
      { kind: 'place', id: loc, slug: 'fixture-import-place', primary_name: 'Fixture Place', is_fixture: true,
        hypotheses: [{ id: newId('locationHypothesis'), label: 'fixture point', lat: 32, lon: 35, coordinate_precision: 'site', confidence: 'possible', geom_source_id: source.id }] },
    ]) store.write(Entity, store.entityFile(e.id), e as never);

    const id = newId('event');
    store.write(EventRecord, store.eventFile(id, 'event'), {
      id, slug: 'fixture-import-event', title: 'Fixture event', summary: 'x', is_fixture: true,
      literary_classification: 'historical_reference', narrative_mode: 'reference_to_other_event', categories: ['natural_disaster'],
      priority: 'high', research_status: 'validating', mentions: [{ passage: 'Amos.1.1', mention_type: 'reference', notes: null }],
      stages: Object.fromEntries(['scripture_extraction', 'historical_reconstruction', 'external_evidence', 'cross_referencing', 'publication_validation'].map((k) => [k, { status: 'not_started', updated: null, reason: null }])) as never,
      created_at: day, updated_at: day,
    });
    store.write(ContextDossier, store.eventFile(id, 'context'), {
      event_id: id, status: 'in_progress', resume_from: 'chronology',
      text_summary: { layer: 'text', body: 'x', passage: 'Amos.1.1' },
      setting: { period: 'x', body: 'x', citations: [source.id] },
      rulers: [{ person_id: per, role: 'king', citations: [] }],
      locations: [{ location_id: loc, role: 'affected', confidence: 'possible' }],
      constraints: [{ id: newId('constraint'), subject: id, object: per, relation: 'during', textual_assertion: 'fixture', passage: 'Amos.1.1', precision: 'reign', verification: 'text_direct' }],
    });
    const clm = newId('claim');
    const evd = newId('evidence');
    store.write(EvidenceDossier, store.eventFile(id, 'evidence'), {
      event_id: id, status: 'in_progress', resume_from: 'geology',
      claims: [{ id: clm, statement: 'x', layer: 'reconstruction', classification: 'historically_plausible', reasoning: 'x', contextual_evidence: [evd], reviewer_status: 'machine_proposed', review_required: false, research_date: day }],
      evidence: [{ id: evd, claim_ids: [clm], source_id: source.id, stance: 'contextual', strength: 'contextual', finding: 'x', proposed_connection_by: 'author', independent_line: 'fx' }],
    });

    const before = await (async () => {
      const { sql } = connect();
      const r = await sql`select status from verse_coverage where ref = 'Amos.1.1'`;
      await sql.end();
      return r[0]!.status as string;
    })();
    const n = await importResearch(store, { dryRun: true });
    expect(n).toMatchObject({ sources: 1, kingdoms: 1, people: 1, places: 1, events: 1, event_mentions: 1, chronological_constraints: 1, claims: 1, evidence_findings: 1, claim_evidence: 1, verse_coverage: 15 });
    expect(n['db_coverage_reviewed_visible']).toBeGreaterThanOrEqual(15);

    // Rolled back: nothing persisted.
    const { sql } = connect();
    const rows = await sql`select id from events where id = ${id}`;
    const cov = await sql`select status from verse_coverage where ref = 'Amos.1.1'`;
    await sql.end();
    expect(rows).toHaveLength(0);
    expect(cov[0]!.status).toBe(before);
  });
});

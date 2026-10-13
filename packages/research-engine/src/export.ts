/**
 * Public static export (SPEC 3.3, 17.1). Only publishable, non-fixture, non-restricted records leave the repo;
 * anything depending on an excluded record is excluded too (filterPublishable).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CANON } from '@atlas/scripture';
import { assertNoFixtures, filterPublishable } from '@atlas/static-export';
import { derivationResolver, serializeResults, solveAllModels } from './chronology.ts';
import { renderDossier } from './dossier.ts';
import { versesPerChapter } from './inventory.ts';
import type { ResearchStore } from './store.ts';

function collectIds(v: unknown, out: Set<string>) {
  if (typeof v === 'string' && /^(src|per|loc|kgd|rgn|chr|sit|art|doc|syn|vis|pro)_[0-9A-Z]{26}$/.test(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => collectIds(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectIds(x, out));
}

/**
 * Chronology export, format 2: `models[model][i].interval_refs` index into a shared, de-duplicated `intervals` table.
 * Readers expand it back to `{ ...result, intervals }` (apps/web/src/lib/data.ts).
 */
export interface CompactChronology {
  format: 2;
  models: Record<string, Array<Record<string, unknown> & { interval_refs: number[] }>>;
  intervals: unknown[];
}

export function compactChronology(chronology: Record<string, Array<{ intervals: unknown[] } & Record<string, unknown>>>): CompactChronology {
  const intervals: unknown[] = [];
  const index = new Map<string, number>();
  const intern = (iv: unknown) => {
    const key = JSON.stringify(iv);
    let i = index.get(key);
    if (i === undefined) { i = intervals.length; intervals.push(iv); index.set(key, i); }
    return i;
  };
  const models: CompactChronology['models'] = {};
  for (const [m, results] of Object.entries(chronology)) {
    models[m] = results.map(({ intervals: ivs, ...rest }) => ({ ...rest, interval_refs: ivs.map(intern) }));
  }
  return { format: 2, models, intervals };
}

export function expandChronology(c: CompactChronology): Record<string, Array<Record<string, unknown> & { intervals: unknown[] }>> {
  return Object.fromEntries(Object.entries(c.models).map(([m, rs]) => [m, rs.map(({ interval_refs, ...r }) => ({ ...r, intervals: interval_refs.map((i) => c.intervals[i]) }))]));
}

export interface ExportSummary {
  outDir: string;
  events: number;
  excludedEvents: string[];
  sources: number;
  entities: number;
}

export function exportPublic(store: ResearchStore, outDir = store.path('data/exports')): ExportSummary {
  const sources = store.sources();
  const entities = store.entities();
  const restricted = (lic: string | null) => !!lic && /restricted|all rights reserved|no redistribution/i.test(lic);

  const eventRecords = store.eventIds().map((id) => {
    const ev = store.event(id);
    const bundle = { event: ev, context: store.context(id), evidence: store.evidence(id), crossrefs: store.crossrefs(id), validation: store.validation(id) };
    const deps = new Set<string>();
    collectIds({ c: bundle.context, e: bundle.evidence, x: bundle.crossrefs }, deps);
    return { id, isFixture: ev.is_fixture, restricted: ev.publication_level === 'unpublished', dependsOn: [...deps], bundle };
  });
  const sourceRecords = sources.map((s) => ({ id: s.id, isFixture: s.is_fixture, restricted: restricted(s.license), dependsOn: s.reports_on_source_id ? [s.reports_on_source_id] : [], s }));
  const entityRecords = entities.map((e) => {
    const deps = new Set<string>();
    collectIds({ c: e.citations, x: e }, deps);
    deps.delete(e.id);
    return { id: e.id, isFixture: e.is_fixture, dependsOn: [...deps], e };
  });

  const kept = filterPublishable([...sourceRecords, ...entityRecords, ...eventRecords]);
  assertNoFixtures(kept);
  const keptIds = new Set(kept.map((r) => r.id));
  const events = eventRecords.filter((r) => keptIds.has(r.id));

  const coverage = CANON.map((b) => {
    const chapters = store.chapters(b.slug);
    const total = versesPerChapter(b.osis).reduce((a, n) => a + n, 0);
    const reviewed = chapters.flatMap((c) => c.verse_coverage).filter((v) => v.status !== 'not_reviewed').length;
    return {
      osis: b.osis,
      name: b.name,
      slug: b.slug,
      chapters: b.chapters,
      verses: total,
      verses_reviewed: reviewed,
      chapters_extracted: chapters.filter((c) => c.status === 'complete').length,
    };
  });

  mkdirSync(outDir, { recursive: true });
  const write = (name: string, data: unknown) => writeFileSync(join(outDir, name), JSON.stringify(data, null, 1) + '\n');
  write('events.json', events.map((r) => ({ ...r.bundle, dossier_markdown: renderDossier(store, r.id) })));
  write('sources.json', sourceRecords.filter((r) => keptIds.has(r.id)).map((r) => r.s));
  write('entities.json', entityRecords.filter((r) => keptIds.has(r.id)).map((r) => r.e));
  write('coverage.json', coverage);
  const chronology: Record<string, Array<{ intervals: unknown[] } & Record<string, unknown>>> = {};
  const resolve = derivationResolver(store);
  // Only published (kept) subjects are exported; derivation steps may still name the records they depend on.
  for (const [m, results] of solveAllModels(store)) {
    chronology[m ?? 'model_independent'] = serializeResults(results, resolve).map((r) => ({
      ...r,
      intervals: r.intervals.filter((i) => keptIds.has(i.subject)),
    }));
  }
  // Compact form (format 2): identical intervals recur across models and reckoning combinations, so they are stored once.
  writeFileSync(join(outDir, 'chronology.json'), JSON.stringify(compactChronology(chronology)) + '\n');
  // Rule 01 extraction files: verse coverage + candidates (labelled on the site as extraction-only).
  write('extraction.json', CANON.flatMap((b) => store.chapters(b.slug).map((c) => ({ ...c, slug: b.slug }))));
  // Public, read-only review summary. Decision rationale and reviewer notes are not exported.
  write('reviews.json', store.reviews().filter((r) => !r.is_fixture).map((r) => ({
    id: r.id, record_kind: r.record_kind, record_id: r.record_id, record_revision: r.record_revision, reason: r.reason,
    triggers: r.triggers, status: r.status, created_at: r.created_at,
    decisions: r.decisions.map((d) => ({ decision: d.decision, decided_at: d.decided_at, record_revision: d.record_revision })),
  })));
  write('manifest.json', {
    license: 'Original research records: CC BY 4.0. Third-party material retains its own rights (see sources.json).',
    events: events.length,
    note: 'Publication levels: preliminary < researched < human_reviewed. Programmatic validation is not historical verification.',
  });
  return {
    outDir,
    events: events.length,
    excludedEvents: eventRecords.filter((r) => !keptIds.has(r.id)).map((r) => r.id),
    sources: sourceRecords.filter((r) => keptIds.has(r.id)).length,
    entities: entityRecords.filter((r) => keptIds.has(r.id)).length,
  };
}

/**
 * Public static export (SPEC 3.3, 17.1). Only publishable, non-fixture, non-restricted records leave the repo;
 * anything depending on an excluded record is excluded too (filterPublishable).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CANON } from '@atlas/scripture';
import { assertNoFixtures, filterPublishable } from '@atlas/static-export';
import { serializeResults, solveAllModels } from './chronology.ts';
import { renderDossier } from './dossier.ts';
import { versesPerChapter } from './inventory.ts';
import type { ResearchStore } from './store.ts';

function collectIds(v: unknown, out: Set<string>) {
  if (typeof v === 'string' && /^(src|per|loc|kgd|rgn|chr|sit|art|doc)_[0-9A-Z]{26}$/.test(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => collectIds(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectIds(x, out));
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
  const chronology: Record<string, unknown> = {};
  for (const [m, results] of solveAllModels(store)) chronology[m ?? 'model_independent'] = serializeResults(results);
  write('chronology.json', chronology);
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

/**
 * Research CLI (SPEC Part 19). Deterministic infrastructure only: these commands prepare, validate, import,
 * checkpoint and export. They never perform research — Claude Code (or a human) does that, guided by rules/.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { join } from 'node:path';
import { formatInterval } from '@atlas/shared';
import { CANON, findBook } from '@atlas/scripture';
import {
  ResearchStore,
  advanceVerification,
  auditEvent,
  checkpointJob,
  createJob,
  decide,
  exportPublic,
  findReview,
  importResearch,
  modelIds,
  prepareChapter,
  registerSource,
  renderDossier,
  resumableJobs,
  serializeResults,
  solveAllModels,
  validateRepository,
  versesPerChapter,
  RESEARCH_STAGES,
  type NewSource,
} from '@atlas/research-engine';
import { VerificationLevel } from '@atlas/shared';

const store = new ResearchStore();
const [group, command, ...args] = process.argv.slice(2);
type Handler = (args: string[]) => number | Promise<number>;

const usage = (msg: string): number => {
  console.error(msg);
  return 1;
};

// ─── research ────────────────────────────────────────────────────────────────

const status: Handler = () => {
  const started = CANON.map((b) => ({ b, chapters: store.chapters(b.slug) })).filter((x) => x.chapters.length);
  const events = store.eventIds().map((id) => store.event(id));
  const reviews = store.reviews().filter((r) => r.status === 'open');
  console.log('Biblical History Atlas — research status\n');
  console.log(`Books with extraction work: ${started.length} / ${CANON.length}`);
  for (const { b, chapters } of started) {
    const total = versesPerChapter(b.osis).reduce((a, n) => a + n, 0);
    const reviewed = chapters.flatMap((c) => c.verse_coverage).filter((v) => v.status !== 'not_reviewed').length;
    const complete = chapters.filter((c) => c.status === 'complete').length;
    console.log(`  ${b.name.padEnd(16)} chapters extracted ${complete}/${b.chapters} · verses reviewed ${reviewed}/${total}`);
  }
  console.log(`\nEvents: ${events.length}`);
  for (const e of events) {
    const stages = RESEARCH_STAGES.map((s) => `${s.id}:${e.stages[s.key].status.replace('not_started', '·').replace('complete', '✓').replace('in_progress', '…').replace('not_applicable', 'n/a')}`).join(' ');
    console.log(`  ${e.id} ${e.title} — ${e.publication_level} [${stages}]`);
  }
  console.log(`\nSources: ${store.sources().length} · Entities: ${store.entities().length} · Open reviews: ${reviews.length} · Resumable jobs: ${resumableJobs(store).length}`);
  return 0;
};

const book: Handler = ([b]) => {
  if (!b) return usage('Usage: pnpm research:book <book>');
  const bk = findBook(b);
  if (!bk) return usage(`Unknown book ${b}`);
  const chapters = new Map(store.chapters(bk.slug).map((c) => [c.chapter, c]));
  createJob(store, { subject_kind: 'book', subject_id: bk.osis, book: bk.osis, stage: 'scripture_extraction', priority: 'medium', note: 'Book-level extraction tracking' });
  console.log(`${bk.name}: ${bk.chapters} chapters`);
  let next: number | null = null;
  for (let c = 1; c <= bk.chapters; c++) {
    const ch = chapters.get(c);
    console.log(`  ch ${String(c).padStart(3)}: ${ch ? ch.status : 'not started'}`);
    if (next === null && (!ch || ch.status !== 'complete')) next = c;
  }
  if (next === null) {
    console.log('\nAll chapters extracted. Next: research queued candidates (rules/02).');
    return 0;
  }
  const p = prepareChapter(store, bk.slug, next);
  console.log(`\nNext operation: ${p.nextOperation}`);
  return 0;
};

const chapter: Handler = ([b, c]) => {
  if (!b || !c) return usage('Usage: pnpm research:chapter <book> <chapter>');
  const p = prepareChapter(store, b, Number(c));
  console.log(`${p.created ? 'Created' : 'Loaded'} ${store.rel(p.file)} (${p.reviewed}/${p.verses} verses reviewed) · job ${p.jobId}`);
  console.log(`Next operation: ${p.nextOperation}`);
  return 0;
};

const STAGE_FILE: Record<string, string> = {
  scripture_extraction: 'event.json (candidate promoted from extraction)',
  historical_reconstruction: 'context.json',
  external_evidence: 'evidence.json',
  cross_referencing: 'crossrefs.json',
  publication_validation: 'validation.json (pnpm research:audit)',
};

const event: Handler = ([id]) => {
  if (!id) return usage('Usage: pnpm research:event <evt_id>');
  const ev = store.event(id);
  const pending = RESEARCH_STAGES.find((s) => !['complete', 'not_applicable'].includes(ev.stages[s.key].status));
  console.log(`${ev.id} — ${ev.title}\n  publication: ${ev.publication_level} · status: ${ev.research_status} · revision ${ev.revision}`);
  for (const s of RESEARCH_STAGES) console.log(`  ${s.id}. ${s.key.padEnd(26)} ${ev.stages[s.key].status}`);
  if (!pending) {
    console.log('\nAll stages complete. Run pnpm research:audit to refresh validation.');
    return 0;
  }
  const job = createJob(store, { subject_kind: 'event', subject_id: id, stage: pending.key, priority: ev.priority });
  checkpointJob(store, job.id, { stage: pending.key, files: [store.rel(store.eventDir(id))] });
  console.log(`\nNext operation (Claude Code): stage ${pending.id} per ${pending.rule}; write research/events/${id}/${STAGE_FILE[pending.key]}. Job ${job.id}.`);
  return 0;
};

const resume: Handler = () => {
  const jobs = resumableJobs(store);
  if (!jobs.length) {
    console.log('Nothing to resume. See docs/NEXT_ACTION.md for the next task.');
    return 0;
  }
  for (const j of jobs) console.log(`${j.id}  ${j.priority.padEnd(10)} ${j.stage.padEnd(26)} ${j.subject_kind} ${j.subject_id}${j.checkpoint.resume_from ? ` (resume from ${j.checkpoint.resume_from})` : ''}`);
  const top = jobs[0]!;
  const hint =
    top.subject_kind === 'chapter' && top.book && top.chapter
      ? prepareChapter(store, top.book, top.chapter).nextOperation
      : top.subject_kind === 'event'
        ? `pnpm research:event ${top.subject_id}`
        : top.checkpoint.note ?? '';
  console.log(`\nResume first: ${hint}`);
  return 0;
};

const validate: Handler = () => {
  const r = validateRepository(store);
  for (const i of r.issues) console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '}  ${i.file}: ${i.message}`);
  console.log(`\n${r.ok ? '✓ Research files valid' : '✗ Validation failed'} — ${JSON.stringify(r.counts)}`);
  console.log('(Programmatic validity is not historical verification.)');
  return r.ok ? 0 : 1;
};

/** Rule 04 name search: deterministic WEB text search across all 66 books. Results are leads, not relationships. */
const crossrefs: Handler = ([id, ...extra]) => {
  if (!id) return usage('Usage: pnpm research:crossrefs <evt_id> [extra names…]');
  const ctx = store.context(id);
  const entities = new Map(store.entities().map((e) => [e.id, e]));
  const names = new Set(extra);
  for (const r of ctx?.rulers ?? []) {
    const p = entities.get(r.person_id);
    if (p?.kind === 'person') [p.canonical_name, ...p.aliases.map((a) => a.alias)].forEach((n) => names.add(n));
  }
  for (const l of ctx?.locations ?? []) {
    const p = entities.get(l.location_id);
    if (p?.kind === 'place') [p.primary_name, ...p.ancient_names.map((a) => a.name)].forEach((n) => names.add(n));
  }
  if (!names.size) return usage('No names to search: add rulers/locations to context.json or pass names explicitly.');
  const out: Record<string, string[]> = {};
  for (const b of CANON) {
    const web = JSON.parse(readFileSync(store.path('data/seed/scripture/web', `${b.osis}.json`), 'utf8')) as { chapters: Record<string, Record<string, string>> };
    for (const [ch, vs] of Object.entries(web.chapters)) {
      for (const [v, text] of Object.entries(vs)) {
        for (const n of names) {
          if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) (out[n] ??= []).push(`${b.osis}.${ch}.${v}`);
        }
      }
    }
  }
  for (const n of names) console.log(`${n}: ${out[n]?.length ?? 0} verses (WEB numbering)\n  ${(out[n] ?? []).join(' ')}`);
  console.log(`\nSearched all ${CANON.length} books. Record searches in crossrefs.json name_searches; type relationships per rules/04.`);
  return 0;
};

const refresh: Handler = ([id]) => {
  if (!id) return usage('Usage: pnpm research:refresh <evt_id>');
  const ev = store.event(id);
  const job = createJob(store, { subject_kind: 'event', subject_id: id, stage: 'external_evidence', priority: ev.priority, note: 'Manual refresh: re-run evidence search for new findings' });
  console.log(`Refresh job ${job.id} queued for ${ev.title}. Next: re-run Rule 03 searches, update evidence.json, bump event revision, then pnpm research:audit ${id}.`);
  return 0;
};

const audit: Handler = ([id]) => {
  const ids = id ? [id] : store.eventIds();
  let failed = false;
  for (const e of ids) {
    const { result } = auditEvent(store, e, { write: true });
    writeFileSync(join(store.eventDir(e), 'dossier.md'), renderDossier(store, e));
    console.log(`${e}: ${result.publication_level}${result.open_reviews.length ? ` · ${result.open_reviews.length} open review(s)` : ''}`);
    for (const c of result.checks.filter((c) => !c.passed)) console.log(`  ✗ ${c.name}: ${c.details.slice(0, 5).join('; ')}`);
    if (result.publication_level === 'unpublished') failed = true;
  }
  return failed ? 1 : 0;
};

const exp: Handler = () => {
  const v = validateRepository(store);
  if (!v.ok) {
    console.error('Refusing to export: pnpm research:validate has errors.');
    return 1;
  }
  for (const id of store.eventIds()) writeFileSync(join(store.eventDir(id), 'dossier.md'), renderDossier(store, id));
  const s = exportPublic(store);
  console.log(`Exported ${s.events} event(s), ${s.sources} source(s), ${s.entities} entit(ies) to ${store.rel(s.outDir)}`);
  if (s.excludedEvents.length) console.log(`Excluded (unpublished/fixture/dependent): ${s.excludedEvents.join(', ')}`);
  return 0;
};

const importCmd: Handler = async () => {
  const v = validateRepository(store);
  if (!v.ok) {
    console.error('Refusing to import: pnpm research:validate has errors.');
    return 1;
  }
  const n = await importResearch(store, { dryRun: args.includes('--dry-run') });
  console.log('Imported:', n);
  return 0;
};

const source: Handler = ([sub, ...rest]) => {
  if (sub === 'add') {
    const file = rest[0];
    if (!file || !existsSync(file)) return usage('Usage: pnpm research:source add <draft.json>  (fields per SourceFile + verification_method)');
    const draft = JSON.parse(readFileSync(file, 'utf8')) as NewSource;
    const { source: s, duplicate } = registerSource(store, draft);
    console.log(`${duplicate ? 'Duplicate of existing' : 'Registered'} ${s.id} — ${s.title} [${s.verification_level}]`);
    return 0;
  }
  if (sub === 'verify') {
    const [id, level, ...method] = rest;
    const parsed = VerificationLevel.safeParse(level);
    if (!id || !parsed.success || !method.length) return usage('Usage: pnpm research:source verify <src_id> <level> "<how it was verified>"');
    const s = advanceVerification(store, id, parsed.data, method.join(' '));
    console.log(`${s.id} → ${s.verification_level}`);
    return 0;
  }
  if (sub === 'list') {
    for (const s of store.sources()) console.log(`${s.id}  ${s.verification_level.padEnd(17)} ${s.source_type.padEnd(22)} ${s.title}`);
    return 0;
  }
  return usage('Usage: pnpm research:source <add|verify|list> …');
};

// ─── chronology ──────────────────────────────────────────────────────────────

const label = (m: string | null) => m ?? '(model-independent)';
const chronoValidate: Handler = () => {
  let fatal = false;
  for (const [m, results] of solveAllModels(store)) {
    for (const r of results) {
      const choice = Object.keys(r.choice).length ? ` ${JSON.stringify(r.choice)}` : '';
      console.log(`${label(m)}${choice}: ${r.feasible ? 'feasible' : 'INFEASIBLE'} · ${r.intervals.size} dated items · ${r.excluded.length} excluded (other models)`);
      for (const c of r.contradictions) {
        console.log(`  ✗ ${c.message}`);
        if (!choice) fatal = true;
      }
    }
  }
  return fatal ? 1 : 0;
};

const recalculate: Handler = () => {
  const out: Record<string, unknown> = {};
  for (const [m, results] of solveAllModels(store)) {
    out[m ?? 'model_independent'] = serializeResults(results);
    for (const r of results) {
      for (const i of r.intervals.values()) {
        if (i.subject.startsWith('evt_')) console.log(`${label(m)} ${i.subject}: ${formatInterval(i.years)} (${i.precision}) via ${i.start.latest.derivation.join(' → ') || '—'}`);
      }
    }
  }
  mkdirSync(store.path('research/chronology'), { recursive: true });
  writeFileSync(store.path('research/chronology/computed.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('Wrote research/chronology/computed.json');
  return 0;
};

const anchors: Handler = () => {
  const entities = store.entities();
  console.log('Reign anchors:');
  for (const e of entities) if (e.kind === 'reign') console.log(`  ${e.id} start ${formatInterval(e.start)} end ${formatInterval(e.end)} model ${label(e.model_id)} (${e.citations.length} citation(s))`);
  console.log('Event date hypotheses:');
  for (const id of store.eventIds()) for (const h of store.context(id)?.date_hypotheses ?? []) console.log(`  ${id} ${formatInterval(h.interval)} ${h.precision} model ${label(h.model_id)}`);
  console.log('Synchronisms:');
  for (const id of store.eventIds()) for (const s of store.context(id)?.synchronisms ?? []) console.log(`  ${s.id} ${s.type} direct=${s.direct}${s.via ? ` via ${s.via}` : ''}`);
  return 0;
};

const models: Handler = () => {
  for (const m of modelIds(store)) {
    const e = store.entities().find((x) => x.id === m);
    console.log(m === null ? '(model-independent constraints and anchors)' : `${m}  ${e && 'name' in e ? e.name : ''}`);
  }
  return 0;
};

// ─── review ──────────────────────────────────────────────────────────────────

const reviewList: Handler = () => {
  const open = store.reviews().filter((r) => r.status !== 'decided');
  if (!open.length) console.log('Review queue is empty.');
  for (const r of open) console.log(`${r.id}  ${r.status.padEnd(8)} ${r.record_kind} ${r.record_id} rev ${r.record_revision} — ${r.reason}`);
  return 0;
};

const reviewShow: Handler = ([id]) => {
  if (!id) return usage('Usage: pnpm review:show <rev_id|record_id>');
  const r = findReview(store, id);
  console.log(JSON.stringify(r, null, 2));
  if (r.record_kind === 'event') console.log('\n' + renderDossier(store, r.record_id));
  if (r.record_kind === 'claim') {
    for (const e of store.eventIds()) {
      const c = store.evidence(e)?.claims.find((x) => x.id === r.record_id);
      if (c) console.log(`\nClaim in ${e}:\n${JSON.stringify(c, null, 2)}`);
    }
  }
  return 0;
};

/** Owner decisions require an interactive terminal + typed confirmation, so approval can never be automated. */
const decision = (d: 'approve' | 'reject' | 'return'): Handler => async ([id, ...why]) => {
  if (!id) return usage(`Usage: pnpm review:${d} <rev_id> [rationale]`);
  if (d !== 'return') {
    if (!process.stdin.isTTY) return usage(`review:${d} must be run by the project owner in an interactive terminal.`);
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Type ${d.toUpperCase()} to record your decision on ${id}: `);
    rl.close();
    if (answer.trim() !== d.toUpperCase()) return usage('Cancelled.');
  }
  const r = decide(store, id, d, process.env.REVIEWER_ID ?? 'owner', why.join(' ') || null);
  console.log(`${r.id}: ${d} recorded (${r.status}).`);
  return 0;
};

const commands: Record<string, Record<string, Handler>> = {
  research: { status, book, chapter, event, resume, validate, crossrefs, refresh, export: exp, audit, import: importCmd, source },
  chronology: { validate: chronoValidate, recalculate, anchors, models },
  review: { list: reviewList, show: reviewShow, approve: decision('approve'), reject: decision('reject'), return: decision('return') },
};

const handler = group && command ? commands[group]?.[command] : undefined;
if (!handler) {
  console.error('Usage: pnpm <research|chronology|review>:<command> [args]');
  process.exit(1);
}
try {
  process.exit(await handler(args));
} catch (e) {
  console.error(`Error: ${(e as Error).message}`);
  process.exit(1);
}

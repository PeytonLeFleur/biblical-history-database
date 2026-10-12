/**
 * Repository-wide research validation (rules/05 §2). Programmatic validity only — never historical verification.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { VERIFICATION_LEVELS } from '@atlas/shared';
import { CANON, parsePassageRef } from '@atlas/scripture';
import { solve } from '@atlas/chronology-engine';
import { buildSolveInput, modelIds } from './chronology.ts';
import { chapterVerseRefs, verseExists } from './inventory.ts';
import { detectDuplicateEvents } from './matching.ts';
import { ChapterExtraction, SourceFile as SourceFileSchema, type ClaimRecord, type EvidenceDossier, type SourceFile } from './schemas.ts';
import type { ResearchStore } from './store.ts';

export interface Issue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  issues: Issue[];
  counts: { chapters: number; events: number; sources: number; entities: number; jobs: number; reviews: number };
}

const MAX_QUOTE_WORDS = 25;

export function passageResolves(ref: string): boolean {
  try {
    const p = parsePassageRef(ref);
    return verseExists(`${p.start.book}.${p.start.chapter}.${p.start.verse}`) && verseExists(`${p.end.book}.${p.end.chapter}.${p.end.verse}`);
  } catch {
    return false;
  }
}

/** Find quoted runs longer than the copyright cap (standards/copyright.md). */
export function longQuotes(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/[“"]([^”"]+)[”"]/g)) {
    const words = m[1]!.trim().split(/\s+/).length;
    if (words > MAX_QUOTE_WORDS) out.push(m[1]!.slice(0, 60));
  }
  return out;
}

function walkStrings(v: unknown, fn: (s: string) => void) {
  if (typeof v === 'string') fn(v);
  else if (Array.isArray(v)) v.forEach((x) => walkStrings(x, fn));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walkStrings(x, fn));
}

const rank = (s: SourceFile | undefined) => (s ? VERIFICATION_LEVELS.indexOf(s.verification_level) : -1);

export function checkClaim(c: ClaimRecord, ev: EvidenceDossier, sources: Map<string, SourceFile>, hasApproval: (id: string) => boolean): string[] {
  const errs: string[] = [];
  const byId = new Map(ev.evidence.map((e) => [e.id, e]));
  for (const id of [...c.supporting_evidence, ...c.counterevidence, ...c.contextual_evidence]) {
    if (!byId.has(id)) errs.push(`${c.id} references missing evidence ${id}`);
  }
  const supporting = c.supporting_evidence.map((id) => byId.get(id)).filter((e) => e !== undefined);
  const counter = c.counterevidence.map((id) => byId.get(id)).filter((e) => e !== undefined);
  switch (c.classification) {
    case 'independently_corroborated':
      if (!supporting.some((e) => e.strength === 'direct' && rank(sources.get(e.source_id)) >= VERIFICATION_LEVELS.indexOf('claim_checked'))) {
        errs.push(`${c.id}: independently_corroborated needs direct supporting evidence from a claim_checked source`);
      }
      break;
    case 'strongly_supported':
      if (new Set(supporting.map((e) => e.independent_line)).size < 2) errs.push(`${c.id}: strongly_supported needs ≥2 independent lines of supporting evidence`);
      break;
    case 'contradicted_by_available_evidence':
      if (counter.length === 0) errs.push(`${c.id}: contradicted classification needs counterevidence`);
      break;
    case 'disputed':
      if (!c.review_required) errs.push(`${c.id}: disputed claims must be flagged review_required (SPEC 9.3)`);
      break;
    default:
      break;
  }
  if (c.classification === 'contradicted_by_available_evidence' && !c.review_required) errs.push(`${c.id}: contradicted claims must be review_required`);
  if ((c.reviewer_status === 'human_approved' || c.reviewer_status === 'human_rejected') && !hasApproval(c.id)) {
    errs.push(`${c.id}: reviewer_status ${c.reviewer_status} without a recorded owner decision`);
  }
  return errs;
}

/** `allowFixtures` is for test stores only; repository research must never contain fixtures (SPEC 17.1). */
export function validateRepository(store: ResearchStore, opts: { allowFixtures?: boolean } = {}): ValidationReport {
  const issues: Issue[] = [];
  const err = (file: string, message: string) => issues.push({ severity: 'error', file, message });
  const warn = (file: string, message: string) => issues.push({ severity: 'warning', file, message });
  const attempt = <T>(file: string, fn: () => T): T | null => {
    try {
      return fn();
    } catch (e) {
      err(file, (e as Error).message);
      return null;
    }
  };

  // Sources & entities first (other checks resolve against them).
  const sources = new Map<string, SourceFile>();
  for (const f of store.listJson('research/sources')) {
    const s = attempt(store.rel(f), () => store.read(SourceFileSchema, f));
    if (s) sources.set(s.id, s);
  }
  const entityIds = new Set<string>();
  const entities = attempt('research/entities', () => store.entities()) ?? [];
  for (const e of entities) entityIds.add(e.id);
  for (const e of entities) {
    const file = `research/entities/${e.id}.json`;
    for (const c of e.citations) if (!sources.has(c)) err(file, `citation ${c} is not a registered source`);
    if (e.kind === 'reign') {
      if (!entityIds.has(e.person_id)) err(file, `person ${e.person_id} not found`);
      if (!entityIds.has(e.kingdom_id)) err(file, `kingdom ${e.kingdom_id} not found`);
      if (e.model_id && !entityIds.has(e.model_id)) err(file, `model ${e.model_id} not found`);
    }
    if (e.kind === 'place') for (const h of e.hypotheses) if (h.geom_source_id && !sources.has(h.geom_source_id)) err(file, `geom source ${h.geom_source_id} missing`);
    const needEntity = (id: string | null, what: string) => id && !entityIds.has(id) && err(file, `${what} ${id} not found`);
    const needSource = (id: string | null, what: string) => id && !sources.has(id) && err(file, `${what} ${id} is not a registered source`);
    const needPassage = (ref: string | null, what: string) => ref && !passageResolves(ref) && err(file, `${what} ${ref} does not resolve`);
    if (e.kind === 'synchronism') {
      needSource(e.external_source_id, 'external source');
      needEntity(e.external_document_id, 'document');
      needPassage(e.passage, 'passage');
      for (const ci of e.competing_interpretations) for (const c of ci.citations) needSource(c, 'citation');
      const d = e.independent_date;
      if (d.earliest !== null && d.latest !== null && d.earliest > d.latest) err(file, 'independent_date earliest > latest');
    }
    if (e.kind === 'artifact') needEntity(e.findspot_site_id, 'findspot site');
    if (e.kind === 'document') {
      needEntity(e.artifact_id, 'artifact');
      for (const s of e.editions) needSource(s, 'edition');
    }
    if (e.kind === 'vision') {
      needEntity(e.recipient_id, 'recipient');
      needPassage(e.passage, 'passage');
      for (const sy of e.symbols) needPassage(sy.passage, 'symbol passage');
    }
    if (e.kind === 'prophecy') {
      needPassage(e.passage, 'passage');
      needEntity(e.vision_id, 'vision');
      for (const i of e.interpretations) for (const c of i.citations) needSource(c, `interpretation ${i.id} citation`);
    }
  }
  // Second pass: references to events (need event ids) and review requirements.
  const allEventIds = new Set(store.eventIds());
  const reviewRecords = new Set(store.reviews().map((r) => r.record_id));
  for (const e of entities) {
    const file = `research/entities/${e.id}.json`;
    if (e.kind === 'synchronism') {
      for (const id of [e.biblical_subject, e.anchor_subject]) if (id && !allEventIds.has(id) && !entityIds.has(id)) err(file, `subject ${id} not found`);
    }
    if (e.kind === 'vision' && e.experience_event_id && !allEventIds.has(e.experience_event_id)) err(file, `experience event ${e.experience_event_id} not found`);
    if (e.kind === 'prophecy') {
      for (const i of e.interpretations) {
        for (const ev of i.linked_events) if (!allEventIds.has(ev)) err(file, `interpretation ${i.id} links unknown event ${ev}`);
        // SPEC 9.3 #5: every proposed fulfillment identification goes to the owner review queue.
        if (i.is_proposed_fulfillment && !reviewRecords.has(i.id)) err(file, `proposed fulfillment ${i.id} has no review item`);
        if ((i.reviewer_status === 'human_approved' || i.reviewer_status === 'human_rejected') && !store.reviews().some((r) => r.record_id === i.id && r.decisions.length)) {
          err(file, `interpretation ${i.id} marked ${i.reviewer_status} without an owner decision`);
        }
      }
    }
  }

  for (const s of sources.values()) {
    const file = `research/sources/${s.id}.json`;
    if (s.source_type === 'news_report' && !s.reports_on_source_id) warn(file, 'news report not yet traced to an original finding (reports_on_source_id)');
    if (s.reports_on_source_id && !sources.has(s.reports_on_source_id)) err(file, `reports_on_source_id ${s.reports_on_source_id} not registered`);
    const last = s.verification_log.at(-1);
    if (last?.level !== s.verification_level) err(file, 'verification_level does not match the last verification_log entry');
  }

  // Chapters
  let chapters = 0;
  const booksDir = store.path('research/books');
  const candidateIds = new Set<string>();
  if (existsSync(booksDir)) {
    for (const slug of readdirSync(booksDir).filter((d) => !d.startsWith('.'))) {
      const book = CANON.find((b) => b.slug === slug);
      if (!book) {
        err(`research/books/${slug}`, 'not a canonical book slug');
        continue;
      }
      for (const f of store.listJson(join('research/books', slug, 'extraction'))) {
        chapters++;
        const file = store.rel(f);
        const ch = attempt(file, () => store.read(ChapterExtraction, f));
        if (!ch) continue;
        if (ch.book !== book.osis) err(file, `book ${ch.book} does not match folder ${slug}`);
        const expected = chapterVerseRefs(book.osis, ch.chapter);
        const got = ch.verse_coverage.map((v) => v.ref);
        const missing = expected.filter((r) => !got.includes(r));
        const extra = got.filter((r) => !expected.includes(r));
        if (missing.length) err(file, `missing verses: ${missing.join(', ')}`);
        if (extra.length) err(file, `non-canonical verses: ${extra.join(', ')}`);
        if (new Set(got).size !== got.length) err(file, 'duplicate verse rows');
        const ids = new Set(ch.candidates.map((c) => c.id));
        ch.candidates.forEach((c) => candidateIds.add(c.id));
        for (const v of ch.verse_coverage) {
          if (ch.status === 'complete' && v.status === 'not_reviewed') err(file, `${v.ref} not_reviewed in a complete chapter`);
          if (v.status === 'reviewed_with_candidate' && v.candidate_ids.length === 0) err(file, `${v.ref} reviewed_with_candidate but no candidate_ids`);
          for (const c of v.candidate_ids) if (!ids.has(c)) err(file, `${v.ref} references unknown candidate ${c}`);
          if ((v.status === 'needs_recheck' || v.status === 'blocked') && !v.notes) err(file, `${v.ref} ${v.status} requires notes`);
        }
        for (const c of ch.candidates) {
          if (!passageResolves(c.passage)) err(file, `${c.id} passage ${c.passage} does not resolve`);
          for (const r of c.related_passages) if (!passageResolves(r)) err(file, `${c.id} related passage ${r} does not resolve`);
          if (c.parent_candidate_id && !ids.has(c.parent_candidate_id)) warn(file, `${c.id} parent ${c.parent_candidate_id} is in another chapter or missing`);
        }
        if (ch.status === 'in_progress' && !ch.resume_from) warn(file, 'in_progress without resume_from');
      }
    }
  }

  // Events
  const eventIds = store.eventIds();
  const events = [];
  const approvals = new Set(store.reviews().filter((r) => r.decisions.some((d) => d.decision !== 'return')).map((r) => r.record_id));
  const openReviewRecords = new Set(store.reviews().filter((r) => r.status === 'open').map((r) => r.record_id));
  for (const id of eventIds) {
    const base = `research/events/${id}`;
    const ev = attempt(`${base}/event.json`, () => store.event(id));
    if (!ev) continue;
    events.push(ev);
    if (ev.is_fixture && !opts.allowFixtures) err(`${base}/event.json`, 'fixture record outside test directories');
    for (const m of ev.mentions) if (!passageResolves(m.passage)) err(`${base}/event.json`, `mention ${m.passage} does not resolve`);
    if (ev.parent_event_id && !eventIds.includes(ev.parent_event_id)) err(`${base}/event.json`, `parent ${ev.parent_event_id} not found`);
    for (const c of ev.candidate_ids) if (candidateIds.size && !candidateIds.has(c)) warn(`${base}/event.json`, `candidate ${c} not found in extraction files`);
    for (const [k, st] of Object.entries(ev.stages)) {
      if ((st.status === 'not_applicable' || st.status === 'blocked') && !st.reason) err(`${base}/event.json`, `stage ${k} is ${st.status} without a reason`);
    }
    const known = (x: string) => eventIds.includes(x) || entityIds.has(x);
    const ctx = attempt(`${base}/context.json`, () => store.context(id));
    if (ctx) {
      walkStrings(ctx, (s) => longQuotes(s).forEach((q) => err(`${base}/context.json`, `quotation over ${MAX_QUOTE_WORDS} words: "${q}…"`)));
      const cites: string[] = [];
      for (const x of [ctx.setting, ...ctx.rulers, ...ctx.constraints, ...ctx.synchronisms, ...ctx.date_hypotheses, ...ctx.terminology, ...ctx.competing_reconstructions]) cites.push(...x.citations);
      for (const c of ctx.commentary) cites.push(c.source_id);
      for (const c of cites) if (!sources.has(c)) err(`${base}/context.json`, `citation ${c} is not a registered source`);
      for (const c of ctx.constraints) {
        if (c.passage && !passageResolves(c.passage)) err(`${base}/context.json`, `${c.id} passage ${c.passage} does not resolve`);
        if (!known(c.subject)) err(`${base}/context.json`, `${c.id} subject ${c.subject} not found`);
        if (!known(c.object)) err(`${base}/context.json`, `${c.id} object ${c.object} not found`);
        if (c.model_id && !entityIds.has(c.model_id)) err(`${base}/context.json`, `${c.id} model ${c.model_id} not found`);
      }
      for (const r of ctx.rulers) if (!entityIds.has(r.person_id)) err(`${base}/context.json`, `ruler ${r.person_id} not found`);
      for (const l of ctx.locations) if (!entityIds.has(l.location_id)) err(`${base}/context.json`, `location ${l.location_id} not found`);
      for (const h of ctx.date_hypotheses) if (h.model_id && !entityIds.has(h.model_id)) err(`${base}/context.json`, `${h.id} model ${h.model_id} not found`);
    }
    const evd = attempt(`${base}/evidence.json`, () => store.evidence(id));
    if (evd) {
      walkStrings(evd, (s) => longQuotes(s).forEach((q) => err(`${base}/evidence.json`, `quotation over ${MAX_QUOTE_WORDS} words: "${q}…"`)));
      for (const e of evd.evidence) {
        if (!sources.has(e.source_id)) err(`${base}/evidence.json`, `${e.id} source ${e.source_id} not registered`);
        for (const c of e.criticism) if (!sources.has(c.source_id)) err(`${base}/evidence.json`, `${e.id} criticism source ${c.source_id} not registered`);
        for (const c of e.claim_ids) if (!evd.claims.some((x) => x.id === c)) err(`${base}/evidence.json`, `${e.id} references unknown claim ${c}`);
      }
      for (const c of evd.claims) {
        for (const m of checkClaim(c, evd, sources, (cid) => approvals.has(cid))) err(`${base}/evidence.json`, m);
        if (c.passage && !passageResolves(c.passage)) err(`${base}/evidence.json`, `${c.id} passage does not resolve`);
        if (c.review_required && !openReviewRecords.has(c.id) && !approvals.has(c.id)) err(`${base}/evidence.json`, `${c.id} is review_required but no review item is queued`);
        const sup = c.supporting_evidence.map((x) => evd.evidence.find((e) => e.id === x)).filter((e) => e !== undefined);
        if (sup.length > 1 && new Set(sup.map((e) => e.independent_line)).size === 1) warn(`${base}/evidence.json`, `${c.id}: ${sup.length} supporting items share one independent line`);
      }
      if (evd.status === 'complete' && evd.search_log.length === 0) err(`${base}/evidence.json`, 'complete evidence dossier has an empty search_log');
    }
    const xr = attempt(`${base}/crossrefs.json`, () => store.crossrefs(id));
    if (xr) {
      const pairs = new Map<string, Set<string>>();
      for (const r of xr.relationships) {
        for (const end of [r.from, r.to]) {
          if (end.kind === 'passage' && !passageResolves(end.ref)) err(`${base}/crossrefs.json`, `${r.id} passage ${end.ref} does not resolve`);
          if (end.kind !== 'passage' && !known(end.id)) err(`${base}/crossrefs.json`, `${r.id} endpoint ${end.id} not found`);
        }
        for (const c of r.provenance.citations) if (!sources.has(c)) err(`${base}/crossrefs.json`, `${r.id} citation ${c} not registered`);
        const key = [JSON.stringify(r.from), JSON.stringify(r.to)].sort().join('|');
        const set = pairs.get(key) ?? new Set();
        set.add(r.type);
        pairs.set(key, set);
      }
      for (const [k, types] of pairs) if (types.has('same_event') && types.has('thematic_parallel')) err(`${base}/crossrefs.json`, `same_event and thematic_parallel on one pair: ${k}`);
    }
    attempt(`${base}/validation.json`, () => store.validation(id));
  }
  for (const d of detectDuplicateEvents(events)) warn('research/events', `possible duplicate events ${d.a} / ${d.b}: ${d.reason}`);

  // Chronology
  for (const m of modelIds(store)) {
    for (const r of solve(buildSolveInput(store, m))) {
      for (const c of r.contradictions) {
        const label = `model ${m ?? '(model-independent)'}${Object.keys(r.choice).length ? ` choice ${JSON.stringify(r.choice)}` : ''}`;
        // An infeasible alternative is expected when others remain feasible; it is reported, not fatal.
        (Object.keys(r.choice).length ? warn : err)('chronology', `${label}: ${c.message}`);
      }
    }
  }

  // Jobs & reviews (schema)
  const jobs = attempt('research/queues', () => store.jobs()) ?? [];
  const reviews = attempt('research/reviews', () => store.reviews()) ?? [];
  for (const x of [...jobs, ...reviews, ...sources.values(), ...entities]) {
    if (x.is_fixture && !opts.allowFixtures) err('research', `fixture record ${'id' in x ? x.id : ''} outside test directories`);
  }

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    issues,
    counts: { chapters, events: eventIds.length, sources: sources.size, entities: entities.length, jobs: jobs.length, reviews: reviews.length },
  };
}

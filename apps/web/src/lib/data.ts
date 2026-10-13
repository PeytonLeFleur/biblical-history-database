/**
 * Build-time data layer. Everything on the site comes from the validated research export (`pnpm research:export`)
 * plus the public-domain WEB text. Nothing here invents content; missing data yields empty states.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  ChapterExtraction,
  ContextDossier,
  CrossrefDossier,
  Entity,
  EventRecord,
  EvidenceDossier,
  SourceFile,
  ValidationResult,
  DerivationStep,
} from '@atlas/research-engine';
import { CANON, bookByOsis, displayPassage, parsePassageRef, type CanonBook } from '@atlas/scripture';

function findRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, 'data', 'exports', 'manifest.json'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('data/exports not found — run `pnpm research:export` before building the site.');
}

export const ROOT = findRepoRoot();
const readJson = <T>(...p: string[]): T => JSON.parse(readFileSync(join(ROOT, ...p), 'utf8')) as T;

// ─── Export shapes ───────────────────────────────────────────────────────────

export interface EventBundle {
  event: EventRecord;
  context: ContextDossier | null;
  evidence: EvidenceDossier | null;
  crossrefs: CrossrefDossier | null;
  validation: ValidationResult | null;
}

export interface YearRange {
  earliest: number | null;
  latest: number | null;
}

export interface IntervalExport {
  subject: string;
  years: YearRange;
  start_fraction?: { earliest: number | null; latest: number | null };
  start: YearRange;
  end: YearRange;
  precision: string;
  derivation: { earliest: DerivationStep[]; latest: DerivationStep[]; end_earliest: DerivationStep[]; end_latest: DerivationStep[] };
}

export interface SolveExport {
  model_id: string | null;
  choice: Record<string, string>;
  feasible: boolean;
  contradictions: Array<{ cycle: string[]; message: string; steps: DerivationStep[] }>;
  excluded: string[];
  intervals: IntervalExport[];
}

/** chronology.json is written in a compact form (format 2): intervals are de-duplicated across models and reckoning combinations. */
export interface CompactChronology {
  format: 2;
  models: Record<string, Array<Omit<SolveExport, 'intervals'> & { interval_refs: number[] }>>;
  intervals: IntervalExport[];
}

/** Expand the compact export to one array of results per model; identical intervals stay shared objects. */
export function expandChronology(c: CompactChronology): Record<string, SolveExport[]> {
  if (c.format !== 2) throw new Error('Unsupported chronology export format; re-run pnpm research:export.');
  return Object.fromEntries(Object.entries(c.models).map(([m, rs]) => [m, rs.map(({ interval_refs, ...r }) => ({ ...r, intervals: interval_refs.map((i) => c.intervals[i]!) }))]));
}

export interface CoverageRow {
  osis: string;
  name: string;
  slug: string;
  chapters: number;
  verses: number;
  verses_reviewed: number;
  chapters_extracted: number;
}

export interface ReviewSummary {
  id: string;
  record_kind: string;
  record_id: string;
  record_revision: number;
  reason: string;
  triggers: string[];
  status: 'open' | 'decided' | 'returned';
  created_at: string;
  decisions: Array<{ decision: string; decided_at: string; record_revision: number }>;
}

export type ExtractionExport = ChapterExtraction & { slug: string };

let cache: ReturnType<typeof load> | null = null;

function load() {
  const events = readJson<EventBundle[]>('data/exports/events.json');
  const sources = readJson<SourceFile[]>('data/exports/sources.json');
  const entities = readJson<Entity[]>('data/exports/entities.json');
  const coverage = readJson<CoverageRow[]>('data/exports/coverage.json');
  const chronology = expandChronology(readJson<CompactChronology>('data/exports/chronology.json'));
  const extraction = readJson<ExtractionExport[]>('data/exports/extraction.json');
  const reviews = readJson<ReviewSummary[]>('data/exports/reviews.json');
  return { events, sources, entities, coverage, chronology, extraction, reviews };
}

export function data() {
  cache ??= load();
  return cache;
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export const sourceById = (id: string) => data().sources.find((s) => s.id === id);
export const entityById = (id: string) => data().entities.find((e) => e.id === id);
export const eventById = (id: string) => data().events.find((e) => e.event.id === id);
export const eventBySlug = (slug: string) => data().events.find((e) => e.event.slug === slug);
export const entitiesOf = <K extends Entity['kind']>(kind: K) => data().entities.filter((e): e is Extract<Entity, { kind: K }> => e.kind === kind);

export function nameOf(id: string): string {
  if (id.startsWith('evt_')) return eventById(id)?.event.title ?? 'unpublished research record';
  const e = entityById(id);
  if (!e) return id;
  switch (e.kind) {
    case 'person': return e.canonical_name;
    case 'place': return e.primary_name;
    case 'reign': {
      const m = e.model_id ? entityById(e.model_id) : undefined;
      return `${nameOf(e.person_id)} (reign${m && 'name' in m ? `, ${m.name}` : ''})`;
    }
    default:
      if ('name' in e) return e.name;
      if ('title' in e) return e.title;
      return id;
  }
}

/** Kingdom/lane labels from SPEC 14.1 that have no researched kingdom record yet. */
export function unresearchedLabels(labels: string[]): string[] {
  const names = entitiesOf('kingdom').map((k) => k.name.toLowerCase());
  return labels.filter((l) => !names.some((n) => n.includes(l.toLowerCase().split(' ')[0]!)));
}

export const APPROACH_LABEL: Record<string, string> = {
  preterist: 'Preterist', futurist: 'Futurist', historicist: 'Historicist', idealist: 'Idealist', mixed: 'Mixed',
};

export function modelName(id: string | null, context: 'select' | 'result' = 'select'): string {
  if (id === null || id === 'model_independent') return context === 'result' ? 'Model-independent (applies under every chronology model)' : 'No chronology model (model-independent)';
  const m = entityById(id);
  return m && m.kind === 'chronology_model' ? m.name : id;
}

export function modelIds(): string[] {
  return Object.keys(data().chronology);
}

/** Computed intervals for a subject, one per model (first feasible solution of each model). */
export function intervalsFor(subject: string): Array<{ model: string; result: SolveExport; interval: IntervalExport }> {
  const out: Array<{ model: string; result: SolveExport; interval: IntervalExport }> = [];
  for (const [model, results] of Object.entries(data().chronology)) {
    for (const r of results) {
      const iv = r.intervals.find((i) => i.subject === subject);
      if (iv) out.push({ model, result: r, interval: iv });
    }
  }
  return out;
}

export const isDated = (i: IntervalExport) => i.years.earliest !== null || i.years.latest !== null;

/**
 * Per-model summary for a subject. When a model has alternative reckonings (SPEC 12.3), every combination is kept:
 * the union window spans the feasible ones, and infeasible combinations are listed with their contradiction.
 */
export function modelSummaries(subject: string, ownGroups: string[] = []) {
  type Alt = { choice: Record<string, string>; feasible: boolean; interval: IntervalExport | null; contradictions: string[] };
  const out: Array<{ model: string; union: YearRange; feasible: number; alternatives: Alt[]; representative: IntervalExport; precision: string }> = [];
  const key = (i: IntervalExport | null) => (i ? JSON.stringify([i.start.earliest, i.start.latest]) : 'none');
  for (const [model, results] of Object.entries(data().chronology)) {
    const alts: Alt[] = results.map((r) => ({ choice: r.choice, feasible: r.feasible, interval: r.intervals.find((i) => i.subject === subject) ?? null, contradictions: r.contradictions.map((c) => c.message) }));
    const dated = alts.filter((a) => a.feasible && a.interval && isDated(a.interval));
    if (dated.length === 0) continue;
    // Only alternative groups that change this subject's window are relevant to it (alternatives are global to a solve).
    const groups = [...new Set(alts.flatMap((a) => Object.keys(a.choice)))];
    const relevant = groups.filter((g) => {
      const byOption = new Map<string, Set<string>>();
      for (const a of dated) byOption.set(a.choice[g]!, (byOption.get(a.choice[g]!) ?? new Set()).add(key(a.interval)));
      const windows = [...byOption.values()].map((ws) => [...ws].sort().join('|'));
      return new Set(windows).size > 1 || ownGroups.includes(g);
    });
    const rows = new Map<string, Alt>();
    for (const a of alts) {
      const choice = Object.fromEntries(relevant.map((g) => [g, a.choice[g]!]));
      const k = JSON.stringify(choice);
      const prev = rows.get(k);
      if (!prev) rows.set(k, { ...a, choice });
      else if (!prev.feasible && a.feasible) rows.set(k, { ...a, choice });
      else if (prev.feasible && a.feasible && prev.interval && a.interval && isDated(a.interval)) {
        rows.set(k, { ...prev, interval: { ...prev.interval, years: unionRange(prev.interval.years, a.interval.years) } });
      }
    }
    out.push({
      model, feasible: [...rows.values()].filter((r) => r.feasible).length,
      union: dated.map((a) => a.interval!.years).reduce(unionRange),
      alternatives: relevant.length ? [...rows.values()] : [],
      representative: dated[0]!.interval!, precision: dated[0]!.interval!.precision,
    });
  }
  // A model that adds nothing for this subject (same result as model-independent) is folded into it.
  const indep = out.find((o) => o.model === 'model_independent');
  if (!indep) return out;
  const sig = (o: (typeof out)[number]) => JSON.stringify([o.union, o.feasible, o.alternatives.length]);
  return out.filter((o) => o.model === 'model_independent' || sig(o) !== sig(indep));
}

/** Union of two ranges; an open (null) bound on either side stays open. */
export function unionRange(a: YearRange, b: YearRange): YearRange {
  return {
    earliest: a.earliest === null || b.earliest === null ? null : Math.min(a.earliest, b.earliest),
    latest: a.latest === null || b.latest === null ? null : Math.max(a.latest, b.latest),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Month-level label for a fractional astronomical year (proleptic Julian; approximate to the month). */
export function monthLabel(t: number | null): string {
  if (t === null) return '?';
  const y = Math.floor(t);
  const leap = y % 4 === 0;
  const doy = (t - y) * (leap ? 366 : 365);
  const lens = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let m = 0;
  let acc = 0;
  while (m < 11 && acc + lens[m]! <= doy) acc += lens[m++]!;
  return `${MONTHS[m]} ${y <= 0 ? `${1 - y} BC` : `AD ${y}`}`;
}
export const monthRange = (i: IntervalExport) =>
  i.start_fraction && i.start_fraction.earliest !== null && i.start_fraction.latest !== null
    ? `${monthLabel(i.start_fraction.earliest)} – ${monthLabel(i.start_fraction.latest)}`
    : null;

export const choiceLabel = (choice: Record<string, string>) => Object.entries(choice).map(([g, o]) => `${g.replaceAll('-', ' ')}: ${o}`).join(' · ');

/** Items whose computed windows overlap the subject's window under the same model ("What else was happening?"). */
export function contemporaries(subject: string, model: string) {
  const results = data().chronology[model] ?? [];
  const r = results[0];
  const me = r?.intervals.find((i) => i.subject === subject);
  if (!r || !me || !isDated(me)) return [];
  const lo = me.start.earliest ?? -Infinity;
  const hi = me.end.latest ?? me.start.latest ?? Infinity;
  return r.intervals
    .filter((i) => i.subject !== subject && isDated(i))
    .filter((i) => (i.start.earliest ?? -Infinity) <= hi && (i.end.latest ?? i.start.latest ?? Infinity) >= lo)
    .map((i) => ({ id: i.subject, name: nameOf(i.subject), interval: i }));
}

// ─── Scripture ───────────────────────────────────────────────────────────────

const webCache = new Map<string, Record<string, Record<string, string>>>();
export function webChapter(osis: string, chapter: number): Array<{ verse: number; text: string }> {
  if (!webCache.has(osis)) webCache.set(osis, readJson<{ chapters: Record<string, Record<string, string>> }>('data/seed/scripture/web', `${osis}.json`).chapters);
  const ch = webCache.get(osis)![String(chapter)] ?? {};
  return Object.entries(ch).map(([v, text]) => ({ verse: Number(v), text }));
}

interface Inventory { books: Array<{ osis: string; verses_per_chapter: number[] }> }
let inventory: Map<string, number[]> | null = null;
export function versesPerChapter(osis: string): number[] {
  inventory ??= new Map(readJson<Inventory>('data/seed/scripture/verse-inventory.json').books.map((b) => [b.osis, b.verses_per_chapter]));
  return inventory.get(osis) ?? [];
}

/** WEB text for an OSIS passage (canonical numbering; WEB is identical except the Romans doxology). */
export function passageText(ref: string): Array<{ ref: string; verse: number; text: string }> {
  const p = parsePassageRef(ref);
  const out: Array<{ ref: string; verse: number; text: string }> = [];
  if (p.start.book !== p.end.book) return out;
  for (let c = p.start.chapter; c <= p.end.chapter; c++) {
    for (const v of webChapter(p.start.book, c)) {
      const inRange = (c > p.start.chapter || v.verse >= p.start.verse) && (c < p.end.chapter || v.verse <= p.end.verse);
      if (inRange) out.push({ ref: `${p.start.book}.${c}.${v.verse}`, verse: v.verse, text: v.text });
    }
  }
  return out;
}

export const passageLabel = (ref: string) => displayPassage(parsePassageRef(ref));

export function chapterOf(ref: string): { book: CanonBook; chapter: number; verse: number } {
  const p = parsePassageRef(ref);
  return { book: bookByOsis(p.start.book)!, chapter: p.start.chapter, verse: p.start.verse };
}

export function extractionFor(osis: string, chapter: number) {
  return data().extraction.find((x) => x.book === osis && x.chapter === chapter) ?? null;
}

/** Events with a mention or relationship touching a given chapter. */
export function eventsTouchingChapter(osis: string, chapter: number) {
  return data().events.filter((b) =>
    b.event.mentions.some((m) => {
      const p = parsePassageRef(m.passage);
      return p.start.book === osis && p.start.chapter <= chapter && p.end.chapter >= chapter;
    }),
  );
}

export { CANON };

// ─── Labels ──────────────────────────────────────────────────────────────────

export const CLASSIFICATION_LABEL: Record<string, string> = {
  independently_corroborated: 'Independently corroborated',
  strongly_supported: 'Strongly supported',
  historically_plausible: 'Historically plausible',
  disputed: 'Disputed',
  no_independent_corroboration_found: 'No independent corroboration found',
  contradicted_by_available_evidence: 'Contradicted by available evidence',
  not_empirically_testable: 'Not empirically testable',
};

export const VERIFICATION_LABEL: Record<string, string> = {
  discovered: 'Discovered only',
  metadata_verified: 'Metadata verified',
  source_accessed: 'Source accessed',
  claim_checked: 'Claim checked',
  human_reviewed: 'Human reviewed',
};

export const REVIEWER_LABEL: Record<string, string> = {
  machine_proposed: 'Machine-proposed',
  requires_review: 'Owner review pending',
  human_approved: 'Approved by owner',
  human_rejected: 'Rejected by owner',
};

export const PUBLICATION_LABEL: Record<string, string> = {
  unpublished: 'Unpublished',
  preliminary: 'Preliminary research',
  researched: 'Researched — not human reviewed',
  human_reviewed: 'Reviewed by project owner',
};

export const LAYER_LABEL: Record<string, string> = {
  text: 'Biblical text',
  interpretation: 'Interpretation',
  reconstruction: 'Historical reconstruction',
  evidence: 'External evidence',
};

export const COVERAGE_LABEL: Record<string, string> = {
  not_reviewed: 'Not reviewed',
  reviewed_no_candidate: 'Reviewed — nothing to research',
  reviewed_with_candidate: 'Reviewed — research candidate',
  needs_recheck: 'Needs recheck',
  blocked: 'Blocked',
};

export const titleCase = (s: string) => s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

/** Open review items attached to an event or any of its claims. */
export function openReviewsFor(bundle: EventBundle): ReviewSummary[] {
  const linked = new Set((bundle.crossrefs?.relationships ?? []).flatMap((r) => [r.from, r.to]).filter((x) => x.kind !== 'passage').map((x) => (x as { id: string }).id));
  const visions = new Set(entitiesOf('vision').filter((v) => v.experience_event_id === bundle.event.id || linked.has(v.id)).map((v) => v.id));
  const interpretations = entitiesOf('prophecy').filter((p) => linked.has(p.id) || (p.vision_id && visions.has(p.vision_id))).flatMap((p) => p.interpretations.map((i) => i.id));
  const ids = new Set([bundle.event.id, ...(bundle.evidence?.claims.map((c) => c.id) ?? []), ...(bundle.crossrefs?.relationships.map((r) => r.id) ?? []), ...interpretations]);
  return data().reviews.filter((r) => ids.has(r.record_id) && r.status !== 'decided');
}

/** Source-type groupings for SPEC 15.2 sections. */
export const SOURCE_GROUPS: Array<{ key: string; label: string; types: string[] }> = [
  { key: 'archaeology', label: 'Archaeological evidence', types: ['excavation_report', 'artifact_record', 'museum_catalog'] },
  { key: 'science', label: 'Scientific findings', types: ['scientific_paper', 'dataset'] },
  { key: 'documents', label: 'Ancient documents', types: ['ancient_primary_text'] },
  { key: 'news', label: 'Modern news and announcements', types: ['news_report'] },
  { key: 'secondary', label: 'Reference works and summaries', types: ['historical_reference', 'popular_summary', 'academic_monograph', 'institutional_database', 'scholarly_commentary', 'other'] },
];

export function sourcesCitedBy(bundle: EventBundle): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'string' && /^src_[0-9A-Z]{26}$/.test(v)) out.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk([bundle.context, bundle.evidence, bundle.crossrefs]);
  return out;
}

export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path: string) => `${base}/${path.replace(/^\//, '')}`;
export const chapterUrl = (book: CanonBook, ch: number, verse?: number) => url(`books/${book.slug}/${ch}/${verse ? `#v${verse}` : ''}`);
export const passageUrl = (ref: string) => {
  const c = chapterOf(ref);
  return chapterUrl(c.book, c.chapter, c.verse);
};

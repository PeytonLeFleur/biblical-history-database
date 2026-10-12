/** Entity resolution and duplicate detection helpers (standards/entity-resolution.md). Deterministic, no ML. */
import { parsePassageRef, compareVerseRefs } from '@atlas/scripture';
import type { Entity, EventRecord } from './schemas.ts';

export function normalizeName(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʾʿ'’`-]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length]!;
}

const STOPWORDS = new Set(['of', 'the', 'a', 'an', 'and', 's', 'in', 'at', 'to']);
const tokens = (s: string) => new Set(normalizeName(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((t) => t && !STOPWORDS.has(t)));

/** Word-set (Jaccard) similarity: robust to word order ("Belshazzar's feast" ~ "Feast of Belshazzar"). */
export function titleSimilarity(a: string, b: string): number {
  const x = tokens(a.replace(/'s\b/gi, ''));
  const y = tokens(b.replace(/'s\b/gi, ''));
  if (!x.size || !y.size) return 0;
  const inter = [...x].filter((t) => y.has(t)).length;
  return Math.max(inter / new Set([...x, ...y]).size, nameSimilarity(a, b));
}

export function nameSimilarity(a: string, b: string): number {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

function namesOf(e: Entity): string[] {
  switch (e.kind) {
    case 'person': return [e.canonical_name, ...e.aliases.map((a) => a.alias)];
    case 'place': return [e.primary_name, ...e.ancient_names.map((n) => n.name), ...(e.modern_name ? [e.modern_name] : [])];
    case 'kingdom': return [e.name];
    case 'site': return [e.name];
    case 'chronology_model': return [e.name];
    case 'artifact': return [e.name];
    case 'document': return [e.name, ...(e.standard_reference ? [e.standard_reference] : [])];
    case 'synchronism': return [e.title];
    case 'vision': return [e.title];
    case 'prophecy': return [e.title];
    case 'reign': return [];
  }
}

export interface EntityMatch {
  entity: Entity;
  score: number;
  matchedName: string;
  exact: boolean;
}

/** Candidate matches for a name. Exact (normalized) matches first; fuzzy ≥ threshold are possible identities. */
export function findEntityMatches(entities: Entity[], name: string, kind?: Entity['kind'], threshold = 0.8): EntityMatch[] {
  const out: EntityMatch[] = [];
  for (const e of entities) {
    if (kind && e.kind !== kind) continue;
    let best: EntityMatch | null = null;
    for (const n of namesOf(e)) {
      const score = nameSimilarity(name, n);
      if (!best || score > best.score) best = { entity: e, score, matchedName: n, exact: normalizeName(n) === normalizeName(name) };
    }
    if (best && (best.exact || best.score >= threshold)) out.push(best);
  }
  return out.sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score);
}

function overlaps(a: string, b: string): boolean {
  const p = parsePassageRef(a);
  const q = parsePassageRef(b);
  return compareVerseRefs(p.start, q.end) <= 0 && compareVerseRefs(q.start, p.end) <= 0;
}

export interface DuplicatePair {
  a: string;
  b: string;
  reason: string;
}

/** Flag likely duplicate events: overlapping mention passages AND similar titles (Rule 05 duplicate detection). */
export function detectDuplicateEvents(events: Pick<EventRecord, 'id' | 'title' | 'mentions' | 'parent_event_id'>[]): DuplicatePair[] {
  const out: DuplicatePair[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]!;
      const b = events[j]!;
      if (a.parent_event_id === b.id || b.parent_event_id === a.id) continue;
      const shared = a.mentions.some((m) => b.mentions.some((n) => overlaps(m.passage, n.passage)));
      const sim = titleSimilarity(a.title, b.title);
      if (shared && sim >= 0.6) out.push({ a: a.id, b: b.id, reason: `overlapping passages and title similarity ${sim.toFixed(2)}` });
    }
  }
  return out;
}

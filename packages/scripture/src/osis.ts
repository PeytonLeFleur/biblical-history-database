import { bookByOsis, type CanonBook } from './canon.ts';

/** OSIS-style verse reference, e.g. `Amos.1.1` (SPEC 5.3). */
export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

export interface PassageRef {
  start: VerseRef;
  end: VerseRef;
}

const VERSE_RE = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/;

export function parseVerseRef(osis: string): VerseRef {
  const m = VERSE_RE.exec(osis.trim());
  if (!m) throw new Error(`Invalid OSIS verse reference: "${osis}"`);
  const [, book, ch, vs] = m as unknown as [string, string, string, string];
  if (!bookByOsis(book)) throw new Error(`Unknown OSIS book: "${book}"`);
  return { book, chapter: Number(ch), verse: Number(vs) };
}

export const formatVerseRef = (r: VerseRef) => `${r.book}.${r.chapter}.${r.verse}`;

/** Parse `Dan.5.1` or `Dan.5.1-Dan.5.31` (OSIS range form). */
export function parsePassageRef(osis: string): PassageRef {
  const [a, b, extra] = osis.split('-');
  if (a === undefined || extra !== undefined) throw new Error(`Invalid OSIS passage: "${osis}"`);
  const start = parseVerseRef(a);
  const end = b === undefined ? start : parseVerseRef(b);
  if (compareVerseRefs(start, end) > 0) throw new Error(`Passage end precedes start: "${osis}"`);
  return { start, end };
}

export function formatPassageRef(p: PassageRef): string {
  const s = formatVerseRef(p.start);
  const e = formatVerseRef(p.end);
  return s === e ? s : `${s}-${e}`;
}

export function compareVerseRefs(a: VerseRef, b: VerseRef): number {
  const ba = bookByOsis(a.book) as CanonBook;
  const bb = bookByOsis(b.book) as CanonBook;
  return ba.order - bb.order || a.chapter - b.chapter || a.verse - b.verse;
}

/** Human-readable label: `Amos 1:1`, `Daniel 5:1–31`. */
export function displayPassage(p: PassageRef): string {
  const b = bookByOsis(p.start.book)!;
  const s = `${b.name} ${p.start.chapter}:${p.start.verse}`;
  if (formatVerseRef(p.start) === formatVerseRef(p.end)) return s;
  if (p.start.book !== p.end.book) {
    return `${s} – ${bookByOsis(p.end.book)!.name} ${p.end.chapter}:${p.end.verse}`;
  }
  if (p.start.chapter === p.end.chapter) return `${s}–${p.end.verse}`;
  return `${s}–${p.end.chapter}:${p.end.verse}`;
}

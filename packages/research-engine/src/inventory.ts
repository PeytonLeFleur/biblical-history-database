import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CANON, findBook, type CanonBook } from '@atlas/scripture';
import { REPO_ROOT } from './store.ts';

interface InventoryFile {
  books: Array<{ osis: string; verses_per_chapter: number[] }>;
}

let cache: Map<string, number[]> | null = null;

/** Canonical verse counts per chapter, from the committed verse inventory (M2). */
export function versesPerChapter(osis: string, root = REPO_ROOT): number[] {
  if (!cache) {
    const inv = JSON.parse(readFileSync(join(root, 'data/seed/scripture/verse-inventory.json'), 'utf8')) as InventoryFile;
    cache = new Map(inv.books.map((b) => [b.osis, b.verses_per_chapter]));
  }
  const v = cache.get(osis);
  if (!v) throw new Error(`No inventory for ${osis}`);
  return v;
}

export function chapterVerseRefs(osis: string, chapter: number): string[] {
  const n = versesPerChapter(osis)[chapter - 1];
  if (n === undefined) throw new Error(`${osis} has no chapter ${chapter}`);
  return Array.from({ length: n }, (_, i) => `${osis}.${chapter}.${i + 1}`);
}

export function verseExists(ref: string): boolean {
  const [book, ch, vs] = ref.split('.');
  const counts = book ? (() => { try { return versesPerChapter(book); } catch { return null; } })() : null;
  if (!counts) return false;
  const n = counts[Number(ch) - 1];
  return n !== undefined && Number(vs) >= 1 && Number(vs) <= n;
}

export function requireBook(input: string): CanonBook {
  const b = findBook(input);
  if (!b) throw new Error(`Unknown book "${input}". Use a name, slug, or OSIS code (e.g. daniel, Dan).`);
  return b;
}

export { CANON };

import { CANON } from '@atlas/scripture';

export interface VerseInventoryEntry {
  book: string;
  chapter: number;
  verse: number;
}

export interface InventoryReport {
  ok: boolean;
  errors: string[];
}

/** Validate a verse inventory against the 66-book canon: every book and chapter present, verses contiguous from 1. */
export function validateVerseInventory(entries: readonly VerseInventoryEntry[]): InventoryReport {
  const errors: string[] = [];
  const byChapter = new Map<string, number[]>();
  for (const e of entries) {
    const k = `${e.book}.${e.chapter}`;
    const list = byChapter.get(k) ?? [];
    list.push(e.verse);
    byChapter.set(k, list);
  }
  for (const b of CANON) {
    for (let c = 1; c <= b.chapters; c++) {
      const verses = byChapter.get(`${b.osis}.${c}`);
      if (!verses) {
        errors.push(`missing chapter ${b.osis}.${c}`);
        continue;
      }
      const sorted = [...new Set(verses)].sort((x, y) => x - y);
      if (sorted.length !== verses.length) errors.push(`duplicate verses in ${b.osis}.${c}`);
      if (sorted[0] !== 1) errors.push(`${b.osis}.${c} does not start at verse 1`);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1]! + 1) errors.push(`gap in ${b.osis}.${c} after verse ${sorted[i - 1]}`);
      }
    }
    if (byChapter.has(`${b.osis}.${b.chapters + 1}`)) errors.push(`extra chapter ${b.osis}.${b.chapters + 1}`);
  }
  const known = new Set(CANON.map((b) => b.osis));
  for (const e of entries) if (!known.has(e.book)) errors.push(`non-canonical book ${e.book}`);
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

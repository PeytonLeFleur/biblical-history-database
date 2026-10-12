import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANON } from '@atlas/scripture';
import { validateVerseInventory } from '../packages/validation/src/index.ts';

const SEED = resolve(import.meta.dirname, '../data/seed/scripture');
const inventory = JSON.parse(readFileSync(resolve(SEED, 'verse-inventory.json'), 'utf8')) as {
  total_verses: number;
  books: Array<{ osis: string; chapters: number; verses_per_chapter: number[]; total: number }>;
};

describe('committed verse inventory', () => {
  it('covers 66 books / 31,102 verses in standard English numbering', () => {
    expect(inventory.books.map((b) => b.osis)).toEqual(CANON.map((b) => b.osis));
    expect(inventory.total_verses).toBe(31102);
    const entries = inventory.books.flatMap((b) =>
      b.verses_per_chapter.flatMap((n, ci) =>
        Array.from({ length: n }, (_, vi) => ({ book: b.osis, chapter: ci + 1, verse: vi + 1 })),
      ),
    );
    expect(validateVerseInventory(entries)).toEqual({ ok: true, errors: [] });
  });

  it('uses standard numbering for known WEB differences', () => {
    const rom = inventory.books.find((b) => b.osis === 'Rom')!;
    expect(rom.verses_per_chapter[13]).toBe(23); // Rom 14
    expect(rom.verses_per_chapter[15]).toBe(27); // Rom 16
    const mal = inventory.books.find((b) => b.osis === 'Mal')!;
    expect(mal.verses_per_chapter).toHaveLength(4); // English Malachi has 4 chapters (Hebrew: 3)
  });
});

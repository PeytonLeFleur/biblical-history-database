import { describe, expect, it } from 'vitest';
import { CANON } from '@atlas/scripture';
import { validateVerseInventory, type VerseInventoryEntry } from './index.ts';

// Synthetic fixture: two verses per chapter. Test-only (SPEC 17.1).
const fixture = (): VerseInventoryEntry[] =>
  CANON.flatMap((b) =>
    Array.from({ length: b.chapters }, (_, i) => [1, 2].map((v) => ({ book: b.osis, chapter: i + 1, verse: v }))).flat(),
  );

describe('verse inventory validation', () => {
  it('accepts a complete inventory', () => {
    expect(validateVerseInventory(fixture())).toEqual({ ok: true, errors: [] });
  });
  it('reports missing chapters, gaps, and non-canonical books', () => {
    const inv = fixture().filter((e) => !(e.book === 'Dan' && e.chapter === 5));
    inv.push({ book: 'Amos', chapter: 1, verse: 4 });
    inv.push({ book: 'Bel', chapter: 1, verse: 1 });
    const r = validateVerseInventory(inv);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('missing chapter Dan.5');
    expect(r.errors).toContain('gap in Amos.1 after verse 2');
    expect(r.errors).toContain('non-canonical book Bel');
  });
});

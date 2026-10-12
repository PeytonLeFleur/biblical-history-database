import { describe, expect, it } from 'vitest';
import {
  CANON,
  displayPassage,
  findBook,
  formatPassageRef,
  parsePassageRef,
  parseVerseRef,
} from './index.ts';

describe('canon', () => {
  it('has 66 books: 39 OT, 27 NT', () => {
    expect(CANON).toHaveLength(66);
    expect(CANON.filter((b) => b.testament === 'OT')).toHaveLength(39);
    expect(CANON.filter((b) => b.testament === 'NT')).toHaveLength(27);
  });

  it('has 1,189 chapters (929 OT + 260 NT)', () => {
    const sum = (t: string) => CANON.filter((b) => b.testament === t).reduce((n, b) => n + b.chapters, 0);
    expect(sum('OT')).toBe(929);
    expect(sum('NT')).toBe(260);
  });

  it('has unique OSIS, USFM, and slug codes in canonical order', () => {
    for (const key of ['osis', 'usfm', 'slug'] as const) {
      expect(new Set(CANON.map((b) => b[key])).size).toBe(66);
    }
    expect(CANON.map((b) => b.order)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
    expect(CANON[0]?.osis).toBe('Gen');
    expect(CANON[65]?.osis).toBe('Rev');
  });

  it('resolves books by name, slug, OSIS, USFM', () => {
    expect(findBook('daniel')?.osis).toBe('Dan');
    expect(findBook('Dan')?.osis).toBe('Dan');
    expect(findBook('1-kings')?.osis).toBe('1Kgs');
    expect(findBook('1 Kings')?.osis).toBe('1Kgs');
    expect(findBook('ZEC')?.osis).toBe('Zech');
    expect(findBook('Song of Songs')?.osis).toBe('Song');
    expect(findBook('Bel and the Dragon')).toBeUndefined();
  });
});

describe('OSIS references', () => {
  it('parses SPEC examples', () => {
    expect(parseVerseRef('Amos.1.1')).toEqual({ book: 'Amos', chapter: 1, verse: 1 });
    expect(parseVerseRef('Zech.14.5')).toEqual({ book: 'Zech', chapter: 14, verse: 5 });
    expect(parseVerseRef('1Kgs.22.1').book).toBe('1Kgs');
  });

  it('parses and displays ranges', () => {
    const p = parsePassageRef('Dan.5.1-Dan.5.31');
    expect(formatPassageRef(p)).toBe('Dan.5.1-Dan.5.31');
    expect(displayPassage(p)).toBe('Daniel 5:1–31');
    expect(displayPassage(parsePassageRef('Isa.44.28-Isa.45.1'))).toBe('Isaiah 44:28–45:1');
  });

  it('rejects invalid references', () => {
    expect(() => parseVerseRef('Bel.1.1')).toThrow();
    expect(() => parseVerseRef('Amos 1:1')).toThrow();
    expect(() => parsePassageRef('Dan.5.31-Dan.5.1')).toThrow();
  });
});

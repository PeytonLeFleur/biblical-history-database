import { describe, expect, it } from 'vitest';
import { intersect, isWellFormed, shift } from './index.ts';

describe('year intervals', () => {
  it('intersects overlapping intervals', () => {
    expect(intersect({ earliest: -800, latest: -740 }, { earliest: -760, latest: null })).toEqual({
      earliest: -760,
      latest: -740,
    });
  });
  it('detects contradictions as null', () => {
    expect(intersect({ earliest: -800, latest: -790 }, { earliest: -700, latest: -600 })).toBeNull();
  });
  it('preserves open bounds', () => {
    expect(intersect({ earliest: null, latest: null }, { earliest: null, latest: -538 })).toEqual({
      earliest: null,
      latest: -538,
    });
  });
  it('shifts by an offset range without inventing precision', () => {
    expect(shift({ earliest: -605, latest: -604 }, 2, 3)).toEqual({ earliest: -603, latest: -601 });
    expect(isWellFormed({ earliest: 1, latest: 0 })).toBe(false);
  });
});

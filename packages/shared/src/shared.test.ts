import { describe, expect, it } from 'vitest';
import {
  EVENT_CATEGORIES,
  RELATIONSHIP_TYPES,
  SOURCE_TYPES,
  formatInterval,
  formatYear,
  fromAstronomical,
  isValidId,
  newId,
  prefixOf,
  requiresHumanReview,
  toAstronomical,
} from './index.ts';

describe('ids', () => {
  it('creates prefixed ULIDs that validate', () => {
    const id = newId('event');
    expect(id).toMatch(/^evt_[0-9A-Z]{26}$/);
    expect(isValidId(id)).toBe(true);
    expect(isValidId(id, 'event')).toBe(true);
    expect(isValidId(id, 'person')).toBe(false);
    expect(prefixOf(id)).toBe('evt');
  });

  it('rejects malformed ids', () => {
    expect(isValidId('evt_amos-earthquake')).toBe(false);
    expect(isValidId('xyz_01HZY3F7Q8M2Z4K5N6P7R8S9T0')).toBe(false);
    expect(isValidId('noprefix')).toBe(false);
  });

  it('is deterministic in time ordering', () => {
    const a = newId('source', 1_000);
    const b = newId('source', 2_000);
    expect(a < b).toBe(true);
  });
});

describe('astronomical years', () => {
  it('maps BC/AD per SPEC 12.5', () => {
    expect(toAstronomical(1, 'BC')).toBe(0);
    expect(toAstronomical(2, 'BC')).toBe(-1);
    expect(toAstronomical(539, 'BC')).toBe(-538);
    expect(toAstronomical(33, 'AD')).toBe(33);
  });

  it('round-trips', () => {
    for (const y of [-1000, -538, -1, 0, 1, 30, 2026]) {
      const { year, era } = fromAstronomical(y);
      expect(toAstronomical(year, era)).toBe(y);
    }
  });

  it('formats publicly in BC/AD', () => {
    expect(formatYear(-538)).toBe('539 BC');
    expect(formatYear(0)).toBe('1 BC');
    expect(formatYear(1)).toBe('AD 1');
    expect(formatInterval({ earliest: -790, latest: -750 })).toBe('791 BC – 751 BC');
    expect(formatInterval({ earliest: null, latest: null })).toBe('Undated');
  });

  it('rejects year zero in BC/AD input', () => {
    expect(() => toAstronomical(0, 'BC')).toThrow(RangeError);
  });
});

describe('taxonomies', () => {
  it('match SPEC counts', () => {
    expect(EVENT_CATEGORIES).toHaveLength(19);
    expect(SOURCE_TYPES).toHaveLength(14);
    expect(RELATIONSHIP_TYPES).toHaveLength(20);
  });

  it('applies SPEC 9.3 review triggers', () => {
    expect(requiresHumanReview({ priority: 'critical' })).toBe(true);
    expect(requiresHumanReview({ classification: 'disputed' })).toBe(true);
    expect(requiresHumanReview({ priority: 'high', classification: 'historically_plausible' })).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { isValidCoordinates } from './index.ts';

describe('coordinates', () => {
  it('accepts valid WGS84 points', () => {
    expect(isValidCoordinates({ lat: 31.778, lon: 35.235 })).toBe(true);
  });
  it('rejects out-of-range or non-finite points', () => {
    expect(isValidCoordinates({ lat: 91, lon: 0 })).toBe(false);
    expect(isValidCoordinates({ lat: 0, lon: -181 })).toBe(false);
    expect(isValidCoordinates({ lat: Number.NaN, lon: 0 })).toBe(false);
  });
});

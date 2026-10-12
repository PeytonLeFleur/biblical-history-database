/**
 * Astronomical year numbering (SPEC 12.5).
 * 1 BC = 0, 2 BC = -1, 539 BC = -538. AD n = n. There is no year 0 in BC/AD notation.
 */

export type Era = 'BC' | 'AD';

export function toAstronomical(year: number, era: Era): number {
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError(`BC/AD year must be a positive integer, got ${year}`);
  }
  return era === 'AD' ? year : 1 - year;
}

export function fromAstronomical(astro: number): { year: number; era: Era } {
  if (!Number.isInteger(astro)) throw new RangeError(`Astronomical year must be an integer, got ${astro}`);
  return astro >= 1 ? { year: astro, era: 'AD' } : { year: 1 - astro, era: 'BC' };
}

export function formatYear(astro: number): string {
  const { year, era } = fromAstronomical(astro);
  return era === 'BC' ? `${year} BC` : `AD ${year}`;
}

/** Inclusive interval of astronomical years; either bound may be open (unknown). */
export interface YearInterval {
  earliest: number | null;
  latest: number | null;
}

export function formatInterval(i: YearInterval): string {
  if (i.earliest === null && i.latest === null) return 'Undated';
  if (i.earliest !== null && i.earliest === i.latest) return formatYear(i.earliest);
  const lo = i.earliest === null ? '?' : formatYear(i.earliest);
  const hi = i.latest === null ? '?' : formatYear(i.latest);
  return `${lo} – ${hi}`;
}

import { newYearFractionWindow, type NewYear } from './calendar.ts';

/**
 * Regnal-year computation (SPEC 12.4).
 *
 * Times are fractional astronomical years (year Y spans [Y, Y+1)).
 * - Accession-year reckoning: the partial year from accession to the next new year is the
 *   "accession year" (year 0); regnal year 1 begins at the first new year after accession.
 * - Non-accession reckoning: the partial year from accession to the next new year counts as year 1;
 *   regnal year 2 begins at the first new year after accession.
 *
 * Because accession dates and new-year days are uncertain, the result is the union of every possible
 * regnal-year window across the accession interval and the new-year window. This is computed by a
 * deterministic grid scan (weekly resolution) padded by one grid step, so uncertainty is never understated.
 */

export type Reckoning = 'accession' | 'non_accession';

export interface RegnalConvention {
  reckoning: Reckoning;
  newYear: NewYear;
}

const STEP = 1 / 52;

function nextNewYear(t: number, frac: number): number {
  const y = Math.floor(t);
  const candidate = y + frac;
  return candidate > t ? candidate : candidate + 1;
}

/** Window [start, end) of regnal year n for a single accession time and new-year fraction. */
export function regnalYearWindowExact(accession: number, n: number, conv: Reckoning, nyFrac: number): [number, number] {
  if (!Number.isInteger(n) || n < (conv === 'accession' ? 0 : 1)) throw new RangeError(`Invalid regnal year ${n}`);
  const ny1 = nextNewYear(accession, nyFrac);
  if (conv === 'accession') {
    return n === 0 ? [accession, ny1] : [ny1 + (n - 1), ny1 + n];
  }
  return n === 1 ? [accession, ny1] : [ny1 + (n - 2), ny1 + (n - 1)];
}

export interface RegnalWindow {
  earliest: number;
  latest: number;
}

export function regnalYearWindow(
  accession: { earliest: number; latest: number },
  n: number,
  conv: RegnalConvention,
): RegnalWindow {
  if (accession.earliest > accession.latest) throw new RangeError('accession interval is empty');
  const ny = newYearFractionWindow(conv.newYear);
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  const aSteps = Math.max(1, Math.ceil((accession.latest - accession.earliest) / STEP));
  const fSteps = Math.max(1, Math.ceil((ny.hi - ny.lo) / STEP));
  for (let i = 0; i <= aSteps; i++) {
    const a = Math.min(accession.latest, accession.earliest + i * STEP);
    for (let j = 0; j <= fSteps; j++) {
      const f = Math.min(ny.hi, ny.lo + j * STEP);
      const [s, e] = regnalYearWindowExact(a, n, conv.reckoning, f);
      lo = Math.min(lo, s);
      hi = Math.max(hi, e);
    }
  }
  return { earliest: lo - STEP, latest: hi + STEP };
}

/** Whole astronomical years touched by a fractional window. */
export function toYearInterval(w: RegnalWindow): { earliest: number; latest: number } {
  return { earliest: Math.floor(w.earliest), latest: Math.floor(w.latest - 1e-9) };
}

export function windowsOverlap(a: RegnalWindow, b: RegnalWindow): boolean {
  return a.earliest < b.latest && b.earliest < a.latest;
}

/**
 * Calendar conversion (SPEC 12.5). Years are astronomical (1 BC = 0).
 *
 * Julian/Gregorian ↔ Julian Day Number use the standard algorithms in
 * J. Meeus, *Astronomical Algorithms* (2nd ed., 1998), ch. 7. These are exact.
 *
 * Lunar calendars (Babylonian, Hebrew) are NOT converted day-exactly here: that requires the
 * Parker & Dubberstein tables (*Babylonian Chronology 626 B.C.–A.D. 75*, 1956) or equivalent, which
 * have not been imported. `lunarYearStartWindow` gives a deliberately wide, documented window instead,
 * so any uncertainty is overstated rather than hidden.
 */

export type CalendarKind = 'julian' | 'gregorian';

export interface CalendarDate {
  year: number; // astronomical
  month: number; // 1–12
  day: number; // may be fractional
}

/** Julian Day Number for a calendar date (Meeus 7.1). */
export function toJdn(d: CalendarDate, calendar: CalendarKind): number {
  let { year: y, month: m } = d;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  let b = 0;
  if (calendar === 'gregorian') {
    const a = Math.floor(y / 100);
    b = 2 - a + Math.floor(a / 4);
  }
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d.day + b - 1524.5;
}

/** Calendar date for a Julian Day Number (Meeus 7, inverse). */
export function fromJdn(jd: number, calendar: CalendarKind): CalendarDate {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (calendar === 'gregorian') {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const dd = Math.floor(365.25 * c);
  const e = Math.floor((b - dd) / 30.6001);
  const day = b - dd - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { year, month, day };
}

export function convert(d: CalendarDate, from: CalendarKind, to: CalendarKind): CalendarDate {
  return fromJdn(toJdn(d, from), to);
}

/** Fractional astronomical year (year + fraction elapsed) for a proleptic Julian date. */
export function julianToFractionalYear(d: CalendarDate): number {
  const start = toJdn({ year: d.year, month: 1, day: 1 }, 'julian');
  const next = toJdn({ year: d.year + 1, month: 1, day: 1 }, 'julian');
  return d.year + (toJdn(d, 'julian') - start) / (next - start);
}

/**
 * Conservative windows (fraction of the proleptic Julian year) in which a lunisolar new year falls.
 * Nisan 1 is generally placed in March–April and Tishri 1 in September–October. The windows below
 * are widened to whole months on each side. ASSUMPTION — replace with table-based conversion when
 * Parker & Dubberstein (or equivalent) data is imported.
 */
export const NEW_YEAR_WINDOWS = {
  nisan: { from: { month: 3, day: 1 }, to: { month: 5, day: 1 } },
  tishri: { from: { month: 9, day: 1 }, to: { month: 11, day: 1 } },
  january: { from: { month: 1, day: 1 }, to: { month: 1, day: 1 } },
} as const;

export type NewYear = keyof typeof NEW_YEAR_WINDOWS;

export function newYearFractionWindow(ny: NewYear): { lo: number; hi: number } {
  const w = NEW_YEAR_WINDOWS[ny];
  // Use a non-leap reference year; the fraction difference between leap and common years is < 0.003.
  return {
    lo: julianToFractionalYear({ year: 1, month: w.from.month, day: w.from.day }) - 1,
    hi: julianToFractionalYear({ year: 1, month: w.to.month, day: w.to.day }) - 1,
  };
}

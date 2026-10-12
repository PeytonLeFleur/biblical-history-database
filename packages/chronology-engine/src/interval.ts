import type { YearInterval } from '@atlas/shared';

/** Intersect two inclusive year intervals. Returns null when they are disjoint (a contradiction). */
export function intersect(a: YearInterval, b: YearInterval): YearInterval | null {
  const earliest = maxNullable(a.earliest, b.earliest);
  const latest = minNullable(a.latest, b.latest);
  if (earliest !== null && latest !== null && earliest > latest) return null;
  return { earliest, latest };
}

export function isWellFormed(i: YearInterval): boolean {
  return i.earliest === null || i.latest === null || i.earliest <= i.latest;
}

/** Shift an interval by a whole-year offset range (e.g. "3 to 4 years later"). */
export function shift(i: YearInterval, minOffset: number, maxOffset: number): YearInterval {
  if (minOffset > maxOffset) throw new RangeError('minOffset must be <= maxOffset');
  return {
    earliest: i.earliest === null ? null : i.earliest + minOffset,
    latest: i.latest === null ? null : i.latest + maxOffset,
  };
}

function maxNullable(a: number | null, b: number | null) {
  return a === null ? b : b === null ? a : Math.max(a, b);
}
function minNullable(a: number | null, b: number | null) {
  return a === null ? b : b === null ? a : Math.min(a, b);
}

/**
 * Chronology engine tests — SPEC 12.4 reconciliation test and SPEC 12.8 consistency tests.
 * All dates below are SYNTHETIC FIXTURES chosen to exercise the math; they are not research findings.
 */
import { describe, expect, it } from 'vitest';
import {
  type Anchor,
  type Constraint,
  checkReignStructure,
  convert,
  evidenceConflicts,
  fromJdn,
  regnalYearWindow,
  solve,
  toJdn,
  windowsOverlap,
} from './index.ts';

const anchor = (id: string, subject: string, earliest: number | null, latest: number | null, extra: Partial<Anchor> = {}): Anchor => ({
  id, subject, earliest, latest, precision: 'year', modelId: null, ...extra,
});
const cons = (id: string, subject: string, relation: Constraint['relation'], object: string, extra: Partial<Constraint> = {}): Constraint => ({
  id, subject, relation, object, precision: 'year', modelId: null, textualAssertion: `fixture ${id}`, ...extra,
});
const only = <T>(xs: T[]) => {
  expect(xs).toHaveLength(1);
  return xs[0]!;
};

describe('calendar conversion (SPEC 12.8 #6)', () => {
  it('matches Meeus reference values', () => {
    expect(toJdn({ year: 1957, month: 10, day: 4.81 }, 'gregorian')).toBeCloseTo(2436116.31, 2);
    expect(toJdn({ year: 333, month: 1, day: 27.5 }, 'julian')).toBeCloseTo(1842713.0, 6);
    expect(toJdn({ year: -4712, month: 1, day: 1.5 }, 'julian')).toBeCloseTo(0, 6);
    expect(toJdn({ year: -1000, month: 7, day: 12.5 }, 'julian')).toBeCloseTo(1356001.0, 6);
  });

  it('round-trips deterministically across BC dates', () => {
    for (const d of [
      { year: -538, month: 10, day: 12 },
      { year: -596, month: 3, day: 16 },
      { year: 30, month: 4, day: 7 },
    ]) {
      expect(fromJdn(toJdn(d, 'julian'), 'julian')).toEqual(d);
      const g = convert(d, 'julian', 'gregorian');
      expect(convert(g, 'gregorian', 'julian')).toEqual(d);
    }
  });
});

describe('regnal reckoning (SPEC 12.4)', () => {
  // Fixture: an accession in early summer of astronomical year −608, known to within a few weeks — clear of the
  // Tishri new-year window, so the first new year after accession is unambiguous.
  const accession = { earliest: -608 + 0.45, latest: -608 + 0.5 };

  it('accession vs non-accession counting shifts the regnal year by one', () => {
    const acc3 = regnalYearWindow(accession, 3, { reckoning: 'accession', newYear: 'tishri' });
    const non4 = regnalYearWindow(accession, 4, { reckoning: 'non_accession', newYear: 'tishri' });
    const non3 = regnalYearWindow(accession, 3, { reckoning: 'non_accession', newYear: 'tishri' });
    // Accession-year 3 coincides with non-accession year 4 …
    expect(Math.abs(acc3.earliest - non4.earliest)).toBeLessThan(0.05);
    expect(Math.abs(acc3.latest - non4.latest)).toBeLessThan(0.05);
    // … and is about one year later than non-accession year 3.
    expect(acc3.earliest - non3.earliest).toBeGreaterThan(0.9);
  });

  it('an accession inside the new-year window widens the result by a full year (uncertainty is not hidden)', () => {
    const ambiguous = { earliest: -608 + 0.7, latest: -608 + 0.75 }; // overlaps the conservative Tishri window
    const w = regnalYearWindow(ambiguous, 3, { reckoning: 'accession', newYear: 'tishri' });
    expect(w.latest - w.earliest).toBeGreaterThan(1.9);
  });

  it('Daniel 1:1 (third year) and Jeremiah 25:1 (fourth year) can denote the same year only under differing reckonings', () => {
    // Hypothesis A (commonly proposed): Daniel counts with accession-year reckoning, Jeremiah with non-accession.
    const danA = regnalYearWindow(accession, 3, { reckoning: 'accession', newYear: 'tishri' });
    const jerA = regnalYearWindow(accession, 4, { reckoning: 'non_accession', newYear: 'tishri' });
    // Hypothesis B: both use the same (accession) reckoning.
    const jerB = regnalYearWindow(accession, 4, { reckoning: 'accession', newYear: 'tishri' });
    const overlap = (a: { earliest: number; latest: number }, b: { earliest: number; latest: number }) =>
      Math.max(0, Math.min(a.latest, b.latest) - Math.max(a.earliest, b.earliest));
    expect(overlap(danA, jerA)).toBeGreaterThan(0.9); // ~ a full year in common
    // Adjacent years share only the uncertain new-year boundary (2-month Tishri window + grid padding).
    expect(overlap(danA, jerB)).toBeLessThan(0.25);
    expect(windowsOverlap(danA, jerA)).toBe(true);
  });

  it('solver retains both reckoning hypotheses as alternatives and keeps the texts unchanged', () => {
    const results = solve({
      modelId: 'chr_fixture',
      anchors: [anchor('a_acc', 'reign_jehoiakim', -608, -608, { point: 'start' })],
      constraints: [
        cons('c_dan', 'evt_dan_1_1', 'in_regnal_year', 'reign_jehoiakim', { regnalYear: 3, textualAssertion: 'In the third year of the reign of Jehoiakim (Dan 1:1)' }),
        cons('c_jer', 'evt_jer_25_1', 'in_regnal_year', 'reign_jehoiakim', { regnalYear: 4, textualAssertion: 'in the fourth year of Jehoiakim (Jer 25:1)' }),
      ],
      conventions: [
        { id: 'conv_acc', reign: 'reign_jehoiakim', modelId: null, alternativeGroup: 'jehoiakim_reckoning', convention: { reckoning: 'accession', newYear: 'tishri' } },
        { id: 'conv_non', reign: 'reign_jehoiakim', modelId: null, alternativeGroup: 'jehoiakim_reckoning', convention: { reckoning: 'non_accession', newYear: 'tishri' } },
      ],
      pointEvents: ['evt_dan_1_1', 'evt_jer_25_1'],
    });
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.feasible).toBe(true);
      expect(r.intervals.get('evt_dan_1_1')!.start.latest.derivation.some((d) => d.startsWith('c_dan'))).toBe(true);
    }
  });
});

describe('solver consistency (SPEC 12.8)', () => {
  it('#1 child events fall within their parent period', () => {
    const r = only(solve({
      modelId: null,
      anchors: [anchor('a_parent', 'period', -800, -750)],
      constraints: [cons('c_during', 'child', 'during', 'period')],
    }));
    const child = r.intervals.get('child')!;
    expect(child.start.earliest.value).toBeGreaterThanOrEqual(-800);
    expect(child.end.latest.value).toBeLessThanOrEqual(-749);
  });

  it('#2 ruler actions outside the reign are reported as contradictions', () => {
    const r = only(solve({
      modelId: null,
      anchors: [anchor('a_reign', 'reign', -790, -740), anchor('a_action', 'action', -700, -700)],
      constraints: [cons('c_within', 'action', 'within_reign', 'reign')],
    }));
    expect(r.feasible).toBe(false);
    expect(r.contradictions[0]!.cycle).toEqual(expect.arrayContaining(['a_reign', 'a_action', 'c_within']));
  });

  it('#3 strict before/after cycles are impossible and detected', () => {
    const r = only(solve({
      modelId: null,
      anchors: [],
      constraints: [cons('c1', 'A', 'before', 'B'), cons('c2', 'B', 'before', 'A')],
    }));
    expect(r.feasible).toBe(false);
    expect(r.contradictions[0]!.cycle).toEqual(expect.arrayContaining(['c1', 'c2']));
  });

  it('#4 computed earliest never exceeds latest', () => {
    const r = only(solve({
      modelId: null,
      anchors: [anchor('a', 'X', -600, -590)],
      constraints: [cons('c', 'Y', 'years_later', 'X', { offsetMin: 3, offsetMax: 3, unit: 'years' })],
    }));
    for (const iv of r.intervals.values()) {
      expect(iv.start.earliest.value!).toBeLessThanOrEqual(iv.start.latest.value!);
    }
    expect(r.intervals.get('Y')!.years).toEqual({ earliest: -597, latest: -586 });
  });

  it('#5 coregencies overlap and sequential reigns do not', () => {
    const r = only(solve({
      modelId: null,
      anchors: [anchor('a_f', 'father', -800, -760), anchor('a_s', 'son', -770, -740)],
      constraints: [],
    }));
    expect(checkReignStructure([{ id: 'son', isCoregency: true, coregentWith: 'father' }], r.intervals)).toEqual([]);
    const issues = checkReignStructure([{ id: 'son', isCoregency: false, predecessor: 'father' }], r.intervals);
    // With these windows the father can end before the son starts, so a sequential reading is still feasible:
    expect(issues).toEqual([]);
    const tight = only(solve({ modelId: null, anchors: [anchor('a_f', 'father', -800, -760, { point: 'end' }), anchor('a_f2', 'father', -800, -800, { point: 'start' }), anchor('a_s', 'son', -780, -780, { point: 'start' })], constraints: [] }));
    const forced = checkReignStructure([{ id: 'son', isCoregency: false, predecessor: 'father' }], tight.intervals);
    expect(forced).toEqual([]); // father may still end by -780
    const overlapForced = only(solve({ modelId: null, anchors: [anchor('a_f', 'father', -770, -770, { point: 'end' }), anchor('a_s', 'son', -780, -780, { point: 'start' })], constraints: [] }));
    expect(checkReignStructure([{ id: 'son', isCoregency: false, predecessor: 'father' }], overlapForced.intervals)).toHaveLength(1);
  });

  it('#7 precision is never finer than the inputs', () => {
    const r = only(solve({
      modelId: null,
      anchors: [anchor('a', 'X', -760, -751, { precision: 'decade' })],
      constraints: [cons('c', 'Y', 'after', 'X', { precision: 'year' })],
    }));
    expect(r.intervals.get('X')!.precision).toBe('decade');
  });

  it('#8 undated events are not assigned unsupported dates', () => {
    const r = only(solve({
      modelId: null,
      anchors: [],
      constraints: [cons('c', 'P', 'before', 'Q')],
    }));
    const p = r.intervals.get('P')!;
    expect(p.years).toEqual({ earliest: null, latest: null });
    expect(p.precision).toBe('undated');
  });

  it('#9 constraints from other chronology models are excluded, not mixed', () => {
    const r = only(solve({
      modelId: 'chr_A',
      anchors: [anchor('a', 'X', -900, -900)],
      constraints: [
        cons('c_A', 'Y', 'years_later', 'X', { offsetMin: 10, unit: 'years', modelId: 'chr_A' }),
        cons('c_B', 'Y', 'years_later', 'X', { offsetMin: 40, unit: 'years', modelId: 'chr_B' }),
      ],
    }));
    expect(r.excluded).toEqual(['c_B']);
    expect(r.intervals.get('Y')!.years.earliest).toBe(-890);
  });

  it('#10 changing an anchor recalculates dependent dates', () => {
    const run = (year: number) =>
      only(solve({
        modelId: null,
        anchors: [anchor('a', 'X', year, year)],
        constraints: [cons('c', 'Y', 'years_later', 'X', { offsetMin: 2, unit: 'years' })],
      })).intervals.get('Y')!.years;
    expect(run(-600)).toEqual({ earliest: -598, latest: -597 });
    expect(run(-590)).toEqual({ earliest: -588, latest: -587 });
  });

  it('#11 contradictory sources remain visible', () => {
    const r = only(solve({
      modelId: null,
      anchors: [
        anchor('a_src1', 'X', -700, -700, { source: 'src_one' }),
        anchor('a_src2', 'X', -650, -650, { source: 'src_two' }),
      ],
      constraints: [],
    }));
    expect(r.feasible).toBe(false);
    expect(r.contradictions[0]!.cycle).toEqual(expect.arrayContaining(['a_src1', 'a_src2']));
  });

  it('#12 a model cannot silently override explicit evidence', () => {
    const input = {
      modelId: 'chr_A',
      anchors: [anchor('a_evidence', 'X', -701, -701, { isEvidence: true }), anchor('a_model', 'X', -690, -680, { modelId: 'chr_A' })],
      constraints: [],
    };
    const r = only(solve(input));
    expect(r.feasible).toBe(false);
    expect(evidenceConflicts(r, input)).toHaveLength(1);
  });

  it('records a derivation chain for computed bounds (SPEC 12.9)', () => {
    const r = only(solve({
      modelId: null,
      anchors: [anchor('a_anchor', 'X', -539, -539)],
      constraints: [cons('c_next', 'Y', 'years_later', 'X', { offsetMin: 1, unit: 'years' })],
    }));
    expect(r.intervals.get('Y')!.start.earliest.derivation).toEqual(['a_anchor', 'c_next']);
  });
});

describe('per-statement regnal conventions (SPEC 12.4)', () => {
  it('lets two texts about the same reign use different reckonings, solved as alternatives', () => {
    // SYNTHETIC FIXTURE: an early-summer accession; two statements about the same reign by different authors.
    const results = solve({
      modelId: null,
      anchors: [{ id: 'a_acc', subject: 'reign_k', point: 'start', earliest: -608, latest: -608, precision: 'year', modelId: null }],
      constraints: [
        { id: 'c_a_acc', subject: 'evt_a', relation: 'in_regnal_year', object: 'reign_k', regnalYear: 3, convention: { reckoning: 'accession', newYear: 'nisan' }, alternativeGroup: 'author_a', precision: 'regnal_year', modelId: null, textualAssertion: 'third year (author A)' },
        { id: 'c_a_non', subject: 'evt_a', relation: 'in_regnal_year', object: 'reign_k', regnalYear: 3, convention: { reckoning: 'non_accession', newYear: 'nisan' }, alternativeGroup: 'author_a', precision: 'regnal_year', modelId: null, textualAssertion: 'third year (author A)' },
        { id: 'c_b_non', subject: 'evt_b', relation: 'in_regnal_year', object: 'reign_k', regnalYear: 4, convention: { reckoning: 'non_accession', newYear: 'nisan' }, precision: 'regnal_year', modelId: null, textualAssertion: 'fourth year (author B)' },
      ],
      pointEvents: ['evt_a', 'evt_b'],
    });
    expect(results).toHaveLength(2);
    const window = (r: (typeof results)[number], s: string) => r.intervals.get(s)!.years;
    const accession = results.find((r) => r.choice.author_a === 'c_a_acc')!;
    const nonAccession = results.find((r) => r.choice.author_a === 'c_a_non')!;
    // Mixed reckonings make "year 3" and "year 4" land in the same window; matching reckonings do not.
    expect(window(accession, 'evt_a')).toEqual(window(accession, 'evt_b'));
    expect(window(nonAccession, 'evt_a').latest!).toBeLessThan(window(nonAccession, 'evt_b').latest!);
  });
});

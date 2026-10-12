import { describe, expect, it } from 'vitest';
import { assertNoFixtures, filterPublishable } from './index.ts';

describe('static export guards', () => {
  it('drops fixtures, restricted records, and transitive dependents', () => {
    const out = filterPublishable([
      { id: 'a' },
      { id: 'fx', isFixture: true },
      { id: 'b', dependsOn: ['fx'] },
      { id: 'c', dependsOn: ['b'] },
      { id: 'r', restricted: true },
      { id: 'd', dependsOn: ['a'] },
    ]);
    expect(out.map((r) => r.id)).toEqual(['a', 'd']);
  });
  it('rejects fixture records outright', () => {
    expect(() => assertNoFixtures([{ id: 'x', isFixture: true }])).toThrow(/fixture/);
  });
});

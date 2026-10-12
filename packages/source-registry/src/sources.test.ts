import { describe, expect, it } from 'vitest';
import { canAdvanceVerification, dedupeKey } from './index.ts';

describe('source verification', () => {
  it('advances one level at a time', () => {
    expect(canAdvanceVerification('discovered', 'metadata_verified')).toBe(true);
    expect(canAdvanceVerification('discovered', 'claim_checked')).toBe(false);
    expect(canAdvanceVerification('source_accessed', 'human_reviewed')).toBe(false);
  });
});

describe('dedupe keys', () => {
  it('normalizes DOIs', () => {
    expect(dedupeKey({ title: 'x', doi: 'https://doi.org/10.1000/ABC' })).toBe('doi:10.1000/abc');
  });
  it('normalizes URLs', () => {
    expect(dedupeKey({ title: 'x', url: 'https://www.example.org/a/b/' })).toBe(
      dedupeKey({ title: 'y', url: 'https://example.org/a/b?utm=1' }),
    );
  });
});

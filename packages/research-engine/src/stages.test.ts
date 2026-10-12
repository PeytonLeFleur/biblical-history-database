import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESEARCH_STAGES, nextStage } from './index.ts';

describe('research stages', () => {
  it('each stage points to an existing rule file', () => {
    for (const s of RESEARCH_STAGES) {
      expect(existsSync(resolve(import.meta.dirname, '../../..', s.rule)), s.rule).toBe(true);
    }
  });
  it('finds the next incomplete stage in order', () => {
    expect(nextStage([])?.key).toBe('scripture_extraction');
    expect(nextStage(['scripture_extraction', 'historical_reconstruction'])?.key).toBe('external_evidence');
    expect(nextStage(RESEARCH_STAGES.map((s) => s.key))).toBeUndefined();
  });
});

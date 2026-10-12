/** The five research stages (SPEC Part 8). */
export const RESEARCH_STAGES = [
  { id: 1, key: 'scripture_extraction', rule: 'rules/01-scripture-extraction.md' },
  { id: 2, key: 'historical_reconstruction', rule: 'rules/02-historical-reconstruction.md' },
  { id: 3, key: 'external_evidence', rule: 'rules/03-external-evidence.md' },
  { id: 4, key: 'cross_referencing', rule: 'rules/04-cross-referencing.md' },
  { id: 5, key: 'publication_validation', rule: 'rules/05-publication-validation.md' },
] as const;

export type StageKey = (typeof RESEARCH_STAGES)[number]['key'];

export function nextStage(completed: readonly StageKey[]): (typeof RESEARCH_STAGES)[number] | undefined {
  return RESEARCH_STAGES.find((s) => !completed.includes(s.key));
}

export * from './schemas.ts';
export * from './store.ts';
export * from './inventory.ts';
export * from './jobs.ts';
export * from './chapter.ts';
export * from './sources.ts';
export * from './matching.ts';
export * from './review.ts';
export * from './chronology.ts';
export * from './validate.ts';
export * from './audit.ts';
export * from './dossier.ts';
export * from './export.ts';
export * from './importer.ts';

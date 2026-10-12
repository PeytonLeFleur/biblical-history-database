/** The five research stages (SPEC Part 8). Orchestration, queues and checkpoints are Milestone 3. */
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

import { pgEnum } from 'drizzle-orm/pg-core';
import {
  CONSTRAINT_RELATIONS,
  EVENT_CATEGORIES,
  EVIDENCE_CLASSIFICATIONS,
  LITERARY_CLASSIFICATIONS,
  PUBLICATION_LEVELS,
  RELATIONSHIP_TYPES,
  RESEARCH_PRIORITIES,
  RESEARCH_STATUSES,
  REVIEWER_STATUSES,
  SOURCE_TYPES,
  SYNCHRONISM_TYPES,
  VERIFICATION_LEVELS,
  VERSE_COVERAGE_STATUSES,
} from '@atlas/shared';

// Controlled vocabularies from SPEC Part 7 / 9 / 10 / 12, sourced from @atlas/shared so code and DB never drift.
export const eventCategory = pgEnum('event_category', EVENT_CATEGORIES);
export const literaryClassification = pgEnum('literary_classification', LITERARY_CLASSIFICATIONS);
export const researchPriority = pgEnum('research_priority', RESEARCH_PRIORITIES);
export const researchStatus = pgEnum('research_status', RESEARCH_STATUSES);
export const sourceType = pgEnum('source_type', SOURCE_TYPES);
export const relationshipType = pgEnum('relationship_type', RELATIONSHIP_TYPES);
export const evidenceClassification = pgEnum('evidence_classification', EVIDENCE_CLASSIFICATIONS);
export const reviewerStatus = pgEnum('reviewer_status', REVIEWER_STATUSES);
export const verificationLevel = pgEnum('verification_level', VERIFICATION_LEVELS);
export const verseCoverageStatus = pgEnum('verse_coverage_status', VERSE_COVERAGE_STATUSES);
export const synchronismType = pgEnum('synchronism_type', SYNCHRONISM_TYPES);
export const constraintRelation = pgEnum('constraint_relation', CONSTRAINT_RELATIONS);
export const publicationLevel = pgEnum('publication_level', PUBLICATION_LEVELS);

export const testament = pgEnum('testament', ['OT', 'NT']);
export const knowledgeLayer = pgEnum('knowledge_layer', ['text', 'interpretation', 'reconstruction', 'evidence']);
export const narrativeMode = pgEnum('narrative_mode', [
  'narrated_occurrence', 'reference_to_other_event', 'vision_content', 'prediction', 'hypothetical', 'poetic',
]);
export const datePrecision = pgEnum('date_precision', [
  'day', 'month', 'year', 'regnal_year', 'decade', 'reign', 'generation', 'century', 'period', 'undated',
]);
export const confidence = pgEnum('confidence', ['high', 'medium', 'low', 'speculative']);
export const locationConfidence = pgEnum('location_confidence', ['certain', 'probable', 'possible', 'disputed', 'unknown']);
export const coordinatePrecision = pgEnum('coordinate_precision', ['site', 'settlement', 'approximate_area', 'region']);
export const evidenceStance = pgEnum('evidence_stance', ['supports', 'challenges', 'contextual', 'neutral']);
export const evidenceStrength = pgEnum('evidence_strength', ['direct', 'indirect', 'contextual']);
export const researchStage = pgEnum('research_stage', [
  'scripture_extraction', 'historical_reconstruction', 'external_evidence', 'cross_referencing', 'publication_validation',
]);
export const reviewDecision = pgEnum('review_decision', ['approve', 'reject', 'return']);
export const reviewQueueStatus = pgEnum('review_queue_status', ['open', 'decided', 'returned']);
export const regnalReckoning = pgEnum('regnal_reckoning', ['accession', 'non_accession', 'unknown']);
export const newYearConvention = pgEnum('new_year_convention', ['nisan', 'tishri', 'thoth', 'january', 'other', 'unknown']);
export const interpretiveApproach = pgEnum('interpretive_approach', [
  'preterist', 'futurist', 'historicist', 'idealist', 'mixed', 'not_applicable',
]);

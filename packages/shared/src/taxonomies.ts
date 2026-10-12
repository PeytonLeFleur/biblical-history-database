import { z } from 'zod';

/** Controlled taxonomies — SPEC Parts 5.3, 7, 9, 10, 12.1. Do not extend without updating SPEC-derived standards. */

export const EVENT_CATEGORIES = [
  'political', 'military', 'royal', 'migration', 'construction', 'destruction',
  'natural_disaster', 'environmental', 'astronomical', 'religious', 'social',
  'economic', 'legal', 'birth', 'death', 'genealogical', 'miracle_claim',
  'personal_narrative', 'other',
] as const;
export const EventCategory = z.enum(EVENT_CATEGORIES);
export type EventCategory = z.infer<typeof EventCategory>;

export const LITERARY_CLASSIFICATIONS = [
  'historical_narrative', 'prophetic_oracle', 'apocalyptic_vision', 'poetry',
  'wisdom', 'parable', 'law', 'genealogy', 'epistle', 'gospel_narrative',
  'historical_reference', 'mixed', 'uncertain',
] as const;
export const LiteraryClassification = z.enum(LITERARY_CLASSIFICATIONS);
export type LiteraryClassification = z.infer<typeof LiteraryClassification>;

export const RESEARCH_PRIORITIES = ['critical', 'high', 'medium', 'low', 'background'] as const;
export const ResearchPriority = z.enum(RESEARCH_PRIORITIES);
export type ResearchPriority = z.infer<typeof ResearchPriority>;

export const RESEARCH_STATUSES = [
  'queued', 'extracting', 'context_research', 'external_research',
  'cross_referencing', 'validating', 'needs_review', 'publishable',
  'published', 'blocked',
] as const;
export const ResearchStatus = z.enum(RESEARCH_STATUSES);
export type ResearchStatus = z.infer<typeof ResearchStatus>;

export const SOURCE_TYPES = [
  'ancient_primary_text', 'artifact_record', 'excavation_report',
  'scientific_paper', 'academic_monograph', 'scholarly_commentary',
  'theological_commentary', 'institutional_database', 'museum_catalog',
  'historical_reference', 'news_report', 'popular_summary', 'dataset', 'other',
] as const;
export const SourceType = z.enum(SOURCE_TYPES);
export type SourceType = z.infer<typeof SourceType>;

export const RELATIONSHIP_TYPES = [
  'same_event', 'direct_reference', 'same_person', 'same_location',
  'same_kingdom', 'same_period', 'parent_event', 'child_event', 'preceded_by',
  'followed_by', 'historical_consequence', 'prophecy_reference',
  'proposed_fulfillment', 'genealogical_connection', 'thematic_parallel',
  'artifact_association', 'source_attestation', 'possible_identity',
  'supports', 'contradicts',
] as const;
export const RelationshipType = z.enum(RELATIONSHIP_TYPES);
export type RelationshipType = z.infer<typeof RelationshipType>;

export const EVIDENCE_CLASSIFICATIONS = [
  'independently_corroborated', 'strongly_supported', 'historically_plausible',
  'disputed', 'no_independent_corroboration_found',
  'contradicted_by_available_evidence', 'not_empirically_testable',
] as const;
export const EvidenceClassification = z.enum(EVIDENCE_CLASSIFICATIONS);
export type EvidenceClassification = z.infer<typeof EvidenceClassification>;

export const REVIEWER_STATUSES = ['machine_proposed', 'human_approved', 'human_rejected', 'requires_review'] as const;
export const ReviewerStatus = z.enum(REVIEWER_STATUSES);
export type ReviewerStatus = z.infer<typeof ReviewerStatus>;

export const VERIFICATION_LEVELS = [
  'discovered', 'metadata_verified', 'source_accessed', 'claim_checked', 'human_reviewed',
] as const;
export const VerificationLevel = z.enum(VERIFICATION_LEVELS);
export type VerificationLevel = z.infer<typeof VerificationLevel>;

export const VERSE_COVERAGE_STATUSES = [
  'not_reviewed', 'reviewed_no_candidate', 'reviewed_with_candidate', 'needs_recheck', 'blocked',
] as const;
export const VerseCoverageStatus = z.enum(VERSE_COVERAGE_STATUSES);
export type VerseCoverageStatus = z.infer<typeof VerseCoverageStatus>;

export const SYNCHRONISM_TYPES = [
  'direct_contemporary_identification', 'reign_synchronization',
  'documentary_correlation', 'astronomical_anchor', 'calendar_anchor',
  'archaeological_correlation', 'inferred_synchronization',
] as const;
export const SynchronismType = z.enum(SYNCHRONISM_TYPES);
export type SynchronismType = z.infer<typeof SynchronismType>;

export const CONSTRAINT_RELATIONS = [
  'before', 'after', 'during', 'same_year', 'same_approximate_period',
  'begins_after', 'ends_before', 'overlaps', 'immediately_follows',
  'days_later', 'months_later', 'years_later', 'years_earlier',
  'within_reign', 'in_regnal_year', 'within_dated_range',
] as const;
export const ConstraintRelation = z.enum(CONSTRAINT_RELATIONS);
export type ConstraintRelation = z.infer<typeof ConstraintRelation>;

export const PUBLICATION_LEVELS = ['unpublished', 'preliminary', 'researched', 'human_reviewed'] as const;
export const PublicationLevel = z.enum(PUBLICATION_LEVELS);
export type PublicationLevel = z.infer<typeof PublicationLevel>;

/** SPEC 9.3: automatic human-review triggers. */
export function requiresHumanReview(input: {
  priority?: ResearchPriority;
  classification?: EvidenceClassification;
  entityMergeOrSplit?: boolean;
  fulfillmentProposedOrRevised?: boolean;
  publishedIdentificationChanged?: boolean;
  primarySourcesConflict?: boolean;
  authenticityUnresolvedAffectsPublication?: boolean;
}): boolean {
  return (
    input.priority === 'critical' ||
    input.classification === 'disputed' ||
    input.classification === 'contradicted_by_available_evidence' ||
    input.entityMergeOrSplit === true ||
    input.fulfillmentProposedOrRevised === true ||
    input.publishedIdentificationChanged === true ||
    input.primarySourcesConflict === true ||
    input.authenticityUnresolvedAffectsPublication === true
  );
}

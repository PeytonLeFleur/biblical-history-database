/**
 * Zod schemas for every research file defined in rules/00–05. The rule files are authoritative;
 * if a rule and a schema disagree, fix the schema.
 */
import { z } from 'zod';
import {
  ConstraintRelation,
  EventCategory,
  EvidenceClassification,
  LiteraryClassification,
  PublicationLevel,
  RelationshipType,
  ResearchPriority,
  ResearchStatus,
  ReviewerStatus,
  SourceType,
  SynchronismType,
  VerificationLevel,
  VerseCoverageStatus,
} from '@atlas/shared';

const prefixed = (p: string) => z.string().regex(new RegExp(`^${p}_[0-9A-HJKMNP-TV-Z]{26}$`), `expected ${p}_<ULID>`);
const osisVerse = z.string().regex(/^[1-3]?[A-Za-z]+\.\d+\.\d+$/);
const osisPassage = z.string().regex(/^[1-3]?[A-Za-z]+\.\d+\.\d+(-[1-3]?[A-Za-z]+\.\d+\.\d+)?$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const astroYear = z.number().int().nullable();

export const Ids = {
  event: prefixed('evt'), person: prefixed('per'), location: prefixed('loc'), source: prefixed('src'),
  claim: prefixed('clm'), artifact: prefixed('art'), synchronism: prefixed('syn'), model: prefixed('chr'),
  kingdom: prefixed('kgd'), reign: prefixed('rgn'), constraint: prefixed('cst'), dateHypothesis: prefixed('dth'),
  evidence: prefixed('evd'), relationship: prefixed('rel'), candidate: prefixed('cnd'), job: prefixed('job'),
  review: prefixed('rev'), locationHypothesis: prefixed('lhy'), site: prefixed('sit'), document: prefixed('doc'),
  prophecy: prefixed('pro'), vision: prefixed('vis'), fulfillment: prefixed('ful'), calendar: prefixed('cal'),
  regnalConvention: prefixed('rcv'), dynasty: prefixed('dyn'),
};

export const Layer = z.enum(['text', 'interpretation', 'reconstruction', 'evidence']);
export const RecordType = z.enum([
  'event', 'vision', 'prophecy', 'parable', 'law', 'genealogy', 'literary_imagery', 'ongoing_practice',
  'historical_reference', 'teaching', 'theological_interpretation',
]);
export const NarrativeMode = z.enum([
  'narrated_occurrence', 'reference_to_other_event', 'vision_content', 'prediction', 'hypothetical', 'poetic',
  'literary_history', // questions about the text itself (authorship, composition, date) — not an event narrated in it
]);
export const Precision = z.enum(['day', 'month', 'year', 'regnal_year', 'decade', 'reign', 'generation', 'century', 'period', 'undated']);
export const Confidence = z.enum(['high', 'medium', 'low', 'speculative']);
export const LocationConfidence = z.enum(['certain', 'probable', 'possible', 'disputed', 'unknown']);
export const StageStatus = z.enum(['not_started', 'in_progress', 'complete', 'not_applicable', 'blocked']);
export const StageKey = z.enum([
  'scripture_extraction', 'historical_reconstruction', 'external_evidence', 'cross_referencing', 'publication_validation',
]);

const fileStatus = {
  status: z.enum(['in_progress', 'complete']),
  resume_from: z.string().nullable().default(null),
};

// ─── Rule 01 ────────────────────────────────────────────────────────────────

export const VerseCoverageRow = z.object({
  ref: osisVerse,
  status: VerseCoverageStatus,
  candidate_ids: z.array(Ids.candidate).default([]),
  notes: z.string().nullable().default(null),
});

export const EntityMention = z.object({
  name_as_written: z.string().min(1),
  matched_entity_id: z.string().nullable().default(null),
  proposed_new_entity: z.boolean().default(false),
});

export const Candidate = z
  .object({
    id: Ids.candidate,
    title: z.string().min(1),
    passage: osisPassage,
    description: z.string().min(1),
    record_type: RecordType,
    literary_classification: LiteraryClassification,
    narrative_mode: NarrativeMode,
    event_categories: z.array(EventCategory).default([]),
    parent_candidate_id: Ids.candidate.nullable().default(null),
    participants: z.array(EntityMention).default([]),
    locations: z.array(EntityMention).default([]),
    temporal_statements: z.array(z.object({ ref: osisVerse, phrase: z.string(), kind: z.enum(['absolute', 'relative', 'regnal', 'vague']) })).default([]),
    related_passages: z.array(osisPassage).default([]),
    research_priority: ResearchPriority,
    ambiguities: z.array(z.string()).default([]),
    job_id: Ids.job.nullable().default(null),
    event_id: Ids.event.nullable().default(null),
  })
  .superRefine((c, ctx) => {
    if (c.record_type === 'event' && c.event_categories.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'events require at least one event category', path: ['event_categories'] });
    }
    if ((c.record_type === 'vision' || c.record_type === 'prophecy') && c.narrative_mode === 'narrated_occurrence') {
      ctx.addIssue({ code: 'custom', message: 'vision/prophecy records cannot be narrated occurrences', path: ['narrative_mode'] });
    }
    for (const m of [...c.participants, ...c.locations]) {
      if (!m.matched_entity_id && !m.proposed_new_entity) {
        ctx.addIssue({ code: 'custom', message: `"${m.name_as_written}" must be matched or proposed as new`, path: ['participants'] });
      }
    }
  });
export type Candidate = z.infer<typeof Candidate>;

export const ChapterExtraction = z.object({
  book: z.string(),
  chapter: z.number().int().positive(),
  ...fileStatus,
  text_edition: z.string(),
  verse_coverage: z.array(VerseCoverageRow),
  candidates: z.array(Candidate).default([]),
  session_log: z.string().nullable().default(null),
});
export type ChapterExtraction = z.infer<typeof ChapterExtraction>;

// ─── Event record (promoted candidate) ───────────────────────────────────────

export const StageRecord = z.object({
  status: StageStatus,
  updated: isoDate.nullable().default(null),
  reason: z.string().nullable().default(null), // required for not_applicable / blocked
});

export const EventRecord = z.object({
  id: Ids.event,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  is_fixture: z.boolean().default(false),
  candidate_ids: z.array(Ids.candidate).default([]),
  external_reason: z.string().nullable().default(null),
  /** Events are instantaneous for chronology unless they span a period (e.g. a reign, a siege, a ministry). */
  is_period: z.boolean().default(false),
  literary_classification: LiteraryClassification,
  narrative_mode: NarrativeMode,
  categories: z.array(EventCategory).min(1),
  priority: ResearchPriority,
  research_status: ResearchStatus,
  publication_level: PublicationLevel.default('unpublished'),
  parent_event_id: Ids.event.nullable().default(null),
  mentions: z.array(z.object({ passage: osisPassage, mention_type: z.enum(['narration', 'reference', 'parallel_account', 'superscription']), notes: z.string().nullable().default(null) })).min(1),
  stages: z.object({
    scripture_extraction: StageRecord,
    historical_reconstruction: StageRecord,
    external_evidence: StageRecord,
    cross_referencing: StageRecord,
    publication_validation: StageRecord,
  }),
  revision: z.number().int().positive().default(1),
  created_at: isoDate,
  updated_at: isoDate,
  last_reviewed_at: isoDate.nullable().default(null),
});
export type EventRecord = z.infer<typeof EventRecord>;

// ─── Sources (research/sources/src_*.json) ───────────────────────────────────

export const SourceFile = z.object({
  id: Ids.source,
  title: z.string().min(1),
  source_type: SourceType,
  authors: z.array(z.string()).default([]),
  publisher: z.string().nullable().default(null),
  journal: z.string().nullable().default(null),
  published_date: z.string().nullable().default(null),
  url: z.url().nullable().default(null),
  doi: z.string().nullable().default(null),
  isbn: z.string().nullable().default(null),
  standard_reference: z.string().nullable().default(null),
  license: z.string().nullable().default(null),
  verification_level: VerificationLevel,
  verification_log: z.array(z.object({ level: VerificationLevel, date: isoDate, method: z.string().min(1), notes: z.string().nullable().default(null) })).min(1),
  accessed_at: isoDate.nullable().default(null),
  access_notes: z.string().nullable().default(null),
  reports_on_source_id: Ids.source.nullable().default(null), // for news reports
  outlet: z.string().nullable().default(null),
  retraction_status: z.enum(['retracted', 'corrected']).nullable().default(null),
  is_fixture: z.boolean().default(false),
});
export type SourceFile = z.infer<typeof SourceFile>;

const citations = z.array(Ids.source).default([]);

// ─── Rule 02 ────────────────────────────────────────────────────────────────

export const ConstraintRecord = z.object({
  id: Ids.constraint,
  subject: z.string(),
  object: z.string(),
  relation: ConstraintRelation,
  textual_assertion: z.string().min(1),
  passage: osisPassage.nullable().default(null),
  offset: z.object({ min: z.number(), max: z.number() }).nullable().default(null),
  unit: z.enum(['days', 'months', 'years']).nullable().default(null),
  regnal_year: z.number().int().nullable().default(null),
  /** Reckoning used by this text's author, which may differ from other texts about the same reign (SPEC 12.4). */
  regnal_convention: z.object({ reckoning: z.enum(['accession', 'non_accession']), new_year: z.enum(['nisan', 'tishri', 'january']) }).nullable().default(null),
  precision: Precision,
  model_id: Ids.model.nullable().default(null),
  alternative_group: z.string().nullable().default(null),
  assumptions: z.array(z.string()).default([]),
  citations,
  verification: z.enum(['text_direct', 'source_checked', 'operator_inference']),
}).superRefine((c, ctx) => {
  const needsOffset = ['days_later', 'months_later', 'years_later', 'years_earlier'].includes(c.relation);
  if (needsOffset && (!c.offset || !c.unit)) ctx.addIssue({ code: 'custom', message: `${c.relation} requires offset and unit` });
  if (!needsOffset && c.offset) ctx.addIssue({ code: 'custom', message: `${c.relation} must not carry a numeric offset` });
  if (c.relation === 'in_regnal_year' && c.regnal_year === null) ctx.addIssue({ code: 'custom', message: 'in_regnal_year requires regnal_year' });
});

export const DateHypothesisRecord = z.object({
  id: Ids.dateHypothesis,
  model_id: Ids.model.nullable(),
  interval: z.object({ earliest: astroYear, latest: astroYear }),
  precision: Precision,
  derivation: z.string().min(1),
  original_expression: z.string().nullable().default(null),
  citations,
}).refine((d) => d.interval.earliest === null || d.interval.latest === null || d.interval.earliest <= d.interval.latest, 'earliest > latest');

export const ContextDossier = z.object({
  event_id: Ids.event,
  ...fileStatus,
  text_summary: z.object({ layer: z.literal('text'), body: z.string().min(1), passage: osisPassage }),
  setting: z.object({ period: z.string(), body: z.string(), citations }),
  rulers: z.array(z.object({ person_id: Ids.person, reign_id: Ids.reign.nullable().default(null), role: z.string(), citations })).default([]),
  kingdoms: z.array(Ids.kingdom).default([]),
  constraints: z.array(ConstraintRecord).default([]),
  synchronisms: z.array(z.object({ id: Ids.synchronism, type: SynchronismType, direct: z.boolean(), via: z.string().nullable().default(null), citations })).default([]),
  date_hypotheses: z.array(DateHypothesisRecord).default([]),
  locations: z.array(z.object({ location_id: Ids.location, role: z.string(), hypotheses: z.array(Ids.locationHypothesis).default([]), confidence: LocationConfidence })).default([]),
  terminology: z.array(z.object({ term: z.string(), gloss: z.string(), citations })).default([]),
  competing_reconstructions: z.array(z.object({ label: z.string(), proponents: z.array(z.string()), summary: z.string(), citations })).default([]),
  commentary: z.array(z.object({ source_id: Ids.source, layer: z.literal('interpretation'), paraphrase: z.string().min(1), url: z.url().nullable().default(null), accessed: isoDate.nullable().default(null) })).default([]),
  open_questions: z.array(z.string()).default([]),
  not_applicable: z.record(z.string(), z.string()).default({}),
});
export type ContextDossier = z.infer<typeof ContextDossier>;

// ─── Rule 03 ────────────────────────────────────────────────────────────────

export const ClaimRecord = z.object({
  id: Ids.claim,
  statement: z.string().min(1),
  layer: Layer,
  passage: osisPassage.nullable().default(null),
  classification: EvidenceClassification,
  reasoning: z.string().min(1),
  supporting_evidence: z.array(Ids.evidence).default([]),
  counterevidence: z.array(Ids.evidence).default([]),
  contextual_evidence: z.array(Ids.evidence).default([]),
  limitations: z.array(z.string()).default([]),
  reviewer_status: ReviewerStatus,
  review_required: z.boolean(),
  research_date: isoDate,
});
export type ClaimRecord = z.infer<typeof ClaimRecord>;

export const EvidenceRecord = z.object({
  id: Ids.evidence,
  claim_ids: z.array(Ids.claim).min(1),
  source_id: Ids.source,
  stance: z.enum(['supports', 'challenges', 'contextual', 'neutral']),
  strength: z.enum(['direct', 'indirect', 'contextual']),
  finding: z.string().min(1),
  locator: z.string().nullable().default(null),
  proposed_connection_by: z.enum(['author', 'other_scholar', 'operator', 'not_applicable']),
  competing_explanations: z.array(z.string()).default([]),
  criticism: z.array(z.object({ source_id: Ids.source, summary: z.string() })).default([]),
  limitations: z.array(z.string()).default([]),
  independent_line: z.string().min(1),
});
export type EvidenceRecord = z.infer<typeof EvidenceRecord>;

export const EvidenceDossier = z.object({
  event_id: Ids.event,
  ...fileStatus,
  search_log: z.array(z.object({ date: isoDate, query: z.string().min(1), engine: z.string(), useful_results: z.number().int().nonnegative(), notes: z.string().nullable().default(null) })).default([]),
  domains: z.record(z.string(), z.object({ searched: z.boolean(), not_applicable_reason: z.string().nullable().default(null) })).default({}),
  claims: z.array(ClaimRecord).default([]),
  evidence: z.array(EvidenceRecord).default([]),
  artifacts: z.array(Ids.artifact).default([]),
  sites: z.array(Ids.site).default([]),
  documents: z.array(Ids.document).default([]),
  research_gaps: z.array(z.string()).default([]),
});
export type EvidenceDossier = z.infer<typeof EvidenceDossier>;

// ─── Rule 04 ────────────────────────────────────────────────────────────────

const Endpoint = z.union([
  z.object({ kind: z.literal('passage'), ref: osisPassage }),
  z.object({ kind: z.enum(['event', 'person', 'place', 'kingdom', 'prophecy', 'vision', 'artifact', 'document', 'reign']), id: z.string() }),
]);

export const RelationshipRecord = z.object({
  id: Ids.relationship,
  type: RelationshipType,
  from: Endpoint,
  to: Endpoint,
  confidence: Confidence,
  layer: Layer,
  rationale: z.string().min(1),
  provenance: z.object({ method: z.enum(['text_reading', 'dataset_lead_verified', 'source_cited', 'operator_inference']), dataset: z.string().nullable().default(null), citations }),
  interpretive_approach: z.enum(['preterist', 'futurist', 'historicist', 'idealist', 'mixed']).nullable().default(null),
  proposed_by: z.string().nullable().default(null),
  target_research_state: z.enum(['researched', 'in_progress', 'unresearched']).default('unresearched'),
  review_required: z.boolean().default(false),
}).superRefine((r, ctx) => {
  if ((r.type === 'proposed_fulfillment' || r.type === 'prophecy_reference') && (!r.interpretive_approach || !r.proposed_by)) {
    ctx.addIssue({ code: 'custom', message: `${r.type} requires interpretive_approach and proposed_by` });
  }
});
export type RelationshipRecord = z.infer<typeof RelationshipRecord>;

export const CrossrefDossier = z.object({
  event_id: Ids.event,
  ...fileStatus,
  name_searches: z.array(z.object({ name: z.string(), books_searched: z.number().int(), hits: z.array(osisVerse) })).default([]),
  relationships: z.array(RelationshipRecord).default([]),
  entity_resolutions: z.array(z.object({ name_as_written: z.string(), resolved_to: z.string(), basis: z.string(), confidence: Confidence })).default([]),
  new_constraints: z.array(Ids.constraint).default([]),
});
export type CrossrefDossier = z.infer<typeof CrossrefDossier>;

// ─── Rule 05 ────────────────────────────────────────────────────────────────

export const ValidationResult = z.object({
  event_id: Ids.event,
  revision: z.number().int().positive(),
  validated_at: isoDate,
  checks: z.array(z.object({ name: z.string(), passed: z.boolean(), details: z.array(z.string()) })),
  publication_level: PublicationLevel,
  open_reviews: z.array(Ids.review).default([]),
  research_gaps: z.array(z.string()).default([]),
  disputes: z.array(z.string()).default([]),
  export_eligible: z.boolean(),
});
export type ValidationResult = z.infer<typeof ValidationResult>;

// ─── Jobs & reviews ─────────────────────────────────────────────────────────

export const ResearchJob = z.object({
  id: Ids.job,
  subject_kind: z.enum(['book', 'chapter', 'candidate', 'event']),
  subject_id: z.string(),
  book: z.string().nullable().default(null),
  chapter: z.number().int().nullable().default(null),
  stage: StageKey,
  status: ResearchStatus,
  priority: ResearchPriority,
  checkpoint: z.object({
    note: z.string().nullable().default(null),
    resume_from: z.string().nullable().default(null),
    files: z.array(z.string()).default([]),
  }).default({ note: null, resume_from: null, files: [] }),
  attempts: z.array(z.object({ stage: StageKey, started: z.string(), ended: z.string().nullable().default(null), outcome: z.enum(['completed', 'interrupted', 'blocked']).nullable().default(null), notes: z.string().nullable().default(null) })).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  is_fixture: z.boolean().default(false),
});
export type ResearchJob = z.infer<typeof ResearchJob>;

export const ReviewItem = z.object({
  id: Ids.review,
  record_kind: z.string(),
  record_id: z.string(),
  record_revision: z.number().int().positive(),
  reason: z.string().min(1),
  triggers: z.array(z.string()).default([]),
  status: z.enum(['open', 'decided', 'returned']),
  created_at: z.string(),
  decisions: z.array(z.object({
    decision: z.enum(['approve', 'reject', 'return']),
    reviewer: z.string().min(1),
    decided_at: z.string(),
    record_revision: z.number().int().positive(),
    rationale: z.string().nullable().default(null),
  })).default([]),
  is_fixture: z.boolean().default(false),
});
export type ReviewItem = z.infer<typeof ReviewItem>;

// ─── Global entities (research/entities/<id>.json) ───────────────────────────

const entityBase = {
  slug: z.string().regex(/^[a-z0-9-]+$/),
  is_fixture: z.boolean().default(false),
  revision: z.number().int().positive().default(1),
  citations,
  notes: z.string().nullable().default(null),
};

export const PersonEntity = z.object({
  kind: z.literal('person'), id: Ids.person, ...entityBase,
  canonical_name: z.string().min(1),
  aliases: z.array(z.object({ alias: z.string(), language: z.string().nullable().default(null), source_id: Ids.source.nullable().default(null), passage: osisPassage.nullable().default(null) })).default([]),
  description: z.string().nullable().default(null),
  kingdom_id: Ids.kingdom.nullable().default(null),
});

export const KingdomEntity = z.object({
  kind: z.literal('kingdom'), id: Ids.kingdom, ...entityBase,
  name: z.string().min(1),
  description: z.string().nullable().default(null),
});

export const LocationHypothesis = z.object({
  id: Ids.locationHypothesis,
  label: z.string(),
  lat: z.number().min(-90).max(90).nullable().default(null),
  lon: z.number().min(-180).max(180).nullable().default(null),
  coordinate_precision: z.enum(['site', 'settlement', 'approximate_area', 'region']).nullable().default(null),
  confidence: LocationConfidence,
  geom_source_id: Ids.source.nullable().default(null),
  proponents: z.array(z.string()).default([]),
  reasoning: z.string().nullable().default(null),
}).refine((h) => (h.lat === null) === (h.lon === null), 'lat and lon must both be set or both null')
  .refine((h) => h.lat === null || h.geom_source_id !== null, 'coordinates require a geom_source_id (never invent coordinates)');

export const PlaceEntity = z.object({
  kind: z.literal('place'), id: Ids.location, ...entityBase,
  primary_name: z.string().min(1),
  place_type: z.string().nullable().default(null),
  modern_name: z.string().nullable().default(null),
  modern_country: z.string().nullable().default(null),
  kingdom_id: Ids.kingdom.nullable().default(null),
  ancient_names: z.array(z.object({ name: z.string(), language: z.string().nullable().default(null), period: z.string().nullable().default(null), source_id: Ids.source.nullable().default(null) })).default([]),
  hypotheses: z.array(LocationHypothesis).default([]),
  description: z.string().nullable().default(null),
});

export const ReignEntity = z.object({
  kind: z.literal('reign'), id: Ids.reign, ...entityBase,
  person_id: Ids.person,
  kingdom_id: Ids.kingdom,
  model_id: Ids.model.nullable().default(null),
  title: z.string().nullable().default(null),
  start: z.object({ earliest: astroYear, latest: astroYear }),
  end: z.object({ earliest: astroYear, latest: astroYear }),
  precision: Precision,
  is_coregency: z.boolean().default(false),
  coregent_with_reign_id: Ids.reign.nullable().default(null),
  predecessor_reign_id: Ids.reign.nullable().default(null),
  stated_length_years: z.number().int().nullable().default(null),
  stated_length_passage: osisPassage.nullable().default(null),
  regnal_convention: z.object({
    reckoning: z.enum(['accession', 'non_accession']),
    new_year: z.enum(['nisan', 'tishri', 'january']),
    alternative_group: z.string().nullable().default(null),
    citations,
  }).nullable().default(null),
});

export const ModelEntity = z.object({
  kind: z.literal('chronology_model'), id: Ids.model, ...entityBase,
  name: z.string().min(1),
  scope: z.string(),
  textual_tradition: z.string().nullable().default(null),
  is_absolute_axis: z.boolean().default(true),
  description: z.string().nullable().default(null),
});

export const SiteEntity = z.object({
  kind: z.literal('site'), id: Ids.site, ...entityBase,
  name: z.string().min(1),
  place_id: Ids.location.nullable().default(null),
  lat: z.number().min(-90).max(90).nullable().default(null),
  lon: z.number().min(-180).max(180).nullable().default(null),
  geom_source_id: Ids.source.nullable().default(null),
  description: z.string().nullable().default(null),
}).refine((s) => s.lat === null || s.geom_source_id !== null, 'coordinates require a geom_source_id');

const yearRange = z.object({ earliest: astroYear, latest: astroYear });
const Approach = z.enum(['preterist', 'futurist', 'historicist', 'idealist', 'mixed']);

/** An interpretation of a vision or prophecy (SPEC 5.5, 6.3). Proposed fulfillments always require owner review (SPEC 9.3 #5). */
export const Interpretation = z.object({
  id: Ids.fulfillment,
  label: z.string().min(1),
  approach: Approach,
  framework: z.string().nullable().default(null), // e.g. "historical-critical", "dispensational", "amillennial", "traditional Christian"
  proponents: z.array(z.string()).min(1),
  summary: z.string().min(1),
  referents: z.array(z.object({ symbol: z.string(), referent: z.string() })).default([]),
  linked_events: z.array(Ids.event).default([]),
  is_proposed_fulfillment: z.boolean(),
  citations,
  reviewer_status: ReviewerStatus.default('machine_proposed'),
});

export const SynchronismEntity = z.object({
  kind: z.literal('synchronism'), id: Ids.synchronism, ...entityBase,
  title: z.string().min(1),
  type: SynchronismType,
  passage: osisPassage.nullable().default(null),
  biblical_subject: z.string().nullable().default(null), // event / person / reign id
  external_entity: z.string().min(1),
  external_document_id: Ids.document.nullable().default(null),
  external_source_id: Ids.source.nullable().default(null),
  proposed_synchronization: z.string().min(1),
  independent_date: yearRange,
  precision: Precision,
  dating_method: z.string().min(1),
  direct: z.boolean(),
  via: z.string().nullable().default(null),
  assumptions: z.array(z.string()).default([]),
  evidence_strength: z.enum(['strong', 'moderate', 'weak']),
  competing_interpretations: z.array(z.object({ label: z.string(), summary: z.string(), citations })).default([]),
  /** When set, the independent date anchors this subject in the chronology solver as external evidence. */
  anchor_subject: z.string().nullable().default(null),
  reviewer_status: ReviewerStatus.default('machine_proposed'),
});

export const ArtifactEntity = z.object({
  kind: z.literal('artifact'), id: Ids.artifact, ...entityBase,
  name: z.string().min(1),
  artifact_type: z.string(),
  findspot_site_id: Ids.site.nullable().default(null),
  findspot_description: z.string().nullable().default(null),
  current_institution: z.string().nullable().default(null),
  accession_number: z.string().nullable().default(null),
  date: yearRange.default({ earliest: null, latest: null }),
  description: z.string().nullable().default(null),
  image: z.object({ url: z.url(), license: z.string(), attribution: z.string() }).nullable().default(null),
  institution_url: z.url().nullable().default(null),
}).refine((a) => !a.image || /public domain|cc0/i.test(a.image.license), 'locally displayed images must be public domain or CC0 (SPEC 15.5)');

export const DocumentEntity = z.object({
  kind: z.literal('document'), id: Ids.document, ...entityBase,
  name: z.string().min(1),
  document_type: z.string(),
  language: z.string().nullable().default(null),
  standard_reference: z.string().nullable().default(null),
  artifact_id: Ids.artifact.nullable().default(null),
  date: yearRange.default({ earliest: null, latest: null }),
  description: z.string().nullable().default(null),
  editions: z.array(Ids.source).default([]), // translations / editions consulted
});

export const VisionEntity = z.object({
  kind: z.literal('vision'), id: Ids.vision, ...entityBase,
  title: z.string().min(1),
  passage: osisPassage,
  recipient_id: Ids.person.nullable().default(null),
  experience_event_id: Ids.event.nullable().default(null), // the narrated act of seeing the vision
  symbols: z.array(z.object({ symbol: z.string(), description: z.string(), passage: osisPassage, in_text_interpretation: z.string().nullable().default(null) })).default([]),
  description: z.string().nullable().default(null),
});

export const ProphecyEntity = z.object({
  kind: z.literal('prophecy'), id: Ids.prophecy, ...entityBase,
  title: z.string().min(1),
  passage: osisPassage,
  speaker: z.string().nullable().default(null),
  vision_id: Ids.vision.nullable().default(null),
  description: z.string().min(1),
  in_text_interpretation: z.string().nullable().default(null), // identifications the text itself makes (layer: text)
  interpretations: z.array(Interpretation).default([]),
});

export const Entity = z.union([
  PersonEntity, KingdomEntity, PlaceEntity, ReignEntity, ModelEntity, SiteEntity,
  SynchronismEntity, ArtifactEntity, DocumentEntity, VisionEntity, ProphecyEntity,
]);
export type Entity = z.infer<typeof Entity>;

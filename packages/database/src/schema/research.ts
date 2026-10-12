import { sql } from 'drizzle-orm';
import { boolean, date, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { id, recordColumns } from './common.ts';
import {
  confidence,
  evidenceClassification,
  evidenceStance,
  evidenceStrength,
  interpretiveApproach,
  knowledgeLayer,
  publicationLevel,
  relationshipType,
  researchPriority,
  researchStage,
  researchStatus,
  reviewDecision,
  reviewerStatus,
  reviewQueueStatus,
} from './enums.ts';
import { events, sources } from './entities.ts';
import { books, passageRefs } from './scripture.ts';

// ─── Claims & evidence (SPEC 11 #32–34, Part 9) ─────────────────────────────────

export const claims = pgTable('claims', {
  id: id(),
  statement: text('statement').notNull(),
  layer: knowledgeLayer('layer').notNull(),
  eventId: text('event_id').references(() => events.id),
  passageId: text('passage_id').references(() => passageRefs.id),
  classification: evidenceClassification('classification'),
  reasoning: text('reasoning'),
  limitations: text('limitations').array().notNull().default(sql`'{}'::text[]`),
  reviewerStatus: reviewerStatus('reviewer_status').notNull().default('machine_proposed'),
  reviewRequired: boolean('review_required').notNull().default(false),
  researchDate: date('research_date'),
  ...recordColumns(),
});

export const evidenceFindings = pgTable('evidence_findings', {
  id: id(),
  sourceId: text('source_id').notNull().references(() => sources.id),
  finding: text('finding').notNull(),
  locator: text('locator'),
  stance: evidenceStance('stance').notNull(),
  strength: evidenceStrength('strength').notNull(),
  proposedConnectionBy: text('proposed_connection_by'), // author | other_scholar | operator
  competingExplanations: text('competing_explanations').array().notNull().default(sql`'{}'::text[]`),
  limitations: text('limitations').array().notNull().default(sql`'{}'::text[]`),
  independentLine: text('independent_line').notNull(), // dedupes multiple reports of one finding
  ...recordColumns(),
});

export const claimEvidence = pgTable(
  'claim_evidence',
  {
    claimId: text('claim_id').notNull().references(() => claims.id),
    evidenceId: text('evidence_id').notNull().references(() => evidenceFindings.id),
    role: text('role').notNull(), // supporting | counter | contextual
  },
  (t) => [primaryKey({ columns: [t.claimId, t.evidenceId] })],
);

// ─── Relationships (SPEC 11 #35–36, Part 7.6) ───────────────────────────────────

export const biblicalCrossReferences = pgTable(
  'biblical_cross_references',
  {
    id: id(),
    fromPassageId: text('from_passage_id').notNull().references(() => passageRefs.id),
    toPassageId: text('to_passage_id').notNull().references(() => passageRefs.id),
    type: relationshipType('type').notNull(),
    confidence: confidence('confidence').notNull(),
    rationale: text('rationale'),
    dataset: text('dataset'), // e.g. "openbible.info" — a lead, never a conclusion by itself
    provenance: jsonb('provenance').notNull().default(sql`'{}'::jsonb`),
    ...recordColumns(),
  },
  (t) => [unique().on(t.fromPassageId, t.toPassageId, t.type)],
);

export const historicalRelationships = pgTable(
  'historical_relationships',
  {
    id: id(),
    type: relationshipType('type').notNull(),
    fromKind: text('from_kind').notNull(),
    fromId: text('from_id').notNull(),
    toKind: text('to_kind').notNull(),
    toId: text('to_id').notNull(),
    confidence: confidence('confidence').notNull(),
    layer: knowledgeLayer('layer').notNull(),
    rationale: text('rationale').notNull(),
    provenance: jsonb('provenance').notNull().default(sql`'{}'::jsonb`),
    interpretiveApproach: interpretiveApproach('interpretive_approach'),
    proposedBy: text('proposed_by'),
    reviewRequired: boolean('review_required').notNull().default(false),
    ...recordColumns(),
  },
  (t) => [index('hist_rel_from').on(t.fromKind, t.fromId), index('hist_rel_to').on(t.toKind, t.toId)],
);

// ─── Research workflow (SPEC 11 #37–39) ─────────────────────────────────────────

export const researchJobs = pgTable(
  'research_jobs',
  {
    id: id(),
    subjectKind: text('subject_kind').notNull(), // book | chapter | candidate | event
    subjectId: text('subject_id').notNull(),
    book: text('book').references(() => books.osis),
    chapter: integer('chapter'),
    stage: researchStage('stage').notNull(),
    status: researchStatus('status').notNull().default('queued'),
    priority: researchPriority('priority').notNull(),
    checkpoint: jsonb('checkpoint').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    isFixture: boolean('is_fixture').notNull().default(false),
  },
  (t) => [index('research_jobs_status').on(t.status, t.priority)],
);

export const researchAttempts = pgTable('research_attempts', {
  id: id(),
  jobId: text('job_id').notNull().references(() => researchJobs.id),
  stage: researchStage('stage').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  outcome: text('outcome'), // completed | interrupted | blocked
  notes: text('notes'),
  sessionLog: text('session_log'),
});

export const researchLogs = pgTable('research_logs', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').references(() => researchJobs.id),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  kind: text('kind').notNull(), // query | source_examined | note | dead_end
  body: text('body').notNull(),
  data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
});

// ─── Review & publication (SPEC 11 #41–44, Parts 9.4, 16) ───────────────────────

export const reviewQueue = pgTable('review_queue', {
  id: id(),
  recordKind: text('record_kind').notNull(),
  recordId: text('record_id').notNull(),
  recordRevision: integer('record_revision').notNull(),
  reason: text('reason').notNull(),
  triggers: text('triggers').array().notNull().default(sql`'{}'::text[]`),
  status: reviewQueueStatus('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  isFixture: boolean('is_fixture').notNull().default(false),
});

export const reviewDecisions = pgTable('review_decisions', {
  id: serial('id').primaryKey(),
  reviewId: text('review_id').notNull().references(() => reviewQueue.id),
  decision: reviewDecision('decision').notNull(),
  reviewer: text('reviewer').notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
  recordRevision: integer('record_revision').notNull(),
  rationale: text('rationale'),
});

export const publicationStatus = pgTable(
  'publication_status',
  {
    recordKind: text('record_kind').notNull(),
    recordId: text('record_id').notNull(),
    level: publicationLevel('level').notNull(),
    revision: integer('revision').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    humanReviewDecisionId: integer('human_review_decision_id').references(() => reviewDecisions.id),
  },
  (t) => [primaryKey({ columns: [t.recordKind, t.recordId] })],
);

export const revisionHistory = pgTable(
  'revision_history',
  {
    id: serial('id').primaryKey(),
    recordKind: text('record_kind').notNull(),
    recordId: text('record_id').notNull(),
    revision: integer('revision').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBy: text('changed_by').notNull(),
    changeSummary: text('change_summary').notNull(),
    snapshot: jsonb('snapshot').notNull(),
  },
  (t) => [unique().on(t.recordKind, t.recordId, t.revision)],
);


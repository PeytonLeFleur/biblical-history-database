import { sql } from 'drizzle-orm';
import { type AnyPgColumn, boolean, index, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { id, recordColumns, slug } from './common.ts';
import {
  constraintRelation,
  datePrecision,
  newYearConvention,
  regnalReckoning,
  reviewerStatus,
  synchronismType,
} from './enums.ts';
import { kingdoms, people, sources } from './entities.ts';
import { passageRefs } from './scripture.ts';

// SPEC 11 #16–22 and Part 12. All years are astronomical (1 BC = 0). Null bounds are open.

export const chronologyModels = pgTable('chronology_models', {
  id: id(),
  slug: slug(),
  name: text('name').notNull(),
  scope: text('scope').notNull(), // e.g. "divided_monarchy", "genesis_genealogies", "nt_chronology"
  textualTradition: text('textual_tradition'), // e.g. "Masoretic", "Septuagint", "Samaritan"
  description: text('description'),
  isAbsoluteAxis: boolean('is_absolute_axis').notNull().default(true), // false = biblical-internal band (SPEC 12.6)
  sourceId: text('source_id').references(() => sources.id),
  ...recordColumns(),
});

export const calendarSystems = pgTable('calendar_systems', {
  id: id(),
  slug: slug(), // babylonian_lunar, hebrew_lunisolar, egyptian_civil, julian, gregorian, regnal
  name: text('name').notNull(),
  description: text('description'),
  conversionMethod: text('conversion_method'),
  sourceId: text('source_id').references(() => sources.id),
  ...recordColumns(),
});

export const regnalConventions = pgTable('regnal_conventions', {
  id: id(),
  kingdomId: text('kingdom_id').notNull().references(() => kingdoms.id),
  modelId: text('model_id').references(() => chronologyModels.id),
  periodEarliest: integer('period_earliest'),
  periodLatest: integer('period_latest'),
  reckoning: regnalReckoning('reckoning').notNull(),
  newYear: newYearConvention('new_year').notNull(),
  calendarId: text('calendar_id').references(() => calendarSystems.id),
  notes: text('notes'),
  sourceId: text('source_id').references(() => sources.id),
  ...recordColumns(),
});

export const rulerReigns = pgTable(
  'ruler_reigns',
  {
    id: id(),
    personId: text('person_id').notNull().references(() => people.id),
    kingdomId: text('kingdom_id').notNull().references(() => kingdoms.id),
    modelId: text('model_id').references(() => chronologyModels.id),
    title: text('title'),
    startEarliest: integer('start_earliest'),
    startLatest: integer('start_latest'),
    endEarliest: integer('end_earliest'),
    endLatest: integer('end_latest'),
    precision: datePrecision('precision').notNull(),
    isCoregency: boolean('is_coregency').notNull().default(false),
    coregentWithReignId: text('coregent_with_reign_id').references((): AnyPgColumn => rulerReigns.id),
    predecessorReignId: text('predecessor_reign_id').references((): AnyPgColumn => rulerReigns.id),
    successorReignId: text('successor_reign_id').references((): AnyPgColumn => rulerReigns.id),
    regnalConventionId: text('regnal_convention_id').references(() => regnalConventions.id),
    statedLengthYears: integer('stated_length_years'),
    statedLengthPassageId: text('stated_length_passage_id').references(() => passageRefs.id),
    notes: text('notes'),
    ...recordColumns(),
  },
  (t) => [index('ruler_reigns_kingdom').on(t.kingdomId, t.modelId)],
);

export const synchronisms = pgTable('synchronisms', {
  id: id(),
  type: synchronismType('type').notNull(),
  passageId: text('passage_id').references(() => passageRefs.id),
  biblicalRecordKind: text('biblical_record_kind'), // event | person | reign
  biblicalRecordId: text('biblical_record_id'),
  externalEntity: text('external_entity').notNull(), // e.g. "Kurkh Monolith, Shalmaneser III year 6"
  externalSourceId: text('external_source_id').references(() => sources.id),
  proposedSynchronization: text('proposed_synchronization').notNull(),
  independentEarliest: integer('independent_earliest'),
  independentLatest: integer('independent_latest'),
  precision: datePrecision('precision').notNull(),
  datingMethod: text('dating_method').notNull(),
  isDirect: boolean('is_direct').notNull(), // false = anchored only through intermediate relationships
  via: text('via'),
  assumptions: text('assumptions').array().notNull().default(sql`'{}'::text[]`),
  evidenceStrength: text('evidence_strength'),
  competingInterpretations: jsonb('competing_interpretations').notNull().default(sql`'[]'::jsonb`),
  reviewerStatus: reviewerStatus('reviewer_status').notNull().default('machine_proposed'),
  ...recordColumns(),
});

/** Relative chronology graph edge (SPEC 12.2). Text assertion is stored apart from its mathematical reading. */
export const chronologicalConstraints = pgTable(
  'chronological_constraints',
  {
    id: id(),
    subjectKind: text('subject_kind').notNull(),
    subjectId: text('subject_id').notNull(),
    relation: constraintRelation('relation').notNull(),
    objectKind: text('object_kind').notNull(),
    objectId: text('object_id').notNull(),
    offsetMin: integer('offset_min'),
    offsetMax: integer('offset_max'),
    unit: text('unit'), // days | months | years
    precision: datePrecision('precision').notNull(),
    textualAssertion: text('textual_assertion').notNull(),
    passageId: text('passage_id').references(() => passageRefs.id),
    modelId: text('model_id').references(() => chronologyModels.id),
    assumptions: text('assumptions').array().notNull().default(sql`'{}'::text[]`),
    verificationStatus: text('verification_status').notNull(),
    ...recordColumns(),
  },
  (t) => [index('constraints_subject').on(t.subjectKind, t.subjectId), index('constraints_object').on(t.objectKind, t.objectId)],
);

export const dateHypotheses = pgTable(
  'date_hypotheses',
  {
    id: id(),
    subjectKind: text('subject_kind').notNull(),
    subjectId: text('subject_id').notNull(),
    modelId: text('model_id').references(() => chronologyModels.id),
    earliest: integer('earliest'),
    latest: integer('latest'),
    precision: datePrecision('precision').notNull(),
    originalCalendarId: text('original_calendar_id').references(() => calendarSystems.id),
    originalExpression: text('original_expression'),
    derivation: text('derivation').notNull(),
    derivationChain: jsonb('derivation_chain').notNull().default(sql`'[]'::jsonb`),
    isComputed: boolean('is_computed').notNull().default(false),
    reviewerStatus: reviewerStatus('reviewer_status').notNull().default('machine_proposed'),
    ...recordColumns(),
  },
  (t) => [index('date_hypotheses_subject').on(t.subjectKind, t.subjectId, t.modelId)],
);

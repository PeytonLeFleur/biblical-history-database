import { sql } from 'drizzle-orm';
import { type AnyPgColumn, date, index, integer, pgTable, primaryKey, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { geometry, id, recordColumns, slug } from './common.ts';
import {
  coordinatePrecision,
  confidence,
  eventCategory,
  interpretiveApproach,
  literaryClassification,
  locationConfidence,
  narrativeMode,
  publicationLevel,
  researchPriority,
  researchStatus,
  reviewerStatus,
  sourceType,
  verificationLevel,
} from './enums.ts';
import { passageRefs } from './scripture.ts';

// ─── Sources (SPEC 11 #29–31, 40) ───────────────────────────────────────────────

export const sources = pgTable(
  'sources',
  {
    id: id(),
    title: text('title').notNull(),
    sourceType: sourceType('source_type').notNull(),
    authors: text('authors').array().notNull().default(sql`'{}'::text[]`),
    publisher: text('publisher'),
    journal: text('journal'),
    publishedDate: text('published_date'), // free-form: "2019", "2019-05", "c. 1850"
    url: text('url'),
    doi: text('doi'),
    isbn: text('isbn'),
    standardReference: text('standard_reference'), // e.g. "ABC 7" for an ancient text edition
    license: text('license'),
    verificationLevel: verificationLevel('verification_level').notNull().default('discovered'),
    accessedAt: date('accessed_at'),
    accessNotes: text('access_notes'),
    dedupeKey: text('dedupe_key').notNull().unique(),
    retractionStatus: text('retraction_status'), // null | "retracted" | "corrected"
    ...recordColumns(),
  },
  (t) => [index('sources_fts').using('gin', sql`to_tsvector('english', ${t.title})`)],
);

/** News reports must point at the original finding they report (SPEC Rule 03). */
export const newsReports = pgTable('news_reports', {
  sourceId: text('source_id').primaryKey().references(() => sources.id),
  outlet: text('outlet').notNull(),
  reportsOnSourceId: text('reports_on_source_id').references(() => sources.id),
});

export const sourceVerifications = pgTable('source_verifications', {
  id: serial('id').primaryKey(),
  sourceId: text('source_id').notNull().references(() => sources.id),
  level: verificationLevel('level').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
  method: text('method').notNull(), // e.g. "crossref lookup", "read full text pp. 12–15"
  claimId: text('claim_id'),
  notes: text('notes'),
});

/** Polymorphic citation link; referential integrity of (record_kind, record_id) is enforced by the validator. */
export const recordCitations = pgTable(
  'record_citations',
  {
    id: serial('id').primaryKey(),
    recordKind: text('record_kind').notNull(),
    recordId: text('record_id').notNull(),
    sourceId: text('source_id').notNull().references(() => sources.id),
    locator: text('locator'),
    note: text('note'),
  },
  (t) => [index('record_citations_record').on(t.recordKind, t.recordId)],
);

// ─── Political entities (SPEC 11 #10–11) ───────────────────────────────────────

export const kingdoms = pgTable('kingdoms', {
  id: id(),
  slug: slug(),
  name: text('name').notNull(),
  description: text('description'),
  ...recordColumns(),
});

export const dynasties = pgTable('dynasties', {
  id: id(),
  slug: slug(),
  kingdomId: text('kingdom_id').references(() => kingdoms.id),
  name: text('name').notNull(),
  description: text('description'),
  ...recordColumns(),
});

// ─── People (SPEC 11 #8–9) ──────────────────────────────────────────────────────

export const people = pgTable(
  'people',
  {
    id: id(),
    slug: slug(),
    canonicalName: text('canonical_name').notNull(),
    description: text('description'),
    kingdomId: text('kingdom_id').references(() => kingdoms.id),
    dynastyId: text('dynasty_id').references(() => dynasties.id),
    ...recordColumns(),
  },
  (t) => [index('people_fts').using('gin', sql`to_tsvector('simple', ${t.canonicalName})`)],
);

export const personAliases = pgTable(
  'person_aliases',
  {
    id: serial('id').primaryKey(),
    personId: text('person_id').notNull().references(() => people.id),
    alias: text('alias').notNull(),
    language: text('language'),
    sourceId: text('source_id').references(() => sources.id),
  },
  (t) => [unique().on(t.personId, t.alias), index('person_aliases_alias').on(t.alias)],
);

/** Preserves identity mappings through merges (SPEC 3.6). */
export const entityRedirects = pgTable('entity_redirects', {
  oldId: text('old_id').primaryKey(),
  newId: text('new_id').notNull(),
  reason: text('reason').notNull(),
  reviewId: text('review_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Geography (SPEC 11 #12–15, Part 13) ────────────────────────────────────────

export const places = pgTable(
  'places',
  {
    id: id(),
    slug: slug(),
    primaryName: text('primary_name').notNull(),
    placeType: text('place_type'), // city, region, mountain, river, …
    modernName: text('modern_name'),
    modernCountry: text('modern_country'),
    kingdomId: text('kingdom_id').references(() => kingdoms.id),
    description: text('description'),
    ...recordColumns(),
  },
  (t) => [index('places_fts').using('gin', sql`to_tsvector('simple', ${t.primaryName})`)],
);

export const placeNames = pgTable(
  'place_names',
  {
    id: serial('id').primaryKey(),
    placeId: text('place_id').notNull().references(() => places.id),
    name: text('name').notNull(),
    language: text('language'),
    period: text('period'),
    sourceId: text('source_id').references(() => sources.id),
  },
  (t) => [unique().on(t.placeId, t.name, t.language)],
);

/** Competing modern identifications; never silently pick one (SPEC 13). */
export const locationHypotheses = pgTable(
  'location_hypotheses',
  {
    id: id(),
    placeId: text('place_id').notNull().references(() => places.id),
    label: text('label').notNull(),
    geom: geometry('geom'),
    coordinatePrecision: coordinatePrecision('coordinate_precision'),
    confidence: locationConfidence('confidence').notNull(),
    proponents: text('proponents').array().notNull().default(sql`'{}'::text[]`),
    reasoning: text('reasoning'),
    geomSourceId: text('geom_source_id').references(() => sources.id),
    ...recordColumns(),
  },
  (t) => [index('location_hypotheses_geom').using('gist', t.geom)],
);

export const historicalRegions = pgTable(
  'historical_regions',
  {
    id: id(),
    slug: slug(),
    name: text('name').notNull(),
    kingdomId: text('kingdom_id').references(() => kingdoms.id),
    periodEarliest: integer('period_earliest'),
    periodLatest: integer('period_latest'),
    geom: geometry('geom'),
    interpretation: text('interpretation'),
    precision: text('precision'),
    license: text('license'),
    uncertainty: text('uncertainty'),
    sourceId: text('source_id').references(() => sources.id),
    ...recordColumns(),
  },
  (t) => [index('historical_regions_geom').using('gist', t.geom)],
);

// ─── Events (SPEC 11 #6–7) ──────────────────────────────────────────────────────

export const events = pgTable(
  'events',
  {
    id: id(),
    slug: slug(),
    title: text('title').notNull(),
    summary: text('summary'),
    literaryClassification: literaryClassification('literary_classification').notNull(),
    narrativeMode: narrativeMode('narrative_mode').notNull(),
    categories: eventCategory('categories').array().notNull(),
    priority: researchPriority('priority').notNull(),
    researchStatus: researchStatus('research_status').notNull().default('queued'),
    publicationLevel: publicationLevel('publication_level').notNull().default('unpublished'),
    parentEventId: text('parent_event_id').references((): AnyPgColumn => events.id),
    externalReason: text('external_reason'), // non-null when the event is an external historical event (e.g. fall of Babylon)
    lastReviewedAt: date('last_reviewed_at'),
    ...recordColumns(),
  },
  (t) => [
    index('events_fts').using('gin', sql`to_tsvector('english', ${t.title} || ' ' || coalesce(${t.summary}, ''))`),
    index('events_parent').on(t.parentEventId),
  ],
);

export const eventMentions = pgTable(
  'event_mentions',
  {
    id: serial('id').primaryKey(),
    eventId: text('event_id').notNull().references(() => events.id),
    passageId: text('passage_id').notNull().references(() => passageRefs.id),
    mentionType: text('mention_type').notNull(), // narration | reference | parallel_account | superscription
    notes: text('notes'),
  },
  (t) => [unique().on(t.eventId, t.passageId)],
);

export const eventParticipants = pgTable(
  'event_participants',
  {
    eventId: text('event_id').notNull().references(() => events.id),
    personId: text('person_id').notNull().references(() => people.id),
    role: text('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.personId, t.role] })],
);

export const eventLocations = pgTable(
  'event_locations',
  {
    eventId: text('event_id').notNull().references(() => events.id),
    placeId: text('place_id').notNull().references(() => places.id),
    role: text('role').notNull(),
    confidence: locationConfidence('confidence').notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.placeId, t.role] })],
);

// ─── Visions, prophecies, fulfillments, genealogies (SPEC 11 #23–26) ─────────────

export const visions = pgTable('visions', {
  id: id(),
  slug: slug(),
  title: text('title').notNull(),
  passageId: text('passage_id').notNull().references(() => passageRefs.id),
  recipientId: text('recipient_id').references(() => people.id),
  settingEventId: text('setting_event_id').references(() => events.id),
  description: text('description'),
  ...recordColumns(),
});

export const prophecies = pgTable('prophecies', {
  id: id(),
  slug: slug(),
  title: text('title').notNull(),
  passageId: text('passage_id').notNull().references(() => passageRefs.id),
  speakerId: text('speaker_id').references(() => people.id),
  visionId: text('vision_id').references(() => visions.id),
  description: text('description'),
  ...recordColumns(),
});

export const proposedFulfillments = pgTable('proposed_fulfillments', {
  id: id(),
  prophecyId: text('prophecy_id').notNull().references(() => prophecies.id),
  fulfillingEventId: text('fulfilling_event_id').references(() => events.id),
  description: text('description').notNull(),
  interpretiveApproach: interpretiveApproach('interpretive_approach').notNull(),
  theologicalFramework: text('theological_framework'),
  proponents: text('proponents').array().notNull().default(sql`'{}'::text[]`),
  confidence: confidence('confidence').notNull(),
  reviewerStatus: reviewerStatus('reviewer_status').notNull().default('machine_proposed'),
  ...recordColumns(),
});

export const genealogies = pgTable('genealogies', {
  id: id(),
  slug: slug(),
  title: text('title').notNull(),
  passageId: text('passage_id').notNull().references(() => passageRefs.id),
  textualTradition: text('textual_tradition').notNull(), // e.g. "Masoretic", "Septuagint", "Samaritan"
  ...recordColumns(),
});

export const genealogyLinks = pgTable('genealogy_links', {
  id: serial('id').primaryKey(),
  genealogyId: text('genealogy_id').notNull().references(() => genealogies.id),
  parentId: text('parent_id').notNull().references(() => people.id),
  childId: text('child_id').notNull().references(() => people.id),
  ageAtBegetting: integer('age_at_begetting'),
  remainingYears: integer('remaining_years'),
  lifespan: integer('lifespan'),
  passageId: text('passage_id').references(() => passageRefs.id),
  variantNote: text('variant_note'),
});

// ─── Archaeology & documents (SPEC 11 #27–29) ───────────────────────────────────

export const archaeologicalSites = pgTable(
  'archaeological_sites',
  {
    id: id(),
    slug: slug(),
    name: text('name').notNull(),
    placeId: text('place_id').references(() => places.id),
    geom: geometry('geom'),
    geomSourceId: text('geom_source_id').references(() => sources.id),
    excavationHistory: text('excavation_history'),
    description: text('description'),
    ...recordColumns(),
  },
  (t) => [index('archaeological_sites_geom').using('gist', t.geom)],
);

export const artifacts = pgTable('artifacts', {
  id: id(),
  slug: slug(),
  name: text('name').notNull(),
  artifactType: text('artifact_type'),
  findspotSiteId: text('findspot_site_id').references(() => archaeologicalSites.id),
  currentInstitution: text('current_institution'),
  accessionNumber: text('accession_number'),
  dateEarliest: integer('date_earliest'),
  dateLatest: integer('date_latest'),
  description: text('description'),
  imageUrl: text('image_url'),
  imageLicense: text('image_license'),
  imageAttribution: text('image_attribution'),
  ...recordColumns(),
});

export const primaryDocuments = pgTable('primary_documents', {
  id: id(),
  slug: slug(),
  name: text('name').notNull(),
  documentType: text('document_type'), // chronicle, royal inscription, letter, …
  language: text('language'),
  standardReference: text('standard_reference'),
  artifactId: text('artifact_id').references(() => artifacts.id),
  dateEarliest: integer('date_earliest'),
  dateLatest: integer('date_latest'),
  description: text('description'),
  ...recordColumns(),
});

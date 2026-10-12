CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low', 'speculative');--> statement-breakpoint
CREATE TYPE "public"."constraint_relation" AS ENUM('before', 'after', 'during', 'same_year', 'same_approximate_period', 'begins_after', 'ends_before', 'overlaps', 'immediately_follows', 'days_later', 'months_later', 'years_later', 'years_earlier', 'within_reign', 'in_regnal_year', 'within_dated_range');--> statement-breakpoint
CREATE TYPE "public"."coordinate_precision" AS ENUM('site', 'settlement', 'approximate_area', 'region');--> statement-breakpoint
CREATE TYPE "public"."date_precision" AS ENUM('day', 'month', 'year', 'regnal_year', 'decade', 'reign', 'generation', 'century', 'period', 'undated');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('political', 'military', 'royal', 'migration', 'construction', 'destruction', 'natural_disaster', 'environmental', 'astronomical', 'religious', 'social', 'economic', 'legal', 'birth', 'death', 'genealogical', 'miracle_claim', 'personal_narrative', 'other');--> statement-breakpoint
CREATE TYPE "public"."evidence_classification" AS ENUM('independently_corroborated', 'strongly_supported', 'historically_plausible', 'disputed', 'no_independent_corroboration_found', 'contradicted_by_available_evidence', 'not_empirically_testable');--> statement-breakpoint
CREATE TYPE "public"."evidence_stance" AS ENUM('supports', 'challenges', 'contextual', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."evidence_strength" AS ENUM('direct', 'indirect', 'contextual');--> statement-breakpoint
CREATE TYPE "public"."interpretive_approach" AS ENUM('preterist', 'futurist', 'historicist', 'idealist', 'mixed', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."knowledge_layer" AS ENUM('text', 'interpretation', 'reconstruction', 'evidence');--> statement-breakpoint
CREATE TYPE "public"."literary_classification" AS ENUM('historical_narrative', 'prophetic_oracle', 'apocalyptic_vision', 'poetry', 'wisdom', 'parable', 'law', 'genealogy', 'epistle', 'gospel_narrative', 'historical_reference', 'mixed', 'uncertain');--> statement-breakpoint
CREATE TYPE "public"."location_confidence" AS ENUM('certain', 'probable', 'possible', 'disputed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."narrative_mode" AS ENUM('narrated_occurrence', 'reference_to_other_event', 'vision_content', 'prediction', 'hypothetical', 'poetic');--> statement-breakpoint
CREATE TYPE "public"."new_year_convention" AS ENUM('nisan', 'tishri', 'thoth', 'january', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."publication_level" AS ENUM('unpublished', 'preliminary', 'researched', 'human_reviewed');--> statement-breakpoint
CREATE TYPE "public"."regnal_reckoning" AS ENUM('accession', 'non_accession', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('same_event', 'direct_reference', 'same_person', 'same_location', 'same_kingdom', 'same_period', 'parent_event', 'child_event', 'preceded_by', 'followed_by', 'historical_consequence', 'prophecy_reference', 'proposed_fulfillment', 'genealogical_connection', 'thematic_parallel', 'artifact_association', 'source_attestation', 'possible_identity', 'supports', 'contradicts');--> statement-breakpoint
CREATE TYPE "public"."research_priority" AS ENUM('critical', 'high', 'medium', 'low', 'background');--> statement-breakpoint
CREATE TYPE "public"."research_stage" AS ENUM('scripture_extraction', 'historical_reconstruction', 'external_evidence', 'cross_referencing', 'publication_validation');--> statement-breakpoint
CREATE TYPE "public"."research_status" AS ENUM('queued', 'extracting', 'context_research', 'external_research', 'cross_referencing', 'validating', 'needs_review', 'publishable', 'published', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approve', 'reject', 'return');--> statement-breakpoint
CREATE TYPE "public"."review_queue_status" AS ENUM('open', 'decided', 'returned');--> statement-breakpoint
CREATE TYPE "public"."reviewer_status" AS ENUM('machine_proposed', 'human_approved', 'human_rejected', 'requires_review');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('ancient_primary_text', 'artifact_record', 'excavation_report', 'scientific_paper', 'academic_monograph', 'scholarly_commentary', 'theological_commentary', 'institutional_database', 'museum_catalog', 'historical_reference', 'news_report', 'popular_summary', 'dataset', 'other');--> statement-breakpoint
CREATE TYPE "public"."synchronism_type" AS ENUM('direct_contemporary_identification', 'reign_synchronization', 'documentary_correlation', 'astronomical_anchor', 'calendar_anchor', 'archaeological_correlation', 'inferred_synchronization');--> statement-breakpoint
CREATE TYPE "public"."testament" AS ENUM('OT', 'NT');--> statement-breakpoint
CREATE TYPE "public"."verification_level" AS ENUM('discovered', 'metadata_verified', 'source_accessed', 'claim_checked', 'human_reviewed');--> statement-breakpoint
CREATE TYPE "public"."verse_coverage_status" AS ENUM('not_reviewed', 'reviewed_no_candidate', 'reviewed_with_candidate', 'needs_recheck', 'blocked');--> statement-breakpoint
CREATE TABLE "books" (
	"osis" text PRIMARY KEY NOT NULL,
	"usfm" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"testament" "testament" NOT NULL,
	"canon_order" integer NOT NULL,
	"chapter_count" integer NOT NULL,
	CONSTRAINT "books_usfm_unique" UNIQUE("usfm"),
	CONSTRAINT "books_slug_unique" UNIQUE("slug"),
	CONSTRAINT "books_canon_order_unique" UNIQUE("canon_order")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"book" text NOT NULL,
	"number" integer NOT NULL,
	"verse_count" integer NOT NULL,
	CONSTRAINT "chapters_book_number_unique" UNIQUE("book","number")
);
--> statement-breakpoint
CREATE TABLE "passage_refs" (
	"id" text PRIMARY KEY NOT NULL,
	"start_ref" text NOT NULL,
	"end_ref" text NOT NULL,
	"start_index" integer NOT NULL,
	"end_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"edition" text,
	"license" text NOT NULL,
	"source_url" text,
	"stored_locally" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "verse_coverage" (
	"ref" text PRIMARY KEY NOT NULL,
	"status" "verse_coverage_status" DEFAULT 'not_reviewed' NOT NULL,
	"candidate_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"reviewed_at" timestamp with time zone,
	"session_log" text
);
--> statement-breakpoint
CREATE TABLE "verse_texts" (
	"translation" text NOT NULL,
	"translation_ref" text NOT NULL,
	"canonical_ref" text,
	"text" text NOT NULL,
	CONSTRAINT "verse_texts_translation_translation_ref_pk" PRIMARY KEY("translation","translation_ref"),
	CONSTRAINT "verse_texts_translation_canonical_ref_unique" UNIQUE("translation","canonical_ref")
);
--> statement-breakpoint
CREATE TABLE "verses" (
	"ref" text PRIMARY KEY NOT NULL,
	"book" text NOT NULL,
	"chapter_id" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"canon_index" integer NOT NULL,
	CONSTRAINT "verses_canon_index_unique" UNIQUE("canon_index"),
	CONSTRAINT "verses_book_chapter_verse_unique" UNIQUE("book","chapter","verse")
);
--> statement-breakpoint
CREATE TABLE "versification_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"translation" text NOT NULL,
	"translation_ref" text NOT NULL,
	"canonical_ref" text,
	"tradition" text,
	"note" text NOT NULL,
	CONSTRAINT "versification_mappings_translation_translation_ref_unique" UNIQUE("translation","translation_ref")
);
--> statement-breakpoint
CREATE TABLE "archaeological_sites" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"place_id" text,
	"geom" geometry(Geometry, 4326),
	"geom_source_id" text,
	"excavation_history" text,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "archaeological_sites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"artifact_type" text,
	"findspot_site_id" text,
	"current_institution" text,
	"accession_number" text,
	"date_earliest" integer,
	"date_latest" integer,
	"description" text,
	"image_url" text,
	"image_license" text,
	"image_attribution" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artifacts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dynasties" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kingdom_id" text,
	"name" text NOT NULL,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dynasties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entity_redirects" (
	"old_id" text PRIMARY KEY NOT NULL,
	"new_id" text NOT NULL,
	"reason" text NOT NULL,
	"review_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_locations" (
	"event_id" text NOT NULL,
	"place_id" text NOT NULL,
	"role" text NOT NULL,
	"confidence" "location_confidence" NOT NULL,
	CONSTRAINT "event_locations_event_id_place_id_role_pk" PRIMARY KEY("event_id","place_id","role")
);
--> statement-breakpoint
CREATE TABLE "event_mentions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"passage_id" text NOT NULL,
	"mention_type" text NOT NULL,
	"notes" text,
	CONSTRAINT "event_mentions_event_id_passage_id_unique" UNIQUE("event_id","passage_id")
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"event_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "event_participants_event_id_person_id_role_pk" PRIMARY KEY("event_id","person_id","role")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"literary_classification" "literary_classification" NOT NULL,
	"narrative_mode" "narrative_mode" NOT NULL,
	"categories" "event_category"[] NOT NULL,
	"priority" "research_priority" NOT NULL,
	"research_status" "research_status" DEFAULT 'queued' NOT NULL,
	"publication_level" "publication_level" DEFAULT 'unpublished' NOT NULL,
	"parent_event_id" text,
	"external_reason" text,
	"last_reviewed_at" date,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genealogies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"passage_id" text NOT NULL,
	"textual_tradition" text NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genealogies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genealogy_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"genealogy_id" text NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"age_at_begetting" integer,
	"remaining_years" integer,
	"lifespan" integer,
	"passage_id" text,
	"variant_note" text
);
--> statement-breakpoint
CREATE TABLE "historical_regions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kingdom_id" text,
	"period_earliest" integer,
	"period_latest" integer,
	"geom" geometry(Geometry, 4326),
	"interpretation" text,
	"precision" text,
	"license" text,
	"uncertainty" text,
	"source_id" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "historical_regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "kingdoms" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kingdoms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "location_hypotheses" (
	"id" text PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"label" text NOT NULL,
	"geom" geometry(Geometry, 4326),
	"coordinate_precision" "coordinate_precision",
	"confidence" "location_confidence" NOT NULL,
	"proponents" text[] DEFAULT '{}'::text[] NOT NULL,
	"reasoning" text,
	"geom_source_id" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_reports" (
	"source_id" text PRIMARY KEY NOT NULL,
	"outlet" text NOT NULL,
	"reports_on_source_id" text
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"canonical_name" text NOT NULL,
	"description" text,
	"kingdom_id" text,
	"dynasty_id" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "person_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"alias" text NOT NULL,
	"language" text,
	"source_id" text,
	CONSTRAINT "person_aliases_person_id_alias_unique" UNIQUE("person_id","alias")
);
--> statement-breakpoint
CREATE TABLE "place_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"name" text NOT NULL,
	"language" text,
	"period" text,
	"source_id" text,
	CONSTRAINT "place_names_place_id_name_language_unique" UNIQUE("place_id","name","language")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"primary_name" text NOT NULL,
	"place_type" text,
	"modern_name" text,
	"modern_country" text,
	"kingdom_id" text,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "primary_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"document_type" text,
	"language" text,
	"standard_reference" text,
	"artifact_id" text,
	"date_earliest" integer,
	"date_latest" integer,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "primary_documents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "prophecies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"passage_id" text NOT NULL,
	"speaker_id" text,
	"vision_id" text,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prophecies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "proposed_fulfillments" (
	"id" text PRIMARY KEY NOT NULL,
	"prophecy_id" text NOT NULL,
	"fulfilling_event_id" text,
	"description" text NOT NULL,
	"interpretive_approach" "interpretive_approach" NOT NULL,
	"theological_framework" text,
	"proponents" text[] DEFAULT '{}'::text[] NOT NULL,
	"confidence" "confidence" NOT NULL,
	"reviewer_status" "reviewer_status" DEFAULT 'machine_proposed' NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_citations" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_kind" text NOT NULL,
	"record_id" text NOT NULL,
	"source_id" text NOT NULL,
	"locator" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "source_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"level" "verification_level" NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text NOT NULL,
	"claim_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source_type" "source_type" NOT NULL,
	"authors" text[] DEFAULT '{}'::text[] NOT NULL,
	"publisher" text,
	"journal" text,
	"published_date" text,
	"url" text,
	"doi" text,
	"isbn" text,
	"standard_reference" text,
	"license" text,
	"verification_level" "verification_level" DEFAULT 'discovered' NOT NULL,
	"accessed_at" date,
	"access_notes" text,
	"dedupe_key" text NOT NULL,
	"retraction_status" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "visions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"passage_id" text NOT NULL,
	"recipient_id" text,
	"setting_event_id" text,
	"description" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "calendar_systems" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"conversion_method" text,
	"source_id" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_systems_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chronological_constraints" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_kind" text NOT NULL,
	"subject_id" text NOT NULL,
	"relation" "constraint_relation" NOT NULL,
	"object_kind" text NOT NULL,
	"object_id" text NOT NULL,
	"offset_min" integer,
	"offset_max" integer,
	"unit" text,
	"precision" date_precision NOT NULL,
	"textual_assertion" text NOT NULL,
	"passage_id" text,
	"model_id" text,
	"assumptions" text[] DEFAULT '{}'::text[] NOT NULL,
	"verification_status" text NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chronology_models" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"scope" text NOT NULL,
	"textual_tradition" text,
	"description" text,
	"is_absolute_axis" boolean DEFAULT true NOT NULL,
	"source_id" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chronology_models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "date_hypotheses" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_kind" text NOT NULL,
	"subject_id" text NOT NULL,
	"model_id" text,
	"earliest" integer,
	"latest" integer,
	"precision" date_precision NOT NULL,
	"original_calendar_id" text,
	"original_expression" text,
	"derivation" text NOT NULL,
	"derivation_chain" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_computed" boolean DEFAULT false NOT NULL,
	"reviewer_status" "reviewer_status" DEFAULT 'machine_proposed' NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regnal_conventions" (
	"id" text PRIMARY KEY NOT NULL,
	"kingdom_id" text NOT NULL,
	"model_id" text,
	"period_earliest" integer,
	"period_latest" integer,
	"reckoning" "regnal_reckoning" NOT NULL,
	"new_year" "new_year_convention" NOT NULL,
	"calendar_id" text,
	"notes" text,
	"source_id" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruler_reigns" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"kingdom_id" text NOT NULL,
	"model_id" text,
	"title" text,
	"start_earliest" integer,
	"start_latest" integer,
	"end_earliest" integer,
	"end_latest" integer,
	"precision" date_precision NOT NULL,
	"is_coregency" boolean DEFAULT false NOT NULL,
	"coregent_with_reign_id" text,
	"predecessor_reign_id" text,
	"successor_reign_id" text,
	"regnal_convention_id" text,
	"stated_length_years" integer,
	"stated_length_passage_id" text,
	"notes" text,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "synchronisms" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "synchronism_type" NOT NULL,
	"passage_id" text,
	"biblical_record_kind" text,
	"biblical_record_id" text,
	"external_entity" text NOT NULL,
	"external_source_id" text,
	"proposed_synchronization" text NOT NULL,
	"independent_earliest" integer,
	"independent_latest" integer,
	"precision" date_precision NOT NULL,
	"dating_method" text NOT NULL,
	"is_direct" boolean NOT NULL,
	"via" text,
	"assumptions" text[] DEFAULT '{}'::text[] NOT NULL,
	"evidence_strength" text,
	"competing_interpretations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewer_status" "reviewer_status" DEFAULT 'machine_proposed' NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biblical_cross_references" (
	"id" text PRIMARY KEY NOT NULL,
	"from_passage_id" text NOT NULL,
	"to_passage_id" text NOT NULL,
	"type" "relationship_type" NOT NULL,
	"confidence" "confidence" NOT NULL,
	"rationale" text,
	"dataset" text,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "biblical_cross_references_from_passage_id_to_passage_id_type_unique" UNIQUE("from_passage_id","to_passage_id","type")
);
--> statement-breakpoint
CREATE TABLE "claim_evidence" (
	"claim_id" text NOT NULL,
	"evidence_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "claim_evidence_claim_id_evidence_id_pk" PRIMARY KEY("claim_id","evidence_id")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY NOT NULL,
	"statement" text NOT NULL,
	"layer" "knowledge_layer" NOT NULL,
	"event_id" text,
	"passage_id" text,
	"classification" "evidence_classification",
	"reasoning" text,
	"limitations" text[] DEFAULT '{}'::text[] NOT NULL,
	"reviewer_status" "reviewer_status" DEFAULT 'machine_proposed' NOT NULL,
	"review_required" boolean DEFAULT false NOT NULL,
	"research_date" date,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_findings" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"finding" text NOT NULL,
	"locator" text,
	"stance" "evidence_stance" NOT NULL,
	"strength" "evidence_strength" NOT NULL,
	"proposed_connection_by" text,
	"competing_explanations" text[] DEFAULT '{}'::text[] NOT NULL,
	"limitations" text[] DEFAULT '{}'::text[] NOT NULL,
	"independent_line" text NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "relationship_type" NOT NULL,
	"from_kind" text NOT NULL,
	"from_id" text NOT NULL,
	"to_kind" text NOT NULL,
	"to_id" text NOT NULL,
	"confidence" "confidence" NOT NULL,
	"layer" "knowledge_layer" NOT NULL,
	"rationale" text NOT NULL,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"interpretive_approach" "interpretive_approach",
	"proposed_by" text,
	"review_required" boolean DEFAULT false NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publication_status" (
	"record_kind" text NOT NULL,
	"record_id" text NOT NULL,
	"level" "publication_level" NOT NULL,
	"revision" integer NOT NULL,
	"published_at" timestamp with time zone,
	"human_review_decision_id" integer,
	CONSTRAINT "publication_status_record_kind_record_id_pk" PRIMARY KEY("record_kind","record_id")
);
--> statement-breakpoint
CREATE TABLE "research_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"stage" "research_stage" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"outcome" text,
	"notes" text,
	"session_log" text
);
--> statement-breakpoint
CREATE TABLE "research_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_kind" text NOT NULL,
	"subject_id" text NOT NULL,
	"book" text,
	"chapter" integer,
	"stage" "research_stage" NOT NULL,
	"status" "research_status" DEFAULT 'queued' NOT NULL,
	"priority" "research_priority" NOT NULL,
	"checkpoint" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"decision" "review_decision" NOT NULL,
	"reviewer" text NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"record_revision" integer NOT NULL,
	"rationale" text
);
--> statement-breakpoint
CREATE TABLE "review_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"record_kind" text NOT NULL,
	"record_id" text NOT NULL,
	"record_revision" integer NOT NULL,
	"reason" text NOT NULL,
	"triggers" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "review_queue_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_fixture" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revision_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_kind" text NOT NULL,
	"record_id" text NOT NULL,
	"revision" integer NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" text NOT NULL,
	"change_summary" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "revision_history_record_kind_record_id_revision_unique" UNIQUE("record_kind","record_id","revision")
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_books_osis_fk" FOREIGN KEY ("book") REFERENCES "public"."books"("osis") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage_refs" ADD CONSTRAINT "passage_refs_start_ref_verses_ref_fk" FOREIGN KEY ("start_ref") REFERENCES "public"."verses"("ref") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage_refs" ADD CONSTRAINT "passage_refs_end_ref_verses_ref_fk" FOREIGN KEY ("end_ref") REFERENCES "public"."verses"("ref") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_coverage" ADD CONSTRAINT "verse_coverage_ref_verses_ref_fk" FOREIGN KEY ("ref") REFERENCES "public"."verses"("ref") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_texts" ADD CONSTRAINT "verse_texts_translation_translations_id_fk" FOREIGN KEY ("translation") REFERENCES "public"."translations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_texts" ADD CONSTRAINT "verse_texts_canonical_ref_verses_ref_fk" FOREIGN KEY ("canonical_ref") REFERENCES "public"."verses"("ref") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_book_books_osis_fk" FOREIGN KEY ("book") REFERENCES "public"."books"("osis") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versification_mappings" ADD CONSTRAINT "versification_mappings_translation_translations_id_fk" FOREIGN KEY ("translation") REFERENCES "public"."translations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versification_mappings" ADD CONSTRAINT "versification_mappings_canonical_ref_verses_ref_fk" FOREIGN KEY ("canonical_ref") REFERENCES "public"."verses"("ref") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archaeological_sites" ADD CONSTRAINT "archaeological_sites_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archaeological_sites" ADD CONSTRAINT "archaeological_sites_geom_source_id_sources_id_fk" FOREIGN KEY ("geom_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_findspot_site_id_archaeological_sites_id_fk" FOREIGN KEY ("findspot_site_id") REFERENCES "public"."archaeological_sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynasties" ADD CONSTRAINT "dynasties_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "public"."kingdoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_mentions" ADD CONSTRAINT "event_mentions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_mentions" ADD CONSTRAINT "event_mentions_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_parent_event_id_events_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genealogies" ADD CONSTRAINT "genealogies_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genealogy_links" ADD CONSTRAINT "genealogy_links_genealogy_id_genealogies_id_fk" FOREIGN KEY ("genealogy_id") REFERENCES "public"."genealogies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genealogy_links" ADD CONSTRAINT "genealogy_links_parent_id_people_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genealogy_links" ADD CONSTRAINT "genealogy_links_child_id_people_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genealogy_links" ADD CONSTRAINT "genealogy_links_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_regions" ADD CONSTRAINT "historical_regions_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "public"."kingdoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_regions" ADD CONSTRAINT "historical_regions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_hypotheses" ADD CONSTRAINT "location_hypotheses_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_hypotheses" ADD CONSTRAINT "location_hypotheses_geom_source_id_sources_id_fk" FOREIGN KEY ("geom_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_reports" ADD CONSTRAINT "news_reports_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_reports" ADD CONSTRAINT "news_reports_reports_on_source_id_sources_id_fk" FOREIGN KEY ("reports_on_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "public"."kingdoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_dynasty_id_dynasties_id_fk" FOREIGN KEY ("dynasty_id") REFERENCES "public"."dynasties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_aliases" ADD CONSTRAINT "person_aliases_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_aliases" ADD CONSTRAINT "person_aliases_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_names" ADD CONSTRAINT "place_names_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_names" ADD CONSTRAINT "place_names_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "public"."kingdoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "primary_documents" ADD CONSTRAINT "primary_documents_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_speaker_id_people_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_vision_id_visions_id_fk" FOREIGN KEY ("vision_id") REFERENCES "public"."visions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposed_fulfillments" ADD CONSTRAINT "proposed_fulfillments_prophecy_id_prophecies_id_fk" FOREIGN KEY ("prophecy_id") REFERENCES "public"."prophecies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposed_fulfillments" ADD CONSTRAINT "proposed_fulfillments_fulfilling_event_id_events_id_fk" FOREIGN KEY ("fulfilling_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_citations" ADD CONSTRAINT "record_citations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_verifications" ADD CONSTRAINT "source_verifications_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visions" ADD CONSTRAINT "visions_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visions" ADD CONSTRAINT "visions_recipient_id_people_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visions" ADD CONSTRAINT "visions_setting_event_id_events_id_fk" FOREIGN KEY ("setting_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_systems" ADD CONSTRAINT "calendar_systems_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronological_constraints" ADD CONSTRAINT "chronological_constraints_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronological_constraints" ADD CONSTRAINT "chronological_constraints_model_id_chronology_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."chronology_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronology_models" ADD CONSTRAINT "chronology_models_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_hypotheses" ADD CONSTRAINT "date_hypotheses_model_id_chronology_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."chronology_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_hypotheses" ADD CONSTRAINT "date_hypotheses_original_calendar_id_calendar_systems_id_fk" FOREIGN KEY ("original_calendar_id") REFERENCES "public"."calendar_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regnal_conventions" ADD CONSTRAINT "regnal_conventions_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "public"."kingdoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regnal_conventions" ADD CONSTRAINT "regnal_conventions_model_id_chronology_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."chronology_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regnal_conventions" ADD CONSTRAINT "regnal_conventions_calendar_id_calendar_systems_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendar_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regnal_conventions" ADD CONSTRAINT "regnal_conventions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "public"."kingdoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_model_id_chronology_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."chronology_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_coregent_with_reign_id_ruler_reigns_id_fk" FOREIGN KEY ("coregent_with_reign_id") REFERENCES "public"."ruler_reigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_predecessor_reign_id_ruler_reigns_id_fk" FOREIGN KEY ("predecessor_reign_id") REFERENCES "public"."ruler_reigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_successor_reign_id_ruler_reigns_id_fk" FOREIGN KEY ("successor_reign_id") REFERENCES "public"."ruler_reigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_regnal_convention_id_regnal_conventions_id_fk" FOREIGN KEY ("regnal_convention_id") REFERENCES "public"."regnal_conventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler_reigns" ADD CONSTRAINT "ruler_reigns_stated_length_passage_id_passage_refs_id_fk" FOREIGN KEY ("stated_length_passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synchronisms" ADD CONSTRAINT "synchronisms_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synchronisms" ADD CONSTRAINT "synchronisms_external_source_id_sources_id_fk" FOREIGN KEY ("external_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biblical_cross_references" ADD CONSTRAINT "biblical_cross_references_from_passage_id_passage_refs_id_fk" FOREIGN KEY ("from_passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biblical_cross_references" ADD CONSTRAINT "biblical_cross_references_to_passage_id_passage_refs_id_fk" FOREIGN KEY ("to_passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_evidence_id_evidence_findings_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_findings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_passage_id_passage_refs_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage_refs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_findings" ADD CONSTRAINT "evidence_findings_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_status" ADD CONSTRAINT "publication_status_human_review_decision_id_review_decisions_id_fk" FOREIGN KEY ("human_review_decision_id") REFERENCES "public"."review_decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_attempts" ADD CONSTRAINT "research_attempts_job_id_research_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."research_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_jobs" ADD CONSTRAINT "research_jobs_book_books_osis_fk" FOREIGN KEY ("book") REFERENCES "public"."books"("osis") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_logs" ADD CONSTRAINT "research_logs_job_id_research_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."research_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_review_id_review_queue_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."review_queue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passage_refs_range" ON "passage_refs" USING btree ("start_index","end_index");--> statement-breakpoint
CREATE INDEX "verse_texts_fts" ON "verse_texts" USING gin (to_tsvector('english', "text"));--> statement-breakpoint
CREATE INDEX "archaeological_sites_geom" ON "archaeological_sites" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "events_fts" ON "events" USING gin (to_tsvector('english', "title" || ' ' || coalesce("summary", '')));--> statement-breakpoint
CREATE INDEX "events_parent" ON "events" USING btree ("parent_event_id");--> statement-breakpoint
CREATE INDEX "historical_regions_geom" ON "historical_regions" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "location_hypotheses_geom" ON "location_hypotheses" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "people_fts" ON "people" USING gin (to_tsvector('simple', "canonical_name"));--> statement-breakpoint
CREATE INDEX "person_aliases_alias" ON "person_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "places_fts" ON "places" USING gin (to_tsvector('simple', "primary_name"));--> statement-breakpoint
CREATE INDEX "record_citations_record" ON "record_citations" USING btree ("record_kind","record_id");--> statement-breakpoint
CREATE INDEX "sources_fts" ON "sources" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "constraints_subject" ON "chronological_constraints" USING btree ("subject_kind","subject_id");--> statement-breakpoint
CREATE INDEX "constraints_object" ON "chronological_constraints" USING btree ("object_kind","object_id");--> statement-breakpoint
CREATE INDEX "date_hypotheses_subject" ON "date_hypotheses" USING btree ("subject_kind","subject_id","model_id");--> statement-breakpoint
CREATE INDEX "ruler_reigns_kingdom" ON "ruler_reigns" USING btree ("kingdom_id","model_id");--> statement-breakpoint
CREATE INDEX "hist_rel_from" ON "historical_relationships" USING btree ("from_kind","from_id");--> statement-breakpoint
CREATE INDEX "hist_rel_to" ON "historical_relationships" USING btree ("to_kind","to_id");--> statement-breakpoint
CREATE INDEX "research_jobs_status" ON "research_jobs" USING btree ("status","priority");
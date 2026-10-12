import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgTable, primaryKey, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { testament, verseCoverageStatus } from './enums.ts';

// SPEC Part 11 #1–5: books, chapters, verses, passage references, passage coverage.

export const books = pgTable('books', {
  osis: text('osis').primaryKey(),
  usfm: text('usfm').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  testament: testament('testament').notNull(),
  canonOrder: integer('canon_order').notNull().unique(),
  chapterCount: integer('chapter_count').notNull(),
});

export const chapters = pgTable(
  'chapters',
  {
    id: text('id').primaryKey(), // e.g. "Dan.5"
    book: text('book').notNull().references(() => books.osis),
    number: integer('number').notNull(),
    verseCount: integer('verse_count').notNull(),
  },
  (t) => [unique().on(t.book, t.number)],
);

/** Canonical verse inventory (standard English Protestant numbering). */
export const verses = pgTable(
  'verses',
  {
    ref: text('ref').primaryKey(), // OSIS, e.g. "Amos.1.1"
    book: text('book').notNull().references(() => books.osis),
    chapterId: text('chapter_id').notNull().references(() => chapters.id),
    chapter: integer('chapter').notNull(),
    verse: integer('verse').notNull(),
    canonIndex: integer('canon_index').notNull().unique(), // 1-based ordinal across the canon, for range queries
  },
  (t) => [unique().on(t.book, t.chapter, t.verse)],
);

export const translations = pgTable('translations', {
  id: text('id').primaryKey(), // "WEB", "ESV", "NKJV"
  name: text('name').notNull(),
  edition: text('edition'),
  license: text('license').notNull(),
  sourceUrl: text('source_url'),
  storedLocally: boolean('stored_locally').notNull().default(false),
  notes: text('notes'),
});

/** Locally stored text — only for translations whose licence permits it (WEB). Text is stored unchanged. */
export const verseTexts = pgTable(
  'verse_texts',
  {
    translation: text('translation').notNull().references(() => translations.id),
    translationRef: text('translation_ref').notNull(), // the translation's own numbering
    canonicalRef: text('canonical_ref').references(() => verses.ref),
    text: text('text').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.translation, t.translationRef] }),
    unique().on(t.translation, t.canonicalRef),
    index('verse_texts_fts').using('gin', sql`to_tsvector('english', ${t.text})`),
  ],
);

/** Translation-specific versification differences (SPEC 5.3). */
export const versificationMappings = pgTable(
  'versification_mappings',
  {
    id: serial('id').primaryKey(),
    translation: text('translation').notNull().references(() => translations.id),
    translationRef: text('translation_ref').notNull(),
    canonicalRef: text('canonical_ref').references(() => verses.ref),
    tradition: text('tradition'), // e.g. "Hebrew (BHS)", "Greek (NA28)"
    note: text('note').notNull(),
  },
  (t) => [unique().on(t.translation, t.translationRef)],
);

export const passageRefs = pgTable(
  'passage_refs',
  {
    id: text('id').primaryKey(), // OSIS range string, e.g. "Dan.5.1-Dan.5.31" — deterministic and stable
    startRef: text('start_ref').notNull().references(() => verses.ref),
    endRef: text('end_ref').notNull().references(() => verses.ref),
    startIndex: integer('start_index').notNull(),
    endIndex: integer('end_index').notNull(),
  },
  (t) => [index('passage_refs_range').on(t.startIndex, t.endIndex)],
);

export const verseCoverage = pgTable('verse_coverage', {
  ref: text('ref').primaryKey().references(() => verses.ref),
  status: verseCoverageStatus('status').notNull().default('not_reviewed'),
  candidateIds: text('candidate_ids').array().notNull().default(sql`'{}'::text[]`),
  notes: text('notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  sessionLog: text('session_log'),
});

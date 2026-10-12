import { existsSync } from 'node:fs';
import { chapterVerseRefs, requireBook } from './inventory.ts';
import { checkpointJob, createJob } from './jobs.ts';
import { ChapterExtraction } from './schemas.ts';
import type { ResearchStore } from './store.ts';

export interface PreparedChapter {
  file: string;
  created: boolean;
  jobId: string;
  verses: number;
  reviewed: number;
  nextOperation: string;
}

/**
 * Prepare (or load) a Rule 01 extraction file for a chapter: every canonical verse listed as `not_reviewed`.
 * This is deterministic setup only — Claude Code performs the actual reading and classification.
 */
export function prepareChapter(store: ResearchStore, bookInput: string, chapter: number): PreparedChapter {
  const book = requireBook(bookInput);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    throw new Error(`${book.name} has chapters 1–${book.chapters}`);
  }
  const file = store.chapterFile(book.slug, chapter);
  let created = false;
  if (!existsSync(file)) {
    store.write(ChapterExtraction, file, {
      book: book.osis,
      chapter,
      status: 'in_progress',
      resume_from: `${book.osis}.${chapter}.1`,
      text_edition: 'WEB (eBible.org engwebp, unmodified)',
      verse_coverage: chapterVerseRefs(book.osis, chapter).map((ref) => ({ ref, status: 'not_reviewed' as const })),
      candidates: [],
      session_log: null,
    });
    created = true;
  }
  const data = store.read(ChapterExtraction, file);
  const job = createJob(store, {
    subject_kind: 'chapter',
    subject_id: `${book.osis}.${chapter}`,
    book: book.osis,
    chapter,
    stage: 'scripture_extraction',
    priority: 'medium',
    note: 'Rule 01 extraction',
  });
  // A completed extraction closes its job so it is no longer offered for resumption.
  if (data.status === 'complete' && job.status !== 'published') {
    checkpointJob(store, job.id, { outcome: 'completed', status: 'published', note: 'Rule 01 extraction complete' });
  }
  const reviewed = data.verse_coverage.filter((v) => v.status !== 'not_reviewed').length;
  const nextOperation =
    data.status === 'complete'
      ? `Extraction for ${book.name} ${chapter} is complete. Next: research queued candidates (rules/02).`
      : `Claude Code: read ${book.name} ${chapter} (data/seed/scripture/web/${book.osis}.json) from ${data.resume_from ?? 'verse 1'} ` +
        `per rules/01-scripture-extraction.md; record coverage + candidates in ${store.rel(file)}; then run pnpm research:validate.`;
  return { file, created, jobId: job.id, verses: data.verse_coverage.length, reviewed, nextOperation };
}

import { newId, type ResearchPriority } from '@atlas/shared';
import { ResearchJob, type StageKey } from './schemas.ts';
import { now, type ResearchStore } from './store.ts';
import type { z } from 'zod';

type Stage = z.infer<typeof StageKey>;

const STAGE_STATUS: Record<Stage, ResearchJob['status']> = {
  scripture_extraction: 'extracting',
  historical_reconstruction: 'context_research',
  external_evidence: 'external_research',
  cross_referencing: 'cross_referencing',
  publication_validation: 'validating',
};

export function createJob(
  store: ResearchStore,
  init: { subject_kind: ResearchJob['subject_kind']; subject_id: string; book?: string | null; chapter?: number | null; stage: Stage; priority: ResearchPriority; note?: string },
): ResearchJob {
  const existing = store.jobs().find((j) => j.subject_kind === init.subject_kind && j.subject_id === init.subject_id && j.stage === init.stage && j.status !== 'published');
  if (existing) return existing;
  const id = newId('researchJob');
  const t = now();
  return store.write(ResearchJob, store.jobFile(id), {
    id,
    subject_kind: init.subject_kind,
    subject_id: init.subject_id,
    book: init.book ?? null,
    chapter: init.chapter ?? null,
    stage: init.stage,
    status: 'queued',
    priority: init.priority,
    checkpoint: { note: init.note ?? null, resume_from: null, files: [] },
    attempts: [],
    created_at: t,
    updated_at: t,
  });
}

export function checkpointJob(
  store: ResearchStore,
  id: string,
  patch: { stage?: Stage; note?: string | null; resume_from?: string | null; files?: string[]; outcome?: 'completed' | 'interrupted' | 'blocked'; status?: ResearchJob['status'] },
): ResearchJob {
  const job = store.read(ResearchJob, store.jobFile(id));
  const t = now();
  const stage = patch.stage ?? job.stage;
  const attempts = [...job.attempts];
  const open = attempts.findLast((a) => a.ended === null);
  if (patch.outcome && open) {
    open.ended = t;
    open.outcome = patch.outcome;
    open.notes = patch.note ?? null;
  } else if (!open) {
    attempts.push({ stage, started: t, ended: null, outcome: null, notes: null });
  }
  return store.write(ResearchJob, store.jobFile(id), {
    ...job,
    stage,
    status: patch.status ?? (patch.outcome === 'blocked' ? 'blocked' : STAGE_STATUS[stage]),
    checkpoint: {
      note: patch.note !== undefined ? patch.note : job.checkpoint.note,
      resume_from: patch.resume_from !== undefined ? patch.resume_from : job.checkpoint.resume_from,
      files: patch.files ?? job.checkpoint.files,
    },
    attempts,
    updated_at: t,
  });
}

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low', 'background'];

/** Jobs that should be resumed before new work starts, most important first. */
export function resumableJobs(store: ResearchStore): ResearchJob[] {
  return store
    .jobs()
    .filter((j) => !['published', 'publishable', 'blocked', 'needs_review'].includes(j.status) && !j.is_fixture)
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || a.created_at.localeCompare(b.created_at));
}

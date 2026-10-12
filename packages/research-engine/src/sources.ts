import { newId, VERIFICATION_LEVELS, type VerificationLevel } from '@atlas/shared';
import { canAdvanceVerification, dedupeKey } from '@atlas/source-registry';
import { SourceFile } from './schemas.ts';
import { today, type ResearchStore } from './store.ts';
import type { z } from 'zod';

export type NewSource = Omit<z.input<typeof SourceFile>, 'id' | 'verification_level' | 'verification_log'> & {
  verification_level?: VerificationLevel;
  verification_method: string;
};

/** Ancient texts are identified by their standard reference (e.g. "Josephus, Ant. 10.10.4"), since many passages share one URL. */
const keyOf = (s: { doi?: string | null | undefined; url?: string | null | undefined; title: string; standard_reference?: string | null | undefined; source_type?: string }) =>
  s.source_type === 'ancient_primary_text' && s.standard_reference
    ? `ref:${s.standard_reference.trim().toLowerCase().replace(/\s+/g, ' ')}`
    : dedupeKey({ doi: s.doi ?? undefined, url: s.url ?? undefined, title: s.title });

/** Register a source, or return the existing record when it is a duplicate (SPEC 10.3 dedupe). */
export function registerSource(store: ResearchStore, input: NewSource): { source: SourceFile; duplicate: boolean } {
  const key = keyOf(input);
  const existing = store.sources().find((s) => keyOf(s) === key);
  if (existing) return { source: existing, duplicate: true };
  const level = input.verification_level ?? 'discovered';
  // Every level up to the claimed one must be justified by the single method given; refuse to skip past metadata.
  if (VERIFICATION_LEVELS.indexOf(level) > VERIFICATION_LEVELS.indexOf('source_accessed')) {
    throw new Error('New sources may be registered at most at source_accessed; claim_checked requires a recorded check.');
  }
  const { verification_method, ...rest } = input;
  const id = newId('source');
  const source = store.write(SourceFile, store.sourceFile(id), {
    ...rest,
    id,
    verification_level: level,
    verification_log: [{ level, date: today(), method: verification_method, notes: null }],
  });
  return { source, duplicate: false };
}

/** Advance a source one verification level, recording how (SPEC 10.2). */
export function advanceVerification(store: ResearchStore, id: string, to: VerificationLevel, method: string, notes: string | null = null): SourceFile {
  const s = store.read(SourceFile, store.sourceFile(id));
  if (to === 'human_reviewed') throw new Error('human_reviewed is set only through the review workflow (pnpm review:approve).');
  if (!canAdvanceVerification(s.verification_level, to)) {
    throw new Error(`Cannot move ${id} from ${s.verification_level} to ${to}; levels advance one step at a time.`);
  }
  return store.write(SourceFile, store.sourceFile(id), {
    ...s,
    verification_level: to,
    accessed_at: to === 'source_accessed' ? today() : s.accessed_at,
    verification_log: [...s.verification_log, { level: to, date: today(), method, notes }],
  });
}

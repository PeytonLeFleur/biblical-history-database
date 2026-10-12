import { z } from 'zod';
import { SourceType, VERIFICATION_LEVELS, VerificationLevel } from '@atlas/shared';

/** Minimal source record shape (SPEC 10). Database tables mirror this in @atlas/database. */
export const SourceRecord = z.object({
  id: z.string().regex(/^src_[0-9A-Z]{26}$/),
  title: z.string().min(1),
  sourceType: SourceType,
  authors: z.array(z.string()).default([]),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  url: z.url().optional(),
  doi: z.string().optional(),
  license: z.string().optional(),
  verificationLevel: VerificationLevel,
  accessedAt: z.string().optional(),
  isFixture: z.boolean().default(false),
});
export type SourceRecord = z.infer<typeof SourceRecord>;

export const verificationRank = (l: VerificationLevel) => VERIFICATION_LEVELS.indexOf(l);

/**
 * Verification may only advance one step at a time, except human review which requires claim_checked.
 * A working URL or DOI never implies claim support (SPEC 10.2).
 */
export function canAdvanceVerification(from: VerificationLevel, to: VerificationLevel): boolean {
  return verificationRank(to) === verificationRank(from) + 1;
}

/** Normalize a URL / DOI for deduplication. */
export function dedupeKey(s: { doi?: string | undefined; url?: string | undefined; title: string }): string {
  if (s.doi) return `doi:${s.doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}`;
  if (s.url) {
    const u = new URL(s.url);
    return `url:${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`.toLowerCase();
  }
  return `title:${s.title.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

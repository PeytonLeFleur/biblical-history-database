import { newId } from '@atlas/shared';
import { EvidenceDossier, EventRecord, ReviewItem } from './schemas.ts';
import { now, today, type ResearchStore } from './store.ts';

export function queueReview(
  store: ResearchStore,
  init: { record_kind: string; record_id: string; record_revision: number; reason: string; triggers: string[] },
): ReviewItem {
  const existing = store.reviews().find((r) => r.record_id === init.record_id && r.status === 'open' && r.reason === init.reason);
  if (existing) return existing;
  const id = newId('review');
  return store.write(ReviewItem, store.reviewFile(id), { ...init, id, status: 'open', created_at: now(), decisions: [] });
}

export function findReview(store: ResearchStore, id: string): ReviewItem {
  const r = store.reviews().find((x) => x.id === id || x.record_id === id);
  if (!r) throw new Error(`No review item ${id}`);
  return r;
}

/** Find the event that owns a claim (claims live inside evidence.json). */
function claimOwner(store: ResearchStore, claimId: string): string | null {
  for (const id of store.eventIds()) {
    if (store.evidence(id)?.claims.some((c) => c.id === claimId)) return id;
  }
  return null;
}

function currentRevision(store: ResearchStore, kind: string, recordId: string): number {
  if (kind === 'event') return store.event(recordId).revision;
  if (kind === 'claim') {
    const owner = claimOwner(store, recordId);
    return owner ? store.event(owner).revision : 1;
  }
  return 1;
}

/**
 * Record an owner decision (SPEC 9.4). Approval applies only to the revision that was reviewed; if the record
 * changed since the item was queued, approval is refused so stale reviews are never applied.
 */
export function decide(
  store: ResearchStore,
  id: string,
  decision: 'approve' | 'reject' | 'return',
  reviewer: string,
  rationale: string | null,
): ReviewItem {
  const item = findReview(store, id);
  if (item.status === 'decided') throw new Error(`${item.id} is already decided.`);
  if (!reviewer.trim()) throw new Error('Reviewer identity is required (set REVIEWER_ID).');
  const revision = currentRevision(store, item.record_kind, item.record_id);
  if (decision === 'approve' && revision !== item.record_revision) {
    throw new Error(`${item.record_id} is at revision ${revision}, but the review was queued for revision ${item.record_revision}. Re-queue before approving.`);
  }
  const updated = store.write(ReviewItem, store.reviewFile(item.id), {
    ...item,
    status: decision === 'return' ? 'returned' : 'decided',
    decisions: [...item.decisions, { decision, reviewer, decided_at: now(), record_revision: revision, rationale }],
  });

  // Apply the effect to the reviewed record.
  if (item.record_kind === 'claim') {
    const owner = claimOwner(store, item.record_id);
    if (owner) {
      const ev = store.evidence(owner)!;
      const status = decision === 'approve' ? ('human_approved' as const) : decision === 'reject' ? ('human_rejected' as const) : ('requires_review' as const);
      store.write(EvidenceDossier, store.eventFile(owner, 'evidence'), {
        ...ev,
        claims: ev.claims.map((c) => (c.id === item.record_id ? { ...c, reviewer_status: status } : c)),
      });
    }
  } else if (item.record_kind === 'event' && decision === 'approve') {
    const ev = store.event(item.record_id);
    store.write(EventRecord, store.eventFile(ev.id, 'event'), { ...ev, last_reviewed_at: today() });
  }
  return updated;
}

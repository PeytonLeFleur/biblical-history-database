import type { ComputedInterval } from './solver.ts';

/** Reign-structure checks (SPEC 12.8 #5): coregencies must overlap; sequential successions must not overlap. */
export interface ReignLink {
  id: string;
  isCoregency: boolean;
  coregentWith?: string | null;
  predecessor?: string | null;
}

export interface ReignIssue {
  reign: string;
  message: string;
}

export function checkReignStructure(reigns: ReignLink[], computed: Map<string, ComputedInterval>): ReignIssue[] {
  const issues: ReignIssue[] = [];
  const startLo = (id: string) => computed.get(id)?.start.earliest.value ?? null;
  const endHi = (id: string) => computed.get(id)?.end.latest.value ?? null;
  const endLo = (id: string) => computed.get(id)?.end.earliest.value ?? null;
  const startHi = (id: string) => computed.get(id)?.start.latest.value ?? null;
  for (const r of reigns) {
    if (r.isCoregency) {
      if (!r.coregentWith) {
        issues.push({ reign: r.id, message: 'Coregency without a coregent reign' });
        continue;
      }
      // Must be able to overlap: r.start < other.end and other.start < r.end
      const a = startLo(r.id);
      const b = endHi(r.coregentWith);
      const c = startLo(r.coregentWith);
      const d = endHi(r.id);
      if (a !== null && b !== null && a >= b) issues.push({ reign: r.id, message: `Coregency cannot overlap ${r.coregentWith}` });
      if (c !== null && d !== null && c >= d) issues.push({ reign: r.id, message: `Coregency cannot overlap ${r.coregentWith}` });
    } else if (r.predecessor) {
      // Sequential succession: predecessor must be able to end no later than this reign starts.
      const predEnd = endLo(r.predecessor);
      const start = startHi(r.id);
      if (predEnd !== null && start !== null && predEnd > start + 1e-9) {
        issues.push({ reign: r.id, message: `Sequential reign starts before predecessor ${r.predecessor} can end — model as coregency?` });
      }
    }
  }
  return issues;
}

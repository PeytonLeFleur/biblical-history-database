/** Export guards (SPEC 17.1, 2.4). Fixtures and anything depending on a fixture never reach public exports. */
export interface ExportableRecord {
  id: string;
  isFixture?: boolean;
  restricted?: boolean;
  dependsOn?: readonly string[];
}

export function filterPublishable<T extends ExportableRecord>(records: readonly T[]): T[] {
  const excluded = new Set(records.filter((r) => r.isFixture || r.restricted).map((r) => r.id));
  // Propagate exclusion through dependencies until stable.
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of records) {
      if (!excluded.has(r.id) && r.dependsOn?.some((d) => excluded.has(d))) {
        excluded.add(r.id);
        changed = true;
      }
    }
  }
  return records.filter((r) => !excluded.has(r.id));
}

export function assertNoFixtures(records: readonly ExportableRecord[]): void {
  const bad = records.filter((r) => r.isFixture);
  if (bad.length > 0) throw new Error(`Export rejected: ${bad.length} fixture record(s): ${bad.map((r) => r.id).join(', ')}`);
}

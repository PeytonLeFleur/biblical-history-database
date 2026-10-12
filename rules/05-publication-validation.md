# Rule 05: Publication and Validation

**Stage key:** `publication_validation` · **Research status while active:** `validating` → `needs_review` | `publishable` | `published` · **SPEC:** Parts 8 (Rule 05), 9.3, 16, 17

## Purpose
Merge a researched record into the global database and run every automated check. The result is a readable dossier generated from the structured data, published with an honest status label. Disputes and gaps stay visible.

## Inputs
- A job at stage 5, plus `candidate.json`, `context.json`, `evidence.json` and `crossrefs.json`.
- The global database (Postgres) and the source registry.
- `standards/publication.md`, `standards/copyright.md`.

## Required tasks
1. **Import** the stage files into the database through the research-engine importer. The importer is idempotent and keyed on permanent IDs, and it bumps `revision` on any material change, writing a revision-history row.
2. **Run the validators** (`pnpm research:validate --event <id>`):
   - Biblical references resolve in the verse inventory.
   - Entity relationships point to existing records. There are no orphans.
   - Every citation resolves to a registered source, and source metadata is complete for its type.
   - Evidence classifications obey the Rule 03 constraints.
   - Chronology: `pnpm chronology:validate` passes for affected models, with no contradictions and no impossible intervals.
   - Geography: coordinates are valid and every coordinate has a source.
   - Duplicates: run duplicate-event detection on the passage overlap plus the title and participant similarity.
   - Completeness: all five stages are `complete` (or `not_applicable` with reasons).
   - Copyright: quotation length per source is at most 25 words and at most one sentence, and no ESV or NKJV text is stored (`standards/copyright.md`).
   - Fixtures: `is_fixture` is false for the record and for everything it depends on.
3. **Decide the publication level** (SPEC 16):
   - `preliminary`: the SPEC 16.1 criteria are met. Show a visible preliminary label.
   - `researched`: the SPEC 16.2 criteria are met, including a passing audit.
   - `human_reviewed`: **only** through an explicit owner review decision (`pnpm review:approve`) that records the reviewed revision.
4. **Queue reviews** for any SPEC 9.3 trigger. A record with an unresolved required review may still publish as `preliminary` or `researched`, but the open review item is shown.
5. **Generate the dossier** (`dossier.md`, then the website JSON) from the structured data only. Sections follow SPEC 15.2. Citations sit next to the statements they support. Disputes, open questions and research gaps appear on the page and are never hidden.
6. **Update progress counters** for the book: coverage, extraction, historical research, external evidence, chronology validation, cross-referencing, source verification, human review and publication readiness (SPEC 16.4). Each is counted separately.
7. **Export** with `pnpm research:export`, which passes through `filterPublishable()` (no fixtures, no restricted material, no dependents of either).

## Output schema: `research/events/<evt_ULID>/validation.json`

```jsonc
{
  "event_id": "evt_…",
  "revision": 4,
  "validated_at": "2026-10-12",
  "checks": [{ "name": "references_resolve", "passed": true, "details": [] }],
  "publication_level": "preliminary",
  "open_reviews": ["rev_…"],
  "research_gaps": ["…"],
  "disputes": ["…"],
  "export_eligible": true
}
```

## Error handling
- **Any failing check:** set status to `blocked` or back to the stage that owns the defect, record the failure details, and do not export.
- **Validator bug** (a false failure): fix the validator in code with a test. Never bypass the check for a single record.
- **The database is unavailable:** validate the JSON files offline (schema checks) and mark the database import as pending in `PROJECT_STATUS.md`.

## Checkpoints
Write `validation.json` on every run. Commit after each published unit.

## Completion criteria
1. All validators pass.
2. The publication level is set honestly, and is never `human_reviewed` without a decision record.
3. The dossier is generated and the export succeeds with fixtures excluded.
4. Progress counters are updated.
5. `docs/PROJECT_STATUS.md` reflects the new state.

## Validation (meta)
- `pnpm test` covers each validator with positive and negative fixtures (fixtures live only under test directories, SPEC 17.1).
- The export test asserts that a planted fixture record and its dependents are absent from the output.
- Reported status must never confuse a programmatically valid record with a historically verified one. The UI label and the dossier text both say which one applies.

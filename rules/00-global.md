# Rule 00: Global Research Rules

Applies to every research stage (01–05). If these rules conflict with a stage rule, the stricter rule wins. `docs/SPEC.md` is authoritative over both.

> **Note:** Every example value in the rule and standard files (dates, strata, sources, IDs) only illustrates the *format*. None of it is a research finding. It must never be copied into research records without independent sourcing.

## 0.1 The four categories (SPEC 1.2)

Every recorded statement belongs to exactly one category. The category is stored in the `layer` field.

| `layer` | Meaning | Example |
|---|---|---|
| `text` | What Scripture explicitly records | "Amos 1:1 dates Amos's words two years before the earthquake." |
| `interpretation` | What commentators or traditions conclude | "Guzik reads the earthquake as a well-remembered national event." |
| `reconstruction` | What scholars infer about circumstances or dates | "Proposals place the earthquake c. 760 BC." |
| `evidence` | What independent documents, archaeology, or science establish | "Destruction layers at Hazor stratum VI show seismic damage." |

Never merge layers into one sentence-level conclusion. A dossier paragraph may discuss several layers, but each underlying claim record carries one layer.

## 0.2 Honesty requirements

1. **No fabrication.** Never invent sources, authors, DOIs, page numbers, quotations, coordinates, dates, or findings. If something cannot be found, record that it was searched for and not found.
2. **Access honesty.** Record the verification level a source actually reached (see `standards/sources.md`). An abstract-only read is `source_accessed` for the abstract only, and the record must say so in `access_notes`.
3. **No false completion.** A stage is complete only when its completion criteria are met. When context or tools run out mid-stage, checkpoint the stage as `in_progress` with `resume_from` notes.
4. **Machine vs human.** Every classification created by Claude Code has `reviewer_status: machine_proposed` or `requires_review`. Only the owner, through `pnpm review:approve`, produces `human_approved`.
5. **Software ≠ research.** A passing validator means the data is well-formed. It does not mean the history is correct. Never report one as the other.

## 0.3 Session protocol (SPEC Part 21)

**Start of session:**
1. Read `CLAUDE.md`, `docs/PROJECT_STATUS.md`, `docs/NEXT_ACTION.md`.
2. Read the SPEC sections and rules/standards relevant to the next action.
3. Run `git log --oneline -10` and `pnpm research:status`.
4. Resume any job with `pnpm research:resume` before starting new work.

**Unit of work:** one chapter, or up to three substantial events (SPEC 4.3). Checkpoint after every completed unit.

**End of session:**
1. Save all structured research files (see §0.5).
2. Run `pnpm test` and `pnpm research:validate`.
3. Update `docs/PROJECT_STATUS.md` (milestone, done, not done, test results, blockers, source limitations, latest commit).
4. Rewrite `docs/NEXT_ACTION.md` with one concrete next task.
5. Commit and push.

## 0.4 Research budget defaults (SPEC 4.2)

- Paid APIs, paid cloud services and automated paid calls: **none**.
- At most 3 concurrent retrievals per host, and at most 3 retries with backoff.
- Up to about 15 distinct search queries per substantial event before judging whether more depth is warranted.
- Aim for about 8 genuinely distinct sources for a substantial event *where they exist*. This is a target, not a quota. Never pad it.
- Log every search query with its date in the session log (§0.5) so the effort can be audited and repeated.

## 0.5 Where research is stored

The repository is the permanent memory. Everything needed to repeat a decision must be on disk.

```
research/
  books/<book-slug>/
    book.json                     # book-level stage status + coverage summary
    extraction/ch-<NN>.json       # Rule 01 output per chapter
  events/<evt_ULID>/
    candidate.json                # promoted candidate (Rule 01)
    context.json                  # Rule 02 dossier
    evidence.json                 # Rule 03 dossier
    crossrefs.json                # Rule 04 relationships
    validation.json               # Rule 05 audit result
    dossier.md                    # generated human-readable dossier (Rule 05)
  sources/<src_ULID>.json         # source registry (pnpm research:source add|verify|list)
  entities/<id>.json              # global people, places, kingdoms, reigns, chronology models, sites
  chronology/computed.json        # solver output (pnpm chronology:recalculate) — derived, never hand-edited
  queues/<job_ULID>.json          # research jobs + stage checkpoints
  reviews/<rev_ULID>.json         # human review queue items + decisions
  reviews/private/                # gitignored — never published
  logs/<YYYY-MM-DD>-<topic>.md    # session log: queries, sources examined, dead ends
```

Events have an `event.json` (the promoted record with per-stage status) alongside the stage files.

All JSON files use permanent prefixed ULIDs (SPEC 3.6) and are validated by the Zod schemas in `packages/research-engine/src/schemas.ts`. Where a schema and a rule file disagree, the rule file wins and the schema must be fixed.

## 0.6 Shared fields on every research record

```jsonc
{
  "id": "evt_01J…",              // permanent prefixed ULID
  "slug": "amos-earthquake",     // human-readable, mutable, never used as identity
  "is_fixture": false,           // true only in tests/
  "created_at": "2026-10-12",
  "updated_at": "2026-10-12",
  "research_stage": "external_evidence",
  "revision": 3,                 // increments on every material change
  "provenance": { "session_log": "research/logs/2026-10-12-amos.md", "operator": "claude-code" }
}
```

## 0.7 Uncertainty

- Every date is an interval with a precision label and a derivation. Never a bare number.
- Every location carries a confidence and, where disputed, all candidate hypotheses.
- Every relationship carries `confidence` (`high` | `medium` | `low` | `speculative`) and `provenance`.
- When unsure whether something is an event, record it as a candidate with `ambiguities` filled in. Do not drop it and do not over-promote it.

## 0.8 Copyright and sources

Follow `standards/copyright.md`. In short: paraphrase. At most one quotation of 25 words or less per external copyrighted source per dossier. No bulk scraping. No storing ESV or NKJV text. WEB is stored unchanged.

## 0.9 Escalation

Send a record to the review queue (`research/reviews/`) whenever SPEC 9.3 applies. `requiresHumanReview()` in `@atlas/shared` implements those triggers. Never wait for the owner to respond. Queue the item and continue with independent work.

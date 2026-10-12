# Project Status

**Current milestone:** 2 (Biblical and historical data foundation): complete · next is Milestone 3 (research and chronology engines + Amos earthquake pilot)
**Last updated:** 2026-10-12

## Milestone 1: Repository and foundation ✅
- Public repo `PeytonLeFleur/biblical-history-database`, verified under the authenticated account (renamed from an empty `bible-knowledge` repo created the same day).
- `docs/SPEC.md` saved verbatim (24 Parts). `CLAUDE.md`, rules 00–05, eight standards, architecture, method and deployment docs.
- pnpm monorepo: Node 24, TS 5.9 strict, ESLint 9, Vitest 5.
- CI ✅ and GitHub Pages ✅ verified: https://peytonlefleur.github.io/biblical-history-database/ (home, books, methodology, progress and about all return 200).

## Milestone 2: Data foundation ✅
- **66 books / 1,189 chapters / 31,102 canonical verses** indexed with OSIS identifiers and `canon_index` ordinals for range queries.
- **WEB (engwebp) imported unchanged:** 31,103 WEB verses stored. Romans doxology versification mapped (WEB 14:24–26 → canonical 16:25–27). 4 verses the WEB leaves empty are documented. Provenance, checksums and licence are in `data/imports/README.md`.
- ESV and NKJV are registered as reference-only translations. No text is stored.
- **Drizzle schema plus first migration: 52 tables** covering all 44 SPEC Part 11 groups. That includes scripture, coverage, events and mentions, people and aliases, kingdoms and dynasties, places, ancient names, PostGIS location hypotheses and regions, chronology models, synchronisms, constraints, calendars, regnal conventions, reigns, date hypotheses, visions, prophecies, fulfillments, genealogies, sites, artifacts, documents, sources, news, verification, claims, evidence and claim-evidence links, cross-references, historical relationships, research jobs, attempts and logs, the review queue and decisions, publication status, revision history, entity redirects and citations. Enums are generated from `@atlas/shared`, so code and DB cannot drift.
- Full-text GIN indexes (verse text, events, sources, people, places) and GiST geometry indexes.
- Seed is idempotent and never resets coverage. Every verse starts as `not_reviewed`.
- API `/health` reports `db: ok` against the live DB.

## Test results (local, 2026-10-12)
lint ✓ · typecheck ✓ (11 packages + root scripts) · tests **48/48** ✓ (35 unit + 13 DB integrity) · web build ✓

## Incomplete / not started
- Milestone 3: five-stage orchestration, Zod research-file schemas, importer, checkpoints, source registration/verification CLI, the chronology constraint solver, regnal conventions, calendar conversion, review CLI, audits, and the **Amos 1:1 / Zech 14:5 earthquake pilot**.
- Milestones 4–7.
- API read-only endpoints (events, entities, sources, research status) are waiting on M3 data.
- Hebrew and Greek versification mappings (listed in `data/imports/README.md`).

## Research progress
**No historical research performed yet.** Verse coverage: 0 / 31,102 reviewed. Events: 0. Sources: 0.

## Blockers
None.

## Source and research limitations
- OpenBible.info, TSK and Pleiades licences not yet verified, so they have not been imported.
- No ruler or synchronism data seeded. Those require sourced research (M3+).

## Environment notes
- Homebrew `node` v25 is broken (missing libsimdjson). Use `/opt/homebrew/opt/node@24/bin`.
- Docker Postgres/PostGIS on localhost:**5433** (avoids clashing with any local 5432).

# Project Status

**Current milestone:** 3 (Research and chronology engines + Amos earthquake pilot): complete · next is Milestone 4 (public research website)
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

## Milestone 3: Research and chronology engines ✅
- **Chronology engine** (`packages/chronology-engine`):
  - Simple Temporal Network solver (Bellman–Ford), with derivation chains for every bound.
  - Model isolation, alternative hypotheses solved per combination, and contradiction diagnostics that list the constraint cycle. Global cycle detection also catches undated items.
  - Regnal-year engine (accession / non-accession; conservative Nisan/Tishri windows).
  - Julian/Gregorian/JDN conversion (Meeus) and reign-structure checks.
  - All 12 SPEC 12.8 consistency tests, plus the **Dan 1:1 / Jer 25:1** reckoning test (synthetic inputs).
- **Research engine** (`packages/research-engine`):
  - Zod schemas for every rule file, a file store, jobs and checkpoints, and chapter preparation.
  - Source registry with DOI/URL dedupe and a one-step verification ladder.
  - Entity matching (aliases, fuzzy), duplicate-event detection (passage overlap + word-set title similarity).
  - Revision-locked review decisions.
  - Repository validator (coverage, references, citations, classification rules, copyright quote cap, fixtures, chronology).
  - Per-event audit that sets the publication level, dossier rendering (with computed chronology per model), fixture-safe static export, and an idempotent DB importer with dry run.
- **CLI:** every `research:*`, `chronology:*` and `review:*` command works. `review:approve` and `review:reject` require an interactive owner confirmation, so Claude cannot approve its own work.
- **API:** `/events`, `/events/:id`, `/entities/:id`, `/sources/:id` and `/research/status` (read-only; never serves fixtures or unpublished records).
- **CI:** now also runs `research:validate`, `chronology:validate` and a real research import against PostGIS.

### Pilot research (genuine)
- **Amos 1 extraction complete:** 15/15 verses reviewed, 13 candidates (superscription, earthquake, 1:2 oracle, 5 oracles against the nations, and 5 historical references inside them).
- **"The earthquake in the days of Uzziah"** (`evt_01M4RPJVYKCVT323B86C2GGDXN`): all five stages complete, publication level **researched** (not human reviewed), status `needs_review`.
  - 17 sources registered at honest verification levels, 5 claims, 7 evidence findings, 12 relationships.
  - Computed windows: **Thiele 791–750 BC · Albright 782–743 BC** (undated without a model).
  - Dossier: `research/events/evt_01M4RPJVYKCVT323B86C2GGDXN/dossier.md`. Session log: `research/logs/2026-10-12-amos-earthquake.md`.
- "Amos's prophetic words (dated by Amos 1:1)" is queued for its own research (stages 2–5 not started).


## Test results (local, 2026-10-12)
lint ✓ · typecheck ✓ · tests **85/85** ✓ (unit + DB integrity + importer dry run + API) · `research:validate` ✓ (1 warning: City of David report not traced to an original publication) · `chronology:validate` ✓ · web build ✓

## Research progress
- Verse coverage: **15 / 31,102** reviewed (Amos 1). Chapters extracted: 1 (Amos 1).
- Events: 2 (1 researched, 1 queued). Sources: 17. Entities: 15. **Open owner reviews: 1** (disputed single-event 750 BC claim; run `pnpm review:list`).
- No book is "researched". Human review: 0 records.

## Incomplete / not started
- Milestone 4 (website): design system, explorers, dossier pages, MapLibre map, timeline, search, Pages data integration.
- Milestones 5–7.
- Synchronism *records* (e.g. 763 BC eclipse, Qarqar) are not yet researched. The synchronism schema and solver anchoring exist.
- Lunar calendar conversion uses conservative windows. Parker & Dubberstein tables are not imported.
- Hebrew/Greek versification mappings.

## Blockers
None.

## Source and research limitations
- Paywalled full texts not accessed: Austin et al. 2000, Kagan et al. 2011 (and its correction), Ambraseys 2009, Thiele 1983, Albright 1945. Reign dates come via Wikipedia summaries citing them.
- The mid-8th-century Dead Sea seismites are known only through a secondary catalog. They do not appear in the Kagan 2011 abstract.
- No peer-reviewed publication was identified for the City of David earthquake layer.
- OpenBible.info, TSK and Pleiades bulk-import licences not yet verified. Four Pleiades records are cited individually (CC BY 3.0).

## Environment notes
- Homebrew `node` v25 is broken (missing libsimdjson). Use `/opt/homebrew/opt/node@24/bin`.
- Docker Postgres/PostGIS on localhost:**5433**. Check for stale API processes on test ports before smoke tests.

## Latest commit
See `git log -1`.

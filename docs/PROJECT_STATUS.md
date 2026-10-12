# Project Status

**Current milestone:** 1 (Repository and project foundation): complete pending CI verification · Milestone 2 starting
**Last updated:** 2026-10-12

## Completed
- GitHub repo `PeytonLeFleur/biblical-history-database`. **Public**, verified under the authenticated account. It was renamed from an empty `bible-knowledge` repo created earlier the same day.
- `docs/SPEC.md`: full specification saved verbatim (all 24 Parts).
- pnpm monorepo (Node 24 LTS, TypeScript 5.9 strict, ESLint 9, Vitest 5), with the layout from SPEC Part 18.
- `@atlas/shared`: prefixed ULID IDs, every controlled taxonomy as Zod enums, astronomical-year helpers, SPEC 9.3 review triggers.
- `@atlas/scripture`: 66-book canon (OSIS/USFM/slug, 1,189 chapters), OSIS reference parsing and display.
- Basic utilities in chronology-engine (interval algebra), geography (coordinate validation), source-registry (schema, verification ladder, dedupe), validation (verse-inventory validator), static-export (fixture/restricted filtering) and research-engine (stage registry).
- `apps/api`: Fastify with validated config and `/health`.
- `apps/web`: Astro + Tailwind shell with base path `/biblical-history-database/`. It has five honest pages (home, books, methodology, progress, about) and no fabricated content.
- Rules `00`–`05`, all eight standards, ARCHITECTURE / RESEARCH_METHOD / DEPLOYMENT docs, `CLAUDE.md`.
- CLI: `research:status` and `review:list` work. Every other command exits 2 and names the milestone that implements it.
- CI and Pages workflows.

## Incomplete / next
- Milestone 2: WEB import, verse inventory, Drizzle schema plus migrations, seeds, DB integrity tests.
- Milestones 3–7 have not started.

## Test results (local, 2026-10-12)
lint ✓ · typecheck ✓ · unit tests 33/33 ✓ · web build ✓ (5 pages)

## Research progress
No research has been performed. 0 of 66 books extracted, 0 events, 0 sources.

## Blockers
- None. Local note: the Homebrew `node` (v25) is broken (missing libsimdjson). Use `/opt/homebrew/opt/node@24/bin`.

## Source and research limitations
- Dataset licences (OpenBible.info, TSK, Pleiades) are not yet verified.

## Latest commit
See `git log -1`.

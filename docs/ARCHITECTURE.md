# Architecture

See SPEC Part 3 for the fixed stack. This document records how it is put into practice.

## Runtime split
- **GitHub Pages (public):** the static Astro build of `apps/web`, plus JSON exports from `packages/static-export`. Browsing needs no database or server.
- **Local (owner/operator):** Postgres 16 + PostGIS 3.4 (Docker Compose, port 5433), `apps/api` (Fastify), the research CLI (`scripts/cli.ts`), migrations and seeds.

## Packages
| Package | Responsibility |
|---|---|
| `@atlas/shared` | Prefixed ULID IDs, controlled taxonomies (Zod), astronomical-year helpers, review triggers |
| `@atlas/scripture` | 66-book canon, OSIS parsing and display, WEB import |
| `@atlas/database` | Drizzle schema, migrations, seeds |
| `@atlas/research-engine` | Five-stage orchestration, jobs, checkpoints, importers (M3) |
| `@atlas/chronology-engine` | Interval algebra, then the constraint solver, regnal conventions and calendar conversion (M3) |
| `@atlas/geography` | Coordinate validation, location hypotheses |
| `@atlas/source-registry` | Source schema, verification ladder, dedupe |
| `@atlas/validation` | Inventory, reference, citation and copyright validators |
| `@atlas/static-export` | Publishable-record filtering (no fixtures or restricted material), JSON export (M4) |

Internal packages are consumed as TypeScript source (`exports: ./src/index.ts`) through tsx, Vitest and Vite. There is no separate build step.

## Data flow
```
WEB (eBible.org, unchanged) ─▶ data/seed/scripture ─▶ Postgres verses + coverage
Claude Code research ─▶ research/**/*.json (Zod-validated) ─▶ importer ─▶ Postgres
Postgres / research files ─▶ validators ─▶ static-export (filterPublishable) ─▶ apps/web build ─▶ Pages
```

## Mapping
OpenFreeMap vector tiles by default, set by `config/map.json` (M4). Later option: self-hosted Protomaps PMTiles in `apps/web/public/tiles/`, served through the `pmtiles://` protocol in MapLibre, with no API key and no server.

## Decisions
- **TypeScript 5.9** rather than 7.x: typescript-eslint 8 supports TS <6.1.
- **Node 24 LTS**: the Homebrew default node 25 is broken locally. `.node-version` pins 24.
- **Vitest projects:** `unit` (no DB) and `db` (`*.db.test.ts`, which needs Postgres).

## Website (Milestone 4)
- `apps/web` is built **only** from `data/exports/*.json`, produced by `pnpm research:export` (which refuses to run if validation fails), plus the public-domain WEB text in `data/seed/scripture/web/`. The root `pnpm build` runs the export first.
- `src/lib/data.ts` is the build-time data layer. Pages never hold their own research content, and missing data renders labelled empty states.
- **Timeline** (`src/islands/Timeline.tsx`, React): it plots the chronology engine's exported intervals (reign start/end windows, event windows) and resolved derivation steps for every model. It has no hardcoded dates. It is server-rendered for no-JS readers, and a model switcher re-plots everything.
- **Map** (`src/islands/AtlasMap.tsx`, MapLibre GL 6 + OpenFreeMap from `config/map.json`):
  - Filled markers are verified identifications (confidence certain/probable *and* a claim-checked coordinate source). Hollow markers are proposed identifications.
  - Labels state whether a place's *association* with an event is probable or proposed.
  - The MapLibre worker is bundled through Vite `?worker&url`.
  - A server-rendered table is the fallback.
- **Search**: a build-time index (`/search-index.json`) with client-side ranked matching and Bible-reference resolution (`src/lib/refs.ts`, `src/lib/search.ts`).
- **Review status** is exported read-only (`reviews.json`, without rationale). The site has no review controls, and decisions are made with the local CLI only.
- **Tests:** `apps/web/e2e` (Playwright: routes, dossier integrity, timeline, map, search, mobile overflow, axe accessibility) and `apps/web/src/lib/*.test.ts` (Vitest).

# Next Action

**Milestone 4, step 1: wire the static site to the research exports and build the event dossier page.**

Context: M3 is complete. `pnpm research:export` writes `data/exports/{events,sources,entities,coverage,chronology,manifest}.json`. It holds one genuine researched event (the Amos earthquake) and must exclude fixtures and unpublished records. The Astro shell (`apps/web`) already has the palette, fonts and base path.

1. Make `apps/web` read `data/exports/*.json` at build time. Add a `prebuild` that runs `pnpm research:export` and fails if validation fails.
2. Build `/events/[slug]/` dossier pages following SPEC 15.2. The order and content should follow `renderDossier` in `packages/research-engine/src/dossier.ts`:
   - citations next to the claims they support
   - the classification and reviewer-status labels
   - the computed chronology per model, with its derivation
3. Build `/books/[slug]/` and `/books/[slug]/[chapter]/` pages showing verse coverage and candidates.
4. Next: sources directory, people/kingdom pages, MapLibre map (OpenFreeMap) using Pleiades-sourced points only, the timeline with reign bars and the model switcher, then search.
5. Use honest empty states. Never fabricate content to fill a page.

Pending owner action: `pnpm review:list`, which has one disputed claim waiting for review.

Start every session with `export PATH=/opt/homebrew/opt/node@24/bin:$PATH && pnpm db:up`.

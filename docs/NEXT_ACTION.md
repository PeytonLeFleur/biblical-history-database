# Next Action

**Milestone 2, task 1–4: import the World English Bible and build the verse inventory.**

1. Download the eBible.org `eng-web` (WEB Protestant edition, public domain) USFM zip into `data/imports/raw/web/` (gitignored).
2. Run `pnpm scripture:import` (`scripts/import-web.ts`) to parse the USFM into `data/seed/scripture/web/<OSIS>.json` with the text unchanged and footnotes stripped into separate annotations, plus `data/seed/scripture/verse-inventory.json`.
3. Validate with `validateVerseInventory()` and record the actual verse total in `data/imports/README.md` with the retrieval date and checksum.
4. Then write the Drizzle schema (SPEC Part 11), migrate and seed, and add `*.db.test.ts` integrity tests.

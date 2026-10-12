# Next Action

**Milestone 3, part 1: research-file schemas, importer and research CLI, then the Amos earthquake pilot.**

Context: the DB schema (52 tables) and the scripture foundation are complete and seeded. Rules 00–05 define the research JSON file formats.

1. In `packages/research-engine`, implement Zod schemas for every research file in rules 00–05 (`extraction/ch-NN.json`, `context.json`, `evidence.json`, `crossrefs.json`, `validation.json`, `queues/job_*.json`, `reviews/rev_*.json`).
2. Implement `pnpm research:chapter <book> <ch>`. It creates a job and writes a skeleton chapter file listing every verse as `not_reviewed`, then prints the next operation for Claude Code. Also implement `research:resume` and `research:validate` (schema plus coverage checks).
3. Implement the idempotent importer (research files → DB, with revision history) and the `review:*` commands.
4. Implement the chronology constraint solver (interval propagation, contradiction diagnostics, derivations) with the SPEC 12.8 tests, plus the Dan 1:1 / Jer 25:1 regnal-reckoning test.
5. **Pilot:** research the earthquake of Amos 1:1 / Zech 14:5 through all five stages, using real sources only. Start with `pnpm research:chapter amos 1`.

Start every session with `export PATH=/opt/homebrew/opt/node@24/bin:$PATH && pnpm db:up`.

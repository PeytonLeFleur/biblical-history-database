# CLAUDE.md: Biblical History Atlas

**`docs/SPEC.md` is the authoritative specification.** It overrides informal assumptions and this file. Never summarize it away or reconstruct it from memory.

## Start every session
1. Read `docs/PROJECT_STATUS.md` (current milestone, blockers) and `docs/NEXT_ACTION.md` (the one next task).
2. Read the SPEC sections, rules and standards relevant to that task.
3. Run `git log --oneline -10` and `pnpm research:status`.
4. If a research job is in progress, resume it before starting new work.

## Environment
- Node: Homebrew `node` (v25) is broken on this machine. Use LTS: `export PATH=/opt/homebrew/opt/node@24/bin:$PATH`.
- Package manager: pnpm (version pinned in `package.json`).
- DB: `pnpm db:up` (Docker, PostGIS on localhost:5433) → `pnpm db:migrate` → `pnpm db:seed`.
- Checks: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Research procedure
- Global rules: `rules/00-global.md`.
- Stages: `rules/01-scripture-extraction.md` → `02-historical-reconstruction` → `03-external-evidence` → `04-cross-referencing` → `05-publication-validation`.
- Standards: `standards/` (evidence, sources, chronology, geography, interpretation, publication, copyright, entity-resolution).
- Unit of work: one chapter, or up to three substantial events. Checkpoint after each unit.

## Non-negotiables
- Never fabricate sources, findings, dates or coordinates. Record the verification level actually reached.
- Keep text, interpretation, reconstruction and evidence separate.
- Machine-proposed is not human-reviewed. A passing validator is not historical verification.
- Never commit secrets, ESV/NKJV text, restricted downloads or fixtures in exports.
- Report progress honestly. Do not mark incomplete stages complete.

## End every session
Save structured research → run tests and validation → update `docs/PROJECT_STATUS.md` → rewrite `docs/NEXT_ACTION.md` → commit and push (only when green).

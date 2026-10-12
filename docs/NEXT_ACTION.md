# Next Action

**Milestone 5, session 1: Daniel 1, Rule 01 extraction, then the Babylonian deportation and Daniel's arrival in Babylon.**

Context: M1–M4 are complete, and the site publishes whatever passes `pnpm research:export`. One owner review is still open (the disputed 750 BC single-event claim for the Amos earthquake). Leave it as it is. Do not run `review:approve` or `review:reject`.

1. `export PATH=/opt/homebrew/opt/node@24/bin:$PATH && pnpm db:up && pnpm research:resume`
2. `pnpm research:chapter daniel 1`. Read Daniel 1 (WEB) per `rules/01-scripture-extraction.md`. Follow SPEC 6.2: the deportation and arrival of captives are historical; the court education and the diet decision are separate narrative episodes.
3. Create entities with entity resolution (`standards/entity-resolution.md`): Nebuchadnezzar (aliases Nebuchadrezzar, Nabû-kudurri-uṣur), Jehoiakim, Babylon, Judah (already exists: `kgd` Judah).
4. Research the deportation event through Rules 02–05. That includes the **Dan 1:1 / Jer 25:1 regnal-reckoning hypothesis** as alternative regnal conventions (`regnal_convention.alternative_group`) and connecting it to the Babylonian Chronicle where justified. Register sources honestly.
5. `pnpm research:validate && pnpm research:audit && pnpm research:export && pnpm build`, then the e2e tests. Open a PR and merge after CI passes.

Session boundary: one chapter or up to three substantial events. Checkpoint after each unit.

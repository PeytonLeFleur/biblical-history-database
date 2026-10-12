# Research Method

The procedure is set by `rules/00-global.md` through `rules/05-publication-validation.md`, governed by the standards in `standards/`. This page is a short orientation.

1. **Claude Code is the research operator** (SPEC 4.1). The CLI prepares jobs, validates, imports, checkpoints and exports. It never pretends to perform research itself. No paid APIs are used.
2. **Five stages per candidate:** extraction → historical reconstruction → external evidence → cross-referencing → publication and validation.
3. **Four layers are kept separate:** text, interpretation, reconstruction, evidence.
4. **Claims are classified one at a time** into the seven SPEC 9.1 classes. Every classification starts as `machine_proposed`.
5. **Sources move up a verification ladder** (discovered → metadata_verified → source_accessed → claim_checked → human_reviewed). The level recorded is the level actually reached.
6. **Sessions:** one chapter, or up to three substantial events. Checkpoint after each unit, and keep a session log with every search query.
7. **The owner is the human reviewer.** Items enter the queue on the SPEC 9.3 triggers, and decisions are made with `pnpm review:*`.

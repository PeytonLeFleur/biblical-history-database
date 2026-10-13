# Next Action

**Milestone 6: Cross-book historical validation** (SPEC Part 22, Milestone 6).

Milestone 5 is complete: Daniel 1–12, 357/357 verses. Open owner reviews: 117. Do not decide them. Owner review is the human step that remains.

Research the overlapping passages, reusing (not duplicating) the canonical events and entities established in Daniel. The table lists what already exists for each passage.

| Passage | Already in the database |
|---|---|
| 2 Kings 24 | the Dan 1:1 campaign; Jehoiakim; Nebuchadnezzar II; Jerusalem 597 (ABC 5 synchronism) |
| 2 Kings 25; Jeremiah 52 | the destruction of Jerusalem (not yet an event; create once and link from Dan 9's Jeremiah reading) |
| 2 Chronicles 36 | Jeremiah's seventy years; Cyrus's decree (Ezra 1 event) |
| Jeremiah 25 | the Jer 25:1 event (still *preliminary*: complete it) and the Jer 25:1 synchronism |
| Ezra 1 | the Cyrus decree event; the Cyrus Cylinder |
| Isaiah 44:28 – 45:1 | Cyrus as "anointed" (Driver's reading of Dan 9:25) |

**Tests to run:**
- shared events
- shared rulers
- the Babylonian exile chronology
- Jerusalem's destruction (587/586)
- Cyrus
- the royal decrees
- prophetic references
- historical synchronisms
- cross-book entity resolution

Start with `pnpm research:chapter 2-kings 24` (check the CLI's book slug). Then validate, audit, export, build, run e2e, open a PR per unit, merge after CI, and verify the deployed site.

Carried-over gaps: see the Milestone 5 summary in `docs/PROJECT_STATUS.md`.

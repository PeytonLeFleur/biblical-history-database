# Next Action

**1. Owner editorial review: the owner only.**
- Daniel is complete in research, cross-book validation, technical validation and deployment.
- Only the owner's decisions remain: **157 Daniel-related open review items**, plus 1 Amos item. Milestone 7 adds its own items (51 so far; 209 open in total; `pnpm review:list`).
- Work through `docs/reviews/DANIEL_OWNER_REVIEW_PACKAGE.md`. Each item gives its evidence, research state and an advisory recommendation.
- Decide with `pnpm review:approve <rev_id>`, `pnpm review:reject <rev_id>` or `pnpm review:return <rev_id>`.
- **Claude must never run approve or reject.**
- Returned items come back to Claude as research tasks.

**2. Milestone 7: full canon expansion** (SPEC Part 20).
- The owner review need not block it, but publication levels stay at *researched* until the reviews are decided.
- Prioritise books whose historical contexts overlap the existing records, to strengthen entity resolution and chronology. Suggested order:
  1. ~~**2 Kings 22–23**~~ (#23), ~~**2 Chronicles 34–35**~~ (#24) and ~~**Ezra 2–3**~~ (#25) and ~~**Ezra 4–5**~~ (#27) and ~~**Ezra 6**~~ (#28) and ~~**Haggai 1–2**~~ (#29) and ~~**Zechariah 1–14**~~ (#30–#33, #42, #43) , ~~**Ezra 7–8**~~ (#34) , ~~**Ezra 9–10**~~ (#35) and ~~**Nehemiah 1–13**~~ (#36–#41) are done; Ezra, Nehemiah, Haggai and Zechariah are complete.
  2. **Ezra 2–6 and Haggai–Zechariah 1–8:** the return and the Temple's rebuilding, using the existing Darius I decree and the 516/515 completion.
  3. **Nehemiah 1–2 and Ezra 7:** the Artaxerxes decrees already exist as events; complete their chapters.
  4. **Esther:** Xerxes I (P&D reigns).
  5. **Jeremiah 26–45 and Ezekiel 1, 24, 33, 40:** Ezekiel's dated oracles against the 586/587 models.
  6. **The rest of the canon,** in the order of SPEC Part 20.
- Next command: `pnpm research:chapter malachi 1` (Malachi 1–4 (English versification; Hebrew 3:19–24 = English 4:1–6): Edom's desolation (Mal 1:2–5; Nabataean displacement of Edom), polluted offerings and the governor (pechah, 1:8), priests and Levi's covenant, divorce and marrying the daughter of a foreign god (2:10–16, linked to Ezra 9–10 / Neh 13), the messenger and Elijah (3:1; 4:5; Matt 11:10–14; Mark 1:2), tithes (3:8–10, linked to Neh 13:10–12); date relative to Nehemiah. Enduring Word, Keil Minor Prophets vol. 2 and an ICC Malachi (Smith, in the Mitchell volume) are the first sources.) Then Esther.

**Carried-over gaps** (see `docs/PROJECT_STATUS.md`, "Daniel completion state"): sources that are blocked or unavailable, and the engine's Nisan-window limitation for Nehemiah 2.

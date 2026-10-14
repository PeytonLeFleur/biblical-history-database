# Next Action

**1. Owner editorial review: the owner only.**
- Daniel is complete in research, cross-book validation, technical validation and deployment.
- Only the owner's decisions remain: **157 Daniel-related open review items**, plus 1 Amos item. Milestone 7 adds its own items (58 so far; 216 open in total; `pnpm review:list`).
- Work through `docs/reviews/DANIEL_OWNER_REVIEW_PACKAGE.md`. Each item gives its evidence, research state and an advisory recommendation.
- Decide with `pnpm review:approve <rev_id>`, `pnpm review:reject <rev_id>` or `pnpm review:return <rev_id>`.
- **Claude must never run approve or reject.**
- Returned items come back to Claude as research tasks.

**2. Milestone 7: full canon expansion** (SPEC Part 20).
- The owner review need not block it, but publication levels stay at *researched* until the reviews are decided.
- Prioritise books whose historical contexts overlap the existing records, to strengthen entity resolution and chronology. Suggested order:
  1. ~~**2 Kings 22–23**~~ (#23), ~~**2 Chronicles 34–35**~~ (#24) and ~~**Ezra 2–3**~~ (#25) and ~~**Ezra 4–5**~~ (#27) and ~~**Ezra 6**~~ (#28) and ~~**Haggai 1–2**~~ (#29) and ~~**Zechariah 1–14**~~ (#30–#33, #42, #43), ~~**Malachi**~~ (#44), ~~**Esther 1–5**~~ (#45, #46) , ~~**Ezra 7–8**~~ (#34) , ~~**Ezra 9–10**~~ (#35) and ~~**Nehemiah 1–13**~~ (#36–#41) are done; Ezra, Nehemiah, Haggai, Zechariah and Malachi are complete.
  2. **Ezra 2–6 and Haggai–Zechariah 1–8:** the return and the Temple's rebuilding, using the existing Darius I decree and the 516/515 completion.
  3. **Nehemiah 1–2 and Ezra 7:** the Artaxerxes decrees already exist as events; complete their chapters.
  4. **Esther:** Xerxes I (P&D reigns).
  5. **Jeremiah 26–45 and Ezekiel 1, 24, 33, 40:** Ezekiel's dated oracles against the 586/587 models.
  6. **The rest of the canon,** in the order of SPEC Part 20.
- Next command: `pnpm research:chapter esther 6` (Esther 6–10: the sleepless king and Mordecai honoured; the second banquet and Haman hanged; Mordecai's counter-decree of 23 Sivan, year 12 (P&D); the fighting of 13–14 Adar (473) and the institution of Purim (link to the later observance; 2 Macc 15:36 "Mordecai's day"); Mordecai second to the king; the chronicles of the kings of Media and Persia. Enduring Word Esther 6–10 already downloaded in dlJ.) Then Ezekiel 1, 24, 33, 40 and Jeremiah 26–45.

**Carried-over gaps** (see `docs/PROJECT_STATUS.md`, "Daniel completion state"): sources that are blocked or unavailable, and the engine's Nisan-window limitation for Nehemiah 2.

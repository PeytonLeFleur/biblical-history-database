# Next Action

**1. Owner editorial review: the owner only.**
- Daniel is complete in research, cross-book validation, technical validation and deployment.
- Only the owner's decisions remain: **157 Daniel-related open review items**, plus 1 Amos item. Milestone 7 adds its own items (60 so far; 218 open in total; `pnpm review:list`).
- Work through `docs/reviews/DANIEL_OWNER_REVIEW_PACKAGE.md`. Each item gives its evidence, research state and an advisory recommendation.
- Decide with `pnpm review:approve <rev_id>`, `pnpm review:reject <rev_id>` or `pnpm review:return <rev_id>`.
- **Claude must never run approve or reject.**
- Returned items come back to Claude as research tasks.

**2. Milestone 7: full canon expansion** (SPEC Part 20).
- The owner review need not block it, but publication levels stay at *researched* until the reviews are decided.
- Prioritise books whose historical contexts overlap the existing records, to strengthen entity resolution and chronology. Suggested order:
  1. ~~**2 Kings 22–23**~~ (#23), ~~**2 Chronicles 34–35**~~ (#24) and ~~**Ezra 2–3**~~ (#25) and ~~**Ezra 4–5**~~ (#27) and ~~**Ezra 6**~~ (#28) and ~~**Haggai 1–2**~~ (#29) and ~~**Zechariah 1–14**~~ (#30–#33, #42, #43), ~~**Malachi**~~ (#44), ~~**Esther**~~ (#45–#47) , ~~**Ezra 7–8**~~ (#34) , ~~**Ezra 9–10**~~ (#35) and ~~**Nehemiah 1–13**~~ (#36–#41) are done; Ezra, Nehemiah, Esther, Haggai, Zechariah and Malachi are complete (the post-exilic corpus).
  2. **Ezra 2–6 and Haggai–Zechariah 1–8:** the return and the Temple's rebuilding, using the existing Darius I decree and the 516/515 completion.
  3. **Nehemiah 1–2 and Ezra 7:** the Artaxerxes decrees already exist as events; complete their chapters.
  4. **Esther:** Xerxes I (P&D reigns).
  5. **Jeremiah 26–45 and Ezekiel 1, 24, 33, 40:** Ezekiel's dated oracles against the 586/587 models.
  6. **The rest of the canon,** in the order of SPEC Part 20.
- Next command: `pnpm research:chapter ezekiel 1` (Ezekiel's dated oracles against the 587/586 models, beginning with Ezek 1–3: the call in the 30th year / 5th year of Jehoiachin's exile, 4/IV (July 593 on P&D), at the Chebar canal; the 'thirtieth year' dispute; the merkabah vision. Then Ezek 8, 20, 24 (siege begun 10/X, linked to the existing event), 26–33 dated oracles, 33:21 (news of the fall), 40:1 (the 25th year). Keil Ezekiel and Enduring Word to fetch.) Then Jeremiah 26–45.

**Carried-over gaps** (see `docs/PROJECT_STATUS.md`, "Daniel completion state"): sources that are blocked or unavailable, and the engine's Nisan-window limitation for Nehemiah 2.

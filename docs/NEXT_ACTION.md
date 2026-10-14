# Next Action

**1. Owner editorial review: the owner only.**
- Daniel is complete in research, cross-book validation, technical validation and deployment.
- Only the owner's decisions remain: **157 Daniel-related open review items**, plus 1 Amos item. Milestone 7 adds its own items (48 so far; 206 open in total; `pnpm review:list`).
- Work through `docs/reviews/DANIEL_OWNER_REVIEW_PACKAGE.md`. Each item gives its evidence, research state and an advisory recommendation.
- Decide with `pnpm review:approve <rev_id>`, `pnpm review:reject <rev_id>` or `pnpm review:return <rev_id>`.
- **Claude must never run approve or reject.**
- Returned items come back to Claude as research tasks.

**2. Milestone 7: full canon expansion** (SPEC Part 20).
- The owner review need not block it, but publication levels stay at *researched* until the reviews are decided.
- Prioritise books whose historical contexts overlap the existing records, to strengthen entity resolution and chronology. Suggested order:
  1. ~~**2 Kings 22–23**~~ (#23), ~~**2 Chronicles 34–35**~~ (#24) and ~~**Ezra 2–3**~~ (#25) and ~~**Ezra 4–5**~~ (#27) and ~~**Ezra 6**~~ (#28) and ~~**Haggai 1–2**~~ (#29) and ~~**Zechariah 1–11**~~ (#30–#33, #42) , ~~**Ezra 7–8**~~ (#34) , ~~**Ezra 9–10**~~ (#35) and ~~**Nehemiah 1–13**~~ (#36–#41) are done; Ezra, Nehemiah and Haggai are complete.
  2. **Ezra 2–6 and Haggai–Zechariah 1–8:** the return and the Temple's rebuilding, using the existing Darius I decree and the 516/515 completion.
  3. **Nehemiah 1–2 and Ezra 7:** the Artaxerxes decrees already exist as events; complete their chapters.
  4. **Esther:** Xerxes I (P&D reigns).
  5. **Jeremiah 26–45 and Ezekiel 1, 24, 33, 40:** Ezekiel's dated oracles against the 586/587 models.
  6. **The rest of the canon,** in the order of SPEC Part 20.
- Next command: `pnpm research:chapter zechariah 12` (Zechariah 12–14: the second burden — Jerusalem a cup of reeling; "they will look on me whom they pierced" (John 19:37; Rev 1:7) and the mourning of Hadad-rimmon in the valley of Megiddo (link to Josiah's death at Megiddo); the fountain for sin; "strike the shepherd" (Matt 26:31); the day of the LORD, the Mount of Olives split, flight "as you fled from the earthquake in the days of Uzziah" (link to the Amos earthquake event); the nations keep the Feast of Booths. Queue proposed-fulfillment reviews with research/queue_fulfillments pattern.) Then Malachi, Esther.

**Carried-over gaps** (see `docs/PROJECT_STATUS.md`, "Daniel completion state"): sources that are blocked or unavailable, and the engine's Nisan-window limitation for Nehemiah 2.

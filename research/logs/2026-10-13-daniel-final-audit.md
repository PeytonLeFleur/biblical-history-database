# Session log: 2026-10-13 — Daniel final audit and gap research

Scope: every Daniel record. Verses 357; events 40 at the start (41 after this session, with the new composition event); 21 prophecy records; 71 interpretations at the start (73 after this session); 126 sources at the start; 98 claims at the start.
Method: a mechanical audit script, then the rule-by-rule checks below, then source work.

## Defects found and corrected
1. **Rule 04, completion criterion 1:** 37 events had no recorded 66-book name searches.
   - Backfilled with real searches of the WEB text over all 66 books, for every person, place and kingdom each event involves, aliases included.
   - Zero-hit searches are recorded too (e.g. "Antiochus", "Nabonidus", "Ptolemy").
   - Leads acted on:
     - Num 24:24 (Kittim)
     - Isa 13:17–19, 21:2 and Jer 51:28 (the Medes against Babylon; motif only)
     - Neh 12:22 ("Darius the Persian")
     - Ezra 4:5–7 (the list of Persian kings)
     - Mark 13:14
2. **SPEC 9.3 #1 and Rule 04:** missing review items.
   - 4 critical-priority events had no review item, and 10 `possible_identity` relationships were not `review_required`. All 14 are now queued.
   - The validator now enforces both checks (new test). It previously checked only proposed fulfillments.
3. **Record-level citations:** 59 Daniel entities had empty `citations`. They were filled from their own interpretations, aliases and hypotheses, the dossiers that use them, and, for 5 purely biblical figures, Driver and Enduring Word.
4. **Wikipedia as sole evidence:** 11 claim sides rested only on Wikipedia, including the supporting side of 3 "independently corroborated" claims. Each now has a primary or scholarly source read directly:
   - *RINBE* 1 (2024): Nebuchadnezzar's building and the East India House Inscription
   - *RINBE* 2 (2020): Nabonidus's dream inscriptions; the seven years of the Prayer of Nabonidus
   - Wiseman (1965) and Driver: Dan 1:1
   - Driver: Dura; Dan 2:1
   - Dougherty: the "son of the king" contract
   - Driver and Montgomery: the lions
   - Herodotus 1.107–108: dream interpreters
   - COJS: Jehoiachin's rations
   Wikipedia is kept only as context. **Reclassified:** the 4Q242 claim, from independently corroborated to strongly supported, because the Qumran text itself was not read.
5. **Missing commentary:** the Dan 2:46–49 event lacked an Enduring Word paraphrase (added). Carchemish now has a not-applicable reason.
6. **Composition dating (SPEC 5.5; M5 "composition dating debates"):**
   - Previously only one disputed claim on the Dan 7 dossier. It is now a full researched record, "Composition of the book of Daniel".
   - Three competing reconstructions: traditional sixth century; final composition c. 167–164; two-stage (Montgomery).
   - Scholarly arguments are separated from theological commitments, and a `not_empirically_testable` claim records the revelation question.
   - New evidence: the 4Q114 radiocarbon range of 230–160 BCE (Popović et al., PLOS ONE 2025); Sirach 49 (omits both Daniel and Ezra); 1 Macc 2:59–60; Jerome's prologue (Porphyry); Wilson (1917); Kitchen (1965), who says the language cannot decide the date; Mitchell & Joyce (1965).
7. **Idealist / symbolic readings:** previously almost absent (1 of 71). Added Keil (1872, read directly) on the seventy weeks (symbolic and amillennial-type, also citing Baldwin via Guzik) and on the 1,290 and 1,335 days (symbolic, with his objection to the Antiochus-death reading).

## Milestone 5 issues re-evaluated
- **Anderson (445 BC):**
  - In Parker & Dubberstein's table, the years beginning 26 Mar 446 and 13 Apr 445 are 384 days apart, which implies an intercalary month.
  - Separately, in Julian reckoning his dates are **173,882** days apart. Anderson's 173,880 comes from inclusive counting plus a Gregorian leap-year correction applied to Julian dates (his own footnote, p. 128).
  - Remains disputed. The interpretation summary is annotated.
- **Seleucus III vs IV (11:20):** a new independently corroborated claim (BM 35603, Appian 45, Jerome, 2 Macc 3) that the successor of Antiochus III was Seleucus IV. Guzik's "Seleucus III" is recorded as a variant and not silently corrected.
- **"King of Persia":**
  - The Old Persian is *xšâyathiya Pârsaiy*, a locative ("in Persia").
  - This narrows the Behistun challenge to Driver.
  - The claim remains disputed.
- **Antiochus's death vs the rededication:**
  - 2 Macc 9–11 (read directly) puts the death first; 1 Macc 6 and Josephus *Ant.* 12.9.1 put it after.
  - BM 35603 gives Kislimu 148 for news of the death.
  - The order depends on the open Seleucid-era epoch. A new disputed claim is queued; no constraint is forced.
- **Length of the desecration:**
  - 1 Macc (3 years 10 days) is preferred.
  - 2 Macc 10:3 ("two years") and *B.J.* 1.1.1 ("three years and six months", read directly) are recorded as counterevidence.
- **Nehemiah 2:** Noss & Thomas (UBS Handbook 2005) list three solutions; they are recorded. Horn & Wood (1954) is not accessible.
- **Ulai:** the Karkheh hypothesis is raised to "probable" (Pinches, ISBE; Pleiades). The Saimarreh is noted as the same river system. Not certain.
- **Wiseman (1965), read directly:**
  - Attributions verified (Dan 1:1; Darius = Cyrus); the source is now claim-checked.
  - His critique of the Gubaru theory is added.
  - Rowley's "fictitious Darius" view is added (via Wiseman).
- **Livy** 37.38–44 and 45.12, **Josephus** *Ant.* 12.3.3 and 12.9.1, *B.J.* 1.1.1, and **2 Maccabees** 3, 6, 7 and 9–11 were read directly and added where relevant.
- **Seleucid-era epoch:** Iranica (Strootman 2015) confirms the two calendars but not which one 1 Maccabees uses. Still open.

## Sources newly verified this session (20)
- Keil (1872)
- Popović et al. (2025)
- Jerome's prologue
- WEB Sirach 49
- WEB 1 Macc 2
- WEB 2 Macc 3, 6, 7, 9–11
- Josephus *B.J.* 1.1.1
- Josephus *Ant.* 12.3.3 and 12.9.1
- Livy (McDevitte)
- Iranica (Strootman 2015)
- Noss & Thomas (2005)
- Pinches (ISBE)
- *RINBE* 1 (2024)
- *RINBE* 2 (2020)
- COJS ration list
- Herodotus 1.107–108
- Kitchen (1965)
- Mitchell & Joyce (1965)
- Wiseman (1965), upgraded from metadata-only
- Behistun §1 transliteration (re-read)

## Blocked or unavailable
- **Shea (AUSS 1982):** blocked by a Cloudflare challenge.
- **British Museum collection pages:** HTTP 403.
- **Old Greek Daniel:** no public-domain English translation located; read only through Jerome, Driver and Montgomery.
- **Not accessible:** Horn & Wood (1954); Collins (1993); Hoehner (1977).
- **Not located:** Scofield (1917), Daniel volume.
- **Not found:** a specialist study that states 1 Maccabees' epoch.

## Reviews
- 19 queued this session:
  - 10 possible identities
  - 5 critical-priority events (including the new composition event)
  - 2 disputed claims (composition; Antiochus's death order)
  - 2 Keil fulfillment interpretations
- All 117 earlier items are untouched. 136 open in total: 135 Daniel, 1 Amos.
- Owner review package: `docs/reviews/DANIEL_OWNER_REVIEW_PACKAGE.md`.

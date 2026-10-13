# Project Status

**Current milestone:** 7 (full canon expansion): **in progress**, units 1–8 done (2 Kings 22–23; 2 Chronicles 34–35; Ezra 2–6; Haggai; Zechariah 1–4). Milestones 1–6 are complete. Daniel still awaits owner editorial review only (157 open items).
**Last updated:** 2026-10-13

## Milestone 1: Repository and foundation ✅
- Public repo `PeytonLeFleur/biblical-history-database`, verified under the authenticated account (renamed from an empty `bible-knowledge` repo created the same day).
- `docs/SPEC.md` saved verbatim (24 Parts). `CLAUDE.md`, rules 00–05, eight standards, architecture, method and deployment docs.
- pnpm monorepo: Node 24, TS 5.9 strict, ESLint 9, Vitest 5.
- CI ✅ and GitHub Pages ✅ verified: https://peytonlefleur.github.io/biblical-history-database/ (home, books, methodology, progress and about all return 200).

## Milestone 2: Data foundation ✅
- **66 books / 1,189 chapters / 31,102 canonical verses** indexed with OSIS identifiers and `canon_index` ordinals for range queries.
- **WEB (engwebp) imported unchanged:** 31,103 WEB verses stored. Romans doxology versification mapped (WEB 14:24–26 → canonical 16:25–27). 4 verses the WEB leaves empty are documented. Provenance, checksums and licence are in `data/imports/README.md`.
- ESV and NKJV are registered as reference-only translations. No text is stored.
- **Drizzle schema plus first migration: 52 tables** covering all 44 SPEC Part 11 groups. That includes scripture, coverage, events and mentions, people and aliases, kingdoms and dynasties, places, ancient names, PostGIS location hypotheses and regions, chronology models, synchronisms, constraints, calendars, regnal conventions, reigns, date hypotheses, visions, prophecies, fulfillments, genealogies, sites, artifacts, documents, sources, news, verification, claims, evidence and claim-evidence links, cross-references, historical relationships, research jobs, attempts and logs, the review queue and decisions, publication status, revision history, entity redirects and citations. Enums are generated from `@atlas/shared`, so code and DB cannot drift.
- Full-text GIN indexes (verse text, events, sources, people, places) and GiST geometry indexes.
- Seed is idempotent and never resets coverage. Every verse starts as `not_reviewed`.
- API `/health` reports `db: ok` against the live DB.

## Milestone 3: Research and chronology engines ✅
- **Chronology engine** (`packages/chronology-engine`):
  - Simple Temporal Network solver (Bellman–Ford), with derivation chains for every bound.
  - Model isolation, alternative hypotheses solved per combination, and contradiction diagnostics that list the constraint cycle. Global cycle detection also catches undated items.
  - Regnal-year engine (accession / non-accession; conservative Nisan/Tishri windows).
  - Julian/Gregorian/JDN conversion (Meeus) and reign-structure checks.
  - All 12 SPEC 12.8 consistency tests, plus the **Dan 1:1 / Jer 25:1** reckoning test (synthetic inputs).
- **Research engine** (`packages/research-engine`):
  - Zod schemas for every rule file, a file store, jobs and checkpoints, and chapter preparation.
  - Source registry with DOI/URL dedupe and a one-step verification ladder.
  - Entity matching (aliases, fuzzy), duplicate-event detection (passage overlap + word-set title similarity).
  - Revision-locked review decisions.
  - Repository validator (coverage, references, citations, classification rules, copyright quote cap, fixtures, chronology).
  - Per-event audit that sets the publication level, dossier rendering (with computed chronology per model), fixture-safe static export, and an idempotent DB importer with dry run.
- **CLI:** every `research:*`, `chronology:*` and `review:*` command works. `review:approve` and `review:reject` require an interactive owner confirmation, so Claude cannot approve its own work.
- **API:** `/events`, `/events/:id`, `/entities/:id`, `/sources/:id` and `/research/status` (read-only; never serves fixtures or unpublished records).
- **CI:** now also runs `research:validate`, `chronology:validate` and a real research import against PostGIS.

### Pilot research (genuine)
- **Amos 1 extraction complete:** 15/15 verses reviewed, 13 candidates (superscription, earthquake, 1:2 oracle, 5 oracles against the nations, and 5 historical references inside them).
- **"The earthquake in the days of Uzziah"** (`evt_01M4RPJVYKCVT323B86C2GGDXN`): all five stages complete, publication level **researched** (not human reviewed), status `needs_review`.
  - 17 sources registered at honest verification levels, 5 claims, 7 evidence findings, 12 relationships.
  - Computed windows: **Thiele 791–750 BC · Albright 782–743 BC** (undated without a model).
  - Dossier: `research/events/evt_01M4RPJVYKCVT323B86C2GGDXN/dossier.md`. Session log: `research/logs/2026-10-12-amos-earthquake.md`.
- "Amos's prophetic words (dated by Amos 1:1)" is queued for its own research (stages 2–5 not started).


## Milestone 4: Public research website ✅
Live at https://peytonlefleur.github.io/biblical-history-database/. It is built only from the validated research export and the WEB text.

**Pages (SPEC 15.1):**
- Home, the 66-book index, 66 book overviews, 1,189 chapter pages (WEB text with per-verse coverage, extraction candidates and event links), and a passage explorer.
- Event dossiers and an events index.
- Timeline and map.
- People, person, kingdom and kingdom-detail pages.
- Artifacts (empty state), archaeology, scientific research, sources/bibliography (with verification logs), prophecy explorer, cross-reference network, search, methodology, progress, about and 404.

**Event dossier (SPEC 15.2):**
- Amos 1:1 and Zechariah 14:5 are shown with their WEB text, plus the typed connection between them.
- Each claim carries its own classification, reviewer status and evidence. The evidence lists strength, locator, limitations and the source's verification level.
- Evidence is regrouped by type (archaeology, science, ancient documents, news, reference works) with links back to the claims.
- Computed chronology per model with a full derivation (reign anchors → textual constraints → assumptions), and a "What else was happening?" list.
- Geography separates identification from association. Also shown: disputes, competing reconstructions, commentary (labelled as interpretation), open questions, the logged research process and the numbered bibliography.
- **The pending owner review is shown accurately** (status *open*). The site has no review controls.

**Timeline:**
- A React island plotting the engine's exported windows. Reign bars show their uncertain starts and ends, and event windows are hatched.
- It has a model switcher (Thiele, Albright, model-independent → "nothing can be placed"), zoom and pan, a click-through derivation panel and a table alternative.
- Lanes for unresearched civilizations are labelled "Not yet researched".

**Map:**
- MapLibre GL 6 on OpenFreeMap.
- Verified identifications (filled) vs proposed (hollow).
- Per-place labels saying whether the event association is probable or proposed.
- An event filter, a "verified only" toggle, and a server-rendered table fallback.

**Other features:**
- Search covers events, people with aliases, places, kingdoms, sources and extraction candidates, plus Bible-reference resolution. Empty results get an honest message.
- The export now carries readable derivation steps, reign end windows, extraction files and a read-only review summary. Unpublished subjects are filtered out of the exported chronology.

**Engine fix found during M4:** reign anchors (`rgn_…#start/#end`) were being dropped from derivation chains, because the filter for internal edges matched any `#`. The filter now matches only internal markers. Events are now instantaneous unless `is_period` is set.

## Milestone 5: Daniel research pilot ✅
| Chapter | Verses reviewed | Events researched | Status |
|---|---|---|---|
| Daniel 1 | 21/21 | 4 Daniel events (1:1–2 campaign; court training; diet test; plus the 1:21 reference queued) + Carchemish (external) | ✅ researched (2 disputed claims and 1 proposed fulfillment in review) |
| Daniel 2 | 49/49 | Dream and interpretation (2:1–45); Daniel's appointment (2:46–49); vision record (statue); prophecy record (four kingdoms) with 4 interpretations | ✅ researched (1 disputed claim, 4 proposed fulfillments in review) |
| Daniel 3 | 30/30 | Golden image (parent); refusal and furnace; decree. Plain of Dura place (no coordinates); LXX date model; Greek additions indexed | ✅ researched (1 disputed claim in review) |
| Daniel 4 | 37/37 | Tree dream and interpretation (4:4–27); boast, madness and restoration (4:28–37, period). Nabonidus, Tayma, East India House Inscription, 4Q242, ABC 7; tree vision; watchers' decree prophecy | ✅ researched (1 disputed claim, 1 proposed fulfillment in review) |
| Daniel 5 | 31/31 | Belshazzar's feast and the writing (5:1–29); Belshazzar slain, Darius the Mede receives the kingdom (5:30–31); fall of Babylon, Oct 539 (external, anchored by ABC 7 = 12–13 Oct per Parker & Dubberstein); Dan 1:21 resolved. Belshazzar, Ugbaru, Gubaru, Darius the Mede, Cyaxares II (Xenophon); Cyrus Cylinder; Nabonidus and Cyrus (Babylon) reigns; MENE-TEKEL prophecy | ✅ researched (3 disputed claims, 3 proposed fulfillments in review) |
| Daniel 6 | 28/28 | Darius appoints 120 satraps (6:1–3, 28); the thirty-day decree and the lions' den (6:4–23); accusers punished and Darius's decree (6:24–27). Darius I (distinct from Darius the Mede); Behistun inscription | ✅ researched (1 disputed claim in review) |
| Daniel 7 | 28/28 | Vision experience (event, undated outside the new "Belshazzar's years" model: c. 553–551 BC); vision record (11 symbols, text-only identifications); 4 prophecy records with 15 attributed interpretations (Roman/Grecian/Porphyry schemes; Antiochus/Antichrist/papacy/Caesars; son of man: Jesus/Messiah/collective/angelic; judgment). Kingdoms: Media, Macedon, Seleucid, Rome; Alexander; Antiochus IV and reign | ✅ researched (1 disputed claim, 7 identification relationships, 8 proposed fulfillments in review) |
| Daniel 8 | 27/27 | Vision experience at Susa (undated outside the regency model: c. 551–549 BC); vision record with the text's explicit identifications (Media and Persia; Greece; first king; four kingdoms) as text-level links; 3 prophecy records, 7 attributed interpretations (Alexander and successors; Antiochus IV / Antichrist type / Rome; 1,150 days, 2,300 days, Miller's 2,300 years). External event: rededication of the Temple (25 Chislev 148 SE; window Nov 165 – Jan 163). Susa; Ulai (uncertain) | ✅ researched (2 disputed claims, 4 identification relationships, 6 proposed fulfillments in review) |
| Daniel 9 | 27/27 | Daniel's prayer over Jeremiah's seventy years (computed 539–536 BC, with no identification of Darius assumed); Gabriel at the evening offering. Prophecy records: the seventy weeks (13 attributed interpretations: Maccabean (Driver, Montgomery) and variant; Messianic continuous (Newton, Miller); dispensational gap (Anderson, Guzik); Jerome's catalogue (Africanus, Eusebius ×2, Hippolytus, Apollinaris, Clement, Tertullian, "the Hebrews")) and Jeremiah's seventy years (3 readings). Candidate decrees as events: Cyrus (538–537), Darius I (521–515), Temple completed (516–515), Ezra 7 (459–457), Neh 2 (446–444). Artaxerxes I and Darius I reigns from Parker & Dubberstein; Jeremiah; Onias III | ✅ researched (2 disputed claims, 12 relationships, 14 proposed fulfillments in review) |
| Daniel 10 | 21/21 | Vision by the Tigris in Cyrus's third year (536–535 BC; 24 Nisan ≈ 22 Apr 536 on P&D's table). Vision record for chs. 10–12 (6 symbols); prophecy record on the princes of Persia and Greece and Michael (patron angels / hostile powers / Alexander, per Jerome). Man in linen: Gabriel, unnamed angel, Christophany as competing reconstructions. Tigris (Pleiades); Ulai gains a second (Karkheh) hypothesis | ✅ researched (1 disputed claim, 1 relationship, 1 proposed fulfillment in review) |
| Daniel 11 | 45/45 | Five prophecy records with 14 attributed interpretations (four Persian kings; Alexander and the division; kings of the south and north = Ptolemies and Seleucids, Ptolemy I – Seleucus IV, with variants; the contemptible person = Antiochus IV / Antichrist type / Romans / Constantine; the wilful king = Antiochus with 11:40–45 not matching his end / future Antichrist / Byzantine empire). External events with synchronisms: Raphia 217, Panium 200–198, Magnesia 190, Seleucus IV assassinated 175, Eleusis 168, desecration 15 Chislev 145 SE (168/167), death of Antiochus IV 164. Ptolemaic kingdom; 20 rulers and actors | ✅ researched (2 disputed claims, 18 relationships, 11 proposed fulfillments in review) |
| Daniel 12 | 13/13 | Closing dialogue by the river (536–535 BC, same vision as ch. 10). Prophecy records: Michael, the time of trouble and the resurrection (bodily / Maccabean-era expectation / Porphyry's metaphor); seal the book; a time, times and a half with the 1,290 and 1,335 days (Driver–Cornill to c. June 164; Montgomery's glosses; Porphyry; Jerome/Guzik futurist; Miller 508–1798/1843) | ✅ researched (3 relationships, 5 proposed fulfillments in review) |

**Infrastructure added in M5:**
- Global synchronism, artifact, document, vision and prophecy records. Interpretations carry an approach and proponents, and proposed fulfillments require owner review.
- Per-statement regnal conventions with option-labelled alternatives.
- Day-level (Julian) windows on reigns and synchronisms.
- The dossier shows the reckoning combinations that matter to each event, with month-level windows.
- Job lifecycle fixes. (Session 4: the Daniel 1–4 chapter jobs, left `queued` by direct extraction writes, were closed through `research:chapter`.)

**SPEC 12.4 Dan 1:1 / Jer 25:1 test:** 32 reckoning combinations computed, 20 of them consistent.
- Daniel's "third year" contains the post-Carchemish campaign only with accession-year counting on a Tishri year.
- Jeremiah 46:2 is inconsistent only with non-accession counting on a Nisan year.
- Both statements are preserved, and the harmonisation is classified *disputed* and queued for review.

### Milestone 5 summary
- **Daniel:** 12/12 chapters, 357/357 verses; 21 Daniel-related events plus 17 external events researched (fall of Babylon; Carchemish; the Persian decrees; the Hellenistic battles; the desecration and rededication; the death of Antiochus IV).
- **Layering:** each vision is split into an experience event, a vision record of the text's own statements, and prophecy records with attributed interpretations. Identifications exist only as sourced `proposed_fulfillment` relationships under review.
- **Remaining uncertainties** (documented on the dossiers and in the session logs):
  - the identity of Darius the Mede
  - Belshazzar's regnal years (a separate model)
  - the Seleucid-era epoch (168/167, 165/164)
  - whether Dan 11:40–45 match the end of Antiochus
  - the Nehemiah reckoning (445/444)
  - the Ulai's course
- **Carried-over research gaps:**
  - Beaulieu (1989)
  - Collins (direct)
  - the Old Greek and Qumran Daniel
  - Seleucid-epoch studies
  - Livy 37 and 45
  - 2 Maccabees 3, 6, 7 and 9
  - Josephus *B.J.*
  - Scofield (1917)
  - Hoehner (1977)
  - Whitcomb (1959)
  - Grayson's BHLT
  - Gubaru's contracts

## Daniel final audit (PR #16) ✅
Every Daniel record was audited mechanically and rule by rule. Session log: `research/logs/2026-10-13-daniel-final-audit.md`.

**Defects corrected:**
- 37 events lacked 66-book name searches (backfilled).
- 59 entities lacked record-level citations.
- 14 review items were missing; the validator now enforces SPEC 9.3 #1 and the Rule 04 identity reviews (new test).
- 11 claim sides rested on Wikipedia alone; they were replaced with primary or scholarly sources read directly (RINBE 1–2, Wiseman 1965, Driver, Dougherty, Herodotus, COJS). The 4Q242 claim was downgraded to *strongly supported*.
- Composition of Daniel is now a full event, with three reconstructions and the 4Q114 radiocarbon range from Popović et al. 2025.
- Keil's symbolic readings were added.

**Re-evaluated:**
- Anderson's 445 BC (173,882 Julian days, and his Gregorian correction)
- Seleucus IV (not III)
- the Behistun locative "in Persia"
- Antiochus's death vs the rededication (disputed: 2 Macc vs 1 Macc and Josephus)
- the length of the desecration
- Nehemiah 2
- the Ulai (Karkheh probable)

**Read directly:** Livy, 2 Maccabees, Josephus.

## Milestone 6: Cross-book historical validation ✅
| Unit | PR | Verses | Result |
|---|---|---|---|
| 2 Kings 24–25 | #17 | 50/50 | 9 events. ABC 5 anchors the 597 capture (2 Adar, Nebuchadnezzar's 7th year). Reigns of Jehoiachin, Zedekiah and Amēl-Marduk. Two models: 586 (accession) and 587 (non-accession, Young 2004). Disputed: Jehoiakim's death, the siege start (589/588), 587 vs 586, the day of the burning. |
| Jeremiah 52; 2 Chronicles 36 | #18 | 34/34; 23/23 | Parallels attached to the existing events (no duplicates). New events: the 23rd-year deportation and Necho's deposition of Jehoahaz. Same-event links for the 7th- and 18th-year deportations under review. The Chronicler's 490-year sabbath reading added to the seventy years. |
| Jeremiah 25; Ezra 1 | #19 | 38/38; 11/11 | The Jer 25:1 event moved from *preliminary* to researched. The Cyrus decree gets Ezra 1 and Josephus's "Cyrus read Isaiah". The returned vessels: Ezra's items total 2,499 against a stated 5,400 (1 Esdras: 5,469 vs 5,479). Sheshbazzar = Zerubbabel? disputed. New prophecy: the cup of wrath. |
| Isaiah 44–45 | #20 | 53/53 | New prophecy: Cyrus the LORD's shepherd and anointed. Traditional and exilic dating both attributed. The disputed dating claim sits on the Cyrus decree event. Parallels: Cyrus Cylinder lines 12 and 15. Josephus's 140 years vs Bultema's 220 recorded. |

**SPEC tests covered:**
- **Shared events:** reused; the duplicate detector flags 0 pairs among 53 events.
- **Shared rulers:** Nebuchadnezzar, Jehoiakim, Cyrus; the reigns are reused.
- **Exile chronology:** the 586 and 587 models.
- **Jerusalem's destruction:** 587/586 disputed.
- **Cyrus and the royal decrees.**
- **Prophetic references:** the seventy years, the cup of wrath, the Cyrus oracle.
- **Synchronisms:** ABC 5 for 597.
- **Entity resolution:** Sheshbazzar is kept as a `possible_identity`, not merged.

**Limitations (not read directly):** Thiele (1983), Hughes (1990), Weidner (1939), and modern studies of Isaiah 40–48.

## Daniel completion state (2026-10-13)
| State | Status |
|---|---|
| Research complete | ✅ 357/357 verses; every Daniel event researched; the audit's defects corrected |
| Cross-book complete | ✅ Milestone 6, all seven SPEC passages, with full chapters for Isaiah 44–45 (209 verses) |
| Technical validation complete | ✅ validate, chronology, lint, typecheck, Vitest 92/92, Playwright 64/64, import, build |
| Deployed | ✅ GitHub Pages (PRs #12–#21 merged and deployed) |
| Owner editorial review complete | ❌ **157 open Daniel-related items** (25 disputed claims, 56 fulfillment interpretations, 54 identifications, 11 possible identities, 11 critical events). Owner only. Package: `docs/reviews/DANIEL_OWNER_REVIEW_PACKAGE.md` |

**Genuinely unresolved scholarly questions** (documented, not forced):
- Darius the Mede
- the date and authorship of Daniel
- the Seleucid-era epoch in 1 Maccabees
- 587 vs 586
- the order of Antiochus's death and the rededication
- the 70-weeks starting point
- the date of the Cyrus oracle

**Unavailable sources:**
- **Blocked:** Shea, AUSS 1982 (Cloudflare); British Museum pages (403).
- **No public-domain English translation:** the Old Greek Daniel.
- **Not accessible:** Collins (1993), Hoehner (1977), Horn & Wood (1954).
- **Not located:** Scofield's Daniel volume (1917).

**Engine limitation:** the conservative Nisan window (1 Mar – 1 May) leaves Nehemiah 2 at 446–444 rather than a single year.

## Milestone 7: Full canon expansion (in progress)
The canon is researched one unit at a time (one or two chapters, each with its own PR), in the priority order in `docs/NEXT_ACTION.md`. Books overlapping existing records come first.

| Unit | PR | Verses | Result |
|---|---|---|---|
| 2 Kings 22–23 | #23 | 57/57 | 6 events: the law book found; Huldah; covenant and purge; Bethel; Passover; Josiah's death at Megiddo (609, synchronised with ABC 3, critical). Jehoahaz event reused (revision 2). Josiah's reign, Megiddo, Bethel, the Hilkiah bulla, Huldah's oracle and the 1 Kgs 13:2 prophecy. Necho's march to *help* Assyria is independently corroborated (ABC 3; Josephus); Lumby's pre-1923 reading is superseded. 3 disputed claims (law-book date; timing of the reform; place of death). 13 reviews queued. |
| 2 Chronicles 34–35 | #24 | 60/60 | Chronicles' parallels attached to the five Josiah events (no duplicates). New event: the 8th/12th-year purge (Chronicles only; 631–625 BC), disputed (Keil vs Curtis & Madsen). New disputed claim: Carchemish as Necho's 609 goal (Chronicles, 1 Esdras vs ABC 3's Harran; Curtis: carried back from 605). Necho's warning: no independent corroboration (1 Esdras gives it to Jeremiah). Curtis & Madsen: "in peace" suggests Huldah's oracle predates Josiah's death. 2 reviews queued. |
| Ezra 2–3 | #25 | 83/83 | 3 events: the return with Zerubbabel and Jeshua (list; same event as Neh 7; link to Sheshbazzar's return under review); altar and Booths; foundation of the Second Temple (critical). List arithmetic: items 29,818 / 31,089 / 30,143 vs a stated 42,360 (strongly supported). Disputed: why the totals fall short; return under Cyrus or Darius (1 Esdras); foundation c. 536 (Keil, Ryle) or 520 (Batten; 1 Esdras; Josephus). Zerubbabel, Jeshua, Joppa. 5 reviews. |
| Ezra 4–5 | #27 | 41/41 | 4 events: opposition and the halt until Darius 2; the letters to Ahasuerus and Artaxerxes (kings disputed; no identification imposed); Haggai and Zechariah and the resumption (Darius year 2 = 520/519; Hag 1:1 = 29 Aug 520 per Parker & Dubberstein); Tattenai's inquiry and letter. Tattenai's attestation in a Babylonian document of 502 recorded as plausible (tablet not read). 1 review. |
| Ezra 6 | #28 | 22/22 | Two M5 events completed rather than duplicated: Darius's confirmation of the decree (Ecbatana; the memorandum's authenticity disputed: Keil, Ryle, de Vaux vs Batten); the Temple's completion (3rd vs 23rd of Adar, 6th vs 9th year: Ezra, 1 Esdras, Josephus). New: the Passover of 515; Ecbatana. 2 reviews. |
| Haggai 1–2 | #29 | 38/38 | Haggai 1 attached to the Ezra 5 resumption event (date conversions compared: P&D 29 Aug 520 vs Mitchell mid-August vs Guzik September). New events: the oracle of 21/VII and the oracles of 24/IX (Hag 2:18 linked to the Ezra 3 foundation dispute). Prophecies: the latter glory (Messianic vs precious things vs eschatological) and Zerubbabel the signet (Mitchell vs Keil). 2 reviews. **Book complete: Haggai.** |
| Zechariah 1–2 | #30 | 34/34 | The call to return (8th month, Darius year 2) and the night visions of 24 Shebat (early 519; visions 1–3 here). Vision records: myrtles, horns and craftsmen, measuring line. Prophecies: the horns (Daniel's four empires per Keil vs all hostile powers per Mitchell) and Jerusalem without walls. Zech 1:12 linked to Jeremiah's seventy years. 1 review. |
| Zechariah 3–4 | #31 | 24/24 | Night-visions event extended (visions 4–5). Prophecies: "my servant the Branch" (Messiah per Keil and Guzik vs Zerubbabel per Mitchell) and "Zerubbabel's hands will finish the house" (proposed fulfillment: the 515 completion). Two anointed ones = Zerubbabel and Joshua (agreed). 3 reviews. |

**Infrastructure change (unit 3):** `data/exports/*.json` is no longer committed. The chronology export reached 104.8 MB, over GitHub's 100 MB limit, and the exports are already regenerated by `pnpm build` locally and in CI (see ARCHITECTURE).

**Scaling fix (#26):** the chronology export is now compact (format 2): identical intervals across models and reckoning combinations are stored once. It fell from 110 MB to 1.2 MB, and the built site is byte-identical apart from Astro's random island IDs. A new unit test covers the lossless round-trip (Vitest 93/93).

**Book-level progress:**
- **2 Kings:** chapters 22–25 researched (4/25).
- **2 Chronicles:** 34–36 (3/36). **Jeremiah:** 25 and 52 (2/52). **Ezra:** 1–6 (6/10). **Isaiah:** 44–45 (2/66).
- **Haggai:** 2/2 (complete). **Zechariah:** 1–4 (4/14). **Amos:** 1 (1/9). **Daniel:** 12/12.

**Source limitations added in M7** (details in each session log):
- City of David bulla reports (Shiloh; Schneider, *BAR* 1991) not read; the bulla is known only through a popular summary.
- Megiddo and Beitin excavation reports not read.
- Post-1915 studies of Deuteronomy's date not read.
- Payne's Megiddo Stratum II and Scythian claims known only through Guzik.
- Post-1910 studies of Chronicles not read.
- Murashu archives, numismatics of the daric, and post-1913 Haggai–Ezra chronology studies not read.
- The Tattannu tablet and Olmstead (1944) not read.

## Test results (local, 2026-10-13)
lint ✓ · typecheck ✓ · Vitest **93/93** ✓ · Playwright **64/64** ✓ · `research:validate` ✓ (warnings: inconsistent reckoning alternatives, by design) · `chronology:validate` ✓ · research import ✓ · site build: 1,424 pages

## Research progress
- **Verse coverage:** 940 / 31,102 reviewed, across 36 chapters.
  - Amos 1; Daniel 1–12; 2 Kings 22–25; 2 Chronicles 34–36; Jeremiah 25, 52; Ezra 1–6; Isaiah 44–45; Haggai 1–2; Zechariah 1–4.
- **Events:** 72 (71 researched; 1 preliminary, Amos's prophetic words).
- **Sources:** 204.
- **Entities:** 191.
  - 68 people
  - 31 prophecies, with 93 attributed interpretations
  - 19 places
  - 16 reigns
  - 13 synchronisms
  - 12 documents
  - 10 kingdoms
  - 6 chronology models
  - 10 visions
  - 5 artifacts
  - 1 site
- **Claims:** 167 (37 disputed). **Relationships:** 363.
- **Open owner reviews:** 187.
  - 158 existing (157 Daniel-related; 1 Amos) are unchanged.
  - 29 are new from Milestone 7.
  - None was approved or rejected by Claude.

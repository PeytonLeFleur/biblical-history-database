# Project Status

**Current milestone:** 5 (Daniel research pilot): **in progress** (Daniel 1–11 of 12 complete)
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

## Milestone 5: Daniel research pilot (in progress)
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
| Daniel 12 | 0 | — | not started |

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

## Test results (local, 2026-10-13)
lint ✓ · typecheck ✓ · Vitest **91/91** ✓ · Playwright **64/64** ✓ · `research:validate` ✓ (warnings: inconsistent reckoning alternatives, by design) · `chronology:validate` ✓ · research import ✓ · site build: 1,369 pages

## Research progress
- Verse coverage: **359 / 31,102** reviewed (Amos 1; Daniel 1–11). Chapters extracted: 12.
- **Events: 39** (37 researched, 2 preliminary). **Sources: 124.** **Entities: 136.**
- **Open owner reviews: 109.** The Amos review is unchanged.

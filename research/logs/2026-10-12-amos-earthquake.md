# Session log: 2026-10-12, Amos 1 extraction and the earthquake of Amos 1:1 / Zech 14:5 (Milestone 3 pilot)

**Operator:** Claude Code (Opus 5.5) · **Rules:** 00–05 · **Unit:** Amos chapter 1 (Rule 01) plus one substantial event (Rules 02–05)

## Rule 01: Amos 1
- Read Amos 1:1–15 in the WEB (engwebp). All 15 verses are `reviewed_with_candidate`.
- **13 candidates:**
  - Superscription / Amos's dated words (historical_reference, promoted to an event).
  - The earthquake (event, promoted).
  - 1:2 poetic oracle (background).
  - Five oracles against the nations (prophecy, prediction).
  - Five child historical_reference candidates for the past deeds those oracles cite: Damascus "threshed Gilead", Gaza and Tyre deportations to Edom, Edom's pursuit of "his brother", Ammon in Gilead.
- Other participants and places (Hazael, Ben-hadad, Tekoa, Damascus, Gaza, …) are marked `proposed_new_entity`. They were not created in this session.

## Rules 02–04: the earthquake
### Searches (also in `evidence.json` → `search_log`)
1. Web: Austin/Franz/Frost 2000. Found the deadseaquake.info and ICR summaries. **ICR not used** (advocacy).
2. Web: Hazor Stratum VI earthquake.
3. Web: City of David earthquake (IAA). Press coverage only.
4. Web: Dead Sea seismites, 8th century BCE.
5. Crossref: Austin 2000, Kagan 2011, Ken-Tor 2001. **Found the published correction to Kagan 2011** (10.1029/2011JB008870).
6. Semantic Scholar and OpenAlex abstracts. **The Kagan 2011 abstract does not mention mid-8th-century seismites.**
7. Web: IAA press release. Only the cityofdavid.org.il page was found. It displays "23 March 2026", but press coverage dates the announcement to Aug 2021.
8. Josephus: read Ant. 9.10.4 directly in the Gutenberg #2848 Whiston text.
9. Wikipedia: Uzziah and Jeroboam II, for chronologists' reign dates. Galil is absent, so Albright 1945 is the second model.
10. Open Library: Thiele 1983 (OL2720725W) and Galil 1996.
11. Crossref: Ambraseys 2009, Albright 1945, Chadwick & Maeir 2018, Uziel/Chalaf HA-ESI reports. **Dever 1992 (Eretz-Israel 23) not found.**
12. OpenAlex: Chadwick & Maeir (opening paragraph), HA-ESI 2020/2024 abstracts (no mention of the earthquake), Austin abstract.
13. Enduring Word, Amos 1.
14. deadseaquake.info Amos entry: characters 0–200k read, ~150k unread.
15. Web: Assyrian eponym chronicle earthquake. **No Assyrian record found** (only the 763 BC eclipse entry).
16. Pleiades: coordinates for Jerusalem (687928), Tel Hazor (779967430), Gezer/Gazara (687904), Gath/Gimtu (889522884).

### What was actually read (verification honesty)
| Source | Level | Notes |
|---|---|---|
| Austin et al. 2000 | claim_checked (abstract only) | Full text paywalled |
| Kagan et al. 2011 | source_accessed (abstract) | The 8th-c. seismites are **not** in the abstract; known only via Williams |
| Kagan correction 2011 | metadata_verified | Content unknown |
| Chadwick & Maeir 2018 | claim_checked (opening paragraph only) | |
| Williams, deadseaquake.info | claim_checked (partial page) | Secondary compilation |
| Josephus Ant. 9.10.4 | claim_checked | Primary text, read in full |
| City of David announcement | claim_checked | Announcement only; no peer-reviewed report identified |
| Ambraseys 2009 | metadata_verified | Not accessed; view known via Williams |
| Thiele 1983, Albright 1945 | metadata_verified | Dates taken from Wikipedia summaries |
| Wikipedia Uzziah / Jeroboam II | claim_checked | Popular summary, used only for chronologists' dates |
| Enduring Word, Amos 1 | claim_checked | Interpretation layer only |
| Pleiades (4 places) | claim_checked | CC BY 3.0 |

### Decisions
- **Two chronology models** (Thiele 1983, Albright 1945). Reign intervals include coregency years, and that assumption is recorded on the constraints.
- **"Two years before the earthquake"** is modelled as a 1–2-year elapsed offset (inclusive or exclusive counting).
- **Computed earthquake windows:**
  - Thiele: 791–750 BC
  - Albright: 782–743 BC
  - No model selected: undated (correct: no model-independent anchor exists).
- **Claims (all machine_proposed):**
  - Mid-8th-c. regional seismic damage: `strongly_supported`.
  - Identity with the archaeologically attested earthquake: `historically_plausible`.
  - Single M~8 event in 750 BC: `disputed`. **Review queued.**
  - Damage in Jerusalem: `historically_plausible`.
  - Josephus's link to the incense offence: `no_independent_corroboration_found`.
- No synchronism was recorded, because no external record names the earthquake.

## Dead ends / next steps
- Get the full text (or a reliable account) of Kagan et al. 2011 and its correction, and confirm the ages of the 8th-century seismites.
- Identify the excavation publication for the City of David layer.
- Consult the original Hazor/Gezer/Lachish reports, Dever 1992 and Ambraseys 2009.
- Add a lexical source for רַעַשׁ (raʿash).

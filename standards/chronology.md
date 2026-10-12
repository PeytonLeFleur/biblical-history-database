# Standard: Chronology

Source: SPEC Part 12. Implemented in `@atlas/chronology-engine` (the solver is Milestone 3).

## Storage
- **Astronomical year numbering internally**: 1 BC = 0, 539 BC = −538 (`toAstronomical`). Show BC/AD publicly (`formatYear`).
- Every date is a **`YearInterval`** (`earliest`, `latest`, either of which may be open) with a **precision** label: `day` | `month` | `year` | `regnal_year` | `decade` | `reign` | `generation` | `century` | `period` | `undated`. Precision is never higher than the source supports.
- Day-level ancient dates use a **documented proleptic Julian** convention. The original calendar (`babylonian_lunar`, `hebrew_lunisolar`, `egyptian_civil`, `julian`, `gregorian`, `regnal`) and the original expression are stored alongside.
- Julian Day Numbers are allowed for computation. Conversions must cite the algorithm or the table (e.g. Parker & Dubberstein for Babylonian dates).

## Anchors and synchronisms (SPEC 12.1)
- Each synchronism records its type (`direct_contemporary_identification`, `reign_synchronization`, `documentary_correlation`, `astronomical_anchor`, `calendar_anchor`, `archaeological_correlation`, `inferred_synchronization`) and whether it is **direct** or **mediated**. The 763 BC eclipse anchors the Assyrian eponym list, and that list then reaches biblical reigns only through synchronisms such as Qarqar and Jehu.
- Candidate anchors to research in Milestone 3 and later: the 763 BC eclipse, Qarqar 853, Jehu tribute 841, Sennacherib 701, Jerusalem 597 (Babylonian Chronicle), Babylon 539 (Nabonidus Chronicle). For the NT: Herod's death, Luke 3:1, Pilate, AD 30/33, the Gallio inscription. These are **not seeded until sourced.**

## Constraints (SPEC 12.2)
- Keep `textual_assertion` (verbatim meaning plus passage) separate from the computed `relation` / `offset` / `unit` / `precision`.
- Relations: `before`, `after`, `during`, `same_year`, `same_approximate_period`, `begins_after`, `ends_before`, `overlaps`, `immediately_follows`, `days_later`, `months_later`, `years_later`, `years_earlier`, `within_reign`, `in_regnal_year`, `within_dated_range`.
- Vague expressions ("after these things", "in those days") produce ordering only, with no offset.

## Models
- Named chronology models (`chr_`) hold every model-dependent hypothesis, e.g. different Divided Monarchy reconstructions, and the Masoretic / LXX / Samaritan models for Gen 5 and 11.
- Never mix models silently. A computed date always states the model it belongs to.
- Gen 1–11 and the patriarchs sit on a **biblical-internal chronology band** by default. They are not put on the absolute axis (SPEC 12.6).

## Regnal conventions (SPEC 12.4)
Store these per kingdom and per period, with sources: accession vs non-accession reckoning, Nisan vs Tishri new year, coregencies (as overlaps, never as sequential reigns), and changes of convention. Do not assume that Israel, Judah, Babylon, Assyria, Persia and Egypt used the same system.

**Required test case:** Dan 1:1 (the third year of Jehoiakim) vs Jer 25:1 (the fourth year). Model the commonly proposed Babylonian-accession vs Judahite reckoning difference as a documented hypothesis that keeps both texts unchanged.

## Derivations (SPEC 12.9)
Every computed interval keeps a derivation chain: the text, the anchors, the constraints applied, the regnal and calendar assumptions, and the model. The website shows this chain.

## Consistency tests (SPEC 12.8)
All 12 SPEC tests are implemented in Milestone 3, and contradictions produce diagnostic reports rather than dropped evidence.

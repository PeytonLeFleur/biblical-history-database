# Rule 01: Scripture Extraction

**Stage key:** `scripture_extraction` · **Research status while active:** `extracting` · **SPEC:** Parts 5.3, 6, 7, 8 (Rule 01)

## Purpose
Read every verse of an assigned book and produce (a) a coverage status for every canonical verse and (b) an auditable inventory of historically researchable candidates, each correctly classified.

## Inputs
- Book slug, e.g. `daniel` (resolved through `findBook()` in `@atlas/scripture`).
- Verse inventory and WEB text from `data/seed/scripture/web/` (imported unchanged; see `standards/sources.md`).
- Existing global entities (people, places, kingdoms, events) from the database or `research/events/*`, so entities are matched before new ones are created.
- Existing extraction files for the book, when resuming.

ESV/NKJV text is **not** an input to storage. They may be read through authorized access for study, but never copied into the repo.

## Required tasks
1. **Load and confirm the chapter list.** The chapter count must equal `CanonBook.chapters`.
2. **Read chapter by chapter, verse by verse.** Give every verse exactly one coverage status:
   - `reviewed_with_candidate`: the verse belongs to at least one candidate's verse range.
   - `reviewed_no_candidate`: read, and nothing historically researchable was found.
   - `needs_recheck`: read, but classification is uncertain. Explain why in `notes`.
   - `blocked`: could not be assessed (e.g. textual-variant question needs specialist input). Explain why.
   - `not_reviewed` is only valid **before** a chapter is processed. A completed chapter contains no `not_reviewed` verses.
3. **Identify candidates.** Look for events, people, places, kingdoms, reigns, battles, political actions, campaigns, natural disasters, environmental phenomena, construction, destruction, births, deaths, genealogies, miracle claims, historical references, prophecies, visions and astronomical phenomena.
4. **Choose granularity (SPEC 6.1–6.2).** Use the smallest unit that supports independent investigation. Group connected sequences under a parent candidate with child candidates. Do not create an event for every sentence, and do not collapse a chapter into one event when its occurrences need separate research.
5. **Classify each candidate:**
   - `record_type`: `event` | `vision` | `prophecy` | `parable` | `law` | `genealogy` | `literary_imagery` | `ongoing_practice` | `historical_reference` | `teaching` | `theological_interpretation`.
   - `literary_classification` from SPEC 7.2.
   - `event_categories` (one or more) from SPEC 7.1. Required only when `record_type = event`.
   - `narrative_mode`: `narrated_occurrence` | `reference_to_other_event` | `vision_content` | `prediction` | `hypothetical` | `poetic`.
   - `research_priority` from SPEC 7.3. Priority sets research order, not theological value.
6. **Never promote vision content to history.** Symbolic events inside a vision are `vision` records. A historical interpretation of a vision needs a separate, justified `proposed_fulfillment` in Rule 04.
7. **Extract structured details** for each candidate: participants (names as written), locations (names as written), temporal statements (verbatim phrase plus reference), related passages already known, and ambiguities.
8. **Match entities.** For every participant and location, search the existing global entities (`standards/entity-resolution.md`). Record `matched_entity_id` or `proposed_new_entity: true`. Never create a duplicate person, place or kingdom.
9. **Create a research job** for each candidate that will go on to Stage 2 (`research/queues/job_*.json`). Candidates with priority `background` may stay unqueued.

## Research methods
- Read the WEB text directly. Compare ESV/NKJV through authorized reading when a translation difference affects classification. Note the difference without storing their wording.
- Consult Enduring Word for the chapter **only** for literary-genre or setting questions at this stage. Record it as an `interpretation` layer note.
- Use Hebrew, Aramaic or Greek lexical data where a word decides the classification (e.g. a "year" formula or a regnal phrase). Cite the lexical source.

## Output schema: `research/books/<slug>/extraction/ch-<NN>.json`

```jsonc
{
  "book": "Dan",
  "chapter": 5,
  "status": "complete",                 // "in_progress" | "complete"
  "resume_from": null,                  // e.g. "Dan.5.17" when in_progress
  "text_edition": "WEB (eBible.org eng-web, unmodified)",
  "verse_coverage": [
    { "ref": "Dan.5.1", "status": "reviewed_with_candidate", "candidate_ids": ["cnd_…"], "notes": null }
    // … one row per canonical verse in the chapter
  ],
  "candidates": [
    {
      "id": "cnd_01J…",
      "title": "Belshazzar's feast",
      "passage": "Dan.5.1-Dan.5.4",
      "description": "Paraphrase of what the text records. No interpretation.",
      "record_type": "event",
      "literary_classification": "historical_narrative",
      "narrative_mode": "narrated_occurrence",
      "event_categories": ["royal", "religious"],
      "parent_candidate_id": "cnd_…",    // null for top-level
      "participants": [{ "name_as_written": "Belshazzar", "matched_entity_id": null, "proposed_new_entity": true }],
      "locations": [{ "name_as_written": "Babylon", "matched_entity_id": "loc_…" }],
      "temporal_statements": [{ "ref": "Dan.5.30", "phrase": "that night", "kind": "relative" }],
      "related_passages": ["Isa.21.1-Isa.21.10"],
      "research_priority": "critical",
      "ambiguities": ["Relationship of Belshazzar to Nebuchadnezzar ('father', v.2) — see Rule 02."],
      "job_id": "job_…"
    }
  ],
  "session_log": "research/logs/2026-10-12-daniel-5.md"
}
```

## Error handling
- **Verse missing from the inventory, or an unexpected verse:** set `blocked` with notes, then flag a versification issue in `docs/PROJECT_STATUS.md`. Do not edit the WEB text.
- **Text-critical or versification problem** (e.g. the Hebrew vs English chapter split in Joel or Malachi): record it in `notes` and link the versification mapping. Coverage still uses English numbering.
- **Ambiguous classification:** `needs_recheck`, plus an `ambiguities` entry. Never guess silently.
- **Tool or context interruption:** write the partial file with `status: "in_progress"` and `resume_from`.

## Checkpoints
- After every chapter: write `ch-<NN>.json`, update `book.json` coverage counts, and append to the session log.
- Commit after each chapter, or after each session if several short chapters were processed.

## Completion criteria
The book's extraction is complete only when **all** of these hold:
1. Every chapter file exists with `status: "complete"`.
2. Every canonical verse has a status other than `not_reviewed`.
3. The set of verse refs exactly equals the canonical inventory for the book: no missing verses, no extras.
4. Every candidate has a record type, literary classification, narrative mode and priority, and has categories if it is an event.
5. Every participant and location is either matched or marked as a proposed new entity.
6. `pnpm research:validate` passes for the book.

## Validation (automated)
- Coverage equals the inventory: a set comparison against the verse table.
- Candidate passages parse through `parsePassageRef` and fall inside the book.
- All enums belong to the controlled vocabularies in `@atlas/shared`.
- `vision` and `prophecy` records never have `narrative_mode = narrated_occurrence`.
- No duplicate candidates: two candidates with the same passage and title trigger a warning.

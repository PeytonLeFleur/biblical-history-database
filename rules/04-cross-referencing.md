# Rule 04: Canonical Cross-Referencing

**Stage key:** `cross_referencing` · **Research status while active:** `cross_referencing` · **SPEC:** Parts 7.6, 8 (Rule 04)

## Purpose
Connect each event and entity to every relevant passage and record across all 66 books, including books not yet researched. Each connection uses a typed relationship with provenance and uncertainty. Related things are never merged when they are distinct.

## Inputs
- A job at stage 4, its candidate, `context.json` and `evidence.json`.
- The full verse inventory and WEB text for all 66 books.
- Global entities and existing relationships.
- Cross-reference datasets that have been licence-checked (e.g. OpenBible.info cross references, Treasury of Scripture Knowledge). These are leads, not conclusions.
- `standards/entity-resolution.md`.

## Required tasks
1. **Find candidate passages:**
   - Name search for every participant, place and kingdom (with aliases) across all books.
   - Dataset leads (OpenBible.info and TSK) for the candidate's verses.
   - Parallel accounts (Kings ↔ Chronicles, the Synoptics, Acts ↔ the Epistles, prophetic superscriptions ↔ narrative).
   - Explicit references back (e.g. Zech 14:5 → "the earthquake in the days of Uzziah").
2. **Type every relationship** using SPEC 7.6. Rules for the key types:
   - `same_event`: the texts describe the identical occurrence. This needs textual grounds. Put it in review if confidence is below `high`.
   - `direct_reference`: one text explicitly points to another event.
   - `possible_identity`: the identity is plausible but unproven. This is **always** the type for uncertain matches.
   - `thematic_parallel`: similarity of motif only, with **no** historical-identity claim.
   - `prophecy_reference` / `proposed_fulfillment`: always record *who* proposes the fulfillment and under which interpretive approach (preterist, futurist, historicist, idealist, mixed; dispensational, amillennial, etc.). These are `layer: interpretation`.
   - `parent_event` / `child_event`, `preceded_by` / `followed_by`, `historical_consequence`: these must agree with the chronology constraints, so add a constraint wherever one applies.
3. **Resolve entities before creating them.** Match by canonical name, aliases, patronymic or kingdom, period and role. When two records might be the same person or place, create a `possible_identity` relationship. Do not merge. Any merge or split goes to the review queue (SPEC 9.3 #4).
4. **Carry chronology across books.** When a cross-reference adds a temporal statement (e.g. 2 Kgs 15 regnal formulas for Uzziah/Azariah), add the constraint to the chronology graph with its passage.
5. **Record unresearched targets.** If the related passage lies in a book that has not been researched, still create the relationship and mark `target_research_state: "unresearched"`.

## Output schema: `research/events/<evt_ULID>/crossrefs.json`

```jsonc
{
  "event_id": "evt_…",
  "status": "complete",
  "relationships": [{
    "id": "rel_…",
    "type": "direct_reference",
    "from": { "kind": "event", "id": "evt_…" },
    "to":   { "kind": "passage", "ref": "Zech.14.5" },
    "confidence": "high",                     // high | medium | low | speculative
    "layer": "text",
    "rationale": "Zechariah explicitly names 'the earthquake in the days of Uzziah'.",
    "provenance": { "method": "text_reading", "dataset": null, "citations": [] },
    "interpretive_approach": null,            // required for prophecy/fulfillment types
    "proposed_by": null,
    "target_research_state": "unresearched",
    "review_required": false
  }],
  "entity_resolutions": [{ "name_as_written": "Azariah", "resolved_to": "per_…", "basis": "2 Kgs 15:1–7 // 2 Chr 26 alias", "confidence": "high" }],
  "new_constraints": ["cst_…"]
}
```

## Error handling
- **The dataset suggests a link with no textual basis:** discard it and note it in the session log. Datasets never produce relationships by themselves.
- **Conflicting parallel accounts** (e.g. different numbers in Kings vs Chronicles): record both statements, link them with `same_event` and add a `disputes` note. Never harmonize silently.
- **Entity ambiguity:** `possible_identity` plus review.

## Checkpoints
Save after each relationship batch (by book). Update the job stage.

## Completion criteria
1. Name and alias searches were run across all 66 books for every participant and place.
2. Every relationship is typed, has a confidence and a rationale, and has provenance.
3. Every prophecy or fulfillment relationship names its interpretive approach and proposer.
4. No merges were made without a review item.
5. Temporal statements found in cross-references were added as constraints.

## Validation (automated)
- Relationship types belong to the SPEC 7.6 vocabulary.
- Every `ref` resolves in the verse inventory.
- No `same_event` link between two events whose computed intervals are disjoint under the same model. If one exists, flag a contradiction.
- `thematic_parallel` never coexists with `same_event` for the same pair.
- Symmetric types (`same_event`, `possible_identity`) are stored once and treated as symmetric. Inverse pairs (`parent_event`/`child_event`, `preceded_by`/`followed_by`) are consistent.

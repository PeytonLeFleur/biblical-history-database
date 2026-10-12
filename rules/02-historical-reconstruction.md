# Rule 02: Historical Reconstruction

**Stage key:** `historical_reconstruction` · **Research status while active:** `context_research` · **SPEC:** Parts 8 (Rule 02), 12, 13

## Purpose
For each queued candidate, build a sourced historical-context dossier covering setting, chronology, rulers, kingdoms, geography, terminology, culture and competing reconstructions. Shared global entities are reused rather than duplicated.

## Inputs
- A research job at stage 2 (`research/queues/job_*.json`) and its candidate from Rule 01.
- Global entities: people, kingdoms, dynasties, reigns, places, location hypotheses, chronology models, synchronisms and constraints.
- `standards/chronology.md`, `standards/geography.md`, `standards/interpretation.md`.

## Required tasks
1. **Restate the text.** Write a one-paragraph `layer: text` summary of what the passage records. Paraphrase it, citing the WEB reference.
2. **Historical setting.** Cover the period, the political situation, and the kingdoms and rulers involved, linked to existing `per_`, `kgd_` and `rgn_` entities.
3. **Chronology:**
   - Collect every temporal statement from the candidate and its context.
   - Convert each into **chronological constraints** (SPEC 12.2): keep the original wording in `textual_assertion` separate from the mathematical `relation`, `offset`, `unit` and `precision`. "After these things" means `after` with no offset.
   - Identify relevant **synchronisms** (SPEC 12.1) and state the synchronism type. Mark whether it is direct or reaches the passage only through intermediate relationships (e.g. the 763 BC eclipse anchors Assyrian chronology, not a biblical verse directly).
   - Record **date hypotheses** for each named chronology model (e.g. Thiele, Galil, Hughes), with the derivation and sources. Never invent a single date.
   - Record regnal-reckoning assumptions explicitly: accession vs non-accession year, and Nisan vs Tishri new year.
4. **Geography.** Give each location's ancient name, modern identification(s), confidence and candidate hypotheses (SPEC 13). Coordinates come only from a cited gazetteer or excavation source (e.g. Pleiades, an excavation report). Never estimate coordinates.
5. **Terminology.** Note original-language terms that bear on the history (titles, measures, place names), each with a lexical source.
6. **Culture and economy.** Add only what illuminates the event, with sources.
7. **Competing reconstructions.** List every serious scholarly model, its main proponents, the evidence each relies on, and the key point of disagreement.
8. **Interpretation layer.** Consult Enduring Word for the passage and record a concise original paraphrase, URL and access date. Add other commentaries if relevant. Keep all of this in `layer: interpretation`.

## Research methods
- Order of preference: primary ancient sources and editions → peer-reviewed studies → institutional and museum publications → academic reference works → reputable summaries (`standards/sources.md`).
- Register every source in the source registry *before* citing it (see `packages/source-registry`). Deduplicate through `dedupeKey()`.
- Log every search query in the session log.

## Output schema: `research/events/<evt_ULID>/context.json`

```jsonc
{
  "event_id": "evt_…",
  "status": "complete",                       // or "in_progress" + resume_from
  "text_summary": { "layer": "text", "body": "…", "passage": "Amos.1.1" },
  "setting": { "period": "Iron Age IIB", "body": "…", "citations": ["src_…"] },
  "rulers": [{ "person_id": "per_…", "reign_id": "rgn_…", "role": "reigning king of Judah", "citations": ["src_…"] }],
  "kingdoms": ["kgd_…"],
  "constraints": [{
    "id": "cst_…",
    "subject": "evt_…", "object": "rgn_…",
    "relation": "within_reign",
    "textual_assertion": "in the days of Uzziah king of Judah",
    "passage": "Amos.1.1",
    "offset": null, "unit": null, "precision": "reign",
    "model_id": null,                          // null = model-independent
    "assumptions": [],
    "citations": [],
    "verification": "text_direct"
  }],
  "synchronisms": [{ "id": "syn_…", "type": "reign_synchronization", "direct": false, "via": "…", "citations": ["src_…"] }],
  "date_hypotheses": [{
    "id": "dth_…", "model_id": "chr_…",
    "interval": { "earliest": -764, "latest": -749 },   // astronomical years
    "precision": "decade",
    "derivation": "…step-by-step…",
    "citations": ["src_…"]
  }],
  "locations": [{ "location_id": "loc_…", "role": "affected region", "hypotheses": ["lhy_…"], "confidence": "possible" }],
  "terminology": [{ "term": "רַעַשׁ (raʿash)", "gloss": "earthquake, quaking", "citations": ["src_…"] }],
  "competing_reconstructions": [{ "label": "…", "proponents": ["…"], "summary": "…", "citations": ["src_…"] }],
  "commentary": [{ "source_id": "src_…", "layer": "interpretation", "paraphrase": "…", "url": "…", "accessed": "2026-10-12" }],
  "open_questions": ["…"]
}
```

## Error handling
- **Source behind a paywall:** register it at `metadata_verified` and note `access_notes`. Never cite its contents beyond what was actually accessed (abstract, publisher summary).
- **Conflicting dates:** keep all of them as separate `date_hypotheses`. Never average them.
- **No defensible absolute date** (e.g. Gen 1–11, the patriarchs): record relative constraints only, assign the internal-chronology band, and state why (SPEC 12.6).
- **Entity ambiguity** (e.g. "Darius the Mede"): create a `possible_identity` hypothesis in Rule 04. Do not merge entities here.

## Checkpoints
Write `context.json` after each major subsection (setting, chronology, geography) with `status: in_progress`. Mark it `complete` when all tasks are done. Update the job's stage record.

## Completion criteria
1. Every task above is addressed, or explicitly marked `not_applicable` with a reason.
2. Every non-text statement has at least one citation, or is explicitly labeled as Claude Code's reasoning in `layer: reconstruction` with `citations: []` and `basis: "operator_inference"`.
3. Every date is an interval with a precision and a derivation.
4. Every location has a confidence. Coordinates appear only with a source.
5. Competing reconstructions are represented wherever they exist.

## Validation (automated)
- Every constraint has a valid `relation`. Offsets are present exactly when the relation requires them (`days_later`, `months_later`, `years_later`, `years_earlier`, `in_regnal_year`).
- Intervals are well-formed (`isWellFormed`).
- Citation IDs resolve in the source registry.
- No `date_hypotheses` without a `model_id` unless the hypothesis is model-independent and says so.

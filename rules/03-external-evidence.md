# Rule 03: External Evidence Investigation

**Stage key:** `external_evidence` · **Research status while active:** `external_research` · **SPEC:** Parts 8 (Rule 03), 9, 10

## Purpose
Find, examine and classify the independent evidence (archaeological, geological, astronomical, documentary, scientific and journalistic) that bears on each specific claim of a candidate. Record exactly what each source does and does not establish.

## Inputs
- A job at stage 3, with its candidate and `context.json`.
- The source registry and existing artifacts, sites and documents.
- `standards/evidence.md`, `standards/sources.md`, `standards/copyright.md`.

## Required tasks
1. **Break the event into claims.** Write discrete, testable `clm_` records, for example "An earthquake occurred during Uzziah's reign" and "the earthquake was remembered as a dating reference". Each claim has one `layer`.
2. **Search across all relevant domains** and log the queries:
   - *Archaeology:* excavations, artifacts, inscriptions, destruction layers, pottery, radiocarbon, coins, seals, burials, surveys.
   - *Geology:* earthquake evidence, fault systems, floods, sediment records, volcanism, palaeoclimate, drought reconstructions.
   - *Astronomy:* ancient eclipse records, planetary phenomena, calendar observations, astronomical chronology.
   - *Documents:* Assyrian, Babylonian, Egyptian and Persian royal inscriptions; cuneiform archives; Greek and Roman historians; Josephus; 1 Maccabees and other Jewish sources; ANE text collections (e.g. ORACC).
   - *Scientific and academic:* peer-reviewed papers, university publications, datasets.
   - *News:* credible reports of discoveries. **Trace every story to the underlying publication or announcement.** Several articles about one finding count as **one** line of evidence.
3. **Document each source** with author, publisher, date, the original document or artifact, methodology, actual findings, the proposed biblical connection *and who proposes it*, competing explanations, published criticism, limitations, and verification level.
4. **Write evidence findings.** Each `evd_` record states what this source shows about one claim, with a stance of `supports` | `challenges` | `contextual` | `neutral` and a strength of `direct` | `indirect` | `contextual`.
5. **Classify each claim** into exactly one SPEC 9.1 class, with reasoning, supporting evidence, counterevidence, limitations and source IDs. Set `reviewer_status: machine_proposed`. Apply the review triggers (`requiresHumanReview`).
6. **Register artifacts, sites and documents** as global entities, separating the **findspot** from the **current museum location**. Image rights are checked per `standards/copyright.md`.

## Research methods
- Prefer the original publication over secondary reports. If only a secondary report is reachable, say so.
- A DOI resolving or a URL loading only shows the source exists (`metadata_verified`). Mark `claim_checked` only after reading the passage that supports or challenges the claim, and record where it is (page, section or figure).
- Look for criticism actively. For every proposed correlation, search "<finding> criticism", "<finding> alternative interpretation" and "<finding> dating dispute".
- Supernatural or miracle claims: external evidence may bear on the *setting* (e.g. Babylonian religious practice) but never "confirms" the supernatural outcome. Such claims are usually `not_empirically_testable` for their essential element.

## Output schema: `research/events/<evt_ULID>/evidence.json`

```jsonc
{
  "event_id": "evt_…",
  "status": "complete",
  "search_log": [{ "date": "2026-10-12", "query": "Amos earthquake archaeoseismology Hazor", "engine": "web", "useful_results": 3 }],
  "claims": [{
    "id": "clm_…",
    "statement": "A major earthquake struck the region during the reign of Uzziah.",
    "layer": "reconstruction",
    "passage": "Amos.1.1",
    "classification": "strongly_supported",
    "reasoning": "…",
    "supporting_evidence": ["evd_…"],
    "counterevidence": ["evd_…"],
    "limitations": ["Destruction layers are dated by ceramics to a span wider than one reign."],
    "reviewer_status": "machine_proposed",
    "review_required": false,
    "research_date": "2026-10-12"
  }],
  "evidence": [{
    "id": "evd_…",
    "claim_id": "clm_…",
    "source_id": "src_…",
    "stance": "supports",
    "strength": "indirect",
    "finding": "Paraphrase of what the source actually reports.",
    "locator": "pp. 12–15, fig. 4",
    "proposed_connection_by": "author" ,      // "author" | "other_scholar" | "operator"
    "competing_explanations": ["…"],
    "criticism": [{ "source_id": "src_…", "summary": "…" }],
    "limitations": ["…"],
    "independent_line": "line-hazor-stratum-vi"   // dedupes multiple reports of one finding
  }],
  "artifacts": ["art_…"], "sites": ["sit_…"], "documents": ["doc_…"],
  "research_gaps": ["No peer-reviewed geological study dates the event within ±10 years."]
}
```

## Error handling
- **Source inaccessible:** keep it at its real verification level. Do not use it for `claim_checked` conclusions.
- **Authenticity disputed** (e.g. a contested inscription): record both positions. Route it to review if it affects publication (SPEC 9.3 #8).
- **Retraction or correction found:** mark the source `retracted` or `corrected`, re-evaluate dependent claims, and log the change.
- **Rate limits or tool failures:** respect SPEC 4.2 limits, then checkpoint and continue other tasks.

## Checkpoints
Save `evidence.json` after each domain sweep, keeping `search_log` current. Mark it complete only after classification.

## Completion criteria
1. All relevant domains were searched, with query logs, or marked `not_applicable` with a reason.
2. Every claim has a classification with reasoning, and evidence or an explicit "no evidence found" statement.
3. Every evidence record points to a registered source at an honestly stated verification level.
4. Every proposed correlation has had a search for criticism.
5. News items are traced to their originals, and the independent lines of evidence are deduplicated.
6. Review-triggered items are queued.

## Validation (automated)
- `independently_corroborated` needs at least one `direct` supporting evidence record whose source is at least `claim_checked`.
- `contradicted_by_available_evidence` needs at least one `challenges` evidence record and a non-empty `reasoning`.
- No claim may have `reviewer_status: human_approved` unless a matching review decision exists.
- Independent-line counts are reported. The validator warns when "multiple sources" all share one line.

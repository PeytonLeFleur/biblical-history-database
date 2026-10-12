# Standard: Sources and Verification

Source: SPEC Part 10. Implemented in `@atlas/source-registry`.

## Hierarchy (historical evidence)
1. Ancient primary documents and physical evidence (inscriptions, tablets, artifacts, excavation data)
2. Peer-reviewed research
3. Institutional and museum publications
4. Academic books and specialist reference works
5. Credible reporting tied to identifiable primary research
6. Popular explanatory summaries

Theological commentaries (Enduring Word first, per SPEC 5.4) are a **separate interpretive track**. They are never counted as historical corroboration.

## Verification levels
Each level must be reached in order (`canAdvanceVerification`):

| Level | Meaning | What it does **not** mean |
|---|---|---|
| `discovered` | A candidate source has been identified | Nothing about its contents |
| `metadata_verified` | Bibliographic details checked against a publisher, registry (Crossref, DOI) or institution | That it supports anything |
| `source_accessed` | The relevant original material was actually read. `access_notes` says what: full text, abstract or excerpt. | That the specific claim was checked |
| `claim_checked` | The passage supporting or challenging the claim was located, with a locator (page, section or figure) | Human approval |
| `human_reviewed` | The owner approved this source-to-claim relationship | Historical certainty |

A working URL is not evidence of support, and a DOI match is not evidence of findings. Never mark an inaccessible paper as read.

## Required metadata
- **All sources:** `id`, `title`, `source_type` (SPEC 7.5), `verification_level`, `accessed_at` (when accessed), `license` / rights note, `is_fixture`.
- **Plus, by type:**
  - Scientific paper: authors, journal, year, DOI.
  - Monograph: authors, publisher, year, ISBN where available.
  - Museum or artifact record: institution, accession number, URL.
  - Excavation report: excavation, season, authors, publisher.
  - Ancient text: text name, edition or translation used (with its own rights), and the standard reference (e.g. ABC 7 for the Nabonidus Chronicle).
  - News: outlet, author, date, **and the `src_` of the original finding it reports**.

## Deduplication
`dedupeKey()` uses the DOI, then the normalized URL, then the normalized title. Check before registering. Reprints and translations of one ancient text share a `document` entity, with a separate `source` for each edition.

## Datasets
Check the licence and quality before importing (SPEC 10.3). Record the licence, version, retrieval date and checksum in `data/imports/README.md`. Public availability does **not** grant redistribution rights.

| Dataset | Status |
|---|---|
| World English Bible (eBible.org `eng-web`) | Public domain. Imported unchanged. |
| OpenBible.info cross-references / geocoding | Licence to be verified before import (CC BY per site, unconfirmed) |
| Treasury of Scripture Knowledge | Public domain edition to be identified |
| Pleiades | CC BY. To be verified at import. |
| ORACC | Per-project licences. Verify each one. |

# Data imports

Raw third-party downloads go in `data/imports/raw/` (**gitignored**: untrusted, possibly restricted). Only derived, licence-cleared outputs are committed under `data/seed/`.

## World English Bible (Protestant edition)

| Field | Value |
|---|---|
| Edition | `engwebp` (World English Bible, omits Deuterocanon; otherwise identical to WEB Updated) |
| Distributor | eBible.org: https://ebible.org/find/details.php?id=engwebp |
| File | `https://ebible.org/Scriptures/engwebp_vpl.zip` → `engwebp_vpl.txt` |
| Upstream last-modified | 2026-10-08 |
| Retrieved | 2026-10-12 |
| SHA-256 (zip) | `552e5a3e6dec9bfda4f95c2b1e86a2add1ba50b6f727609dff925de61e36e74b` |
| SHA-256 (vpl.txt) | `bd5f4ac05c5742338b3b17086d5731cb2ca005f3ba5025f71494643eb7799833` |
| Licence | Public domain. "World English Bible" is a trademark of eBible.org; altered text may not use that name. **We store it unchanged.** |
| Importer | `pnpm scripture:import` (`scripts/import-web.ts`) |

### Counts
- WEB lines: **31,103**
- Canonical verses (standard English Protestant numbering): **31,102**

### Versification differences recorded (not edited)
- **Romans doxology:** WEB places it at Rom 14:24–26 (Majority Text position). Standard English numbering has it at 16:25–27. Mapped in `data/seed/scripture/versification/web.json`. The WEB's empty `Rom 16:25` placeholder is kept, with no canonical link.
- **Verses WEB leaves empty in the main text** (textual variants; the canonical positions are kept and their coverage tracked): Luke 17:36, Acts 8:37, Acts 15:34, Acts 24:7.

### Still to do (versification)
- Hebrew/Greek mappings: Malachi 4 ↔ Hebrew Mal 3:19–24, Joel 2:28–3:21 ↔ Hebrew Joel 3–4, Psalm superscriptions, Daniel 4:1–3 ↔ Aramaic 3:31–33, and others. Add these to `versification_mappings` with `tradition` set.
- ESV numbering differences (e.g. 3 John 14–15) need verifying when the ESV adapter is built.

## Planned datasets (licence not yet verified; do not import)
- OpenBible.info cross references and geocoding
- Treasury of Scripture Knowledge
- Pleiades

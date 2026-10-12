# Standard: Copyright and Licensing

Source: SPEC Parts 2.4, 5.2, 10.4, 15.5, 22.

## Bible text
- **Stored locally:** World English Bible, Protestant edition (`eng-web`) from eBible.org, which is public domain. It is imported **unchanged**, and annotations are stored separately.
- **ESV and NKJV:** these are the preferred study translations but are **never** bulk-stored or committed. Reference them by passage. An ESV API adapter can be used only under the ESV API terms and with a key in `.env`. Responses are not committed. No NKJV API is assumed or invented.
- WEB quotations are never labelled as ESV or NKJV.

## External prose
- Paraphrase by default.
- For copyrighted prose, quote at most **one short sentence or 25 words, whichever is shorter, per source per published dossier**, unless a licence explicitly permits more.
- Do not combine excerpts to reconstruct substantial content.
- Follow stricter publisher-specific terms where they exist.
- Always keep the link and bibliographic metadata.

## Images
- Host locally only public-domain or CC0 images (e.g. the Metropolitan Museum Open Access collection). Store the provenance, licence and attribution.
- For restricted collections, link to the institution's page instead of copying.
- Never assume a museum image is unrestricted because it appears online.

## Project licences
- Original source code: **MIT** (`LICENSE`).
- Original research descriptions and structured records: **CC BY 4.0**.
- Third-party material keeps its own rights. Nothing is relicensed. Rights and attribution data stay attached to each imported resource.

## Never commit
Credentials, tokens, `.env` files, private review records, restricted downloads (`data/imports/raw/` is gitignored), unlicensed copyrighted text, or fixtures in production exports.

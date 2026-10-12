# Biblical History Atlas

A source-verified research database and public website. It connects the 66 books of the Protestant Bible with ancient history, archaeology, scientific research, chronology and geography.

**Website:** https://peytonlefleur.github.io/biblical-history-database/ (under construction)

The project keeps four kinds of knowledge distinct: **what the text says**, **how it is interpreted**, **what scholars reconstruct**, and **what independent evidence establishes**. Every claim is traced to its source, and every uncertainty stays visible.

## Status
Early development. See [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md). No historical research has been published yet.

## Structure
| Path | Purpose |
|---|---|
| `apps/web` | Astro static site (GitHub Pages) |
| `apps/api` | Minimal Fastify API (local) |
| `packages/*` | Shared types, scripture, database, research, chronology, geography, sources, validation, export |
| `rules/` | The five-stage research procedure |
| `standards/` | Evidence, source, chronology, geography, interpretation, publication, copyright and entity-resolution standards |
| `research/` | Structured research records (the permanent research memory) |
| `docs/SPEC.md` | The authoritative specification |

## Development
Requires Node 24 LTS, pnpm and Docker.

```bash
pnpm install
pnpm db:up && pnpm db:migrate && pnpm db:seed
pnpm test
pnpm dev:web
```

## Licensing
Source code is licensed under [MIT](LICENSE). Original research records and descriptions are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Third-party material, including Bible translations, publications, museum assets and datasets, keeps its own rights. See [`standards/copyright.md`](standards/copyright.md). The locally stored Bible text is the public-domain World English Bible.

# Deployment

## GitHub Pages
- Workflow: `.github/workflows/pages.yml`. It runs on push to `main`, builds `apps/web` and deploys with `actions/deploy-pages`.
- Pages source: **GitHub Actions** (configured through `gh api repos/PeytonLeFleur/biblical-history-database/pages -X POST -f build_type=workflow`).
- Base path: `/biblical-history-database/`, set in `apps/web/astro.config.mjs` (`site` + `base`, `trailingSlash: 'always'`). All internal links use `import.meta.env.BASE_URL`.
- Only static files and eligible exports are deployed. No database, API or review controls.

## CI
`.github/workflows/ci.yml` runs on every push and pull request: install (frozen lockfile) → lint → typecheck → unit tests → DB tests against a `postgis/postgis:16-3.4` service → web build.

## Local services
```bash
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
pnpm db:up          # docker compose, PostGIS on :5433
pnpm db:migrate
pnpm db:seed
pnpm dev:api        # http://127.0.0.1:3001/health
pnpm dev:web
```
If Docker is unavailable, install `postgresql@16` and `postgis` through Homebrew, create the `atlas` role and database, and set `DATABASE_URL` in `.env`.

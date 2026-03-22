# Three-Environment Setup Design

**Date:** 2026-03-22
**Status:** Approved

## Overview

Set up a three-environment deployment pipeline (dev → staging → prod) for RealEstateHunter using a single GitHub repository with branch-based deployments on Cloudflare Pages.

## Branch Structure

Three long-lived branches in a single repository:

- `dev` — active development and alpha testing
- `staging` — beta testing by collaborators
- `main` — production

Code flows in one direction only:

```
feature-branch → dev → staging → main
```

### Day-to-Day Workflow

1. Create a feature branch off `dev` (e.g., `feature/add-search-filters`)
2. Work on the feature, commit, push
3. Open a PR into `dev` — tests run automatically. Merge when green.
4. When features in `dev` are ready for beta testing, open a PR from `dev` → `staging`. Merge after review.
5. After beta testing passes on staging, open a PR from `staging` → `main`. Requires approval from another developer. Merge deploys to production.

### Hotfix Path

For urgent production bugs:

1. Branch off `main`, fix, PR directly into `main`
2. Open a PR from `main` → `staging` to back-merge the fix (branch protection allows PRs from `main` as an exception for hotfixes)
3. Open a PR from `staging` → `dev` to complete the sync

This ensures all three branches stay in sync while respecting branch protection rules.

## Branch Protection Rules

### `dev` branch

- Direct pushes allowed (for speed during active development)
- PRs from feature branches encouraged but not required
- CI runs tests on every push
- Exception: accepts PRs from `staging` for hotfix back-merges

### `staging` branch

- No direct pushes — changes come via PR from `dev` or `main` (hotfix back-merge)
- CI must pass before merge is allowed
- No approval required (code was already reviewed going into `dev`)

### `main` (prod) branch

- No direct pushes — changes come only via PR from `staging` (or hotfix branches)
- CI must pass before merge is allowed
- 1 approval required from another developer before merge

## CI/CD Pipeline (GitHub Actions)

### Single Workflow with Branch-Conditional Steps

One workflow file (`.github/workflows/ci.yml`) handles all three environments. Steps are conditionally enabled based on the triggering branch. This prevents CI config drift between environments.

### On push/merge to `dev`

- Install dependencies
- Run Biome linting
- Run Vitest unit tests
- Build the app via OpenNext adapter
- Cloudflare Pages auto-deploys to dev URL

### On push/merge to `staging`

- Install dependencies
- Run Biome linting
- Run Vitest unit tests
- Run Playwright E2E tests
- Build the app via OpenNext adapter
- Cloudflare Pages auto-deploys to staging URL

### On push/merge to `main`

- Install dependencies
- Run Biome linting
- Run Vitest unit tests
- Run Playwright E2E tests
- Build the app via OpenNext adapter
- Cloudflare Pages auto-deploys to production URL

### Pipeline Rules

- If any check fails, the deploy is blocked
- E2E tests only run on staging and prod (slower, not needed for every dev push)
- PR preview deployments are enabled — every PR gets a temporary Cloudflare preview URL for code review

## Environment Variables & Service Isolation

Each environment gets its own isolated set of services:

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| Database | Dev PostgreSQL | Staging PostgreSQL | Production PostgreSQL |
| Clerk | Dev instance | Staging instance | Production instance |
| Stripe | Test mode keys | Test mode keys | Live mode keys |
| OpenAI | Shared key (low limits) | Shared key | Production key |
| Cloudflare R2 | Dev bucket | Staging bucket | Prod bucket |
| Resend | Test mode | Test mode | Production |
| SignWell | Sandbox | Sandbox | Production |
| Inngest | Dev server | Cloud (staging env) | Cloud (prod env) |
| Upstash Redis | Dev instance | Staging instance | Prod instance |
| Mapbox | Shared token (allow all env URLs) | Shared token | Prod token (scoped to prod URL) |
| MLS Data | SimplyRETS (demo) | SimplyRETS (demo) | RESO direct |

### Principles

- Services involving real user data or real money (Clerk, Stripe, database) must be isolated per environment
- Services without a test mode (OpenAI) can share API keys across dev/staging
- Environment variables are configured in Cloudflare Pages dashboard, never committed to the repo
- Each environment starts with its own database from day one to prevent data contamination
- Clerk CSP headers in `next.config.ts` must be driven by environment variables so each environment allows its own Clerk domain

### Database Migrations

- Migrations are run manually (not as part of the build/deploy process)
- Run against dev first, verify, then staging, then prod
- Never run migrations automatically on production deploys — too risky for destructive changes

## Cloudflare Pages Configuration

### Adapter: `@opennextjs/cloudflare`

The project uses `@opennextjs/cloudflare` (not `@cloudflare/next-on-pages`) as the Next.js adapter. This is the actively-maintained adapter that supports Next.js 16 with React 19, App Router, server actions, and server components on Cloudflare's edge runtime.

### Single Cloudflare Pages Project

- **Production branch:** `main` → deploys to production domain
- **Preview branches:** `dev` and `staging` → deploy to branch-specific URLs
- PR branches also get preview deployments automatically

### Build Settings

- Build command: `npx opennextjs-cloudflare` (wraps Next.js build for Cloudflare)
- Output directory: determined by `@opennextjs/cloudflare` adapter (configured in `open-next.config.ts`)
- Each branch gets its own environment variables in Cloudflare dashboard

### R2 Bucket Bindings

R2 bucket bindings are configured in `wrangler.toml` with per-environment blocks:

- `[env.dev]` → dev R2 bucket
- `[env.staging]` → staging R2 bucket
- `[env.production]` → prod R2 bucket

### URLs

Cloudflare auto-generates URLs per branch:

- `main` → `reh-test.pages.dev` (or custom domain)
- `staging` → `staging.reh-test.pages.dev`
- `dev` → `dev.reh-test.pages.dev`

Custom domains can be configured later:

- `app.realestatehunter.com` → main
- `staging.realestatehunter.com` → staging
- `dev.realestatehunter.com` → dev

### Rollback Strategy

Cloudflare Pages supports instant rollbacks to any previous deployment via the dashboard. If a production deploy causes issues, roll back immediately and then investigate.

## Dependencies to Add

- `@opennextjs/cloudflare` — Next.js adapter for Cloudflare Pages (dev dependency)

## Files to Create

- `.github/workflows/ci.yml` — Single CI pipeline with branch-conditional steps
- `wrangler.toml` — Cloudflare Pages config with per-environment R2 bindings
- `open-next.config.ts` — OpenNext adapter configuration

## Team & Scaling

- Designed for 2 developers (sole developer + upcoming collaborator)
- As team grows: tighten `dev` branch protection (require PRs), add approval requirements to `staging`
- Branch protection rules are configured in GitHub repository settings

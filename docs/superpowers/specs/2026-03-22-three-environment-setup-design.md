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
2. Merge `main` back into `staging` and `dev` to keep branches in sync

## Branch Protection Rules

### `dev` branch

- Direct pushes allowed (for speed during active development)
- PRs from feature branches encouraged but not required
- CI runs tests on every push

### `staging` branch

- No direct pushes — changes come only via PR from `dev`
- CI must pass before merge is allowed
- No approval required (code was already reviewed going into `dev`)

### `main` (prod) branch

- No direct pushes — changes come only via PR from `staging`
- CI must pass before merge is allowed
- 1 approval required from another developer before merge

## CI/CD Pipeline (GitHub Actions)

### On push/merge to `dev`

- Install dependencies
- Run Biome linting
- Run Vitest unit tests
- Build the app
- Cloudflare Pages auto-deploys to dev URL

### On push/merge to `staging`

- Install dependencies
- Run Biome linting
- Run Vitest unit tests
- Run Playwright E2E tests
- Build the app
- Cloudflare Pages auto-deploys to staging URL

### On push/merge to `main`

- Install dependencies
- Run Biome linting
- Run Vitest unit tests
- Run Playwright E2E tests
- Build the app
- Cloudflare Pages auto-deploys to production URL

### Pipeline Rules

- If any check fails, the deploy is blocked
- E2E tests only run on staging and prod (slower, not needed for every dev push)

## Environment Variables & Service Isolation

Each environment gets its own isolated set of services:

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| Database | Separate PostgreSQL | Separate PostgreSQL | Production PostgreSQL |
| Clerk | Dev instance | Staging instance | Production instance |
| Stripe | Test mode keys | Test mode keys | Live mode keys |
| OpenAI | Shared key (low limits) | Shared key | Production key |
| Cloudflare R2 | Dev bucket | Staging bucket | Prod bucket |
| Resend | Test mode | Test mode | Production |
| SignWell | Sandbox | Sandbox | Production |

### Principles

- Services involving real user data or real money (Clerk, Stripe, database) must be isolated per environment
- Services without a test mode (OpenAI) can share API keys across dev/staging
- Environment variables are configured in Cloudflare Pages dashboard, never committed to the repo
- Dev and staging can share a database initially; split when staging gets real test data

## Cloudflare Pages Configuration

### Single Cloudflare Pages Project

- **Production branch:** `main` → deploys to production domain
- **Preview branches:** `dev` and `staging` → deploy to branch-specific URLs

### Build Settings

- Build command: `npm run build`
- Output directory: `.next`
- Adapter: `@cloudflare/next-on-pages` (dev dependency)
- Each branch gets its own environment variables in Cloudflare dashboard

### URLs

Cloudflare auto-generates URLs per branch:

- `main` → `reh.pages.dev` (or custom domain)
- `staging` → `staging.reh.pages.dev`
- `dev` → `dev.reh.pages.dev`

Custom domains can be configured later:

- `app.realestatehunter.com` → main
- `staging.realestatehunter.com` → staging
- `dev.realestatehunter.com` → dev

## Dependencies to Add

- `@cloudflare/next-on-pages` — Next.js adapter for Cloudflare Pages (dev dependency)

## Files to Create

- `.github/workflows/ci-dev.yml` — CI pipeline for dev branch
- `.github/workflows/ci-staging.yml` — CI pipeline for staging branch
- `.github/workflows/ci-prod.yml` — CI pipeline for main branch
- `wrangler.toml` — Cloudflare Pages configuration (if needed beyond dashboard)

## Team & Scaling

- Designed for 2 developers (sole developer + upcoming collaborator)
- As team grows: tighten `dev` branch protection (require PRs), add approval requirements to `staging`
- Branch protection rules are configured in GitHub repository settings

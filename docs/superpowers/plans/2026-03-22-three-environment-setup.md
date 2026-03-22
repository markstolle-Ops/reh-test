# Three-Environment Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up dev/staging/prod environments with branch-based Cloudflare Pages deployments and GitHub Actions CI.

**Architecture:** Three long-lived branches (`dev`, `staging`, `main`) in a single repo. One GitHub Actions workflow with branch-conditional steps runs lint/test/build. Cloudflare Pages auto-deploys each branch to its own URL with isolated environment variables.

**Tech Stack:** GitHub Actions, Cloudflare Pages, @opennextjs/cloudflare, wrangler, Biome, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-22-three-environment-setup-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `.github/workflows/ci.yml` | Single CI pipeline with branch-conditional steps |
| Create | `wrangler.toml` | Cloudflare Pages config with per-environment R2 bindings |
| Create | `open-next.config.ts` | OpenNext adapter configuration for Cloudflare |
| Modify | `package.json` | Add build scripts and @opennextjs/cloudflare dependency |
| Modify | `next.config.ts` | Make CSP headers environment-variable-driven |
| Modify | `.env.example` | Add Clerk domain env var for CSP |
| Modify | `playwright.config.ts` | Ensure CI compatibility |

---

### Task 1: Install @opennextjs/cloudflare adapter

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the adapter**

Run:
```bash
npm install --save-dev @opennextjs/cloudflare
```

- [ ] **Step 2: Verify installation**

Run:
```bash
node -e "require('@opennextjs/cloudflare')" && echo "OK"
```
Expected: `OK` (no errors)

- [ ] **Step 3: Add Cloudflare build script to package.json**

In `package.json`, add to the `"scripts"` section:

```json
"build:cloudflare": "npx opennextjs-cloudflare",
"preview:cloudflare": "npx wrangler pages dev"
```

The existing `"build": "next build"` stays unchanged for local development.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @opennextjs/cloudflare adapter and build scripts"
```

---

### Task 2: Create OpenNext configuration

**Files:**
- Create: `open-next.config.ts`

- [ ] **Step 1: Create the config file**

Create `open-next.config.ts` at the project root:

```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
};

export default config;
```

This is the minimal config needed. The adapter handles the rest automatically.

- [ ] **Step 2: Verify the build works**

Run:
```bash
npm run build:cloudflare
```
Expected: Build completes without errors. If it fails due to missing environment variables, that's OK at this stage — the build structure should be valid.

- [ ] **Step 3: Commit**

```bash
git add open-next.config.ts
git commit -m "feat: add OpenNext config for Cloudflare Pages"
```

---

### Task 3: Create wrangler.toml with per-environment R2 bindings

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Create the wrangler config**

Create `wrangler.toml` at the project root:

```toml
name = "realestatehunter"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".open-next"

# R2 bucket bindings — per-environment
# Dev environment
[env.dev]
r2_buckets = [
  { binding = "R2_BUCKET", bucket_name = "reh-photos-dev" }
]

# Staging environment
[env.staging]
r2_buckets = [
  { binding = "R2_BUCKET", bucket_name = "reh-photos-staging" }
]

# Production environment
[env.production]
r2_buckets = [
  { binding = "R2_BUCKET", bucket_name = "reh-photos-prod" }
]
```

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "feat: add wrangler.toml with per-environment R2 bindings"
```

---

### Task 4: Make CSP headers environment-variable-driven

**Files:**
- Modify: `next.config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add Clerk domain env var to .env.example**

Add the following line to `.env.example` after the existing Clerk section:

```bash
# Clerk frontend API domain for CSP (e.g., "https://your-app.clerk.accounts.dev")
NEXT_PUBLIC_CLERK_DOMAIN=
```

- [ ] **Step 2: Update next.config.ts to use env var for Clerk CSP**

Replace the hardcoded CSP `connect-src` in `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const clerkDomain =
  process.env.NEXT_PUBLIC_CLERK_DOMAIN || "https://*.clerk.accounts.dev";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "frame-src https://www.signwell.com",
              "script-src 'self' 'unsafe-inline' https://cdn.signwell.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              `connect-src 'self' https://www.signwell.com https://api.clerk.dev ${clerkDomain}`,
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify the dev server still starts**

Run:
```bash
npm run dev
```
Expected: Server starts without errors. Stop it after confirming.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts .env.example
git commit -m "feat: make CSP Clerk domain configurable via env var"
```

---

### Task 5: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create the CI workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [dev, staging, main]
  pull_request:
    branches: [dev, staging, main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx biome check .

  unit-test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx vitest run

  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          CI: true

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, unit-test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build:cloudflare

  deploy:
    name: Deploy to Cloudflare Pages
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'push'
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build:cloudflare
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .open-next --project-name=realestatehunter --branch=${{ github.ref_name }}
```

- [ ] **Step 3: Verify workflow syntax**

Run:
```bash
cat .github/workflows/ci.yml | npx yaml-lint 2>/dev/null || echo "Install yaml-lint or verify manually"
```

Alternatively, verify the YAML is valid by checking indentation manually. The workflow should have 5 jobs: lint, unit-test, e2e-test, build, deploy.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add GitHub Actions CI workflow with branch-conditional steps"
```

---

### Task 6: Create `dev` and `staging` branches

**Files:**
- None (git operations only)

- [ ] **Step 1: Ensure main is clean**

Run:
```bash
git status
```
Expected: Clean working tree, all changes committed.

- [ ] **Step 2: Create the staging branch from main**

```bash
git branch staging
```

- [ ] **Step 3: Create the dev branch from main**

```bash
git branch dev
```

- [ ] **Step 4: Verify all three branches exist**

Run:
```bash
git branch
```
Expected:
```
  dev
* main
  staging
```

All three branches now exist with identical content. From this point forward, day-to-day work happens on feature branches off `dev`.

- [ ] **Step 5: Push all branches to remote**

Before this step, ensure the remote is configured:

```bash
git remote -v
```

If no remote exists, add it:
```bash
git remote add origin https://github.com/roybomberger-arch/RealEstateHunter.git
```

Then push all branches:
```bash
git push -u origin main
git push -u origin staging
git push -u origin dev
```

---

### Task 7: Configure GitHub branch protection rules

**Files:**
- None (GitHub API operations)

This task requires the GitHub CLI (`gh`) to be authenticated.

- [ ] **Step 1: Verify gh auth**

Run:
```bash
gh auth status
```
Expected: Logged in to github.com.

- [ ] **Step 2: Protect the `main` branch**

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Unit Tests", "Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null
}
EOF
```

Note: Replace `{owner}/{repo}` with `roybomberger-arch/RealEstateHunter`.

- [ ] **Step 3: Protect the `staging` branch**

```bash
gh api repos/{owner}/{repo}/branches/staging/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Unit Tests", "Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

- [ ] **Step 4: Verify protection rules**

```bash
gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_pull_request_reviews.required_approving_review_count'
```
Expected: `1`

```bash
gh api repos/{owner}/{repo}/branches/staging/protection --jq '.required_status_checks.contexts'
```
Expected: `["Lint", "Unit Tests", "Build"]`

---

### Task 8: Update .env.example with environment documentation

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add environment header comment to .env.example**

Add the following at the top of `.env.example`:

```bash
# ============================================
# RealEstateHunter Environment Configuration
# ============================================
# This app runs in three environments: dev, staging, prod.
# Each environment needs its own set of credentials.
# Configure these in Cloudflare Pages dashboard per branch.
# Local development: copy this file to .env.local
# ============================================
```

- [ ] **Step 2: Add Inngest and Redis env vars if missing**

Verify these exist in `.env.example`. If missing, add:

```bash
# Inngest (background jobs)
# Dev: use local dev server (npx inngest-cli dev)
# Staging/Prod: use Inngest Cloud with separate environments
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Upstash Redis (caching)
# Each environment needs its own Redis instance
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add environment documentation to .env.example"
```

---

## Post-Implementation Checklist

After all tasks are complete, verify:

- [ ] All three branches exist (`dev`, `staging`, `main`)
- [ ] Branches are pushed to GitHub remote
- [ ] `main` branch requires 1 PR approval + CI pass
- [ ] `staging` branch requires CI pass
- [ ] `dev` branch has no protection (direct push allowed)
- [ ] GitHub Actions workflow runs on push to any of the three branches
- [ ] E2E tests only run on `staging` and `main`
- [ ] `npm run build:cloudflare` produces output in `.open-next/`
- [ ] `wrangler.toml` has per-environment R2 bindings
- [ ] CSP headers use env var for Clerk domain
- [ ] `.env.example` documents all environment-specific variables

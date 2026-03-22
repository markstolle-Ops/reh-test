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
| Modify | `package.json` | Add build scripts, @opennextjs/cloudflare and wrangler dependencies |
| Modify | `next.config.ts` | Make CSP headers environment-variable-driven |
| Modify | `.env.example` | Add Clerk domain env var, Redis env vars, environment docs |
| Modify | `.gitignore` | Add `.open-next/` build output directory |

---

### Task 1: Install @opennextjs/cloudflare adapter and wrangler

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the adapter and wrangler**

Run:
```bash
npm install --save-dev @opennextjs/cloudflare wrangler
```

- [ ] **Step 2: Verify installation**

Run:
```bash
ls node_modules/@opennextjs/cloudflare/package.json && ls node_modules/wrangler/package.json && echo "OK"
```
Expected: Both paths exist, prints `OK`.

- [ ] **Step 3: Add Cloudflare build and preview scripts to package.json**

In `package.json`, add to the `"scripts"` section:

```json
"build:cloudflare": "npx opennextjs-cloudflare",
"preview:cloudflare": "npx wrangler pages dev"
```

The existing `"build": "next build"` stays unchanged for local development.

- [ ] **Step 4: Add `.open-next/` to .gitignore**

Add the following line to `.gitignore`:

```
# Cloudflare Pages build output
.open-next/
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: add @opennextjs/cloudflare adapter and wrangler"
```

---

### Task 2: Create OpenNext configuration

**Files:**
- Create: `open-next.config.ts`

- [ ] **Step 1: Create the config file**

Create `open-next.config.ts` at the project root. Start with a minimal config — the adapter auto-detects most settings:

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

Note: If the build fails with this config, consult the `@opennextjs/cloudflare` docs for the correct config shape for the installed version. The `wrapper` and `converter` fields may differ.

- [ ] **Step 2: Verify the build works**

Run:
```bash
npm run build:cloudflare
```
Expected: Build completes without errors. If it fails due to missing environment variables, that's OK at this stage — the build structure should be valid. If it fails due to config shape issues, check the adapter docs and adjust `open-next.config.ts`.

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
compatibility_date = "2026-03-01"
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

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const clerkDomain =
  process.env.NEXT_PUBLIC_CLERK_DOMAIN || "https://*.clerk.accounts.dev";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CSP to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow SignWell iframe for embedded signing
              "frame-src https://www.signwell.com",
              // Allow SignWell embed script
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

### Task 5: Update .env.example with environment documentation

**Files:**
- Modify: `.env.example`

This task runs BEFORE branch creation so the changes propagate to all branches.

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

- [ ] **Step 2: Add Upstash Redis env vars**

The Inngest env vars already exist in `.env.example`. Add the following Redis vars (these are missing):

```bash
# Upstash Redis (caching)
# Each environment needs its own Redis instance
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add environment documentation and Redis vars to .env.example"
```

---

### Task 6: Create GitHub Actions CI workflow

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
    # Run E2E on staging/main pushes AND on PRs targeting staging/main
    if: >-
      github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main' ||
      github.base_ref == 'staging' || github.base_ref == 'main'
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
    # Wait for all test jobs; proceed if e2e was skipped (dev branch) but not if it failed
    needs: [lint, unit-test, e2e-test]
    if: always() && !failure() && !cancelled()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build:cloudflare
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .open-next/
          retention-days: 1

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
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .open-next/
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .open-next --project-name=realestatehunter --branch=${{ github.ref_name }}
```

- [ ] **Step 3: Verify workflow YAML is valid**

Run:
```bash
npx js-yaml .github/workflows/ci.yml > /dev/null && echo "YAML valid"
```
Expected: `YAML valid`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add GitHub Actions CI workflow with branch-conditional steps"
```

---

### Task 7: Create `dev` and `staging` branches and push to remote

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

- [ ] **Step 5: Configure remote and push all branches**

Check if remote exists:
```bash
git remote -v
```

If no remote exists, add it:
```bash
git remote add origin https://github.com/MarkatFinAIGuru/REH-Test.git
```

Push all branches:
```bash
git push -u origin main
git push -u origin staging
git push -u origin dev
```

---

### Task 8: Configure GitHub branch protection rules

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
gh api repos/MarkatFinAIGuru/REH-Test/branches/main/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Unit Tests", "E2E Tests", "Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null
}
EOF
```

- [ ] **Step 3: Protect the `staging` branch**

```bash
gh api repos/MarkatFinAIGuru/REH-Test/branches/staging/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Unit Tests", "E2E Tests", "Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

- [ ] **Step 4: Verify protection rules**

```bash
gh api repos/MarkatFinAIGuru/REH-Test/branches/main/protection --jq '.required_pull_request_reviews.required_approving_review_count'
```
Expected: `1`

```bash
gh api repos/MarkatFinAIGuru/REH-Test/branches/staging/protection --jq '.required_status_checks.contexts'
```
Expected: `["Lint", "Unit Tests", "E2E Tests", "Build"]`

---

## Post-Implementation Checklist

After all tasks are complete, verify:

- [ ] All three branches exist (`dev`, `staging`, `main`)
- [ ] Branches are pushed to GitHub remote
- [ ] `main` branch requires 1 PR approval + CI pass (including E2E)
- [ ] `staging` branch requires CI pass (including E2E)
- [ ] `dev` branch has no protection (direct push allowed)
- [ ] GitHub Actions workflow runs on push to any of the three branches
- [ ] E2E tests run on `staging` and `main` pushes, and on PRs targeting `staging`/`main`
- [ ] `npm run build:cloudflare` produces output in `.open-next/`
- [ ] `.open-next/` is in `.gitignore`
- [ ] `wrangler.toml` has per-environment R2 bindings
- [ ] CSP headers use env var for Clerk domain
- [ ] `.env.example` documents all environment-specific variables including Redis
- [ ] Deploy job uses build artifact (not a fresh rebuild)

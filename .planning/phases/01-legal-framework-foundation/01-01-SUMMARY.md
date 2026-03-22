---
phase: 01-legal-framework-foundation
plan: 01
subsystem: infra
tags: [nextjs, clerk, drizzle, postgres, tailwind, vitest, playwright, biome]

# Dependency graph
requires: []
provides:
  - Next.js 15 project scaffold with App Router and TypeScript
  - All Phase 1 npm dependencies installed
  - Clerk authentication with sign-in/sign-up pages at /sign-in and /sign-up
  - Role-based middleware protecting /buyer/* and /seller/* routes
  - Drizzle ORM singleton connected to Supabase Postgres
  - users table schema with role enum (buyer/seller)
  - drizzle.config.ts for migration management
  - Vitest config with 5 passing smoke tests
  - Playwright config with chromium E2E test project
  - src/lib/constants.ts with platform fee, launch states, commission rate
  - src/types/index.ts with UserRole, LaunchState, ClosingType, CommissionBreakdown
affects:
  - 01-02-legal-state-data
  - 01-03-calculator
  - 01-04-testing
  - all subsequent phases (scaffold dependency)

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - @clerk/nextjs
    - drizzle-orm@0.45.x
    - postgres@3.x (Supabase Transaction pooler compatible)
    - drizzle-kit
    - vitest@4.x + @vitejs/plugin-react
    - @playwright/test
    - @biomejs/biome
    - zod, react-hook-form, @hookform/resolvers
    - recharts, resend, react-email
    - @aws-sdk/client-s3, @aws-sdk/s3-request-presigner
    - shadcn/ui (defaults preset, Tailwind v4)
    - tailwindcss@4
  patterns:
    - Clerk ClerkProvider wraps entire app in layout.tsx
    - Drizzle singleton with globalThis cache (dev HMR safe)
    - postgres() with prepare: false (Supabase Transaction pooler requirement)
    - Clerk sessionClaims.role for role-based routing (requires JWT template in dashboard)
    - Vitest include pattern scoped to src/** to exclude Playwright specs

key-files:
  created:
    - src/middleware.ts
    - src/db/index.ts
    - src/db/schema.ts
    - drizzle.config.ts
    - src/lib/auth.ts
    - src/lib/constants.ts
    - src/types/index.ts
    - vitest.config.ts
    - playwright.config.ts
    - biome.json
    - .env.example
    - src/lib/__tests__/smoke.test.ts
    - tests/smoke.spec.ts
    - "src/app/(auth)/sign-in/[[...sign-in]]/page.tsx"
    - "src/app/(auth)/sign-up/[[...sign-up]]/page.tsx"
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - package.json
    - .gitignore

key-decisions:
  - "Vitest include scoped to src/** only — Playwright specs must not be discovered by Vitest"
  - "Drizzle postgres() uses prepare: false — required for Supabase Transaction pooler"
  - "Clerk JWT template must be configured in dashboard before role-based routing works — documented in middleware.ts and .env.example"
  - "shadcn/ui initialized with defaults preset (Nova/Radix) — Tailwind v4 CSS-first config"

patterns-established:
  - "Pattern: Drizzle singleton — globalThis.connection prevents multiple connections in dev HMR"
  - "Pattern: Clerk role guard — middleware reads sessionClaims.role (requires JWT template)"
  - "Pattern: Vitest scoped to src/** — separate from Playwright E2E tests in tests/"

requirements-completed: [ACCT-01, ACCT-04]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 15 app with Clerk sign-in/sign-up, Drizzle ORM + Supabase users schema, role-based middleware, Vitest/Playwright test infrastructure, and all Phase 1 dependencies**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T11:48:43Z
- **Completed:** 2026-03-16T11:54:09Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- Next.js 15 app builds and starts with Clerk, Drizzle, shadcn/ui, and all Phase 1 dependencies
- Clerk sign-in/sign-up pages at /sign-in and /sign-up with catch-all routes
- Role-based middleware protecting /buyer/* and /seller/* with JWT template requirement documented
- Drizzle ORM singleton with users table schema (id, email, role enum, timestamps)
- Vitest config with 5 passing smoke tests; Playwright config with chromium E2E project

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 with Phase 1 deps** - `9f9ee2f` (chore)
2. **Task 2: Clerk auth + Drizzle DB + middleware + test configs** - `279e073` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/middleware.ts` - Clerk middleware with role-based /buyer/* and /seller/* protection
- `src/db/index.ts` - Drizzle singleton with postgres (prepare: false for Supabase pooler)
- `src/db/schema.ts` - userRoleEnum + users table (id, email, role, timestamps)
- `drizzle.config.ts` - Drizzle Kit config pointing to schema and migrations
- `src/lib/auth.ts` - setUserRole server action updating Clerk publicMetadata.role
- `src/lib/constants.ts` - PLATFORM_FEE_PLACEHOLDER, LAUNCH_STATES, ATTORNEY_STATES, COMMISSION_RATE_DEFAULT
- `src/types/index.ts` - UserRole, LaunchState, ClosingType, CommissionBreakdown
- `vitest.config.ts` - Vitest config scoped to src/** (excludes Playwright tests)
- `playwright.config.ts` - Playwright chromium config with webServer
- `biome.json` - Biome linting/formatting (replaces ESLint + Prettier)
- `.env.example` - All required env vars + Clerk JWT template reminder comment
- `src/app/layout.tsx` - ClerkProvider wrapping entire app
- `src/app/page.tsx` - Placeholder homepage with sign-in/sign-up links
- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` - Clerk SignIn component
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` - Clerk SignUp component
- `src/lib/__tests__/smoke.test.ts` - Vitest smoke test (5 tests, all passing)
- `tests/smoke.spec.ts` - Playwright smoke test (homepage heading)

## Decisions Made

- Vitest `include` scoped to `src/**/*.{test,spec}.{ts,tsx}` to prevent Playwright specs from being picked up
- Drizzle `postgres()` uses `prepare: false` — required for Supabase Transaction pooler compatibility
- Clerk JWT template must be configured in Clerk Dashboard before role-based routing works — documented in both `src/middleware.ts` and `.env.example`
- shadcn/ui initialized with `--defaults` flag (Nova preset, Radix components, Tailwind v4 CSS-first)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vitest discovered Playwright specs causing test failure**
- **Found during:** Task 2 verification
- **Issue:** Playwright's `test()` function conflicts with Vitest's `test()` — running `npx vitest run` picked up `tests/smoke.spec.ts` and threw "Playwright Test did not expect test() to be called here"
- **Fix:** Added `include: ["src/**/*.{test,spec}.{ts,tsx}"]` and `exclude: ["tests/**"]` to vitest.config.ts
- **Files modified:** `vitest.config.ts`
- **Verification:** `npx vitest run --reporter=verbose` — 5/5 tests pass, 0 failed
- **Committed in:** 279e073 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Required for correct test execution — no scope creep.

## Issues Encountered

- `npx create-next-app@latest .` failed with "name can no longer contain capital letters" (project dir is `RealEstateHunter`). Resolved by scaffolding to `/tmp/realestatehunter-scaffold` and copying files to project directory, then updating `package.json` name to `realestatehunter`.
- The `.bin/next` symlink was broken after the copy. Resolved by recreating the symlink to `../next/dist/bin/next`.

## User Setup Required

Before auth will work in the browser, these manual steps are required:

1. **Clerk Dashboard** — create an application, copy publishable key and secret key to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

2. **Clerk Dashboard > Sessions > Edit JWT template** — add custom claim:
   ```json
   { "role": "{{user.public_metadata.role}}" }
   ```
   Without this, `sessionClaims.role` is `undefined` and role-based routing silently fails.

3. **Supabase** — create a project, copy the Transaction pooler connection string to `.env.local`:
   ```
   DATABASE_URL=postgres://...
   ```

4. Run `npx drizzle-kit push` to create the users table in Supabase.

## Next Phase Readiness

- Scaffold complete — Phase 1 plans 02, 03, 04 can proceed
- DB schema needs `npx drizzle-kit push` with a real DATABASE_URL before any DB operations work
- Clerk auth pages functional after publishable key is added to `.env.local`
- Playwright E2E smoke test will pass once dev server is running

## Self-Check: PASSED

All created files verified present on disk. All task commits verified in git log.

- src/middleware.ts - FOUND
- src/db/index.ts - FOUND
- src/db/schema.ts - FOUND
- vitest.config.ts - FOUND
- playwright.config.ts - FOUND
- src/lib/constants.ts - FOUND
- src/types/index.ts - FOUND
- .env.example - FOUND
- biome.json - FOUND
- .planning/phases/01-legal-framework-foundation/01-01-SUMMARY.md - FOUND
- Commit 9f9ee2f - FOUND
- Commit 279e073 - FOUND

---
*Phase: 01-legal-framework-foundation*
*Completed: 2026-03-16*

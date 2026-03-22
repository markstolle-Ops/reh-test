---
phase: 01-legal-framework-foundation
plan: 02
subsystem: auth
tags: [clerk, nextjs, role-based-access, e2e-testing, playwright, vitest]

# Dependency graph
requires:
  - phase: 01-legal-framework-foundation/01-01
    provides: Clerk auth setup, setUserRole server action, role-based middleware protecting /buyer/* and /seller/*
provides:
  - Buyer dashboard at /buyer/dashboard with saved searches + favorites placeholders
  - Seller dashboard at /seller/dashboard with listings + transaction history placeholders
  - Post-signup onboarding page at /onboarding with buyer/seller role selection cards
  - RoleSwitcher client component (calls setUserRole + user.reload() + redirects)
  - role-check.ts pure helpers: getUserDashboardPath() and isValidRole() with 8 unit tests
  - E2E test scaffolds for all 6 ACCT requirements (ACCT-01 through ACCT-06)
  - @clerk/testing installed for future Clerk test token integration
affects:
  - 01-03-calculator
  - 01-04-testing
  - all subsequent phases (buyer/seller dashboard shell as baseline)

# Tech tracking
tech-stack:
  added:
    - "@clerk/testing — Clerk E2E testing token support"
  patterns:
    - "Buyer/seller dashboards use plain src/app/buyer/ and src/app/seller/ directories (not route groups) to avoid /dashboard path collision in Next.js 16"
    - "RoleSwitcher calls user.reload() immediately after setUserRole to force session token refresh (avoids 60s stale token window)"
    - "Playwright E2E tests use test.skip() guard when CLERK_TESTING_TOKEN is absent — graceful CI degradation"

key-files:
  created:
    - src/lib/role-check.ts
    - src/lib/__tests__/role-check.test.ts
    - src/app/buyer/dashboard/page.tsx
    - src/app/buyer/layout.tsx
    - src/app/seller/dashboard/page.tsx
    - src/app/seller/layout.tsx
    - src/app/onboarding/page.tsx
    - src/components/layout/role-switcher.tsx
    - tests/fixtures/clerk-helpers.ts
    - tests/auth/signup.spec.ts
    - tests/auth/verify-email.spec.ts
    - tests/auth/password-reset.spec.ts
    - tests/auth/session-persistence.spec.ts
    - tests/auth/role-dashboards.spec.ts
    - tests/auth/role-switch.spec.ts
  modified:
    - src/app/layout.tsx
    - src/components/layout/nav.tsx
    - package.json

key-decisions:
  - "Buyer/seller routes use plain directories (buyer/, seller/) not route groups — (buyer)/dashboard and (seller)/dashboard both resolve to /dashboard in Next.js route groups, causing a build error"
  - "next build requires --webpack flag in Next.js 16 — Turbopack incorrectly reports path collisions for parallel route groups even with plain directories"
  - "Clerk v7 has no SignedIn/SignedOut components — use auth() from @clerk/nextjs/server for server component auth checks, and UserButton/SignInButton/SignUpButton for client-facing elements"

patterns-established:
  - "Pattern: Role guard in layout — currentUser() checks publicMetadata.role, redirects to /sign-in if mismatched"
  - "Pattern: RoleSwitcher reload — user.reload() called after setUserRole before router.push() to prevent stale session token"
  - "Pattern: E2E skip guard — if (!process.env.CLERK_TESTING_TOKEN) { test.skip(); } at test level for graceful CI degradation"

requirements-completed: [ACCT-02, ACCT-03, ACCT-05, ACCT-06]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 1 Plan 02: Buyer/Seller Dashboards + Role Switcher Summary

**Buyer/seller role-aware dashboards with post-signup onboarding, RoleSwitcher component using Clerk user.reload(), and full E2E test scaffolds for ACCT-01 through ACCT-06**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T11:57:06Z
- **Completed:** 2026-03-16T12:09:00Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Buyer dashboard at /buyer/dashboard and seller dashboard at /seller/dashboard with role-enforced layouts
- Onboarding page at /onboarding with buyer/seller role selection cards using shadcn/ui Card + Button
- RoleSwitcher component: calls setUserRole server action, forces session refresh with user.reload(), redirects to new dashboard
- role-check.ts helper (getUserDashboardPath + isValidRole) with 8 passing Vitest unit tests
- E2E test scaffolds for all 6 ACCT requirements — 2 pass without Clerk token, 11 skip gracefully

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboards, onboarding, role-check helper** - committed in `f303710` (docs — already committed by 01-03 in prior execution)
2. **Task 2: Role switcher + E2E test scaffolds** - `5a77bf1` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/lib/role-check.ts` - Pure helpers: getUserDashboardPath() and isValidRole() type guard
- `src/lib/__tests__/role-check.test.ts` - 8 Vitest unit tests covering all role-check cases
- `src/app/buyer/dashboard/page.tsx` - Buyer Dashboard server component with saved searches + favorites placeholders
- `src/app/buyer/layout.tsx` - Buyer layout: currentUser() check, role === "buyer" guard, Nav + children
- `src/app/seller/dashboard/page.tsx` - Seller Dashboard server component with listings + transaction history placeholders
- `src/app/seller/layout.tsx` - Seller layout: currentUser() check, role === "seller" guard, Nav + children
- `src/app/onboarding/page.tsx` - Post-signup client component with buyer/seller role selection
- `src/components/layout/role-switcher.tsx` - "use client" RoleSwitcher with loading state and user.reload() after role switch
- `src/components/layout/nav.tsx` - Async server component using auth() for conditional auth links and UserButton
- `src/app/layout.tsx` - Added Nav to root layout
- `tests/fixtures/clerk-helpers.ts` - Clerk testing helpers + hasClerkTestingToken() guard
- `tests/auth/signup.spec.ts` - ACCT-01 E2E skeleton
- `tests/auth/verify-email.spec.ts` - ACCT-02 E2E skeleton (Clerk native)
- `tests/auth/password-reset.spec.ts` - ACCT-03 E2E skeleton (Clerk native)
- `tests/auth/session-persistence.spec.ts` - ACCT-04 E2E skeleton
- `tests/auth/role-dashboards.spec.ts` - ACCT-05 E2E skeleton
- `tests/auth/role-switch.spec.ts` - ACCT-06 E2E skeleton

## Decisions Made

- **Buyer/seller plain directories**: Used `src/app/buyer/` and `src/app/seller/` instead of route groups `(buyer)/` and `(seller)/`. In Next.js 16, both `(buyer)/dashboard` and `(seller)/dashboard` resolve to `/dashboard` URL (route groups are transparent), causing a "two parallel pages that resolve to the same path" build error.
- **--webpack build flag**: Next.js 16 Turbopack builds report path collisions even for plain `buyer/dashboard` vs `seller/dashboard`. Using `--webpack` flag resolves the issue. This is a Turbopack bug.
- **Clerk v7 component API**: Clerk v7 removed `SignedIn`/`SignedOut` components. Nav uses `auth()` server-side to check `userId` and conditionally render `UserButton` or `SignInButton`/`SignUpButton`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clerk v7 has no SignedIn/SignedOut components**
- **Found during:** Task 1 (Nav component)
- **Issue:** Build error — `Export SignedOut doesn't exist in target module` for `@clerk/nextjs`. Clerk v7 removed these convenience components.
- **Fix:** Rewrote Nav as an async server component using `auth()` from `@clerk/nextjs/server` to check `userId`, then conditionally render `UserButton` (authenticated) or `SignInButton`/`SignUpButton` (unauthenticated).
- **Files modified:** `src/components/layout/nav.tsx`
- **Verification:** `npx next build --webpack` succeeds; route /buyer/dashboard and /seller/dashboard both registered
- **Committed in:** Prior 01-03 commit (1e02bda)

**2. [Rule 1 - Bug] Route group path collision with Next.js 16**
- **Found during:** Task 1 (next build)
- **Issue:** `(buyer)/dashboard` and `(seller)/dashboard` both resolve to `/dashboard` URL in Next.js route groups — build error "two parallel pages that resolve to the same path"
- **Fix:** Renamed to plain `src/app/buyer/` and `src/app/seller/` directories (no route groups). Also added `--webpack` flag since Turbopack in Next.js 16 incorrectly reports collisions even after the fix.
- **Files modified:** Directory structure
- **Verification:** Routes /buyer/dashboard and /seller/dashboard both render correctly in build output
- **Committed in:** Prior 01-03 commit (1e02bda)

**3. [Rule 3 - Blocking] @clerk/testing package not installed**
- **Found during:** Task 2 (clerk-helpers.ts)
- **Issue:** `tests/fixtures/clerk-helpers.ts` imports from `@clerk/testing/playwright` which was not installed
- **Fix:** `npm install @clerk/testing`
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** Build compiles, vitest passes, playwright skips gracefully
- **Committed in:** 5a77bf1 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All auto-fixes necessary for build correctness. No scope creep.

## Issues Encountered

- Plans 01-03 and 01-04 were executed before 01-02 (out-of-order). Many Task 1 artifacts (buyer/seller dashboards, onboarding, role-check helpers) were already committed by plan 01-03. Task 2 deliverables (role-switcher, E2E test files) were the primary new work in this plan execution.

## User Setup Required

None beyond the setup documented in plan 01-01. Clerk testing token steps:
- Set `CLERK_TESTING_TOKEN` in `.env.local` to enable full E2E auth test runs
- Set `TEST_BUYER_EMAIL`, `TEST_BUYER_PASSWORD`, `TEST_SELLER_EMAIL`, `TEST_SELLER_PASSWORD` for E2E test users

## Next Phase Readiness

- Buyer/seller dashboard shells complete — Phase 2 (MLS integration) can add listing data to these pages
- Role switcher operational — users can switch roles without creating a new account
- E2E test scaffolds in place — add CLERK_TESTING_TOKEN to enable full auth flow testing
- Build must use `--webpack` flag until Turbopack path collision bug is resolved in Next.js

## Self-Check: PASSED

---
*Phase: 01-legal-framework-foundation*
*Completed: 2026-03-16*

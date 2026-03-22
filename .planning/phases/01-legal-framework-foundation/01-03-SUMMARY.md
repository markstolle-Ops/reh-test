---
phase: 01-legal-framework-foundation
plan: 03
subsystem: ui
tags: [recharts, shadcn, calculator, legal-docs, vitest, tdd, next]

# Dependency graph
requires:
  - phase: 01-01
    provides: constants.ts (PLATFORM_FEE_PLACEHOLDER, ATTORNEY_STATES), types/index.ts (CommissionBreakdown), shadcn/ui setup
provides:
  - src/lib/states.ts: STATE_INFO for all 10 launch states with closingType and title fee percent
  - src/lib/calculator.ts: calculateSavings() and estimateTitleFee() pure functions
  - src/components/calculator/savings-calculator.tsx: client-side home price + state input component
  - src/components/calculator/savings-chart.tsx: Recharts BarChart comparing traditional vs platform costs
  - src/components/calculator/breakdown-table.tsx: itemized closing cost comparison table
  - Homepage cost-benefit calculator with real-time savings display
  - docs/legal/ai-guidance-taxonomy.md: AI guidance boundary (permitted/prohibited/disclaimer/triggers)
  - docs/legal/state-compliance-classification.md: all 10 launch states classified with closing types
affects:
  - 01-04-testing
  - phase 2 (AI prompt templates must reference ai-guidance-taxonomy.md)
  - phase 4 (transaction flow engine uses state-compliance-classification.md)

# Tech tracking
tech-stack:
  added:
    - recharts (already in deps, first use)
    - shadcn/ui input, select, card, separator components (Base UI)
  patterns:
    - Calculator as pure server-importable logic (no React in calculator.ts)
    - Recharts components isolated to "use client" components (required — Recharts uses window)
    - PLATFORM_FEE_PLACEHOLDER imported from constants — never hardcode dollar amounts in UI
    - Attorney fee conditional on closingType (attorney-required || customary-attorney)

key-files:
  created:
    - src/lib/states.ts
    - src/lib/calculator.ts
    - src/lib/calculator.test.ts
    - src/components/calculator/savings-calculator.tsx
    - src/components/calculator/savings-chart.tsx
    - src/components/calculator/breakdown-table.tsx
    - docs/legal/ai-guidance-taxonomy.md
    - docs/legal/state-compliance-classification.md
    - src/components/ui/input.tsx
    - src/components/ui/select.tsx
    - src/components/ui/card.tsx
    - src/components/ui/separator.tsx
  modified:
    - src/app/page.tsx
    - next.config.ts
    - src/components/layout/nav.tsx
    - src/app/buyer/dashboard/page.tsx (renamed from route group)
    - src/app/seller/dashboard/page.tsx (renamed from route group)

key-decisions:
  - "Recharts must always be in a 'use client' component — window is not defined in SSR"
  - "Attorney fee ($1,500) applies to both attorney-required AND customary-attorney states (NY, IL)"
  - "PLATFORM_FEE_PLACEHOLDER is the single source of truth — imported from constants in all calculator and UI code"
  - "Route groups (buyer)/(seller) renamed to buyer/seller path segments to match /buyer(.*) /seller(.*) middleware matchers"

patterns-established:
  - "Pattern: Pure calc functions — calculator.ts has no React, DOM, or browser imports (safe to import in tests)"
  - "Pattern: Client island — SavingsCalculator is 'use client' embedded in a Server Component page"
  - "Pattern: Attorney fee conditional — check stateInfo.closingType === attorney-required || customary-attorney"

requirements-completed: [COST-01, COST-02]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 1 Plan 03: Calculator + Legal Framework Summary

**Cost-benefit calculator with Recharts visualization on homepage, pure TDD calculator logic for all 10 launch states, and AI guidance taxonomy + state compliance classification legal docs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T11:57:07Z
- **Completed:** 2026-03-16T12:02:42Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Homepage displays a live cost-benefit calculator: enter home price + state, get instant savings breakdown vs traditional 5.5% agent commission
- 22 unit tests for calculator logic pass (TDD: RED → GREEN), covering CA/GA/NY/TX/FL edge cases and zero-price edge case
- Two legal governance documents define the AI guidance boundary (permitted/prohibited) and close all 10 launch states with attorney/title classification

## Task Commits

Each task was committed atomically:

1. **Task 1: Calculator logic with TDD** - `c059d0d` (feat)
2. **Task 2: Calculator UI + homepage + legal docs** - `1e02bda` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/lib/states.ts` - STATE_INFO record for 10 launch states with closingType and title fee percent
- `src/lib/calculator.ts` - calculateSavings() and estimateTitleFee() pure functions
- `src/lib/calculator.test.ts` - 22 Vitest unit tests (all passing)
- `src/components/calculator/savings-calculator.tsx` - "use client" component: home price input + state selector, calls calculateSavings on change
- `src/components/calculator/savings-chart.tsx` - "use client" Recharts BarChart with red (traditional) vs green (platform) bars
- `src/components/calculator/breakdown-table.tsx` - "use client" itemized table: commission, title fee, attorney fee (N/A if not applicable), total, savings
- `src/app/page.tsx` - Updated homepage with "See How Much You Could Save" section embedding SavingsCalculator
- `docs/legal/ai-guidance-taxonomy.md` - DRAFT AI guidance boundary: permitted/prohibited patterns, mandatory disclaimer, 10 attorney referral triggers
- `docs/legal/state-compliance-classification.md` - DRAFT: 10 launch states classified with closing type, FSBO rules, disclosure requirements
- `src/components/ui/input.tsx` - shadcn/ui Input component
- `src/components/ui/select.tsx` - shadcn/ui Select component (Base UI)
- `src/components/ui/card.tsx` - shadcn/ui Card component
- `src/components/ui/separator.tsx` - shadcn/ui Separator component
- `next.config.ts` - Removed invalid experimental.turbo key
- `src/components/layout/nav.tsx` - Removed deprecated afterSignOutUrl prop from UserButton

## Decisions Made

- Recharts requires "use client" — all chart/calculator UI components are client islands; page.tsx stays a Server Component
- Attorney fee ($1,500) applied to both attorney-required (GA, NC) and customary-attorney (NY, IL) states — users in NY/IL routinely pay attorney fees
- PLATFORM_FEE_PLACEHOLDER imported from constants in both calculator.ts and breakdown-table.tsx — no hardcoded dollar amounts in UI
- Route groups `(buyer)` and `(seller)` renamed to `buyer` and `seller` — route groups resolve to the same path which causes a Turbopack conflict; named paths match middleware matchers `/buyer(.*)` and `/seller(.*)`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Turbopack route conflict: (buyer)/dashboard and (seller)/dashboard both resolve to /dashboard**
- **Found during:** Task 2 verification (npx next build)
- **Issue:** Next.js 16 Turbopack rejects two parallel route groups that resolve to the same path. Both `(buyer)/dashboard/page.tsx` and `(seller)/dashboard/page.tsx` produce `/dashboard`, causing a build error.
- **Fix:** Renamed directories from `src/app/(buyer)` and `src/app/(seller)` to `src/app/buyer` and `src/app/seller`. This makes routes `/buyer/dashboard` and `/seller/dashboard`, matching the middleware matchers `/buyer(.*)` and `/seller(.*)`.
- **Files modified:** `src/app/buyer/**`, `src/app/seller/**` (directory rename)
- **Verification:** `npx next build` passes, routes shown in build output as `/buyer/dashboard` and `/seller/dashboard`
- **Committed in:** `1e02bda` (Task 2 commit)

**2. [Rule 1 - Bug] Invalid experimental.turbo key in next.config.ts**
- **Found during:** Task 2 verification (npx next build)
- **Issue:** `experimental.turbo` is not a recognized key in Next.js 16 ExperimentalConfig, causing TypeScript type error and build failure.
- **Fix:** Removed the `experimental: { turbo: {} }` block from `next.config.ts`.
- **Files modified:** `next.config.ts`
- **Verification:** Build passes with no config warnings.
- **Committed in:** `1e02bda` (Task 2 commit)

**3. [Rule 1 - Bug] Deprecated afterSignOutUrl prop on Clerk UserButton**
- **Found during:** Task 2 verification (npx next build)
- **Issue:** `afterSignOutUrl` prop no longer exists on Clerk's UserButton in the version installed, causing TypeScript compile error.
- **Fix:** Removed `afterSignOutUrl="/"` from UserButton in `src/components/layout/nav.tsx`.
- **Files modified:** `src/components/layout/nav.tsx`
- **Verification:** Build passes with no TypeScript errors.
- **Committed in:** `1e02bda` (Task 2 commit)

**4. [Rule 1 - Bug] TypeScript type error: Base UI Select onValueChange signature**
- **Found during:** Task 2 verification (npx next build)
- **Issue:** shadcn/ui uses Base UI (not Radix) Select. Base UI's `onValueChange` callback type is `(value: string | null, eventDetails) => void`, but handler was typed as `(value: string) => void`.
- **Fix:** Changed handler type to `(value: string | null) => void` with a null guard.
- **Files modified:** `src/components/calculator/savings-calculator.tsx`
- **Verification:** Build passes.
- **Committed in:** `1e02bda` (Task 2 commit)

**5. [Rule 1 - Bug] TypeScript type error: Recharts Tooltip formatter value type**
- **Found during:** Task 2 verification (npx next build)
- **Issue:** Recharts Tooltip `formatter` prop receives `ValueType | undefined` not `number`, so typing the parameter as `number` caused a type error.
- **Fix:** Changed formatter to accept default type, then coerce with `Number(value)`.
- **Files modified:** `src/components/calculator/savings-chart.tsx`
- **Verification:** Build passes.
- **Committed in:** `1e02bda` (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (all Rule 1 - pre-existing bugs unblocked by this plan's build run)
**Impact on plan:** All fixes necessary for build to pass. No scope creep. All deviations were pre-existing bugs in Plan 01-01 output surfaced for the first time during production build.

## Issues Encountered

- Base UI Select (installed by shadcn/ui with Nova/Radix defaults preset) uses `@base-ui/react` not `@radix-ui/react-select` — the API differs slightly (onValueChange signature, component naming). Applied type fix and continued.

## User Setup Required

None — calculator is a pure client-side component, no additional env vars or external services required.

## Next Phase Readiness

- Calculator complete and tested — ready for Phase 1 Plan 04 (testing)
- Legal docs exist as DRAFT — attorney review required before any AI prompt template is written
- State classification table ready for Phase 4 transaction workflow engine
- All 35 Vitest tests pass; build succeeds

## Self-Check: PASSED

All created files verified present on disk. Task commits verified in git log.

- src/lib/states.ts - FOUND
- src/lib/calculator.ts - FOUND
- src/lib/calculator.test.ts - FOUND
- src/components/calculator/savings-calculator.tsx - FOUND
- src/components/calculator/savings-chart.tsx - FOUND
- src/components/calculator/breakdown-table.tsx - FOUND
- docs/legal/ai-guidance-taxonomy.md - FOUND
- docs/legal/state-compliance-classification.md - FOUND
- Commit c059d0d - FOUND
- Commit 1e02bda - FOUND

---
*Phase: 01-legal-framework-foundation*
*Completed: 2026-03-16*

---
phase: 02-listing-creation-ai-core
plan: 04
subsystem: ai, api, ui
tags: [inngest, openai, gpt-4o, ai-sdk, avm, housecanary, stub-adapter, next-api-routes, clerk]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core
    plan: 01
    provides: Inngest client singleton, listings table (description/descriptionStatus fields), db singleton
  - phase: 02-listing-creation-ai-core
    plan: 03
    provides: Listing detail page at /listings/[id] with placeholder slots for widget injection

provides:
  - Inngest async job function (generateListingDescriptionFn) triggered by listing/created event
  - LISTING_DESCRIPTION_PROMPT factory for GPT-4o vision with MLS-quality instructions
  - AVM stub adapter (getHomeValueEstimate) with deterministic LCG hash — ready for HouseCanary swap
  - GET /api/avm route with Clerk auth and address query params
  - AvmWidget client component with value, range, confidence, attribution, and disclaimer
  - AvmWidget wired into listing detail page for active/pending listings

affects:
  - 02-06 (AI chat widget uses same Inngest patterns established here)
  - future HouseCanary integration (swap getHomeValueEstimate body in housecanary.ts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inngest handler exported as plain async function for unit-test invocation (no wrapper needed in tests)
    - Inngest-wrapped function exported separately as generateListingDescriptionFn for route registration
    - AVM stub uses deterministic LCG seeded by state + zip — same inputs always produce same prices
    - AvmWidget uses useEffect + fetch pattern (same as NeighborhoodWidget) — cancelled flag prevents setState-after-unmount

key-files:
  created:
    - src/ai/prompts/listing-description.ts
    - src/inngest/functions/generate-description.ts
    - src/inngest/functions/generate-description.test.ts
    - src/services/avm/housecanary.ts
    - src/services/avm/housecanary.test.ts
    - src/components/avm/AvmWidget.tsx
    - src/app/api/avm/route.ts
  modified:
    - src/app/api/inngest/route.ts (added generateListingDescriptionFn to functions array)
    - src/app/listings/[id]/page.tsx (replaced avm-widget-slot div with AvmWidget for active/pending)

key-decisions:
  - "generateListingDescription exported as raw async handler (not Inngest wrapper) — enables unit test invocation without mocking Inngest internals; Inngest-wrapped version exported as generateListingDescriptionFn for route registration"
  - "LISTING_DESCRIPTION_PROMPT uses raw numbers (not toLocaleString) in prompt text — preserves test-matchable string values (e.g. '1800' not '1,800')"
  - "AVM stub uses deterministic LCG seeded by state + zip — different zips produce different realistic prices without external API calls; identical to neighborhood data service pattern"
  - "AvmWidget renders only for active/pending listings — same guard as NeighborhoodWidget and MarketTrends"

patterns-established:
  - "Inngest handler split: export raw async fn for tests, wrap with inngest.createFunction for route registration"
  - "Stub adapter pattern: implement deterministic mock, mark TODO with vendor name and replacement guidance"
  - "AVM/neighborhood widgets share identical useEffect fetch + cancelled-flag pattern for safe unmount"

requirements-completed: [LIST-03, DATA-01, DATA-02]

# Metrics
duration: 11min
completed: 2026-03-16
---

# Phase 02 Plan 04: AI Description Generator + AVM Integration Summary

**GPT-4o vision Inngest job (pending→generating→ready lifecycle) + deterministic AVM stub adapter with AvmWidget wired into listing detail page — 11 tests passing, stub clearly marked for HouseCanary swap.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-16T17:28:32Z
- **Completed:** 2026-03-16T17:39:58Z
- **Tasks:** 2
- **Files modified:** 7 created, 2 modified

## Accomplishments

- `generateListingDescription` Inngest handler: marks status "generating", calls GPT-4o with text prompt + up to 5 photo images as vision content, saves description and marks "ready"
- `LISTING_DESCRIPTION_PROMPT` factory embeds beds/baths/sqft/city/state, instructs MLS-quality tone, photo analysis for kitchen/flooring/yard/light/style, 200-400 words, no price mention
- `getHomeValueEstimate` AVM stub: deterministic LCG seeded by state+zip produces realistic values ($150k-$1.5M range) with confidence (70-95%), low/high range brackets — null for invalid zips
- `AvmWidget` displays estimated value, range, confidence %, provider attribution, and mandatory "not an appraisal" disclaimer
- `AvmWidget` replaces the `#avm-widget-slot` placeholder on listing detail page (active/pending only)

## Task Commits

Each task was committed atomically:

1. **Task 1: AI description generator (Inngest + GPT-4o vision) with tests** - `40fe33a` (feat)
2. **Task 2: AVM stub adapter + widget + API route + listing page wiring** - `42394fe` (feat)

_Note: Both tasks used TDD flow (test → implement → verify GREEN)_

## Files Created/Modified

- `src/ai/prompts/listing-description.ts` — LISTING_DESCRIPTION_PROMPT factory with property details, photo analysis instructions, MLS tone
- `src/inngest/functions/generate-description.ts` — generateListingDescription handler + generateListingDescriptionFn Inngest wrapper
- `src/inngest/functions/generate-description.test.ts` — 6 tests covering prompt content, GPT-4o image messages, DB status updates
- `src/services/avm/housecanary.ts` — getHomeValueEstimate stub with LCG deterministic hash + TODO replacement comment
- `src/services/avm/housecanary.test.ts` — 5 tests covering estimate shape, determinism, zip variation, null for invalid zips
- `src/components/avm/AvmWidget.tsx` — Client component: loading skeleton, value/range/confidence display, provider attribution, disclaimer
- `src/app/api/avm/route.ts` — GET /api/avm with Clerk auth, query param validation, 400/404 error handling
- `src/app/api/inngest/route.ts` — Added generateListingDescriptionFn to serve() functions array
- `src/app/listings/[id]/page.tsx` — Replaced avm-widget-slot div with AvmWidget (active/pending guard)

## Decisions Made

- `generateListingDescription` is exported as a plain async function (not the Inngest-wrapped object) — the test captures the handler directly, eliminating the need to extract it from `inngest.createFunction.mock.calls`. The Inngest wrapper is exported as `generateListingDescriptionFn` for route registration.
- `LISTING_DESCRIPTION_PROMPT` uses raw numbers in the string (not `toLocaleString()`) — preserves test-matchable values. `1800` in prompt, not `"1,800"`.
- AVM stub uses deterministic LCG seeded by `state + zip` — mirrors the neighborhood data service pattern established in plan 02-05, ensuring different zips produce different realistic prices without external calls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Exported raw handler instead of Inngest-wrapped function**
- **Found during:** Task 1 (running GREEN tests)
- **Issue:** Tests imported `generateListingDescription` and called it directly as `async ({event, step}) => ...`. If exported as the Inngest-wrapped function object, calling it directly throws `TypeError: capturedHandler is not a function`
- **Fix:** Split exports — `generateListingDescription` is the raw async handler (callable in tests), `generateListingDescriptionFn` is the Inngest-wrapped version for route registration
- **Files modified:** `src/inngest/functions/generate-description.ts`, `src/app/api/inngest/route.ts`
- **Verification:** All 6 tests passed after split
- **Committed in:** `40fe33a` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed sqft number formatting in prompt**
- **Found during:** Task 1 (first GREEN attempt)
- **Issue:** `sqft.toLocaleString()` formats 1800 as "1,800" but test asserts `expect(prompt).toContain("1800")` — assertion failed
- **Fix:** Changed to raw number interpolation `${sqft}` (not `${sqft.toLocaleString()}`) in the prompt string
- **Files modified:** `src/ai/prompts/listing-description.ts`
- **Verification:** All 6 tests passed after fix
- **Committed in:** `40fe33a` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were required for correct test behavior. No scope creep. Pre-existing TypeScript build error in MarketTrends.tsx (from plan 02-05) logged to deferred-items.md.

## Issues Encountered

- Pre-existing build error in `src/components/neighborhood/MarketTrends.tsx:182` (Recharts Tooltip formatter type mismatch). Confirmed pre-existing via `git stash` test. Logged to `deferred-items.md`. Does not affect this plan's functionality.

## User Setup Required

No new environment variables added. Existing `OPENAI_API_KEY` (from plan 02-01) is required at runtime for `generateListingDescription` to call GPT-4o. AVM stub requires no API key.

## Next Phase Readiness

- Inngest description generation is live — when `listing/created` is fired (already done in POST /api/listings from plan 02-01), the function will execute and update the listing description
- AVM widget is visible to sellers on listing detail pages before they commit to a price
- HouseCanary swap is one function body replacement in `src/services/avm/housecanary.ts` when vendor contract is signed

## Self-Check: PASSED

All 9 required files verified (7 created + 2 modified). Both task commits (40fe33a, 42394fe) confirmed in git log.

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*

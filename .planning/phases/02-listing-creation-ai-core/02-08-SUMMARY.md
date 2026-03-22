---
phase: 02-listing-creation-ai-core
plan: 08
subsystem: api
tags: [next.js, rest-api, listing, response-shape, gap-closure]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core
    provides: "listing API routes (POST, GET, PATCH), ListingForm component, seller pages"
provides:
  - "Consistent wrapped JSON responses from all listing API routes"
  - "POST /api/listings returns { listing } with status 201"
  - "GET /api/listings returns { listings: [...] }"
  - "GET /api/listings/[id] returns { listing }"
  - "PATCH /api/listings/[id] returns { listing }"
affects:
  - listing-creation
  - seller-dashboard
  - ai-description-polling
  - listing-edit

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All listing API responses use wrapped object shape ({ listing } or { listings }) matching caller destructuring"
    - "revalidateTag in Next.js 16 requires two args — tag name + profile string ('default')"

key-files:
  created: []
  modified:
    - src/app/api/listings/route.ts
    - src/app/api/listings/[id]/route.ts

key-decisions:
  - "revalidateTag in Next.js 16 requires second profile argument — the plan incorrectly suggested removing it; it was retained as 'default'"

patterns-established:
  - "API routes must wrap responses to match caller destructuring — bare objects/arrays cause silent undefined errors in callers"

requirements-completed: [LIST-01, LIST-02, LIST-04, LIST-05, LIST-06, LIST-07]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 02 Plan 08: API Response Shape Gap Closure Summary

**Standardized all listing API routes to return wrapped JSON ({ listing } / { listings }) matching the destructuring already in place across all consumer components and pages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T18:10:00Z
- **Completed:** 2026-03-16T18:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed POST /api/listings to return `{ listing }` wrapper (was bare object)
- Fixed GET /api/listings to return `{ listings: userListings }` wrapper (was bare array)
- Fixed GET /api/listings/[id] to return `{ listing }` wrapper (was bare object)
- Fixed PATCH /api/listings/[id] to return `{ listing: updated }` wrapper (was bare object)
- Confirmed all three consumer callers (ListingForm, EditListingPage, SellerListingsPage) already destructure correctly — zero caller changes needed
- Build passes cleanly with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap listing API route responses** - `2f780cd` (fix)
2. **Task 2: Verify all callers parse correctly** - no commit (verification-only, zero file changes)

## Files Created/Modified

- `src/app/api/listings/route.ts` - Wrapped POST response as `{ listing }` and GET response as `{ listings: userListings }`
- `src/app/api/listings/[id]/route.ts` - Wrapped GET response as `{ listing }` and PATCH response as `{ listing: updated }`

## Decisions Made

- Retained `revalidateTag("listings", "default")` two-argument form — Next.js 16 type signature requires both arguments; the plan's suggestion to remove the second arg was incorrect for this project's Next.js version

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Retained required second arg on revalidateTag**
- **Found during:** Task 1 (Wrap listing API route responses)
- **Issue:** Plan instructed removing `"default"` second arg from `revalidateTag`, but Next.js 16 in this project has a type signature requiring `(tag: string, profile: string | CacheLifeConfig)` — removing it causes a TypeScript type error that fails the build
- **Fix:** Reverted the single-arg change back to `revalidateTag("listings", "default")` which matches both the project's existing convention (documented in STATE.md) and the actual type signature
- **Files modified:** src/app/api/listings/[id]/route.ts
- **Verification:** Build passed cleanly after fix
- **Committed in:** 2f780cd (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in plan instruction)
**Impact on plan:** Necessary for build to pass. The STATE.md decision log already documented the two-arg form as the correct pattern for this project.

## Issues Encountered

The plan incorrectly suggested removing the second argument from `revalidateTag`. A prior STATE.md decision explicitly documented that Next.js 16 in this project requires the second `profile` argument. The build confirmed this: single-arg call produced a TypeScript error. Reverted to correct form.

## Next Phase Readiness

- All 5 response-shape verification gaps are now resolved
- Seller can fill out listing form and submit — POST response parsed correctly
- Seller can edit listing — PATCH response parsed correctly
- Seller can see their listings dashboard — GET array response parsed correctly
- AI description polling receives listing data and updates descriptionStatus — GET single response parsed correctly
- No blockers for remaining Phase 2 work

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*

---
phase: 03-buyer-discovery-disclosure-esignature
plan: 06
subsystem: ui
tags: [search, mapbox, react, drizzle, nextjs]

# Dependency graph
requires:
  - phase: 03-buyer-discovery-disclosure-esignature
    provides: MapView component, saved-searches API route, listings-search service, SearchParams type
provides:
  - minBaths/maxBaths WHERE conditions on both platform and MLS queries
  - List/Map toggle on buyer search page wired to MapView
  - Save Search button and modal wired to /api/saved-searches
affects:
  - phase: 04-offer-contract-management
  - phase: 05-agent-marketplace

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/dynamic with ssr:false for browser-only components (mapbox-gl)"
    - "numeric(3,1) columns use String() cast in Drizzle gte/lte calls"

key-files:
  created: []
  modified:
    - src/services/search/listings-search.ts
    - src/app/buyer/search/page.tsx

key-decisions:
  - "Baths filter uses String() cast for numeric(3,1) Drizzle column — mirrors same pattern as beds/sqft/price"

patterns-established:
  - "Gap closure pattern: surgical wire-ups of existing backend/component code without new features"

requirements-completed: [SRCH-02, SRCH-03, SRCH-04]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 3 Plan 06: Baths Filter, MapView Toggle, and Save Search Gap Closure Summary

**Bath filter WHERE conditions wired to Drizzle numeric columns; MapView dynamically imported and toggled from search page; Save Search modal POSTs to /api/saved-searches**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T19:15:00Z
- **Completed:** 2026-03-16T19:27:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- minBaths/maxBaths params now produce gte/lte WHERE conditions on `listings.bathrooms` and `mlsListings.bathrooms` (numeric column, String-cast for Drizzle compatibility)
- Search page now renders a List/Map toggle above results; clicking Map renders the MapView component (dynamically imported with ssr:false as required by mapbox-gl)
- Save Search button opens a named-search modal that POSTs `{ name, filters }` to `/api/saved-searches`; handles 401 with sign-in prompt

## Task Commits

Each task was committed atomically:

1. **Task 1: Add minBaths/maxBaths WHERE conditions to listings-search.ts** - `03d4cb3` (feat)
2. **Task 2: Wire MapView toggle and Save Search button into search page** - `d6a4727` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/services/search/listings-search.ts` - Added 4 bath filter conditions (2 platform, 2 MLS) using gte/lte with String() cast
- `src/app/buyer/search/page.tsx` - Added dynamic MapView import, view/save-modal state, toolbar with List/Map toggle and Save Search button, conditional rendering, save search modal

## Decisions Made
- Used `String(minBaths)` / `String(maxBaths)` for Drizzle gte/lte on `numeric(3,1)` columns — consistent with how the column was declared in schema; direct number comparison would produce a TypeScript type error against Drizzle's numeric column type

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 verification gaps from 03-VERIFICATION.md are now closed
- Phase 3 buyer discovery/disclosure/e-signature feature set is complete
- Phase 4 (offer-contract-management) can proceed

## Self-Check: PASSED

- src/services/search/listings-search.ts: FOUND
- src/app/buyer/search/page.tsx: FOUND
- 03-06-SUMMARY.md: FOUND
- commit 03d4cb3: FOUND
- commit d6a4727: FOUND

---
*Phase: 03-buyer-discovery-disclosure-esignature*
*Completed: 2026-03-16*

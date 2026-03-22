---
phase: 03-buyer-discovery-disclosure-esignature
plan: "03"
subsystem: ui, api, search
tags: [mapbox, react-map-gl, inngest, resend, saved-searches, cron, email-alerts]

requires:
  - phase: 03-01
    provides: NormalizedListing type, searchListings service, savedSearches DB table, SearchParams interface

provides:
  - MapView component with Mapbox GL JS interactive map and price-labeled markers
  - List/Map toggle on buyer search page
  - Saved search CRUD service (create/get/delete)
  - POST/GET /api/saved-searches and DELETE /api/saved-searches/[id] API endpoints
  - Inngest daily cron at 9am UTC fanning out per-saved-search alert check events
  - Email alert via Resend when new listings match a saved search since last alert

affects:
  - 03-04
  - 03-05
  - buyer/search page further enhancements

tech-stack:
  added: [mapbox-gl, react-map-gl, @types/mapbox-gl]
  patterns:
    - Dynamic import with ssr:false for mapbox-gl to prevent SSR DOM errors
    - react-map-gl v8 uses /mapbox subpath export (not the root package export)
    - sendEmail injected as optional parameter to checkSavedSearchAlertRaw — avoids needing vi.fn().mockImplementation constructor mock (arrow functions are not constructable in Vitest)
    - Inngest raw function pattern for testability (raw async fn + createFunction wrapper)

key-files:
  created:
    - src/components/search/MapView.tsx
    - src/app/buyer/search/page.tsx
    - src/services/search/saved-searches.ts
    - src/services/search/saved-searches.test.ts
    - src/inngest/functions/match-saved-searches.ts
    - src/inngest/functions/match-saved-searches.test.ts
    - src/app/api/saved-searches/route.ts
    - src/app/api/saved-searches/[id]/route.ts
  modified:
    - src/app/api/inngest/route.ts
    - .env.example
    - package.json
    - package-lock.json

key-decisions:
  - "react-map-gl v8 uses /mapbox subpath entrypoint — import from react-map-gl/mapbox not react-map-gl"
  - "MapView dynamically imported with ssr:false on search page — mapbox-gl accesses window/navigator at module load"
  - "sendEmail injected as optional param in checkSavedSearchAlertRaw — avoids constructable mock issue in Vitest"
  - "Inngest cron fans out one search/alert.check event per saved search — enables parallel processing per Inngest best practices"
  - "NEXT_PUBLIC_MAPBOX_TOKEN documented in .env.example — public token safe for browser bundle"

requirements-completed: [SRCH-03, SRCH-04]

duration: 15min
completed: "2026-03-16"
---

# Phase 03 Plan 03: Map View + Saved Search Alerts Summary

**Mapbox GL JS interactive map with price markers on buyer search page, plus Inngest daily cron that fans out per-saved-search email alerts via Resend**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-16T19:02:43Z
- **Completed:** 2026-03-16T19:07:19Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Buyer search page has List/Map toggle — MapView renders Mapbox GL JS map with price-labeled markers for each listing that has lat/lng coordinates
- Saved search CRUD service and REST API (`POST/GET /api/saved-searches`, `DELETE /api/saved-searches/[id]`) — auth-gated, filters stored as JSON blob
- Inngest cron (`match-saved-searches-cron`, daily 9am UTC) fans out `search/alert.check` events; `check-saved-search-alert` re-runs filters, filters to listings newer than `lastAlertSentAt`, sends Resend email with top 5 matches

## Task Commits

1. **Task 1: RED (failing tests)** — `545e643` (test)
2. **Task 2: MapView + search page toggle** — `dc354b8` (feat)
3. **Task 3: GREEN — saved search CRUD + Inngest alert cron** — `4490a13` (feat)

## Files Created/Modified

- `src/components/search/MapView.tsx` — Mapbox GL JS map with price-pill markers, NavigationControl, dynamic import-ready
- `src/app/buyer/search/page.tsx` — Buyer search page with filter bar and List/Map toggle (ssr:false dynamic import for MapView)
- `src/services/search/saved-searches.ts` — createSavedSearch / getSavedSearches / deleteSavedSearch using Drizzle ORM
- `src/services/search/saved-searches.test.ts` — 6 unit tests mocking db.insert/select/delete
- `src/inngest/functions/match-saved-searches.ts` — matchSavedSearchesRaw (fan-out), checkSavedSearchAlertRaw (alert), Inngest wrappers
- `src/inngest/functions/match-saved-searches.test.ts` — 6 unit tests using injected sendEmail mock
- `src/app/api/saved-searches/route.ts` — POST (create) and GET (list) endpoints
- `src/app/api/saved-searches/[id]/route.ts` — DELETE endpoint
- `src/app/api/inngest/route.ts` — registered matchSavedSearchesCron and checkSavedSearchAlert
- `.env.example` — added NEXT_PUBLIC_MAPBOX_TOKEN
- `package.json` / `package-lock.json` — mapbox-gl, react-map-gl, @types/mapbox-gl

## Decisions Made

- `react-map-gl` v8 exports subpaths only — must import from `react-map-gl/mapbox` (not the root)
- `sendEmail` injected as optional parameter instead of mocking `new Resend()` — Vitest arrow function mocks are not constructable
- MapView `dynamic()` with `ssr: false` is the correct pattern for any library accessing DOM APIs at module load time

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] react-map-gl root package export missing**
- **Found during:** Task 1 (MapView build verification)
- **Issue:** `react-map-gl` v8 removed the root `.` export — `import Map from "react-map-gl"` fails with module not found
- **Fix:** Changed import to `from "react-map-gl/mapbox"` per v8 package exports
- **Files modified:** `src/components/search/MapView.tsx`
- **Verification:** Build passed after fix
- **Committed in:** dc354b8

**2. [Rule 2 - Missing Critical] sendEmail dependency injection**
- **Found during:** Task 2 (GREEN phase, test execution)
- **Issue:** `vi.fn().mockImplementation(() => ...)` creates an arrow function which is not constructable — `new Resend()` throws in test environment
- **Fix:** Extracted `defaultSendEmail` function and injected `sendEmail` as optional parameter to `checkSavedSearchAlertRaw`; tests pass a `vi.fn()` directly
- **Files modified:** `src/inngest/functions/match-saved-searches.ts`, `src/inngest/functions/match-saved-searches.test.ts`
- **Verification:** 12/12 tests pass
- **Committed in:** 4490a13

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes required for correctness. No scope creep.

## Issues Encountered

- Biome linter repeatedly reverted test file changes during editing — resolved by restructuring the implementation (dependency injection) rather than fighting the mock format

## User Setup Required

- Add `NEXT_PUBLIC_MAPBOX_TOKEN` to environment — get public token from https://account.mapbox.com/
- Add `RESEND_API_KEY` to environment for email alert sending (already in use by other parts of the platform)

## Next Phase Readiness

- Map view and saved search alerts complete — SRCH-03 and SRCH-04 satisfied
- Saved search API is live and tested; buyer dashboard can surface the save/manage UI in Phase 3 continuation
- Inngest functions registered and ready for production deployment

## Self-Check: PASSED

All created files verified present. All task commits (dc354b8, 545e643, 4490a13) verified in git log.

---
*Phase: 03-buyer-discovery-disclosure-esignature*
*Completed: 2026-03-16*

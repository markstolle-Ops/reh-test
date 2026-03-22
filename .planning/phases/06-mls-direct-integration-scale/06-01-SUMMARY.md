---
phase: 06-mls-direct-integration-scale
plan: "01"
subsystem: api
tags: [reso, mls, odata, inngest, drizzle, delta-sync, postgres]

# Dependency graph
requires:
  - phase: 03-buyer-discovery-disclosure-esignature
    provides: mlsListings table, NormalizedListing interface, SimplyRETS sync pattern
  - phase: 02-listing-creation-ai-core
    provides: Inngest raw function / wrapper split pattern
provides:
  - RESO Web API OData client with Bearer auth and @odata.nextLink pagination
  - Delta sync via ModificationTimestamp gt filter
  - resoBoards table for per-board API credentials and sync state
  - streetAddress column on mlsListings (previously missing)
  - syncResoBoardsCron: 30-minute Inngest cron with per-board error isolation
  - RESO_HIGH_VOLUME_BOARDS constant listing top 10 US MLS boards
affects:
  - 06-mls-direct-integration-scale (subsequent plans expanding RESO coverage)
  - buyer search (mlsListings now includes RESO sources alongside SimplyRETS)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RESO Data Dictionary 2.0 field names for property resources"
    - "OData $filter=ModificationTimestamp gt {isoString} for delta sync"
    - "mlsSource: 'reso:{boardId}' distinguishes RESO rows from 'simplyrets' rows"
    - "Inngest raw function export pattern (syncResoBoardsRaw) for per-function testability"
    - "Per-board try/catch with lastSyncError DB update — one failure does not block others"

key-files:
  created:
    - src/services/mls/reso-client.ts
    - src/services/mls/reso-client.test.ts
    - src/services/mls/reso-normalizer.ts
    - src/services/mls/reso-normalizer.test.ts
    - src/inngest/functions/sync-reso-boards.ts
    - src/inngest/functions/sync-reso-boards.test.ts
  modified:
    - src/db/schema.ts
    - src/app/api/inngest/route.ts
    - src/lib/constants.ts

key-decisions:
  - "RESO prices are in dollars; normalizer multiplies by 100 to cents — consistent with SimplyRETS Phase 3 decision"
  - "mlsSource 'reso:{boardId}' (e.g. 'reso:crmls') distinguishes RESO rows from 'simplyrets' rows in unified mlsListings table"
  - "OData pagination capped at 10 pages per sync cycle to prevent runaway fetches"
  - "syncResoBoardsRaw exported as testable function separate from Inngest wrapper — mirrors Phase 2/4 pattern"
  - "lastSyncedAt on resoBoards used as delta sync boundary; null boards sync from epoch (new Date(0)) to get full initial load"
  - "streetAddress added to mlsListings — was missing from schema, RESO provides UnparsedAddress"

patterns-established:
  - "ResoBoardConfig interface: boardId, apiUrl, apiToken, name — passed to client functions"
  - "fetchResoDelta wraps fetchResoListings with ModificationTimestamp filter — single responsibility"
  - "normalizeResoListing(raw, boardId): pure function mapping RESO fields → mlsListings row shape"

requirements-completed: [MLS-04]

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 6 Plan 01: RESO Direct Integration Summary

**RESO Web API OData client with delta sync (ModificationTimestamp), normalizer for RESO DD 2.0 fields, resoBoards config table, and 30-minute Inngest cron with per-board error isolation**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-16T20:55:00Z
- **Completed:** 2026-03-16T21:05:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- RESO Web API OData client: Bearer auth, $expand=Media, @odata.nextLink pagination (max 10 pages), delta sync via ModificationTimestamp filter
- Normalizer: maps RESO DD 2.0 fields to mlsListings row shape — ListPrice dollars to cents, null safety on all optional fields, up to 20 photoUrls from Media array
- resoBoards table: per-board API credentials, coverage states, sync interval, lastSyncedAt, lastSyncError for operational visibility
- syncResoBoardsCron: 30-minute Inngest cron, iterates all active boards, runs delta sync, upserts to mlsListings with ON CONFLICT update
- Per-board error isolation: one failing board sets lastSyncError and continues — non-blocking for other boards
- 44 total tests passing across all three test files

## Task Commits

Each task was committed atomically:

1. **Task 1: RESO client + normalizer with delta sync** - `a54b582` (feat)
2. **Task 2: Schema extension + Inngest delta sync cron** - `7ba2cbd` (feat)

**Plan metadata:** _(see final commit)_ (docs: complete plan)

_Note: Task 1 used TDD (RED then GREEN) — tests written first, then implementation._

## Files Created/Modified
- `src/services/mls/reso-client.ts` - ResoBoardConfig interface, fetchResoListings (OData + pagination), fetchResoDelta (ModificationTimestamp filter)
- `src/services/mls/reso-client.test.ts` - 15 tests: bearer auth, pagination, 10-page cap, delta filter, error handling
- `src/services/mls/reso-normalizer.ts` - ResoProperty interface, normalizeResoListing (RESO DD 2.0 → mlsListings row, dollars to cents)
- `src/services/mls/reso-normalizer.test.ts` - 20 tests: field mapping, price conversion, photoUrls cap, null safety
- `src/inngest/functions/sync-reso-boards.ts` - syncResoBoardsRaw (testable), syncResoBoardsCron (Inngest cron every 30min)
- `src/inngest/functions/sync-reso-boards.test.ts` - 9 tests: board iteration, delta since, error isolation, lastSyncedAt update
- `src/db/schema.ts` - resoBoards table added; streetAddress column added to mlsListings
- `src/app/api/inngest/route.ts` - syncResoBoardsCron registered in functions array
- `src/lib/constants.ts` - RESO_HIGH_VOLUME_BOARDS constant (top 10 US MLS boards)

## Decisions Made
- RESO prices are in dollars; normalizer multiplies by 100 to cents — consistent with SimplyRETS Phase 3 decision
- mlsSource `reso:{boardId}` (e.g. `reso:crmls`) distinguishes RESO rows from `simplyrets` rows in unified mlsListings table
- OData pagination capped at 10 pages per sync cycle to prevent runaway fetches
- syncResoBoardsRaw exported as testable function separate from Inngest wrapper — mirrors Phase 2/4 pattern
- lastSyncedAt on resoBoards used as delta sync boundary; null boards sync from epoch (new Date(0)) for full initial load
- streetAddress added to mlsListings — was missing from original schema, RESO provides UnparsedAddress

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required at code level.

RESO board credentials must be inserted into the resoBoards table manually (or via admin UI in a future plan) before any boards sync. See RESO_HIGH_VOLUME_BOARDS constant for targeted boards.

## Next Phase Readiness
- RESO client and normalizer ready for additional boards
- resoBoards table ready to accept board credentials via INSERT
- syncResoBoardsCron will automatically activate boards with `active = true`
- mlsListings unified table now holds both SimplyRETS and RESO sources — buyer search queries unchanged

---
*Phase: 06-mls-direct-integration-scale*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: src/services/mls/reso-client.ts
- FOUND: src/services/mls/reso-normalizer.ts
- FOUND: src/inngest/functions/sync-reso-boards.ts
- FOUND: .planning/phases/06-mls-direct-integration-scale/06-01-SUMMARY.md
- FOUND commit: a54b582 (Task 1 — RESO client + normalizer)
- FOUND commit: 7ba2cbd (Task 2 — schema + Inngest cron)
- FOUND commit: 6210021 (plan metadata)

---
phase: 03-buyer-discovery-disclosure-esignature
plan: 01
subsystem: database, api, search
tags: [drizzle, postgis, simplyrets, inngest, vitest, normalized-listing, mls]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core
    provides: listings table, Inngest client, DB connection pattern

provides:
  - 6 new Drizzle schema tables (savedListings, savedSearches, disclosureForms, disclosureFormSchemas, signatureEnvelopes, mlsListings)
  - PostGIS location column migration for listings table
  - NormalizedListing interface and SearchParams type
  - normalizePlatformListing / normalizeMlsListing functions
  - searchListings() unified search service (platform + MLS)
  - fetchSimplyRetsListings() SimplyRETS REST client
  - syncMlsListings() paginated MLS upsert
  - syncMlsListingsCron Inngest function (every 4h)
  - GET /api/search endpoint

affects:
  - 03-02 (map view, saved search alerts — uses savedListings, savedSearches, searchListings, NormalizedListing)
  - 03-03 (disclosure forms — uses disclosureForms, disclosureFormSchemas tables)
  - 03-04 (AI disclosure form assistant — same tables)
  - 03-05 (eSignature — uses signatureEnvelopes table)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PostGIS geometry column added via raw SQL migration (same pattern as pgvector in Phase 2)
    - Inngest raw function export pattern for testability (same as generate-description.ts)
    - vi.mock factory must use vi.fn() inline — cannot reference hoisted variables
    - Drizzle onConflictDoUpdate for SimplyRETS upsert
    - NormalizedListing as shared contract between platform and MLS sources
    - SimplyRETS prices are in dollars; stored in cents (multiply by 100)

key-files:
  created:
    - src/services/search/normalize.ts
    - src/services/search/normalize.test.ts
    - src/services/search/listings-search.ts
    - src/services/search/listings-search.test.ts
    - src/services/search/mls-client.ts
    - src/services/search/mls-client.test.ts
    - src/inngest/functions/sync-mls-listings.ts
    - src/inngest/functions/sync-mls-listings.test.ts
    - src/app/api/search/route.ts
    - migrations/0001_add_postgis_location.sql
  modified:
    - src/db/schema.ts
    - src/types/index.ts
    - src/app/api/inngest/route.ts
    - .env.example

key-decisions:
  - "NormalizedListing is the shared contract for platform and MLS listings — UI never touches raw DB row shapes"
  - "SimplyRETS prices are in dollars; stored in cents (multiply by 100) for internal consistency"
  - "PostGIS location geometry column declared in Drizzle schema for type-safe queries, but actual DDL applied via raw SQL migration (Drizzle ignores SRID)"
  - "vi.mock factory cannot reference outer variables — use vi.fn() inline and retrieve via vi.mocked()"
  - "syncMlsListings upserts on mlsListings.id (SimplyRETS mlsId) to avoid duplicates across sync runs"

patterns-established:
  - "Pattern: Inngest raw async function exported separately for unit tests, wrapped function registered in route"
  - "Pattern: vi.mock with vi.fn() inline factory, accessed via vi.mocked() after imports"
  - "Pattern: Chainable Drizzle mock using mockReturnValueOnce per sequential query"

requirements-completed: [SRCH-01, SRCH-02, SRCH-06, MLS-02, MLS-03]

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 03 Plan 01: Schema + Search Foundation Summary

**Drizzle schema with 6 new tables (savedListings/savedSearches/disclosureForms/disclosureFormSchemas/signatureEnvelopes/mlsListings), PostGIS migration, NormalizedListing type contract, unified search service querying both platform and MLS listings, SimplyRETS REST client, Inngest 4h sync cron, and GET /api/search endpoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T13:52:05Z
- **Completed:** 2026-03-16T13:57:32Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- 6 new Drizzle schema tables covering the full Phase 3 data model (buyer favorites, saved searches, disclosure forms with attorney review gates, eSignature envelopes, MLS staging table)
- Unified searchListings() service combining platform-native and SimplyRETS MLS listings via NormalizedListing contract, with PostGIS geographic radius filter
- SimplyRETS MLS ingestion pipeline: REST client with Basic auth, paginated upsert, Inngest cron every 4 hours — never called in the hot path of buyer search

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema additions + PostGIS migration + NormalizedListing type contract** - `2ab3130` (feat)
2. **Task 2: Unified search service + MLS client + search API endpoint** - `53d33b6` (feat)

_Note: TDD tasks had RED tests committed in prior state; GREEN committed in task commits above_

## Files Created/Modified

- `src/db/schema.ts` - 6 new tables added; geometry import for PostGIS location column; disclosureForms/signatureEnvelopes relations
- `src/types/index.ts` - NormalizedListing interface and SearchParams type added
- `src/services/search/normalize.ts` - normalizePlatformListing and normalizeMlsListing functions
- `src/services/search/normalize.test.ts` - 10 unit tests (all pass)
- `src/services/search/listings-search.ts` - searchListings() unified query with PostGIS support
- `src/services/search/listings-search.test.ts` - 8 unit tests with mocked Drizzle (all pass)
- `src/services/search/mls-client.ts` - fetchSimplyRetsListings + syncMlsListings
- `src/services/search/mls-client.test.ts` - 7 unit tests with mocked fetch (all pass)
- `src/inngest/functions/sync-mls-listings.ts` - syncMlsListingsCron + syncMlsListingsRaw export
- `src/inngest/functions/sync-mls-listings.test.ts` - 1 unit test (passes)
- `src/app/api/inngest/route.ts` - syncMlsListingsCron added to functions array
- `src/app/api/search/route.ts` - GET handler parsing SearchParams from URL query string
- `migrations/0001_add_postgis_location.sql` - PostGIS column + GIST index with IF NOT EXISTS guards
- `.env.example` - SIMPLYRETS_API_KEY and SIMPLYRETS_API_SECRET added

## Decisions Made

- NormalizedListing is the shared contract — UI never touches raw platform or MLS row shapes directly
- SimplyRETS prices are in dollars; multiplied by 100 to cents on ingest for internal consistency
- PostGIS `location` geometry column declared in Drizzle schema (for type-safe query building) but DDL applied via raw SQL migration only — Drizzle ignores SRID in generated DDL
- vi.mock factory must use `vi.fn()` inline (not outer variables) due to Vitest hoisting behavior
- syncMlsListings upserts on `mlsListings.id` (SimplyRETS mlsId) to ensure idempotency across sync runs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vitest vi.mock hoisting in listings-search.test.ts and sync-mls-listings.test.ts**
- **Found during:** Task 2 GREEN phase (test execution)
- **Issue:** `vi.mock` factory referenced outer variables (`mockDbSelect`, `mockSyncMlsListings`) which are not yet initialized when the factory runs due to Vitest's hoisting behavior — `ReferenceError: Cannot access '...' before initialization`
- **Fix:** Rewrote both test files to use `vi.fn()` inline inside the mock factory and access mock refs via `vi.mocked()` after import
- **Files modified:** src/services/search/listings-search.test.ts, src/inngest/functions/sync-mls-listings.test.ts
- **Verification:** All 26 tests pass after fix
- **Committed in:** 53d33b6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - test setup bug)
**Impact on plan:** Fix was necessary for test correctness. No scope creep.

## Issues Encountered

None — schema additions, normalize functions, search service, MLS client, and Inngest cron all implemented as specified.

## User Setup Required

Add to `.env` before running dev server:
```
SIMPLYRETS_API_KEY=simplyrets
SIMPLYRETS_API_SECRET=simplyrets
```

Demo credentials (`simplyrets` / `simplyrets`) work for local development. Production requires a signed IDX agreement with each MLS board — this is a business prerequisite, not a technical one.

## Next Phase Readiness

- All 6 Phase 3 schema tables defined and ready for downstream plans (03-02 through 03-05)
- `searchListings()` and `NormalizedListing` ready for map view and search UI (03-02)
- `disclosureForms` and `disclosureFormSchemas` tables ready for disclosure form CRUD (03-03)
- `signatureEnvelopes` table ready for eSignature integration (03-05)
- MLS sync pipeline operational; SimplyRETS IDX agreement is the remaining business prerequisite for production data

## Self-Check: PASSED

All files confirmed present. Both task commits (2ab3130, 53d33b6) confirmed in git history.

---
*Phase: 03-buyer-discovery-disclosure-esignature*
*Completed: 2026-03-16*

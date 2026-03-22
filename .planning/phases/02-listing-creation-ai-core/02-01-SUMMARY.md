---
phase: 02-listing-creation-ai-core
plan: 01
subsystem: database, api
tags: [drizzle-orm, postgres, zod, inngest, cloudflare-r2, aws-sdk, clerk, next-api-routes]

# Dependency graph
requires:
  - phase: 01-legal-framework-foundation
    provides: db singleton (drizzle + postgres), auth (Clerk), users table, tsconfig, vitest config

provides:
  - listings, listingPhotos, showingRequests, knowledgeChunks Drizzle tables
  - propertyTypeEnum, listingStatusEnum Drizzle enums
  - createListing service with Zod validation
  - addPhotoToListing, removePhotoFromListing, reorderPhotos photo helpers
  - POST/GET /api/listings, GET/PATCH/DELETE /api/listings/[id] CRUD endpoints
  - POST /api/upload/presign R2 presigned PUT URL endpoint
  - Inngest singleton client + serve route at /api/inngest
  - PropertyType, ListingStatus, ListingFormData, Listing types

affects:
  - 02-02 (listing creation UI needs API routes + schema)
  - 02-03 (photo upload drag-and-drop needs presign endpoint)
  - 02-04 (AI description generation uses Inngest client + listings table)
  - 02-05 (listing detail page reads from listings + listingPhotos)
  - 02-06 (knowledge base uses knowledgeChunks table)
  - all subsequent phases (listings table is the core data model)

# Tech tracking
tech-stack:
  added:
    - inngest (async job queue for AI tasks)
    - ai + @ai-sdk/openai (AI SDK for description generation — used in 02-04)
    - react-dropzone (photo upload UI — used in 02-03)
    - "@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities" (drag-and-drop reorder — used in 02-03)
  patterns:
    - Drizzle relations() imported from "drizzle-orm" (not "drizzle-orm/pg-core")
    - Photo order stored as text[] on listings.photoOrder via array_append/array_remove SQL helpers
    - Land/lot listings allow null beds/baths; Zod .refine() enforces residential requirement
    - Price stored as integer cents (avoids floating-point rounding)
    - Inngest fire-and-forget: send event in API route, handler registered in 02-04
    - revalidateTag requires second profile arg ("default") in Next.js 16

key-files:
  created:
    - src/db/schema.ts (extended with listings, listingPhotos, showingRequests, knowledgeChunks)
    - src/types/index.ts (extended with PropertyType, ListingStatus, ListingFormData, Listing)
    - src/services/listing/create.ts
    - src/services/listing/create.test.ts
    - src/services/listing/photos.ts
    - src/services/listing/photos.test.ts
    - src/inngest/client.ts
    - src/app/api/inngest/route.ts
    - src/app/api/upload/presign/route.ts
    - src/app/api/listings/route.ts
    - src/app/api/listings/[id]/route.ts
  modified:
    - .env.example (added R2, OpenAI, Inngest env vars)
    - package.json (5 new runtime dependencies)

key-decisions:
  - "relations() must be imported from drizzle-orm (not drizzle-orm/pg-core) — separate package entrypoint"
  - "revalidateTag in Next.js 16 requires second profile argument — use 'default' for standard cache invalidation"
  - "Photo order stored as text[] on listings table (not separate join table) — enables O(1) reorder without DB writes per photo"
  - "Inngest event fired fire-and-forget in POST /api/listings — handler registered in plan 02-04 to avoid blocking listing creation"

patterns-established:
  - "Service layer pattern: Zod validation in service, not in route handler — routes stay thin"
  - "Ownership check pattern: fetch listing, compare userId, return 403 before any mutation"
  - "TDD flow: write failing tests first (ERR_MODULE_NOT_FOUND RED), implement, confirm GREEN"

requirements-completed: [LIST-01, LIST-02, LIST-08]

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 02 Plan 01: Listing Schema + Data Foundation Summary

**Drizzle schema with listings/photos/showing/knowledge tables, Zod-validated createListing service, R2 presigned upload endpoint, Inngest client, and full CRUD API — all 17 tests passing, build clean.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T16:02:01Z
- **Completed:** 2026-03-16T16:06:21Z
- **Tasks:** 2
- **Files modified:** 11 created, 2 modified

## Accomplishments

- listings, listingPhotos, showingRequests, knowledgeChunks tables defined in Drizzle schema with correct types, FKs, and cascade deletes
- createListing service with Zod validation enforcing land_lot null-beds exception and price bounds ($10k-$100M)
- Full CRUD API at /api/listings and /api/listings/[id] with auth checks and ownership validation
- R2 presigned PUT URL endpoint at /api/upload/presign (300s expiry)
- Inngest singleton client + serve route registered for Phase 2 async AI jobs

## Task Commits

Each task was committed atomically:

1. **Task 1: Listing schema + service layer with tests** - `3348861` (feat)
2. **Task 2: API routes + R2 presigned upload + Inngest client** - `18f5344` (feat)

_Note: Task 1 used TDD flow (test → implement → verify GREEN)_

## Files Created/Modified

- `src/db/schema.ts` - Extended with 4 new tables + 2 enums + Drizzle relations
- `src/types/index.ts` - Extended with PropertyType, ListingStatus, ListingFormData, Listing types
- `src/services/listing/create.ts` - createListing service with Zod schema and DB insert
- `src/services/listing/create.test.ts` - 14 tests covering validation + DB insert behavior
- `src/services/listing/photos.ts` - addPhotoToListing, removePhotoFromListing, reorderPhotos
- `src/services/listing/photos.test.ts` - 3 tests for photo ordering functions
- `src/inngest/client.ts` - Inngest singleton with id "realestatehunter"
- `src/app/api/inngest/route.ts` - Inngest serve route (GET/POST/PUT), empty functions array
- `src/app/api/upload/presign/route.ts` - S3Client presigned PUT URL generation
- `src/app/api/listings/route.ts` - POST (create + fire inngest event) + GET (list by user)
- `src/app/api/listings/[id]/route.ts` - GET (with photos), PATCH (ownership), DELETE (cascade)
- `.env.example` - Added R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, OPENAI_API_KEY, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY

## Decisions Made

- `relations()` is imported from `drizzle-orm`, not `drizzle-orm/pg-core` — different package entrypoints, TypeScript gives no useful error
- Next.js 16 changed `revalidateTag` to require a second `profile` argument — use `"default"` for standard invalidation
- Photo order stored as `text[]` on the listings row (vs. a separate ordering table) — enables atomic reorder with a single DB write

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `relations` import path**
- **Found during:** Task 1 (running GREEN tests)
- **Issue:** `relations` function was imported from `drizzle-orm/pg-core` but is only exported from `drizzle-orm` — caused `TypeError: relations is not a function` at runtime
- **Fix:** Split imports — table/column helpers from `drizzle-orm/pg-core`, `relations()` from `drizzle-orm`
- **Files modified:** `src/db/schema.ts`
- **Verification:** All 17 tests passed after fix
- **Committed in:** `3348861` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed `revalidateTag` call signature for Next.js 16**
- **Found during:** Task 2 (build verification)
- **Issue:** Next.js 16 changed `revalidateTag(tag)` to require `revalidateTag(tag, profile)` — TypeScript build error
- **Fix:** Added `"default"` as the second argument
- **Files modified:** `src/app/api/listings/[id]/route.ts`
- **Verification:** Build passed cleanly after fix
- **Committed in:** `18f5344` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both were import/API surface bugs introduced by library version differences. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

New environment variables required before any Phase 2 features can run:

| Variable | Purpose |
|---|---|
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible endpoint URL |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name for listing photos |
| `R2_PUBLIC_URL` | Public URL prefix for serving uploaded photos |
| `OPENAI_API_KEY` | OpenAI API key (used in plan 02-04 for description generation) |
| `INNGEST_EVENT_KEY` | Inngest event key (optional for local dev) |
| `INNGEST_SIGNING_KEY` | Inngest signing key (optional for local dev) |

## Next Phase Readiness

- All Phase 2 plans (02-02 through 02-07) can now proceed — they have the schema and API they need
- Drizzle migration must be generated and run against the database before any runtime use: `npx drizzle-kit generate && npx drizzle-kit migrate`
- Inngest functions array in `/api/inngest/route.ts` will be populated in plan 02-04

## Self-Check: PASSED

All 9 required files verified present. Both task commits (3348861, 18f5344) confirmed in git log.

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*

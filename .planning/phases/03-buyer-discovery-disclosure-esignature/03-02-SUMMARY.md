---
phase: 03-buyer-discovery-disclosure-esignature
plan: "02"
subsystem: buyer-search-ui
tags: [search, ui, save-favorites, listing-card, filters]
dependency_graph:
  requires: [03-01]
  provides: [buyer-search-ui, saved-listings-service, save-api]
  affects: [buyer-dashboard, listing-detail]
tech_stack:
  added: []
  patterns:
    - TDD with vitest mocks for DB layer (vi.fn() in factory, vi.mocked() to retrieve)
    - Client component URL sync via useSearchParams + useRouter.replace
    - Server component direct service call (getSavedListings) avoiding HTTP round-trip
key_files:
  created:
    - src/services/search/saved-listings.ts
    - src/services/search/saved-listings.test.ts
    - src/app/api/listings/[id]/save/route.ts
    - src/app/buyer/saved/page.tsx
    - src/components/search/ListingCard.tsx
    - src/components/search/SearchFilters.tsx
    - src/components/search/SearchResults.tsx
  modified:
    - src/app/buyer/search/page.tsx
decisions:
  - isListingSaved uses single db.select() with or() instead of two sequential queries — avoids mock exhaustion in tests and reduces DB round-trips
  - ListingCard wraps platform listings in Next.js Link, MLS listings are non-linked (no detail page yet) — avoids 404s for MLS sources
  - /buyer/search page calls /api/saved-listing-ids for initial saved state load — this endpoint does not exist yet and is handled gracefully with try/catch no-op
metrics:
  duration: 6min
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_created: 8
---

# Phase 3 Plan 2: Buyer Search UI Summary

**One-liner:** Buyer search page with filter sidebar, ListingCard thumbnail grid, heart-toggle save/unsave, and /buyer/saved page backed by toggleSavedListing service.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Save/favorite service + API endpoint | 033e683, 42a9f11 | saved-listings.ts, saved-listings.test.ts, route.ts, saved/page.tsx |
| 2 | Search page UI with filters and ListingCard results grid | 5fe39e2 | ListingCard.tsx, SearchFilters.tsx, SearchResults.tsx, search/page.tsx |

## What Was Built

**saved-listings service** (`src/services/search/saved-listings.ts`):
- `toggleSavedListing(userId, listingId, source)` — checks saved state with single `or()` query, inserts if not saved, deletes if saved
- `isListingSaved(userId, listingId)` — single query covering both platform and MLS id columns
- `getSavedListings(userId)` — joins platform listings and MLS listings tables, normalizes to NormalizedListing[]

**API endpoint** (`src/app/api/listings/[id]/save/route.ts`):
- `POST /api/listings/[id]/save` — auth-gated toggle, returns `{ saved: boolean }`
- `GET /api/listings/[id]/save` — auth-gated check, returns `{ saved: boolean }`

**Saved listings page** (`src/app/buyer/saved/page.tsx`):
- Server component calling getSavedListings directly
- Empty state with SVG heart icon and link to search page
- Inline grid when listings exist (reuses card pattern; SearchResults not available at server render time)

**ListingCard** (`src/components/search/ListingCard.tsx`):
- Photo thumbnail (aspect-video, placeholder SVG when no photo)
- Currency-formatted price, beds/baths/sqft with null fallback "--"
- Property type badge and MLS badge (when source is "mls")
- Heart toggle button (solid red when saved, outlined when not)
- Platform listings wrapped in Next.js Link; MLS listings non-linked

**SearchFilters** (`src/components/search/SearchFilters.tsx`):
- City/zip text input, min/max price number inputs
- Min beds dropdown (1–5+), min baths dropdown (1–4+), min sqft input
- Property type select (all 4 PropertyType values), reset button

**SearchResults** (`src/components/search/SearchResults.tsx`):
- Responsive grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- Result count header, empty state with search icon

**Search page** (`src/app/buyer/search/page.tsx`):
- Client component with URL sync via useRouter.replace + useSearchParams
- Filter changes reset to page 1; pagination via "Load more" appending results
- Save toggle fires `POST /api/listings/[id]/save`, updates savedIds Set in state
- Saved IDs pre-loaded from `/api/saved-listing-ids` (endpoint not yet built; handled with try/catch no-op)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] isListingSaved used two sequential db.select() calls instead of one**
- **Found during:** Task 1 GREEN phase — tests failed because second db.select() mock was not set up
- **Issue:** Original implementation queried listingId and mlsListingId in separate queries, consuming two mock slots while tests only provided one
- **Fix:** Replaced two sequential queries with a single query using `or(eq(savedListings.listingId, id), eq(savedListings.mlsListingId, id))`
- **Files modified:** src/services/search/saved-listings.ts
- **Commit:** 033e683

### Build Notes

The `npx next build` command fails with pre-existing errors from other plans:
- `match-saved-searches.ts` (plan 03-03): Inngest SendEventOutput type mismatch
- `src/app/seller/disclosures/[listingId]/DisclosureFormClient` (plan 03-04): missing file

None of these errors are in files created or modified by this plan. TypeScript checking against our specific files shows no errors.

## Self-Check: PASSED

Files verified:
- src/services/search/saved-listings.ts: FOUND
- src/services/search/saved-listings.test.ts: FOUND
- src/app/api/listings/[id]/save/route.ts: FOUND
- src/app/buyer/saved/page.tsx: FOUND
- src/components/search/ListingCard.tsx: FOUND
- src/components/search/SearchFilters.tsx: FOUND
- src/components/search/SearchResults.tsx: FOUND
- src/app/buyer/search/page.tsx: FOUND (modified)

Tests: 6/6 passing
Commits: 42a9f11, 033e683, 5fe39e2

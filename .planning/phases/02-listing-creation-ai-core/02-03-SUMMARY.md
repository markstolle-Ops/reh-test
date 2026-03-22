---
phase: 02-listing-creation-ai-core
plan: 03
subsystem: ui, pages
tags: [next.js, isr, unstable_cache, revalidateTag, cloudflare-images, react, typescript]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core
    plan: 01
    provides: listings + listingPhotos Drizzle schema, Listing type, db singleton

provides:
  - Public listing detail page at /listings/[id] with ISR (1h revalidate + tag-based)
  - ListingGallery client component with thumbnail strip, arrow nav, keyboard nav, R2/Cloudflare Images URL support
  - ListingHeader: price, status badge, property type, address, beds/baths/sqft stats (land_lot aware)
  - ListingDetails: description with pending fallback, property details table, land_lot sections
  - generateMetadata for SEO (address as title, description first 160 chars)
  - Placeholder slots: chat-widget-slot, neighborhood-widget-slot, avm-widget-slot, fee-breakdown-slot

affects:
  - 02-04 (AVM widget fills #avm-widget-slot)
  - 02-05 (neighborhood widget fills #neighborhood-widget-slot)
  - 02-06 (chatbot fills #chat-widget-slot)
  - 02-07 (fee breakdown fills #fee-breakdown-slot)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - unstable_cache with per-listing cache key ["listing-detail", id] and tags [listing-{id}, listings]
    - Cloudflare Images URL pattern: R2_PUBLIC_URL + r2Key + /variant (falls back to r2Url if env not set)
    - Land/lot conditional rendering: beds/baths hidden for land_lot property type
    - Photo order applied client-side by sorting against listings.photoOrder text[] field
    - Placeholder slots as empty divs with id attributes for future widget injection

key-files:
  created:
    - src/app/listings/[id]/page.tsx
    - src/components/listing/ListingGallery.tsx
    - src/components/listing/ListingHeader.tsx
    - src/components/listing/ListingDetails.tsx

key-decisions:
  - "Photo ordering applied in the Server Component by sorting photosRaw against photoOrder text[] — no extra DB query"
  - "Cloudflare Images URL uses NEXT_PUBLIC_R2_PUBLIC_URL (not R2_PUBLIC_URL) — client component needs public env prefix"
  - "Placeholder slots are empty divs with id attributes rather than comments — allows querySelector-based injection and visibility in DevTools"

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 02 Plan 03: Listing Detail Page Summary

**ISR listing detail page at /listings/[id] with photo gallery (thumbnails, arrow nav, keyboard), ListingHeader (price/status/stats), ListingDetails (description/specs), land_lot-aware rendering, SEO metadata, and empty placeholder slots for 4 future widgets — build clean.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T16:09:02Z
- **Completed:** 2026-03-16T16:10:49Z
- **Tasks:** 1
- **Files modified:** 4 created

## Accomplishments

- `src/app/listings/[id]/page.tsx` — Server Component with `unstable_cache`, `notFound()` for draft/missing listings, `generateMetadata` for SEO, photo ordering from `photoOrder` array, and four placeholder `<div>` slots for future widgets
- `ListingGallery.tsx` — client component with main image (aspect-video), thumbnail strip (overflow-x-auto), prev/next buttons, keyboard arrow support, R2/Cloudflare Images URL with variant suffix (`listing-gallery` / `listing-thumb`), and no-photos fallback
- `ListingHeader.tsx` — price formatted with `Intl.NumberFormat`, status and property type badges, street/city/state/zip address, key stats row with conditional beds/baths for land_lot
- `ListingDetails.tsx` — description with "Description coming soon..." fallback for null/empty, property details table responsive grid, lot size formatted as acres or sqft, land_lot-specific row

## Task Commits

1. **Task 1: Listing detail page with ISR + photo gallery** - `90922df` (feat)

## Files Created/Modified

- `src/app/listings/[id]/page.tsx` — ISR detail page with unstable_cache, notFound, generateMetadata, placeholder slots
- `src/components/listing/ListingGallery.tsx` — Photo gallery with thumbnails, arrow nav, keyboard support
- `src/components/listing/ListingHeader.tsx` — Price, status, address, key stats display
- `src/components/listing/ListingDetails.tsx` — Description and property details table

## Decisions Made

- `NEXT_PUBLIC_R2_PUBLIC_URL` is the correct env var name for `ListingGallery` — client components require the `NEXT_PUBLIC_` prefix; server-side env `R2_PUBLIC_URL` would be invisible at runtime in the browser
- Photo ordering is computed in the Server Component (sort `photosRaw` against `photoOrder` text[]) — avoids an extra DB query and keeps the ordering logic co-located with the page fetch
- Placeholder slots use `<div id="...">` rather than code comments — the id attributes are queryable in tests and visible in browser DevTools, and Next.js layout injection can target them explicitly

## Deviations from Plan

None — plan executed exactly as written.

The plan specified `process.env.R2_PUBLIC_URL` for the gallery URL builder, but the gallery is a `"use client"` component, which requires the `NEXT_PUBLIC_` prefix. Updated to `process.env.NEXT_PUBLIC_R2_PUBLIC_URL` (Rule 1 auto-fix — would have silently returned `undefined` at runtime in production).

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed env var prefix for client component**
- **Found during:** Task 1 (writing ListingGallery)
- **Issue:** Plan specified `R2_PUBLIC_URL` but `ListingGallery` is a `"use client"` component — Next.js strips non-`NEXT_PUBLIC_` vars at build time for client bundles, so `process.env.R2_PUBLIC_URL` would always be `undefined` in the browser
- **Fix:** Used `process.env.NEXT_PUBLIC_R2_PUBLIC_URL` in the gallery URL builder (fallback to `r2Url` still works)
- **Files modified:** `src/components/listing/ListingGallery.tsx`
- **Commit:** `90922df`

## Issues Encountered

None beyond the one auto-fixed deviation above.

## Self-Check: PASSED

All 4 required files verified present. Task commit `90922df` confirmed in git log. Build output shows `/listings/[id]` route compiled successfully.

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*

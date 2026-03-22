---
phase: 02-listing-creation-ai-core
plan: 02
subsystem: ui, seller-workflow
tags: [react-hook-form, zod, react-dropzone, dnd-kit, clerk, next-app-router, r2, inngest]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core/02-01
    provides: listings table, listingPhotos table, createListing service, photo services, /api/listings CRUD, /api/upload/presign

provides:
  - updateListing service with ownership check and descriptionStatus tracking
  - updateListingStatus service with terminal-state enforcement
  - ListingForm multi-step client component (4 steps, react-hook-form + Zod)
  - PhotoUploader with react-dropzone + @dnd-kit/sortable
  - StatusBadge with valid-transition dropdown
  - /seller/listings management page
  - /seller/listings/new create page
  - /seller/listings/[id]/edit edit page
  - Shared listingSchema at @/lib/listing-schema (client-safe — no DB import)

affects:
  - 02-04 (AI description generation updates listing via updateListing)
  - 02-05 (listing detail page — buyers see listings sellers create here)
  - later phases (edit/status management is core seller workflow)

# Tech tracking
tech-stack:
  added:
    - "@hookform/resolvers zodResolver" (react-hook-form Zod integration)
    - "react-dropzone" (drag-and-drop photo upload)
    - "@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities" (photo reorder)
  patterns:
    - "listingSchema extracted to @/lib/listing-schema — shared between server services and client components without bundling postgres"
    - "StatusBadge manages its own optimistic state + API call — no prop drilling"
    - "PhotoUploader: presign → PUT to R2 → PATCH listing to register record"
    - "descriptionStatus polling: useEffect + setInterval, 2s cadence, clears on ready/edited"
    - "updateListing: secondary userId check after DB fetch (not just SQL filter) — works in test mocks"
    - "Button does not support asChild (uses @base-ui/react/button) — use Link + buttonVariants() for nav buttons"

key-files:
  created:
    - src/lib/listing-schema.ts (Zod schema extracted from create.ts — client-safe)
    - src/services/listing/update.ts (updateListing + updateListingStatus)
    - src/services/listing/update.test.ts (17 tests — TDD flow)
    - src/components/listing/ListingForm.tsx (multi-step form, AI poll, create/edit modes)
    - src/components/listing/PhotoUploader.tsx (dropzone + dnd-kit sortable)
    - src/components/listing/StatusBadge.tsx (color-coded status + transitions)
    - src/components/ui/textarea.tsx (new UI primitive)
    - src/app/seller/listings/page.tsx (seller listings management)
    - src/app/seller/listings/new/page.tsx (create listing page)
    - src/app/seller/listings/[id]/edit/page.tsx (edit listing page)
  modified:
    - src/services/listing/create.ts (re-exports schema from @/lib/listing-schema)

key-decisions:
  - "listingSchema must live in @/lib/ not @/services/listing/ — service files import @/db (postgres) which cannot be bundled in browser client components"
  - "Button component uses @base-ui/react/button which has no asChild prop — use Link + buttonVariants() for anchor-as-button patterns"
  - "updateListing adds secondary userId ownership check after DB fetch — required because vitest mocks bypass SQL WHERE filters"
  - "updateListingStatus: sold is terminal — VALID_TRANSITIONS['sold'] = [] enforces this at the service layer, not just API layer"

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 02 Plan 02: Listing Creation + Management UI Summary

**Multi-step listing form (react-hook-form + Zod), photo uploader (react-dropzone + @dnd-kit/sortable), status management with terminal-state enforcement, seller management pages, and update service — all 17 tests passing, build clean.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T16:08:59Z
- **Completed:** 2026-03-16T16:15:45Z
- **Tasks:** 2
- **Files modified:** 10 created, 1 modified

## Accomplishments

- `updateListing` and `updateListingStatus` services with ownership verification, descriptionStatus tracking, and terminal sold-state enforcement
- 17 tests passing via TDD (RED with ERR_MODULE_NOT_FOUND, GREEN after implementation)
- `ListingForm` — 4-step multi-step form: address/type, details (beds/baths hidden for land_lot), photos, description with AI polling
- `PhotoUploader` — drag-and-drop upload via R2 presigned URLs, per-file progress bars, drag-to-reorder with @dnd-kit, delete button
- `StatusBadge` — color-coded (draft=gray, active=green, pending=yellow, sold=red) with dropdown showing valid transitions only
- Seller pages at `/seller/listings`, `/seller/listings/new`, `/seller/listings/[id]/edit`
- Build compiles cleanly (15 routes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Listing update service + status transitions** - `5311140` (feat)
2. **Task 2: Listing form UI + photo uploader + seller pages** - `6e270a5` (feat)

_Note: Task 1 used TDD flow (test → RED → GREEN). Task 2 included 2 auto-fixes._

## Files Created/Modified

- `src/lib/listing-schema.ts` - Zod validation schema, client-safe (no DB imports)
- `src/services/listing/update.ts` - updateListing + updateListingStatus services
- `src/services/listing/update.test.ts` - 17 tests covering all transitions and edge cases
- `src/components/listing/ListingForm.tsx` - 4-step multi-step form with AI description polling
- `src/components/listing/PhotoUploader.tsx` - react-dropzone + @dnd-kit/sortable photo management
- `src/components/listing/StatusBadge.tsx` - Status display + transition dropdown
- `src/components/ui/textarea.tsx` - New textarea UI primitive
- `src/app/seller/listings/page.tsx` - Seller listings management with StatusBadge and edit links
- `src/app/seller/listings/new/page.tsx` - Create listing page (auth-gated, seller role)
- `src/app/seller/listings/[id]/edit/page.tsx` - Edit listing page with ownership verification
- `src/services/listing/create.ts` - Updated to re-export schema from @/lib/listing-schema

## Decisions Made

- `listingSchema` extracted to `@/lib/listing-schema.ts` — service files import `@/db` (postgres driver), which cannot be bundled for browser client components. Shared lib approach keeps schema DRY without coupling client bundles to server-only code.
- `@base-ui/react/button` does not support `asChild` — use `Link + buttonVariants()` for anchor-styled-as-button patterns in this codebase.
- `sold` status is terminal enforced at the service layer (`VALID_TRANSITIONS['sold'] = []`) — same table ensures API layer and any future consumers agree.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ListingForm importing from service that bundles postgres**
- **Found during:** Task 2 build verification
- **Issue:** `ListingForm.tsx` (client component) imported `listingSchema` from `@/services/listing/create.ts`, which imports `@/db` (postgres driver). Webpack cannot bundle Node.js `tls`, `fs`, `perf_hooks` modules for the browser.
- **Fix:** Extracted `listingSchema` to `src/lib/listing-schema.ts` (no DB import). `create.ts` re-exports from there for backwards compatibility. `ListingForm.tsx` imports from `@/lib/listing-schema`.
- **Files modified:** `src/lib/listing-schema.ts` (created), `src/services/listing/create.ts`, `src/components/listing/ListingForm.tsx`
- **Verification:** Build passed cleanly after fix
- **Committed in:** `6e270a5` (Task 2 commit)

**2. [Rule 1 - Bug] Button component does not support asChild prop**
- **Found during:** Task 2 build verification (TypeScript error)
- **Issue:** Used `<Button asChild>` pattern (shadcn pattern) but the Button component wraps `@base-ui/react/button` which doesn't accept `asChild`
- **Fix:** Replaced all `<Button asChild><Link>` patterns with `<Link className={buttonVariants(...)}>`
- **Files modified:** `src/app/seller/listings/page.tsx`
- **Verification:** Build passed cleanly after fix
- **Committed in:** `6e270a5` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both were compatibility issues with the existing codebase conventions. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Next Phase Readiness

- All seller listing UI is in place; `/seller/listings`, `/seller/listings/new`, and `/seller/listings/[id]/edit` are accessible with valid seller role
- Plan 02-04 (AI description generation) can now update listings via `updateListing` — the `descriptionStatus` field and polling loop in `ListingForm` are ready to receive AI-generated content
- Plan 02-05 (listing detail page) can now link to seller-created listings

## Self-Check: PASSED

All 10 files verified present. Both task commits (5311140, 6e270a5) confirmed in git log.

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*

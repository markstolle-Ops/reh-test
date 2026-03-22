---
phase: 02-listing-creation-ai-core
plan: 09
subsystem: api
tags: [photo-upload, r2, presign, drizzle, nextjs]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core
    provides: photo service functions (addPhotoToListing, removePhotoFromListing, reorderPhotos) and listingPhotos schema

provides:
  - Presign route returns { uploadUrl, key, publicUrl } matching PhotoUploader expectations
  - PhotoUploader sends { fileName, contentType, listingId } matching presign route contract
  - PATCH /api/listings/[id] dispatches addPhoto/removePhoto/reorderPhotos to photo service functions
  - Normal PATCH restricted to allowlisted fields (no column injection)

affects: [photo upload flow, listing creation UI, photo management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Photo operation dispatch in PATCH handler (check for addPhoto/removePhoto/reorderPhotos keys before fallback to field update)
    - Allowlist pattern for PATCH field updates to prevent column injection
    - publicUrl constructed server-side from NEXT_PUBLIC_R2_PUBLIC_URL env var

key-files:
  created: []
  modified:
    - src/app/api/upload/presign/route.ts
    - src/components/listing/PhotoUploader.tsx
    - src/app/api/listings/[id]/route.ts

key-decisions:
  - "Presign route response shape is { uploadUrl, key, publicUrl } — client expects uploadUrl not url"
  - "publicUrl computed server-side using NEXT_PUBLIC_R2_PUBLIC_URL to avoid client needing to construct R2 paths"
  - "PATCH photo operations take priority over field updates (checked first by key presence)"
  - "Normal PATCH field updates use an explicit allowlist (15 known fields) to prevent column injection attacks"

patterns-established:
  - "Photo operation dispatch: PATCH body key detection (addPhoto/removePhoto/reorderPhotos) before fallback to field update"
  - "Field update allowlist: explicit Set of allowed column names, strip everything else before db.update()"

requirements-completed:
  - LIST-02
  - LIST-03
  - LIST-08
  - DATA-01
  - DATA-02
  - DATA-03
  - DATA-04
  - CHAT-01
  - CHAT-02
  - CHAT-03
  - CHAT-04
  - CHAT-05
  - COST-03
  - COST-04

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 02 Plan 09: Photo Upload Pipeline Fix Summary

**Presign contract alignment and PATCH photo dispatch: photo upload pipeline (presign -> R2 PUT -> addPhoto -> DB record) now fully functional end-to-end**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-16T18:30:00Z
- **Completed:** 2026-03-16T18:38:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed presign route to return `{ uploadUrl, key, publicUrl }` matching what PhotoUploader already expected
- Fixed PhotoUploader to send `{ fileName, contentType, listingId }` matching what presign route already expected
- Rewrote PATCH handler to dispatch photo operations to photo service functions instead of blindly spreading body into listings table
- Added explicit allowlist of 15 fields for normal listing field updates (prevents column injection)

## Task Commits

1. **Task 1: Fix presign route response and PhotoUploader request** - `e0c581f` (fix)
2. **Task 2: Add photo operation dispatch to PATCH handler** - `9b2cfb8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/api/upload/presign/route.ts` - Returns `{ uploadUrl, key, publicUrl }` instead of `{ url, key }`
- `src/components/listing/PhotoUploader.tsx` - Sends `{ fileName, contentType, listingId }` to presign instead of `{ fileName, fileType, fileSize }`
- `src/app/api/listings/[id]/route.ts` - Dispatches addPhoto/removePhoto/reorderPhotos to photo service; uses allowlisted field updates

## Decisions Made

- publicUrl computed server-side from `NEXT_PUBLIC_R2_PUBLIC_URL` env var so client doesn't need to construct R2 paths directly
- Photo operation detection uses key presence (body.addPhoto, body.removePhoto, body.reorderPhotos) before fallback to field update path
- Normal PATCH updates filtered to explicit 15-field allowlist to prevent column injection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Photo upload pipeline is fully functional: presign -> R2 PUT -> PATCH addPhoto -> photo record in DB
- Photo delete: PATCH removePhoto -> photo record deleted, photoOrder updated
- Photo reorder: PATCH reorderPhotos -> photoOrder updated
- All 3 photo-related gaps from VERIFICATION.md are resolved
- Phase 02 gap closure complete — ready for Phase 03

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*

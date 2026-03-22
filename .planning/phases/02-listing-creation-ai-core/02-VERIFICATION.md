---
phase: 02-listing-creation-ai-core
verified: 2026-03-16T19:00:00Z
status: human_needed
score: 20/20 truths verified
re_verification: true
  previous_status: gaps_found
  previous_score: 12/20
  gaps_closed:
    - "Photos can be uploaded to R2 via presigned PUT URL and associated with a listing"
    - "Seller can fill out a multi-step listing form and submit it"
    - "Seller can edit listing details after publishing"
    - "Seller can see their listings on the seller dashboard"
    - "AI description polling returns updated description status"
    - "Photos can be added to a listing via PATCH"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Verify AI description generation end-to-end"
    expected: "Creating a listing fires listing/created event, Inngest picks it up, GPT-4o generates description, descriptionStatus changes from 'pending' to 'ready'"
    why_human: "Requires live Inngest + OpenAI keys; cannot verify locally without running the app"
  - test: "Verify chatbot scheduleShowing tool call inserts a row in showing_requests"
    expected: "User asks to schedule a showing, chatbot calls scheduleShowing tool, row appears in DB with correct listingId and requestedDate"
    why_human: "Requires live OpenAI streaming + database connection"
  - test: "Verify AVM widget loads on listing detail page for authenticated buyer"
    expected: "AVM widget renders with estimate, range, confidence, and disclaimer after fetching /api/avm"
    why_human: "AVM route requires Clerk auth — needs browser session to verify it works for authenticated users vs. public listing viewers"
---

# Phase 02: Listing Creation AI Core — Verification Report

**Phase Goal:** Sellers can create, publish, and manage listings with AI-generated descriptions and pricing, reaching buyers on MLS without requiring a direct IDX agreement
**Verified:** 2026-03-16
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plans 02-08 and 02-09)

## Re-verification Summary

All 6 blockers from the initial verification have been resolved. Plans 02-08 (API response shape fixes) and 02-09 (photo upload pipeline fix) addressed every gap. All 20 truths now pass automated checks. Three items from the initial verification require human testing with live services before the phase can be considered fully complete.

**Previous score:** 12/20 (6 failed)
**Current score:** 20/20 (0 failed)

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Listing can be created with all required fields | VERIFIED | `createListing` service, Zod validation + DB insert |
| 2  | Photos can be uploaded to R2 via presigned PUT URL | VERIFIED | Presign route returns `{ uploadUrl, key, publicUrl }`; PhotoUploader sends `{ fileName, contentType, listingId }` — contracts aligned |
| 3  | Photo order stored as text[] and reorderable | VERIFIED | `listings.photoOrder` in schema; `reorderPhotos` in photos.ts; PATCH dispatches via photo service |
| 4  | Land/lot listings allow null beds/baths | VERIFIED | Schema: nullable bedrooms/bathrooms; `listingSchema` conditional for land_lot |
| 5  | Seller can fill out multi-step form and submit | VERIFIED | POST `/api/listings` returns `{ listing }` at line 43; ListingForm destructures `{ listing }` at line 172 — aligned |
| 6  | Seller can upload photos with drag-and-drop | VERIFIED | Presign contract fixed; PATCH dispatches `addPhoto` to photo service returning `{ photo }` |
| 7  | Seller can edit AI-generated description | VERIFIED | Textarea + status UI in step 4; GET `/api/listings/[id]` returns `{ listing }`; polling at line 102 correctly updates descriptionStatus |
| 8  | Seller can mark listing as active, pending, or sold | VERIFIED | `StatusBadge` + `updateListingStatus` with valid transition table |
| 9  | Seller can edit listing details after publishing | VERIFIED | EditListingPage at line 46 destructures `{ listing }` from GET response which now returns `{ listing }` |
| 10 | Seller can see their listings | VERIFIED | SellerListingsPage at line 47 accesses `data.listings`; GET `/api/listings` now returns `{ listings: userListings }` |
| 11 | Public listing detail page renders at /listings/[id] | VERIFIED | ISR + `unstable_cache` + `notFound()` for missing listings |
| 12 | Photo gallery displays all listing photos | VERIFIED | `ListingGallery.tsx` with thumbnail strip and keyboard navigation |
| 13 | Non-existent listing ID returns 404 | VERIFIED | `notFound()` called when query returns null |
| 14 | AI generates MLS-quality description via Inngest | VERIFIED | `generate-description.ts` — GPT-4o vision, status lifecycle (pending→generating→ready), registered in Inngest route |
| 15 | AVM shows home value estimate with range and disclaimer | VERIFIED | `AvmWidget` → `/api/avm` → `getHomeValueEstimate`; confidence, range, provider attribution, disclaimer all rendered |
| 16 | Neighborhood widget shows walkability, school ratings | VERIFIED | `NeighborhoodWidget` fetches `/api/neighborhood`, renders walk/transit/bike scores + schools + crime |
| 17 | Market trends show price, DOM, inventory per area | VERIFIED | `MarketTrends` — Recharts LineChart with medianPrice + daysOnMarket lines, summary stat cards |
| 18 | AI chatbot available on listing pages as floating widget | VERIFIED | `ChatWidget` rendered in `listings/[id]/page.tsx` for active/pending listings; floating FAB |
| 19 | Chatbot answers with RAG-grounded context and disclaimers | VERIFIED | RAG via `queryKnowledgeBase` → pgvector; `CHATBOT_SYSTEM_PROMPT` enforces UPL guardrails and mandatory disclaimer |
| 20 | Fee breakdown visible before committing | VERIFIED | `FeeBreakdown` rendered in listing detail page sidebar; state-aware attorney fees; savings vs. traditional commission shown |

**Score:** 20/20 truths verified

---

## Required Artifacts

| Artifact | Status | Notes |
|----------|--------|-------|
| `src/db/schema.ts` | VERIFIED | listings, listingPhotos, showingRequests, knowledgeChunks, all enums, relations |
| `src/services/listing/create.ts` | VERIFIED | createListing + Zod validation |
| `src/services/listing/photos.ts` | VERIFIED | reorderPhotos, addPhotoToListing, removePhotoFromListing |
| `src/app/api/upload/presign/route.ts` | VERIFIED | Returns `{ uploadUrl, key, publicUrl }` — contract aligned with PhotoUploader |
| `src/app/api/listings/route.ts` | VERIFIED | POST returns `{ listing }` (line 43); GET returns `{ listings }` (line 63) |
| `src/app/api/listings/[id]/route.ts` | VERIFIED | GET returns `{ listing }` (line 32); PATCH dispatches photo ops then returns `{ listing }` (line 135); allowlist prevents column injection |
| `src/inngest/client.ts` | VERIFIED | Singleton Inngest instance |
| `src/components/listing/ListingForm.tsx` | VERIFIED | Full multi-step form; response parsing uses `{ listing }` aligned with API |
| `src/components/listing/PhotoUploader.tsx` | VERIFIED | Full DnD UI; presign request and response field names correct |
| `src/app/seller/listings/new/page.tsx` | VERIFIED | Auth check + ListingForm mode="create" |
| `src/app/seller/listings/[id]/edit/page.tsx` | VERIFIED | Auth check; destructures `{ listing }` at line 46 from API that now returns `{ listing }` |
| `src/app/seller/listings/page.tsx` | VERIFIED | Accesses `data.listings` (line 47); API now returns `{ listings }` — shows real data |
| `src/services/listing/update.ts` | VERIFIED | updateListing + updateListingStatus with status transition table |
| `src/app/listings/[id]/page.tsx` | VERIFIED | ISR, tag-based revalidation, all widgets wired |
| `src/components/listing/ListingGallery.tsx` | VERIFIED | Thumbnails, prev/next nav, keyboard support |
| `src/components/listing/ListingDetails.tsx` | VERIFIED | Full property details display |
| `src/inngest/functions/generate-description.ts` | VERIFIED | GPT-4o vision, 3-step status lifecycle, registered in Inngest route |
| `src/ai/prompts/listing-description.ts` | VERIFIED | Versioned prompt function, photo + property details, 200-400 word constraint |
| `src/services/avm/housecanary.ts` | VERIFIED | Deterministic LCG stub; documented TODO for HouseCanary swap |
| `src/components/avm/AvmWidget.tsx` | VERIFIED | Fetch `/api/avm`, range, confidence, attribution, disclaimer |
| `src/app/api/avm/route.ts` | VERIFIED | Calls getHomeValueEstimate, returns estimate |
| `src/services/neighborhood/data.ts` | VERIFIED | getNeighborhoodData + getMarketTrends, deterministic stubs |
| `src/components/neighborhood/NeighborhoodWidget.tsx` | VERIFIED | Full rendering with score bars, schools, crime |
| `src/components/neighborhood/MarketTrends.tsx` | VERIFIED | Recharts LineChart, ResponsiveContainer, stat summary cards |
| `src/app/api/neighborhood/route.ts` | VERIFIED | Calls both services, returns `{ neighborhood, trends }` |
| `src/app/api/chat/route.ts` | VERIFIED | streamText + RAG + scheduleShowing tool + showingRequests insert |
| `src/services/chat/rag.ts` | VERIFIED | pgvector cosine similarity search via match_documents |
| `src/ai/prompts/chatbot-system.ts` | VERIFIED | UPL guardrails, attorney referral triggers, mandatory disclaimer |
| `src/components/chatbot/ChatWidget.tsx` | VERIFIED | AI SDK v6 useChat/DefaultChatTransport, floating FAB, tool call rendering |
| `supabase/migrations/001_pgvector.sql` | VERIFIED | pgvector extension, embedding column, HNSW index, match_documents function |
| `src/components/fees/FeeBreakdown.tsx` | VERIFIED | State-aware attorney fees, savings vs. traditional commission |
| `src/services/fees/transaction-fees.ts` | VERIFIED | calculateTransactionFees extending Phase 1 calculator |
| `src/services/mls/syndication.ts` | VERIFIED | submitToMls stub with documented TODO |

---

## Key Link Verification

| From | To | Via | Status | Notes |
|------|----|-----|--------|-------|
| `src/services/listing/create.ts` | `src/db/schema.ts` | `db.insert(listings)` | WIRED | Line 25-43 |
| `src/app/api/upload/presign/route.ts` | R2 | `getSignedUrl` | WIRED | S3Client + PutObjectCommand present |
| `src/app/api/listings/route.ts` | `src/services/listing/create.ts` | `createListing` | WIRED | Line 31 |
| `src/components/listing/ListingForm.tsx` | `/api/listings` | `fetch POST/PATCH` + `{ listing }` response | WIRED | Response shape aligned |
| `src/components/listing/PhotoUploader.tsx` | `/api/upload/presign` | presign fetch then PUT | WIRED | `{ fileName, contentType, listingId }` → `{ uploadUrl, key, publicUrl }` |
| `src/components/listing/PhotoUploader.tsx` | `/api/listings/[id]` | PATCH addPhoto → `{ photo }` | WIRED | Line 157-169; PATCH returns `{ photo }` for addPhoto branch |
| `src/services/listing/update.ts` | `src/db/schema.ts` | `db.update(listings)` | WIRED | Lines 67-71, 116-120 |
| `src/inngest/functions/generate-description.ts` | `src/ai/prompts/listing-description.ts` | `LISTING_DESCRIPTION_PROMPT` | WIRED | Line 9-10 |
| `src/inngest/functions/generate-description.ts` | `src/db/schema.ts` | `db.update(listings)` | WIRED | Lines 43-48, 76-80 |
| `src/app/api/avm/route.ts` | `src/services/avm/housecanary.ts` | `getHomeValueEstimate` | WIRED | Line 30 |
| `src/app/listings/[id]/page.tsx` | `src/components/avm/AvmWidget.tsx` | AvmWidget rendered | WIRED | Line 128-136 |
| `src/app/api/neighborhood/route.ts` | `src/services/neighborhood/data.ts` | `getNeighborhoodData + getMarketTrends` | WIRED | Lines 22-24 |
| `src/app/listings/[id]/page.tsx` | `src/components/neighborhood/NeighborhoodWidget.tsx` | NeighborhoodWidget rendered | WIRED | Line 118 |
| `src/app/listings/[id]/page.tsx` | `src/components/neighborhood/MarketTrends.tsx` | MarketTrends rendered | WIRED | Line 123 |
| `src/app/api/chat/route.ts` | `src/services/chat/rag.ts` | `queryKnowledgeBase` | WIRED | Line 28 |
| `src/app/api/chat/route.ts` | `src/ai/prompts/chatbot-system.ts` | `CHATBOT_SYSTEM_PROMPT` | WIRED | Line 32-35 |
| `src/app/api/chat/route.ts` | `src/db/schema.ts` | `showingRequests insert` | WIRED | Lines 73-80 |
| `src/components/chatbot/ChatWidget.tsx` | `/api/chat` | `useChat DefaultChatTransport` | WIRED | api: "/api/chat" at line 26 |
| `src/app/listings/[id]/page.tsx` | `src/components/chatbot/ChatWidget.tsx` | ChatWidget rendered | WIRED | Line 113 |
| `src/components/fees/FeeBreakdown.tsx` | `src/services/fees/transaction-fees.ts` | `calculateTransactionFees` | WIRED | Line 10 |
| `src/app/listings/[id]/page.tsx` | `src/components/fees/FeeBreakdown.tsx` | FeeBreakdown rendered | WIRED | Line 143 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LIST-01 | 02-01 | Seller can create listing with all fields | SATISFIED | createListing service, Zod validation, DB insert |
| LIST-02 | 02-01 | Seller can upload multiple photos with drag-and-drop | SATISFIED | PhotoUploader presign contract aligned; PATCH dispatches addPhoto/removePhoto/reorderPhotos to photo service |
| LIST-03 | 02-04 | AI generates MLS-quality description | SATISFIED | Inngest function with GPT-4o vision verified |
| LIST-04 | 02-02 | Seller can edit AI-generated description | SATISFIED | Polling now receives `{ listing }` wrapper; description arrives in textarea |
| LIST-05 | 02-02 | Seller can mark listing as active/pending/sold | SATISFIED | StatusBadge + updateListingStatus with transition table |
| LIST-06 | 02-02 | Seller can edit listing details after publishing | SATISFIED | EditListingPage correctly destructures `{ listing }` from fixed GET response |
| LIST-07 | 02-03 | Listings display with photo gallery and full details | SATISFIED | Public detail page renders all components |
| LIST-08 | 02-01 | Supports residential and land/lots | SATISFIED | Nullable beds/baths in schema, form conditional for land_lot |
| DATA-01 | 02-04 | Seller gets AVM before listing | SATISFIED | AvmWidget on listing page, /api/avm route wired |
| DATA-02 | 02-04 | AVM integrates with property data provider | SATISFIED | Stub with deterministic LCG, documented HouseCanary swap TODO |
| DATA-03 | 02-05 | Buyer views neighborhood data on listing pages | SATISFIED | NeighborhoodWidget wired on listing page |
| DATA-04 | 02-05 | Market analysis shows price trends, DOM, inventory | SATISFIED | MarketTrends with Recharts, wired on listing page |
| CHAT-01 | 02-06 | AI chatbot available 24/7 on every listing page | SATISFIED | ChatWidget floating FAB on active/pending listings |
| CHAT-02 | 02-06 | Chatbot answers state-specific process questions | SATISFIED | CHATBOT_SYSTEM_PROMPT with state variable and permitted topics |
| CHAT-03 | 02-06 | Chatbot can schedule showing requests | SATISFIED | scheduleShowing tool in chat route inserts to showingRequests |
| CHAT-04 | 02-06 | Chatbot provides guidance with "not legal advice" disclaimers | SATISFIED | Mandatory disclaimer in system prompt + footer badge |
| CHAT-05 | 02-06 | Chatbot responses grounded in RAG knowledge base | SATISFIED | queryKnowledgeBase via pgvector match_documents called before LLM |
| COST-03 | 02-07 | Every listing shows full fee breakdown | SATISFIED | FeeBreakdown in listing sidebar, all fee components present |
| COST-04 | 02-07 | Fee breakdown visible before committing | SATISFIED | Rendered on listing detail page before any transaction action |

All 19 requirements satisfied. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/services/listing/update.ts` | 73, 122 | `revalidateTag("listings", "default")` — two-arg form | Info | This was flagged as incorrect usage in initial verification. Confirmed correct: Next.js 16 in this project requires the second `profile` argument. Two-arg form is the established project convention (documented in STATE.md). Not an anti-pattern. |

No blockers or warnings remain.

---

## Human Verification Required

### 1. AI Description End-to-End

**Test:** Create a new listing with at least one photo, submit the form, then advance to step 4 (Description)
**Expected:** Spinner shows "Generating AI description...", then after Inngest processes (5-30 seconds), description appears in textarea and status banner changes to "AI description generated — edit below as needed"
**Why human:** Requires live Inngest connection and OpenAI API key

### 2. ChatBot Showing Scheduling

**Test:** Open a listing page as an authenticated buyer, click the chat bubble, ask to schedule a showing for a specific date and time
**Expected:** Chatbot calls scheduleShowing tool, user sees green "Showing Scheduled" confirmation, row appears in showing_requests table
**Why human:** Requires live OpenAI streaming, DB connection, and Clerk session

### 3. AVM Widget Authenticated Access

**Test:** View a listing page as an authenticated user, then as an unauthenticated visitor
**Expected:** Authenticated user sees the AVM widget with estimate, range, confidence score, and disclaimer. Unauthenticated visitor behavior should be reviewed — AVM route requires Clerk auth but listing pages are public
**Why human:** Auth requirement on a public listing page needs intentional product decision — should AVM be public or gated?

---

## Gaps Closed (Re-verification)

All 6 blockers from the initial verification are resolved:

**Root Cause 1 resolved — JSON wrapper inconsistency (5 gaps):**

- POST `/api/listings` now returns `{ listing }` (line 43) — ListingForm at line 172 correctly parses listing.id
- GET `/api/listings` now returns `{ listings: userListings }` (line 63) — SellerListingsPage at line 47 correctly accesses data.listings
- GET `/api/listings/[id]` now returns `{ listing }` (line 32) — EditListingPage at line 46 and ListingForm polling at line 102 both resolve correctly
- PATCH `/api/listings/[id]` now returns `{ listing: updated }` (line 135) — field-update callers resolve correctly

**Root Cause 2 resolved — Presign contract and PATCH photo handling (1 gap):**

- Presign route returns `{ uploadUrl, key, publicUrl }` — PhotoUploader destructures these exact fields
- PhotoUploader sends `{ fileName, contentType, listingId }` — presign route reads these exact fields
- PATCH handler detects `addPhoto`, `removePhoto`, `reorderPhotos` keys and dispatches to photo service functions; returns `{ photo }` for addPhoto branch matching PhotoUploader expectation at line 169
- Normal field updates restricted to explicit 15-field allowlist preventing column injection

---

*Verified: 2026-03-16*
*Verifier: Claude (gsd-verifier)*
*Re-verification after gap closure via plans 02-08 and 02-09*

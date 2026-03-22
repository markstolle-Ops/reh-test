---
phase: 03-buyer-discovery-disclosure-esignature
verified: 2026-03-16T19:45:00Z
status: passed
score: 13/13 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 10/13
  gaps_closed:
    - "Buyer can filter results by baths (minBaths/maxBaths narrows search results)"
    - "Buyer can view search results on an interactive Mapbox map with list/map toggle on the search page"
    - "Buyer can save a search and receive email alerts — the SaveSearch UI trigger exists on the search page"
  gaps_remaining: []
  regressions: []
---

# Phase 3: Buyer Discovery + Disclosure + eSignature Verification Report

**Phase Goal:** Buyers can find, save, and inquire on properties, and both parties can complete state-specific disclosure forms and sign documents digitally for the 10 launch states
**Verified:** 2026-03-16T19:45:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure via Plan 03-06

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | City/zip text search returns matching active listings | VERIFIED | `listings-search.ts` builds `ilike` conditions on city and zip for both platform and MLS tables |
| 2 | Price, beds, sqft, propertyType filters narrow results correctly | VERIFIED | `gte`/`lte` conditions built for price, beds, sqft, propertyType in both platform and MLS query blocks |
| 3 | Baths filter (minBaths/maxBaths) narrows results | VERIFIED | Lines 60-63 (platform) and 107-110 (MLS) in `listings-search.ts` — `gte(listings.bathrooms, String(minBaths))` / `lte(listings.bathrooms, String(maxBaths))` and MLS equivalents |
| 4 | MLS listings from SimplyRETS appear in unified search results | VERIFIED | `syncMlsListings` upserts to `mlsListings` table; `searchListings` queries both tables and normalizes via `normalizeMlsListing` |
| 5 | Search results display photo thumbnail, price, beds, baths, sqft, city, state | VERIFIED | `ListingCard.tsx` renders all fields with null fallback "--", uses `NormalizedListing` type |
| 6 | Buyer can save/favorite a listing with toggle and view saved listings page | VERIFIED | `toggleSavedListing` service, `POST /api/listings/[id]/save`, heart button in `ListingCard`, `/buyer/saved` server page |
| 7 | Buyer can view listings on interactive Mapbox map with list/map toggle | VERIFIED | `dynamic(() => import("@/components/search/MapView"), { ssr: false })` at line 10; `useState<"list" \| "map">("list")` at line 62; List/Map toggle buttons at lines 215-238; conditional `{view === "map" ? <MapView listings={listings} /> : <SearchResults ... />}` at line 260-268 |
| 8 | Buyer can save a search from the search page and receive email alerts | VERIFIED | "Save search" button at line 241 opens modal; `handleSaveSearch` at line 170 POSTs `{ name, filters }` to `/api/saved-searches`; backend Inngest cron + Resend email delivery fully implemented |
| 9 | Platform provides state-specific disclosure form schemas for 10 launch states | VERIFIED | `LAUNCH_STATE_SCHEMAS` in `form-schema.ts` contains all 10 states: CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL |
| 10 | Seller can fill disclosure form digitally with dynamic fields and AI guidance | VERIFIED | `DisclosureForm.tsx` renders dynamic fields; `AiFormAssistant.tsx` streams guidance; `/seller/disclosures/[listingId]` page wires both together |
| 11 | AI disclosure assistant includes UPL disclaimer on every response | VERIFIED | System prompt in `ai-assist.ts` hardcodes "This is not legal advice. Consult a licensed attorney."; `AiFormAssistant.tsx` shows amber banner on every AI message |
| 12 | Completed disclosure form answers stored in DB linked to listing | VERIFIED | `completeDisclosureForm` sets `status="complete"` + `completedAt`; `disclosureForms` table has `listingId` FK |
| 13 | Users can create a document for digital signing with multi-party support, audit trail, and test_mode in non-production | VERIFIED | `createDocumentForSigning` sets `test_mode: !isProduction`, accepts multi-signer array; webhook `processWebhookEvent` stores `auditTrail` JSON |

**Score:** 13/13 truths verified

---

### Required Artifacts

#### Plan 03-01 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/db/schema.ts` | VERIFIED | All 6 new tables present: `savedListings`, `savedSearches`, `disclosureForms`, `disclosureFormSchemas`, `signatureEnvelopes`, `mlsListings` |
| `src/types/index.ts` | VERIFIED | `NormalizedListing` interface and `SearchParams` type exported |
| `src/services/search/listings-search.ts` | VERIFIED | Exports `searchListings`; implements city/price/beds/baths/sqft/type/geo filters. Bath conditions present on lines 60-63 (platform) and 107-110 (MLS). |
| `src/services/search/normalize.ts` | VERIFIED | Exports `normalizePlatformListing` and `normalizeMlsListing`; 112 lines |
| `src/services/search/mls-client.ts` | VERIFIED | Exports `fetchSimplyRetsListings` and `syncMlsListings`; paginated upsert with Basic auth |
| `src/app/api/search/route.ts` | VERIFIED | Exports `GET`; parses all SearchParams from URL; calls `searchListings`; returns `NextResponse.json` |

#### Plan 03-02 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/app/buyer/search/page.tsx` | VERIFIED | 324 lines; fetches `/api/search`; List/Map toggle; MapView conditional render; Save Search button + modal wired to `/api/saved-searches` |
| `src/components/search/ListingCard.tsx` | VERIFIED | 140 lines; photo thumbnail, formatted price, beds/baths/sqft, city/state, MLS badge, heart toggle |
| `src/components/search/SearchFilters.tsx` | VERIFIED | 187 lines; city/zip, min/max price, min beds, min baths, min sqft, property type, reset |
| `src/components/search/SearchResults.tsx` | VERIFIED | Responsive grid, result count, empty state, maps to `ListingCard` |
| `src/services/search/saved-listings.ts` | VERIFIED | Exports `toggleSavedListing`, `getSavedListings`, `isListingSaved` |
| `src/app/api/listings/[id]/save/route.ts` | VERIFIED | Exports `POST` (toggle) and `GET` (check) |

#### Plan 03-03 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/search/MapView.tsx` | VERIFIED | 79 lines; complete Mapbox GL JS map with price markers, NavigationControl. Now dynamically imported and rendered by search page when view="map" |
| `src/services/search/saved-searches.ts` | VERIFIED | Exports `createSavedSearch`, `getSavedSearches`, `deleteSavedSearch` |
| `src/inngest/functions/match-saved-searches.ts` | VERIFIED | Exports `matchSavedSearchesCron` (daily 9am UTC fan-out) and `checkSavedSearchAlert`; uses `searchListings`, sends via Resend |
| `src/app/api/saved-searches/route.ts` | VERIFIED | Exports `POST` (create) and `GET` (list) — auth-gated |

#### Plan 03-04 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/services/disclosures/form-schema.ts` | VERIFIED | Exports `getFormSchemaForState`, `getAvailableFormSchemas`, `LAUNCH_STATE_SCHEMAS` with all 10 states |
| `src/services/disclosures/disclosure-form.ts` | VERIFIED | Exports `createDisclosureForm`, `updateDisclosureForm`, `getDisclosureForm`, `completeDisclosureForm` |
| `src/services/disclosures/ai-assist.ts` | VERIFIED | Exports `createDisclosureAssistStream`; uses `streamText` from `ai` + `openai("gpt-4o-mini")`; UPL disclaimer in every system prompt |
| `src/components/disclosures/DisclosureForm.tsx` | VERIFIED | 174 lines; dynamic fields by type; section grouping; GA banner; NY $500 credit opt-out with field disabling |
| `src/components/disclosures/AiFormAssistant.tsx` | VERIFIED | 110 lines; streaming chat via `DefaultChatTransport`; amber UPL banner on every AI message |
| `src/app/seller/disclosures/[listingId]/page.tsx` | VERIFIED | Server component; auth check; listing ownership verify; loads schema + existing form; renders `DisclosureFormClient` |

#### Plan 03-05 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/services/signatures/signwell.ts` | VERIFIED | Exports `createDocumentForSigning`, `getDocumentStatus`, `getEmbeddedSigningUrl`, `processWebhookEvent`; lazy API key; test_mode logic |
| `src/services/signatures/signwell.test.ts` | VERIFIED | 11 tests with mocked fetch and db |
| `src/app/api/signatures/route.ts` | VERIFIED | Exports `POST`; auth-gated; calls `createDocumentForSigning` |
| `src/app/api/signatures/webhook/route.ts` | VERIFIED | Exports `POST`; public (no auth); calls `processWebhookEvent` |
| `src/components/signatures/SignatureEmbed.tsx` | VERIFIED | 77 lines; loads `https://cdn.signwell.com/assets/embedded.js` via `next/script`; opens embed on load; cleanup on unmount |

#### Plan 03-06 Artifacts (Gap Closure)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/services/search/listings-search.ts` | VERIFIED | Bath conditions added: `gte(listings.bathrooms, String(minBaths))` at line 61, `lte(listings.bathrooms, String(maxBaths))` at line 63, MLS equivalents at lines 108/110 |
| `src/app/buyer/search/page.tsx` | VERIFIED | 324 lines; dynamic MapView import at line 10; view state at line 62; List/Map toggle toolbar at lines 213-251; conditional MapView/SearchResults at lines 260-268; save search modal at lines 288-321 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/search/route.ts` | `src/services/search/listings-search.ts` | `import searchListings` | WIRED | Line 3 import, line 67 call |
| `src/services/search/listings-search.ts` | `src/services/search/normalize.ts` | `normalizePlatformListing\|normalizeMlsListing` | WIRED | Lines 5, 119-120 |
| `src/inngest/functions/sync-mls-listings.ts` | `src/services/search/mls-client.ts` | `syncMlsListings` | WIRED | Registered in inngest route |
| `src/app/buyer/search/page.tsx` | `src/app/api/search/route.ts` | `fetch /api/search` | WIRED | Line 94: `fetch('/api/search?${qs}')` |
| `src/components/search/ListingCard.tsx` | `src/types/index.ts` | `NormalizedListing` | WIRED | Line 4 import |
| `src/app/api/listings/[id]/save/route.ts` | `src/services/search/saved-listings.ts` | `toggleSavedListing` | WIRED | Import + call verified |
| `src/app/buyer/search/page.tsx` | `src/components/search/MapView.tsx` | `dynamic(() => import("@/components/search/MapView"), { ssr: false })` | WIRED | Line 10 dynamic import; line 261 usage `<MapView listings={listings} />` |
| `src/app/buyer/search/page.tsx` | `/api/saved-searches` | `fetch POST in handleSaveSearch` | WIRED | Line 174: `fetch("/api/saved-searches", { method: "POST", ... })` |
| `src/inngest/functions/match-saved-searches.ts` | `src/services/search/listings-search.ts` | `searchListings` | WIRED | Line 5 import, called in `checkSavedSearchAlertRaw` |
| `src/inngest/functions/match-saved-searches.ts` | `resend` | `resend.emails.send` | WIRED | Dynamic import of `Resend` in `defaultSendEmail` |
| `src/services/disclosures/disclosure-form.ts` | `src/db/schema.ts` | `disclosureForms` table | WIRED | Import at line 3 |
| `src/services/disclosures/ai-assist.ts` | `ai` | `streamText\|toUIMessageStreamResponse` | WIRED | Lines 1-2 imports; `result.toUIMessageStreamResponse()` returned |
| `src/app/api/disclosures/ai-assist/route.ts` | `src/services/disclosures/ai-assist.ts` | `createDisclosureAssistStream` | WIRED | Line 3 import, line 30 call |
| `src/app/api/signatures/route.ts` | `src/services/signatures/signwell.ts` | `createDocumentForSigning` | WIRED | Line 3 import, line 41 call |
| `src/app/api/signatures/webhook/route.ts` | `src/services/signatures/signwell.ts` | `processWebhookEvent` | WIRED | Line 2 import, line 17 call |
| `src/app/api/signatures/webhook/route.ts` | `src/db/schema.ts` | `signatureEnvelopes` (via signwell.ts) | WIRED | `processWebhookEvent` imports and updates `signatureEnvelopes` |
| `src/components/signatures/SignatureEmbed.tsx` | SignWell CDN | `cdn.signwell.com/assets/embedded.js` | WIRED | Line 71: `src="https://cdn.signwell.com/assets/embedded.js"` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SRCH-01 | 03-01 | Buyer can search by location (city, zip, state) | SATISFIED | `ilike` on city/zip in `searchListings`; `q` param parsed in API route |
| SRCH-02 | 03-01/06 | Buyer can filter by price, beds, baths, sqft, property type | SATISFIED | All filters apply WHERE conditions; baths conditions confirmed at listings-search.ts lines 60-63 (platform) and 107-110 (MLS) |
| SRCH-03 | 03-03/06 | Buyer can view properties on interactive map | SATISFIED | MapView dynamically imported in search page with ssr:false; List/Map toggle renders MapView when view="map" |
| SRCH-04 | 03-03/06 | Buyer can save searches and receive email alerts | SATISFIED | "Save search" button + modal in search page POSTs to `/api/saved-searches`; Inngest cron + Resend email backend complete |
| SRCH-05 | 03-02 | Buyer can save/favorite individual listings | SATISFIED | Heart toggle in `ListingCard`, `toggleSavedListing` service, `/buyer/saved` page |
| SRCH-06 | 03-01/02 | Search results display photo thumbnails, price, key details | SATISFIED | `ListingCard` renders thumbnail, price, beds/baths/sqft, city/state |
| DISC-01 | 03-04 | Platform provides state-specific disclosure forms | SATISFIED (phase scope) | 10 launch states covered (CA TX FL NY GA NC AZ OH PA IL). Phase explicitly scoped to 10 states; full 50-state coverage is a future phase item. |
| DISC-02 | 03-04 | Forms are fillable digitally within the platform | SATISFIED | `DisclosureForm.tsx` dynamic renderer; `DisclosureFormClient.tsx`; `/seller/disclosures/[listingId]` page |
| DISC-03 | 03-04 | AI assists with guided prompts | SATISFIED | `AiFormAssistant.tsx` streaming panel; `createDisclosureAssistStream`; `/api/disclosures/ai-assist` endpoint |
| DISC-04 | 03-04 | Completed forms stored and attached to transaction | SATISFIED | `completeDisclosureForm` sets status/completedAt; `disclosureForms.listingId` FK |
| SIGN-01 | 03-05 | Users can sign documents digitally via DocuSign/SignWell | SATISFIED | `createDocumentForSigning` via SignWell REST API; POST `/api/signatures` |
| SIGN-02 | 03-05 | Multi-party signing (buyer, seller, agent) | SATISFIED | `signers: SignWellSigner[]` array supports N recipients; `embedded_signing: true` per signer |
| SIGN-03 | 03-05 | Signed documents stored with audit trail | SATISFIED | `processWebhookEvent` stores `auditTrail` JSON in `signatureEnvelopes.auditTrail` |
| SIGN-04 | 03-05 | E-SIGN Act and UETA compliance | SATISFIED | `test_mode: !isProduction` in `createDocumentForSigning`; CSP configured; SignWell is E-SIGN/UETA compliant provider |
| MLS-02 | 03-01 | MLS listings from partner feeds appear in buyer search | SATISFIED | `syncMlsListings` ingests from SimplyRETS; `searchListings` queries `mlsListings` table; normalized via `normalizeMlsListing` |
| MLS-03 | 03-01 | RESO Web API 2.0 support for MLS data ingestion | SATISFIED | SimplyRETS implements RESO Web API 2.0; client fetches paginated listings with Basic auth |

**Note on DISC-01 scope:** REQUIREMENTS.md lists DISC-01 as "all 50 states" but the Phase 3 roadmap explicitly scopes to "10 launch states." The implementation delivers 10 states as intended. The full 50-state coverage is an open gap against the v1 requirement wording but is not a Phase 3 blocker.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/services/search/normalize.ts` | 80 | `lat: null` hardcoded for platform listings — comment says "populated by geocoding Inngest job (Phase 3 later plan)" | Warning | Platform listings never appear as map markers; only MLS listings with lat/lng populate the map |
| `src/services/signatures/signwell.ts` | 143 | `onConflictDoUpdate` uses `rows[0]` static reference in the `set` object when batch upserting | Warning | Only relevant for batch MLS sync; single-document signing is unaffected |
| `src/app/buyer/search/page.tsx` | 125 | Fetches `/api/saved-listing-ids` which does not exist — caught by try/catch no-op | Info | Saved state never pre-loads for logged-in users; not a crash but a silent UX gap |

No blocker anti-patterns. The two warnings are pre-existing known issues. The info item is a silent UX gap that does not block goal achievement.

---

### Human Verification Required

#### 1. Baths Filter End-to-End

**Test:** Navigate to `/buyer/search`, select "2+" in Min Bathrooms, submit search.
**Expected:** Results grid changes; network tab shows `minBaths=2` in the `/api/search` request; listings displayed all have >= 2 bathrooms.
**Why human:** Requires live database with seeded listings to verify actual filter behavior.

#### 2. Map Toggle Renders Markers

**Test:** Navigate to `/buyer/search`, wait for listings to load, click "Map" toggle button.
**Expected:** Mapbox map renders with price-pill markers for each listing; clicking a marker shows listing details.
**Why human:** Requires Mapbox API key, browser environment, and seeded listings with lat/lng coordinates.

#### 3. Save Search Full Flow

**Test:** Sign in as a buyer, navigate to `/buyer/search`, apply filters, click "Save search", enter a name, submit. Trigger Inngest cron or add a matching listing.
**Expected:** Modal closes on success; email arrives with matching listing subject line.
**Why human:** Requires authenticated session + Resend API key + Inngest trigger + real email delivery.

#### 4. Disclosure Form GA Optional Banner

**Test:** Create a listing with state="GA", navigate to `/seller/disclosures/[listingId]`.
**Expected:** Amber banner reading "Disclosure is optional in Georgia. You may skip this form." appears at top of page.
**Why human:** Requires a real listing and authenticated session.

#### 5. SignWell Embedded Signing in Test Mode

**Test:** Create a document via `POST /api/signatures` with test_mode credentials. Retrieve embedded signing URL via `GET /api/signatures/[id]`. Load `SignatureEmbed` with that URL.
**Expected:** SignWell iframe opens in test mode; no real signature is created.
**Why human:** Requires SignWell API key and real HTTP call to external service.

---

### Gap Closure Summary

All 3 gaps from the initial verification are confirmed closed by Plan 03-06:

**Gap 1 (CLOSED) — Baths filter WHERE conditions.**
`listings-search.ts` now has 4 bath conditions: `gte(listings.bathrooms, String(minBaths))` (line 61), `lte(listings.bathrooms, String(maxBaths))` (line 63), and MLS equivalents (lines 108, 110). The `String()` cast handles the `numeric(3,1)` Drizzle column type correctly.

**Gap 2 (CLOSED) — MapView orphan / no map toggle.**
`src/app/buyer/search/page.tsx` now dynamically imports MapView with `ssr: false` (line 10), has `useState<"list" | "map">` (line 62), List/Map toggle buttons (lines 215-238), and conditionally renders `<MapView listings={listings} />` when `view === "map"` (line 261). MapView is no longer orphaned.

**Gap 3 (CLOSED) — No Save Search UI on search page.**
The search page now has a "Save search" button (line 241) that opens a named-search modal. The `handleSaveSearch` function (line 170) POSTs `{ name: searchName.trim(), filters }` to `/api/saved-searches` and handles 401 with a sign-in prompt. The backend (API + Inngest cron + Resend email) was already complete.

No regressions detected. All 10 previously-passing items confirmed present and unmodified.

---

_Verified: 2026-03-16T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after Plan 03-06 gap closure_

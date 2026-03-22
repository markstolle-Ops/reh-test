---
phase: 04-transaction-engine-state-compliance
plan: "03"
subsystem: ai
tags: [ai-sdk, openai, negotiation, comps, upl, streaming, zod]

requires:
  - phase: 04-01
    provides: Transaction schema + event sourcing foundation
  - phase: 04-02
    provides: XState workflow engine and transaction service
  - phase: 02-listing-creation-ai-core
    provides: AI SDK v6 streamText + tool() + inputSchema pattern

provides:
  - fetchComps() — mls_listings comps query by zip (MVP fallback until ATTOM Data API)
  - formatCompsForPrompt() — comps-to-text formatter for AI context injection
  - NEGOTIATION_BUYER_SYSTEM_PROMPT — UPL-guardrailed buyer negotiation prompt
  - NEGOTIATION_SELLER_SYSTEM_PROMPT — UPL-guardrailed seller counteroffer prompt
  - streamNegotiationGuidance() — AI SDK v6 streaming agent with suggestOfferPrice tool
  - GET /api/negotiation/comps — comparable sales endpoint
  - POST /api/negotiation/strategy — streaming negotiation guidance endpoint

affects:
  - 05-buyer-seller-dashboard (negotiation UI will consume strategy endpoint)
  - 06-advanced-features (ATTOM Data API integration replaces mls_listings fallback)

tech-stack:
  added: []
  patterns:
    - Comps formatted as structured text and injected into AI system prompt context
    - Role-based system prompt selection (buyer vs. seller) in negotiation agent
    - UPL disclaimer embedded verbatim in all negotiation prompt variants
    - suggestOfferPrice tool uses inputSchema with suggestedOfferCents + rationale + confidenceLevel enum
    - X-UPL-Disclaimer header on every streaming strategy response

key-files:
  created:
    - src/services/negotiation/comps.ts
    - src/services/negotiation/comps.test.ts
    - src/ai/agents/negotiation.ts
    - src/ai/agents/negotiation.test.ts
    - src/ai/prompts/negotiation-buyer.ts
    - src/ai/prompts/negotiation-seller.ts
    - src/app/api/negotiation/comps/route.ts
    - src/app/api/negotiation/strategy/route.ts
  modified: []

key-decisions:
  - "mls_listings lastSyncedAt used as soldDate proxy — no separate soldDate column in schema; ATTOM Data API will provide proper soldDate when contract is established"
  - "mls_listings city field used as address display label in comps — rawData contains full street address but requires JSON parse; city+zip is sufficient for AI context"
  - "suggestOfferPriceSchema exported separately from negotiation agent — enables test-only schema import without calling OpenAI"
  - "NEGOTIATION_SELLER_SYSTEM_PROMPT re-exported from negotiation-buyer.ts — single import point for agent to select by role"
  - "daysOnMarket computed from listing.publishedAt with fallback to createdAt — publishedAt is set when listing goes active, createdAt is reliable fallback for draft listings"

patterns-established:
  - "Comps context injection: formatCompsForPrompt() appended to base system prompt before streaming"
  - "Role routing: userRole === 'buyer' selects buyer prompt, else seller prompt"
  - "UPL header: X-UPL-Disclaimer: true on all negotiation strategy responses"

requirements-completed: [NEGO-01, NEGO-02, NEGO-03, NEGO-04, NEGO-05]

duration: 12min
completed: 2026-03-16
---

# Phase 04 Plan 03: Negotiation Assistant Summary

**AI negotiation assistant with mls_listings comps analysis, role-specific UPL-guardrailed prompts (buyer/seller), suggestOfferPrice tool, and streaming API routes**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T15:11:00Z
- **Completed:** 2026-03-16T15:14:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- fetchComps() queries mls_listings for status='sold' by zip, ordered by lastSyncedAt DESC, with computed daysAgo
- Buyer and seller system prompts with verbatim UPL disclaimers and explicit prohibition on contract interpretation
- streamNegotiationGuidance() uses AI SDK v6 streamText + suggestOfferPrice tool with inputSchema (suggestedOfferCents, rationale, confidenceLevel enum)
- GET /api/negotiation/comps and POST /api/negotiation/strategy API routes with auth guards
- 14 tests passing; Next.js build clean

## Task Commits

1. **Task 1: Comps service + AI negotiation agent with UPL guardrails** - `39f7722` (feat)
2. **Task 2: Negotiation API routes** - `c48b098` (feat)

## Files Created/Modified

- `src/services/negotiation/comps.ts` — fetchComps + formatCompsForPrompt (mls_listings fallback)
- `src/services/negotiation/comps.test.ts` — 3 tests: mock DB chain, empty zip, daysAgo computation
- `src/ai/agents/negotiation.ts` — streamNegotiationGuidance + exported suggestOfferPriceSchema
- `src/ai/agents/negotiation.test.ts` — 11 tests: buyer/seller prompts, UPL content, tool schema
- `src/ai/prompts/negotiation-buyer.ts` — buyer system prompt with UPL guardrails
- `src/ai/prompts/negotiation-seller.ts` — seller/counteroffer system prompt with UPL guardrails
- `src/app/api/negotiation/comps/route.ts` — GET comps by listingId
- `src/app/api/negotiation/strategy/route.ts` — POST streaming strategy with X-UPL-Disclaimer header

## Decisions Made

- `mls_listings.lastSyncedAt` used as soldDate proxy — no separate soldDate column in schema; TODO comment marks ATTOM Data API replacement point
- `suggestOfferPriceSchema` exported from negotiation agent for test-only import without OpenAI dependency
- `NEGOTIATION_SELLER_SYSTEM_PROMPT` re-exported from `negotiation-buyer.ts` to enable single import point by role in the agent
- `daysOnMarket` computed from `listing.publishedAt` with fallback to `createdAt`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test mock data corrected for address format mismatch**
- **Found during:** Task 1 (RED phase test run)
- **Issue:** Initial test used `streetAddress: "123 Main St, CA 90210"` but comps.ts selects `mlsListings.city` (not a street address column); resulting address would be `"123 Main St, CA 90210, 90210"` — incorrect double-append
- **Fix:** Updated test mock to use `streetAddress: "Beverly Hills"` (simulating city column) so expected address is `"Beverly Hills, 90210"`
- **Files modified:** src/services/negotiation/comps.test.ts
- **Verification:** All 14 tests pass after correction
- **Committed in:** 39f7722 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - test/implementation alignment)
**Impact on plan:** Minor test data correction. No scope creep. Address format documented in decisions.

## Issues Encountered

- Previous `npx next build` had a stale lock file — removed with `rm -rf .next/lock` before re-running. Build succeeded cleanly.

## User Setup Required

None — no new external services. Negotiation routes use existing OpenAI API key and Clerk auth. ATTOM Data API integration deferred (TODO comment in comps.ts).

## Next Phase Readiness

- Negotiation endpoints ready for Phase 05 buyer/seller dashboard UI integration
- GET /api/negotiation/comps returns comps array for display before chat
- POST /api/negotiation/strategy streams AI guidance with role selection
- ATTOM Data API: replace fetchComps() when vendor contract established (see TODO in comps.ts)

---
*Phase: 04-transaction-engine-state-compliance*
*Completed: 2026-03-16*

## Self-Check: PASSED

All files confirmed present:
- src/services/negotiation/comps.ts — FOUND
- src/services/negotiation/comps.test.ts — FOUND
- src/ai/agents/negotiation.ts — FOUND
- src/ai/agents/negotiation.test.ts — FOUND
- src/ai/prompts/negotiation-buyer.ts — FOUND
- src/ai/prompts/negotiation-seller.ts — FOUND
- src/app/api/negotiation/comps/route.ts — FOUND
- src/app/api/negotiation/strategy/route.ts — FOUND
- .planning/phases/04-transaction-engine-state-compliance/04-03-SUMMARY.md — FOUND

Commits: 39f7722, c48b098, 3a1b0ea — all verified in git log

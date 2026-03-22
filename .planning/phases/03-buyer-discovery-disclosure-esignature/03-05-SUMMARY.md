---
phase: 03-buyer-discovery-disclosure-esignature
plan: "05"
subsystem: api
tags: [signwell, esignature, webhooks, csp, next.js]

requires:
  - phase: 03-buyer-discovery-disclosure-esignature
    provides: signatureEnvelopes table in schema.ts from plan 03-01

provides:
  - SignWell REST adapter with createDocumentForSigning, getDocumentStatus, getEmbeddedSigningUrl, processWebhookEvent
  - POST /api/signatures — auth-gated envelope creation
  - GET /api/signatures/[id] — envelope status and embedded signing URLs
  - POST /api/signatures/webhook — public webhook handler for SignWell events
  - SignatureEmbed React client component for inline iframe signing
  - CSP headers: frame-src signwell.com, script-src cdn.signwell.com

affects:
  - phase-04-offer-negotiation-contracts
  - any feature needing eSignature for transaction documents or disclosures

tech-stack:
  added: []
  patterns:
    - SignWell API key read lazily at call time (not module load) for testability
    - vi.stubEnv used for NODE_ENV mutation in Vitest (Object.defineProperty fails on process.env)
    - Webhook endpoints are public (no auth) — matches SignWell's call pattern
    - CSP configured in next.config.ts headers() for per-route header injection

key-files:
  created:
    - src/services/signatures/signwell.ts
    - src/services/signatures/signwell.test.ts
    - src/app/api/signatures/route.ts
    - src/app/api/signatures/[id]/route.ts
    - src/app/api/signatures/webhook/route.ts
    - src/components/signatures/SignatureEmbed.tsx
  modified:
    - next.config.ts
    - .env.example

key-decisions:
  - "SignWell API key read lazily via getApiKey() function — prevents module-level capture before test env vars are set"
  - "vi.stubEnv used for NODE_ENV in tests instead of Object.defineProperty — process.env in Node.js 22 does not accept defineProperty"
  - "CSP applied globally (source: '/(.*)')  — SignWell iframe requires frame-src + cdn.signwell.com script-src on any page hosting SignatureEmbed"
  - "Webhook handler has no auth — SignWell calls it server-to-server; optional HMAC verification via x-signwell-signature documented in comments"

patterns-established:
  - "Lazy env var getter: export const getApiKey = () => process.env.KEY ?? '' — enables test isolation"

requirements-completed: [SIGN-01, SIGN-02, SIGN-03, SIGN-04]

duration: 8min
completed: 2026-03-16
---

# Phase 3 Plan 5: SignWell eSignature Integration Summary

**SignWell REST adapter + multi-party signing API + embedded iframe component + webhook handler with audit trail storage in signatureEnvelopes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T14:00:00Z
- **Completed:** 2026-03-16T14:08:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- TDD SignWell adapter: 11 tests covering document creation, multi-party signers, test_mode flag, status fetch, embedded URL retrieval, and webhook event processing
- Three signature API routes: POST create, GET status+URLs, POST webhook handler
- SignatureEmbed client component loads SignWell embed.js via next/script and opens inline signing iframe
- CSP headers in next.config.ts allow signwell.com frame-src and cdn.signwell.com script-src
- SIGNWELL_API_KEY documented in .env.example with usage notes

## Task Commits

1. **Task 1: SignWell REST adapter + webhook processor + tests** - `79cd5ff` (feat + test TDD)
2. **Task 2: Signature API endpoints + embedded signing component + CSP config** - `91c001b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/services/signatures/signwell.ts` - SignWell adapter with createDocumentForSigning, getDocumentStatus, getEmbeddedSigningUrl, processWebhookEvent
- `src/services/signatures/signwell.test.ts` - 11 TDD tests with mocked fetch and db
- `src/app/api/signatures/route.ts` - POST /api/signatures, auth required
- `src/app/api/signatures/[id]/route.ts` - GET /api/signatures/[id], returns envelope + signing URLs
- `src/app/api/signatures/webhook/route.ts` - POST /api/signatures/webhook, public, processes SignWell events
- `src/components/signatures/SignatureEmbed.tsx` - Client component for embedded signing iframe
- `next.config.ts` - CSP headers added for SignWell iframe and script
- `.env.example` - SIGNWELL_API_KEY entry added

## Decisions Made

- **Lazy API key read:** `SIGNWELL_API_KEY` captured via `getApiKey()` function rather than module-level const — required so tests can set `process.env.SIGNWELL_API_KEY` before importing the module.
- **vi.stubEnv for NODE_ENV:** `Object.defineProperty(process.env, 'NODE_ENV', ...)` throws in Node.js 22 — `vi.stubEnv` is the correct Vitest approach.
- **Webhook public endpoint:** No auth on webhook handler — SignWell calls it server-to-server. HMAC verification via `x-signwell-signature` header is documented as an optional next step.
- **CSP global application:** Applied to all routes `/(.*)`  since SignatureEmbed could render on buyer, seller, or listing pages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SignWell API key read at module load time prevented test isolation**
- **Found during:** Task 1 (GREEN phase - tests failing)
- **Issue:** `const SIGNWELL_API_KEY = process.env.SIGNWELL_API_KEY ?? ""` at module top captured empty string before tests set the env var
- **Fix:** Replaced with `getApiKey()` function that reads `process.env.SIGNWELL_API_KEY` at call time
- **Files modified:** src/services/signatures/signwell.ts
- **Verification:** Tests pass with correct API key visible in fetch call assertions
- **Committed in:** 79cd5ff (Task 1 commit)

**2. [Rule 1 - Bug] Object.defineProperty on process.env throws in Node.js 22**
- **Found during:** Task 1 (GREEN phase - 2 tests failing)
- **Issue:** Tests used `Object.defineProperty(process.env, "NODE_ENV", ...)` to simulate production — Node.js 22 throws `ERR_INVALID_OBJECT_DEFINE_PROPERTY`
- **Fix:** Replaced with `vi.stubEnv("NODE_ENV", value)` + `vi.unstubAllEnvs()` in tests
- **Files modified:** src/services/signatures/signwell.test.ts
- **Verification:** All 11 tests pass
- **Committed in:** 79cd5ff (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug, found during TDD GREEN phase)
**Impact on plan:** Both fixes required for test correctness. No scope creep.

## Issues Encountered

- None beyond the auto-fixed deviations above.

## User Setup Required

Add to `.env` (or `.env.local`):
```
SIGNWELL_API_KEY=your_signwell_api_key_here
```

Get your API key from: https://www.signwell.com/app/settings/integrations

No dashboard configuration needed for test mode — `test_mode=true` is set automatically in non-production environments.

## Next Phase Readiness

- SignWell integration complete: create, status, embed URL, webhook processing all implemented
- Ready for Phase 4 offer/contract flows that require eSignature on transaction documents
- Multi-party signing (buyer + seller + optional agent) supported out of the box
- Audit trail stored as JSON in `signatureEnvelopes.auditTrail` column on completion

---
*Phase: 03-buyer-discovery-disclosure-esignature*
*Completed: 2026-03-16*

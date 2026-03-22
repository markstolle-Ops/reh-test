---
phase: 03-buyer-discovery-disclosure-esignature
plan: 04
subsystem: api, ui, ai
tags: [disclosure, forms, react-hook-form, ai-sdk, streaming, nextjs]

# Dependency graph
requires:
  - phase: 03-01
    provides: disclosureForms + disclosureFormSchemas DB tables in schema.ts
  - phase: 02-06
    provides: AI SDK v6 streaming patterns (streamText, toUIMessageStreamResponse, DefaultChatTransport)

provides:
  - LAUNCH_STATE_SCHEMAS registry with placeholder fields for all 10 launch states
  - getFormSchemaForState / getAvailableFormSchemas functions
  - Disclosure form CRUD service (create, update, complete, get)
  - AI streaming guidance service with UPL disclaimer on every system prompt
  - POST/GET /api/disclosures — create and list forms
  - GET/PATCH/POST /api/disclosures/[id] — fetch, save draft, complete
  - POST /api/disclosures/ai-assist — streaming field guidance
  - DisclosureForm component: dynamic field renderer from JSON schema
  - AiFormAssistant component: streaming chat with UPL banner
  - /seller/disclosures/[listingId] — complete seller disclosure page

affects: [03-05-esignature, 04-buyer-offer-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State-specific JSON form schemas stored as serialized FieldSchema[] arrays in LAUNCH_STATE_SCHEMAS"
    - "AI assist follows same DefaultChatTransport pattern as Phase 2 ChatWidget"
    - "Disclosure page splits into Server Component (page.tsx) + Client island (DisclosureFormClient.tsx)"

key-files:
  created:
    - src/services/disclosures/form-schema.ts
    - src/services/disclosures/form-schema.test.ts
    - src/services/disclosures/disclosure-form.ts
    - src/services/disclosures/disclosure-form.test.ts
    - src/services/disclosures/ai-assist.ts
    - src/services/disclosures/ai-assist.test.ts
    - src/app/api/disclosures/route.ts
    - src/app/api/disclosures/[id]/route.ts
    - src/app/api/disclosures/ai-assist/route.ts
    - src/components/disclosures/DisclosureForm.tsx
    - src/components/disclosures/AiFormAssistant.tsx
    - src/app/seller/disclosures/[listingId]/page.tsx
    - src/app/seller/disclosures/[listingId]/DisclosureFormClient.tsx
  modified:
    - src/inngest/functions/match-saved-searches.ts

key-decisions:
  - "LAUNCH_STATE_SCHEMAS fields are PLACEHOLDER arrays — must be replaced after attorney review before any activation (active: false gate remains)"
  - "GA schema has required=false — seller can skip disclosure; platform shows optional banner"
  - "NY includes opt_out_with_credit boolean field — when checked, disables all other fields and shows $500 credit message"
  - "NC select fields include 'No Representation' as a valid option per NC disclosure law"
  - "AI assist system prompt embeds UPL disclaimer verbatim: 'This is not legal advice. Consult a licensed attorney.' per every call"
  - "DisclosureFormClient creates the DB form row lazily (on first save/complete) — avoids orphan rows if seller views but skips"

patterns-established:
  - "Seller disclosure page: Server Component fetches listing + existing form, passes to DisclosureFormClient island for interactivity"
  - "AI assist uses same DefaultChatTransport(api, body) pattern as ChatWidget from plan 02-06"

requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 03 Plan 04: Disclosure Form System Summary

**Per-state JSON disclosure form schemas for all 10 launch states with digital form filling, CRUD API, and AI streaming guidance with mandatory UPL disclaimers on every response**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T19:00:00Z
- **Completed:** 2026-03-16T19:06:43Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- LAUNCH_STATE_SCHEMAS registry with representative placeholder fields for CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL (all marked attorney-review pending)
- Disclosure form CRUD service with ownership enforcement, JSON answer storage, and draft/complete lifecycle
- Streaming AI assist service with UPL disclaimer embedded in every system prompt call
- Complete disclosure API: create, list, fetch, save-draft, complete-form, AI streaming endpoint
- DisclosureForm dynamic renderer handles text/textarea/boolean/select fields grouped by section, GA optional banner, NY $500 credit opt-out with field disabling
- AiFormAssistant streaming chat with "AI guidance only — not legal advice" banner on every AI response

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for form-schema, disclosure-form, ai-assist** - `72b9c49` (test)
2. **Task 1: Form schema registry + disclosure CRUD + AI assist service** - `e498b2b` (feat)
3. **Task 2: Disclosure API endpoints + form UI + AI assistant widget + seller page** - `a8aa2f0` (feat)

## Files Created/Modified

- `src/services/disclosures/form-schema.ts` - LAUNCH_STATE_SCHEMAS registry + getFormSchemaForState/getAvailableFormSchemas
- `src/services/disclosures/form-schema.test.ts` - 9 tests for schema registry
- `src/services/disclosures/disclosure-form.ts` - CRUD: createDisclosureForm, updateDisclosureForm, completeDisclosureForm, getDisclosureForm
- `src/services/disclosures/disclosure-form.test.ts` - 4 tests with mocked db
- `src/services/disclosures/ai-assist.ts` - createDisclosureAssistStream with UPL-enforced system prompt
- `src/services/disclosures/ai-assist.test.ts` - 5 tests verifying UPL disclaimer and prompt contents
- `src/app/api/disclosures/route.ts` - POST (create) + GET (list by listingId)
- `src/app/api/disclosures/[id]/route.ts` - GET, PATCH (save draft), POST (complete action)
- `src/app/api/disclosures/ai-assist/route.ts` - Streaming AI guidance endpoint
- `src/components/disclosures/DisclosureForm.tsx` - Dynamic form renderer from JSON schema with section grouping
- `src/components/disclosures/AiFormAssistant.tsx` - Streaming AI chat panel with UPL disclaimer banner
- `src/app/seller/disclosures/[listingId]/page.tsx` - Server Component: listing ownership check, schema/form load
- `src/app/seller/disclosures/[listingId]/DisclosureFormClient.tsx` - Client island: lazy form creation, save/complete flow
- `src/inngest/functions/match-saved-searches.ts` - Fixed pre-existing async arrow return type error (Rule 3)

## Decisions Made

- LAUNCH_STATE_SCHEMAS fields are PLACEHOLDER arrays — must be replaced after attorney review before activation
- GA schema has required=false — seller can skip; platform shows optional banner
- NY includes opt_out_with_credit boolean — when checked, disables all other fields and shows $500 credit message
- NC select fields include "No Representation" as a valid option per NC law
- AI assist embeds UPL disclaimer verbatim in every system prompt call
- DisclosureFormClient creates the DB form row lazily on first save to avoid orphan rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.clearAllMocks missing in ai-assist tests**
- **Found during:** Task 1 GREEN (running tests)
- **Issue:** vi.mock does not reset between tests by default; streamText mock accumulated calls from prior tests, causing assertions on mock.calls[0] to check stale state from first test
- **Fix:** Added beforeEach(() => vi.clearAllMocks()) to ai-assist.test.ts
- **Files modified:** src/services/disclosures/ai-assist.test.ts
- **Verification:** All 18 tests pass
- **Committed in:** e498b2b (Task 1 feat commit)

**2. [Rule 1 - Bug] Fixed DefaultChatTransport imported from wrong package**
- **Found during:** Task 2 build verification
- **Issue:** AiFormAssistant imported DefaultChatTransport from @ai-sdk/react; correct source is "ai" (as established in plan 02-06)
- **Fix:** Changed import to `import { DefaultChatTransport } from "ai"` and aligned sendMessage/inputValue pattern with ChatWidget
- **Files modified:** src/components/disclosures/AiFormAssistant.tsx
- **Verification:** Build passes with no TypeScript errors
- **Committed in:** a8aa2f0 (Task 2 feat commit)

**3. [Rule 3 - Blocking] Fixed pre-existing type error in match-saved-searches.ts**
- **Found during:** Task 2 build verification
- **Issue:** Untracked file from plan 03-03 had a TypeScript error preventing build: async arrow returning Promise<SendEventOutput> instead of Promise<void>
- **Fix:** Wrapped step.sendEvent() call in void-returning arrow body ({ await ...; })
- **Files modified:** src/inngest/functions/match-saved-searches.ts
- **Verification:** Build passes cleanly
- **Committed in:** a8aa2f0 (Task 2 feat commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for test correctness and build success. No scope creep.

## Issues Encountered

- `DefaultChatTransport` export location differs between `ai` and `@ai-sdk/react` packages — must import from `"ai"` (same pattern as ChatWidget established in plan 02-06)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All disclosure form infrastructure ready for plan 03-05 (SignWell eSignature integration)
- Disclosure forms can be linked to signature envelopes via disclosureFormId field on signatureEnvelopes table
- GA optional flow and NY $500 credit opt-out complete
- Attorney review of all 10 state form schemas required before any schema can be activated in production

---
*Phase: 03-buyer-discovery-disclosure-esignature*
*Completed: 2026-03-16*

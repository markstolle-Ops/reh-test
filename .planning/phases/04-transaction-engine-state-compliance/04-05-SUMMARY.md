---
phase: 04-transaction-engine-state-compliance
plan: 05
subsystem: ai
tags: [ai-sdk, openai, gpt-4o, rag, pgvector, react, tailwind, zod, upl-guardrails, streaming]

# Dependency graph
requires:
  - phase: 04-transaction-engine-state-compliance/04-01
    provides: "XState transaction machine, state workflow configs for all 10 launch states"
  - phase: 02-listing-creation-ai-core
    provides: "queryKnowledgeBase RAG service, pgvector knowledge_chunks table, AI SDK v6 patterns"

provides:
  - "StateRequirementsNotice Server Component — amber banner with state-specific legal requirements"
  - "getRequirementsNotice() pure utility — wraps getStateWorkflowConfig for component/test use"
  - "TRANSACTION_GUIDE_SYSTEM_PROMPT — system prompt with UPL guardrails and state context injection"
  - "streamTransactionGuide() — RAG-grounded streaming AI agent using gpt-4o"
  - "generateOfferTemplate tool — offer letter template with mandatory legal disclaimer (NEGO-03)"
  - "generateCounterTemplate tool — counteroffer letter template with mandatory legal disclaimer"
  - "POST /api/transaction-guide — authenticated streaming endpoint for transaction guidance"

affects:
  - phase-05-buyer-agent-marketplace
  - transaction-dashboard
  - buyer-flow-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure utility function exported alongside Server Component — enables node-env vitest testing"
    - "AI SDK v6 tool() with inputSchema z.object() for streaming agent tools"
    - "UPL_DISCLAIMER exported as named constant — embedded verbatim in every system prompt"
    - "State-specific context injected at runtime from getStateWorkflowConfig (not hardcoded)"
    - "buildOfferTemplate / buildCounterTemplate as pure functions — separately testable from streamText"

key-files:
  created:
    - src/components/transaction/StateRequirementsNotice.tsx
    - src/components/transaction/StateRequirementsNotice.test.ts
    - src/ai/prompts/transaction-guide.ts
    - src/ai/agents/transaction-guide.ts
    - src/ai/agents/transaction-guide.test.ts
    - src/app/api/transaction-guide/route.ts
  modified: []

key-decisions:
  - "StateRequirementsNotice test checks attorneyRequired boolean (not keyword in summary) — CA summary contains 'attorneys are not required' so text check was inaccurate"
  - "UPL_DISCLAIMER exported from transaction-guide.ts (inline) — no separate upl-disclaimer.ts module existed despite plan referencing it"
  - "buildOfferTemplate/buildCounterTemplate extracted as pure functions alongside tool execute closures — enables unit testing without mocking AI SDK"
  - "Transaction Guide uses gpt-4o (vs chatbot's gpt-4o-mini) — legal process guidance warrants higher-capability model"
  - "POST /api/transaction-guide requires auth — transaction guidance is personalized, unlike public listing chatbot"

patterns-established:
  - "Pattern: Export pure builder functions alongside streamText tool execute closures for testability"
  - "Pattern: UPL_DISCLAIMER as named export — embed in every AI system prompt touching legal/procedural content"
  - "Pattern: State config context injected via TRANSACTION_GUIDE_SYSTEM_PROMPT args (not hardcoded in prompt)"

requirements-completed: [LEGL-07, NEGO-03]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 4 Plan 05: Transaction Guide Summary

**StateRequirementsNotice amber banner component and RAG-grounded Transaction Guide AI agent with gpt-4o, pgvector knowledge base, and offer/counteroffer template tools with mandatory UPL disclaimers**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T22:10:00Z
- **Completed:** 2026-03-16T22:18:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- StateRequirementsNotice Server Component renders state-specific legal requirements banner before transaction starts (LEGL-07) — amber styling, shows attorney referral for GA/NC/NY/IL, broker required notice for NY
- Transaction Guide streaming AI agent (gpt-4o) with RAG-grounded state-law context from pgvector knowledge base
- generateOfferTemplate and generateCounterTemplate tools (NEGO-03) producing formatted letters with mandatory "template only — not a legal document" disclaimers
- 33 tests across 2 test files covering all 10 launch states, UPL disclaimer presence, schema validation, template content

## Task Commits

Each task was committed atomically:

1. **Task 1: StateRequirementsNotice component + unit test** - `4725c02` (feat)
2. **Task 2: Transaction Guide RAG agent + offer template tool** - `eae92eb` (feat)

**Plan metadata:** (docs commit below)

_Note: Task 1 is TDD (RED → GREEN)_

## Files Created/Modified
- `src/components/transaction/StateRequirementsNotice.tsx` - Server Component + getRequirementsNotice() utility
- `src/components/transaction/StateRequirementsNotice.test.ts` - 9 tests for utility function
- `src/ai/prompts/transaction-guide.ts` - System prompt builder with UPL_DISCLAIMER export and state context injection
- `src/ai/agents/transaction-guide.ts` - streamTransactionGuide(), buildOfferTemplate(), buildCounterTemplate()
- `src/ai/agents/transaction-guide.test.ts` - 24 tests for prompts, templates, and schema validation
- `src/app/api/transaction-guide/route.ts` - POST streaming route (auth required)

## Decisions Made
- StateRequirementsNotice test checks `attorneyRequired` boolean flag rather than string keyword — CA's `legalRequirementsSummary` contains "attorneys are not required" so a `.not.toContain("attorney")` assertion was inaccurate; testing the boolean is more precise
- UPL_DISCLAIMER defined inline in `transaction-guide.ts` (no separate module existed) and exported as a named constant so tests can assert exact text
- `buildOfferTemplate` and `buildCounterTemplate` extracted as pure exported functions separate from the tool's `execute` closure — enables unit testing without mocking AI SDK streamText
- Transaction Guide uses `gpt-4o` (not `gpt-4o-mini`) — legal process guidance requires higher accuracy
- POST `/api/transaction-guide` requires Clerk auth — personalized guidance vs. public chatbot

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion fixed: CA summary keyword check replaced with boolean flag check**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Plan behavior spec said "CA returns legalRequirementsSummary NOT containing 'attorney'" — but the CA config's summary reads "Attorneys are not required" which contains the word. The test intent was to verify CA does not mandate attorney review.
- **Fix:** Changed test to assert `notice.attorneyRequired === false` instead of string keyword absence
- **Files modified:** src/components/transaction/StateRequirementsNotice.test.ts
- **Verification:** 9/9 tests pass after fix
- **Committed in:** 4725c02 (Task 1 commit)

**2. [Rule 3 - Blocking] UPL disclaimer defined inline — referenced module does not exist**
- **Found during:** Task 2 (agent implementation)
- **Issue:** Plan referenced `@src/ai/prompts/upl-disclaimer.ts` in context, but file does not exist on disk
- **Fix:** Defined `UPL_DISCLAIMER` as named export directly in `transaction-guide.ts` — same pattern as existing prompts
- **Files modified:** src/ai/prompts/transaction-guide.ts
- **Verification:** Import succeeds, tests assert UPL_DISCLAIMER verbatim
- **Committed in:** eae92eb (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking)
**Impact on plan:** Both fixes essential for test correctness and implementation correctness. No scope creep.

## Issues Encountered
- `npx next build --webpack` completes TypeScript compilation and static page generation successfully, but exits with ENOENT on `pages-manifest.json` — this is a pre-existing build infrastructure issue unrelated to this plan's changes (present in prior plans). TypeScript type check passed cleanly.

## User Setup Required
None - no external service configuration required. Uses existing OPENAI_API_KEY and pgvector knowledge_chunks table from Phase 2.

## Next Phase Readiness
- StateRequirementsNotice ready to integrate into transaction start flow
- Transaction Guide API endpoint ready for front-end chat integration
- Offer/counteroffer template tools ready for buyer offer flow (Phase 5)
- All UPL guardrails in place per legal requirements

---
*Phase: 04-transaction-engine-state-compliance*
*Completed: 2026-03-16*

## Self-Check: PASSED

- Commit `4725c02` found — StateRequirementsNotice component and test
- Commit `eae92eb` found — Transaction Guide agent, prompt, test, and API route
- All 6 files committed to git
- 33/33 tests passing

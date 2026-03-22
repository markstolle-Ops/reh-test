---
phase: 04-transaction-engine-state-compliance
plan: "04"
subsystem: workflow-engine
tags: [inngest, cfpb, trid, deadlines, compliance, ai-agent, dashboard, nextjs, vitest, resend]

# Dependency graph
requires:
  - phase: 04-transaction-engine-state-compliance
    provides: XState workflow types and 10 state configs (04-01)
  - phase: 04-transaction-engine-state-compliance
    provides: transactionDeadlines table, calculateClosingDisclosureDeadline, transactionEvents schema (04-02)
provides:
  - src/inngest/functions/track-transaction-deadlines.ts (trackTransactionDeadlines Inngest fn + raw export)
  - src/inngest/functions/cfpb-disclosure-monitor.ts (cfpbDisclosureMonitor Inngest fn + raw export)
  - src/ai/agents/transaction-coordinator.ts (generateChecklist, checkDocumentCompliance, formatChecklistWithStatus)
  - src/ai/prompts/transaction-coordinator.ts (system prompt with UPL + wire fraud disclaimers)
  - src/app/buyer/transactions/[id]/page.tsx (buyer transaction dashboard)
  - src/app/seller/transactions/[id]/page.tsx (seller transaction dashboard)
affects:
  - 04-05 and beyond: transaction dashboards are the primary UI for all transaction management
  - Wire instructions slot (id="wire-instructions-slot") is pre-positioned for 04-06 to inject

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inngest raw export pattern: export raw async fn for tests, wrap with inngest.createFunction for route registration (consistent with Phase 02 pattern)"
    - "Vitest mock hoisting: vi.mock factory uses vi.fn() inline, __mockName exports used for test access (consistent with STATE.md Phase 03 decision)"
    - "TDD: RED commit (832e7b4) -> GREEN commit (cfdb820)"

key-files:
  created:
    - src/inngest/functions/track-transaction-deadlines.ts
    - src/inngest/functions/track-transaction-deadlines.test.ts
    - src/inngest/functions/cfpb-disclosure-monitor.ts
    - src/inngest/functions/cfpb-disclosure-monitor.test.ts
    - src/ai/agents/transaction-coordinator.ts
    - src/ai/prompts/transaction-coordinator.ts
    - src/app/buyer/transactions/[id]/page.tsx
    - src/app/seller/transactions/[id]/page.tsx
  modified:
    - src/app/api/inngest/route.ts (registered trackTransactionDeadlines + cfpbDisclosureMonitor)

key-decisions:
  - "Vitest mock hoisting: vi.mock factory uses vi.fn() inline + __mockName exports — outer variable references throw ReferenceError when hoisted (same pattern as Phase 03 decision)"
  - "cfpbDisclosureMonitorRaw accepts today param for testability — avoids Date.now() in tested code"
  - "Wire instructions slot (id=wire-instructions-slot) pre-positioned in buyer dashboard — Plan 04-06 injects content without touching page structure"
  - "Seller offer accept/counter/reject buttons are disabled placeholders — server-side action wiring deferred to later task per plan comment"
  - "checkDocumentCompliance heuristic: checks for document_received:{doc}, {doc}_signed, {doc}_received, {doc}_completed event types — not a definitive legal check"

patterns-established:
  - "Inngest raw/wrapped split: trackTransactionDeadlinesRaw and cfpbDisclosureMonitorRaw are exported standalone for unit tests; Inngest fn wraps them"
  - "Transaction dashboard reads currentStatus from DB cache (no XState replay per-request) — consistent with 04-02 pattern"
  - "UPL disclaimer embedded in every system prompt and page footer — MANDATORY per Phase 01 attorney review gate"

requirements-completed: [TXCO-01, TXCO-03, TXCO-04, TXCO-05]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 4 Plan 04: AI Transaction Coordinator, Deadline Tracker, CFPB Monitor, and Dashboard UI Summary

**Inngest deadline tracker (48h/24h/0h reminder emails), CFPB 3-day closing disclosure monitor (mortgage-only TRID enforcement), AI coordinator agent (checklist generation + document compliance), and buyer/seller transaction dashboards with state-specific checklist, deadline timeline, and event history**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-16T15:04:00Z
- **Completed:** 2026-03-16T15:09:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Built `trackTransactionDeadlines` Inngest function: inserts deadline rows from state config steps; schedules 48h/24h/0h reminder emails via Resend with wire fraud warning
- Built `cfpbDisclosureMonitor` Inngest function: queries for `closing_disclosure_sent` event; alerts both parties when missing and past mustSendBy deadline; skips cash transactions (TRID non-applicable)
- Built AI coordinator agent: `generateChecklist` maps config steps to user-facing list; `checkDocumentCompliance` compares required docs against event log; `formatChecklistWithStatus` merges both for rendering
- Created system prompt for transaction coordinator with UPL disclaimer, wire fraud instructions, and CFPB TRID explanation
- Created buyer/seller Server Component dashboards: auth guard, role-based access (403 for wrong party), status badge, deadline timeline partitioned by overdue/upcoming/complete, state checklist with doc compliance, event history timeline, pre-positioned wire instructions slot

## Task Commits

| # | Task | Commit | Type |
|---|------|--------|------|
| 1 (RED) | Failing tests for deadline tracker + CFPB monitor | 832e7b4 | test |
| 1 (GREEN) | Deadline tracker, CFPB monitor, AI coordinator, prompts, inngest route | cfdb820 | feat |
| 2 | Buyer and seller transaction dashboard pages | 3ad8534 | feat |

## Files Created/Modified

- `src/inngest/functions/track-transaction-deadlines.ts` — Inserts deadline rows from config; 48h/24h/0h reminders via Resend; wire fraud disclaimer in every email
- `src/inngest/functions/track-transaction-deadlines.test.ts` — 6 tests: row count, skip no-deadline steps, dueAt calculation, deadlineType fallback, transactionId propagation
- `src/inngest/functions/cfpb-disclosure-monitor.ts` — CFPB TRID monitor; cash skip; mustSendBy via calculateClosingDisclosureDeadline; alert when overdue
- `src/inngest/functions/cfpb-disclosure-monitor.test.ts` — 5 tests: cash skip, disclosure present, disclosure overdue, within deadline, non-cash loan types
- `src/ai/agents/transaction-coordinator.ts` — generateChecklist, checkDocumentCompliance, formatChecklistWithStatus
- `src/ai/prompts/transaction-coordinator.ts` — System prompt with UPL disclaimer; formatDeadlineSummary, formatDocumentSummary helpers
- `src/app/buyer/transactions/[id]/page.tsx` — Buyer dashboard: auth, 403, summary, deadline timeline, checklist, missing docs, wire slot, event history
- `src/app/seller/transactions/[id]/page.tsx` — Seller dashboard: same + pending offer section with disabled accept/counter/reject buttons, counter price display
- `src/app/api/inngest/route.ts` — Added trackTransactionDeadlines and cfpbDisclosureMonitor to serve() array

## Decisions Made

- **Vitest mock hoisting fix:** The initial test used outer `const mockInsertValues = vi.fn()` inside `vi.mock`, throwing `ReferenceError: Cannot access 'mockInsertValues' before initialization`. Fixed by using `vi.fn()` inline in the factory and exporting `__insertMock`/`__valuesMock` for test access (per STATE.md Phase 03 decision pattern).
- **`today` param injected into `cfpbDisclosureMonitorRaw`:** Avoids `new Date()` in tested function body — deterministic tests without time manipulation.
- **Wire instructions slot pre-positioned:** `id="wire-instructions-slot"` div in buyer page allows Plan 04-06 to inject content via DOM query or React state without touching page layout.
- **Seller offer buttons disabled:** Accept/Counter/Reject buttons rendered but `disabled` — actual action wiring deferred to a later plan. Plan specifies these buttons "for active offers."
- **Document compliance is heuristic:** `checkDocumentCompliance` checks event types matching `document_received:{doc}`, `{doc}_signed`, `{doc}_received`, `{doc}_completed` — sufficient for dashboard display; definitive legal document verification requires attorney/title review.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vitest mock hoisting: outer variable references throw ReferenceError**
- **Found during:** Task 1 (RED phase test run)
- **Issue:** `vi.mock` factory references outer `const mockInsert = vi.fn()` — Vitest hoists the factory call before variable initialization, causing ReferenceError
- **Fix:** Rewrote mock factory to use `vi.fn()` inline; exported `__insertMock`/`__valuesMock` from mock module for test-side access via `import "@/db"`
- **Files modified:** `src/inngest/functions/track-transaction-deadlines.test.ts`
- **Verification:** All 6 tests pass after fix
- **Committed in:** cfdb820 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug — Vitest hoisting)
**Impact on plan:** Required for tests to run. No scope creep. Pre-existing Vitest hoisting behavior documented in STATE.md Phase 03 decisions.

## Issues Encountered

- Vitest mock hoisting prevented first test run — resolved with inline vi.fn() pattern. See Deviations above.

## User Setup Required

None — no new external services. Resend is already configured. DB schema from 04-02 unchanged.

## Next Phase Readiness

- Inngest deadline and CFPB functions are ready to receive events from XState transitions (04-03)
- Transaction dashboards are live at /buyer/transactions/[id] and /seller/transactions/[id]
- Wire instructions slot pre-positioned for 04-06
- All TXCO-01/03/04/05 requirements satisfied

---
*Phase: 04-transaction-engine-state-compliance*
*Completed: 2026-03-16*

## Self-Check: PASSED

**Files verified:**
- FOUND: src/inngest/functions/track-transaction-deadlines.ts
- FOUND: src/inngest/functions/track-transaction-deadlines.test.ts
- FOUND: src/inngest/functions/cfpb-disclosure-monitor.ts
- FOUND: src/inngest/functions/cfpb-disclosure-monitor.test.ts
- FOUND: src/ai/agents/transaction-coordinator.ts
- FOUND: src/ai/prompts/transaction-coordinator.ts
- FOUND: src/app/buyer/transactions/[id]/page.tsx
- FOUND: src/app/seller/transactions/[id]/page.tsx

**Commits verified:**
- FOUND: 832e7b4 test(04-04): add failing tests for deadline tracker and CFPB monitor
- FOUND: cfdb820 feat(04-04): deadline tracker, CFPB monitor, AI coordinator agent + prompts
- FOUND: 3ad8534 feat(04-04): buyer and seller transaction dashboard pages

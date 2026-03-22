---
phase: 04-transaction-engine-state-compliance
plan: 02
subsystem: database
tags: [drizzle, postgres, event-sourcing, date-fns, next-api, clerk]

# Dependency graph
requires:
  - phase: 04-transaction-engine-state-compliance
    provides: XState workflow types and state machine (04-01)
  - phase: 02-listing-creation-ai-core
    provides: listings table with userId and state fields
provides:
  - transactions, transactionEvents, transactionDeadlines Drizzle tables + relations
  - appendTransactionEvent service (append-only event log)
  - createTransaction service (inserts row + first event)
  - deriveTransactionState audit replay function
  - calculateClosingDisclosureDeadline with CFPB 3-day business-day math
  - POST /api/transactions, GET /api/transactions, GET /api/transactions/[id], POST /api/transactions/[id]/events API routes
affects:
  - 04-03 and beyond: XState machine state transitions write events via appendTransactionEvent
  - Any phase that reads transaction status or displays timeline

# Tech tracking
tech-stack:
  added:
    - date-fns (business-day arithmetic for CFPB deadline math)
  patterns:
    - Event-sourced append-only transaction log (transactionEvents rows never updated/deleted)
    - Cached status on transactions.currentStatus for fast reads; deriveTransactionState for audit replay
    - API routes follow existing Clerk auth() pattern with userId check then 401

key-files:
  created:
    - src/db/schema.ts (transactions, transactionEvents, transactionDeadlines tables + relations)
    - src/services/transaction/events.ts (appendTransactionEvent, TransactionEventType)
    - src/services/transaction/create.ts (createTransaction)
    - src/services/transaction/state.ts (deriveTransactionState)
    - src/services/transaction/deadlines.ts (calculateClosingDisclosureDeadline, calculateTransactionDeadlines)
    - src/services/transaction/deadlines.test.ts
    - src/services/transaction/events.test.ts
    - src/app/api/transactions/route.ts
    - src/app/api/transactions/[id]/route.ts
    - src/app/api/transactions/[id]/events/route.ts
  modified:
    - src/db/schema.ts (added transactionStatusEnum, 3 tables, relations)
    - package.json (added date-fns)

key-decisions:
  - "date-fns addBusinessDays with negative value used for CFPB 3-day/6-day deadline math (mustReceiveBy = closing - 3 bdays, mustSendBy = closing - 6 bdays)"
  - "transactionEvents rows are append-only — no UPDATE or DELETE ever issued on that table"
  - "transactions.currentStatus is a write-through cache updated on state transitions; deriveTransactionState replays events for audit"
  - "POST /api/transactions/[id]/events validates eventType against a hard-coded Set at runtime to prevent invalid event injection"
  - "GET /api/transactions/[id] returns 403 (not 404) when user is authenticated but not a party to the transaction"

patterns-established:
  - "Append-only event log pattern: insert into transactionEvents, optionally update cached status on parent row"
  - "Business-day math: use date-fns addBusinessDays with negative offset for backwards counting"
  - "Event type runtime validation: hard-coded Set<TransactionEventType> in API route"

requirements-completed: [TXCO-02]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 4 Plan 02: Transaction Data Model + API Routes Summary

**Event-sourced offer-to-close transaction model with 3 Drizzle tables, CFPB deadline calculator using date-fns business-day math, and 4 Clerk-auth API routes**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-16T14:58:00Z
- **Completed:** 2026-03-16T15:00:30Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added 3 new DB tables (transactions, transactionEvents, transactionDeadlines) with Drizzle relations to listings
- Built event-sourced service layer: appendTransactionEvent enforces append-only log, createTransaction inserts row + first event, deriveTransactionState replays events for audit
- Implemented calculateClosingDisclosureDeadline using date-fns business-day subtraction — handles weekends correctly per CFPB 3-day rule
- Deployed 4 API routes (POST create, GET list, GET detail with events, POST append event) following existing Clerk auth patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Transaction schema + event-sourced service layer** - `26086ae` (feat) — TDD: 12 tests passing
2. **Task 2: Transaction API routes** - `c370689` (feat) — build verified, all 4 routes present

## Files Created/Modified

- `src/db/schema.ts` - Added transactionStatusEnum, transactions, transactionEvents, transactionDeadlines tables + relations
- `src/services/transaction/events.ts` - appendTransactionEvent (append-only), TransactionEventType union
- `src/services/transaction/create.ts` - createTransaction (inserts row + offer_submitted event)
- `src/services/transaction/state.ts` - deriveTransactionState audit replay
- `src/services/transaction/deadlines.ts` - calculateClosingDisclosureDeadline + calculateTransactionDeadlines
- `src/services/transaction/deadlines.test.ts` - 7 pure-function deadline tests
- `src/services/transaction/events.test.ts` - 5 mocked-DB event tests
- `src/app/api/transactions/route.ts` - POST (create) + GET (list for user)
- `src/app/api/transactions/[id]/route.ts` - GET with 403 authorization check
- `src/app/api/transactions/[id]/events/route.ts` - POST with eventType validation

## Decisions Made

- date-fns `addBusinessDays` with negative offset used for backwards CFPB deadline counting — handles Mon–Fri skip automatically
- transactionEvents is strictly append-only: no UPDATE/DELETE path exists in code or tests
- transactions.currentStatus is a denormalized write-through cache; deriveTransactionState replays the event log for audit or snapshot reconstruction
- POST /api/transactions/[id]/events validates eventType against a hard-coded Set at runtime — prevents injecting unknown event types
- GET /api/transactions/[id] returns 403 (not 404) when authenticated user is not a party — leaks less information about transaction existence to outsiders

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing date-fns dependency**
- **Found during:** Task 1 (deadline calculator)
- **Issue:** Plan specified `npm install date-fns`; package was not in project dependencies
- **Fix:** Ran `npm install date-fns`
- **Files modified:** package.json, package-lock.json
- **Verification:** Import succeeds in deadlines.ts, all tests pass
- **Committed in:** 26086ae (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing dependency)
**Impact on plan:** Required for correct date arithmetic. No scope creep.

## Issues Encountered

None - plan executed as written once date-fns was installed.

## User Setup Required

None - no external service configuration required. DB migration for 3 new tables must be applied before production use.

## Next Phase Readiness

- Transaction service layer is ready for XState machine integration (04-03)
- appendTransactionEvent is the write path for state transitions
- API routes are available for UI wiring
- DB migration for transactions/transactionEvents/transactionDeadlines tables must be generated and applied (Drizzle migrate)

---
*Phase: 04-transaction-engine-state-compliance*
*Completed: 2026-03-16*

## Self-Check: PASSED

- All 9 service/test files confirmed present in `src/services/transaction/`
- All 3 API route files confirmed present in `src/app/api/transactions/`
- Task commits `26086ae` and `c370689` confirmed in git log
- Metadata commit `8b8e97b` confirmed

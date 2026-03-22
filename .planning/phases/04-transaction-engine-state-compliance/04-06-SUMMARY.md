---
phase: 04-transaction-engine-state-compliance
plan: "06"
subsystem: api
tags: [wire-fraud, mfa, clerk, drizzle, postgres, security, audit-trail, real-estate]

requires:
  - phase: 04-02
    provides: transactionEvents append-only event log and appendTransactionEvent service
  - phase: 04-04
    provides: buyer transaction dashboard page with wire-instructions-slot placeholder

provides:
  - wireInstructions DB table (per-transaction, unique transactionId FK)
  - setWireInstructions upsert service
  - getWireInstructions service with authorization check and audit logging
  - wire_instructions_viewed TransactionEventType
  - GET /api/wire-instructions/[transactionId] — auth + MFA required, masked by default
  - /buyer/transactions/[id]/wire-instructions page — Server Component, MFA gate, fraud warning
  - WireInstructionsReveal client component for reveal toggle

affects:
  - 05-payments-closing
  - any phase that handles closing workflow or title company integrations

tech-stack:
  added: []
  patterns:
    - MFA gate via Clerk clerkClient().users.getUser(userId) + user.twoFactorEnabled check
    - Masked sensitive numbers (last 4 visible) with reveal-on-demand client component
    - Audit log on every wire instruction access via appendTransactionEvent
    - Upsert pattern using .onConflictDoUpdate() for single-record-per-transaction tables

key-files:
  created:
    - src/db/schema.ts (wireInstructions table + wireInstructionsRelations)
    - src/services/transaction/wire-instructions.ts
    - src/services/transaction/wire-instructions.test.ts
    - src/app/api/wire-instructions/[transactionId]/route.ts
    - src/app/buyer/transactions/[id]/wire-instructions/page.tsx
    - src/app/buyer/transactions/[id]/wire-instructions/WireInstructionsReveal.tsx
  modified:
    - src/services/transaction/events.ts (added wire_instructions_viewed to TransactionEventType)
    - src/app/buyer/transactions/[id]/page.tsx (replaced dashed placeholder with conditional link)

key-decisions:
  - "Plaintext storage for wire instructions in MVP — column-level encryption via Supabase Vault (pgsodium) deferred to pre-production hardening; TODO comment added to schema and service"
  - "MFA gate uses user.twoFactorEnabled from Clerk (not step-up auth) — sufficient for MVP; step-up auth requires Clerk enterprise plan"
  - "Reveal UX re-fetches from API (second audit log entry) rather than passing full numbers to client at page load — minimizes exposure window"
  - "Wire instructions link on dashboard only visible at pending_closing or closed_won status — not before closing is scheduled"

patterns-established:
  - "MFA gate pattern: clerkClient().users.getUser(userId).twoFactorEnabled — reuse for any high-security route"
  - "Sensitive number masking: maskNumber() returns ***...last4; used in both server render and API response"

requirements-completed: []

duration: 8min
completed: 2026-03-16
---

# Phase 4 Plan 6: Wire Fraud Security Layer Summary

**MFA-gated in-app wire instruction display with fraud warning banner, masked routing/account numbers, and append-only audit trail logged on every access**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T21:10:08Z
- **Completed:** 2026-03-16T21:17:48Z
- **Tasks:** 2 (TDD task + feature task)
- **Files modified:** 8

## Accomplishments

- Wire instructions stored in DB per-transaction (unique constraint, upsert-safe) with plaintext MVP and encryption upgrade path documented
- Every getWireInstructions call logs `wire_instructions_viewed` to the append-only transaction event log for full audit trail
- MFA gate blocks all wire instruction access unless Clerk user.twoFactorEnabled is true — shows 2FA setup prompt with direct link to Clerk security settings
- Prominent red fraud warning banner always displayed above wire details — references wire fraud attack vector explicitly
- Routing/account numbers masked by default (last 4 visible); WireInstructionsReveal client component fetches full numbers on-demand (second audit event)
- Buyer transaction dashboard conditionally shows "View Wire Instructions" link only at pending_closing/closed_won status

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire instructions schema + service layer (RED)** - `3094e3a` (test)
2. **Task 1: Wire instructions schema + service layer (GREEN)** - `2f01a41` (feat)
3. **Task 2: MFA-gated wire instructions page + API route** - `6c4647d` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD task has two commits: test (RED) then feat (GREEN)_

## Files Created/Modified

- `src/db/schema.ts` — Added wireInstructions table and wireInstructionsRelations
- `src/services/transaction/wire-instructions.ts` — setWireInstructions (upsert) + getWireInstructions (auth check + audit log)
- `src/services/transaction/wire-instructions.test.ts` — 9 TDD tests covering storage, retrieval, authorization, null cases, and audit event logging
- `src/services/transaction/events.ts` — Added wire_instructions_viewed to TransactionEventType union
- `src/app/api/wire-instructions/[transactionId]/route.ts` — GET endpoint: auth + MFA gate + masked response + ?reveal=true support
- `src/app/buyer/transactions/[id]/wire-instructions/page.tsx` — Server Component with MFA gate, fraud warning banner, and wire details
- `src/app/buyer/transactions/[id]/wire-instructions/WireInstructionsReveal.tsx` — Client Component for reveal-on-demand UX
- `src/app/buyer/transactions/[id]/page.tsx` — Replaced dashed placeholder with conditional "View Wire Instructions" link

## Decisions Made

- **Plaintext storage for MVP:** Wire instruction data stored unencrypted in DB for MVP. Column-level encryption via Supabase Vault (pgsodium) added as TODO comment in both schema.ts and wire-instructions.ts — must be done before production.
- **MFA via twoFactorEnabled (not step-up):** Clerk's step-up authentication requires an enterprise plan. Using user.twoFactorEnabled as the gate is sufficient for MVP — user must have 2FA enrolled, but we don't force re-verification on each page load.
- **Reveal fetches from API:** Full account/routing numbers are fetched client-side on "Reveal" click (not embedded in initial server render). This creates a second audit log entry and minimizes the window where sensitive numbers are in the DOM.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Missing type] Added wire_instructions_viewed to TransactionEventType**
- **Found during:** Task 1 (service implementation)
- **Issue:** appendTransactionEvent is typed against TransactionEventType union — wire_instructions_viewed was not in it, causing a TypeScript error
- **Fix:** Added wire_instructions_viewed to the union in events.ts
- **Files modified:** src/services/transaction/events.ts
- **Verification:** Tests pass, build passes
- **Committed in:** 2f01a41 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type completeness)
**Impact on plan:** Necessary for TypeScript correctness. Zero scope creep.

## Issues Encountered

None — build passed on first attempt after all files were written.

## User Setup Required

None - no external service configuration required. Wire instructions are stored in the existing Supabase database (wireInstructions table via Drizzle migration).

Note: The `wire_instructions` table requires a DB migration to be run before this feature is active in production.

## Next Phase Readiness

- Wire fraud security layer is complete — ready for Phase 5 closing/payments integration
- setWireInstructions can be called by title company integration (Phase 5) or admin tooling
- Audit trail infrastructure in place — every wire instruction view is logged
- Pre-production requirement: implement Supabase Vault encryption on routingNumber/accountNumber columns

---
*Phase: 04-transaction-engine-state-compliance*
*Completed: 2026-03-16*

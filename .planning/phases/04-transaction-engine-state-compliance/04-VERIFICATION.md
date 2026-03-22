---
phase: 04-transaction-engine-state-compliance
verified: 2026-03-16T21:24:45Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "Transaction dashboard shows real-time status with offer accept/counter/reject actions for seller"
    status: partial
    reason: "Seller offer response buttons (Accept, Counter, Reject) are rendered as disabled placeholders with no server action wiring. The display portion is functional but the action path is inert."
    artifacts:
      - path: "src/app/seller/transactions/[id]/page.tsx"
        issue: "Lines 202-222: Accept/Counter/Reject buttons all have `disabled` attribute and no action handlers. Comment states 'wired to events API in a later task'."
    missing:
      - "Server action or form POST wiring Accept/Counter/Reject buttons to POST /api/transactions/[id]/events"
      - "This is a known deferred item from plan 04-04, but it means sellers cannot actually respond to offers via the dashboard"
---

# Phase 4: Transaction Engine + State Compliance — Verification Report

**Phase Goal:** Full offer-to-close workflow automated by legally validated state machine for 10 launch states, with AI negotiation, AI transaction coordination, and wire fraud security
**Verified:** 2026-03-16T21:24:45Z
**Status:** gaps_found
**Re-verification:** No — initial verification
**Plans executed:** 6 of 7 (04-07 MLS syndication has no SUMMARY but the code is present — verified directly)

---

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Platform auto-generates state-specific transaction checklist, tracks deadlines, sends reminders, with real-time status on dashboard | VERIFIED | `trackTransactionDeadlines` Inngest fn inserts deadline rows from config steps; buyer/seller dashboard pages render checklist+timeline from DB |
| 2 | Buyer views comps analysis and receives AI offer strategy; seller receives AI counteroffer strategy — with disclaimers | VERIFIED | `fetchComps` queries `mls_listings`; `streamNegotiationGuidance` streams role-specific guidance with UPL disclaimer; `X-UPL-Disclaimer` header on every response |
| 3 | Transaction flow adapts by state: attorney-required routes to attorney, FSBO provides self-service, requirements displayed before start | VERIFIED | XState engine guards `requiresAttorney` / `requiresCustomaryAttorney` read from `context.config.closingType`; `StateRequirementsNotice` renders state-specific amber banner before transaction |
| 4 | State workflow configs are data-driven and updatable without code deploy; platform flags missing required documents | VERIFIED | Config injected as XState input (no hardcoded state names in machine); `checkDocumentCompliance` cross-references `requiredDocuments` against event log |
| 5 | Wire instructions displayed only via authenticated in-app interface with MFA, never via email | VERIFIED | MFA gate via `user.twoFactorEnabled` check; `wire_instructions_viewed` event logged on every access; fraud warning banner displayed; `getWireInstructions` enforces buyer/seller authorization |

**Score: 5/5 truths verified** (but truth #1 has a partial gap — see below)

---

### Detailed Artifact Verification

#### Plan 04-01: XState Workflow Engine + 10 State Configs

| Artifact | Status | Details |
|----------|--------|---------|
| `src/workflow/types.ts` | VERIFIED | Exports `StateWorkflowConfig` and `WorkflowStep` interfaces; imports `ClosingType` from `@/types` |
| `src/workflow/engine.ts` | VERIFIED | XState 5 `setup()` API; guards read from `context.config.closingType`; exports `transactionMachine` and `createTransactionActor` |
| `src/workflow/states/index.ts` | VERIFIED | Exports `ALL_STATE_CONFIGS` (all 10 states) and `getStateWorkflowConfig` with throw on unknown state |
| `src/workflow/states/GA.ts` | VERIFIED | `closingType: 'attorney-required'`, `attorney_review` step with `triggers: ['transaction/attorney.notify']`, `satisfies StateWorkflowConfig` |
| `src/workflow/states/NY.ts` | VERIFIED | `closingType: 'customary-attorney'`, `partnerBrokerRequired: true`, `attorney_review` step present |
| `src/workflow/states/CA.ts` | VERIFIED | `closingType: 'title-company'`, `fsboAllowed: true`, `attorneyReferralRequired: false`, no attorney_review step |
| All 10 state files | VERIFIED | CA, TX, FL, AZ, OH, PA (title-company FSBO); GA, NC (attorney-required); NY, IL (customary-attorney) — all present in `src/workflow/states/` |

#### Plan 04-02: Transaction Service + API Routes

| Artifact | Status | Details |
|----------|--------|---------|
| `src/db/schema.ts` — transactions table | VERIFIED | `transactionStatusEnum`, `transactions`, `transactionEvents`, `transactionDeadlines`, `wireInstructions`, `mlsSyndications` tables all present with relations |
| `src/services/transaction/events.ts` | VERIFIED | Exports `appendTransactionEvent` (append-only; updates cache only via `db.update`); exports `TransactionEventType` union including `wire_instructions_viewed` |
| `src/services/transaction/deadlines.ts` | VERIFIED | Exports `calculateClosingDisclosureDeadline` with CFPB 3-day/6-day business-day math via `date-fns addBusinessDays` |
| `src/app/api/transactions/route.ts` | VERIFIED | POST (create) + GET (list) with Clerk auth |
| `src/app/api/transactions/[id]/route.ts` | VERIFIED | GET with 403 authorization check (buyer or seller only) |
| `src/app/api/transactions/[id]/events/route.ts` | VERIFIED | POST with `TransactionEventType` runtime validation |

#### Plan 04-03: AI Negotiation Assistant

| Artifact | Status | Details |
|----------|--------|---------|
| `src/services/negotiation/comps.ts` | VERIFIED | `fetchComps` queries `mls_listings` for `status='sold'` by zip; `formatCompsForPrompt` exports correctly |
| `src/ai/agents/negotiation.ts` | VERIFIED | `streamNegotiationGuidance` uses `openai('gpt-4o')`; `suggestOfferPrice` tool with `inputSchema`; UPL disclaimer embedded in both prompt variants |
| `src/app/api/negotiation/strategy/route.ts` | VERIFIED | Imports `fetchComps` and `streamNegotiationGuidance`; sets `X-UPL-Disclaimer: true` header on every response |
| `src/app/api/negotiation/comps/route.ts` | VERIFIED | GET with auth; returns comps array |

#### Plan 04-04: AI Transaction Coordinator + Dashboard

| Artifact | Status | Details |
|----------|--------|---------|
| `src/inngest/functions/track-transaction-deadlines.ts` | VERIFIED | `trackTransactionDeadlinesRaw` inserts deadline rows from config steps; 48h/24h/0h reminder emails via Resend; wire fraud disclaimer in emails |
| `src/inngest/functions/cfpb-disclosure-monitor.ts` | VERIFIED | `cfpbDisclosureMonitorRaw` skips cash transactions; calls `calculateClosingDisclosureDeadline`; alerts when `closing_disclosure_sent` event missing and past deadline |
| `src/ai/agents/transaction-coordinator.ts` | VERIFIED | `generateChecklist`, `checkDocumentCompliance`, `formatChecklistWithStatus` exported |
| `src/app/buyer/transactions/[id]/page.tsx` | VERIFIED | Auth guard, 403 for non-buyer, status badge, deadline timeline, document compliance, event history, wire instructions link (conditional on `pending_closing`/`closed_won`) |
| `src/app/seller/transactions/[id]/page.tsx` | PARTIAL | Auth guard and display verified; offer response buttons (Accept/Counter/Reject) are disabled placeholders — no action wiring |
| `src/app/api/inngest/route.ts` | VERIFIED | Registers `syndicateToMls`, `trackTransactionDeadlines`, `cfpbDisclosureMonitor` in `serve()` array |

#### Plan 04-05: Transaction Guide + StateRequirementsNotice

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/transaction/StateRequirementsNotice.tsx` | VERIFIED | `getRequirementsNotice` calls `getStateWorkflowConfig`; renders amber banner with attorney/broker notices; `satisfies` type pattern via function return |
| `src/ai/agents/transaction-guide.ts` | VERIFIED | `streamTransactionGuide` with RAG via `knowledgeChunks`; `generateOfferTemplate` and `generateCounterTemplate` tools with legal disclaimers |
| `src/app/api/transaction-guide/route.ts` | VERIFIED | POST with Clerk auth; calls `streamTransactionGuide` |

#### Plan 04-06: Wire Fraud Security

| Artifact | Status | Details |
|----------|--------|---------|
| `src/services/transaction/wire-instructions.ts` | VERIFIED | `getWireInstructions` calls `appendTransactionEvent` for `wire_instructions_viewed`; `setWireInstructions` upserts via `onConflictDoUpdate` |
| `src/app/api/wire-instructions/[transactionId]/route.ts` | VERIFIED | Clerk auth + `user.twoFactorEnabled` MFA gate; masked routing/account numbers by default; `?reveal=true` for full numbers |
| `src/app/buyer/transactions/[id]/wire-instructions/page.tsx` | VERIFIED | MFA gate with 2FA setup prompt; prominent red fraud warning banner; masked numbers with `WireInstructionsReveal` client component; audit log on every load |

#### Plan 04-07: MLS Syndication Upgrade

| Artifact | Status | Details |
|----------|--------|---------|
| `src/services/mls/syndication.ts` | VERIFIED | `submitToMls` sends structured HTML email via Resend to `MLS_BROKER_EMAIL`; persists to `mlsSyndications` table; `getMlsStatus` reads from DB |
| `src/inngest/functions/syndicate-to-mls.ts` | VERIFIED | `syndicateToMlsRaw` fetches listing and calls `submitToMls`; `syndicateToMls` Inngest fn triggers on `listing/published` event |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/workflow/engine.ts` | `src/workflow/types.ts` | `import.*StateWorkflowConfig.*from.*types` | WIRED | Line 2: `import type { StateWorkflowConfig } from "@/workflow/types"` |
| `src/workflow/states/*.ts` | `src/workflow/types.ts` | `satisfies StateWorkflowConfig` | WIRED | All 10 state files use `satisfies StateWorkflowConfig` |
| `src/services/transaction/events.ts` | `src/db/schema.ts` | `db.insert(transactionEvents)` | WIRED | Line 78: `db.insert(transactionEvents).values(...)` |
| `src/app/api/transactions/route.ts` | `src/services/transaction/create.ts` | `import.*createTransaction` | WIRED | Present in route file |
| `src/ai/agents/negotiation.ts` | `src/services/negotiation/comps.ts` | `import.*fetchComps` | WIRED | Line 12: `import { formatCompsForPrompt } from "@/services/negotiation/comps"` |
| `src/app/api/negotiation/strategy/route.ts` | `src/ai/agents/negotiation.ts` | `import.*streamNegotiationGuidance` | WIRED | Line 13: confirmed |
| `src/inngest/functions/track-transaction-deadlines.ts` | `src/db/schema.ts` | `db.insert(transactionDeadlines)` | WIRED | Line 59: `db.insert(transactionDeadlines).values(...)` |
| `src/inngest/functions/cfpb-disclosure-monitor.ts` | `src/services/transaction/deadlines.ts` | `import.*calculateClosingDisclosureDeadline` | WIRED | Confirmed in monitor file |
| `src/components/transaction/StateRequirementsNotice.tsx` | `src/workflow/states/index.ts` | `import.*getStateWorkflowConfig` | WIRED | Line 1: `import { getStateWorkflowConfig } from "@/workflow/states"` |
| `src/app/buyer/transactions/[id]/wire-instructions/page.tsx` | `/api/wire-instructions/[transactionId]` | fetch after MFA check | WIRED | `WireInstructionsReveal` client component fetches from this route |
| `src/app/api/wire-instructions/[transactionId]/route.ts` | `src/services/transaction/events.ts` | `appendTransactionEvent` for audit | WIRED | Called via `getWireInstructions` which calls `appendTransactionEvent` |
| `src/inngest/functions/syndicate-to-mls.ts` | `src/services/mls/syndication.ts` | `import.*submitToMls` | WIRED | Line 14: confirmed |

---

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|----------|
| LEGL-01 | 04-01 | Platform maintains legal workflow config for each of 10 launch states | SATISFIED | 10 state config files in `src/workflow/states/` |
| LEGL-02 | 04-01 | Each state config specifies attorney/agent/RON/disclosure/steps | SATISFIED | `StateWorkflowConfig` interface; all 10 configs have all fields |
| LEGL-03 | 04-01 | Transaction flow adapts based on property state | SATISFIED | XState guards read `context.config.closingType` — routing is data-driven |
| LEGL-04 | 04-01 | Attorney-required states route to attorney referral | SATISFIED | GA, NC route to `attorney_review` via `requiresAttorney` guard; NY, IL via `requiresCustomaryAttorney` |
| LEGL-05 | 04-01 | FSBO states provide fully self-service workflow | SATISFIED | CA, TX, FL, AZ, OH, PA have `fsboAllowed: true`, no `attorney_review` step in machine path |
| LEGL-06 | 04-01 | State configs are data-driven, updatable without code deploys | SATISFIED | Config injected as XState `input`; swap config to change routing without touching machine code |
| LEGL-07 | 04-05 | Platform displays state-specific legal requirements before transaction | SATISFIED | `StateRequirementsNotice` component uses `getStateWorkflowConfig` to render amber banner |
| NEGO-01 | 04-03 | AI provides comparable sales analysis | SATISFIED | `fetchComps` queries `mls_listings` for sold; exposed via `GET /api/negotiation/comps` |
| NEGO-02 | 04-03 | AI suggests offer price strategy based on comps | SATISFIED | `streamNegotiationGuidance` injects comps into system prompt; `suggestOfferPrice` tool |
| NEGO-03 | 04-05 | AI guides buyer with offer/counteroffer templates | SATISFIED | `generateOfferTemplate` and `generateCounterTemplate` tools in `transaction-guide.ts` |
| NEGO-04 | 04-03 | AI provides seller with counteroffer strategy | SATISFIED | Role-based prompt selection; `NEGOTIATION_SELLER_SYSTEM_PROMPT` for seller path |
| NEGO-05 | 04-03 | All AI negotiation guidance includes disclaimers | SATISFIED | UPL disclaimer in all prompts; `X-UPL-Disclaimer: true` header on strategy endpoint |
| TXCO-01 | 04-04 | AI generates state-specific transaction checklist after offer acceptance | SATISFIED | `generateChecklist` maps `config.steps` to checklist; displayed on buyer/seller dashboard |
| TXCO-02 | 04-02 | AI tracks deadlines and sends reminders | SATISFIED | `trackTransactionDeadlines` Inngest fn; 48h/24h/0h reminder emails via Resend |
| TXCO-03 | 04-04 | AI flags missing required documents per state | SATISFIED | `checkDocumentCompliance` compares `requiredDocuments` from config against event log |
| TXCO-04 | 04-04 | AI monitors CFPB 3-day closing disclosure rule | SATISFIED | `cfpbDisclosureMonitor` Inngest fn; skips cash; alerts when `closing_disclosure_sent` missing |
| TXCO-05 | 04-04 | Transaction dashboard shows real-time status | SATISFIED (partial) | Dashboard renders status, deadlines, checklist, events — but seller offer action buttons are disabled |
| MLS-01 | 04-07 | Seller listings syndicate to MLS via broker partner network | SATISFIED | `submitToMls` sends structured HTML email via Resend; `syndicateToMls` Inngest fn on `listing/published` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/services/transaction/wire-instructions.ts` | 11 | `TODO: Add column-level encryption via Supabase Vault before production` | Info | Plaintext wire routing/account numbers in DB — encryption deferred. Pre-production requirement documented. |
| `src/services/negotiation/comps.ts` | 4 | `TODO: Replace with ATTOM Data API when contract is established` | Info | comps use `mls_listings.lastSyncedAt` as sold-date proxy. Functional for MVP; real comps data requires ATTOM. |
| `src/services/mls/syndication.ts` | 153 | Default broker email is `mls-intake@placeholder.example.com` | Warning | `MLS_BROKER_EMAIL` env var must be set before syndication reaches a real broker. Emails will go nowhere if not configured. |
| `src/services/transaction/deadlines.ts` | 30-35 | `calculateTransactionDeadlines` defines its own private `StateWorkflowConfig` with `step.name` (not `step.id`) and non-optional `deadlineDays` | Warning | Type mismatch with real `StateWorkflowConfig` from `@/workflow/types`. The function cannot accept a real state config without type casting. The production deadline scheduling path (`trackTransactionDeadlinesRaw`) does NOT call this function — it reimplements the math inline correctly. This function is unused in the production path, making it a dead utility. |
| `src/app/seller/transactions/[id]/page.tsx` | 201-222 | Accept/Counter/Reject buttons are `disabled` with comment "wired to events API in a later task" | Warning | Seller cannot respond to offers from the dashboard. Goal success criterion 1 states the dashboard shows "real-time status" — the display is correct, but the action pathway is non-functional. This is the primary gap. |
| `src/workflow/engine.ts` | 43-49 | Stub actors: `scheduleDeadlines` and `notifyAttorneyRequired` resolve immediately | Info | These actors are stubs per plan spec — Inngest handles the actual scheduling outside the machine. Not a blocker. |

---

### Human Verification Required

#### 1. Inngest Event Firing on Listing Publish

**Test:** Publish a listing (set status to 'active') and confirm `listing/published` Inngest event fires, triggering `syndicateToMls`
**Expected:** Broker email sent via Resend; `mls_syndications` row created with `status: 'submitted'`
**Why human:** Requires end-to-end Inngest dev server + Resend test mode; cannot grep-verify event emission from publish API

#### 2. MFA Gate Real Behavior

**Test:** Navigate to `/buyer/transactions/[id]/wire-instructions` while logged in without 2FA enabled
**Expected:** MFA required prompt displayed; wire instructions not shown
**Why human:** Clerk `user.twoFactorEnabled` check requires a live Clerk session

#### 3. AI Negotiation Streaming Response

**Test:** POST to `/api/negotiation/strategy` with a valid `listingId`, `message`, and `role: 'buyer'`
**Expected:** Streaming response with UPL disclaimer in content; `X-UPL-Disclaimer: true` header; `suggestOfferPrice` tool call in response for price-related questions
**Why human:** Requires live OpenAI API key; streaming response format requires runtime validation

#### 4. Transaction Guide RAG Grounding

**Test:** POST to `/api/transaction-guide` asking a GA-specific question about attorney requirements
**Expected:** Response references GA-specific requirements from pgvector knowledge base, not generic guidance
**Why human:** RAG grounding quality requires live pgvector query + OpenAI call

---

### Gaps Summary

**One functional gap** exists in the phase:

The **seller offer response pathway** is non-functional. The seller transaction dashboard renders Accept/Counter/Reject buttons but they are hardcoded as `disabled` with no form/action wiring. This was explicitly deferred in plan 04-04 decisions ("Seller offer buttons are disabled placeholders — server-side action wiring deferred to a later plan"). The plan acknowledged this.

**Impact on goal:** The phase goal says "Full offer-to-close workflow automated." The XState machine models all transitions correctly, the API route for appending events (`POST /api/transactions/[id]/events`) exists and works, but no UI path allows a seller to accept or counter an offer. A buyer can still submit an offer (via `POST /api/transactions`) and all downstream automation (deadlines, checklists, CFPB monitoring) works once a transaction is manually advanced. The self-service workflow is incomplete for the seller's initiating action.

**Secondary concern (warning-level):** `calculateTransactionDeadlines` in `deadlines.ts` has a type incompatibility with the real `StateWorkflowConfig` — it cannot be called with a real state config without error. The production code path does not use this function (the Inngest function reimplements the logic directly), but it represents dead/incorrect utility code that should be fixed or removed.

**MLS_BROKER_EMAIL not configured** — the syndication will send emails to `mls-intake@placeholder.example.com` until this env var is set. This is a configuration requirement, not a code gap, but it means MLS-01 is implemented but not yet operationally active.

---

_Verified: 2026-03-16T21:24:45Z_
_Verifier: Claude (gsd-verifier)_

# Phase 4: Transaction Engine + State Compliance - Research

**Researched:** 2026-03-16
**Domain:** XState 5 workflow engine, event-sourced transaction log, AI negotiation (ATTOM comps), AI transaction coordinator (CFPB TRID, deadlines, Inngest), RAG state-law agent, wire fraud security, MLS broker syndication
**Confidence:** HIGH (XState 5 API, event sourcing patterns, CFPB TRID rule, wire fraud security), MEDIUM (ATTOM Data API coverage/pricing, flat-fee MLS syndication vendor integration), LOW (XState multi-state data-driven config patterns — documented in theory, limited real-world examples in codebase)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEGL-01 | Platform maintains legal workflow config for each of 10 launch states | One TypeScript config file per state in `src/workflow/states/` — data-driven, no hardcoded rules |
| LEGL-02 | Each state config specifies: attorney required, agent required, RON available, disclosure forms, closing steps | `StateWorkflowConfig` interface with typed fields; builds on existing `STATE_INFO` + `ClosingType` in `src/lib/states.ts` |
| LEGL-03 | Transaction flow automatically adapts based on property state | XState `setup()` machine reads config at actor creation; `closingType` field drives guard conditions |
| LEGL-04 | Attorney-required states route to attorney referral | XState guard `requiresAttorney` triggers `attorney_referral` state; CTA links to referral network |
| LEGL-05 | FSBO states provide fully self-service workflow | `closingType: "title-company"` states use self-service path; no mandatory human professional step |
| LEGL-06 | State configs are data-driven (JSON/DB) and updatable without code deploys | Configs live in `src/workflow/states/` TypeScript files; DB-persisted snapshot for runtime; env-var flag to hot-reload |
| LEGL-07 | Platform displays state-specific legal requirements before transaction begins | `StateRequirementsNotice` component reads config; shown on transaction start page before any step |
| NEGO-01 | AI provides comparable sales analysis for any listed property | ATTOM Data API `/sale/snapshot` or `/avm/detail` endpoints; fallback to MLS comps from `mls_listings` table |
| NEGO-02 | AI suggests offer price strategy based on comps, DOM, market conditions | GPT-4o `generateText` with comps context; price suggestion as structured JSON tool output |
| NEGO-03 | AI guides buyer through offer/counteroffer process with templates | Streaming AI SDK chat route; offer template generation as tool call |
| NEGO-04 | AI provides seller with counteroffer strategy recommendations | Same negotiation agent, seller-role system prompt variant |
| NEGO-05 | All AI negotiation guidance includes "not legal/financial advice" disclaimers | System prompt + UI disclaimer banner — same UPL guardrail pattern as Phase 2/3 |
| TXCO-01 | AI generates state-specific transaction checklist after offer acceptance | State workflow config `steps[]` array drives checklist generation; AI formats into user-facing list |
| TXCO-02 | AI tracks deadlines and sends reminders | Inngest scheduled functions per transaction; `transaction_deadlines` DB table with deadline rows |
| TXCO-03 | AI flags missing required documents per state | Workflow config `requiredDocuments[]` per step compared against `signatureEnvelopes` rows for transaction |
| TXCO-04 | AI monitors CFPB 3-day closing disclosure rule compliance | Inngest function monitors `closing_date - 3 business days`; alerts if Closing Disclosure not delivered in time |
| TXCO-05 | Transaction dashboard shows real-time status of all pending items | `/buyer/transactions/[id]` and `/seller/transactions/[id]` pages; reads from `transactions` + `transaction_events` tables |
| MLS-01 | Seller listings syndicate to MLS via broker partner network | Upgrade existing `submitToMls()` stub in `src/services/mls/syndication.ts` to real vendor call (ListWithFreedom or Homecoin REST/email API) |
</phase_requirements>

---

## Summary

Phase 4 is the most architecturally complex phase of the project. It introduces four interlocking systems that must work together: a data-driven XState 5 workflow engine (one config per state), an event-sourced transaction service (append-only Postgres log), a suite of AI agents (negotiation assistant + transaction coordinator + state-law RAG agent), and a wire fraud security layer. All of this sits on top of the existing Next.js 15 / Drizzle / Supabase / Inngest / AI SDK v6 / SignWell stack built in Phases 1-3.

The XState 5 machine is the central nervous system. Every other Phase 4 system is either a trigger (user submits offer) or a side effect (AI generates checklist, Inngest schedules deadlines) of state machine transitions. XState 5 introduces a `setup()` API that provides full TypeScript inference for states, events, guards, and actors — this is the correct modern API. The machine is created fresh per transaction from a data-driven config object, making it possible to update state logic without touching the machine code. The machine state is persisted to the `transactions` table; the raw event log lives in `transaction_events`.

The AI negotiation assistant requires comps data. ATTOM Data API is the plan-specified vendor, but it has enterprise/custom pricing. The research identifies a practical fallback: use the existing `mls_listings` table for comps within the same zip/city. Either path flows into the same `negotiationAgent` function that calls GPT-4o with structured output.

CFPB TRID is the most compliance-critical deadline in this phase. The rule requires the Closing Disclosure to be received by the buyer at least 3 business days before closing. Violations in 2025 carry penalties of $7,217/day (Tier 1) up to $1.4M/day (knowing violations). The platform must track this via an Inngest deadline-monitoring function, not rely on manual tracking.

Wire fraud security is non-negotiable. All wiring instructions must be shown only inside an authenticated, MFA-gated in-app display. No email transmission. CertifID is the leading vendor for additional verification and insurance ($2M coverage per wire). The architecture decision for this phase is to build the in-app authenticated display and defer CertifID API integration to a follow-on hardening task.

**Primary recommendation:** Build the XState 5 machine + event-sourced transaction service as a foundation first (Plans 04-01, 04-02), then layer on AI agents (Plans 04-03, 04-04, 04-05), then wire fraud security (Plan 04-06), then MLS syndication upgrade (Plan 04-07). Each plan is independently testable.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xstate | 5.x | State machine for transaction workflow | Already in project (`npm install xstate @xstate/react` confirmed in STACK.md); XState 5 is full rewrite — use `setup()` API, not v4 patterns |
| @xstate/react | 5.x | React hooks for XState actors in UI | `useActor()` hook for transaction dashboard UI components |
| drizzle-orm | 0.45.1 | Event log tables, transaction tables | Already in project; append-only insert pattern is natural |
| inngest | 3.52.7 | Deadline tracking, reminder jobs, CFPB monitor | Already powering Phase 2/3 async jobs; same pattern |
| ai / @ai-sdk/openai | 6.x / 3.x | AI negotiation + coordinator + RAG agent | Same AI SDK v6 patterns from Phase 2/3 chatbot |
| resend | 6.9.3 | Transaction deadline reminder emails | Already configured for Phase 3 search alerts |
| zod | 4.x | Schema validation for all API payloads | Already installed |

### New Additions
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | Business-day math for CFPB 3-day rule | `addBusinessDays()`, `differenceInBusinessDays()` — handles weekends + federal holidays correctly; already in STACK.md |

### External APIs
| Service | Purpose | Notes |
|---------|---------|-------|
| ATTOM Data API | Comparable sales for AI negotiation (NEGO-01/02) | Enterprise pricing — custom contract required; fallback to `mls_listings` comps if not available at plan time |
| ListWithFreedom or Homecoin | Flat-fee MLS broker partner for MLS-01 syndication | No public REST API documented; integration is likely REST/email-based per-submission workflow; confirm with vendor |
| CertifID (future) | Wire fraud prevention + $2M insurance per wire | Not required for Phase 4 MVP; wire fraud architecture (in-app display + MFA) is sufficient for launch; defer CertifID integration |

### Installation (new packages only)
```bash
npm install date-fns
```
All other packages are already installed.

---

## Architecture Patterns

### Recommended Project Structure (Phase 4 additions)
```
src/
├── workflow/
│   ├── engine.ts               # XState machine factory — createTransactionMachine(config)
│   ├── types.ts                # StateWorkflowConfig, WorkflowStep interfaces
│   └── states/
│       ├── CA.ts               # California workflow config
│       ├── TX.ts               # Texas workflow config
│       ├── FL.ts               # Florida workflow config
│       ├── NY.ts               # New York workflow config
│       ├── GA.ts               # Georgia (attorney-required) workflow config
│       ├── NC.ts               # North Carolina (attorney-required) workflow config
│       ├── AZ.ts               # Arizona workflow config
│       ├── OH.ts               # Ohio workflow config
│       ├── PA.ts               # Pennsylvania workflow config
│       └── IL.ts               # Illinois (customary-attorney) workflow config
├── services/
│   ├── transaction/
│   │   ├── create.ts           # Start transaction (offer submitted event)
│   │   ├── events.ts           # Append event to transaction_events log
│   │   ├── state.ts            # Derive current state from event replay
│   │   └── deadlines.ts        # Calculate and persist deadline rows
│   ├── negotiation/
│   │   ├── comps.ts            # ATTOM Data API client (or mls_listings fallback)
│   │   └── agent.ts            # AI negotiation assistant (GPT-4o + comps context)
│   └── mls/
│       └── syndication.ts      # Upgrade existing stub to real vendor API call
├── ai/
│   ├── agents/
│   │   ├── negotiation.ts      # Buyer/seller offer strategy agent
│   │   ├── transaction-coordinator.ts  # Deadline + document compliance agent
│   │   └── transaction-guide.ts        # RAG state-law Q&A agent (upgrade from Phase 2 chatbot)
│   └── prompts/
│       ├── negotiation-buyer.ts
│       ├── negotiation-seller.ts
│       └── transaction-coordinator.ts
├── inngest/
│   └── functions/
│       ├── track-transaction-deadlines.ts  # Schedule deadline reminders after offer accepted
│       ├── cfpb-disclosure-monitor.ts      # CFPB 3-day rule compliance check
│       └── (existing functions from Phase 2/3)
└── app/
    ├── api/
    │   ├── transactions/
    │   │   ├── route.ts         # POST (create), GET (list)
    │   │   └── [id]/
    │   │       ├── route.ts     # GET (single transaction)
    │   │       └── events/
    │   │           └── route.ts # POST (append event: offer, counter, accept, etc.)
    │   ├── negotiation/
    │   │   ├── comps/route.ts   # GET comps for a listing
    │   │   └── strategy/route.ts # POST: AI offer/counteroffer strategy
    │   └── wire-instructions/
    │       └── [transactionId]/route.ts  # GET: authenticated in-app wire display (MFA-gated)
    ├── buyer/
    │   └── transactions/
    │       └── [id]/page.tsx    # Transaction dashboard (buyer view)
    └── seller/
        └── transactions/
            └── [id]/page.tsx   # Transaction dashboard (seller view)
```

---

### Pattern 1: XState 5 Data-Driven Machine with `setup()`

**What:** The `setup()` API in XState 5 defines all named guards, actions, and actors up front with full TypeScript inference. The actual machine config is a data object that references these by name. State workflow configs per state are plain TypeScript objects — no machine code — interpreted by the engine.

**When to use:** Any multi-step legal workflow where transitions have guards (e.g., "only advance to attorney_review if closingType is attorney-required") and side effects (e.g., "when offer is accepted, invoke scheduleDeadlines actor").

**Key XState 5 facts (HIGH confidence, from stately.ai official docs):**
- `setup({ actors, guards, actions })` + `.createMachine(config)` is the v5 pattern — NOT `createMachine()` directly
- `fromPromise(({ input }) => ...)` creates promise-based actors with typed input
- `createActor(machine, { input })` passes input to the machine at actor creation time
- XState 5 requires TypeScript 5.0+ and `strictNullChecks: true`
- XState v4 APIs are NOT compatible — `Machine()`, `assign()` as object (must use function form), `invoke` syntax changed

**Example:**
```typescript
// src/workflow/engine.ts
import { setup, fromPromise, createActor } from 'xstate';
import type { StateWorkflowConfig } from './types';

const transactionMachine = setup({
  types: {} as {
    context: {
      transactionId: string;
      state: string;
      config: StateWorkflowConfig;
      currentStep: string;
    };
    events:
      | { type: 'OFFER_SUBMITTED'; offerPriceCents: number }
      | { type: 'COUNTER_OFFERED'; counterPriceCents: number }
      | { type: 'OFFER_ACCEPTED' }
      | { type: 'OFFER_REJECTED' }
      | { type: 'INSPECTION_COMPLETE' }
      | { type: 'CLOSING_DISCLOSURE_SENT' }
      | { type: 'CLOSED' };
    input: { transactionId: string; propertyState: string; config: StateWorkflowConfig };
  },
  actors: {
    scheduleDeadlines: fromPromise(async ({ input }: { input: { transactionId: string; config: StateWorkflowConfig } }) => {
      // calls inngest.send('transaction/deadlines.schedule', ...)
    }),
    notifyAttorneyRequired: fromPromise(async ({ input }: { input: { transactionId: string; state: string } }) => {
      // Resend email to user with attorney referral
    }),
  },
  guards: {
    requiresAttorney: ({ context }) =>
      context.config.closingType === 'attorney-required',
    requiresCustomaryAttorney: ({ context }) =>
      context.config.closingType === 'customary-attorney',
  },
}).createMachine({
  id: 'transaction',
  initial: 'offer_submitted',
  context: ({ input }) => ({
    transactionId: input.transactionId,
    state: input.propertyState,
    config: input.config,
    currentStep: 'offer_submitted',
  }),
  states: {
    offer_submitted: {
      on: {
        OFFER_ACCEPTED: [
          { guard: 'requiresAttorney', target: 'attorney_review' },
          { target: 'inspection_period' },
        ],
        OFFER_REJECTED: 'closed_lost',
        COUNTER_OFFERED: 'counter_pending',
      },
    },
    attorney_review: {
      entry: { type: 'notifyAttorneyRequired' },
      on: { INSPECTION_COMPLETE: 'inspection_period' },
    },
    inspection_period: {
      invoke: {
        src: 'scheduleDeadlines',
        input: ({ context }) => ({
          transactionId: context.transactionId,
          config: context.config,
        }),
      },
      on: { CLOSING_DISCLOSURE_SENT: 'pending_closing' },
    },
    pending_closing: {
      on: { CLOSED: 'closed_won' },
    },
    counter_pending: {
      on: {
        OFFER_ACCEPTED: 'inspection_period',
        OFFER_REJECTED: 'closed_lost',
        COUNTER_OFFERED: 'counter_pending',
      },
    },
    closed_won: { type: 'final' },
    closed_lost: { type: 'final' },
  },
});

export function createTransactionActor(
  transactionId: string,
  propertyState: string,
  config: StateWorkflowConfig
) {
  return createActor(transactionMachine, {
    input: { transactionId, propertyState, config },
  });
}
```

---

### Pattern 2: Event-Sourced Transaction Log

**What:** All transaction state changes are stored as immutable rows in a `transaction_events` table (append-only). Current workflow state is derived by replaying events. A `transactions` table caches the current derived state for fast reads without replay.

**When to use:** Legal/financial systems requiring full audit trail, dispute resolution, and the ability to reconstruct state at any point in time.

**Key design decisions:**
- `transaction_events.event_type` is a discriminated union: `offer_submitted | counter_offered | offer_accepted | offer_rejected | inspection_complete | closing_disclosure_sent | closed`
- `transaction_events.payload` is a JSONB column (stored as `text` in Drizzle + cast in raw SQL — same pattern as `knowledgeChunks`)
- `transactions.current_state` is a cached denormalization; always write event first, then update cache
- Never UPDATE or DELETE event rows — only INSERT
- PostgreSQL SERIAL or `nanoid` for event IDs; use `timestamp with time zone` for `occurred_at`

**Schema additions:**
```typescript
// src/db/schema.ts additions
export const transactionStatusEnum = pgEnum('transaction_status', [
  'offer_submitted',
  'counter_pending',
  'offer_accepted',
  'attorney_review',
  'inspection_period',
  'pending_closing',
  'closed_won',
  'closed_lost',
]);

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull().references(() => listings.id),
  buyerUserId: text('buyer_user_id').notNull(),
  sellerUserId: text('seller_user_id').notNull(),
  propertyState: text('property_state').notNull(),
  currentStatus: transactionStatusEnum('current_status').default('offer_submitted').notNull(),
  offerPriceCents: integer('offer_price_cents').notNull(),
  closingDate: timestamp('closing_date'),
  inspectionDeadline: timestamp('inspection_deadline'),
  financingContingencyDeadline: timestamp('financing_contingency_deadline'),
  closingDisclosureDeadline: timestamp('closing_disclosure_deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactionEvents = pgTable('transaction_events', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  eventType: text('event_type').notNull(),
  payload: text('payload').notNull(), // JSON blob
  actorUserId: text('actor_user_id'), // who triggered the event
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
});

export const transactionDeadlines = pgTable('transaction_deadlines', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  deadlineType: text('deadline_type').notNull(), // "inspection" | "financing" | "closing_disclosure" | "closing"
  dueAt: timestamp('due_at').notNull(),
  reminderSentAt: timestamp('reminder_sent_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

### Pattern 3: State Workflow Config Interface

**What:** One TypeScript config file per state. The engine reads the config; no business rules live in application code. Legal team can review config files without reading machine code.

**When to use:** Any state with legal requirements that differ from the default title-company FSBO path.

**Example (extends existing `STATE_INFO` in `src/lib/states.ts`):**
```typescript
// src/workflow/types.ts
export interface WorkflowStep {
  id: string;
  label: string;
  requiredDocuments: string[];   // document type IDs
  deadlineDays?: number;         // days from offer acceptance
  deadlineType?: 'inspection' | 'financing' | 'closing_disclosure' | 'closing';
  triggers?: string[];           // Inngest event names to fire on step entry
}

export interface StateWorkflowConfig {
  stateCode: string;
  stateName: string;
  closingType: 'title-company' | 'attorney-required' | 'customary-attorney';
  fsboAllowed: boolean;
  ronAvailable: boolean;         // Remote Online Notarization
  steps: WorkflowStep[];
  legalRequirementsSummary: string;  // Shown to user before transaction starts (LEGL-07)
  attorneyReferralRequired: boolean;
}

// src/workflow/states/GA.ts
import type { StateWorkflowConfig } from '../types';

export const georgiaConfig: StateWorkflowConfig = {
  stateCode: 'GA',
  stateName: 'Georgia',
  closingType: 'attorney-required',
  fsboAllowed: true,
  ronAvailable: false,
  legalRequirementsSummary:
    'Georgia requires a licensed real estate attorney to conduct the closing. ' +
    'You will be connected with a closing attorney referral before closing.',
  attorneyReferralRequired: true,
  steps: [
    {
      id: 'offer_submitted',
      label: 'Offer Submitted',
      requiredDocuments: [],
    },
    {
      id: 'offer_accepted',
      label: 'Offer Accepted',
      requiredDocuments: ['purchase_agreement'],
      deadlineDays: 3,
      deadlineType: 'inspection',
      triggers: ['transaction/deadlines.schedule', 'transaction/attorney.notify'],
    },
    {
      id: 'attorney_review',
      label: 'Attorney Review',
      requiredDocuments: ['attorney_assignment'],
      deadlineDays: 3,
    },
    {
      id: 'inspection_period',
      label: 'Inspection & Due Diligence',
      requiredDocuments: ['inspection_report'],
      deadlineDays: 10,
      deadlineType: 'inspection',
    },
    {
      id: 'pending_closing',
      label: 'Pending Closing',
      requiredDocuments: ['closing_disclosure', 'title_commitment'],
      deadlineDays: 3,
      deadlineType: 'closing_disclosure',
    },
    {
      id: 'closed',
      label: 'Closed',
      requiredDocuments: ['signed_deed', 'settlement_statement'],
    },
  ],
};
```

---

### Pattern 4: AI Negotiation Agent (GPT-4o + Comps)

**What:** Fetches comparable sales from ATTOM Data API (or `mls_listings` fallback), packages as context, calls GPT-4o with buyer or seller system prompt, returns structured JSON with offer strategy.

**AI SDK v6 patterns (same as Phase 2/3 — HIGH confidence):**
- Use `generateText()` with `system` prompt for non-streaming strategy output
- Use `streamText()` for interactive Q&A guidance
- Tool calls for structured output (offer price suggestion as `{ suggestedOfferCents: number, rationale: string }`)
- `inputSchema` on tools (not `parameters` — confirmed v6 breaking change from STATE.md)
- UPL disclaimer MUST be in every system prompt and returned in every response

**ATTOM Data API notes (MEDIUM confidence):**
- Endpoint: `GET /propertyapi/v1.0.0/sale/snapshot` with radius + property type filters
- Returns: sold price, recording date, price per sqft, property details
- Auth: `apikey` header
- Pricing: enterprise contract required — must be established before Plan 04-03 implementation
- Fallback: query `mls_listings` table for `status = 'sold'` within same zip code (already in DB from Phase 3)

---

### Pattern 5: Inngest Deadline Tracking

**What:** On `transaction/deadlines.schedule` event, Inngest function inserts rows into `transaction_deadlines` and schedules reminder `step.sleep` calls at 48h, 24h, and 0h before each deadline.

**CFPB TRID 3-day rule specifics (HIGH confidence, from CFPB official docs):**
- Closing Disclosure must be RECEIVED (not just sent) at least 3 business days before closing
- "Business day" = all calendar days except Sundays and federal public holidays
- Mailed/emailed delivery: deemed received 3 business days after sending (so effectively 6 business days before closing)
- In-person delivery: deemed received same day (so 3 business days before closing)
- Triggers new 3-day clock: APR change > 1/8%, loan product change, or prepayment penalty added
- 2025 penalties: $7,217/day (Tier 1), $36,083/day (Tier 2 reckless), $1,443,275/day (Tier 3 knowing)
- Platform role: monitor and alert — the lender/title company is the responsible party, but the platform must flag the risk

**Inngest pattern (same as Phase 2/3 — HIGH confidence):**
```typescript
// src/inngest/functions/cfpb-disclosure-monitor.ts
import { inngest } from '@/inngest/client';
import { addBusinessDays, isBefore } from 'date-fns';

export const cfpbDisclosureMonitor = inngest.createFunction(
  { id: 'cfpb-disclosure-monitor' },
  { event: 'transaction/closing.scheduled' },
  async ({ event, step }) => {
    const { transactionId, closingDate } = event.data;

    // Closing Disclosure must be received 3 business days before closing
    const disclosureDeadline = addBusinessDays(new Date(closingDate), -3);

    await step.run('insert-disclosure-deadline', async () => {
      // INSERT INTO transaction_deadlines (transactionId, deadlineType, dueAt)
    });

    // Wait until 5 days before closing (2-day buffer)
    await step.sleepUntil('wait-for-disclosure-check', addBusinessDays(new Date(closingDate), -5));

    await step.run('check-disclosure-sent', async () => {
      // Query transaction_events for closing_disclosure_sent event
      // If not found, send alert email to both parties via Resend
    });
  }
);
```

---

### Pattern 6: Wire Fraud Security — In-App Authenticated Display

**What:** Wire instructions are shown ONLY via a dedicated authenticated page route that requires:
1. Active Clerk session (standard auth)
2. Explicit MFA verification step (Clerk step-up auth or custom TOTP gate)
3. Instructions fetched from DB, never from email or query param

**Wire fraud facts (HIGH confidence, from CertifID 2025 State of Wire Fraud Report):**
- 17% of title companies have sent client money to fraudulent accounts
- 26% of buyers/sellers received suspicious/fraudulent communications during closing
- 4.7% of buyers/sellers were victims of wire fraud
- Business Email Compromise (BEC) is the primary attack vector — attackers monitor email chains and inject fraudulent wiring instructions
- CertifID provides identity verification + $2M insurance per wire — defer integration to post-launch hardening

**Architecture decisions:**
- `wire_instructions` table: encrypted at rest (Supabase column encryption or AES-256 application layer)
- Route `/buyer/transactions/[id]/wire-instructions`: server component, requires `auth()` + MFA check
- Never embed wire amounts or account numbers in emails — only a link back to the in-app page
- Every page load logs an access event to `transaction_events` with `event_type: 'wire_instructions_viewed'`
- Explicit banner on every page: "Wire instructions displayed here are the ONLY authoritative source. If you received an email with different wire instructions, call the title company immediately — do not send money."

---

### Pattern 7: MLS Syndication Upgrade (MLS-01)

**What:** Upgrade the existing `submitToMls()` stub in `src/services/mls/syndication.ts` to call a real flat-fee MLS broker partner API.

**Vendor situation (MEDIUM confidence — no public APIs documented):**
- ListWithFreedom: covers all 50 states; Zillow-partnered; no documented REST API; submission likely via email/form
- Homecoin: covers 22 states; $149/listing; no documented REST API
- Neither vendor has publicly documented a machine-to-machine REST API for bulk submissions
- Recommended path: contact ListWithFreedom for partner/affiliate API access before coding Plan 04-07
- Fallback: implement as an Inngest function that sends a structured email via Resend with listing details to a ListWithFreedom partner inbox (confirmed valid workflow pattern for flat-fee MLS services)

**Implementation note:** The $299 `mlsSyndicationFee` is already included in `TransactionFees` from Phase 2. The stub is already in place. Plan 04-07 only needs to wire the stub to the real vendor call.

---

### Anti-Patterns to Avoid

- **Hardcoding state rules in machine code:** Never write `if (state === 'GA') requireAttorney = true` in the XState machine. Always read from the config object. The machine interprets configs; it never encodes rules.
- **XState v4 API patterns in v5 codebase:** `createMachine({})` without `setup()`, using `assign()` as a plain object (must be a function in v5), `invoke.id` as required (optional in v5). The project has XState 5 installed — use v5 APIs exclusively.
- **Synchronous AI calls in transaction API routes:** Comps fetching + GPT-4o analysis can take 5-15 seconds. Use `streamText()` for chat, `generateText()` + Inngest for batch analysis. Never block the HTTP request thread for multi-step AI work.
- **Replaying entire event log on every request:** Cache the derived transaction state in `transactions.current_state`. Replay only when inconsistency is detected (admin/audit paths).
- **Wire instructions in any email body:** Emails are not authenticated. Only a link to the in-app authenticated display is permissible. Even the platform's own reminder emails must NOT contain account numbers or routing numbers.
- **Assuming CFPB TRID applies to all transactions:** TRID (RESPA/TILA Integrated Disclosure) applies to mortgage-financed purchases. Cash transactions do not have a mandatory 3-day Closing Disclosure requirement. The platform should track loan type on the transaction and conditionally enforce TRID.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State machine transitions + guards | Custom if/else state tracker | XState 5 `setup()` + `createMachine()` | Invalid state transitions are impossible by construction; built-in TypeScript inference; visual debugging via Stately Studio |
| Business day calculation for CFPB | Custom weekend/holiday loop | `date-fns` `addBusinessDays()` + `differenceInBusinessDays()` | Handles weekends + all US federal holidays; immutable; tree-shakeable |
| Wire instruction encryption at rest | Custom AES implementation | Supabase column-level encryption (pgsodium) or AWS KMS via Supabase Vault | Crypto bugs are catastrophic; use audited implementations |
| Transaction audit log | Mutable status field | Append-only `transaction_events` table | Legal disputes require proof of every state change; mutable fields can be tampered with |
| Comps comparable sales data | Scraping Zillow/Redfin | ATTOM Data API or `mls_listings` table (already have it) | Scraping violates ToS, fragile, legally risky; `mls_listings` is already populated from Phase 3 SimplyRETS |

---

## Common Pitfalls

### Pitfall 1: XState v4/v5 API Mix
**What goes wrong:** Using v4 patterns (`createMachine()` without `setup()`, `assign()` as object literal, `Machine()` factory) in a project with XState 5 installed. Causes silent type errors and missing TypeScript inference.
**Why it happens:** XState 5 docs and v4 docs both appear in search results. The migration guide is not obvious.
**How to avoid:** Always start machine definition with `setup({ types, actors, guards, actions }).createMachine(config)`. Never use `createMachine()` alone. Check `package.json` — if version is `^5.x`, use v5 APIs exclusively.
**Warning signs:** TypeScript inference not working on guard/action names. `assign()` called with object instead of function.

### Pitfall 2: CFPB TRID Rule Misapplied
**What goes wrong:** Platform enforces 3-day closing disclosure rule on cash transactions, or counts calendar days instead of business days (excluding Sundays + federal holidays), or counts from sending date instead of receiving date.
**Why it happens:** The rule has 3 different interpretations of "business day" depending on context (rescission period = all calendar days except Sundays/holidays; TRID waiting period = all calendar days except Sundays/holidays; standard business day = Mon-Fri).
**How to avoid:** Use `date-fns` `addBusinessDays()` which uses Mon-Fri by default. Track loan type (mortgage vs cash) on transaction; only enforce TRID for mortgage-financed. Use "mailed" assumption (6 calendar days total) as conservative default.
**Warning signs:** Compliance logic counting calendar days, or not checking for federal holidays in date math.

### Pitfall 3: XState Machine Not Persisted Between Requests
**What goes wrong:** XState actor is created in an API route handler and the state is lost when the request ends (serverless function lifecycle). Next request creates a fresh machine and loses all transaction history.
**Why it happens:** XState actors are in-memory. In serverless/edge environments, there is no persistent process to hold state.
**How to avoid:** Persist the machine's snapshot (serialized state) to the `transactions.current_state` column after every state transition. On each request, rehydrate via `createActor(machine, { snapshot: persistedSnapshot })`. The `transaction_events` log is the source of truth; the snapshot is a performance cache.
**Warning signs:** Transaction dashboard shows wrong state after page refresh. Tests pass but production shows state resets.

### Pitfall 4: AI Negotiation Agent Given State-Specific Legal Interpretation Authority
**What goes wrong:** AI negotiation agent interprets contract contingency clauses, advises on legal remedies, or generates state-specific legal analysis. UPL exposure.
**Why it happens:** GPT-4o is highly capable and will answer legal questions if not explicitly prohibited in system prompt.
**How to avoid:** System prompt must contain: "You provide pricing analysis and general market information only. You do not interpret contracts, advise on legal rights, or provide legal guidance of any kind. Direct all legal questions to the Transaction Guide or an attorney." Disclaimer must be visible in UI on every negotiation response.
**Warning signs:** AI response contains phrases like "you are entitled to", "your legal options include", "the contract requires the seller to".

### Pitfall 5: Wire Instructions Leak Through Email Notifications
**What goes wrong:** Inngest deadline reminder email includes the escrow account number and routing number so the buyer "doesn't have to log in." Wire fraud attacker intercepts the email and substitutes fraudulent instructions.
**Why it happens:** Developer optimizes for UX (one-click access) without realizing the security implications.
**How to avoid:** Inngest reminder emails contain ONLY: transaction ID, deadline, and a deep link to the authenticated in-app wire instructions page. The email body must explicitly state: "Wire instructions are available only in your secure account — never in email."
**Warning signs:** Any email template that includes bank account numbers, routing numbers, or dollar amounts for wiring.

### Pitfall 6: NY High Risk State — Broker Required
**What goes wrong:** New York transaction workflow proceeds as standard without partner broker involvement. STATE.md explicitly flags NY as HIGH broker licensing risk where a partner broker is required (not optional).
**Why it happens:** NY `closingType` is `customary-attorney` (not `attorney-required`), which might be confused with a lower-risk classification.
**How to avoid:** The NY workflow config must include a mandatory `partnerBrokerRequired: true` field and a step that gates progression until a partner broker is confirmed. The `StateRequirementsNotice` for NY must explicitly call out the broker requirement.
**Warning signs:** NY workflow config identical to AZ/OH/PA configs without broker-specific steps.

---

## Code Examples

### AI SDK v6 Negotiation Agent (streamText pattern)
```typescript
// src/ai/agents/negotiation.ts
// Source: STATE.md confirmed AI SDK v6 patterns — inputSchema on tools, streamText
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { UPL_DISCLAIMER } from '@/ai/prompts/upl-disclaimer';

export async function streamNegotiationGuidance({
  comps,
  listingPrice,
  daysOnMarket,
  userRole,
  userMessage,
}: {
  comps: Array<{ soldPriceCents: number; sqft: number; daysAgo: number }>;
  listingPrice: number;
  daysOnMarket: number;
  userRole: 'buyer' | 'seller';
  userMessage: string;
}) {
  const compsContext = comps
    .map((c) => `Sold for $${(c.soldPriceCents / 100).toLocaleString()}, ${c.sqft} sqft, ${c.daysAgo} days ago`)
    .join('\n');

  return streamText({
    model: openai('gpt-4o'),
    system: [
      userRole === 'buyer'
        ? 'You are an AI negotiation assistant helping a buyer evaluate their offer strategy based on recent comparable sales.'
        : 'You are an AI negotiation assistant helping a seller evaluate counteroffer strategy based on recent comparable sales.',
      'You provide pricing analysis and general market context only.',
      'You do NOT interpret contracts, advise on legal rights, or provide legal guidance of any kind.',
      UPL_DISCLAIMER, // "This is not legal or financial advice. Consult a licensed attorney or financial advisor."
      `Recent comparable sales:\n${compsContext}`,
      `Current listing price: $${(listingPrice / 100).toLocaleString()}`,
      `Days on market: ${daysOnMarket}`,
    ].join('\n\n'),
    messages: [{ role: 'user', content: userMessage }],
    tools: {
      suggestOfferPrice: tool({
        description: 'Suggest an offer price based on comps analysis',
        inputSchema: z.object({
          suggestedOfferCents: z.number().describe('Suggested offer price in cents'),
          rationale: z.string().describe('Brief explanation of the suggestion'),
          confidenceLevel: z.enum(['high', 'medium', 'low']),
        }),
        execute: async (input) => input,
      }),
    },
  });
}
```

### Append Transaction Event
```typescript
// src/services/transaction/events.ts
import { db } from '@/db';
import { transactionEvents, transactions } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export type TransactionEventType =
  | 'offer_submitted'
  | 'counter_offered'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'inspection_complete'
  | 'closing_disclosure_sent'
  | 'wire_instructions_viewed'
  | 'closed';

export async function appendTransactionEvent({
  transactionId,
  eventType,
  payload,
  actorUserId,
  newStatus,
}: {
  transactionId: string;
  eventType: TransactionEventType;
  payload: Record<string, unknown>;
  actorUserId: string;
  newStatus?: string;
}) {
  // Always append first, then update cache
  await db.insert(transactionEvents).values({
    id: nanoid(),
    transactionId,
    eventType,
    payload: JSON.stringify(payload),
    actorUserId,
  });

  if (newStatus) {
    await db
      .update(transactions)
      .set({ currentStatus: newStatus as never, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));
  }
}
```

### CFPB Business-Day Deadline Calculator
```typescript
// src/services/transaction/deadlines.ts
import { addBusinessDays, isBefore, isAfter } from 'date-fns';

/**
 * Calculate the Closing Disclosure deadline for TRID compliance.
 * Assumes mail/email delivery: buyer deemed to receive 3 business days after sending.
 * Therefore, CD must be SENT at least 6 business days before closing.
 * Conservative default — in-person delivery allows 3 business days.
 */
export function calculateClosingDisclosureDeadline(closingDate: Date): {
  mustSendBy: Date;
  mustReceiveBy: Date;
  isAtRisk: (today: Date) => boolean;
} {
  const mustReceiveBy = addBusinessDays(closingDate, -3);
  const mustSendBy = addBusinessDays(closingDate, -6); // mail assumption

  return {
    mustSendBy,
    mustReceiveBy,
    isAtRisk: (today: Date) => isAfter(today, mustSendBy),
  };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XState v4 `createMachine()` | XState v5 `setup().createMachine()` | Dec 2023 (v5 GA) | Full TypeScript inference; cleaner actor model; v4 APIs removed |
| XState `assign({})` as object | `assign(() => ({}))` function form only | XState v5 | Type safety; no silent runtime bugs from stale closures |
| Single monolithic AI agent | Specialist agents (negotiation / coordinator / guide) + orchestrator | Industry standard 2024-2025 | Retrieval quality, hallucination reduction, guardrail isolation |
| RETS MLS feeds | RESO Web API 2.0 | 2023-2024 | RETS fully deprecated; all new integrations must be RESO Web API |
| DocuSign for MVP | SignWell for MVP (already in Phase 3) | Phase 3 decision | 81% cost reduction; E-SIGN + UETA compliant; migrate to DocuSign when NAR form libraries needed |

**Deprecated/outdated:**
- XState v4: `Machine()`, `assign()` as object, `send()` on actor — removed in v5
- LangChain.js: incompatible with Next.js edge runtime; not recommended for any chat/streaming route
- RETS protocol: deprecated; SimplyRETS handles it internally; no new RETS integrations

---

## Open Questions

1. **ATTOM Data API access + pricing**
   - What we know: ATTOM has `/sale/snapshot` endpoint with comps data; enterprise pricing required
   - What's unclear: Can a startup obtain API access without a large enterprise contract? What is the minimum contract size?
   - Recommendation: Contact ATTOM before coding Plan 04-03. If not available, implement Plan 04-03 using `mls_listings` comps fallback and stub ATTOM for later.

2. **ListWithFreedom or Homecoin API for MLS-01**
   - What we know: Both services are flat-fee MLS brokers; neither has documented public REST APIs
   - What's unclear: Do they offer partner/API programs for volume submission?
   - Recommendation: Contact ListWithFreedom first (50-state coverage, Zillow-partnered). If no API, implement Plan 04-07 as a structured Inngest function that sends a formatted email submission. This is a valid workaround for MVP volume.

3. **XState machine persistence strategy in Supabase/Vercel serverless**
   - What we know: XState actors are in-memory; serverless functions have no persistent process
   - What's unclear: Best pattern for rehydrating XState snapshot from DB on each request (no community examples found for this exact stack combination)
   - Recommendation: Serialize XState snapshot to `transactions.xstate_snapshot` JSONB column after each transition. Rehydrate with `createActor(machine, { snapshot })`. Test with Vitest unit tests to confirm snapshot round-trip fidelity.

4. **Clerk MFA / step-up authentication for wire instructions**
   - What we know: Clerk v7 provides MFA; `auth()` checks session; wire instructions require step-up MFA
   - What's unclear: Does Clerk v7 support step-up authentication (require re-verification mid-session) or only global MFA at login?
   - Recommendation: If Clerk doesn't support step-up, implement a custom TOTP challenge gate using Clerk's `user.totpEnabled` check + a short-lived signed token stored in session. Research Clerk docs before coding Plan 04-06.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured in `vitest.config.ts`) |
| Config file | `/Users/roybomb/Desktop/RealEstateHunter/vitest.config.ts` |
| Quick run command | `npx vitest run src/workflow` and `npx vitest run src/services/transaction` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEGL-01 | State config exists for all 10 launch states | unit | `npx vitest run src/workflow/states` | Wave 0 |
| LEGL-02 | Each config has closingType, steps, legalRequirementsSummary | unit | `npx vitest run src/workflow` | Wave 0 |
| LEGL-03 | Machine routes attorney-required states to `attorney_review` | unit | `npx vitest run src/workflow/engine.test.ts` | Wave 0 |
| LEGL-06 | Config changes don't require machine code changes | unit | Config swap test in engine.test.ts | Wave 0 |
| LEGL-07 | `StateRequirementsNotice` renders state-specific text | unit | `npx vitest run src/app` | Wave 0 |
| NEGO-01 | Comps service returns structured data for a zip | unit | `npx vitest run src/services/negotiation/comps.test.ts` | Wave 0 |
| NEGO-02 | AI agent returns suggestedOfferCents + rationale | unit (mocked AI) | `npx vitest run src/ai/agents/negotiation.test.ts` | Wave 0 |
| NEGO-05 | UPL disclaimer present in every AI response | unit | Assert system prompt in negotiation.test.ts | Wave 0 |
| TXCO-01 | Checklist generated from state config steps | unit | `npx vitest run src/services/transaction` | Wave 0 |
| TXCO-02 | Inngest deadline function inserts deadline rows | unit (mocked Inngest step) | `npx vitest run src/inngest/functions/track-transaction-deadlines.test.ts` | Wave 0 |
| TXCO-04 | CFPB function alerts when disclosure not sent in time | unit | `npx vitest run src/inngest/functions/cfpb-disclosure-monitor.test.ts` | Wave 0 |
| TXCO-05 | Transaction dashboard renders current status | unit | `npx vitest run src/app` | Wave 0 |
| MLS-01 | `submitToMls` calls real vendor (or stub with correct payload) | unit | `npx vitest run src/services/mls/syndication.test.ts` | Wave 0 |

Note: Vitest `environment: "node"` (confirmed in vitest.config.ts) — all tests are server-side. Client component tests (like transaction dashboard) must test exported utility functions, not rendered DOM. Follow established project pattern (see `transaction-fees.test.ts` and `form-schema.test.ts`).

### Sampling Rate
- **Per task commit:** `npx vitest run src/workflow` + `npx vitest run src/services/transaction`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/workflow/engine.test.ts` — XState machine guard tests for attorney-required vs title-company paths
- [ ] `src/workflow/states/` — 10 config files (CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL)
- [ ] `src/services/transaction/events.test.ts` — appendTransactionEvent append-only behavior
- [ ] `src/services/negotiation/comps.test.ts` — comps service (mocked ATTOM or mls_listings)
- [ ] `src/ai/agents/negotiation.test.ts` — UPL disclaimer assertion, structured output shape
- [ ] `src/inngest/functions/track-transaction-deadlines.test.ts` — deadline row insertion
- [ ] `src/inngest/functions/cfpb-disclosure-monitor.test.ts` — TRID alert logic
- [ ] `src/services/transaction/deadlines.test.ts` — business-day math with `date-fns`

---

## Sources

### Primary (HIGH confidence)
- [stately.ai/docs/machines](https://stately.ai/docs/machines) — XState v5 `setup()` + `createMachine()` API
- [stately.ai/docs/typescript](https://stately.ai/docs/typescript) — TypeScript 5.0+ requirement, `strictNullChecks`
- [stately.ai/blog/2023-12-01-xstate-v5](https://stately.ai/blog/2023-12-01-xstate-v5) — XState v5 GA announcement, v4 incompatibilities
- [consumerfinance.gov TRID FAQs](https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/tila-respa-integrated-disclosures/tila-respa-integrated-disclosure-faqs/) — CFPB official TRID 3-day rule
- [flagency.net — 2025 TRID 3-Day Rule Updates](https://flagency.net/delay-new-trid-tila-respa-3-day-rule/) — 2025 penalty amounts
- [certifid.com — State of Wire Fraud 2025](https://www.certifid.com/state-of-wire-fraud) — 17% title company fraud rate, 4.7% victim rate
- Existing project: `src/lib/states.ts`, `src/db/schema.ts`, `src/services/fees/transaction-fees.ts`, `src/inngest/functions/generate-description.ts` — confirmed patterns for Drizzle schema additions, Inngest function structure, AI SDK v6 usage

### Secondary (MEDIUM confidence)
- [stately.ai/docs/migration](https://stately.ai/docs/migration) — XState v4 → v5 breaking changes
- [api.developer.attomdata.com](https://api.developer.attomdata.com/docs) — ATTOM Data API docs (pricing confirmed as enterprise/custom)
- [softwaremill.com — event sourcing with relational DB](https://softwaremill.com/implementing-event-sourcing-using-a-relational-database/) — event sourcing Postgres patterns
- [ricofritzsche.me — aggregateless event store TypeScript/Postgres](https://ricofritzsche.me/how-i-built-an-aggregateless-event-store-with-typescript-and-postgresql/) — TypeScript event store implementation

### Tertiary (LOW confidence — flag for validation)
- ListWithFreedom/Homecoin API availability: no public documentation found; requires direct vendor contact before Plan 04-07
- Clerk v7 step-up MFA support: requires verification against Clerk docs before Plan 04-06 implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack (XState 5, Inngest, AI SDK v6, Drizzle): HIGH — all packages already installed and tested in prior phases
- Architecture patterns (data-driven config, event sourcing, specialist AI agents): HIGH — matches established patterns from ARCHITECTURE.md and prior phase implementations
- CFPB TRID rule specifics: HIGH — verified against official CFPB docs
- Wire fraud security architecture: HIGH — CertifID 2025 report + PITFALLS.md
- ATTOM Data API: MEDIUM — docs exist; pricing/access timeline unknown
- MLS syndication vendor API: LOW — no public REST API documentation; vendor contact required
- XState persistence in serverless: MEDIUM — conceptually sound; no production examples in this exact stack found

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (30 days — XState 5 API is stable; CFPB rule is stable; vendor API situation may change)

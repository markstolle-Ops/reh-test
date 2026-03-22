# Phase 5: Agent-for-Hire Marketplace + Buyer Matching - Research

**Researched:** 2026-03-16
**Domain:** Two-sided marketplace (Stripe Connect), AI buyer matching (pgvector + behavioral tracking), natural language search (text embeddings), real estate license verification (ARELLO), state coverage expansion
**Confidence:** HIGH (core stack), MEDIUM (ARELLO API pricing/availability), HIGH (Fair Housing constraints)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AGNT-01 | Licensed agents can create profiles and list availability by state | Stripe Connect Express onboarding + agent_profiles DB table |
| AGNT-02 | Platform dispatches agent-for-hire requests in states requiring licensed agent involvement | XState `attorney_review` state already exists; need Inngest dispatch trigger + agentRequests table |
| AGNT-03 | Agents paid nominal flat fee per contract signing | Stripe Connect separate charges + transfers; flat-fee payout model confirmed |
| AGNT-04 | Agent marketplace includes verification of active license status per state | ARELLO LVWS v2.0 API — covers 45 jurisdictions, 4.3M+ licensee records |
| AGNT-05 | Users see transparent breakdown: platform fee + agent fee (where applicable) | `agentForHireFee` field already in `TransactionFees` interface, currently hardcoded 0 — Phase 5 wires it in |
| MTCH-01 | AI tracks buyer search behavior (views, saves, searches) to build preference profile | New `buyer_events` append-only table; behavioral signal collection in API middleware |
| MTCH-02 | AI proactively suggests listings matching inferred preferences | pgvector cosine similarity against listing embedding; already have pgvector installed in Supabase |
| MTCH-03 | Buyer can use natural language search ("3BR ranch with big yard near good schools under $350K") | NLQ → structured filter via GPT-4o function calling; hybrid semantic + filter search |
| MTCH-04 | AI sends personalized listing recommendations via email | Inngest cron + Resend — same infrastructure as match-saved-searches.ts |
</phase_requirements>

---

## Summary

Phase 5 builds two distinct systems on top of the Phase 4 transaction engine. The first is a two-sided marketplace: agents self-onboard via Stripe Connect Express, get their license verified against the ARELLO LVWS v2 database, and get dispatched automatically when a transaction enters an attorney/agent-required state. The second is an AI buyer matching engine: behavioral signals (views, saves, searches) are collected in an append-only events table, embedded via OpenAI text-embedding-3-small, and matched against listing embeddings already stored in pgvector (the RAG infrastructure from Phase 2 already proved this works). Natural language search is a thin layer on top: GPT-4o parses the query into structured `SearchParams`, then the existing `searchListings()` service executes it.

The most consequential constraint in this phase is Fair Housing. HUD guidance (2024) explicitly covers AI matching algorithms, not just advertising. Any preference inference system must avoid protected class proxies — no school quality scoring that encodes race/income demographics, no geographic filtering that produces disparate impact. The algorithm must operate solely on objective property features (beds, baths, price, sqft, property type) and explicit user signals. A Fair Housing civil rights attorney review is already flagged as a blocker in STATE.md before any production run.

**Primary recommendation:** Build AGNT-01 through AGNT-05 as plan 05-01, MTCH-01/02/04 as plan 05-02, MTCH-03 (NLP search) as plan 05-03, and state expansion (states 11-30) as plan 05-04. The agent marketplace is the highest-priority deliverable — it unlocks the platform for attorney/agent-required states.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | ^17 (Node SDK) | Stripe Connect Express account creation, onboarding links, transfers/payouts | Official SDK; already in ecosystem (same Stripe account likely used for platform billing) |
| @ai-sdk/openai + ai | ^3/^6 (already installed) | text-embedding-3-small for listing + query embeddings; GPT-4o for NLP query parsing | Already in package.json; same SDK used by chatbot and negotiation agent |
| pgvector (via raw SQL) | already enabled in Supabase | cosine similarity search for buyer matching | Already installed in Phases 2/3 for RAG chatbot; knowledgeChunks table uses it |
| inngest | ^3 (already installed) | Cron-driven recommendation emails, agent dispatch events | Already in package.json; match-saved-searches.ts is the direct pattern |
| resend | ^6 (already installed) | Personalized recommendation emails (MTCH-04) | Already used for saved-search alerts; same infrastructure |
| drizzle-orm | ^0.45 (already installed) | New tables: agent_profiles, agent_requests, buyer_events, agent_license_checks | Already the ORM for everything else |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ARELLO LVWS v2.0 | External REST/SOAP API | Real estate agent license verification across 45 states | AGNT-04 — required before agent can accept dispatches |
| zod | ^4 (already installed) | Schema for NLQ-parsed query output from GPT-4o | Already used throughout for API validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Connect Express | Stripe Connect Custom | Custom gives more control but requires building full onboarding UI; Express uses hosted flow, ships faster |
| ARELLO LVWS v2 | State-by-state scraping | ARELLO covers 45 jurisdictions with a single API; scraping is brittle, maintenance-heavy, not production-appropriate |
| text-embedding-3-small | text-embedding-3-large | Large is 5x more expensive; small is sufficient for listing embeddings (1536 dim) |
| GPT-4o for NLQ parsing | Fine-tuned local model | GPT-4o with function calling is reliable, no training data needed, consistent with existing agent pattern |

### Installation
```bash
npm install stripe
```
All other dependencies are already installed.

---

## Architecture Patterns

### Recommended New Structure
```
src/
├── db/
│   └── schema.ts                    # Add: agentProfiles, agentRequests, buyerEvents, agentLicenseChecks tables
├── services/
│   ├── agent/
│   │   ├── agent-profile.ts         # Agent CRUD, Stripe Connect account creation
│   │   ├── agent-dispatch.ts        # Pick available agent for state, create agentRequest
│   │   └── license-verification.ts  # ARELLO LVWS v2.0 API client
│   ├── matching/
│   │   ├── buyer-events.ts          # Append buyer behavior events (view, save, search)
│   │   ├── preference-profile.ts    # Aggregate events → embedding vector
│   │   └── listing-recommendations.ts # pgvector similarity query
│   └── search/
│       └── nlq-parser.ts            # GPT-4o NLP → SearchParams
├── inngest/functions/
│   ├── dispatch-agent.ts            # Trigger: transaction enters agent-required step
│   └── recommend-listings.ts        # Cron: daily personalized email recommendations
└── app/
    ├── api/
    │   ├── agents/
    │   │   ├── route.ts             # GET (list available), POST (create profile)
    │   │   └── [id]/route.ts        # GET, PATCH, DELETE
    │   ├── agents/onboarding/
    │   │   └── route.ts             # POST: create Stripe Connect Account Link
    │   └── buyer-events/
    │       └── route.ts             # POST: record view/save/search event
    └── agent/
        └── dashboard/               # Agent-side dashboard: requests, earnings, profile
```

### Pattern 1: Stripe Connect Express Flat-Fee Payout

**What:** Platform charges buyer as part of transaction fee; when signing event occurs, platform transfers flat agent fee to agent's connected account.
**When to use:** AGNT-03 — agent gets paid per contract signing.

Key decision: Use **separate charges and transfers** model (not destination charges). Platform is the merchant of record for the full transaction fee; agent fee is a separate transfer post-collection. This matches the requirement that users see "platform fee + agent fee" as a transparent breakdown (AGNT-05).

```typescript
// Source: https://docs.stripe.com/connect/separate-charges-and-transfers
// Step 1: Create Stripe Connect Express account for agent
const account = await stripe.accounts.create({ type: 'express' });

// Step 2: Generate onboarding link (one-time URL)
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${baseUrl}/agent/onboarding/refresh`,
  return_url: `${baseUrl}/agent/onboarding/complete`,
  type: 'account_onboarding',
});
// Redirect agent to: accountLink.url

// Step 3: After contract signing event, transfer flat fee to agent
await stripe.transfers.create({
  amount: AGENT_FEE_CENTS,   // e.g., 50000 = $500
  currency: 'usd',
  destination: agent.stripeAccountId,
  transfer_group: `transaction_${transactionId}`,
});
```

**Check onboarding complete:**
```typescript
const account = await stripe.accounts.retrieve(agentStripeAccountId);
const isReady = account.charges_enabled && account.details_submitted;
```

### Pattern 2: ARELLO License Verification

**What:** Verify agent holds an active real estate license in the state they claim.
**When to use:** AGNT-04 — during agent profile creation/approval.

ARELLO LVWS v2.0 is a REST/XML-over-HTTPS API. Access requires a paid subscription (pricing obtained via sales contact — not public). The API accepts name + state and returns license status, license number, expiration date.

```typescript
// Source: ARELLO LVWS v2.0 Documentation (https://www.arello.com/docs/ARELLO-LVWSv2-Documentation.pdf)
// Store result in agent_license_checks table for audit trail
async function verifyAgentLicense(
  firstName: string,
  lastName: string,
  stateCode: string
): Promise<{ verified: boolean; licenseNumber?: string; expiresAt?: Date }> {
  // ARELLO LVWS v2 endpoint — credentials obtained after subscription
  const response = await fetch(process.env.ARELLO_API_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml', 'Authorization': `Basic ${arelloCredentials}` },
    body: buildArelloRequest({ firstName, lastName, stateCode }),
  });
  // Parse XML response — license status field: 'Active' | 'Inactive' | 'Expired'
}
```

**Fallback for MVP:** If ARELLO subscription is not yet active, implement manual verification: agent uploads license document, admin marks as verified. Gate agent dispatch on `verified = true` regardless of verification method.

### Pattern 3: AI Buyer Matching with pgvector

**What:** Record behavioral events, generate preference embedding, find similar listings via cosine similarity.
**When to use:** MTCH-01, MTCH-02.

The project already has pgvector enabled in Supabase (Phase 2 RAG). The `knowledgeChunks` table has a `vector(1536)` column added via raw SQL migration. Buyer matching follows the same pattern.

```typescript
// Source: Supabase pgvector docs (https://supabase.com/docs/guides/ai/semantic-search)
// Embed the buyer's preference summary (aggregated from recent events)
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: buyerPreferenceSummary, // e.g. "3 bedroom single family $400k-$500k Phoenix AZ"
});
const queryEmbedding = response.data[0].embedding;

// Query Supabase via raw SQL (pgvector <=> = cosine distance)
const results = await db.execute(sql`
  SELECT id, street_address, city, price, bedrooms,
         (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS distance
  FROM listings
  WHERE status = 'active'
  ORDER BY distance ASC
  LIMIT 10
`);
```

**Listing embedding column:** Add `embedding vector(1536)` to listings table via raw SQL migration (same pattern as `knowledgeChunks`). Populate via Inngest function triggered on listing publish.

**Buyer preference summary construction:**
```typescript
// Aggregate last 30 days of buyer_events → text summary for embedding
function buildPreferenceSummary(events: BuyerEvent[]): string {
  // Extract: price range from viewed listings, bed count mode,
  // cities searched, property types saved
  // Return: plain text description of inferred preferences
  // IMPORTANT: Do NOT include school/demographic inferences (Fair Housing)
}
```

### Pattern 4: Natural Language Query → SearchParams

**What:** Parse "3BR ranch with big yard near good schools under $350K" into `SearchParams` object the existing `searchListings()` service accepts.
**When to use:** MTCH-03.

Use GPT-4o with Vercel AI SDK `generateObject()` to parse NLQ into structured search params.

```typescript
// Source: Vercel AI SDK docs (ai package already installed)
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

const { object: searchParams } = await generateObject({
  model: openai('gpt-4o'),
  schema: searchParamsSchema, // Zod schema matching SearchParams type
  prompt: `Parse this natural language property search query into structured filters.
           Return only objective property features (price, beds, baths, sqft, type, location).
           Query: "${userQuery}"`,
});
// Pass searchParams directly to existing searchListings(searchParams)
```

**Important:** NLQ parser must not pass "near good schools" as a school-rating filter — it should strip subjective neighborhood quality signals. Only translate objective property features.

### Pattern 5: Agent Dispatch from XState Workflow

**What:** When transaction enters `attorney_review` state, fire Inngest event to dispatch an available agent for the property's state.
**When to use:** AGNT-02 — automatic dispatch in agent/attorney-required states.

The XState engine's `attorney_review` state already exists. The dispatch happens via an Inngest event, not inside the XState machine itself (keeps machine pure).

```typescript
// In POST /api/transactions/[id]/events — after writing OFFER_ACCEPTED event
// for a state with agentRequired or attorneyReferralRequired = true:
if (newStatus === 'attorney_review' && stateConfig.attorneyReferralRequired) {
  await inngest.send({
    name: 'transaction/agent.dispatch.requested',
    data: { transactionId, propertyState, transactionId },
  });
}
```

Inngest handler selects an available `agent_profiles` row for the matching state, creates an `agent_requests` record, sends email to agent and buyer/seller.

### Anti-Patterns to Avoid

- **Embedding school scores as matching signal:** "Near good schools" proxies race and income — Fair Housing Act exposure. Strip from preference profile entirely.
- **Storing agent license data in Stripe only:** License status must be independently verified via ARELLO and stored in `agent_license_checks` — Stripe KYC does not verify real estate licenses.
- **Destination charges for agent payouts:** Destination charges make the agent the merchant of record, creating tax/1099 complications. Use separate charges + transfers instead.
- **Blocking the transaction API on license re-verification:** License checks happen async (Inngest cron weekly) and are cached in DB. Do not call ARELLO on every transaction dispatch.
- **Inlining buyer event tracking in page components:** Track via API route only (`POST /api/buyer-events`) — keeps tracking server-side and auditable, avoids client-side ad-blocker conflicts.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent bank account management + KYC | Custom agent payment onboarding | Stripe Connect Express hosted onboarding | Identity verification, bank account validation, tax forms (1099-K) — regulatory minefield |
| Real estate license verification | Scraping state real estate commission websites | ARELLO LVWS v2.0 API | 45 jurisdictions, daily updates, handles license expirations, legal audit trail |
| Vector similarity search | Custom distance scoring in application | pgvector with HNSW index via raw SQL | Already installed in Supabase; pgvector's `<=>` operator is optimized at DB level |
| NLQ → filter parsing | Regex-based query parser | GPT-4o + generateObject() with Zod schema | Natural language is too varied for regex; function calling gives type-safe output |
| Recommendation email delivery | Custom email template + scheduler | Resend + Inngest (already in use) | match-saved-searches.ts is the exact pattern to copy |

**Key insight:** The hardest problems in this phase (agent payments, license verification, vector search) all have mature external solutions. Phase 5's complexity budget should go to Fair Housing compliance, dispatch logic, and the behavioral event model — not reinventing payment or search infrastructure.

---

## Common Pitfalls

### Pitfall 1: Stripe Connect v1 vs v2 API Confusion
**What goes wrong:** Stripe is deprecating Connect v1 API in August 2025 for KYC/verification. Using old `type=express` pattern without checking which endpoints are v2.
**Why it happens:** Most blog posts and Stack Overflow answers still reference v1.
**How to avoid:** Use `stripe.accounts.create()` with Express type (still valid). The v2 restriction applies specifically to KYC verification endpoints. Check official Stripe docs, not tutorials.
**Warning signs:** TypeScript errors on `accounts.create()` with `type` param; this is a v1 field — v2 uses `controller` object.

### Pitfall 2: Fair Housing Proxies in Buyer Matching
**What goes wrong:** Matching algorithm includes school ratings, neighborhood scores, or walkability in the preference vector — all encode protected class demographics.
**Why it happens:** These feel like benign preference signals; HUD 2024 guidance explicitly covers algorithmic delivery of housing information.
**How to avoid:** Preference profile uses ONLY: price range, bedroom count, bathroom count, sqft range, property type, city/zip. No third-party data feeds (Walk Score, GreatSchools) injected into matching. Get civil rights attorney review before production run.
**Warning signs:** Any feature that correlates with school district boundaries, ZIP income level, or neighborhood "character."

### Pitfall 3: pgvector Migration Already Exists — Don't Duplicate
**What goes wrong:** Writing a new raw SQL migration to enable pgvector extension when it's already enabled from Phase 2.
**Why it happens:** Phase 5 developer doesn't check migration history.
**How to avoid:** Check `migrations/` — Phase 2 already ran `CREATE EXTENSION IF NOT EXISTS vector`. Only need to add `embedding vector(1536)` columns to new tables (listings, buyer_preference_profiles).
**Warning signs:** Migration fails with "extension already exists."

### Pitfall 4: Agent Dispatch Race Condition
**What goes wrong:** Two transactions in the same state both dispatch to the same agent simultaneously.
**Why it happens:** Inngest events fire in parallel; both read the same "available" agent before either updates their status.
**How to avoid:** Use Postgres row-level locking in dispatch: `SELECT ... FOR UPDATE SKIP LOCKED` to claim exactly one available agent per request. Inngest's concurrency controls can also throttle per-state dispatch.
**Warning signs:** Same agent assigned to multiple simultaneous transactions.

### Pitfall 5: ARELLO Not Available for MVP — Need Fallback
**What goes wrong:** ARELLO requires a paid subscription obtained via sales contact (not instant API keys). Phase 5 blocks on ARELLO negotiation.
**Why it happens:** Treating external B2B API as a commodity sign-up.
**How to avoid:** Build the agent profile schema and verification flow so it supports both ARELLO (automated) and manual (admin-upload-and-approve). Gate production dispatch on `licenseVerified = true` regardless of verification method. Start ARELLO outreach during Phase 4.
**Warning signs:** Plan has no fallback path if ARELLO contract takes 2-4 weeks.

### Pitfall 6: Buyer Events Table Growing Unbounded
**What goes wrong:** Append-only buyer_events table has no TTL; after 6 months it has millions of rows.
**Why it happens:** Append-only is the right pattern for Phase 4 transaction events; team applies same pattern without considering volume difference.
**How to avoid:** Recommendation engine only needs trailing 90 days of events. Add `occurred_at` index and filter in queries. Plan a Postgres partition or periodic summary job in Phase 6.
**Warning signs:** Query time on preference aggregation exceeds 500ms.

---

## Code Examples

Verified patterns from official sources and existing project code:

### Stripe Connect Express Account Creation + Onboarding
```typescript
// Source: https://docs.stripe.com/connect/express-accounts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/agents/onboarding
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  // 1. Create Express account
  const account = await stripe.accounts.create({ type: 'express' });
  // 2. Store stripeAccountId on agent profile
  await db.update(agentProfiles)
    .set({ stripeAccountId: account.id })
    .where(eq(agentProfiles.userId, userId));
  // 3. Generate one-time onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/agent/onboarding/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/agent/onboarding/complete`,
    type: 'account_onboarding',
  });
  return NextResponse.json({ url: accountLink.url });
}
```

### Transfer Flat Fee to Agent on Contract Signing
```typescript
// Source: https://docs.stripe.com/connect/separate-charges-and-transfers
// Called from Inngest handler when transactionEvent 'contract_signed' fires
async function payAgentFlatFee(transactionId: string, agentStripeAccountId: string) {
  await stripe.transfers.create({
    amount: AGENT_FEE_CENTS,
    currency: 'usd',
    destination: agentStripeAccountId,
    transfer_group: `tx_${transactionId}`,
    metadata: { transactionId, reason: 'contract_signing_fee' },
  });
}
```

### Buyer Event Recording
```typescript
// POST /api/buyer-events — mirrors the append-only pattern from transactionEvents
// Existing project pattern: transactionEvents in src/db/schema.ts
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { eventType, listingId, metadata } = await req.json();
  await db.insert(buyerEvents).values({
    id: nanoid(),
    userId,
    eventType, // 'listing_viewed' | 'listing_saved' | 'search_executed'
    listingId: listingId ?? null,
    metadata: JSON.stringify(metadata ?? {}),
    occurredAt: new Date(),
  });
  return NextResponse.json({ ok: true });
}
```

### NLQ Parsing with generateObject
```typescript
// Source: Vercel AI SDK (ai package v6, already installed)
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const searchParamsSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBeds: z.number().optional(),
  maxBeds: z.number().optional(),
  propertyType: z.enum(['single_family','condo','townhouse','land_lot']).optional(),
  minSqft: z.number().optional(),
});

export async function parseNaturalLanguageQuery(query: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: searchParamsSchema,
    prompt: `Parse this property search into structured filters.
             Only extract objective features (price, beds, baths, sqft, type, location).
             Do not include school quality, neighborhood scores, or demographic signals.
             Query: "${query}"`,
  });
  return object; // Type: z.infer<typeof searchParamsSchema>
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Destination charges (agent as merchant) | Separate charges + transfers | Stripe Connect best practices 2023+ | Platform keeps merchant of record; cleaner 1099-K reporting |
| Stripe Connect v1 KYC | Stripe Connect v2 API for verification | August 2025 | Must use v2 for new accounts; v1 deprecated for KYC |
| BM25 keyword search | pgvector HNSW cosine similarity | 2023-2024 | Semantic matching outperforms keyword for natural language queries |
| text-embedding-ada-002 | text-embedding-3-small / 3-large | Early 2024 | 3-small is cheaper and more accurate than ada-002; already used in Phase 2 chatbot |

**Deprecated/outdated:**
- `stripe.account.create({ type: 'express' })` for KYC verification: v1 API only; v2 uses `controller` object — but `type: 'express'` is still valid for account creation (non-KYC operations)
- RETS (Real Estate Transaction Standard): Legacy MLS format; replaced by RESO Web API 2.0 (relevant for Phase 6, not Phase 5)

---

## Open Questions

1. **ARELLO subscription timing and pricing**
   - What we know: ARELLO LVWS v2.0 exists, covers 45 jurisdictions, has a paid API
   - What's unclear: Pricing, time to activate subscription, response format (XML/JSON)
   - Recommendation: Contact ARELLO during Phase 4. Build manual verification fallback for MVP. Plan file should include a manual admin-verification path gated by `license_verified = true` flag.

2. **Agent fee amount (AGNT-03 "nominal flat fee")**
   - What we know: The requirement says "nominal flat fee per contract signing"; `agentForHireFee` is already in `TransactionFees` but hardcoded to 0
   - What's unclear: What dollar amount? Industry rate for limited-scope representation is $200-$800
   - Recommendation: Planner should define a constant `AGENT_FOR_HIRE_FEE_CENTS` (suggest starting at $50000 = $500) as a single source of truth in `src/lib/constants.ts`, same pattern as `ATTORNEY_FEE_CENTS`

3. **Which additional states for state expansion (ROADMAP says states 11-30)**
   - What we know: 10 launch states are CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL
   - What's unclear: Which 15-20 additional states and prioritization
   - Recommendation: Priority by transaction volume + FSBO-friendliness: WA, CO, OR, NV, TN, MI, MN, WI, MO, IN, VA, MD, NJ, CT, MA — avoid attorney-mandatory states without agent pipeline confirmed

4. **Stripe Connect v2 vs v1 for this use case**
   - What we know: Stripe deprecating v1 KYC in August 2025; `type: 'express'` is v1 pattern
   - What's unclear: Whether Express accounts with `type` param still work post-August 2025 for NON-KYC operations
   - Recommendation: Use `type: 'express'` for account creation (still valid); avoid the deprecated KYC verification endpoints. Monitor Stripe changelog.

---

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `/Users/roybomb/Desktop/RealEstateHunter/vitest.config.ts` |
| Quick run command | `npx vitest run src/services/agent/ src/services/matching/ src/inngest/functions/dispatch-agent.ts src/inngest/functions/recommend-listings.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGNT-01 | Agent profile create + Stripe account ID stored | unit | `npx vitest run src/services/agent/agent-profile.test.ts` | ❌ Wave 0 |
| AGNT-02 | Agent dispatch selects available agent for state, creates request | unit | `npx vitest run src/services/agent/agent-dispatch.test.ts` | ❌ Wave 0 |
| AGNT-03 | Stripe transfer called with correct amount + destination | unit (mock Stripe) | `npx vitest run src/inngest/functions/dispatch-agent.test.ts` | ❌ Wave 0 |
| AGNT-04 | ARELLO verification result stored in agent_license_checks | unit (mock ARELLO) | `npx vitest run src/services/agent/license-verification.test.ts` | ❌ Wave 0 |
| AGNT-05 | calculateTransactionFees returns non-zero agentForHireFee for agent-required states | unit | `npx vitest run src/services/fees/transaction-fees.test.ts` | ✅ Exists (extend) |
| MTCH-01 | POST /api/buyer-events inserts row in buyer_events | unit | `npx vitest run src/services/matching/buyer-events.test.ts` | ❌ Wave 0 |
| MTCH-02 | Preference profile query returns ranked listing IDs | unit (mock pgvector) | `npx vitest run src/services/matching/listing-recommendations.test.ts` | ❌ Wave 0 |
| MTCH-03 | NLQ parser returns valid SearchParams from plain English query | unit | `npx vitest run src/services/search/nlq-parser.test.ts` | ❌ Wave 0 |
| MTCH-04 | Inngest recommend-listings fires for users with events in past 30 days | unit | `npx vitest run src/inngest/functions/recommend-listings.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/services/agent/ src/services/matching/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/agent/agent-profile.test.ts` — covers AGNT-01
- [ ] `src/services/agent/agent-dispatch.test.ts` — covers AGNT-02
- [ ] `src/services/agent/license-verification.test.ts` — covers AGNT-04
- [ ] `src/services/matching/buyer-events.test.ts` — covers MTCH-01
- [ ] `src/services/matching/listing-recommendations.test.ts` — covers MTCH-02
- [ ] `src/services/search/nlq-parser.test.ts` — covers MTCH-03
- [ ] `src/inngest/functions/dispatch-agent.test.ts` — covers AGNT-02/03
- [ ] `src/inngest/functions/recommend-listings.test.ts` — covers MTCH-04
- [ ] Framework install: `npm install stripe` — Stripe SDK not yet in package.json

---

## DB Schema Additions Required

These new tables must be added to `src/db/schema.ts` and migrated:

```
agent_profiles          — agentId, userId, stripeAccountId, licenseState[], verified, availableForDispatch
agent_license_checks    — agentId, state, arelloResult JSON, verifiedAt, expiresAt, method (arello|manual)
agent_requests          — transactionId, agentId, state, status (pending|accepted|completed), requestedAt, acceptedAt
buyer_events            — userId, eventType, listingId?, metadata JSON, occurredAt (append-only)
```

Raw SQL migrations needed:
- `ALTER TABLE listings ADD COLUMN embedding vector(1536);` (pgvector already enabled)
- No new extension install needed (pgvector active since Phase 2)

---

## Key Integration Points with Existing Code

| Existing Code | Phase 5 Hook |
|---------------|--------------|
| `src/services/fees/transaction-fees.ts` — `agentForHireFee: 0` placeholder | Wire in real fee: `agentForHireFee = stateConfig.agentRequired ? AGENT_FOR_HIRE_FEE_CENTS : 0` |
| `src/workflow/engine.ts` — `attorney_review` state | Add entry action: fire `transaction/agent.dispatch.requested` Inngest event |
| `src/workflow/states/*.ts` — `StateWorkflowConfig` | Add `agentRequired: boolean` field (currently uses `attorneyReferralRequired` as proxy) |
| `src/inngest/functions/match-saved-searches.ts` | Copy pattern for `recommend-listings.ts` (cron, fan-out per user, Resend email) |
| `src/services/search/listings-search.ts` — `searchListings(params)` | NLQ parser output passes directly to this function |
| Phase 2 pgvector migration (`vector(1536)` on knowledgeChunks) | Same pattern for `embedding` column on listings and buyer_preference_profiles |

---

## Sources

### Primary (HIGH confidence)
- Stripe Express Accounts docs — https://docs.stripe.com/connect/express-accounts — account creation, onboarding, transfer model
- Stripe Separate Charges and Transfers — https://docs.stripe.com/connect/separate-charges-and-transfers — flat-fee payout pattern
- ARELLO LVWS v2.0 documentation — https://www.arello.com/docs/ARELLO-LVWSv2-Documentation.pdf — license verification API
- Supabase pgvector semantic search — https://supabase.com/docs/guides/ai/semantic-search — embedding + cosine similarity pattern (same Supabase instance in use)
- HUD Fair Housing + AI Guidance (2024) — https://www.consumerfinancialserviceslawmonitor.com/2024/05/hud-issues-guidance-on-applicability-of-the-fair-housing-act-to-tenant-screening-and-housing-related-advertising-that-relies-upon-algorithms-and-ai/ — algorithmic discrimination constraints
- Existing project source code — `/Users/roybomb/Desktop/RealEstateHunter/src/` — schema, workflow engine, Inngest patterns, fee service

### Secondary (MEDIUM confidence)
- Stripe Connect end-to-end marketplace guide — https://docs.stripe.com/connect/end-to-end-marketplace — verified against official Stripe docs
- VectorHub NLQ for real estate search — https://superlinked.com/vectorhub/articles/real-estate-nlq-agent — semantic NLQ patterns in property search context

### Tertiary (LOW confidence — flag for validation)
- ARELLO API pricing: not publicly documented; requires sales contact — treat subscription timeline as uncertain
- Stripe Connect v2 exact deprecation scope: August 2025 deadline confirmed but exact endpoint list needs verification against Stripe changelog before implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries except Stripe are already installed and battle-tested in this project
- Architecture patterns: HIGH — Stripe Connect express + transfers is official documented pattern; pgvector similarity matches existing Phase 2 implementation
- ARELLO verification: MEDIUM — API confirmed to exist, coverage confirmed, pricing/timeline uncertain
- Fair Housing constraints: HIGH — HUD 2024 guidance is official and directly applicable
- Pitfalls: HIGH — most derived from existing STATE.md decisions and direct analysis of the codebase

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (Stripe Connect API — monitor for v2 migration notes; ARELLO — contact sales asap)

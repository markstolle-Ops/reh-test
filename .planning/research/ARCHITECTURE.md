# Architecture Research

**Domain:** AI-powered real estate transaction platform (two-sided marketplace, 50-state legal compliance, multi-agent AI)
**Researched:** 2026-03-15
**Confidence:** MEDIUM — Pattern-based from major PropTech platforms (Rightmove, REA Group, Anywhere Real Estate, Homegate) and McKinsey agentic AI research. RealEstateHunter's specific combination of full-agent-replacement + 50-state compliance + agent-for-hire marketplace is novel; no direct comparable to copy from.

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Buyer App   │  │  Seller App  │  │  Agent       │  │  Admin      │ │
│  │  (Next.js)   │  │  (Next.js)   │  │  Marketplace │  │  Dashboard  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
┌─────────┴─────────────────┴─────────────────┴─────────────────┴─────────┐
│                          API GATEWAY / BFF                               │
│  Auth (Clerk/NextAuth) · Rate Limiting · Request Routing                 │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────────────┐
│                         CORE SERVICE LAYER                               │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  ┌────────────────┐ │
│  │  Listing   │  │   User &   │  │  Transaction  │  │  Agent-for-    │ │
│  │  Service   │  │  Auth Svc  │  │  Service      │  │  Hire Service  │ │
│  └────────────┘  └────────────┘  └───────────────┘  └────────────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  ┌────────────────┐ │
│  │  Search    │  │  Workflow  │  │  Document     │  │  Fee/Pricing   │ │
│  │  Service   │  │  Engine   │  │  Service      │  │  Service       │ │
│  └────────────┘  └────────────┘  └───────────────┘  └────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────────┐
│                        AI ORCHESTRATION LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Marketing   │  │   Matching   │  │  Transaction │  │ Negotiation │ │
│  │  AI Agent   │  │   AI Agent   │  │  Guide Agent │  │  AI Agent   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              AI Orchestrator (LangGraph / Anthropic SDK)         │   │
│  │  RAG Engine · State-Law Knowledge Base · Comps Vector Store      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────────┐
│                        DATA & INTEGRATION LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  ┌────────────────────┐ │
│  │ PostgreSQL │  │   S3 +     │  │  Elastic- │  │  MLS / RESO API    │ │
│  │ (primary)  │  │ CloudFront │  │  search   │  │  (IDX feed layer)  │ │
│  └────────────┘  └────────────┘  └───────────┘  └────────────────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐                         │
│  │  Pinecone  │  │  Redis     │  │  Stripe   │                         │
│  │(vector DB) │  │  (cache/   │  │(payments) │                         │
│  └────────────┘  │   queues)  │  └───────────┘                         │
│                  └────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Listing Service | CRUD for properties, photo upload, AI-generated marketing copy | Node.js/Express or Next.js API routes |
| Search Service | Property discovery, geospatial queries, saved searches, buyer alerts | Elasticsearch with geo_point indexing |
| User & Auth Service | Buyer/seller/agent accounts, roles, KYC where required | Clerk or NextAuth + PostgreSQL |
| Workflow Engine | State-by-state legal step tracking, deadline management, task sequencing | State machine (XState) backed by PostgreSQL |
| Transaction Service | Offer lifecycle, counteroffer tracking, acceptance/rejection, milestone tracking | Event-sourced PostgreSQL or append-only log |
| Document Service | Contract generation, e-signature routing, PDF storage, audit trail | DocuSign API or HelloSign SDK + S3 |
| Agent-for-Hire Service | Licensed agent marketplace, availability, state-scoped matching, payment | Custom marketplace + Stripe Connect |
| Fee/Pricing Service | Cost-benefit calculator, transparent fee breakdowns, commission comparisons | Pure compute service, no external deps |
| AI Orchestrator | Routes user intent to correct specialist agent, manages context, escalation | LangGraph or Anthropic Agent SDK |
| Marketing AI Agent | Generates listing descriptions, social posts, pricing guidance for sellers | LLM (Claude) + listing data context |
| Matching AI Agent | Matches buyers to listings, sends alerts, refines on feedback | LLM + Elasticsearch query generation |
| Transaction Guide Agent | Walks users through state-specific steps, deadlines, and required documents | LLM + RAG over state law knowledge base |
| Negotiation AI Agent | Analyzes comps, suggests offer price, models counter strategies | LLM + vector search over comparable sales |
| RAG / State-Law KB | Grounded knowledge of each state's disclosure requirements, attorney rules, etc. | Pinecone or pgvector + curated legal content |
| MLS / IDX Feed Layer | Ingests RESO Web API feeds, normalizes to internal schema, refreshes on cadence | Cron jobs + data pipeline (ETL) |
| Photo Management | Multi-file upload, resizing, CDN delivery, ordering | S3 presigned URLs + Lambda + CloudFront |

---

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router (UI + API routes)
│   ├── (buyer)/                # Buyer-facing pages and flows
│   ├── (seller)/               # Seller-facing pages and flows
│   ├── (agent)/                # Agent-for-hire portal
│   ├── (admin)/                # Internal admin dashboard
│   └── api/                    # API route handlers (BFF layer)
│       ├── listings/
│       ├── search/
│       ├── transactions/
│       ├── documents/
│       ├── workflow/
│       ├── agents/
│       └── ai/
├── services/                   # Business logic (framework-agnostic)
│   ├── listing/
│   ├── search/
│   ├── transaction/
│   ├── workflow/
│   ├── documents/
│   ├── agent-marketplace/
│   ├── pricing/
│   └── mls-feed/
├── ai/                         # AI orchestration and agents
│   ├── orchestrator.ts         # Main agent router
│   ├── agents/
│   │   ├── marketing.ts
│   │   ├── matching.ts
│   │   ├── transaction-guide.ts
│   │   └── negotiation.ts
│   ├── rag/
│   │   ├── state-law-kb/       # Per-state legal knowledge chunks
│   │   ├── comps-store/        # Comparable sales vector store
│   │   └── ingest/             # Scripts to populate/update KB
│   └── prompts/                # Versioned prompt templates
├── workflow/                   # State machine definitions
│   ├── states/                 # Per-state workflow configs (50 files)
│   ├── templates/              # Shared workflow step templates
│   └── engine.ts               # XState machine runner
├── integrations/               # External service adapters
│   ├── mls/                    # RESO Web API client + normalizer
│   ├── docusign/
│   ├── stripe/
│   └── photo-upload/
├── db/                         # Database schema and migrations
│   ├── schema/
│   └── migrations/
└── lib/                        # Shared utilities
    ├── auth/
    ├── validation/
    └── constants/
```

### Structure Rationale

- **ai/**: Isolating all AI logic lets you swap LLM providers (Claude, GPT-4, Gemini) without touching service code. Agents are co-located with their prompts.
- **workflow/states/**: One config file per state makes the legal engine auditable and independently updatable without touching business logic.
- **services/**: Pure TypeScript business logic with no framework imports — testable in isolation, portable if you ever split into microservices.
- **integrations/**: Adapter pattern. All external API coupling lives here; services never import Stripe or DocuSign directly.

---

## Architectural Patterns

### Pattern 1: State Machine for Legal Workflow Engine

**What:** Model each state's transaction workflow as a finite state machine. Each state (Alabama, Alaska, etc.) has a config file defining steps, required documents, deadlines, and branching rules (e.g., "attorney required at closing" = true for Georgia).

**When to use:** Any multi-step process with hard ordering rules, legal compliance requirements, and audit needs. The state machine makes illegal state transitions impossible by construction.

**Trade-offs:** More upfront configuration work per state; pays off in reliability and auditability.

**Example:**
```typescript
// workflow/states/georgia.ts
export const georgiaWorkflow = {
  stateCode: 'GA',
  attorneyRequired: true,
  steps: [
    { id: 'listing_live', label: 'Listing Published', required: ['listing_photos', 'disclosure_ga'] },
    { id: 'offer_received', label: 'Offer Received', triggers: ['notify_seller', 'ai_negotiation'] },
    { id: 'offer_accepted', label: 'Offer Accepted', triggers: ['create_contract', 'notify_agent_hire'] },
    { id: 'attorney_review', label: 'Attorney Review Period', daysAllowed: 3, required: ['attorney_assigned'] },
    { id: 'due_diligence', label: 'Inspection / Due Diligence', daysAllowed: 10 },
    { id: 'closing_scheduled', label: 'Closing Scheduled', required: ['title_cleared', 'attorney_confirmed'] },
    { id: 'closed', label: 'Transaction Closed', triggers: ['release_payment', 'archive_documents'] },
  ],
}
```

### Pattern 2: Specialist AI Agents with Shared Orchestrator

**What:** Build four narrow AI agents (marketing, matching, transaction guide, negotiation), each with a focused system prompt and domain-specific RAG context. A top-level orchestrator routes user intent to the right agent. Agents share a conversation session context but have separate knowledge retrieval pipelines.

**When to use:** When different tasks require different grounding data and different behavior constraints. A negotiation agent needs comps data; a marketing agent needs listing details and tone guidelines. Mixing them degrades both.

**Trade-offs:** More infrastructure to maintain; significantly better accuracy and controllability than a single monolithic agent.

**Example:**
```typescript
// ai/orchestrator.ts
async function routeMessage(userMessage: string, sessionContext: SessionContext) {
  const intent = await classifyIntent(userMessage) // 'marketing' | 'matching' | 'guidance' | 'negotiation'

  switch (intent) {
    case 'negotiation':
      return negotiationAgent.respond(userMessage, {
        ...sessionContext,
        comps: await fetchComps(sessionContext.propertyId),
        stateRules: await fetchStateRules(sessionContext.state),
      })
    case 'guidance':
      return transactionGuideAgent.respond(userMessage, {
        ...sessionContext,
        workflow: await fetchCurrentWorkflowState(sessionContext.transactionId),
        stateLaw: await ragQuery(userMessage, 'state-law-kb', sessionContext.state),
      })
    // ...
  }
}
```

### Pattern 3: Event-Sourced Transaction Log

**What:** All transaction state changes are stored as immutable events (offer_submitted, counter_offered, accepted, document_signed, etc.) in an append-only log. Current state is derived from replaying events.

**When to use:** Legal/financial systems where full audit trail is required, disputes may need reconstruction, and regulatory compliance demands proof of every state change.

**Trade-offs:** More complex than simple CRUD; audit trail is invaluable when a deal goes sideways and lawyers get involved.

---

## Data Flow

### Request Flow: Buyer Searches for Property

```
Buyer enters search criteria (location, price, beds, etc.)
    ↓
Next.js API Route /api/search
    ↓
Search Service → Elasticsearch (geo_point + filtered query)
    ↓
Results ranked by relevance, price, match score
    ↓
Matching AI Agent (optional: explain why each listing matches buyer profile)
    ↓
Response with listings + AI summaries → Buyer UI
```

### Request Flow: Seller Creates Listing

```
Seller fills listing form + uploads photos
    ↓
Next.js API Route /api/listings
    ↓
Photo Upload Service → S3 (presigned URL direct upload)
    ↓
Lambda trigger → resize images → store in S3 → CDN invalidation
    ↓
Listing Service saves listing metadata to PostgreSQL
    ↓
Marketing AI Agent generates listing description + pricing suggestion
    ↓
Workflow Engine initializes state-specific workflow (e.g., georgiaWorkflow)
    ↓
Elasticsearch indexing job adds listing to search index
    ↓
Buyer Alert Service notifies matching saved searches
```

### Request Flow: Offer / Negotiation Cycle

```
Buyer submits offer amount via UI
    ↓
Transaction Service creates offer record (event: offer_submitted)
    ↓
Negotiation AI Agent fetches comps → generates offer analysis
    ↓
Seller receives notification + AI-powered response suggestions
    ↓
Seller submits counteroffer (event: counter_offered)
    ↓
Workflow Engine advances state machine step
    ↓
If accepted (event: offer_accepted):
    → Document Service generates purchase agreement for this state
    → Agent-for-Hire Service checks if state requires licensed agent signature
    → DocuSign routing initiated
    → Transaction Guide Agent activated for closing sequence
```

### Request Flow: AI Transaction Guidance

```
User asks: "What do I need to do next in Georgia?"
    ↓
AI Orchestrator classifies intent → routes to Transaction Guide Agent
    ↓
Transaction Guide Agent fetches:
  - Current workflow state (PostgreSQL)
  - State-law RAG context (Pinecone query: "Georgia closing requirements attorney")
  - Outstanding documents (Document Service)
    ↓
LLM generates grounded, specific guidance with cited steps
    ↓
Response to user with next actions + document links
```

### Key Data Flows Summary

1. **Listings → Search Index**: Every listing create/update triggers async Elasticsearch re-index. Not synchronous — search shows results within seconds, not milliseconds.
2. **MLS Feed → Listings**: Nightly (or hourly) ETL job pulls RESO Web API data, normalizes to internal schema, upserts to PostgreSQL + Elasticsearch. Platform-owned listings take precedence over MLS data on duplicates.
3. **AI Agent → RAG**: Agents never call the LLM with raw user messages. They always fetch relevant context from RAG stores first, prepend as system context, then call the LLM. This prevents hallucination on legal/compliance claims.
4. **State Machine → Notifications**: Every workflow state transition emits an event (via Redis pub/sub or SQS). Notification service subscribes and sends email/SMS/in-app alerts.
5. **Transaction Events → Audit Log**: Every financial or legal action appends to an immutable event log in PostgreSQL. Never overwrite; always append.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Monolith is fine. Single Next.js app on Vercel + managed PostgreSQL (Supabase/Neon) + Elasticsearch Cloud starter. Don't over-engineer. |
| 1k–100k users | Extract MLS ingestion pipeline as a standalone service. Move AI agent calls to a background queue (Inngest or BullMQ). Add Redis caching for search results. |
| 100k+ users | Consider splitting Listing Service and Transaction Service into separate deployments. Elasticsearch cluster scaling. Dedicated AI service with load balancing across LLM API calls. |

### Scaling Priorities

1. **First bottleneck: AI API latency and cost.** LLM calls are slow (2–8 seconds) and expensive. Move chatbot responses to streaming. Cache frequently asked questions. Add background processing for non-real-time requests (listing description generation, daily comps analysis).

2. **Second bottleneck: MLS feed ingestion throughput.** When integrating multiple regional MLSs, feed normalization becomes a heavy background job. Move to a dedicated worker service with rate limiting and retry logic early.

3. **Third bottleneck: Elasticsearch under heavy write load.** During MLS ingestion, thousands of documents update simultaneously. Use index aliases with zero-downtime swap pattern instead of in-place updates.

---

## Anti-Patterns

### Anti-Pattern 1: Single Monolithic AI Agent

**What people do:** Build one "real estate AI assistant" that handles marketing questions, legal guidance, negotiation advice, and buyer matching in a single system prompt and single RAG store.

**Why it's wrong:** Retrieval quality collapses when a single vector store contains listing descriptions, state law statutes, comparable sales data, and negotiation scripts. The agent hallucinates legal guidance when marketing content contaminates retrieval. Different tasks require different temperature settings, guardrails, and grounding data.

**Do this instead:** Four specialist agents, each with a purpose-built RAG context and narrow system prompt. Route at the orchestrator level.

### Anti-Pattern 2: Hard-Coding State Requirements

**What people do:** Write if-else logic for state-specific rules in the application code (e.g., `if (state === 'GA') requireAttorney = true`).

**Why it's wrong:** Real estate law changes. Hard-coded rules require code deploys to update. You'll accumulate 50-state conditional logic spread across the codebase. Auditing which rules apply to which state becomes impossible.

**Do this instead:** Data-driven workflow configs per state (one JSON/TypeScript config file per state). The engine interprets configs; it never encodes business rules directly. Legal team can review config files without reading code.

### Anti-Pattern 3: Building MLS Direct Integration First

**What people do:** Spend the first month negotiating MLS data agreements and building a custom RETS/RESO integration before the platform has any users.

**Why it's wrong:** MLS agreements require broker licenses in many jurisdictions. Negotiations take months. RETS is deprecated; you'll be migrating to RESO Web API before launch anyway. Users can still post listings manually.

**Do this instead:** Ship MVP with user-uploaded listings only. Add a middleware IDX vendor (SimplyRETS, iHomeFinder, or Spark API) as the first MLS integration layer. Negotiate direct MLS feeds as a Phase 3+ activity once you have users and leverage.

### Anti-Pattern 4: Synchronous AI Responses for Complex Tasks

**What people do:** Make the user wait for the LLM to generate a full listing description, run comps analysis, and draft a negotiation strategy in a single synchronous HTTP request.

**Why it's wrong:** LLM calls for multi-step tasks take 5–30 seconds. HTTP timeouts, poor UX, and wasted compute on abandoned requests.

**Do this instead:** Enqueue AI tasks to a job queue (Inngest or BullMQ). Stream simple conversational responses. Show a "Generating your listing description..." spinner with a webhook callback. Deliver results via WebSocket or polling.

### Anti-Pattern 5: Building the Agent-for-Hire Marketplace in Phase 1

**What people do:** Scope all four user types (buyer, seller, licensed agent, admin) into the MVP.

**Why it's wrong:** The agent-for-hire feature requires licensed agent onboarding, state-scoped availability logic, background checks, Stripe Connect for agent payouts, and legal review of the model per state. It is a second product inside the first product.

**Do this instead:** Build the platform for buyers and sellers first. Hard-code a "contact us to connect with an agent" CTA in states requiring agent involvement. Launch the marketplace in Phase 3+ when you have transaction volume to attract agents.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| SimplyRETS / Spark API | REST pull, nightly ETL cron | Middleware IDX vendors — broker license required for data agreement. Start here before direct MLS integration. |
| RESO Web API (direct MLS) | OData/REST pull, incremental sync | Phase 3+. Requires IDX agreement per MLS board. Use RESO Data Dictionary 2.0 for normalization. RETS is deprecated — do not build new RETS integrations. |
| AWS S3 + CloudFront | Direct browser upload via presigned URL + Lambda trigger for resize | Never proxy photo uploads through your server. Generate presigned URLs server-side, upload client-to-S3 directly. |
| Anthropic Claude API | LLM backbone for all 4 agents | Streaming for chat, async jobs for batch generation. Version your prompts — model behavior changes across API versions. |
| Pinecone (or pgvector) | Vector similarity search for RAG retrieval | pgvector is simpler for early stage; Pinecone scales better. Start with pgvector if already using PostgreSQL. |
| DocuSign or HelloSign | Server-side envelope creation, webhook on signing events | Docusign has more MLS/real-estate integrations. HelloSign is simpler API but fewer real-estate-specific templates. |
| Stripe + Stripe Connect | Platform fees (Stripe Payments) + agent payouts (Stripe Connect) | Stripe Connect required for the agent marketplace. Marketplace funds flow requires connected accounts. |
| Clerk or Auth.js | Authentication, role management (buyer/seller/agent/admin) | Clerk handles multi-role JWTs cleanly. NextAuth (Auth.js) is free but requires more custom role logic. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI App ↔ API Routes | HTTP (Next.js server actions or REST) | Use server actions for form mutations; REST for data fetching |
| Services ↔ Database | Direct Prisma/Drizzle queries | Services own their DB tables; no cross-service DB queries |
| Services ↔ AI Orchestrator | Async job queue (Inngest/BullMQ) for non-real-time; direct call for chat | Never make AI calls inside a user-facing API route synchronously |
| Workflow Engine ↔ Services | Event bus (Redis pub/sub or SQS) | State machine emits events; services subscribe — loose coupling |
| MLS Feed Layer ↔ Listing Service | Scheduled ETL, writes to staging table first | Staging → review → promote prevents bad MLS data corrupting live search |
| AI Agents ↔ RAG Store | RAG query before every LLM call | Agents are stateless; context is assembled fresh on each request from RAG + session state |

---

## Build Order (Component Dependencies)

The dependency graph drives phase sequencing:

```
Phase 1 (Foundation):
  User Auth → Listing Service → Photo Upload → Search (basic) → Fee Calculator

Phase 2 (AI Core):
  RAG Knowledge Base → AI Orchestrator → Marketing Agent → Matching Agent

Phase 3 (Transaction Engine):
  Workflow Engine (state configs) → Transaction Service (event log) → Document Service → Transaction Guide Agent → Negotiation Agent

Phase 4 (Compliance & Marketplace):
  State Compliance Verification → Agent-for-Hire Service → Stripe Connect

Phase 5 (Scale):
  MLS Direct Integration → Advanced Search → Buyer Alert System → Performance Optimization
```

Key dependency rules:
- **Workflow Engine requires state configs** — do not build the engine before at least 5 state configs are validated with legal review
- **AI agents require RAG stores** — do not launch agents without grounded knowledge bases; ungrounded agents hallucinate legal guidance with liability implications
- **Agent-for-hire marketplace requires transaction engine** — agents are only needed when a transaction reaches a state-required step; you need the transaction lifecycle working first
- **MLS integration requires IDX agreement** — do not start building the integration until the agreement is signed; use user-uploaded listings to launch

---

## Sources

- [How agentic AI can reshape real estate's operating model — McKinsey](https://www.mckinsey.com/industries/real-estate/our-insights/how-agentic-ai-can-reshape-real-estates-operating-model)
- [Elasticsearch and Rightmove: Mapping Out Your New Home With Search — Elastic Blog](https://www.elastic.co/blog/elasticsearch-and-rightmove-mapping-out-your-new-home-with-search)
- [How Anywhere Real Estate modernizes with AWS — AWS Blog](https://aws.amazon.com/blogs/media/how-anywhere-real-estate-is-modernizing-property-search-marketing-and-transaction-experiences-with-aws/)
- [AI Agent Orchestration Patterns — Azure Architecture Center / Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [RESO Web API — Real Estate Standards Organization](https://www.reso.org/reso-web-api/)
- [SimplyRETS Developer API — RETS and RESO Web API MLS Integration](https://simplyrets.com/idx-developer-api)
- [RAG for Legal Work — Harvard Journal of Law & Technology](https://jolt.law.harvard.edu/digest/retrieval-augmented-generation-rag-towards-a-promising-llm-architecture-for-legal-work)
- [Real Estate Data Integrations: MLS, IDX, RESO Web API — EVNE Developers](https://evnedev.com/blog/development/real-estate-data-integrations/)
- [50-State Real Estate Broker Licensing Compliance Guide — Harbor Compliance](https://www.harborcompliance.com/real-estate-license)
- [How REA Group Uses Elasticsearch to Power Real Estate Searches — Elastic](https://www.elastic.co/elasticon/tour/2015/sydney/rea-group-elasticsearch-powers-real-estate-searches)

---

*Architecture research for: AI-powered real estate transaction platform*
*Researched: 2026-03-15*

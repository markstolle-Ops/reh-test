# Project Research Summary

**Project:** RealEstateHunter
**Domain:** AI-powered residential real estate transaction platform (agent replacement, two-sided marketplace, 50-state compliance)
**Researched:** 2026-03-15
**Confidence:** MEDIUM-HIGH (legal/regulatory HIGH, stack HIGH, architecture MEDIUM — novel product combination with no direct comparable)

## Executive Summary

RealEstateHunter is an AI-powered FSBO transaction platform that replaces the traditional real estate agent. The product sits in a category between Houzeo (flat-fee MLS listing only) and Redfin (full-service with employed agents): it provides sellers end-to-end transaction guidance, AI-generated marketing copy, state-specific legal workflows, and a licensed agent-for-hire marketplace for the minority of steps that legally require human professional involvement. No existing competitor does all of this at once. The recommended build approach is a Next.js 15 monolith with Supabase Postgres, Vercel AI SDK for streaming AI agents, XState for the state-by-state compliance workflow engine, Clerk for multi-role auth, and Stripe Connect for marketplace payouts. The stack is well-established; the implementation complexity lies in the 50-state legal configuration and the AI guardrail architecture, not in the framework choices.

The single biggest risk is regulatory, not technical. Five Phase 1 pitfalls — unauthorized practice of law, operating without a broker license, MLS IDX access requirements, attorney-state workflow gaps, and RESPA anti-kickback violations — can each shut the platform down before it achieves product-market fit. Legal counsel must be engaged before any AI guidance feature ships, before any state goes live, and before any partner monetization is signed. The technology must be built around a legal framework that is designed first, not bolted on after. This is the defining constraint that shapes the entire roadmap.

The architecture follows a proven PropTech pattern: four specialist AI agents (marketing, matching, transaction guide, negotiation) routed by a top-level orchestrator, a data-driven state machine with one config file per state, an immutable event log for all transaction actions, and a clean adapter layer for all external integrations (MLS, DocuSign, Stripe). The agent-for-hire marketplace should be treated as a separate product phase, not an MVP feature — it requires licensed agent onboarding, Stripe Connect, and per-state legal structuring that will delay and complicate the core transaction product if scoped into Phase 1.

## Key Findings

### Recommended Stack

See [STACK.md](.planning/research/STACK.md) for full details.

The stack is Next.js 15 (App Router, ISR for listing pages, co-located API routes), TypeScript 5, Drizzle ORM on Supabase Postgres (PostGIS for geospatial search, pgvector for property similarity, RLS for multi-tenant isolation), and Tailwind CSS v4 with shadcn/ui. The AI layer uses Vercel AI SDK v6 (edge-compatible, streaming-native, 25+ provider integrations) with OpenAI GPT-4o for complex tasks and GPT-4o-mini for high-frequency chat. Background jobs run via Inngest (serverless durable functions for MLS sync, async AI generation, buyer alert matching). State-by-state legal workflows are modeled with XState 5.

**Core technologies:**
- **Next.js 15 + TypeScript 5**: Full-stack framework with ISR for listing pages — server components enable SEO for listing URLs; TypeScript is non-negotiable for a compliance state machine with complex legal business logic
- **Supabase Postgres (PostGIS + pgvector)**: Geographic property search and semantic similarity search in a single managed database; eliminates separate vector DB for the scale needed at MVP
- **Vercel AI SDK v6**: Streaming AI agents native to Next.js; LangChain.js is NOT edge-compatible and should be avoided for all chat/streaming routes
- **Clerk**: Multi-role auth with built-in organization support for broker team accounts in the agent marketplace; Supabase Auth is cheaper at scale but lacks org management
- **XState 5**: Explicit state machine for the 50-state workflow engine; makes illegal state transitions impossible by construction; auditable by non-engineers
- **Stripe Connect**: Marketplace payouts to licensed agents-for-hire; required for the agent marketplace phase
- **Cloudflare R2 + Cloudflare Images**: Zero-egress photo storage + on-the-fly transformation; photo-heavy listings make egress-free critical for unit economics
- **DocuSign eSignature API**: NAR-partnered, legally binding under federal E-SIGN act; start with SignWell free tier for cost control in MVP
- **Inngest**: Serverless durable functions for MLS sync, async AI listing generation, buyer alert matching — avoids managing worker processes on Vercel

**Critical version notes:**
- Use Drizzle ORM 0.45.x stable, NOT 1.0.0-beta (breaking changes in Feb 2025)
- XState 5.x is a full rewrite; do not mix v4 and v5 APIs
- Vercel AI SDK v6 provider packages must match the major SDK version

### Expected Features

See [FEATURES.md](.planning/research/FEATURES.md) for full details, including the competitor analysis table.

**Must have (table stakes):**
- User accounts with buyer and seller roles — nothing else persists without this
- Property listing creation with photo upload — core seller action
- AI listing description generator from photos — the primary differentiator and #1 friction removal for sellers
- Flat-fee MLS listing via broker partner (Houzeo model) — listings not on MLS sell slower and for less; non-negotiable for seller value
- Buyer property search with filters + saved searches and alerts — core buyer retention mechanism
- Home value estimate (AVM integration) — sellers cannot price without this
- State-specific disclosure forms (10 highest-volume states first: CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL)
- Basic state-specific transaction checklist — replaces "what happens next" guidance from an agent
- Digital document signing (eSignature) — paper is not acceptable
- Cost-benefit calculator — first-page conversion tool; makes the savings concrete and personal
- AI chatbot for 24/7 property Q&A — eliminates the response latency gap that kills leads

**Should have (competitive differentiators):**
- AI negotiation assistant (comps + offer strategy) — requires ATTOM/HouseCanary data feed; add when transaction volume validates the need
- AI transaction coordinator (deadline tracking + document compliance) — add when first transactions reveal where deals fall apart
- Licensed agent-for-hire marketplace — solves the legal blocker in attorney-required states; treat as a separate phase
- RON (Remote Online Notarization) integration — 44 states allow it; cuts closing time ~1 week; add when digital closing demand appears in feedback
- AI buyer matching engine — add after listing inventory exists to make matching meaningful
- Expanded state coverage (all 50 states) — expand based on user demand geography, not day-one ambition

**Defer (v2+):**
- Commercial real estate — different regulatory landscape; out of scope
- Rental/leasing — different compliance framework; different product
- iBuyer / instant cash offers — requires platform capital; refer to Opendoor/Offerpad instead
- International expansion — US state law complexity is already the bottleneck
- Agent performance ratings — Fair Housing Act caution; add only when agent marketplace has volume

**Anti-features to explicitly avoid:**
- Real-time buyer-seller direct chat (Fair Housing liability, negotiation missteps)
- Automated legal advice in any form (unauthorized practice of law in every state)
- Aggressive email/SMS drip campaigns (TCPA violations, brand damage in high-trust market)
- Social commentary on properties (Fair Housing Act severely restricts property-level commentary)

### Architecture Approach

See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for full system diagram and data flow details.

The architecture organizes into four layers: (1) a Next.js App Router client/BFF layer with role-based route groups for buyer, seller, agent, and admin; (2) a service layer with framework-agnostic TypeScript business logic in `services/`; (3) an AI orchestration layer with four specialist agents routed by an intent classifier; and (4) a data/integration layer with Postgres as the system of record, Elasticsearch for listing search, and an adapter pattern for all external APIs. The key architectural insight is that the compliance state machine, the AI agents, and the integration adapters must each be independently maintainable — compliance law changes, LLM providers change, and integration APIs change. Building monolithic code that conflates these concerns creates a maintenance problem that will compound with each new state or AI capability added.

**Major components:**
1. **State Workflow Engine (XState + per-state config files)** — one TypeScript config file per state defines steps, required documents, deadlines, and attorney requirements; the engine interprets configs, never encodes business rules directly; legal team can review configs without reading application code
2. **AI Orchestration Layer (4 specialist agents + orchestrator)** — marketing agent (listing copy), matching agent (buyer-to-listing), transaction guide agent (state-specific RAG-grounded guidance), negotiation agent (comps + strategy); separate RAG stores per agent to prevent retrieval contamination
3. **Transaction Service (event-sourced append-only log)** — every offer, counter, acceptance, signature, and fund movement is an immutable event; never update, always append; required for legal audit trails and dispute resolution
4. **MLS/IDX Feed Layer (ETL with staging table)** — SimplyRETS or iHomeFinder as middleware IDX vendor; nightly/hourly RESO Web API pull normalized to internal schema; writes to staging first, then promotes to live search; never build against a direct RETS integration (deprecated)
5. **Document Service (DocuSign + presigned R2 storage)** — contract generation, e-signature routing, PDF storage, and immutable audit trail; timestamps all disclosure submissions as legal evidence
6. **Agent-for-Hire Service (Phase 3+)** — two-sided marketplace with Stripe Connect for payouts; state-scoped availability logic; requires transaction engine to exist first (agents are dispatched by state-machine step triggers)

### Critical Pitfalls

See [PITFALLS.md](.planning/research/PITFALLS.md) for full details, recovery strategies, and the "Looks Done But Isn't" checklist.

1. **Unauthorized Practice of Law (UPL)** — the AI will naturally answer "what should I do if X?" with substantive legal guidance; define a strict "permitted guidance vs. legal advice" taxonomy reviewed by real estate attorneys before any AI prompt ships; hard guardrails in system prompts; persistent attorney-referral redirect for legal questions; this is an existential risk if not addressed in Phase 1

2. **Platform broker licensing requirement** — 41 states require a licensed brokerage firm for the activities this platform performs; "we're just software" is not a valid defense; Redfin and Opendoor had to be licensed; obtain written legal opinion per state before that state goes live; licensing timelines are 60-120 days; this must be a Phase 1 legal architecture decision

3. **MLS/IDX access is blocked without broker membership** — there is no single national MLS feed; 600-900 regional MLS boards each require IDX agreements tied to broker membership; do not plan MVP around MLS data; launch with user-submitted listings + ATTOM/CoreLogic property data APIs; broker licensing (Pitfall 2) is also the unlock for MLS access

4. **AI hallucination on property-specific facts** — LLMs will confabulate square footage, zoning, school districts, and HOA rules with confident authority; property facts must always come from verified data APIs, never from AI generation; strict UI separation between "AI-generated content" and "data-verified content" with source attribution on every factual claim

5. **Fair Housing Act violations via buyer matching** — AI matching using "neighborhood quality," school ratings, or crime statistics as signals can constitute digital redlining; HUD explicitly covers AI algorithms under Fair Housing; civil rights attorney must review matching algorithm before first production run; audit logging on every matching decision required

6. **Wire fraud via platform communications** — real estate transactions involve large wire transfers; 17% of title companies have sent money to fraudulent accounts; never transmit wiring instructions via email; build authenticated in-app wire instruction display with MFA; this is a Phase 3 security architecture requirement before any real money moves

7. **RESPA anti-kickback violations** — referral fees from title companies, attorneys, or lenders are a federal crime (up to $10K fine + 1 year imprisonment per violation); revenue model must be RESPA-cleared by counsel before any partner agreements are signed; the agent marketplace requires careful structuring as a neutral marketplace, not a directed referral

8. **Cold start / marketplace liquidity failure** — national launch with no listings kills the platform; launch in one metro first; seed seller supply before opening to buyers; set a minimum listing threshold per market before buyer marketing begins

## Implications for Roadmap

Based on the research dependency graph (ARCHITECTURE.md) and the pitfall-to-phase mapping (PITFALLS.md), the suggested phase structure is:

### Phase 1: Legal Framework + Foundation
**Rationale:** Five of the ten critical pitfalls (UPL, broker licensing, RESPA, attorney-state classification, MLS data strategy) must be resolved before a single line of feature code is written. The legal architecture constrains every downstream technical decision. Simultaneously, core auth and data infrastructure are prerequisites for everything else.
**Delivers:** Legal opinion on 10 launch states, broker licensing strategy, AI guidance taxonomy, RESPA-cleared revenue model, attorney-state workflow classification, user auth (Clerk), database schema (Supabase + Drizzle), and project scaffolding (Next.js 15 + TypeScript + Tailwind v4 + shadcn)
**Addresses:** User accounts (buyer + seller roles), cost-benefit calculator (static, conversion-focused)
**Avoids:** UPL violation, operating without broker license, RESPA violation, attorney-state workflow failures
**Research flag:** NEEDS DEEP RESEARCH — broker licensing requirements are state-specific and change; engage real estate attorney before building; AI guidance taxonomy requires legal review, not just engineering judgment

### Phase 2: Listing Creation + AI Core
**Rationale:** Property listing creation is the core seller action and unlocks everything downstream. AI listing description generation is the primary differentiator — it should ship with the listing creation workflow, not as an afterthought. The AI agents must be built with RAG grounding and legal guardrails from day one; ungrounded agents have liability implications. MLS via flat-fee broker partner (not direct integration) enables the listings to reach buyers on Zillow/Realtor.com without requiring an IDX agreement.
**Delivers:** Property listing creation with photo upload (Cloudflare R2), AI listing description generator (Vercel AI SDK + GPT-4o), AVM integration (HouseCanary or ATTOM), flat-fee MLS via broker partner, seller dashboard, listing detail pages with ISR, AI chatbot for property Q&A with legal guardrails
**Uses:** Vercel AI SDK v6, OpenAI GPT-4o/mini, pgvector for embeddings, Inngest for async AI generation, Cloudflare R2 + Images for photo pipeline
**Implements:** Marketing AI Agent, initial RAG knowledge base, photo upload adapter
**Avoids:** AI hallucination on property facts (strict data source separation), UPL in AI chatbot (guardrails designed in Phase 1)
**Research flag:** STANDARD PATTERNS — Vercel AI SDK, photo upload to R2, and listing ISR are well-documented; MLS broker partner arrangements are established (Houzeo model)

### Phase 3: Buyer Discovery + Transaction Basics
**Rationale:** Once seller-side is working, buyer discovery enables the two-sided marketplace. Buyer search, saved alerts, and basic transaction workflow (disclosure forms, eSignature, transaction checklist) are the table-stakes features that let a deal reach closing. State-specific disclosure forms must be sourced and integrated before any state goes live — this is a legal requirement, not a feature enhancement. eSignature integration is commodity infrastructure.
**Delivers:** Buyer search with geographic filters (Mapbox GL JS), saved searches and alerts (Inngest for matching jobs), state-specific disclosure forms (10 launch states), transaction checklist (state-specific), eSignature integration (DocuSign or SignWell for MVP cost control), buyer inquiry and showing request flow
**Uses:** PostGIS for geo search, TanStack Query for client-side search interactions, DocuSign/SignWell adapter, React Hook Form + Zod for transaction forms
**Implements:** Search Service, Listing Alert Service, Document Service (basic)
**Avoids:** Disclosure form liability (state-specific forms, mandatory completion enforcement), missing transaction baseline that makes platform legally incomplete
**Research flag:** NEEDS TARGETED RESEARCH — state-specific disclosure form sourcing requires per-state legal review; confirm current form versions from state real estate commissions for each launch state

### Phase 4: Transaction Engine + State Compliance Workflows
**Rationale:** The state machine is the most complex and most critical custom component. It cannot be built before state configs are validated with legal review (at least 5 states before engine construction). The full offer-to-close workflow, negotiation assistant, AI transaction coordinator, and wire fraud security architecture all depend on this foundation. This phase is where the platform's core differentiation over Houzeo becomes tangible.
**Delivers:** XState workflow engine with per-state configs (10 launch states), offer submission and counteroffer lifecycle (event-sourced transaction log), AI negotiation assistant (comps via ATTOM + GPT-4o), AI transaction coordinator (deadline tracking + document compliance), wire fraud security architecture (authenticated in-app wire instructions, mandatory MFA), Transaction Guide AI Agent (RAG-grounded over state law knowledge base)
**Uses:** XState 5, ATTOM Data API for comps, Inngest for async AI analysis, event-sourced Postgres transaction log, state-law RAG store (pgvector)
**Implements:** Workflow Engine, Transaction Service, Negotiation AI Agent, Transaction Guide AI Agent, full RAG knowledge base
**Avoids:** Wire fraud via email transmission, AI hallucination on legal guidance (RAG-grounded agent with hard guardrails), attorney-state gaps (attorney-required states have distinct workflow paths)
**Research flag:** NEEDS DEEP RESEARCH — XState 5 state machine patterns for multi-state legal workflows are not widely documented; state law RAG content curation requires legal review per state; wire fraud security architecture needs security specialist review

### Phase 5: Agent-for-Hire Marketplace + Expanded State Coverage
**Rationale:** The agent marketplace is a second product built on top of the first. It requires: (1) licensed agent onboarding, (2) Stripe Connect for marketplace payouts, (3) state-scoped dispatch logic that depends on the workflow engine from Phase 4, (4) per-state legal structuring of the agent-platform relationship to avoid being deemed an unlicensed brokerage. Expanding state coverage (beyond 10 launch states) requires sourcing disclosure forms, legal opinions, and workflow configs for each new state — it scales linearly with effort.
**Delivers:** Licensed agent-for-hire marketplace (agent profiles, state-scoped availability, dispatch from workflow engine), Stripe Connect for agent payouts, expanded state coverage (target 25-30 states), RON integration (Notarize or Snapdocs, 44 available states), AI buyer matching engine (behavioral + NLP), neighborhood and market analysis widgets
**Uses:** Stripe Connect, Clerk organization accounts for agent profiles, pgvector for buyer preference matching
**Implements:** Agent-for-Hire Service, enhanced Matching AI Agent
**Avoids:** Agent marketplace misclassified as unlicensed brokerage (requires per-state legal structuring), RESPA violations in agent fee structure, Fair Housing violations in buyer matching (civil rights attorney review required before launch)
**Research flag:** NEEDS DEEP RESEARCH — agent-platform legal relationship structure is novel and untested at scale; Stripe Connect marketplace setup for real estate professional payouts needs compliance review; RON integration APIs have varying coverage

### Phase 6: Scale + MLS Direct Integration
**Rationale:** Direct MLS integration (beyond the middleware IDX vendor from Phase 2) requires IDX agreements with individual MLS boards — these take months to negotiate and require broker membership. This is a Phase 6 activity because: (1) it requires the broker license already obtained, (2) it requires transaction volume to have leverage in MLS negotiations, (3) the middleware IDX vendor route is sufficient for early scale. Performance optimization (AI caching, Elasticsearch scaling, MLS ingestion throughput) belongs here once user volume reveals actual bottlenecks.
**Delivers:** Direct RESO Web API integrations with 5-10 high-value MLS boards, full 50-state coverage, advanced AI buyer matching with behavioral data, predictive valuation alerts, performance optimization (AI response caching, Elasticsearch cluster tuning, MLS delta sync)
**Uses:** RESO Web API (OData), Elasticsearch with geo_point indexing, Upstash Redis for caching, potentially Pinecone if pgvector hits scale limits
**Implements:** MLS/IDX Feed Layer (direct), advanced Search Service
**Avoids:** Full MLS resync overwhelming database (use RESO delta queries with incremental sync)
**Research flag:** STANDARD PATTERNS — RESO Web API is well-documented; Elasticsearch geo search is well-established; MLS negotiation is a business/legal activity, not a technical one

### Phase Ordering Rationale

- **Legal first, code second**: Five existential pitfalls are only resolvable through legal counsel, not engineering. Phases 1 establishes the legal framework before any product feature is built. This is unusual for a tech startup but mandatory given the regulated domain.
- **Seller-side before buyer-side**: A two-sided marketplace must seed supply before demand. Phases 2-3 build the seller experience (listing creation + AI) before opening buyer discovery. Without listings, buyer features have no value.
- **Core transaction before agent marketplace**: The agent-for-hire feature is dispatched by the transaction workflow engine. The engine must exist and be legally validated before agent dispatch logic can be built. Phases 4 builds the engine; Phase 5 adds the marketplace.
- **Middleware IDX before direct MLS**: IDX agreement negotiations take months. Using a middleware vendor (SimplyRETS) in Phase 2 lets listings reach MLS without blocking on negotiations. Direct MLS integration happens in Phase 6 when broker licensing and transaction volume provide leverage.
- **Geographic concentration over national launch**: Cold-start failure is prevented by launching deeply in one or two markets before expanding. State expansion in Phase 5 is demand-driven, not supply-driven.

### Research Flags

Phases needing deeper research during planning:
- **Phase 1:** Broker licensing requirements are state-specific and time-sensitive; AI guidance taxonomy requires real estate attorney review; RESPA monetization structure needs compliance counsel
- **Phase 3:** State-specific disclosure form sourcing — need to verify current versions from each state real estate commission for the 10 launch states; disclosure requirements change annually
- **Phase 4:** XState 5 patterns for multi-state legal workflow modeling; state law RAG content curation strategy and legal review process; wire fraud security architecture
- **Phase 5:** Agent-platform legal relationship structure per state; Stripe Connect compliance for real estate professional marketplaces; Fair Housing civil rights review of buyer matching algorithm

Phases with standard patterns (can skip research-phase):
- **Phase 2:** Vercel AI SDK chat/streaming, Cloudflare R2 photo upload, Next.js ISR for listing pages — all well-documented
- **Phase 3:** Buyer search filtering (standard), eSignature API integration (commodity), TanStack Query + Next.js App Router patterns
- **Phase 6:** RESO Web API delta sync, Elasticsearch geo queries — industry-standard patterns with extensive documentation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework, AI layer, and infrastructure choices all verified against official 2025-2026 documentation. Version compatibility table confirmed. Main uncertainty is ATTOM Data pricing (requires vendor conversation). |
| Features | MEDIUM-HIGH | Competitor analysis is well-sourced (Houzeo, Redfin, Zillow, Opendoor). Table stakes and differentiators are clear. Exact state-specific disclosure form requirements need per-state verification. |
| Architecture | MEDIUM | Pattern-based from major PropTech platforms (Rightmove, REA Group, Anywhere Real Estate). RealEstateHunter's specific combination of agent-replacement + 50-state compliance + agent marketplace is novel; no direct comparable architecture to copy from. |
| Pitfalls | HIGH | Legal/regulatory findings sourced from official and authoritative sources (CFPB, HUD, NAR, Harbor Compliance, National Law Review). Wire fraud statistics from Qualia 2025 Special Report. Fair Housing AI guidance from HUD. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **ATTOM Data API pricing**: Enterprise pricing is custom; budget impact for comps/valuation features is unknown until vendor conversation. Plan with ATTOM as primary comps source; if pricing is prohibitive, fall back to HouseCanary or MLS comps data (requires Phase 6 IDX access).
- **MLS IDX coverage by geography**: Coverage gaps between SimplyRETS and Spark API are unknown until launch markets are selected. Evaluate coverage overlap before committing to a middleware vendor for specific metros.
- **DocuSign real estate form library coverage**: State-specific purchase agreement templates in DocuSign's NAR-partnership library need coverage verification. If gaps exist for launch states, consider building state-specific templates as a managed internal document set.
- **Broker licensing strategy**: Which entity holds the broker license (platform-owned brokerage, partner brokerage, or designated broker arrangement) is a business/legal decision that has material impact on Phase 2-4 architecture. This must be resolved in Phase 1 legal framework.
- **AI guidance taxonomy**: The permitted/prohibited guidance boundary for the AI chatbot and transaction guide agent is the single most consequential design decision. It requires real estate attorney input and must be validated before any AI prompt is finalized.

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) — Agent capabilities, streaming, edge compatibility
- [Vercel AI SDK 6 Release Blog](https://vercel.com/blog/ai-sdk-6) — Version confirmation, Agent abstraction
- [Next.js 15.5 Release Blog](https://nextjs.org/blog/next-15-5) — Stable version confirmation
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — Compatibility confirmed
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/) — Zero-egress pricing, S3 compatibility
- [DocuSign Developer Pricing](https://ecom.docusign.com/plans-and-pricing/developer) — API pricing tiers
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) — Version 0.45.1 stable confirmed
- [Stripe Connect SaaS Docs](https://docs.stripe.com/connect/saas) — Marketplace payout model
- [RESPA Overview — CFPB](https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/real-estate-settlement-procedures-act/) — Federal compliance requirements
- [HUD Guidance on Fair Housing Act and AI Algorithms](https://www.consumerfinancialserviceslawmonitor.com/2024/05/hud-issues-guidance-on-applicability-of-the-fair-housing-act-to-tenant-screening-and-housing-related-advertising-that-relies-upon-algorithms-and-ai/) — Matching algorithm compliance
- [2025 Wire Fraud Special Report — Qualia](https://learn.qualia.com/special-report-2025-real-estate-wire-fraud-trends) — Wire fraud statistics
- [50-State Real Estate Broker Licensing — Harbor Compliance](https://www.harborcompliance.com/real-estate-license) — Licensing requirements
- [RESO Web API — Real Estate Standards Organization](https://www.reso.org/reso-web-api/) — MLS integration standard

### Secondary (MEDIUM confidence)
- [SimplyRETS Developer API](https://simplyrets.com/idx-developer-api) — MLS integration capabilities
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector) — Vector search integration
- [How agentic AI can reshape real estate — McKinsey](https://www.mckinsey.com/industries/real-estate/our-insights/how-agentic-ai-can-reshape-real-estates-operating-model) — AI orchestration patterns
- [NAR MLS Policy Overhaul: January 2026 — Pinnacle Real Estate Academy](https://pinnaclerealestateacademy.com/nars-historic-mls-policy-overhaul-18-major-changes-coming-january-2026) — Current MLS access policy
- [AI in Real Estate: Prospects and Pitfalls — National Law Review](https://natlawreview.com/article/ai-real-estate-prospects-and-pitfalls) — UPL and regulatory risks
- [Houzeo Review — Bankrate](https://www.bankrate.com/real-estate/houzeo-review/) — Competitor feature comparison
- [States Requiring Attorneys at Closing — HomeLight](https://www.homelight.com/blog/states-that-require-real-estate-attorney-at-closing/) — Attorney-state classification
- [LangChain vs Vercel AI SDK — Strapi Blog](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) — Edge incompatibility of LangChain.js
- [Clerk vs Supabase Auth comparison](https://clerk.com/articles/clerk-vs-supabase-auth) — Auth selection rationale (Clerk-authored; verify independently)

### Tertiary (LOW confidence)
- [ATTOM Data API Documentation](https://api.developer.attomdata.com/docs) — Property data scope; pricing requires direct vendor contact
- [Realie.ai Property API Comparison](https://blog.realie.ai/blog/exploring-the-best-u-s-property-data-apis-and-their-drawbacks) — ATTOM vs alternatives; single source, verify independently

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*

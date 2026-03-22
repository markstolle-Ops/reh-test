# Roadmap: RealEstateHunter

## Overview

RealEstateHunter replaces traditional real estate agents with AI-powered transaction management across all 50 US states. The build sequence is legal-first: five existential pitfalls (unauthorized practice of law, broker licensing, RESPA violations, attorney-state gaps, MLS access) must be resolved before any AI guidance feature ships. From that foundation, the platform builds seller-side (listing creation + AI), then buyer-side (search + discovery), then the full transaction engine (state compliance workflows + negotiation + document signing), then the agent-for-hire marketplace (Phase 5), and finally direct MLS integration and full 50-state coverage (Phase 6).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Legal Framework + Foundation** - Establish legal architecture, auth system, project scaffold, and cost-benefit calculator before any regulated feature ships
- [ ] **Phase 2: Listing Creation + AI Core** - Seller can create listings with AI-generated descriptions, AVM pricing, and flat-fee MLS syndication
- [x] **Phase 3: Buyer Discovery + Disclosure + eSignature** - Buyer search, saved alerts, state disclosure forms, and digital document signing for 10 launch states (completed 2026-03-16)
- [ ] **Phase 4: Transaction Engine + State Compliance** - Full offer-to-close workflow with XState engine, AI negotiation assistant, AI transaction coordinator, and wire fraud security
- [ ] **Phase 5: Agent-for-Hire Marketplace + Buyer Matching** - Licensed agent marketplace with Stripe Connect payouts, AI buyer matching, expanded state coverage
- [x] **Phase 6: MLS Direct Integration + Scale** - Direct RESO Web API integrations, full 50-state coverage, performance optimization (completed 2026-03-17)

## Phase Details

### Phase 1: Legal Framework + Foundation
**Goal**: Legal architecture is validated and platform infrastructure exists so every subsequent feature builds on a legally defensible foundation
**Depends on**: Nothing (first phase)
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05, ACCT-06, COST-01, COST-02
**Success Criteria** (what must be TRUE):
  1. User can create an account as buyer or seller with email/password, verify email, reset password, and stay logged in across browser refresh
  2. Buyer and seller see separate dashboards with role-specific views, and a user can switch between buyer and seller roles
  3. Cost-benefit calculator on the homepage accepts a home price and state, then shows itemized savings versus a 5-6% traditional commission
  4. Legal opinion documents exist for the 10 launch states covering broker licensing, UPL guardrails, and RESPA compliance
  5. AI guidance taxonomy (permitted guidance vs. legal advice boundary) is defined and reviewed by real estate attorney before any AI prompt ships
**Plans:** 3/4 plans executed

Plans:
- [ ] 01-01-PLAN.md — Project scaffold: Next.js 15, Clerk auth, Drizzle + Supabase Postgres, test infrastructure (Vitest + Playwright)
- [ ] 01-02-PLAN.md — User accounts: buyer/seller dashboards, onboarding role selection, role switching, E2E test scaffolds
- [ ] 01-03-PLAN.md — Cost-benefit calculator + legal framework: homepage calculator with itemized savings, AI guidance taxonomy, state compliance classification
- [ ] 01-04-PLAN.md — Legal opinion documents: broker licensing analysis, RESPA compliance framework, UPL guardrail document + attorney review gate

### Phase 2: Listing Creation + AI Core
**Goal**: Sellers can create, publish, and manage listings with AI-generated descriptions and pricing, reaching buyers on MLS without requiring a direct IDX agreement
**Depends on**: Phase 1
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07, LIST-08, DATA-01, DATA-02, DATA-03, DATA-04, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, COST-03, COST-04
**Success Criteria** (what must be TRUE):
  1. Seller can create a listing with all required fields (address, price, beds, baths, sqft, lot size, property type), upload photos with drag-and-drop ordering, and publish it to the platform
  2. AI generates an MLS-quality listing description from the seller's photos and details; seller can edit the AI draft before publishing
  3. Seller can get an automated home value estimate before setting a price, and listing pages display neighborhood data and market trends for buyers
  4. AI chatbot is available 24/7 on every listing page, answers property and state-process questions, schedules showings, and uses RAG-grounded responses with explicit "not legal advice" disclaimers
  5. Every transaction shows a full fee breakdown (platform fee, title, attorney where required, agent-for-hire where required) before the user commits
**Plans:** 8/9 plans executed

Plans:
- [ ] 02-01-PLAN.md — Listing data model: Drizzle schema for listings/photos/showingRequests/knowledgeChunks, R2 presigned upload, listings CRUD API, Inngest client
- [ ] 02-02-PLAN.md — Listing creation UI: multi-step seller form, photo upload with drag-and-drop reordering, status management, edit after publish
- [ ] 02-03-PLAN.md — Listing detail pages: ISR public pages with photo gallery, full details, placeholder slots for chatbot/fees/neighborhood
- [ ] 02-04-PLAN.md — AI description + AVM: Inngest async GPT-4o vision description generator, AVM stub adapter with widget
- [ ] 02-05-PLAN.md — Neighborhood data + market trends: stub adapters for Walk Score/GreatSchools/market analytics, Recharts trend charts
- [ ] 02-06-PLAN.md — AI chatbot: pgvector RAG knowledge base, streaming chat API with tool calling (showings), UPL guardrail system prompt, floating ChatWidget
- [ ] 02-07-PLAN.md — Fee transparency + MLS syndication: state-aware FeeBreakdown component on listing pages, MLS syndication stub
- [ ] 02-08-PLAN.md — [GAP CLOSURE] Fix API response shape mismatches: wrap listing route responses to match caller destructuring
- [ ] 02-09-PLAN.md — [GAP CLOSURE] Fix photo upload pipeline: presign contract alignment + PATCH photo operation dispatch

### Phase 3: Buyer Discovery + Disclosure + eSignature
**Goal**: Buyers can find, save, and inquire on properties, and both parties can complete state-specific disclosure forms and sign documents digitally for the 10 launch states
**Depends on**: Phase 2
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, DISC-01, DISC-02, DISC-03, DISC-04, SIGN-01, SIGN-02, SIGN-03, SIGN-04, MLS-02, MLS-03
**Success Criteria** (what must be TRUE):
  1. Buyer can search properties by location (city, zip, state) and filter by price, beds, baths, sqft, and property type with results displayed as photo thumbnails with key details
  2. Buyer can view properties on an interactive map and save/favorite individual listings
  3. Buyer can save a search and receive email alerts when new matching listings appear
  4. Seller and buyer can complete state-specific disclosure forms digitally within the platform for all 10 launch states, with AI-guided prompts and completed forms attached to the transaction record
  5. Users can sign transaction documents digitally with multi-party signing support, E-SIGN Act compliance, and signed documents stored with audit trail
**Plans:** 6 plans (5 complete + 1 gap closure)

Plans:
- [ ] 03-01-PLAN.md — Schema + search foundation: 6 new DB tables, PostGIS location column, NormalizedListing type, unified search service (platform + MLS), SimplyRETS ingestion client
- [ ] 03-02-PLAN.md — Search UI + saved listings: ListingCard grid with filters, save/favorite toggle, /buyer/search and /buyer/saved pages
- [ ] 03-03-PLAN.md — Map view + saved searches: Mapbox GL JS interactive map, saved search CRUD, Inngest daily alert cron with Resend email fan-out
- [ ] 03-04-PLAN.md — Disclosure forms + AI assistant: per-state JSON form schemas (10 launch states), digital form filling UI, AI-guided completion with UPL disclaimers
- [ ] 03-05-PLAN.md — eSignature integration: SignWell REST adapter, multi-party signing, embedded iframe, webhook handler, audit trail storage, E-SIGN Act compliance
- [ ] 03-06-PLAN.md — [GAP CLOSURE] Fix baths filter, wire MapView toggle, add Save Search button to search page

### Phase 4: Transaction Engine + State Compliance
**Goal**: Full offer-to-close workflow is automated by a legally validated state machine for 10 launch states, with AI negotiation, AI transaction coordination, and wire fraud security architecture
**Depends on**: Phase 3
**Requirements**: LEGL-01, LEGL-02, LEGL-03, LEGL-04, LEGL-05, LEGL-06, LEGL-07, NEGO-01, NEGO-02, NEGO-03, NEGO-04, NEGO-05, TXCO-01, TXCO-02, TXCO-03, TXCO-04, TXCO-05, MLS-01
**Success Criteria** (what must be TRUE):
  1. When a property offer is accepted, the platform automatically generates a state-specific transaction checklist, tracks all deadlines (inspection period, financing contingency, closing date), and sends reminders — with the real-time status visible on the transaction dashboard
  2. Buyer can view comparable sales analysis for any listing and receive AI-suggested offer price strategy; seller receives AI counteroffer strategy recommendations — all with explicit "not legal/financial advice" disclaimers
  3. The transaction flow adapts automatically based on the property's state: attorney-required states route to attorney referral, FSBO states provide self-service workflow, and state-specific legal requirements are displayed before a transaction begins
  4. State workflow configurations are data-driven (JSON/DB) and can be updated without a code deploy, and the platform flags missing required documents per state
  5. Wire instructions are displayed only via authenticated in-app interface with MFA, never transmitted via email
**Plans:** 6/7 plans executed

Plans:
- [ ] 04-01-PLAN.md — XState 5 workflow engine: per-state config files (10 launch states), state machine with guard-driven routing for attorney-required vs. FSBO vs. hybrid paths
- [ ] 04-02-PLAN.md — Transaction service: event-sourced append-only transaction log, deadline calculator, CRUD API routes
- [ ] 04-03-PLAN.md — AI negotiation assistant: mls_listings comps fallback, GPT-4o offer/counteroffer strategy, buyer and seller guidance with UPL disclaimers
- [ ] 04-04-PLAN.md — AI transaction coordinator: Inngest deadline tracking, CFPB 3-day closing disclosure monitor, document compliance checks, transaction dashboard (buyer + seller)
- [ ] 04-05-PLAN.md — Transaction Guide AI agent + state requirements: RAG state-law Q&A with UPL guardrails, StateRequirementsNotice component, offer/counteroffer template tools
- [ ] 04-06-PLAN.md — Wire fraud security: MFA-gated in-app wire instruction display, audit trail logging, fraud warning banner
- [ ] 04-07-PLAN.md — MLS syndication upgrade: broker partner email submission via Resend, Inngest async trigger, syndication status tracking

### Phase 5: Agent-for-Hire Marketplace + Buyer Matching
**Goal**: Licensed agents can register and be dispatched in states requiring agent involvement, buyers receive AI-powered personalized listing recommendations, and state coverage expands to 25-30 states
**Depends on**: Phase 4
**Requirements**: AGNT-01, AGNT-02, AGNT-03, AGNT-04, AGNT-05, MTCH-01, MTCH-02, MTCH-03, MTCH-04
**Success Criteria** (what must be TRUE):
  1. Licensed real estate agents can create profiles on the platform with state availability, verified license status, and a flat fee per contract signing
  2. When a transaction enters a state-required agent step, the platform automatically dispatches an available licensed agent-for-hire and the user sees the transparent fee breakdown including the agent fee
  3. Buyer receives personalized listing recommendations via email based on inferred preferences from their search behavior and saves
  4. Buyer can use natural language search ("3BR ranch with big yard near good schools under $350K") and receive matching results
**Plans:** 2/4 plans executed

Plans:
- [x] 05-01-PLAN.md — Agent marketplace foundation: schema (4 new tables + listing embedding), agent profile CRUD, Stripe Connect Express, license verification (ARELLO + manual fallback), agent dashboard
- [x] 05-02-PLAN.md — Agent dispatch + fee wiring: automatic agent dispatch from workflow engine on attorney_review, row-level locking, $500 agent fee in transaction fee breakdown
- [ ] 05-03-PLAN.md — AI buyer matching engine: behavioral event tracking, preference profiling, pgvector listing recommendations, listing embedding pipeline, daily recommendation emails via Inngest + Resend
- [ ] 05-04-PLAN.md — Natural language search: GPT-4o NLQ parser, search API integration, NlqSearchBar component on buyer search page

### Phase 6: MLS Direct Integration + Scale
**Goal**: Direct RESO Web API integrations replace middleware IDX for top MLS boards, full 50-state coverage is reached, and performance is optimized for production scale
**Depends on**: Phase 5
**Requirements**: MLS-04, DATA-02 (expanded coverage)
**Success Criteria** (what must be TRUE):
  1. MLS listings from 5-10 high-volume boards appear in buyer search results via direct RESO Web API integration with incremental delta sync
  2. Platform supports all 50 US states with complete disclosure forms, workflow configurations, and legal opinions
  3. AI responses are served within acceptable latency under real production load via caching and query optimization
**Plans:** 3/3 plans complete

Plans:
- [ ] 06-01-PLAN.md — RESO Web API direct integrations: OData client, delta sync via ModificationTimestamp, resoBoards config table, Inngest cron for 10 high-volume boards
- [ ] 06-02-PLAN.md — Full 50-state coverage: 41 new workflow configs, disclosure form schemas, state info entries for all 50 states + DC
- [ ] 06-03-PLAN.md — Performance optimization: Upstash Redis caching for search (60s TTL), RESO responses (5min TTL), RAG context (10min TTL), graceful fallback

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Legal Framework + Foundation | 3/4 | In Progress|  |
| 2. Listing Creation + AI Core | 8/9 | In Progress|  |
| 3. Buyer Discovery + Disclosure + eSignature | 5/6 | Gap Closure | 2026-03-16 |
| 4. Transaction Engine + State Compliance | 6/7 | In Progress|  |
| 5. Agent-for-Hire Marketplace + Buyer Matching | 1/4 | In Progress|  |
| 6. MLS Direct Integration + Scale | 3/3 | Complete   | 2026-03-17 |

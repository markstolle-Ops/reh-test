---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 06-mls-direct-integration-scale/06-03-PLAN.md
last_updated: "2026-03-17T04:40:54.509Z"
last_activity: 2026-03-16 — Roadmap created from requirements and research
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 33
  completed_plans: 33
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15)

**Core value:** Eliminate the need for traditional real estate agents by providing AI-powered transaction management that saves buyers and sellers thousands of dollars while delivering superior 24/7 service.
**Current focus:** Phase 1 — Legal Framework + Foundation

## Current Position

Phase: 1 of 6 (Legal Framework + Foundation)
Plan: 0 of 4 in current phase
Status: Ready to plan
Last activity: 2026-03-16 — Roadmap created from requirements and research

Progress: [███░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-legal-framework-foundation P01 | 5min | 2 tasks | 18 files |
| Phase 01-legal-framework-foundation P03 | 5min | 2 tasks | 16 files |
| Phase 01-legal-framework-foundation P02 | 11min | 2 tasks | 15 files |
| Phase 01-legal-framework-foundation P04 | 8min | 2 tasks | 3 files |
| Phase 02-listing-creation-ai-core P01 | 4min | 2 tasks | 13 files |
| Phase 02-listing-creation-ai-core P03 | 2min | 1 tasks | 4 files |
| Phase 02-listing-creation-ai-core P02 | 6min | 2 tasks | 11 files |
| Phase 02-listing-creation-ai-core P05 | 15min | 2 tasks | 6 files |
| Phase 02-listing-creation-ai-core P04 | 11min | 2 tasks | 9 files |
| Phase 02-listing-creation-ai-core P07 | 15min | 2 tasks | 7 files |
| Phase 02-listing-creation-ai-core PP06 | 12min | 2 tasks | 14 files |
| Phase 02-listing-creation-ai-core PP08 | 8min | 2 tasks | 2 files |
| Phase 02-listing-creation-ai-core P09 | 8min | 2 tasks | 3 files |
| Phase 03-buyer-discovery-disclosure-esignature P01 | 6min | 2 tasks | 14 files |
| Phase 03-buyer-discovery-disclosure-esignature P05 | 8min | 2 tasks | 8 files |
| Phase 03-buyer-discovery-disclosure-esignature PP02 | 6min | 2 tasks | 8 files |
| Phase 03-buyer-discovery-disclosure-esignature P04 | 8min | 2 tasks | 14 files |
| Phase 03-buyer-discovery-disclosure-esignature P03 | 15min | 2 tasks | 12 files |
| Phase 03-buyer-discovery-disclosure-esignature P06 | 12min | 2 tasks | 2 files |
| Phase 04-transaction-engine-state-compliance P02 | 12min | 2 tasks | 10 files |
| Phase 04-transaction-engine-state-compliance P01 | 3min | 2 tasks | 15 files |
| Phase 04-transaction-engine-state-compliance P07 | 20min | 1 tasks | 8 files |
| Phase 04-transaction-engine-state-compliance PP04 | 12min | 2 tasks | 9 files |
| Phase 04-transaction-engine-state-compliance P03 | 12min | 2 tasks | 8 files |
| Phase 04-transaction-engine-state-compliance P05 | 8min | 2 tasks | 6 files |
| Phase 04-transaction-engine-state-compliance P06 | 8min | 2 tasks | 8 files |
| Phase 05-agent-for-hire-marketplace-buyer-matching P01 | 7min | 2 tasks | 19 files |
| Phase 05-agent-for-hire-marketplace-buyer-matching P03 | 18min | 2 tasks | 11 files |
| Phase 05-agent-for-hire-marketplace-buyer-matching P04 | 11min | 2 tasks | 7 files |
| Phase 06-mls-direct-integration-scale P01 | 10min | 2 tasks | 9 files |
| Phase 06-mls-direct-integration-scale PP02 | 30min | 2 tasks | 45 files |
| Phase 06-mls-direct-integration-scale P03 | 93min | 1 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Legal-first build order — broker licensing, UPL guardrails, RESPA structure must be resolved before any AI guidance feature ships
- [Phase 1]: 10 launch states first (CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL) — expand demand-driven in Phase 5
- [Phase 2]: Flat-fee MLS via broker partner middleware (SimplyRETS/iHomeFinder) — direct IDX deferred to Phase 6
- [Phase 5]: Agent-for-hire marketplace treated as separate product phase, not MVP — requires licensed agent onboarding, Stripe Connect, and per-state legal structuring
- [Phase 01-legal-framework-foundation]: Vitest include scoped to src/** only — Playwright specs must not be discovered by Vitest
- [Phase 01-legal-framework-foundation]: Drizzle postgres() uses prepare: false — required for Supabase Transaction pooler
- [Phase 01-legal-framework-foundation]: Clerk JWT template must be configured in dashboard before role-based routing works — documented in middleware.ts and .env.example
- [Phase 01-legal-framework-foundation]: Recharts components require 'use client' — all chart/calculator UI is client islands; page.tsx stays Server Component
- [Phase 01-legal-framework-foundation]: Attorney fee ($1,500) applies to attorney-required (GA, NC) AND customary-attorney (NY, IL) states
- [Phase 01-legal-framework-foundation]: Route groups (buyer)/(seller) renamed to buyer/seller path segments to match /buyer(.*) /seller(.*) middleware matchers
- [Phase 01-legal-framework-foundation]: Buyer/seller routes use plain directories (buyer/, seller/) not route groups — (buyer)/dashboard and (seller)/dashboard both resolve to /dashboard, causing build collision in Next.js 16
- [Phase 01-legal-framework-foundation]: Next.js 16 build requires --webpack flag — Turbopack incorrectly reports parallel route path collisions
- [Phase 01-legal-framework-foundation]: Clerk v7 removed SignedIn/SignedOut components — use auth() server-side + UserButton/SignInButton/SignUpButton client components
- [Phase 01-legal-framework-foundation]: Attorney review gates Phase 2 AI features — UPL guardrail and AI guidance taxonomy must be reviewed before any Phase 2 AI feature ships
- [Phase 01-legal-framework-foundation]: Broker licensing model (owned brokerage / partner brokerage / designated broker) is a business decision deferred to operator and counsel — trade-offs documented in broker-licensing-analysis.md
- [Phase 01-legal-framework-foundation]: NY is HIGH broker licensing risk — partner broker required (not optional) for New York operations
- [Phase 02-listing-creation-ai-core]: relations() must be imported from drizzle-orm (not drizzle-orm/pg-core) — separate package entrypoints
- [Phase 02-listing-creation-ai-core]: revalidateTag in Next.js 16 requires second profile argument — use 'default' for standard cache invalidation
- [Phase 02-listing-creation-ai-core]: Photo order stored as text[] on listings table — enables atomic reorder with single DB write
- [Phase 02-listing-creation-ai-core]: Inngest event fired fire-and-forget in POST /api/listings — handler registered in plan 02-04 to avoid blocking listing creation
- [Phase 02-listing-creation-ai-core]: NEXT_PUBLIC_R2_PUBLIC_URL required for client component gallery (not R2_PUBLIC_URL) — browser bundle strips non-public env vars
- [Phase 02-listing-creation-ai-core]: Photo ordering computed in Server Component from photoOrder text[] — no extra DB query needed
- [Phase 02-listing-creation-ai-core]: Placeholder slots use empty div with id attributes — queryable by tests and future widget injection
- [Phase 02-listing-creation-ai-core]: listingSchema extracted to @/lib/listing-schema — service files import postgres driver which cannot bundle in browser client components
- [Phase 02-listing-creation-ai-core]: @base-ui/react/button has no asChild prop — use Link + buttonVariants() for anchor-as-button patterns
- [Phase 02-listing-creation-ai-core]: Neighborhood data service uses deterministic LCG hash seeded by zip — different zips produce different realistic stub scores without external API calls
- [Phase 02-listing-creation-ai-core]: Both NeighborhoodWidget and MarketTrends reuse single /api/neighborhood endpoint — halves API calls per page load
- [Phase 02-listing-creation-ai-core]: Neighborhood/market widgets only render for active/pending listings — draft and sold skip neighborhood context
- [Phase 02-listing-creation-ai-core]: Inngest handler split: export raw async fn for tests, wrap with inngest.createFunction for route registration
- [Phase 02-listing-creation-ai-core]: AVM stub uses deterministic LCG seeded by state+zip — deterministic realistic prices without external API calls
- [Phase 02-listing-creation-ai-core]: AvmWidget renders only for active/pending listings — consistent with NeighborhoodWidget and MarketTrends guards
- [Phase 02-listing-creation-ai-core]: FeeBreakdown tests use exported utilities (shouldShowAttorneyFee, formatCents) instead of jsdom — vitest environment is node and @testing-library/react is not installed
- [Phase 02-listing-creation-ai-core]: MLS syndication fee ($299) included in TransactionFees.mlsSyndicationFee — visible in FeeBreakdown before any user commitment (COST-04 satisfied)
- [Phase 02-listing-creation-ai-core]: AI SDK v6 uses inputSchema in tool() and toUIMessageStreamResponse() — plan was written for v4/v5 API conventions
- [Phase 02-listing-creation-ai-core]: useChat in @ai-sdk/react v6 requires DefaultChatTransport for API URL/body (no direct api/body props on useChat)
- [Phase 02-listing-creation-ai-core]: pgvector embedding column added via raw SQL migration (not Drizzle schema) — vector type unsupported by Drizzle natively
- [Phase 02-listing-creation-ai-core]: scheduleShowing auth check inside tool execute (not route-level) — allows public read chat, requires auth only for scheduling
- [Phase 02-listing-creation-ai-core]: revalidateTag in Next.js 16 requires second profile argument — confirmed by type signature; plan's suggestion to remove it was incorrect
- [Phase 02-listing-creation-ai-core]: Presign route returns { uploadUrl, key, publicUrl } — client expects uploadUrl not url; publicUrl computed server-side from NEXT_PUBLIC_R2_PUBLIC_URL
- [Phase 02-listing-creation-ai-core]: PATCH handler uses explicit 15-field allowlist for normal updates to prevent column injection
- [Phase 03-buyer-discovery-disclosure-esignature]: NormalizedListing is the shared contract between platform and MLS listings — UI never touches raw DB row shapes
- [Phase 03-buyer-discovery-disclosure-esignature]: PostGIS location geometry column declared in Drizzle schema for type-safe queries, but actual DDL applied via raw SQL migration — Drizzle ignores SRID in generated DDL
- [Phase 03-buyer-discovery-disclosure-esignature]: SimplyRETS prices are in dollars; stored in cents (multiply by 100) for internal consistency
- [Phase 03-buyer-discovery-disclosure-esignature]: vi.mock factory must use vi.fn() inline (not outer variables) due to Vitest hoisting behavior
- [Phase 03-buyer-discovery-disclosure-esignature]: SignWell API key read lazily via getApiKey() — prevents module-level capture before test env vars are set
- [Phase 03-buyer-discovery-disclosure-esignature]: vi.stubEnv used for NODE_ENV in tests — Object.defineProperty(process.env) throws ERR_INVALID_OBJECT_DEFINE_PROPERTY in Node.js 22
- [Phase 03-buyer-discovery-disclosure-esignature]: SignWell webhook endpoint is public (no auth) — SignWell calls server-to-server; HMAC verification via x-signwell-signature documented as optional next step
- [Phase 03-buyer-discovery-disclosure-esignature]: CSP applied globally in next.config.ts for frame-src signwell.com and script-src cdn.signwell.com — required for SignatureEmbed iframe to load on any page
- [Phase 03-buyer-discovery-disclosure-esignature]: isListingSaved uses single db.select() with or() instead of two sequential queries — avoids mock exhaustion in tests and reduces DB round-trips
- [Phase 03-buyer-discovery-disclosure-esignature]: ListingCard wraps platform listings in Next.js Link, MLS listings are non-linked (no detail page yet) — avoids 404s for MLS sources
- [Phase 03-buyer-discovery-disclosure-esignature]: LAUNCH_STATE_SCHEMAS fields are PLACEHOLDER arrays — must be replaced after attorney review before activation
- [Phase 03-buyer-discovery-disclosure-esignature]: GA schema has required=false — seller can skip disclosure; platform shows optional banner
- [Phase 03-buyer-discovery-disclosure-esignature]: NY opt_out_with_credit boolean field: when checked, disables all other NY fields and shows $500 credit message
- [Phase 03-buyer-discovery-disclosure-esignature]: AI assist embeds UPL disclaimer verbatim in every system prompt: 'This is not legal advice. Consult a licensed attorney.'
- [Phase 03-buyer-discovery-disclosure-esignature]: react-map-gl v8 uses /mapbox subpath entrypoint — import from react-map-gl/mapbox not react-map-gl
- [Phase 03-buyer-discovery-disclosure-esignature]: sendEmail injected as optional param in checkSavedSearchAlertRaw — avoids constructable mock issue in Vitest where arrow function mocks cannot be used with new
- [Phase 03-buyer-discovery-disclosure-esignature]: MapView dynamically imported with ssr:false on search page — mapbox-gl accesses window/navigator at module load
- [Phase 03-buyer-discovery-disclosure-esignature]: Baths filter uses String() cast for numeric(3,1) Drizzle column — mirrors same pattern as beds/sqft/price
- [Phase 04-transaction-engine-state-compliance]: date-fns addBusinessDays with negative offset used for CFPB 3-day/6-day backward deadline counting
- [Phase 04-transaction-engine-state-compliance]: transactionEvents rows are append-only — no UPDATE or DELETE ever issued; deriveTransactionState replays events for audit
- [Phase 04-transaction-engine-state-compliance]: POST /api/transactions/[id]/events validates eventType against hard-coded Set at runtime to prevent invalid event injection
- [Phase 04-transaction-engine-state-compliance]: XState 5 setup() API used — typed context/events/input, guard array on OFFER_ACCEPTED for multi-condition routing
- [Phase 04-transaction-engine-state-compliance]: attorney_review INSPECTION_COMPLETE advances directly to financing_period (skips inspection_period state) — attorney review covers pre-inspection period
- [Phase 04-transaction-engine-state-compliance]: MLS syndication MVP uses structured Resend email to MLS_BROKER_EMAIL — no vendor REST API available for flat-fee brokers (ListWithFreedom/Homecoin)
- [Phase 04-transaction-engine-state-compliance]: mls_syndications table (not a column) enables multiple syndication attempts and status history per listing
- [Phase 04-transaction-engine-state-compliance]: listing/published event fired in PATCH handler on status → active transition; also sets publishedAt timestamp
- [Phase 04-transaction-engine-state-compliance]: MLS_BROKER_EMAIL and RESEND_FROM_EMAIL required in .env before production MLS submissions will work
- [Phase 04-transaction-engine-state-compliance]: Vitest mock hoisting: vi.mock factory uses vi.fn() inline + __mockName exports — outer variable references throw ReferenceError when hoisted
- [Phase 04-transaction-engine-state-compliance]: Wire instructions slot (id=wire-instructions-slot) pre-positioned in buyer dashboard — Plan 04-06 injects content without touching page structure
- [Phase 04-transaction-engine-state-compliance]: cfpbDisclosureMonitorRaw accepts today param for testability — avoids Date.now() in tested code, deterministic tests without time manipulation
- [Phase 04-transaction-engine-state-compliance]: mls_listings lastSyncedAt used as soldDate proxy — no separate soldDate column in schema; ATTOM Data API will provide proper soldDate when contract is established
- [Phase 04-transaction-engine-state-compliance]: suggestOfferPriceSchema exported separately from negotiation agent — enables test-only schema import without calling OpenAI
- [Phase 04-transaction-engine-state-compliance]: StateRequirementsNotice test checks attorneyRequired boolean (not keyword in summary) — CA summary contains 'attorneys are not required' so text check was inaccurate
- [Phase 04-transaction-engine-state-compliance]: Transaction Guide uses gpt-4o (vs chatbot gpt-4o-mini) and requires auth — legal process guidance warrants higher-capability model and personalization
- [Phase 04-transaction-engine-state-compliance]: buildOfferTemplate/buildCounterTemplate exported as pure functions separate from AI tool execute closures — enables unit testing without mocking AI SDK
- [Phase 04-transaction-engine-state-compliance]: Wire instructions stored as plaintext in MVP — column-level encryption via Supabase Vault (pgsodium) deferred to pre-production hardening; TODO comments added to schema and service
- [Phase 04-transaction-engine-state-compliance]: MFA gate uses user.twoFactorEnabled from Clerk (not step-up auth) — step-up requires enterprise plan; twoFactorEnabled check sufficient for MVP
- [Phase 04-transaction-engine-state-compliance]: WireInstructionsReveal re-fetches full numbers from API on demand (not embedded in server render) — second audit log entry triggered, minimizes sensitive data in DOM
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: Stripe initialized lazily via getStripe() — module-level new Stripe() throws at build time without STRIPE_SECRET_KEY
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: ARELLO integration: throws 'ARELLO not configured — use manual verification' when ARELLO_API_URL missing — manual is the MVP default
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: agentProfiles.licenseStates stored as text[] — enables array-contains filtering without join table
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: OpenAI client initialized lazily inside async functions — prevents build-time OPENAI_API_KEY errors (mirrors lazy Stripe pattern)
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: Preference summary uses ONLY objective property features (price, beds, sqft, city, state) — Fair Housing Act compliance; no demographic proxies
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: sendRecommendationEmailRaw accepts userEmail param (not resolved from Clerk inside fn) — enables unit testing without Clerk SDK mock
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: Recommendation cron at 10 AM UTC (1 hr offset from saved-search cron at 9 AM) — prevents simultaneous email batches
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: NLQ parser prompt explicitly forbids school quality, walkability, and demographics per Fair Housing Act compliance
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: GPT-4o returns prices in dollars; parser converts to cents at boundary — AI output human-readable, internal representation consistent
- [Phase 05-agent-for-hire-marketplace-buyer-matching]: Explicit filter params override NLQ-parsed values in /api/search — buyers retain precise control over AI interpretation
- [Phase 06-mls-direct-integration-scale]: RESO prices are in dollars; normalizer multiplies by 100 to cents — consistent with SimplyRETS Phase 3 pattern
- [Phase 06-mls-direct-integration-scale]: mlsSource 'reso:{boardId}' distinguishes RESO rows from 'simplyrets' rows in unified mlsListings table
- [Phase 06-mls-direct-integration-scale]: OData pagination capped at 10 pages per sync cycle to prevent runaway fetches
- [Phase 06-mls-direct-integration-scale]: lastSyncedAt null on resoBoards board triggers full load from epoch (new Date(0))
- [Phase 06-mls-direct-integration-scale]: streetAddress added to mlsListings — was missing from original schema, RESO provides UnparsedAddress
- [Phase 06-mls-direct-integration-scale]: LAUNCH_STATE_SCHEMAS name kept unchanged covering all 51 states — LAUNCH_STATES still points to 10 for backward compat
- [Phase 06-mls-direct-integration-scale]: ATTORNEY_STATES aliased to ATTORNEY_REQUIRED_STATES — deprecated alias preserved; CT, DE, MA, SC, VT, WV added to attorney-required list
- [Phase 06-mls-direct-integration-scale]: State-specific disclosure fields per region: radon (CO/MT/NH/UT), termites (AL/AR/MS/OK/SC/TN), earthquake (OR/WA), mineral rights (WV/WY), leasehold+lava (HI), TOPA (DC), water rights (NM), permafrost (AK)
- [Phase 06-mls-direct-integration-scale]: Redis singleton resets per test via vi.resetModules() — module-level _redis caching requires module re-import between test cases when env vars change
- [Phase 06-mls-direct-integration-scale]: cacheSet is fire-and-forget in cacheWrap — write failure must not block the response; .catch() used to suppress unhandled rejection

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Broker licensing strategy (platform-owned brokerage vs. partner brokerage vs. designated broker) is a business/legal decision that must be resolved in Phase 1 — materially impacts Phase 2-4 architecture
- [Phase 1]: ATTOM Data API pricing is unknown (custom enterprise); if pricing is prohibitive, fall back to HouseCanary or MLS comps in Phase 6
- [Phase 2]: MLS IDX coverage by metro is unknown until launch markets are selected — evaluate SimplyRETS vs. Spark API overlap before committing
- [Phase 4]: XState 5 patterns for multi-state legal workflow modeling are not widely documented — may require discovery time
- [Phase 5]: Fair Housing civil rights attorney review of buyer matching algorithm required before any production run

## Session Continuity

Last session: 2026-03-17T04:39:59.850Z
Stopped at: Completed 06-mls-direct-integration-scale/06-03-PLAN.md
Resume file: None

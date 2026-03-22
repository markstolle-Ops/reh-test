# Stack Research

**Domain:** AI-powered real estate transaction platform (two-sided marketplace, 50-state compliance, MLS integration)
**Researched:** 2026-03-15
**Confidence:** MEDIUM-HIGH (core framework HIGH, AI layer MEDIUM, MLS/property data MEDIUM)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.2.x (stable) | Full-stack React framework | App Router gives server components for SEO (listing pages need it), API routes co-located with UI, ISR for listing pages that update frequently. Largest ecosystem, Vercel deploys trivially. React 19 bundled. |
| TypeScript | 5.x | Type safety across entire stack | Real estate transactions involve complex state machines (offer → counter → accepted → in-escrow → closed). Types catch logic errors at compile time. Non-negotiable for a compliance-sensitive domain. |
| Drizzle ORM | 0.45.x (stable) | PostgreSQL query builder / ORM | 90% smaller bundle than Prisma, edge-compatible, full TypeScript inference, SQL-like syntax keeps queries readable. Prisma 7 is now pure TS but still heavier. Drizzle wins for serverless cold-start performance. |
| PostgreSQL (Supabase) | 16.x | Primary database | PostGIS extension for geographic property searches (radius search, polygon-bounded searches). pgvector for property similarity embeddings. Row Level Security for multi-tenant data isolation between buyers/sellers. Supabase managed Postgres eliminates ops burden. |
| Tailwind CSS | 4.x | Styling | CSS-first config (no tailwind.config.js), faster build, full shadcn/ui support. New OKLCH color system. Standard for SaaS in 2025. |
| shadcn/ui | latest (2025 Tailwind v4 release) | UI component library | Fully compatible with Tailwind v4 + React 19 + Next.js 15. Copy-paste components you own (not a dependency). Critical for forms-heavy transaction workflows — the wizard-style transaction UI needs composable, customizable form components. |

### AI / Agentic Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel AI SDK | 6.x (ai@6.0.x) | AI chatbot, streaming, tool-calling | Native Next.js integration, edge-compatible (LangChain.js is NOT), built-in React hooks (useChat, useCompletion), 25+ provider integrations. AI SDK 6 adds first-class Agent abstraction with ToolLoopAgent. Reduces streaming chatbot boilerplate from 100+ lines to ~20. |
| OpenAI API | GPT-4o / GPT-4o-mini | LLM backbone for all AI agents | Best tool-calling reliability for agentic workflows. GPT-4o for complex negotiation analysis and legal document summarization. GPT-4o-mini for high-frequency tasks (chat, search, recommendations) to control cost. |
| pgvector (Supabase extension) | 0.8.x | Property similarity search, buyer matching | Store property description embeddings directly in Postgres — no separate vector DB needed. Enables semantic "find me similar properties" and buyer preference matching. HNSW index for sub-10ms similarity queries at scale. |
| OpenAI Embeddings | text-embedding-3-small | Generate property/buyer embeddings | Lowest cost embedding model with strong quality. 1536 dimensions. Used for property descriptions, buyer requirement profiles, and comps semantic matching. |

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Clerk | latest (2025) | Authentication + user management | Built-in organization support (critical for broker team accounts in the agent-for-hire marketplace). Native Next.js App Router middleware. Pre-built sign-in/sign-up UI. $0.02/MAU after 10K free — acceptable for early growth. Supabase Auth is cheaper at scale but lacks built-in org/team management needed for broker marketplace. |

### Data / Payments / Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Stripe | latest | Payment processing — flat fee collection | Industry standard. Stripe Connect for marketplace payouts (critical: sellers pay platform, platform pays licensed agents-for-hire). ACH transfers at 0.8% (capped $5) for large transactions is far cheaper than card fees on a $2,500 flat fee. |
| Cloudflare R2 | — | Property photo storage | S3-compatible, zero egress fees (vs AWS S3 which charges per GET). Real estate listings are read-heavy — buyers view photos many times. Egress-free is a direct cost advantage. Presigned PUT URLs for client-direct upload without server proxying. |
| Cloudflare Images | — | Photo transformation / optimization | Resize, crop, and optimize property photos on-the-fly via URL parameters. Real estate photos need multiple sizes (thumbnail, gallery, full). Pair with R2. |
| Resend | latest | Transactional email | Best developer experience for triggered emails (offer notifications, deadline alerts, status updates). React Email for templating. Outperforms SendGrid on DX. |

### MLS / Property Data

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SimplyRETS | REST API | MLS data feed (RETS/RESO Web API) | Simplest MLS integration layer available. Wraps RETS/RESO complexity behind a clean REST API. Supports complex geographic queries. IDX agreement still required per MLS board, but SimplyRETS manages the data pipeline. Start here for MLS access. |
| ATTOM Data API | REST API | Property data (AVMs, comps, tax records, sales history) | 158M+ US properties, deep historical transaction data needed for the AI negotiation assistant (comps analysis). Enterprise pricing is high — use for comps/valuation features, not as a listing source. |
| Spark API | REST API | Supplemental MLS access | Alternative to SimplyRETS for specific MLS boards not covered by SimplyRETS. Also provides market stats endpoint useful for the cost-benefit calculator. Evaluate coverage overlap with SimplyRETS before committing. |

### Document / e-Signature

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| DocuSign eSignature API | REST API | Legally binding e-signatures on transaction documents | NAR-partnered, legally binding under federal E-SIGN act across all 50 states. Developer plan starts at $600/yr for 40 envelopes/month (sufficient for MVP). Real estate specifically supported with state-specific form libraries. Dotloop is the real-estate-native alternative but is brokerage-oriented — DocuSign API gives more programmatic control for a platform integration. |

### State Compliance Workflow Engine

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Custom state machine (XState or plain Drizzle + DB-driven) | XState 5.x | State-by-state transaction workflow engine | No off-the-shelf solution covers all 50 states programmatically. The compliance workflow engine must be built custom. XState provides explicit state machine modeling (offer submitted → reviewed → countered → accepted → inspection period → closing) with clearly defined transitions, guards, and side effects. This is the hardest and most critical custom component. |

### Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel | — | Hosting / edge deployment | Next.js native deployment. ISR for listing pages (update from MLS without full rebuild). Edge middleware for auth checks. Automatic preview deploys. |
| Upstash Redis | — | Rate limiting, job queues, caching | Serverless Redis — no persistent server. Use for: MLS data caching (API rate limits), AI request rate limiting per user, buyer alert queuing. |
| Inngest | — | Background job processing | Serverless durable functions for: MLS sync jobs, AI-generated marketing copy generation (async after listing creation), buyer alert matching runs, email digests. Alternative to a full BullMQ/worker setup. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Schema validation | Validate all API inputs, form data, MLS API responses. Pair with react-hook-form for form validation. Non-negotiable for a compliance-sensitive platform. |
| React Hook Form | 7.x | Form management | Transaction forms, listing creation forms, offer forms. Works with Zod via `@hookform/resolvers`. |
| TanStack Query | 5.x | Server state / data fetching | Client-side data fetching for listing search results, offer status polling. Works alongside Next.js Server Components (use Server Components for initial render, TanStack Query for client interactions). |
| date-fns | 4.x | Date handling | Transaction deadlines, inspection periods, contingency windows are all date math. Immutable, tree-shakeable, no Moment.js bloat. |
| @aws-sdk/client-s3 | 3.x | R2 uploads (S3-compatible) | R2 uses the S3 API. Use the official AWS SDK configured to point at R2 endpoint. |
| react-dropzone | 14.x | Photo upload UI | Drag-and-drop multi-photo upload for listing creation. Pair with presigned R2 URLs for direct-to-storage uploads. |
| react-image-gallery | 1.x | Property photo gallery | Responsive gallery component for listing detail pages. |
| Mapbox GL JS | 3.x | Interactive property maps | Display listings on map, draw search radius, show neighborhood context. Mapbox has best US coverage and property-focused tile layers. Google Maps is an alternative but more expensive at scale. |
| Recharts | 2.x | Cost-benefit calculator charts | Display commission savings vs. platform fee. Market trend charts for the negotiation assistant. Lightweight, React-native. |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome | Linting + formatting (replaces ESLint + Prettier) | Faster, single tool, zero config for standard TypeScript projects. ESLint is still viable but Biome is the 2025 default for greenfield. |
| Playwright | E2E testing | Test critical transaction flows: listing creation → buyer inquiry → offer → acceptance. Required given legal compliance stakes. |
| Vitest | Unit / integration testing | Test state machine logic, compliance rule evaluation, fee calculation. Faster than Jest, native ESM support. |
| drizzle-kit | DB migrations | Drizzle's companion CLI. Generates and runs migrations. |
| Storybook | Component development | Build and document form components (offer wizard, listing form) in isolation before integration. |

---

## Installation

```bash
# Core framework
npx create-next-app@latest realestatehunter --typescript --tailwind --app --src-dir

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install @clerk/nextjs

# AI
npm install ai @ai-sdk/openai

# Payments + storage
npm install stripe
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Forms + validation
npm install zod react-hook-form @hookform/resolvers

# UI components
npm install @radix-ui/react-dialog @radix-ui/react-select  # shadcn installs these
npx shadcn@latest init

# Email
npm install resend react-email

# Maps
npm install mapbox-gl react-map-gl

# Data fetching
npm install @tanstack/react-query

# Utilities
npm install date-fns recharts react-dropzone

# Background jobs
npm install inngest

# State machines
npm install xstate @xstate/react

# Dev dependencies
npm install -D vitest @playwright/test biome
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Remix | Only if you need pure SSR with no static pages and prioritize form mutation DX over ISR. Real estate listing pages benefit heavily from ISR — Next.js wins here. |
| Drizzle ORM | Prisma 7 | If your team is junior or prefers schema-first workflow with GUI tooling (Prisma Studio). Prisma 7 is now pure TS and edge-compatible. The DX tradeoff is more abstraction vs. Drizzle's SQL transparency. |
| Supabase (managed Postgres) | Neon | Either works. Neon has better serverless cold-start scaling (branching for preview environments). Supabase wins because pgvector + PostGIS are pre-installed and the Auth/Storage products reduce initial vendor count. |
| Vercel AI SDK | LangChain.js | LangChain.js has richer pre-built agent chains and RAG tooling. Choose LangChain.js if complex multi-agent orchestration becomes necessary (e.g., a dedicated "transaction coordinator agent" that spans multiple LLM calls with persistent memory). LangChain.js is NOT edge-compatible — requires Node.js runtime for all routes using it. |
| Clerk | Supabase Auth | Choose Supabase Auth if MAU scale pushes Clerk costs too high ($0.02/MAU vs $0.003/MAU). Migration path exists. Supabase Auth lacks built-in org/team management — you'd build broker team accounts yourself. |
| Cloudflare R2 | AWS S3 | Only if already heavily invested in AWS ecosystem. R2's zero-egress pricing is a direct win for photo-heavy real estate listings. |
| DocuSign | Boldsign / SignWell | For MVP cost control — SignWell API starts at $0/month (free tier). Switch to DocuSign when transaction volume requires enterprise-grade real estate form libraries and NAR compliance assurance. |
| Inngest | BullMQ + Redis worker | BullMQ is more battle-tested for high-volume queues. Use BullMQ if Inngest's serverless pricing becomes prohibitive at scale or if you need fine-grained queue control. |
| Mapbox | Google Maps Platform | Google Maps has broader international coverage but is significantly more expensive at scale. For US-only residential real estate, Mapbox pricing is lower and tile quality is comparable. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain.js for all AI routes | Incompatible with edge runtime (Node.js `fs` module dependency). 101KB gzipped bundle. For Next.js + streaming chatbot, it adds unnecessary complexity. | Vercel AI SDK for standard agent/chat patterns. Add LangChain.js only for specific complex RAG pipelines that run as background jobs (not in edge routes). |
| Moment.js | Deprecated, mutable, 67KB bundle. Real estate date math (escrow periods, inspection windows) will have subtle bugs with timezone handling. | date-fns (immutable, tree-shakeable) or Temporal API (when stable). |
| Firebase / Firestore | NoSQL document store lacks the relational integrity needed for transaction state management. Cannot do PostGIS geographic queries. No native SQL for complex reporting. | Supabase (Postgres). |
| WordPress + IDX plugin | Zero programmatic control over listing data, AI integration is bolted-on, no custom transaction workflows. Common mistake for non-technical founders. | Custom Next.js app with SimplyRETS API. |
| Mongoose / MongoDB | Transaction workflows require ACID compliance across multiple tables (listings, offers, documents, payments). MongoDB transactions exist but are not the default mental model. | Drizzle + Postgres. |
| Redux | Severe overkill for the client-side state this app needs. Most state is server state (listings, offers, transactions) better handled by TanStack Query. | TanStack Query for server state, Zustand for any client-only UI state. |
| Puppeteer/scraping for MLS data | Violates MLS terms of service, IP bans, fragile. IDX compliance requires data feeds, not scraping. | SimplyRETS or direct IDX agreement with regional MLS board. |
| Vercel Blob | Inferior to Cloudflare R2 for this use case. Egress fees, less S3-compatible tooling. | Cloudflare R2 + Cloudflare Images. |

---

## Stack Patterns by Variant

**If you need sub-second buyer alert delivery (push notifications, not email):**
- Add Pusher Channels or Ably for WebSocket-based real-time alerts
- Pair with Inngest for the matching job that triggers the push

**If the agent-for-hire marketplace grows into a full broker network:**
- Add Stripe Connect (Express accounts) for licensed agent payouts
- This is already in the base stack — just activate Connect onboarding

**If you reach 100K+ listings and vector search slows:**
- Migrate embeddings to dedicated Pinecone or Qdrant cluster
- pgvector HNSW index handles ~1M vectors comfortably before requiring this

**If state compliance legal review requires structured document comparison:**
- Add LangChain.js as a background-job-only dependency (not in edge routes)
- Use it for document analysis pipelines, not chat endpoints

**If DocuSign API cost becomes prohibitive at volume:**
- Evaluate Boldsign API or SignWell — both E-SIGN compliant, lower per-envelope cost
- Migration is straightforward since the platform manages document flow

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15.2.x | React 19, Node.js 18.18+ | App Router stable. Turbopack stable in dev. |
| Tailwind CSS 4.x | shadcn/ui (2025 release), Next.js 15 | CSS-first config — no tailwind.config.js. All shadcn components updated for v4. |
| Drizzle ORM 0.45.x | PostgreSQL 14+, Node.js 18+ | Use stable 0.45.x not 1.0.0-beta — beta had breaking changes in Feb 2025. |
| Clerk (latest) | Next.js 15 App Router | Native App Router middleware support. Uses `@clerk/nextjs` package. |
| ai (Vercel AI SDK) 6.x | Next.js 15, React 19 | Agent abstraction added in v6. Edge-compatible. |
| @ai-sdk/openai | ai 6.x | Provider packages must match major SDK version. |
| XState 5.x | React 18/19, Node.js 18+ | v5 is a full rewrite with better TypeScript inference. NOT compatible with v4 APIs — don't mix. |
| react-hook-form 7.x | React 19 | Fully compatible. Use with `@hookform/resolvers` for Zod integration. |

---

## Sources

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) — Agent capabilities, streaming, edge compatibility (HIGH confidence)
- [Vercel AI SDK 6 Release Blog](https://vercel.com/blog/ai-sdk-6) — Version confirmation, Agent abstraction (HIGH confidence)
- [Next.js 15.5 Release Blog](https://nextjs.org/blog/next-15-5) — Stable version confirmation (HIGH confidence)
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — Compatibility confirmed (HIGH confidence)
- [SimplyRETS Developer API](https://simplyrets.com/idx-developer-api) — MLS integration capabilities (HIGH confidence)
- [ATTOM Data API Documentation](https://api.developer.attomdata.com/docs) — Property data scope (MEDIUM confidence — pricing requires direct contact)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector) — Vector search integration (HIGH confidence)
- [Clerk vs Supabase Auth comparison](https://clerk.com/articles/clerk-vs-supabase-auth) — Auth selection rationale (MEDIUM confidence — Clerk-authored, verify independently)
- [LangChain vs Vercel AI SDK 2026 Guide](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) — Edge incompatibility of LangChain.js confirmed (MEDIUM confidence)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/) — Zero-egress pricing, S3 compatibility (HIGH confidence)
- [DocuSign Developer Pricing](https://ecom.docusign.com/plans-and-pricing/developer) — API pricing tiers (HIGH confidence)
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) — Version 0.45.1 stable confirmed (HIGH confidence)
- [Stripe Connect SaaS Docs](https://docs.stripe.com/connect/saas) — Marketplace payout model (HIGH confidence)
- [Realie.ai Property API Comparison](https://blog.realie.ai/blog/exploring-the-best-u-s-property-data-apis-and-their-drawbacks) — ATTOM vs alternatives (MEDIUM confidence)

---

## Critical Uncertainties (Require Phase-Specific Research)

1. **MLS IDX access**: SimplyRETS requires an active IDX agreement with each MLS board. Approval time varies (weeks to months). MLS coverage gaps in rural markets. Needs legal/business research before assuming full US coverage at launch.

2. **State licensing requirements**: Several states (e.g., Colorado, Georgia, Kansas, Maryland) require a licensed broker for any real estate transaction. The "platform as facilitator, not agent" legal theory needs state-specific attorney review. This is a business/legal risk, not a technology risk, but it affects which workflows can be automated vs. must involve a human.

3. **DocuSign real estate form libraries**: State-specific real estate contracts (purchase agreements, addenda) vary significantly. DocuSign has a forms library for some states via NAR partnerships — coverage needs verification.

4. **ATTOM Data pricing**: ATTOM is enterprise-oriented with custom contract pricing. Budget impact on the comps/valuation feature is unknown until vendor conversation occurs.

---

*Stack research for: AI-powered real estate transaction platform (RealEstateHunter)*
*Researched: 2026-03-15*

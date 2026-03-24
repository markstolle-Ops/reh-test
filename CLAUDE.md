# RealEstateHunter

AI-powered real estate transaction platform replacing traditional agents across all 50 US states.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Auth**: Clerk (role-based: buyer/seller/agent)
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: Vercel AI SDK + OpenAI (agents, prompts, RAG)
- **Storage**: Cloudflare R2 (photos)
- **Jobs**: Inngest (async workflows)
- **Maps**: Mapbox GL
- **Payments**: Stripe
- **Email**: Resend
- **eSign**: SignWell
- **Cache**: Upstash Redis
- **MLS**: SimplyRETS (dev), RESO direct (prod)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Testing**: Vitest (unit), Playwright (e2e)
- **Linting**: Biome

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
```

## Project Structure

```
src/
  ai/           # AI agents, prompts, RAG seed data
  app/          # Next.js App Router pages
    (auth)/     # Clerk sign-in/sign-up
    agent/      # Agent-for-hire views
    api/        # API routes
    buyer/      # Buyer dashboard & search
    seller/     # Seller dashboard & listings
    listings/   # Public listing pages
    onboarding/ # User onboarding flow
  components/   # Shared UI components
  db/           # Drizzle schema & queries
  inngest/      # Background job definitions
  lib/          # Shared utilities
  services/     # External service integrations
  types/        # TypeScript type definitions
  workflow/     # State-by-state legal workflow engine
```

## Key Architecture Decisions

- State-by-state legal workflow configs in `src/workflow/` — each state has unique requirements
- Three user roles: buyer, seller, agent-for-hire (set via Clerk JWT metadata)
- AI agents in `src/ai/agents/` handle negotiation, transaction guidance, listing descriptions
- 51 state workflow configs (50 states + DC) with disclosure schemas

## Environment

- Copy `.env.example` to `.env.local` and fill in credentials
- SimplyRETS demo creds work for dev: `simplyrets / simplyrets`
- Clerk JWT template needs manual `role` claim setup (see .env.example)

## Git

- Remote: `MarkatFinAIGuru/REH-Test` on GitHub
- Branches: `staging` → `main` (2-tier deployment)
  - `staging`: active development & testing, pushes trigger preview deploy
  - `main`: production only — changes arrive via PR from staging after CI passes
  - **Never push directly to main**
- CI/CD: GitHub Actions (`.github/workflows/ci.yml`) → Vercel
- GSD planning in `.planning/` — 6 phases completed

## Owner

- Company: FinancialAIguru LLC (never "Inc.")

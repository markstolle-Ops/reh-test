---
phase: 05-agent-for-hire-marketplace-buyer-matching
plan: 01
subsystem: database, payments, api
tags: [stripe-connect, drizzle, arello, agent-marketplace, pgvector]

# Dependency graph
requires:
  - phase: 04-transaction-engine-state-compliance
    provides: transactions table for agentRequests FK; DB schema patterns
  - phase: 01-legal-framework-foundation
    provides: users table for agentProfiles FK; Drizzle schema conventions
provides:
  - agentProfiles table with Stripe Express account provisioning
  - agentLicenseChecks table with ARELLO + manual verification
  - agentRequests table for buyer-to-agent dispatch
  - buyerEvents table for behavioral matching data
  - createAgentProfile / getAgentProfile / updateAgentProfile services
  - verifyAgentLicense service (ARELLO XML + manual fallback)
  - GET/POST /api/agents, GET/PATCH /api/agents/[id], POST /api/agents/onboarding
  - /agent/dashboard Server Component with profile, verification, Stripe, and dispatch status
affects:
  - 05-02 (agent dispatch — uses agentRequests, agentProfiles, buyerEvents)
  - 05-03 (buyer matching — uses buyerEvents and agentProfiles.licenseStates)

# Tech tracking
tech-stack:
  added: [stripe@^20.4.1]
  patterns:
    - Lazy Stripe init via getStripe() — prevents build-time STRIPE_SECRET_KEY errors
    - ARELLO LVWS v2 XML API with Basic auth from ARELLO_API_CREDENTIALS env var
    - Stripe Express account provisioned at agent profile creation time
    - Manual verification fallback when ARELLO_API_URL not configured

key-files:
  created:
    - src/db/schema.ts (4 new tables + 3 new enums + 3 new relations)
    - src/services/agent/agent-profile.ts
    - src/services/agent/agent-profile.test.ts
    - src/services/agent/license-verification.ts
    - src/services/agent/license-verification.test.ts
    - src/app/api/agents/route.ts
    - src/app/api/agents/[id]/route.ts
    - src/app/api/agents/onboarding/route.ts
    - src/app/agent/dashboard/page.tsx
    - src/app/agent/dashboard/agent-profile-form.tsx
    - src/app/agent/layout.tsx
    - src/app/agent/onboarding/start/page.tsx
    - src/app/agent/onboarding/complete/page.tsx
    - src/app/agent/onboarding/refresh/page.tsx
    - migrations/0005_add_agent_tables.sql
    - migrations/0006_add_listing_embedding.sql
  modified:
    - src/lib/constants.ts (AGENT_FOR_HIRE_FEE_CENTS = 50000)
    - package.json / package-lock.json (stripe dependency)

key-decisions:
  - "Stripe initialized lazily via getStripe() — module-level new Stripe() throws at build time without STRIPE_SECRET_KEY"
  - "ARELLO integration: throws 'ARELLO not configured — use manual verification' when ARELLO_API_URL missing — manual is the MVP default"
  - "agentProfiles.licenseStates stored as text[] — enables array-contains filtering without join table"
  - "Agent lastName returned as initial only in GET /api/agents list — privacy (full name visible in /api/agents/[id])"
  - "Stripe Connect Express account provisioned at createAgentProfile time — enables immediate onboarding link generation"

patterns-established:
  - "Lazy external service init: wrap in getService() function, throw descriptive error if env var missing"
  - "Agent dashboard: Server Component fetches profile, shows either onboarding CTA (no profile) or status dashboard (profile exists)"

requirements-completed: [AGNT-01, AGNT-03, AGNT-04]

# Metrics
duration: 7min
completed: 2026-03-17
---

# Phase 05 Plan 01: Agent-for-Hire Foundation Summary

**Stripe Connect Express agent onboarding with ARELLO license verification, 4 new DB tables (agentProfiles/licenseChecks/requests/buyerEvents), full CRUD API, and agent dashboard**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T00:36:50Z
- **Completed:** 2026-03-17T00:43:33Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- Added 4 Drizzle tables (agentProfiles, agentLicenseChecks, agentRequests, buyerEvents) with 3 new enums and raw SQL migrations
- Created agent profile service with Stripe Express account provisioning + license verification (ARELLO XML and manual fallback)
- Built full agent REST API: list/create agents, read/update profile, Stripe Connect onboarding link
- Built /agent/dashboard Server Component showing profile, verification badge, Stripe status, availability toggle, and incoming requests placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema + agent profile service + license verification** - `4075582` (feat)
2. **Task 2: Agent API routes + dashboard page** - `597f04d` (feat)

**Plan metadata:** (docs commit — see below)

_Note: Task 1 used TDD (RED → GREEN flow). Fix for Stripe mock constructor pattern applied inline._

## Files Created/Modified

- `src/db/schema.ts` — 4 new tables + enums + relations (agentProfiles, agentLicenseChecks, agentRequests, buyerEvents)
- `src/lib/constants.ts` — AGENT_FOR_HIRE_FEE_CENTS = 50000
- `migrations/0005_add_agent_tables.sql` — CREATE TABLE for all 4 agent tables with indexes
- `migrations/0006_add_listing_embedding.sql` — ALTER TABLE listings ADD COLUMN embedding vector(1536)
- `src/services/agent/agent-profile.ts` — createAgentProfile, getAgentProfile, updateAgentProfile
- `src/services/agent/agent-profile.test.ts` — 5 passing tests
- `src/services/agent/license-verification.ts` — verifyAgentLicense (manual + ARELLO XML)
- `src/services/agent/license-verification.test.ts` — 4 passing tests
- `src/app/api/agents/route.ts` — GET (list, state-filterable) + POST (create, auth)
- `src/app/api/agents/[id]/route.ts` — GET (public) + PATCH (owner-only)
- `src/app/api/agents/onboarding/route.ts` — POST (Stripe Connect link generation)
- `src/app/agent/dashboard/page.tsx` — Server Component dashboard with full status display
- `src/app/agent/dashboard/agent-profile-form.tsx` — Client Component form for new agent signup
- `src/app/agent/onboarding/start|complete|refresh/page.tsx` — Stripe onboarding redirect pages

## Decisions Made

- Lazy Stripe init via `getStripe()` — module-level `new Stripe()` throws at build time without `STRIPE_SECRET_KEY`; this is a build-time safety requirement
- ARELLO throws immediately when `ARELLO_API_URL` is not set — manual verification is the MVP default
- `licenseStates` stored as `text[]` on agentProfiles — enables array-contains filtering without a join table
- Last name returned as initial only (`J.`) in `GET /api/agents` list for privacy; full name available in `GET /api/agents/[id]`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe mock constructor required `function` not arrow function**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** `vi.fn().mockImplementation(() => {...})` with arrow function is not a valid constructor mock in Vitest — `vi.fn(function() {...})` required
- **Fix:** Changed Stripe mock factory to use regular function expression
- **Files modified:** `src/services/agent/agent-profile.test.ts`
- **Verification:** All 5 agent-profile tests passed
- **Committed in:** `4075582`

**2. [Rule 3 - Blocking] Module-level `new Stripe()` failed at build time**
- **Found during:** Task 2 (build verification)
- **Issue:** `new Stripe(process.env.STRIPE_SECRET_KEY!)` at module top-level causes `Error: Neither apiKey nor config.authenticator provided` during Next.js page data collection at build time
- **Fix:** Moved Stripe initialization into lazy `getStripe()` function; throws descriptive error if env var missing
- **Files modified:** `src/services/agent/agent-profile.ts`, `src/app/api/agents/onboarding/route.ts`
- **Verification:** Build passes; tests patched with `vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock_key")`
- **Committed in:** `597f04d`

---

**Total deviations:** 2 auto-fixed (1 bug — Vitest constructor mock, 1 blocking — build-time Stripe init)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- Vitest hoisting behavior with Stripe constructor mock required `function` keyword (not arrow function) — documented as known Vitest pattern

## User Setup Required

**External services require manual configuration:**

**Stripe Connect:**
- `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API keys
- Enable Connect in Stripe Dashboard → Connect → Get started
- Add `NEXT_PUBLIC_BASE_URL` to .env (e.g., `https://realestatehunter.com` or `http://localhost:3000`)

**ARELLO License Verification (optional — manual fallback available for MVP):**
- `ARELLO_API_URL` — ARELLO LVWS v2 API endpoint (subscription required from ARELLO sales)
- `ARELLO_API_CREDENTIALS` — Base64-encoded `username:password` string

## Next Phase Readiness

- Agent profiles, license checks, requests, and buyer events tables are ready
- Agent CRUD API and dashboard are functional — agents can onboard and set up Stripe
- Plan 05-02 (buyer-to-agent dispatch) can now reference agentProfiles, agentRequests, and buyerEvents tables
- Fair Housing civil rights attorney review of buyer matching algorithm required before any production dispatch run (existing blocker)

---
*Phase: 05-agent-for-hire-marketplace-buyer-matching*
*Completed: 2026-03-17*

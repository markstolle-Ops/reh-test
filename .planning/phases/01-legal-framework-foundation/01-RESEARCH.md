# Phase 1: Legal Framework + Foundation - Research

**Researched:** 2026-03-16
**Domain:** Next.js 15 project scaffold, Clerk multi-role authentication, React cost-benefit calculator, state compliance classification for real estate
**Confidence:** HIGH (stack decisions already locked in STACK.md; legal taxonomy research verified against multiple authoritative sources)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-01 | User can create account as buyer or seller with email and password | Clerk Next.js quickstart + publicMetadata role assignment at signup |
| ACCT-02 | User receives email verification after signup | Clerk built-in email verification — enabled by default, zero config required |
| ACCT-03 | User can reset password via email link | Clerk built-in password reset flow — enabled by default |
| ACCT-04 | User session persists across browser refresh | Clerk JWT session cookie strategy + `auth()` in App Router server components |
| ACCT-05 | Buyer and seller have separate dashboards with role-specific views | Clerk `publicMetadata.role` + middleware-enforced route split (`/buyer/dashboard`, `/seller/dashboard`) |
| ACCT-06 | User can switch between buyer and seller roles | Clerk `user.update({ publicMetadata: { role } })` via Server Action + `user.reload()` on client |
| COST-01 | Cost-benefit calculator on homepage compares platform fees vs. 5-6% commission | React client component with controlled inputs (home price, state) + Recharts bar chart |
| COST-02 | Calculator takes home price and state as input, shows itemized savings | State selector (shadcn/ui Select) + itemized breakdown component; all math is pure client-side |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield build — no source code exists yet. The phase has four plans: scaffold the project stack, implement user accounts with Clerk multi-role auth, build the cost-benefit calculator, and produce the legal framework documents. The stack choices are fully resolved (see STACK.md): Next.js 15 App Router, TypeScript 5, Tailwind CSS v4, shadcn/ui, Supabase Postgres with Drizzle ORM, Clerk auth, Cloudflare R2.

The most technically nuanced element of Phase 1 is the Clerk multi-role setup. Clerk's recommended pattern for buyer/seller roles is `publicMetadata.role` exposed via the session token. This requires a custom JWT template or session claim in the Clerk Dashboard so the role is available in middleware without a network round-trip. Role switching is a server action that calls `clerkClient.users.updateUser()` from the backend then triggers `user.reload()` on the client side.

The legal framework deliverable (plan 01-04) is a documentation task, not a code task. It produces two artifacts: (1) an AI guidance taxonomy document that defines the permitted guidance / legal advice boundary for every AI prompt in future phases, and (2) a state compliance classification spreadsheet for the 10 launch states. Among the 10 launch states (CA, TX, FL, NY, GA, NC, AZ, OH, PA, IL), at least 3 are attorney-closing states (GA, NC, NY effectively), which means distinct workflow branches are required in Phase 4 before those states can go live. Phase 1 only needs to classify them — not implement the workflows.

**Primary recommendation:** Build the scaffold and auth first (plans 01-01 and 01-02) as every subsequent plan depends on them. The legal taxonomy document (01-04) must be reviewed by a real estate attorney before any AI prompt is written in Phase 2.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.2.x | Full-stack React framework with App Router | ISR for listing pages, co-located API routes, Server Components for SEO — locked in STACK.md |
| TypeScript | 5.x | Type safety across stack | Compliance-sensitive domain — types catch logic errors at compile time |
| Tailwind CSS | 4.x | Utility-first styling | CSS-first config (no tailwind.config.js), full shadcn/ui support, OKLCH colors |
| shadcn/ui | latest (2025 Tailwind v4 release) | UI component library | Copy-paste components for forms-heavy transaction UI; fully compatible with Tailwind v4 + React 19 |
| Drizzle ORM | 0.45.x | PostgreSQL ORM | Edge-compatible, SQL-transparent, 90% smaller bundle than Prisma |
| PostgreSQL (Supabase) | 16.x | Primary database | PostGIS + pgvector pre-installed, Row Level Security for multi-tenant isolation |
| Clerk | latest (2025) | Authentication + user management | Built-in org support, native App Router middleware, pre-built sign-in/sign-up UI |

### Supporting (Phase 1 specific)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Schema validation | Validate all API inputs and form data |
| React Hook Form | 7.x | Form management | Signup form, onboarding role selection |
| Recharts | 2.x | Chart rendering | Cost-benefit calculator savings bar chart |
| Biome | latest | Linting + formatting | Replaces ESLint + Prettier; set up in scaffold so all later plans inherit consistent style |
| Vitest | latest | Unit testing | Calculator logic, role-switching logic |
| Playwright | latest | E2E testing | Auth flows, dashboard routing by role |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clerk | Supabase Auth | Supabase Auth is cheaper at scale but lacks built-in org/team management needed for Phase 5 broker marketplace |
| Recharts | shadcn/ui charts (built on Recharts) | shadcn/ui chart components wrap Recharts with project theming applied; acceptable alternative that reduces custom styling work |
| Drizzle 0.45.x | Drizzle 1.0.0-beta | Beta had breaking changes in Feb 2025; use stable 0.45.x |

**Installation:**

```bash
# Scaffold
npx create-next-app@latest realestatehunter --typescript --tailwind --app --src-dir --import-alias "@/*"

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install @clerk/nextjs

# Forms + validation
npm install zod react-hook-form @hookform/resolvers

# Charts
npm install recharts

# Email (needed for ACCT-02, ACCT-03 via Clerk — but also set up Resend early)
npm install resend react-email

# Storage (scaffold the adapter even if not used until Phase 2)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# UI components
npx shadcn@latest init

# Dev tools
npm install -D vitest @playwright/test @biomejs/biome
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Clerk sign-in / sign-up route group
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (buyer)/            # Buyer role route group
│   │   └── dashboard/
│   ├── (seller)/           # Seller role route group
│   │   └── dashboard/
│   ├── api/                # API Route Handlers
│   │   └── user/
│   │       └── role/       # Server action endpoint for role switching
│   └── page.tsx            # Homepage with cost-benefit calculator
├── components/
│   ├── calculator/         # Cost-benefit calculator components
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   └── layout/             # Nav, footer, shell components
├── db/
│   ├── schema.ts           # Drizzle schema definitions
│   ├── index.ts            # DB connection singleton
│   └── migrations/         # drizzle-kit generated migrations
├── lib/
│   ├── auth.ts             # Clerk server helpers (currentUser, auth)
│   └── calculator.ts       # Commission savings calculation logic (pure functions)
├── middleware.ts            # Clerk middleware with role-based route protection
└── types/
    └── index.ts            # Shared TypeScript types
```

### Pattern 1: Clerk Role via publicMetadata + Session Token

**What:** Store the user's active role (`buyer` | `seller`) in `publicMetadata` and expose it through a custom session claim so middleware can read it without a network call.

**When to use:** Any route that must show different content or redirect based on whether the user is a buyer or seller.

**Setup in Clerk Dashboard:** Create a custom session token template that includes `{ "role": "{{user.public_metadata.role}}" }` as a claim.

**Middleware:**
```typescript
// Source: https://clerk.com/docs/guides/secure/basic-rbac
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isBuyerRoute = createRouteMatcher(["/buyer(.*)"]);
const isSellerRoute = createRouteMatcher(["/seller(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.role;

  if (isBuyerRoute(req) && role !== "buyer") {
    return Response.redirect(new URL("/sign-in", req.url));
  }
  if (isSellerRoute(req) && role !== "seller") {
    return Response.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jinja2|png|webp|svg|woff2?|ttf|eot|ico)).*)", "/(api|trpc)(.*)"],
};
```

**Role assignment at signup (Server Action):**
```typescript
// Source: https://clerk.com/docs/reference/backend/user/update-user-metadata
import { clerkClient } from "@clerk/nextjs/server";

export async function setUserRole(userId: string, role: "buyer" | "seller") {
  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  });
}
```

**Role switching on client (after Server Action completes):**
```typescript
// Source: https://clerk.com/docs/nextjs/reference/hooks/use-user
"use client";
import { useUser } from "@clerk/nextjs";

export function RoleSwitcher() {
  const { user } = useUser();

  async function switchRole(newRole: "buyer" | "seller") {
    await setUserRole(user!.id, newRole); // call server action
    await user!.reload(); // refresh session claims client-side
  }
  // ...
}
```

### Pattern 2: Drizzle + Supabase Connection

**What:** Single DB connection instance (singleton pattern) to avoid exhausting connection pool in serverless environment.

**When to use:** Every server component or API route that reads/writes to the database.

```typescript
// Source: https://orm.drizzle.team/docs/connect-supabase
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Singleton — critical for serverless environments (Next.js API routes)
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false }); // prepare: false required for Supabase Transaction pooler
export const db = drizzle({ client, schema });
```

**drizzle.config.ts:**
```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Important:** Supabase connection pooling (Transaction pool mode) requires `prepare: false`. Omitting this causes `prepared statement does not exist` errors in serverless environments.

### Pattern 3: Cost-Benefit Calculator as Pure Client Component

**What:** The homepage calculator is a pure React client component. All math is pure functions in `lib/calculator.ts` — no server calls needed.

**When to use:** Interactive input components (price slider, state selector) that update in real-time without a round-trip.

**Critical:** Recharts requires `"use client"` — it uses browser-only DOM APIs. Do NOT attempt to use Recharts in a Server Component.

```typescript
// src/lib/calculator.ts — pure functions, unit-testable with Vitest
export interface CommissionBreakdown {
  homePrice: number;
  state: string;
  traditionalCommission: number;   // 5-6% of home price
  platformFee: number;             // flat fee (configurable)
  titleFee: number;                // state-approximate
  attorneyFee: number;             // 0 in non-attorney states
  totalWithPlatform: number;
  totalWithAgent: number;
  savings: number;
}

export function calculateSavings(
  homePrice: number,
  state: string,
  commissionRate = 0.055  // 5.5% midpoint
): CommissionBreakdown {
  const traditionalCommission = homePrice * commissionRate;
  const platformFee = 2500; // flat fee placeholder — update when pricing is set
  const titleFee = estimateTitleFee(homePrice, state);
  const attorneyFee = ATTORNEY_STATES.includes(state) ? 1500 : 0;
  const totalWithPlatform = platformFee + titleFee + attorneyFee;
  const totalWithAgent = traditionalCommission + titleFee;
  return {
    homePrice,
    state,
    traditionalCommission,
    platformFee,
    titleFee,
    attorneyFee,
    totalWithPlatform,
    totalWithAgent,
    savings: totalWithAgent - totalWithPlatform,
  };
}
```

### Pattern 4: Legal Taxonomy Document Structure

**What:** A markdown/JSON document that defines the AI guidance boundary. Every AI prompt in Phase 2+ is written against this taxonomy. It is a governance document, not code.

**When to use:** Referenced in every AI system prompt. Checked during QA. Reviewed by attorney before Phase 2 ships.

Recommended sections:

```
## Permitted AI Guidance (Safe Harbor)
- "Here is what this form requires you to fill in"
- "The standard next step in [state] is X"
- "This inspection contingency gives you [N] days to respond"
- "Here are comparable sales data for this property" (when sourced from verified API)
- "A typical buyer in this situation requests X in a counteroffer"

## Prohibited AI Guidance (UPL Risk)
- "You are entitled to..."
- "Your legal remedy is..."
- "You should refuse to sign because..."
- "This clause is unenforceable"
- "You can sue for..."
- Interpreting ambiguous contract language in context of a user's specific deal

## Mandatory Disclaimer Language
Every AI response on a transaction topic must include:
"This is informational guidance, not legal advice. Consult a licensed real estate attorney in [state] for legal questions."

## Attorney Referral Trigger Conditions
Trigger the attorney referral workflow when the user asks:
- Questions about contract interpretation
- Questions about their legal rights or remedies
- Questions about disputes or litigation
- Questions about specific contract clause enforceability
```

### Anti-Patterns to Avoid

- **Putting role checks in component logic instead of middleware:** Role checks in UI components can be bypassed. Middleware runs before any component renders — enforce role-based routing there.
- **Using Clerk `privateMetadata` for active role:** `privateMetadata` is not available client-side. Use `publicMetadata` for the active role so `useUser()` can read it.
- **Recharts in a Server Component:** Will throw `window is not defined`. Must be wrapped in `"use client"`.
- **Calculating commission savings on the server:** The calculator is pure math with no sensitive data — client-side calculation is correct and avoids an unnecessary API round-trip.
- **Hard-coding platform fee in multiple components:** Define the fee constant in one place (`lib/constants.ts`). The pricing model will change.
- **Building the legal taxonomy document without attorney review:** The document is a legal governance artifact. Engineering can draft the structure but an attorney must review before it is treated as authoritative.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email verification | Custom SMTP + token flow | Clerk (built-in) | Token expiration, brute-force protection, deliverability — Clerk handles all of it |
| Password reset | Custom token + email flow | Clerk (built-in) | Rate limiting, secure token storage, expiry — complex to get right |
| Session persistence / JWT management | Custom cookie/JWT | Clerk (built-in) | Refresh rotation, CSRF protection, secure cookie flags |
| Role-based route protection | Custom auth checks per page | Clerk `clerkMiddleware()` | Runs at edge before any component; cannot be bypassed by client-side navigation |
| Commission math / savings display | Custom chart from scratch | Recharts | Bar/area charts with proper tooltip formatting, responsive containers — not trivial to build correctly |
| DB schema migrations | Manual SQL files | drizzle-kit generate + migrate | Handles column type inference, generates reversible migrations, prevents schema drift |

**Key insight:** Clerk handles the entire identity surface (sign-up, sign-in, email verification, password reset, session, MFA). Building any part of this manually for a compliance-sensitive real estate platform is an unacceptable security risk.

---

## Common Pitfalls

### Pitfall 1: Clerk session claims stale after role update

**What goes wrong:** User switches from buyer to seller. The Server Action updates `publicMetadata`. But the user's session token still contains the old `role` claim. Middleware still routes them as a buyer. The role switch appears to fail.

**Why it happens:** Clerk session tokens have a configurable TTL (default 60 seconds in dev, configurable). Until the token is refreshed, the old claim is still valid.

**How to avoid:** Call `user.reload()` on the client immediately after the server action completes. This forces a fresh session token fetch. Then use `router.push("/seller/dashboard")` to navigate.

**Warning signs:** Role switch UI shows "seller" but dashboard still shows buyer content.

---

### Pitfall 2: Supabase connection pool exhaustion in Next.js serverless

**What goes wrong:** Each API route invocation creates a new `postgres()` client. Under load, Supabase connection pool is exhausted. Errors: `remaining connection slots are reserved`, `too many clients`.

**Why it happens:** Serverless functions are stateless — naive implementations create a new DB connection per request. Supabase's default max_connections is 60.

**How to avoid:** Use the singleton pattern for the Drizzle/postgres client (see Pattern 2 above). In addition, use Supabase's built-in connection pooler (Transaction mode, port 6543) rather than the direct connection (port 5432) for serverless deployments.

**Warning signs:** `FATAL: remaining connection slots are reserved for non-replication superuser connections` in logs.

---

### Pitfall 3: Recharts SSR hydration mismatch

**What goes wrong:** The cost-benefit calculator page throws a hydration error on first load. Chart renders on server as empty/different from client.

**Why it happens:** Recharts uses `window` and DOM measurement APIs. These don't exist during SSR. If the component is not properly wrapped in `"use client"`, or if it is rendered server-side without dynamic import, hydration fails.

**How to avoid:** The entire calculator component (or at minimum the Recharts portion) must be a `"use client"` component. If using `next/dynamic`, add `{ ssr: false }` for the chart wrapper.

**Warning signs:** React hydration warning mentioning chart container dimensions; chart visible in dev but blank in production build.

---

### Pitfall 4: Attorney-state classification gap

**What goes wrong:** Plans 01-02 and 01-03 build workflows that implicitly assume all 10 launch states are FSBO-compatible. The legal taxonomy document (01-04) is written after the code, and the attorney review flags that GA and NC require attorneys at closing. Reworking the UX to show attorney-required states differently requires revisiting UI completed in earlier plans.

**Why it happens:** The legal framework plan is last in the sequence. But state classification affects UX decisions (what disclaimers to show, what CTA to present) that appear in Phase 1 dashboards.

**How to avoid:** Complete at least a draft state classification for the 10 launch states before building the dashboards. Even a simple data file (`src/lib/states.ts`) with `{ code: "GA", closingType: "attorney-required" }` provides a contract for the UX to reference. The attorney review can refine it — but the data shape must be defined upfront.

**Warning signs:** Dashboard CTA says "Start your transaction" without any state-awareness.

---

### Pitfall 5: Platform fee constant undefined during calculator build

**What goes wrong:** The cost-benefit calculator has a placeholder fee of `$0` or `TBD`. The homepage shows a calculator that gives misleading or obviously wrong savings numbers. Users lose trust in the math.

**Why it happens:** Pricing decision is deferred to business stakeholders. Engineers build the calculator anyway with undefined inputs.

**How to avoid:** Define a placeholder fee in a clearly-labeled constant (`PLATFORM_FEE_PLACEHOLDER = 2500`). The calculator should display the fee as "Platform fee: ~$2,500 (exact pricing coming soon)" until the fee is finalized. The constant must be the single source of truth — not repeated in calculator logic.

---

### Pitfall 6: Tailwind v4 CSS import conflicts with shadcn/ui init

**What goes wrong:** `npx shadcn@latest init` generates a `globals.css` that conflicts with the project's existing Tailwind v4 `@import "tailwindcss"` directive. CSS variables for shadcn theme colors are duplicated or overwritten. Components appear unstyled.

**Why it happens:** shadcn/ui's init wizard targets v4 but generates slightly different CSS import syntax depending on the Next.js version detected. Running `create-next-app` with `--tailwind` and then running `shadcn init` can produce conflicting `@tailwind` directives.

**How to avoid:** Follow the shadcn/ui official Tailwind v4 guide (https://ui.shadcn.com/docs/tailwind-v4) explicitly. Let `shadcn init` manage `globals.css` — don't pre-populate it before running init.

---

## Code Examples

Verified patterns from official sources:

### Clerk Next.js Quickstart — ClerkProvider setup

```typescript
// Source: https://clerk.com/docs/quickstarts/nextjs
// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Reading session role in a Server Component

```typescript
// Source: https://clerk.com/docs/references/nextjs/current-user
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function BuyerDashboard() {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "buyer") {
    redirect("/sign-in");
  }
  return <div>Buyer Dashboard for {user.firstName}</div>;
}
```

### Drizzle schema — users table with role

```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["buyer", "seller"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),               // Clerk user ID (string)
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("buyer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Recharts cost-benefit bar chart (client component)

```typescript
// Source: https://recharts.org/en-US/api/BarChart
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { calculateSavings } from "@/lib/calculator";

interface Props { homePrice: number; state: string; }

export function SavingsChart({ homePrice, state }: Props) {
  const breakdown = calculateSavings(homePrice, state);
  const data = [
    { name: "Traditional Agent", cost: breakdown.totalWithAgent },
    { name: "RealEstateHunter", cost: breakdown.totalWithPlatform },
  ];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Bar dataKey="cost">
          <Cell fill="#ef4444" />   {/* red for traditional */}
          <Cell fill="#22c55e" />   {/* green for platform */}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` + `tailwind.config.ts` | CSS-first `@theme` in `globals.css` | Tailwind v4 (2025) | No config file to maintain; all theme tokens in CSS |
| Clerk `updateUserMetadata()` | Clerk `updateUser({ publicMetadata })` | Clerk SDK 2025 | Unified API; old method still works but new is preferred |
| ESLint + Prettier (two tools) | Biome (single tool) | 2024-2025 | Single config, faster, no conflicts between linter and formatter |
| Drizzle `migrate()` inline in app | `drizzle-kit migrate` CLI | Drizzle 0.40+ | Migrations run at deploy time via CLI, not at app startup |

**Deprecated/outdated:**
- `tailwind.config.js`: Not used in Tailwind v4 — all configuration moves to CSS file
- `@tailwind base/components/utilities` directives: Replaced by `@import "tailwindcss"` in v4
- Clerk `createClerkClient()` per request: Use module-level `clerkClient` singleton import instead

---

## Launch State Classification (10 States)

This table is the seed for the legal taxonomy document in plan 01-04. It requires attorney review before being treated as authoritative.

| State | Code | Closing Type | Notes | FSBO Allowed? |
|-------|------|-------------|-------|---------------|
| California | CA | Title company | No attorney required; title companies handle closing | Yes |
| Texas | TX | Title company | No attorney required; title companies handle closing | Yes |
| Florida | FL | Title company | No attorney required | Yes |
| New York | NY | Attorney (customary) | Not legally mandated statewide but attorneys are virtually required by custom in most markets; $1,500-$3,000/side | Technically yes; practically no without attorney |
| Georgia | GA | Attorney required | Licensed attorney must conduct closing | Yes but attorney required at close |
| North Carolina | NC | Attorney required | Licensed attorney must handle closing | Yes but attorney required at close |
| Arizona | AZ | Title company | No attorney required | Yes |
| Ohio | OH | Title company | No attorney required | Yes |
| Pennsylvania | PA | Title company | No attorney required | Yes |
| Illinois | IL | Title company (customary attorney review) | Attorney review customary in Chicago; not statewide requirement | Yes |

**Classification:** 2 firmly attorney-required states (GA, NC), 1 effectively attorney-required (NY), 1 customary-attorney (IL), 6 pure title-company states (CA, TX, FL, AZ, OH, PA).

**Workflow implication for Phase 4:** At minimum 3 distinct closing workflow types must be built: title-company (6 states), customary-attorney (1-2 states), mandatory-attorney (2-3 states).

---

## Open Questions

1. **Platform fee amount**
   - What we know: $2,500 is a placeholder based on FSBO industry benchmarks
   - What's unclear: Final pricing decision — affects calculator accuracy and homepage credibility
   - Recommendation: Finalize before plan 01-03 ships; display as approximate until finalized

2. **Broker licensing strategy for Phase 1 legal opinion**
   - What we know: GA, NC, and several other states may require a licensed broker for any facilitated transaction (see PITFALLS.md Pitfall 2)
   - What's unclear: Whether a "document + tools only" platform model avoids broker licensing, or whether the platform's AI guidance triggers broker licensing requirements
   - Recommendation: This is the most critical item for plan 01-04. Engage a real estate attorney in GA, NC, and TX (as representative states of each closing type) before any state is declared live

3. **AI guidance taxonomy granularity**
   - What we know: The permitted/prohibited boundary must be defined and attorney-reviewed before Phase 2
   - What's unclear: How granular the taxonomy needs to be — a single document covering all states vs. state-specific taxonomies
   - Recommendation: Start with a universal taxonomy; flag state-specific exceptions during attorney review of Phase 1 legal opinion. Do not build state-specific AI prompts until taxonomy is approved.

4. **Supabase vs. Neon for Phase 1 database**
   - What we know: Stack.md selected Supabase (pgvector + PostGIS pre-installed, Auth + Storage products reduce vendor count)
   - What's unclear: Whether Neon's branching for preview environments would be valuable given the team size
   - Recommendation: Proceed with Supabase as decided; Neon migration path exists if needed. Decision is locked.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit/integration) + Playwright (E2E) |
| Config file | `vitest.config.ts` — Wave 0 (does not exist yet) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-01 | User can sign up as buyer or seller with email/password | E2E | `npx playwright test tests/auth/signup.spec.ts` | Wave 0 |
| ACCT-02 | Email verification sent after signup | E2E (Clerk sandbox) | `npx playwright test tests/auth/verify-email.spec.ts` | Wave 0 |
| ACCT-03 | Password reset via email link | E2E (Clerk sandbox) | `npx playwright test tests/auth/password-reset.spec.ts` | Wave 0 |
| ACCT-04 | Session persists across browser refresh | E2E | `npx playwright test tests/auth/session-persistence.spec.ts` | Wave 0 |
| ACCT-05 | Buyer and seller see separate dashboards | E2E | `npx playwright test tests/auth/role-dashboards.spec.ts` | Wave 0 |
| ACCT-06 | User can switch between buyer and seller roles | E2E + unit | `npx playwright test tests/auth/role-switch.spec.ts` | Wave 0 |
| COST-01 | Calculator shows savings vs. 5-6% commission | Unit | `npx vitest run src/lib/calculator.test.ts` | Wave 0 |
| COST-02 | Calculator accepts home price + state, shows itemized breakdown | Unit | `npx vitest run src/lib/calculator.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/calculator.test.ts` (calculator unit tests, < 5s)
- **Per wave merge:** `npx vitest run && npx playwright test tests/auth/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

All test infrastructure must be created. These are prerequisites before implementation tests can be written:

- [ ] `vitest.config.ts` — Vitest configuration: `npm install -D vitest @vitejs/plugin-react`
- [ ] `playwright.config.ts` — Playwright config with base URL, browser targets: `npx playwright install`
- [ ] `src/lib/calculator.test.ts` — Unit tests for commission calculation logic (covers COST-01, COST-02)
- [ ] `tests/auth/signup.spec.ts` — E2E Clerk signup flow (covers ACCT-01)
- [ ] `tests/auth/verify-email.spec.ts` — Email verification (covers ACCT-02; use Clerk test mode to bypass real email)
- [ ] `tests/auth/password-reset.spec.ts` — Password reset flow (covers ACCT-03)
- [ ] `tests/auth/session-persistence.spec.ts` — Refresh and verify session (covers ACCT-04)
- [ ] `tests/auth/role-dashboards.spec.ts` — Role-specific dashboard routing (covers ACCT-05)
- [ ] `tests/auth/role-switch.spec.ts` — Role switching and redirect (covers ACCT-06)
- [ ] `tests/fixtures/` — Clerk test users (buyer + seller) in Clerk test mode

**Note on Clerk E2E testing:** Clerk provides a "test mode" that allows programmatic user creation without real email. Use `CLERK_SECRET_KEY` in test environment with Clerk's API to seed test users. This is the correct approach — do not mock Clerk internals.

---

## Sources

### Primary (HIGH confidence)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs) — ClerkProvider setup, App Router middleware
- [Clerk Basic RBAC with publicMetadata](https://clerk.com/docs/guides/secure/basic-rbac) — Role implementation pattern
- [Clerk updateUser() — Backend SDK](https://clerk.com/docs/reference/backend/user/update-user-metadata) — Role mutation API
- [Clerk RBAC in Next.js 15 — Official Blog](https://clerk.com/blog/nextjs-role-based-access-control) — Full implementation guide
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — Compatibility confirmed
- [Drizzle ORM + Supabase Tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — Connection + migration setup
- [Drizzle ORM Supabase connect](https://orm.drizzle.team/docs/connect-supabase) — `prepare: false` requirement for Transaction pooler

### Secondary (MEDIUM confidence)
- [HomeLight — States requiring attorneys at closing](https://www.homelight.com/blog/states-that-require-real-estate-attorney-at-closing/) — 10-state classification
- [RETipster — Real estate closing agent map](https://retipster.com/real-estate-closing-agents/) — Attorney vs. title state overview
- [Amerisave — Real estate attorney guide 2026](https://www.amerisave.com/learn/real-estate-attorney-in-complete-guide-to-costs-requirements-when-you-actually-need-one) — Current (2026) attorney requirement overview
- [Recharts BarChart API](https://recharts.org/en-US/api/BarChart) — Chart component API verified
- [Drizzle ORM + PostgreSQL in Next.js 15 — Strapi Blog](https://strapi.io/blog/how-to-use-drizzle-orm-with-postgresql-in-a-nextjs-15-project) — Full setup walkthrough

### Tertiary (LOW confidence)
- [DEV Community — Next.js 15 + shadcn + Tailwind v4 scaffold](https://dev.to/darshan_bajgain/setting-up-2025-nextjs-15-with-shadcn-tailwind-css-v4-no-config-needed-dark-mode-5kl) — CSS init process; verify against official shadcn docs before following exactly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fully validated in STACK.md with official sources; no new technology introduced in Phase 1
- Architecture: HIGH — Clerk multi-role pattern is the documented official approach; Drizzle + Supabase singleton is official guidance
- Legal state classification: MEDIUM — sourced from multiple credible real estate law references but requires attorney review before treating as authoritative
- Pitfalls: HIGH — drawn from PITFALLS.md which was researched from official and authoritative sources; Clerk-specific pitfalls added from current documentation

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stack is stable; Clerk API evolves quickly — re-verify if > 30 days between research and implementation)

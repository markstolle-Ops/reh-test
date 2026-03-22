# Phase 3: Buyer Discovery + Disclosure + eSignature - Research

**Researched:** 2026-03-16
**Domain:** Property search (PostGIS + Mapbox), MLS ingestion (SimplyRETS), state disclosure forms (10 states), eSignature integration (SignWell)
**Confidence:** HIGH (search/map/eSign stack), MEDIUM (disclosure form content per-state), MEDIUM (SimplyRETS query params)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | Buyer can search properties by location (city, zip, state) | PostGIS city/zip text search + SimplyRETS `q` param covers this |
| SRCH-02 | Buyer can filter by price range, beds, baths, sqft, property type | Drizzle WHERE clauses + SimplyRETS query params (minPrice, maxPrice, minBeds, etc.) |
| SRCH-03 | Buyer can view properties on an interactive map | react-map-gl + Mapbox GL JS — must be 'use client' island |
| SRCH-04 | Buyer can save searches and receive email alerts when new matching listings appear | savedSearches table + Inngest cron fan-out → Resend emails |
| SRCH-05 | Buyer can save/favorite individual listings | savedListings junction table — simple toggle API |
| SRCH-06 | Search results display with photo thumbnails, price, key details | ListingCard component, results grid, consistent with existing listing detail pages |
| DISC-01 | Platform provides state-specific disclosure forms for all 10 launch states | Per-state JSON form schemas in DB; forms created at attorney review time |
| DISC-02 | Forms are fillable digitally within the platform | react-hook-form + shadcn/ui form components; PDF export via @react-pdf/renderer |
| DISC-03 | AI assists users in completing disclosure forms with guided prompts | AI SDK streaming tool call — same pattern as Phase 2 chatbot; UPL disclaimer required |
| DISC-04 | Completed forms stored and attached to transaction record | disclosureForms table linked to listingId + buyerUserId; JSON answers stored |
| SIGN-01 | Users can sign transaction documents digitally via DocuSign integration | SignWell API (MVP) — embedded iframe + REST document creation |
| SIGN-02 | eSignature workflow supports multi-party signing (buyer, seller, agent if applicable) | SignWell sequential/parallel signer support confirmed |
| SIGN-03 | Signed documents stored in transaction record with audit trail | SignWell audit trail JSON → store in signatureEnvelopes table |
| SIGN-04 | Platform complies with E-SIGN Act and UETA across all 50 states | SignWell is ESIGN + UETA compliant — confirmed |
| MLS-02 | MLS listings from partner feeds appear in buyer search results | SimplyRETS normalized JSON → mlsListings staging table |
| MLS-03 | Platform supports RESO Web API 2.0 for MLS data ingestion | SimplyRETS handles RESO Web API internally; platform consumes their normalized REST API |
</phase_requirements>

---

## Summary

Phase 3 adds the buyer side of the marketplace: search, map, saved listings, saved search alerts, state disclosure forms, and eSignature. The existing tech stack (Next.js 16, Drizzle, Supabase, Inngest, Resend, AI SDK v6) handles everything cleanly — no new infrastructure categories are required. Three new external integrations are added: Mapbox GL JS for maps, SimplyRETS for MLS listing ingestion, and SignWell for eSignature.

The search system has two listing sources: platform-native listings (already in the `listings` table) and MLS listings ingested via SimplyRETS into a staging table. Both must be surfaced together in search results. Geographic search uses PostGIS `ST_DWithin` with a `geometry(point, 4326)` column on the listings table — this requires a raw SQL migration to add the column and a GIST spatial index. City/zip text search is a simpler Drizzle `like` or `ilike` query that works for both sources.

Disclosure forms are the most content-heavy work in this phase. The 10 launch states each have different mandatory forms, field sets, and legal nuances. Forms should be modeled as JSON schemas stored in the database (state-configurable, no code deploy required). An AI assistant guides form completion using the same Vercel AI SDK streaming pattern from Phase 2, with explicit UPL disclaimers on every response.

SignWell is the right eSignature choice for MVP over DocuSign. It is E-SIGN + UETA compliant, supports embedded iframe signing, sequential multi-party signing, webhook events, and audit trails — at roughly 81% lower cost than DocuSign at equivalent volume ($56.25 vs $300/month for 100 documents). Migration to DocuSign is straightforward later if NAR-specific form libraries are needed.

**Primary recommendation:** Build buyer search as a unified query across `listings` + `mls_listings` tables. Use PostGIS for radius/geo search. Use SignWell embedded iframe for all document signing. Model disclosure forms as DB-driven JSON schemas for maximum configurability.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 | PostGIS queries, schema additions | Already in project |
| inngest | 3.52.7 | Saved search alert cron + fan-out | Already powering Phase 2 async jobs |
| resend | 6.9.3 | Alert emails to buyers | Already configured |
| ai / @ai-sdk/openai | 6.x / 3.x | AI disclosure form assistant | Same streaming pattern as Phase 2 chatbot |
| react-hook-form | 7.x | Disclosure form UI | Already installed |
| zod | 4.x | Form schema validation | Already installed |

### New Additions

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mapbox-gl | 3.x | Map tile rendering, clustering | Best US coverage, real estate tile layers, established pricing |
| react-map-gl | 8.x | React wrapper for Mapbox GL | vis.gl maintained, works with both Mapbox and MapLibre, standard React integration |
| @types/mapbox-gl | latest | TypeScript types for mapbox-gl | Required for typed integration |
| signwell | REST API | eSignature, embedded signing, audit trail | E-SIGN/UETA compliant, 25 free docs/month, embedded iframe, real estate customer case study |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SignWell | DocuSign | DocuSign costs $300+/month for 100 envelopes vs $56/month. DocuSign has NAR real estate form libraries — relevant only when those forms are needed (Phase 4+). Start with SignWell, migrate if needed. |
| Mapbox | Google Maps | Google Maps is more expensive at US residential scale. Mapbox has cleaner tile layers for property searches. |
| react-map-gl | Raw mapbox-gl | react-map-gl provides React lifecycle integration, declarative markers, and cleaner SSR handling. No downside at this scale. |
| Custom PostGIS queries | drizzle-postgis package | The `drizzle-postgis` npm package (Schmavery/drizzle-postgis) is community-maintained, low adoption. Use raw `sql` template literals for spatial WHERE clauses — more reliable and better understood. |

**Installation:**
```bash
npm install mapbox-gl react-map-gl @types/mapbox-gl
```

---

## Architecture Patterns

### Recommended Project Structure (additions to existing src/)
```
src/
├── app/
│   ├── buyer/
│   │   ├── search/           # SRCH-01/02/06 — search page with filters
│   │   └── saved/            # SRCH-04/05 — saved searches + favorites
│   └── api/
│       ├── search/           # unified search endpoint
│       ├── listings/[id]/save/    # SRCH-05 favorite toggle
│       ├── saved-searches/   # CRUD for saved search records
│       ├── disclosures/      # DISC-01/02/04 form CRUD
│       ├── disclosures/ai-assist/ # DISC-03 AI-guided prompts
│       ├── signatures/       # SIGN-01/02/03 SignWell adapter
│       └── mls/sync/         # MLS-02/03 Inngest-triggered ingestion
├── components/
│   ├── search/
│   │   ├── SearchFilters.tsx      # filter sidebar — 'use client'
│   │   ├── ListingCard.tsx        # thumbnail + key details card
│   │   ├── SearchResults.tsx      # results grid
│   │   └── MapView.tsx            # 'use client' Mapbox island
│   ├── disclosures/
│   │   ├── DisclosureForm.tsx     # dynamic form from JSON schema
│   │   └── AiFormAssistant.tsx    # streaming AI guidance widget
│   └── signatures/
│       └── SignatureEmbed.tsx     # SignWell iframe embed — 'use client'
├── db/
│   └── schema.ts             # add: savedListings, savedSearches, disclosureForms, signatureEnvelopes, mlsListings
├── inngest/
│   └── functions/
│       ├── match-saved-searches.ts    # cron: daily scan for new matching listings
│       └── sync-mls-listings.ts       # cron: SimplyRETS ingestion job
└── services/
    ├── search/
    │   ├── listings-search.ts     # unified query (platform + MLS)
    │   └── mls-client.ts          # SimplyRETS REST client
    ├── disclosures/
    │   ├── form-schema.ts         # per-state JSON schema registry
    │   └── ai-assist.ts           # AI SDK streaming for form guidance
    └── signatures/
        └── signwell.ts            # SignWell REST API adapter
```

### Pattern 1: Unified Search (Platform + MLS Listings)
**What:** A single `/api/search` endpoint queries both `listings` (platform-native) and `mls_listings` (SimplyRETS-ingested) tables and returns a unified normalized response.
**When to use:** All buyer search and map views.

```typescript
// src/services/search/listings-search.ts
// Source: Drizzle ORM docs + PostGIS geometry point guide

import { sql, and, gte, lte, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { listings, mlsListings } from "@/db/schema";

type SearchParams = {
  q?: string;          // city or zip text search
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  propertyType?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
};

export async function searchListings(params: SearchParams) {
  const { q, minPrice, maxPrice, minBeds, propertyType, lat, lng, radiusKm = 25, page = 1, limit = 24 } = params;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (q) {
    conditions.push(
      or(ilike(listings.city, `%${q}%`), ilike(listings.zip, `%${q}%`))
    );
  }
  if (minPrice) conditions.push(gte(listings.price, minPrice));
  if (maxPrice) conditions.push(lte(listings.price, maxPrice));
  if (minBeds) conditions.push(gte(listings.bedrooms, minBeds));
  if (propertyType) conditions.push(eq(listings.propertyType, propertyType as any));

  // Geographic radius search — requires PostGIS geometry column on listings
  if (lat && lng) {
    conditions.push(
      sql`ST_DWithin(
        ${listings.location}::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusKm * 1000}
      )`
    );
  }

  // status must be active
  conditions.push(eq(listings.status, "active"));

  const results = await db
    .select()
    .from(listings)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  return results;
}
```

### Pattern 2: PostGIS Column Migration (raw SQL — not Drizzle schema)
**What:** Add a `location geometry(point, 4326)` column and GIST index to the `listings` table. Must be a raw SQL migration — Drizzle ignores SRID in generated DDL.
**When to use:** Wave 0 of plan 03-01.

```sql
-- Migration: add PostGIS location to listings
ALTER TABLE listings ADD COLUMN location geometry(point, 4326);
CREATE INDEX listings_location_gist ON listings USING GIST(location);

-- Backfill from address (if geocoding available; otherwise leave NULL, fill on creation)
-- New listings: set on INSERT via geocoding service or from SimplyRETS lat/lng
```

**Note from STATE.md:** pgvector embedding column was added the same way in Phase 2. Follow identical pattern.

### Pattern 3: Mapbox Map View
**What:** A client-only React island showing listing pins on a map.
**When to use:** Plan 03-02 map view.

```typescript
// src/components/search/MapView.tsx
// Source: react-map-gl docs (visgl.github.io/react-map-gl)
'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapView({ listings }: { listings: SearchResult[] }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: -98.5, latitude: 38.9, zoom: 4 }}
      style={{ width: '100%', height: '600px' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      <NavigationControl />
      {listings.map(l => (
        <Marker key={l.id} longitude={l.lng} latitude={l.lat}>
          <div className="text-sm font-semibold bg-white px-2 py-1 rounded shadow">
            ${(l.price / 100).toLocaleString()}
          </div>
        </Marker>
      ))}
    </Map>
  );
}
```

**Critical:** Mapbox GL JS uses `window` — map component MUST be 'use client'. Use dynamic import with `ssr: false` if used inside a Server Component page. The stylesheet (`mapbox-gl/dist/mapbox-gl.css`) must also be imported client-side.

### Pattern 4: Saved Search Alert Cron (Inngest Fan-Out)
**What:** Daily cron scans all active saved searches, finds new matching listings, fans out per-user email events.
**When to use:** Plan 03-02 saved search alerts.

```typescript
// src/inngest/functions/match-saved-searches.ts
// Source: Inngest scheduled functions docs

export const matchSavedSearchesCron = inngest.createFunction(
  { id: "match-saved-searches-cron" },
  { cron: "0 9 * * *" },  // daily at 9am UTC
  async ({ step }) => {
    const savedSearches = await step.run("load-saved-searches", async () =>
      db.select().from(savedSearches).where(eq(savedSearches.active, true))
    );

    const events = savedSearches.map(s => ({
      name: "search/alert.check",
      data: { savedSearchId: s.id, userId: s.userId, filters: s.filters },
    }));

    await step.sendEvent("fan-out-alert-checks", events);
  }
);

export const checkSavedSearchAlert = inngest.createFunction(
  { id: "check-saved-search-alert" },
  { event: "search/alert.check" },
  async ({ event, step }) => {
    const { savedSearchId, userId, filters } = event.data;
    // query new listings since lastAlertSentAt
    // send Resend email if matches found
    // update savedSearches.lastAlertSentAt
  }
);
```

### Pattern 5: SignWell Embedded Signing
**What:** Create a document via SignWell REST API, get the embedded signing URL, render in an iframe.
**When to use:** Plans 03-05 for any document requiring signature.

```typescript
// src/services/signatures/signwell.ts
// Source: SignWell developers.signwell.com

const SIGNWELL_API_KEY = process.env.SIGNWELL_API_KEY!;
const SIGNWELL_BASE = 'https://www.signwell.com/api/v1';

export async function createDocumentForSigning(opts: {
  templateId?: string;
  pdfBuffer?: Buffer;
  signers: Array<{ name: string; email: string; role: string }>;
  fields: Record<string, string>;
}) {
  const response = await fetch(`${SIGNWELL_BASE}/documents`, {
    method: 'POST',
    headers: {
      'x-api-key': SIGNWELL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      test_mode: process.env.NODE_ENV !== 'production',
      files: opts.pdfBuffer ? [{ name: 'document.pdf', file_base64: opts.pdfBuffer.toString('base64') }] : undefined,
      template_ids: opts.templateId ? [opts.templateId] : undefined,
      recipients: opts.signers.map(s => ({
        id: crypto.randomUUID(),
        name: s.name,
        email: s.email,
        placeholder_name: s.role,
        send_email: false,  // we handle delivery; use embedded signing
      })),
      fields: opts.fields,
      embedded_signing: true,
    }),
  });
  return response.json();
}
```

Client-side embed uses SignWell's JS library:
```html
<script src="https://cdn.signwell.com/assets/embedded.js"></script>
```
Then: `new SignWellEmbed({ url: embeddedSigningUrl, events: { completed, declined, closed } }).open()`

### Pattern 6: AI Disclosure Form Assistant
**What:** Same streaming AI SDK pattern as Phase 2 chatbot, but scoped to form field guidance. Every response includes UPL disclaimer.
**When to use:** Plan 03-04.

The system prompt must include: "You are helping a user understand what information to provide in a real estate disclosure form. You are NOT providing legal advice. Always recommend consulting a licensed real estate attorney for legal guidance."

### Anti-Patterns to Avoid
- **Separate map and list as different pages:** Keep them as tab views within one search page. State is shared (selected listing, filters). Separate pages require duplicate filter state management.
- **Blocking listing creation on geocoding:** Geocoding can fail. Store `location` as nullable; populate asynchronously via an Inngest function. Do not make listing publish depend on geocoding success.
- **Storing full PDF binary in Postgres:** Store signed document PDFs in Cloudflare R2. Store only the SignWell document ID + audit trail JSON in Postgres.
- **Building a custom PDF form renderer:** Use react-hook-form with shadcn/ui components for the fillable digital form. Generate the PDF export from the stored JSON answers using `@react-pdf/renderer`. Do not try to render PDFs in-browser directly.
- **Fetching SimplyRETS on every search request:** SimplyRETS data should be ingested into a local `mls_listings` table via a scheduled Inngest job. Never call SimplyRETS in the hot path of a buyer search request (rate limits + latency).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| eSignature with audit trail | Custom signature canvas + crypto hash | SignWell API | E-SIGN/UETA legal compliance requires tamper-proof audit trail. Building this correctly is a multi-month legal engineering project. |
| Map tile serving | Custom tile server | Mapbox (via react-map-gl) | Tile hosting, CDN, satellite imagery, routing, geocoding — all provided. Self-hosting mapbox tiles requires a separate license. |
| Email template rendering | String concatenation HTML | react-email + Resend | Already in the project from Phase 2. Consistent pattern. |
| Saved search matching logic | Complex custom query engine | Standard Drizzle queries with stored filter JSON | The saved search filter is just a JSON blob re-run as a DB query. No ML or custom engine needed at this scale. |
| State disclosure form content | Drafting form fields from scratch | Attorney-reviewed per-state form schemas | This is legal content. Every field and every question must be reviewed by a real estate attorney licensed in that state before the form goes live. |
| Geocoding addresses | Manual lat/lng entry | Google Geocoding API or Mapbox Geocoding API | Address-to-coordinates conversion has many edge cases (P.O. boxes, new construction, rural addresses). Use an established geocoding API. |

**Key insight:** The eSignature domain looks simple (just sign a PDF) but has deep legal compliance requirements. The audit trail must log IP address, timestamp, signer identity, and document hash for E-SIGN Act compliance. SignWell provides all of this; building it would take months and require legal review.

---

## Common Pitfalls

### Pitfall 1: PostGIS Column Not Recognized by Drizzle
**What goes wrong:** Drizzle schema does not natively support the `geometry` type with SRID. Generating a migration from Drizzle schema produces `geometry` without `(point, 4326)`, breaking PostGIS queries.
**Why it happens:** Drizzle treats SRID as a hint, not a hard constraint in DDL. This is an open known issue (similar to the pgvector column in Phase 2).
**How to avoid:** Add the `location` column via a raw SQL migration file (not `drizzle-kit push`). Use `ALTER TABLE listings ADD COLUMN location geometry(point, 4326);` directly.
**Warning signs:** PostGIS queries return unexpected results or errors about coordinate systems.

### Pitfall 2: Mapbox Token Exposed Client-Side
**What goes wrong:** `NEXT_PUBLIC_MAPBOX_TOKEN` is exposed in the browser bundle — this is intentional for Mapbox (tokens are domain-scoped), but the token must have URL restrictions configured in the Mapbox dashboard.
**Why it happens:** Mapbox GL JS requires the token in the browser.
**How to avoid:** In the Mapbox dashboard, restrict the token to allowed URLs (vercel.app preview URLs + production domain). Never use an unrestricted token in production.
**Warning signs:** Token is used on other domains or billed for unexpected usage.

### Pitfall 3: MLS Listings Rate Limits Hit on Every Search
**What goes wrong:** Calling SimplyRETS on every buyer search request hits API rate limits and adds 200-800ms of latency.
**Why it happens:** Treating SimplyRETS as a real-time search API rather than a data feed.
**How to avoid:** Ingest SimplyRETS data into a local `mls_listings` table via an Inngest cron job (every 4-6 hours). Buyer search queries only the local DB.
**Warning signs:** Search response times spike during peak usage; SimplyRETS errors appear in logs.

### Pitfall 4: Disclosure Form Content Treated as a Code Problem
**What goes wrong:** Developer writes form field labels and questions from memory or from a Google search. Form fields are legally inaccurate or incomplete for the state.
**Why it happens:** Disclosure form content looks like a data entry task. It is actually legal document authorship.
**How to avoid:** Every disclosure form schema for every state must be reviewed and signed off by a licensed real estate attorney in that state before it is activated. Gate form activation on attorney_reviewed: true in the DB.
**Warning signs:** A user completes a disclosure form that omits a required statutory question (e.g., CA TDS lead paint pre-1978 disclosure).

### Pitfall 5: SignWell Embedded Signing Blocked by CSP
**What goes wrong:** The SignWell iFrame fails to load due to Content-Security-Policy headers blocking `signwell.com` as a frame-src.
**Why it happens:** Next.js default CSP or Vercel headers may block cross-origin iframes.
**How to avoid:** Add `frame-src https://www.signwell.com` to your CSP headers in `next.config.ts`. Also add `cdn.signwell.com` to `script-src` for the embed JS.
**Warning signs:** Browser console shows CSP violations; blank iFrame.

### Pitfall 6: Georgia Disclosure Is Optional But Should Be Offered
**What goes wrong:** Georgia does not require seller disclosure. Platform either omits the form entirely (making it seem like GA sellers have no disclosure) or mandates a form that GA sellers can legally decline.
**Why it happens:** Treating all 10 states as having identical mandatory disclosure requirements.
**How to avoid:** Model a `required: boolean` flag on each state's disclosure form schema. Georgia = optional but available. Display appropriate messaging per state.

### Pitfall 7: Zod 4 Breaking Changes
**What goes wrong:** Zod 4.x (in this project) has breaking API changes vs Zod 3.x. Most tutorials and StackOverflow answers are for Zod 3.
**Why it happens:** Project already uses Zod 4 (^4.3.6 in package.json). Phase 2 already navigated this. Ensure all new form schemas use Zod 4 API.
**Warning signs:** `z.string().min()` still works in v4, but `.email()` validation behavior differs; import paths changed.

---

## Code Examples

Verified patterns from official sources:

### PostGIS Radius Search with Drizzle (ST_DWithin)
```typescript
// Source: wanago.io/2025/01/13 (verified against Drizzle PostGIS geometry point guide)
// Cast to ::geography for accurate spherical distance (not flat-earth geometry)
.where(
  sql`ST_DWithin(
    ${listings.location}::geography,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
    ${radiusKm * 1000}
  )`
)
```

### PostGIS Schema Column (Drizzle)
```typescript
// Source: orm.drizzle.team/docs/guides/postgis-geometry-point
import { geometry } from 'drizzle-orm/pg-core';

location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 })
// NOTE: add via raw SQL migration — Drizzle ignores SRID in DDL generation
```

### Inngest Cron with Fan-Out
```typescript
// Source: inngest.com/docs/guides/scheduled-functions
export const alertCron = inngest.createFunction(
  { id: "saved-search-alert-cron" },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const searches = await step.run("load", async () => db.select().from(savedSearches));
    await step.sendEvent("fan-out", searches.map(s => ({
      name: "search/alert.check",
      data: { savedSearchId: s.id },
    })));
  }
);
```

### react-map-gl Basic Setup
```typescript
// Source: visgl.github.io/react-map-gl/docs/get-started
// npm install react-map-gl mapbox-gl @types/mapbox-gl
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';  // MUST import stylesheet

<Map
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  initialViewState={{ longitude: -98.5, latitude: 38.9, zoom: 4 }}
  style={{ width: '100%', height: '600px' }}
  mapStyle="mapbox://styles/mapbox/streets-v12"
/>
```

### SignWell Embedded iFrame
```typescript
// Source: developers.signwell.com/reference/embedded-iframe
// After creating document via POST /api/v1/documents, retrieve embedded_signing_url
const signWellEmbed = new SignWellEmbed({
  url: embeddedSigningUrl,
  events: {
    completed: (e) => { /* store documentId in DB, mark as signed */ },
    declined: (e) => { /* handle decline */ },
    error: (e) => { /* handle error */ }
  }
});
signWellEmbed.open();
```

---

## State Disclosure Forms: 10 Launch States

This is the highest-risk content area. Planner must scope time for attorney review before each state's form is activated.

| State | Form Name | Mandatory | Key Notes |
|-------|-----------|-----------|-----------|
| CA | Transfer Disclosure Statement (TDS) + Natural Hazard Disclosure | Yes | Most complex — TDS + NHD + lead paint (pre-1978) + special study zones. Required by Civil Code §1102. |
| TX | Seller's Disclosure Notice (TREC Form OP-H) | Yes | TREC-standardized form — use TREC's exact question wording. Updated periodically by TREC. |
| FL | Seller's Property Disclosure (Florida Realtors form) | Yes | Must disclose known defects materially affecting value; radon, HOA, coastal erosion. |
| NY | Property Condition Disclosure Statement | Yes (or $500 credit) | Seller can pay buyer $500 credit instead of providing form — platform should offer both paths. |
| GA | Seller's Property Disclosure Statement | Optional | GA does not require disclosure. Form is available but seller can decline. Model as required: false. |
| NC | Residential Property and Owners' Association Disclosure | Yes | Seller can answer "No Representation" — this is a valid and neutral response, not an evasion. |
| AZ | Residential Seller's Property Disclosure Statement (SPDS) | Yes | One of the more detailed disclosure forms; covers HOA, environmental, and utility systems. |
| OH | Residential Property Disclosure Form | Yes | Mandated by ORC §5302.30. Specific statutory questions required. |
| PA | Seller Property Disclosure Statement (SPD Form) | Yes | Required by Act 114 of 2000 (Real Estate Seller Disclosure Act). |
| IL | Residential Real Property Disclosure Act Report | Yes | Required by 765 ILCS 77; covers 23 specific questions about property condition. |

**Critical constraint:** Do not activate any disclosure form on the platform until it has been reviewed by a licensed real estate attorney in that state. Store `attorney_reviewed_at` and `attorney_name` on the form schema record.

---

## Schema Additions Needed

The following tables do not yet exist in `src/db/schema.ts` and must be added in this phase.

### New Tables

```typescript
// savedListings — buyer favorites (SRCH-05)
export const savedListings = pgTable("saved_listings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  listingId: text("listing_id"),          // platform listing
  mlsListingId: text("mls_listing_id"),   // MLS listing (nullable)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// savedSearches — buyer saved search filters + alert config (SRCH-04)
export const savedSearches = pgTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  filters: text("filters").notNull(), // JSON blob of SearchParams
  active: boolean("active").default(true).notNull(),
  lastAlertSentAt: timestamp("last_alert_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// disclosureForms — state disclosure form answers (DISC-01/02/04)
export const disclosureForms = pgTable("disclosure_forms", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  userId: text("user_id").notNull(),  // seller user ID
  state: text("state").notNull(),
  formSchemaId: text("form_schema_id").notNull(),
  answers: text("answers").notNull(), // JSON blob of field answers
  status: text("status").default("draft").notNull(), // draft | complete
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// disclosureFormSchemas — per-state form definitions (DISC-01)
export const disclosureFormSchemas = pgTable("disclosure_form_schemas", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  formName: text("form_name").notNull(),
  version: text("version").notNull(),
  fields: text("fields").notNull(), // JSON schema for the form fields
  required: boolean("required").default(true).notNull(),
  attorneyReviewedAt: timestamp("attorney_reviewed_at"),
  attorneyName: text("attorney_name"),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// signatureEnvelopes — signed documents (SIGN-01/02/03)
export const signatureEnvelopes = pgTable("signature_envelopes", {
  id: text("id").primaryKey(),
  signwellDocumentId: text("signwell_document_id").notNull(),
  listingId: text("listing_id").references(() => listings.id),
  disclosureFormId: text("disclosure_form_id"),
  status: text("status").default("pending").notNull(), // pending | completed | declined
  auditTrail: text("audit_trail"), // JSON from SignWell webhook
  documentPdfR2Key: text("document_pdf_r2_key"), // R2 storage key for signed PDF
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// mlsListings — SimplyRETS ingested listings (MLS-02/03)
export const mlsListings = pgTable("mls_listings", {
  id: text("id").primaryKey(),        // SimplyRETS mlsId
  mlsSource: text("mls_source").notNull(), // "simplyrets"
  rawData: text("raw_data").notNull(),     // JSON blob from SimplyRETS
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  price: integer("price"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  sqft: integer("sqft"),
  propertyType: text("property_type"),
  status: text("status"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  photoUrls: text("photo_urls").array().default([]),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
});
```

**Also needed:** Raw SQL migration to add `location geometry(point, 4326)` to the existing `listings` table + GIST index. Backfill using listing address geocoding in Wave 1.

---

## MLS Integration (SimplyRETS)

**Approach:** Ingest SimplyRETS data into `mls_listings` table via Inngest cron. Never call SimplyRETS in the search hot path.

**SimplyRETS API characteristics (MEDIUM confidence — from docs pages, not full API spec):**
- REST JSON API — clean HTTP endpoints
- Demo/test credentials available at `api.simplyrets.com` (user: `simplyrets`, pass: `simplyrets`)
- Supports RESO Web API and RETS feeds — MLS-03 satisfied by SimplyRETS internally
- Normalized listing model with: mlsId, address, price, beds, baths, sqft, lat/lng, photos array, agent info
- Geographic query via `points` param (array of lat/lng bounding polygon) — for initial scoped ingestion
- Status filter: `status=Active` for buyer-visible listings
- Pagination via `limit` and `offset` query params

**Inngest sync job pattern:**
```
cron (every 4h) → fetchSimplyRETS(page 1..N) → upsert mlsListings table → done
```

**IDX Note:** SimplyRETS requires an active IDX data feed agreement with each MLS board. For Phase 3, use SimplyRETS demo credentials for development. Production ingestion requires a signed IDX agreement — this is a business prerequisite, not a technical one.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DocuSign for all real estate eSign | SignWell / Dropbox Sign / DocuSign — evaluate per cost | 2023-2025 | DocuSign still dominant but expensive for startups. SignWell viable for MVP at 81% lower cost. |
| RETS feeds for MLS data | RESO Web API 2.0 | 2020-2023 | RETS is deprecated. RESO Web API is the standard. SimplyRETS handles the translation layer. |
| Google Maps for property maps | Mapbox (lower cost at US scale) | 2022+ | Mapbox has caught up in tile quality. Cost difference meaningful at scale. |
| PDF form + email for disclosures | Digital fillable forms in-platform | 2019+ (accelerated by COVID) | Houzeo, DotLoop, and Dotloop offer in-platform digital forms. Expected table stakes. |
| Cron jobs via separate worker process | Inngest serverless functions | 2023+ | No dedicated worker process needed. Already in Phase 2 stack. |

**Deprecated/outdated:**
- RETS (Real Estate Transaction Standard): Deprecated. SimplyRETS migrated all new feeds to RESO Web API. Don't reference RETS in any documentation.
- DocuSign Developer Plan at $600/yr: Current pricing is $50/month Starter ($600/yr) for 40 envelopes — still accurate but SignWell is better for MVP.

---

## Open Questions

1. **SimplyRETS IDX Agreement**
   - What we know: SimplyRETS demo credentials work for development. Production requires an IDX agreement per MLS board.
   - What's unclear: Which MLS boards cover the 10 launch states? How long does IDX approval take?
   - Recommendation: Use demo data for Phase 3 development. Flag as a business prerequisite before Phase 3 goes to production. IDX approval takes 2-8 weeks — start the application process now.

2. **Address Geocoding for PostGIS**
   - What we know: Platform-native listings have address fields but no lat/lng. Mapbox and Google both offer geocoding APIs.
   - What's unclear: Which geocoding provider to use and how to handle geocoding failures.
   - Recommendation: Use Mapbox Geocoding API (consistent with map provider). Store geocoded coordinates asynchronously via Inngest. Don't block listing publication on geocoding success.

3. **Attorney Review Timeline for Disclosure Forms**
   - What we know: All 10 state disclosure forms require attorney review before activation.
   - What's unclear: Is this review in progress? Has it been contracted?
   - Recommendation: Build the form schema infrastructure in Phase 3 but activate forms only after attorney review. Track activation state with `attorney_reviewed_at` flag. Ship Phase 3 with GA (optional form) and 1-2 reviewed states first if needed to hit a milestone.

4. **SignWell Document Templates vs Dynamic PDFs**
   - What we know: SignWell supports pre-built templates (stored in SignWell dashboard) and on-the-fly document creation from PDF uploads.
   - What's unclear: Should disclosure form PDFs be pre-uploaded as SignWell templates, or dynamically generated from JSON answers?
   - Recommendation: Use `@react-pdf/renderer` to generate a PDF from the completed disclosure form JSON answers. Upload that PDF to SignWell at signing time. Avoids tight coupling to SignWell template IDs in the database.

5. **MLS Listing Search vs Platform Listing Search: Unified or Separate?**
   - What we know: Both sources need to appear in buyer search. MLS listings will have different (likely richer) data fields.
   - What's unclear: How will the SearchResult card handle missing fields from MLS listings vs. platform listings?
   - Recommendation: Define a `NormalizedListing` TypeScript type as the common shape. Map both `listings` and `mlsListings` rows to this type in the service layer. UI components work only with `NormalizedListing`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (exists — scoped to `src/**`) |
| Quick run command | `npx vitest run --reporter=verbose src/services/search` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | City/zip search returns matching listings | unit | `npx vitest run src/services/search/listings-search.test.ts` | Wave 0 |
| SRCH-02 | Price/beds/baths/type filters narrow results correctly | unit | `npx vitest run src/services/search/listings-search.test.ts` | Wave 0 |
| SRCH-03 | Map view renders without crashing | manual-only | N/A — requires browser + Mapbox token | — |
| SRCH-04 | Saved search alert fan-out fires matching emails | unit | `npx vitest run src/inngest/functions/match-saved-searches.test.ts` | Wave 0 |
| SRCH-05 | Save/unsave listing toggles correctly | unit | `npx vitest run src/services/search/saved-listings.test.ts` | Wave 0 |
| SRCH-06 | NormalizedListing mapper handles both source types | unit | `npx vitest run src/services/search/normalize.test.ts` | Wave 0 |
| DISC-01 | Form schema registry returns correct schema for each state | unit | `npx vitest run src/services/disclosures/form-schema.test.ts` | Wave 0 |
| DISC-02 | Disclosure form answers persist to DB | unit | `npx vitest run src/services/disclosures/disclosure-form.test.ts` | Wave 0 |
| DISC-03 | AI assist system prompt includes UPL disclaimer | unit | `npx vitest run src/services/disclosures/ai-assist.test.ts` | Wave 0 |
| DISC-04 | Completed form links to listing in DB | unit | `npx vitest run src/services/disclosures/disclosure-form.test.ts` | Wave 0 |
| SIGN-01 | SignWell document creation returns embedded URL | unit (mock HTTP) | `npx vitest run src/services/signatures/signwell.test.ts` | Wave 0 |
| SIGN-02 | Multi-signer document includes both buyer and seller recipients | unit (mock HTTP) | `npx vitest run src/services/signatures/signwell.test.ts` | Wave 0 |
| SIGN-03 | Envelope record stored with audit trail after completion webhook | unit | `npx vitest run src/services/signatures/signwell.test.ts` | Wave 0 |
| SIGN-04 | SignWell adapter uses test_mode in non-production environments | unit | `npx vitest run src/services/signatures/signwell.test.ts` | Wave 0 |
| MLS-02 | SimplyRETS sync upserts records to mls_listings table | unit (mock HTTP) | `npx vitest run src/services/search/mls-client.test.ts` | Wave 0 |
| MLS-03 | MLS listings appear in unified search results | unit | `npx vitest run src/services/search/listings-search.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/services/search src/services/disclosures src/services/signatures`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/search/listings-search.test.ts` — covers SRCH-01, SRCH-02, MLS-02, MLS-03
- [ ] `src/services/search/saved-listings.test.ts` — covers SRCH-05
- [ ] `src/services/search/normalize.test.ts` — covers SRCH-06 (NormalizedListing mapper)
- [ ] `src/services/search/mls-client.test.ts` — covers MLS-02 (SimplyRETS sync with mocked HTTP)
- [ ] `src/inngest/functions/match-saved-searches.test.ts` — covers SRCH-04
- [ ] `src/services/disclosures/form-schema.test.ts` — covers DISC-01
- [ ] `src/services/disclosures/disclosure-form.test.ts` — covers DISC-02, DISC-04
- [ ] `src/services/disclosures/ai-assist.test.ts` — covers DISC-03 (UPL disclaimer in system prompt)
- [ ] `src/services/signatures/signwell.test.ts` — covers SIGN-01, SIGN-02, SIGN-03, SIGN-04

---

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM PostGIS Geometry Point Guide](https://orm.drizzle.team/docs/guides/postgis-geometry-point) — column definition, geometry type, distance query
- [react-map-gl Getting Started](https://visgl.github.io/react-map-gl/docs/get-started) — installation, basic Map setup, version 8.x
- [Inngest Scheduled Functions Docs](https://www.inngest.com/docs/guides/scheduled-functions) — cron syntax, fan-out pattern via step.sendEvent
- [SignWell Embedded iFrame Reference](https://developers.signwell.com/reference/embedded-iframe) — SignWellEmbed API, events, containerId option
- [SignWell API Landing Page](https://www.signwell.com/api/) — embedded signing, REST API, ESIGN/UETA compliance, real estate use case
- [wanago.io NestJS + PostGIS + Drizzle Radius Search](https://wanago.io/2025/01/13/api-nestjs-distance-radius-postgresql-drizzle/) — ST_DWithin pattern, ::geography cast, verified 2025

### Secondary (MEDIUM confidence)
- [SimplyRETS Developer API](https://simplyrets.com/idx-developer-api) — API capabilities summary; exact query params require full OpenAPI spec from docs.simplyrets.com
- [SignWell API Pricing vs DocuSign](https://www.signwell.com/resources/docusign-api-pricing/) — $56/month vs $300/month for 100 documents
- [SignWell Multi-Party Signing + Audit Trail](https://www.signwell.com/resources/electronic-signature-audit-trail/) — sequential signing, tamper-proof audit trail
- [Houzeo California Seller Disclosures 2025](https://www.houzeo.com/blog/california-seller-disclosures/) — CA TDS, NHD, lead paint requirements
- [HomeLight State Disclosure Requirements](https://www.homelight.com/blog/mandated-disclosures-real-estate/) — 10-state overview, GA optional vs others mandatory
- [docjacket.com State Disclosure Guide](https://www.docjacket.com/resources/state-real-estate-disclosure-requirements) — per-state form names (note: site rendered as CSS-only; content retrieved via search result snippets)

### Tertiary (LOW confidence — verify before implementation)
- SimplyRETS geographic query params (`points`, bounding box) — from search result snippets; verify against full OpenAPI YAML spec at docs.simplyrets.com before building the sync job
- GA "optional disclosure" claim — matches multiple search results but confirm with GA attorney before shipping
- NY "$500 credit in lieu of disclosure" option — matches multiple sources but confirm with NY attorney

---

## Metadata

**Confidence breakdown:**
- Standard stack (search, map, eSign): HIGH — all from official docs and current tutorials
- PostGIS patterns: HIGH — from Drizzle official guide + verified 2025 tutorial with exact code
- SignWell API: HIGH — from developers.signwell.com embedded signing reference
- SimplyRETS query params: MEDIUM — capabilities confirmed, exact parameter names need validation against full API spec
- State disclosure form content: MEDIUM — form names and mandatory status confirmed from multiple secondary sources; specific field content requires attorney review
- Inngest fan-out pattern: HIGH — from official Inngest docs

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack, 30 days) — except state disclosure form content, which should be attorney-reviewed at implementation time regardless of this research.

# Phase 2: Listing Creation + AI Core - Research

**Researched:** 2026-03-16
**Domain:** Property listings (Drizzle schema + R2 storage), AI description generation (Vercel AI SDK + GPT-4o vision), AVM/neighborhood data (HouseCanary/ATTOM), RAG chatbot (pgvector + Supabase), ISR listing pages (Next.js), flat-fee MLS syndication
**Confidence:** HIGH for core stack patterns (carried from Phase 1 + verified); MEDIUM for AVM provider selection (pricing opaque, requires vendor contact); MEDIUM for flat-fee MLS submission API (broker-network integration specifics require vendor engagement)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIST-01 | Seller can create a property listing with address, price, beds, baths, sqft, lot size, property type | Drizzle schema design; Zod + react-hook-form multi-step form pattern |
| LIST-02 | Seller can upload multiple photos per listing with drag-and-drop ordering | react-dropzone for upload zone; @dnd-kit/sortable for reorder; Cloudflare R2 presigned PUT URL for client-direct upload |
| LIST-03 | AI generates MLS-quality listing description from uploaded photos and property details | GPT-4o vision API via Vercel AI SDK; Inngest async job (not synchronous HTTP); image URLs passed as multimodal content |
| LIST-04 | Seller can edit AI-generated description before publishing | Editable textarea after AI draft arrives; status field on listing (`draft` / `active` / `pending` / `sold`) |
| LIST-05 | Seller can mark listing as active, pending, or sold | Drizzle enum `listing_status`; Server Action to update; ISR `revalidateTag` on status change |
| LIST-06 | Seller can edit listing details after publishing | Same listing form reused in edit mode; optimistic update + revalidation |
| LIST-07 | Listings display on the platform with photo gallery and full details | ISR listing detail page (`/listings/[id]`); react-image-gallery or shadcn carousel; Server Component with `revalidate` tag |
| LIST-08 | Listing supports residential sales (single-family, condos, townhouses) and land/lots | `property_type` enum in schema; conditional form fields for land (no beds/baths) |
| DATA-01 | Seller can get automated home value estimate (AVM) before listing | HouseCanary or ATTOM AVM API call server-side; result cached, not stored permanently |
| DATA-02 | AVM integrates with property data provider (HouseCanary or similar) | HouseCanary preferred (99% coverage); ATTOM as fallback; both require enterprise contract |
| DATA-03 | Buyer can view neighborhood data on listing pages | HouseCanary neighborhood data endpoints; or Walk Score + GreatSchools APIs (simpler) |
| DATA-04 | Market analysis shows price trends, days on market, inventory levels per area | HouseCanary market analytics endpoint or ATTOM market stats; displayed as Recharts chart on listing page |
| CHAT-01 | AI chatbot available 24/7 on every listing page | Vercel AI SDK `useChat` hook; streaming route at `/api/chat`; floating widget component |
| CHAT-02 | AI chatbot can answer state-specific process questions | RAG retrieval from pgvector knowledge base seeded with state law content + state-compliance-classification.md |
| CHAT-03 | AI chatbot can schedule showing requests | Structured tool call in Vercel AI SDK; creates `showing_requests` record; notifies seller via Resend |
| CHAT-04 | AI chatbot provides general guidance with "not legal advice" disclaimers | System prompt enforces ai-guidance-taxonomy.md; mandatory disclaimer appended to every transaction-topic response |
| CHAT-05 | AI chatbot responses are grounded in RAG knowledge base (not hallucinated) | pgvector + `match_documents` function; context injected before LLM call; agents never answer legal questions without retrieval |
| COST-03 | Every transaction shows full fee breakdown | Fee breakdown component reuses `calculateSavings()` from Phase 1; extended to show attorney/agent-for-hire fees where applicable |
| COST-04 | Fee breakdown is visible before user commits to a transaction | Displayed on listing detail page and in a pre-submission modal; state-aware using `STATE_INFO` from Phase 1 |
</phase_requirements>

---

## Summary

Phase 2 builds the seller-side core of the platform and the AI layer that differentiates it. Seven plans span three distinct technical domains: (1) data model + storage, (2) UI forms + listing display, and (3) AI services. The foundation from Phase 1 is solid — Next.js 16, Drizzle + Supabase Postgres, Clerk auth, Zod + react-hook-form, Cloudflare R2 adapter, and the legal taxonomy documents are all in place. Phase 2 adds the listing schema, photo management, ISR detail pages, GPT-4o description generation via Inngest, an AVM integration, and the RAG chatbot.

The most critical decisions for planning: (a) AI description generation MUST be asynchronous via Inngest — never synchronous in an HTTP handler; (b) the RAG chatbot MUST retrieve context from pgvector before every LLM call — the UPL guardrail document from Phase 1 is the governing constraint; (c) flat-fee MLS syndication is a broker-mediated business integration, not a pure API call — the planner should treat 02-07 as an integration task with a stub/manual fallback while vendor negotiation proceeds; (d) AVM provider (HouseCanary vs. ATTOM) requires a vendor decision before 02-05 can be fully implemented.

Photo ordering needs two libraries working together: react-dropzone handles the upload zone and file acceptance, while @dnd-kit/sortable handles the drag-to-reorder step after upload. react-beautiful-dnd is the legacy alternative but @dnd-kit is the current React 19 standard.

**Primary recommendation:** Build plans 02-01 → 02-03 first (schema, upload UI, listing pages) to create the data foundation, then 02-04 (AI description — Inngest async) and 02-05 (AVM) in parallel, then 02-06 (RAG chatbot — most complex), then 02-07 (fee transparency + MLS stub).

---

## Standard Stack

### Core (inherited from Phase 1 — already installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 16.1.6 | App Router, ISR, Server Actions | Installed |
| Drizzle ORM | 0.45.1 | Database schema + queries | Installed |
| PostgreSQL (Supabase) | 16.x | Primary DB with pgvector | Installed |
| Clerk | 7.0.4 | Auth + seller role enforcement | Installed |
| Zod | 4.3.6 | Form + API validation | Installed |
| react-hook-form | 7.71.2 | Form state | Installed |
| Tailwind CSS v4 | 4.x | Styling | Installed |
| shadcn/ui | latest | UI components | Installed |
| Recharts | 3.8.0 | Charts (market trends) | Installed |
| @aws-sdk/client-s3 | 3.x | Cloudflare R2 (S3-compatible) | Installed |
| @aws-sdk/s3-request-presigner | 3.x | Presigned PUT URLs | Installed |
| Inngest | — | Background job processing | NOT installed |
| Resend | latest | Transactional email | Installed |

### New Additions for Phase 2

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| ai (Vercel AI SDK) | 4.x or latest | LLM streaming, useChat hook, tool calling | Native Next.js streaming; useChat manages all client state; streamText for server route |
| @ai-sdk/openai | latest | OpenAI provider for AI SDK | Provider package for GPT-4o + embeddings |
| inngest | latest | Async AI job queue | AI description generation must be non-blocking; listing creation returns immediately, Inngest triggers generation |
| react-dropzone | 14.x | Photo upload drop zone | Handles file accept, validation, preview before upload |
| @dnd-kit/core | 6.x | Drag-and-drop base | Foundation for sortable photo list |
| @dnd-kit/sortable | 7.x | Sortable photo ordering | `useSortable` + `arrayMove` for drag-to-reorder after upload |
| react-image-gallery | 1.x | Photo gallery on listing pages | Responsive gallery with thumbnails, fullscreen; or use shadcn Carousel as simpler option |

**Note on AI SDK version:** Research found references to both v4 and v5 in progress. STACK.md referenced v6 but package.json does not yet have it installed. Verify the current stable version before installing — the API has changed between major versions. The `useChat` + `streamText` pattern is consistent across v4/v5.

### AVM Provider (Decision Required)

| Provider | Coverage | Pricing | Recommendation |
|----------|---------|---------|---------------|
| HouseCanary | 114M+ properties, 99% coverage | $0.30–$6.00/call, starts at $19/mo; custom enterprise | Preferred — better coverage, real-estate-focused |
| ATTOM Data | 158M properties | Starts ~$95/mo, custom enterprise beyond that | Fallback — broader dataset but higher base price |
| Walk Score / GreatSchools | Neighborhood data only (no AVM) | Walk Score API: free tier available; GreatSchools: $0.005/call | Use for neighborhood widget (DATA-03) independently of AVM |

**Decision gate:** HouseCanary or ATTOM vendor contact required before 02-05 can finalize. Build 02-05 with a mock AVM response stub initially.

### MLS Syndication (Plan 02-07)

| Approach | What It Is | Status |
|----------|-----------|--------|
| SimplyRETS | IDX data RETRIEVAL middleware (pull from MLS into platform) — NOT listing submission | Already evaluated in STACK.md for Phase 3 buyer search |
| Flat-fee MLS broker partner (e.g., ListWithFreedom, Homecoin, FlatFeeGroup) | Human-mediated broker who submits listing to MLS for a flat fee | This is the correct mechanism for seller MLS submission in Phase 2 |
| Direct MLS submission via broker portal | Broker-of-record submits to MLS via Matrix/Paragon portal on platform's behalf | Requires platform to have a broker relationship; manual or semi-automated |

**Key finding:** There is no universal "MLS submission API." Flat-fee MLS syndication is a brokerage service, not a data API. The platform must partner with a flat-fee MLS broker network (or own a broker license). Plan 02-07 should build: (a) the fee transparency UI component, and (b) a stub/webhook integration that triggers a manual or semi-automated submission workflow with the broker partner. Full automation requires a direct broker data agreement.

### Installation

```bash
# AI layer
npm install ai @ai-sdk/openai

# Background jobs
npm install inngest

# Photo upload + ordering
npm install react-dropzone @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Photo gallery (choose one)
npm install react-image-gallery
# OR use shadcn Carousel (already available if shadcn is initialized)

# (Optional) Neighborhood data
# Walk Score API: no npm package — direct fetch to api.walkscore.com
# GreatSchools: direct fetch to greatschools.org/api
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
src/
├── app/
│   ├── seller/
│   │   ├── dashboard/          # Seller dashboard (Phase 1)
│   │   ├── listings/
│   │   │   ├── new/            # Listing creation form (02-02)
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── edit/       # Edit listing (LIST-06)
│   │   │       └── page.tsx    # Seller listing manage view
│   ├── listings/
│   │   └── [id]/
│   │       └── page.tsx        # Public listing detail (ISR) (02-03)
│   └── api/
│       ├── listings/
│       │   ├── route.ts        # POST create, GET list
│       │   └── [id]/
│       │       └── route.ts    # GET, PATCH, DELETE
│       ├── upload/
│       │   └── presign/
│       │       └── route.ts    # Generate R2 presigned PUT URL
│       ├── avm/
│       │   └── route.ts        # AVM lookup (server-side, proxied)
│       └── chat/
│           └── route.ts        # Streaming chat endpoint (AI SDK streamText)
├── components/
│   ├── listing/
│   │   ├── ListingForm.tsx     # Multi-step seller creation form
│   │   ├── PhotoUploader.tsx   # react-dropzone + dnd-kit sortable
│   │   ├── ListingCard.tsx     # Search result card (Phase 3)
│   │   └── ListingGallery.tsx  # Photo gallery for detail page
│   ├── avm/
│   │   └── AvmWidget.tsx       # Home value estimate display
│   ├── chatbot/
│   │   └── ChatWidget.tsx      # useChat floating chatbot
│   ├── fees/
│   │   └── FeeBreakdown.tsx    # COST-03/04 fee transparency
│   └── neighborhood/
│       └── NeighborhoodWidget.tsx  # Walk score, school ratings, market trends
├── services/
│   ├── listing/
│   │   ├── create.ts           # Create listing service function
│   │   ├── update.ts
│   │   └── photos.ts           # Photo ordering, R2 URL management
│   ├── avm/
│   │   └── housecanary.ts      # HouseCanary API adapter (or stub)
│   └── chat/
│       └── rag.ts              # pgvector query + context assembly
├── ai/
│   ├── agents/
│   │   └── listing-description.ts  # GPT-4o vision system prompt + generation logic
│   ├── rag/
│   │   ├── seed/               # Scripts to seed KB from legal docs
│   │   └── query.ts            # match_documents wrapper
│   └── prompts/
│       ├── listing-description.ts  # Versioned prompt for description generation
│       └── chatbot-system.ts       # System prompt enforcing ai-guidance-taxonomy.md
├── inngest/
│   ├── client.ts               # Inngest client singleton
│   └── functions/
│       └── generate-description.ts  # Inngest function triggered after listing create
└── db/
    └── schema.ts               # Extended with listings, photos, showing_requests tables
```

### Pattern 1: Listing Schema Design

**What:** Drizzle schema for listings, photos, and showing requests. Photo ordering is stored as an array of photo IDs (integer array column) on the listing, not in a separate join table — simpler for Phase 2.

**When to use:** All listing CRUD operations.

```typescript
// src/db/schema.ts — additions for Phase 2
import {
  pgTable, pgEnum, text, integer, numeric, timestamp,
  boolean, index
} from "drizzle-orm/pg-core";

export const propertyTypeEnum = pgEnum("property_type", [
  "single_family", "condo", "townhouse", "land_lot"
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft", "active", "pending", "sold"
]);

export const listings = pgTable("listings", {
  id: text("id").primaryKey(), // cuid2 generated
  userId: text("user_id").notNull(), // Clerk user ID (seller)
  // Address
  streetAddress: text("street_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  // Details
  propertyType: propertyTypeEnum("property_type").notNull(),
  price: integer("price").notNull(), // in cents
  bedrooms: integer("bedrooms"),     // null for land/lot
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }), // 2.5 baths
  sqft: integer("sqft"),
  lotSizeSqft: integer("lot_size_sqft"),
  yearBuilt: integer("year_built"),
  // Content
  description: text("description"),         // AI-generated, editable
  descriptionStatus: text("description_status").default("pending"), // pending|generating|ready|edited
  // Status
  status: listingStatusEnum("status").default("draft").notNull(),
  // Photos — ordered array of photo IDs
  photoOrder: text("photo_order").array().default([]),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
}, (t) => [
  index("listings_user_id_idx").on(t.userId),
  index("listings_status_idx").on(t.status),
  index("listings_state_idx").on(t.state),
]);

export const listingPhotos = pgTable("listing_photos", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  r2Key: text("r2_key").notNull(),       // R2 object key (path)
  r2Url: text("r2_url").notNull(),        // Public CDN URL (Cloudflare Images transform URL)
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (t) => [
  index("listing_photos_listing_id_idx").on(t.listingId),
]);

export const showingRequests = pgTable("showing_requests", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  buyerUserId: text("buyer_user_id"),     // null if anonymous
  requestedDate: timestamp("requested_date").notNull(),
  status: text("status").default("pending"), // pending|confirmed|declined
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RAG knowledge base for chatbot (pgvector)
// Note: vector column requires Supabase pgvector extension
// Use Supabase raw SQL migration for vector type — Drizzle doesn't support vector() natively yet
// See: https://orm.drizzle.team/docs/extensions/pg#vector
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  source: text("source").notNull(),  // e.g. "state-compliance-GA", "ai-guidance-taxonomy"
  state: text("state"),              // null for universal chunks
  // embedding: vector(1536) — added via raw SQL migration
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Important:** The `vector(1536)` column for `knowledge_chunks.embedding` cannot be expressed in Drizzle ORM schema syntax without a custom type or extension. Use a raw SQL migration (Supabase dashboard SQL editor or `drizzle-kit` custom migration) to add the column and create the HNSW index separately.

### Pattern 2: R2 Presigned PUT Upload Flow

**What:** Client requests a presigned URL from a Server Action, then uploads directly to R2 without proxying through the Next.js server.

**When to use:** All photo uploads in the listing creation form.

```typescript
// src/app/api/upload/presign/route.ts
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, contentType, listingId } = await req.json();
  const key = `listings/${listingId}/${crypto.randomUUID()}-${fileName}`;

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 } // 5 minutes
  );

  return NextResponse.json({ url, key });
}
```

```typescript
// Client-side upload after receiving presigned URL
async function uploadPhoto(file: File, listingId: string) {
  const { url, key } = await fetch("/api/upload/presign", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentType: file.type, listingId }),
  }).then(r => r.json());

  await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return key; // Store key in DB after successful upload
}
```

### Pattern 3: Inngest Async AI Description Generation

**What:** Listing creation returns immediately. An Inngest event triggers the AI description job in the background. The seller's UI polls or receives a real-time update when the description is ready.

**Why:** GPT-4o vision calls with 5+ images take 10–30 seconds. HTTP requests in Next.js route handlers will time out at Vercel's 25-second limit for Edge or 300 seconds for Node.js — but more importantly, making users wait is bad UX.

```typescript
// src/inngest/client.ts
import { Inngest } from "inngest";
export const inngest = new Inngest({ id: "realestatehunter" });

// src/inngest/functions/generate-description.ts
import { inngest } from "@/inngest/client";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LISTING_DESCRIPTION_PROMPT } from "@/ai/prompts/listing-description";

export const generateListingDescription = inngest.createFunction(
  { id: "generate-listing-description" },
  { event: "listing/created" },
  async ({ event, step }) => {
    const { listingId, photoUrls, details } = event.data;

    // Mark as generating
    await step.run("mark-generating", async () => {
      await db.update(listings)
        .set({ descriptionStatus: "generating" })
        .where(eq(listings.id, listingId));
    });

    // Generate with GPT-4o vision
    const description = await step.run("generate-text", async () => {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        messages: [{
          role: "user",
          content: [
            { type: "text", text: LISTING_DESCRIPTION_PROMPT(details) },
            ...photoUrls.slice(0, 5).map((url: string) => ({
              type: "image" as const,
              image: url,
            })),
          ],
        }],
        maxTokens: 600,
      });
      return text;
    });

    // Save description
    await step.run("save-description", async () => {
      await db.update(listings)
        .set({ description, descriptionStatus: "ready" })
        .where(eq(listings.id, listingId));
    });

    return { listingId, description };
  }
);

// Trigger after listing creation:
// await inngest.send({ name: "listing/created", data: { listingId, photoUrls, details } });
```

**Inngest setup in Next.js:**

```typescript
// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateListingDescription } from "@/inngest/functions/generate-description";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateListingDescription],
});
```

### Pattern 4: Streaming RAG Chatbot

**What:** The chatbot API route retrieves relevant context from pgvector before calling the LLM. The Vercel AI SDK `streamText` streams the response. The client uses `useChat` to manage state.

**When to use:** The chat widget on every listing detail page.

```typescript
// src/app/api/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { queryKnowledgeBase } from "@/services/chat/rag";
import { CHATBOT_SYSTEM_PROMPT } from "@/ai/prompts/chatbot-system";
import { z } from "zod";
import { db } from "@/db";
import { showingRequests } from "@/db/schema";

export async function POST(req: Request) {
  const { messages, listingId, listingState } = await req.json();

  // RAG: retrieve relevant context before LLM call
  const lastUserMessage = messages[messages.length - 1]?.content ?? "";
  const context = await queryKnowledgeBase(lastUserMessage, listingState);

  const result = streamText({
    model: openai("gpt-4o-mini"), // gpt-4o-mini for cost control on high-frequency chat
    system: CHATBOT_SYSTEM_PROMPT({ context, listingState }),
    messages,
    tools: {
      scheduleShowing: tool({
        description: "Schedule a showing request for this property",
        parameters: z.object({
          requestedDate: z.string().describe("ISO date string for the requested showing"),
          notes: z.string().optional(),
        }),
        execute: async ({ requestedDate, notes }) => {
          await db.insert(showingRequests).values({
            id: crypto.randomUUID(),
            listingId,
            requestedDate: new Date(requestedDate),
            notes,
          });
          return { success: true, message: "Showing request submitted. The seller will confirm." };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
```

```typescript
// src/components/chatbot/ChatWidget.tsx
"use client";
import { useChat } from "ai/react";

export function ChatWidget({ listingId, listingState }: { listingId: string; listingState: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { listingId, listingState },
  });

  // Render floating chat UI ...
}
```

### Pattern 5: ISR Listing Detail Page

**What:** Listing detail pages are statically generated at build time and revalidated on-demand when the listing is updated.

**When to use:** All public listing pages at `/listings/[id]`.

```typescript
// src/app/listings/[id]/page.tsx
import { db } from "@/db";
import { listings, listingPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

// Cache with tag — call revalidateTag("listing-${id}") on any update
const getListingCached = unstable_cache(
  async (id: string) => {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: { photos: true },
    });
    return listing ?? null;
  },
  ["listing-detail"],
  { tags: ["listings"], revalidate: 3600 } // 1 hour fallback
);

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListingCached(params.id);
  if (!listing) notFound();
  // Render listing detail ...
}

// On-demand revalidation after listing update:
// import { revalidateTag } from "next/cache";
// revalidateTag(`listing-${id}`);
```

### Pattern 6: pgvector Knowledge Base for RAG

**What:** The RAG knowledge base stores chunked content from legal documents (ai-guidance-taxonomy.md, state-compliance-classification.md, upl-guardrail-document.md) as vector embeddings. A Supabase SQL function performs cosine similarity search.

**When to use:** Before every chatbot LLM call.

**Supabase SQL migration (raw SQL — not Drizzle schema):**

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge_chunks
ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_state text DEFAULT NULL
)
RETURNS TABLE(id text, content text, source text, similarity float)
AS $$
  SELECT id, content, source,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE (filter_state IS NULL OR state = filter_state OR state IS NULL)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

```typescript
// src/services/chat/rag.ts
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function queryKnowledgeBase(query: string, state?: string): Promise<string> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  const results = await db.execute(sql`
    SELECT content FROM match_documents(
      ${JSON.stringify(embedding)}::vector,
      0.7,  -- similarity threshold
      5,    -- top 5 chunks
      ${state ?? null}
    )
  `);

  return results.rows.map((r: any) => r.content).join("\n\n");
}
```

### Anti-Patterns to Avoid

- **Synchronous AI generation in HTTP handler:** Never call `generateText` directly in a Next.js API route for the description generation task. Use Inngest. A user submitting a listing will see a timeout or 30-second spinner.
- **Answering legal questions without RAG retrieval:** The chatbot MUST fetch context from pgvector before every LLM call on legal/process topics. Raw GPT-4o will confidently hallucinate state-specific legal requirements. This violates the UPL guardrail framework from Phase 1.
- **Hard-coding state-specific rules in chatbot prompts:** Do not put GA/NC attorney rules in the system prompt as hard-coded text. They belong in the pgvector knowledge base, which can be updated without a code deploy.
- **Storing AVM results permanently in the DB:** AVM data goes stale quickly. Cache the result for the session / TTL (e.g., 24 hours in memory or Upstash Redis), but do not store it as a persistent column on the listing.
- **Using react-beautiful-dnd for photo ordering:** react-beautiful-dnd is deprecated. Use @dnd-kit which is the active maintained library compatible with React 19.
- **Creating a new Inngest client per module:** Inngest client must be a singleton. Create it once in `src/inngest/client.ts` and import everywhere.
- **Assuming SimplyRETS handles listing submission:** SimplyRETS is a listing retrieval tool (IDX). It does NOT submit your listings to MLS. Flat-fee MLS submission requires a licensed broker partner arrangement.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming AI chat | Custom SSE or WebSocket server | Vercel AI SDK `streamText` + `useChat` | SDK handles streaming protocol, message state, error recovery, abort signals |
| File upload to object storage | Server-side proxy upload | R2 presigned PUT URL (already in Phase 1 stack) | Proxying large photos through Next.js exhausts memory and hits Vercel's 4.5MB body limit |
| Drag-to-reorder photos | Custom drag state + DOM manipulation | @dnd-kit/sortable + `arrayMove` | Accessibility, keyboard support, touch support, scroll containers — non-trivial |
| Background job queue | Custom Redis worker + BullMQ | Inngest | Serverless-compatible, retry logic, observability dashboard, no persistent worker process needed at Phase 2 scale |
| Vector similarity search | Custom cosine similarity in app code | pgvector `match_documents` Postgres function | GPU-free, co-located with data, HNSW index handles scale |
| AI response guardrails | Ad hoc prompt engineering | ai-guidance-taxonomy.md system prompt + RAG | Legal framework already defined; must reference it; do not re-invent |
| Photo resizing/optimization | Lambda + Sharp resize | Cloudflare Images URL transforms | R2 + Cloudflare Images handles resize via URL params (`?width=800&fit=cover`); no Lambda needed |
| Generating listing IDs | uuid() | `crypto.randomUUID()` (built-in) or cuid2 | crypto.randomUUID() is available in Node 18+ and Edge runtime natively |

**Key insight:** The AI layer in this phase is high-complexity but largely solved by the Vercel AI SDK + Inngest combination. The primary custom work is the system prompts (which must comply with the Phase 1 legal taxonomy), the RAG knowledge base seeding, and the Inngest job function body. The SDK handles the transport, streaming, and tool-calling protocol.

---

## Common Pitfalls

### Pitfall 1: AI Description Job Blocks Listing Publish

**What goes wrong:** Developer puts the `generateText` call inside the listing creation API route. User submits the form and waits 20+ seconds. Vercel Edge times out at 25 seconds. User sees 504. Listing may or may not have been saved.

**Why it happens:** It feels natural to generate the description at creation time and return it in the same response. LLM calls with image analysis are slow.

**How to avoid:** Save the listing immediately with `descriptionStatus: "pending"`. Fire `inngest.send({ name: "listing/created", ... })`. Return `201 Created` immediately. The UI shows "Generating your listing description..." with a spinner, polling `GET /api/listings/:id` every 2 seconds until `descriptionStatus === "ready"`.

**Warning signs:** Test times out at 25 seconds; unit test for listing creation has `await generateText()` inside the API handler.

---

### Pitfall 2: pgvector Extension Not Enabled on Supabase

**What goes wrong:** `knowledgeChunks` table is created. Seeding script tries to insert embeddings. Supabase throws `type "vector" does not exist`. RAG queries fail at runtime.

**Why it happens:** pgvector must be enabled per-project via `CREATE EXTENSION vector` before any vector column can be used. Drizzle-kit migrations don't automatically enable extensions.

**How to avoid:** Add a raw SQL migration as Wave 0 of plan 02-06:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
Run this in the Supabase SQL editor or via a dedicated Drizzle migration file. Then run the HNSW index creation migration. Verify with `SELECT * FROM pg_extension WHERE extname = 'vector';`.

**Warning signs:** `ERROR: type "vector" does not exist` in Supabase logs when running migrations.

---

### Pitfall 3: ChatBot Answers Legal Questions Without RAG Context

**What goes wrong:** A buyer asks "Can I cancel and get my deposit back in Georgia?" The chatbot, without RAG retrieval, answers based on GPT-4o training data. The answer may be plausible but is not grounded in the platform's legal framework. This creates UPL liability.

**Why it happens:** Developers sometimes skip RAG retrieval for "simple" queries to reduce latency. But the legal boundary is defined by question type, not by whether the answer is obvious.

**How to avoid:** The attorney referral trigger patterns defined in `docs/legal/ai-guidance-taxonomy.md` must be implemented as a pre-LLM check. Any question matching a trigger pattern routes to a referral response without LLM generation. For all other legal/process questions, always retrieve from pgvector first.

**Warning signs:** Chatbot answers "You are entitled to..." or "The seller must..."; no RAG retrieval in the chat route handler.

---

### Pitfall 4: Photo Ordering Stored Incorrectly

**What goes wrong:** Photo order is stored as a join table with an `order_index` integer. When photos are added, removed, or reordered, the indices must be re-numbered sequentially. Race conditions occur when two photos are uploaded in parallel. Reordering requires updating N rows.

**Why it happens:** SQL-first thinking leads to normalized order columns. Arrays are messier but sufficient for this problem.

**How to avoid:** Store photo ordering as a `text[]` column (`photo_order`) on the listing table containing an ordered list of photo IDs. Reordering is a single UPDATE to the `photo_order` array. Photo deletion removes the ID from the array and deletes the photo row. No index renumbering needed.

**Warning signs:** Multiple UPDATE statements firing when a user drags and drops a photo; `order_index` constraint violations in logs.

---

### Pitfall 5: R2 Public URL Served Directly (No Cloudflare Images Transform)

**What goes wrong:** Photos are stored in R2 and served via the raw R2 public URL. Full-resolution 8MB photos load on the listing detail page. Mobile browsers choke. LCP > 10 seconds.

**Why it happens:** Developers link directly to R2 URLs without passing through Cloudflare Images transformation.

**How to avoid:** Configure a Cloudflare Images "transform URL" pattern for the R2 bucket. Serve photos via the transform URL with size parameters: `https://imagedelivery.net/{account}/{key}/listing-thumb` (thumbnail preset) or `https://imagedelivery.net/{account}/{key}/listing-gallery` (full-size optimized). Define presets in the Cloudflare dashboard. Store only the R2 key in the database — not the full URL — and construct the transform URL at render time.

**Warning signs:** Photos served at > 1MB on listing card thumbnails; R2 URLs visible directly in browser network tab.

---

### Pitfall 6: AVM Data Displayed Without Disclaimer

**What goes wrong:** The seller sees an AVM number and treats it as authoritative. They list at the AVM price. If the AVM is wrong (±20% is common in some markets), the seller is financially harmed and may attribute it to the platform.

**Why it happens:** AVMs are displayed as precise numbers without context.

**How to avoid:** Always display AVM with: (a) a confidence range (e.g., "Estimated value: $425,000 — $465,000"), (b) the provider attribution ("Powered by HouseCanary"), and (c) a disclaimer: "This is an automated estimate, not an appraisal. For a precise value, consult a licensed appraiser." The disclaimer is consistent with the UPL framework — AVM is DATA-01 "home value estimate," not professional advice.

**Warning signs:** AVM displayed as a single number with no range or disclaimer.

---

### Pitfall 7: dnd-kit Context Outside of "use client" Boundary

**What goes wrong:** `DndContext` from @dnd-kit is used in a Server Component tree. Build fails or renders without drag capability.

**Why it happens:** @dnd-kit uses browser APIs and React context that require client-side rendering.

**How to avoid:** The entire `PhotoUploader` component must be wrapped in `"use client"`. For Next.js, use `DndContext` from `@dnd-kit/core` — do not attempt to use it in any Server Component. The hydration mismatch warning occurs if `DndContext` is server-rendered; add `suppressHydrationWarning` or use dynamic import with `{ ssr: false }` for the drag container.

---

## Code Examples

### Listing Form — multi-step structure with react-hook-form + Zod

```typescript
// Source: react-hook-form.com + project convention from Phase 1
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const listingSchema = z.object({
  streetAddress: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}$/),
  propertyType: z.enum(["single_family", "condo", "townhouse", "land_lot"]),
  price: z.number().int().min(10000).max(100000000),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  sqft: z.number().int().min(100).optional(),
  lotSizeSqft: z.number().int().min(100).optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

export function ListingForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
  });

  const propertyType = watch("propertyType");
  const isLand = propertyType === "land_lot";
  // Hide beds/baths fields when isLand === true
}
```

### Photo Uploader with dnd-kit sortable

```typescript
// src/components/listing/PhotoUploader.tsx
"use client";
import { useDropzone } from "react-dropzone";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

// Source: https://github.com/sujjeee/nextjs-dnd (Next.js + shadcn + dnd-kit pattern)
export function PhotoUploader({ listingId }: { listingId: string }) {
  const [photos, setPhotos] = useState<{ id: string; url: string; key: string }[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 20,
    maxSize: 20 * 1024 * 1024, // 20MB per photo
    onDrop: async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        const key = await uploadPhoto(file, listingId);
        setPhotos(prev => [...prev, { id: crypto.randomUUID(), url: URL.createObjectURL(file), key }]);
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPhotos(items => {
        const oldIndex = items.findIndex(p => p.id === active.id);
        const newIndex = items.findIndex(p => p.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed p-8 cursor-pointer">
        <input {...getInputProps()} />
        <p>Drag photos here, or click to select</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photos.map(p => p.id)} strategy={horizontalListSortingStrategy}>
          {photos.map(photo => <SortablePhoto key={photo.id} photo={photo} />)}
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

### Chatbot System Prompt (enforcing UPL taxonomy)

```typescript
// src/ai/prompts/chatbot-system.ts
// Source: docs/legal/ai-guidance-taxonomy.md (Phase 1 legal framework)
export function CHATBOT_SYSTEM_PROMPT({ context, listingState }: { context: string; listingState: string }) {
  return `You are a real estate information assistant for RealEstateHunter.

CONTEXT FROM KNOWLEDGE BASE:
${context}

STATE: ${listingState}

PERMITTED: You can provide factual information about this property, explain general real estate processes in ${listingState}, describe standard next steps, present comparable sales data, and help schedule showings.

PROHIBITED: You must NOT provide legal advice, interpret contracts, advise on legal entitlements, suggest litigation strategy, recommend specific offer prices, or provide investment recommendations.

DISCLAIMER: Append this exact text to any response touching transaction topics:
"This information is for general educational purposes only and does not constitute legal advice, real estate brokerage services, or financial advice. For advice specific to your transaction, consult a licensed real estate attorney, agent, or financial advisor in your state."

ATTORNEY REFERRAL: If the user asks about contract interpretation, cancellation rights, liens, title defects, legal remedies, or mentions fraud — do NOT answer the substantive question. Instead, say: "This question involves legal interpretation that requires a licensed real estate attorney. I recommend consulting an attorney licensed in ${listingState}."`;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LangChain.js for RAG chains | Vercel AI SDK `streamText` + manual RAG context injection | 2024–2025 | AI SDK is edge-compatible; LangChain.js requires Node.js runtime (blocks Vercel Edge) |
| react-beautiful-dnd | @dnd-kit (dnd-kit) | 2023 — react-beautiful-dnd unmaintained | @dnd-kit is the maintained React 19 standard for drag-and-drop |
| S3 presigned URLs via custom Lambda | AWS SDK v3 `getSignedUrl` directly from Next.js Server Action | AWS SDK v3 (stable 2022+) | No Lambda wrapper needed; Server Action signs URL, client uploads directly |
| `getStaticPaths` + `revalidate` | `unstable_cache` + `revalidateTag` | Next.js 14 App Router | Tag-based on-demand revalidation replaces time-based ISR for listing updates |
| Pinecone as separate vector DB | pgvector (Supabase extension) | 2024 | For < 1M vectors, pgvector HNSW eliminates a separate vector DB service |
| Single monolithic chatbot | Specialist agents with narrow system prompts + RAG | Architecture pattern (2024) | Retrieval quality collapses in monolithic stores; see ARCHITECTURE.md Anti-Pattern 1 |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Officially unmaintained; use @dnd-kit
- `getStaticPaths` + `fallback: "blocking"` in Pages Router: Use App Router `generateStaticParams` + `unstable_cache` in App Router
- Synchronous LLM generation in HTTP handlers for non-trivial tasks: Replace with Inngest async pattern

---

## Open Questions

1. **AVM provider selection (DATA-01, DATA-02)**
   - What we know: HouseCanary ($0.30–$6/call, $19/mo entry) and ATTOM (~$95/mo base) are both viable. HouseCanary has better real-estate-specific coverage.
   - What's unclear: Actual cost at expected query volume; which endpoints are needed for neighborhood data (DATA-03) in addition to AVM (DATA-01)
   - Recommendation: Build 02-05 with a mock AVM stub returning static data. Initiate HouseCanary vendor conversation in parallel. Replace stub with real client when contract is signed.

2. **Flat-fee MLS broker partner identity (MLS-related, plan 02-07)**
   - What we know: There is no universal MLS submission API. The platform needs a licensed broker partner who submits listings on its behalf. ListWithFreedom, Homecoin, and FlatFeeGroup are existing flat-fee MLS broker networks.
   - What's unclear: Which broker network will partner; whether they offer a programmatic integration or require a human workflow; whether the platform's broker licensing decision from Phase 1 affects this
   - Recommendation: Plan 02-07 should implement the fee transparency UI component fully, and build an MLS submission stub (webhook or API call placeholder) that can be wired to the real broker partner integration later.

3. **AI description generation polling vs. WebSocket**
   - What we know: Inngest async generation means the seller must wait for the description to be ready. The current plan polls `GET /api/listings/:id` for `descriptionStatus`.
   - What's unclear: Whether polling is acceptable UX or whether a WebSocket/Server-Sent Events connection is needed for near-real-time update
   - Recommendation: Polling every 2 seconds is fine for Phase 2 (generation takes 10–30 seconds, 15 polls maximum). Add WebSocket/SSE if user feedback shows it's frustrating.

4. **Vercel AI SDK exact current version**
   - What we know: STACK.md referenced v6; package.json doesn't have it yet; v4 is well-documented; v5 was in preview
   - What's unclear: Whether v4 or v5 should be installed; API differences between them
   - Recommendation: Run `npm info ai versions` before plan 02-04 to confirm the stable version. The `useChat` + `streamText` + `tool()` API pattern is the same in v4 and v5 with minor import path differences.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (unit/integration) + Playwright 1.58 (E2E) |
| Config file | `vitest.config.ts` — EXISTS (src/**/*.{test,spec}.{ts,tsx} only) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

**Note:** Vitest `include` is scoped to `src/**` — Phase 2 unit tests MUST live in `src/` (e.g., `src/services/listing/create.test.ts`). Playwright E2E tests live in `tests/` as established in Phase 1.

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIST-01 | Listing created with all required fields | Unit (service) | `npx vitest run src/services/listing/create.test.ts` | Wave 0 |
| LIST-02 | Photos uploaded and ordered correctly | Unit (service) | `npx vitest run src/services/listing/photos.test.ts` | Wave 0 |
| LIST-03 | AI description generated from listing data | Unit (inngest fn) | `npx vitest run src/inngest/functions/generate-description.test.ts` | Wave 0 |
| LIST-04 | Seller can edit AI description | E2E | `npx playwright test tests/listings/edit-description.spec.ts` | Wave 0 |
| LIST-05 | Seller can change listing status | Unit + E2E | `npx vitest run src/services/listing/update.test.ts` | Wave 0 |
| LIST-06 | Seller can edit published listing | E2E | `npx playwright test tests/listings/edit-listing.spec.ts` | Wave 0 |
| LIST-07 | Listing detail page renders with photos | E2E | `npx playwright test tests/listings/listing-detail.spec.ts` | Wave 0 |
| LIST-08 | Land/lot listing hides beds/baths | Unit (schema) | `npx vitest run src/services/listing/create.test.ts` | Wave 0 |
| DATA-01 | AVM returns estimate for address | Unit (stub) | `npx vitest run src/services/avm/housecanary.test.ts` | Wave 0 |
| DATA-03 | Neighborhood widget renders on listing page | E2E (smoke) | `npx playwright test tests/listings/listing-detail.spec.ts` | Wave 0 |
| CHAT-01 | Chatbot renders and accepts input | E2E | `npx playwright test tests/chatbot/chatbot-basic.spec.ts` | Wave 0 |
| CHAT-04 | Chatbot response includes disclaimer | Unit (prompt) | `npx vitest run src/ai/prompts/chatbot-system.test.ts` | Wave 0 |
| CHAT-05 | RAG retrieval returns relevant context | Unit (rag) | `npx vitest run src/services/chat/rag.test.ts` | Wave 0 |
| CHAT-03 | Showing request created via chatbot tool | Unit (tool) | `npx vitest run src/app/api/chat/route.test.ts` | Wave 0 |
| COST-03 | Fee breakdown shows all fee components | Unit | `npx vitest run src/components/fees/FeeBreakdown.test.tsx` | Wave 0 |
| COST-04 | Fee breakdown visible before commit | E2E | `npx playwright test tests/listings/listing-detail.spec.ts` | Wave 0 |

**Note:** DATA-02 (AVM provider integration) and DATA-04 (market analysis) tests depend on vendor selection; use mock adapter until contract is signed.

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose` (unit tests only, < 10s)
- **Per wave merge:** `npx vitest run && npx playwright test tests/listings/ tests/chatbot/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/listing/create.test.ts` — listing creation validation, covers LIST-01, LIST-08
- [ ] `src/services/listing/photos.test.ts` — photo ordering array logic, covers LIST-02
- [ ] `src/services/listing/update.test.ts` — status transitions, covers LIST-05, LIST-06
- [ ] `src/inngest/functions/generate-description.test.ts` — mock inngest + mock AI SDK, covers LIST-03
- [ ] `src/services/avm/housecanary.test.ts` — AVM stub adapter test, covers DATA-01 (with mock)
- [ ] `src/services/chat/rag.test.ts` — pgvector query function with mock Supabase, covers CHAT-05
- [ ] `src/ai/prompts/chatbot-system.test.ts` — disclaimer presence in output, covers CHAT-04
- [ ] `src/app/api/chat/route.test.ts` — tool call integration test, covers CHAT-03
- [ ] `src/components/fees/FeeBreakdown.test.tsx` — fee component renders all line items, covers COST-03
- [ ] `tests/listings/listing-detail.spec.ts` — Playwright: gallery renders, chatbot renders, fee breakdown visible
- [ ] `tests/listings/edit-description.spec.ts` — Playwright: AI draft appears, seller edits
- [ ] `tests/listings/edit-listing.spec.ts` — Playwright: edit after publish
- [ ] `tests/chatbot/chatbot-basic.spec.ts` — Playwright: chat widget opens, accepts input, returns response

**pgvector migration prerequisite (not a test file but required before any RAG test):**
- [ ] Supabase SQL migration: `CREATE EXTENSION IF NOT EXISTS vector;` + HNSW index + `match_documents` function

---

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK Docs — RAG Guide](https://sdk.vercel.ai/docs/guides/rag-chatbot) — streamText, embed, tool(), useChat pattern
- [Vercel AI SDK Templates — RAG](https://vercel.com/templates/next.js/ai-sdk-rag) — Official pgvector RAG template
- [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — Presigned PUT URL specification
- [Next.js ISR Docs](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — `unstable_cache` + `revalidateTag` in App Router
- [Inngest Next.js Quick Start](https://www.inngest.com/docs/getting-started/nextjs-quick-start) — `createFunction`, `serve`, `inngest.send` API
- [Inngest Background Jobs Guide](https://www.inngest.com/docs/guides/background-jobs) — Async job pattern
- [Supabase pgvector Docs](https://supabase.com/docs/guides/ai) — Vector extension, HNSW index, similarity search
- [dnd-kit GitHub + Docs](https://github.com/clauderic/dnd-kit) — useSortable, arrayMove, React 19 compatibility
- [Project docs/legal/ai-guidance-taxonomy.md](../../../../../../src/../docs/legal/ai-guidance-taxonomy.md) — Mandatory system prompt constraints (HIGH — first-party)
- [Project docs/legal/upl-guardrail-document.md](../../../../../../src/../docs/legal/upl-guardrail-document.md) — Per-feature UPL risk mapping (HIGH — first-party)

### Secondary (MEDIUM confidence)
- [HouseCanary Pricing](https://www.housecanary.com/pricing) — AVM API cost range ($0.30–$6/call, $19/mo entry)
- [ATTOM Data API Docs](https://api.developer.attomdata.com/docs) — AVM + comps endpoint availability; pricing requires direct contact
- [Seamless Image Uploads with Next.js + R2 — Level Up Coding](https://levelup.gitconnected.com/seamless-image-uploads-with-next-js-server-actions-and-cloudflare-r2-41d23a202760) — Server Action presigned URL pattern verified
- [BuildWithMatija — R2 + Next.js](https://www.buildwithmatija.com/blog/how-to-upload-files-to-cloudflare-r2-nextjs) — Implementation walkthrough

### Tertiary (LOW confidence — flag for validation)
- [Best Flat Fee MLS Services 2025 — RealEstateWitch](https://www.realestatewitch.com/read-this-before-you-go-with-a-flat-fee-mls-service/) — Confirms broker-mediated flat fee MLS model; no API integration details
- ListWithFreedom / Homecoin / FlatFeeGroup as broker network candidates — requires direct vendor contact to confirm programmatic integration options

---

## Metadata

**Confidence breakdown:**
- Standard stack (Next.js, Drizzle, Clerk, R2): HIGH — inherited from Phase 1 with working code
- AI description generation (Inngest + AI SDK): HIGH — official docs, pattern is standard
- RAG chatbot (pgvector + Vercel AI SDK): HIGH — official Supabase + Vercel AI SDK template confirmed
- Photo upload + ordering (R2 presign + dnd-kit): HIGH — multiple implementation examples verified
- AVM provider selection (HouseCanary vs. ATTOM): MEDIUM — pricing opaque, requires vendor contact
- Flat-fee MLS syndication mechanism: LOW-MEDIUM — broker-mediated model confirmed; API integration specifics unverified

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (AI SDK major version moves fast — re-verify before plan 02-04 implementation if > 30 days)

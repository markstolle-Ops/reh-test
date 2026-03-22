import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getRecentEvents } from "./buyer-events";
import { buildPreferenceSummary } from "./preference-profile";
import type { NormalizedListing } from "@/types";

// ─── getRecommendations ───────────────────────────────────────────────────────

/**
 * Generate personalized listing recommendations for a buyer via pgvector.
 *
 * Flow:
 *   1. Load trailing 90-day buyer events
 *   2. Build preference summary (objective features only — Fair Housing)
 *   3. Generate embedding via text-embedding-3-small
 *   4. Cosine similarity query against active listings with embeddings
 *   5. Exclude listings the buyer has already saved
 *   6. Return top 10 as NormalizedListing[]
 *
 * Returns empty array if buyer has < 3 events or no preference data.
 */
export async function getRecommendations(
  userId: string
): Promise<NormalizedListing[]> {
  const events = await getRecentEvents(userId);
  const summary = await buildPreferenceSummary(events);

  if (!summary) return [];

  // Generate embedding for preference summary
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: summary,
  });

  const embedding = embeddingResponse.data[0].embedding;
  const embeddingVector = `[${embedding.join(",")}]`;

  // pgvector cosine similarity query — excludes saved listings
  const rows = (await db.execute(sql`
    SELECT
      id,
      street_address,
      city,
      state,
      zip,
      price,
      bedrooms,
      bathrooms,
      sqft,
      property_type,
      status,
      created_at,
      (embedding <=> ${embeddingVector}::vector) AS distance
    FROM listings
    WHERE status = 'active'
      AND embedding IS NOT NULL
      AND id NOT IN (
        SELECT listing_id
        FROM buyer_events
        WHERE user_id = ${userId}
          AND event_type = 'listing_saved'
          AND listing_id IS NOT NULL
      )
    ORDER BY distance ASC
    LIMIT 10
  `)) as Array<{
    id: string;
    street_address: string | null;
    city: string;
    state: string;
    zip: string;
    price: number;
    bedrooms: number | null;
    bathrooms: string | null;
    sqft: number | null;
    property_type: string;
    status: string;
    created_at: string;
    distance: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    source: "platform" as const,
    streetAddress: row.street_address ?? undefined,
    city: row.city,
    state: row.state,
    zip: row.zip,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms != null ? parseFloat(row.bathrooms) : null,
    sqft: row.sqft,
    propertyType: row.property_type,
    photoUrl: null,
    lat: null,
    lng: null,
    status: row.status,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
  }));
}

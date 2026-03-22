import { sql } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db";

// ─── embedListingRaw ──────────────────────────────────────────────────────────

/**
 * Generate a text-embedding-3-small embedding for a listing and store it
 * in the listings.embedding vector column (added via migration 0006).
 *
 * Text format: "{beds}BR {baths}BA {sqft}sqft {propertyType} at {address}, {city}, {state} {zip} — ${price}"
 */
export async function embedListingRaw(listingId: string): Promise<void> {
  // Load the listing
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
      property_type
    FROM listings
    WHERE id = ${listingId}
    LIMIT 1
  `)) as Array<{
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
    price: number;
    bedrooms: number | null;
    bathrooms: string | null;
    sqft: number | null;
    property_type: string;
  }>;

  if (rows.length === 0) {
    throw new Error(`Listing not found: ${listingId}`);
  }

  const listing = rows[0];

  // Build human-readable text summary for embedding
  const bedsStr = listing.bedrooms != null ? `${listing.bedrooms}BR` : "";
  const bathsStr = listing.bathrooms != null ? `${listing.bathrooms}BA` : "";
  const sqftStr = listing.sqft != null ? `${listing.sqft}sqft` : "";
  const priceStr = `$${Math.round(listing.price / 100).toLocaleString()}`;

  const textParts = [bedsStr, bathsStr, sqftStr, listing.property_type]
    .filter(Boolean)
    .join(" ");

  const text = `${textParts} at ${listing.street_address}, ${listing.city}, ${listing.state} ${listing.zip} — ${priceStr}`;

  // Generate embedding via OpenAI
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = response.data[0].embedding;
  const embeddingVector = `[${embedding.join(",")}]`;

  // Store embedding in the vector column
  await db.execute(sql`
    UPDATE listings
    SET embedding = ${embeddingVector}::vector
    WHERE id = ${listingId}
  `);
}

// ─── embedListingFn ───────────────────────────────────────────────────────────

/**
 * Inngest function — triggered on 'listing/published' event.
 * The 'listing/published' event is fired in the PATCH handler when
 * a listing transitions to 'active' status (Phase 2, Plan 04).
 */
export const embedListingFn = inngest.createFunction(
  { id: "embed-listing" },
  { event: "listing/published" },
  async ({ event, step }) => {
    const listingId = (event.data as { listingId: string }).listingId;

    await step.run("generate-and-store-embedding", async () => {
      await embedListingRaw(listingId);
    });
  }
);

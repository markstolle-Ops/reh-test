import { sql } from "drizzle-orm";
import { db } from "@/db";
import { mlsListings } from "@/db/schema";

const SIMPLYRETS_BASE = "https://api.simplyrets.com/properties";

// ─── SimplyRETS Response Shape ────────────────────────────────────────────────

interface SimplyRetsListing {
  mlsId: string;
  listPrice: number;
  address: {
    city: string;
    state: string;
    postalCode: string;
    full?: string;
  };
  property: {
    bedrooms: number;
    bathsFull: number;
    area: number;
    type: string;
  };
  geo?: {
    lat: number;
    lng: number;
  };
  photos?: string[];
  mls: {
    status: string;
  };
}

// ─── Fetch Params ─────────────────────────────────────────────────────────────

interface FetchSimplyRetsParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch listings from SimplyRETS REST API with Basic auth.
 * Uses demo credentials for development; production requires an IDX agreement.
 *
 * Note: SimplyRETS prices are in dollars (not cents). The platform
 * stores prices in cents — conversion happens in syncMlsListings.
 */
export async function fetchSimplyRetsListings(
  params: FetchSimplyRetsParams,
): Promise<SimplyRetsListing[]> {
  const apiKey = process.env.SIMPLYRETS_API_KEY ?? "simplyrets";
  const apiSecret = process.env.SIMPLYRETS_API_SECRET ?? "simplyrets";

  const url = new URL(SIMPLYRETS_BASE);
  url.searchParams.set("status", "Active");

  if (params.q) url.searchParams.set("q", params.q);
  if (params.minPrice !== undefined) url.searchParams.set("minprice", String(params.minPrice));
  if (params.maxPrice !== undefined) url.searchParams.set("maxprice", String(params.maxPrice));
  if (params.minBeds !== undefined) url.searchParams.set("minbeds", String(params.minBeds));
  if (params.type) url.searchParams.set("type", params.type);
  if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) url.searchParams.set("offset", String(params.offset));

  const credentials = btoa(`${apiKey}:${apiSecret}`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`SimplyRETS API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<SimplyRetsListing[]>;
}

/**
 * Paginated sync of SimplyRETS listings into the local mlsListings table.
 * Called by the Inngest cron job every 4 hours.
 *
 * Upserts on id (SimplyRETS mlsId) to avoid duplicates across sync runs.
 */
export async function syncMlsListings(): Promise<void> {
  const PAGE_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const listings = await fetchSimplyRetsListings({
      limit: PAGE_SIZE,
      offset,
    });

    if (listings.length === 0) {
      hasMore = false;
      break;
    }

    const rows = listings.map((l) => ({
      id: l.mlsId,
      mlsSource: "simplyrets",
      rawData: JSON.stringify(l),
      city: l.address.city,
      state: l.address.state,
      zip: l.address.postalCode,
      // SimplyRETS prices are in dollars; store in cents for consistency
      price: Math.round(l.listPrice * 100),
      bedrooms: l.property.bedrooms,
      bathrooms: String(l.property.bathsFull),
      sqft: l.property.area,
      propertyType: l.property.type,
      status: l.mls.status,
      lat: l.geo?.lat !== undefined ? String(l.geo.lat) : null,
      lng: l.geo?.lng !== undefined ? String(l.geo.lng) : null,
      photoUrls: l.photos ?? [],
      lastSyncedAt: new Date(),
    }));

    await db
      .insert(mlsListings)
      .values(rows)
      .onConflictDoUpdate({
        target: mlsListings.id,
        set: {
          rawData: sql`excluded.raw_data`,
          city: sql`excluded.city`,
          state: sql`excluded.state`,
          zip: sql`excluded.zip`,
          price: sql`excluded.price`,
          bedrooms: sql`excluded.bedrooms`,
          bathrooms: sql`excluded.bathrooms`,
          sqft: sql`excluded.sqft`,
          propertyType: sql`excluded.property_type`,
          status: sql`excluded.status`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          photoUrls: sql`excluded.photo_urls`,
          lastSyncedAt: sql`excluded.last_synced_at`,
        },
      });

    offset += listings.length;

    // If we got a full page, there may be more; if less than PAGE_SIZE, stop
    if (listings.length < PAGE_SIZE) {
      hasMore = false;
    }
  }
}

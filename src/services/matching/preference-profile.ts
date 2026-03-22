import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import type { BuyerEvent } from "./buyer-events";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListingRow {
  id: string;
  price: number;
  bedrooms: number | null;
  bathrooms: string | null;
  sqft: number | null;
  propertyType: string;
  city: string;
  state: string;
}

// ─── buildPreferenceSummary ───────────────────────────────────────────────────

/**
 * Aggregate buyer events into a plain-English text description
 * suitable for generating an OpenAI embedding.
 *
 * FAIR HOUSING COMPLIANCE:
 * Only objective property features are used — price, bedrooms, bathrooms,
 * sqft, propertyType, city, state.
 * No school ratings, walkability scores, neighborhood quality, or any
 * demographic proxies are included.
 *
 * Returns null if fewer than 3 events (insufficient data for inference).
 */
export async function buildPreferenceSummary(events: BuyerEvent[]): Promise<string | null> {
  if (events.length < 3) return null;

  // Collect listing IDs from viewed/saved events
  const listingIds = events
    .filter((e) => e.listingId && e.eventType !== "search_executed")
    .map((e) => e.listingId!)
    .filter(Boolean);

  // Batch load listing details (deduplicated)
  const uniqueListingIds = [...new Set(listingIds)];
  let listingRows: ListingRow[] = [];

  if (uniqueListingIds.length > 0) {
    listingRows = (await db
      .select({
        id: listings.id,
        price: listings.price,
        bedrooms: listings.bedrooms,
        bathrooms: listings.bathrooms,
        sqft: listings.sqft,
        propertyType: listings.propertyType,
        city: listings.city,
        state: listings.state,
      })
      .from(listings)
      .where(inArray(listings.id, uniqueListingIds))) as ListingRow[];
  }

  // Build lookup map
  const listingMap = new Map<string, ListingRow>(listingRows.map((l) => [l.id, l]));

  // Aggregate prices and features from listing events
  const prices: number[] = [];
  const bedCounts: number[] = [];
  const propTypes: string[] = [];
  const cities: string[] = [];
  const states: string[] = [];

  for (const event of events) {
    if (event.listingId && event.eventType !== "search_executed") {
      const listing = listingMap.get(event.listingId);
      if (listing) {
        prices.push(listing.price);
        if (listing.bedrooms != null) bedCounts.push(listing.bedrooms);
        if (listing.propertyType) propTypes.push(listing.propertyType);
        if (listing.city) cities.push(listing.city);
        if (listing.state) states.push(listing.state);
      }
    }

    if (event.eventType === "search_executed" && event.metadata) {
      try {
        const meta = JSON.parse(event.metadata) as Record<string, unknown>;
        if (typeof meta.minPrice === "number") prices.push(meta.minPrice);
        if (typeof meta.maxPrice === "number") prices.push(meta.maxPrice);
        if (typeof meta.minBeds === "number") bedCounts.push(meta.minBeds);
        if (typeof meta.propertyType === "string") propTypes.push(meta.propertyType);
        if (typeof meta.city === "string") cities.push(meta.city);
      } catch {
        // Ignore malformed metadata
      }
    }
  }

  // Need at least some data points
  if (prices.length === 0 && bedCounts.length === 0) return null;

  // Compute aggregates
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const modalBeds = mode(bedCounts);
  const modalPropType = mode(propTypes);
  const modalCity = mode(cities);
  const modalState = mode(states);

  // Build summary string — objective property features only (Fair Housing compliant)
  const parts: string[] = [];

  if (modalBeds != null) parts.push(`${modalBeds} bedroom`);
  if (modalPropType) parts.push(modalPropType);
  if (minPrice != null && maxPrice != null) {
    const minK = Math.round(minPrice / 10000); // cents to $k
    const maxK = Math.round(maxPrice / 10000);
    if (minK === maxK) {
      parts.push(`$${minK}k`);
    } else {
      parts.push(`$${minK}k-$${maxK}k`);
    }
  }
  if (modalCity) parts.push(modalCity);
  if (modalState) parts.push(modalState);

  if (parts.length === 0) return null;

  return parts.join(" ");
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Return the most frequently occurring value in an array.
 * Returns null if the array is empty.
 */
function mode<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const freq = new Map<T, number>();
  for (const val of arr) {
    freq.set(val, (freq.get(val) ?? 0) + 1);
  }
  let maxCount = 0;
  let result: T = arr[0];
  for (const [val, count] of freq.entries()) {
    if (count > maxCount) {
      maxCount = count;
      result = val;
    }
  }
  return result;
}

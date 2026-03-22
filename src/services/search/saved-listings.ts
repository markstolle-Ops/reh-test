import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { listings, mlsListings, savedListings } from "@/db/schema";
import type { NormalizedListing } from "@/types";
import { normalizeMlsListing, normalizePlatformListing } from "./normalize";

/**
 * Toggle a saved listing for a buyer.
 *
 * If the listing is not saved: inserts a new savedListings row and returns { saved: true }.
 * If the listing is already saved: deletes the row and returns { saved: false }.
 *
 * @param userId  - Clerk user ID
 * @param listingId - listing id (platform listing id or MLS listing id)
 * @param source  - "platform" | "mls"
 */
export async function toggleSavedListing(
  userId: string,
  listingId: string,
  source: "platform" | "mls"
): Promise<{ saved: boolean }> {
  const alreadySaved = await isListingSaved(userId, listingId);

  if (alreadySaved) {
    // Delete — remove from saved
    const condition =
      source === "mls"
        ? and(
            eq(savedListings.userId, userId),
            eq(savedListings.mlsListingId, listingId)
          )
        : and(
            eq(savedListings.userId, userId),
            eq(savedListings.listingId, listingId)
          );

    await db.delete(savedListings).where(condition);
    return { saved: false };
  } else {
    // Insert — add to saved
    await db.insert(savedListings).values({
      id: crypto.randomUUID(),
      userId,
      listingId: source === "platform" ? listingId : null,
      mlsListingId: source === "mls" ? listingId : null,
    });
    return { saved: true };
  }
}

/**
 * Returns true if the listing is currently saved by the user.
 *
 * Checks both listingId and mlsListingId columns via a single query with OR.
 */
export async function isListingSaved(
  userId: string,
  listingId: string
): Promise<boolean> {
  const rows = await db
    .select()
    .from(savedListings)
    .where(
      and(
        eq(savedListings.userId, userId),
        or(
          eq(savedListings.listingId, listingId),
          eq(savedListings.mlsListingId, listingId)
        )
      )
    );

  return rows.length > 0;
}

/**
 * Returns all saved listings for a buyer as NormalizedListing[].
 *
 * Fetches savedListings rows, then resolves both platform and MLS listings
 * by their respective IDs and normalizes the results.
 */
export async function getSavedListings(
  userId: string
): Promise<NormalizedListing[]> {
  // Fetch all saved rows for this user
  const savedRows = await db
    .select()
    .from(savedListings)
    .where(eq(savedListings.userId, userId));

  if (savedRows.length === 0) return [];

  const platformIds = savedRows
    .map((r) => r.listingId)
    .filter((id): id is string => id !== null);

  const mlsIds = savedRows
    .map((r) => r.mlsListingId)
    .filter((id): id is string => id !== null);

  const results: NormalizedListing[] = [];

  // Fetch platform listings
  if (platformIds.length > 0) {
    const platformRows = await db
      .select()
      .from(listings)
      .where(inArray(listings.id, platformIds));

    for (const row of platformRows) {
      results.push(normalizePlatformListing(row));
    }
  }

  // Fetch MLS listings
  if (mlsIds.length > 0) {
    const mlsRows = await db
      .select()
      .from(mlsListings)
      .where(inArray(mlsListings.id, mlsIds));

    for (const row of mlsRows) {
      results.push(normalizeMlsListing(row));
    }
  }

  return results;
}

import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { listings, listingPhotos } from "@/db/schema";

/**
 * Appends a photo ID to the listing's photoOrder array.
 */
export async function addPhotoToListing(
  listingId: string,
  photoId: string
): Promise<void> {
  await db
    .update(listings)
    .set({
      photoOrder: sql`array_append(${listings.photoOrder}, ${photoId})`,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));
}

/**
 * Removes a photo ID from the listing's photoOrder array and deletes the photo row.
 */
export async function removePhotoFromListing(
  listingId: string,
  photoId: string
): Promise<void> {
  await db
    .update(listings)
    .set({
      photoOrder: sql`array_remove(${listings.photoOrder}, ${photoId})`,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  await db
    .delete(listingPhotos)
    .where(
      and(eq(listingPhotos.id, photoId), eq(listingPhotos.listingId, listingId))
    );
}

/**
 * Replaces the listing's photoOrder array with a new order.
 */
export async function reorderPhotos(
  listingId: string,
  newOrder: string[]
): Promise<void> {
  await db
    .update(listings)
    .set({
      photoOrder: newOrder,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));
}

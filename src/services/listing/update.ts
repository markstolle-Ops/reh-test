import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { listings } from "@/db/schema";
import type { Listing, ListingFormData, ListingStatus } from "@/types";

// ─── Valid Status Transitions ─────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ["active"],
  active: ["pending", "sold"],
  pending: ["active", "sold"],
  sold: [], // sold is terminal — no transitions allowed
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOwnedListing(listingId: string, userId: string): Promise<Listing> {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)));

  if (rows.length === 0) {
    throw new Error("Listing not found or unauthorized");
  }

  const listing = rows[0];

  // Secondary ownership check (defensive — in case query filter is bypassed in tests)
  if (listing.userId !== userId) {
    throw new Error("Listing not found or unauthorized");
  }

  return listing;
}

// ─── updateListing ────────────────────────────────────────────────────────────

/**
 * Partially updates a listing's fields.
 * Verifies ownership before mutation.
 * If `description` is included in the update, sets descriptionStatus to "edited".
 */
export async function updateListing(
  listingId: string,
  userId: string,
  data: Partial<ListingFormData & { description: string }>,
): Promise<Listing> {
  // Verify ownership — throws if not found or wrong user
  await getOwnedListing(listingId, userId);

  // Build the update payload
  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  // If description is being updated, mark as "edited"
  if ("description" in data) {
    updatePayload.descriptionStatus = "edited";
  }

  const [updated] = await db
    .update(listings)
    .set(updatePayload)
    .where(eq(listings.id, listingId))
    .returning();

  revalidateTag("listings", "default");

  return updated;
}

// ─── updateListingStatus ──────────────────────────────────────────────────────

/**
 * Transitions a listing to a new status.
 * Verifies ownership and valid transition before mutation.
 * Sets publishedAt when transitioning to "active" for the first time.
 */
export async function updateListingStatus(
  listingId: string,
  userId: string,
  newStatus: ListingStatus,
): Promise<Listing> {
  const listing = await getOwnedListing(listingId, userId);

  const currentStatus = listing.status as ListingStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed.includes(newStatus)) {
    if (currentStatus === "sold") {
      throw new Error(
        "Invalid status transition: sold is a terminal status — cannot reactivate a sold listing",
      );
    }
    throw new Error(
      `Invalid status transition: cannot go from "${currentStatus}" to "${newStatus}"`,
    );
  }

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  // Set publishedAt when first activating a listing
  if (newStatus === "active" && listing.publishedAt == null) {
    updatePayload.publishedAt = new Date();
  }

  const [updated] = await db
    .update(listings)
    .set(updatePayload)
    .where(eq(listings.id, listingId))
    .returning();

  revalidateTag("listings", "default");

  return updated;
}

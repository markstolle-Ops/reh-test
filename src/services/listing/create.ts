import { db } from "@/db";
import { listings } from "@/db/schema";
import { listingSchema } from "@/lib/listing-schema";
import type { Listing, ListingFormData } from "@/types";

export type { ListingInput } from "@/lib/listing-schema";
// Re-export schema and type for backwards compatibility
export { listingSchema } from "@/lib/listing-schema";

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Creates a new listing in the database for the given user.
 * Validates the input with Zod before inserting.
 */
export async function createListing(userId: string, data: ListingFormData): Promise<Listing> {
  // Validate — throws ZodError if invalid
  const validated = listingSchema.parse(data);

  const id = crypto.randomUUID();

  const [listing] = await db
    .insert(listings)
    .values({
      id,
      userId,
      streetAddress: validated.streetAddress,
      city: validated.city,
      state: validated.state,
      zip: validated.zip,
      propertyType: validated.propertyType,
      price: validated.price,
      bedrooms: validated.bedrooms ?? null,
      bathrooms: validated.bathrooms != null ? String(validated.bathrooms) : null,
      sqft: validated.sqft ?? null,
      lotSizeSqft: validated.lotSizeSqft ?? null,
      yearBuilt: validated.yearBuilt ?? null,
      description: validated.description ?? null,
    })
    .returning();

  return listing;
}

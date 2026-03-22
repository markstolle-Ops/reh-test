/**
 * Shared Zod schema for listing form validation.
 * Kept separate from the service layer so it can be imported by both
 * server services (create.ts, update.ts) and client components (ListingForm.tsx)
 * without pulling in the Node.js postgres driver.
 */
import { z } from "zod";

export const listingSchema = z
  .object({
    streetAddress: z.string().min(5),
    city: z.string().min(2),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}$/, "Zip must be exactly 5 digits"),
    propertyType: z.enum(["single_family", "condo", "townhouse", "land_lot"]),
    price: z.number().int().min(1000000).max(10000000000),
    bedrooms: z.number().int().positive().nullable().optional(),
    bathrooms: z.number().positive().nullable().optional(),
    sqft: z.number().int().positive().nullable().optional(),
    lotSizeSqft: z.number().int().positive().nullable().optional(),
    yearBuilt: z.number().int().min(1800).max(2100).nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Residential property types require beds and baths
      if (data.propertyType !== "land_lot") {
        return data.bedrooms != null && data.bathrooms != null;
      }
      return true;
    },
    {
      message:
        "Bedrooms and bathrooms are required for residential property types",
      path: ["bedrooms"],
    }
  );

export type ListingInput = z.infer<typeof listingSchema>;

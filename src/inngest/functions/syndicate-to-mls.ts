/**
 * Inngest Function: Syndicate to MLS
 *
 * Triggered by "listing/published" event (fired when listing status changes to 'active').
 * Fetches listing data from DB, then calls submitToMls to send a structured broker email.
 *
 * Export pattern: raw async function for testability + inngest.createFunction wrapper.
 */

import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { submitToMls, type MlsSyndicationStatus } from "@/services/mls/syndication";

// ─── Event payload type ───────────────────────────────────────────────────────

interface ListingPublishedEventData {
  listingId: string;
  sellerUserId?: string;
  sellerEmail?: string;
  sellerName?: string;
}

interface StepContext {
  event: { data: ListingPublishedEventData };
  step: {
    run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  };
}

// ─── Raw handler (exported for testing) ──────────────────────────────────────

/**
 * Core handler for MLS syndication.
 * Fetches listing from DB and submits to broker partner email.
 *
 * @param listingId - Platform listing ID to syndicate
 * @returns MlsSyndicationStatus result from submitToMls
 */
export async function syndicateToMlsRaw(
  listingId: string,
  opts?: { sellerEmail?: string; sellerName?: string }
): Promise<MlsSyndicationStatus> {
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }

  const address = [
    listing.streetAddress,
    listing.city,
    listing.state,
    listing.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return submitToMls({
    listingId: listing.id,
    sellerUserId: listing.userId,
    mlsRegion: listing.state,
    address,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms ?? undefined,
    sqft: listing.sqft,
    lotSizeSqft: listing.lotSizeSqft,
    propertyType: listing.propertyType,
    description: listing.description,
    photoUrls: listing.photoOrder ?? [],
    sellerEmail: opts?.sellerEmail,
    sellerName: opts?.sellerName,
  });
}

// ─── Inngest handler ──────────────────────────────────────────────────────────

async function syndicateToMlsHandler({ event, step }: StepContext) {
  const { listingId, sellerEmail, sellerName } = event.data;

  return step.run("submit-to-mls-broker", async () => {
    return syndicateToMlsRaw(listingId, { sellerEmail, sellerName });
  });
}

// ─── Inngest-registered function ──────────────────────────────────────────────

/**
 * Inngest function wrapper for MLS syndication.
 * Trigger: "listing/published" event — fired when listing status transitions to 'active'.
 * Register this in the Inngest serve() functions array in /api/inngest/route.ts.
 */
export const syndicateToMls = inngest.createFunction(
  { id: "syndicate-to-mls", name: "Syndicate Listing to MLS" },
  { event: "listing/published" },
  syndicateToMlsHandler
);

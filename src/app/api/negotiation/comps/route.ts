// ─── GET /api/negotiation/comps ───────────────────────────────────────────────
// Returns recent comparable sold listings for a given platform listing.
// Auth required. Looks up listing for zip and propertyType, then fetches comps.

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { fetchComps } from "@/services/negotiation/comps";

/**
 * GET /api/negotiation/comps?listingId={id}
 *
 * Returns array of comparable sold listings from the same zip code.
 * Used by the negotiation UI to display market context before AI guidance.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId query parameter is required" },
      { status: 422 }
    );
  }

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const comps = await fetchComps({
    zip: listing.zip,
    propertyType: listing.propertyType ?? undefined,
  });

  return NextResponse.json({ comps });
}

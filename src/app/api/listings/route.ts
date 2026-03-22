import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { createListing, listingSchema } from "@/services/listing/create";

/**
 * POST /api/listings
 *
 * Create a new listing for the authenticated seller.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = listingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const listing = await createListing(userId, parsed.data);

  // Fire-and-forget — handler will be added in plan 02-04
  await inngest.send({
    name: "listing/created",
    data: {
      listingId: listing.id,
      userId: listing.userId,
      propertyType: listing.propertyType,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}

/**
 * GET /api/listings
 *
 * Return all listings belonging to the authenticated user.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userListings = await db.select().from(listings).where(eq(listings.userId, userId));

  return NextResponse.json({ listings: userListings });
}

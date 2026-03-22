import { auth } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, transactions } from "@/db/schema";
import { createTransaction } from "@/services/transaction/create";

/**
 * POST /api/transactions
 *
 * Create a new transaction (offer submission).
 * Requires auth. Looks up listing to get sellerUserId and propertyState.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { listingId, offerPriceCents } = body as {
    listingId?: unknown;
    offerPriceCents?: unknown;
  };

  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId is required" }, { status: 422 });
  }

  if (!offerPriceCents || typeof offerPriceCents !== "number" || offerPriceCents <= 0) {
    return NextResponse.json(
      { error: "offerPriceCents must be a positive integer" },
      { status: 422 },
    );
  }

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const transaction = await createTransaction({
    listingId,
    buyerUserId: userId,
    sellerUserId: listing.userId,
    propertyState: listing.state,
    offerPriceCents,
  });

  return NextResponse.json({ transaction }, { status: 201 });
}

/**
 * GET /api/transactions
 *
 * Return all transactions where the authenticated user is buyer OR seller.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTransactions = await db
    .select({
      id: transactions.id,
      listingId: transactions.listingId,
      currentStatus: transactions.currentStatus,
      offerPriceCents: transactions.offerPriceCents,
      buyerUserId: transactions.buyerUserId,
      sellerUserId: transactions.sellerUserId,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(or(eq(transactions.buyerUserId, userId), eq(transactions.sellerUserId, userId)));

  return NextResponse.json({ transactions: userTransactions });
}

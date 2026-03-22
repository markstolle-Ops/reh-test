// ─── POST /api/negotiation/strategy ──────────────────────────────────────────
// Streams AI negotiation guidance for buyer or seller.
// Auth required. Fetches comps, looks up listing context, streams via AI SDK v6.
// X-UPL-Disclaimer: true header included on every response.

import { auth } from "@clerk/nextjs/server";
import { differenceInDays } from "date-fns";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { streamNegotiationGuidance } from "@/ai/agents/negotiation";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { fetchComps } from "@/services/negotiation/comps";

/**
 * POST /api/negotiation/strategy
 *
 * Body: { listingId: string, message: string, role: 'buyer' | 'seller' }
 * Returns: streaming AI response (AI SDK v6 UIMessageStream format)
 * Header: X-UPL-Disclaimer: true
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { listingId, message, role } = body as {
    listingId?: unknown;
    message?: unknown;
    role?: unknown;
  };

  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId is required" }, { status: 422 });
  }

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 422 });
  }

  if (role !== "buyer" && role !== "seller") {
    return NextResponse.json({ error: "role must be 'buyer' or 'seller'" }, { status: 422 });
  }

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Fetch comparable sales for market context
  const comps = await fetchComps({
    zip: listing.zip,
    propertyType: listing.propertyType ?? undefined,
  });

  // Compute days on market from createdAt (proxy until publishedAt is set)
  const publishedAt = listing.publishedAt ?? listing.createdAt;
  const daysOnMarket = Math.max(0, differenceInDays(new Date(), new Date(publishedAt)));

  // Stream negotiation guidance with UPL-compliant prompts
  const result = await streamNegotiationGuidance({
    comps,
    listingPrice: listing.price,
    daysOnMarket,
    userRole: role,
    userMessage: message,
  });

  // Return streaming response with UPL disclaimer header
  const response = result.toUIMessageStreamResponse();

  // Add UPL disclaimer header to all negotiation strategy responses
  const headers = new Headers(response.headers);
  headers.set("X-UPL-Disclaimer", "true");

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

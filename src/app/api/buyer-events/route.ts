import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordBuyerEvent } from "@/services/matching/buyer-events";

// ─── Validation schema ────────────────────────────────────────────────────────

const buyerEventSchema = z.object({
  eventType: z.enum(["listing_viewed", "listing_saved", "search_executed"]),
  listingId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ─── POST /api/buyer-events ───────────────────────────────────────────────────

/**
 * Record a buyer behavioral event (view, save, search).
 * Requires authentication via Clerk.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = buyerEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { eventType, listingId, metadata } = parsed.data;

  await recordBuyerEvent({ userId, eventType, listingId, metadata });

  return NextResponse.json({ ok: true }, { status: 201 });
}

import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { isListingSaved, toggleSavedListing } from "@/services/search/saved-listings";

/**
 * POST /api/listings/[id]/save
 *
 * Toggle save/unsave a listing for the authenticated buyer.
 * Requires authentication.
 *
 * Body: { source: "platform" | "mls" }
 * Returns: { saved: boolean }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let source: "platform" | "mls" = "platform";
  try {
    const body = await request.json();
    if (body?.source === "mls") source = "mls";
  } catch {
    // default to platform if no body
  }

  const result = await toggleSavedListing(userId, id, source);
  return NextResponse.json(result);
}

/**
 * GET /api/listings/[id]/save
 *
 * Check if a listing is saved by the authenticated buyer.
 * Requires authentication.
 *
 * Returns: { saved: boolean }
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const saved = await isListingSaved(userId, id);
  return NextResponse.json({ saved });
}

import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getHomeValueEstimate } from "@/services/avm/housecanary";

/**
 * GET /api/avm?street=...&city=...&state=...&zip=...
 *
 * Returns the AVM estimate for the given address.
 * Requires authentication (Clerk).
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const street = searchParams.get("street") ?? "";
  const city = searchParams.get("city") ?? "";
  const state = searchParams.get("state") ?? "";
  const zip = searchParams.get("zip") ?? "";

  if (!street || !city || !state || !zip) {
    return NextResponse.json(
      { error: "street, city, state, and zip are required" },
      { status: 400 },
    );
  }

  const estimate = await getHomeValueEstimate({ street, city, state, zip });

  if (!estimate) {
    return NextResponse.json(
      { error: "Could not retrieve AVM estimate for the given address" },
      { status: 404 },
    );
  }

  return NextResponse.json(estimate);
}

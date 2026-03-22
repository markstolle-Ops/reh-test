import { type NextRequest, NextResponse } from "next/server";
import { getMarketTrends, getNeighborhoodData } from "@/services/neighborhood/data";

// GET /api/neighborhood?zip=78701&state=TX
// No auth required — public data for listing pages.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");
  const state = searchParams.get("state");

  if (!zip || !state) {
    return NextResponse.json(
      { error: "zip and state query parameters are required" },
      { status: 400 },
    );
  }

  const [neighborhood, trends] = await Promise.all([
    getNeighborhoodData(zip, state),
    getMarketTrends(zip, state),
  ]);

  if (!neighborhood) {
    return NextResponse.json({ error: "Invalid zip code" }, { status: 400 });
  }

  return NextResponse.json({ neighborhood, trends });
}

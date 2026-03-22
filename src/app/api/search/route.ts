import { NextRequest, NextResponse } from "next/server";
import type { SearchParams } from "@/types";
import { searchListings } from "@/services/search/listings-search";
import { parseNaturalLanguageQuery } from "@/services/search/nlq-parser";

/**
 * GET /api/search
 *
 * Unified search endpoint returning NormalizedListing[] from both
 * platform-native listings and MLS-ingested listings.
 *
 * No auth required — public endpoint for buyer discovery.
 *
 * Query params map directly to SearchParams interface.
 * When `nlq` param is present, it is parsed via GPT-4o into SearchParams.
 * Explicit filter params always override NLQ-parsed values.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  // ─── NLQ parsing ─────────────────────────────────────────────────────────────
  // When nlq param is present, parse it first; explicit params override parsed values.
  let params: SearchParams = {};

  const nlq = sp.get("nlq");
  if (nlq) {
    try {
      const nlqParams = await parseNaturalLanguageQuery(nlq);
      params = { ...nlqParams };
    } catch (error) {
      console.error("[GET /api/search] NLQ parse error:", error);
      // Fall through to explicit params only — don't fail the request
    }
  }

  const q = sp.get("q");
  if (q) params.q = q;

  const minPrice = sp.get("minPrice");
  if (minPrice) params.minPrice = Number(minPrice);

  const maxPrice = sp.get("maxPrice");
  if (maxPrice) params.maxPrice = Number(maxPrice);

  const minBeds = sp.get("minBeds");
  if (minBeds) params.minBeds = Number(minBeds);

  const maxBeds = sp.get("maxBeds");
  if (maxBeds) params.maxBeds = Number(maxBeds);

  const minBaths = sp.get("minBaths");
  if (minBaths) params.minBaths = Number(minBaths);

  const maxBaths = sp.get("maxBaths");
  if (maxBaths) params.maxBaths = Number(maxBaths);

  const minSqft = sp.get("minSqft");
  if (minSqft) params.minSqft = Number(minSqft);

  const maxSqft = sp.get("maxSqft");
  if (maxSqft) params.maxSqft = Number(maxSqft);

  const propertyType = sp.get("propertyType");
  if (propertyType)
    params.propertyType = propertyType as SearchParams["propertyType"];

  const lat = sp.get("lat");
  if (lat) params.lat = Number(lat);

  const lng = sp.get("lng");
  if (lng) params.lng = Number(lng);

  const radiusKm = sp.get("radiusKm");
  if (radiusKm) params.radiusKm = Number(radiusKm);

  const page = sp.get("page");
  if (page) params.page = Number(page);

  const limit = sp.get("limit");
  if (limit) params.limit = Number(limit);

  try {
    const result = await searchListings(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/search] error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

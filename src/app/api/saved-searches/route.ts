import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { createSavedSearch, getSavedSearches } from "@/services/search/saved-searches";
import type { SearchParams } from "@/types";

/**
 * POST /api/saved-searches
 *
 * Saves the current search filters for the authenticated user.
 * Body: { name: string; filters: SearchParams }
 * Returns 201 with the created record.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name: string; filters: SearchParams };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, filters } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!filters || typeof filters !== "object") {
    return NextResponse.json({ error: "filters is required" }, { status: 400 });
  }

  try {
    const record = await createSavedSearch(userId, name, filters);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[POST /api/saved-searches] error:", error);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}

/**
 * GET /api/saved-searches
 *
 * Returns all active saved searches for the authenticated user.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searches = await getSavedSearches(userId);
    return NextResponse.json(searches);
  } catch (error) {
    console.error("[GET /api/saved-searches] error:", error);
    return NextResponse.json({ error: "Failed to load saved searches" }, { status: 500 });
  }
}

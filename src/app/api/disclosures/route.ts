import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { disclosureForms } from "@/db/schema";
import { createDisclosureForm } from "@/services/disclosures/disclosure-form";

// ─── POST /api/disclosures ─────────────────────────────────────────────────────
// Creates a new disclosure form for the authenticated seller.
// Body: { listingId: string; state: string }
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { listingId, state } = body as { listingId?: string; state?: string };

  if (!listingId || !state) {
    return NextResponse.json({ error: "listingId and state are required" }, { status: 400 });
  }

  const form = await createDisclosureForm(userId, listingId, state);
  return NextResponse.json(form, { status: 201 });
}

// ─── GET /api/disclosures?listingId=xxx ────────────────────────────────────────
// Returns all disclosure forms for the given listing.
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json({ error: "listingId query param required" }, { status: 400 });
  }

  const forms = await db
    .select()
    .from(disclosureForms)
    .where(and(eq(disclosureForms.listingId, listingId), eq(disclosureForms.userId, userId)));

  // Parse answers JSON for each form
  const parsed = forms.map((f) => ({
    ...f,
    answers: JSON.parse(f.answers) as Record<string, unknown>,
  }));

  return NextResponse.json(parsed);
}

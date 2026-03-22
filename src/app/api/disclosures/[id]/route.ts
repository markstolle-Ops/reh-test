import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  completeDisclosureForm,
  getDisclosureForm,
  updateDisclosureForm,
} from "@/services/disclosures/disclosure-form";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/disclosures/[id] ─────────────────────────────────────────────────
// Returns the disclosure form with parsed answers.
export async function GET(_req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const form = await getDisclosureForm(id);

  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (form.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(form);
}

// ─── PATCH /api/disclosures/[id] ──────────────────────────────────────────────
// Updates disclosure form answers (save draft).
// Body: { answers: Record<string, unknown> }
export async function PATCH(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { answers } = body as { answers?: Record<string, unknown> };

  if (!answers) {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }

  const form = await updateDisclosureForm(userId, id, answers);
  return NextResponse.json(form);
}

// ─── POST /api/disclosures/[id] ───────────────────────────────────────────────
// Completes a disclosure form.
// Body: { action: "complete" }
export async function POST(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action?: string };

  if (action !== "complete") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const form = await completeDisclosureForm(userId, id);
  return NextResponse.json(form);
}

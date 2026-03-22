import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createDisclosureAssistStream } from "@/services/disclosures/ai-assist";

// ─── POST /api/disclosures/ai-assist ─────────────────────────────────────────
// Streams AI guidance for a specific disclosure form field.
// Body: { state, formName, fieldContext, message }
// Auth: required
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { state, formName, fieldContext, message } = body as {
    state?: string;
    formName?: string;
    fieldContext?: string;
    message?: string;
  };

  if (!state || !formName || !message) {
    return NextResponse.json(
      { error: "state, formName, and message are required" },
      { status: 400 }
    );
  }

  return createDisclosureAssistStream(
    state,
    formName,
    fieldContext ?? "",
    message
  );
}

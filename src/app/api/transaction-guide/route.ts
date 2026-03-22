import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { streamTransactionGuide } from "@/ai/agents/transaction-guide";

// ─── POST /api/transaction-guide ───────────────────────────────────────────────
// Accepts: { stateCode, transactionId?, message, role }
// Returns: streaming data response (AI SDK v6)
// Auth: required — transaction guidance is personalized and state-specific

export async function POST(req: Request) {
  // Require authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    stateCode,
    transactionId,
    message,
    role = "buyer",
  } = await req.json();

  if (!stateCode || typeof stateCode !== "string") {
    return NextResponse.json(
      { error: "stateCode is required" },
      { status: 400 }
    );
  }

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  const result = await streamTransactionGuide({
    stateCode,
    transactionId,
    userMessage: message,
    userRole: role,
  });

  // AI SDK v6: toUIMessageStreamResponse() for streaming
  return result.toUIMessageStreamResponse();
}

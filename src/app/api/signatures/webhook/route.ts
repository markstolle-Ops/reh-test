import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import type { SignWellWebhookPayload } from "@/services/signatures/signwell";
import { processWebhookEvent } from "@/services/signatures/signwell";

/**
 * POST /api/signatures/webhook
 *
 * Receives SignWell webhook events.
 * Verifies HMAC signature when SIGNWELL_WEBHOOK_SECRET is configured.
 * Processes document_completed and document_declined events.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // HMAC verification — if secret is configured, verify the signature
  const secret = process.env.SIGNWELL_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-signwell-signature") ?? "";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!signature || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody) as SignWellWebhookPayload;

  await processWebhookEvent(payload);

  return NextResponse.json({ received: true }, { status: 200 });
}

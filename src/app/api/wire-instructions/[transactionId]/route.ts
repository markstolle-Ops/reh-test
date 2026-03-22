/**
 * GET /api/wire-instructions/[transactionId]
 *
 * Returns wire instructions for a transaction.
 *
 * Security requirements:
 *   - Auth: Clerk session required (401 if missing)
 *   - MFA: user.twoFactorEnabled must be true (403 if not — instructs user to
 *     enable 2FA in Clerk account settings)
 *   - Authorization: caller must be buyer or seller on the transaction
 *   - Masking: routing/account numbers are masked (last 4 digits only) by default
 *   - Reveal: pass ?reveal=true to return full unmasked numbers
 *   - Audit: every call logs wire_instructions_viewed via getWireInstructions
 *
 * Wire instructions are NEVER transmitted via email. This endpoint is the only
 * authoritative source.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWireInstructions } from "@/services/transaction/wire-instructions";

type Params = { params: Promise<{ transactionId: string }> };

// Mask all but last 4 digits of a numeric string
function maskNumber(value: string): string {
  if (value.length <= 4) return value;
  return "*".repeat(value.length - 4) + value.slice(-4);
}

export async function GET(req: NextRequest, { params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // MFA gate: require two-factor authentication to view wire instructions
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);

  if (!user.twoFactorEnabled) {
    return NextResponse.json(
      {
        error:
          "MFA required to view wire instructions. Enable two-factor authentication in your account settings.",
        mfaRequired: true,
      },
      { status: 403 }
    );
  }

  const { transactionId } = await params;
  const reveal = req.nextUrl.searchParams.get("reveal") === "true";

  let wireData;
  try {
    wireData = await getWireInstructions(transactionId, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (message.startsWith("Transaction not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!wireData) {
    return NextResponse.json(
      { error: "Wire instructions not yet set for this transaction" },
      { status: 404 }
    );
  }

  const responseData = {
    bankName: wireData.bankName,
    accountName: wireData.accountName,
    referenceNote: wireData.referenceNote,
    updatedAt: wireData.updatedAt,
    // Masked by default; full numbers only with ?reveal=true
    routingNumber: reveal
      ? wireData.routingNumber
      : maskNumber(wireData.routingNumber),
    accountNumber: reveal
      ? wireData.accountNumber
      : maskNumber(wireData.accountNumber),
  };

  return NextResponse.json({ wireInstructions: responseData });
}

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { signatureEnvelopes } from "@/db/schema";
import { getEmbeddedSigningUrl } from "@/services/signatures/signwell";

/**
 * GET /api/signatures/[id]
 *
 * Returns the signature envelope record and embedded signing URLs for each recipient.
 * id = envelopeId (internal DB primary key).
 * Requires authentication.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [envelope] = await db
    .select()
    .from(signatureEnvelopes)
    .where(eq(signatureEnvelopes.id, id))
    .limit(1);

  if (!envelope) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch embedded signing URLs from SignWell by getting status
  // This imports from signwell service which returns recipients with embedded URLs
  let signingUrls: Record<string, string | undefined> = {};

  try {
    const { getDocumentStatus } = await import("@/services/signatures/signwell");
    const { recipients } = await getDocumentStatus(envelope.signwellDocumentId);
    signingUrls = Object.fromEntries(
      recipients.filter((r) => r.id).map((r) => [r.id, r.embedded_signing_url]),
    );
  } catch {
    // If SignWell API is unavailable, return envelope without signing URLs
    signingUrls = {};
  }

  return NextResponse.json({
    envelope,
    signingUrls,
  });
}

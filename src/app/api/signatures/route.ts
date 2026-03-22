import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { createDocumentForSigning } from "@/services/signatures/signwell";

/**
 * POST /api/signatures
 *
 * Create a SignWell signature envelope for a document.
 * Requires authentication.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    pdfBase64?: string;
    templateId?: string;
    signers: Array<{ name: string; email: string; role: string }>;
    name: string;
    listingId?: string;
    disclosureFormId?: string;
  };

  if (!body.name || !Array.isArray(body.signers) || body.signers.length === 0) {
    return NextResponse.json(
      { error: "name and at least one signer are required" },
      { status: 422 },
    );
  }

  if (!body.pdfBase64 && !body.templateId) {
    return NextResponse.json(
      { error: "Either pdfBase64 or templateId is required" },
      { status: 422 },
    );
  }

  const result = await createDocumentForSigning({
    pdfBase64: body.pdfBase64,
    templateId: body.templateId,
    signers: body.signers,
    name: body.name,
    listingId: body.listingId,
    disclosureFormId: body.disclosureFormId,
  });

  return NextResponse.json(result, { status: 201 });
}

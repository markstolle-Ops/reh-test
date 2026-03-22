import { eq } from "drizzle-orm";
import { db } from "@/db";
import { signatureEnvelopes } from "@/db/schema";

const SIGNWELL_BASE = "https://www.signwell.com/api/v1";

// Read lazily at call time so tests can set env vars before calling
function getApiKey(): string {
  return process.env.SIGNWELL_API_KEY ?? "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignWellSigner {
  name: string;
  email: string;
  role: string;
}

export interface CreateDocumentOptions {
  pdfBase64?: string;
  templateId?: string;
  signers: SignWellSigner[];
  name: string;
  listingId?: string;
  disclosureFormId?: string;
}

export interface CreateDocumentResult {
  envelopeId: string;
  signwellDocumentId: string;
  recipients: SignWellRecipient[];
}

export interface SignWellRecipient {
  id: string;
  name?: string;
  email?: string;
  embedded_signing_url?: string;
  placeholder_name?: string;
}

export interface SignWellDocumentStatus {
  status: string;
  recipients: SignWellRecipient[];
  audit_trail: SignWellAuditEntry[];
}

export interface SignWellAuditEntry {
  action: string;
  signer?: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface SignWellWebhookPayload {
  event_type: "document_completed" | "document_declined" | string;
  document: {
    id: string;
    audit_trail: SignWellAuditEntry[];
    [key: string]: unknown;
  };
}

// ─── Adapter functions ────────────────────────────────────────────────────────

/**
 * Create a document for signing via SignWell API.
 * Inserts a signatureEnvelopes row after successful API call.
 */
export async function createDocumentForSigning(
  opts: CreateDocumentOptions
): Promise<CreateDocumentResult> {
  const { pdfBase64, templateId, signers, name, listingId, disclosureFormId } = opts;

  const isProduction = process.env.NODE_ENV === "production";

  const recipients = signers.map((signer) => ({
    id: crypto.randomUUID(),
    name: signer.name,
    email: signer.email,
    placeholder_name: signer.role,
    send_email: false,
  }));

  const body: Record<string, unknown> = {
    name,
    test_mode: !isProduction,
    embedded_signing: true,
    recipients,
  };

  if (pdfBase64) {
    body.files = [{ name: `${name}.pdf`, file_base64: pdfBase64 }];
  }
  if (templateId) {
    body.template_ids = [templateId];
  }

  const response = await fetch(`${SIGNWELL_BASE}/documents`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SignWell API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { id: string; recipients: SignWellRecipient[] };

  const envelopeId = crypto.randomUUID();

  await db.insert(signatureEnvelopes).values({
    id: envelopeId,
    signwellDocumentId: data.id,
    listingId: listingId ?? null,
    disclosureFormId: disclosureFormId ?? null,
    status: "pending",
  });

  return {
    envelopeId,
    signwellDocumentId: data.id,
    recipients: data.recipients,
  };
}

/**
 * Fetch document status and recipient info from SignWell.
 */
export async function getDocumentStatus(
  signwellDocumentId: string
): Promise<SignWellDocumentStatus> {
  const response = await fetch(`${SIGNWELL_BASE}/documents/${signwellDocumentId}`, {
    method: "GET",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SignWell API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as SignWellDocumentStatus & { id: string };
  return {
    status: data.status,
    recipients: data.recipients,
    audit_trail: data.audit_trail ?? [],
  };
}

/**
 * Return the embedded signing URL for a specific recipient.
 */
export async function getEmbeddedSigningUrl(
  signwellDocumentId: string,
  recipientId: string
): Promise<string | undefined> {
  const { recipients } = await getDocumentStatus(signwellDocumentId);
  const recipient = recipients.find((r) => r.id === recipientId);
  return recipient?.embedded_signing_url;
}

/**
 * Process a webhook event from SignWell.
 * Updates the signatureEnvelopes row based on event_type.
 */
export async function processWebhookEvent(
  payload: SignWellWebhookPayload
): Promise<void> {
  const { event_type, document } = payload;

  if (event_type === "document_completed") {
    await db
      .update(signatureEnvelopes)
      .set({
        status: "completed",
        auditTrail: JSON.stringify(document.audit_trail),
        completedAt: new Date(),
      })
      .where(eq(signatureEnvelopes.signwellDocumentId, document.id));
  } else if (event_type === "document_declined") {
    await db
      .update(signatureEnvelopes)
      .set({
        status: "declined",
      })
      .where(eq(signatureEnvelopes.signwellDocumentId, document.id));
  }
}

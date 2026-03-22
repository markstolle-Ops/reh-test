import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agentLicenseChecks, agentProfiles } from "@/db/schema";

export type LicenseVerificationMethod = "arello" | "manual";

export type AgentLicenseCheck = typeof agentLicenseChecks.$inferSelect;

/**
 * Verify an agent's real estate license.
 *
 * - method='manual': Marks as verified immediately (operator-reviewed).
 * - method='arello': Calls ARELLO LVWS v2 XML API; requires ARELLO_API_URL and
 *   ARELLO_API_CREDENTIALS env vars. Throws if not configured.
 *
 * After any verified check, sets agentProfiles.verified=true.
 */
export async function verifyAgentLicense(
  agentId: string,
  state: string,
  method: LicenseVerificationMethod = "manual"
): Promise<AgentLicenseCheck> {
  if (method === "arello") {
    return verifyViaArello(agentId, state);
  }

  return verifyManual(agentId, state);
}

async function verifyManual(
  agentId: string,
  state: string
): Promise<AgentLicenseCheck> {
  const id = `lcheck_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const [check] = await db
    .insert(agentLicenseChecks)
    .values({
      id,
      agentId,
      state,
      method: "manual",
      arelloResult: null,
      verified: true,
      verifiedAt: now,
      expiresAt: null,
    })
    .returning();

  // Mark agent as verified
  await db
    .update(agentProfiles)
    .set({ verified: true, updatedAt: now })
    .where(eq(agentProfiles.id, agentId))
    .execute();

  return check;
}

async function verifyViaArello(
  agentId: string,
  state: string
): Promise<AgentLicenseCheck> {
  const arelloUrl = process.env.ARELLO_API_URL;
  const arelloCredentials = process.env.ARELLO_API_CREDENTIALS;

  if (!arelloUrl) {
    throw new Error("ARELLO not configured — use manual verification");
  }

  // Look up the agent's license number — ARELLO verifies by license, not internal ID
  const profile = await db
    .select({ licenseNumber: agentProfiles.licenseNumber })
    .from(agentProfiles)
    .where(eq(agentProfiles.id, agentId));

  if (!profile[0]?.licenseNumber) {
    throw new Error("Agent has no license number on file");
  }

  // Build ARELLO LVWS v2 XML request
  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<LicenseVerificationRequest>
  <State>${state}</State>
  <LicenseNumber>${profile[0].licenseNumber}</LicenseNumber>
</LicenseVerificationRequest>`;

  const response = await fetch(arelloUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      Authorization: `Basic ${arelloCredentials}`,
    },
    body: xmlBody,
  });

  if (!response.ok) {
    throw new Error(`ARELLO API error: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();

  // Parse XML response — look for LicenseStatus element
  const statusMatch = responseText.match(/<LicenseStatus>(.*?)<\/LicenseStatus>/);
  const expirationMatch = responseText.match(/<ExpirationDate>(.*?)<\/ExpirationDate>/);

  const licenseStatus = statusMatch?.[1] ?? "Unknown";
  const isVerified = licenseStatus.toLowerCase() === "active";
  const expiresAt = expirationMatch?.[1] ? new Date(expirationMatch[1]) : null;

  const id = `lcheck_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const arelloResult = JSON.stringify({ status: licenseStatus, rawResponse: responseText });

  const [check] = await db
    .insert(agentLicenseChecks)
    .values({
      id,
      agentId,
      state,
      method: "arello",
      arelloResult,
      verified: isVerified,
      verifiedAt: now,
      expiresAt,
    })
    .returning();

  if (isVerified) {
    await db
      .update(agentProfiles)
      .set({ verified: true, updatedAt: now })
      .where(eq(agentProfiles.id, agentId))
      .execute();
  }

  return check;
}

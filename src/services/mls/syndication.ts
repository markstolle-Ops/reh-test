/**
 * MLS Syndication Service
 *
 * Submits seller listings to a flat-fee MLS broker partner (e.g., ListWithFreedom,
 * Homecoin) via structured email using Resend. Since these vendors have no public
 * REST API, the MVP sends a formatted HTML email to a configurable broker email
 * address. Status is tracked in the mls_syndications table.
 *
 * MLS_BROKER_EMAIL env var must be set to the broker partner's intake email.
 * See .env.example for details.
 */

import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { mlsSyndications } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Extended request payload for submitting a listing to MLS via broker partner.
 * Includes all listing details needed for the structured broker email.
 */
export interface MlsSyndicationRequest {
  listingId: string;
  sellerUserId: string;
  mlsRegion: string;
  // Listing details for broker email
  address: string;
  price: number; // in cents
  bedrooms?: number | null;
  bathrooms?: string | null;
  sqft?: number | null;
  lotSizeSqft?: number | null;
  propertyType: "single_family" | "condo" | "townhouse" | "land_lot";
  description?: string | null;
  photoUrls: string[];
  sellerEmail?: string;
  sellerName?: string;
}

/**
 * Status of an MLS syndication submission.
 */
export interface MlsSyndicationStatus {
  status: "pending" | "submitted" | "active" | "rejected" | "confirmed";
  submissionId?: string;
  submittedAt?: Date;
  confirmedAt?: Date;
  mlsNumber?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCentsAsDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildBrokerEmailHtml(request: MlsSyndicationRequest): string {
  const {
    address,
    price,
    bedrooms,
    bathrooms,
    sqft,
    lotSizeSqft,
    propertyType,
    description,
    photoUrls,
    sellerEmail,
    sellerName,
    mlsRegion,
    listingId,
  } = request;

  const priceFormatted = formatCentsAsDollars(price);
  const sqftFormatted = sqft ? sqft.toLocaleString("en-US") : "N/A";
  const lotFormatted = lotSizeSqft ? lotSizeSqft.toLocaleString("en-US") : "N/A";
  const propertyTypeLabel = propertyType.replace(/_/g, " ");

  const photoHtml = photoUrls
    .slice(0, 10)
    .map((url, i) => `<p><a href="${url}">Photo ${i + 1}: ${url}</a></p>`)
    .join("\n");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #333;">
  <h1 style="color: #1a56db;">MLS Submission Request — RealEstateHunter</h1>

  <h2>Property Details</h2>
  <table style="border-collapse: collapse; width: 100%;">
    <tr><td style="padding: 6px; font-weight: bold;">Address</td><td style="padding: 6px;">${address}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">List Price</td><td style="padding: 6px;">${priceFormatted}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Property Type</td><td style="padding: 6px;">${propertyTypeLabel}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Bedrooms</td><td style="padding: 6px;">${bedrooms ?? "N/A"}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Bathrooms</td><td style="padding: 6px;">${bathrooms ?? "N/A"}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Sq Ft (Living Area)</td><td style="padding: 6px;">${sqftFormatted}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Lot Size (Sq Ft)</td><td style="padding: 6px;">${lotFormatted}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">MLS Region</td><td style="padding: 6px;">${mlsRegion}</td></tr>
    <tr><td style="padding: 6px; font-weight: bold;">Platform Listing ID</td><td style="padding: 6px;">${listingId}</td></tr>
  </table>

  <h2>Listing Description</h2>
  <p style="white-space: pre-wrap;">${description ?? "(No description provided)"}</p>

  <h2>Seller Contact</h2>
  <p>Name: ${sellerName ?? "N/A"}</p>
  <p>Email: ${sellerEmail ?? "N/A"}</p>

  <h2>Photos (${photoUrls.length} total)</h2>
  ${photoHtml || "<p>No photos provided.</p>"}

  <hr />
  <p style="font-size: 12px; color: #666;">
    This submission was generated automatically by RealEstateHunter.
    Please reply to confirm MLS listing number once active.
  </p>
</body>
</html>
  `.trim();
}

function generateSubmissionId(): string {
  // Use crypto.randomUUID for a unique submission identifier
  return `mls-${crypto.randomUUID()}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Submit a listing to MLS via a flat-fee broker partner.
 *
 * Sends a structured HTML email to MLS_BROKER_EMAIL with all listing details.
 * Persists a syndication record to the mls_syndications table.
 * Returns { submissionId, status: 'submitted', submittedAt }.
 */
export async function submitToMls(request: MlsSyndicationRequest): Promise<MlsSyndicationStatus> {
  const brokerEmail = process.env.MLS_BROKER_EMAIL ?? "mls-intake@placeholder.example.com";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const submissionId = generateSubmissionId();
  const submittedAt = new Date();

  const html = buildBrokerEmailHtml(request);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@realestatehunter.com",
    to: brokerEmail,
    subject: `MLS Submission Request — ${request.address}`,
    html,
  });

  // Persist syndication record
  await db.insert(mlsSyndications).values({
    id: crypto.randomUUID(),
    listingId: request.listingId,
    submissionId,
    status: "submitted",
    brokerEmail,
    submittedAt,
  });

  return {
    submissionId,
    status: "submitted",
    submittedAt,
  };
}

/**
 * Get the current MLS syndication status for a listing.
 *
 * Reads from the mls_syndications table. Returns null if no submission exists.
 */
export async function getMlsStatus(listingId: string): Promise<MlsSyndicationStatus | null> {
  const rows = await db
    .select()
    .from(mlsSyndications)
    .where(eq(mlsSyndications.listingId, listingId));

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    status: row.status as MlsSyndicationStatus["status"],
    submissionId: row.submissionId,
    submittedAt: row.submittedAt,
    confirmedAt: row.confirmedAt ?? undefined,
  };
}

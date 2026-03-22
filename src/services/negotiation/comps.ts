// ─── Comparable Sales Service ─────────────────────────────────────────────────
// Fetches recent sold listings from mls_listings for negotiation context.
//
// TODO: Replace with ATTOM Data API when contract is established.
// See: .planning/phases/04-transaction-engine-state-compliance/04-RESEARCH.md

import { db } from "@/db";
import { mlsListings } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Comp {
  soldPriceCents: number;
  sqft: number | null;
  soldDate: Date;
  address: string;
  daysAgo: number;
}

export interface FetchCompsArgs {
  zip: string;
  propertyType?: string;
  limit?: number;
}

// ─── fetchComps ───────────────────────────────────────────────────────────────

/**
 * Fetches recent sold MLS listings from the same zip code.
 * Used as context injection for AI negotiation guidance.
 *
 * Returns up to `limit` (default 10) comps ordered by most recent sale.
 */
export async function fetchComps({
  zip,
  propertyType,
  limit = 10,
}: FetchCompsArgs): Promise<Comp[]> {
  const conditions = [eq(mlsListings.zip, zip), eq(mlsListings.status, "sold")];

  if (propertyType) {
    conditions.push(eq(mlsListings.propertyType, propertyType));
  }

  const rows = await db
    .select({
      price: mlsListings.price,
      sqft: mlsListings.sqft,
      lastSyncedAt: mlsListings.lastSyncedAt,
      streetAddress: mlsListings.streetAddress,
      zip: mlsListings.zip,
    })
    .from(mlsListings)
    .where(and(...conditions))
    .orderBy(desc(mlsListings.lastSyncedAt))
    .limit(limit);

  const now = Date.now();

  return rows.map((row) => {
    const soldDate = row.lastSyncedAt ?? new Date();
    const daysAgo = Math.floor((now - soldDate.getTime()) / (1000 * 60 * 60 * 24));

    // Build address from available fields — rawData holds full street address
    // but we use city/zip for a consistent display label in comps context
    const address = [row.streetAddress, row.zip]
      .filter(Boolean)
      .join(", ");

    return {
      soldPriceCents: row.price ?? 0,
      sqft: row.sqft ?? null,
      soldDate,
      address,
      daysAgo,
    };
  });
}

// ─── formatCompsForPrompt ─────────────────────────────────────────────────────

/**
 * Formats comps array into human-readable text for AI system prompt injection.
 */
export function formatCompsForPrompt(comps: Comp[]): string {
  if (comps.length === 0) {
    return "No recent comparable sales data available for this zip code.";
  }

  const lines = comps.map((c, i) => {
    const price = (c.soldPriceCents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    const sqft = c.sqft ? `${c.sqft.toLocaleString()} sqft` : "sqft unknown";
    const pricePerSqft =
      c.sqft && c.sqft > 0
        ? `$${Math.round(c.soldPriceCents / 100 / c.sqft)}/sqft`
        : "";

    return `${i + 1}. ${c.address} — Sold ${price} (${sqft}${pricePerSqft ? `, ${pricePerSqft}` : ""}) — ${c.daysAgo} days ago`;
  });

  return `RECENT COMPARABLE SALES (${comps.length} comps):\n${lines.join("\n")}`;
}

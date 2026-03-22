import type { NormalizedListing } from "@/types";

// ─── Platform Listing Shape ────────────────────────────────────────────────────
// Subset of the listings table row that normalize needs.

interface PlatformListingRow {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  price: number;
  bedrooms: number | null;
  bathrooms: string | number | null;
  sqft: number | null;
  status: string;
  photoOrder: string[];
  createdAt: Date;
}

// ─── MLS Listing Shape ────────────────────────────────────────────────────────
// Subset of the mlsListings table row that normalize needs.

interface MlsListingRow {
  id: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: string | number | null;
  sqft: number | null;
  propertyType: string | null;
  status: string | null;
  lat: string | number | null;
  lng: string | number | null;
  photoUrls: string[] | null;
  lastSyncedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBathrooms(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? null : parsed;
}

function parseCoord(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? null : parsed;
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

/**
 * Map a platform-native listings row to NormalizedListing.
 * Photo URL is constructed from NEXT_PUBLIC_R2_PUBLIC_URL + first photoOrder key.
 */
export function normalizePlatformListing(row: PlatformListingRow): NormalizedListing {
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
  const firstKey = row.photoOrder?.[0] ?? null;
  const photoUrl = firstKey && r2Base ? `${r2Base}/${firstKey}` : null;

  return {
    id: row.id,
    source: "platform",
    streetAddress: row.streetAddress,
    city: row.city,
    state: row.state,
    zip: row.zip,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: parseBathrooms(row.bathrooms),
    sqft: row.sqft,
    propertyType: row.propertyType,
    photoUrl,
    lat: null, // populated by geocoding Inngest job (Phase 3 later plan)
    lng: null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Map an mlsListings row to NormalizedListing.
 * Photo URL is the first item in the photoUrls array.
 */
export function normalizeMlsListing(row: MlsListingRow): NormalizedListing {
  const photoUrl = row.photoUrls && row.photoUrls.length > 0 ? row.photoUrls[0] : null;

  return {
    id: row.id,
    source: "mls",
    city: row.city ?? "",
    state: row.state ?? "",
    zip: row.zip ?? "",
    price: row.price ?? 0,
    bedrooms: row.bedrooms,
    bathrooms: parseBathrooms(row.bathrooms),
    sqft: row.sqft,
    propertyType: row.propertyType ?? "",
    photoUrl,
    lat: parseCoord(row.lat),
    lng: parseCoord(row.lng),
    status: row.status ?? "",
    createdAt: row.lastSyncedAt.toISOString(),
  };
}

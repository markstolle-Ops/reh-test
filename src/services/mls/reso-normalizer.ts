/**
 * RESO Data Dictionary 2.0 normalizer.
 *
 * Maps raw RESO Property resources to the mlsListings DB row shape.
 * Price conversion: ListPrice (dollars) → cents (* 100), consistent with
 * SimplyRETS normalizer (Phase 3 decision).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * RESO Data Dictionary 2.0 Property resource fields.
 * All fields are optional — RESO boards may omit non-required fields.
 */
export interface ResoProperty {
  ListingKey?: string;
  ListPrice?: number;
  BedroomsTotal?: number;
  BathroomsTotalDecimal?: number;
  LivingArea?: number;
  PostalCity?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  UnparsedAddress?: string;
  PropertyType?: string;
  StandardStatus?: string;
  Latitude?: number;
  Longitude?: number;
  ModificationTimestamp?: string;
  Media?: Array<{ MediaURL: string }>;
  [key: string]: unknown;
}

/**
 * Normalized shape ready for mlsListings DB upsert.
 * Matches the mlsListings table columns in src/db/schema.ts.
 */
export interface NormalizedResoRow {
  id: string;
  mlsSource: string;          // "reso:{boardId}"
  rawData: string;             // JSON-stringified ResoProperty
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;        // in cents
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  propertyType: string | null;
  status: string | null;
  lat: number | null;
  lng: number | null;
  photoUrls: string[];
}

// ─── normalizeResoListing ─────────────────────────────────────────────────────

const MAX_PHOTOS = 20;

/**
 * Map a single RESO Property resource to a mlsListings-compatible row.
 *
 * @param raw      Raw RESO Property from OData response
 * @param boardId  RESO board identifier (e.g. "crmls")
 */
export function normalizeResoListing(
  raw: ResoProperty,
  boardId: string
): NormalizedResoRow {
  return {
    id: raw.ListingKey ?? "",
    mlsSource: `reso:${boardId}`,
    rawData: JSON.stringify(raw),
    streetAddress: raw.UnparsedAddress ?? null,
    city: raw.PostalCity ?? null,
    state: raw.StateOrProvince ?? null,
    zip: raw.PostalCode ?? null,
    // Prices from RESO are in dollars — convert to cents for internal consistency
    price: raw.ListPrice != null ? Math.round(raw.ListPrice * 100) : null,
    bedrooms: raw.BedroomsTotal ?? null,
    bathrooms: raw.BathroomsTotalDecimal ?? null,
    sqft: raw.LivingArea ?? null,
    propertyType: raw.PropertyType ?? null,
    status: raw.StandardStatus ?? null,
    lat: raw.Latitude ?? null,
    lng: raw.Longitude ?? null,
    photoUrls: (raw.Media ?? []).slice(0, MAX_PHOTOS).map((m) => m.MediaURL),
  };
}

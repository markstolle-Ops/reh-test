import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, mlsListings } from "@/db/schema";
import { buildCacheKey, cacheWrap } from "@/lib/redis";
import type { NormalizedListing, SearchParams } from "@/types";
import { normalizeMlsListing, normalizePlatformListing } from "./normalize";

/**
 * Unified search across platform-native listings and MLS-ingested listings.
 *
 * Both sources are normalized to NormalizedListing and returned together,
 * sorted by createdAt descending.
 *
 * Geographic radius search via PostGIS ST_DWithin requires the
 * location geometry(point, 4326) column on the listings table
 * (added by migrations/0001_add_postgis_location.sql).
 *
 * Results are cached in Redis for 60 seconds to reduce DB load on
 * repeated identical queries (Phase 6-03).
 */
export async function searchListings(params: SearchParams): Promise<{
  results: NormalizedListing[];
  total: number;
  page: number;
}> {
  const cacheKey = buildCacheKey("search", params as Record<string, unknown>);

  return cacheWrap(cacheKey, 60, async () => {
    const {
      q,
      minPrice,
      maxPrice,
      minBeds,
      maxBeds,
      minBaths,
      maxBaths,
      minSqft,
      maxSqft,
      propertyType,
      lat,
      lng,
      radiusKm = 25,
      page = 1,
      limit = 24,
    } = params;

    const offset = (page - 1) * limit;

    // ─── Platform listings query ─────────────────────────────────────────────

    const platformConditions = [eq(listings.status, "active")];

    if (q) {
      platformConditions.push(
        or(ilike(listings.city, `%${q}%`), ilike(listings.zip, `%${q}%`)) as ReturnType<typeof eq>,
      );
    }
    if (minPrice !== undefined) platformConditions.push(gte(listings.price, minPrice));
    if (maxPrice !== undefined) platformConditions.push(lte(listings.price, maxPrice));
    if (minBeds !== undefined) platformConditions.push(gte(listings.bedrooms, minBeds));
    if (maxBeds !== undefined) platformConditions.push(lte(listings.bedrooms, maxBeds));
    if (minBaths !== undefined) platformConditions.push(gte(listings.bathrooms, String(minBaths)));
    if (maxBaths !== undefined) platformConditions.push(lte(listings.bathrooms, String(maxBaths)));
    if (minSqft !== undefined) platformConditions.push(gte(listings.sqft, minSqft));
    if (maxSqft !== undefined) platformConditions.push(lte(listings.sqft, maxSqft));
    if (propertyType) platformConditions.push(eq(listings.propertyType, propertyType));

    // PostGIS geographic radius filter (spherical distance via ::geography cast)
    if (lat !== undefined && lng !== undefined) {
      platformConditions.push(
        sql`ST_DWithin(
          ${listings.location}::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusKm * 1000}
        )` as ReturnType<typeof eq>,
      );
    }

    const platformRows = await db
      .select()
      .from(listings)
      .where(and(...platformConditions))
      .limit(limit)
      .offset(offset);

    // ─── MLS listings query ──────────────────────────────────────────────────

    const mlsConditions = [eq(mlsListings.status, "Active")];

    if (q) {
      mlsConditions.push(
        or(ilike(mlsListings.city, `%${q}%`), ilike(mlsListings.zip, `%${q}%`)) as ReturnType<
          typeof eq
        >,
      );
    }
    if (minPrice !== undefined) mlsConditions.push(gte(mlsListings.price, minPrice));
    if (maxPrice !== undefined) mlsConditions.push(lte(mlsListings.price, maxPrice));
    if (minBeds !== undefined) mlsConditions.push(gte(mlsListings.bedrooms, minBeds));
    if (maxBeds !== undefined) mlsConditions.push(lte(mlsListings.bedrooms, maxBeds));
    if (minBaths !== undefined) mlsConditions.push(gte(mlsListings.bathrooms, String(minBaths)));
    if (maxBaths !== undefined) mlsConditions.push(lte(mlsListings.bathrooms, String(maxBaths)));
    if (minSqft !== undefined) mlsConditions.push(gte(mlsListings.sqft, minSqft));
    if (maxSqft !== undefined) mlsConditions.push(lte(mlsListings.sqft, maxSqft));
    if (propertyType) mlsConditions.push(eq(mlsListings.propertyType, propertyType));

    const mlsRows = await db
      .select()
      .from(mlsListings)
      .where(and(...mlsConditions))
      .limit(limit)
      .offset(offset);

    // ─── Normalize and combine ───────────────────────────────────────────────

    const normalizedPlatform = platformRows.map(normalizePlatformListing);
    const normalizedMls = mlsRows.map(normalizeMlsListing);

    const combined = [...normalizedPlatform, ...normalizedMls].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      results: combined,
      total: combined.length,
      page: page ?? 1,
    };
  });
}

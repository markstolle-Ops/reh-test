import type { listings } from "@/db/schema";
import type { LAUNCH_STATES } from "@/lib/constants";

/**
 * Platform user roles
 */
export type UserRole = "buyer" | "seller";

/**
 * Union of launch state codes
 */
export type LaunchState = (typeof LAUNCH_STATES)[number];

/**
 * Closing process type based on state requirements
 */
export type ClosingType = "title-company" | "attorney-required" | "customary-attorney";

/**
 * Breakdown of closing costs comparing platform vs traditional agent
 */
export interface CommissionBreakdown {
  homePrice: number;
  state: LaunchState;
  traditionalCommission: number;
  platformFee: number;
  titleFee: number;
  attorneyFee: number;
  totalWithPlatform: number;
  totalWithAgent: number;
  savings: number;
}

/**
 * Property type for a listing
 */
export type PropertyType = "single_family" | "condo" | "townhouse" | "land_lot";

/**
 * Listing lifecycle status
 */
export type ListingStatus = "draft" | "active" | "pending" | "sold";

/**
 * Form data submitted when creating or updating a listing
 */
export interface ListingFormData {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType;
  price: number; // in cents
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  lotSizeSqft?: number | null;
  yearBuilt?: number | null;
  description?: string | null;
}

/**
 * Listing row as returned from the database
 */
export type Listing = typeof listings.$inferSelect;

/**
 * Normalized listing shape shared by platform-native and MLS-ingested listings.
 * Both sources are mapped to this type before being returned to the UI.
 */
export interface NormalizedListing {
  id: string;
  source: "platform" | "mls";
  streetAddress?: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  propertyType: string;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  createdAt: string;
}

/**
 * Parameters accepted by the unified search endpoint.
 */
export interface SearchParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyType?: PropertyType;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

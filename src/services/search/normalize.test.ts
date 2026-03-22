import { describe, it, expect, vi } from "vitest";
import {
  normalizePlatformListing,
  normalizeMlsListing,
} from "./normalize";

// ─── Mock env var for photo URL construction ────────────────────────────────
vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://pub.r2.dev");

// ─── Fixtures ────────────────────────────────────────────────────────────────

const platformListing = {
  id: "listing-001",
  userId: "user-abc",
  streetAddress: "123 Oak Lane",
  city: "Austin",
  state: "TX",
  zip: "78701",
  propertyType: "single_family" as const,
  price: 55000000, // 550,000 cents
  bedrooms: 4,
  bathrooms: "3.0",
  sqft: 2200,
  lotSizeSqft: 8000,
  yearBuilt: 2005,
  description: "Lovely home",
  descriptionStatus: "complete",
  status: "active" as const,
  photoOrder: ["photo-key-1.jpg", "photo-key-2.jpg"],
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
  publishedAt: new Date("2026-01-01T12:00:00Z"),
};

const mlsListingRow = {
  id: "mls-001",
  mlsSource: "simplyrets",
  rawData: "{}",
  city: "Austin",
  state: "TX",
  zip: "78702",
  price: 40000000,
  bedrooms: 3,
  bathrooms: "2.0",
  sqft: 1800,
  propertyType: "condo",
  status: "Active",
  lat: "30.2672",
  lng: "-97.7431",
  photoUrls: ["https://cdn.example.com/photo1.jpg", "https://cdn.example.com/photo2.jpg"],
  lastSyncedAt: new Date("2026-01-10T00:00:00Z"),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("normalizePlatformListing", () => {
  it("maps a listings row to NormalizedListing with correct fields", () => {
    const result = normalizePlatformListing(platformListing);
    expect(result.id).toBe("listing-001");
    expect(result.source).toBe("platform");
    expect(result.streetAddress).toBe("123 Oak Lane");
    expect(result.city).toBe("Austin");
    expect(result.state).toBe("TX");
    expect(result.zip).toBe("78701");
    expect(result.price).toBe(55000000);
    expect(result.bedrooms).toBe(4);
    expect(result.bathrooms).toBe(3);
    expect(result.sqft).toBe(2200);
    expect(result.propertyType).toBe("single_family");
    expect(result.status).toBe("active");
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });

  it("builds photoUrl from first item in photoOrder using NEXT_PUBLIC_R2_PUBLIC_URL", () => {
    const result = normalizePlatformListing(platformListing);
    expect(result.photoUrl).toBe("https://pub.r2.dev/photo-key-1.jpg");
  });

  it("returns null photoUrl when photoOrder is empty", () => {
    const result = normalizePlatformListing({ ...platformListing, photoOrder: [] });
    expect(result.photoUrl).toBeNull();
  });

  it("handles null beds/baths/sqft for land_lot listings gracefully", () => {
    const landLot = {
      ...platformListing,
      propertyType: "land_lot" as const,
      bedrooms: null,
      bathrooms: null,
      sqft: null,
    };
    const result = normalizePlatformListing(landLot);
    expect(result.bedrooms).toBeNull();
    expect(result.bathrooms).toBeNull();
    expect(result.sqft).toBeNull();
  });

  it("returns createdAt as ISO string", () => {
    const result = normalizePlatformListing(platformListing);
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("normalizeMlsListing", () => {
  it("maps an mlsListings row to NormalizedListing with source:mls", () => {
    const result = normalizeMlsListing(mlsListingRow);
    expect(result.id).toBe("mls-001");
    expect(result.source).toBe("mls");
    expect(result.city).toBe("Austin");
    expect(result.state).toBe("TX");
    expect(result.zip).toBe("78702");
    expect(result.price).toBe(40000000);
    expect(result.bedrooms).toBe(3);
    expect(result.bathrooms).toBe(2);
    expect(result.sqft).toBe(1800);
    expect(result.propertyType).toBe("condo");
    expect(result.status).toBe("Active");
    expect(result.lat).toBe(30.2672);
    expect(result.lng).toBe(-97.7431);
  });

  it("uses first item in photoUrls array as photoUrl", () => {
    const result = normalizeMlsListing(mlsListingRow);
    expect(result.photoUrl).toBe("https://cdn.example.com/photo1.jpg");
  });

  it("handles missing photoUrls array (null/undefined)", () => {
    const result = normalizeMlsListing({ ...mlsListingRow, photoUrls: null });
    expect(result.photoUrl).toBeNull();
  });

  it("handles empty photoUrls array", () => {
    const result = normalizeMlsListing({ ...mlsListingRow, photoUrls: [] });
    expect(result.photoUrl).toBeNull();
  });

  it("returns null lat/lng when not present", () => {
    const result = normalizeMlsListing({ ...mlsListingRow, lat: null, lng: null });
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });
});

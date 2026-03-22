import { describe, expect, it } from "vitest";
import type { ResoProperty } from "./reso-normalizer";
import { normalizeResoListing } from "./reso-normalizer";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fullListing: ResoProperty = {
  ListingKey: "CRMLS-12345",
  ListPrice: 750000,
  BedroomsTotal: 3,
  BathroomsTotalDecimal: 2.5,
  LivingArea: 1850,
  PostalCity: "Los Angeles",
  StateOrProvince: "CA",
  PostalCode: "90001",
  UnparsedAddress: "123 Main St",
  PropertyType: "Single Family Residential",
  StandardStatus: "Active",
  Latitude: 34.0522,
  Longitude: -118.2437,
  ModificationTimestamp: "2025-03-01T10:00:00Z",
  Media: [
    { MediaURL: "https://photos.example.com/photo1.jpg" },
    { MediaURL: "https://photos.example.com/photo2.jpg" },
    { MediaURL: "https://photos.example.com/photo3.jpg" },
  ],
};

// ─── normalizeResoListing tests ───────────────────────────────────────────────

describe("normalizeResoListing", () => {
  it("uses ListingKey as the id", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.id).toBe("CRMLS-12345");
  });

  it("converts ListPrice from dollars to cents (multiplies by 100)", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.price).toBe(75000000); // $750,000 * 100
  });

  it("sets mlsSource to 'reso:{boardId}'", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.mlsSource).toBe("reso:crmls");
  });

  it("maps city from PostalCity", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.city).toBe("Los Angeles");
  });

  it("maps state from StateOrProvince", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.state).toBe("CA");
  });

  it("maps zip from PostalCode", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.zip).toBe("90001");
  });

  it("maps streetAddress from UnparsedAddress", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.streetAddress).toBe("123 Main St");
  });

  it("maps bedrooms from BedroomsTotal", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.bedrooms).toBe(3);
  });

  it("maps bathrooms from BathroomsTotalDecimal", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.bathrooms).toBe(2.5);
  });

  it("maps sqft from LivingArea", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.sqft).toBe(1850);
  });

  it("maps propertyType from PropertyType", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.propertyType).toBe("Single Family Residential");
  });

  it("maps status from StandardStatus", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.status).toBe("Active");
  });

  it("maps lat from Latitude", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.lat).toBe(34.0522);
  });

  it("maps lng from Longitude", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.lng).toBe(-118.2437);
  });

  it("extracts photoUrls from Media array MediaURL values", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(result.photoUrls).toEqual([
      "https://photos.example.com/photo1.jpg",
      "https://photos.example.com/photo2.jpg",
      "https://photos.example.com/photo3.jpg",
    ]);
  });

  it("caps photoUrls at 20 items", () => {
    const manyPhotos = Array.from({ length: 30 }, (_, i) => ({
      MediaURL: `https://photos.example.com/photo${i}.jpg`,
    }));
    const listing: ResoProperty = { ...fullListing, Media: manyPhotos };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.photoUrls).toHaveLength(20);
  });

  it("sets photoUrls to empty array when Media is missing", () => {
    const listing: ResoProperty = { ...fullListing, Media: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.photoUrls).toEqual([]);
  });

  it("sets rawData to JSON-stringified input", () => {
    const result = normalizeResoListing(fullListing, "crmls");
    expect(JSON.parse(result.rawData)).toMatchObject({ ListingKey: "CRMLS-12345" });
  });

  // ─── Null safety ──────────────────────────────────────────────────────────

  it("handles null BedroomsTotal gracefully", () => {
    const listing: ResoProperty = { ...fullListing, BedroomsTotal: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.bedrooms).toBeNull();
  });

  it("handles null BathroomsTotalDecimal gracefully", () => {
    const listing: ResoProperty = { ...fullListing, BathroomsTotalDecimal: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.bathrooms).toBeNull();
  });

  it("handles null LivingArea gracefully", () => {
    const listing: ResoProperty = { ...fullListing, LivingArea: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.sqft).toBeNull();
  });

  it("handles null Latitude gracefully", () => {
    const listing: ResoProperty = { ...fullListing, Latitude: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.lat).toBeNull();
  });

  it("handles null Longitude gracefully", () => {
    const listing: ResoProperty = { ...fullListing, Longitude: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.lng).toBeNull();
  });

  it("handles missing UnparsedAddress gracefully", () => {
    const listing: ResoProperty = { ...fullListing, UnparsedAddress: undefined };
    const result = normalizeResoListing(listing, "crmls");
    expect(result.streetAddress).toBeNull();
  });
});

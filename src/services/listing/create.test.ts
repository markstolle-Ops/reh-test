import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module before imports
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
  },
}));

import { db } from "@/db";
import { createListing, listingSchema } from "./create";

// Helper to build a valid residential listing payload
const validResidential = () => ({
  streetAddress: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  propertyType: "single_family" as const,
  price: 35000000, // $350,000 in cents
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  lotSizeSqft: 6000,
  yearBuilt: 2010,
});

// Helper to build a valid land/lot listing payload
const validLandLot = () => ({
  streetAddress: "456 Desert Rd",
  city: "Tucson",
  state: "AZ",
  zip: "85701",
  propertyType: "land_lot" as const,
  price: 15000000, // $150,000 in cents
  // beds/baths intentionally omitted
});

describe("listingSchema validation", () => {
  it("accepts valid residential listing data", () => {
    const result = listingSchema.safeParse(validResidential());
    expect(result.success).toBe(true);
  });

  it("accepts land_lot listing with null beds and baths", () => {
    const result = listingSchema.safeParse(validLandLot());
    expect(result.success).toBe(true);
  });

  it("accepts land_lot listing with explicit null beds/baths", () => {
    const result = listingSchema.safeParse({
      ...validLandLot(),
      bedrooms: null,
      bathrooms: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects residential listing with missing bedrooms", () => {
    const data = { ...validResidential() };
    delete (data as Partial<typeof data>).bedrooms;
    const result = listingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects residential listing with missing bathrooms", () => {
    const data = { ...validResidential() };
    delete (data as Partial<typeof data>).bathrooms;
    const result = listingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects price below $10,000 (1000000 cents)", () => {
    const result = listingSchema.safeParse({
      ...validResidential(),
      price: 999999,
    });
    expect(result.success).toBe(false);
  });

  it("accepts price at exactly 1000000 cents ($10,000)", () => {
    const result = listingSchema.safeParse({
      ...validResidential(),
      price: 1000000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects price above $100,000,000 (10000000000 cents)", () => {
    const result = listingSchema.safeParse({
      ...validResidential(),
      price: 10000000001,
    });
    expect(result.success).toBe(false);
  });

  it("rejects state not exactly 2 characters", () => {
    const result = listingSchema.safeParse({
      ...validResidential(),
      state: "TEX",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zip not exactly 5 digits", () => {
    const result = listingSchema.safeParse({
      ...validResidential(),
      zip: "1234",
    });
    expect(result.success).toBe(false);
  });
});

describe("createListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a listing and returns the listing object with all fields", async () => {
    const mockListing = {
      id: "mock-id-123",
      userId: "user_abc",
      ...validResidential(),
      bathrooms: "2.0",
      status: "draft",
      descriptionStatus: "pending",
      photoOrder: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      description: null,
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockListing]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await createListing("user_abc", validResidential());

    expect(db.insert).toHaveBeenCalledOnce();
    expect(mockInsert.values).toHaveBeenCalledOnce();
    const insertedData = mockInsert.values.mock.calls[0][0];
    expect(insertedData.userId).toBe("user_abc");
    expect(insertedData.streetAddress).toBe("123 Main St");
    expect(insertedData.price).toBe(35000000);
    expect(typeof insertedData.id).toBe("string");
    expect(insertedData.id.length).toBeGreaterThan(0);
    expect(result).toEqual(mockListing);
  });

  it("inserts a land_lot listing with null beds/baths", async () => {
    const mockListing = {
      id: "mock-id-456",
      userId: "user_xyz",
      ...validLandLot(),
      bedrooms: null,
      bathrooms: null,
      status: "draft",
      descriptionStatus: "pending",
      photoOrder: [],
      sqft: null,
      lotSizeSqft: null,
      yearBuilt: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockListing]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await createListing("user_xyz", validLandLot());
    expect(result).toEqual(mockListing);
    const insertedData = mockInsert.values.mock.calls[0][0];
    expect(insertedData.propertyType).toBe("land_lot");
  });

  it("throws a validation error for residential listing missing bedrooms", async () => {
    const data = { ...validResidential() };
    delete (data as Partial<typeof data>).bedrooms;
    await expect(createListing("user_abc", data as any)).rejects.toThrow();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("throws a validation error for price below minimum", async () => {
    await expect(
      createListing("user_abc", { ...validResidential(), price: 500000 }),
    ).rejects.toThrow();
    expect(db.insert).not.toHaveBeenCalled();
  });
});

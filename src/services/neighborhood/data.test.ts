import { describe, it, expect } from "vitest";
import { getNeighborhoodData, getMarketTrends } from "./data";

describe("getNeighborhoodData", () => {
  it("returns neighborhood data for a valid zip", async () => {
    const result = await getNeighborhoodData("78701", "TX");
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      walkScore: expect.any(Number),
      transitScore: expect.any(Number),
      bikeScore: expect.any(Number),
      schoolRating: expect.any(Number),
      nearbySchools: expect.any(Array),
      crimeIndex: expect.any(Number),
    });
  });

  it("returns walk score in range 0-100", async () => {
    const result = await getNeighborhoodData("90210", "CA");
    expect(result).not.toBeNull();
    expect(result!.walkScore).toBeGreaterThanOrEqual(0);
    expect(result!.walkScore).toBeLessThanOrEqual(100);
  });

  it("returns transit score in range 0-100", async () => {
    const result = await getNeighborhoodData("10001", "NY");
    expect(result).not.toBeNull();
    expect(result!.transitScore).toBeGreaterThanOrEqual(0);
    expect(result!.transitScore).toBeLessThanOrEqual(100);
  });

  it("returns bike score in range 0-100", async () => {
    const result = await getNeighborhoodData("33101", "FL");
    expect(result).not.toBeNull();
    expect(result!.bikeScore).toBeGreaterThanOrEqual(0);
    expect(result!.bikeScore).toBeLessThanOrEqual(100);
  });

  it("returns school rating in range 1-10", async () => {
    const result = await getNeighborhoodData("78701", "TX");
    expect(result).not.toBeNull();
    expect(result!.schoolRating).toBeGreaterThanOrEqual(1);
    expect(result!.schoolRating).toBeLessThanOrEqual(10);
  });

  it("returns up to 3 nearby schools", async () => {
    const result = await getNeighborhoodData("78701", "TX");
    expect(result).not.toBeNull();
    expect(result!.nearbySchools.length).toBeGreaterThanOrEqual(1);
    expect(result!.nearbySchools.length).toBeLessThanOrEqual(3);
    result!.nearbySchools.forEach((school) => {
      expect(school).toMatchObject({
        name: expect.any(String),
        rating: expect.any(Number),
        distance: expect.any(String),
      });
    });
  });

  it("returns crime index as a positive number", async () => {
    const result = await getNeighborhoodData("78701", "TX");
    expect(result).not.toBeNull();
    expect(result!.crimeIndex).toBeGreaterThan(0);
  });

  it("returns different data for different zips (deterministic by zip)", async () => {
    const result1 = await getNeighborhoodData("78701", "TX");
    const result2 = await getNeighborhoodData("90210", "CA");
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    // At least one field should differ between different zips
    const allSame =
      result1!.walkScore === result2!.walkScore &&
      result1!.transitScore === result2!.transitScore &&
      result1!.bikeScore === result2!.bikeScore;
    expect(allSame).toBe(false);
  });

  it("returns null for invalid zip (non-5-digit)", async () => {
    const result = await getNeighborhoodData("000", "TX");
    expect(result).toBeNull();
  });

  it("returns null for non-numeric zip", async () => {
    const result = await getNeighborhoodData("ABCDE", "TX");
    expect(result).toBeNull();
  });
});

describe("getMarketTrends", () => {
  it("returns array of trend data for a valid zip", async () => {
    const result = await getMarketTrends("78701", "TX");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns exactly 12 months of data", async () => {
    const result = await getMarketTrends("78701", "TX");
    expect(result.length).toBe(12);
  });

  it("each trend point has required fields", async () => {
    const result = await getMarketTrends("10001", "NY");
    result.forEach((point) => {
      expect(point).toMatchObject({
        month: expect.any(String),
        medianPrice: expect.any(Number),
        daysOnMarket: expect.any(Number),
        activeInventory: expect.any(Number),
      });
    });
  });

  it("median price values are realistic (above $50k)", async () => {
    const result = await getMarketTrends("78701", "TX");
    result.forEach((point) => {
      expect(point.medianPrice).toBeGreaterThan(50000);
    });
  });

  it("days on market values are realistic (1-365 days)", async () => {
    const result = await getMarketTrends("78701", "TX");
    result.forEach((point) => {
      expect(point.daysOnMarket).toBeGreaterThanOrEqual(1);
      expect(point.daysOnMarket).toBeLessThanOrEqual(365);
    });
  });

  it("returns different trends for different zips (deterministic by zip)", async () => {
    const result1 = await getMarketTrends("78701", "TX");
    const result2 = await getMarketTrends("90210", "CA");
    // Median prices should differ for different markets
    const allSame = result1.every(
      (p, i) => p.medianPrice === result2[i].medianPrice
    );
    expect(allSame).toBe(false);
  });
});

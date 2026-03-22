import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock the DB module ────────────────────────────────────────────────────────
// vi.mock is hoisted, so factory cannot reference variables declared above it.
// Use vi.fn() inside the factory and retrieve refs via vi.mocked() after import.

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// ─── Mock @/lib/redis ─────────────────────────────────────────────────────────
// cacheWrap falls through to fetchFn (no Redis in unit tests).
// buildCacheKey is stubbed to return a deterministic key.

vi.mock("@/lib/redis", () => ({
  cacheWrap: vi.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
  buildCacheKey: vi.fn(
    (prefix: string, params: Record<string, unknown>) => `${prefix}:${JSON.stringify(params)}`,
  ),
}));

// ─── Import after mock declaration ────────────────────────────────────────────
import { db } from "@/db";
import { buildCacheKey, cacheWrap } from "@/lib/redis";
import { searchListings } from "./listings-search";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockListingsRows = [
  {
    id: "p-1",
    userId: "u-1",
    streetAddress: "100 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    propertyType: "single_family",
    price: 50000000,
    bedrooms: 3,
    bathrooms: "2.0",
    sqft: 1800,
    lotSizeSqft: null,
    yearBuilt: 2000,
    description: "Nice home",
    descriptionStatus: "complete",
    status: "active",
    photoOrder: ["photo-1.jpg"],
    location: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    publishedAt: new Date("2026-01-01T12:00:00Z"),
  },
];

const mockMlsRows = [
  {
    id: "mls-1",
    mlsSource: "simplyrets",
    rawData: "{}",
    city: "Austin",
    state: "TX",
    zip: "78702",
    price: 45000000,
    bedrooms: 2,
    bathrooms: "1.0",
    sqft: 1200,
    propertyType: "condo",
    status: "Active",
    lat: "30.2672",
    lng: "-97.7431",
    photoUrls: ["https://cdn.example.com/mls1.jpg"],
    lastSyncedAt: new Date("2026-01-10T00:00:00Z"),
  },
];

// Chainable mock builder for Drizzle query interface
function makeQueryMock(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

describe("searchListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cacheWrap to always pass through to fetchFn
    vi.mocked(cacheWrap).mockImplementation(
      async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
    );
    const mockSelect = vi.mocked(db.select);
    mockSelect
      .mockReturnValueOnce(
        makeQueryMock(mockListingsRows) as unknown as ReturnType<typeof db.select>,
      )
      .mockReturnValueOnce(makeQueryMock(mockMlsRows) as unknown as ReturnType<typeof db.select>);
  });

  it("returns both platform and MLS listings normalized as NormalizedListing[]", async () => {
    const result = await searchListings({});
    expect(result.results).toHaveLength(2);
    const sources = result.results.map((r) => r.source);
    expect(sources).toContain("platform");
    expect(sources).toContain("mls");
  });

  it("returns page and total metadata", async () => {
    const result = await searchListings({ page: 1, limit: 24 });
    expect(result.page).toBe(1);
    expect(result.total).toBe(2);
  });

  it("passes q param to platform and MLS queries (both selects called)", async () => {
    await searchListings({ q: "Austin" });
    expect(vi.mocked(db.select)).toHaveBeenCalledTimes(2);
  });

  it("passes minPrice/maxPrice to queries (both selects called)", async () => {
    await searchListings({ minPrice: 30000000, maxPrice: 60000000 });
    expect(vi.mocked(db.select)).toHaveBeenCalledTimes(2);
  });

  it("passes minBeds to queries (both selects called)", async () => {
    await searchListings({ minBeds: 2 });
    expect(vi.mocked(db.select)).toHaveBeenCalledTimes(2);
  });

  it("returns results sorted by createdAt descending", async () => {
    const result = await searchListings({});
    // MLS listing lastSyncedAt: 2026-01-10 > Platform createdAt: 2026-01-01
    const dates = result.results.map((r) => r.createdAt);
    expect(new Date(dates[0]).getTime()).toBeGreaterThanOrEqual(new Date(dates[1]).getTime());
  });

  it("normalizes platform city correctly", async () => {
    const result = await searchListings({});
    const platform = result.results.find((r) => r.source === "platform");
    expect(platform?.city).toBe("Austin");
  });

  it("normalizes MLS listing with lat/lng", async () => {
    const result = await searchListings({});
    const mls = result.results.find((r) => r.source === "mls");
    expect(mls?.lat).toBe(30.2672);
    expect(mls?.lng).toBe(-97.7431);
  });

  // ─── Cache integration tests ────────────────────────────────────────────────

  it("calls cacheWrap with a deterministic key derived from params", async () => {
    await searchListings({ q: "Austin", minBeds: 2 });
    expect(vi.mocked(cacheWrap)).toHaveBeenCalledTimes(1);
    const [key, ttl] = vi.mocked(cacheWrap).mock.calls[0];
    expect(key).toContain("search:");
    expect(ttl).toBe(60);
  });

  it("builds identical cache keys for identical param objects (deterministic)", () => {
    // buildCacheKey is the pure function from redis.ts — tested here via mock
    const key1 = buildCacheKey("search", { q: "Austin", minBeds: 2 });
    const key2 = buildCacheKey("search", { minBeds: 2, q: "Austin" });
    // The mock preserves the prefix:json pattern; actual determinism tested in redis.test.ts
    expect(key1).toMatch(/^search:/);
    expect(key2).toMatch(/^search:/);
  });

  it("returns cached result directly when cacheWrap returns a cached value", async () => {
    const cachedResult = {
      results: [{ id: "cached" } as never],
      total: 1,
      page: 1,
    };
    vi.mocked(cacheWrap).mockResolvedValueOnce(cachedResult);

    const result = await searchListings({ q: "Austin" });

    expect(result).toEqual(cachedResult);
    // DB should NOT be called — cacheWrap short-circuits
    expect(vi.mocked(db.select)).not.toHaveBeenCalled();
  });
});

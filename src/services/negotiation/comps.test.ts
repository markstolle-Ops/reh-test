import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing fetchComps
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { fetchComps } from "./comps";
import { db } from "@/db";

describe("fetchComps", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns array of comps for a given zip from mls_listings with status sold", async () => {
    const now = new Date();
    const mockRows = [
      {
        price: 50000000, // 500k in cents
        sqft: 1800,
        lastSyncedAt: now,
        streetAddress: "Beverly Hills", // maps to mlsListings.city
        zip: "90210",
      },
    ];

    // Chain mock: db.select().from().where().orderBy().limit()
    const limitMock = vi.fn().mockResolvedValue(mockRows);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: fromMock });

    const comps = await fetchComps({ zip: "90210" });

    expect(comps).toHaveLength(1);
    expect(comps[0]).toMatchObject({
      soldPriceCents: 50000000,
      sqft: 1800,
      address: "Beverly Hills, 90210",
    });
    expect(typeof comps[0].daysAgo).toBe("number");
    expect(comps[0].daysAgo).toBeGreaterThanOrEqual(0);
  });

  it("returns empty array when no sold listings exist in zip", async () => {
    const limitMock = vi.fn().mockResolvedValue([]);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: fromMock });

    const comps = await fetchComps({ zip: "00000" });

    expect(comps).toHaveLength(0);
    expect(Array.isArray(comps)).toBe(true);
  });

  it("computes daysAgo from lastSyncedAt", async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const mockRows = [
      {
        price: 30000000,
        sqft: 1200,
        lastSyncedAt: threeDaysAgo,
        streetAddress: "456 Oak Ave, TX 78701",
        zip: "78701",
      },
    ];

    const limitMock = vi.fn().mockResolvedValue(mockRows);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: fromMock });

    const comps = await fetchComps({ zip: "78701" });
    expect(comps[0].daysAgo).toBeGreaterThanOrEqual(3);
  });
});

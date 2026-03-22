import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock modules ─────────────────────────────────────────────────────────────

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  listings: { id: "listings" },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { db } from "@/db";
import { buildPreferenceSummary } from "./preference-profile";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-1",
  userId: "user-1",
  eventType: "listing_viewed" as const,
  listingId: "listing-1",
  metadata: "{}",
  occurredAt: new Date(),
  ...overrides,
});

const sampleListing = {
  id: "listing-1",
  price: 35000000, // $350k in cents
  bedrooms: 3,
  bathrooms: "2.0",
  sqft: 1800,
  propertyType: "single_family",
  city: "Phoenix",
  state: "AZ",
};

// ─── buildPreferenceSummary ───────────────────────────────────────────────────

describe("buildPreferenceSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when fewer than 3 events are provided", async () => {
    const events = [makeEvent(), makeEvent({ id: "evt-2" })];
    const result = await buildPreferenceSummary(events);
    expect(result).toBeNull();
  });

  it("returns null for an empty event array", async () => {
    const result = await buildPreferenceSummary([]);
    expect(result).toBeNull();
  });

  it("builds a preference summary from listing_viewed events", async () => {
    const events = [
      makeEvent({ id: "evt-1", listingId: "listing-1" }),
      makeEvent({ id: "evt-2", listingId: "listing-1" }),
      makeEvent({ id: "evt-3", listingId: "listing-1" }),
    ];

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([sampleListing]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await buildPreferenceSummary(events);
    expect(result).not.toBeNull();
    expect(result).toContain("3");          // beds
    expect(result).toContain("single_family");
    expect(result).toContain("Phoenix");
    expect(result).toContain("AZ");
  });

  it("includes price range in the summary", async () => {
    const events = [
      makeEvent({ id: "evt-1", listingId: "listing-1" }),
      makeEvent({ id: "evt-2", listingId: "listing-1" }),
      makeEvent({ id: "evt-3", listingId: "listing-1" }),
    ];

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([sampleListing]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await buildPreferenceSummary(events);
    // Price is $350k in cents — summary should reflect that
    expect(result).toMatch(/\$\d+k/);
  });

  it("does NOT include school ratings, walkability, or demographic proxies", async () => {
    const events = [
      makeEvent({ id: "evt-1", listingId: "listing-1" }),
      makeEvent({ id: "evt-2", listingId: "listing-1" }),
      makeEvent({ id: "evt-3", listingId: "listing-1" }),
    ];

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([sampleListing]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await buildPreferenceSummary(events);
    // Fair Housing compliance — no demographic proxies
    expect(result).not.toMatch(/school/i);
    expect(result).not.toMatch(/walkabilit/i);
    expect(result).not.toMatch(/neighborhood score/i);
    expect(result).not.toMatch(/demographic/i);
  });

  it("handles search_executed events by extracting filters from metadata", async () => {
    const searchMeta = JSON.stringify({
      minPrice: 30000000,
      maxPrice: 45000000,
      minBeds: 3,
      propertyType: "single_family",
      city: "Scottsdale",
    });
    const events = [
      makeEvent({ id: "evt-1", eventType: "search_executed", listingId: null, metadata: searchMeta }),
      makeEvent({ id: "evt-2", eventType: "search_executed", listingId: null, metadata: searchMeta }),
      makeEvent({ id: "evt-3", eventType: "search_executed", listingId: null, metadata: searchMeta }),
    ];

    // No listing lookups needed for search_executed
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await buildPreferenceSummary(events);
    expect(result).not.toBeNull();
  });
});

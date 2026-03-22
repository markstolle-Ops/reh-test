import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock submitToMls ─────────────────────────────────────────────────────────

const mockSubmitToMls = vi.fn().mockResolvedValue({
  submissionId: "sub-test-001",
  status: "submitted" as const,
  submittedAt: new Date("2026-01-01T00:00:00Z"),
});

vi.mock("@/services/mls/syndication", () => ({
  submitToMls: mockSubmitToMls,
}));

// ─── Mock DB ──────────────────────────────────────────────────────────────────

const mockFindFirst = vi.fn();
const mockQueryListings = { findFirst: mockFindFirst };

vi.mock("@/db", () => ({
  db: {
    query: {
      listings: mockQueryListings,
    },
  },
}));

vi.mock("@/db/schema", () => ({
  listings: {},
}));

// ─── Mock inngest client ──────────────────────────────────────────────────────

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((opts, trigger, handler) => ({
      opts,
      trigger,
      handler,
    })),
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("syndicateToMlsRaw", () => {
  const mockListing = {
    id: "listing-pub-001",
    userId: "user-seller-001",
    streetAddress: "789 Elm St",
    city: "Charlotte",
    state: "NC",
    zip: "28201",
    propertyType: "single_family" as const,
    price: 38000000, // cents
    bedrooms: 4,
    bathrooms: "2.5",
    sqft: 2000,
    lotSizeSqft: 6000,
    description: "Beautiful home in Charlotte",
    photoOrder: ["photo-1", "photo-2"],
    status: "active" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitToMls.mockResolvedValue({
      submissionId: "sub-test-001",
      status: "submitted" as const,
      submittedAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("fetches listing from DB by listingId", async () => {
    mockFindFirst.mockResolvedValue(mockListing);

    const { syndicateToMlsRaw } = await import("./syndicate-to-mls");
    await syndicateToMlsRaw("listing-pub-001");

    expect(mockFindFirst).toHaveBeenCalledOnce();
  });

  it("calls submitToMls with correct listing data including address, price, beds, baths, sqft", async () => {
    mockFindFirst.mockResolvedValue(mockListing);

    const { syndicateToMlsRaw } = await import("./syndicate-to-mls");
    await syndicateToMlsRaw("listing-pub-001");

    expect(mockSubmitToMls).toHaveBeenCalledOnce();
    const callArg = mockSubmitToMls.mock.calls[0][0];

    expect(callArg.listingId).toBe("listing-pub-001");
    expect(callArg.address).toContain("789 Elm St");
    expect(callArg.address).toContain("Charlotte");
    expect(callArg.price).toBe(38000000);
    expect(callArg.bedrooms).toBe(4);
    expect(callArg.sqft).toBe(2000);
    expect(callArg.mlsRegion).toContain("NC");
  });

  it("throws if listing not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    const { syndicateToMlsRaw } = await import("./syndicate-to-mls");

    await expect(syndicateToMlsRaw("nonexistent-listing")).rejects.toThrow(
      /not found/i
    );
  });

  it("returns the submitToMls result", async () => {
    mockFindFirst.mockResolvedValue(mockListing);

    const { syndicateToMlsRaw } = await import("./syndicate-to-mls");
    const result = await syndicateToMlsRaw("listing-pub-001");

    expect(result.status).toBe("submitted");
    expect(result.submissionId).toBe("sub-test-001");
  });
});

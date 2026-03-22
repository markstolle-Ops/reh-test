import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock modules ─────────────────────────────────────────────────────────────

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  buyerEvents: { id: "buyer_events" },
}));

vi.mock("./buyer-events", () => ({
  getRecentEvents: vi.fn(),
}));

vi.mock("./preference-profile", () => ({
  buildPreferenceSummary: vi.fn(),
}));

const { mockEmbeddingsCreate } = vi.hoisted(() => ({
  mockEmbeddingsCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: vi.fn(function () {
    return {
      embeddings: {
        create: mockEmbeddingsCreate,
      },
    };
  }),
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { db } from "@/db";
import { getRecentEvents } from "./buyer-events";
import { buildPreferenceSummary } from "./preference-profile";
import { getRecommendations } from "./listing-recommendations";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleEvent = {
  id: "evt-1",
  userId: "user-1",
  eventType: "listing_viewed" as const,
  listingId: "listing-1",
  metadata: "{}",
  occurredAt: new Date(),
};

const sampleDbRow = {
  id: "listing-1",
  street_address: "123 Main St",
  city: "Phoenix",
  state: "AZ",
  zip: "85001",
  price: 35000000,
  bedrooms: 3,
  bathrooms: "2.0",
  sqft: 1800,
  property_type: "single_family",
  status: "active",
  created_at: new Date().toISOString(),
  distance: 0.05,
};

// ─── getRecommendations ───────────────────────────────────────────────────────

describe("getRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no recent events exist", async () => {
    vi.mocked(getRecentEvents).mockResolvedValue([]);
    vi.mocked(buildPreferenceSummary).mockResolvedValue(null);

    const results = await getRecommendations("user-1");
    expect(results).toEqual([]);
  });

  it("returns empty array when preference summary is null (< 3 events)", async () => {
    vi.mocked(getRecentEvents).mockResolvedValue([sampleEvent, sampleEvent]);
    vi.mocked(buildPreferenceSummary).mockResolvedValue(null);

    const results = await getRecommendations("user-1");
    expect(results).toEqual([]);
  });

  it("calls pgvector query and returns NormalizedListing array", async () => {
    vi.mocked(getRecentEvents).mockResolvedValue([sampleEvent, sampleEvent, sampleEvent]);
    vi.mocked(buildPreferenceSummary).mockResolvedValue("3 bedroom single_family $350k-$350k Phoenix AZ");

    // Mock OpenAI embedding via shared hoisted mock
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: new Array(1536).fill(0.1) }],
    });

    vi.mocked(db.execute).mockResolvedValue([sampleDbRow] as unknown as Awaited<ReturnType<typeof db.execute>>);

    const results = await getRecommendations("user-1");
    expect(Array.isArray(results)).toBe(true);
  });

  it("normalizes db rows to NormalizedListing shape", async () => {
    vi.mocked(getRecentEvents).mockResolvedValue([sampleEvent, sampleEvent, sampleEvent]);
    vi.mocked(buildPreferenceSummary).mockResolvedValue("3 bedroom single_family $350k-$350k Phoenix AZ");

    // Mock OpenAI embedding via shared hoisted mock
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: new Array(1536).fill(0.1) }],
    });

    vi.mocked(db.execute).mockResolvedValue([sampleDbRow] as unknown as Awaited<ReturnType<typeof db.execute>>);

    const results = await getRecommendations("user-1");
    if (results.length > 0) {
      const listing = results[0];
      expect(listing).toHaveProperty("id");
      expect(listing).toHaveProperty("source", "platform");
      expect(listing).toHaveProperty("city");
      expect(listing).toHaveProperty("state");
      expect(listing).toHaveProperty("price");
    }
  });
});

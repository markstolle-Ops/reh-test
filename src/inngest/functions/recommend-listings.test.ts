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

vi.mock("@/services/matching/listing-recommendations", () => ({
  getRecommendations: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((opts, trigger, handler) => ({
      opts,
      trigger,
      handler,
    })),
  },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { db } from "@/db";
import { getRecommendations } from "@/services/matching/listing-recommendations";
import {
  getActiveBuyerUserIds,
  sendRecommendationEmailRaw,
} from "./recommend-listings";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleListing = {
  id: "listing-1",
  source: "platform" as const,
  streetAddress: "123 Main St",
  city: "Phoenix",
  state: "AZ",
  zip: "85001",
  price: 35000000,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  propertyType: "single_family",
  photoUrl: null,
  lat: null,
  lng: null,
  status: "active",
  createdAt: new Date().toISOString(),
};

// ─── getActiveBuyerUserIds ───────────────────────────────────────────────────

describe("getActiveBuyerUserIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads distinct userIds with recent buyer events", async () => {
    vi.mocked(db.execute).mockResolvedValue(
      [{ user_id: "user-1" }, { user_id: "user-2" }] as unknown as Awaited<ReturnType<typeof db.execute>>
    );

    const result = await getActiveBuyerUserIds();

    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual(["user-1", "user-2"]);
  });

  it("returns empty array when no users have recent events", async () => {
    vi.mocked(db.execute).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof db.execute>>
    );

    const result = await getActiveBuyerUserIds();

    expect(result).toEqual([]);
  });
});

// ─── sendRecommendationEmailRaw ───────────────────────────────────────────────

describe("sendRecommendationEmailRaw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getRecommendations for the user", async () => {
    vi.mocked(getRecommendations).mockResolvedValue([sampleListing]);

    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await sendRecommendationEmailRaw("user-1", "user@example.com", sendEmail);

    expect(getRecommendations).toHaveBeenCalledWith("user-1");
  });

  it("sends email when recommendations are found", async () => {
    vi.mocked(getRecommendations).mockResolvedValue([sampleListing]);

    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await sendRecommendationEmailRaw("user-1", "user@example.com", sendEmail);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: expect.stringContaining("listing"),
      })
    );
  });

  it("does NOT send email when no recommendations found", async () => {
    vi.mocked(getRecommendations).mockResolvedValue([]);

    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await sendRecommendationEmailRaw("user-1", "user@example.com", sendEmail);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("includes top 5 listings in email body", async () => {
    const listings = Array.from({ length: 8 }, (_, i) => ({
      ...sampleListing,
      id: `listing-${i}`,
      price: (30000000 + i * 1000000),
    }));

    vi.mocked(getRecommendations).mockResolvedValue(listings);

    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await sendRecommendationEmailRaw("user-1", "user@example.com", sendEmail);

    const callArgs = sendEmail.mock.calls[0][0];
    expect(callArgs.text).toContain("more");
  });
});

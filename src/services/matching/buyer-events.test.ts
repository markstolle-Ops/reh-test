import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock modules ─────────────────────────────────────────────────────────────
// All vi.mock calls are hoisted — use vi.fn() inline only (Vitest hoisting rule).

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  buyerEvents: { id: "buyer_events" },
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-nanoid-123"),
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { db } from "@/db";
import { recordBuyerEvent, getRecentEvents } from "./buyer-events";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleEvent = {
  id: "test-nanoid-123",
  userId: "user-1",
  eventType: "listing_viewed" as const,
  listingId: "listing-1",
  metadata: "{}",
  occurredAt: new Date(),
};

// ─── recordBuyerEvent ─────────────────────────────────────────────────────────

describe("recordBuyerEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a buyer event row into the database", async () => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([sampleEvent]),
      }),
    } as unknown as ReturnType<typeof db.insert>);

    const result = await recordBuyerEvent({
      userId: "user-1",
      eventType: "listing_viewed",
      listingId: "listing-1",
    });

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(result).toEqual(sampleEvent);
  });

  it("accepts listing_saved event type", async () => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...sampleEvent, eventType: "listing_saved" }]),
      }),
    } as unknown as ReturnType<typeof db.insert>);

    const result = await recordBuyerEvent({
      userId: "user-1",
      eventType: "listing_saved",
      listingId: "listing-1",
    });

    expect(result.eventType).toBe("listing_saved");
  });

  it("accepts search_executed event type with metadata", async () => {
    const meta = { minPrice: 30000000, city: "Phoenix" };
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { ...sampleEvent, eventType: "search_executed", metadata: JSON.stringify(meta) },
        ]),
      }),
    } as unknown as ReturnType<typeof db.insert>);

    const result = await recordBuyerEvent({
      userId: "user-1",
      eventType: "search_executed",
      metadata: meta,
    });

    expect(result.eventType).toBe("search_executed");
  });

  it("throws an error for invalid eventType", async () => {
    await expect(
      recordBuyerEvent({
        userId: "user-1",
        eventType: "invalid_type" as "listing_viewed",
      })
    ).rejects.toThrow("Invalid eventType");
  });
});

// ─── getRecentEvents ──────────────────────────────────────────────────────────

describe("getRecentEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns buyer events for the given user from trailing 90 days", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([sampleEvent]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const results = await getRecentEvents("user-1");
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe("user-1");
  });

  it("returns empty array when no events exist", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const results = await getRecentEvents("user-no-events");
    expect(results).toHaveLength(0);
  });
});

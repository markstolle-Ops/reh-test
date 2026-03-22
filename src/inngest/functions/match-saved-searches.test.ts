import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock modules ─────────────────────────────────────────────────────────────
// All vi.mock calls are hoisted — use vi.fn() inline only (Vitest hoisting rule).

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  savedSearches: { id: "saved_searches" },
}));

vi.mock("@/services/search/listings-search", () => ({
  searchListings: vi.fn(),
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
import { searchListings } from "@/services/search/listings-search";
import { checkSavedSearchAlertRaw, matchSavedSearchesRaw } from "./match-saved-searches";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleFilters = JSON.stringify({ minPrice: 10000000 });

const savedSearch = {
  id: "ss-1",
  userId: "u-1",
  name: "Austin Homes",
  filters: sampleFilters,
  active: true,
  lastAlertSentAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

const newListing = {
  id: "p-99",
  source: "platform" as const,
  city: "Austin",
  state: "TX",
  zip: "78701",
  price: 35000000,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  propertyType: "single_family",
  photoUrl: null,
  lat: 30.2,
  lng: -97.7,
  status: "active",
  createdAt: new Date().toISOString(), // recent
};

// ─── matchSavedSearchesRaw ────────────────────────────────────────────────────

describe("matchSavedSearchesRaw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads all active saved searches from the DB", async () => {
    const mockSelect = vi.mocked(db.select);
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([savedSearch]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const sendEvent = vi.fn().mockResolvedValue(undefined);
    await matchSavedSearchesRaw(sendEvent);

    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("fans out one search/alert.check event per saved search", async () => {
    const mockSelect = vi.mocked(db.select);
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([savedSearch]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const sendEvent = vi.fn().mockResolvedValue(undefined);
    await matchSavedSearchesRaw(sendEvent);

    expect(sendEvent).toHaveBeenCalledTimes(1);
    const call = sendEvent.mock.calls[0][0];
    expect(call.name).toBe("search/alert.check");
    expect(call.data.savedSearchId).toBe("ss-1");
    expect(call.data.userId).toBe("u-1");
  });

  it("returns empty fan-out when no active searches exist", async () => {
    const mockSelect = vi.mocked(db.select);
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const sendEvent = vi.fn().mockResolvedValue(undefined);
    await matchSavedSearchesRaw(sendEvent);

    expect(sendEvent).not.toHaveBeenCalled();
  });
});

// ─── checkSavedSearchAlertRaw ─────────────────────────────────────────────────
// sendEmail is injected as a parameter for testability — no Resend constructor needed.

describe("checkSavedSearchAlertRaw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls searchListings with the stored filters", async () => {
    vi.mocked(searchListings).mockResolvedValue({
      results: [newListing],
      total: 1,
      page: 1,
    });

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const mockSendEmail = vi.fn().mockResolvedValue(undefined);
    await checkSavedSearchAlertRaw(savedSearch, mockSendEmail);

    expect(searchListings).toHaveBeenCalledWith(expect.objectContaining({ minPrice: 10000000 }));
  });

  it("calls sendEmail when new listings are found", async () => {
    vi.mocked(searchListings).mockResolvedValue({
      results: [newListing],
      total: 1,
      page: 1,
    });

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const mockSendEmail = vi.fn().mockResolvedValue(undefined);
    // Fresh search with no lastAlertSentAt — all results are "new"
    await checkSavedSearchAlertRaw(savedSearch, mockSendEmail);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Austin Homes"),
      })
    );
    expect(vi.mocked(db.update)).toHaveBeenCalledTimes(1);
  });

  it("does NOT call sendEmail when no new listings found since lastAlertSentAt", async () => {
    // lastAlertSentAt is in the future — no new listings since then
    const futureSearch = {
      ...savedSearch,
      lastAlertSentAt: new Date(Date.now() + 1_000_000),
    };

    vi.mocked(searchListings).mockResolvedValue({
      results: [
        {
          ...newListing,
          createdAt: new Date("2026-01-01T00:00:00Z").toISOString(), // old listing
        },
      ],
      total: 1,
      page: 1,
    });

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const mockSendEmail = vi.fn().mockResolvedValue(undefined);
    await checkSavedSearchAlertRaw(futureSearch, mockSendEmail);

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });
});

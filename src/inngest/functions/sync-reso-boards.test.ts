import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncResoBoardsRaw } from "./sync-reso-boards";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/mls/reso-client", () => ({
  fetchResoDelta: vi.fn(),
}));

vi.mock("@/services/mls/reso-normalizer", () => ({
  normalizeResoListing: vi.fn(),
}));

import { db } from "@/db";
import { fetchResoDelta } from "@/services/mls/reso-client";
import { normalizeResoListing } from "@/services/mls/reso-normalizer";

// ─── Test boards fixture ──────────────────────────────────────────────────────

const mockBoard1 = {
  id: "crmls",
  name: "CRMLS",
  apiUrl: "https://api.crmls.org/reso/OData",
  apiToken: "crmls-token-abc",
  coverageStates: ["CA"],
  active: true,
  syncIntervalMinutes: 30,
  lastSyncedAt: new Date("2025-01-01T00:00:00Z"),
  lastSyncError: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

const mockBoard2 = {
  id: "bright",
  name: "Bright MLS",
  apiUrl: "https://api.bright.com/reso/OData",
  apiToken: "bright-token-xyz",
  coverageStates: ["DC", "MD", "VA"],
  active: true,
  syncIntervalMinutes: 60,
  lastSyncedAt: null,
  lastSyncError: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

const mockRawListing = {
  ListingKey: "CRMLS-123",
  ListPrice: 500000,
};

const mockNormalized = {
  id: "CRMLS-123",
  mlsSource: "reso:crmls",
  rawData: JSON.stringify(mockRawListing),
  streetAddress: "456 Oak Ave",
  city: "San Diego",
  state: "CA",
  zip: "92101",
  price: 50000000,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
  propertyType: "Single Family",
  status: "Active",
  lat: 32.7157,
  lng: -117.1611,
  photoUrls: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupMockDb(boards: (typeof mockBoard1)[]) {
  const fromMock = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(boards),
  });
  const selectMock = vi.fn().mockReturnValue({
    from: fromMock,
  });
  const valuesMock = vi.fn().mockReturnValue({
    onConflictDoUpdate: vi.fn().mockResolvedValue([]),
  });
  const insertMock = vi.fn().mockReturnValue({
    values: valuesMock,
  });
  const setMock = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  });
  const updateMock = vi.fn().mockReturnValue({
    set: setMock,
  });

  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: fromMock,
  });
  (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
    values: valuesMock,
  });
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
    set: setMock,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("syncResoBoardsRaw", () => {
  it("queries active boards from DB", async () => {
    setupMockDb([]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncResoBoardsRaw();

    expect(db.select).toHaveBeenCalled();
  });

  it("calls fetchResoDelta for each active board", async () => {
    setupMockDb([mockBoard1, mockBoard2]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncResoBoardsRaw();

    expect(fetchResoDelta).toHaveBeenCalledTimes(2);
  });

  it("passes lastSyncedAt as the since date for delta sync", async () => {
    setupMockDb([mockBoard1]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncResoBoardsRaw();

    const [boardArg, sinceArg] = (fetchResoDelta as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(boardArg.boardId).toBe("crmls");
    expect(sinceArg).toEqual(mockBoard1.lastSyncedAt);
  });

  it("uses epoch (new Date(0)) when lastSyncedAt is null", async () => {
    setupMockDb([{ ...mockBoard2, lastSyncedAt: null }]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncResoBoardsRaw();

    const [, sinceArg] = (fetchResoDelta as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(sinceArg).toEqual(new Date(0));
  });

  it("normalizes each listing and upserts to mlsListings", async () => {
    setupMockDb([mockBoard1]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([mockRawListing]);
    (normalizeResoListing as ReturnType<typeof vi.fn>).mockReturnValue(mockNormalized);

    await syncResoBoardsRaw();

    expect(normalizeResoListing).toHaveBeenCalledWith(mockRawListing, "crmls");
    expect(db.insert).toHaveBeenCalled();
  });

  it("continues syncing remaining boards when one board throws an error", async () => {
    setupMockDb([mockBoard1, mockBoard2]);

    (fetchResoDelta as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("CRMLS API timeout"))
      .mockResolvedValueOnce([]);

    // Should not throw — per-board error isolation
    await expect(syncResoBoardsRaw()).resolves.not.toThrow();

    // Second board still called despite first failure
    expect(fetchResoDelta).toHaveBeenCalledTimes(2);
  });

  it("updates lastSyncedAt on successful board sync", async () => {
    setupMockDb([mockBoard1]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncResoBoardsRaw();

    expect(db.update).toHaveBeenCalled();
  });

  it("sets lastSyncError on board when sync fails", async () => {
    setupMockDb([mockBoard1]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Connection refused"),
    );

    await syncResoBoardsRaw();

    expect(db.update).toHaveBeenCalled();
  });

  it("does nothing when no active boards exist", async () => {
    setupMockDb([]);
    (fetchResoDelta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncResoBoardsRaw();

    expect(fetchResoDelta).not.toHaveBeenCalled();
  });
});

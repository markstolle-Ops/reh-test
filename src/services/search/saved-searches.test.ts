import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock the DB module ────────────────────────────────────────────────────────
// vi.mock is hoisted — factory must use vi.fn() inline (not outer variables).

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  savedSearches: { id: "saved_searches" },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { db } from "@/db";
import type { SearchParams } from "@/types";
import { createSavedSearch, deleteSavedSearch, getSavedSearches } from "./saved-searches";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleFilters: SearchParams = {
  minPrice: 10000000,
  maxPrice: 50000000,
  minBeds: 2,
};

const sampleRecord = {
  id: "ss-1",
  userId: "u-1",
  name: "My Search",
  filters: JSON.stringify(sampleFilters),
  active: true,
  lastAlertSentAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createSavedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a saved search with JSON-stringified filters and returns the record", async () => {
    const mockInsert = vi.mocked(db.insert);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([sampleRecord]),
      }),
    } as unknown as ReturnType<typeof db.insert>);

    const result = await createSavedSearch("u-1", "My Search", sampleFilters);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(result).toEqual(sampleRecord);
  });

  it("stores filters as a JSON string", async () => {
    let capturedValues: Record<string, unknown> | null = null;
    const mockValuesFn = vi.fn().mockImplementation((vals) => {
      capturedValues = vals;
      return { returning: vi.fn().mockResolvedValue([sampleRecord]) };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValuesFn,
    } as unknown as ReturnType<typeof db.insert>);

    await createSavedSearch("u-1", "My Search", sampleFilters);

    expect(typeof capturedValues?.filters).toBe("string");
    expect(JSON.parse(capturedValues!.filters as string)).toEqual(sampleFilters);
  });

  it("stores the correct userId and name", async () => {
    let capturedValues: Record<string, unknown> | null = null;
    const mockValuesFn = vi.fn().mockImplementation((vals) => {
      capturedValues = vals;
      return { returning: vi.fn().mockResolvedValue([sampleRecord]) };
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValuesFn,
    } as unknown as ReturnType<typeof db.insert>);

    await createSavedSearch("u-1", "My Search", sampleFilters);

    expect(capturedValues?.userId).toBe("u-1");
    expect(capturedValues?.name).toBe("My Search");
  });
});

describe("getSavedSearches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all active saved searches for a user", async () => {
    const mockSelect = vi.mocked(db.select);
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([sampleRecord]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await getSavedSearches("u-1");
    expect(result).toEqual([sampleRecord]);
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no saved searches exist", async () => {
    const mockSelect = vi.mocked(db.select);
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const result = await getSavedSearches("u-2");
    expect(result).toEqual([]);
  });
});

describe("deleteSavedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the record matching userId and id", async () => {
    const mockDelete = vi.mocked(db.delete);
    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof db.delete>);

    await deleteSavedSearch("u-1", "ss-1");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

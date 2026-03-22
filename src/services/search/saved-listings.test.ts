import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB module ────────────────────────────────────────────────────────
// vi.mock is hoisted, so factory cannot reference variables declared above it.
// Use vi.fn() inside the factory and retrieve refs via vi.mocked() after import.

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

// ─── Import after mock declaration ────────────────────────────────────────────
import { db } from "@/db";
import {
  toggleSavedListing,
  getSavedListings,
  isListingSaved,
} from "./saved-listings";

// ─── Chainable mock builders ───────────────────────────────────────────────────

function makeSelectMock(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
}

function makeInsertMock() {
  return {
    values: vi.fn().mockResolvedValue(undefined),
  };
}

function makeDeleteMock() {
  return {
    where: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const savedRow = {
  id: "sv-1",
  userId: "user-1",
  listingId: "listing-1",
  mlsListingId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

const platformListingRow = {
  id: "listing-1",
  userId: "user-1",
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
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("toggleSavedListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a saved_listings row when listing is not saved (returns { saved: true })", async () => {
    // First call (isListingSaved check): empty → not saved
    vi.mocked(db.select).mockReturnValueOnce(
      makeSelectMock([]) as unknown as ReturnType<typeof db.select>
    );
    vi.mocked(db.insert).mockReturnValueOnce(
      makeInsertMock() as unknown as ReturnType<typeof db.insert>
    );

    const result = await toggleSavedListing("user-1", "listing-1", "platform");
    expect(result).toEqual({ saved: true });
    expect(vi.mocked(db.insert)).toHaveBeenCalledTimes(1);
  });

  it("deletes the saved_listings row when listing is already saved (returns { saved: false })", async () => {
    // First call (isListingSaved check): has row → already saved
    vi.mocked(db.select).mockReturnValueOnce(
      makeSelectMock([savedRow]) as unknown as ReturnType<typeof db.select>
    );
    vi.mocked(db.delete).mockReturnValueOnce(
      makeDeleteMock() as unknown as ReturnType<typeof db.delete>
    );

    const result = await toggleSavedListing("user-1", "listing-1", "platform");
    expect(result).toEqual({ saved: false });
    expect(vi.mocked(db.delete)).toHaveBeenCalledTimes(1);
  });
});

describe("isListingSaved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when listing is saved", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      makeSelectMock([savedRow]) as unknown as ReturnType<typeof db.select>
    );
    const result = await isListingSaved("user-1", "listing-1");
    expect(result).toBe(true);
  });

  it("returns false when listing is not saved", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      makeSelectMock([]) as unknown as ReturnType<typeof db.select>
    );
    const result = await isListingSaved("user-1", "listing-1");
    expect(result).toBe(false);
  });
});

describe("getSavedListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns saved platform listings as NormalizedListing[]", async () => {
    // First select: savedListings rows
    vi.mocked(db.select)
      .mockReturnValueOnce(
        makeSelectMock([savedRow]) as unknown as ReturnType<typeof db.select>
      )
      // Second select: platform listing by id
      .mockReturnValueOnce(
        makeSelectMock([platformListingRow]) as unknown as ReturnType<typeof db.select>
      )
      // Third select: MLS listings (empty for this case)
      .mockReturnValueOnce(
        makeSelectMock([]) as unknown as ReturnType<typeof db.select>
      );

    const results = await getSavedListings("user-1");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("listing-1");
    expect(results[0].source).toBe("platform");
    expect(results[0].city).toBe("Austin");
  });

  it("returns empty array when user has no saved listings", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      makeSelectMock([]) as unknown as ReturnType<typeof db.select>
    );
    const results = await getSavedListings("user-1");
    expect(results).toEqual([]);
  });
});

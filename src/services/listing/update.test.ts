import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ─── Mocks (must be hoisted before imports) ───────────────────────────────────

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { updateListing, updateListingStatus } from "./update";
import { db } from "@/db";
import { revalidateTag } from "next/cache";

// ─── Test Data ────────────────────────────────────────────────────────────────

const baseListing = {
  id: "listing-001",
  userId: "user-abc",
  streetAddress: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  propertyType: "single_family" as const,
  price: 35000000,
  bedrooms: 3,
  bathrooms: "2.0",
  sqft: 1800,
  lotSizeSqft: 6000,
  yearBuilt: 2010,
  description: null,
  descriptionStatus: "pending",
  status: "draft" as const,
  photoOrder: [] as string[],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  publishedAt: null as Date | null,
};

// ─── updateListing ────────────────────────────────────────────────────────────

describe("updateListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupDbMocks(existingListing = baseListing, updated = existingListing) {
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([existingListing]),
    };
    (db.select as Mock).mockReturnValue(mockSelect);

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updated]),
    };
    (db.update as Mock).mockReturnValue(mockUpdate);

    return { mockSelect, mockUpdate };
  }

  it("updates listing with valid partial data and returns updated listing", async () => {
    const updatedListing = { ...baseListing, price: 40000000 };
    const { mockUpdate } = setupDbMocks(baseListing, updatedListing);

    const result = await updateListing("listing-001", "user-abc", {
      price: 40000000,
    });

    expect(db.update).toHaveBeenCalledOnce();
    expect(mockUpdate.set).toHaveBeenCalledOnce();
    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.price).toBe(40000000);
    expect(result).toEqual(updatedListing);
  });

  it("revalidates cache tag 'listings' after update", async () => {
    setupDbMocks();

    await updateListing("listing-001", "user-abc", { price: 40000000 });

    expect(revalidateTag).toHaveBeenCalledWith("listings", "default");
  });

  it("throws an error if listing does not belong to the user", async () => {
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ ...baseListing, userId: "other-user" }]),
    };
    (db.select as Mock).mockReturnValue(mockSelect);

    await expect(
      updateListing("listing-001", "user-abc", { price: 40000000 })
    ).rejects.toThrow(/not found|forbidden|unauthorized/i);

    expect(db.update).not.toHaveBeenCalled();
  });

  it("throws an error if listing does not exist", async () => {
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (db.select as Mock).mockReturnValue(mockSelect);

    await expect(
      updateListing("listing-999", "user-abc", { price: 40000000 })
    ).rejects.toThrow(/not found|forbidden|unauthorized/i);
  });

  it("sets descriptionStatus to 'edited' when description field is updated", async () => {
    const { mockUpdate } = setupDbMocks();

    await updateListing("listing-001", "user-abc", {
      description: "Updated description text",
    });

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.description).toBe("Updated description text");
    expect(setArgs.descriptionStatus).toBe("edited");
  });

  it("does not set descriptionStatus when description is not in update payload", async () => {
    const { mockUpdate } = setupDbMocks();

    await updateListing("listing-001", "user-abc", { price: 40000000 });

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.descriptionStatus).toBeUndefined();
  });
});

// ─── updateListingStatus ──────────────────────────────────────────────────────

describe("updateListingStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupDbMocksForStatus(
    existingStatus: string,
    updatedListing?: typeof baseListing
  ) {
    const existing = { ...baseListing, status: existingStatus as any };
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([existing]),
    };
    (db.select as Mock).mockReturnValue(mockSelect);

    const returnVal = updatedListing ?? existing;
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([returnVal]),
    };
    (db.update as Mock).mockReturnValue(mockUpdate);

    return { mockSelect, mockUpdate };
  }

  it("transitions draft -> active and sets publishedAt timestamp", async () => {
    const { mockUpdate } = setupDbMocksForStatus("draft");

    await updateListingStatus("listing-001", "user-abc", "active");

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.status).toBe("active");
    expect(setArgs.publishedAt).toBeInstanceOf(Date);
  });

  it("transitions active -> pending successfully", async () => {
    const { mockUpdate } = setupDbMocksForStatus("active");

    await updateListingStatus("listing-001", "user-abc", "pending");

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.status).toBe("pending");
  });

  it("transitions active -> sold successfully", async () => {
    const { mockUpdate } = setupDbMocksForStatus("active");

    await updateListingStatus("listing-001", "user-abc", "sold");

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.status).toBe("sold");
  });

  it("transitions pending -> active successfully", async () => {
    const { mockUpdate } = setupDbMocksForStatus("pending");

    await updateListingStatus("listing-001", "user-abc", "active");

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.status).toBe("active");
  });

  it("transitions pending -> sold successfully", async () => {
    const { mockUpdate } = setupDbMocksForStatus("pending");

    await updateListingStatus("listing-001", "user-abc", "sold");

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.status).toBe("sold");
  });

  it("rejects sold -> active transition (sold is terminal)", async () => {
    setupDbMocksForStatus("sold");

    await expect(
      updateListingStatus("listing-001", "user-abc", "active")
    ).rejects.toThrow(/invalid.*transition|sold.*terminal|cannot.*reactivate/i);

    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects sold -> pending transition (sold is terminal)", async () => {
    setupDbMocksForStatus("sold");

    await expect(
      updateListingStatus("listing-001", "user-abc", "pending")
    ).rejects.toThrow(/invalid.*transition|sold.*terminal|cannot.*reactivate/i);

    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects sold -> draft transition (sold is terminal)", async () => {
    setupDbMocksForStatus("sold");

    await expect(
      updateListingStatus("listing-001", "user-abc", "draft")
    ).rejects.toThrow(/invalid.*transition|sold.*terminal|cannot.*reactivate/i);

    expect(db.update).not.toHaveBeenCalled();
  });

  it("revalidates cache tag 'listings' after status update", async () => {
    setupDbMocksForStatus("draft");

    await updateListingStatus("listing-001", "user-abc", "active");

    expect(revalidateTag).toHaveBeenCalledWith("listings", "default");
  });

  it("throws if listing not found or not owned by user", async () => {
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (db.select as Mock).mockReturnValue(mockSelect);

    await expect(
      updateListingStatus("listing-999", "user-abc", "active")
    ).rejects.toThrow(/not found|forbidden|unauthorized/i);
  });

  it("does not set publishedAt when transitioning from active to pending", async () => {
    const { mockUpdate } = setupDbMocksForStatus("active");

    await updateListingStatus("listing-001", "user-abc", "pending");

    const setArgs = mockUpdate.set.mock.calls[0][0];
    expect(setArgs.publishedAt).toBeUndefined();
  });
});

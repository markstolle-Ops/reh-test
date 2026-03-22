import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module before imports
vi.mock("@/db", () => ({
  db: {
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/db";
import { addPhotoToListing, removePhotoFromListing, reorderPhotos } from "./photos";

describe("addPhotoToListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends photo ID to photoOrder array", async () => {
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(mockUpdate as any);

    await addPhotoToListing("listing-123", "photo-abc");

    expect(db.update).toHaveBeenCalledOnce();
    expect(mockUpdate.set).toHaveBeenCalledOnce();
    expect(mockUpdate.where).toHaveBeenCalledOnce();
  });
});

describe("reorderPhotos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates photoOrder to the new order array", async () => {
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(mockUpdate as any);

    const newOrder = ["photo-c", "photo-a", "photo-b"];
    await reorderPhotos("listing-123", newOrder);

    expect(db.update).toHaveBeenCalledOnce();
    expect(mockUpdate.set).toHaveBeenCalledWith(expect.objectContaining({ photoOrder: newOrder }));
  });
});

describe("removePhotoFromListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes photo ID from photoOrder and deletes the photo row", async () => {
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    const mockDelete = {
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(mockUpdate as any);
    vi.mocked(db.delete).mockReturnValue(mockDelete as any);

    await removePhotoFromListing("listing-123", "photo-abc");

    expect(db.update).toHaveBeenCalledOnce();
    expect(db.delete).toHaveBeenCalledOnce();
  });
});

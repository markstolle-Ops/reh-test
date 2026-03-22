import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("./form-schema", () => ({
  getFormSchemaForState: vi.fn(() => ({
    state: "CA",
    formName: "California Transfer Disclosure Statement",
    version: "1.0",
    required: true,
    fields: JSON.stringify([]),
  })),
}));

import {
  createDisclosureForm,
  updateDisclosureForm,
  completeDisclosureForm,
  getDisclosureForm,
} from "./disclosure-form";
import { db } from "@/db";

describe("disclosure-form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDisclosureForm", () => {
    it("inserts a row with empty answers JSON linked to listingId", async () => {
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: "form-1",
            userId: "user-1",
            listingId: "listing-1",
            state: "CA",
            formSchemaId: "ca-tds-1.0",
            answers: "{}",
            status: "draft",
            completedAt: null,
            createdAt: new Date(),
          },
        ]),
      };
      vi.mocked(db.insert).mockReturnValue(mockInsert as never);

      const result = await createDisclosureForm("user-1", "listing-1", "CA");

      expect(db.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          listingId: "listing-1",
          state: "CA",
        })
      );
      expect(result).toMatchObject({
        id: "form-1",
        listingId: "listing-1",
      });
    });
  });

  describe("updateDisclosureForm", () => {
    it("updates answers for existing form with ownership check", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: "form-1",
            userId: "user-1",
            listingId: "listing-1",
            state: "CA",
            formSchemaId: "ca-tds-1.0",
            answers: JSON.stringify({ roof_age: "10" }),
            status: "draft",
            completedAt: null,
            createdAt: new Date(),
          },
        ]),
      };
      vi.mocked(db.update).mockReturnValue(mockUpdate as never);

      const result = await updateDisclosureForm("user-1", "form-1", {
        roof_age: "10",
      });

      expect(db.update).toHaveBeenCalled();
      expect(result).toMatchObject({ id: "form-1" });
    });
  });

  describe("completeDisclosureForm", () => {
    it("sets status to complete and completedAt timestamp", async () => {
      const now = new Date();
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: "form-1",
            userId: "user-1",
            listingId: "listing-1",
            state: "CA",
            formSchemaId: "ca-tds-1.0",
            answers: "{}",
            status: "complete",
            completedAt: now,
            createdAt: new Date(),
          },
        ]),
      };
      vi.mocked(db.update).mockReturnValue(mockUpdate as never);

      const result = await completeDisclosureForm("user-1", "form-1");

      expect(db.update).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "complete",
        })
      );
      expect(result).toMatchObject({ status: "complete" });
    });
  });

  describe("getDisclosureForm", () => {
    it("returns form with answers parsed from JSON", async () => {
      const answersObj = { roof_age: "10", foundation: "good" };
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: "form-1",
            userId: "user-1",
            listingId: "listing-1",
            state: "CA",
            formSchemaId: "ca-tds-1.0",
            answers: JSON.stringify(answersObj),
            status: "draft",
            completedAt: null,
            createdAt: new Date(),
          },
        ]),
      };
      vi.mocked(db.select).mockReturnValue(mockSelect as never);

      const result = await getDisclosureForm("form-1");

      expect(result).not.toBeNull();
      expect(result!.answers).toEqual(answersObj);
    });
  });
});

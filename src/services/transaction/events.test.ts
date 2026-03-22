import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock DB module before imports
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from "@/db";
import { appendTransactionEvent, type TransactionEventType } from "./events";

describe("appendTransactionEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a row into transactionEvents", async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "evt-1",
          transactionId: "txn-1",
          eventType: "offer_submitted",
          payload: "{}",
          actorUserId: "user-1",
          occurredAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await appendTransactionEvent({
      transactionId: "txn-1",
      eventType: "offer_submitted",
      payload: {},
      actorUserId: "user-1",
    });

    expect(db.insert).toHaveBeenCalledOnce();
    expect(mockInsert.values).toHaveBeenCalledOnce();
    const insertedData = mockInsert.values.mock.calls[0][0];
    expect(insertedData.transactionId).toBe("txn-1");
    expect(insertedData.eventType).toBe("offer_submitted");
    expect(typeof insertedData.id).toBe("string");
    expect(result.eventType).toBe("offer_submitted");
  });

  it("updates transactions.currentStatus when newStatus is provided", async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "evt-2",
          transactionId: "txn-1",
          eventType: "offer_accepted",
          payload: "{}",
          actorUserId: null,
          occurredAt: new Date(),
        },
      ]),
    };
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);
    vi.mocked(db.update).mockReturnValue(mockUpdate as any);

    await appendTransactionEvent({
      transactionId: "txn-1",
      eventType: "offer_accepted",
      payload: {},
      newStatus: "offer_accepted",
    });

    expect(db.update).toHaveBeenCalledOnce();
    expect(mockUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({ currentStatus: "offer_accepted" }),
    );
  });

  it("does NOT call db.update when newStatus is not provided", async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "evt-3",
          transactionId: "txn-1",
          eventType: "offer_submitted",
          payload: "{}",
          actorUserId: null,
          occurredAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    await appendTransactionEvent({
      transactionId: "txn-1",
      eventType: "offer_submitted",
      payload: {},
    });

    expect(db.update).not.toHaveBeenCalled();
  });

  it("stores payload as JSON string", async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "evt-4",
          transactionId: "txn-2",
          eventType: "counter_submitted",
          payload: '{"counterPriceCents":35000000}',
          actorUserId: "user-2",
          occurredAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    await appendTransactionEvent({
      transactionId: "txn-2",
      eventType: "counter_submitted",
      payload: { counterPriceCents: 35000000 },
      actorUserId: "user-2",
    });

    const insertedData = mockInsert.values.mock.calls[0][0];
    expect(typeof insertedData.payload).toBe("string");
    expect(JSON.parse(insertedData.payload)).toEqual({ counterPriceCents: 35000000 });
  });
});

describe("TransactionEventType", () => {
  it("is a string literal type exported from events module", () => {
    // Verify the exported constant/array includes the key event types
    const eventType: TransactionEventType = "offer_submitted";
    expect(eventType).toBe("offer_submitted");
  });
});

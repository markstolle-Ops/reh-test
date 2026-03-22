import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB module before imports — uses inline vi.fn() to avoid hoisting issues
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    query: {
      transactions: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("@/services/transaction/events", () => ({
  appendTransactionEvent: vi.fn(),
}));

import { setWireInstructions, getWireInstructions } from "./wire-instructions";
import { db } from "@/db";
import { appendTransactionEvent } from "@/services/transaction/events";

// ─── setWireInstructions ──────────────────────────────────────────────────────

describe("setWireInstructions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts wire instruction data into the DB", async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "wire-1",
          transactionId: "txn-1",
          bankName: "First National Bank",
          routingNumber: "021000021",
          accountNumber: "123456789",
          accountName: "Acme Title Co.",
          referenceNote: "Closing TXN-1",
          setByUserId: "user-seller",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await setWireInstructions({
      transactionId: "txn-1",
      bankName: "First National Bank",
      routingNumber: "021000021",
      accountNumber: "123456789",
      accountName: "Acme Title Co.",
      referenceNote: "Closing TXN-1",
      setByUserId: "user-seller",
    });

    expect(db.insert).toHaveBeenCalledOnce();
    expect(mockInsert.values).toHaveBeenCalledOnce();
    expect(mockInsert.onConflictDoUpdate).toHaveBeenCalledOnce();

    const insertedData = mockInsert.values.mock.calls[0][0];
    expect(insertedData.transactionId).toBe("txn-1");
    expect(insertedData.bankName).toBe("First National Bank");
    expect(insertedData.routingNumber).toBe("021000021");
    expect(insertedData.accountNumber).toBe("123456789");
    expect(result.bankName).toBe("First National Bank");
  });

  it("stores the setByUserId on the record", async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "wire-2",
          transactionId: "txn-2",
          bankName: "Chase",
          routingNumber: "021000089",
          accountNumber: "987654321",
          accountName: "Test Title",
          referenceNote: null,
          setByUserId: "user-title-agent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    await setWireInstructions({
      transactionId: "txn-2",
      bankName: "Chase",
      routingNumber: "021000089",
      accountNumber: "987654321",
      accountName: "Test Title",
      setByUserId: "user-title-agent",
    });

    const insertedData = mockInsert.values.mock.calls[0][0];
    expect(insertedData.setByUserId).toBe("user-title-agent");
  });
});

// ─── getWireInstructions ──────────────────────────────────────────────────────

describe("getWireInstructions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns wire instructions for a valid transaction when viewer is the buyer", async () => {
    // Mock transaction lookup — viewer is the buyer
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
      id: "txn-1",
      buyerUserId: "viewer-user",
      sellerUserId: "seller-user",
    } as any);

    // Mock wire instructions select
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          id: "wire-1",
          transactionId: "txn-1",
          bankName: "First National Bank",
          routingNumber: "021000021",
          accountNumber: "123456789",
          accountName: "Acme Title Co.",
          referenceNote: "Closing TXN-1",
          setByUserId: "user-seller",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.select).mockReturnValue(mockSelect as any);
    vi.mocked(appendTransactionEvent).mockResolvedValue({} as any);

    const result = await getWireInstructions("txn-1", "viewer-user");

    expect(result).not.toBeNull();
    expect(result?.bankName).toBe("First National Bank");
    expect(result?.routingNumber).toBe("021000021");
    expect(result?.accountNumber).toBe("123456789");
  });

  it("rejects seller access to wire instructions (buyer-only)", async () => {
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
      id: "txn-1",
      buyerUserId: "buyer-user",
      sellerUserId: "viewer-user",
    } as any);

    await expect(
      getWireInstructions("txn-1", "viewer-user")
    ).rejects.toThrow("Unauthorized: only the buyer can view wire instructions");
  });

  it("returns null when no wire instructions exist for the transaction", async () => {
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
      id: "txn-nonexistent",
      buyerUserId: "viewer-user",
      sellerUserId: "seller-user",
    } as any);

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(mockSelect as any);
    vi.mocked(appendTransactionEvent).mockResolvedValue({} as any);

    const result = await getWireInstructions("txn-nonexistent", "viewer-user");
    expect(result).toBeNull();
  });

  it("throws an error when the viewer is not a party to the transaction", async () => {
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
      id: "txn-1",
      buyerUserId: "buyer-user",
      sellerUserId: "seller-user",
    } as any);

    await expect(
      getWireInstructions("txn-1", "unauthorized-user")
    ).rejects.toThrow("Unauthorized");
  });

  it("throws an error when the transaction does not exist", async () => {
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue(undefined);

    await expect(
      getWireInstructions("txn-missing", "any-user")
    ).rejects.toThrow("Transaction not found");
  });

  it("logs wire_instructions_viewed event via appendTransactionEvent when data is fetched", async () => {
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
      id: "txn-1",
      buyerUserId: "viewer-user",
      sellerUserId: "seller-user",
    } as any);

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          id: "wire-1",
          transactionId: "txn-1",
          bankName: "Chase",
          routingNumber: "021000089",
          accountNumber: "999",
          accountName: "Title Co.",
          referenceNote: null,
          setByUserId: "user-title",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.select).mockReturnValue(mockSelect as any);
    vi.mocked(appendTransactionEvent).mockResolvedValue({} as any);

    await getWireInstructions("txn-1", "viewer-user");

    expect(appendTransactionEvent).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(appendTransactionEvent).mock.calls[0][0];
    expect(callArgs.transactionId).toBe("txn-1");
    expect(callArgs.eventType).toBe("wire_instructions_viewed");
    expect(callArgs.actorUserId).toBe("viewer-user");
  });

  it("does NOT log an event when wire instructions are not found", async () => {
    vi.mocked(db.query.transactions.findFirst).mockResolvedValue({
      id: "txn-1",
      buyerUserId: "viewer-user",
      sellerUserId: "seller-user",
    } as any);

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(mockSelect as any);

    await getWireInstructions("txn-1", "viewer-user");

    expect(appendTransactionEvent).not.toHaveBeenCalled();
  });
});

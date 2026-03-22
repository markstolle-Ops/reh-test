/**
 * Tests for cfpbDisclosureMonitorRaw
 *
 * Tests the CFPB 3-day closing disclosure compliance monitor.
 * Checks whether the closing_disclosure_sent event was received;
 * alerts when missing and past mustSendBy. Skips cash transactions.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── DB mock ──────────────────────────────────────────────────────────────────
const mockSelectFn = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(mockSelectFn())),
      })),
    })),
  },
}));

vi.mock("@/db/schema", () => ({
  transactionEvents: { transactionEvents: "transactionEvents" },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { cfpbDisclosureMonitorRaw } from "./cfpb-disclosure-monitor";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("cfpbDisclosureMonitorRaw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns alert=false and skips TRID enforcement for cash transactions", async () => {
    const result = await cfpbDisclosureMonitorRaw({
      transactionId: "txn-cash",
      closingDate: new Date("2025-06-30"),
      loanType: "cash",
      today: new Date("2025-06-24"),
    });

    expect(result.alert).toBe(false);
    expect(result.reason).toBe("cash_transaction_skipped");
    // Should not touch the DB for cash
    const { db } = await import("@/db");
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns alert=false when closing_disclosure_sent event exists", async () => {
    // Event exists — disclosure was sent
    mockSelectFn.mockReturnValue([
      {
        id: "evt-001",
        eventType: "closing_disclosure_sent",
        occurredAt: new Date("2025-06-20"),
      },
    ]);

    const result = await cfpbDisclosureMonitorRaw({
      transactionId: "txn-mortgage-ok",
      closingDate: new Date("2025-06-30"),
      loanType: "conventional",
      today: new Date("2025-06-25"),
    });

    expect(result.alert).toBe(false);
    expect(result.reason).toBe("disclosure_sent");
  });

  it("returns alert=true when closing_disclosure_sent missing and today is past mustSendBy", async () => {
    // No event found — disclosure was NOT sent
    mockSelectFn.mockReturnValue([]);

    // closingDate = 2025-06-30, mustSendBy = 6 bdays before = 2025-06-20 (approx)
    // today = 2025-06-22 which is past mustSendBy
    const result = await cfpbDisclosureMonitorRaw({
      transactionId: "txn-overdue",
      closingDate: new Date("2025-06-30"),
      loanType: "conventional",
      today: new Date("2025-06-22"),
    });

    expect(result.alert).toBe(true);
    expect(result.reason).toBe("disclosure_overdue");
  });

  it("returns alert=false when disclosure missing but still before mustSendBy", async () => {
    // No event, but today is still before the mustSendBy deadline
    mockSelectFn.mockReturnValue([]);

    // closingDate = 2025-06-30, mustSendBy = 2025-06-20 (approx)
    // today = 2025-06-10 — still early, no alert
    const result = await cfpbDisclosureMonitorRaw({
      transactionId: "txn-early",
      closingDate: new Date("2025-06-30"),
      loanType: "conventional",
      today: new Date("2025-06-10"),
    });

    expect(result.alert).toBe(false);
    expect(result.reason).toBe("within_deadline");
  });

  it("applies TRID enforcement to non-cash loan types (conventional, fha, va, usda)", async () => {
    mockSelectFn.mockReturnValue([]);

    const loanTypes = ["conventional", "fha", "va", "usda"] as const;

    for (const loanType of loanTypes) {
      mockSelectFn.mockReturnValue([]);
      const result = await cfpbDisclosureMonitorRaw({
        transactionId: `txn-${loanType}`,
        closingDate: new Date("2025-06-30"),
        loanType,
        today: new Date("2025-06-22"),
      });
      // All non-cash types should check compliance
      expect(result.reason).not.toBe("cash_transaction_skipped");
    }
  });
});

/**
 * Tests for trackTransactionDeadlinesRaw
 *
 * Tests the raw (non-Inngest-wrapped) function that inserts deadline rows
 * from state workflow config steps into the transactionDeadlines table.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── DB mock ──────────────────────────────────────────────────────────────────
// NOTE: vi.mock factory must use vi.fn() inline (not outer variables) due to
// Vitest hoisting — outer variables are not yet initialized when the factory
// runs. See STATE.md decision from Phase 03.

// We capture the values mock via a module-level variable and set it up
// per-test using vi.mocked after import.

vi.mock("@/db", () => {
  const valuesMock = vi.fn().mockResolvedValue([]);
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  return {
    db: { insert: insertMock },
    // Expose mocks on the module for test access
    __insertMock: insertMock,
    __valuesMock: valuesMock,
  };
});

vi.mock("@/db/schema", () => ({
  transactionDeadlines: { transactionDeadlines: "transactionDeadlines" },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { trackTransactionDeadlinesRaw } from "./track-transaction-deadlines";

// Get the mock references after import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbModule: any;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const offerAcceptedDate = new Date("2025-01-01T00:00:00Z");

const minimalConfig = {
  stateCode: "CA",
  stateName: "California",
  closingType: "title-company" as const,
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: false,
  partnerBrokerRequired: false,
  legalRequirementsSummary: "Title company state.",
  steps: [
    {
      id: "offer_submitted",
      label: "Offer Submitted",
      requiredDocuments: ["purchase_agreement"],
    },
    {
      id: "inspection_period",
      label: "Inspection Period",
      requiredDocuments: ["inspection_report"],
      deadlineDays: 10,
      deadlineType: "inspection" as const,
    },
    {
      id: "financing_period",
      label: "Financing Contingency",
      requiredDocuments: [],
      deadlineDays: 21,
      deadlineType: "financing" as const,
    },
    {
      id: "closed",
      label: "Closed",
      requiredDocuments: ["signed_deed"],
      deadlineDays: 30,
      deadlineType: "closing" as const,
    },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("trackTransactionDeadlinesRaw", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    dbModule = await import("@/db");
    // Reset values mock to resolve to []
    dbModule.__valuesMock.mockResolvedValue([]);
    // Reset insert to return fresh values mock
    dbModule.__insertMock.mockImplementation(() => ({
      values: dbModule.__valuesMock,
    }));
  });

  it("inserts a deadline row for each step with deadlineDays", async () => {
    const result = await trackTransactionDeadlinesRaw({
      transactionId: "txn-001",
      config: minimalConfig,
      offerAcceptedDate,
    });

    // 3 steps have deadlineDays (inspection: 10, financing: 21, closed: 30)
    expect(result.inserted).toBe(3);
    expect(dbModule.__insertMock).toHaveBeenCalledTimes(3);
  });

  it("skips steps without deadlineDays", async () => {
    const configNoDeadlines = {
      ...minimalConfig,
      steps: [
        {
          id: "offer_submitted",
          label: "Offer Submitted",
          requiredDocuments: [],
        },
        {
          id: "offer_accepted",
          label: "Offer Accepted",
          requiredDocuments: [],
        },
      ],
    };

    const result = await trackTransactionDeadlinesRaw({
      transactionId: "txn-002",
      config: configNoDeadlines,
      offerAcceptedDate,
    });

    expect(result.inserted).toBe(0);
    expect(dbModule.__insertMock).not.toHaveBeenCalled();
  });

  it("calculates dueAt as offerAcceptedDate + deadlineDays calendar days", async () => {
    await trackTransactionDeadlinesRaw({
      transactionId: "txn-003",
      config: minimalConfig,
      offerAcceptedDate,
    });

    // First deadline-bearing step: inspection_period, 10 days → 2025-01-11
    const firstCallArgs = dbModule.__valuesMock.mock.calls[0][0];
    const expectedInspectionDate = new Date("2025-01-11T00:00:00Z");
    expect(firstCallArgs.dueAt).toEqual(expectedInspectionDate);
  });

  it("uses step id as deadlineType when step has no deadlineType", async () => {
    const configWithIdOnly = {
      ...minimalConfig,
      steps: [
        {
          id: "custom_step",
          label: "Custom Step",
          requiredDocuments: [],
          deadlineDays: 5,
        },
      ],
    };

    await trackTransactionDeadlinesRaw({
      transactionId: "txn-004",
      config: configWithIdOnly as typeof minimalConfig,
      offerAcceptedDate,
    });

    const callArgs = dbModule.__valuesMock.mock.calls[0][0];
    expect(callArgs.deadlineType).toBe("custom_step");
  });

  it("uses deadlineType from step config when present", async () => {
    await trackTransactionDeadlinesRaw({
      transactionId: "txn-005",
      config: minimalConfig,
      offerAcceptedDate,
    });

    const firstCallArgs = dbModule.__valuesMock.mock.calls[0][0];
    expect(firstCallArgs.deadlineType).toBe("inspection");
  });

  it("passes transactionId to every inserted row", async () => {
    await trackTransactionDeadlinesRaw({
      transactionId: "txn-XYZ",
      config: minimalConfig,
      offerAcceptedDate,
    });

    for (const call of dbModule.__valuesMock.mock.calls) {
      expect(call[0].transactionId).toBe("txn-XYZ");
    }
  });
});

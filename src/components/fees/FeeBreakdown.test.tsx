/**
 * FeeBreakdown component tests.
 *
 * Since vitest is configured with environment: "node" and @testing-library/react is not
 * installed, these tests verify the underlying fee calculation logic used by the component,
 * and the state-awareness of attorney fee and agent fee display logic.
 *
 * The component-level rendering behavior is covered by the service tests and
 * end-to-end tests (Playwright).
 */
import { describe, it, expect } from "vitest";
import { calculateTransactionFees } from "@/services/fees/transaction-fees";
import {
  shouldShowAttorneyFee,
  shouldShowAgentForHireFee,
  formatCents,
} from "./FeeBreakdown";

describe("FeeBreakdown display logic", () => {
  it("shows attorney fee for GA listing (attorney-required)", () => {
    const fees = calculateTransactionFees(30000000, "GA");
    expect(shouldShowAttorneyFee(fees)).toBe(true);
  });

  it("hides attorney fee for CA listing (title-company state)", () => {
    const fees = calculateTransactionFees(50000000, "CA");
    expect(shouldShowAttorneyFee(fees)).toBe(false);
  });

  it("shows attorney fee for NY listing (customary-attorney)", () => {
    const fees = calculateTransactionFees(30000000, "NY");
    expect(shouldShowAttorneyFee(fees)).toBe(true);
  });

  it("shows agent-for-hire fee for GA listing (attorney-required)", () => {
    const fees = calculateTransactionFees(30000000, "GA");
    expect(shouldShowAgentForHireFee(fees)).toBe(true);
  });

  it("shows agent-for-hire fee for NC listing (attorney-required)", () => {
    const fees = calculateTransactionFees(30000000, "NC");
    expect(shouldShowAgentForHireFee(fees)).toBe(true);
  });

  it("shows agent-for-hire fee for NY listing (customary-attorney)", () => {
    const fees = calculateTransactionFees(30000000, "NY");
    expect(shouldShowAgentForHireFee(fees)).toBe(true);
  });

  it("shows agent-for-hire fee for IL listing (customary-attorney)", () => {
    const fees = calculateTransactionFees(30000000, "IL");
    expect(shouldShowAgentForHireFee(fees)).toBe(true);
  });

  it("hides agent-for-hire fee for CA listing (title-company state)", () => {
    const fees = calculateTransactionFees(50000000, "CA");
    expect(shouldShowAgentForHireFee(fees)).toBe(false);
  });

  it("hides agent-for-hire fee for TX listing (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "TX");
    expect(shouldShowAgentForHireFee(fees)).toBe(false);
  });

  it("hides agent-for-hire fee for FL listing (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "FL");
    expect(shouldShowAgentForHireFee(fees)).toBe(false);
  });

  it("agent-for-hire fee is $500 for GA", () => {
    const fees = calculateTransactionFees(30000000, "GA");
    expect(fees.agentForHireFee).toBe(50000); // $500 in cents
  });

  it("savings equals traditionalCommission minus totalFees", () => {
    const fees = calculateTransactionFees(50000000, "CA");
    expect(fees.savings).toBe(fees.traditionalCommission - fees.totalFees);
  });

  it("formatCents converts cents to dollar string with $ prefix", () => {
    expect(formatCents(250000)).toBe("$2,500.00");
    expect(formatCents(29900)).toBe("$299.00");
    expect(formatCents(150000)).toBe("$1,500.00");
    expect(formatCents(2500)).toBe("$25.00");
    expect(formatCents(50000)).toBe("$500.00");
  });

  it("formatCents handles zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });
});

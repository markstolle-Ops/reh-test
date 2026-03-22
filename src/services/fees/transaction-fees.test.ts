import { describe, expect, it } from "vitest";
import { calculateTransactionFees } from "./transaction-fees";

// CA: title-company state — no attorney fee, no agent fee
// GA: attorney-required state — attorney fee + agent fee applies
// NY: customary-attorney state — attorney fee + agent fee applies

const PLATFORM_FEE = 2500; // cents
const MLS_FEE = 29900; // cents
const ATTORNEY_FEE = 150000; // cents ($1,500)
const AGENT_FOR_HIRE_FEE = 50000; // cents ($500)

describe("calculateTransactionFees", () => {
  it("returns platformFee + titleFee for CA (title-company state), no attorneyFee, no agentFee", () => {
    // $500,000 home in CA
    const homePrice = 50000000; // cents
    const fees = calculateTransactionFees(homePrice, "CA");

    expect(fees.platformFee).toBe(PLATFORM_FEE);
    expect(fees.mlsSyndicationFee).toBe(MLS_FEE);
    expect(fees.attorneyFee).toBe(0);
    expect(fees.titleFee).toBeGreaterThan(0);
    expect(fees.agentForHireFee).toBe(0);
  });

  it("includes agentForHireFee of $500 for GA (attorney-required state)", () => {
    const homePrice = 30000000; // $300,000 in cents
    const fees = calculateTransactionFees(homePrice, "GA");

    expect(fees.agentForHireFee).toBe(AGENT_FOR_HIRE_FEE);
  });

  it("includes agentForHireFee of $500 for NC (attorney-required state)", () => {
    const homePrice = 30000000; // $300,000 in cents
    const fees = calculateTransactionFees(homePrice, "NC");

    expect(fees.agentForHireFee).toBe(AGENT_FOR_HIRE_FEE);
  });

  it("includes agentForHireFee of $500 for NY (customary-attorney state)", () => {
    const homePrice = 30000000; // $300,000 in cents
    const fees = calculateTransactionFees(homePrice, "NY");

    expect(fees.agentForHireFee).toBe(AGENT_FOR_HIRE_FEE);
  });

  it("includes agentForHireFee of $500 for IL (customary-attorney state)", () => {
    const homePrice = 30000000; // $300,000 in cents
    const fees = calculateTransactionFees(homePrice, "IL");

    expect(fees.agentForHireFee).toBe(AGENT_FOR_HIRE_FEE);
  });

  it("returns agentForHireFee of $0 for TX (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "TX");
    expect(fees.agentForHireFee).toBe(0);
  });

  it("returns agentForHireFee of $0 for FL (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "FL");
    expect(fees.agentForHireFee).toBe(0);
  });

  it("returns agentForHireFee of $0 for AZ (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "AZ");
    expect(fees.agentForHireFee).toBe(0);
  });

  it("returns agentForHireFee of $0 for OH (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "OH");
    expect(fees.agentForHireFee).toBe(0);
  });

  it("returns agentForHireFee of $0 for PA (title-company state)", () => {
    const fees = calculateTransactionFees(40000000, "PA");
    expect(fees.agentForHireFee).toBe(0);
  });

  it("includes attorneyFee of $1,500 for GA (attorney-required state)", () => {
    const homePrice = 30000000; // $300,000 in cents
    const fees = calculateTransactionFees(homePrice, "GA");

    expect(fees.attorneyFee).toBe(ATTORNEY_FEE);
    expect(fees.platformFee).toBe(PLATFORM_FEE);
  });

  it("includes attorneyFee of $1,500 for NY (customary-attorney state)", () => {
    const homePrice = 30000000; // $300,000 in cents
    const fees = calculateTransactionFees(homePrice, "NY");

    expect(fees.attorneyFee).toBe(ATTORNEY_FEE);
  });

  it("totalFees includes agentForHireFee for GA", () => {
    const fees = calculateTransactionFees(30000000, "GA");
    const expectedTotal =
      fees.platformFee +
      fees.titleFee +
      fees.attorneyFee +
      fees.agentForHireFee +
      fees.mlsSyndicationFee;
    expect(fees.totalFees).toBe(expectedTotal);
    // agentForHireFee is $500 for GA
    expect(fees.agentForHireFee).toBe(AGENT_FOR_HIRE_FEE);
  });

  it("totalFees is sum of all fee components for CA (no agent fee)", () => {
    const fees = calculateTransactionFees(30000000, "CA");
    const expectedTotal =
      fees.platformFee +
      fees.titleFee +
      fees.attorneyFee +
      fees.agentForHireFee +
      fees.mlsSyndicationFee;
    expect(fees.totalFees).toBe(expectedTotal);
  });

  it("traditionalCommission is homePrice * 5.5%", () => {
    const homePrice = 50000000; // $500,000 in cents
    const fees = calculateTransactionFees(homePrice, "CA");
    // 5.5% of $500,000 = $27,500 = 2750000 cents
    expect(fees.traditionalCommission).toBe(Math.round(homePrice * 0.055));
  });

  it("savings is traditionalCommission - totalFees", () => {
    const fees = calculateTransactionFees(50000000, "CA");
    expect(fees.savings).toBe(fees.traditionalCommission - fees.totalFees);
  });
});

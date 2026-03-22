import { describe, expect, it } from "vitest";
import { calculateSavings, estimateTitleFee } from "@/lib/calculator";
import { getStateInfo } from "@/lib/states";

describe("calculateSavings", () => {
  it("returns positive savings for CA at $400,000", () => {
    const result = calculateSavings(400000, "CA");
    expect(result.savings).toBeGreaterThan(0);
  });

  it("returns correct traditionalCommission for CA at $400,000 (5.5%)", () => {
    const result = calculateSavings(400000, "CA");
    expect(result.traditionalCommission).toBe(22000);
  });

  it("returns PLATFORM_FEE_PLACEHOLDER as platformFee for CA", () => {
    const result = calculateSavings(400000, "CA");
    expect(result.platformFee).toBe(2500);
  });

  it("returns zero attorneyFee for CA (title-company state)", () => {
    const result = calculateSavings(400000, "CA");
    expect(result.attorneyFee).toBe(0);
  });

  it("returns $1,500 attorneyFee for GA (attorney-required state)", () => {
    const result = calculateSavings(400000, "GA");
    expect(result.attorneyFee).toBe(1500);
  });

  it("returns $1,500 attorneyFee for NY (customary-attorney state)", () => {
    const result = calculateSavings(400000, "NY");
    expect(result.attorneyFee).toBe(1500);
  });

  it("returns all zeros for $0 home price (edge case)", () => {
    const result = calculateSavings(0, "CA");
    expect(result.homePrice).toBe(0);
    expect(result.traditionalCommission).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.titleFee).toBe(0);
    expect(result.attorneyFee).toBe(0);
    expect(result.totalWithPlatform).toBe(0);
    expect(result.totalWithAgent).toBe(0);
    expect(result.savings).toBe(0);
  });

  it("returns savings proportional to home price for TX at $1,000,000", () => {
    const result400k = calculateSavings(400000, "TX");
    const result1m = calculateSavings(1000000, "TX");
    // At 2.5x the price, savings should be larger (roughly proportional)
    expect(result1m.savings).toBeGreaterThan(result400k.savings);
  });

  it("returns correct state in breakdown", () => {
    const result = calculateSavings(400000, "FL");
    expect(result.state).toBe("FL");
  });

  it("totalWithAgent equals traditionalCommission + titleFee + attorneyFee", () => {
    const result = calculateSavings(400000, "GA");
    expect(result.totalWithAgent).toBe(
      result.traditionalCommission + result.titleFee + result.attorneyFee,
    );
  });

  it("totalWithPlatform equals platformFee + titleFee + attorneyFee", () => {
    const result = calculateSavings(400000, "GA");
    expect(result.totalWithPlatform).toBe(
      result.platformFee + result.titleFee + result.attorneyFee,
    );
  });

  it("savings equals totalWithAgent minus totalWithPlatform", () => {
    const result = calculateSavings(400000, "CA");
    expect(result.savings).toBe(result.totalWithAgent - result.totalWithPlatform);
  });
});

describe("estimateTitleFee", () => {
  it("returns a positive number for CA at $400,000", () => {
    expect(estimateTitleFee(400000, "CA")).toBeGreaterThan(0);
  });

  it("returns a positive number for TX at $400,000", () => {
    expect(estimateTitleFee(400000, "TX")).toBeGreaterThan(0);
  });

  it("returns a positive number for NY at $400,000", () => {
    expect(estimateTitleFee(400000, "NY")).toBeGreaterThan(0);
  });

  it("returns zero for $0 home price", () => {
    expect(estimateTitleFee(0, "CA")).toBe(0);
  });
});

describe("getStateInfo", () => {
  it("returns correct info for CA", () => {
    const info = getStateInfo("CA");
    expect(info).toMatchObject({
      code: "CA",
      name: "California",
      closingType: "title-company",
    });
  });

  it("returns attorney-required closingType for GA", () => {
    const info = getStateInfo("GA");
    expect(info.closingType).toBe("attorney-required");
  });

  it("returns customary-attorney closingType for NY", () => {
    const info = getStateInfo("NY");
    expect(info.closingType).toBe("customary-attorney");
  });

  it("returns attorney-required for NC", () => {
    const info = getStateInfo("NC");
    expect(info.closingType).toBe("attorney-required");
  });

  it("returns title-company for TX", () => {
    const info = getStateInfo("TX");
    expect(info.closingType).toBe("title-company");
  });

  it("returns title-company for FL", () => {
    const info = getStateInfo("FL");
    expect(info.closingType).toBe("title-company");
  });
});

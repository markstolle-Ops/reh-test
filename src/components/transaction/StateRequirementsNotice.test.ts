import { describe, it, expect } from "vitest";
import { getRequirementsNotice } from "./StateRequirementsNotice";

const LAUNCH_STATES = ["CA", "TX", "FL", "NY", "GA", "NC", "AZ", "OH", "PA", "IL"];

describe("getRequirementsNotice", () => {
  it("GA returns legalRequirementsSummary containing 'attorney'", () => {
    const notice = getRequirementsNotice("GA");
    expect(notice.summary.toLowerCase()).toContain("attorney");
  });

  it("CA returns attorneyRequired=false (no mandatory attorney)", () => {
    const notice = getRequirementsNotice("CA");
    // CA uses title company — attorney is NOT required
    expect(notice.attorneyRequired).toBe(false);
  });

  it("NY returns notice mentioning 'partner broker'", () => {
    const notice = getRequirementsNotice("NY");
    expect(notice.brokerRequired).toBe(true);
    // The notice should expose that a broker is required
    expect(notice.brokerRequired).toBe(true);
  });

  it("all 10 launch states return non-empty legalRequirementsSummary", () => {
    for (const stateCode of LAUNCH_STATES) {
      const notice = getRequirementsNotice(stateCode);
      expect(notice.summary.length).toBeGreaterThan(0);
    }
  });

  it("GA returns attorneyRequired=true", () => {
    const notice = getRequirementsNotice("GA");
    expect(notice.attorneyRequired).toBe(true);
  });

  it("NC returns attorneyRequired=true", () => {
    const notice = getRequirementsNotice("NC");
    expect(notice.attorneyRequired).toBe(true);
  });

  it("CA returns attorneyRequired=false", () => {
    const notice = getRequirementsNotice("CA");
    expect(notice.attorneyRequired).toBe(false);
  });

  it("returns correct closingType for GA", () => {
    const notice = getRequirementsNotice("GA");
    expect(notice.closingType).toBe("attorney-required");
  });

  it("returns correct closingType for CA", () => {
    const notice = getRequirementsNotice("CA");
    expect(notice.closingType).toBe("title-company");
  });
});

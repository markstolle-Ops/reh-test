import { describe, it, expect } from "vitest";
import {
  PLATFORM_FEE_PLACEHOLDER,
  LAUNCH_STATES,
  ATTORNEY_STATES,
  CUSTOMARY_ATTORNEY_STATES,
  COMMISSION_RATE_DEFAULT,
} from "@/lib/constants";

describe("constants", () => {
  it("exports PLATFORM_FEE_PLACEHOLDER as 2500", () => {
    expect(PLATFORM_FEE_PLACEHOLDER).toBe(2500);
  });

  it("exports LAUNCH_STATES with 10 states", () => {
    expect(LAUNCH_STATES).toHaveLength(10);
    expect(LAUNCH_STATES).toContain("CA");
    expect(LAUNCH_STATES).toContain("TX");
    expect(LAUNCH_STATES).toContain("FL");
  });

  it("exports ATTORNEY_STATES with GA and NC", () => {
    expect(ATTORNEY_STATES).toContain("GA");
    expect(ATTORNEY_STATES).toContain("NC");
  });

  it("exports CUSTOMARY_ATTORNEY_STATES with NY and IL", () => {
    expect(CUSTOMARY_ATTORNEY_STATES).toContain("NY");
    expect(CUSTOMARY_ATTORNEY_STATES).toContain("IL");
  });

  it("exports COMMISSION_RATE_DEFAULT as 0.055", () => {
    expect(COMMISSION_RATE_DEFAULT).toBe(0.055);
  });
});

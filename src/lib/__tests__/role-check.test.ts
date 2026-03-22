import { describe, expect, it } from "vitest";
import { getUserDashboardPath, isValidRole } from "@/lib/role-check";

describe("getUserDashboardPath", () => {
  it('returns /buyer/dashboard for "buyer"', () => {
    expect(getUserDashboardPath("buyer")).toBe("/buyer/dashboard");
  });

  it('returns /seller/dashboard for "seller"', () => {
    expect(getUserDashboardPath("seller")).toBe("/seller/dashboard");
  });

  it("returns /onboarding for undefined", () => {
    expect(getUserDashboardPath(undefined)).toBe("/onboarding");
  });

  it('returns /onboarding for unknown role "admin"', () => {
    expect(getUserDashboardPath("admin")).toBe("/onboarding");
  });
});

describe("isValidRole", () => {
  it('returns true for "buyer"', () => {
    expect(isValidRole("buyer")).toBe(true);
  });

  it('returns true for "seller"', () => {
    expect(isValidRole("seller")).toBe(true);
  });

  it('returns false for "admin"', () => {
    expect(isValidRole("admin")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidRole(undefined)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  calculateClosingDisclosureDeadline,
} from "./deadlines";

// Business day helper: Monday–Friday only
// A closing on Friday (5 days ahead) minus 3 business days = Tuesday
describe("calculateClosingDisclosureDeadline", () => {
  it("returns mustReceiveBy as 3 business days before closing", () => {
    // Wednesday 2025-01-15 closing
    // -1 bday = Tuesday 2025-01-14
    // -2 bday = Monday 2025-01-13
    // -3 bday = Friday 2025-01-10
    const closing = new Date("2025-01-15T12:00:00Z");
    const result = calculateClosingDisclosureDeadline(closing);
    // mustReceiveBy should be Friday 2025-01-10 (3 business days before Wednesday)
    expect(result.mustReceiveBy.getUTCDay()).not.toBe(0); // not Sunday
    expect(result.mustReceiveBy.getUTCDay()).not.toBe(6); // not Saturday
    // 3 business days before Wednesday Jan 15 = Friday Jan 10
    expect(result.mustReceiveBy.toISOString().startsWith("2025-01-10")).toBe(true);
  });

  it("returns mustSendBy as 6 business days before closing", () => {
    // Wednesday 2025-01-15 closing
    // -6 bdays = Tuesday 2025-01-07
    const closing = new Date("2025-01-15T12:00:00Z");
    const result = calculateClosingDisclosureDeadline(closing);
    expect(result.mustSendBy.toISOString().startsWith("2025-01-07")).toBe(true);
  });

  it("skips weekends when counting backwards", () => {
    // Monday 2025-01-20 closing
    // -1 bday = Friday 2025-01-17
    // -2 bday = Thursday 2025-01-16
    // -3 bday = Wednesday 2025-01-15
    const closing = new Date("2025-01-20T12:00:00Z"); // Monday
    const result = calculateClosingDisclosureDeadline(closing);
    expect(result.mustReceiveBy.toISOString().startsWith("2025-01-15")).toBe(true);
  });

  it("isAtRisk returns true when today is past mustSendBy", () => {
    const closing = new Date("2025-01-15T12:00:00Z");
    const result = calculateClosingDisclosureDeadline(closing);
    // A date well after mustSendBy
    const pastDue = new Date("2025-01-12T12:00:00Z"); // After Jan 7 mustSendBy
    expect(result.isAtRisk(pastDue)).toBe(true);
  });

  it("isAtRisk returns false when today is before mustSendBy", () => {
    const closing = new Date("2025-01-15T12:00:00Z");
    const result = calculateClosingDisclosureDeadline(closing);
    // A date before mustSendBy (Jan 7)
    const earlyDate = new Date("2025-01-05T12:00:00Z");
    expect(result.isAtRisk(earlyDate)).toBe(false);
  });

  it("mustSendBy is earlier than mustReceiveBy", () => {
    const closing = new Date("2025-06-20T12:00:00Z");
    const result = calculateClosingDisclosureDeadline(closing);
    expect(result.mustSendBy.getTime()).toBeLessThan(result.mustReceiveBy.getTime());
  });

  it("mustReceiveBy is earlier than closingDate", () => {
    const closing = new Date("2025-06-20T12:00:00Z");
    const result = calculateClosingDisclosureDeadline(closing);
    expect(result.mustReceiveBy.getTime()).toBeLessThan(closing.getTime());
  });
});

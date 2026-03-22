import { describe, it, expect } from "vitest";
import { getHomeValueEstimate } from "./housecanary";

describe("getHomeValueEstimate", () => {
  const validAddress = {
    street: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
  };

  it("returns { estimatedValue, lowRange, highRange, confidence, provider } for a valid address", async () => {
    const result = await getHomeValueEstimate(validAddress);

    expect(result).not.toBeNull();
    if (!result) throw new Error("Expected non-null result");

    expect(typeof result.estimatedValue).toBe("number");
    expect(typeof result.lowRange).toBe("number");
    expect(typeof result.highRange).toBe("number");
    expect(typeof result.confidence).toBe("number");
    expect(typeof result.provider).toBe("string");

    // Sanity checks — realistic home value range
    expect(result.estimatedValue).toBeGreaterThan(50000);
    expect(result.estimatedValue).toBeLessThan(10000000);

    // Range should bracket the estimate
    expect(result.lowRange).toBeLessThanOrEqual(result.estimatedValue);
    expect(result.highRange).toBeGreaterThanOrEqual(result.estimatedValue);

    // Confidence should be between 0 and 1
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);

    // Provider attribution should be set
    expect(result.provider.length).toBeGreaterThan(0);
  });

  it("is deterministic — same address always returns same estimate", async () => {
    const result1 = await getHomeValueEstimate(validAddress);
    const result2 = await getHomeValueEstimate(validAddress);

    expect(result1).toEqual(result2);
  });

  it("returns different estimates for different zips", async () => {
    const address1 = { ...validAddress, zip: "78701" };
    const address2 = { ...validAddress, zip: "90210" };

    const result1 = await getHomeValueEstimate(address1);
    const result2 = await getHomeValueEstimate(address2);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    // Different zips should produce different estimates (deterministic hash differs)
    expect(result1?.estimatedValue).not.toBe(result2?.estimatedValue);
  });

  it("returns null for an unknown/invalid address (non-5-digit zip)", async () => {
    const invalidAddress = {
      street: "999 Unknown Ave",
      city: "Nowhere",
      state: "XX",
      zip: "ABCDE",
    };

    const result = await getHomeValueEstimate(invalidAddress);
    expect(result).toBeNull();
  });

  it("returns null for empty zip", async () => {
    const result = await getHomeValueEstimate({
      street: "1 Test St",
      city: "Test",
      state: "TX",
      zip: "",
    });
    expect(result).toBeNull();
  });
});

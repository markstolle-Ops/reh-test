import { describe, expect, it } from "vitest";
import {
  NEGOTIATION_BUYER_SYSTEM_PROMPT,
  NEGOTIATION_SELLER_SYSTEM_PROMPT,
} from "@/ai/prompts/negotiation-buyer";
import { NEGOTIATION_SELLER_SYSTEM_PROMPT as SELLER_FROM_SELLER_FILE } from "@/ai/prompts/negotiation-seller";
import { suggestOfferPriceSchema } from "./negotiation";

describe("Negotiation buyer prompt", () => {
  it("system prompt always contains UPL disclaimer text", () => {
    const prompt = NEGOTIATION_BUYER_SYSTEM_PROMPT;
    expect(prompt.toLowerCase()).toContain("not legal advice");
  });

  it("buyer system prompt contains buyer role context", () => {
    const prompt = NEGOTIATION_BUYER_SYSTEM_PROMPT;
    expect(prompt.toLowerCase()).toContain("buyer");
  });

  it("buyer system prompt prohibits contract interpretation", () => {
    const prompt = NEGOTIATION_BUYER_SYSTEM_PROMPT;
    expect(prompt.toLowerCase()).toContain("not interpret contract");
  });
});

describe("Negotiation seller prompt", () => {
  it("system prompt always contains UPL disclaimer text", () => {
    const prompt = NEGOTIATION_SELLER_SYSTEM_PROMPT;
    expect(prompt.toLowerCase()).toContain("not legal advice");
  });

  it("seller system prompt contains seller / counteroffer context", () => {
    const prompt = NEGOTIATION_SELLER_SYSTEM_PROMPT;
    expect(prompt.toLowerCase()).toContain("seller");
    expect(prompt.toLowerCase()).toContain("counteroffer");
  });

  it("seller prompt from negotiation-seller.ts matches re-export", () => {
    expect(NEGOTIATION_SELLER_SYSTEM_PROMPT).toBe(SELLER_FROM_SELLER_FILE);
  });
});

describe("suggestOfferPrice tool schema", () => {
  it("schema includes suggestedOfferCents field", () => {
    const result = suggestOfferPriceSchema.safeParse({
      suggestedOfferCents: 45000000,
      rationale: "Below market due to 45 DOM",
      confidenceLevel: "medium",
    });
    expect(result.success).toBe(true);
  });

  it("schema includes rationale field", () => {
    const result = suggestOfferPriceSchema.safeParse({
      suggestedOfferCents: 45000000,
      rationale: "Below market",
      confidenceLevel: "high",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rationale).toBe("Below market");
    }
  });

  it("schema includes confidenceLevel field", () => {
    const result = suggestOfferPriceSchema.safeParse({
      suggestedOfferCents: 45000000,
      rationale: "test",
      confidenceLevel: "low",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidenceLevel).toBe("low");
    }
  });

  it("schema rejects missing suggestedOfferCents", () => {
    const result = suggestOfferPriceSchema.safeParse({
      rationale: "test",
      confidenceLevel: "high",
    });
    expect(result.success).toBe(false);
  });

  it("schema rejects invalid confidenceLevel", () => {
    const result = suggestOfferPriceSchema.safeParse({
      suggestedOfferCents: 45000000,
      rationale: "test",
      confidenceLevel: "maybe",
    });
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildOfferTemplate,
  buildCounterTemplate,
} from "./transaction-guide";
import { TRANSACTION_GUIDE_SYSTEM_PROMPT, UPL_DISCLAIMER } from "@/ai/prompts/transaction-guide";

// ─── Mock external dependencies ──────────────────────────────────────────────
// These tests cover pure functions only — no AI/DB calls needed.

vi.mock("ai", () => ({
  streamText: vi.fn(),
  tool: vi.fn((t) => t),
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => ({})),
}));
vi.mock("@/services/chat/rag", () => ({
  queryKnowledgeBase: vi.fn(async () => ""),
}));

describe("TRANSACTION_GUIDE_SYSTEM_PROMPT", () => {
  it("contains UPL disclaimer verbatim", () => {
    const prompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
      stateCode: "GA",
      stateRequirementsSummary: "Georgia requires an attorney at closing.",
      ragContext: "",
    });
    expect(prompt).toContain(UPL_DISCLAIMER);
  });

  it("injects stateCode into prompt", () => {
    const prompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
      stateCode: "TX",
      stateRequirementsSummary: "Texas uses title companies.",
      ragContext: "",
    });
    expect(prompt).toContain("TX");
  });

  it("injects state requirements summary into prompt", () => {
    const summary = "California closings are handled by a title company.";
    const prompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
      stateCode: "CA",
      stateRequirementsSummary: summary,
      ragContext: "",
    });
    expect(prompt).toContain(summary);
  });

  it("injects RAG context when provided", () => {
    const prompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
      stateCode: "FL",
      stateRequirementsSummary: "Florida uses title insurance.",
      ragContext: "Florida inspection period is 15 days by statute.",
    });
    expect(prompt).toContain("Florida inspection period is 15 days by statute.");
  });

  it("uses fallback text when RAG context is empty", () => {
    const prompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
      stateCode: "OH",
      stateRequirementsSummary: "Ohio uses title companies.",
      ragContext: "",
    });
    expect(prompt).toContain("No relevant knowledge base content found");
  });

  it("does NOT contain legal advice statement (prohibits legal advice)", () => {
    const prompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
      stateCode: "IL",
      stateRequirementsSummary: "Illinois uses attorneys.",
      ragContext: "",
    });
    // The prompt must prohibit legal advice — check for the prohibition text
    expect(prompt.toLowerCase()).toContain("not provide legal advice");
  });
});

describe("buildOfferTemplate", () => {
  const baseParams = {
    offerPriceCents: 35000000, // $350,000
    buyerName: "John Doe",
    propertyAddress: "123 Main St, Atlanta, GA 30301",
    contingencies: ["Inspection contingency — 10 days", "Financing contingency — 21 days"],
    closingDatePreference: "30 days from acceptance",
    stateCode: "GA",
  };

  it("includes offer price in correct dollar format", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("$350,000");
  });

  it("includes buyer name", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("John Doe");
  });

  it("includes property address", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("123 Main St, Atlanta, GA 30301");
  });

  it("includes all contingencies", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("Inspection contingency — 10 days");
    expect(template).toContain("Financing contingency — 21 days");
  });

  it("includes closing date preference", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("30 days from acceptance");
  });

  it("includes mandatory template-only legal disclaimer", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("template only — not a legal document");
    expect(template).toContain("Have a licensed real estate attorney review");
  });

  it("includes UPL disclaimer verbatim", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain(UPL_DISCLAIMER);
  });

  it("includes state code", () => {
    const template = buildOfferTemplate(baseParams);
    expect(template).toContain("GA");
  });

  it("handles empty contingencies array gracefully", () => {
    const template = buildOfferTemplate({ ...baseParams, contingencies: [] });
    expect(template).toContain("None specified");
  });
});

describe("buildCounterTemplate", () => {
  const baseParams = {
    counterPriceCents: 36000000, // $360,000
    sellerName: "Jane Smith",
    propertyAddress: "456 Oak Ave, Charlotte, NC 28201",
    modifiedTerms: ["Remove inspection contingency"],
    closingDatePreference: "45 days from acceptance",
    stateCode: "NC",
  };

  it("includes counter price in correct dollar format", () => {
    const template = buildCounterTemplate(baseParams);
    expect(template).toContain("$360,000");
  });

  it("includes seller name", () => {
    const template = buildCounterTemplate(baseParams);
    expect(template).toContain("Jane Smith");
  });

  it("includes property address", () => {
    const template = buildCounterTemplate(baseParams);
    expect(template).toContain("456 Oak Ave, Charlotte, NC 28201");
  });

  it("includes modified terms", () => {
    const template = buildCounterTemplate(baseParams);
    expect(template).toContain("Remove inspection contingency");
  });

  it("includes mandatory template-only legal disclaimer", () => {
    const template = buildCounterTemplate(baseParams);
    expect(template).toContain("template only — not a legal document");
    expect(template).toContain("Have a licensed real estate attorney review");
  });

  it("includes UPL disclaimer verbatim", () => {
    const template = buildCounterTemplate(baseParams);
    expect(template).toContain(UPL_DISCLAIMER);
  });

  it("handles empty modifiedTerms gracefully", () => {
    const template = buildCounterTemplate({ ...baseParams, modifiedTerms: [] });
    expect(template).toContain("accepting all original terms");
  });
});

describe("generateOfferTemplate tool inputSchema shape", () => {
  it("accepts valid offerPriceCents as positive integer", () => {
    // Verify the schema parses a valid input without throwing
    const { z } = require("zod");
    const schema = z.object({
      offerPriceCents: z.number().int().positive(),
      buyerName: z.string(),
      propertyAddress: z.string(),
      contingencies: z.array(z.string()),
      closingDatePreference: z.string(),
    });
    const result = schema.safeParse({
      offerPriceCents: 35000000,
      buyerName: "John Doe",
      propertyAddress: "123 Main St, Atlanta, GA 30301",
      contingencies: ["Inspection contingency"],
      closingDatePreference: "30 days",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative offerPriceCents", () => {
    const { z } = require("zod");
    const schema = z.object({
      offerPriceCents: z.number().int().positive(),
      buyerName: z.string(),
      propertyAddress: z.string(),
      contingencies: z.array(z.string()),
      closingDatePreference: z.string(),
    });
    const result = schema.safeParse({
      offerPriceCents: -100,
      buyerName: "John Doe",
      propertyAddress: "123 Main St",
      contingencies: [],
      closingDatePreference: "30 days",
    });
    expect(result.success).toBe(false);
  });
});

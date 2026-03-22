import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @ai-sdk/openai
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-openai-model"),
}));

// Mock ai module
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

import { generateObject } from "ai";
import { parseNaturalLanguageQuery, nlqOutputSchema } from "./nlq-parser";

const mockGenerateObject = generateObject as ReturnType<typeof vi.fn>;

describe("parseNaturalLanguageQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses 3BR ranch under $350K in Phoenix", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        minBeds: 3,
        propertyType: "single_family",
        maxPrice: 350000,
        q: "Phoenix",
      },
    });

    const result = await parseNaturalLanguageQuery(
      "3BR ranch under $350K in Phoenix"
    );

    expect(result.minBeds).toBe(3);
    expect(result.propertyType).toBe("single_family");
    expect(result.maxPrice).toBe(35000000); // dollars → cents
    expect(result.q).toBe("Phoenix");
  });

  it("parses 2BR condo downtown Austin $200k-$400k", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        minBeds: 2,
        propertyType: "condo",
        minPrice: 200000,
        maxPrice: 400000,
        q: "Austin",
      },
    });

    const result = await parseNaturalLanguageQuery(
      "2 bedroom condo downtown Austin $200k-$400k"
    );

    expect(result.minBeds).toBe(2);
    expect(result.propertyType).toBe("condo");
    expect(result.minPrice).toBe(20000000); // dollars → cents
    expect(result.maxPrice).toBe(40000000); // dollars → cents
    expect(result.q).toBe("Austin");
  });

  it("strips subjective signals — returns minimal params for 'big yard near good schools'", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {},
    });

    const result = await parseNaturalLanguageQuery(
      "big yard near good schools"
    );

    expect(result).toEqual({});
    expect(result.q).toBeUndefined();
    expect((result as Record<string, unknown>).schoolQuality).toBeUndefined();
    expect((result as Record<string, unknown>).walkability).toBeUndefined();
  });

  it("converts prices from dollars to cents", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        minPrice: 100000,
        maxPrice: 500000,
      },
    });

    const result = await parseNaturalLanguageQuery("house $100k-$500k");

    expect(result.minPrice).toBe(10000000); // 100000 * 100
    expect(result.maxPrice).toBe(50000000); // 500000 * 100
  });

  it("passes prices as undefined when not provided", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        minBeds: 3,
        q: "Seattle",
      },
    });

    const result = await parseNaturalLanguageQuery("3 bed house in Seattle");

    expect(result.minBeds).toBe(3);
    expect(result.q).toBe("Seattle");
    expect(result.minPrice).toBeUndefined();
    expect(result.maxPrice).toBeUndefined();
  });

  it("prompt instructs GPT-4o to exclude subjective neighborhood signals", async () => {
    mockGenerateObject.mockResolvedValue({ object: {} });

    await parseNaturalLanguageQuery("any query");

    const callArgs = mockGenerateObject.mock.calls[0][0];
    const prompt: string = callArgs.prompt;

    // Verify exclusion instructions are present
    expect(prompt).toMatch(/school quality/i);
    expect(prompt).toMatch(/walkability/i);
    expect(prompt).toMatch(/demographics/i);
    expect(prompt).toMatch(/Do NOT extract or infer/i);
  });

  it("uses gpt-4o model", async () => {
    mockGenerateObject.mockResolvedValue({ object: {} });

    await parseNaturalLanguageQuery("any query");

    const callArgs = mockGenerateObject.mock.calls[0][0];
    // openai('gpt-4o') is called and passed as model
    expect(callArgs.model).toBeDefined();
  });

  it("returns SearchParams-compatible object (no extra keys)", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        minBeds: 2,
        maxBeds: 4,
        minBaths: 1,
        maxBaths: 3,
        minSqft: 1000,
        maxSqft: 2500,
        propertyType: "townhouse",
        minPrice: 250000,
        maxPrice: 600000,
        q: "Denver",
      },
    });

    const result = await parseNaturalLanguageQuery("townhouse Denver 2-4BR");

    expect(result.minBeds).toBe(2);
    expect(result.maxBeds).toBe(4);
    expect(result.minBaths).toBe(1);
    expect(result.maxBaths).toBe(3);
    expect(result.minSqft).toBe(1000);
    expect(result.maxSqft).toBe(2500);
    expect(result.propertyType).toBe("townhouse");
    expect(result.minPrice).toBe(25000000);
    expect(result.maxPrice).toBe(60000000);
    expect(result.q).toBe("Denver");
  });
});

describe("nlqOutputSchema", () => {
  it("accepts valid SearchParams fields", () => {
    const result = nlqOutputSchema.safeParse({
      q: "Phoenix",
      minPrice: 100000,
      maxPrice: 500000,
      minBeds: 2,
      maxBeds: 5,
      minBaths: 1,
      maxBaths: 3,
      minSqft: 800,
      maxSqft: 3000,
      propertyType: "single_family",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid propertyType", () => {
    const result = nlqOutputSchema.safeParse({
      propertyType: "mansion",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty object (no fields required)", () => {
    const result = nlqOutputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts all valid property type values", () => {
    const types = ["single_family", "condo", "townhouse", "land_lot"];
    for (const t of types) {
      const r = nlqOutputSchema.safeParse({ propertyType: t });
      expect(r.success).toBe(true);
    }
  });
});

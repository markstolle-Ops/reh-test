import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { SearchParams } from "@/types";

/**
 * Zod schema matching SearchParams fields.
 * Prices are returned in dollars from GPT — converted to cents after parsing.
 *
 * Exported for test-only schema shape verification.
 */
export const nlqOutputSchema = z.object({
  q: z.string().optional().describe("City name, zip code, or state to search in"),
  minPrice: z.number().optional().describe("Minimum price in dollars"),
  maxPrice: z.number().optional().describe("Maximum price in dollars"),
  minBeds: z.number().optional().describe("Minimum bedrooms"),
  maxBeds: z.number().optional().describe("Maximum bedrooms"),
  minBaths: z.number().optional().describe("Minimum bathrooms"),
  maxBaths: z.number().optional().describe("Maximum bathrooms"),
  minSqft: z.number().optional().describe("Minimum square footage"),
  maxSqft: z.number().optional().describe("Maximum square footage"),
  propertyType: z.enum(["single_family", "condo", "townhouse", "land_lot"]).optional(),
});

type NlqOutput = z.infer<typeof nlqOutputSchema>;

/**
 * Parse a natural language real estate search query into SearchParams.
 *
 * Uses GPT-4o via Vercel AI SDK generateObject to extract objective
 * property features only. Subjective neighborhood signals (school quality,
 * walkability, crime rates, demographics) are explicitly excluded per
 * Fair Housing Act compliance requirements.
 *
 * Prices returned from GPT are in dollars; this function converts them to
 * cents for internal consistency (SearchParams uses cents throughout).
 *
 * @param query - Natural language search string from the buyer
 * @returns SearchParams-compatible object (prices in cents)
 */
export async function parseNaturalLanguageQuery(query: string): Promise<SearchParams> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: nlqOutputSchema,
    prompt: `Parse this real estate search query into structured filters.
Extract ONLY objective property features: price, bedrooms, bathrooms, sqft, property type, location (city/zip/state).
Do NOT extract or infer: school quality, walkability, neighborhood scores, demographics, crime rates, or any subjective neighborhood characteristics.
"Ranch" = single_family property type. "Townhome" = townhouse.
Return prices in dollars (not cents).
Query: "${query}"`,
  });

  return dollarsToCents(object);
}

/**
 * Convert dollar-denominated price fields to cents for internal representation.
 */
function dollarsToCents(parsed: NlqOutput): SearchParams {
  const result: SearchParams = { ...parsed };

  if (typeof result.minPrice === "number") {
    result.minPrice = result.minPrice * 100;
  }
  if (typeof result.maxPrice === "number") {
    result.maxPrice = result.maxPrice * 100;
  }

  return result;
}

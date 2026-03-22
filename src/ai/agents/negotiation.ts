// ─── Negotiation AI Agent ─────────────────────────────────────────────────────
// Streaming negotiation guidance for buyers and sellers.
// Uses AI SDK v6 streamText() with inputSchema tool pattern.
// UPL disclaimer is embedded in every system prompt via role-specific prompts.

import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { NEGOTIATION_BUYER_SYSTEM_PROMPT } from "@/ai/prompts/negotiation-buyer";
import { NEGOTIATION_SELLER_SYSTEM_PROMPT } from "@/ai/prompts/negotiation-seller";
import type { Comp } from "@/services/negotiation/comps";
import { formatCompsForPrompt } from "@/services/negotiation/comps";

// ─── Tool Schema ──────────────────────────────────────────────────────────────

/**
 * Exported for testing — validates suggestOfferPrice tool output structure.
 */
export const suggestOfferPriceSchema = z.object({
  suggestedOfferCents: z
    .number()
    .int()
    .positive()
    .describe("Suggested offer or counteroffer price in cents"),
  rationale: z
    .string()
    .describe(
      "Data-driven rationale referencing comparable sales (not legal entitlements)"
    ),
  confidenceLevel: z
    .enum(["low", "medium", "high"])
    .describe(
      "Confidence level based on data quality and number of comps available"
    ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamNegotiationGuidanceArgs {
  comps: Comp[];
  listingPrice: number; // in cents
  daysOnMarket: number;
  userRole: "buyer" | "seller";
  userMessage: string;
}

// ─── streamNegotiationGuidance ────────────────────────────────────────────────

/**
 * Streams AI negotiation guidance with UPL-compliant system prompts.
 * Selects buyer or seller prompt variant based on userRole.
 * Injects comps context into system prompt as formatted text.
 *
 * Returns a StreamTextResult — call .toUIMessageStreamResponse() for Next.js route.
 */
export async function streamNegotiationGuidance({
  comps,
  listingPrice,
  daysOnMarket,
  userRole,
  userMessage,
}: StreamNegotiationGuidanceArgs) {
  const baseSystemPrompt =
    userRole === "buyer"
      ? NEGOTIATION_BUYER_SYSTEM_PROMPT
      : NEGOTIATION_SELLER_SYSTEM_PROMPT;

  const listingPriceFormatted = (listingPrice / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const compsContext = formatCompsForPrompt(comps);

  const systemPrompt = `${baseSystemPrompt}

---

LISTING CONTEXT:
- List price: ${listingPriceFormatted}
- Days on market: ${daysOnMarket}

${compsContext}`;

  return streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: {
      suggestOfferPrice: tool({
        description:
          "Suggest a data-driven offer or counteroffer price based on comparable sales. Returns structured JSON with price, rationale, and confidence level.",
        inputSchema: suggestOfferPriceSchema,
        execute: async ({
          suggestedOfferCents,
          rationale,
          confidenceLevel,
        }) => {
          return {
            suggestedOfferCents,
            rationale,
            confidenceLevel,
            disclaimer:
              "This is not legal advice. Consult a licensed real estate attorney before making any offer or counteroffer decision.",
          };
        },
      }),
    },
  });
}

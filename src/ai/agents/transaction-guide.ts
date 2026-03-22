/**
 * Transaction Guide AI Agent
 *
 * RAG-grounded state-law Q&A agent for real estate transaction guidance.
 * Provides offer/counteroffer template generation with strict UPL guardrails.
 *
 * LEGL-07: State-specific legal requirements shown before transaction starts
 * NEGO-03: AI guides buyer through offer/counteroffer process with templates
 */

import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { queryKnowledgeBase } from "@/services/chat/rag";
import { getStateWorkflowConfig } from "@/workflow/states";
import {
  TRANSACTION_GUIDE_SYSTEM_PROMPT,
  UPL_DISCLAIMER,
} from "@/ai/prompts/transaction-guide";
import { cacheWrap, buildCacheKey } from "@/lib/redis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamTransactionGuideArgs {
  /** Two-letter state code (e.g. "GA", "CA") */
  stateCode: string;
  /** Optional transaction ID for context-aware guidance */
  transactionId?: string;
  /** The user's message to the transaction guide */
  userMessage: string;
  /** The user's role in this transaction */
  userRole: "buyer" | "seller";
}

// ─── Offer Template Generator ─────────────────────────────────────────────────

/**
 * Generates a plain-text offer letter template.
 * NEGO-03 — includes mandatory legal disclaimer.
 */
export function buildOfferTemplate(params: {
  offerPriceCents: number;
  buyerName: string;
  propertyAddress: string;
  contingencies: string[];
  closingDatePreference: string;
  stateCode: string;
}): string {
  const price = (params.offerPriceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const contingencyList =
    params.contingencies.length > 0
      ? params.contingencies.map((c) => `  - ${c}`).join("\n")
      : "  - None specified";

  return `
REAL ESTATE PURCHASE OFFER — TEMPLATE ONLY
==========================================

Date: [DATE]

Property Address: ${params.propertyAddress}
State: ${params.stateCode}

Buyer: ${params.buyerName}

OFFER TERMS:
  Purchase Price: ${price}
  Proposed Closing Date: ${params.closingDatePreference}

CONTINGENCIES:
${contingencyList}

ADDITIONAL TERMS:
  [Add any additional terms here]

BUYER SIGNATURE: _____________________  Date: __________
SELLER ACCEPTANCE: ___________________  Date: __________

---
IMPORTANT LEGAL DISCLAIMER:
This is a template only — not a legal document. This template does not constitute legal advice or a binding contract. Have a licensed real estate attorney review before submitting.

${UPL_DISCLAIMER}
`.trim();
}

/**
 * Generates a plain-text counteroffer letter template.
 * NEGO-03 — includes mandatory legal disclaimer.
 */
export function buildCounterTemplate(params: {
  counterPriceCents: number;
  sellerName: string;
  propertyAddress: string;
  modifiedTerms: string[];
  closingDatePreference: string;
  stateCode: string;
}): string {
  const price = (params.counterPriceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const termsList =
    params.modifiedTerms.length > 0
      ? params.modifiedTerms.map((t) => `  - ${t}`).join("\n")
      : "  - None (accepting all original terms except price)";

  return `
REAL ESTATE COUNTEROFFER — TEMPLATE ONLY
=========================================

Date: [DATE]

Property Address: ${params.propertyAddress}
State: ${params.stateCode}

Seller: ${params.sellerName}

COUNTEROFFER TERMS:
  Counter Purchase Price: ${price}
  Proposed Closing Date: ${params.closingDatePreference}

MODIFIED TERMS:
${termsList}

SELLER SIGNATURE: ____________________  Date: __________
BUYER ACCEPTANCE: ____________________  Date: __________

---
IMPORTANT LEGAL DISCLAIMER:
This is a template only — not a legal document. This template does not constitute legal advice or a binding contract. Have a licensed real estate attorney review before submitting.

${UPL_DISCLAIMER}
`.trim();
}

// ─── streamTransactionGuide ───────────────────────────────────────────────────

/**
 * Streams transaction guidance for a user's question.
 * Uses pgvector RAG to ground responses in state-law knowledge base.
 * Model: gpt-4o (more capable than chatbot's gpt-4o-mini for legal context)
 */
export async function streamTransactionGuide({
  stateCode,
  transactionId: _transactionId,
  userMessage,
  userRole: _userRole,
}: StreamTransactionGuideArgs) {
  // 1. Get state-specific requirements from workflow config
  const stateConfig = getStateWorkflowConfig(stateCode);

  // 2. Query knowledge base with user message (RAG)
  // Cache RAG context for 10 minutes — state laws don't change mid-session.
  // Key: "rag:{stateCode}:{queryHash}" — scoped per state and query.
  const ragCacheKey = buildCacheKey(`rag:${stateCode}`, { q: userMessage });
  const ragContext = await cacheWrap(ragCacheKey, 600, () =>
    queryKnowledgeBase(userMessage, stateCode)
  );

  // 3. Build system prompt with state config and RAG context
  const systemPrompt = TRANSACTION_GUIDE_SYSTEM_PROMPT({
    stateCode,
    stateRequirementsSummary: stateConfig.legalRequirementsSummary,
    ragContext,
  });

  // 4. Stream with AI SDK v6
  return streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: {
      generateOfferTemplate: tool({
        description:
          "Generate a real estate offer letter template. Produces a formatted template string with a mandatory legal disclaimer. NOT a legal document.",
        inputSchema: z.object({
          offerPriceCents: z
            .number()
            .int()
            .positive()
            .describe("Offer price in cents (e.g. 35000000 for $350,000)"),
          buyerName: z.string().describe("Full name of the buyer"),
          propertyAddress: z
            .string()
            .describe("Full property address including city, state, zip"),
          contingencies: z
            .array(z.string())
            .describe(
              "List of contingencies (e.g. 'Inspection contingency — 10 days', 'Financing contingency — 21 days')"
            ),
          closingDatePreference: z
            .string()
            .describe(
              "Preferred closing date or timeline (e.g. '30 days from acceptance' or '2024-05-15')"
            ),
        }),
        execute: async ({
          offerPriceCents,
          buyerName,
          propertyAddress,
          contingencies,
          closingDatePreference,
        }: {
          offerPriceCents: number;
          buyerName: string;
          propertyAddress: string;
          contingencies: string[];
          closingDatePreference: string;
        }) => {
          return buildOfferTemplate({
            offerPriceCents,
            buyerName,
            propertyAddress,
            contingencies,
            closingDatePreference,
            stateCode,
          });
        },
      }),

      generateCounterTemplate: tool({
        description:
          "Generate a real estate counteroffer letter template. Produces a formatted template string with a mandatory legal disclaimer. NOT a legal document.",
        inputSchema: z.object({
          counterPriceCents: z
            .number()
            .int()
            .positive()
            .describe("Counter price in cents (e.g. 36000000 for $360,000)"),
          sellerName: z.string().describe("Full name of the seller"),
          propertyAddress: z
            .string()
            .describe("Full property address including city, state, zip"),
          modifiedTerms: z
            .array(z.string())
            .describe(
              "List of terms being modified from original offer (e.g. 'Remove inspection contingency', 'Closing date extended to 45 days')"
            ),
          closingDatePreference: z
            .string()
            .describe(
              "Preferred closing date or timeline in the counteroffer"
            ),
        }),
        execute: async ({
          counterPriceCents,
          sellerName,
          propertyAddress,
          modifiedTerms,
          closingDatePreference,
        }: {
          counterPriceCents: number;
          sellerName: string;
          propertyAddress: string;
          modifiedTerms: string[];
          closingDatePreference: string;
        }) => {
          return buildCounterTemplate({
            counterPriceCents,
            sellerName,
            propertyAddress,
            modifiedTerms,
            closingDatePreference,
            stateCode,
          });
        },
      }),
    },
  });
}

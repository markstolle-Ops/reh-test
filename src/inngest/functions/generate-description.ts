import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import {
  LISTING_DESCRIPTION_PROMPT,
  type ListingDescriptionDetails,
} from "@/ai/prompts/listing-description";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { inngest } from "@/inngest/client";

// ─── Event payload types ──────────────────────────────────────────────────────

interface GenerateDescriptionEventData {
  listingId: string;
  photoUrls: string[];
  details: ListingDescriptionDetails;
}

interface StepContext {
  event: { data: GenerateDescriptionEventData };
  step: {
    run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  };
}

// ─── Raw handler (exported for testing) ──────────────────────────────────────

/**
 * Core handler logic for generating an MLS-quality listing description.
 * Exported directly so unit tests can invoke it without the Inngest wrapper.
 *
 * Status lifecycle: pending → generating → ready
 */
export async function generateListingDescription({
  event,
  step,
}: StepContext): Promise<{ listingId: string; description: string }> {
  const { listingId, photoUrls, details } = event.data;

  // Step 1: Mark as generating
  await step.run("mark-generating", async () => {
    await db
      .update(listings)
      .set({ descriptionStatus: "generating" })
      .where(eq(listings.id, listingId));
  });

  // Step 2: Generate description text with GPT-4o vision
  const description = await step.run("generate-text", async () => {
    const promptText = LISTING_DESCRIPTION_PROMPT(details);

    // Build message content: text prompt + up to 5 photo images
    const imageUrls = photoUrls.slice(0, 5);
    const imageContent = imageUrls.map((url) => ({
      type: "image" as const,
      image: url,
    }));

    const result = await generateText({
      model: openai("gpt-4o"),
      maxOutputTokens: 800,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: promptText }, ...imageContent],
        },
      ],
    });

    return result.text;
  });

  // Step 3: Save description and mark ready
  await step.run("save-description", async () => {
    await db
      .update(listings)
      .set({ description, descriptionStatus: "ready" })
      .where(eq(listings.id, listingId));
  });

  return { listingId, description };
}

// ─── Inngest-registered function (used in /api/inngest/route.ts) ──────────────

/**
 * Inngest function wrapper for generateListingDescription.
 * Trigger: "listing/created" event fired in POST /api/listings.
 * Register this in the Inngest serve() functions array.
 */
export const generateListingDescriptionFn = inngest.createFunction(
  { id: "generate-listing-description", name: "Generate Listing Description" },
  { event: "listing/created" },
  generateListingDescription,
);

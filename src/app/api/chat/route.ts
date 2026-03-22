import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/db";
import { showingRequests } from "@/db/schema";
import { queryKnowledgeBase } from "@/services/chat/rag";
import { CHATBOT_SYSTEM_PROMPT } from "@/ai/prompts/chatbot-system";

// ─── POST /api/chat ────────────────────────────────────────────────────────────
// Accepts: { messages, listingId, listingState }
// Returns: streaming data response (Vercel AI SDK v6)
// Auth: not required for reading — showing scheduling checks for auth internally

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, listingId } = body;
  // Validate listingState to prevent prompt injection — must be 2-letter state code
  const rawState = typeof body.listingState === "string" ? body.listingState : "CA";
  const listingState = /^[A-Z]{2}$/.test(rawState) ? rawState : "CA";

  // Get auth state (may be null for unauthenticated users)
  const { userId } = await auth();

  // Extract last user message for RAG query
  const lastUserMessage = messages
    ?.filter((m: { role: string }) => m.role === "user")
    ?.at(-1)?.content as string | undefined;

  // Query knowledge base with last user message
  const ragContext = lastUserMessage
    ? await queryKnowledgeBase(lastUserMessage, listingState)
    : "";

  // Build system prompt with RAG context and state-specific guardrails
  const systemMessage = CHATBOT_SYSTEM_PROMPT({
    context: ragContext,
    listingState,
  });

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: systemMessage,
    messages,
    tools: {
      // AI SDK v6: uses `inputSchema` instead of `parameters`
      scheduleShowing: tool({
        description:
          "Schedule a property showing request. Requires the user to be logged in.",
        inputSchema: z.object({
          requestedDate: z
            .string()
            .describe("ISO 8601 date-time string for the requested showing"),
          notes: z
            .string()
            .optional()
            .describe("Optional notes or preferences for the showing"),
        }),
        execute: async ({
          requestedDate,
          notes,
        }: {
          requestedDate: string;
          notes?: string;
        }) => {
          // Auth check — showing scheduling requires authentication
          if (!userId) {
            return {
              success: false,
              error:
                "You must be logged in to schedule a showing. Please sign in and try again.",
            };
          }

          const showingId = crypto.randomUUID();

          await db.insert(showingRequests).values({
            id: showingId,
            listingId,
            buyerUserId: userId,
            requestedDate: new Date(requestedDate),
            notes: notes ?? null,
            status: "pending",
          });

          return {
            success: true,
            message:
              "Showing request submitted. The seller will confirm your requested date shortly.",
            showingId,
          };
        },
      }),
    },
  });

  // AI SDK v6: toUIMessageStreamResponse() replaces toDataStreamResponse()
  return result.toUIMessageStreamResponse();
}

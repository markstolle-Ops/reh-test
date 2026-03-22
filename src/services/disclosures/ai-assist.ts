import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Creates a streaming AI guidance session for a disclosure form field.
 *
 * IMPORTANT: Every system prompt includes a UPL disclaimer.
 * This is general informational guidance only — not legal advice.
 */
export async function createDisclosureAssistStream(
  state: string,
  formName: string,
  fieldContext: string,
  userMessage: string
) {
  const systemPrompt = `You are helping a user understand what information to provide in the ${formName} disclosure form for ${state}. Current field: ${fieldContext}. You are NOT providing legal advice. This is general informational guidance only. Always recommend consulting a licensed real estate attorney for legal guidance specific to your situation. Every response must include: 'This is not legal advice. Consult a licensed attorney.'`;

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return result.toUIMessageStreamResponse();
}

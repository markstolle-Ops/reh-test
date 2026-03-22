import { describe, expect, it } from "vitest";
import { CHATBOT_SYSTEM_PROMPT } from "./chatbot-system";

describe("CHATBOT_SYSTEM_PROMPT", () => {
  const baseArgs = {
    context: "Sample knowledge base content about California real estate",
    listingState: "CA",
  };

  it("output contains 'not legal advice' disclaimer text", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt.toLowerCase()).toContain("not");
    expect(prompt.toLowerCase()).toContain("legal advice");
  });

  it("output contains PROHIBITED section", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt).toContain("PROHIBITED");
  });

  it("output contains attorney referral instructions", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt.toLowerCase()).toContain("attorney");
  });

  it("output includes the RAG context parameter", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt).toContain("Sample knowledge base content about California real estate");
  });

  it("output includes the listing state", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt).toContain("CA");
  });

  it("output contains PERMITTED section", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt).toContain("PERMITTED");
  });

  it("mandatory disclaimer exact text appears in prompt", () => {
    const prompt = CHATBOT_SYSTEM_PROMPT(baseArgs);
    expect(prompt).toContain("general educational purposes only");
    expect(prompt).toContain("does not constitute legal advice");
  });
});

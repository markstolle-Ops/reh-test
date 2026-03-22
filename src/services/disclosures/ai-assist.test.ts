import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI SDK
vi.mock("ai", () => ({
  streamText: vi.fn().mockResolvedValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response()),
  }),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-model"),
}));

import { createDisclosureAssistStream } from "./ai-assist";
import { streamText } from "ai";

describe("ai-assist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls streamText with system prompt containing UPL disclaimer", async () => {
    await createDisclosureAssistStream(
      "CA",
      "California Transfer Disclosure Statement",
      "roof_age",
      "How do I fill in the roof age?"
    );

    expect(streamText).toHaveBeenCalled();
    const callArgs = vi.mocked(streamText).mock.calls[0][0];
    expect(callArgs.system).toContain("not legal advice");
    expect(callArgs.system).toContain("licensed attorney");
  });

  it("system prompt includes the state name", async () => {
    await createDisclosureAssistStream(
      "TX",
      "TREC Seller's Disclosure Notice",
      "foundation",
      "What does foundation condition mean?"
    );

    const callArgs = vi.mocked(streamText).mock.calls[0][0];
    expect(callArgs.system).toContain("TX");
  });

  it("system prompt includes form name context", async () => {
    await createDisclosureAssistStream(
      "FL",
      "Florida Seller's Disclosure",
      "sinkholes",
      "What should I say about sinkholes?"
    );

    const callArgs = vi.mocked(streamText).mock.calls[0][0];
    expect(callArgs.system).toContain("Florida Seller's Disclosure");
  });

  it("includes fieldContext in system prompt", async () => {
    await createDisclosureAssistStream(
      "CA",
      "California TDS",
      "lead_paint",
      "What about lead paint?"
    );

    const callArgs = vi.mocked(streamText).mock.calls[0][0];
    expect(callArgs.system).toContain("lead_paint");
  });

  it("every response includes UPL disclaimer text in system prompt", async () => {
    await createDisclosureAssistStream(
      "NY",
      "NY Property Condition Disclosure",
      "structural",
      "any question"
    );

    const callArgs = vi.mocked(streamText).mock.calls[0][0];
    expect(callArgs.system).toContain(
      "This is not legal advice. Consult a licensed attorney."
    );
  });
});

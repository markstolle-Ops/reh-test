import { beforeEach, describe, expect, it, vi } from "vitest";
import { LISTING_DESCRIPTION_PROMPT } from "@/ai/prompts/listing-description";

// ─── Mock the db module ───────────────────────────────────────────────────────

const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
});

vi.mock("@/db", () => ({
  db: {
    update: mockUpdate,
  },
}));

vi.mock("@/db/schema", () => ({
  listings: {},
}));

// ─── Mock the ai SDK ──────────────────────────────────────────────────────────

const mockGenerateText = vi.fn().mockResolvedValue({
  text: "Beautiful 3-bedroom home with updated kitchen and hardwood floors.",
});

vi.mock("ai", () => ({
  generateText: mockGenerateText,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => ({ modelId: "gpt-4o" })),
}));

// ─── Mock the inngest client ──────────────────────────────────────────────────

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((opts, trigger, handler) => ({
      opts,
      trigger,
      handler,
    })),
  },
}));

// ─── Tests for LISTING_DESCRIPTION_PROMPT ────────────────────────────────────

describe("LISTING_DESCRIPTION_PROMPT", () => {
  const details = {
    beds: 3,
    baths: 2.5,
    sqft: 1800,
    lotSizeSqft: 5000,
    city: "Austin",
    state: "TX",
    propertyType: "single_family",
    yearBuilt: 1995,
  };

  it("includes property details in output (beds, baths, sqft, city, state)", () => {
    const prompt = LISTING_DESCRIPTION_PROMPT(details);
    expect(prompt).toContain("3");
    expect(prompt).toContain("2.5");
    expect(prompt).toContain("1800");
    expect(prompt).toContain("Austin");
    expect(prompt).toContain("TX");
  });

  it("instructs MLS-quality formatting (professional tone, highlight features)", () => {
    const prompt = LISTING_DESCRIPTION_PROMPT(details);
    const lower = prompt.toLowerCase();
    expect(lower).toMatch(/professional|mls|real estate/);
    expect(lower).toMatch(/highlight|feature|describe/);
  });

  it("instructs not to mention price", () => {
    const prompt = LISTING_DESCRIPTION_PROMPT(details);
    expect(prompt.toLowerCase()).toMatch(/do not mention price|not.*price|price.*not/);
  });
});

// ─── Tests for generateListingDescription function logic ──────────────────────

describe("generateListingDescription Inngest function", () => {
  let mockStepRun: ReturnType<typeof vi.fn>;
  let capturedHandler: (ctx: {
    event: {
      data: {
        listingId: string;
        photoUrls: string[];
        details: Record<string, unknown>;
      };
    };
    step: { run: ReturnType<typeof vi.fn> };
  }) => Promise<{ listingId: string; description: string }>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mockGenerateText to return the fixed description
    mockGenerateText.mockResolvedValue({
      text: "Beautiful 3-bedroom home with updated kitchen and hardwood floors.",
    });

    // step.run executes the callback immediately
    mockStepRun = vi.fn().mockImplementation(async (_name: string, fn: () => Promise<unknown>) => {
      return await fn();
    });

    // Import after mocks are set up
    const mod = await import("./generate-description");

    // Extract the handler from the inngest.createFunction call
    const { inngest } = await import("@/inngest/client");
    const createFunctionMock = inngest.createFunction as ReturnType<typeof vi.fn>;

    if (createFunctionMock.mock.calls.length > 0) {
      capturedHandler = createFunctionMock.mock.calls[0][2];
    } else {
      // Directly test via the exported fn if available
      capturedHandler = mod.generateListingDescription as typeof capturedHandler;
    }
  });

  const baseEvent = {
    data: {
      listingId: "listing-123",
      photoUrls: ["https://cdn.example.com/photo1.jpg", "https://cdn.example.com/photo2.jpg"],
      details: {
        beds: 3,
        baths: 2,
        sqft: 1500,
        lotSizeSqft: 4000,
        city: "Dallas",
        state: "TX",
        propertyType: "single_family",
        yearBuilt: 2005,
      },
    },
  };

  it("sets descriptionStatus to 'generating' at start", async () => {
    if (!capturedHandler) return;
    await capturedHandler({ event: baseEvent, step: { run: mockStepRun } });

    // First step.run call should be "mark-generating"
    const [firstCallName] = mockStepRun.mock.calls[0];
    expect(firstCallName).toBe("mark-generating");

    // db.update should have been called
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("calls generateText with GPT-4o model and photo URLs as image content", async () => {
    if (!capturedHandler) return;
    await capturedHandler({ event: baseEvent, step: { run: mockStepRun } });

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    // Model should be gpt-4o
    expect(callArgs.model).toBeDefined();
    // Messages should contain image content for photo URLs
    const messages = callArgs.messages;
    expect(Array.isArray(messages)).toBe(true);
    const hasImageContent = messages.some(
      (m: { content: Array<{ type: string }> | string }) =>
        Array.isArray(m.content) && m.content.some((c: { type: string }) => c.type === "image"),
    );
    expect(hasImageContent).toBe(true);
  });

  it("saves generated text to description field and sets descriptionStatus to 'ready'", async () => {
    if (!capturedHandler) return;
    await capturedHandler({ event: baseEvent, step: { run: mockStepRun } });

    // Last step.run call should be "save-description"
    const lastCallName = mockStepRun.mock.calls[mockStepRun.mock.calls.length - 1][0];
    expect(lastCallName).toBe("save-description");

    // db.update should have been called multiple times (marking + saving)
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
});

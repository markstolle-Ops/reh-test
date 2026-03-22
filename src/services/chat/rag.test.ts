import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock the AI SDK embed function
vi.mock("ai", () => ({
  embed: vi.fn(),
}));

// Mock @ai-sdk/openai — must expose openai.embedding as a function
vi.mock("@ai-sdk/openai", () => {
  const openaiMock = vi.fn(() => ({ modelId: "gpt-4o-mini" }));
  // openai.embedding() returns a model descriptor for the embed() call
  openaiMock.embedding = vi.fn(() => ({ modelId: "text-embedding-3-small" }));
  return { openai: openaiMock };
});

// Mock the DB
vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

// Import after mocks
import { embed } from "ai";
import { db } from "@/db";
import { queryKnowledgeBase } from "./rag";

const mockEmbed = vi.mocked(embed);
const mockDbExecute = vi.mocked(db.execute);

describe("queryKnowledgeBase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls embed() with query text and returns concatenated content strings", async () => {
    mockEmbed.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      value: "test query",
      usage: { tokens: 5 },
    } as never);

    mockDbExecute.mockResolvedValue([
      { content: "First chunk content" },
      { content: "Second chunk content" },
    ] as never);

    const result = await queryKnowledgeBase("test query");

    expect(mockEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "test query",
      })
    );
    expect(result).toContain("First chunk content");
    expect(result).toContain("Second chunk content");
  });

  it("filters by state when provided", async () => {
    mockEmbed.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      value: "california closing process",
      usage: { tokens: 5 },
    } as never);

    mockDbExecute.mockResolvedValue([
      { content: "California specific content" },
    ] as never);

    const result = await queryKnowledgeBase("california closing process", "CA");

    expect(mockEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "california closing process",
      })
    );
    expect(result).toBe("California specific content");
  });

  it("returns empty string when no matches", async () => {
    mockEmbed.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      value: "obscure query",
      usage: { tokens: 5 },
    } as never);

    mockDbExecute.mockResolvedValue([] as never);

    const result = await queryKnowledgeBase("obscure query");

    expect(result).toBe("");
  });

  it("returns empty string and warns when embed throws (no API key)", async () => {
    mockEmbed.mockRejectedValue(new Error("No API key"));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await queryKnowledgeBase("any query");

    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

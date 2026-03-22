import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock queryKnowledgeBase
vi.mock("@/services/chat/rag", () => ({
  queryKnowledgeBase: vi.fn(),
}));

// Mock CHATBOT_SYSTEM_PROMPT
vi.mock("@/ai/prompts/chatbot-system", () => ({
  CHATBOT_SYSTEM_PROMPT: vi.fn(
    ({ context, listingState }: { context: string; listingState: string }) =>
      `SYSTEM:${listingState}:${context}`,
  ),
}));

// Mock @ai-sdk/openai
vi.mock("@ai-sdk/openai", () => {
  const openaiMock = vi.fn((modelId: string) => ({ modelId }));
  openaiMock.embedding = vi.fn(() => ({ modelId: "text-embedding-3-small" }));
  return { openai: openaiMock };
});

// Track tool calls and db inserts
let capturedTools: Record<string, unknown> = {};
let capturedSystemMessage: string = "";
let dbInsertCalled = false;
let dbInsertValues: Record<string, unknown> = {};

// Mock streamText and tool from "ai"
vi.mock("ai", () => ({
  streamText: vi.fn(({ system, tools }: { system: string; tools: Record<string, unknown> }) => {
    capturedSystemMessage = system;
    capturedTools = tools;
    return {
      toDataStreamResponse: vi.fn(() => new Response("streaming", { status: 200 })),
      toUIMessageStreamResponse: vi.fn(() => new Response("streaming", { status: 200 })),
    };
  }),
  // tool() is an identity wrapper — pass the config through unchanged so execute() is accessible
  tool: vi.fn((config: unknown) => config),
}));

// Mock DB
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn((values: Record<string, unknown>) => {
        dbInsertCalled = true;
        dbInsertValues = values;
        return Promise.resolve();
      }),
    })),
  },
}));

// Import after mocks
import { auth } from "@clerk/nextjs/server";
import { queryKnowledgeBase } from "@/services/chat/rag";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockQueryKnowledgeBase = vi.mocked(queryKnowledgeBase);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedTools = {};
    capturedSystemMessage = "";
    dbInsertCalled = false;
    dbInsertValues = {};
    mockQueryKnowledgeBase.mockResolvedValue("RAG context from knowledge base");
    mockAuth.mockResolvedValue({ userId: null } as never);
  });

  it("returns a streaming response with system prompt containing RAG context", async () => {
    const req = makeRequest({
      messages: [{ role: "user", content: "What is the listing price?" }],
      listingId: "listing-123",
      listingState: "CA",
    });

    const response = await POST(req);

    expect(mockQueryKnowledgeBase).toHaveBeenCalledWith("What is the listing price?", "CA");
    expect(capturedSystemMessage).toContain("SYSTEM:CA:RAG context from knowledge base");
    expect(response.status).toBe(200);
  });

  it("has scheduleShowing tool defined with correct parameters", async () => {
    const req = makeRequest({
      messages: [{ role: "user", content: "Can I schedule a showing?" }],
      listingId: "listing-123",
      listingState: "TX",
    });

    await POST(req);

    expect(capturedTools).toBeDefined();
    expect(capturedTools).toHaveProperty("scheduleShowing");
  });

  it("scheduleShowing tool inserts a record into showingRequests table", async () => {
    // We need to call the tool's execute function directly
    const req = makeRequest({
      messages: [{ role: "user", content: "Schedule a showing please" }],
      listingId: "listing-456",
      listingState: "FL",
    });

    // Set up auth to return a userId so the insert proceeds
    mockAuth.mockResolvedValue({ userId: "user-abc" } as never);

    await POST(req);

    // Get the scheduleShowing tool that was passed to streamText
    const showingTool = capturedTools.scheduleShowing as
      | {
          execute?: (args: Record<string, unknown>) => Promise<unknown>;
        }
      | undefined;
    expect(showingTool).toBeDefined();
    expect(showingTool?.execute).toBeDefined();

    // Execute the tool
    const result = await showingTool!.execute!({
      requestedDate: "2026-04-15T10:00:00Z",
      notes: "Morning preferred",
      listingId: "listing-456",
      userId: "user-abc",
    });

    expect(dbInsertCalled).toBe(true);
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it("scheduleShowing tool returns success confirmation message", async () => {
    mockAuth.mockResolvedValue({ userId: "user-xyz" } as never);

    const req = makeRequest({
      messages: [{ role: "user", content: "Schedule showing" }],
      listingId: "listing-789",
      listingState: "NY",
    });

    await POST(req);

    const showingTool = capturedTools.scheduleShowing as
      | {
          execute?: (args: Record<string, unknown>) => Promise<unknown>;
        }
      | undefined;

    const result = (await showingTool?.execute?.({
      requestedDate: "2026-04-20T14:00:00Z",
      listingId: "listing-789",
      userId: "user-xyz",
    })) as { success: boolean; message: string } | undefined;

    expect(result?.message).toContain("Showing request submitted");
  });

  it("works for unauthenticated users reading chat (public listing pages)", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const req = makeRequest({
      messages: [{ role: "user", content: "How many bedrooms?" }],
      listingId: "listing-public",
      listingState: "GA",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it("scheduleShowing tool returns error when no userId", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const req = makeRequest({
      messages: [{ role: "user", content: "I want to book a showing" }],
      listingId: "listing-999",
      listingState: "AZ",
    });

    await POST(req);

    const showingTool = capturedTools.scheduleShowing as
      | {
          execute?: (args: Record<string, unknown>) => Promise<unknown>;
        }
      | undefined;

    // Execute without userId
    const result = (await showingTool?.execute?.({
      requestedDate: "2026-04-25T09:00:00Z",
      listingId: "listing-999",
      userId: undefined,
    })) as { success: boolean; error: string } | undefined;

    expect(result?.success).toBe(false);
    expect(result?.error).toBeDefined();
  });
});

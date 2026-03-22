import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock modules ─────────────────────────────────────────────────────────────

const { mockExecute, mockInsert } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    // db.transaction(cb) calls cb with a tx object that has execute/insert
    transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = { execute: mockExecute, insert: mockInsert };
      return cb(tx);
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  agentRequests: { id: "agent_requests" },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { dispatchAgentForTransaction } from "./agent-dispatch";

// ─── dispatchAgentForTransaction ─────────────────────────────────────────────

describe("dispatchAgentForTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no verified agent is available for the state", async () => {
    mockExecute.mockResolvedValueOnce([] as never);

    const result = await dispatchAgentForTransaction("tx-1", "CA");

    expect(result).toBeNull();
  });

  it("creates an agentRequests row and returns dispatch result when agent found", async () => {
    const mockAgent = {
      id: "agent-1",
      user_id: "user-agent-1",
      flat_fee_cents: 50000,
    };

    mockExecute.mockResolvedValueOnce([mockAgent] as never);

    const mockRequestId = "req-123";
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: mockRequestId }]),
      }),
    } as never);

    const result = await dispatchAgentForTransaction("tx-1", "GA");

    expect(result).not.toBeNull();
    expect(result?.agentId).toBe("agent-1");
    expect(result?.agentUserId).toBe("user-agent-1");
    expect(result?.flatFeeCents).toBe(50000);
    expect(result?.requestId).toBe(mockRequestId);
  });

  it("does not insert agentRequests row when no agent found", async () => {
    mockExecute.mockResolvedValueOnce([] as never);

    await dispatchAgentForTransaction("tx-1", "NC");

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("uses tx.execute exactly once (raw SQL with FOR UPDATE SKIP LOCKED)", async () => {
    mockExecute.mockResolvedValueOnce([] as never);

    await dispatchAgentForTransaction("tx-1", "NY");

    expect(mockExecute).toHaveBeenCalledTimes(1);
  });
});

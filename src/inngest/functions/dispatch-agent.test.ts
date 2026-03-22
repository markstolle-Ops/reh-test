import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock modules ─────────────────────────────────────────────────────────────
// All vi.mock calls are hoisted — use vi.fn() inline only (Vitest hoisting rule).

vi.mock("@/services/agent/agent-dispatch", () => ({
  dispatchAgentForTransaction: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((opts, trigger, handler) => ({
      opts,
      trigger,
      handler,
    })),
  },
}));

// ─── Import after mocks ────────────────────────────────────────────────────────
import { dispatchAgentForTransaction } from "@/services/agent/agent-dispatch";
import { dispatchAgentRaw } from "./dispatch-agent";

// ─── dispatchAgentRaw ─────────────────────────────────────────────────────────

describe("dispatchAgentRaw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls dispatchAgentForTransaction with transactionId and propertyState", async () => {
    vi.mocked(dispatchAgentForTransaction).mockResolvedValueOnce(null);

    await dispatchAgentRaw(
      { transactionId: "tx-1", propertyState: "CA" },
      vi.fn()
    );

    expect(dispatchAgentForTransaction).toHaveBeenCalledWith("tx-1", "CA");
  });

  it("does not send email when no agent is available", async () => {
    vi.mocked(dispatchAgentForTransaction).mockResolvedValueOnce(null);

    const mockSendEmail = vi.fn();
    await dispatchAgentRaw(
      { transactionId: "tx-1", propertyState: "CA" },
      mockSendEmail
    );

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends notification email to agent when dispatch succeeds", async () => {
    vi.mocked(dispatchAgentForTransaction).mockResolvedValueOnce({
      agentId: "agent-1",
      agentUserId: "user-agent-1",
      requestId: "req-1",
      flatFeeCents: 50000,
    });

    const mockSendEmail = vi.fn().mockResolvedValueOnce(undefined);

    await dispatchAgentRaw(
      { transactionId: "tx-42", propertyState: "GA" },
      mockSendEmail
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const emailCall = mockSendEmail.mock.calls[0][0];
    expect(emailCall).toMatchObject({
      agentUserId: "user-agent-1",
      transactionId: "tx-42",
      requestId: "req-1",
    });
  });

  it("returns dispatchResult (null if no agent)", async () => {
    vi.mocked(dispatchAgentForTransaction).mockResolvedValueOnce(null);

    const result = await dispatchAgentRaw(
      { transactionId: "tx-1", propertyState: "TX" },
      vi.fn()
    );

    expect(result).toBeNull();
  });

  it("returns dispatchResult when agent found", async () => {
    const dispatchResult = {
      agentId: "agent-2",
      agentUserId: "user-agent-2",
      requestId: "req-2",
      flatFeeCents: 50000,
    };
    vi.mocked(dispatchAgentForTransaction).mockResolvedValueOnce(dispatchResult);

    const result = await dispatchAgentRaw(
      { transactionId: "tx-2", propertyState: "NY" },
      vi.fn().mockResolvedValueOnce(undefined)
    );

    expect(result).toEqual(dispatchResult);
  });
});

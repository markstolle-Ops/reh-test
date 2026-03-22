import { inngest } from "@/inngest/client";
import type { DispatchResult } from "@/services/agent/agent-dispatch";
import { dispatchAgentForTransaction } from "@/services/agent/agent-dispatch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DispatchEventData {
  transactionId: string;
  propertyState: string;
}

type SendNotification = (opts: {
  agentUserId: string;
  transactionId: string;
  requestId: string;
}) => Promise<void>;

// ─── Default notification sender ─────────────────────────────────────────────

/**
 * Default notification sender: sends email to agent via Resend.
 * Agent email is resolved from Clerk by userId.
 */
async function defaultSendNotification(opts: {
  agentUserId: string;
  transactionId: string;
  requestId: string;
}): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Resolve agent email from Clerk
  const { createClerkClient } = await import("@clerk/nextjs/server");
  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const user = await clerk.users.getUser(opts.agentUserId);
  const agentEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!agentEmail) {
    console.warn(`[dispatch-agent] No email found for agent userId=${opts.agentUserId}`);
    return;
  }

  await resend.emails.send({
    from: "RealEstateHunter <agents@realestatehunter.com>",
    to: [agentEmail],
    subject: "You have been assigned to a new transaction",
    text: [
      "You have been assigned as the agent-for-hire on a new RealEstateHunter transaction.",
      "",
      `Transaction ID: ${opts.transactionId}`,
      `Request ID: ${opts.requestId}`,
      "",
      "Please log in to your agent dashboard to review and accept the assignment.",
      "",
      "RealEstateHunter Agent Team",
    ].join("\n"),
  });
}

// ─── Raw function (exported for testability) ─────────────────────────────────

/**
 * Core dispatch logic extracted for testing.
 * Accepts injected sendNotification to avoid Resend/Clerk calls in tests.
 */
export async function dispatchAgentRaw(
  data: DispatchEventData,
  sendNotification: SendNotification,
): Promise<DispatchResult | null> {
  const { transactionId, propertyState } = data;

  const dispatchResult = await dispatchAgentForTransaction(transactionId, propertyState);

  if (!dispatchResult) {
    console.warn(
      `[dispatch-agent] No available agents for state=${propertyState}, transactionId=${transactionId}`,
    );
    return null;
  }

  await sendNotification({
    agentUserId: dispatchResult.agentUserId,
    transactionId,
    requestId: dispatchResult.requestId,
  });

  return dispatchResult;
}

// ─── Inngest function ─────────────────────────────────────────────────────────

/**
 * Inngest handler for agent dispatch events.
 *
 * Triggered by: 'transaction/agent.dispatch.requested'
 * Fired from: POST /api/transactions/[id]/events when newStatus is attorney_review
 *   and stateConfig.attorneyReferralRequired is true.
 *
 * Selects an available verified agent for the property state using row-level
 * locking, creates an agentRequests record, and notifies the agent via email.
 */
export const dispatchAgentFn = inngest.createFunction(
  { id: "dispatch-agent" },
  { event: "transaction/agent.dispatch.requested" },
  async ({ event, step }) => {
    const { transactionId, propertyState } = event.data as DispatchEventData;

    const result = await step.run("select-and-dispatch-agent", async () => {
      return dispatchAgentRaw({ transactionId, propertyState }, defaultSendNotification);
    });

    return { dispatched: result !== null, result };
  },
);

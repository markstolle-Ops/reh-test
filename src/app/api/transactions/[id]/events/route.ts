import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import {
  appendTransactionEvent,
  type TransactionEventType,
  type TransactionStatus,
} from "@/services/transaction/events";
import { inngest } from "@/inngest/client";
import { getStateWorkflowConfig } from "@/workflow/states";

type Params = { params: Promise<{ id: string }> };

// All valid event type values for runtime validation
const VALID_EVENT_TYPES = new Set<TransactionEventType>([
  "offer_submitted",
  "counter_submitted",
  "offer_accepted",
  "offer_rejected",
  "attorney_review_started",
  "attorney_review_completed",
  "inspection_scheduled",
  "inspection_completed",
  "inspection_contingency_waived",
  "financing_approved",
  "financing_contingency_waived",
  "closing_disclosure_sent",
  "closing_disclosure_received",
  "closing_scheduled",
  "closed_won",
  "closed_lost",
  "transaction_cancelled",
]);

/**
 * Derives the new transaction status from an event type and current state config.
 * Returns undefined if the event does not trigger a status transition.
 */
function deriveNewStatus(
  eventType: TransactionEventType,
  currentStatus: TransactionStatus,
  propertyState: string
): TransactionStatus | undefined {
  // Get workflow config to determine attorney requirement
  let stateConfig;
  try {
    stateConfig = getStateWorkflowConfig(propertyState);
  } catch {
    return undefined;
  }

  const requiresAttorney = stateConfig.attorneyReferralRequired;

  switch (eventType) {
    case "offer_accepted":
      // Attorney-required and customary-attorney states route through attorney_review
      if (requiresAttorney) return "attorney_review";
      return "inspection_period";

    case "attorney_review_started":
      return "attorney_review";

    case "attorney_review_completed":
      return "inspection_period";

    case "inspection_completed":
    case "inspection_contingency_waived":
      return "financing_period";

    case "financing_approved":
    case "financing_contingency_waived":
      return "pending_closing";

    case "closing_scheduled":
      return "pending_closing";

    case "closed_won":
      return "closed_won";

    case "closed_lost":
    case "offer_rejected":
    case "transaction_cancelled":
      return "closed_lost";

    default:
      return undefined;
  }
}

/**
 * POST /api/transactions/[id]/events
 *
 * Append an immutable event to the transaction log.
 * Requires auth. User must be buyer or seller on this transaction.
 *
 * When a status transition to attorney_review occurs for attorney-required states,
 * fires a 'transaction/agent.dispatch.requested' Inngest event.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transaction.buyerUserId !== userId && transaction.sellerUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { eventType, payload } = body as {
    eventType?: unknown;
    payload?: unknown;
  };

  if (!eventType || typeof eventType !== "string") {
    return NextResponse.json(
      { error: "eventType is required" },
      { status: 422 }
    );
  }

  if (!VALID_EVENT_TYPES.has(eventType as TransactionEventType)) {
    return NextResponse.json(
      { error: `Invalid eventType: ${eventType}` },
      { status: 422 }
    );
  }

  const safePayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  // Derive status transition from the event type
  const newStatus = deriveNewStatus(
    eventType as TransactionEventType,
    transaction.currentStatus as TransactionStatus,
    transaction.propertyState
  );

  const event = await appendTransactionEvent({
    transactionId: id,
    eventType: eventType as TransactionEventType,
    payload: safePayload,
    actorUserId: userId,
    newStatus,
  });

  // Fire agent dispatch event when transitioning to attorney_review for states
  // that require attorney/agent involvement
  if (newStatus === "attorney_review") {
    let stateConfig;
    try {
      stateConfig = getStateWorkflowConfig(transaction.propertyState);
    } catch {
      stateConfig = null;
    }

    if (stateConfig?.attorneyReferralRequired) {
      // Fire-and-forget: agent dispatch is async; do not block the response
      await inngest.send({
        name: "transaction/agent.dispatch.requested",
        data: {
          transactionId: id,
          propertyState: transaction.propertyState,
        },
      });
    }
  }

  return NextResponse.json({ event }, { status: 201 });
}

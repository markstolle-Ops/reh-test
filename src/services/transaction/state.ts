/**
 * Transaction State Derivation
 *
 * Derives current transaction status by replaying all events.
 * This is for audit/replay; normal reads use the cached currentStatus.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactionEvents } from "@/db/schema";
import type { TransactionStatus } from "./events";

// Map event types to resulting transaction statuses
const EVENT_TO_STATUS: Partial<Record<string, TransactionStatus>> = {
  offer_submitted: "offer_submitted",
  counter_submitted: "counter_pending",
  offer_accepted: "offer_accepted",
  attorney_review_started: "attorney_review",
  attorney_review_completed: "inspection_period",
  financing_approved: "financing_period",
  closing_scheduled: "pending_closing",
  closed_won: "closed_won",
  closed_lost: "closed_lost",
};

/**
 * Derive the latest transaction status by replaying all events.
 * Falls back to "offer_submitted" if no status-changing events are found.
 *
 * Normal reads should use the cached transactions.currentStatus.
 * Use this function for audit purposes or snapshot reconstruction.
 */
export async function deriveTransactionState(
  transactionId: string
): Promise<TransactionStatus> {
  const events = await db
    .select()
    .from(transactionEvents)
    .where(eq(transactionEvents.transactionId, transactionId))
    .orderBy(asc(transactionEvents.occurredAt));

  let latestStatus: TransactionStatus = "offer_submitted";

  for (const event of events) {
    const status = EVENT_TO_STATUS[event.eventType];
    if (status) {
      latestStatus = status;
    }
  }

  return latestStatus;
}

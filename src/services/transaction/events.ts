/**
 * Transaction Event Service
 *
 * Append-only event log. Events are NEVER updated or deleted.
 * This is the write path for the event-sourced transaction model.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transactionEvents, transactions } from "@/db/schema";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TransactionEventType =
  | "offer_submitted"
  | "counter_submitted"
  | "offer_accepted"
  | "offer_rejected"
  | "attorney_review_started"
  | "attorney_review_completed"
  | "inspection_scheduled"
  | "inspection_completed"
  | "inspection_contingency_waived"
  | "financing_approved"
  | "financing_contingency_waived"
  | "closing_disclosure_sent"
  | "closing_disclosure_received"
  | "closing_scheduled"
  | "closed_won"
  | "closed_lost"
  | "transaction_cancelled"
  | "wire_instructions_viewed";

export type TransactionStatus =
  | "offer_submitted"
  | "counter_pending"
  | "offer_accepted"
  | "attorney_review"
  | "inspection_period"
  | "financing_period"
  | "pending_closing"
  | "closed_won"
  | "closed_lost";

export interface AppendEventParams {
  transactionId: string;
  eventType: TransactionEventType;
  payload: Record<string, unknown>;
  actorUserId?: string;
  /** When provided, updates the transactions.currentStatus cache */
  newStatus?: TransactionStatus;
}

export interface TransactionEvent {
  id: string;
  transactionId: string;
  eventType: string;
  payload: string;
  actorUserId: string | null;
  occurredAt: Date;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Append an event to the transaction event log.
 *
 * APPEND-ONLY: never update or delete event rows.
 * Optionally updates the cached currentStatus on the transactions table.
 */
export async function appendTransactionEvent(
  params: AppendEventParams
): Promise<TransactionEvent> {
  const { transactionId, eventType, payload, actorUserId, newStatus } = params;

  const id = crypto.randomUUID();

  const [event] = await db
    .insert(transactionEvents)
    .values({
      id,
      transactionId,
      eventType,
      payload: JSON.stringify(payload),
      actorUserId: actorUserId ?? null,
    })
    .returning();

  // Update cached status if a state transition occurred
  if (newStatus) {
    await db
      .update(transactions)
      .set({ currentStatus: newStatus, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));
  }

  return event;
}

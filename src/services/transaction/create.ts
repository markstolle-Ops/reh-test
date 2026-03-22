/**
 * Transaction Creation Service
 *
 * Creates a new transaction and appends the first event (offer_submitted).
 * Both operations run in a single DB transaction for atomicity.
 */

import { db } from "@/db";
import { transactions, transactionEvents } from "@/db/schema";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateTransactionParams {
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  propertyState: string;
  offerPriceCents: number;
}

export type Transaction = typeof transactions.$inferSelect;

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Create a transaction record and append the initial offer_submitted event.
 * Both inserts run atomically — if either fails, neither persists.
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<Transaction> {
  const {
    listingId,
    buyerUserId,
    sellerUserId,
    propertyState,
    offerPriceCents,
  } = params;

  return db.transaction(async (tx) => {
    const id = crypto.randomUUID();

    const [transaction] = await tx
      .insert(transactions)
      .values({
        id,
        listingId,
        buyerUserId,
        sellerUserId,
        propertyState,
        offerPriceCents,
      })
      .returning();

    // Append the first event — offer has been submitted
    await tx.insert(transactionEvents).values({
      id: crypto.randomUUID(),
      transactionId: id,
      eventType: "offer_submitted",
      payload: JSON.stringify({ offerPriceCents }),
      actorUserId: buyerUserId,
    });

    return transaction;
  });
}

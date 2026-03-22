/**
 * Wire Instructions Service
 *
 * Stores and retrieves wire transfer instructions per transaction.
 * Security model:
 *   - Wire instructions are NEVER emailed — in-app display only
 *   - Every retrieval is logged as wire_instructions_viewed in transactionEvents
 *   - Viewer must be the buyer or seller on the transaction (authorization check)
 *   - Plaintext storage for MVP — see TODO below for encryption upgrade path
 *
 * TODO: Add column-level encryption via Supabase Vault (pgsodium) before production.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions, wireInstructions } from "@/db/schema";
import { appendTransactionEvent } from "@/services/transaction/events";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetWireInstructionsParams {
  transactionId: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  referenceNote?: string;
  setByUserId: string;
}

export interface WireInstruction {
  id: string;
  transactionId: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  referenceNote: string | null;
  setByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Upsert wire instructions for a transaction.
 * Only one wire instruction record exists per transaction (unique transactionId).
 * If instructions already exist, they are overwritten.
 */
export async function setWireInstructions(
  params: SetWireInstructionsParams,
): Promise<WireInstruction> {
  const {
    transactionId,
    bankName,
    routingNumber,
    accountNumber,
    accountName,
    referenceNote,
    setByUserId,
  } = params;

  const id = crypto.randomUUID();
  const now = new Date();

  const [record] = await db
    .insert(wireInstructions)
    .values({
      id,
      transactionId,
      bankName,
      routingNumber,
      accountNumber,
      accountName,
      referenceNote: referenceNote ?? null,
      setByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: wireInstructions.transactionId,
      set: {
        bankName,
        routingNumber,
        accountNumber,
        accountName,
        referenceNote: referenceNote ?? null,
        setByUserId,
        updatedAt: now,
      },
    })
    .returning();

  return record;
}

/**
 * Fetch wire instructions for a transaction.
 *
 * Authorization: viewerUserId must be the buyer or seller on the transaction.
 * Audit: every successful retrieval appends a wire_instructions_viewed event.
 *
 * Returns null when no wire instructions have been set yet.
 * Throws "Transaction not found" when the transaction ID doesn't exist.
 * Throws "Unauthorized" when viewer is not a party to the transaction.
 */
export async function getWireInstructions(
  transactionId: string,
  viewerUserId: string,
): Promise<WireInstruction | null> {
  // Verify transaction exists and viewer is authorized
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Wire instructions are for the buyer's title company — restrict to buyer only.
  // Seller access to wire details is a wire fraud risk vector.
  if (transaction.buyerUserId !== viewerUserId) {
    throw new Error("Unauthorized: only the buyer can view wire instructions");
  }

  // Fetch wire instructions
  const rows = await db
    .select()
    .from(wireInstructions)
    .where(eq(wireInstructions.transactionId, transactionId));

  const record = rows[0] ?? null;

  // Append audit event on successful retrieval
  if (record) {
    await appendTransactionEvent({
      transactionId,
      eventType: "wire_instructions_viewed",
      payload: { viewerUserId },
      actorUserId: viewerUserId,
    });
  }

  return record;
}

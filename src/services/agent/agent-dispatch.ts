import { sql } from "drizzle-orm";
import { db } from "@/db";
import { agentRequests } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DispatchResult {
  agentId: string;
  agentUserId: string;
  requestId: string;
  flatFeeCents: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Selects one verified, available agent licensed in the given state using
 * SELECT FOR UPDATE SKIP LOCKED to prevent double-assignment, creates an
 * agentRequests row, and returns the dispatch result.
 *
 * Both operations run inside a single DB transaction so the row-level lock
 * is held until the insert completes.
 *
 * Returns null if no verified agents are available for the state.
 * The transaction still proceeds even when no agent is available.
 *
 * @param transactionId - The transaction requiring agent involvement
 * @param propertyState - Two-letter US state code for the property
 */
export async function dispatchAgentForTransaction(
  transactionId: string,
  propertyState: string
): Promise<DispatchResult | null> {
  return db.transaction(async (tx) => {
    // Row-level lock prevents concurrent double-assignment.
    // SKIP LOCKED ensures workers don't block each other.
    const result = await tx.execute(sql`
      SELECT id, user_id, flat_fee_cents
      FROM agent_profiles
      WHERE verified = true
        AND available_for_dispatch = true
        AND license_states @> ARRAY[${propertyState}]::text[]
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    const rows = Array.from(result) as Array<{
      id: string;
      user_id: string;
      flat_fee_cents: number;
    }>;

    if (rows.length === 0) {
      return null;
    }

    const agent = rows[0];

    const requestId = `areq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const [request] = await tx
      .insert(agentRequests)
      .values({
        id: requestId,
        transactionId,
        agentId: agent.id,
        state: propertyState,
        status: "pending",
        requestedAt: new Date(),
      })
      .returning();

    return {
      agentId: agent.id,
      agentUserId: agent.user_id,
      requestId: request.id,
      flatFeeCents: agent.flat_fee_cents,
    };
  });
}

import { and, desc, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { buyerEvents } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuyerEventType =
  | "listing_viewed"
  | "listing_saved"
  | "search_executed";

const VALID_EVENT_TYPES = new Set<BuyerEventType>([
  "listing_viewed",
  "listing_saved",
  "search_executed",
]);

export interface BuyerEventInput {
  userId: string;
  eventType: BuyerEventType;
  listingId?: string;
  metadata?: Record<string, unknown>;
}

export interface BuyerEvent {
  id: string;
  userId: string;
  eventType: BuyerEventType;
  listingId: string | null;
  metadata: string;
  occurredAt: Date;
}

// ─── recordBuyerEvent ─────────────────────────────────────────────────────────

/**
 * Append-only insert of a buyer behavioral event.
 * Validates eventType against allowed set before writing.
 */
export async function recordBuyerEvent(
  input: BuyerEventInput
): Promise<BuyerEvent> {
  if (!VALID_EVENT_TYPES.has(input.eventType)) {
    throw new Error(
      `Invalid eventType: "${input.eventType}". Must be one of: listing_viewed, listing_saved, search_executed`
    );
  }

  const [inserted] = await db
    .insert(buyerEvents)
    .values({
      id: nanoid(),
      userId: input.userId,
      eventType: input.eventType,
      listingId: input.listingId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : "{}",
    })
    .returning();

  return inserted as BuyerEvent;
}

// ─── getRecentEvents ──────────────────────────────────────────────────────────

/**
 * Load buyer events from the trailing N days (default 90).
 * Used by the preference profiler to build a buyer's interest signature.
 */
export async function getRecentEvents(
  userId: string,
  days = 90
): Promise<BuyerEvent[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = await db
    .select()
    .from(buyerEvents)
    .where(
      and(
        sql`${buyerEvents.userId} = ${userId}`,
        gt(buyerEvents.occurredAt, cutoff)
      )
    )
    .orderBy(desc(buyerEvents.occurredAt));

  return rows as BuyerEvent[];
}

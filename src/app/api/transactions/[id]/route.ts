import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions, transactionEvents } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/transactions/[id]
 *
 * Return full transaction with events array ordered by occurredAt ASC.
 * Returns 403 if the authenticated user is not the buyer or seller.
 */
export async function GET(_req: NextRequest, { params }: Params) {
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

  const events = await db
    .select()
    .from(transactionEvents)
    .where(eq(transactionEvents.transactionId, id))
    .orderBy(asc(transactionEvents.occurredAt));

  return NextResponse.json({ transaction, events });
}

/**
 * Buyer Transaction Dashboard
 *
 * Server Component. Shows transaction status, checklist, deadline timeline,
 * document compliance, and event history for the authenticated buyer.
 *
 * Authorization: current user must be the buyer on this transaction.
 */

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  checkDocumentCompliance,
  formatChecklistWithStatus,
  generateChecklist,
} from "@/ai/agents/transaction-coordinator";
import { db } from "@/db";
import { listings, transactionDeadlines, transactionEvents, transactions } from "@/db/schema";
import { getStateWorkflowConfig } from "@/workflow/states";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Status badge helpers ──────────────────────────────────────────────────────

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    offer_submitted: "bg-blue-100 text-blue-800",
    counter_pending: "bg-yellow-100 text-yellow-800",
    offer_accepted: "bg-green-100 text-green-800",
    attorney_review: "bg-purple-100 text-purple-800",
    inspection_period: "bg-orange-100 text-orange-800",
    financing_period: "bg-indigo-100 text-indigo-800",
    pending_closing: "bg-teal-100 text-teal-800",
    closed_won: "bg-green-200 text-green-900",
    closed_lost: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function BuyerTransactionPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch transaction
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  if (!transaction) {
    notFound();
  }

  // Authorization: current user must be the buyer
  if (transaction.buyerUserId !== userId) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-800">Access Denied</h1>
          <p className="mt-2 text-red-700 text-sm">You are not the buyer on this transaction.</p>
          <Link
            href="/buyer/dashboard"
            className="mt-4 inline-block text-sm text-red-600 underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Load related data in parallel
  const [events, deadlines, listing] = await Promise.all([
    db.select().from(transactionEvents).where(eq(transactionEvents.transactionId, id)),
    db.select().from(transactionDeadlines).where(eq(transactionDeadlines.transactionId, id)),
    db.query.listings.findFirst({
      where: eq(listings.id, transaction.listingId),
    }),
  ]);

  // Load state workflow config
  let config;
  try {
    config = getStateWorkflowConfig(transaction.propertyState);
  } catch {
    config = null;
  }

  // Generate checklist and compliance data
  const checklist = config ? generateChecklist(config) : [];
  const compliance = config
    ? checkDocumentCompliance(config, events)
    : { complete: [], missing: [] };
  const checklistWithStatus = formatChecklistWithStatus(checklist, compliance);

  // Partition deadlines by status
  const now = new Date();
  const pendingDeadlines = deadlines.filter((d) => !d.completedAt);
  const overdueDeadlines = pendingDeadlines.filter((d) => d.dueAt < now);
  const upcomingDeadlines = pendingDeadlines.filter((d) => d.dueAt >= now);
  const completedDeadlines = deadlines.filter((d) => d.completedAt);

  const propertyAddress = listing
    ? `${listing.streetAddress}, ${listing.city}, ${listing.state} ${listing.zip}`
    : "Property address unavailable";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/buyer/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Detail</h1>
          <p className="mt-1 text-gray-600 text-sm">{propertyAddress}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(transaction.currentStatus)}`}
        >
          {statusLabel(transaction.currentStatus)}
        </span>
      </div>

      {/* Listing Summary */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Property</dt>
            <dd className="font-medium text-gray-900">{propertyAddress}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Offer Price</dt>
            <dd className="font-medium text-gray-900">
              ${(transaction.offerPriceCents / 100).toLocaleString("en-US")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">State</dt>
            <dd className="font-medium text-gray-900">{transaction.propertyState}</dd>
          </div>
          {transaction.closingDate && (
            <div>
              <dt className="text-gray-500">Closing Date</dt>
              <dd className="font-medium text-gray-900">
                {new Date(transaction.closingDate).toLocaleDateString("en-US", {
                  dateStyle: "long",
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Deadline Timeline */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deadline Timeline</h2>

        {deadlines.length === 0 ? (
          <p className="text-sm text-gray-500">No deadlines scheduled yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Overdue */}
            {overdueDeadlines.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">
                  Overdue
                </h3>
                <ul className="space-y-2">
                  {overdueDeadlines.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md bg-red-50 border border-red-200 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-red-900">
                        {d.deadlineType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-xs text-red-700">
                        Was due{" "}
                        {new Date(d.dueAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upcoming */}
            {upcomingDeadlines.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Upcoming
                </h3>
                <ul className="space-y-2">
                  {upcomingDeadlines.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md bg-gray-50 border border-gray-200 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {d.deadlineType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-600">
                        Due {new Date(d.dueAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Completed */}
            {completedDeadlines.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2">
                  Completed
                </h3>
                <ul className="space-y-2">
                  {completedDeadlines.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-green-900">
                        {d.deadlineType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-xs text-green-700">
                        Completed{" "}
                        {new Date(d.completedAt!).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* State-Specific Checklist */}
      {checklistWithStatus.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Transaction Checklist</h2>
          {config && (
            <p className="text-xs text-gray-500 mb-4">
              {config.stateName} — {config.legalRequirementsSummary}
            </p>
          )}
          <ul className="space-y-3">
            {checklistWithStatus.map((item) => (
              <li key={item.stepId} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    item.complete
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-transparent"
                  }`}
                >
                  {item.complete ? "✓" : ""}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  {item.deadlineDays && (
                    <p className="text-xs text-gray-500">
                      {item.deadlineDays} days from offer acceptance
                    </p>
                  )}
                  {item.missingDocuments.length > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Missing: {item.missingDocuments.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Documents */}
      {compliance.missing.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">Documents Needed</h2>
          <ul className="space-y-1">
            {compliance.missing.map((doc) => (
              <li key={doc} className="flex items-center gap-2 text-sm text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                {doc.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Wire Instructions — visible when transaction is at pending_closing or later */}
      {transaction.currentStatus === "pending_closing" ||
      transaction.currentStatus === "closed_won" ? (
        <div
          id="wire-instructions-slot"
          className="rounded-lg border border-teal-200 bg-teal-50 p-6"
        >
          <h2 className="text-lg font-semibold text-teal-900 mb-1">Wire Instructions</h2>
          <p className="text-sm text-teal-700 mb-4">
            Wire instructions are available for this transaction. You must have two-factor
            authentication enabled to view them.
          </p>
          <p className="text-xs text-teal-600 mb-4 font-medium">
            Never send wire funds based on email instructions — always verify in-app.
          </p>
          <Link
            href={`/buyer/transactions/${id}/wire-instructions`}
            className="inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            View Wire Instructions (Secure)
          </Link>
        </div>
      ) : (
        <div
          id="wire-instructions-slot"
          className="rounded-lg border border-dashed border-gray-300 p-6 text-center"
        >
          <p className="text-sm text-gray-400">
            Secure wire instructions will appear here when closing is scheduled. Never send wire
            funds based on email instructions alone.
          </p>
        </div>
      )}

      {/* Event History */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Event History</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No events recorded yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {[...events]
              .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
              .map((evt) => (
                <li key={evt.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {evt.eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  <time className="text-xs text-gray-500">
                    {new Date(evt.occurredAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              ))}
          </ol>
        )}
      </div>

      {/* Legal Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        This is not legal advice. Consult a licensed attorney for questions about contracts, legal
        obligations, or state-specific requirements.
      </p>
    </div>
  );
}

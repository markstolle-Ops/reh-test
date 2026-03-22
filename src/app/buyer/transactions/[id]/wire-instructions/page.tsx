/**
 * Buyer Wire Instructions Page
 *
 * Server Component. MFA-gated display of wire transfer instructions.
 *
 * Security requirements:
 *   - Auth: Clerk session required — redirect to /sign-in if missing
 *   - MFA: user.twoFactorEnabled must be true — show setup prompt if not
 *   - Authorization: current user must be the buyer on this transaction
 *   - Prominent fraud warning banner always visible when instructions shown
 *   - Every page load audits via getWireInstructions → wire_instructions_viewed event
 *   - Routing/account numbers masked by default, with a client Reveal button
 *   - Wire data is NEVER sent via email — this page is the only source
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getWireInstructions } from "@/services/transaction/wire-instructions";
import WireInstructionsReveal from "./WireInstructionsReveal";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Mask all but last 4 digits of a numeric string
function maskNumber(value: string): string {
  if (value.length <= 4) return value;
  return "*".repeat(value.length - 4) + value.slice(-4);
}

export default async function WireInstructionsPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // MFA check — require 2FA before displaying wire instructions
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);

  if (!user.twoFactorEnabled) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <Link
          href={`/buyer/transactions/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 inline-block"
        >
          ← Back to Transaction
        </Link>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-900 mb-2">
            Two-Factor Authentication Required
          </h1>
          <p className="text-amber-800 text-sm mb-4">
            To protect against wire fraud, you must enable two-factor authentication (2FA) before
            viewing wire instructions.
          </p>
          <p className="text-amber-800 text-sm mb-6">
            Wire transfers cannot be reversed. This extra security step ensures that only you can
            access these sensitive banking details.
          </p>
          <a
            href="https://accounts.clerk.dev/user/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            Enable Two-Factor Authentication
          </a>
        </div>
      </div>
    );
  }

  // Load transaction and verify authorization
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  if (!transaction) {
    notFound();
  }

  if (transaction.buyerUserId !== userId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
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

  // Fetch wire instructions — this call logs the wire_instructions_viewed audit event
  let wireData;
  try {
    wireData = await getWireInstructions(id, userId);
  } catch {
    wireData = null;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <Link
        href={`/buyer/transactions/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700 inline-block"
      >
        ← Back to Transaction
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Wire Instructions</h1>

      {/* ─── Fraud Warning Banner ───────────────────────────────────────── */}
      <div role="alert" className="rounded-lg border-2 border-red-500 bg-red-50 p-5">
        <h2 className="text-base font-bold text-red-800 mb-2">WIRE FRAUD WARNING</h2>
        <p className="text-sm text-red-800 leading-relaxed">
          These wire instructions are the <strong>ONLY authoritative source</strong>. If you
          received an email, text message, or phone call with{" "}
          <strong>DIFFERENT wire instructions</strong>, DO NOT send money. Call your title company
          directly using a verified phone number you looked up independently — not a number from the
          suspicious message.
        </p>
        <p className="text-sm text-red-700 mt-2 font-medium">
          Wire transfers cannot be reversed. Verify before sending.
        </p>
      </div>

      {/* ─── Wire Instructions Content ─────────────────────────────────── */}
      {wireData ? (
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Wiring Details</h2>
            <span className="text-xs text-gray-400">
              Last updated:{" "}
              {new Date(wireData.updatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500 font-medium">Bank Name</dt>
              <dd className="text-gray-900 font-semibold text-right">{wireData.bankName}</dd>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500 font-medium">Account Name</dt>
              <dd className="text-gray-900 font-semibold text-right">{wireData.accountName}</dd>
            </div>

            {wireData.referenceNote && (
              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 font-medium">Reference / Memo</dt>
                <dd className="text-gray-900 text-right">{wireData.referenceNote}</dd>
              </div>
            )}
          </dl>

          {/* Masked numbers with reveal toggle (client component) */}
          <WireInstructionsReveal
            transactionId={id}
            maskedRouting={maskNumber(wireData.routingNumber)}
            maskedAccount={maskNumber(wireData.accountNumber)}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            Wire instructions have not been set for this transaction yet.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Contact your title company to confirm when wiring instructions will be available.
          </p>
        </div>
      )}

      {/* Last-accessed note */}
      <p className="text-xs text-gray-400 text-center">
        This page access has been recorded in the transaction audit log.
      </p>

      {/* Legal disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        This is not legal advice. Consult a licensed attorney for questions about contracts, legal
        obligations, or state-specific requirements.
      </p>
    </div>
  );
}

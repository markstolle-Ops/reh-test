/**
 * CFPB Closing Disclosure Monitor — Inngest Function
 *
 * Monitors for the closing_disclosure_sent event. If not sent and today
 * is past the mustSendBy deadline (6 business days before closing), sends
 * an alert email to both parties.
 *
 * TRID compliance applies to all mortgage-financed transactions (not cash).
 *
 * Export pattern: raw async fn for testability + inngest-wrapped fn for route.
 */

import { eq, and } from "drizzle-orm";

import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { transactionEvents } from "@/db/schema";
import { calculateClosingDisclosureDeadline } from "@/services/transaction/deadlines";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoanType = "cash" | "conventional" | "fha" | "va" | "usda";

export interface CfpbMonitorParams {
  transactionId: string;
  closingDate: Date;
  loanType: LoanType | string;
  /** Today's date — injected for testability */
  today?: Date;
}

export type CfpbMonitorReason =
  | "cash_transaction_skipped"
  | "disclosure_sent"
  | "disclosure_overdue"
  | "within_deadline";

export interface CfpbMonitorResult {
  alert: boolean;
  reason: CfpbMonitorReason;
  mustSendBy?: Date;
}

// ─── Raw function (testable) ──────────────────────────────────────────────────

/**
 * Checks whether the CFPB closing disclosure was sent on time.
 *
 * - Cash transactions: skip (TRID does not apply)
 * - Mortgage transactions: query for closing_disclosure_sent event
 *   - Found → no alert
 *   - Not found + today past mustSendBy → alert=true
 *   - Not found + today before mustSendBy → no alert yet
 */
export async function cfpbDisclosureMonitorRaw(
  params: CfpbMonitorParams
): Promise<CfpbMonitorResult> {
  const { transactionId, closingDate, loanType, today = new Date() } = params;

  // TRID does not apply to cash transactions
  if (loanType === "cash") {
    return { alert: false, reason: "cash_transaction_skipped" };
  }

  // Calculate the mustSendBy deadline (6 business days before closing)
  const { mustSendBy } = calculateClosingDisclosureDeadline(closingDate);

  // Query for a closing_disclosure_sent event on this transaction
  const events = await db
    .select()
    .from(transactionEvents)
    .where(
      and(
        eq(transactionEvents.transactionId, transactionId),
        eq(transactionEvents.eventType, "closing_disclosure_sent")
      )
    );

  if (events.length > 0) {
    return { alert: false, reason: "disclosure_sent", mustSendBy };
  }

  // No disclosure sent event found — check deadline
  if (today >= mustSendBy) {
    return { alert: true, reason: "disclosure_overdue", mustSendBy };
  }

  return { alert: false, reason: "within_deadline", mustSendBy };
}

// ─── Inngest-wrapped function ─────────────────────────────────────────────────

interface ClosingScheduledEvent {
  name: "transaction/closing.scheduled";
  data: {
    transactionId: string;
    closingDate: string; // ISO string
    loanType: LoanType | string;
    buyerEmail: string;
    sellerEmail: string;
    propertyAddress: string;
  };
}

export const cfpbDisclosureMonitor = inngest.createFunction(
  { id: "cfpb-disclosure-monitor" },
  { event: "transaction/closing.scheduled" },
  async ({ event, step }) => {
    const {
      transactionId,
      closingDate: closingDateStr,
      loanType,
      buyerEmail,
      sellerEmail,
      propertyAddress,
    } = (event as ClosingScheduledEvent).data;

    const closingDate = new Date(closingDateStr);

    // Skip cash transactions immediately
    if (loanType === "cash") {
      return { transactionId, alert: false, reason: "cash_transaction_skipped" };
    }

    // Calculate deadline
    const { mustSendBy } = calculateClosingDisclosureDeadline(closingDate);

    // Sleep until mustSendBy date to run the compliance check at the right time
    await step.sleepUntil(
      "sleep-until-must-send-by",
      mustSendBy.toISOString()
    );

    // Run the compliance check after mustSendBy has passed
    const result = await step.run("check-cfpb-compliance", async () => {
      return cfpbDisclosureMonitorRaw({
        transactionId,
        closingDate,
        loanType,
        today: new Date(),
      });
    });

    // If overdue, send alert to both parties
    if (result.alert) {
      await step.run("send-cfpb-alert", async () => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "noreply@realestatehunter.com",
          to: [buyerEmail, sellerEmail],
          subject: `ACTION REQUIRED: Closing Disclosure Not Sent — ${propertyAddress}`,
          html: [
            "<p><strong>CFPB Compliance Alert</strong></p>",
            `<p>The Closing Disclosure for <strong>${propertyAddress}</strong> has not been sent.`,
            `The lender was required to send it by <strong>${mustSendBy.toLocaleDateString("en-US", { dateStyle: "long" })}</strong>.</p>`,
            "<p>Federal law (TRID) requires buyers to receive the Closing Disclosure at least",
            "3 business days before closing. Please contact your lender immediately.</p>",
            "<p><em>This is not legal advice. Consult a licensed attorney.</em></p>",
          ].join("\n"),
        });
      });
    }

    return { transactionId, ...result };
  }
);

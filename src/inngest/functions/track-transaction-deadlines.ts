/**
 * Track Transaction Deadlines — Inngest Function
 *
 * After offer acceptance, schedules deadline rows for all steps in the
 * state workflow config that have deadlineDays defined.
 *
 * Sends 48h, 24h, and 0h reminder emails (via Resend) to both parties.
 * Reminders contain ONLY deadline info + deep link — NO wire instructions.
 *
 * Export pattern: raw async fn for testability + inngest-wrapped fn for route.
 */

import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { transactionDeadlines } from "@/db/schema";
import type { StateWorkflowConfig } from "@/workflow/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackDeadlinesParams {
  transactionId: string;
  config: StateWorkflowConfig;
  offerAcceptedDate: Date;
}

export interface TrackDeadlinesResult {
  /** Number of deadline rows inserted */
  inserted: number;
}

export interface DeadlineRow {
  id: string;
  transactionId: string;
  deadlineType: string;
  dueAt: Date;
}

// ─── Raw function (testable) ──────────────────────────────────────────────────

/**
 * Inserts one transactionDeadlines row per config step with deadlineDays.
 * dueAt = offerAcceptedDate + step.deadlineDays (calendar days, UTC).
 */
export async function trackTransactionDeadlinesRaw(
  params: TrackDeadlinesParams
): Promise<TrackDeadlinesResult> {
  const { transactionId, config, offerAcceptedDate } = params;

  const stepsWithDeadlines = config.steps.filter(
    (step) => step.deadlineDays !== undefined && step.deadlineDays !== null
  );

  for (const step of stepsWithDeadlines) {
    const dueAt = new Date(offerAcceptedDate);
    dueAt.setUTCDate(dueAt.getUTCDate() + (step.deadlineDays as number));

    const deadlineType = step.deadlineType ?? step.id;

    await db.insert(transactionDeadlines).values({
      id: crypto.randomUUID(),
      transactionId,
      deadlineType,
      dueAt,
    });
  }

  return { inserted: stepsWithDeadlines.length };
}

// ─── Inngest-wrapped function ─────────────────────────────────────────────────

interface DeadlineScheduleEvent {
  name: "transaction/deadlines.schedule";
  data: {
    transactionId: string;
    config: StateWorkflowConfig;
    offerAcceptedDate: string; // ISO string (serialized over event bus)
    buyerEmail: string;
    sellerEmail: string;
    propertyAddress: string;
  };
}

export const trackTransactionDeadlines = inngest.createFunction(
  { id: "track-transaction-deadlines" },
  { event: "transaction/deadlines.schedule" },
  async ({ event, step }) => {
    const {
      transactionId,
      config,
      offerAcceptedDate: offerAcceptedDateStr,
      buyerEmail,
      sellerEmail,
      propertyAddress,
    } = (event as DeadlineScheduleEvent).data;

    const offerAcceptedDate = new Date(offerAcceptedDateStr);

    // 1. Insert deadline rows
    const { inserted } = await step.run("insert-deadline-rows", async () => {
      return trackTransactionDeadlinesRaw({
        transactionId,
        config,
        offerAcceptedDate,
      });
    });

    // 2. Re-fetch inserted deadlines for reminder scheduling
    const stepsWithDeadlines = config.steps.filter(
      (s) => s.deadlineDays !== undefined
    );

    // 3. For each deadline step, schedule 48h / 24h / 0h reminders
    for (const step_ of stepsWithDeadlines) {
      const dueAt = new Date(offerAcceptedDate);
      dueAt.setUTCDate(dueAt.getUTCDate() + (step_.deadlineDays as number));

      const deadlineLabel = step_.label;
      const reminderIntervals: Array<{ label: string; msBeforeDue: number }> = [
        { label: "48h", msBeforeDue: 48 * 60 * 60 * 1000 },
        { label: "24h", msBeforeDue: 24 * 60 * 60 * 1000 },
        { label: "0h", msBeforeDue: 0 },
      ];

      for (const reminder of reminderIntervals) {
        const fireAt = new Date(dueAt.getTime() - reminder.msBeforeDue);
        const sleepUntil = fireAt.toISOString();

        await step.sleepUntil(
          `sleep-until-${step_.id}-${reminder.label}`,
          sleepUntil
        );

        await step.run(
          `send-reminder-${step_.id}-${reminder.label}`,
          async () => {
            // Fire-and-forget: import Resend lazily to avoid test-time issues
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);

            const subject = `[${reminder.label === "0h" ? "TODAY" : `${reminder.label} Reminder`}] ${deadlineLabel} — ${propertyAddress}`;
            const body = [
              `This is a reminder that your <strong>${deadlineLabel}</strong> deadline is`,
              reminder.label === "0h" ? "TODAY" : `in ${reminder.label}`,
              `(${dueAt.toLocaleDateString("en-US", { dateStyle: "long" })}).`,
              "",
              "View your transaction dashboard for full details and next steps.",
              "",
              "<strong>IMPORTANT: Never send wire transfer instructions via email.</strong>",
              "All payment instructions are only available in your secure transaction dashboard.",
            ].join("\n");

            await resend.emails.send({
              from: "noreply@realestatehunter.com",
              to: [buyerEmail, sellerEmail],
              subject,
              html: body.replace(/\n/g, "<br>"),
            });
          }
        );
      }
    }

    return { transactionId, inserted };
  }
);

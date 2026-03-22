import { sql } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { getRecommendations } from "@/services/matching/listing-recommendations";
import type { NormalizedListing } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SendEmail = (opts: {
  to: string;
  subject: string;
  text: string;
}) => Promise<void>;

// ─── Default email sender ─────────────────────────────────────────────────────

/**
 * Default email sender using Resend.
 * Extracted for testability — tests inject mock without needing `new Resend()`.
 */
async function defaultSendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "RealEstateHunter <alerts@realestatehunter.com>",
    to: [opts.to],
    subject: opts.subject,
    text: opts.text,
  });
}

// ─── Raw functions (exported for testability) ─────────────────────────────────

/**
 * Load all users with buyer events in the past 30 days.
 * Returns user IDs for fan-out.
 */
export async function getActiveBuyerUserIds(): Promise<string[]> {
  const rows = (await db.execute(sql`
    SELECT DISTINCT user_id
    FROM buyer_events
    WHERE occurred_at > NOW() - INTERVAL '30 days'
  `)) as Array<{ user_id: string }>;

  return rows.map((r) => r.user_id);
}

/**
 * Send a personalized recommendation email to a single buyer.
 * Calls getRecommendations, formats top 5 listings, sends via Resend.
 *
 * sendEmail is injected for testability — defaults to Resend impl.
 */
export async function sendRecommendationEmailRaw(
  userId: string,
  userEmail: string,
  sendEmail: SendEmail = defaultSendEmail
): Promise<void> {
  const recommendations = await getRecommendations(userId);

  if (recommendations.length === 0) return;

  const top5 = recommendations.slice(0, 5);
  const listingLines = top5
    .map(
      (l: NormalizedListing) =>
        `• $${(l.price / 100).toLocaleString()} — ${l.bedrooms ?? "?"}BR, ${l.city}, ${l.state} ${l.zip}`
    )
    .join("\n");

  await sendEmail({
    to: userEmail,
    subject: `${recommendations.length} listing${recommendations.length !== 1 ? "s" : ""} matched to your preferences`,
    text: [
      `We found ${recommendations.length} listing${recommendations.length !== 1 ? "s" : ""} that match your recent activity:`,
      "",
      listingLines,
      recommendations.length > 5
        ? `\n...and ${recommendations.length - 5} more.`
        : "",
      "",
      "Visit RealEstateHunter to view all results.",
    ]
      .join("\n")
      .trim(),
  });
}

// ─── Inngest functions ────────────────────────────────────────────────────────

/**
 * Daily cron at 10 AM UTC — loads buyers with recent activity and fans out
 * per-user recommendation emails. Offset 1 hour from saved-search cron (9 AM).
 *
 * step.sendEvent must be called at the top-level step scope, NOT inside
 * a step.run callback — Inngest SDK silently drops events from nested contexts.
 */
export const recommendListingsCron = inngest.createFunction(
  { id: "recommend-listings-cron" },
  { cron: "0 10 * * *" },
  async ({ step }) => {
    // Step 1: Load active buyer user IDs
    const userIds = await step.run("load-active-buyers", async () => {
      return getActiveBuyerUserIds();
    });

    // Step 2: Fan out events at the top-level step scope
    if (userIds.length > 0) {
      await step.sendEvent(
        "fan-out-recommendations",
        userIds.map((userId) => ({
          name: "matching/recommendation.send",
          data: { userId },
        }))
      );
    }
  }
);

/**
 * Per-user recommendation email — triggered by 'matching/recommendation.send'
 * events fanned out by recommendListingsCron.
 *
 * Resolves userId to email via Clerk backend API before sending.
 */
export const sendRecommendationEmail = inngest.createFunction(
  { id: "send-recommendation-email" },
  { event: "matching/recommendation.send" },
  async ({ event, step }) => {
    await step.run("resolve-email-and-send", async () => {
      const { userId } = event.data as { userId: string };

      // Resolve Clerk user ID to email address
      const { clerkClient } = await import("@clerk/nextjs/server");
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const email = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress;

      if (!email) return;

      await sendRecommendationEmailRaw(userId, email);
    });
  }
);

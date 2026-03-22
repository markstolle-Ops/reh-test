import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { searchListings } from "@/services/search/listings-search";
import type { SearchParams } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedSearchRecord {
  id: string;
  userId: string;
  name: string;
  filters: string; // JSON blob of SearchParams
  active: boolean;
  lastAlertSentAt: Date | null;
  createdAt: Date;
}

type SendEvent = (event: {
  name: string;
  data: Record<string, unknown>;
}) => Promise<void>;

type SendEmail = (opts: {
  to: string;
  subject: string;
  text: string;
}) => Promise<void>;

// ─── Raw functions (exported for testability) ─────────────────────────────────

/**
 * Load all active saved searches and fan out one "search/alert.check"
 * event per search. Accepts a sendEvent callback so tests can inject mocks.
 */
export async function matchSavedSearchesRaw(
  sendEvent: SendEvent
): Promise<void> {
  const searches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.active, true));

  for (const search of searches) {
    await sendEvent({
      name: "search/alert.check",
      data: {
        savedSearchId: search.id,
        userId: search.userId,
        filters: search.filters,
        lastAlertSentAt: search.lastAlertSentAt?.toISOString() ?? null,
        name: search.name,
      },
    });
  }
}

/**
 * For a single saved search, re-run the stored filters, find listings newer
 * than lastAlertSentAt, and send a Resend email if any exist.
 *
 * Updates lastAlertSentAt after a successful send.
 */
/**
 * Default email sender using Resend.
 * Extracted so tests can inject a mock without needing `new Resend()`.
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

export async function checkSavedSearchAlertRaw(
  search: SavedSearchRecord,
  sendEmail: SendEmail = defaultSendEmail
): Promise<void> {
  const filters: SearchParams = JSON.parse(search.filters);
  const { results } = await searchListings(filters);

  // Filter to only listings created after the last alert was sent
  const cutoff = search.lastAlertSentAt ? new Date(search.lastAlertSentAt) : null;
  const newListings = cutoff
    ? results.filter((l) => new Date(l.createdAt) > cutoff)
    : results;

  if (newListings.length === 0) return;

  const top5 = newListings.slice(0, 5);
  const listingLines = top5
    .map(
      (l) =>
        `• $${(l.price / 100).toLocaleString()} — ${l.city}, ${l.state} ${l.zip}`
    )
    .join("\n");

  await sendEmail({
    to: search.userId, // userId is Clerk ID; in production, resolve to email via Clerk
    subject: `New listings matching your search '${search.name}'`,
    text: [
      `We found ${newListings.length} new listing${newListings.length !== 1 ? "s" : ""} matching your saved search "${search.name}":`,
      "",
      listingLines,
      newListings.length > 5 ? `\n...and ${newListings.length - 5} more.` : "",
      "",
      "Visit RealEstateHunter to view all results.",
    ]
      .join("\n")
      .trim(),
  });

  // Update lastAlertSentAt
  await db
    .update(savedSearches)
    .set({ lastAlertSentAt: new Date() })
    .where(eq(savedSearches.id, search.id));
}

// ─── Inngest functions ────────────────────────────────────────────────────────

/**
 * Daily cron at 9 AM UTC — loads all active saved searches and fans out
 * per-search alert check events.
 */
export const matchSavedSearchesCron = inngest.createFunction(
  { id: "match-saved-searches-cron" },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    await step.run("load-and-fan-out", async () => {
      await matchSavedSearchesRaw(
        async (event) => { await step.sendEvent("fan-out", event); }
      );
    });
  }
);

/**
 * Per-search alert check — triggered by "search/alert.check" events
 * fanned out by matchSavedSearchesCron.
 */
export const checkSavedSearchAlert = inngest.createFunction(
  { id: "check-saved-search-alert" },
  { event: "search/alert.check" },
  async ({ event, step }) => {
    await step.run("check-and-send-alert", async () => {
      const { savedSearchId, userId, filters, lastAlertSentAt, name } =
        event.data as {
          savedSearchId: string;
          userId: string;
          filters: string;
          lastAlertSentAt: string | null;
          name: string;
        };

      const search: SavedSearchRecord = {
        id: savedSearchId,
        userId,
        name,
        filters,
        active: true,
        lastAlertSentAt: lastAlertSentAt ? new Date(lastAlertSentAt) : null,
        createdAt: new Date(),
      };

      await checkSavedSearchAlertRaw(search);
    });
  }
);

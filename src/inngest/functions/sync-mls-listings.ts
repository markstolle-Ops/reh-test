import { inngest } from "@/inngest/client";
import { syncMlsListings } from "@/services/search/mls-client";

/**
 * Raw async function for testability — exported separately so tests can
 * call it without the Inngest wrapper.
 * Pattern: same as generate-description.ts (Phase 2 decision).
 */
export async function syncMlsListingsRaw(): Promise<void> {
  await syncMlsListings();
}

/**
 * Inngest cron function: sync SimplyRETS MLS listings every 4 hours.
 *
 * NOTE: Never call SimplyRETS in the hot path of a buyer search request.
 * This cron job populates the local mlsListings table; buyer search queries
 * only the local DB (Anti-Pattern: Pitfall 3 from 03-RESEARCH.md).
 */
export const syncMlsListingsCron = inngest.createFunction(
  { id: "sync-mls-listings-cron" },
  { cron: "0 */4 * * *" }, // every 4 hours
  async ({ step }) => {
    await step.run("sync-mls-listings", async () => {
      await syncMlsListingsRaw();
    });
  }
);

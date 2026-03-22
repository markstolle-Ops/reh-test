import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { cfpbDisclosureMonitor } from "@/inngest/functions/cfpb-disclosure-monitor";
import { dispatchAgentFn } from "@/inngest/functions/dispatch-agent";
import { embedListingFn } from "@/inngest/functions/embed-listing";
import { generateListingDescriptionFn } from "@/inngest/functions/generate-description";
import {
  checkSavedSearchAlert,
  matchSavedSearchesCron,
} from "@/inngest/functions/match-saved-searches";
import {
  recommendListingsCron,
  sendRecommendationEmail,
} from "@/inngest/functions/recommend-listings";
import { syncMlsListingsCron } from "@/inngest/functions/sync-mls-listings";
import { syncResoBoardsCron } from "@/inngest/functions/sync-reso-boards";
import { syndicateToMls } from "@/inngest/functions/syndicate-to-mls";
import { trackTransactionDeadlines } from "@/inngest/functions/track-transaction-deadlines";

/**
 * Inngest serve route.
 * Registers all Inngest functions for async job processing.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateListingDescriptionFn,
    syncMlsListingsCron,
    matchSavedSearchesCron,
    checkSavedSearchAlert,
    syndicateToMls,
    trackTransactionDeadlines,
    cfpbDisclosureMonitor,
    dispatchAgentFn,
    embedListingFn,
    recommendListingsCron,
    sendRecommendationEmail,
    syncResoBoardsCron,
  ],
});

/**
 * Inngest cron function: RESO Web API delta sync for all active boards.
 *
 * Runs every 30 minutes, iterates all active resoBoards, and performs
 * incremental delta sync using ModificationTimestamp. Per-board error
 * isolation ensures one failing board does not block others.
 *
 * Phase 6 (MLS-04): Direct RESO integration for high-volume MLS boards.
 */

import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { resoBoards, mlsListings } from "@/db/schema";
import { fetchResoDelta } from "@/services/mls/reso-client";
import { normalizeResoListing } from "@/services/mls/reso-normalizer";
import type { ResoBoardConfig } from "@/services/mls/reso-client";

// ─── Raw function (exported for testability) ──────────────────────────────────

/**
 * Core sync logic — exported separately so tests can call it without the
 * Inngest wrapper. Pattern consistent with Phase 4 cfpb-disclosure-monitor.ts.
 */
export async function syncResoBoardsRaw(): Promise<void> {
  // Load all active boards
  const boards = await db
    .select()
    .from(resoBoards)
    .where(eq(resoBoards.active, true));

  // Sync each board independently — one failure does not block others
  for (const board of boards) {
    try {
      const boardConfig: ResoBoardConfig = {
        boardId: board.id,
        apiUrl: board.apiUrl,
        apiToken: board.apiToken,
        name: board.name,
      };

      // Delta sync: fetch only listings modified since last sync
      const since = board.lastSyncedAt ?? new Date(0);
      const rawListings = await fetchResoDelta(boardConfig, since);

      // Normalize and upsert each listing
      for (const raw of rawListings) {
        const normalized = normalizeResoListing(raw, board.id);
        await db
          .insert(mlsListings)
          .values({
            id: normalized.id,
            mlsSource: normalized.mlsSource,
            rawData: normalized.rawData,
            streetAddress: normalized.streetAddress,
            city: normalized.city,
            state: normalized.state,
            zip: normalized.zip,
            price: normalized.price,
            bedrooms: normalized.bedrooms,
            bathrooms: normalized.bathrooms != null ? String(normalized.bathrooms) : null,
            sqft: normalized.sqft,
            propertyType: normalized.propertyType,
            status: normalized.status,
            lat: normalized.lat != null ? String(normalized.lat) : null,
            lng: normalized.lng != null ? String(normalized.lng) : null,
            photoUrls: normalized.photoUrls,
            lastSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: mlsListings.id,
            set: {
              mlsSource: normalized.mlsSource,
              rawData: normalized.rawData,
              streetAddress: normalized.streetAddress,
              city: normalized.city,
              state: normalized.state,
              zip: normalized.zip,
              price: normalized.price,
              bedrooms: normalized.bedrooms,
              bathrooms: normalized.bathrooms != null ? String(normalized.bathrooms) : null,
              sqft: normalized.sqft,
              propertyType: normalized.propertyType,
              status: normalized.status,
              lat: normalized.lat != null ? String(normalized.lat) : null,
              lng: normalized.lng != null ? String(normalized.lng) : null,
              photoUrls: normalized.photoUrls,
              lastSyncedAt: new Date(),
            },
          });
      }

      // Mark board sync complete: clear error, update lastSyncedAt
      await db
        .update(resoBoards)
        .set({
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(resoBoards.id, board.id));
    } catch (err) {
      // Per-board error isolation — log error to board row, continue to next
      const errorMessage = err instanceof Error ? err.message : String(err);
      await db
        .update(resoBoards)
        .set({ lastSyncError: errorMessage })
        .where(eq(resoBoards.id, board.id));
    }
  }
}

// ─── Inngest cron function ────────────────────────────────────────────────────

/**
 * RESO board delta sync cron — runs every 30 minutes.
 * Each active board runs independently; failures are recorded per board.
 */
export const syncResoBoardsCron = inngest.createFunction(
  { id: "sync-reso-boards-cron" },
  { cron: "0/30 * * * *" }, // every 30 minutes
  async ({ step }) => {
    await step.run("sync-reso-boards", async () => {
      await syncResoBoardsRaw();
    });
  }
);

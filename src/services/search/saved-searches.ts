import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import type { SearchParams } from "@/types";

/**
 * Insert a new saved search record.
 *
 * Filters are stored as a JSON string — parsed back when running alerts.
 */
export async function createSavedSearch(userId: string, name: string, filters: SearchParams) {
  const id = crypto.randomUUID();
  const [record] = await db
    .insert(savedSearches)
    .values({
      id,
      userId,
      name,
      filters: JSON.stringify(filters),
      active: true,
    })
    .returning();
  return record;
}

/**
 * Return all active saved searches for a given user.
 */
export async function getSavedSearches(userId: string) {
  return db
    .select()
    .from(savedSearches)
    .where(and(eq(savedSearches.userId, userId), eq(savedSearches.active, true)));
}

/**
 * Delete a saved search, but only if it belongs to the requesting user.
 */
export async function deleteSavedSearch(userId: string, id: string) {
  await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}

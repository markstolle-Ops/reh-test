import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { disclosureForms } from "@/db/schema";
import { getFormSchemaForState } from "./form-schema";

export interface DisclosureFormRecord {
  id: string;
  userId: string;
  listingId: string;
  state: string;
  formSchemaId: string;
  answers: Record<string, unknown>;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
}

function parseRecord(row: {
  id: string;
  userId: string;
  listingId: string;
  state: string;
  formSchemaId: string;
  answers: string;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
}): DisclosureFormRecord {
  return {
    ...row,
    answers: JSON.parse(row.answers) as Record<string, unknown>,
  };
}

/**
 * Creates a new disclosure form for the given user, listing, and state.
 * Initialises answers as an empty JSON object.
 */
export async function createDisclosureForm(
  userId: string,
  listingId: string,
  state: string
): Promise<DisclosureFormRecord> {
  const schema = getFormSchemaForState(state);
  const formSchemaId = schema ? `${state.toLowerCase()}-${schema.version}` : `${state.toLowerCase()}-1.0`;

  const id = crypto.randomUUID();

  const [row] = await db
    .insert(disclosureForms)
    .values({
      id,
      userId,
      listingId,
      state,
      formSchemaId,
      answers: JSON.stringify({}),
      status: "draft",
    })
    .returning();

  return parseRecord(row);
}

/**
 * Updates the answers for an existing disclosure form.
 * Enforces userId ownership.
 */
export async function updateDisclosureForm(
  userId: string,
  formId: string,
  answers: Record<string, unknown>
): Promise<DisclosureFormRecord | null> {
  const [row] = await db
    .update(disclosureForms)
    .set({ answers: JSON.stringify(answers) })
    .where(and(eq(disclosureForms.id, formId), eq(disclosureForms.userId, userId)))
    .returning();

  if (!row) return null;
  return parseRecord(row);
}

/**
 * Marks a disclosure form as complete and records the completedAt timestamp.
 * Enforces userId ownership.
 */
export async function completeDisclosureForm(
  userId: string,
  formId: string
): Promise<DisclosureFormRecord | null> {
  const [row] = await db
    .update(disclosureForms)
    .set({ status: "complete", completedAt: new Date() })
    .where(and(eq(disclosureForms.id, formId), eq(disclosureForms.userId, userId)))
    .returning();

  if (!row) return null;
  return parseRecord(row);
}

/**
 * Retrieves a disclosure form by ID with answers parsed from JSON.
 * Returns null if not found.
 */
export async function getDisclosureForm(
  formId: string
): Promise<DisclosureFormRecord | null> {
  const rows = await db
    .select()
    .from(disclosureForms)
    .where(eq(disclosureForms.id, formId));

  if (!rows[0]) return null;
  return parseRecord(rows[0]);
}

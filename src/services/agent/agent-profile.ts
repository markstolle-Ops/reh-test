import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { agentProfiles } from "@/db/schema";
import { AGENT_FOR_HIRE_FEE_CENTS } from "@/lib/constants";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export interface CreateAgentProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  licenseStates: string[];
  licenseNumber: string;
}

export interface UpdateAgentProfileData {
  bio?: string;
  licenseStates?: string[];
  availableForDispatch?: boolean;
}

export type AgentProfile = typeof agentProfiles.$inferSelect;

/**
 * Create a new agent profile and provision a Stripe Express account.
 * The Stripe account ID is stored on the profile for future payout routing.
 */
export async function createAgentProfile(data: CreateAgentProfileData): Promise<AgentProfile> {
  const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Insert DB row first with placeholder Stripe ID to avoid orphaned Stripe accounts
  const [profile] = await db
    .insert(agentProfiles)
    .values({
      id,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      licenseStates: data.licenseStates,
      licenseNumber: data.licenseNumber,
      stripeAccountId: "pending",
      stripeOnboardingComplete: false,
      verified: false,
      availableForDispatch: false,
      flatFeeCents: AGENT_FOR_HIRE_FEE_CENTS,
      bio: null,
    })
    .returning();

  // Now create Stripe Express account — if this fails, the DB row exists
  // but with stripeAccountId="pending", which can be retried
  const stripe = getStripe();
  const stripeAccount = await stripe.accounts.create({ type: "express" });

  // Update the profile with the real Stripe account ID
  const [updated] = await db
    .update(agentProfiles)
    .set({ stripeAccountId: stripeAccount.id, updatedAt: new Date() })
    .where(eq(agentProfiles.id, id))
    .returning();

  return updated;
}

/**
 * Retrieve an agent profile for a given Clerk user ID.
 * Returns null if no profile exists.
 */
export async function getAgentProfile(userId: string): Promise<AgentProfile | null> {
  const rows = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId));

  return rows[0] ?? null;
}

/**
 * Update mutable fields on an agent profile.
 * Only bio, licenseStates, and availableForDispatch may be changed after creation.
 */
export async function updateAgentProfile(
  agentId: string,
  data: UpdateAgentProfileData,
): Promise<AgentProfile> {
  const updateData: Partial<AgentProfile> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.licenseStates !== undefined) updateData.licenseStates = data.licenseStates;
  if (data.availableForDispatch !== undefined)
    updateData.availableForDispatch = data.availableForDispatch;

  const [updated] = await db
    .update(agentProfiles)
    .set(updateData)
    .where(eq(agentProfiles.id, agentId))
    .returning();

  return updated;
}

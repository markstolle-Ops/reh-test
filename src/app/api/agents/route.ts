import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { agentProfiles } from "@/db/schema";
import { createAgentProfile } from "@/services/agent/agent-profile";

const createAgentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  licenseStates: z.array(z.string().length(2)).min(1),
  licenseNumber: z.string().min(1),
});

/**
 * GET /api/agents
 *
 * List agents. Optional ?state=XX query param to filter by licensed state.
 * Public endpoint — returns safe public fields only (no stripeAccountId).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");

  const rows = await db
    .select({
      id: agentProfiles.id,
      firstName: agentProfiles.firstName,
      lastName: agentProfiles.lastName,
      licenseStates: agentProfiles.licenseStates,
      verified: agentProfiles.verified,
      flatFeeCents: agentProfiles.flatFeeCents,
    })
    .from(agentProfiles);

  // Filter by state client-side (array contains check)
  const agents = state
    ? rows.filter((a) => a.licenseStates.includes(state))
    : rows;

  // Return lastName as initial only for privacy
  return NextResponse.json(
    agents.map((a) => ({
      ...a,
      lastName: a.lastName.charAt(0) + ".",
    }))
  );
}

/**
 * POST /api/agents
 *
 * Create a new agent profile. Requires Clerk auth.
 * Provisions Stripe Express account and returns 201 with profile.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  // Check if agent profile already exists
  const existing = await db
    .select({ id: agentProfiles.id })
    .from(agentProfiles)
    .where(eq(agentProfiles.userId, userId));

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Agent profile already exists" },
      { status: 409 }
    );
  }

  const profile = await createAgentProfile({
    userId,
    ...parsed.data,
  });

  return NextResponse.json(profile, { status: 201 });
}

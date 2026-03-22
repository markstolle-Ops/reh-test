import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { agentProfiles } from "@/db/schema";
import { updateAgentProfile } from "@/services/agent/agent-profile";

const updateAgentSchema = z.object({
  bio: z.string().optional(),
  licenseStates: z.array(z.string().length(2)).optional(),
  availableForDispatch: z.boolean().optional(),
});

/**
 * GET /api/agents/[id]
 *
 * Return public profile for a given agent ID.
 * Excludes stripeAccountId and internal fields.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await db
    .select({
      id: agentProfiles.id,
      firstName: agentProfiles.firstName,
      lastName: agentProfiles.lastName,
      licenseStates: agentProfiles.licenseStates,
      licenseNumber: agentProfiles.licenseNumber,
      verified: agentProfiles.verified,
      availableForDispatch: agentProfiles.availableForDispatch,
      flatFeeCents: agentProfiles.flatFeeCents,
      bio: agentProfiles.bio,
      stripeOnboardingComplete: agentProfiles.stripeOnboardingComplete,
      createdAt: agentProfiles.createdAt,
    })
    .from(agentProfiles)
    .where(eq(agentProfiles.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

/**
 * PATCH /api/agents/[id]
 *
 * Update mutable agent profile fields. Auth required — must be profile owner.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const rows = await db
    .select({ id: agentProfiles.id, userId: agentProfiles.userId })
    .from(agentProfiles)
    .where(eq(agentProfiles.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (rows[0].userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const updated = await updateAgentProfile(id, parsed.data);

  return NextResponse.json(updated);
}

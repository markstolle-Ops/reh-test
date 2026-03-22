import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agentProfiles } from "@/db/schema";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * POST /api/agents/onboarding
 *
 * Generate a Stripe Connect Express onboarding link for the authenticated agent.
 * Returns { url } for redirecting the agent to complete Stripe onboarding.
 *
 * Returns 400 if the agent has already completed onboarding.
 */
export async function POST(_req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: agentProfiles.id,
      stripeAccountId: agentProfiles.stripeAccountId,
      stripeOnboardingComplete: agentProfiles.stripeOnboardingComplete,
    })
    .from(agentProfiles)
    .where(eq(agentProfiles.userId, userId));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
  }

  const agent = rows[0];

  if (agent.stripeOnboardingComplete) {
    return NextResponse.json(
      { error: "Stripe onboarding already complete" },
      { status: 400 }
    );
  }

  if (!agent.stripeAccountId) {
    return NextResponse.json(
      { error: "Stripe account not provisioned" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const stripe = getStripe();
  const accountLink = await stripe.accountLinks.create({
    account: agent.stripeAccountId,
    refresh_url: `${baseUrl}/agent/onboarding/refresh`,
    return_url: `${baseUrl}/agent/onboarding/complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

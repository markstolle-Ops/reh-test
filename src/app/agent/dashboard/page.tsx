"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAgentProfile } from "@/services/agent/agent-profile";
import { AgentProfileForm } from "./agent-profile-form";

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function AgentDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [user, profile] = await Promise.all([
    currentUser(),
    getAgentProfile(userId),
  ]);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.emailAddresses?.[0]?.emailAddress ?? "Agent";

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Agent Dashboard
        </h1>
        <p className="text-gray-500 mb-8">Welcome, {displayName}</p>

        <div className="rounded-lg border bg-white p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Become an Agent
          </h2>
          <p className="text-gray-500 mb-6">
            Join the platform as a licensed real estate agent. Earn a flat{" "}
            <strong>$500 fee</strong> per buyer you represent.
          </p>
          <AgentProfileForm />
        </div>
      </div>
    );
  }

  const verificationBadge = profile.verified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
      <span className="h-2 w-2 rounded-full bg-yellow-500" />
      Verification Pending
    </span>
  );

  const stripeStatus = profile.stripeOnboardingComplete ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      Payouts Enabled
    </span>
  ) : (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        Setup Required
      </span>
      <a
        href="/agent/onboarding/start"
        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
      >
        Complete Stripe Onboarding
      </a>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="mt-1 text-gray-500">Welcome back, {displayName}</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Profile
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </p>
              <p className="mt-1 text-gray-900">
                {profile.firstName} {profile.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                License Number
              </p>
              <p className="mt-1 text-gray-900">{profile.licenseNumber}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Licensed States
              </p>
              <p className="mt-1 text-gray-900">
                {profile.licenseStates.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Flat Fee
              </p>
              <p className="mt-1 text-gray-900">
                {formatCents(profile.flatFeeCents)} per transaction
              </p>
            </div>
            {profile.bio && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Bio
                </p>
                <p className="mt-1 text-gray-900">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Verification Status */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              License Verification
            </h2>
            {verificationBadge}
            {!profile.verified && (
              <p className="mt-3 text-sm text-gray-500">
                Your license is pending verification. Contact support to complete
                manual verification or provide ARELLO credentials.
              </p>
            )}
          </div>

          {/* Stripe Onboarding Status */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Payout Setup
            </h2>
            {stripeStatus}
            {!profile.stripeOnboardingComplete && (
              <p className="mt-3 text-sm text-gray-500">
                Complete Stripe onboarding to receive your{" "}
                {formatCents(profile.flatFeeCents)} fee when a transaction closes.
              </p>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Available for Dispatch
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                When enabled, buyers in your licensed states can request your
                services.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                profile.availableForDispatch
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  profile.availableForDispatch ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {profile.availableForDispatch ? "Available" : "Unavailable"}
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            To toggle availability, use PATCH /api/agents/{profile.id} with{" "}
            <code>availableForDispatch</code>.
          </p>
        </div>

        {/* Incoming Requests — placeholder for Plan 02 */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Incoming Requests
          </h2>
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <p className="text-gray-400 text-sm">
                No requests yet. Buyer dispatch is enabled in the next phase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

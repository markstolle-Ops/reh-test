import Link from "next/link";

/**
 * /agent/onboarding/refresh
 *
 * Stripe Connect onboarding refresh URL.
 * Shown when the onboarding link expires and needs to be refreshed.
 */
export default function AgentOnboardingRefreshPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md text-center px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Onboarding Link Expired
        </h1>
        <p className="text-gray-500 mb-6">
          Your Stripe onboarding link has expired. Please start the onboarding process again.
        </p>
        <Link
          href="/agent/onboarding/start"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Restart Onboarding
        </Link>
      </div>
    </div>
  );
}

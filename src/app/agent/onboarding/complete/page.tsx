import Link from "next/link";

/**
 * /agent/onboarding/complete
 *
 * Stripe Connect onboarding return URL. Shown after agent completes onboarding.
 * Note: Stripe Connect webhooks update stripeOnboardingComplete in the DB.
 */
export default function AgentOnboardingCompletePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md text-center px-6">
        <div className="mb-4 text-green-500">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Onboarding Complete
        </h1>
        <p className="text-gray-500 mb-6">
          Your Stripe account has been set up. You can now receive payouts when transactions close.
        </p>
        <Link
          href="/agent/dashboard"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

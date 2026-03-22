"use client";

import { useEffect, useState } from "react";

/**
 * /agent/onboarding/start
 *
 * Fetches a Stripe Connect onboarding link and redirects the agent.
 * This page is a thin redirect shell — the real work is POST /api/agents/onboarding.
 */
export default function AgentOnboardingStartPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startOnboarding() {
      try {
        const res = await fetch("/api/agents/onboarding", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to start onboarding.");
          return;
        }

        window.location.href = data.url;
      } catch {
        setError("Network error. Please try again.");
      }
    }

    startOnboarding();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center px-6">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <a href="/agent/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-500 text-sm">Redirecting to Stripe onboarding...</p>
      </div>
    </div>
  );
}

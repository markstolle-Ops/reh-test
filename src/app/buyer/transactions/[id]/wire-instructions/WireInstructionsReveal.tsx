"use client";

/**
 * WireInstructionsReveal
 *
 * Client component. Shows masked routing/account numbers by default.
 * User clicks "Reveal full numbers" to fetch the unmasked values from the API
 * (which triggers a second audit log entry).
 */

import { useState } from "react";

interface Props {
  transactionId: string;
  maskedRouting: string;
  maskedAccount: string;
}

export default function WireInstructionsReveal({
  transactionId,
  maskedRouting,
  maskedAccount,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [fullRouting, setFullRouting] = useState<string | null>(null);
  const [fullAccount, setFullAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReveal() {
    if (revealed) {
      setRevealed(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/wire-instructions/${transactionId}?reveal=true`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      const data = await res.json();
      setFullRouting(data.wireInstructions.routingNumber);
      setFullAccount(data.wireInstructions.accountNumber);
      setRevealed(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reveal numbers"
      );
    } finally {
      setLoading(false);
    }
  }

  const displayRouting = revealed && fullRouting ? fullRouting : maskedRouting;
  const displayAccount = revealed && fullAccount ? fullAccount : maskedAccount;

  return (
    <div className="space-y-3 border-t border-gray-100 pt-3">
      <div className="flex items-start justify-between py-2 border-b border-gray-100 text-sm">
        <dt className="text-gray-500 font-medium">Routing Number</dt>
        <dd className="text-gray-900 font-mono font-semibold text-right">
          {displayRouting}
        </dd>
      </div>

      <div className="flex items-start justify-between py-2 border-b border-gray-100 text-sm">
        <dt className="text-gray-500 font-medium">Account Number</dt>
        <dd className="text-gray-900 font-mono font-semibold text-right">
          {displayAccount}
        </dd>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <button
        onClick={handleReveal}
        disabled={loading}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading
          ? "Loading..."
          : revealed
          ? "Hide full numbers"
          : "Reveal full numbers"}
      </button>

      {revealed && (
        <p className="text-xs text-amber-700 text-center">
          Full numbers are now visible. This access has been logged.
          Do not screenshot or share these numbers.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  transactionId: string;
}

export function OfferResponseButtons({ transactionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  async function handleAction(eventType: string, metadata?: Record<string, unknown>) {
    setLoading(eventType);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, metadata }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        alert(err.error || "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={() => handleAction("offer_accepted")}
          disabled={loading !== null}
          className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "offer_accepted" ? "Accepting..." : "Accept Offer"}
        </button>
        <button
          onClick={() => setShowCounter(!showCounter)}
          disabled={loading !== null}
          className="px-4 py-2 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Counter Offer
        </button>
        <button
          onClick={() => handleAction("offer_rejected")}
          disabled={loading !== null}
          className="px-4 py-2 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "offer_rejected" ? "Rejecting..." : "Reject Offer"}
        </button>
      </div>

      {showCounter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">$</span>
          <input
            type="number"
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            placeholder="Counter price"
            className="px-3 py-2 text-sm border rounded-md w-40"
          />
          <button
            onClick={() => {
              const cents = Math.round(parseFloat(counterPrice) * 100);
              if (!cents || cents <= 0) {
                alert("Enter a valid counter price");
                return;
              }
              handleAction("counter_submitted", { counterPriceCents: cents });
            }}
            disabled={loading !== null}
            className="px-4 py-2 text-sm font-medium rounded-md bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading === "counter_submitted" ? "Submitting..." : "Submit Counter"}
          </button>
        </div>
      )}
    </div>
  );
}

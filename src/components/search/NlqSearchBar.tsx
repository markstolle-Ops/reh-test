"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * NlqSearchBar — Natural Language Query search input for buyer search page.
 *
 * Allows buyers to describe what they want in plain English instead of
 * manually configuring filters. On submit, navigates to /buyer/search
 * with the nlq query parameter, which triggers GPT-4o parsing in the
 * search API.
 *
 * Explicitly scoped to objective property features only — school quality,
 * walkability, and demographic signals will not produce results per
 * Fair Housing Act compliance.
 */
export function NlqSearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/buyer/search?nlq=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          {/* Magnifying glass icon */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: 3BR house in Phoenix under $350K"
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
        >
          Search
        </button>
      </form>
      <p className="mt-1.5 text-xs text-gray-400">
        AI interprets your search — results may not match exactly.
      </p>
    </div>
  );
}

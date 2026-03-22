"use client";

import { useState } from "react";
import type { ListingStatus } from "@/types";

// ─── Valid Transitions (must mirror update service) ───────────────────────────

const VALID_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ["active"],
  active: ["pending", "sold"],
  pending: ["active", "sold"],
  sold: [],
};

const STATUS_STYLES: Record<ListingStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  active: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  sold: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  active: "Active",
  pending: "Pending",
  sold: "Sold",
};

const TRANSITION_LABELS: Record<ListingStatus, string> = {
  draft: "Save as Draft",
  active: "Mark Active",
  pending: "Mark Pending",
  sold: "Mark Sold",
};

interface StatusBadgeProps {
  listingId: string;
  status: ListingStatus;
  onStatusChange?: (newStatus: ListingStatus) => Promise<void> | void;
}

export function StatusBadge({
  listingId,
  status,
  onStatusChange,
}: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const transitions = VALID_TRANSITIONS[status];

  async function handleTransition(newStatus: ListingStatus) {
    setOpen(false);
    setIsPending(true);
    try {
      if (onStatusChange) {
        await onStatusChange(newStatus);
      } else {
        // Default: call the API directly
        const res = await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to update status");
        }
      }
    } catch (error) {
      console.error("Status transition failed:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={isPending || transitions.length === 0}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${STATUS_STYLES[status]} disabled:opacity-60 ${transitions.length > 0 ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        aria-label={`Listing status: ${STATUS_LABELS[status]}${transitions.length > 0 ? ". Click to change." : ""}`}
      >
        {isPending ? "Updating..." : STATUS_LABELS[status]}
        {transitions.length > 0 && !isPending && (
          <svg
            className="size-3"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        )}
      </button>

      {open && transitions.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border bg-popover shadow-md">
            {transitions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTransition(t)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground`}
              >
                <span
                  className={`inline-block size-2 rounded-full ${STATUS_STYLES[t].split(" ")[0]}`}
                />
                {TRANSITION_LABELS[t]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { NormalizedListing } from "@/types";

interface ListingCardProps {
  listing: NormalizedListing;
  saved?: boolean;
  onToggleSave?: () => void;
}

/**
 * ListingCard
 *
 * Displays a single listing as a photo thumbnail card with key property details.
 * Platform listings link to /listings/[id]. MLS listings show an "MLS" badge (no detail page yet).
 * Heart icon button toggles save/unsave state via the onToggleSave callback.
 */
export function ListingCard({ listing, saved = false, onToggleSave }: ListingCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(listing.price / 100); // DB stores cents

  const cardContent = (
    <div className="rounded-lg border bg-white shadow hover:shadow-md transition overflow-hidden h-full flex flex-col">
      {/* Photo */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {listing.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photoUrl}
            alt={`${listing.city}, ${listing.state}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {listing.source === "mls" && (
            <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
              MLS
            </span>
          )}
          <span className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700 shadow capitalize">
            {listing.propertyType.replace(/_/g, " ")}
          </span>
        </div>

        {/* Save / Heart button */}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave();
            }}
            aria-label={saved ? "Unsave listing" : "Save listing"}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white transition"
          >
            {saved ? (
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400 hover:text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xl font-bold text-gray-900">{formattedPrice}</p>

        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
          <span>{listing.bedrooms ?? "--"} bd</span>
          <span>·</span>
          <span>{listing.bathrooms ?? "--"} ba</span>
          <span>·</span>
          <span>{listing.sqft ? listing.sqft.toLocaleString() : "--"} sqft</span>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          {listing.streetAddress ? `${listing.streetAddress}, ` : ""}
          {listing.city}, {listing.state}
        </p>
      </div>
    </div>
  );

  // Platform listings link to detail page; MLS listings have no detail page yet
  if (listing.source === "platform") {
    return (
      <Link href={`/listings/${listing.id}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return <div className="h-full">{cardContent}</div>;
}

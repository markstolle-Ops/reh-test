import type { NormalizedListing } from "@/types";
import { ListingCard } from "./ListingCard";

interface SearchResultsProps {
  listings: NormalizedListing[];
  savedIds?: Set<string>;
  onToggleSave?: (id: string, source: string) => void;
}

/**
 * SearchResults
 *
 * Renders a responsive grid of ListingCard components.
 * Shows a count of results, or an empty state when no listings are found.
 */
export function SearchResults({ listings, savedIds, onToggleSave }: SearchResultsProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">No listings found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {listings.length} {listings.length === 1 ? "listing" : "listings"} found
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            saved={savedIds?.has(listing.id) ?? false}
            onToggleSave={
              onToggleSave
                ? () => onToggleSave(listing.id, listing.source)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

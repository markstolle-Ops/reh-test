import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSavedListings } from "@/services/search/saved-listings";
import type { NormalizedListing } from "@/types";

/**
 * /buyer/saved
 *
 * Server component — displays the authenticated buyer's saved/favorited listings.
 * Redirects to sign-in if not authenticated.
 *
 * Uses getSavedListings service directly (no extra HTTP round-trip).
 */
export default async function BuyerSavedPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const savedListings: NormalizedListing[] = await getSavedListings(userId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Listings</h1>
        <p className="mt-1 text-gray-500">
          {savedListings.length > 0
            ? `${savedListings.length} saved ${savedListings.length === 1 ? "listing" : "listings"}`
            : "Properties you favorite will appear here."}
        </p>
      </div>

      {savedListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No saved listings yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Browse properties and click the heart icon to save your favorites.
          </p>
          <a
            href="/buyer/search"
            className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Browse listings
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedListings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-lg border bg-white shadow hover:shadow-md transition overflow-hidden"
            >
              {/* Photo */}
              <div className="aspect-video bg-gray-100 overflow-hidden">
                {listing.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photoUrl}
                    alt={`${listing.city}, ${listing.state}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-bold text-gray-900">
                    ${(listing.price / 100).toLocaleString()}
                  </p>
                  {listing.source === "mls" && (
                    <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      MLS
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {listing.city}, {listing.state}
                </p>

                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                  <span>{listing.bedrooms ?? "--"} bd</span>
                  <span>{listing.bathrooms ?? "--"} ba</span>
                  <span>{listing.sqft ? listing.sqft.toLocaleString() : "--"} sqft</span>
                </div>

                <p className="mt-2 text-xs text-gray-400 capitalize">
                  {listing.propertyType.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

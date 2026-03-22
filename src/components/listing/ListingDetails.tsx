import type { Listing } from "@/types";

interface ListingDetailsProps {
  listing: Listing;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: "Single Family Home",
  condo: "Condominium",
  townhouse: "Townhouse",
  land_lot: "Land / Lot",
};

function formatLotSize(sqft: number | null | undefined): string {
  if (!sqft) return "—";
  if (sqft >= 43560) {
    const acres = (sqft / 43560).toFixed(2);
    return `${acres} acres (${new Intl.NumberFormat("en-US").format(sqft)} sqft)`;
  }
  return `${new Intl.NumberFormat("en-US").format(sqft)} sqft`;
}

export function ListingDetails({ listing }: ListingDetailsProps) {
  const isLandLot = listing.propertyType === "land_lot";
  const propertyLabel =
    PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType;
  const hasDescription =
    listing.description && listing.description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Description */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          About This Property
        </h2>
        {hasDescription ? (
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        ) : (
          <p className="text-gray-400 italic">Description coming soon...</p>
        )}
      </section>

      {/* Property details table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Property Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex justify-between sm:flex-col">
            <dt className="text-gray-500">Property Type</dt>
            <dd className="font-medium text-gray-900">{propertyLabel}</dd>
          </div>

          {listing.yearBuilt != null && (
            <div className="flex justify-between sm:flex-col">
              <dt className="text-gray-500">Year Built</dt>
              <dd className="font-medium text-gray-900">{listing.yearBuilt}</dd>
            </div>
          )}

          {listing.sqft != null && !isLandLot && (
            <div className="flex justify-between sm:flex-col">
              <dt className="text-gray-500">Interior Size</dt>
              <dd className="font-medium text-gray-900">
                {new Intl.NumberFormat("en-US").format(listing.sqft)} sqft
              </dd>
            </div>
          )}

          {listing.lotSizeSqft != null && (
            <div className="flex justify-between sm:flex-col">
              <dt className="text-gray-500">Lot Size</dt>
              <dd className="font-medium text-gray-900">
                {formatLotSize(listing.lotSizeSqft)}
              </dd>
            </div>
          )}

          {!isLandLot && listing.bedrooms != null && (
            <div className="flex justify-between sm:flex-col">
              <dt className="text-gray-500">Bedrooms</dt>
              <dd className="font-medium text-gray-900">{listing.bedrooms}</dd>
            </div>
          )}

          {!isLandLot && listing.bathrooms != null && (
            <div className="flex justify-between sm:flex-col">
              <dt className="text-gray-500">Bathrooms</dt>
              <dd className="font-medium text-gray-900">{listing.bathrooms}</dd>
            </div>
          )}

          {isLandLot && (
            <div className="flex justify-between sm:flex-col">
              <dt className="text-gray-500">Listing Type</dt>
              <dd className="font-medium text-gray-900">Land / Vacant Lot</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}

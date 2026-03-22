import type { Listing } from "@/types";

interface ListingHeaderProps {
  listing: Listing;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  sold: { label: "Sold", className: "bg-gray-100 text-gray-800" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-500" },
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: "Single Family",
  condo: "Condo",
  townhouse: "Townhouse",
  land_lot: "Land / Lot",
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatSqft(sqft: number | null | undefined): string {
  if (!sqft) return "—";
  return new Intl.NumberFormat("en-US").format(sqft) + " sqft";
}

function formatLotSize(sqft: number | null | undefined): string {
  if (!sqft) return "—";
  if (sqft >= 43560) {
    const acres = (sqft / 43560).toFixed(2);
    return `${acres} acres`;
  }
  return new Intl.NumberFormat("en-US").format(sqft) + " sqft lot";
}

export function ListingHeader({ listing }: ListingHeaderProps) {
  const statusInfo = STATUS_LABELS[listing.status] ?? STATUS_LABELS.draft;
  const propertyLabel =
    PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType;
  const isLandLot = listing.propertyType === "land_lot";

  return (
    <div className="space-y-4">
      {/* Price + badges row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-gray-900">
          {formatPrice(listing.price)}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {propertyLabel}
        </span>
      </div>

      {/* Address */}
      <div>
        <p className="text-xl font-semibold text-gray-900">
          {listing.streetAddress}
        </p>
        <p className="text-gray-600">
          {listing.city}, {listing.state} {listing.zip}
        </p>
      </div>

      {/* Key stats */}
      <div className="flex flex-wrap gap-6 text-sm text-gray-700">
        {!isLandLot && listing.bedrooms != null && (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {listing.bedrooms}
            </span>
            <span className="text-gray-500">
              {listing.bedrooms === 1 ? "Bed" : "Beds"}
            </span>
          </div>
        )}

        {!isLandLot && listing.bathrooms != null && (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {listing.bathrooms}
            </span>
            <span className="text-gray-500">
              {Number(listing.bathrooms) === 1 ? "Bath" : "Baths"}
            </span>
          </div>
        )}

        {listing.sqft != null && (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {formatSqft(listing.sqft)}
            </span>
            <span className="text-gray-500">Interior</span>
          </div>
        )}

        {listing.lotSizeSqft != null && (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {formatLotSize(listing.lotSizeSqft)}
            </span>
            <span className="text-gray-500">Lot</span>
          </div>
        )}
      </div>
    </div>
  );
}

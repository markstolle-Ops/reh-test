import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { db } from "@/db";
import { listings, listingPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ListingGallery } from "@/components/listing/ListingGallery";
import { ListingHeader } from "@/components/listing/ListingHeader";
import { ListingDetails } from "@/components/listing/ListingDetails";
import { NeighborhoodWidget } from "@/components/neighborhood/NeighborhoodWidget";
import { MarketTrends } from "@/components/neighborhood/MarketTrends";
import { AvmWidget } from "@/components/avm/AvmWidget";
import { FeeBreakdown } from "@/components/fees/FeeBreakdown";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import type { LaunchState } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Cached data fetcher ──────────────────────────────────────────────────────

function getListingWithPhotos(id: string) {
  return unstable_cache(
    async () => {
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, id),
        with: { photos: true },
      });
      return listing ?? null;
    },
    ["listing-detail", id],
    { tags: [`listing-${id}`, "listings"], revalidate: 3600 }
  )();
}

// ─── SEO metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingWithPhotos(id);

  if (!listing || listing.status === "draft") {
    return { title: "Listing Not Found" };
  }

  const address = `${listing.streetAddress}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const descriptionText = listing.description
    ? listing.description.slice(0, 160)
    : `View this ${listing.propertyType.replace("_", " ")} for sale on RealEstateHunter.`;

  return {
    title: address,
    description: descriptionText,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingWithPhotos(id);

  if (!listing || listing.status === "draft") {
    notFound();
  }

  // Order photos by photoOrder array if present
  const photoOrder = listing.photoOrder ?? [];
  const photosRaw = listing.photos ?? [];
  const orderedPhotos =
    photoOrder.length > 0
      ? [
          ...photoOrder
            .map((pid) => photosRaw.find((p) => p.id === pid))
            .filter(Boolean),
          ...photosRaw.filter((p) => !photoOrder.includes(p.id)),
        ].filter(
          (
            p
          ): p is {
            id: string;
            r2Key: string;
            r2Url: string;
            listingId: string;
            width: number | null;
            height: number | null;
            sizeBytes: number | null;
            uploadedAt: Date;
          } => p !== undefined
        )
      : photosRaw;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Photo gallery */}
      <ListingGallery photos={orderedPhotos} />

      {/* Listing header: price, status, address, key stats */}
      <ListingHeader listing={listing} />

      {/* Full property details + description */}
      <ListingDetails listing={listing} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column — chatbot + neighborhood + AVM */}
        <div className="lg:col-span-2 space-y-6">
          {/* ChatWidget — CHAT-01/CHAT-02/CHAT-03: 24/7 AI chatbot on listing pages */}
          {(listing.status === "active" || listing.status === "pending") && (
            <ChatWidget listingId={listing.id} listingState={listing.state} />
          )}

          {/* NeighborhoodWidget — DATA-03: neighborhood data on listing pages */}
          {(listing.status === "active" || listing.status === "pending") && (
            <NeighborhoodWidget zip={listing.zip} state={listing.state} />
          )}

          {/* MarketTrends — DATA-04: market trends visible to buyers */}
          {(listing.status === "active" || listing.status === "pending") && (
            <MarketTrends zip={listing.zip} state={listing.state} />
          )}

          {/* AvmWidget — DATA-01/DATA-02: seller sees AVM estimate before committing to a price */}
          {(listing.status === "active" || listing.status === "pending") && (
            <AvmWidget
              address={{
                street: listing.streetAddress,
                city: listing.city,
                state: listing.state,
                zip: listing.zip,
              }}
            />
          )}
        </div>

        {/* Sidebar — fee breakdown */}
        <div className="space-y-6">
          {/* FeeBreakdown — COST-03/COST-04: full fee breakdown visible before commitment */}
          {(listing.status === "active" || listing.status === "pending") && (
            <FeeBreakdown
              homePrice={listing.price}
              state={listing.state as LaunchState}
            />
          )}
        </div>
      </div>
    </main>
  );
}

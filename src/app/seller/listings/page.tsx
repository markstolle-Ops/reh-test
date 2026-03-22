import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/listing/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import type { Listing, ListingStatus } from "@/types";

export const metadata = {
  title: "My Listings",
};

interface ListingWithPhotos extends Listing {
  photos?: Array<{ id: string; r2Url: string }>;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function SellerListingsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  if (role !== "seller") {
    redirect("/sign-in");
  }

  // Fetch seller's listings
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let listings: ListingWithPhotos[] = [];

  try {
    const res = await fetch(`${baseUrl}/api/listings`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      listings = data.listings ?? [];
    }
  } catch {
    // Handle fetch error gracefully — show empty state
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your property listings</p>
        </div>
        <Link href="/seller/listings/new" className={buttonVariants()}>
          + Create New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first listing to get started.
          </p>
          <Link href="/seller/listings/new" className={`mt-4 ${buttonVariants()}`}>
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const coverPhoto = listing.photos?.[0];
            return (
              <div
                key={listing.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                {/* Photo thumbnail */}
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {coverPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPhoto.r2Url}
                      alt={listing.streetAddress}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <svg
                        className="size-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Listing info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{listing.streetAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.city}, {listing.state} {listing.zip}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {formatPrice(listing.price)}
                  </p>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <StatusBadge listingId={listing.id} status={listing.status as ListingStatus} />
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <Link
                    href={`/seller/listings/${listing.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

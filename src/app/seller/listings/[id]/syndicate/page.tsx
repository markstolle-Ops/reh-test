import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getMlsStatus } from "@/services/mls/syndication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Seller MLS Syndication Page
 *
 * Allows the listing owner to submit their listing to the MLS via a
 * flat-fee broker partner ($299). Currently in beta — integration stub.
 *
 * This is a future integration point. The page shows syndication status
 * and the submit button which will trigger the broker partner API when
 * the partnership is established.
 */
export default async function SellerSyndicatePage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  // Verify the listing belongs to this seller
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });

  if (!listing) notFound();

  // Authorization: only the listing owner can access this page
  if (listing.userId !== userId) {
    redirect("/seller/dashboard");
  }

  // Get current MLS syndication status (stub returns null)
  const mlsStatus = await getMlsStatus(id);

  const statusLabel = mlsStatus?.status ?? "Not submitted";
  const statusColor: Record<string, string> = {
    pending: "text-yellow-600",
    submitted: "text-blue-600",
    active: "text-green-600",
    rejected: "text-red-600",
    "Not submitted": "text-muted-foreground",
  };

  const address = `${listing.streetAddress}, ${listing.city}, ${listing.state} ${listing.zip}`;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MLS Syndication</h1>
        <p className="text-muted-foreground mt-1">{address}</p>
      </div>

      {/* Beta notice */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        MLS syndication is currently in beta. Your listing will be submitted to
        a partner broker for MLS listing.
      </div>

      {/* Syndication status card */}
      <Card>
        <CardHeader>
          <CardTitle>Syndication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">MLS Status</span>
            <span
              className={`text-sm font-medium capitalize ${statusColor[statusLabel] ?? "text-muted-foreground"}`}
            >
              {statusLabel}
            </span>
          </div>

          {mlsStatus?.mlsNumber && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">MLS Number</span>
              <span className="text-sm font-medium">{mlsStatus.mlsNumber}</span>
            </div>
          )}

          {mlsStatus?.submittedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Submitted At</span>
              <span className="text-sm font-medium">
                {new Date(mlsStatus.submittedAt).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center border-t pt-3 mt-2">
            <span className="text-sm text-muted-foreground">
              Flat-Fee MLS Listing
            </span>
            <span className="text-sm font-semibold">$299.00</span>
          </div>

          <p className="text-xs text-muted-foreground">
            The $299 flat-fee MLS listing connects your property to a licensed
            partner broker who will list it on your local MLS. This enables
            buyer&apos;s agents to find and show your property.
          </p>
        </CardContent>
      </Card>

      {/* Submit to MLS — disabled until broker partner integration is live */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            When MLS syndication goes live, clicking the button below will
            submit your listing to our partner broker and activate your flat-fee
            MLS listing.
          </p>
          <button
            disabled
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed"
            title="MLS syndication integration coming soon"
          >
            Submit to MLS — $299 (Coming Soon)
          </button>
        </CardContent>
      </Card>
    </main>
  );
}

import { currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listing/ListingForm";

export const metadata = {
  title: "Edit Listing",
};

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  if (role !== "seller") {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Fetch the listing, verifying ownership server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const reqHeaders = await headers();
  const res = await fetch(`${baseUrl}/api/listings/${id}`, {
    headers: {
      cookie: reqHeaders.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (res.status === 404 || res.status === 403) {
    notFound();
  }

  if (!res.ok) {
    notFound();
  }

  const { listing } = await res.json();

  // Verify the listing belongs to this user
  if (listing.userId !== user.id) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {listing.streetAddress}, {listing.city}, {listing.state} {listing.zip}
        </p>
      </div>

      <ListingForm mode="edit" initialData={listing} />
    </div>
  );
}

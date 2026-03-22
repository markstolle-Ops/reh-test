import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/listing/ListingForm";

export const metadata = {
  title: "Create New Listing",
};

export default async function NewListingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  if (role !== "seller") {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your property details. AI will generate a description for you to review and edit.
        </p>
      </div>

      <ListingForm mode="create" />
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { listings, disclosureForms } from "@/db/schema";
import { getFormSchemaForState } from "@/services/disclosures/form-schema";
import type { FieldSchema } from "@/components/disclosures/DisclosureForm";
import { DisclosureFormClient } from "./DisclosureFormClient";

interface PageProps {
  params: Promise<{ listingId: string }>;
}

export const metadata = {
  title: "Property Disclosure Form",
};

export default async function DisclosureFormPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { listingId } = await params;

  // Fetch and verify listing ownership
  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.userId, userId)));

  if (!listing) {
    redirect("/seller/listings");
  }

  const state = listing.state;
  const schema = getFormSchemaForState(state);

  // Load any existing disclosure form for this listing
  const [existingForm] = await db
    .select()
    .from(disclosureForms)
    .where(
      and(
        eq(disclosureForms.listingId, listingId),
        eq(disclosureForms.userId, userId)
      )
    );

  const parsedForm = existingForm
    ? {
        ...existingForm,
        answers: JSON.parse(existingForm.answers) as Record<string, unknown>,
      }
    : null;

  const schemaFields: FieldSchema[] = schema
    ? (JSON.parse(schema.fields) as FieldSchema[])
    : [];

  const isOptional = schema?.required === false;
  const isGA = state === "GA";
  const formName = schema?.formName ?? `${state} Disclosure Form`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Property Disclosure</h1>
        <p className="mt-1 text-sm text-gray-500">
          {listing.streetAddress}, {listing.city}, {listing.state} {listing.zip}
        </p>
      </div>

      {/* Attorney review pending notice */}
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <strong>Notice:</strong> This disclosure form is a placeholder pending attorney review.
        The fields shown are representative but have not been reviewed for legal accuracy.
        Do not rely on this form for legal compliance until attorney review is complete.
      </div>

      {/* GA optional banner */}
      {isGA && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <strong>Disclosure is optional in Georgia.</strong> You may skip this form if you choose.
        </div>
      )}

      {/* Form status if completed */}
      {parsedForm?.status === "complete" && parsedForm.completedAt && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <strong>Disclosure completed</strong> on{" "}
          {new Date(parsedForm.completedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          .
        </div>
      )}

      {/* Draft status badge */}
      {parsedForm?.status === "draft" && (
        <div className="mb-4 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Draft — not yet submitted
        </div>
      )}

      <DisclosureFormClient
        listingId={listingId}
        state={state}
        formName={formName}
        formId={parsedForm?.id ?? null}
        fields={schemaFields}
        initialAnswers={parsedForm?.answers ?? {}}
        isOptional={isOptional}
        isComplete={parsedForm?.status === "complete"}
      />
    </div>
  );
}

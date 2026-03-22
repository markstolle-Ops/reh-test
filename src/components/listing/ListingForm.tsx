"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listingSchema } from "@/lib/listing-schema";
import type { Listing } from "@/types";
import { PhotoUploader } from "./PhotoUploader";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingFormValues = z.infer<typeof listingSchema>;

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: Listing;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "single_family", label: "Single Family Home" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land_lot", label: "Land / Lot" },
] as const;

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const TOTAL_STEPS = 4;

// ─── Component ────────────────────────────────────────────────────────────────

export function ListingForm({ mode, initialData }: ListingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingId, setListingId] = useState<string | null>(initialData?.id ?? null);
  const [descriptionStatus, setDescriptionStatus] = useState<string>(
    initialData?.descriptionStatus ?? "pending",
  );
  const [pollActive, setPollActive] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: initialData
      ? {
          streetAddress: initialData.streetAddress,
          city: initialData.city,
          state: initialData.state,
          zip: initialData.zip,
          propertyType: initialData.propertyType,
          price: initialData.price / 100, // DB stores cents, form displays dollars
          bedrooms: initialData.bedrooms ?? undefined,
          bathrooms: initialData.bathrooms != null ? parseFloat(initialData.bathrooms) : undefined,
          sqft: initialData.sqft ?? undefined,
          lotSizeSqft: initialData.lotSizeSqft ?? undefined,
          yearBuilt: initialData.yearBuilt ?? undefined,
          description: initialData.description ?? undefined,
        }
      : {},
  });

  const propertyType = watch("propertyType");
  const isLandLot = propertyType === "land_lot";

  // ── AI Description Polling ──────────────────────────────────────────────

  useEffect(() => {
    if (
      pollActive &&
      listingId &&
      (descriptionStatus === "pending" || descriptionStatus === "generating")
    ) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/listings/${listingId}`);
          if (res.ok) {
            const { listing } = await res.json();
            if (
              listing.descriptionStatus !== "pending" &&
              listing.descriptionStatus !== "generating"
            ) {
              setDescriptionStatus(listing.descriptionStatus);
              if (listing.description) {
                setValue("description", listing.description);
              }
              setPollActive(false);
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [pollActive, listingId, descriptionStatus, setValue]);

  // ── Step Navigation ──────────────────────────────────────────────────────

  const stepFields: Record<number, (keyof ListingFormValues)[]> = {
    1: ["streetAddress", "city", "state", "zip", "propertyType"],
    2: isLandLot
      ? ["price", "sqft", "lotSizeSqft", "yearBuilt"]
      : ["price", "bedrooms", "bathrooms", "sqft", "lotSizeSqft", "yearBuilt"],
    3: [],
    4: ["description"],
  };

  async function nextStep() {
    const fields = stepFields[step];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Form Submit ──────────────────────────────────────────────────────────

  async function onSubmit(data: ListingFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let res: Response;

      if (mode === "create") {
        res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch(`/api/listings/${initialData!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save listing");
      }

      const { listing } = await res.json();

      if (mode === "create") {
        setListingId(listing.id);
        setDescriptionStatus(listing.descriptionStatus);
        // Start polling for AI description if status is pending/generating
        if (listing.descriptionStatus === "pending" || listing.descriptionStatus === "generating") {
          setPollActive(true);
        }
        // Move to step 3 (photos) after create
        setStep(3);
      } else {
        router.push("/seller/listings");
        router.refresh();
      }
    } catch (err) {
      setSubmitError((err as Error).message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                s < step
                  ? "bg-primary text-primary-foreground"
                  : s === step
                    ? "border-2 border-primary text-primary"
                    : "border border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {s < step ? (
                <svg
                  className="size-3.5"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M11.03 3.22a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 111.06-1.06L5 8.19l4.97-4.97a.75.75 0 011.06 0z" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < TOTAL_STEPS && (
              <div className={`h-px w-8 ${s < step ? "bg-primary" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Step 1: Address + Property Type ─────────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Property Location &amp; Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="streetAddress">
                  Street Address
                </label>
                <Input
                  id="streetAddress"
                  placeholder="123 Main St"
                  aria-invalid={!!errors.streetAddress}
                  {...register("streetAddress")}
                />
                {errors.streetAddress && (
                  <p className="text-xs text-destructive">{errors.streetAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="city">
                    City
                  </label>
                  <Input
                    id="city"
                    placeholder="Austin"
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="state">
                    State
                  </label>
                  <select
                    id="state"
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-invalid={!!errors.state}
                    {...register("state")}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-xs text-destructive">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="zip">
                    ZIP Code
                  </label>
                  <Input
                    id="zip"
                    placeholder="78701"
                    maxLength={5}
                    aria-invalid={!!errors.zip}
                    {...register("zip")}
                  />
                  {errors.zip && <p className="text-xs text-destructive">{errors.zip.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="propertyType">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-invalid={!!errors.propertyType}
                    {...register("propertyType")}
                  >
                    <option value="">Select type</option>
                    {PROPERTY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.propertyType && (
                    <p className="text-xs text-destructive">{errors.propertyType.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Property Details ────────────────────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="price">
                  Asking Price
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    className="pl-6"
                    placeholder="350000"
                    aria-invalid={!!errors.price}
                    {...register("price", {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === "" ? undefined : Math.round(parseFloat(v) * 100)),
                    })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter in dollars (e.g., 350000 for $350,000)
                </p>
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>

              {/* Beds/Baths — hidden for land_lot */}
              {!isLandLot && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="bedrooms">
                      Bedrooms
                    </label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min={1}
                      placeholder="3"
                      aria-invalid={!!errors.bedrooms}
                      {...register("bedrooms", { valueAsNumber: true })}
                    />
                    {errors.bedrooms && (
                      <p className="text-xs text-destructive">{errors.bedrooms.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="bathrooms">
                      Bathrooms
                    </label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min={0.5}
                      step={0.5}
                      placeholder="2"
                      aria-invalid={!!errors.bathrooms}
                      {...register("bathrooms", { valueAsNumber: true })}
                    />
                    {errors.bathrooms && (
                      <p className="text-xs text-destructive">{errors.bathrooms.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="sqft">
                    Interior SqFt
                  </label>
                  <Input
                    id="sqft"
                    type="number"
                    min={1}
                    placeholder="1800"
                    {...register("sqft", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="lotSizeSqft">
                    Lot Size (SqFt)
                  </label>
                  <Input
                    id="lotSizeSqft"
                    type="number"
                    min={1}
                    placeholder="6000"
                    {...register("lotSizeSqft", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="yearBuilt">
                  Year Built
                </label>
                <Input
                  id="yearBuilt"
                  type="number"
                  min={1800}
                  max={2100}
                  placeholder="2010"
                  {...register("yearBuilt", { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Photos ──────────────────────────────────────── */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Listing Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {listingId ? (
                <PhotoUploader
                  listingId={listingId}
                  initialPhotos={
                    initialData
                      ? [] // Photos loaded separately in edit mode
                      : []
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete the previous steps to unlock photo upload.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 4: Description ────────────────────────────────── */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Property Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {descriptionStatus === "pending" || descriptionStatus === "generating" ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <svg
                    className="size-4 animate-spin text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="text-sm text-primary">Generating AI description...</span>
                </div>
              ) : descriptionStatus === "ready" ? (
                <p className="text-xs text-green-600">
                  AI description generated — edit below as needed.
                </p>
              ) : descriptionStatus === "edited" ? (
                <p className="text-xs text-muted-foreground">
                  You have customized this description.
                </p>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="description">
                  Description
                </label>
                <Textarea
                  id="description"
                  rows={8}
                  placeholder="Describe your property..."
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Error Banner ─────────────────────────────────────────── */}
        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* ── Navigation Buttons ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
            Back
          </Button>

          <div className="flex items-center gap-2">
            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={nextStep}>
                {step === 2 && mode === "create" ? "Save &amp; Continue" : "Next"}
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "create"
                    ? "Publish Listing"
                    : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Versioned system prompt for MLS-quality listing descriptions.
 * Used by the generateListingDescription Inngest function (plan 02-04).
 */

export interface ListingDescriptionDetails {
  beds: number;
  baths: number;
  sqft: number;
  lotSizeSqft?: number | null;
  city: string;
  state: string;
  propertyType: string;
  yearBuilt?: number | null;
}

/**
 * Returns the GPT-4o prompt string for generating an MLS-quality listing description.
 * Instructs the model to analyze provided photos and combine with property details.
 *
 * @param details - Structured property details to embed in the prompt
 * @returns Full system + user prompt string
 */
export function LISTING_DESCRIPTION_PROMPT(
  details: ListingDescriptionDetails
): string {
  const {
    beds,
    baths,
    sqft,
    lotSizeSqft,
    city,
    state,
    propertyType,
    yearBuilt,
  } = details;

  const propertyTypeLabel = propertyType.replace(/_/g, " ");
  const lotInfo =
    lotSizeSqft && lotSizeSqft > 0
      ? ` on a ${lotSizeSqft} sq ft lot`
      : "";
  const yearInfo = yearBuilt ? `, built in ${yearBuilt}` : "";

  return `You are a professional real estate copywriter with deep expertise in MLS listings. \
Write an MLS-quality listing description for the following property.

Property Details:
- Type: ${propertyTypeLabel}
- Bedrooms: ${beds}
- Bathrooms: ${baths}
- Square footage: ${sqft} sq ft${lotInfo}${yearInfo}
- Location: ${city}, ${state}

Instructions:
1. Use a professional real estate tone — highlight features that attract qualified buyers.
2. Analyze the photos to identify and describe: kitchen upgrades, flooring, natural light, yard features, architectural style, and any visible amenities.
3. Mention the neighborhood and location appeal (${city}, ${state}).
4. Highlight the key features of this ${propertyTypeLabel}.
5. Keep the description between 200 and 400 words.
6. Do not mention price — the seller may change it before publishing.
7. Do not fabricate details not visible in the photos or stated in the property details.
8. Structure the description with a compelling opening sentence, 2-3 feature paragraphs, and a closing call-to-action.

Write the listing description now:`;
}

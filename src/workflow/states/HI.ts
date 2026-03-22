// PLACEHOLDER — requires attorney review before production activation
import type { StateWorkflowConfig } from "@/workflow/types";

export const hiConfig = {
  stateCode: "HI",
  stateName: "Hawaii",
  closingType: "title-company",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: false,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "Hawaii closings are handled by a title company or escrow company. Attorneys are not legally required but are commonly used. Sellers must complete a Seller's Real Property Disclosure Statement. Hawaii has unique leasehold property arrangements that require additional disclosure.",
  steps: [
    {
      id: "offer_submitted",
      label: "Offer Submitted",
      requiredDocuments: ["purchase_agreement"],
    },
    {
      id: "offer_accepted",
      label: "Offer Accepted",
      requiredDocuments: ["purchase_agreement"],
    },
    {
      id: "inspection_period",
      label: "Inspection Period",
      requiredDocuments: ["inspection_report"],
      deadlineDays: 10,
      deadlineType: "inspection",
    },
    {
      id: "financing_period",
      label: "Financing Contingency",
      requiredDocuments: [],
      deadlineDays: 21,
      deadlineType: "financing",
    },
    {
      id: "closing_disclosure",
      label: "Closing Disclosure",
      requiredDocuments: ["closing_disclosure"],
      deadlineDays: 3,
      deadlineType: "closing_disclosure",
    },
    {
      id: "pending_closing",
      label: "Pending Closing",
      requiredDocuments: ["title_commitment"],
    },
    {
      id: "closed",
      label: "Closed",
      requiredDocuments: ["signed_deed", "settlement_statement"],
      deadlineDays: 30,
      deadlineType: "closing",
    },
  ],
} satisfies StateWorkflowConfig;

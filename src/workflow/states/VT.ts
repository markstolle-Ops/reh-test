// PLACEHOLDER — requires attorney review before production activation
import type { StateWorkflowConfig } from "@/workflow/types";

export const vtConfig = {
  stateCode: "VT",
  stateName: "Vermont",
  closingType: "attorney-required",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: true,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "Vermont law requires a licensed real estate attorney to examine the title and certify that the property is free from defects. The attorney prepares the deed and closing documents. Sellers must complete a Seller's Property Information Report.",
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
      id: "attorney_review",
      label: "Attorney Review",
      requiredDocuments: ["attorney_assignment"],
      triggers: ["transaction/attorney.notify"],
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

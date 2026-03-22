// PLACEHOLDER — requires attorney review before production activation
import type { StateWorkflowConfig } from "@/workflow/types";

export const maConfig = {
  stateCode: "MA",
  stateName: "Massachusetts",
  closingType: "attorney-required",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: true,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "Massachusetts law requires a licensed real estate attorney to conduct the closing. The closing attorney performs the title search, prepares the deed, and oversees escrow. A Purchase and Sale Agreement is typically used between accepted offer and closing.",
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

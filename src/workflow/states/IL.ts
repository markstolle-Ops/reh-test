import type { StateWorkflowConfig } from "@/workflow/types";

export const ilConfig = {
  stateCode: "IL",
  stateName: "Illinois",
  closingType: "customary-attorney",
  fsboAllowed: true,
  ronAvailable: false,
  attorneyReferralRequired: true,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "Illinois customarily involves attorneys on both sides of a residential transaction, and an attorney review period (typically 5 business days) is standard after contract execution. While not technically required by law, attorney involvement is strongly expected by all parties. Illinois transfer taxes and local municipality taxes can be substantial.",
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
      label: "Attorney Review Period",
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

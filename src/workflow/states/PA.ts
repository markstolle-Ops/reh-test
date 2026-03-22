import type { StateWorkflowConfig } from "@/workflow/types";

export const paConfig = {
  stateCode: "PA",
  stateName: "Pennsylvania",
  closingType: "title-company",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: false,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "Pennsylvania closings are typically handled by title companies, although attorneys are sometimes used in complex transactions. Sellers must provide a Seller's Property Disclosure Statement. Local transfer taxes in PA municipalities can be significant and must be accounted for.",
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

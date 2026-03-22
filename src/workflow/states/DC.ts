// PLACEHOLDER — requires attorney review before production activation
import type { StateWorkflowConfig } from "@/workflow/types";

export const dcConfig = {
  stateCode: "DC",
  stateName: "District of Columbia",
  closingType: "title-company",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: false,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "DC closings are handled by a title company or settlement agent. Attorneys are not legally required. Sellers must complete a DC Seller's Disclosure of Real Property Condition. DC has unique tenant rights laws including the Tenant Opportunity to Purchase Act (TOPA) which may affect sales.",
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

// PLACEHOLDER — requires attorney review before production activation
import type { StateWorkflowConfig } from "@/workflow/types";

export const meConfig = {
  stateCode: "ME",
  stateName: "Maine",
  closingType: "customary-attorney",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: true,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "Maine closings customarily involve an attorney who performs the title search and prepares closing documents, though it is not legally mandated. Sellers must complete a Property Disclosure Statement. Maine has strict lead paint disclosure requirements.",
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

// PLACEHOLDER — requires attorney review before production activation
import type { StateWorkflowConfig } from "@/workflow/types";

export const nhConfig = {
  stateCode: "NH",
  stateName: "New Hampshire",
  closingType: "customary-attorney",
  fsboAllowed: true,
  ronAvailable: true,
  attorneyReferralRequired: true,
  partnerBrokerRequired: false,
  legalRequirementsSummary:
    "New Hampshire closings customarily involve an attorney to conduct the title search and prepare closing documents, though not legally mandated. Sellers must complete a Property Disclosure Form. New Hampshire has significant radon exposure and requires radon disclosure.",
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

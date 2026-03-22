import type { StateWorkflowConfig } from "@/workflow/types";

export const nyConfig = {
  stateCode: "NY",
  stateName: "New York",
  closingType: "customary-attorney",
  fsboAllowed: true,
  ronAvailable: false,
  attorneyReferralRequired: true,
  /**
   * NY is HIGH broker licensing risk per STATE.md decision.
   * A partner broker is required (not optional) for New York operations.
   */
  partnerBrokerRequired: true,
  legalRequirementsSummary:
    "New York strongly customarily uses attorneys for residential closings; both buyer and seller typically retain separate attorneys. New York requires a Property Condition Disclosure Statement. Remote Online Notarization is not yet widely accepted for deeds.",
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

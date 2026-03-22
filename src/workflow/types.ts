import type { ClosingType } from "@/types";

/**
 * A single step in a real estate transaction workflow.
 */
export interface WorkflowStep {
  id: string;
  label: string;
  requiredDocuments: string[];
  deadlineDays?: number;
  deadlineType?: "inspection" | "financing" | "closing_disclosure" | "closing";
  triggers?: string[];
}

/**
 * Per-state workflow configuration that drives the XState transaction machine.
 * Each state config is data-driven and swappable without changing machine code.
 */
export interface StateWorkflowConfig {
  stateCode: string;
  stateName: string;
  closingType: ClosingType;
  fsboAllowed: boolean;
  ronAvailable: boolean;
  steps: WorkflowStep[];
  legalRequirementsSummary: string;
  /**
   * true for attorney-required (GA, NC) and customary-attorney (NY, IL) states.
   * Attorney fee ($1,500) applies in both cases.
   */
  attorneyReferralRequired: boolean;
  /**
   * true only for NY — HIGH broker licensing risk per STATE.md decision.
   * A partner broker is required (not optional) for New York operations.
   */
  partnerBrokerRequired: boolean;
}

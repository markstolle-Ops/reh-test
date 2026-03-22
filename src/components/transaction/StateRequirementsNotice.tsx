import { getStateWorkflowConfig } from "@/workflow/states";
import type { ClosingType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequirementsNotice {
  /** The full legalRequirementsSummary from the state workflow config */
  summary: string;
  /** Closing type label (e.g. 'attorney-required', 'title-company') */
  closingType: ClosingType;
  /** True for attorney-required (GA, NC) and customary-attorney (NY, IL) states */
  attorneyRequired: boolean;
  /** True only for NY — partner broker required */
  brokerRequired: boolean;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Returns a notice object for a given state code.
 * Pure function — testable without DOM or JSX.
 *
 * Throws for unknown/non-launch state codes (from getStateWorkflowConfig).
 */
export function getRequirementsNotice(stateCode: string): RequirementsNotice {
  const config = getStateWorkflowConfig(stateCode);
  return {
    summary: config.legalRequirementsSummary,
    closingType: config.closingType,
    attorneyRequired: config.attorneyReferralRequired,
    brokerRequired: config.partnerBrokerRequired,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StateRequirementsNoticeProps {
  /** Two-letter state code, e.g. "GA" */
  stateCode: string;
}

/**
 * Server Component — renders a prominent amber/yellow banner displaying
 * state-specific legal requirements before a transaction begins (LEGL-07).
 */
export function StateRequirementsNotice({
  stateCode,
}: StateRequirementsNoticeProps) {
  const notice = getRequirementsNotice(stateCode);

  const closingTypeLabel: Record<string, string> = {
    "attorney-required": "Attorney-Required Closing",
    "customary-attorney": "Customary Attorney Closing",
    "title-company": "Title Company Closing",
    "escrow-company": "Escrow Company Closing",
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {/* Warning icon */}
          <svg
            className="h-5 w-5 text-amber-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-900">
              {stateCode} State Requirements
            </h3>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {closingTypeLabel[notice.closingType] ?? notice.closingType}
            </span>
          </div>

          <p className="text-sm text-amber-800">{notice.summary}</p>

          {notice.attorneyRequired && (
            <p className="text-sm font-medium text-amber-900">
              You will be connected with an attorney referral as part of this
              transaction.
            </p>
          )}

          {notice.brokerRequired && (
            <p className="text-sm font-medium text-amber-900">
              A licensed broker is required for this transaction in New York.
            </p>
          )}

          <p className="text-xs text-amber-700">
            By proceeding, you acknowledge these state-specific requirements.
          </p>
        </div>
      </div>
    </div>
  );
}

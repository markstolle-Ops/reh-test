/**
 * Transaction Deadline Calculator
 *
 * Handles CFPB Closing Disclosure (CD) deadline math using business-day arithmetic.
 * Business days = Monday–Friday only (federal holidays not excluded in this version).
 *
 * CFPB 3-day rule:
 *   - Buyer must RECEIVE CD at least 3 business days before closing
 *   - If mailing, lender must SEND CD at least 6 business days before closing
 */

import { addBusinessDays } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ClosingDisclosureDeadline {
  /** Last day lender can send the CD by mail (6 bdays before closing) */
  mustSendBy: Date;
  /** Last day buyer must receive CD (3 bdays before closing) */
  mustReceiveBy: Date;
  /** Returns true when the given date is on or past mustSendBy */
  isAtRisk: (today: Date) => boolean;
}

export interface DeadlineEntry {
  deadlineType: string;
  dueAt: Date;
}

export interface StateWorkflowConfig {
  steps: Array<{
    name: string;
    deadlineDays: number;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Subtract N business days from a date.
 * Uses date-fns addBusinessDays with a negative value.
 */
function subtractBusinessDays(date: Date, days: number): Date {
  return addBusinessDays(date, -days);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Calculate CFPB Closing Disclosure deadlines from closing date.
 *
 * mustReceiveBy = closing − 3 business days
 * mustSendBy    = closing − 6 business days (mail assumption)
 */
export function calculateClosingDisclosureDeadline(
  closingDate: Date
): ClosingDisclosureDeadline {
  const mustReceiveBy = subtractBusinessDays(closingDate, 3);
  const mustSendBy = subtractBusinessDays(closingDate, 6);

  return {
    mustSendBy,
    mustReceiveBy,
    isAtRisk: (today: Date) => today >= mustSendBy,
  };
}

/**
 * Calculate per-step deadlines from offer-accepted date using workflow config.
 * Each step gets a deadline of offerAcceptedDate + step.deadlineDays (calendar days).
 */
export function calculateTransactionDeadlines(
  offerAcceptedDate: Date,
  config: StateWorkflowConfig
): DeadlineEntry[] {
  return config.steps.map((step) => {
    const dueAt = new Date(offerAcceptedDate);
    dueAt.setUTCDate(dueAt.getUTCDate() + step.deadlineDays);
    return {
      deadlineType: step.name,
      dueAt,
    };
  });
}

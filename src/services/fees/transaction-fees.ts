import {
  PLATFORM_FEE_PLACEHOLDER,
  COMMISSION_RATE_DEFAULT,
  AGENT_FOR_HIRE_FEE_CENTS,
} from "@/lib/constants";
import { getStateInfo } from "@/lib/states";
import { estimateTitleFee } from "@/lib/calculator";
import type { LaunchState } from "@/types";

/**
 * Full breakdown of transaction fees for a platform listing.
 * All values are in cents.
 */
export interface TransactionFees {
  /** Platform fee (flat): PLATFORM_FEE_PLACEHOLDER */
  platformFee: number;
  /** Estimated title company / escrow fee (state-specific percent of home price) */
  titleFee: number;
  /** Attorney fee: $1,500 for attorney-required (GA, NC) and customary-attorney (NY, IL) states; 0 otherwise */
  attorneyFee: number;
  /** Agent-for-hire fee: $500 for attorney-required (GA, NC) and customary-attorney (NY, IL) states; 0 otherwise */
  agentForHireFee: number;
  /** Flat-fee MLS broker partner submission fee: $299 */
  mlsSyndicationFee: number;
  /** Sum of all fees above */
  totalFees: number;
  /** Traditional agent commission: homePrice * COMMISSION_RATE_DEFAULT */
  traditionalCommission: number;
  /** Savings: traditionalCommission - totalFees */
  savings: number;
}

/** Attorney closing fee in cents ($1,500) */
const ATTORNEY_FEE_CENTS = 150000;

/** Flat-fee MLS broker partner fee in cents ($299) */
const MLS_SYNDICATION_FEE_CENTS = 29900;

/**
 * Calculates the full transaction fee breakdown for a listing.
 *
 * @param homePrice - Home sale price in cents
 * @param state - Two-letter launch state code
 * @returns TransactionFees with all fee components
 */
export function calculateTransactionFees(
  homePrice: number,
  state: LaunchState
): TransactionFees {
  const stateInfo = getStateInfo(state);

  const platformFee = PLATFORM_FEE_PLACEHOLDER;

  // estimateTitleFee from Phase 1 calculator — operates in dollars; we work in cents here
  // The calculator.ts uses dollar amounts directly, so we convert from cents to dollars,
  // compute, then convert back.
  const homePriceDollars = homePrice / 100;
  const titleFeeDollars = estimateTitleFee(homePriceDollars, state);
  const titleFee = Math.round(titleFeeDollars * 100);

  // Attorney fee applies to attorney-required (GA, NC) and customary-attorney (NY, IL) states
  const attorneyFee =
    stateInfo.closingType === "attorney-required" ||
    stateInfo.closingType === "customary-attorney"
      ? ATTORNEY_FEE_CENTS
      : 0;

  // Agent-for-hire fee: $500 for attorney-required (GA, NC) and customary-attorney (NY, IL) states.
  // Attorney/customary-attorney states require licensed agent involvement at closing.
  const agentForHireFee =
    stateInfo.closingType === "attorney-required" ||
    stateInfo.closingType === "customary-attorney"
      ? AGENT_FOR_HIRE_FEE_CENTS
      : 0;

  const mlsSyndicationFee = MLS_SYNDICATION_FEE_CENTS;

  const totalFees =
    platformFee + titleFee + attorneyFee + agentForHireFee + mlsSyndicationFee;

  const traditionalCommission = Math.round(homePriceDollars * COMMISSION_RATE_DEFAULT * 100);

  const savings = traditionalCommission - totalFees;

  return {
    platformFee,
    titleFee,
    attorneyFee,
    agentForHireFee,
    mlsSyndicationFee,
    totalFees,
    traditionalCommission,
    savings,
  };
}

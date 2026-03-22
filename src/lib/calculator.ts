import { PLATFORM_FEE_PLACEHOLDER, COMMISSION_RATE_DEFAULT } from "@/lib/constants";
import { getStateInfo } from "@/lib/states";
import type { CommissionBreakdown, LaunchState } from "@/types";

/** Attorney fee applied for attorney-required and customary-attorney states */
const ATTORNEY_FEE = 1500;

/**
 * Estimates the title/escrow fee for a given home price and state.
 * Returns $0 for a $0 home price.
 */
export function estimateTitleFee(homePrice: number, state: string): number {
  if (homePrice === 0) return 0;
  const stateInfo = getStateInfo(state);
  return Math.round(homePrice * stateInfo.estimatedTitleFeePercent);
}

/**
 * Calculates the full cost comparison between using a traditional agent vs the platform.
 *
 * @param homePrice - Sale price of the home in dollars
 * @param state - Two-letter state code (must be a LaunchState)
 * @param commissionRate - Traditional agent commission rate (defaults to COMMISSION_RATE_DEFAULT)
 */
export function calculateSavings(
  homePrice: number,
  state: string,
  commissionRate: number = COMMISSION_RATE_DEFAULT
): CommissionBreakdown {
  // Edge case: zero price returns all zeros
  if (homePrice === 0) {
    return {
      homePrice: 0,
      state: state as LaunchState,
      traditionalCommission: 0,
      platformFee: 0,
      titleFee: 0,
      attorneyFee: 0,
      totalWithPlatform: 0,
      totalWithAgent: 0,
      savings: 0,
    };
  }

  const stateInfo = getStateInfo(state);

  const traditionalCommission = Math.round(homePrice * commissionRate);
  const platformFee = PLATFORM_FEE_PLACEHOLDER;
  const titleFee = estimateTitleFee(homePrice, state);

  // Attorney fee applies to both attorney-required and customary-attorney states
  const attorneyFee =
    stateInfo.closingType === "attorney-required" ||
    stateInfo.closingType === "customary-attorney"
      ? ATTORNEY_FEE
      : 0;

  const totalWithAgent = traditionalCommission + titleFee + attorneyFee;
  const totalWithPlatform = platformFee + titleFee + attorneyFee;
  const savings = totalWithAgent - totalWithPlatform;

  return {
    homePrice,
    state: state as LaunchState,
    traditionalCommission,
    platformFee,
    titleFee,
    attorneyFee,
    totalWithPlatform,
    totalWithAgent,
    savings,
  };
}

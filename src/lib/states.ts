import type { ClosingType } from "@/types";

export interface StateInfo {
  code: string;
  name: string;
  closingType: ClosingType;
  /** Estimated title fee as a decimal fraction of home price (e.g., 0.007 = 0.7%) */
  estimatedTitleFeePercent: number;
}

/**
 * State info for all 51 US states + DC.
 * Closing type classification:
 *   - title-company: closing handled by title/escrow company
 *   - attorney-required: state law requires an attorney at closing (CT, DE, GA, MA, NC, SC, VT, WV)
 *   - customary-attorney: attorney not legally required but customary (IL, ME, NH, NJ, NY, RI)
 */
export const STATE_INFO: Record<string, StateInfo> = {
  // Original 10 launch states
  CA: {
    code: "CA",
    name: "California",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  TX: {
    code: "TX",
    name: "Texas",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.008,
  },
  FL: {
    code: "FL",
    name: "Florida",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  NY: {
    code: "NY",
    name: "New York",
    closingType: "customary-attorney",
    estimatedTitleFeePercent: 0.006,
  },
  GA: {
    code: "GA",
    name: "Georgia",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  NC: {
    code: "NC",
    name: "North Carolina",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  AZ: {
    code: "AZ",
    name: "Arizona",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  OH: {
    code: "OH",
    name: "Ohio",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.006,
  },
  PA: {
    code: "PA",
    name: "Pennsylvania",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  IL: {
    code: "IL",
    name: "Illinois",
    closingType: "customary-attorney",
    estimatedTitleFeePercent: 0.006,
  },
  // 41 new states + DC
  AL: {
    code: "AL",
    name: "Alabama",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  AK: {
    code: "AK",
    name: "Alaska",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  AR: {
    code: "AR",
    name: "Arkansas",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  CO: {
    code: "CO",
    name: "Colorado",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  CT: {
    code: "CT",
    name: "Connecticut",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.008,
  },
  DE: {
    code: "DE",
    name: "Delaware",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  HI: {
    code: "HI",
    name: "Hawaii",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.008,
  },
  ID: {
    code: "ID",
    name: "Idaho",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  IN: {
    code: "IN",
    name: "Indiana",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  IA: {
    code: "IA",
    name: "Iowa",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  KS: {
    code: "KS",
    name: "Kansas",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  KY: {
    code: "KY",
    name: "Kentucky",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  LA: {
    code: "LA",
    name: "Louisiana",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  ME: {
    code: "ME",
    name: "Maine",
    closingType: "customary-attorney",
    estimatedTitleFeePercent: 0.006,
  },
  MD: {
    code: "MD",
    name: "Maryland",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  MA: {
    code: "MA",
    name: "Massachusetts",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  MI: {
    code: "MI",
    name: "Michigan",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  MN: {
    code: "MN",
    name: "Minnesota",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  MS: {
    code: "MS",
    name: "Mississippi",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  MO: {
    code: "MO",
    name: "Missouri",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  MT: {
    code: "MT",
    name: "Montana",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  NE: {
    code: "NE",
    name: "Nebraska",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  NV: {
    code: "NV",
    name: "Nevada",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  NH: {
    code: "NH",
    name: "New Hampshire",
    closingType: "customary-attorney",
    estimatedTitleFeePercent: 0.006,
  },
  NJ: {
    code: "NJ",
    name: "New Jersey",
    closingType: "customary-attorney",
    estimatedTitleFeePercent: 0.008,
  },
  NM: {
    code: "NM",
    name: "New Mexico",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  ND: {
    code: "ND",
    name: "North Dakota",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  OK: {
    code: "OK",
    name: "Oklahoma",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  OR: {
    code: "OR",
    name: "Oregon",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  RI: {
    code: "RI",
    name: "Rhode Island",
    closingType: "customary-attorney",
    estimatedTitleFeePercent: 0.006,
  },
  SC: {
    code: "SC",
    name: "South Carolina",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  SD: {
    code: "SD",
    name: "South Dakota",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  TN: {
    code: "TN",
    name: "Tennessee",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  UT: {
    code: "UT",
    name: "Utah",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  VT: {
    code: "VT",
    name: "Vermont",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  VA: {
    code: "VA",
    name: "Virginia",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  WA: {
    code: "WA",
    name: "Washington",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  WV: {
    code: "WV",
    name: "West Virginia",
    closingType: "attorney-required",
    estimatedTitleFeePercent: 0.006,
  },
  WI: {
    code: "WI",
    name: "Wisconsin",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  WY: {
    code: "WY",
    name: "Wyoming",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
  DC: {
    code: "DC",
    name: "District of Columbia",
    closingType: "title-company",
    estimatedTitleFeePercent: 0.007,
  },
};

/**
 * Returns state info for a given state code.
 * Falls back to title-company defaults if state not found.
 */
export function getStateInfo(stateCode: string): StateInfo {
  return (
    STATE_INFO[stateCode] ?? {
      code: stateCode,
      name: stateCode,
      closingType: "title-company",
      estimatedTitleFeePercent: 0.007,
    }
  );
}

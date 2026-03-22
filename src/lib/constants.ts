/**
 * Platform fee in dollars ($2,500 flat fee).
 * Used in the cost-benefit calculator where homePrice is also in dollars.
 * NOTE: Listings DB stores price in cents — do NOT mix units.
 */
export const PLATFORM_FEE_PLACEHOLDER = 2500;

/**
 * Original 10 launch states — preserved for backward compatibility.
 * Use ALL_STATES for full platform coverage.
 */
export const LAUNCH_STATES = ["CA", "TX", "FL", "NY", "GA", "NC", "AZ", "OH", "PA", "IL"] as const;

/**
 * All 51 US states + DC supported by the platform.
 */
export const ALL_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

/**
 * States where an attorney is legally required at closing.
 * Expanded to include all known attorney-required states.
 */
export const ATTORNEY_REQUIRED_STATES = ["CT", "DE", "GA", "MA", "NC", "SC", "VT", "WV"] as const;

/**
 * States where an attorney is legally required at closing.
 * @deprecated Use ATTORNEY_REQUIRED_STATES for the full list
 */
export const ATTORNEY_STATES = ATTORNEY_REQUIRED_STATES;

/**
 * States where attorney involvement is customary (not legally mandated).
 * Expanded from original 2-state list.
 */
export const CUSTOMARY_ATTORNEY_STATES = ["IL", "ME", "NH", "NJ", "NY", "RI"] as const;

/**
 * Default traditional agent commission rate (5.5%)
 */
export const COMMISSION_RATE_DEFAULT = 0.055;

/**
 * Flat fee for agent-for-hire marketplace service ($500.00)
 */
export const AGENT_FOR_HIRE_FEE_CENTS = 50000;

/**
 * Top 10 highest-volume MLS boards targeted for direct RESO Web API integration.
 * These boards have direct IDX agreements and are onboarded in the resoBoards table.
 * Phase 6 (MLS-04).
 */
export const RESO_HIGH_VOLUME_BOARDS = [
  "CRMLS", // California — largest US MLS
  "Bright MLS", // DC/MD/VA/PA/NJ/DE/WV
  "Stellar MLS", // Florida
  "NTREIS", // North Texas
  "HAR", // Houston
  "GAMLS", // Georgia
  "ARMLS", // Arizona
  "NWMLS", // Pacific Northwest
  "Canopy MLS", // North Carolina
  "Midwest RE Data", // Ohio/KY/IN
] as const;

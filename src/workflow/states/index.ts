import type { StateWorkflowConfig } from "@/workflow/types";
import { caConfig } from "./CA";
import { txConfig } from "./TX";
import { flConfig } from "./FL";
import { nyConfig } from "./NY";
import { gaConfig } from "./GA";
import { ncConfig } from "./NC";
import { azConfig } from "./AZ";
import { ohConfig } from "./OH";
import { paConfig } from "./PA";
import { ilConfig } from "./IL";
// 41 new states + DC
import { alConfig } from "./AL";
import { akConfig } from "./AK";
import { arConfig } from "./AR";
import { coConfig } from "./CO";
import { ctConfig } from "./CT";
import { deConfig } from "./DE";
import { hiConfig } from "./HI";
import { idConfig } from "./ID";
import { inConfig } from "./IN";
import { iaConfig } from "./IA";
import { ksConfig } from "./KS";
import { kyConfig } from "./KY";
import { laConfig } from "./LA";
import { meConfig } from "./ME";
import { mdConfig } from "./MD";
import { maConfig } from "./MA";
import { miConfig } from "./MI";
import { mnConfig } from "./MN";
import { msConfig } from "./MS";
import { moConfig } from "./MO";
import { mtConfig } from "./MT";
import { neConfig } from "./NE";
import { nvConfig } from "./NV";
import { nhConfig } from "./NH";
import { njConfig } from "./NJ";
import { nmConfig } from "./NM";
import { ndConfig } from "./ND";
import { okConfig } from "./OK";
import { orConfig } from "./OR";
import { riConfig } from "./RI";
import { scConfig } from "./SC";
import { sdConfig } from "./SD";
import { tnConfig } from "./TN";
import { utConfig } from "./UT";
import { vtConfig } from "./VT";
import { vaConfig } from "./VA";
import { waConfig } from "./WA";
import { wvConfig } from "./WV";
import { wiConfig } from "./WI";
import { wyConfig } from "./WY";
import { dcConfig } from "./DC";

/**
 * Registry of all 51 state workflow configs (50 states + DC).
 * Keyed by state code.
 */
export const ALL_STATE_CONFIGS: Record<string, StateWorkflowConfig> = {
  // Original 10 launch states
  CA: caConfig,
  TX: txConfig,
  FL: flConfig,
  NY: nyConfig,
  GA: gaConfig,
  NC: ncConfig,
  AZ: azConfig,
  OH: ohConfig,
  PA: paConfig,
  IL: ilConfig,
  // 41 new states + DC
  AL: alConfig,
  AK: akConfig,
  AR: arConfig,
  CO: coConfig,
  CT: ctConfig,
  DE: deConfig,
  HI: hiConfig,
  ID: idConfig,
  IN: inConfig,
  IA: iaConfig,
  KS: ksConfig,
  KY: kyConfig,
  LA: laConfig,
  ME: meConfig,
  MD: mdConfig,
  MA: maConfig,
  MI: miConfig,
  MN: mnConfig,
  MS: msConfig,
  MO: moConfig,
  MT: mtConfig,
  NE: neConfig,
  NV: nvConfig,
  NH: nhConfig,
  NJ: njConfig,
  NM: nmConfig,
  ND: ndConfig,
  OK: okConfig,
  OR: orConfig,
  RI: riConfig,
  SC: scConfig,
  SD: sdConfig,
  TN: tnConfig,
  UT: utConfig,
  VT: vtConfig,
  VA: vaConfig,
  WA: waConfig,
  WV: wvConfig,
  WI: wiConfig,
  WY: wyConfig,
  DC: dcConfig,
};

/**
 * Returns the workflow config for a given state code.
 * Throws for unknown state codes.
 */
export function getStateWorkflowConfig(stateCode: string): StateWorkflowConfig {
  const config = ALL_STATE_CONFIGS[stateCode];
  if (!config) {
    throw new Error(
      `No workflow config for state "${stateCode}". Supported states: ${Object.keys(ALL_STATE_CONFIGS).join(", ")}`
    );
  }
  return config;
}

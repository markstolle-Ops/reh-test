// TODO: Replace stub with HouseCanary API call when vendor contract is signed. See 02-RESEARCH.md "AVM Provider" section.

export interface AvmEstimate {
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidence: number;
  provider: string;
}

interface AvmAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

// ─── Deterministic hash helper ────────────────────────────────────────────────
// Converts a string to a stable numeric seed so the same input always produces
// the same stub data across renders and test runs.

function strSeed(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Linear congruential generator seeded from hash.
function lcg(seed: number) {
  let state = seed;
  return function next(): number {
    state = (1664525 * state + 1013904223) & 0xffffffff;
    return Math.abs(state) / 0xffffffff;
  };
}

// Maps a value from [0,1] to an integer in [min, max] inclusive.
function rangeInt(value: number, min: number, max: number): number {
  return Math.round(min + value * (max - min));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns an automated valuation estimate for the given address.
 * Returns null for invalid addresses (non-5-digit zip).
 *
 * STUB implementation: Uses a deterministic LCG seeded by state + zip to produce
 * realistic, stable price estimates. Prices vary by zip to reflect regional markets.
 *
 * TODO: Replace with HouseCanary API call when vendor contract is signed.
 * HouseCanary endpoint: GET /v2/property/value?address={street}&zipcode={zip}
 */
export async function getHomeValueEstimate(address: AvmAddress): Promise<AvmEstimate | null> {
  if (!isValidZip(address.zip)) return null;

  const seed = strSeed(address.state + address.zip);
  const rand = lcg(seed);

  // Base price range: $150k–$1.5M depending on zip/state hash
  const basePrice = rangeInt(rand(), 150000, 1500000);

  // Confidence: 0.70–0.95 (realistic AVM confidence range)
  const confidence = 0.7 + rand() * 0.25;

  // Range spread: ±5–12% of base price
  const spreadPct = 0.05 + rand() * 0.07;
  const spread = Math.round(basePrice * spreadPct);

  const estimatedValue = basePrice;
  const lowRange = basePrice - spread;
  const highRange = basePrice + spread;

  return {
    estimatedValue,
    lowRange,
    highRange,
    confidence: Math.round(confidence * 100) / 100, // 2 decimal places
    provider: "RealEstateHunter Estimate (Stub)",
  };
}

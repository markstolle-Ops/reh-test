// Neighborhood data service — stub adapters for Walk Score, GreatSchools, and HouseCanary
// TODO: Replace getNeighborhoodData with Walk Score API + GreatSchools API when vendor contracts signed
// TODO: Replace getMarketTrends with HouseCanary market analytics or ATTOM market stats endpoint

export interface NeighborhoodData {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  schoolRating: number;
  nearbySchools: { name: string; rating: number; distance: string }[];
  crimeIndex: number;
}

export interface MarketTrendPoint {
  month: string;
  medianPrice: number;
  daysOnMarket: number;
  activeInventory: number;
}

// ─── Deterministic hash helper ────────────────────────────────────────────────
// Converts a zip string into a stable numeric seed so the same zip always
// produces the same stub data across renders and test runs.

function zipSeed(zip: string): number {
  let hash = 0;
  for (let i = 0; i < zip.length; i++) {
    hash = (hash * 31 + zip.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Linear congruential generator seeded from zip hash — gives us a sequence of
// "random" values that are fully deterministic per zip.

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

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

// ─── Stub school name pools ───────────────────────────────────────────────────

const SCHOOL_NAME_PARTS = [
  ["Lincoln", "Washington", "Jefferson", "Roosevelt", "Kennedy", "Adams"],
  ["Elementary", "Middle", "High", "Academy", "Preparatory"],
  ["School", ""],
];

function schoolName(rand: () => number): string {
  const first = SCHOOL_NAME_PARTS[0][rangeInt(rand(), 0, SCHOOL_NAME_PARTS[0].length - 1)];
  const second = SCHOOL_NAME_PARTS[1][rangeInt(rand(), 0, SCHOOL_NAME_PARTS[1].length - 1)];
  const third = SCHOOL_NAME_PARTS[2][rangeInt(rand(), 0, SCHOOL_NAME_PARTS[2].length - 1)];
  return [first, second, third].filter(Boolean).join(" ");
}

// ─── Month label helpers ──────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Returns an array of 12 month labels ending at the current month, e.g. ["Apr 24", "May 24", ...]
function last12MonthLabels(): string[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
  }
  return labels;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns neighborhood data for the given zip and state.
 * Returns null for invalid zips (non-5-digit or non-numeric).
 *
 * TODO: Replace with Walk Score API + GreatSchools API when vendor contracts signed
 */
export async function getNeighborhoodData(
  zip: string,
  state: string,
): Promise<NeighborhoodData | null> {
  if (!isValidZip(zip)) return null;

  const rand = lcg(zipSeed(zip + state));

  const walkScore = rangeInt(rand(), 0, 100);
  const transitScore = rangeInt(rand(), 0, 100);
  const bikeScore = rangeInt(rand(), 0, 100);
  const schoolRating = Math.max(1, Math.min(10, rangeInt(rand(), 1, 10)));
  const crimeIndex = Math.max(1, rangeInt(rand(), 10, 90));

  // Generate 1-3 nearby schools
  const schoolCount = rangeInt(rand(), 1, 3);
  const nearbySchools: { name: string; rating: number; distance: string }[] = [];
  for (let i = 0; i < schoolCount; i++) {
    const rating = Math.max(1, Math.min(10, rangeInt(rand(), 1, 10)));
    const distanceMiles = (rand() * 2.5 + 0.1).toFixed(1);
    nearbySchools.push({
      name: schoolName(rand),
      rating,
      distance: `${distanceMiles} mi`,
    });
  }

  return {
    walkScore,
    transitScore,
    bikeScore,
    schoolRating,
    nearbySchools,
    crimeIndex,
  };
}

/**
 * Returns 12 months of market trend data for the given zip and state.
 * Uses seasonal patterns (spring peak, winter trough) seeded by zip for determinism.
 *
 * TODO: Replace with HouseCanary market analytics or ATTOM market stats endpoint
 */
export async function getMarketTrends(zip: string, state: string): Promise<MarketTrendPoint[]> {
  const rand = lcg(zipSeed(zip + state + "trends"));

  // Base median price: $200k – $900k depending on zip
  const basePrice = rangeInt(rand(), 200000, 900000);

  // Seasonal multiplier applied per month — spring/summer higher, winter lower
  const seasonalPattern = [
    -0.03, // Jan
    -0.02, // Feb
    0.01, // Mar
    0.04, // Apr
    0.06, // May
    0.05, // Jun
    0.03, // Jul
    0.02, // Aug
    0.0, // Sep
    -0.01, // Oct
    -0.02, // Nov
    -0.03, // Dec
  ];

  // Slow annual appreciation trend: 3-7% YoY
  const appreciationRate = 0.03 + rand() * 0.04;
  const monthlyAppreciation = appreciationRate / 12;

  // Base days on market: 15–60 days
  const baseDom = rangeInt(rand(), 15, 60);

  // Base active inventory: 30–400 units
  const baseInventory = rangeInt(rand(), 30, 400);

  const labels = last12MonthLabels();

  return labels.map((month, i) => {
    // i=0 is 11 months ago, i=11 is current month
    const monthIndex = (new Date().getMonth() - (11 - i) + 12) % 12;
    const seasonal = seasonalPattern[monthIndex];
    const appreciation = i * monthlyAppreciation;

    // Add a small zip-deterministic noise factor per month
    const noiseRand = lcg(zipSeed(zip + state + String(i)));
    const noise = noiseRand() * 0.02 - 0.01; // ±1%

    const medianPrice = Math.round(basePrice * (1 + seasonal + appreciation + noise));

    // DOM inversely correlated with price activity (spring = lower DOM)
    const domFactor = 1 - seasonal * 2;
    const domNoise = noiseRand() * 0.1 - 0.05;
    const daysOnMarket = Math.max(1, Math.round(baseDom * (domFactor + domNoise)));

    // Inventory loosely tracks season (more in spring/summer)
    const inventoryFactor = 1 + seasonal * 1.5;
    const inventoryNoise = noiseRand() * 0.08 - 0.04;
    const activeInventory = Math.max(
      1,
      Math.round(baseInventory * (inventoryFactor + inventoryNoise)),
    );

    return { month, medianPrice, daysOnMarket, activeInventory };
  });
}

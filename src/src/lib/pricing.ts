import type { Region } from '../consts';

export type Tier = 'refined' | 'luxury' | 'ultra';
export type Season = 'peak' | 'shoulder' | 'quiet';

export interface EstimateInput {
  region: Region;
  tier: Tier;
  season: Season;
  days: number;
  travelers: number;
}

export interface EstimateResult {
  perDayMid: number;
  perDayLow: number;
  perDayHigh: number;
  totalLow: number;
  totalHigh: number;
}

/*
  INDICATIVE rate model — grounded in IVY's real rate card (the estimator's CONFIG/DATA).

  The figure shown is the JOURNEY-SERVICES rate (private transportation, driver,
  sightseeing and curated experiences) — billed in INR and, exactly as the estimator
  does, EXCLUDING hotels, which are quoted at actual cost plus a clear 10% coordination
  fee. The estimator's curated engine prices per adult per night at the highest "tier"
  base reached on the route (it never drops), with a per-night reduction for larger
  groups and children at 25%. This module mirrors that for the lightweight on-site tool:

    journey/day (whole party) = travelers × (regionBase − groupReduction(travelers))
                                × styleFactor × seasonFactor

  regionBase below is the representative per-adult nightly base for a journey anchored
  in each region, taken from the estimator's real per-destination rates (₹5,000–13,500).
  The full IVY estimator additionally prices live hotels, vehicle classes, per-stop
  routing, guide language, group/child splits and 5% GST — that richer flow is the
  WhatsApp/handoff experience; here we show an honest range, never a fixed price.
*/
export const REGION_META: Record<Region, { label: string; basePerAdultNightINR: number }> = {
  'delhi-ncr': { label: 'Delhi & NCR', basePerAdultNightINR: 8000 },
  rajasthan: { label: 'Rajasthan', basePerAdultNightINR: 13500 },
  'uttar-pradesh': { label: 'Uttar Pradesh', basePerAdultNightINR: 11000 },
  uttarakhand: { label: 'Uttarakhand', basePerAdultNightINR: 13500 },
  punjab: { label: 'Punjab', basePerAdultNightINR: 9000 },
  himachal: { label: 'Himachal Pradesh', basePerAdultNightINR: 13500 },
  jammu: { label: 'Jammu & Kashmir', basePerAdultNightINR: 13500 },
};

// Journey level. The estimator's journey-services base is fixed per destination, so
// these are gentle indicative factors for the vehicle class, guiding and experiences
// that travel with each level (hotels themselves are quoted separately, at cost + 10%).
export const TIER_META: Record<Tier, { label: string; note: string; mult: number }> = {
  refined: { label: 'Refined', note: 'Characterful boutique & heritage stays', mult: 0.92 },
  luxury: { label: 'Luxury', note: 'The finest heritage hotels & palaces', mult: 1.0 },
  ultra: { label: 'Ultra-luxury', note: 'Landmark suites & private experiences', mult: 1.18 },
};

// The estimator does not seasonally adjust the journey-services rate; seasonality shows
// up mainly in the (separately quoted) hotel rates. This is a light indicative nudge only.
export const SEASON_META: Record<Season, { label: string; note: string; mult: number }> = {
  peak: { label: 'Peak', note: 'Oct–Mar · cool, festive, busiest', mult: 1.05 },
  shoulder: { label: 'Shoulder', note: 'Apr & Sep · in between', mult: 1.0 },
  quiet: { label: 'Quiet', note: 'May–Aug · monsoon & summer', mult: 0.96 },
};

// Per-adult, per-night reduction for larger parties (estimator CONFIG.GROUP_BANDS).
// Up to 2 travellers: none; up to 4: ₹1,000; up to 6: ₹2,500; up to 10: ₹3,500.
const GROUP_BANDS: ReadonlyArray<readonly [number, number]> = [
  [2, 0],
  [4, 1000],
  [6, 2500],
  [10, 3500],
];
function groupReduction(travelers: number): number {
  for (const [maxPax, reduction] of GROUP_BANDS) if (travelers <= maxPax) return reduction;
  return GROUP_BANDS[GROUP_BANDS.length - 1][1];
}

const BAND = 0.12; // ±12% indicative spread
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function computeEstimate(input: EstimateInput): EstimateResult {
  const travelers = Math.max(1, input.travelers);
  const perAdult = REGION_META[input.region].basePerAdultNightINR;
  const rate = Math.max(0, perAdult - groupReduction(travelers));
  const mid =
    travelers * rate * TIER_META[input.tier].mult * SEASON_META[input.season].mult;
  const perDayLow = roundTo(mid * (1 - BAND), 500);
  const perDayHigh = roundTo(mid * (1 + BAND), 500);
  const days = Math.max(1, input.days);
  return {
    perDayMid: roundTo(mid, 500),
    perDayLow,
    perDayHigh,
    totalLow: roundTo(perDayLow * days, 1000),
    totalHigh: roundTo(perDayHigh * days, 1000),
  };
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

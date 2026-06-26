import { WHATSAPP } from '../consts';
import { fmtDate, scheduleLine } from './schedule';

export type WaAgent = 'ivy' | 'specialist';

/** Build a wa.me deep link, optionally pre-filling the first message. */
export function waHref(agent: WaAgent = 'ivy', message?: string): string {
  const base = `https://wa.me/${WHATSAPP[agent]}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const IVY_DEFAULT_MESSAGE =
  "Hello IVY — I'd like to plan a private journey in North India.";

export interface EstimateContext {
  regionLabel: string;
  tierLabel: string;
  seasonLabel: string;
  days: number;
  travelers: number;
  interests?: string[];
  perDayLow: string; // pre-formatted, e.g. "₹26,500"
  perDayHigh: string;
  totalLow: string;
  totalHigh: string;
}

/** Compose the WhatsApp handoff so IVY opens the chat already knowing the trip. */
export function estimateMessage(c: EstimateContext): string {
  const lines = [
    'Hello IVY — I used the estimator on your site and would like to plan this journey:',
    '',
    `• Region: ${c.regionLabel}`,
    `• Style of stay: ${c.tierLabel}`,
    `• When: ${c.seasonLabel}`,
    `• Duration: ${c.days} days`,
    `• Travellers: ${c.travelers}`,
  ];
  if (c.interests && c.interests.length > 0) {
    lines.push(`• Interests: ${c.interests.join(', ')}`);
  }
  lines.push(
    '',
    `Indicative estimate shown: ${c.perDayLow}–${c.perDayHigh} per day (≈ ${c.totalLow}–${c.totalHigh} total).`,
    '',
    'Could you help refine this into an exact, transparent quote?'
  );
  return lines.join('\n');
}

/**
 * NEW warm-transfer handoff. After the estimator POSTs the structured brief and
 * receives a short ref, open WhatsApp with ONLY this line — IVY fetches the full
 * brief by wa_id/ref via getLead. This replaces estimateMessage() (the long text
 * dump), which is now deprecated and must not be used for warm transfers.
 */
export function waRefHref(name: string, ref: string, agent: WaAgent = 'ivy'): string {
  const first = (name || '').trim().split(/\s+/)[0] || 'there';
  return waHref(agent, `Hi IVY, this is ${first} — ref ${ref}`);
}

export interface WaBrief {
  name: string;
  ref: string;
  routeCities: string[];                             // ordered, incl. Delhi book-ends e.g. ['Delhi','Agra','Jaipur','Delhi']
  startDate: string;                                 // ISO 'YYYY-MM-DD'
  scheduleLegs: { name: string; nights: number }[];  // overnight cities in order (Delhi only if staying)
  adults: number;
  children: number;
  nationality: 'foreign' | 'indian';
  themes: string[];                                  // display labels, e.g. "Heritage"
  vehicleLabel: string;                              // 'Sedan' | 'SUV'
  addons: { name: string; destination: string }[];  // display names
  currency: string;                                  // the single currency the customer chose
  language?: string;                                 // the site language the customer chose (English name, e.g. "German")
}

/**
 * Warm-transfer hand-off that carries the FULL brief inside the WhatsApp message,
 * in the exact order the team + IVY expect. IVY parses these labels, so it has the
 * whole trip even if the warm-lead store / getLead round-trip is unavailable — no
 * re-asking, ever. The customer also sees a clean summary of what's being sent. The
 * `ref` is the same number IVY adopts and the team alert shows. Lines are English by
 * design so the parse is reliable regardless of the site language.
 *
 *   Destinations (in order): Delhi - Agra - Jaipur - Delhi
 *   Start Date: 29 July 2026
 *   Schedule: Agra (Overnight stay from 29 July 2026 to 30 July 2026), Jaipur (2 Nights Stay from 30 July 2026 to 1 August 2026)
 *   Vehicle Choice: SUV
 */
export function waBriefHref(b: WaBrief, agent: WaAgent = 'ivy'): string {
  const route = (b.routeCities || []).filter(Boolean).join(' - ');
  const pax = [`${b.adults} ${b.adults === 1 ? 'adult' : 'adults'}`];
  if (b.children > 0) pax.push(`${b.children} ${b.children === 1 ? 'child' : 'children'}`);
  const who = `${pax.join(', ')} (${b.nationality === 'foreign' ? 'foreign national' : 'Indian national'})`;
  const schedule = scheduleLine(b.startDate, b.scheduleLegs || []);
  const lines = [
    `Hi IVY, this is ${(b.name || '').trim() || 'there'} — ref ${b.ref}.`,
    '',
    'My brief from your website:',
    route ? `Destinations (in order): ${route}` : '',
    b.startDate ? `Start Date: ${fmtDate(b.startDate)}` : '',
    schedule ? `Schedule: ${schedule}` : '',
    `Travellers: ${who}`,
    b.vehicleLabel ? `Vehicle Choice: ${b.vehicleLabel}` : '',
    b.themes.length ? `Style: ${b.themes.join(', ')}` : '',
    b.addons.length
      ? `Add-ons: ${b.addons.map((a) => (a.destination ? `${a.name} (${a.destination})` : a.name)).join(', ')}`
      : '',
    `Prices in: ${b.currency}`,
    b.language ? `Language: ${b.language}` : '',
  ].filter(Boolean);
  return waHref(agent, lines.join('\n'));
}

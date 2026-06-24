import { WHATSAPP } from '../consts';

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
  legs: { name: string; nights: number }[];
  startCity: string;
  startDate: string;
  adults: number;
  children: number;
  nationality: 'foreign' | 'indian';
  themes: string[];                                  // display labels, e.g. "Heritage"
  vehicleLabel?: string;                             // display label, e.g. "SUV"
  addons: { name: string; destination: string }[];  // display names
  currency: string;
}

/**
 * Warm-transfer hand-off that carries the FULL brief inside the WhatsApp message.
 * IVY parses these exact labels, so it has the whole trip even if the warm-lead
 * store / getLead round-trip is unavailable — no re-asking, ever. The customer
 * also sees a clean summary of what's being sent. The `ref` is the same number
 * IVY adopts and the team alert shows. Label lines are English by design so the
 * parse is reliable regardless of site language.
 */
export function waBriefHref(b: WaBrief, agent: WaAgent = 'ivy'): string {
  const route = b.legs.map((l) => `${l.name} (${l.nights}n)`).join(' → ');
  const pax = [`${b.adults} ${b.adults === 1 ? 'adult' : 'adults'}`];
  if (b.children > 0) pax.push(`${b.children} ${b.children === 1 ? 'child' : 'children'}`);
  const who = `${pax.join(', ')} (${b.nationality === 'foreign' ? 'foreign national' : 'Indian national'})`;
  const lines = [
    `Hi IVY, this is ${(b.name || '').trim() || 'there'} — ref ${b.ref}.`,
    '',
    'My brief from your website:',
    route ? `• Route: ${route}` : '',
    `• Start: ${b.startCity || 'Delhi'}, ${b.startDate || '—'}`,
    `• Travellers: ${who}`,
    b.themes.length ? `• Style: ${b.themes.join(', ')}` : '',
    b.vehicleLabel ? `• Vehicle: ${b.vehicleLabel}` : '',
    b.addons.length
      ? `• Add-ons: ${b.addons.map((a) => (a.destination ? `${a.name} (${a.destination})` : a.name)).join(', ')}`
      : '',
    `• Prices in: ${b.currency}`,
  ].filter(Boolean);
  return waHref(agent, lines.join('\n'));
}

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

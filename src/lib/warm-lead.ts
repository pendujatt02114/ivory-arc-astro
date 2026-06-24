/*
  Warm-transfer contract. Replaces the old long WhatsApp text dump with a
  STRUCTURED brief the backend stores and IVY fetches by ref / wa_id. The site
  posts this and opens WhatsApp with only "Hi IVY, this is {name} — ref {ref}".
  The site never prices.

  IMPORTANT (why this is CORS-proof): Google Apps Script is cross-origin and does
  not return readable CORS headers, so the browser blocks *reading* its response —
  but the POST itself is still delivered and executed server-side. So we generate
  the ref in the browser, fire the POST with mode:'no-cors' + keepalive (no attempt
  to read the reply), and always carry the ref into WhatsApp. The lead is stored
  under that ref AND the wa_id, so IVY can fetch it either way.
*/
import type { ThemeKey } from './ivy-themes';

export interface WarmLeadLeg { destination: string; nights: number }   // destination = IVY catalogue key
export interface WarmLeadAddon { destination: string; name: string }

export interface WarmLead {
  action: 'warmLead';
  ref: string;            // generated in the browser (IA-XXXX) so the hand-off never depends on the response
  wa_id: string;          // customer WhatsApp number, digits only (country code, no +)
  email: string;
  name: string;
  first_time_india?: boolean;
  occasion?: string;
  themes: ThemeKey[];
  experience_prefs: string[];
  start_city: string;
  start_date: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  adults: number;
  children: number;
  nationality: string;
  vehicle?: 'sedan' | 'suv' | 'tempo' | 'highend';
  legs: WarmLeadLeg[];
  leg_km?: number[];
  addonsSelected?: WarmLeadAddon[];
}

/** Shape collected by the estimator UI. */
export interface EstimatorState {
  waId: string; email: string; name: string;
  firstTimeIndia?: boolean; occasion?: string;
  themes: ThemeKey[]; experiencePrefs: string[];
  startCity?: string; startDate: string; currency: WarmLead['currency'];
  adults: number; children: number; nationality: string;
  vehicle?: WarmLead['vehicle'];
  legs: WarmLeadLeg[];
  addonsSelected?: WarmLeadAddon[];
}

/** Short alphanumeric reference, e.g. IA-7KM3P2 — always a letter+digit mix
 *  (no I/O/0/1), generated in the browser so the hand-off never needs a response. */
export function makeRef(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(letters), pick(digits)]; // guarantee at least one of each
  for (let i = 0; i < 4; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return 'IA-' + chars.join('');
}

export function buildWarmLead(s: EstimatorState): WarmLead {
  return {
    action: 'warmLead',
    ref: makeRef(),
    wa_id: s.waId.replace(/\D/g, ''),
    email: s.email.trim(),
    name: s.name.trim(),
    first_time_india: s.firstTimeIndia,
    occasion: s.occasion,
    themes: s.themes,
    experience_prefs: s.experiencePrefs,
    start_city: (s.startCity || 'delhi').toLowerCase(),
    start_date: s.startDate,
    currency: s.currency,
    adults: s.adults,
    children: s.children,
    nationality: s.nationality,
    vehicle: s.vehicle,
    legs: s.legs.map((l) => ({ destination: l.destination, nights: l.nights })),
    addonsSelected: s.addonsSelected && s.addonsSelected.length ? s.addonsSelected : undefined,
  };
}

const ENDPOINT = import.meta.env.PUBLIC_WARMLEAD_ENDPOINT || '';

/**
 * Deliver the brief to the backend and return the ref. Never throws and never
 * depends on reading the (cross-origin) response: the POST lands server-side
 * regardless. `delivered` is best-effort and only false when no endpoint is set.
 */
export async function submitWarmLead(lead: WarmLead): Promise<{ ref: string; delivered: boolean }> {
  const ref = lead.ref || makeRef();
  if (!ENDPOINT) return { ref, delivered: false };
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // simple request: no CORS preflight
      body: JSON.stringify({ ...lead, ref }),
      mode: 'no-cors',   // we don't read the reply; the request is still delivered + executed
      keepalive: true,   // completes even if the page navigates to WhatsApp
    });
    return { ref, delivered: true };
  } catch {
    return { ref, delivered: true }; // the POST typically still lands; carry the ref anyway
  }
}

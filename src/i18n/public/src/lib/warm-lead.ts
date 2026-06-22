/*
  Warm-transfer contract. Replaces the old long WhatsApp text dump
  (whatsapp.ts: estimateMessage) with a STRUCTURED brief that the backend stores
  and IVY fetches by wa_id/ref. The site posts this, gets a short ref, and opens
  WhatsApp with only "Hi IVY, this is {name} — ref {ref}". The site never prices.
*/
import type { ThemeKey } from './ivy-themes';

export interface WarmLeadLeg { destination: string; nights: number }   // destination = IVY catalogue key
export interface WarmLeadAddon { destination: string; name: string }

export interface WarmLead {
  action: 'warmLead';
  wa_id: string;          // customer WhatsApp number, digits only (country code, no +)
  email: string;
  name: string;
  first_time_india?: boolean;
  occasion?: string;      // none | birthday | anniversary | honeymoon | family | mice
  themes: ThemeKey[];
  experience_prefs: string[];
  start_city: string;     // default "delhi"
  start_date: string;     // ISO yyyy-mm-dd
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

export function buildWarmLead(s: EstimatorState): WarmLead {
  return {
    action: 'warmLead',
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

/** POST the brief to the backend (action:"warmLead"); returns the short ref. */
export async function submitWarmLead(lead: WarmLead): Promise<{ ref: string }> {
  if (!ENDPOINT) throw new Error('PUBLIC_WARMLEAD_ENDPOINT is not configured');
  // text/plain avoids a CORS preflight against the Apps Script web app.
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(lead),
  });
  const data = await res.json().catch(() => null);
  if (!data || !data.ref) throw new Error('warmLead did not return a ref');
  return { ref: String(data.ref) };
}

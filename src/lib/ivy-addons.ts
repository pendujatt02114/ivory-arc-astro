/*
  Add-on shortlisting — a faithful FRONTEND replica of ivy_pricing_engine.py's
  shortlist_addons(): rank a city's experiences by theme overlap, experience
  bucket, interest-tag overlap, iconic (main) value and price clarity; suppress
  excursions unless explicitly opted in; never dump the full list. This mirrors
  IVY conceptually so the site and IVY don't drift — but the site still does NOT
  price. Final pricing is always IVY's.
*/
import RAW from './ivy-addons.json';
import type { ThemeKey, ExperiencePref } from './ivy-themes';

export interface Addon {
  name: string; themes: string[]; bucket: string; tags: string[];
  sell_status: string; is_excursion: boolean; main: boolean;
}
const DATA = RAW as Record<string, Addon[]>;

export interface ShortlistOpts {
  themes?: ThemeKey[];
  prefs?: ExperiencePref[];      // selected experience-preference chips
  limit?: number;                // default 5
  includeExcursions?: boolean;   // default false (suppress)
}

/** Ranked, theme/interest-filtered shortlist for ONE destination (IVY key). */
export function shortlistAddons(destination: string, opts: ShortlistOpts = {}): Addon[] {
  const items = DATA[destination] || [];
  const themes = new Set((opts.themes || []).map((t) => String(t).toLowerCase()));
  const buckets = new Set<string>();
  const tags = new Set<string>();
  let optIn = !!opts.includeExcursions;
  for (const p of opts.prefs || []) {
    (p.buckets || []).forEach((b) => buckets.add(b.toLowerCase()));
    (p.tags || []).forEach((t) => tags.add(t.toLowerCase()));
    (p.themes || []).forEach((t) => themes.add(String(t).toLowerCase()));
    if (p.excursionOptIn) optIn = true;
  }
  const limit = opts.limit ?? 5;
  const scored = items
    .filter((a) => optIn || !a.is_excursion)
    .map((a) => {
      let score = 0;
      if (themes.size && a.themes.some((t) => themes.has(t))) score += 3;
      if (buckets.size && buckets.has(a.bucket.toLowerCase())) score += 2;
      if (tags.size && a.tags.some((t) => tags.has(t) || [...tags].some((q) => t.includes(q)))) score += 1;
      if (a.main) score += 1;                                   // iconic value
      if (/^₹|\\d/.test(a.sell_status) || /free/i.test(a.sell_status)) score += 1; // price clarity
      return { a, score };
    })
    .sort((x, y) => y.score - x.score || (x.a.main === y.a.main ? 0 : x.a.main ? -1 : 1));
  const picks = scored.filter((s) => s.score > 0).slice(0, limit);
  return (picks.length ? picks : scored.slice(0, limit)).map((s) => s.a);
}

/** Excursions for a city, surfaced ONLY when the traveller wants route extensions. */
export function excursionsFor(destination: string): Addon[] {
  return (DATA[destination] || []).filter((a) => a.is_excursion);
}

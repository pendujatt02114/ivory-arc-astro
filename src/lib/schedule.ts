/* Date + schedule helpers shared by the hand-off message (whatsapp.ts) and the
   on-screen review (Estimator.svelte), so both always show identical, unambiguous
   dates. The month is ALWAYS spelled out (e.g. "29 July 2026") to avoid 07/29 vs
   29/07 confusion, per the brief contract IVY also parses. */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** ISO 'YYYY-MM-DD' -> '29 July 2026'. Returns the input unchanged if unparseable. */
export function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Add n calendar days to an ISO date, returning ISO. */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export interface SchedLeg {
  name: string;
  nights: number;
}

export interface SchedPart extends SchedLeg {
  from: string; // ISO check-in
  to: string;   // ISO check-out
  stay: string; // "Overnight stay" | "N Nights Stay"
  text: string; // "Agra (Overnight stay from 29 July 2026 to 30 July 2026)"
}

/** "Overnight stay" for one night, "N Nights Stay" for more (matches the brief contract). */
export function stayLabel(nights: number): string {
  return nights === 1 ? 'Overnight stay' : `${nights} Nights Stay`;
}

/** Walk the overnight legs in order from startDate, producing consecutive ranges. */
export function buildScheduleParts(startDate: string, legs: SchedLeg[]): SchedPart[] {
  let cursor = startDate;
  return legs.map((leg) => {
    const from = cursor;
    const to = addDays(cursor, leg.nights);
    cursor = to;
    const stay = stayLabel(leg.nights);
    return { ...leg, from, to, stay, text: `${leg.name} (${stay} from ${fmtDate(from)} to ${fmtDate(to)})` };
  });
}

/** One-line schedule for the hand-off message: parts joined by ", ". */
export function scheduleLine(startDate: string, legs: SchedLeg[]): string {
  return buildScheduleParts(startDate, legs).map((p) => p.text).join(', ');
}

/* Date + schedule helpers shared by the hand-off message (whatsapp.ts) and the
   on-screen review (Estimator.svelte), so both always show identical, unambiguous
   dates. The month is ALWAYS spelled out (e.g. "29 July 2026") to avoid 07/29 vs
   29/07 confusion, per the brief contract IVY also parses. */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** ISO 'YYYY-MM-DD' -> '29 July 2026'. Returns the input unchanged if unparseable.
   Parsed and read in UTC so it always agrees with addDays (which now works in UTC),
   independent of the device timezone. */
export function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Add n calendar days to an ISO date, returning ISO. Parsed, advanced and
   formatted entirely in UTC so the result is the same in every timezone — building
   the date as local time but reading it back via toISOString() (UTC) silently lost
   a day in positive-offset zones like IST, collapsing every leg to the start date. */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + n);
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

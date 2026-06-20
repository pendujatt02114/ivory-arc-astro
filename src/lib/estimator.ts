/*
  Estimator pricing engine — a faithful port of the standalone estimator's
  compute() / summaryModel(). Same numbers, same rules (tier rule, group bands,
  child 25%, road factor + driver nights for self-drive routes, 10% hotel
  coordination, 5% GST, 10/50/40 payment schedule). Pure + framework-free.
*/
import {
  CONFIG, FX, VEH, HOTELS, DEST, EXPER, CITY, DEST_CITY,
  type Cur, type Veh, type HotelTier, type Guide,
} from './estimator-data';

export type Mode = 'curated' | 'custom';

export interface EstState {
  mode: Mode;
  dest: string[]; // destination keys, in order
  nights: Record<string, number>; // curated: nights per destination
  customNights: number; // self-drive: total nights on the road
  adults: number;
  children: number;
  guide: Guide;
  veh: Veh;
  hotel: HotelTier;
  addons: Record<string, number>; // experience id -> participant count
  cur: Cur;
  startDate: string; // 'YYYY-MM-DD' or ''
}

export type LineItem = [string, number];

export interface Quote {
  escalate?: boolean;
  items: LineItem[];
  sub: number;
  gst: number;
  total: number;
  ppd: number;
  days: number;
  guests: number;
  nts: number;
  disc: number;
}

export function bandRed(ad: number): number {
  for (const [mx, red] of CONFIG.GROUP_BANDS) if (ad <= mx) return red;
  return CONFIG.GROUP_BANDS[CONFIG.GROUP_BANDS.length - 1][1];
}

export function rooms(ad: number): number {
  return Math.max(Math.ceil(ad / 2), 1);
}

export function fmt(cur: Cur, inr: number): string {
  const f = FX[cur];
  return f.s + Math.round(inr / f.r).toLocaleString();
}

export function findExp(id: string) {
  for (const k in EXPER) {
    const f = EXPER[k].find((e) => e.id === id);
    if (f) return f;
  }
  return null;
}

function km(a: [number, number], b: [number, number]): number {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * d2r, dLon = (b[1] - a[1]) * d2r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * d2r) * Math.cos(b[0] * d2r) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 1.3);
}

// Self-drive route as an ordered list of city coords, always starting at Delhi.
export function routeCities(dest: string[]): string[] {
  const out = ['Delhi'];
  dest.forEach((k) => {
    const c = DEST_CITY[k];
    if (c && c !== out[out.length - 1]) out.push(c);
  });
  return out;
}

export function addonCost(S: EstState): number {
  let tot = 0;
  Object.keys(S.addons).forEach((id) => {
    const pax = S.addons[id];
    if (!pax) return;
    const e = findExp(id);
    if (!e) return;
    let c = e.t === 'pp' ? e.price * pax : e.price;
    if (e.coord) c += CONFIG.COORD_PER_PAX * pax;
    tot += c;
  });
  return tot;
}

// [room, coordination(10%), extraBeds]
export function hotelCost(S: EstState, nts: number): [number, number, number] {
  if (S.hotel === 'none' || !nts) return [0, 0, 0];
  const n = HOTELS[S.hotel].n;
  const room = n * rooms(S.adults) * nts;
  const beds = S.children > 0 ? S.children * CONFIG.EXTRA_BED_NIGHTLY * nts : 0;
  return [room, Math.round((room + beds) * CONFIG.COORD_PCT), beds];
}

export function compute(S: EstState): Quote {
  const ad = S.adults, ch = S.children, guests = ad + ch;
  if (ad > CONFIG.ESCALATE_ABOVE) return { escalate: true } as Quote;
  const items: LineItem[] = [];
  let days = 0, nts = 0;

  if (S.mode === 'curated') {
    let runMax = 0, rack = 0, totalNights = 0;
    S.dest.forEach((k) => {
      const d = DEST[k];
      if (!d) return;
      const actual = S.nights[k] || 0;
      const dys = actual > 0 ? actual : 1;
      days += dys;
      totalNights += actual;
      runMax = Math.max(runMax, d.base); // tier rule — rises to highest, never drops
      const rate = runMax - bandRed(ad);
      rack += (ad * rate + ch * CONFIG.CHILD_RATE * rate) * dys;
    });
    nts = totalNights;
    items.push(['Journey services (private transportation + sightseeing)', Math.round(rack)]);
  } else {
    nts = S.customNights;
    days = nts + 1;
    const cities = routeCities(S.dest);
    let sum = 0;
    for (let i = 0; i < cities.length - 1; i++) {
      const a = CITY[cities[i]], b = CITY[cities[i + 1]];
      if (a && b) sum += km(a, b);
    }
    const floor = CONFIG.KM_FLOOR_PER_DAY * (nts + 1);
    const billable = Math.round(Math.max(sum, floor) * CONFIG.ROAD_FACTOR);
    const trans = billable * VEH[S.veh].r;
    items.push(['Transportation: ' + billable + ' km at ₹' + VEH[S.veh].r + '/km (' + VEH[S.veh].l + ')', trans]);
    if (nts > 0) items.push(['Driver overnight: ' + nts + ' night' + (nts > 1 ? 's' : ''), CONFIG.DRIVER_NIGHT * nts]);
  }

  if (S.mode === 'curated') {
    const gr = CONFIG.GUIDE[S.guide] || 0;
    if (gr) items.push(['Private guide (' + days + ' days)', gr * days]);
  }
  const add = addonCost(S);
  if (add) items.push(['Selected experiences & add-ons', add]);

  const [room, coord, beds] = hotelCost(S, nts);
  if (room) {
    items.push(['Accommodation (' + rooms(ad) + ' room' + (rooms(ad) > 1 ? 's' : '') + ' · ' + nts + ' night' + (nts > 1 ? 's' : '') + ')', room]);
    if (beds) items.push(['Extra beds for ' + ch + ' child' + (ch > 1 ? 'ren' : '') + ' (' + nts + ' night' + (nts > 1 ? 's' : '') + ')', beds]);
    items.push(['Accommodation coordination (10%)', coord]);
  }

  const sub = items.reduce((a, b) => a + b[1], 0);
  const gst = Math.round(sub * CONFIG.GST);
  const total = sub + gst;
  const ppd = guests && days ? total / (guests * days) : 0;
  return { items, sub, gst, total, ppd, days, guests, nts, disc: bandRed(ad) };
}

export interface Summary extends Quote {
  adv: number;
  mid: number;
  bal: number;
  route: string;
  dateStart: string;
  dateEnd: string;
  roomsCount: number;
  guestsLabel: string;
}

export function summaryModel(S: EstState): Quote | Summary {
  const q = compute(S);
  if (!q || q.escalate || !q.items) return q;
  const adv = Math.round(q.total * CONFIG.PAY.ADVANCE);
  const mid = Math.round(q.total * CONFIG.PAY.MID);
  const bal = q.total - adv - mid;
  const route = S.dest.map((k) => (DEST[k] ? DEST[k].name : k)).join(' → ');
  const sd = S.startDate ? S.startDate.split('-').map(Number) : null;
  const d0 = sd ? new Date(sd[0], sd[1] - 1, sd[2]) : null;
  const span = S.mode === 'curated' ? q.nts : S.customNights;
  const d1 = d0 ? new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + span) : null;
  const fdt = (d: Date | null) => (d ? d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC');
  return Object.assign(q, {
    adv, mid, bal, route,
    dateStart: fdt(d0), dateEnd: fdt(d1),
    roomsCount: rooms(S.adults),
    guestsLabel: S.adults + ' adult' + (S.adults > 1 ? 's' : '') + (S.children ? ' · ' + S.children + ' child' + (S.children > 1 ? 'ren' : '') : ''),
  });
}

/*
  Estimator data — ported verbatim from the standalone IVY estimator so the
  on-site /plan calculator produces identical indicative pricing.
  Pure data only; the math lives in estimator.ts and the UI in Estimator.svelte.
  No secrets, no third-party keys — those belong in a server function, not here.
*/

export type Cur = 'INR' | 'USD' | 'EUR' | 'GBP';
export type Veh = 'sedan' | 'suv' | 'tempo' | 'luxury';
export type HotelTier = 'none' | 'comfort' | 'premium' | 'luxury';
export type Guide = 'none' | 'english' | 'other';
export type Interest = 'Heritage' | 'Pilgrimage' | 'Mountains' | 'Wildlife';

export interface Dest {
  name: string;
  base: number; // per-person, per-day curated rate (INR)
  int?: string[];
  note?: string;
  exp: string; // experience key into EXPER
  grp?: string;
}

export interface Experience {
  id: string;
  label: string;
  price: number;
  t: 'pp' | 'grp';
  coord?: boolean;
}

export const CONFIG = {
  PAY: { ADVANCE: 0.1, MID: 0.5 }, // balance = 0.40
  GST: 0.05,
  GROUP_BANDS: [
    [2, 0],
    [4, 1000],
    [6, 2500],
    [10, 3500],
  ] as [number, number][],
  CHILD_RATE: 0.25,
  EXTRA_BED_NIGHTLY: 2000,
  KM_FLOOR_PER_DAY: 300,
  ROAD_FACTOR: 1.055,
  DRIVER_NIGHT: 1000,
  COORD_PCT: 0.1,
  COORD_PER_PAX: 200,
  GUIDE: { english: 2000, other: 3500 } as Record<string, number>,
  ESCALATE_ABOVE: 10,
  WHATSAPP: '917455037397',
  EMAIL: 'hello@ivoryarctravels.com',
} as const;

export const FX: Record<Cur, { r: number; s: string }> = {
  INR: { r: 1, s: '₹' },
  USD: { r: 85, s: '$' },
  EUR: { r: 100, s: '€' },
  GBP: { r: 108, s: '£' },
};

export const VEH: Record<Veh, { l: string; r: number; g: string }> = {
  sedan: { l: 'Sedan', r: 18, g: '1–2' },
  suv: { l: 'SUV', r: 24, g: '3–4' },
  tempo: { l: 'Tempo Traveller', r: 38, g: '5–10' },
  luxury: { l: 'Mercedes / BMW / Audi', r: 55, g: 'premium' },
};

export const HOTELS: Record<HotelTier, { l: string; n: number }> = {
  none: { l: 'No stays needed', n: 0 },
  comfort: { l: 'Comfort 3★', n: 5500 },
  premium: { l: 'Premium 4★', n: 11000 },
  luxury: { l: 'Luxury 5★', n: 26500 },
};

export const DEST: Record<string, Dest> = {
  golden_triangle: { name: 'Golden Triangle', base: 11000, int: ['heritage'], note: 'Delhi · Agra · Jaipur', exp: 'golden_triangle' },
  delhi: { name: 'Delhi', base: 5000, int: ['heritage', 'food'], exp: 'delhi' },
  agra: { name: 'Agra', base: 7500, int: ['heritage', 'food'], note: 'Taj Mahal', exp: 'agra' },
  jaipur: { name: 'Jaipur', base: 8000, int: ['heritage', 'food'], exp: 'jaipur' },
  udaipur: { name: 'Udaipur', base: 13500, int: ['heritage'], exp: 'udaipur' },
  jodhpur: { name: 'Jodhpur', base: 11000, int: ['heritage'], exp: 'jodhpur' },
  pushkar: { name: 'Pushkar', base: 8000, int: ['heritage', 'spiritual'], exp: 'pushkar' },
  haridwar: { name: 'Haridwar', base: 8000, int: ['spiritual'], note: 'Ganga aarti', exp: 'haridwar', grp: 'Haridwar & Rishikesh — one tour' },
  rishikesh: { name: 'Rishikesh', base: 13500, int: ['spiritual'], note: 'hill terrain · higher rate', exp: 'rishikesh', grp: 'Haridwar & Rishikesh — one tour' },
  mathura_vrindavan: { name: 'Mathura & Vrindavan', base: 7500, int: ['spiritual'], exp: 'mathura_vrindavan' },
  varanasi: { name: 'Varanasi', base: 11000, int: ['spiritual'], exp: 'varanasi' },
  ayodhya: { name: 'Ayodhya', base: 13500, int: ['spiritual'], exp: 'ayodhya' },
  amritsar: { name: 'Amritsar', base: 9000, int: ['spiritual', 'food'], note: 'Golden Temple', exp: 'amritsar' },
  kainchi_dham: { name: 'Kainchi Dham', base: 13500, int: ['spiritual'], exp: 'kainchi_dham' },
  vaishno_devi: { name: 'Vaishno Devi', base: 13500, int: ['spiritual'], exp: 'vaishno_devi' },
  jwala_ji: { name: 'Jwala Ji', base: 13500, int: ['spiritual'], exp: 'jwala_ji' },
  chintpurni: { name: 'Chintpurni', base: 13500, int: ['spiritual'], exp: 'chintpurni' },
  jim_corbett: { name: 'Jim Corbett', base: 11000, int: ['wildlife'], note: 'tigers', exp: 'jim_corbett' },
  ranthambore: { name: 'Ranthambore', base: 8000, int: ['wildlife'], note: 'tigers', exp: 'ranthambore' },
  shimla_manali: { name: 'Shimla & Manali', base: 13500, int: ['mountains'], note: 'one combined hill tour', exp: 'shimla_manali' },
  dharamshala: { name: 'Dharamshala & McLeodganj', base: 13500, int: ['mountains'], exp: 'dharamshala' },
  dalhousie: { name: 'Dalhousie & Khajjiar', base: 13500, int: ['mountains'], exp: 'dalhousie' },
  mussoorie: { name: 'Mussoorie & Landour', base: 13500, int: ['mountains'], exp: 'mussoorie' },
  nainital: { name: 'Nainital & Kumaon', base: 13500, int: ['mountains'], exp: 'nainital' },
  chandigarh: { name: 'Chandigarh', base: 8000, int: ['food'], exp: 'chandigarh' },
};

// Per-destination experiences (add-ons). Only keys referenced by DEST[x].exp are used.
export const EXPER: Record<string, Experience[]> = {
  agra: [
    { id: 'a-hwalk', label: 'Heritage Walk', price: 800, t: 'pp' },
    { id: 'a-mdinner', label: 'Mughal Heritage Dinner', price: 3500, t: 'pp' },
    { id: 'a-petha', label: 'Petha Sweet Workshop', price: 600, t: 'pp' },
    { id: 'a-tonga', label: 'Tonga Ride', price: 800, t: 'grp' },
    { id: 'a-marble', label: 'Marble Inlay Workshop', price: 1200, t: 'pp' },
    { id: 'a-staj', label: 'Sunrise Taj Experience', price: 1500, t: 'pp' },
    { id: 'a-vip', label: 'VIP Fast-Track Entry', price: 1200, t: 'pp' },
    { id: 'a-photo', label: 'Personal Photographer (4h)', price: 5500, t: 'grp' },
    { id: 'a-mfood', label: 'Mughal Food Walk', price: 1900, t: 'pp' },
    { id: 'a-mehtab', label: 'Mehtab Bagh Sunset (Taj river view)', price: 900, t: 'pp' },
  ],
  jaipur: [
    { id: 'j-amber', label: 'Amber Fort Entry', price: 800, t: 'pp' },
    { id: 'j-camel', label: 'Camel Ride', price: 700, t: 'pp' },
    { id: 'j-turban', label: 'Turban Tying', price: 400, t: 'grp' },
    { id: 'j-block', label: 'Block Printing Workshop', price: 900, t: 'pp' },
    { id: 'j-balloon', label: 'Balloon Sunrise', price: 8500, t: 'pp' },
    { id: 'j-rdinner', label: 'Royal Dinner', price: 3200, t: 'pp' },
    { id: 'j-jwalk', label: 'Jewellery Quarter Walk', price: 1200, t: 'grp' },
  ],
  rishikesh: [
    { id: 'r-raft1', label: 'River Rafting (Grade 1-3)', price: 1200, t: 'pp' },
    { id: 'r-raft4', label: 'Rafting Grade 4', price: 2200, t: 'pp' },
    { id: 'r-bungee', label: 'Bungee Jumping', price: 3500, t: 'pp' },
    { id: 'r-yoga', label: 'Yoga Session', price: 800, t: 'pp' },
    { id: 'r-aarti', label: 'Ganga Aarti VIP Seating', price: 600, t: 'pp' },
    { id: 'r-camp', label: 'Riverside Camping', price: 2800, t: 'pp' },
    { id: 'r-nkanth', label: 'Neelkanth Temple Trek', price: 900, t: 'grp' },
  ],
  amritsar: [
    { id: 'am-wvip', label: 'Wagah Border Ceremony (VIP Enclosure)', price: 500, t: 'pp' },
    { id: 'am-fwalk', label: 'Street Food Walk', price: 1500, t: 'grp' },
    { id: 'am-turban', label: 'Turban Tying', price: 400, t: 'grp' },
    { id: 'am-pmuseum', label: 'Partition Museum', price: 400, t: 'pp' },
    { id: 'am-langar', label: 'Langar Experience', price: 0, t: 'pp' },
    { id: 'am-gobind', label: 'Gobindgarh Fort', price: 600, t: 'pp' },
    { id: 'am-gwalk', label: 'Golden Temple Heritage Walk', price: 1200, t: 'pp' },
  ],
  delhi: [
    { id: 'd-odwalk', label: 'Old Delhi Walking Tour', price: 1200, t: 'grp' },
    { id: 'd-rick', label: 'Rickshaw Ride', price: 600, t: 'grp' },
    { id: 'd-food', label: 'Food Walk Chandni Chowk', price: 1500, t: 'grp' },
    { id: 'd-haat', label: 'Dilli Haat Visit', price: 400, t: 'pp' },
    { id: 'd-aksh', label: 'Akshardham Guided Tour', price: 800, t: 'pp' },
    { id: 'd-photo', label: 'Personal Photographer', price: 5500, t: 'grp' },
  ],
  varanasi: [
    { id: 'v-boat', label: 'Dawn Boat Experience', price: 1200, t: 'pp' },
    { id: 'v-silk', label: 'Silk Weaving Workshop', price: 1400, t: 'grp' },
    { id: 'v-aarti', label: 'Ganga Aarti VIP Seating', price: 600, t: 'pp' },
    { id: 'v-bless', label: 'Blessing Ceremony', price: 800, t: 'grp' },
    { id: 'v-cook', label: 'Cooking Class', price: 2200, t: 'grp' },
    { id: 'v-pind', label: 'Pind Daan Ritual', price: 3500, t: 'grp' },
    { id: 'v-over', label: 'Overnight Ganges Experience', price: 4500, t: 'grp' },
  ],
  jim_corbett: [
    { id: 'c-bij', label: 'Bijrani Zone Safari', price: 2500, t: 'grp', coord: true },
    { id: 'c-ele', label: 'Elephant Safari', price: 1800, t: 'pp', coord: true },
    { id: 'c-night', label: 'Night Safari', price: 3200, t: 'grp', coord: true },
    { id: 'c-bird', label: 'Expert Birdwatching', price: 1400, t: 'grp' },
    { id: 'c-fish', label: 'Fishing on Kosi', price: 1200, t: 'grp' },
    { id: 'c-photo', label: 'Wildlife Photography Tour', price: 5500, t: 'grp' },
  ],
  golden_triangle: [
    { id: 'g-staj', label: 'Sunrise Taj Entry', price: 1500, t: 'pp' },
    { id: 'g-vip', label: 'VIP Taj Entry', price: 1200, t: 'pp' },
    { id: 'g-mdinner', label: 'Mughal Dinner Agra', price: 3500, t: 'pp' },
    { id: 'g-turban', label: 'Turban Tying', price: 400, t: 'grp' },
    { id: 'g-balloon', label: 'Balloon Sunrise Jaipur', price: 8500, t: 'pp' },
    { id: 'g-rdinner', label: 'Royal Dinner Jaipur', price: 3200, t: 'pp' },
    { id: 'g-owalk', label: 'Old Delhi Walk', price: 1200, t: 'grp' },
    { id: 'g-photo', label: 'Personal Photographer', price: 5500, t: 'grp' },
  ],
  vaishno_devi: [
    { id: 'vd-heli', label: 'Helicopter Upgrade', price: 2800, t: 'pp' },
    { id: 'vd-vip', label: 'VIP Darshan Arrangement', price: 1500, t: 'pp' },
    { id: 'vd-shivk', label: 'Shiv Khori Excursion', price: 1200, t: 'grp' },
    { id: 'vd-patni', label: 'Patnitop Extension', price: 2000, t: 'pp' },
  ],
  mathura_vrindavan: [
    { id: 'm-iskcon', label: 'ISKCON Visit & Aarti', price: 0, t: 'pp' },
    { id: 'm-boat', label: 'Boat Ride on Yamuna', price: 600, t: 'grp' },
    { id: 'm-flower', label: 'Flower Ceremony', price: 500, t: 'grp' },
    { id: 'm-ericks', label: 'E-Rickshaw Old City', price: 400, t: 'grp' },
    { id: 'm-holi', label: 'Holi Colour Experience', price: 1200, t: 'grp' },
  ],
  shimla_manali: [
    { id: 'sm-para', label: 'Paragliding Solang', price: 2500, t: 'pp' },
    { id: 'sm-snow', label: 'Snow Sports Package', price: 1800, t: 'pp' },
    { id: 'sm-spa', label: 'Himalayan Spa', price: 3200, t: 'grp' },
    { id: 'sm-camp', label: 'Mountain Camping', price: 2800, t: 'pp' },
    { id: 'sm-bike', label: 'Mountain Biking', price: 1600, t: 'pp' },
    { id: 'sm-meal', label: 'Local Home-Cooked Meal', price: 1200, t: 'grp' },
  ],
  chandigarh: [
    { id: 'ch-rock', label: 'Rock Garden Guided Visit', price: 400, t: 'pp' },
    { id: 'ch-sukhna', label: 'Sukhna Lake Boating', price: 600, t: 'grp' },
    { id: 'ch-capitol', label: 'Capitol Complex Architecture Tour', price: 2500, t: 'grp' },
    { id: 'ch-food', label: 'Chandigarh Food Trail', price: 1800, t: 'pp' },
  ],
  udaipur: [
    { id: 'u-boat', label: 'Lake Pichola Sunset Boat', price: 1500, t: 'pp' },
    { id: 'u-cook', label: 'Mewari Cooking Class', price: 2200, t: 'pp' },
    { id: 'u-bagore', label: 'Bagore ki Haveli Dance Show', price: 700, t: 'pp' },
    { id: 'u-vintage', label: 'Vintage Car Museum', price: 800, t: 'pp' },
  ],
  jodhpur: [
    { id: 'jo-zip', label: 'Mehrangarh Zipline', price: 2100, t: 'pp' },
    { id: 'jo-blue', label: 'Blue City Heritage Walk', price: 900, t: 'pp' },
    { id: 'jo-spice', label: 'Spice Market Tour', price: 700, t: 'pp' },
    { id: 'jo-dinner', label: 'Rooftop Fort-View Dinner', price: 1800, t: 'pp' },
  ],
  pushkar: [
    { id: 'p-camel', label: 'Sunset Camel Safari', price: 900, t: 'pp' },
    { id: 'p-aarti', label: 'Pushkar Lake Evening Aarti', price: 0, t: 'pp' },
    { id: 'p-cafe', label: 'Holy Town Café & Bazaar Walk', price: 600, t: 'pp' },
  ],
  haridwar: [
    { id: 'h-aarti', label: 'Ganga Aarti at Har Ki Pauri (reserved ghat seating)', price: 600, t: 'pp' },
    { id: 'h-ropeway', label: 'Mansa Devi Ropeway', price: 400, t: 'pp' },
    { id: 'h-bazaar', label: 'Old Haridwar Bazaar Walk', price: 700, t: 'pp' },
  ],
  ayodhya: [
    { id: 'ay-darshan', label: 'Ram Mandir Darshan Assistance', price: 800, t: 'pp' },
    { id: 'ay-saryu', label: 'Saryu Evening Aarti & Boat', price: 700, t: 'pp' },
    { id: 'ay-ghats', label: 'Heritage Ghats Walk', price: 600, t: 'pp' },
  ],
  kainchi_dham: [
    { id: 'k-darshan', label: 'Kainchi Dham Darshan & Prasad', price: 300, t: 'pp' },
    { id: 'k-bhimtal', label: 'Bhimtal Lakeside Halt', price: 500, t: 'grp' },
  ],
  jwala_ji: [
    { id: 'jw-darshan', label: 'Jwala Ji Darshan Assistance', price: 500, t: 'pp' },
    { id: 'jw-kangra', label: 'Kangra Fort Visit', price: 600, t: 'pp' },
  ],
  chintpurni: [
    { id: 'cp-darshan', label: 'Chintpurni Darshan Assistance', price: 500, t: 'pp' },
    { id: 'cp-walk', label: 'Temple Town Walk', price: 400, t: 'pp' },
  ],
  ranthambore: [
    { id: 'rn-safari', label: 'Gypsy Safari (per seat, per drive)', price: 1800, t: 'pp' },
    { id: 'rn-fort', label: 'Ranthambore Fort Walk', price: 700, t: 'pp' },
    { id: 'rn-photo', label: 'Wildlife Photography Guide (full day)', price: 3500, t: 'grp' },
  ],
  dharamshala: [
    { id: 'dh-monastery', label: 'Namgyal Monastery & Dalai Lama Temple', price: 500, t: 'pp' },
    { id: 'dh-triund', label: 'Guided Triund Trek', price: 1500, t: 'pp' },
    { id: 'dh-tibet', label: 'Tibetan Cooking Class', price: 1400, t: 'pp' },
    { id: 'dh-hpca', label: 'HPCA Cricket Stadium Visit', price: 400, t: 'pp' },
  ],
  dalhousie: [
    { id: 'dl-khajjiar', label: 'Khajjiar Meadow Excursion', price: 900, t: 'pp' },
    { id: 'dl-kalatop', label: 'Kalatop Forest Walk', price: 700, t: 'pp' },
    { id: 'dl-mall', label: 'Colonial Mall Road Walk', price: 400, t: 'pp' },
  ],
  mussoorie: [
    { id: 'mu-cable', label: 'Gun Hill Cable Car', price: 500, t: 'pp' },
    { id: 'mu-landour', label: 'Landour Bakery & Char Dukan Walk', price: 800, t: 'pp' },
    { id: 'mu-kempty', label: 'Kempty Falls Visit', price: 400, t: 'pp' },
  ],
  nainital: [
    { id: 'n-boat', label: 'Naini Lake Boating', price: 600, t: 'grp' },
    { id: 'n-cable', label: 'Snow View Cable Car', price: 600, t: 'pp' },
    { id: 'n-mall', label: 'Mall Road & Tibetan Market Walk', price: 400, t: 'pp' },
  ],
};

// Interest → category tags, and the destinations each interest surfaces.
export const INTEREST_TO_CATS: Record<Interest, string[]> = {
  Heritage: ['Heritage', 'Luxury Retreat'],
  Pilgrimage: ['Spiritual'],
  Mountains: ['Hill Station', 'Adventure', 'Nature'],
  Wildlife: ['Wildlife'],
};

export const DEST_CATS: Record<string, string[]> = {
  golden_triangle: ['Heritage'], delhi: ['Heritage', 'Food'], agra: ['Heritage'],
  jaipur: ['Heritage', 'Luxury Retreat'], udaipur: ['Heritage', 'Luxury Retreat'], jodhpur: ['Heritage'],
  pushkar: ['Spiritual', 'Heritage'], haridwar: ['Spiritual'],
  rishikesh: ['Spiritual', 'Adventure', 'Weekend Escape'],
  mathura_vrindavan: ['Spiritual'], varanasi: ['Spiritual', 'Heritage'], ayodhya: ['Spiritual'],
  amritsar: ['Spiritual', 'Heritage'], kainchi_dham: ['Spiritual', 'Hill Station'],
  vaishno_devi: ['Spiritual', 'Adventure'], jwala_ji: ['Spiritual'], chintpurni: ['Spiritual'],
  jim_corbett: ['Wildlife', 'Nature', 'Weekend Escape'], ranthambore: ['Wildlife', 'Nature'],
  shimla_manali: ['Hill Station', 'Adventure', 'Nature', 'Weekend Escape'],
  dharamshala: ['Hill Station', 'Spiritual', 'Nature'], dalhousie: ['Hill Station', 'Nature', 'Weekend Escape'],
  mussoorie: ['Hill Station', 'Weekend Escape'], nainital: ['Hill Station', 'Nature', 'Weekend Escape'],
  chandigarh: ['Heritage', 'Food', 'Weekend Escape'],
};

export const DEST_META: Record<string, { min: number; ideal: number; km: number }> = {
  agra: { min: 1, ideal: 2, km: 230 }, jaipur: { min: 2, ideal: 3, km: 280 },
  jodhpur: { min: 2, ideal: 3, km: 630 }, udaipur: { min: 2, ideal: 3, km: 700 },
  pushkar: { min: 1, ideal: 2, km: 380 }, haridwar: { min: 1, ideal: 2, km: 230 },
  rishikesh: { min: 2, ideal: 3, km: 250 }, varanasi: { min: 2, ideal: 3, km: 820 },
  ayodhya: { min: 1, ideal: 2, km: 700 }, amritsar: { min: 2, ideal: 3, km: 450 },
  chandigarh: { min: 1, ideal: 2, km: 260 }, shimla_manali: { min: 5, ideal: 8, km: 370 },
  dharamshala: { min: 2, ideal: 4, km: 480 }, dalhousie: { min: 2, ideal: 3, km: 560 },
  jim_corbett: { min: 2, ideal: 3, km: 260 }, ranthambore: { min: 2, ideal: 3, km: 400 },
  mathura_vrindavan: { min: 1, ideal: 2, km: 160 }, vaishno_devi: { min: 2, ideal: 4, km: 600 },
  golden_triangle: { min: 3, ideal: 5, km: 280 }, mussoorie: { min: 2, ideal: 3, km: 290 },
  nainital: { min: 2, ideal: 3, km: 300 }, kainchi_dham: { min: 1, ideal: 2, km: 330 },
  jwala_ji: { min: 1, ideal: 2, km: 480 }, chintpurni: { min: 1, ideal: 2, km: 430 },
};

export const DEST_DESC: Record<string, string> = {
  golden_triangle: "India's definitive first journey — imperial Delhi, the Taj at Agra, and rose-pink Jaipur.",
  delhi: "Two cities in one — Mughal lanes of Old Delhi against Lutyens' imperial avenues.",
  agra: 'Home of the Taj Mahal — marble poetry at sunrise, Mughal kitchens by night.',
  jaipur: 'The Pink City — hilltop Amber Fort, palace courtyards and bazaar treasure.',
  udaipur: "The City of Lakes — white palaces mirrored in Pichola, India's most romantic address.",
  jodhpur: 'The Blue City beneath mighty Mehrangarh — Rajasthan at its most cinematic.',
  pushkar: "A sacred lake ringed by ghats and one of the world's only Brahma temples.",
  haridwar: 'Where the Ganges meets the plains — the fire-lit Ganga Aarti at Har Ki Pauri.',
  rishikesh: 'Yoga capital of the world — river rafting, ashrams and Himalayan foothills.',
  mathura_vrindavan: "Krishna's birthplace — temple bells, Yamuna ghats and living devotion.",
  varanasi: 'The eternal city — dawn boat rides past ghats older than history.',
  ayodhya: 'Birthplace of Lord Ram — the grand new Ram Mandir and the Saryu aarti.',
  amritsar: "The Golden Temple's shimmering sanctum and the roar of the Wagah border.",
  kainchi_dham: "Neem Karoli Baba's hillside ashram — serenity in the Kumaon foothills.",
  vaishno_devi: 'The great mountain pilgrimage — 13 km of devotion to the holy cave shrine.',
  jwala_ji: 'The eternal flame temple of the Kangra valley.',
  chintpurni: "The revered Shakti Peetha of Himachal's low hills.",
  jim_corbett: "India's oldest national park — tiger country along the Kosi river.",
  ranthambore: "Tigers among thousand-year ruins — India's most photogenic safari.",
  shimla_manali: 'Colonial ridge-town charm to Himalayan adventure in the Kullu valley.',
  dharamshala: 'Home of the Dalai Lama — Tibetan monasteries above pine forests.',
  dalhousie: "Raj-era hill station beside Khajjiar, India's 'mini Switzerland'.",
  mussoorie: "The Queen of Hills — Landour's bakeries and Garhwal panoramas.",
  nainital: 'A jade lake in the Kumaon hills, ringed by colonial promenades.',
  chandigarh: "Le Corbusier's modernist city — gardens, lakes and the Capitol Complex.",
};

export interface CuratedRoute {
  id: string;
  cat: string;
  name: string;
  dests: string[];
  desc: string;
  micro?: string;
}

export const CURATED_ROUTES: CuratedRoute[] = [
  { id: 'golden_triangle', cat: 'HERITAGE', name: 'Golden Triangle', dests: ['golden_triangle'], desc: 'Delhi · Agra · Jaipur', micro: 'A timeless introduction to India — the Golden Triangle has captivated travellers for generations.' },
  { id: 'rajasthan_royal', cat: 'HERITAGE', name: 'Rajasthan Royal Circuit', dests: ['jaipur', 'jodhpur', 'udaipur', 'pushkar'], desc: 'Jaipur · Jodhpur · Udaipur · Pushkar', micro: 'Rajasthan is among our most requested journeys — palaces, forts and desert light unlike anywhere else.' },
  { id: 'sacred_ganges', cat: 'PILGRIMAGE', name: 'Sacred Ganges Journey', dests: ['haridwar', 'rishikesh', 'varanasi', 'ayodhya'], desc: 'Haridwar · Rishikesh · Varanasi · Ayodhya', micro: 'A profound route. The Ganga at dawn and the aarti flames in the evening stay with you.' },
  { id: 'sacred_ayodhya', cat: 'PILGRIMAGE', name: 'Sacred Ayodhya Journey', dests: ['mathura_vrindavan', 'ayodhya'], desc: 'Mathura · Vrindavan · Ayodhya', micro: 'One of the most spiritually charged journeys we arrange.' },
  { id: 'chandigarh_himalayas', cat: 'MOUNTAINS', name: 'Chandigarh & Himalayas', dests: ['chandigarh', 'dharamshala', 'dalhousie'], desc: 'Chandigarh · Dharamshala · Dalhousie', micro: 'A beautiful balance of city and hills.' },
  { id: 'shimla_manali', cat: 'MOUNTAINS', name: 'Shimla & Manali', dests: ['shimla_manali'], desc: 'The classic Himalayan escape', micro: 'Cool air, pine forests, some of the most dramatic scenery in Asia.' },
  { id: 'taj_tigers', cat: 'WILDLIFE', name: 'Taj & Tigers', dests: ['agra', 'ranthambore'], desc: 'Agra · Ranthambore', micro: 'The Taj at sunrise and a tiger in the wild — few journeys offer that contrast.' },
  { id: 'golden_temple_hills', cat: 'PILGRIMAGE', name: 'Golden Temple & Hills', dests: ['amritsar', 'dharamshala'], desc: 'Amritsar · Dharamshala', micro: 'The Golden Temple is one of the most moving spiritual sites in the world; Dharamshala adds the Himalayas.' },
  { id: 'vaishno_devi', cat: 'PILGRIMAGE', name: 'Vaishno Devi Yatra', dests: ['vaishno_devi'], desc: 'Sacred Himalayan pilgrimage', micro: 'A pilgrimage of real significance — we arrange every detail.' },
  { id: 'corbett_wildlife', cat: 'WILDLIFE', name: 'Jim Corbett Wildlife', dests: ['jim_corbett'], desc: 'Tiger reserve · Jungle safaris', micro: "India's oldest and most distinguished wildlife reserve." },
  { id: 'mathura_vrindavan', cat: 'PILGRIMAGE', name: 'Mathura & Vrindavan', dests: ['mathura_vrindavan'], desc: "Krishna's birthplace", micro: 'The spiritual heart of the Krishna tradition — especially beautiful at dawn.' },
  { id: 'varanasi_ayodhya', cat: 'PILGRIMAGE', name: 'Varanasi & Ayodhya', dests: ['varanasi', 'ayodhya'], desc: 'Sacred Ganga · Holy Ayodhya', micro: "Varanasi is one of the world's oldest continuously inhabited cities." },
];

// Map an estimator interest to the routes / categories used above.
export const INTEREST_ROUTE_CAT: Record<Interest, string> = {
  Heritage: 'HERITAGE',
  Pilgrimage: 'PILGRIMAGE',
  Mountains: 'MOUNTAINS',
  Wildlife: 'WILDLIFE',
};

export const CITY: Record<string, [number, number]> = {
  Delhi: [28.61, 77.21], Agra: [27.18, 78.02], Jaipur: [26.91, 75.79],
  Haridwar: [29.95, 78.16], Rishikesh: [30.09, 78.27], Varanasi: [25.32, 82.97],
  Amritsar: [31.63, 74.87], Shimla: [31.1, 77.17], Manali: [32.24, 77.19],
  Udaipur: [24.58, 73.68], Jodhpur: [26.24, 73.02], Nainital: [29.39, 79.46],
  Dharamshala: [32.22, 76.32], Chandigarh: [30.73, 76.78], Mathura: [27.49, 77.67],
  Pushkar: [26.49, 74.55], Dalhousie: [32.54, 75.97], Ayodhya: [26.79, 82.19],
};

export const DEST_CITY: Record<string, string> = {
  golden_triangle: 'Delhi', delhi: 'Delhi', agra: 'Agra', jaipur: 'Jaipur',
  udaipur: 'Udaipur', jodhpur: 'Jodhpur', pushkar: 'Pushkar', haridwar: 'Haridwar',
  rishikesh: 'Rishikesh', mathura_vrindavan: 'Mathura', varanasi: 'Varanasi',
  ayodhya: 'Ayodhya', amritsar: 'Amritsar', kainchi_dham: 'Nainital',
  vaishno_devi: 'Amritsar', jwala_ji: 'Dharamshala', chintpurni: 'Dharamshala',
  jim_corbett: 'Nainital', ranthambore: 'Jaipur', shimla_manali: 'Shimla',
  dharamshala: 'Dharamshala', dalhousie: 'Dalhousie', mussoorie: 'Shimla',
  nainital: 'Nainital', chandigarh: 'Chandigarh',
};

export const INTERESTS: { id: Interest; label: string; blurb: string }[] = [
  { id: 'Heritage', label: 'Heritage', blurb: 'Forts, palaces & Mughal cities' },
  { id: 'Pilgrimage', label: 'Spiritual & Pilgrimage', blurb: 'Temples, ghats & sacred rivers' },
  { id: 'Mountains', label: 'Mountains', blurb: 'Himalayan hill stations & valleys' },
  { id: 'Wildlife', label: 'Wildlife', blurb: 'Tiger reserves & national parks' },
];

export function destsForInterest(interest: Interest): string[] {
  const want = INTEREST_TO_CATS[interest] || [];
  return Object.keys(DEST).filter((k) => {
    const dc = DEST_CATS[k] || [];
    return want.some((c) => dc.includes(c));
  });
}

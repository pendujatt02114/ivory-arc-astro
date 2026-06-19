// Single source of truth for brand-level constants used across components.

export const SITE = {
  name: 'Ivory Arc Travels',
  domain: 'https://www.ivoryarctravels.com',
  tagline: 'Curated Heritage & Spiritual Journeys',
  promise: 'Private journeys across North India.',
  gst: '09AYIPT0745R2ZH',
  msme: 'MSME Certified',
  email: 'hello@ivoryarctravels.com',
  phoneDisplay: '+91 74550 37397',
  phoneTel: '+917455037397',
  addressLine: 'Nehru Enclave',
  city: 'Agra',
  postcode: '282001',
  region: 'Uttar Pradesh',
  country: 'India',
  // How many places we can route a private journey through across North India.
  destinationCount: 57,
} as const;

// WhatsApp. IVY is the primary conversational path; the specialist line is escalation only
// (see architecture §0.4 / §7). Numbers are in wa.me format (country code + number, no symbols).
export const WHATSAPP = {
  ivy: '919711544624',
  specialist: '917455037397',
} as const;

export const LOCALES = ['en', 'es', 'de', 'fr', 'it', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

// Display only — every journey is billed in INR.
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const NAV = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/#experiences', label: 'Experiences' },
  { href: '/#journeys', label: 'Sample Journeys' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#why', label: 'Why Ivory Arc' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const REGIONS = [
  'delhi-ncr',
  'rajasthan',
  'uttar-pradesh',
  'uttarakhand',
  'punjab',
  'himachal',
  'jammu',
] as const;
export type Region = (typeof REGIONS)[number];

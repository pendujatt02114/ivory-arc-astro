/*
  Lightweight i18n. English is the complete source; es/de/fr currently translate
  the high-visibility strings (hero, CTAs, section headings, labels) and fall back to
  English for longer copy. Replace the fallbacks with professional translations.

  Usage in any component:
    import { useTranslations } from '../i18n/ui';
    const t = useTranslations(lang);   // lang from a prop or Astro.currentLocale
    t('hero.title')
*/

export const LANGS = ['en', 'es', 'de', 'fr'] as const;
export type Lang = (typeof LANGS)[number];
export const defaultLang: Lang = 'en';

export const languageNames: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};

type Dict = Record<string, string>;

const en: Dict = {
  'meta.title': 'Ivory Arc Travels — Private Heritage & Spiritual Journeys in North India',
  'meta.description':
    'Private, fully customized luxury journeys across North India. Transparent pricing — hotels at actual cost plus a clear 10% coordination fee. No commission-driven shopping stops.',

  'hero.eyebrow': 'Private luxury travel · North India',
  'hero.title': 'Journeys across North India, designed entirely around you.',
  'hero.sub':
    'Transparent pricing, no commission-driven shopping stops, and a private journey planned with care — from the palaces of Rajasthan to the Ganges and the Himalaya.',
  'hero.aside': 'Most journeys are planned directly with IVY — specialists step in for complex itineraries.',

  'cta.ivy': 'Chat with IVY',
  'cta.estimate': 'Get an estimate',
  'cta.estimateThis': 'Estimate this journey',

  'pricing.eyebrow': 'How pricing works',
  'pricing.title': 'Transparent by design.',
  'pricing.intro':
    'No packages, no markups buried in the price. You see what your journey actually costs.',
  'pricing.s1.t': 'Tell us your journey',
  'pricing.s1.d': "Where you'd like to go, when, and the kind of stay you have in mind.",
  'pricing.s2.t': 'We price it transparently',
  'pricing.s2.d':
    'Hotels at actual cost, plus a clearly stated 10% coordination fee. Always billed in INR.',
  'pricing.s3.t': 'Travel privately',
  'pricing.s3.d': 'Private vehicles and expert guides — and never a commission-driven shopping stop.',

  'interests.eyebrow': 'Find your journey',
  'interests.title': 'Travel by what moves you.',
  'interest.heritage': 'Heritage',
  'interest.spiritual': 'Spiritual',
  'interest.wildlife': 'Wildlife',
  'interest.mountains': 'Mountains',
  'interest.pilgrimage': 'Pilgrimage',
  'interest.luxury': 'Luxury',

  'journeys.eyebrow': 'Sample journeys',
  'journeys.title': "A sense of what's possible.",
  'journeys.intro':
    'Starting points, not fixed packages — every journey is shaped around you.',
  'journeys.from': 'from',
  'journeys.perDay': '/ day',
  'journeys.note': 'Indicative per-day guide, billed in INR. Every journey is fully customized.',

  'why.eyebrow': 'Why Ivory Arc',
  'why.title': 'A travel atelier, not an agency.',
  'why.p1.t': 'Private journeys only',
  'why.p1.d': 'No group tours, no fixed departures. Every journey is yours alone.',
  'why.p2.t': 'Transparent pricing',
  'why.p2.d': 'Hotels at actual cost plus a clear 10% coordination fee — nothing hidden.',
  'why.p3.t': 'No commission-driven stops',
  'why.p3.d': 'We never route you through shops for a kickback. Your time is the priority.',
  'why.p4.t': 'Human expertise, AI-assisted',
  'why.p4.d': 'IVY designs quickly; our specialists bring the judgement of true local knowledge.',

  'ivy.eyebrow': 'Plan with IVY',
  'ivy.title': 'Your journey, designed in minutes.',
  'ivy.body':
    'IVY is our AI travel concierge. It shapes an itinerary and an indicative price with you on WhatsApp, and brings in our specialists whenever a journey calls for a human touch.',

  'lang.label': 'Language',
};

const es: Dict = {
  'hero.eyebrow': 'Viajes privados de lujo · Norte de la India',
  'hero.title': 'Viajes por el norte de la India, diseñados enteramente para ti.',
  'hero.sub':
    'Precios transparentes, sin paradas de compras por comisión, y un viaje privado planificado con cuidado — desde los palacios de Rajastán hasta el Ganges y el Himalaya.',
  'cta.ivy': 'Chatea con IVY',
  'cta.estimate': 'Solicitar presupuesto',
  'cta.estimateThis': 'Calcular este viaje',
  'pricing.eyebrow': 'Cómo funciona el precio',
  'pricing.title': 'Transparente por diseño.',
  'interests.eyebrow': 'Encuentra tu viaje',
  'interests.title': 'Viaja por lo que te inspira.',
  'interest.heritage': 'Patrimonio',
  'interest.spiritual': 'Espiritual',
  'interest.wildlife': 'Naturaleza',
  'interest.mountains': 'Montañas',
  'interest.pilgrimage': 'Peregrinación',
  'interest.luxury': 'Lujo',
  'journeys.eyebrow': 'Viajes de ejemplo',
  'journeys.title': 'Una idea de lo posible.',
  'journeys.from': 'desde',
  'journeys.perDay': '/ día',
  'why.eyebrow': 'Por qué Ivory Arc',
  'why.title': 'Un atelier de viajes, no una agencia.',
  'ivy.eyebrow': 'Planifica con IVY',
  'ivy.title': 'Tu viaje, diseñado en minutos.',
  'lang.label': 'Idioma',
};

const de: Dict = {
  'hero.eyebrow': 'Private Luxusreisen · Nordindien',
  'hero.title': 'Reisen durch Nordindien, ganz auf Sie zugeschnitten.',
  'hero.sub':
    'Transparente Preise, keine provisionsgetriebenen Einkaufsstopps und eine private Reise, mit Sorgfalt geplant — von den Palästen Rajasthans bis zum Ganges und Himalaya.',
  'cta.ivy': 'Mit IVY chatten',
  'cta.estimate': 'Angebot erhalten',
  'cta.estimateThis': 'Diese Reise kalkulieren',
  'pricing.eyebrow': 'So funktioniert der Preis',
  'pricing.title': 'Transparent von Grund auf.',
  'interests.eyebrow': 'Finden Sie Ihre Reise',
  'interests.title': 'Reisen Sie nach dem, was Sie bewegt.',
  'interest.heritage': 'Kulturerbe',
  'interest.spiritual': 'Spirituell',
  'interest.wildlife': 'Tierwelt',
  'interest.mountains': 'Berge',
  'interest.pilgrimage': 'Pilgerreise',
  'interest.luxury': 'Luxus',
  'journeys.eyebrow': 'Beispielreisen',
  'journeys.title': 'Ein Eindruck des Möglichen.',
  'journeys.from': 'ab',
  'journeys.perDay': '/ Tag',
  'why.eyebrow': 'Warum Ivory Arc',
  'why.title': 'Ein Reise-Atelier, keine Agentur.',
  'ivy.eyebrow': 'Mit IVY planen',
  'ivy.title': 'Ihre Reise, in Minuten gestaltet.',
  'lang.label': 'Sprache',
};

const fr: Dict = {
  'hero.eyebrow': 'Voyages privés de luxe · Inde du Nord',
  'hero.title': "Des voyages dans le nord de l'Inde, entièrement conçus pour vous.",
  'hero.sub':
    "Des prix transparents, aucun arrêt shopping à la commission, et un voyage privé pensé avec soin — des palais du Rajasthan au Gange et à l'Himalaya.",
  'cta.ivy': 'Discuter avec IVY',
  'cta.estimate': 'Obtenir une estimation',
  'cta.estimateThis': 'Estimer ce voyage',
  'pricing.eyebrow': 'Comment fonctionne le prix',
  'pricing.title': 'La transparence par principe.',
  'interests.eyebrow': 'Trouvez votre voyage',
  'interests.title': 'Voyagez selon ce qui vous inspire.',
  'interest.heritage': 'Patrimoine',
  'interest.spiritual': 'Spiritualité',
  'interest.wildlife': 'Faune',
  'interest.mountains': 'Montagnes',
  'interest.pilgrimage': 'Pèlerinage',
  'interest.luxury': 'Luxe',
  'journeys.eyebrow': 'Exemples de voyages',
  'journeys.title': 'Un aperçu du possible.',
  'journeys.from': 'à partir de',
  'journeys.perDay': '/ jour',
  'why.eyebrow': 'Pourquoi Ivory Arc',
  'why.title': 'Un atelier de voyage, pas une agence.',
  'ivy.eyebrow': 'Planifier avec IVY',
  'ivy.title': 'Votre voyage, conçu en quelques minutes.',
  'lang.label': 'Langue',
};


export const ui: Record<Lang, Dict> = { en, es, de, fr };

export function useTranslations(lang: string | undefined) {
  const l = (LANGS as readonly string[]).includes(lang ?? '') ? (lang as Lang) : defaultLang;
  return (key: string): string => ui[l][key] ?? ui.en[key] ?? key;
}

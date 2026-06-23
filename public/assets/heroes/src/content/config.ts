import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content schema — single source of truth for all editorial content.
 * Astro 5 Content Layer API (glob loader). Invalid frontmatter fails the build,
 * so content errors are caught in CI rather than at runtime.
 *
 * Taxonomies below mirror src/consts.ts (REGIONS) and the architecture doc
 * (interests / traveler types). Keep them in sync.
 */

const interest = z.enum([
  'heritage',
  'spiritual',
  'luxury',
  'wildlife',
  'mountains',
  'pilgrimage',
]);

const traveler = z.enum(['couples', 'families', 'seniors']);

// Mirrors REGIONS in src/consts.ts
const region = z.enum([
  'delhi-ncr',
  'rajasthan',
  'uttar-pradesh',
  'uttarakhand',
  'punjab',
  'himachal',
  'jammu',
]);

const faqItem = z.object({
  q: z.string(),
  a: z.string(),
});

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/destinations' }),
  schema: z.object({
    title: z.string(),
    region: region,
    // Doubles as meta description + AI-search summary block (architecture §6/§7).
    summary: z.string().max(320),
    interests: z.array(interest).default([]),
    travelerTypes: z.array(traveler).default([]),
    hero: z.string(),
    heroAlt: z.string(),
    gallery: z.array(z.string()).default([]),
    inclusions: z.array(z.string()).default([]),
    exclusions: z.array(z.string()).default([]),
    faq: z.array(faqItem).default([]),
    draft: z.boolean().default(false),
  }),
});

const experiences = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/experiences' }),
  schema: z.object({
    title: z.string(),
    type: interest,
    summary: z.string().max(320),
    hero: z.string(),
    heroAlt: z.string(),
    relatedDestinations: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const journeys = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/journeys' }),
  schema: z.object({
    title: z.string(),
    region: region,
    summary: z.string().max(320),
    durationDays: z.number().int().positive(),
    // Indicative only — shown as a "from ₹X / day" band, never a fixed package price
    // (architecture §0.2 / §0.8). Billed in INR.
    indicativePerDayINR: z.number().int().positive(),
    interests: z.array(interest).default([]),
    travelerTypes: z.array(traveler).default([]),
    hero: z.string(),
    heroAlt: z.string(),
    days: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      )
      .default([]),
    inclusions: z.array(z.string()).default([]),
    exclusions: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    topic: z.string(),
    order: z.number().int().default(0),
    // The answer lives in the Markdown body, so it can be rich/MDX.
  }),
});

export const collections = { destinations, experiences, journeys, faqs };

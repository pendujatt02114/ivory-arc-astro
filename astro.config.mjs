// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// Static output → Cloudflare Pages. Add @astrojs/cloudflare only if SSR/Functions are needed later.
// https://astro.build/config
export default defineConfig({
  site: 'https://www.ivoryarctravels.com',
  integrations: [
    mdx(),
    svelte(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', de: 'de', fr: 'fr' },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'fr'],
    routing: { prefixDefaultLocale: false }, // English at root; others under /es, /de, /fr
  },
  vite: { plugins: [tailwindcss()] },
});

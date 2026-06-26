# Ivory Arc Travels — Website

Private luxury travel atelier — fully customized heritage & spiritual journeys across **North India**.
The site exists to generate qualified leads through two conversion paths: the **IVY Estimator** (`/plan`) and **IVY on WhatsApp**.

Full strategy in `ivory-arc-website-architecture.md` (decision pack). This repo implements it in batches.

---

## Stack

- **Astro 5** — static output, deployed to **Cloudflare Pages**. No SSR adapter unless a Function is needed.
- **TypeScript** (strict).
- **Tailwind CSS v4** — CSS-first via `@tailwindcss/vite`; tokens live in `src/styles/global.css` (`@theme`). There is **no `tailwind.config.js`**.
- **MDX content collections** — typed with Zod in `src/content/config.ts`; invalid frontmatter fails the build.
- **Svelte** — used only for interactive islands (the estimator), to keep the JS budget small.
- **Fontsource** — self-hosted variable fonts (no third-party font CDN).

## Design system

- **Palette:** teal `#0E4A47` · cream `#F3EAD1` · gold `#D8B659` · ivory `#FFFEFB` · ink `#22302D`.
  Accessibility note: **gold is a fill/divider/icon colour only** — gold text passes contrast on teal (~5:1) but **fails on cream/ivory (~2:1)**, so never set gold as text on a light background.
- **Type:** Fraunces (display) + Inter (UI/body).
- **Motif:** the ogee arch from the logo (`public/brand/arch.svg`), used as a framing device.
- Utilities follow the tokens: `bg-teal`, `text-ink`, `border-gold`, `text-display`, `font-display`, etc. The text colour is `ink` (not `text`) to avoid clashing with Tailwind's `text-*` sizing utilities.

## Project structure

```
src/
  components/   reusable UI (Batch 2+)
  islands/      interactive Svelte components — estimator, switchers (Batch 4+)
  layouts/      BaseLayout + page layouts (Batch 2)
  lib/          pricing, whatsapp, analytics, schema helpers (Batch 2/4)
  i18n/         message catalogs: en/es/de/fr (Batch 3)
  content/      destinations · experiences · journeys · faqs (+ config.ts schema)
  pages/        routes (index.astro is a Phase-0 holding page)
  styles/       global.css (design tokens)
public/
  assets/       optimized AVIF/WebP imagery (<200 KB each)
  brand/        logo + arch.svg + payment badges
  robots.txt · llms.txt
.github/workflows/deploy.yml
```

## Run

```bash
npm install      # generates package-lock.json (commit it — CI uses `npm ci`)
npm run dev      # local dev server
npm run build    # static build → dist/
npm run preview  # preview the build
npm run check    # astro check (types + content validation)
npm run format   # prettier
```

## Deploy

GitHub Actions → Cloudflare Pages (`.github/workflows/deploy.yml`). Required repo secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

PRs build + type-check; pushes to `main` deploy. Lighthouse-CI and axe a11y gates are added in the launch-hardening phase.

## i18n

English is served at the root (`/`); other locales are prefixed (`/es`, `/de`, `/fr`) — see `astro.config.mjs`. Only English exists in Batch 1; localized routes/content land in Batch 3. Billing is always **INR**; the four display currencies (INR/USD/EUR/GBP) are indicative only.

## Build batches

1. **Foundation** — repo, design tokens, content schema, holding homepage, CI/CD, README. ✅
2. **Layout + chrome** — `BaseLayout`, SEO/`<head>` + Organization/TravelAgency JSON-LD, `Header` (logo mark + accessible mobile menu + scroll-aware transparent variant), `Footer`, `TrustStrip`, **`MobileConversionBar`**, `CTAButton`, `WhatsAppLink`, `Picture`, plus the thin-dataLayer analytics. ✅
3. **Homepage** — full sectioned homepage (image hero, trust strip, transparent-pricing explainer, browse-by-interest grid, sample-journey cards with indicative per-day bands, why-Ivory-Arc, IVY explainer in the signature arch-frame); localized routes at `/`, `/es`, `/de`, `/fr`; `hreflang` alternates; a `/plan` placeholder so the estimate CTA never 404s; three seed journeys in the content collection. ✅
4. **Estimator** — interactive IVY estimator as a Svelte 5 island on a real `/plan` page: region × tier × season × duration × party inputs produce a live **indicative INR range** (never a fixed price), with a WhatsApp handoff that opens the IVY chat pre-filled with the full trip context. Adds `src/lib/pricing.ts` (rate card + range model + INR formatter) and extends `whatsapp.ts` with the handoff message builder. Island JS (~19 KB gzip) loads only on `/plan`; the rest of the site stays zero-JS. English-only for now. ✅
5. **Wireframes** — visual mobile-first wireframes for homepage + estimator.

## Recent refinements (post-Batch 4)

- **Hindi (`/hi`) locale removed** — dropped from `astro.config.mjs`, `consts.ts`, and the `src/i18n` catalogs; the `src/pages/hi` routes were deleted. Live locales are now **en / es / de / fr**.
- **Reversed (white) logo mark + immersive header** — added a white version of the arch/compass mark (`public/brand/logo-mark-white.*`) and wired the homepage `Header` to the transparent-over-hero variant: it now sits fixed over the hero image and shows the white mark until scroll, then condenses to the solid teal header with the gold mark. Interior pages keep the solid sticky header. The white mark was derived by recolouring the official gold mark (clean edges, transparent compass disc) rather than keyed from the dark lockup.
- **Footer payments** — the four black-box card pills were replaced with a single **"Powered by Razorpay"** strip (`public/brand/payment/razorpay-strip.*`) showing the supported card networks, centred on a matching sub-band.
- **IVY explainer arch-frame enlarged** — the signature arch image grew from `max-w-xs` (320 px) to `max-w-md` (448 px) and the section grid was rebalanced to give the image more presence relative to the copy.
- **IVY explainer — ornamental gold arch** — the flat clip-path silhouette was replaced by the supplied gold ogee-arch artwork as a real ornamental frame. The photo is masked to the arch silhouette (`public/brand/arch-mask.png`) and the gold frame (`public/brand/arch-gold.{avif,webp}`) is overlaid on top; both are trimmed to the same source bbox so they stay pixel-aligned at any size. The frame was enlarged again (to `max-w-lg`, 512 px) and the column widened. The supplied art was a flattened near-white JPEG, so the gold was keyed to a transparent overlay and a filled silhouette mask was derived from it.
- **Estimator pricing grounded in the real rate card** — `src/lib/pricing.ts` coefficients were replaced with figures derived from the uploaded estimator (`index.html`): real per-adult nightly journey-services bases mapped per region (₹5,000–13,500), the real group-size reduction bands, and the brand's 10% coordination / 5% GST context. The displayed figure is journey services **excluding hotels** (exactly as the estimator and the result-card copy state). See pending notes for the full-engine option.
- **Ayodhya thumbnail replaced** — the "spiritual" interest tile now uses the supplied Shri Ram Mandir image, optimised to AVIF/WebP.

## Known pending inputs

- **Estimator pricing** ✅ grounded in the real rate card (above). One caveat to decide on: the uploaded `index.html` is a **complete, far richer estimator** (per-stop curated/custom routes with the "highest tier on route never drops" rule, live hotel rates + 10% coordination, vehicle classes by the km, private-guide language, group/child splits, 5% GST, OTP reveal, advance/balance payments, Firebase/Maps/Apps-Script hooks). The on-site `/plan` tool remains the **lightweight indicative** version (region × style × season × duration × party → an INR range, hotels excluded). Shipping the full engine as the actual `/plan` experience is a larger, separate integration — flagged, not done. Note the real rate card has **no seasonal dimension**, so the season control here is a light indicative nudge only.
- **IVY arch-frame photo** ✅ the ornamental gold arch is in place, framing the existing Pushkar photo. Swap the photo by changing the first `Picture base=` in `IvyExplainer.astro` — no other change needed (the mask + frame are photo-agnostic).
- **Ayodhya / Shri Ram Mandir thumbnail** ✅ swapped in and optimised. Caveats: the supplied source is **800×533** (smaller than the prior 1280×720 placeholder), so it is slightly softer on large/retina screens — a higher-resolution source is preferable for production; and **image licensing** still needs confirming for production use.
- **Razorpay strip is a placeholder composite** — the supplied graphic is AI-generated and a couple of the network marks are imperfect; swap in official badge assets and confirm display rights before launch.

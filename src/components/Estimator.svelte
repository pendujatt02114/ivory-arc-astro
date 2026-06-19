<script lang="ts">
  import { onMount } from 'svelte';
  import { waHref } from '../lib/whatsapp';
  import {
    DEST, EXPER, DEST_META, DEST_DESC,
    CURATED_ROUTES, INTERESTS, INTEREST_ROUTE_CAT, destsForInterest, CONFIG,
    type Interest, type Guide, type HotelTier,
  } from '../lib/estimator-data';

  /*
    Lead capture only. Pricing is intentionally NOT computed here — once the
    traveller has chosen their journey, we warm-transfer the full brief to IVY
    (our WhatsApp concierge), who shapes the itinerary and the transparent quote.
  */

  // ── state ───────────────────────────────────────────────
  let interest: Interest = $state('Heritage');
  let dest: string[] = $state([]);
  let nights: Record<string, number> = $state({});
  let adults = $state(2);
  let children = $state(0);
  let nat: 'foreign' | 'indian' = $state('foreign');
  let comfort: HotelTier = $state('none');
  let guide: Guide = $state('none');
  let addons: Record<string, boolean> = $state({});
  let startDate = $state('');
  let travellerName = $state('');
  let interacted = $state(false);

  // ── derived ─────────────────────────────────────────────
  const ready = $derived(dest.length > 0);
  const routesForInterest = $derived(
    CURATED_ROUTES.filter((r) => r.cat === INTEREST_ROUTE_CAT[interest])
  );
  const pickList = $derived(destsForInterest(interest));
  const addonGroups = $derived(
    Array.from(new Set(dest.map((k) => DEST[k]?.exp).filter((e): e is string => !!e && !!EXPER[e])))
  );
  const totalNights = $derived(Object.values(nights).reduce((a, b) => a + (b || 0), 0));

  const COMFORT: [string, string][] = [
    ['none', 'No preference'], ['comfort', 'Comfortable'], ['premium', 'Premium'], ['luxury', 'Luxury'],
  ];
  const GUIDE: [string, string][] = [
    ['none', 'Not sure yet'], ['english', 'English-speaking'], ['other', 'Other language'],
  ];
  const comfortLabel = $derived(COMFORT.find(([v]) => v === comfort)?.[1] ?? '');
  const guideLabel = $derived(GUIDE.find(([v]) => v === guide)?.[1] ?? '');

  // ── helpers ─────────────────────────────────────────────
  function mark() { if (!interacted) { interacted = true; track('estimator_start'); } }
  function track(event: string, params: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...params });
  }
  function pickInterest(id: Interest) {
    if (interest === id) return;
    interest = id; dest = []; nights = {}; addons = {}; mark();
  }
  function applyRoute(dests: string[]) {
    dest = [...dests];
    const n: Record<string, number> = {};
    dests.forEach((k) => (n[k] = DEST_META[k]?.ideal ?? 2));
    nights = n; addons = {}; mark();
  }
  function toggleDest(k: string) {
    if (dest.includes(k)) {
      dest = dest.filter((d) => d !== k);
      const n = { ...nights }; delete n[k]; nights = n;
    } else {
      dest = [...dest, k];
      nights = { ...nights, [k]: DEST_META[k]?.ideal ?? 2 };
    }
    const liveExp = new Set(dest.map((d) => DEST[d]?.exp));
    const a: Record<string, boolean> = {};
    Object.keys(addons).forEach((id) => {
      const owner = Object.keys(EXPER).find((e) => EXPER[e].some((x) => x.id === id));
      if (owner && liveExp.has(owner)) a[id] = addons[id];
    });
    addons = a; mark();
  }
  function setNights(k: string, v: number) {
    nights = { ...nights, [k]: Math.min(21, Math.max(1, v)) }; mark();
  }
  function stepAdults(d: number) { adults = Math.min(20, Math.max(1, adults + d)); mark(); }
  function stepChildren(d: number) { children = Math.min(10, Math.max(0, children + d)); mark(); }
  function toggleAddon(id: string) {
    if (addons[id]) { const a = { ...addons }; delete a[id]; addons = a; }
    else addons = { ...addons, [id]: true };
    mark();
  }

  function selectedExperiences(): string[] {
    return Object.keys(addons)
      .map((id) => {
        const owner = Object.keys(EXPER).find((e) => EXPER[e].some((x) => x.id === id));
        return owner ? EXPER[owner].find((x) => x.id === id)?.label ?? null : null;
      })
      .filter((x): x is string => !!x);
  }

  // ── warm transfer to IVY ────────────────────────────────
  function leadMessage(): string {
    const L: string[] = [];
    L.push('Hello IVY — please help me plan and price this private North India journey:', '');
    if (travellerName) L.push(`• Name: ${travellerName}`);
    L.push(`• Focus: ${INTERESTS.find((i) => i.id === interest)?.label ?? interest}`);
    if (dest.length)
      L.push(
        `• Destinations: ${dest
          .map((k) => `${DEST[k]?.name ?? k} (${nights[k] || 1} night${(nights[k] || 1) > 1 ? 's' : ''})`)
          .join(', ')}`
      );
    L.push(`• Total nights: ${totalNights}`);
    L.push(
      `• Travellers: ${adults} adult${adults > 1 ? 's' : ''}${
        children ? ` · ${children} child${children > 1 ? 'ren' : ''}` : ''
      } (${nat === 'foreign' ? 'foreign' : 'Indian'} nationals)`
    );
    if (startDate) L.push(`• Preferred start: ${startDate}`);
    if (comfort !== 'none') L.push(`• Comfort level: ${comfortLabel}`);
    if (guide !== 'none') L.push(`• Guide: ${guideLabel}`);
    const exp = selectedExperiences();
    if (exp.length) L.push(`• Experiences of interest: ${exp.join(', ')}`);
    L.push('', 'Could you put together an itinerary and a transparent quote for me?');
    return L.join('\n');
  }
  const waLink = $derived(waHref('ivy', leadMessage()));
  const mailLink = $derived(
    `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('Private journey enquiry — Ivory Arc')}&body=${encodeURIComponent(leadMessage())}`
  );
  function onSend() {
    track('lead_to_ivy', { interest, nights: totalNights, adults, children, destinations: dest.length });
  }

  onMount(() => track('estimator_view'));
</script>

<div class="grid gap-8 md:grid-cols-12 md:gap-10">
  <!-- ════ BUILDER ════ -->
  <div class="space-y-10 md:col-span-7">
    <!-- 1 · Interest -->
    <section>
      <p class="est-eyebrow">Step 1 · Your journey</p>
      <h2 class="est-h">What's calling you to North India?</h2>
      <div class="mt-4 grid grid-cols-2 gap-2.5">
        {#each INTERESTS as it}
          <button type="button" onclick={() => pickInterest(it.id)} aria-pressed={interest === it.id}
            class={`rounded-lg border px-3.5 py-3 text-left transition-colors ${interest === it.id ? 'border-teal bg-teal text-ivory' : 'border-line bg-ivory hover:border-teal/50'}`}>
            <span class="block text-sm font-semibold">{it.label}</span>
            <span class={`mt-0.5 block text-xs ${interest === it.id ? 'text-ivory/75' : 'text-muted'}`}>{it.blurb}</span>
          </button>
        {/each}
      </div>
    </section>

    <!-- 2 · Destinations -->
    <section>
      <p class="est-eyebrow">Step 2 · Where to</p>
      <h2 class="est-h">Choose your destinations</h2>
      {#if routesForInterest.length}
        <p class="mt-2 text-sm text-muted">Start from a curated route, or pick your own below.</p>
        <div class="mt-3 grid gap-2.5 sm:grid-cols-2">
          {#each routesForInterest as r}
            <button type="button" onclick={() => applyRoute(r.dests)}
              class="rounded-lg border border-line bg-ivory px-4 py-3 text-left transition-colors hover:border-teal/60">
              <span class="block text-sm font-semibold text-ink">{r.name}</span>
              <span class="mt-0.5 block text-xs text-muted">{r.desc}</span>
            </button>
          {/each}
        </div>
      {/if}
      <div class="mt-4 flex flex-wrap gap-2">
        {#each pickList as k}
          {@const on = dest.includes(k)}
          <button type="button" onclick={() => toggleDest(k)} aria-pressed={on}
            class={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-teal bg-teal text-ivory' : 'border-line text-ink hover:border-teal/50'}`}>
            {DEST[k].name}
          </button>
        {/each}
      </div>

      {#if dest.length}
        <div class="mt-5 space-y-2.5">
          {#each dest as k}
            <div class="flex items-center justify-between gap-3 rounded-lg border border-line bg-ivory px-4 py-2.5">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-ink">{DEST[k].name}</p>
                <p class="truncate text-xs text-muted">{DEST_DESC[k] ?? ''}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2.5">
                <button type="button" onclick={() => setNights(k, (nights[k] || 1) - 1)} aria-label={`Fewer nights in ${DEST[k].name}`} class="est-step">−</button>
                <span class="min-w-[3.5rem] text-center text-sm"><span class="font-display text-lg text-ink">{nights[k] || 1}</span> <span class="text-muted">nt</span></span>
                <button type="button" onclick={() => setNights(k, (nights[k] || 1) + 1)} aria-label={`More nights in ${DEST[k].name}`} class="est-step">+</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- 3 · Travellers -->
    <section>
      <p class="est-eyebrow">Step 3 · Your party</p>
      <div class="mt-3 grid grid-cols-2 gap-6">
        <div>
          <span class="mb-2 block text-sm font-medium text-ink">Adults</span>
          <div class="flex items-center gap-3">
            <button type="button" onclick={() => stepAdults(-1)} disabled={adults <= 1} class="est-step" aria-label="Fewer adults">−</button>
            <span class="min-w-[3rem] text-center font-display text-xl text-ink">{adults}</span>
            <button type="button" onclick={() => stepAdults(1)} class="est-step" aria-label="More adults">+</button>
          </div>
        </div>
        <div>
          <span class="mb-2 block text-sm font-medium text-ink">Children</span>
          <div class="flex items-center gap-3">
            <button type="button" onclick={() => stepChildren(-1)} disabled={children <= 0} class="est-step" aria-label="Fewer children">−</button>
            <span class="min-w-[3rem] text-center font-display text-xl text-ink">{children}</span>
            <button type="button" onclick={() => stepChildren(1)} class="est-step" aria-label="More children">+</button>
          </div>
        </div>
      </div>
      <fieldset class="mt-5">
        <legend class="mb-2 text-sm font-medium text-ink">Nationality <span class="font-normal text-muted">(helps IVY with monument entry & visas)</span></legend>
        <div class="grid grid-cols-2 gap-2.5">
          {#each [['foreign', 'Foreign national'], ['indian', 'Indian national']] as opt}
            <label class="relative block">
              <input type="radio" name="nat" value={opt[0]} bind:group={nat} onchange={mark} class="peer sr-only" />
              <span class="block cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{opt[1]}</span>
            </label>
          {/each}
        </div>
      </fieldset>
      <label class="mt-5 block">
        <span class="mb-2 block text-sm font-medium text-ink">Preferred start date <span class="font-normal text-muted">(optional)</span></span>
        <input type="date" bind:value={startDate} onchange={mark} class="w-full rounded-md border border-line bg-ivory px-4 py-3 text-ink" />
      </label>
    </section>

    <!-- 4 · Preferences -->
    <section>
      <p class="est-eyebrow">Step 4 · Preferences <span class="font-normal normal-case tracking-normal text-muted">(optional)</span></p>
      <div class="mt-3">
        <span class="mb-2 block text-sm font-medium text-ink">Comfort level</span>
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {#each COMFORT as opt}
            <label class="relative block">
              <input type="radio" name="comfort" value={opt[0]} bind:group={comfort} onchange={mark} class="peer sr-only" />
              <span class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{opt[1]}</span>
            </label>
          {/each}
        </div>
      </div>
      <div class="mt-4">
        <span class="mb-2 block text-sm font-medium text-ink">Private guide</span>
        <div class="grid grid-cols-3 gap-2.5">
          {#each GUIDE as opt}
            <label class="relative block">
              <input type="radio" name="guide" value={opt[0]} bind:group={guide} onchange={mark} class="peer sr-only" />
              <span class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{opt[1]}</span>
            </label>
          {/each}
        </div>
      </div>
    </section>

    <!-- 5 · Experiences -->
    {#if addonGroups.length}
      <section>
        <p class="est-eyebrow">Step 5 · Experiences <span class="font-normal normal-case tracking-normal text-muted">(optional)</span></p>
        <p class="mt-2 text-sm text-muted">Add anything you'd like to include — IVY will weave it into your itinerary.</p>
        <div class="mt-3 space-y-5">
          {#each addonGroups as g}
            <div>
              <p class="text-sm font-semibold text-ink">{DEST[dest.find((k) => DEST[k]?.exp === g) || '']?.name ?? ''}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each EXPER[g] as e}
                  {@const on = !!addons[e.id]}
                  <button type="button" onclick={() => toggleAddon(e.id)} aria-pressed={on}
                    class={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-teal bg-teal text-ivory' : 'border-line text-ink hover:border-teal/50'}`}>
                    {e.label}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>

  <!-- ════ WARM TRANSFER TO IVY ════ -->
  <aside class="md:col-span-5">
    <div class="rounded-xl border border-line bg-cream p-6 md:sticky md:top-24">
      <p class="est-eyebrow">Your trip so far</p>

      {#if !ready}
        <p class="mt-3 text-base text-muted">Choose a destination or two and your trip summary will build here — then hand it to IVY to shape the itinerary and a transparent quote.</p>
      {:else}
        <dl class="mt-3 space-y-2.5 text-sm">
          <div class="flex justify-between gap-3"><dt class="text-muted">Focus</dt><dd class="text-right text-ink">{INTERESTS.find((i) => i.id === interest)?.label}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">Destinations</dt><dd class="text-right text-ink">{dest.map((k) => DEST[k]?.name).join(', ')}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">Nights</dt><dd class="text-right text-ink">{totalNights}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">Travellers</dt><dd class="text-right text-ink">{adults} adult{adults > 1 ? 's' : ''}{children ? ` · ${children} child${children > 1 ? 'ren' : ''}` : ''}</dd></div>
          {#if startDate}<div class="flex justify-between gap-3"><dt class="text-muted">Start</dt><dd class="text-right text-ink">{startDate}</dd></div>{/if}
          {#if comfort !== 'none'}<div class="flex justify-between gap-3"><dt class="text-muted">Comfort</dt><dd class="text-right text-ink">{comfortLabel}</dd></div>{/if}
          {#if selectedExperiences().length}<div class="flex justify-between gap-3"><dt class="text-muted">Experiences</dt><dd class="text-right text-ink">{selectedExperiences().join(', ')}</dd></div>{/if}
        </dl>
      {/if}

      <label class="mt-5 block">
        <span class="mb-2 block text-sm font-medium text-ink">Your name <span class="font-normal text-muted">(optional)</span></span>
        <input type="text" bind:value={travellerName} oninput={mark} placeholder="So IVY can greet you" class="w-full rounded-md border border-line bg-ivory px-4 py-3 text-ink" />
      </label>

      <a href={waLink} target="_blank" rel="noopener noreferrer" onclick={onSend}
         class={`est-cta mt-5 ${ready ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!ready}>
        Continue on WhatsApp with IVY
      </a>
      <a href={ready ? mailLink : undefined} class={`est-cta-sec mt-2.5 w-full ${ready ? '' : 'pointer-events-none opacity-50'}`}>Send by email instead</a>

      <p class="mt-4 text-xs leading-relaxed text-muted">
        No pricing guesswork here — IVY shapes your itinerary and a transparent quote in INR, and the
        Ivory Arc team confirms every detail (hotels at actual cost plus a clear 10% coordination fee;
        children at 25%) before anything is booked.
      </p>
    </div>
  </aside>
</div>

<style>
  .est-eyebrow { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-teal-700); }
  .est-h { font-family: var(--font-display); font-size: var(--text-h3); color: var(--color-teal); margin-top: 0.35rem; }
  .est-step {
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--color-line); border-radius: 9999px; color: var(--color-teal);
    line-height: 1; transition: background-color .15s, color .15s; background: var(--color-ivory);
    width: 2.5rem; height: 2.5rem; font-size: 1.5rem;
  }
  .est-step:hover:not(:disabled) { background: var(--color-teal); color: var(--color-ivory); }
  .est-step:disabled { opacity: .4; }
  .est-cta {
    display: inline-flex; min-height: 48px; width: 100%; align-items: center; justify-content: center;
    border-radius: 0.5rem; background: var(--color-gold); padding-inline: 1.25rem;
    font-weight: 600; color: var(--color-ink); transition: background-color .15s; text-align: center;
  }
  .est-cta:hover { background: var(--color-gold-600); }
  .est-cta-sec {
    display: inline-flex; min-height: 44px; align-items: center; justify-content: center;
    border-radius: 0.5rem; border: 1px solid var(--color-teal); padding-inline: 0.75rem;
    font-size: 0.875rem; font-weight: 600; color: var(--color-teal); background: transparent; transition: background-color .15s, color .15s;
  }
  .est-cta-sec:hover { background: var(--color-teal); color: var(--color-ivory); }
</style>

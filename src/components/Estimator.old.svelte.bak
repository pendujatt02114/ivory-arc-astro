<script lang="ts">
  import { onMount } from 'svelte';
  import {
    computeEstimate,
    formatINR,
    REGION_META,
    TIER_META,
    SEASON_META,
    type Tier,
    type Season,
  } from '../lib/pricing';
  import { waHref, estimateMessage } from '../lib/whatsapp';
  import type { Region } from '../consts';

  const regions = (Object.keys(REGION_META) as Region[]).map((id) => ({
    id,
    label: REGION_META[id].label,
  }));
  const tiers = (Object.keys(TIER_META) as Tier[]).map((id) => ({ id, ...TIER_META[id] }));
  const seasons = (Object.keys(SEASON_META) as Season[]).map((id) => ({ id, ...SEASON_META[id] }));
  const interestOptions = ['Heritage', 'Spiritual', 'Wildlife', 'Mountains', 'Pilgrimage', 'Luxury'];

  let region: Region = $state('rajasthan');
  let tier: Tier = $state('luxury');
  let season: Season = $state('shoulder');
  let days = $state(7);
  let travelers = $state(2);
  let interests: string[] = $state([]);
  let interacted = $state(false);

  const est = $derived(computeEstimate({ region, tier, season, days, travelers }));
  const ctx = $derived({
    regionLabel: REGION_META[region].label,
    tierLabel: TIER_META[tier].label,
    seasonLabel: SEASON_META[season].label,
    days,
    travelers,
    interests,
    perDayLow: formatINR(est.perDayLow),
    perDayHigh: formatINR(est.perDayHigh),
    totalLow: formatINR(est.totalLow),
    totalHigh: formatINR(est.totalHigh),
  });
  const waLink = $derived(waHref('ivy', estimateMessage(ctx)));

  function track(event: string, params: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...params });
  }
  function markInteracted() {
    if (!interacted) {
      interacted = true;
      track('estimator_start');
    }
  }
  function stepDays(d: number) {
    days = Math.min(21, Math.max(3, days + d));
    markInteracted();
  }
  function stepTravelers(d: number) {
    travelers = Math.min(8, Math.max(1, travelers + d));
    markInteracted();
  }
  function toggleInterest(name: string) {
    interests = interests.includes(name)
      ? interests.filter((i) => i !== name)
      : [...interests, name];
    markInteracted();
  }
  function onSubmit() {
    track('estimate_to_whatsapp', {
      region,
      tier,
      season,
      days,
      travelers,
      per_day_low: est.perDayLow,
      per_day_high: est.perDayHigh,
      total_low: est.totalLow,
      total_high: est.totalHigh,
    });
  }

  onMount(() => track('estimator_view'));
</script>

<form class="grid gap-8 md:grid-cols-12 md:gap-10" onsubmit={(e) => e.preventDefault()}>
  <div class="space-y-7 md:col-span-7">
    <!-- Region -->
    <label class="block">
      <span class="mb-2 block text-sm font-medium text-ink">Where to</span>
      <select
        bind:value={region}
        onchange={markInteracted}
        class="w-full rounded-md border border-line bg-ivory px-4 py-3 text-ink"
      >
        {#each regions as r}
          <option value={r.id}>{r.label}</option>
        {/each}
      </select>
    </label>

    <!-- Tier -->
    <fieldset>
      <legend class="mb-3 text-sm font-medium text-ink">Style of stay</legend>
      <div class="grid grid-cols-3 gap-2">
        {#each tiers as o}
          <label class="relative block">
            <input
              type="radio"
              name="tier"
              value={o.id}
              bind:group={tier}
              onchange={markInteracted}
              class="peer sr-only"
            />
            <span
              class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-hover:border-teal/50 peer-focus-visible:ring-2 peer-focus-visible:ring-gold"
            >
              <span class="block text-sm font-medium">{o.label}</span>
              <span class="mt-0.5 block text-xs opacity-70">{o.note}</span>
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <!-- Season -->
    <fieldset>
      <legend class="mb-3 text-sm font-medium text-ink">When</legend>
      <div class="grid grid-cols-3 gap-2">
        {#each seasons as o}
          <label class="relative block">
            <input
              type="radio"
              name="season"
              value={o.id}
              bind:group={season}
              onchange={markInteracted}
              class="peer sr-only"
            />
            <span
              class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-hover:border-teal/50 peer-focus-visible:ring-2 peer-focus-visible:ring-gold"
            >
              <span class="block text-sm font-medium">{o.label}</span>
              <span class="mt-0.5 block text-xs opacity-70">{o.note}</span>
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <!-- Steppers -->
    <div class="grid grid-cols-2 gap-6">
      <div>
        <span class="mb-2 block text-sm font-medium text-ink">Duration</span>
        <div class="flex items-center gap-4">
          <button
            type="button"
            onclick={() => stepDays(-1)}
            disabled={days <= 3}
            aria-label="Fewer days"
            class="flex size-11 items-center justify-center rounded-full border border-line text-2xl leading-none text-teal transition-colors enabled:hover:bg-teal enabled:hover:text-ivory disabled:opacity-40"
          >−</button>
          <div class="min-w-[4.5rem] text-center" aria-live="polite">
            <span class="font-display text-2xl text-ink">{days}</span>
            <span class="ml-1 text-sm text-muted">days</span>
          </div>
          <button
            type="button"
            onclick={() => stepDays(1)}
            disabled={days >= 21}
            aria-label="More days"
            class="flex size-11 items-center justify-center rounded-full border border-line text-2xl leading-none text-teal transition-colors enabled:hover:bg-teal enabled:hover:text-ivory disabled:opacity-40"
          >+</button>
        </div>
      </div>
      <div>
        <span class="mb-2 block text-sm font-medium text-ink">Travellers</span>
        <div class="flex items-center gap-4">
          <button
            type="button"
            onclick={() => stepTravelers(-1)}
            disabled={travelers <= 1}
            aria-label="Fewer travellers"
            class="flex size-11 items-center justify-center rounded-full border border-line text-2xl leading-none text-teal transition-colors enabled:hover:bg-teal enabled:hover:text-ivory disabled:opacity-40"
          >−</button>
          <div class="min-w-[4.5rem] text-center" aria-live="polite">
            <span class="font-display text-2xl text-ink">{travelers}</span>
            <span class="ml-1 text-sm text-muted">{travelers === 1 ? 'guest' : 'guests'}</span>
          </div>
          <button
            type="button"
            onclick={() => stepTravelers(1)}
            disabled={travelers >= 8}
            aria-label="More travellers"
            class="flex size-11 items-center justify-center rounded-full border border-line text-2xl leading-none text-teal transition-colors enabled:hover:bg-teal enabled:hover:text-ivory disabled:opacity-40"
          >+</button>
        </div>
      </div>
    </div>

    <!-- Interests -->
    <fieldset>
      <legend class="text-sm font-medium text-ink">Interests <span class="text-muted">(optional)</span></legend>
      <div class="mt-3 flex flex-wrap gap-2">
        {#each interestOptions as name}
          {@const on = interests.includes(name)}
          <button
            type="button"
            aria-pressed={on}
            onclick={() => toggleInterest(name)}
            class={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-teal bg-teal text-ivory' : 'border-line text-ink hover:border-teal/50'}`}
          >
            {name}
          </button>
        {/each}
      </div>
    </fieldset>
  </div>

  <!-- Result -->
  <aside class="md:col-span-5">
    <div class="rounded-xl border border-line bg-cream p-6 md:sticky md:top-24">
      <p class="text-xs font-medium uppercase tracking-[0.2em] text-teal-700">Indicative estimate</p>
      <div aria-live="polite">
        <p class="mt-3 font-display text-3xl leading-tight text-ink">
          {ctx.perDayLow}<span class="text-muted">–</span>{ctx.perDayHigh}
        </p>
        <p class="text-sm text-muted">per day · billed in INR</p>
        <p class="mt-3 text-base text-ink">
          ≈ {ctx.totalLow}–{ctx.totalHigh}
          <span class="text-muted">for {days} {days === 1 ? 'day' : 'days'}</span>
        </p>
      </div>

      <span class="my-5 block h-px w-full bg-line" aria-hidden="true"></span>

      <ul class="space-y-1.5 text-sm text-muted">
        <li>{ctx.regionLabel}</li>
        <li>{ctx.tierLabel} · {ctx.seasonLabel} season</li>
        <li>
          {travelers}
          {travelers === 1 ? 'guest' : 'guests'}{interests.length ? ' · ' + interests.join(', ') : ''}
        </li>
      </ul>

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        onclick={onSubmit}
        class="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold px-6 text-base font-semibold text-ink transition-colors hover:bg-gold-600"
      >
        Continue on WhatsApp with IVY
      </a>

      <p class="mt-4 text-xs leading-relaxed text-muted">
        Indicative only — your exact quote is confirmed with IVY. Hotels at actual cost plus a
        clear 10% coordination fee; flights and personal expenses are excluded. 5% GST applies.
      </p>
    </div>
  </aside>
</form>

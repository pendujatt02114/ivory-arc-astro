<script lang="ts">
  import { onMount } from 'svelte';
  import { waHref } from '../lib/whatsapp';
  import {
    DEST, EXPER, HOTELS, VEH, FX, DEST_META, DEST_DESC, DEST_CATS,
    CURATED_ROUTES, INTERESTS, INTEREST_ROUTE_CAT, destsForInterest, CONFIG,
    type Cur, type Veh, type HotelTier, type Guide, type Interest,
  } from '../lib/estimator-data';
  import { summaryModel, fmt as fmtINR, rooms as roomsFor, type EstState, type Summary } from '../lib/estimator';

  // ── state ───────────────────────────────────────────────
  let interest: Interest = $state('Heritage');
  let mode: 'curated' | 'custom' = $state('curated');
  let dest: string[] = $state([]);
  let nights: Record<string, number> = $state({});
  let customNights = $state(4);
  let adults = $state(2);
  let children = $state(0);
  let nat: 'foreign' | 'indian' = $state('foreign');
  let guide: Guide = $state('none');
  let veh: Veh = $state('sedan');
  let hotel: HotelTier = $state('none');
  let addons: Record<string, number> = $state({});
  let cur: Cur = $state('INR');
  let startDate = $state('');
  let interacted = $state(false);
  let pdfBusy = $state(false);

  // ── derived ─────────────────────────────────────────────
  const S = $derived<EstState>({
    mode, dest, nights, customNights, adults, children, guide, veh, hotel, addons, cur, startDate,
  });
  const summary = $derived(summaryModel(S) as Summary);
  const escalate = $derived(adults > CONFIG.ESCALATE_ABOVE);
  const ready = $derived(dest.length > 0);
  const f = (inr: number) => fmtINR(cur, inr);

  const routesForInterest = $derived(
    CURATED_ROUTES.filter((r) => r.cat === INTEREST_ROUTE_CAT[interest])
  );
  const pickList = $derived(destsForInterest(interest));
  // experience groups for the chosen destinations
  const addonGroups = $derived(
    Array.from(new Set(dest.map((k) => DEST[k]?.exp).filter((e): e is string => !!e && !!EXPER[e])))
  );

  // ── helpers ─────────────────────────────────────────────
  function mark() {
    if (!interacted) { interacted = true; track('estimator_start'); }
  }
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
    nights = n; addons = {}; autoVeh(); mark();
  }
  function toggleDest(k: string) {
    if (dest.includes(k)) {
      dest = dest.filter((d) => d !== k);
      const n = { ...nights }; delete n[k]; nights = n;
    } else {
      dest = [...dest, k];
      nights = { ...nights, [k]: DEST_META[k]?.ideal ?? 2 };
    }
    // drop add-ons whose destination is no longer selected
    const liveExp = new Set(dest.map((d) => DEST[d]?.exp));
    const a: Record<string, number> = {};
    Object.keys(addons).forEach((id) => {
      const owner = Object.keys(EXPER).find((e) => EXPER[e].some((x) => x.id === id));
      if (owner && liveExp.has(owner)) a[id] = addons[id];
    });
    addons = a; autoVeh(); mark();
  }
  function setNights(k: string, v: number) {
    nights = { ...nights, [k]: Math.min(14, Math.max(1, v)) }; mark();
  }
  function stepAdults(d: number) { adults = Math.min(12, Math.max(1, adults + d)); autoVeh(); mark(); }
  function stepChildren(d: number) { children = Math.min(8, Math.max(0, children + d)); mark(); }
  function stepCustomNights(d: number) { customNights = Math.min(21, Math.max(0, customNights + d)); mark(); }
  function autoVeh() {
    const g = adults + children;
    veh = g <= 2 ? 'sedan' : g <= 4 ? 'suv' : 'tempo';
  }
  function toggleAddon(id: string) {
    if (addons[id] != null) { const a = { ...addons }; delete a[id]; addons = a; }
    else addons = { ...addons, [id]: Math.max(1, adults) };
    mark();
  }
  function stepAddon(id: string, d: number) {
    const v = Math.min(adults + children, Math.max(1, (addons[id] || 1) + d));
    addons = { ...addons, [id]: v }; mark();
  }

  const totalNights = $derived(
    mode === 'curated' ? Object.values(nights).reduce((a, b) => a + (b || 0), 0) : customNights
  );

  // ── handoff message ─────────────────────────────────────
  function handoffMessage(): string {
    const s = summary;
    const lines = [
      'Hello IVY — I built this on your estimator and would like to confirm an exact quote:',
      '',
      `• Focus: ${INTERESTS.find((i) => i.id === interest)?.label}`,
      `• Route: ${s.route || '—'}`,
      `• ${mode === 'curated' ? 'Nights' : 'Self-drive nights'}: ${totalNights}`,
      `• Travellers: ${adults} adult${adults > 1 ? 's' : ''}${children ? ` · ${children} child${children > 1 ? 'ren' : ''}` : ''} (${nat === 'foreign' ? 'foreign' : 'Indian'} nationals)`,
      `• Stays: ${HOTELS[hotel].l}`,
    ];
    if (startDate) lines.push(`• Start date: ${s.dateStart}`);
    if (mode === 'curated' && guide !== 'none') lines.push(`• Private guide: ${guide === 'english' ? 'English' : 'Other language'}`);
    if (mode === 'custom') lines.push(`• Vehicle: ${VEH[veh].l}`);
    const picked = Object.keys(addons);
    if (picked.length) {
      const labels = picked
        .map((id) => { const owner = Object.keys(EXPER).find((e) => EXPER[e].some((x) => x.id === id)); return owner ? EXPER[owner].find((x) => x.id === id)?.label : null; })
        .filter(Boolean);
      if (labels.length) lines.push(`• Experiences: ${labels.join(', ')}`);
    }
    lines.push(
      '',
      `Indicative total shown: ${f(s.total)} (${f(s.ppd)} per person, per day), incl. 5% GST.`,
      '',
      'Could you confirm availability and a transparent final quote?'
    );
    return lines.join('\n');
  }
  const waLink = $derived(escalate
    ? waHref('specialist', `Hello — I'd like to plan a private journey for a group of ${adults} adults in North India.`)
    : waHref('ivy', handoffMessage()));
  const mailLink = $derived(
    `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('Journey enquiry — Ivory Arc estimator')}&body=${encodeURIComponent(handoffMessage())}`
  );

  function onConfirm() {
    if (!escalate) {
      const s = summary;
      track('estimate_to_whatsapp', { interest, mode, nights: totalNights, adults, children, total_inr: s.total, ppd_inr: Math.round(s.ppd) });
    }
  }

  // ── PDF (lazy-loaded jsPDF; falls back to print) ─────────
  function loadScript(src: string): Promise<void> {
    return new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = src; sc.onload = () => res(); sc.onerror = () => rej(new Error('load failed'));
      document.head.appendChild(sc);
    });
  }
  async function downloadPDF() {
    if (escalate) return;
    pdfBusy = true;
    try {
      const w = window as any;
      if (!(w.jspdf && w.jspdf.jsPDF)) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }
      const s = summary;
      const doc = new w.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
      const M = 48; let y = 64; const W = doc.internal.pageSize.getWidth();
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(14, 74, 71);
      doc.text('Ivory Arc Travels', M, y);
      doc.setFontSize(11); doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'normal');
      y += 18; doc.text('Indicative journey estimate — billed in INR', M, y);
      y += 26; doc.setDrawColor(216, 182, 89); doc.line(M, y, W - M, y);
      const row = (label: string, val: string, bold = false) => {
        y += 20; doc.setTextColor(34, 48, 45); doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(bold ? 12 : 10.5); doc.text(label, M, y);
        doc.text(val, W - M, y, { align: 'right' });
      };
      y += 6;
      row('Focus', INTERESTS.find((i) => i.id === interest)?.label || '');
      row('Route', s.route || '—');
      row('Travellers', s.guestsLabel + (nat === 'foreign' ? ' · foreign nationals' : ' · Indian nationals'));
      row(mode === 'curated' ? 'Nights' : 'Self-drive nights', String(totalNights));
      if (startDate) row('Dates', `${s.dateStart} – ${s.dateEnd}`);
      row('Stays', HOTELS[hotel].l + (hotel !== 'none' ? ` · ${s.roomsCount} room${s.roomsCount > 1 ? 's' : ''}` : ''));
      y += 12; doc.setDrawColor(228, 221, 201); doc.line(M, y, W - M, y); y += 2;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(14, 74, 71);
      y += 20; doc.text('Investment breakdown', M, y);
      s.items.forEach(([label, val]) => row(label, f(val)));
      row('GST (5%)', f(s.gst));
      row('Grand total', f(s.total), true);
      row(`Per person, per day (${s.guests} guests · ${s.days} days)`, f(s.ppd));
      y += 12; doc.setDrawColor(228, 221, 201); doc.line(M, y, W - M, y);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(14, 74, 71);
      y += 20; doc.text('Payment schedule', M, y);
      row('Advance to confirm (10%)', f(s.adv));
      row('At least 7 days before (50%)', f(s.mid));
      row('Balance, 24 hours before (40%)', f(s.bal));
      y += 24; doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
      const note = 'Indicative only and valid 7 days. Hotels are billed at actual cost plus a clear 10% coordination fee; the final invoice supersedes this estimate. Monument entry fees vary by nationality and are charged at actuals. Flights and personal expenses are excluded. GST 09AYIPT0745R2ZH. Free cancellation up to 7 days before travel; GST is non-refundable once invoiced.';
      doc.text(doc.splitTextToSize(note, W - M * 2), M, y);
      doc.save('ivory-arc-estimate.pdf');
      track('estimate_pdf', { total_inr: s.total });
    } catch (e) {
      window.print();
    } finally {
      pdfBusy = false;
    }
  }

  onMount(() => track('estimator_view'));
</script>

<div class="grid gap-8 md:grid-cols-12 md:gap-10">
  <!-- ════ BUILDER ════ -->
  <div class="space-y-10 md:col-span-7">
    <!-- 1 · Interest + currency -->
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
      <label class="mt-4 flex items-center justify-between gap-3">
        <span class="text-sm text-muted">Show prices in</span>
        <select bind:value={cur} onchange={mark} class="rounded-md border border-line bg-ivory px-3 py-2 text-sm text-ink">
          {#each Object.keys(FX) as c}<option value={c}>{c}</option>{/each}
        </select>
      </label>
    </section>

    <!-- 2 · Mode -->
    <section>
      <p class="est-eyebrow">Step 2 · How we plan it</p>
      <div class="mt-3 grid grid-cols-2 gap-2.5">
        <button type="button" onclick={() => { mode = 'curated'; mark(); }} aria-pressed={mode === 'curated'}
          class={`rounded-lg border px-3.5 py-3 text-left transition-colors ${mode === 'curated' ? 'border-teal bg-teal text-ivory' : 'border-line bg-ivory hover:border-teal/50'}`}>
          <span class="block text-sm font-semibold">Curated by IVY</span>
          <span class={`mt-0.5 block text-xs ${mode === 'curated' ? 'text-ivory/75' : 'text-muted'}`}>All-inclusive day rate · private car, driver & sightseeing</span>
        </button>
        <button type="button" onclick={() => { mode = 'custom'; autoVeh(); mark(); }} aria-pressed={mode === 'custom'}
          class={`rounded-lg border px-3.5 py-3 text-left transition-colors ${mode === 'custom' ? 'border-teal bg-teal text-ivory' : 'border-line bg-ivory hover:border-teal/50'}`}>
          <span class="block text-sm font-semibold">Build your own route</span>
          <span class={`mt-0.5 block text-xs ${mode === 'custom' ? 'text-ivory/75' : 'text-muted'}`}>Priced by the road — distance, vehicle & driver nights</span>
        </button>
      </div>
    </section>

    <!-- 3 · Destinations -->
    <section>
      <p class="est-eyebrow">Step 3 · Where to</p>
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
          {#if mode === 'curated'}
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
          {:else}
            <div class="rounded-lg border border-line bg-ivory px-4 py-3">
              <p class="text-sm text-ink">Route from Delhi NCR: <span class="font-medium">{['Delhi'].concat(dest.map((k) => DEST[k].name)).join(' → ')}</span></p>
              <div class="mt-3 flex items-center gap-3">
                <span class="text-sm text-muted">Nights on the road</span>
                <button type="button" onclick={() => stepCustomNights(-1)} class="est-step" aria-label="Fewer nights">−</button>
                <span class="min-w-[3.5rem] text-center"><span class="font-display text-lg text-ink">{customNights}</span></span>
                <button type="button" onclick={() => stepCustomNights(1)} class="est-step" aria-label="More nights">+</button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <!-- 4 · Travellers -->
    <section>
      <p class="est-eyebrow">Step 4 · Your party</p>
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
      {#if children > 0}<p class="mt-2 text-xs text-muted">Children travel at 25% of the adult rate.</p>{/if}
      <fieldset class="mt-5">
        <legend class="mb-2 text-sm font-medium text-ink">Nationality <span class="font-normal text-muted">(monument entry fees vary by nationality)</span></legend>
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
        <span class="mb-2 block text-sm font-medium text-ink">Start date <span class="font-normal text-muted">(optional)</span></span>
        <input type="date" bind:value={startDate} onchange={mark} class="w-full rounded-md border border-line bg-ivory px-4 py-3 text-ink" />
      </label>
    </section>

    <!-- 5 · Guide / Vehicle -->
    {#if mode === 'curated'}
      <section>
        <p class="est-eyebrow">Step 5 · Private guide</p>
        <div class="mt-3 grid grid-cols-3 gap-2.5">
          {#each [['none', 'No guide', ''], ['english', 'English', '₹2,000/day'], ['other', 'Other language', '₹3,500/day']] as opt}
            <label class="relative block">
              <input type="radio" name="guide" value={opt[0]} bind:group={guide} onchange={mark} class="peer sr-only" />
              <span class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                <span class="block text-sm font-medium">{opt[1]}</span>
                {#if opt[2]}<span class="mt-0.5 block text-xs opacity-70">{opt[2]}</span>{/if}
              </span>
            </label>
          {/each}
        </div>
      </section>
    {:else}
      <section>
        <p class="est-eyebrow">Step 5 · Vehicle</p>
        <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {#each Object.keys(VEH) as v}
            <label class="relative block">
              <input type="radio" name="veh" value={v} bind:group={veh} onchange={mark} class="peer sr-only" />
              <span class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                <span class="block text-sm font-medium">{VEH[v as Veh].l}</span>
                <span class="mt-0.5 block text-xs opacity-70">₹{VEH[v as Veh].r}/km · {VEH[v as Veh].g}</span>
              </span>
            </label>
          {/each}
        </div>
      </section>
    {/if}

    <!-- 6 · Stays -->
    <section>
      <p class="est-eyebrow">Step 6 · Stays</p>
      <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {#each Object.keys(HOTELS) as h}
          <label class="relative block">
            <input type="radio" name="hotel" value={h} bind:group={hotel} onchange={mark} class="peer sr-only" />
            <span class="block h-full cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
              <span class="block text-sm font-medium">{HOTELS[h as HotelTier].l}</span>
              {#if HOTELS[h as HotelTier].n}<span class="mt-0.5 block text-xs opacity-70">~{f(HOTELS[h as HotelTier].n)}/night</span>{/if}
            </span>
          </label>
        {/each}
      </div>
      {#if hotel !== 'none'}<p class="mt-2 text-xs text-muted">Indicative per-room rate. We confirm live hotel rates and add a clear 10% coordination fee; the final invoice supersedes this estimate.</p>{/if}
    </section>

    <!-- 7 · Add-ons -->
    {#if addonGroups.length}
      <section>
        <p class="est-eyebrow">Step 7 · Experiences <span class="font-normal normal-case tracking-normal text-muted">(optional)</span></p>
        <div class="mt-3 space-y-5">
          {#each addonGroups as g}
            <div>
              <p class="text-sm font-semibold text-ink">{DEST[dest.find((k) => DEST[k]?.exp === g) || '']?.name ?? ''}</p>
              <div class="mt-2 space-y-2">
                {#each EXPER[g] as e}
                  {@const on = addons[e.id] != null}
                  <div class={`flex items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 transition-colors ${on ? 'border-teal/60 bg-cream' : 'border-line bg-ivory'}`}>
                    <button type="button" onclick={() => toggleAddon(e.id)} aria-pressed={on} class="min-w-0 flex-1 text-left">
                      <span class="block text-sm text-ink">{e.label}</span>
                      <span class="block text-xs text-muted">{e.price === 0 ? 'Complimentary' : `${f(e.price)} ${e.t === 'pp' ? 'per person' : 'per group'}`}</span>
                    </button>
                    {#if on}
                      <div class="flex shrink-0 items-center gap-2">
                        {#if e.t === 'pp'}
                          <button type="button" onclick={() => stepAddon(e.id, -1)} class="est-step-sm" aria-label="Fewer">−</button>
                          <span class="min-w-[2rem] text-center text-sm text-ink">{addons[e.id]}</span>
                          <button type="button" onclick={() => stepAddon(e.id, 1)} class="est-step-sm" aria-label="More">+</button>
                        {/if}
                        <button type="button" onclick={() => toggleAddon(e.id)} class="text-xs font-medium text-teal underline underline-offset-2">Remove</button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>

  <!-- ════ ESTIMATE ════ -->
  <aside class="md:col-span-5">
    <div class="rounded-xl border border-line bg-cream p-6 md:sticky md:top-24">
      {#if escalate}
        <p class="est-eyebrow">A journey for your group</p>
        <p class="mt-3 text-base text-ink">Groups above 10 adults are arranged personally by a specialist, so the pricing is exactly right for your party.</p>
        <a href={waLink} target="_blank" rel="noopener noreferrer" onclick={onConfirm} class="est-cta mt-6">Speak to a specialist</a>
      {:else if !ready}
        <p class="est-eyebrow">Your estimate</p>
        <p class="mt-3 text-base text-muted">Choose a destination or two and your indicative price will appear here — always in INR, with nothing hidden.</p>
        <ul class="mt-5 space-y-2.5 border-t border-line pt-5 text-sm text-muted">
          <li>Private vehicle, driver and sightseeing</li>
          <li>Hotels at actual cost + a clear 10% coordination fee</li>
          <li>No commission-driven shopping stops</li>
        </ul>
      {:else}
        <p class="est-eyebrow">Indicative estimate</p>
        <div aria-live="polite">
          <p class="mt-3 font-display text-3xl leading-tight text-ink">{f(summary.ppd)}</p>
          <p class="text-sm text-muted">per person, per day · billed in INR</p>
          <p class="mt-3 text-base text-ink">≈ {f(summary.total)} <span class="text-muted">total · {summary.guests} {summary.guests === 1 ? 'guest' : 'guests'} · {summary.days} days</span></p>
        </div>

        <details class="mt-5 border-t border-line pt-4">
          <summary class="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-teal [&::-webkit-details-marker]:hidden">
            <span>Investment breakdown</span>
            <span class="text-muted">{f(summary.total)}</span>
          </summary>
          <ul class="mt-3 space-y-1.5 text-sm">
            {#each summary.items as item}
              <li class="flex items-start justify-between gap-3 text-muted"><span>{item[0]}</span><span class="shrink-0 text-ink">{f(item[1])}</span></li>
            {/each}
            <li class="flex justify-between gap-3 border-t border-line pt-1.5 text-muted"><span>GST (5%)</span><span class="shrink-0 text-ink">{f(summary.gst)}</span></li>
            <li class="flex justify-between gap-3 font-semibold text-ink"><span>Grand total</span><span>{f(summary.total)}</span></li>
          </ul>
        </details>

        <div class="mt-4 rounded-lg border border-line bg-ivory p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Payment schedule</p>
          <ul class="mt-2.5 space-y-1.5 text-sm text-muted">
            <li class="flex justify-between gap-3"><span>Advance to confirm (10%)</span><span class="text-ink">{f(summary.adv)}</span></li>
            <li class="flex justify-between gap-3"><span>At least 7 days before (50%)</span><span class="text-ink">{f(summary.mid)}</span></li>
            <li class="flex justify-between gap-3"><span>Balance, 24 hours before (40%)</span><span class="text-ink">{f(summary.bal)}</span></li>
          </ul>
        </div>

        <a href={waLink} target="_blank" rel="noopener noreferrer" onclick={onConfirm} class="est-cta mt-5">Confirm with your Journey Manager</a>
        <div class="mt-2.5 flex gap-2.5">
          <a href={mailLink} class="est-cta-sec flex-1">Email this estimate</a>
          <button type="button" onclick={downloadPDF} disabled={pdfBusy} class="est-cta-sec flex-1">{pdfBusy ? 'Preparing…' : 'Download PDF'}</button>
        </div>

        <p class="mt-4 text-xs leading-relaxed text-muted">
          Indicative only and valid 7 days — your exact quote is confirmed with IVY. Hotels at actual cost plus a clear 10% coordination fee; monument entry fees vary by nationality and are charged at actuals. Flights and personal expenses are excluded.
          {#if cur !== 'INR'}<br />Converted at today's indicative rate — billing is processed in INR.{/if}
        </p>
      {/if}
    </div>
  </aside>
</div>

<style>
  .est-eyebrow { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-teal-700); }
  .est-h { font-family: var(--font-display); font-size: var(--text-h3); color: var(--color-teal); margin-top: 0.35rem; }
  .est-step, .est-step-sm {
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--color-line); border-radius: 9999px; color: var(--color-teal);
    line-height: 1; transition: background-color .15s, color .15s; background: var(--color-ivory);
  }
  .est-step { width: 2.5rem; height: 2.5rem; font-size: 1.5rem; }
  .est-step-sm { width: 2rem; height: 2rem; font-size: 1.1rem; }
  .est-step:hover:not(:disabled), .est-step-sm:hover:not(:disabled) { background: var(--color-teal); color: var(--color-ivory); }
  .est-step:disabled { opacity: .4; }
  .est-cta {
    display: inline-flex; min-height: 48px; width: 100%; align-items: center; justify-content: center;
    border-radius: 0.5rem; background: var(--color-gold); padding-inline: 1.25rem;
    font-weight: 600; color: var(--color-ink); transition: background-color .15s;
  }
  .est-cta:hover { background: var(--color-gold-600); }
  .est-cta-sec {
    display: inline-flex; min-height: 44px; align-items: center; justify-content: center;
    border-radius: 0.5rem; border: 1px solid var(--color-teal); padding-inline: 0.75rem;
    font-size: 0.875rem; font-weight: 600; color: var(--color-teal); background: transparent; transition: background-color .15s, color .15s;
  }
  .est-cta-sec:hover { background: var(--color-teal); color: var(--color-ivory); }
  .est-cta-sec:disabled { opacity: .5; }
</style>

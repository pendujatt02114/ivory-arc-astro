<script lang="ts">
  /*
    Journey Estimator — STRUCTURED INTENT CAPTURE ONLY (no pricing). Mirrors IVY's
    add-on logic, collects the brief, posts it CORS-proof (warm-lead.ts), and opens
    WhatsApp carrying the FULL brief in IVY's exact, ordered format. Fully localised.
    Step tabs are clickable, so editing an earlier answer never means refilling.
    Flow: You → Trip style → Experiences → Dates → Destinations → Travellers → Add-ons → Send.
  */
  import {
    THEMES, THEME_ORDER, EXPERIENCE_PREFS, EXCURSION_PREF,
    type ThemeKey, type ThemeDest,
  } from '../lib/ivy-themes';
  import { shortlistAddons, excursionsFor, type Addon } from '../lib/ivy-addons';
  import { buildWarmLead, submitWarmLead, makeRef, type EstimatorState } from '../lib/warm-lead';
  import { waBriefHref, waHref } from '../lib/whatsapp';
  import { buildScheduleParts, fmtDate } from '../lib/schedule';
  import { EST_I18N } from '../lib/estimator-i18n';
  import { useTranslations, type Lang } from '../i18n/ui';

  let { lang = 'en' }: { lang?: string } = $props();
  const L = $derived(EST_I18N[lang as Lang] ?? EST_I18N.en);
  const tt = useTranslations(lang as Lang);
  const themeLabel = (k: ThemeKey) => tt(`interest.${k}`);

  const GATEWAY = 'Delhi';                              // fixed arrival & departure city
  const VEH_LABELS: Record<string, string> = { sedan: 'Sedan', suv: 'SUV' };

  let step = $state(0);
  let maxReached = $state(0);

  // ---- collected fields (held at component level, so navigating back preserves them) ----
  let name = $state(''); let waId = $state(''); let email = $state('');
  let firstTime = $state<boolean | undefined>(undefined);
  let occasion = $state('none');
  let exploreDelhi = $state(false);                    // wants Delhi sightseeing -> Delhi add-ons
  let delhiStay = $state(false);                       // wants a Delhi hotel -> Delhi overnight leg
  let delhiNights = $state(1);
  let themes = $state<ThemeKey[]>([]);
  let prefIds = $state<string[]>([]);
  let excursions = $state(false);
  let picked = $state<{ key: string; name: string; nights: number }[]>([]); // ORDER = journey order
  let startDate = $state('');
  let currency = $state<'INR' | 'USD' | 'EUR' | 'GBP'>('USD');
  let adults = $state(2); let children = $state(0);
  let nationality = $state<'foreign' | 'indian'>('foreign');
  let vehicle = $state<'' | 'sedan' | 'suv'>('');
  let addonsSel = $state<Record<string, boolean>>({});

  let submitting = $state(false); let ref = $state(''); let waUrl = $state('');

  // Earliest selectable travel date = tomorrow (today and the past are blocked).
  const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();

  // 4+ adults can't sit in a Sedan — auto-pick the SUV, no choice shown.
  $effect(() => { if (adults > 3 && vehicle !== 'suv') vehicle = 'suv'; });

  const destPool = $derived.by(() => {
    const seen = new Set<string>(); const out: ThemeDest[] = [];
    for (const t of themes) for (const d of THEMES[t].all) if (!seen.has(d.key)) { seen.add(d.key); out.push(d); }
    return out;
  });
  const relevantPrefs = $derived(EXPERIENCE_PREFS.filter((p) => !p.themes || p.themes.some((t) => themes.includes(t))));
  const selectedPrefs = $derived(EXPERIENCE_PREFS.filter((p) => prefIds.includes(p.id)));

  // Delhi add-ons appear only when the traveller wants to explore Delhi.
  const delhiAddons = $derived.by(() =>
    exploreDelhi ? shortlistAddons('delhi', { themes, prefs: selectedPrefs, includeExcursions: false, limit: 6 }) : []);

  const selectedAddons = $derived.by(() => {
    const byKey: Record<string, string> = Object.fromEntries(picked.map((p) => [p.key, p.name]));
    byKey['delhi'] = GATEWAY;
    return Object.entries(addonsSel).filter(([, v]) => v).map(([k]) => {
      const [dest, ...rest] = k.split('::');
      return { name: rest.join('::'), destination: byKey[dest] || dest };
    });
  });

  // overnight legs in journey order (Delhi first, only if staying)
  const scheduleLegs = $derived.by(() => [
    ...(delhiStay ? [{ name: GATEWAY, nights: delhiNights }] : []),
    ...picked.map((p) => ({ name: p.name, nights: p.nights })),
  ]);
  // full route incl. Delhi book-ends: Delhi -> ordered cities -> Delhi
  const routeCities = $derived.by(() => [GATEWAY, ...picked.map((p) => p.name), GATEWAY]);
  const scheduleParts = $derived.by(() => buildScheduleParts(startDate || minDate, scheduleLegs));

  function toggleTheme(k: ThemeKey) {
    themes = themes.includes(k) ? themes.filter((x) => x !== k) : [...themes, k];
    picked = picked.filter((p) => destPool.some((d) => d.key === p.key));
  }
  function togglePref(id: string) { prefIds = prefIds.includes(id) ? prefIds.filter((x) => x !== id) : [...prefIds, id]; }
  function isPicked(key: string) { return picked.some((p) => p.key === key); }
  function togglePick(d: ThemeDest) {
    picked = isPicked(d.key) ? picked.filter((p) => p.key !== d.key) : [...picked, { key: d.key, name: d.name, nights: d.nights }];
  }
  function bumpNights(key: string, delta: number) {
    picked = picked.map((p) => (p.key === key ? { ...p, nights: Math.max(1, Math.min(14, p.nights + delta)) } : p));
  }
  function moveLeg(i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= picked.length) return;
    const next = [...picked]; [next[i], next[j]] = [next[j], next[i]]; picked = next;
  }
  function shortlistFor(destKey: string): Addon[] {
    return shortlistAddons(destKey, { themes, prefs: selectedPrefs, includeExcursions: false, limit: 5 });
  }
  function akey(dest: string, n: string) { return dest + '::' + n; }

  const canNext = $derived.by(() => {
    if (step === 0) return name.trim().length > 1 && /\d{8,}/.test(waId.replace(/\D/g, '')) && /.+@.+\..+/.test(email);
    if (step === 1) return themes.length > 0;
    if (step === 3) return !!startDate && startDate >= minDate;                          // Dates
    if (step === 4) return picked.length > 0;                                            // Destinations
    if (step === 5) return adults >= 1 && (adults > 3 || vehicle === 'sedan' || vehicle === 'suv');
    return true;
  });
  function next() { if (canNext && step < L.steps.length - 1) { step += 1; maxReached = Math.max(maxReached, step); } }
  function back() { if (step > 0) step -= 1; }
  function goStep(i: number) { if (i <= maxReached) step = i; } // jump to any unlocked step to edit it

  async function send() {
    submitting = true;
    const selectedKeys = Object.entries(addonsSel).filter(([, v]) => v).map(([k]) => {
      const [destination, ...rest] = k.split('::'); return { destination, name: rest.join('::') };
    });
    const overnightLegs = [
      ...(delhiStay ? [{ destination: 'delhi', nights: delhiNights }] : []),
      ...picked.map((p) => ({ destination: p.key, nights: p.nights })),
    ];
    const state: EstimatorState = {
      waId, email, name, firstTimeIndia: firstTime, occasion,
      themes, experiencePrefs: [...prefIds, ...(excursions ? [EXCURSION_PREF.id] : [])],
      startCity: GATEWAY, startDate, currency, adults, children, nationality,
      language: L.langName,
      vehicle: (vehicle || 'suv'),
      exploreDelhi, delhiStay, delhiNights: delhiStay ? delhiNights : undefined,
      routeOrder: routeCities,
      legs: overnightLegs,
      addonsSelected: selectedKeys,
    };
    const lead = buildWarmLead(state);
    try { const r = await submitWarmLead(lead); ref = r.ref; } catch { ref = lead.ref; }
    if (!ref) ref = lead.ref || makeRef();
    // The brief travels INSIDE the WhatsApp message, in IVY's exact order, so IVY
    // has the whole trip even if the backend store is unreachable — it adopts this
    // ref and never re-asks.
    waUrl = ref
      ? waBriefHref({
          name, ref,
          routeCities, startDate, scheduleLegs,
          adults, children, nationality,
          themes: themes.map((t) => themeLabel(t)),
          vehicleLabel: VEH_LABELS[vehicle || 'suv'],
          addons: selectedAddons,
          currency,
        })
      : waHref('ivy', `Hi IVY, this is ${name.split(' ')[0] || 'there'} — I planned a trip on your site.`);
    submitting = false;
  }
</script>

<div class="est">
  <ol class="steps" aria-label="Progress">
    {#each L.steps as s, i}
      <li>
        <button class="step" class:cur={i === step} class:done={i < maxReached && i !== step}
                disabled={i > maxReached} onclick={() => goStep(i)}>{i + 1}. {s}</button>
      </li>
    {/each}
  </ol>

  {#if !waUrl}
    <div class="card">
      {#if step === 0}
        <h3>{L.s0Title}</h3>
        <label class="fld">{L.name}<input bind:value={name} placeholder={L.namePh} /></label>
        <label class="fld">{L.wa}<input bind:value={waId} placeholder={L.waPh} inputmode="tel" /></label>
        <label class="fld">{L.email}<input bind:value={email} placeholder={L.emailPh} type="email" /></label>
        <div class="row">
          <span class="row-label">{L.firstTimeQ}</span>
          <div class="toggles">
            <button class="toggle" class:sel={firstTime === true} onclick={() => (firstTime = true)}>{L.yes}</button>
            <button class="toggle" class:sel={firstTime === false} onclick={() => (firstTime = false)}>{L.no}</button>
          </div>
        </div>
        <div class="row">
          <span class="row-label">{L.delhiExploreQ}</span>
          <div class="toggles">
            <button class="toggle" class:sel={exploreDelhi === true} onclick={() => (exploreDelhi = true)}>{L.yes}</button>
            <button class="toggle" class:sel={exploreDelhi === false} onclick={() => (exploreDelhi = false)}>{L.no}</button>
          </div>
        </div>
        <div class="row">
          <span class="row-label">{L.delhiStayQ}</span>
          <div class="toggles">
            <button class="toggle" class:sel={delhiStay === true} onclick={() => (delhiStay = true)}>{L.yes}</button>
            <button class="toggle" class:sel={delhiStay === false} onclick={() => (delhiStay = false)}>{L.no}</button>
          </div>
        </div>
        <label class="fld">{L.occasionQ}
          <select bind:value={occasion}>
            <option value="none">{L.occ.none}</option><option value="honeymoon">{L.occ.honeymoon}</option>
            <option value="anniversary">{L.occ.anniversary}</option><option value="birthday">{L.occ.birthday}</option>
            <option value="family">{L.occ.family}</option><option value="mice">{L.occ.mice}</option>
          </select>
        </label>
      {/if}

      {#if step === 1}
        <h3>{L.s1Title}</h3><p class="hint">{L.s1Hint}</p>
        <div class="opts">
          {#each THEME_ORDER as k}
            <button class="opt" class:sel={themes.includes(k)} onclick={() => toggleTheme(k)}>
              <span>{themeLabel(k)}</span>{#if themes.includes(k)}<span class="tick">✓</span>{/if}
            </button>
          {/each}
        </div>
      {/if}

      {#if step === 2}
        <h3>{L.s2Title}</h3><p class="hint">{L.s2Hint}</p>
        <div class="opts">
          {#each relevantPrefs as p}
            <button class="opt" class:sel={prefIds.includes(p.id)} onclick={() => togglePref(p.id)}>
              <span>{L.prefs[p.id] || p.label}</span>{#if prefIds.includes(p.id)}<span class="tick">✓</span>{/if}
            </button>
          {/each}
        </div>
        <label class="check"><input type="checkbox" bind:checked={excursions} /> {L.excursionPref}</label>
      {/if}

      {#if step === 3}
        <h3>{L.s4Title}</h3>
        <label class="fld">{L.startDate}<input type="date" min={minDate} bind:value={startDate} /></label>
        <label class="fld">{L.showPricesIn}
          <select bind:value={currency}>
            <option value="INR">₹ INR</option><option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option><option value="GBP">£ GBP</option>
          </select>
        </label>
      {/if}

      {#if step === 4}
        <h3>{L.s3Title}</h3><p class="hint">{L.s3Hint}</p>
        {#if delhiStay}
          <div class="opt opt-dest sel">
            <span class="opt-pick"><span class="tick">✓</span><span>{L.delhiGateway}</span></span>
            <span class="stepper">
              <button class="num" onclick={() => (delhiNights = Math.max(1, delhiNights - 1))} aria-label="-">–</button>
              <b>{delhiNights}</b> {L.nights}
              <button class="num" onclick={() => (delhiNights = Math.min(14, delhiNights + 1))} aria-label="+">+</button>
            </span>
          </div>
        {/if}
        {#if destPool.length === 0}<p class="hint">{L.s3Empty}</p>{/if}
        <div class="opts">
          {#each destPool as d}
            <div class="opt opt-dest" class:sel={isPicked(d.key)}>
              <button class="opt-pick" onclick={() => togglePick(d)}>
                {#if isPicked(d.key)}<span class="tick">✓</span>{/if}<span>{d.name}</span>
              </button>
              {#if isPicked(d.key)}
                {@const p = picked.find((x) => x.key === d.key)}
                <span class="stepper">
                  <button class="num" onclick={() => bumpNights(d.key, -1)} aria-label="-">–</button>
                  <b>{p?.nights}</b> {L.nights}
                  <button class="num" onclick={() => bumpNights(d.key, 1)} aria-label="+">+</button>
                </span>
              {/if}
            </div>
          {/each}
        </div>
        {#if picked.length > 1}
          <p class="hint">{L.reorderHint}</p>
          <ol class="order">
            <li class="order-row"><span class="order-city">{GATEWAY}</span><em>{L.gatewayTag}</em></li>
            {#each picked as p, i}
              <li class="order-row">
                <span class="order-city">{i + 1}. {p.name} · {p.nights}{L.nights[0]}</span>
                <span class="order-moves">
                  <button class="num" disabled={i === 0} onclick={() => moveLeg(i, -1)} aria-label="move up">↑</button>
                  <button class="num" disabled={i === picked.length - 1} onclick={() => moveLeg(i, 1)} aria-label="move down">↓</button>
                </span>
              </li>
            {/each}
            <li class="order-row"><span class="order-city">{GATEWAY}</span><em>{L.gatewayTag}</em></li>
          </ol>
        {/if}
      {/if}

      {#if step === 5}
        <h3>{L.s5Title}</h3>
        <div class="row"><span class="row-label">{L.adults}</span>
          <span class="stepper"><button class="num" onclick={() => (adults = Math.max(1, adults - 1))}>–</button><b>{adults}</b><button class="num" onclick={() => (adults = Math.min(20, adults + 1))}>+</button></span></div>
        <div class="row"><span class="row-label">{L.children}</span>
          <span class="stepper"><button class="num" onclick={() => (children = Math.max(0, children - 1))}>–</button><b>{children}</b><button class="num" onclick={() => (children = Math.min(20, children + 1))}>+</button></span></div>
        <label class="fld">{L.natQ}
          <select bind:value={nationality}><option value="foreign">{L.natIntl}</option><option value="indian">{L.natIndian}</option></select>
        </label>

        <div class="veh">
          <span class="veh-title">{L.vehQ}</span>
          {#if adults > 3}
            <div class="opt opt-dest sel"><span><b>SUV</b> · {L.vehSuvDesc}</span></div>
            <p class="hint">{L.vehAutoSuvNote}</p>
          {:else}
            <p class="hint">{L.vehChooseHint}</p>
            <div class="opts">
              <button class="opt" class:sel={vehicle === 'sedan'} onclick={() => (vehicle = 'sedan')}>
                <span><b>Sedan</b> · {L.vehSedanDesc}</span>{#if vehicle === 'sedan'}<span class="tick">✓</span>{/if}
              </button>
              <button class="opt" class:sel={vehicle === 'suv'} onclick={() => (vehicle = 'suv')}>
                <span><b>SUV</b> · {L.vehSuvDesc}</span>{#if vehicle === 'suv'}<span class="tick">✓</span>{/if}
              </button>
            </div>
          {/if}
        </div>
      {/if}

      {#if step === 6}
        <h3>{L.s6Title}</h3><p class="hint">{L.s6Hint}</p>
        {#if exploreDelhi && delhiAddons.length}
          <div class="addgroup">
            <h4>{GATEWAY}</h4>
            {#each delhiAddons as a}
              <label class="check"><input type="checkbox" bind:checked={addonsSel[akey('delhi', a.name)]} /> {a.name}{#if a.is_excursion}<em>· {L.excursionTag}</em>{/if}</label>
            {/each}
          </div>
        {/if}
        {#each picked as d}
          <div class="addgroup">
            <h4>{d.name}</h4>
            {#each shortlistFor(d.key) as a}
              <label class="check"><input type="checkbox" bind:checked={addonsSel[akey(d.key, a.name)]} /> {a.name}{#if a.is_excursion}<em>· {L.excursionTag}</em>{/if}</label>
            {/each}
            {#if excursions && excursionsFor(d.key).length}
              <p class="hint">{L.excursionsNear} {d.name}:</p>
              {#each excursionsFor(d.key).slice(0, 3) as a}
                <label class="check"><input type="checkbox" bind:checked={addonsSel[akey(d.key, a.name)]} /> {a.name} <em>· {L.excursionTag}</em></label>
              {/each}
            {/if}
          </div>
        {/each}
      {/if}

      {#if step === 7}
        <h3>{L.s7Title}</h3><p class="hint">{L.s7Hint}</p>
        <ul class="review">
          <li><b>{name}</b> · {adults} {L.adults}{children ? ` + ${children} ${L.children}` : ''} · {nationality === 'foreign' ? L.natIntl : L.natIndian}</li>
          <li>{themes.map((t) => themeLabel(t)).join(' · ')}</li>
          <li>{L.routeLabel}: {routeCities.join(' → ')}</li>
          <li>{L.startDate}: {startDate ? fmtDate(startDate) : '—'}</li>
          {#each scheduleParts as p}
            <li class="sched">{p.name}: {p.nights}{L.nights[0]} · {fmtDate(p.from)} → {fmtDate(p.to)}</li>
          {/each}
          <li>{L.vehQ}: {VEH_LABELS[vehicle || 'suv']}</li>
          <li>{L.steps[6]}: {selectedAddons.length ? selectedAddons.map((a) => `${a.name} (${a.destination})`).join(' · ') : '—'}</li>
          <li>{L.showPricesIn}: {currency}</li>
        </ul>
        <button class="btn btn-primary" disabled={submitting} onclick={send}>{submitting ? L.sending : L.send}</button>
      {/if}

      <div class="nav">
        {#if step > 0}<button class="btn btn-ghost" onclick={back}>{L.back}</button>{/if}
        {#if step < L.steps.length - 1}<button class="btn btn-primary" disabled={!canNext} onclick={next}>{L.cont}</button>{/if}
      </div>
    </div>
  {:else}
    <div class="card done-card">
      <h3>{L.doneTitle}{name ? `, ${name.split(' ')[0]}` : ''} 🎉</h3>
      <p>{@html (ref ? L.doneRef.replace('{ref}', `<b>${ref}</b>`) : L.errMsg)}</p>
      <a class="btn btn-primary" href={waUrl} target="_blank" rel="noopener">{L.openWa}</a>
    </div>
  {/if}
</div>

<style>
  /* Brand tokens come from global.css: --color-teal (royal green), --color-gold, etc.
     Every interactive class is explicit (no bare `button` selectors) so nothing
     collides and the brand colours always win. */
  .est { max-width: 640px; }

  .steps { display: flex; flex-wrap: wrap; gap: .25rem .6rem; list-style: none; padding: 0; margin: 0 0 1rem; }
  .step { background: none; border: 0; padding: .15rem 0; font: inherit; font-size: .74rem; color: var(--color-muted); cursor: pointer; }
  .step.done { color: var(--color-teal); }
  .step.cur { color: var(--color-teal); font-weight: 700; border-bottom: 2px solid var(--color-gold); }
  .step:disabled { color: var(--color-muted); opacity: .55; cursor: default; }

  .card { border: 1px solid var(--color-line); border-radius: 14px; padding: 1.25rem; background: var(--color-ivory); }
  h3 { margin: 0 0 .5rem; font-size: 1.18rem; color: var(--color-teal); }
  h4 { margin: .75rem 0 .25rem; font-size: .95rem; color: var(--color-ink); }
  .hint { color: var(--color-muted); font-size: .85rem; margin: .15rem 0 .7rem; }

  .fld { display: block; margin: .6rem 0; font-size: .9rem; color: var(--color-ink); }
  input, select { width: 100%; padding: .6rem .7rem; border: 1px solid var(--color-line); border-radius: 9px; font: inherit; margin-top: .25rem; background: #fff; color: var(--color-ink); }
  input:focus, select:focus { outline: 2px solid var(--color-gold); outline-offset: 1px; border-color: var(--color-gold-600); }

  /* uniform full-width option rows (themes / experiences / destinations / vehicles) */
  .opts { display: flex; flex-direction: column; gap: .5rem; }
  .opt { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: .5rem;
         padding: .8rem .9rem; border: 1.5px solid var(--color-line); border-radius: 11px;
         background: #fff; color: var(--color-ink); font: inherit; font-size: .95rem; text-align: left; cursor: pointer; }
  .opt.sel { border-color: var(--color-teal); background: rgba(14, 74, 71, .06); }
  .opt .tick, .tick { color: var(--color-teal); font-weight: 800; }
  .opt-dest { cursor: default; flex-wrap: wrap; }
  .opt-pick { flex: 1; display: flex; align-items: center; gap: .45rem; background: none; border: 0; font: inherit; font-size: .95rem; color: var(--color-ink); text-align: left; cursor: pointer; padding: 0; }

  .row { display: flex; align-items: center; gap: .6rem; margin: .7rem 0; }
  .row-label { flex: 1; font-size: .92rem; color: var(--color-ink); }
  .toggles { display: inline-flex; gap: .4rem; }
  .toggle { padding: .45rem 1rem; border: 1.5px solid var(--color-line); border-radius: 9px; background: #fff; color: var(--color-teal); font: inherit; cursor: pointer; }
  .toggle.sel { background: var(--color-teal); color: var(--color-gold); border-color: var(--color-teal); font-weight: 600; }

  .stepper { display: inline-flex; align-items: center; gap: .5rem; font-size: .9rem; white-space: nowrap; color: var(--color-ink); }
  .num { width: 2.1rem; height: 2.1rem; border: 1.5px solid var(--color-line); border-radius: 8px; background: var(--color-cream); color: var(--color-teal); font: inherit; font-size: 1.1rem; line-height: 1; cursor: pointer; }
  .num:hover { border-color: var(--color-teal); }
  .num:disabled { opacity: .4; cursor: default; border-color: var(--color-line); }

  /* journey order list */
  .order { list-style: none; padding: 0; margin: .3rem 0 0; border: 1px dashed var(--color-line); border-radius: 11px; }
  .order-row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem .8rem; border-top: 1px solid var(--color-line); }
  .order-row:first-child { border-top: 0; }
  .order-city { font-size: .92rem; color: var(--color-ink); }
  .order-moves { display: inline-flex; gap: .35rem; }

  /* vehicle picker */
  .veh { margin-top: .9rem; border-top: 1px solid var(--color-line); padding-top: .7rem; }
  .veh-title { display: block; font-size: .92rem; color: var(--color-ink); font-weight: 600; }

  .check { display: flex; align-items: center; gap: .5rem; margin: .4rem 0; font-size: .92rem; color: var(--color-ink); }
  .check input { width: auto; margin: 0; accent-color: var(--color-teal); }
  .addgroup { border-top: 1px solid var(--color-line); padding-top: .5rem; margin-top: .5rem; }
  .review { font-size: .92rem; padding-left: 1rem; color: var(--color-ink); }
  .review .sched { color: var(--color-muted); font-size: .86rem; list-style: circle; }
  em { color: var(--color-gold-600); font-style: normal; font-size: .8rem; }

  .nav { display: flex; justify-content: space-between; gap: .6rem; margin-top: 1.1rem; }

  /* the one brand CTA: royal green fill, gold label */
  .btn { padding: .7rem 1.2rem; border-radius: 9px; font: inherit; font-size: .95rem; cursor: pointer; border: 1.5px solid transparent; }
  .btn-primary { background: var(--color-teal); color: var(--color-gold); border-color: var(--color-teal); font-weight: 600; text-decoration: none; display: inline-block; }
  .btn-primary:hover { background: var(--color-teal-900); border-color: var(--color-teal-900); }
  .btn-primary:disabled { background: var(--color-line); color: var(--color-muted); border-color: var(--color-line); cursor: not-allowed; }
  .btn-ghost { background: #fff; color: var(--color-teal); border-color: var(--color-line); }
  .btn-ghost:hover { border-color: var(--color-teal); }

  .done-card { text-align: center; }
  .done-card .btn-primary { margin-top: .4rem; }
</style>

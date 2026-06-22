<script lang="ts">
  /*
    Journey Estimator — STRUCTURED INTENT CAPTURE ONLY (no pricing). Mirrors IVY's
    theme + experience-bucket + interest-tag add-on logic (ivy-themes.ts /
    ivy-addons.ts, generated from the pricing engine), collects the full brief IVY
    needs, POSTs it as a structured warm lead (warm-lead.ts), and opens WhatsApp
    with only "Hi IVY, this is {name} — ref {ref}". After the warm transfer IVY
    only asks the hotel preference, then runs hotel → total → 5% GST → payment.
    Fully localised in all six site languages (estimator-i18n.ts + interest.*).
  */
  import {
    THEMES, THEME_ORDER, EXPERIENCE_PREFS, EXCURSION_PREF,
    type ThemeKey, type ThemeDest,
  } from '../lib/ivy-themes';
  import { shortlistAddons, excursionsFor, type Addon } from '../lib/ivy-addons';
  import { buildWarmLead, submitWarmLead, type EstimatorState } from '../lib/warm-lead';
  import { waRefHref, waHref } from '../lib/whatsapp';
  import { EST_I18N } from '../lib/estimator-i18n';
  import { useTranslations, type Lang } from '../i18n/ui';

  let { lang = 'en' }: { lang?: string } = $props();
  const L = $derived(EST_I18N[lang as Lang] ?? EST_I18N.en);
  const tt = useTranslations(lang as Lang);
  const themeLabel = (k: ThemeKey) => tt(`interest.${k}`);

  let step = $state(0);

  // ---- collected fields ----
  let name = $state(''); let waId = $state(''); let email = $state('');
  let firstTime = $state<boolean | undefined>(undefined);
  let occasion = $state('none');
  let themes = $state<ThemeKey[]>([]);
  let prefIds = $state<string[]>([]);
  let excursions = $state(false);
  let picked = $state<{ key: string; name: string; nights: number }[]>([]);
  let startCity = $state('Delhi'); let startDate = $state('');
  let currency = $state<'INR' | 'USD' | 'EUR' | 'GBP'>('USD');
  let adults = $state(2); let children = $state(0);
  let nationality = $state<'foreign' | 'indian'>('foreign');
  let vehicle = $state<'' | 'sedan' | 'suv' | 'tempo' | 'highend'>('');
  let addonsSel = $state<Record<string, boolean>>({});

  let submitting = $state(false); let ref = $state(''); let waUrl = $state(''); let errMsg = $state('');

  const destPool = $derived.by(() => {
    const seen = new Set<string>(); const out: ThemeDest[] = [];
    for (const t of themes) for (const d of THEMES[t].all) if (!seen.has(d.key)) { seen.add(d.key); out.push(d); }
    return out;
  });
  const relevantPrefs = $derived(EXPERIENCE_PREFS.filter((p) => !p.themes || p.themes.some((t) => themes.includes(t))));
  const selectedPrefs = $derived(EXPERIENCE_PREFS.filter((p) => prefIds.includes(p.id)));

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
  function shortlistFor(destKey: string): Addon[] {
    return shortlistAddons(destKey, { themes, prefs: selectedPrefs, includeExcursions: false, limit: 5 });
  }
  function akey(dest: string, n: string) { return dest + '::' + n; }

  const canNext = $derived.by(() => {
    if (step === 0) return name.trim().length > 1 && /\d{8,}/.test(waId.replace(/\D/g, '')) && /.+@.+\..+/.test(email);
    if (step === 1) return themes.length > 0;
    if (step === 3) return picked.length > 0;
    if (step === 4) return !!startDate;
    if (step === 5) return adults >= 1;
    return true;
  });
  function next() { if (canNext && step < L.steps.length - 1) step += 1; }
  function back() { if (step > 0) step -= 1; }

  async function send() {
    submitting = true; errMsg = '';
    const selected = Object.entries(addonsSel).filter(([, v]) => v).map(([k]) => {
      const [destination, ...rest] = k.split('::'); return { destination, name: rest.join('::') };
    });
    const state: EstimatorState = {
      waId, email, name, firstTimeIndia: firstTime, occasion,
      themes, experiencePrefs: [...prefIds, ...(excursions ? [EXCURSION_PREF.id] : [])],
      startCity, startDate, currency, adults, children, nationality,
      vehicle: vehicle || undefined,
      legs: picked.map((p) => ({ destination: p.key, nights: p.nights })),
      addonsSelected: selected,
    };
    try {
      const r = await submitWarmLead(buildWarmLead(state));
      ref = r.ref; waUrl = waRefHref(name, ref); window.open(waUrl, '_blank');
    } catch (e) {
      errMsg = L.errMsg;
      waUrl = waHref('ivy', `Hi IVY, this is ${name.split(' ')[0] || 'there'} — I just planned a trip on your site.`);
    } finally { submitting = false; }
  }
</script>

<div class="est">
  <ol class="steps" aria-label="Progress">
    {#each L.steps as s, i}<li class:active={i === step} class:done={i < step}>{i + 1}. {s}</li>{/each}
  </ol>

  {#if !ref && !waUrl}
    <div class="card">
      {#if step === 0}
        <h3>{L.s0Title}</h3>
        <label>{L.name}<input bind:value={name} placeholder={L.namePh} /></label>
        <label>{L.wa}<input bind:value={waId} placeholder={L.waPh} inputmode="tel" /></label>
        <label>{L.email}<input bind:value={email} placeholder={L.emailPh} type="email" /></label>
        <div class="row">
          <span>{L.firstTimeQ}</span>
          <button class:sel={firstTime === true} onclick={() => (firstTime = true)}>{L.yes}</button>
          <button class:sel={firstTime === false} onclick={() => (firstTime = false)}>{L.no}</button>
        </div>
        <label>{L.occasionQ}
          <select bind:value={occasion}>
            <option value="none">{L.occ.none}</option><option value="honeymoon">{L.occ.honeymoon}</option>
            <option value="anniversary">{L.occ.anniversary}</option><option value="birthday">{L.occ.birthday}</option>
            <option value="family">{L.occ.family}</option><option value="mice">{L.occ.mice}</option>
          </select>
        </label>
      {/if}

      {#if step === 1}
        <h3>{L.s1Title}</h3><p class="hint">{L.s1Hint}</p>
        <div class="chips">
          {#each THEME_ORDER as k}
            <button class="chip" class:sel={themes.includes(k)} onclick={() => toggleTheme(k)}>{themeLabel(k)}</button>
          {/each}
        </div>
      {/if}

      {#if step === 2}
        <h3>{L.s2Title}</h3><p class="hint">{L.s2Hint}</p>
        <div class="chips">
          {#each relevantPrefs as p}
            <button class="chip" class:sel={prefIds.includes(p.id)} onclick={() => togglePref(p.id)}>{L.prefs[p.id] || p.label}</button>
          {/each}
        </div>
        <label class="check"><input type="checkbox" bind:checked={excursions} /> {L.excursionPref}</label>
      {/if}

      {#if step === 3}
        <h3>{L.s3Title}</h3><p class="hint">{L.s3Hint}</p>
        {#if destPool.length === 0}<p class="hint">{L.s3Empty}</p>{/if}
        <div class="dests">
          {#each destPool as d}
            <div class="dest" class:sel={isPicked(d.key)}>
              <button class="pick" onclick={() => togglePick(d)}>{isPicked(d.key) ? '✓ ' : ''}{d.name}</button>
              {#if isPicked(d.key)}
                {@const p = picked.find((x) => x.key === d.key)}
                <span class="stepper">
                  <button onclick={() => bumpNights(d.key, -1)} aria-label="-">–</button>
                  <b>{p?.nights}</b> {L.nights}
                  <button onclick={() => bumpNights(d.key, 1)} aria-label="+">+</button>
                </span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if step === 4}
        <h3>{L.s4Title}</h3>
        <label>{L.startCity}<input bind:value={startCity} placeholder={L.startCityPh} /></label>
        <label>{L.startDate}<input type="date" bind:value={startDate} /></label>
        <label>{L.showPricesIn}
          <select bind:value={currency}>
            <option value="INR">₹ INR</option><option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option><option value="GBP">£ GBP</option>
          </select>
        </label>
      {/if}

      {#if step === 5}
        <h3>{L.s5Title}</h3>
        <div class="row"><span>{L.adults}</span>
          <button onclick={() => (adults = Math.max(1, adults - 1))}>–</button><b>{adults}</b>
          <button onclick={() => (adults = Math.min(20, adults + 1))}>+</button></div>
        <div class="row"><span>{L.children}</span>
          <button onclick={() => (children = Math.max(0, children - 1))}>–</button><b>{children}</b>
          <button onclick={() => (children = Math.min(20, children + 1))}>+</button></div>
        <label>{L.natQ}
          <select bind:value={nationality}><option value="foreign">{L.natIntl}</option><option value="indian">{L.natIndian}</option></select>
        </label>
        <label>{L.vehQ}
          <select bind:value={vehicle}>
            <option value="">{L.vehRecommend}</option><option value="sedan">Sedan</option>
            <option value="suv">SUV</option><option value="tempo">Tempo Traveller</option><option value="highend">Mercedes / Audi / BMW</option>
          </select>
        </label>
      {/if}

      {#if step === 6}
        <h3>{L.s6Title}</h3><p class="hint">{L.s6Hint}</p>
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
          <li>{picked.map((p) => `${p.name} (${p.nights}${L.nights[0]})`).join(' → ')}</li>
          <li>{L.startCity}: {startCity} · {startDate || '—'} · {currency}</li>
        </ul>
        {#if errMsg}<p class="err">{errMsg}</p>{/if}
        <button class="primary" disabled={submitting} onclick={send}>{submitting ? L.sending : L.send}</button>
      {/if}

      <div class="nav">
        {#if step > 0}<button onclick={back}>{L.back}</button>{/if}
        {#if step < L.steps.length - 1}<button class="primary" disabled={!canNext} onclick={next}>{L.cont}</button>{/if}
      </div>
    </div>
  {:else}
    <div class="card done-card">
      <h3>{L.doneTitle}{name ? `, ${name.split(' ')[0]}` : ''} 🎉</h3>
      {#if ref}<p>{@html L.doneRef.replace('{ref}', `<b>${ref}</b>`)}</p>{:else}<p>{errMsg}</p>{/if}
      <a class="primary" href={waUrl} target="_blank" rel="noopener">{L.openWa}</a>
    </div>
  {/if}
</div>

<style>
  .est { max-width: 640px; }
  .steps { display: flex; flex-wrap: wrap; gap: .35rem; list-style: none; padding: 0; margin: 0 0 1rem; font-size: .72rem; }
  .steps li { color: #8a8a8a; } .steps li.active { color: #0f766e; font-weight: 600; } .steps li.done { color: #0f766e; }
  .card { border: 1px solid #e6e1d8; border-radius: 12px; padding: 1.25rem; background: #fff; }
  h3 { margin: 0 0 .5rem; font-size: 1.15rem; } h4 { margin: .75rem 0 .25rem; font-size: .95rem; }
  .hint { color: #7a7a7a; font-size: .85rem; margin: .15rem 0 .6rem; }
  label { display: block; margin: .55rem 0; font-size: .9rem; }
  input, select { width: 100%; padding: .55rem .65rem; border: 1px solid #d9d4c9; border-radius: 8px; font: inherit; margin-top: .2rem; }
  .row { display: flex; align-items: center; gap: .5rem; margin: .6rem 0; font-size: .9rem; } .row span { flex: 1; }
  .chips { display: flex; flex-wrap: wrap; gap: .5rem; }
  .chip { padding: .5rem .8rem; border: 1px solid #d9d4c9; border-radius: 999px; background: #faf8f3; cursor: pointer; font: inherit; }
  .chip.sel, button.sel { background: #0f766e; color: #fff; border-color: #0f766e; }
  .dests { display: grid; gap: .5rem; }
  .dest { display: flex; align-items: center; justify-content: space-between; gap: .5rem; border: 1px solid #e6e1d8; border-radius: 8px; padding: .4rem .5rem; }
  .dest.sel { border-color: #0f766e; }
  .pick { background: none; border: 0; font: inherit; cursor: pointer; text-align: left; flex: 1; }
  .stepper { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; white-space: nowrap; }
  .stepper button, .row button { width: 2rem; height: 2rem; border: 1px solid #d9d4c9; border-radius: 6px; background: #faf8f3; cursor: pointer; font: inherit; }
  .check { display: flex; align-items: center; gap: .5rem; } .check input { width: auto; margin: 0; }
  .addgroup { border-top: 1px solid #eee; padding-top: .4rem; }
  .review { font-size: .9rem; padding-left: 1rem; }
  em { color: #9a7b3f; font-style: normal; font-size: .8rem; }
  .nav { display: flex; justify-content: space-between; gap: .5rem; margin-top: 1rem; }
  .nav button, .primary { padding: .6rem 1.1rem; border-radius: 8px; border: 1px solid #d9d4c9; background: #faf8f3; cursor: pointer; font: inherit; }
  .primary { background: #0f766e; color: #fff; border-color: #0f766e; text-decoration: none; display: inline-block; }
  .primary:disabled { opacity: .5; cursor: not-allowed; } .err { color: #b4232a; font-size: .85rem; } .done-card { text-align: center; }
</style>

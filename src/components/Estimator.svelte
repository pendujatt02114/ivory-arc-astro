<script lang="ts">
  import { onMount } from 'svelte';
  import { waHref } from '../lib/whatsapp';
  import { captureLead, track } from '../lib/analytics';
  import {
    DEST, EXPER, DEST_META, DEST_DESC,
    CURATED_ROUTES, INTERESTS, INTEREST_ROUTE_CAT, destsForInterest, CONFIG,
    type Interest, type Guide, type HotelTier,
  } from '../lib/estimator-data';

  /*
    Lead capture only. Pricing is intentionally NOT computed here — once the
    traveller has chosen their journey we warm-transfer the full brief to IVY
    (our WhatsApp concierge), who shapes the itinerary and the transparent quote.
    The brief is written in the language the visitor is viewing the site in, and
    opens by telling IVY which language to continue in — so there is no
    disconnect between the page and the chatbot.
  */
  let { lang = 'en' }: { lang?: string } = $props();

  // ── localized UI + handoff strings (chrome only; destination data stays as-is) ──
  type S = Record<string, string>;
  const STR: Record<string, S> = {
    en: {
      s1e: 'Step 1 · Your journey', s1t: "What's calling you to North India?",
      s2e: 'Step 2 · Where to', s2t: 'Choose your destinations', s2h: 'Start from a curated route, or pick your own below.',
      nt: 'nt', s3e: 'Step 3 · Your party', adults: 'Adults', children: 'Children',
      nationality: 'Nationality', natHint: '(helps IVY with monument entry & visas)',
      foreign: 'Foreign national', indian: 'Indian national', startDate: 'Preferred start date', optional: '(optional)',
      s4e: 'Step 4 · Preferences', comfortLevel: 'Comfort level', cNone: 'No preference', cComfort: 'Comfortable', cPremium: 'Premium', cLuxury: 'Luxury',
      guide: 'Private guide', gNone: 'Not sure yet', gEnglish: 'English-speaking', gOther: 'Other language',
      s5e: 'Step 5 · Experiences', s5h: "Add anything you'd like to include — IVY will weave it into your itinerary.",
      asideE: 'Your trip so far', asideEmpty: 'Choose a destination or two and your trip summary will build here — then hand it to IVY to shape the itinerary and a transparent quote.',
      focus: 'Focus', destinations: 'Destinations', nights: 'Nights', travellers: 'Travellers', start: 'Start', comfort: 'Comfort', experiences: 'Experiences',
      yourName: 'Your name', nameHint: 'So IVY can greet you',
      ctaWa: 'Continue on WhatsApp with IVY', ctaMail: 'Send by email instead',
      reassure: 'No pricing guesswork here — IVY shapes your itinerary and a transparent quote in INR, and the Ivory Arc team confirms every detail (hotels at actual cost plus a clear 10% coordination fee; children at 25%) before anything is booked.',
      adultsN: 'adults', childrenN: 'children', nightsU: 'nights',
      langNote: "🌐 I'm viewing your site in English — please reply in English.",
      greeting: 'Hello IVY — please help me plan and price this private North India journey:',
      lFocus: 'Focus', lDest: 'Destinations', lTotal: 'Total nights', lTrav: 'Travellers', lForeign: 'foreign nationals', lIndian: 'Indian nationals', lStart: 'Preferred start', lComfort: 'Comfort level', lGuide: 'Guide', lExp: 'Experiences of interest', lName: 'Name',
      closing: 'Could you put together an itinerary and a transparent quote for me?',
      subject: 'Private journey enquiry — Ivory Arc',
    },
    es: {
      s1e: 'Paso 1 · Tu viaje', s1t: '¿Qué te atrae del norte de la India?',
      s2e: 'Paso 2 · Destinos', s2t: 'Elige tus destinos', s2h: 'Empieza con una ruta curada o elige los tuyos abajo.',
      nt: 'n', s3e: 'Paso 3 · Tu grupo', adults: 'Adultos', children: 'Niños',
      nationality: 'Nacionalidad', natHint: '(ayuda a IVY con entradas a monumentos y visados)',
      foreign: 'Extranjero', indian: 'Indio', startDate: 'Fecha de inicio preferida', optional: '(opcional)',
      s4e: 'Paso 4 · Preferencias', comfortLevel: 'Nivel de confort', cNone: 'Sin preferencia', cComfort: 'Cómodo', cPremium: 'Premium', cLuxury: 'Lujo',
      guide: 'Guía privado', gNone: 'Aún no lo sé', gEnglish: 'De habla inglesa', gOther: 'Otro idioma',
      s5e: 'Paso 5 · Experiencias', s5h: 'Añade lo que quieras incluir; IVY lo integrará en tu itinerario.',
      asideE: 'Tu viaje hasta ahora', asideEmpty: 'Elige uno o dos destinos y el resumen de tu viaje aparecerá aquí; luego pásalo a IVY para crear el itinerario y un presupuesto transparente.',
      focus: 'Enfoque', destinations: 'Destinos', nights: 'Noches', travellers: 'Viajeros', start: 'Inicio', comfort: 'Confort', experiences: 'Experiencias',
      yourName: 'Tu nombre', nameHint: 'Para que IVY pueda saludarte',
      ctaWa: 'Continuar en WhatsApp con IVY', ctaMail: 'Enviar por correo',
      reassure: 'Sin adivinanzas de precios: IVY crea tu itinerario y un presupuesto transparente en INR, y el equipo de Ivory Arc confirma cada detalle (hoteles a coste real más una comisión de coordinación clara del 10%; niños al 25%) antes de reservar nada.',
      adultsN: 'adultos', childrenN: 'niños', nightsU: 'noches',
      langNote: '🌐 Estoy viendo tu sitio en español — por favor, responde en español.',
      greeting: 'Hola IVY, ayúdame a planificar y cotizar este viaje privado por el norte de la India:',
      lFocus: 'Enfoque', lDest: 'Destinos', lTotal: 'Noches en total', lTrav: 'Viajeros', lForeign: 'extranjeros', lIndian: 'indios', lStart: 'Inicio preferido', lComfort: 'Nivel de confort', lGuide: 'Guía', lExp: 'Experiencias de interés', lName: 'Nombre',
      closing: '¿Podrías preparar un itinerario y un presupuesto transparente para mí?',
      subject: 'Consulta de viaje privado — Ivory Arc',
    },
    de: {
      s1e: 'Schritt 1 · Ihre Reise', s1t: 'Was zieht Sie nach Nordindien?',
      s2e: 'Schritt 2 · Wohin', s2t: 'Wählen Sie Ihre Reiseziele', s2h: 'Beginnen Sie mit einer kuratierten Route oder wählen Sie unten selbst.',
      nt: 'N', s3e: 'Schritt 3 · Ihre Gruppe', adults: 'Erwachsene', children: 'Kinder',
      nationality: 'Nationalität', natHint: '(hilft IVY bei Monument-Eintritt & Visa)',
      foreign: 'Ausländisch', indian: 'Indisch', startDate: 'Bevorzugtes Startdatum', optional: '(optional)',
      s4e: 'Schritt 4 · Präferenzen', comfortLevel: 'Komfortstufe', cNone: 'Keine Präferenz', cComfort: 'Komfortabel', cPremium: 'Premium', cLuxury: 'Luxus',
      guide: 'Privater Guide', gNone: 'Noch unklar', gEnglish: 'Englischsprachig', gOther: 'Andere Sprache',
      s5e: 'Schritt 5 · Erlebnisse', s5h: 'Fügen Sie alles hinzu, was Sie möchten — IVY baut es in Ihre Reiseroute ein.',
      asideE: 'Ihre Reise bisher', asideEmpty: 'Wählen Sie ein bis zwei Reiseziele und Ihre Zusammenfassung erscheint hier — übergeben Sie sie dann IVY für die Route und ein transparentes Angebot.',
      focus: 'Fokus', destinations: 'Reiseziele', nights: 'Nächte', travellers: 'Reisende', start: 'Start', comfort: 'Komfort', experiences: 'Erlebnisse',
      yourName: 'Ihr Name', nameHint: 'Damit IVY Sie begrüßen kann',
      ctaWa: 'Auf WhatsApp mit IVY fortfahren', ctaMail: 'Stattdessen per E-Mail senden',
      reassure: 'Kein Rätselraten beim Preis — IVY erstellt Ihre Route und ein transparentes Angebot in INR, und das Ivory-Arc-Team bestätigt jedes Detail (Hotels zum tatsächlichen Preis plus klare 10% Koordinationsgebühr; Kinder zu 25%), bevor etwas gebucht wird.',
      adultsN: 'Erwachsene', childrenN: 'Kinder', nightsU: 'Nächte',
      langNote: '🌐 Ich sehe Ihre Website auf Deutsch — bitte antworten Sie auf Deutsch.',
      greeting: 'Hallo IVY, bitte helfen Sie mir, diese private Nordindien-Reise zu planen und zu kalkulieren:',
      lFocus: 'Fokus', lDest: 'Reiseziele', lTotal: 'Nächte insgesamt', lTrav: 'Reisende', lForeign: 'ausländische Staatsbürger', lIndian: 'indische Staatsbürger', lStart: 'Bevorzugter Start', lComfort: 'Komfortstufe', lGuide: 'Guide', lExp: 'Gewünschte Erlebnisse', lName: 'Name',
      closing: 'Könnten Sie mir eine Reiseroute und ein transparentes Angebot zusammenstellen?',
      subject: 'Anfrage Privatreise — Ivory Arc',
    },
    fr: {
      s1e: 'Étape 1 · Votre voyage', s1t: "Qu'est-ce qui vous attire dans le nord de l'Inde ?",
      s2e: 'Étape 2 · Où aller', s2t: 'Choisissez vos destinations', s2h: 'Partez d\u2019un itinéraire conçu pour vous, ou choisissez ci-dessous.',
      nt: 'n', s3e: 'Étape 3 · Votre groupe', adults: 'Adultes', children: 'Enfants',
      nationality: 'Nationalité', natHint: '(aide IVY pour les entrées aux monuments et visas)',
      foreign: 'Étranger', indian: 'Indien', startDate: 'Date de départ préférée', optional: '(facultatif)',
      s4e: 'Étape 4 · Préférences', comfortLevel: 'Niveau de confort', cNone: 'Sans préférence', cComfort: 'Confortable', cPremium: 'Premium', cLuxury: 'Luxe',
      guide: 'Guide privé', gNone: 'Pas encore sûr', gEnglish: 'Anglophone', gOther: 'Autre langue',
      s5e: 'Étape 5 · Expériences', s5h: "Ajoutez tout ce que vous souhaitez — IVY l'intégrera à votre itinéraire.",
      asideE: 'Votre voyage jusqu\u2019ici', asideEmpty: 'Choisissez une ou deux destinations et le résumé de votre voyage apparaîtra ici — confiez-le ensuite à IVY pour l\u2019itinéraire et un devis transparent.',
      focus: 'Thème', destinations: 'Destinations', nights: 'Nuits', travellers: 'Voyageurs', start: 'Départ', comfort: 'Confort', experiences: 'Expériences',
      yourName: 'Votre nom', nameHint: 'Pour qu\u2019IVY puisse vous accueillir',
      ctaWa: 'Continuer sur WhatsApp avec IVY', ctaMail: 'Envoyer par e-mail',
      reassure: 'Aucune estimation de prix au hasard — IVY conçoit votre itinéraire et un devis transparent en INR, et l\u2019équipe Ivory Arc confirme chaque détail (hôtels au coût réel plus des frais de coordination clairs de 10% ; enfants à 25%) avant toute réservation.',
      adultsN: 'adultes', childrenN: 'enfants', nightsU: 'nuits',
      langNote: '🌐 Je consulte votre site en français — merci de répondre en français.',
      greeting: "Bonjour IVY, aidez-moi à planifier et chiffrer ce voyage privé dans le nord de l'Inde :",
      lFocus: 'Thème', lDest: 'Destinations', lTotal: 'Nuits au total', lTrav: 'Voyageurs', lForeign: 'ressortissants étrangers', lIndian: 'ressortissants indiens', lStart: 'Départ préféré', lComfort: 'Niveau de confort', lGuide: 'Guide', lExp: "Expériences souhaitées", lName: 'Nom',
      closing: 'Pourriez-vous préparer un itinéraire et un devis transparent pour moi ?',
      subject: 'Demande de voyage privé — Ivory Arc',
    },
    it: {
      s1e: 'Passo 1 · Il tuo viaggio', s1t: "Cosa ti attrae dell'India del Nord?",
      s2e: 'Passo 2 · Dove', s2t: 'Scegli le tue destinazioni', s2h: 'Parti da un itinerario curato o scegli le tue qui sotto.',
      nt: 'n', s3e: 'Passo 3 · Il tuo gruppo', adults: 'Adulti', children: 'Bambini',
      nationality: 'Nazionalità', natHint: '(aiuta IVY con ingressi ai monumenti e visti)',
      foreign: 'Straniero', indian: 'Indiano', startDate: 'Data di partenza preferita', optional: '(facoltativo)',
      s4e: 'Passo 4 · Preferenze', comfortLevel: 'Livello di comfort', cNone: 'Nessuna preferenza', cComfort: 'Confortevole', cPremium: 'Premium', cLuxury: 'Lusso',
      guide: 'Guida privata', gNone: 'Non ancora sicuro', gEnglish: 'Di lingua inglese', gOther: 'Altra lingua',
      s5e: 'Passo 5 · Esperienze', s5h: "Aggiungi tutto ciò che desideri: IVY lo integrerà nel tuo itinerario.",
      asideE: 'Il tuo viaggio finora', asideEmpty: 'Scegli una o due destinazioni e il riepilogo del tuo viaggio apparirà qui, poi affidalo a IVY per l\u2019itinerario e un preventivo trasparente.',
      focus: 'Tema', destinations: 'Destinazioni', nights: 'Notti', travellers: 'Viaggiatori', start: 'Inizio', comfort: 'Comfort', experiences: 'Esperienze',
      yourName: 'Il tuo nome', nameHint: 'Così IVY può salutarti',
      ctaWa: 'Continua su WhatsApp con IVY', ctaMail: 'Invia per e-mail',
      reassure: 'Nessuna stima di prezzo a caso: IVY crea il tuo itinerario e un preventivo trasparente in INR, e il team di Ivory Arc conferma ogni dettaglio (hotel al costo reale più una chiara commissione di coordinamento del 10%; bambini al 25%) prima di qualsiasi prenotazione.',
      adultsN: 'adulti', childrenN: 'bambini', nightsU: 'notti',
      langNote: '🌐 Sto visualizzando il sito in italiano — per favore, rispondi in italiano.',
      greeting: "Ciao IVY, aiutami a pianificare e quotare questo viaggio privato nell'India del Nord:",
      lFocus: 'Tema', lDest: 'Destinazioni', lTotal: 'Notti totali', lTrav: 'Viaggiatori', lForeign: 'cittadini stranieri', lIndian: 'cittadini indiani', lStart: 'Partenza preferita', lComfort: 'Livello di comfort', lGuide: 'Guida', lExp: 'Esperienze di interesse', lName: 'Nome',
      closing: 'Potresti preparare un itinerario e un preventivo trasparente per me?',
      subject: 'Richiesta viaggio privato — Ivory Arc',
    },
    ru: {
      s1e: 'Шаг 1 · Ваше путешествие', s1t: 'Что влечёт вас в Северную Индию?',
      s2e: 'Шаг 2 · Куда', s2t: 'Выберите направления', s2h: 'Начните с готового маршрута или выберите свои варианты ниже.',
      nt: 'н', s3e: 'Шаг 3 · Ваша группа', adults: 'Взрослые', children: 'Дети',
      nationality: 'Гражданство', natHint: '(помогает IVY с билетами в музеи и визами)',
      foreign: 'Иностранец', indian: 'Гражданин Индии', startDate: 'Желаемая дата начала', optional: '(необязательно)',
      s4e: 'Шаг 4 · Предпочтения', comfortLevel: 'Уровень комфорта', cNone: 'Без предпочтений', cComfort: 'Комфортный', cPremium: 'Премиум', cLuxury: 'Люкс',
      guide: 'Личный гид', gNone: 'Пока не знаю', gEnglish: 'Англоговорящий', gOther: 'Другой язык',
      s5e: 'Шаг 5 · Впечатления', s5h: 'Добавьте всё, что хотите включить, — IVY впишет это в ваш маршрут.',
      asideE: 'Ваше путешествие', asideEmpty: 'Выберите одно-два направления, и здесь появится сводка вашей поездки — затем передайте её IVY для маршрута и прозрачной сметы.',
      focus: 'Тема', destinations: 'Направления', nights: 'Ночей', travellers: 'Путешественники', start: 'Начало', comfort: 'Комфорт', experiences: 'Впечатления',
      yourName: 'Ваше имя', nameHint: 'Чтобы IVY мог обратиться к вам',
      ctaWa: 'Продолжить в WhatsApp с IVY', ctaMail: 'Отправить по эл. почте',
      reassure: 'Никаких догадок о цене — IVY составит ваш маршрут и прозрачную смету в INR, а команда Ivory Arc подтвердит каждую деталь (отели по фактической стоимости плюс понятная координационная комиссия 10%; дети — 25%) перед бронированием.',
      adultsN: 'взрослых', childrenN: 'детей', nightsU: 'ночей',
      langNote: '🌐 Я просматриваю сайт на русском — пожалуйста, ответьте на русском.',
      greeting: 'Здравствуйте, IVY! Помогите спланировать и рассчитать это частное путешествие по Северной Индии:',
      lFocus: 'Тема', lDest: 'Направления', lTotal: 'Всего ночей', lTrav: 'Путешественники', lForeign: 'иностранные граждане', lIndian: 'граждане Индии', lStart: 'Желаемое начало', lComfort: 'Уровень комфорта', lGuide: 'Гид', lExp: 'Интересующие впечатления', lName: 'Имя',
      closing: 'Не могли бы вы составить маршрут и прозрачную смету для меня?',
      subject: 'Запрос на частное путешествие — Ivory Arc',
    },
  };
  const t: S = STR[lang] ?? STR.en;

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

  // estimator_completed fires once when the brief first becomes usable (≥1 destination).
  let completedFired = false;
  $effect(() => {
    if (ready && !completedFired) {
      completedFired = true;
      track('estimator_completed', { lang, trip_category: interest, destination_count: dest.length });
    }
  });

  const COMFORT = $derived<[string, string][]>([
    ['none', t.cNone], ['comfort', t.cComfort], ['premium', t.cPremium], ['luxury', t.cLuxury],
  ]);
  const GUIDE = $derived<[string, string][]>([
    ['none', t.gNone], ['english', t.gEnglish], ['other', t.gOther],
  ]);
  const comfortLabel = $derived(COMFORT.find(([v]) => v === comfort)?.[1] ?? '');
  const guideLabel = $derived(GUIDE.find(([v]) => v === guide)?.[1] ?? '');

  // ── helpers ─────────────────────────────────────────────
  function mark() { if (!interacted) { interacted = true; track('estimator_started', { lang }); } }
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

  // ── warm transfer to IVY (written in the visitor's language) ──
  function leadMessage(): string {
    const L: string[] = [];
    L.push(t.langNote, '');
    L.push(t.greeting, '');
    if (travellerName) L.push(`• ${t.lName}: ${travellerName}`);
    L.push(`• ${t.lFocus}: ${INTERESTS.find((i) => i.id === interest)?.label ?? interest}`);
    if (dest.length)
      L.push(
        `• ${t.lDest}: ${dest
          .map((k) => `${DEST[k]?.name ?? k} (${nights[k] || 1} ${t.nightsU})`)
          .join(', ')}`
      );
    L.push(`• ${t.lTotal}: ${totalNights}`);
    L.push(
      `• ${t.lTrav}: ${adults} ${t.adultsN}${children ? ` · ${children} ${t.childrenN}` : ''} (${nat === 'foreign' ? t.lForeign : t.lIndian})`
    );
    if (startDate) L.push(`• ${t.lStart}: ${startDate}`);
    if (comfort !== 'none') L.push(`• ${t.lComfort}: ${comfortLabel}`);
    if (guide !== 'none') L.push(`• ${t.lGuide}: ${guideLabel}`);
    const exp = selectedExperiences();
    if (exp.length) L.push(`• ${t.lExp}: ${exp.join(', ')}`);
    L.push('', t.closing);
    return L.join('\n');
  }
  const waLink = $derived(waHref('ivy', leadMessage()));
  const mailLink = $derived(
    `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(leadMessage())}`
  );
  function leadParams(lead_type: 'whatsapp' | 'email') {
    return {
      lead_type,
      trip_category: interest,
      destination_count: dest.length,
      traveler_count: adults + children,
      adults,
      children,
      total_nights: totalNights,
      // estimated_trip_value intentionally omitted — pricing is produced by IVY, not on-site.
      source_page: typeof location !== 'undefined' ? location.pathname : 'estimator',
      lang,
    };
  }
  function onSend() { if (ready) captureLead(leadParams('whatsapp')); }
  function onEmail() { if (ready) captureLead(leadParams('email')); }

  onMount(() => track('estimator_view', { lang }));
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
  <!-- ════ BUILDER ════ -->
  <div class="space-y-10 md:col-span-7 min-w-0">
    <!-- 1 · Interest -->
    <section>
      <p class="est-eyebrow">{t.s1e}</p>
      <h2 class="est-h">{t.s1t}</h2>
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
      <p class="est-eyebrow">{t.s2e}</p>
      <h2 class="est-h">{t.s2t}</h2>
      {#if routesForInterest.length}
        <p class="mt-2 text-sm text-muted">{t.s2h}</p>
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
                <button type="button" onclick={() => setNights(k, (nights[k] || 1) - 1)} aria-label={`− ${DEST[k].name}`} class="est-step">−</button>
                <span class="min-w-[3.5rem] text-center text-sm"><span class="font-display text-lg text-ink">{nights[k] || 1}</span> <span class="text-muted">{t.nt}</span></span>
                <button type="button" onclick={() => setNights(k, (nights[k] || 1) + 1)} aria-label={`+ ${DEST[k].name}`} class="est-step">+</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- 3 · Travellers -->
    <section>
      <p class="est-eyebrow">{t.s3e}</p>
      <div class="mt-3 grid grid-cols-2 gap-6">
        <div>
          <span class="mb-2 block text-sm font-medium text-ink">{t.adults}</span>
          <div class="flex items-center gap-3">
            <button type="button" onclick={() => stepAdults(-1)} disabled={adults <= 1} class="est-step" aria-label={t.adults}>−</button>
            <span class="min-w-[3rem] text-center font-display text-xl text-ink">{adults}</span>
            <button type="button" onclick={() => stepAdults(1)} class="est-step" aria-label={t.adults}>+</button>
          </div>
        </div>
        <div>
          <span class="mb-2 block text-sm font-medium text-ink">{t.children}</span>
          <div class="flex items-center gap-3">
            <button type="button" onclick={() => stepChildren(-1)} disabled={children <= 0} class="est-step" aria-label={t.children}>−</button>
            <span class="min-w-[3rem] text-center font-display text-xl text-ink">{children}</span>
            <button type="button" onclick={() => stepChildren(1)} class="est-step" aria-label={t.children}>+</button>
          </div>
        </div>
      </div>
      <fieldset class="mt-5">
        <legend class="mb-2 text-sm font-medium text-ink">{t.nationality} <span class="font-normal text-muted">{t.natHint}</span></legend>
        <div class="grid grid-cols-2 gap-2.5">
          {#each [['foreign', t.foreign], ['indian', t.indian]] as opt}
            <label class="relative block">
              <input type="radio" name="nat" value={opt[0]} bind:group={nat} onchange={mark} class="peer sr-only" />
              <span class="block cursor-pointer rounded-md border border-line bg-ivory px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{opt[1]}</span>
            </label>
          {/each}
        </div>
      </fieldset>
      <label class="mt-5 block">
        <span class="mb-2 block text-sm font-medium text-ink">{t.startDate} <span class="font-normal text-muted">{t.optional}</span></span>
        <input type="date" bind:value={startDate} onchange={mark} class="w-full rounded-md border border-line bg-ivory px-4 py-3 text-ink" />
      </label>
    </section>

    <!-- 4 · Preferences -->
    <section>
      <p class="est-eyebrow">{t.s4e} <span class="font-normal normal-case tracking-normal text-muted">{t.optional}</span></p>
      <div class="mt-3">
        <span class="mb-2 block text-sm font-medium text-ink">{t.comfortLevel}</span>
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
        <span class="mb-2 block text-sm font-medium text-ink">{t.guide}</span>
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
        <p class="est-eyebrow">{t.s5e} <span class="font-normal normal-case tracking-normal text-muted">{t.optional}</span></p>
        <p class="mt-2 text-sm text-muted">{t.s5h}</p>
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
  <aside class="md:col-span-5 min-w-0">
    <div class="rounded-xl border border-line bg-cream p-6 md:sticky md:top-24">
      <p class="est-eyebrow">{t.asideE}</p>

      {#if !ready}
        <p class="mt-3 text-base text-muted">{t.asideEmpty}</p>
      {:else}
        <dl class="mt-3 space-y-2.5 text-sm">
          <div class="flex justify-between gap-3"><dt class="text-muted">{t.focus}</dt><dd class="text-right text-ink">{INTERESTS.find((i) => i.id === interest)?.label}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">{t.destinations}</dt><dd class="text-right text-ink">{dest.map((k) => DEST[k]?.name).join(', ')}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">{t.nights}</dt><dd class="text-right text-ink">{totalNights}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">{t.travellers}</dt><dd class="text-right text-ink">{adults} {t.adultsN}{children ? ` · ${children} ${t.childrenN}` : ''}</dd></div>
          {#if startDate}<div class="flex justify-between gap-3"><dt class="text-muted">{t.start}</dt><dd class="text-right text-ink">{startDate}</dd></div>{/if}
          {#if comfort !== 'none'}<div class="flex justify-between gap-3"><dt class="text-muted">{t.comfort}</dt><dd class="text-right text-ink">{comfortLabel}</dd></div>{/if}
          {#if selectedExperiences().length}<div class="flex justify-between gap-3"><dt class="text-muted">{t.experiences}</dt><dd class="text-right text-ink">{selectedExperiences().join(', ')}</dd></div>{/if}
        </dl>
      {/if}

      <label class="mt-5 block">
        <span class="mb-2 block text-sm font-medium text-ink">{t.yourName} <span class="font-normal text-muted">{t.optional}</span></span>
        <input type="text" bind:value={travellerName} oninput={mark} placeholder={t.nameHint} class="w-full rounded-md border border-line bg-ivory px-4 py-3 text-ink" />
      </label>

      <a href={waLink} target="_blank" rel="noopener noreferrer" onclick={onSend}
         class={`est-cta mt-5 ${ready ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!ready}>
        {t.ctaWa}
      </a>
      <a href={ready ? mailLink : undefined} onclick={onEmail} class={`est-cta-sec mt-2.5 w-full ${ready ? '' : 'pointer-events-none opacity-50'}`}>{t.ctaMail}</a>

      <p class="mt-4 text-xs leading-relaxed text-muted">{t.reassure}</p>
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

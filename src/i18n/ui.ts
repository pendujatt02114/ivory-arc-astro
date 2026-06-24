/*
  Lightweight i18n. English is the complete source; the other languages translate
  the visible homepage strings (hero, CTAs, section headings, pricing flow, why).
  useTranslations falls back to English for any key not present in a locale.
*/

export const LANGS = ['en', 'es', 'de', 'fr', 'it', 'ru'] as const;
export type Lang = (typeof LANGS)[number];
export const defaultLang: Lang = 'en';

export const languageNames: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  ru: 'Русский',
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
  'cta.estimateThis': 'Plan this journey',

  'pricing.eyebrow': 'How pricing works',
  'pricing.title': 'Transparent by design.',
  'pricing.intro':
    'No packages and no markups buried in the price — just a clear path from your idea to a journey IVY shapes and our team confirms.',
  'pricing.s1.t': 'Choose where you want to go',
  'pricing.s1.d':
    "Pick your destinations and dates and tell us who's travelling. IVY shapes a first route across North India in minutes — a starting point, never a fixed package.",
  'pricing.s2.t': 'Headline tickets are included',
  'pricing.s2.d':
    'Entry to the major monuments and historic sites on your route — the Taj Mahal, the great forts, the temples — is built into the price from the start.',
  'pricing.s3.t': 'Add anything you like',
  'pricing.s3.d':
    "We ask whether you'd like to add another monument, destination or experience. Say yes to as much or as little as you want.",
  'pricing.s4.t': 'Accommodation, only if you want it',
  'pricing.s4.d':
    "If you'd like us to arrange hotels, they're booked at actual rates plus a single, clearly stated 10% coordination fee — never a hidden markup.",
  'pricing.s5.t': "Refine it until it's right",
  'pricing.s5.d':
    'You shape the journey yourself — add or drop experiences, destinations or days until it fits.',
  'pricing.tier.t': 'Tier-based pricing',
  'pricing.tier.d':
    'Your rate reflects your group size and the comfort tier you choose — comfort, premium or luxury. Larger groups and simpler stays cost less per person.',
  'pricing.child.t': 'Children travel for less',
  'pricing.child.d':
    'Children are charged at just 25% of the adult rate, so family journeys stay affordable.',
  'pricing.confirm':
    'IVY gives you a transparent starting range in INR; the Ivory Arc team always confirms and finalises the exact quote — checked for availability and season — before anything is booked. GST is shown separately.',

  'interests.eyebrow': 'Find your journey',
  'interests.title': 'Travel by what moves you.',
  'interest.heritage': 'Heritage',
  'interest.spirituality': 'Spirituality',
  'interest.wildlife': 'Wildlife',
  'interest.mountains': 'Mountains',
  'interest.food': 'Food',
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
  'why.title': 'What sets us apart.',
  'why.p1.t': 'Firsthand destination knowledge',
  'why.p1.d':
    "Every route and stay is chosen from places we've personally travelled — often many times over, never from online research alone.",
  'why.p2.t': 'Women-owned & safety-first',
  'why.p2.d':
    'Secure accommodations, trusted local partners and realistic pacing. Comfort and safety come first.',
  'why.p3.t': 'Private & curated, never packaged',
  'why.p3.d':
    'We build each journey around your interests, travel style and pace — never fixed group departures.',
  'why.p4.t': 'Transparent, with no detours',
  'why.p4.d':
    'No hidden costs and no commission-driven shopping stops, ever. Major-monument tickets included; children at 25%.',
  'why.p5.t': 'A family you can reach',
  'why.p5.d':
    'A women-owned, family-run team — you plan with the people who actually run your trip, not a call centre.',
  'why.p6.t': 'Registered & accountable',
  'why.p6.d':
    'A registered Indian tour operator, GST-registered and MSME Certified, with secure payments via Razorpay.',

  'ivy.eyebrow': 'Plan with IVY',
  'ivy.title': 'Your journey, designed in minutes.',
  'ivy.body':
    'IVY is our travel concierge. It shapes an itinerary and a transparent quote with you on WhatsApp, and brings in our specialists whenever a journey calls for a human touch.',

  'lang.label': 'Language',
};

const es: Dict = {
  'hero.eyebrow': 'Viajes privados de lujo · Norte de la India',
  'hero.title': 'Viajes por el norte de la India, diseñados enteramente para ti.',
  'hero.sub':
    'Precios transparentes, sin paradas de compras por comisión, y un viaje privado planificado con cuidado — desde los palacios de Rajastán hasta el Ganges y el Himalaya.',
  'cta.ivy': 'Chatea con IVY',
  'cta.estimate': 'Solicitar presupuesto',
  'cta.estimateThis': 'Planificar este viaje',
  'pricing.eyebrow': 'Cómo funciona el precio',
  'pricing.title': 'Transparente por diseño.',
  'pricing.intro':
    'Sin paquetes ni recargos ocultos en el precio: un camino claro desde tu idea hasta un viaje que IVY diseña y nuestro equipo confirma.',
  'pricing.s1.t': 'Elige a dónde quieres ir',
  'pricing.s1.d':
    'Elige tus destinos y fechas y dinos quién viaja. IVY traza una primera ruta por el norte de la India en minutos: un punto de partida, nunca un paquete fijo.',
  'pricing.s2.t': 'Las entradas principales están incluidas',
  'pricing.s2.d':
    'La entrada a los principales monumentos e sitios históricos de tu ruta —el Taj Mahal, los grandes fuertes, los templos— está incluida desde el principio.',
  'pricing.s3.t': 'Añade lo que quieras',
  'pricing.s3.d':
    'Te preguntamos si quieres añadir otro monumento, destino o experiencia. Di que sí a tanto o tan poco como desees.',
  'pricing.s4.t': 'Alojamiento, solo si lo deseas',
  'pricing.s4.d':
    'Si quieres que reservemos los hoteles, se contratan a precio real más una única tarifa de coordinación del 10%, claramente indicada, nunca un recargo oculto.',
  'pricing.s5.t': 'Ajústalo hasta que sea perfecto',
  'pricing.s5.d':
    'Tú das forma al viaje: añade o quita experiencias, destinos o días hasta que encaje.',
  'pricing.tier.t': 'Precios por nivel',
  'pricing.tier.d':
    'Tu tarifa refleja el tamaño del grupo y el nivel de confort que elijas —cómodo, premium o lujo—. Los grupos más grandes y las estancias más sencillas cuestan menos por persona.',
  'pricing.child.t': 'Los niños viajan por menos',
  'pricing.child.d':
    'A los niños se les cobra solo el 25% de la tarifa de adulto, para que los viajes en familia sigan siendo asequibles.',
  'pricing.confirm':
    'IVY te ofrece un rango inicial transparente en INR; el equipo de Ivory Arc siempre confirma y finaliza el precio exacto —comprobando disponibilidad y temporada— antes de reservar nada. El IGV (GST) se muestra por separado.',
  'interests.eyebrow': 'Encuentra tu viaje',
  'interests.title': 'Viaja por lo que te inspira.',
  'interest.heritage': 'Patrimonio',
  'interest.spirituality': 'Espiritualidad',
  'interest.wildlife': 'Naturaleza',
  'interest.mountains': 'Montañas',
  'interest.food': 'Gastronomía',
  'interest.pilgrimage': 'Peregrinación',
  'interest.luxury': 'Lujo',
  'journeys.eyebrow': 'Viajes de ejemplo',
  'journeys.title': 'Una idea de lo posible.',
  'journeys.from': 'desde',
  'journeys.perDay': '/ día',
  'why.eyebrow': 'Por qué Ivory Arc',
  'why.title': 'Lo que nos distingue.',
  'why.p1.t': 'Conocimiento de primera mano',
  'why.p1.d':
    'Cada ruta y alojamiento se elige entre lugares que hemos visitado personalmente —a menudo muchas veces—, nunca solo desde una búsqueda en línea.',
  'why.p2.t': 'Empresa de mujeres, seguridad ante todo',
  'why.p2.d':
    'Alojamientos seguros, socios locales de confianza y un ritmo realista. La comodidad y la seguridad son lo primero.',
  'why.p3.t': 'Privado y a medida, nunca en paquete',
  'why.p3.d':
    'Creamos cada viaje en torno a tus intereses, tu estilo y tu ritmo, nunca con salidas de grupo fijas.',
  'why.p4.t': 'Transparente, sin desvíos',
  'why.p4.d':
    'Sin costes ocultos ni paradas de compras por comisión, jamás. Entradas a los monumentos principales incluidas; niños al 25%.',
  'why.p5.t': 'Una familia accesible',
  'why.p5.d':
    'Un equipo familiar dirigido por mujeres: planificas con quienes realmente organizan tu viaje, no con un centro de llamadas.',
  'why.p6.t': 'Registrados y responsables',
  'why.p6.d':
    'Operador turístico indio registrado, con registro GST y certificación MSME, y pagos seguros a través de Razorpay.',
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
  'cta.estimateThis': 'Diese Reise planen',
  'pricing.eyebrow': 'So funktioniert der Preis',
  'pricing.title': 'Transparent von Grund auf.',
  'pricing.intro':
    'Keine Pauschalpakete und keine im Preis versteckten Aufschläge — ein klarer Weg von Ihrer Idee zu einer Reise, die IVY gestaltet und unser Team bestätigt.',
  'pricing.s1.t': 'Wählen Sie Ihr Reiseziel',
  'pricing.s1.d':
    'Wählen Sie Ihre Ziele und Termine und sagen Sie uns, wer reist. IVY entwirft in Minuten eine erste Route durch Nordindien — ein Ausgangspunkt, nie ein festes Paket.',
  'pricing.s2.t': 'Eintritte zu den Höhepunkten inklusive',
  'pricing.s2.d':
    'Der Eintritt zu den wichtigsten Denkmälern und historischen Stätten Ihrer Route — Taj Mahal, die großen Forts, die Tempel — ist von Anfang an im Preis enthalten.',
  'pricing.s3.t': 'Fügen Sie hinzu, was Sie möchten',
  'pricing.s3.d':
    'Wir fragen, ob Sie ein weiteres Denkmal, Ziel oder Erlebnis hinzufügen möchten. Sagen Sie zu so viel oder so wenig Ja, wie Sie wollen.',
  'pricing.s4.t': 'Unterkunft, nur wenn Sie möchten',
  'pricing.s4.d':
    'Wenn wir die Hotels buchen sollen, geschieht dies zum tatsächlichen Preis plus einer einzigen, klar ausgewiesenen Koordinationsgebühr von 10% — nie ein versteckter Aufschlag.',
  'pricing.s5.t': 'Verfeinern Sie, bis es passt',
  'pricing.s5.d':
    'Sie gestalten die Reise selbst — fügen Sie Erlebnisse, Ziele oder Tage hinzu oder lassen Sie sie weg, bis alles stimmt.',
  'pricing.tier.t': 'Preise nach Niveau',
  'pricing.tier.d':
    'Ihr Tagespreis richtet sich nach Gruppengröße und gewähltem Komfortniveau — Komfort, Premium oder Luxus. Größere Gruppen und einfachere Unterkünfte kosten pro Person weniger.',
  'pricing.child.t': 'Kinder reisen günstiger',
  'pricing.child.d':
    'Für Kinder werden nur 25% des Erwachsenenpreises berechnet, damit Familienreisen erschwinglich bleiben.',
  'pricing.confirm':
    'IVY nennt Ihnen eine transparente Startspanne in INR; das Ivory-Arc-Team bestätigt und finalisiert stets den genauen Preis — geprüft auf Verfügbarkeit und Saison — bevor etwas gebucht wird. Die GST wird separat ausgewiesen.',
  'interests.eyebrow': 'Finden Sie Ihre Reise',
  'interests.title': 'Reisen Sie nach dem, was Sie bewegt.',
  'interest.heritage': 'Kulturerbe',
  'interest.spirituality': 'Spiritualität',
  'interest.wildlife': 'Tierwelt',
  'interest.mountains': 'Berge',
  'interest.food': 'Kulinarik',
  'interest.pilgrimage': 'Pilgerreise',
  'interest.luxury': 'Luxus',
  'journeys.eyebrow': 'Beispielreisen',
  'journeys.title': 'Ein Eindruck des Möglichen.',
  'journeys.from': 'ab',
  'journeys.perDay': '/ Tag',
  'why.eyebrow': 'Warum Ivory Arc',
  'why.title': 'Was uns auszeichnet.',
  'why.p1.t': 'Wissen aus erster Hand',
  'why.p1.d':
    'Jede Route und Unterkunft stammt aus Orten, die wir selbst bereist haben — oft viele Male, nie nur aus Online-Recherche.',
  'why.p2.t': 'Von Frauen geführt, Sicherheit zuerst',
  'why.p2.d':
    'Sichere Unterkünfte, vertrauenswürdige lokale Partner und ein realistisches Tempo. Komfort und Sicherheit stehen an erster Stelle.',
  'why.p3.t': 'Privat und kuratiert, nie von der Stange',
  'why.p3.d':
    'Wir gestalten jede Reise nach Ihren Interessen, Ihrem Reisestil und Tempo — nie feste Gruppenabfahrten.',
  'why.p4.t': 'Transparent, ohne Umwege',
  'why.p4.d':
    'Keine versteckten Kosten und keine provisionsgetriebenen Einkaufsstopps, niemals. Eintritte zu den Hauptdenkmälern inklusive; Kinder zu 25%.',
  'why.p5.t': 'Eine Familie, die erreichbar ist',
  'why.p5.d':
    'Ein von Frauen geführtes Familienteam — Sie planen mit den Menschen, die Ihre Reise wirklich durchführen, nicht mit einem Callcenter.',
  'why.p6.t': 'Registriert und verantwortlich',
  'why.p6.d':
    'Ein registrierter indischer Reiseveranstalter, GST-registriert und MSME-zertifiziert, mit sicheren Zahlungen über Razorpay.',
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
  'cta.estimateThis': 'Planifier ce voyage',
  'pricing.eyebrow': 'Comment fonctionne le prix',
  'pricing.title': 'La transparence par principe.',
  'pricing.intro':
    "Pas de forfaits ni de marges cachées dans le prix — un chemin clair de votre idée à un voyage que IVY conçoit et que notre équipe confirme.",
  'pricing.s1.t': 'Choisissez votre destination',
  'pricing.s1.d':
    "Choisissez vos destinations et vos dates et dites-nous qui voyage. IVY trace un premier itinéraire dans le nord de l'Inde en quelques minutes — un point de départ, jamais un forfait figé.",
  'pricing.s2.t': 'Les entrées phares sont incluses',
  'pricing.s2.d':
    "L'entrée aux principaux monuments et sites historiques de votre itinéraire — le Taj Mahal, les grands forts, les temples — est incluse dès le départ.",
  'pricing.s3.t': 'Ajoutez ce que vous voulez',
  'pricing.s3.d':
    "Nous vous demandons si vous souhaitez ajouter un autre monument, une destination ou une expérience. Dites oui à autant ou aussi peu que vous le souhaitez.",
  'pricing.s4.t': "L'hébergement, seulement si vous le souhaitez",
  'pricing.s4.d':
    "Si vous souhaitez que nous réservions les hôtels, ils le sont au tarif réel plus une seule commission de coordination de 10%, clairement indiquée — jamais de marge cachée.",
  'pricing.s5.t': "Ajustez jusqu'à ce que ce soit parfait",
  'pricing.s5.d':
    'Vous façonnez le voyage vous-même — ajoutez ou retirez des expériences, des destinations ou des jours jusqu\u2019à ce que tout convienne.',
  'pricing.tier.t': 'Tarifs par niveau',
  'pricing.tier.d':
    "Votre tarif reflète la taille du groupe et le niveau de confort choisi — confort, premium ou luxe. Les groupes plus grands et les séjours plus simples coûtent moins par personne.",
  'pricing.child.t': 'Les enfants voyagent pour moins',
  'pricing.child.d':
    "Les enfants ne paient que 25% du tarif adulte, pour que les voyages en famille restent abordables.",
  'pricing.confirm':
    "IVY vous donne une fourchette de départ transparente en INR ; l'équipe Ivory Arc confirme et finalise toujours le prix exact — vérifié selon la disponibilité et la saison — avant toute réservation. La TPS (GST) est indiquée séparément.",
  'interests.eyebrow': 'Trouvez votre voyage',
  'interests.title': 'Voyagez selon ce qui vous inspire.',
  'interest.heritage': 'Patrimoine',
  'interest.spirituality': 'Spiritualité',
  'interest.wildlife': 'Faune',
  'interest.mountains': 'Montagnes',
  'interest.food': 'Gastronomie',
  'interest.pilgrimage': 'Pèlerinage',
  'interest.luxury': 'Luxe',
  'journeys.eyebrow': 'Exemples de voyages',
  'journeys.title': 'Un aperçu du possible.',
  'journeys.from': 'à partir de',
  'journeys.perDay': '/ jour',
  'why.eyebrow': 'Pourquoi Ivory Arc',
  'why.title': 'Ce qui nous distingue.',
  'why.p1.t': 'Une connaissance de première main',
  'why.p1.d':
    "Chaque itinéraire et hébergement est choisi parmi des lieux que nous avons personnellement parcourus — souvent plusieurs fois —, jamais à partir d'une simple recherche en ligne.",
  'why.p2.t': 'Dirigée par des femmes, sécurité avant tout',
  'why.p2.d':
    'Hébergements sûrs, partenaires locaux de confiance et rythme réaliste. Le confort et la sécurité priment.',
  'why.p3.t': 'Privé et sur mesure, jamais en forfait',
  'why.p3.d':
    'Nous construisons chaque voyage autour de vos centres d\u2019intérêt, de votre style et de votre rythme — jamais de départs de groupe figés.',
  'why.p4.t': 'Transparent, sans détours',
  'why.p4.d':
    "Aucun coût caché ni arrêt shopping à la commission, jamais. Entrées des principaux monuments incluses ; enfants à 25%.",
  'why.p5.t': 'Une famille joignable',
  'why.p5.d':
    "Une équipe familiale dirigée par des femmes — vous planifiez avec ceux qui organisent réellement votre voyage, pas un centre d'appels.",
  'why.p6.t': 'Enregistrés et responsables',
  'why.p6.d':
    'Un voyagiste indien enregistré, immatriculé GST et certifié MSME, avec des paiements sécurisés via Razorpay.',
  'ivy.eyebrow': 'Planifier avec IVY',
  'ivy.title': 'Votre voyage, conçu en quelques minutes.',
  'lang.label': 'Langue',
};

const it: Dict = {
  'hero.eyebrow': 'Viaggi privati di lusso · India del Nord',
  'hero.title': 'Viaggi nell’India del Nord, disegnati interamente su di te.',
  'hero.sub':
    'Prezzi trasparenti, nessuna sosta per acquisti su commissione e un viaggio privato pianificato con cura — dai palazzi del Rajasthan al Gange e all’Himalaya.',
  'cta.ivy': 'Chatta con IVY',
  'cta.estimate': 'Richiedi un preventivo',
  'cta.estimateThis': 'Pianifica questo viaggio',
  'pricing.eyebrow': 'Come funziona il prezzo',
  'pricing.title': 'Trasparente per scelta.',
  'pricing.intro':
    'Nessun pacchetto e nessun ricarico nascosto nel prezzo: un percorso chiaro dalla tua idea a un viaggio che IVY disegna e il nostro team conferma.',
  'pricing.s1.t': 'Scegli dove vuoi andare',
  'pricing.s1.d':
    'Scegli le destinazioni e le date e dicci chi viaggia. IVY traccia un primo itinerario nell’India del Nord in pochi minuti: un punto di partenza, mai un pacchetto fisso.',
  'pricing.s2.t': 'Gli ingressi principali sono inclusi',
  'pricing.s2.d':
    'L’ingresso ai principali monumenti e siti storici del tuo itinerario — il Taj Mahal, i grandi forti, i templi — è incluso fin dall’inizio.',
  'pricing.s3.t': 'Aggiungi ciò che desideri',
  'pricing.s3.d':
    'Ti chiediamo se vuoi aggiungere un altro monumento, una destinazione o un’esperienza. Aggiungi tutto o poco quanto vuoi.',
  'pricing.s4.t': 'Alloggio, solo se lo desideri',
  'pricing.s4.d':
    'Se vuoi che prenotiamo gli hotel, lo facciamo al costo reale più un’unica commissione di coordinamento del 10%, chiaramente indicata — mai un ricarico nascosto.',
  'pricing.s5.t': 'Perfezionalo finché è giusto',
  'pricing.s5.d':
    'Sei tu a dare forma al viaggio: aggiungi o togli esperienze, destinazioni o giorni finché non è perfetto.',
  'pricing.tier.t': 'Prezzi per livello',
  'pricing.tier.d':
    'La tua tariffa riflette le dimensioni del gruppo e il livello di comfort scelto — comfort, premium o lusso. Gruppi più grandi e soggiorni più semplici costano meno a persona.',
  'pricing.child.t': 'I bambini viaggiano a meno',
  'pricing.child.d':
    'Ai bambini si applica solo il 25% della tariffa per adulti, così i viaggi in famiglia restano accessibili.',
  'pricing.confirm':
    'IVY ti offre una fascia di partenza trasparente in INR; il team di Ivory Arc conferma e finalizza sempre il prezzo esatto — verificando disponibilità e stagione — prima di qualsiasi prenotazione. La GST è indicata separatamente.',
  'interests.eyebrow': 'Trova il tuo viaggio',
  'interests.title': 'Viaggia secondo ciò che ti ispira.',
  'interest.heritage': 'Patrimonio',
  'interest.spirituality': 'Spiritualità',
  'interest.wildlife': 'Natura',
  'interest.mountains': 'Montagne',
  'interest.food': 'Cucina',
  'interest.pilgrimage': 'Pellegrinaggio',
  'interest.luxury': 'Lusso',
  'journeys.eyebrow': 'Viaggi di esempio',
  'journeys.title': 'Un’idea di ciò che è possibile.',
  'journeys.from': 'da',
  'journeys.perDay': '/ giorno',
  'why.eyebrow': 'Perché Ivory Arc',
  'why.title': 'Ciò che ci distingue.',
  'why.p1.t': 'Conoscenza diretta dei luoghi',
  'why.p1.d':
    'Ogni itinerario e soggiorno è scelto tra luoghi che abbiamo visitato di persona — spesso molte volte —, mai solo da una ricerca online.',
  'why.p2.t': 'Gestita da donne, sicurezza prima di tutto',
  'why.p2.d':
    'Alloggi sicuri, partner locali fidati e ritmi realistici. Comfort e sicurezza vengono prima di tutto.',
  'why.p3.t': 'Privato e curato, mai preconfezionato',
  'why.p3.d':
    'Costruiamo ogni viaggio intorno ai tuoi interessi, al tuo stile e al tuo ritmo — mai partenze di gruppo fisse.',
  'why.p4.t': 'Trasparente, senza deviazioni',
  'why.p4.d':
    'Nessun costo nascosto e nessuna sosta per acquisti su commissione, mai. Ingressi ai monumenti principali inclusi; bambini al 25%.',
  'why.p5.t': 'Una famiglia raggiungibile',
  'why.p5.d':
    'Un team familiare gestito da donne: pianifichi con chi organizza davvero il tuo viaggio, non con un call center.',
  'why.p6.t': 'Registrati e affidabili',
  'why.p6.d':
    'Operatore turistico indiano registrato, con registrazione GST e certificazione MSME, e pagamenti sicuri tramite Razorpay.',
  'ivy.eyebrow': 'Pianifica con IVY',
  'ivy.title': 'Il tuo viaggio, disegnato in pochi minuti.',
  'lang.label': 'Lingua',
};

const ru: Dict = {
  'hero.eyebrow': 'Частные люкс-путешествия · Северная Индия',
  'hero.title': 'Путешествия по Северной Индии, созданные полностью под вас.',
  'hero.sub':
    'Прозрачные цены, никаких остановок ради торговых комиссий и частное путешествие, спланированное с заботой — от дворцов Раджастхана до Ганга и Гималаев.',
  'cta.ivy': 'Написать IVY',
  'cta.estimate': 'Получить расчёт',
  'cta.estimateThis': 'Спланировать это путешествие',
  'pricing.eyebrow': 'Как формируется цена',
  'pricing.title': 'Прозрачность как принцип.',
  'pricing.intro':
    'Никаких пакетов и скрытых наценок в цене — понятный путь от вашей идеи к путешествию, которое создаёт IVY и подтверждает наша команда.',
  'pricing.s1.t': 'Выберите, куда хотите поехать',
  'pricing.s1.d':
    'Выберите направления и даты и расскажите, кто едет. IVY за минуты составит первый маршрут по Северной Индии — отправную точку, а не фиксированный пакет.',
  'pricing.s2.t': 'Билеты на главные объекты включены',
  'pricing.s2.d':
    'Вход к основным памятникам и историческим местам вашего маршрута — Тадж-Махал, великие форты, храмы — заложен в цену с самого начала.',
  'pricing.s3.t': 'Добавьте всё, что хотите',
  'pricing.s3.d':
    'Мы спросим, не хотите ли добавить ещё памятник, направление или впечатление. Добавляйте столько, сколько пожелаете.',
  'pricing.s4.t': 'Проживание — только если нужно',
  'pricing.s4.d':
    'Если хотите, чтобы мы забронировали отели, они бронируются по фактической цене плюс единая, чётко указанная комиссия за координацию 10% — никаких скрытых наценок.',
  'pricing.s5.t': 'Дорабатывайте, пока не будет идеально',
  'pricing.s5.d':
    'Вы сами формируете путешествие — добавляйте или убирайте впечатления, направления или дни, пока всё не сложится.',
  'pricing.tier.t': 'Цены по уровням',
  'pricing.tier.d':
    'Ваша цена зависит от размера группы и выбранного уровня комфорта — комфорт, премиум или люкс. Большие группы и более простые отели обходятся дешевле в расчёте на человека.',
  'pricing.child.t': 'Дети путешествуют дешевле',
  'pricing.child.d':
    'Для детей действует лишь 25% от взрослого тарифа, поэтому семейные поездки остаются доступными.',
  'pricing.confirm':
    'IVY называет прозрачный стартовый диапазон в INR; команда Ivory Arc всегда подтверждает и фиксирует точную цену — с учётом наличия мест и сезона — прежде чем что-либо бронировать. GST указывается отдельно.',
  'interests.eyebrow': 'Найдите своё путешествие',
  'interests.title': 'Путешествуйте по зову души.',
  'interest.heritage': 'Наследие',
  'interest.spirituality': 'Духовное',
  'interest.wildlife': 'Природа',
  'interest.mountains': 'Горы',
  'interest.food': 'Кухня',
  'interest.pilgrimage': 'Паломничество',
  'interest.luxury': 'Люкс',
  'journeys.eyebrow': 'Примеры путешествий',
  'journeys.title': 'Представление о возможном.',
  'journeys.from': 'от',
  'journeys.perDay': '/ день',
  'why.eyebrow': 'Почему Ivory Arc',
  'why.title': 'Что нас отличает.',
  'why.p1.t': 'Личное знание направлений',
  'why.p1.d':
    'Каждый маршрут и отель выбран из мест, где мы бывали лично — часто не раз, — а не по результатам поиска в интернете.',
  'why.p2.t': 'Бизнес, основанный женщинами; безопасность прежде всего',
  'why.p2.d':
    'Безопасное проживание, надёжные местные партнёры и реалистичный темп. Комфорт и безопасность — на первом месте.',
  'why.p3.t': 'Частное и индивидуальное, никогда не «пакет»',
  'why.p3.d':
    'Мы строим каждое путешествие вокруг ваших интересов, стиля и темпа — никаких фиксированных групповых заездов.',
  'why.p4.t': 'Прозрачно, без лишних заездов',
  'why.p4.d':
    'Никаких скрытых расходов и остановок ради торговых комиссий, никогда. Билеты на главные памятники включены; дети — 25%.',
  'why.p5.t': 'Семья, до которой легко дозвониться',
  'why.p5.d':
    'Семейная команда под руководством женщин — вы планируете с теми, кто действительно организует вашу поездку, а не с колл-центром.',
  'why.p6.t': 'Зарегистрированы и ответственны',
  'why.p6.d':
    'Зарегистрированный индийский туроператор с регистрацией GST и сертификацией MSME и безопасными платежами через Razorpay.',
  'ivy.eyebrow': 'Планируйте с IVY',
  'ivy.title': 'Ваше путешествие, созданное за минуты.',
  'lang.label': 'Язык',
};

export const ui: Record<Lang, Dict> = { en, es, de, fr, it, ru };

export function useTranslations(lang: string | undefined) {
  const l = (LANGS as readonly string[]).includes(lang ?? '') ? (lang as Lang) : defaultLang;
  return (key: string): string => ui[l][key] ?? ui.en[key] ?? key;
}

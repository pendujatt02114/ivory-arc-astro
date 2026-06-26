/* Estimator UI strings in all six site languages. Theme labels reuse the
   existing i18n (interest.*); these cover the estimator's own chrome + the
   experience-preference chip labels. Keep concise and clear. */
import type { Lang } from '../i18n/ui';

export interface EstStrings {
  steps: string[]; // 8: You, Trip style, Experiences, Dates, Destinations, Travellers, Add-ons, Send
  langName: string; // English name of the chosen site language, passed to IVY in the brief
  s0Title: string; name: string; namePh: string; wa: string; waPh: string; email: string; emailPh: string;
  firstTimeQ: string; yes: string; no: string;
  delhiExploreQ: string; delhiStayQ: string; occasionQ: string;
  occ: { none: string; honeymoon: string; anniversary: string; birthday: string; family: string; mice: string };
  s1Title: string; s1Hint: string;
  s2Title: string; s2Hint: string; excursionPref: string; excursionTag: string;
  s3Title: string; s3Hint: string; s3Empty: string; nights: string;
  delhiGateway: string; gatewayTag: string; reorderHint: string; routeLabel: string;
  s4Title: string; startDate: string; showPricesIn: string;
  s5Title: string; adults: string; children: string; natQ: string; natIntl: string; natIndian: string;
  vehQ: string; vehChooseHint: string; vehSedanDesc: string; vehSuvDesc: string; vehAutoSuvNote: string;
  s6Title: string; s6Hint: string; excursionsNear: string; // "{city}" placeholder
  s7Title: string; s7Hint: string; send: string; sending: string;
  back: string; cont: string;
  doneTitle: string; doneRef: string; openWa: string; errMsg: string; // doneRef has {ref}
  prefs: Record<string, string>; // experience-pref id -> label
}

const PREF_EN = {
  forts_palaces_architecture: 'Forts, palaces & architecture', museums_history: 'Museums & history',
  old_city_walks: 'Old-city walks & local culture', temples_rituals: 'Temples, rituals & sacred sites',
  aarti_darshan: 'Aarti / darshan / devotional', pilgrimage_circuits: 'Pilgrimage circuits / sacred rivers',
  scenic_photography: 'Scenic viewpoints & photography', nature_walks_treks: 'Nature walks / treks',
  boating_lakes: 'Boating / lakes / gentle outdoors', adventure_snow: 'Adventure / snow / active',
  wildlife_safari_birding: 'Wildlife / safari / birding', food_local_cuisine: 'Food walks & local cuisine',
  crafts_village_life: 'Crafts / village / local life',
};

export const EST_I18N: Record<Lang, EstStrings> = {
  en: {
    steps: ['You', 'Trip style', 'Experiences', 'Dates', 'Destinations', 'Travellers', 'Add-ons', 'Send'],
    s0Title: 'First, who shall we plan for?', name: 'Your name', namePh: 'e.g. Priya Sharma',
    wa: 'WhatsApp number (with country code)', waPh: 'e.g. 44 7700 900123', email: 'Email', emailPh: 'you@email.com',
    firstTimeQ: 'Is this your first time in India?', yes: 'Yes', no: 'No',
    delhiExploreQ: 'Would you like to explore Delhi with us?', delhiStayQ: 'Need accommodation in Delhi?', occasionQ: 'Any special occasion?',
    occ: { none: 'No special occasion', honeymoon: 'Honeymoon', anniversary: 'Anniversary', birthday: 'Birthday', family: 'Family holiday', mice: 'Group / MICE' },
    s1Title: 'What should this trip feel like?', s1Hint: 'Pick one or more — it shapes the destinations and experiences we suggest.',
    s2Title: 'Which experiences appeal most?', s2Hint: 'Optional — this fine-tunes the add-ons we shortlist for each city.',
    excursionPref: 'Open to nearby excursions / day trips', excursionTag: 'excursion',
    s3Title: 'Choose your destinations', s3Hint: 'From your chosen themes. Set nights per city, then put them in the order you want to travel.', s3Empty: 'Pick a trip style first.', nights: 'nights',
    delhiGateway: 'Delhi — your stay', gatewayTag: 'arrival & departure', reorderHint: 'Set your route order with ↑ ↓. Delhi stays at both ends.', routeLabel: 'Route',
    s4Title: 'When does the journey start?', startDate: 'Travel start date', showPricesIn: 'Show prices in',
    langName: 'English',
    s5Title: "Who's travelling?", adults: 'Adults', children: 'Children', natQ: 'Nationality', natIntl: 'International (foreign national)', natIndian: 'Indian',
    vehQ: 'Vehicle', vehChooseHint: 'Pick the vehicle for your party:', vehSedanDesc: 'up to 3 adults · roomy for a couple or small family · ₹20/km', vehSuvDesc: 'up to 5 adults (6 with a child) · extra luggage space · ₹26/km', vehAutoSuvNote: 'For 4 or more adults we use a spacious SUV (₹26/km).',
    s6Title: 'Add optional experiences', s6Hint: 'A short, theme-matched shortlist per city. Pick any you like — IVY confirms exact pricing.', excursionsNear: 'Excursions / day trips near',
    s7Title: 'Ready to send to IVY', s7Hint: "We'll pass your brief to IVY on WhatsApp. IVY only needs to confirm your hotel preference, then prepares the full quote — transport, experiences, hotels, and 5% GST.",
    send: 'Send my brief to IVY', sending: 'Sending…', back: 'Back', cont: 'Continue',
    doneTitle: "You're all set", doneRef: 'Your reference is {ref}. Tap below to open WhatsApp and send the message — IVY already has your brief and will continue from there.', openWa: 'Open WhatsApp with IVY',
    errMsg: 'We could not pre-send your brief, but you can still message IVY now.', prefs: PREF_EN,
  },
  es: {
    steps: ['Tú', 'Estilo', 'Experiencias', 'Fechas', 'Destinos', 'Viajeros', 'Extras', 'Enviar'],
    s0Title: '¿Para quién planificamos?', name: 'Tu nombre', namePh: 'p. ej. Priya Sharma',
    wa: 'Número de WhatsApp (con código de país)', waPh: 'p. ej. 34 600 000 000', email: 'Correo', emailPh: 'tu@email.com',
    firstTimeQ: '¿Es tu primera vez en India?', yes: 'Sí', no: 'No',
    delhiExploreQ: '¿Quieres explorar Delhi con nosotros?', delhiStayQ: '¿Necesitas alojamiento en Delhi?', occasionQ: '¿Alguna ocasión especial?',
    occ: { none: 'Sin ocasión especial', honeymoon: 'Luna de miel', anniversary: 'Aniversario', birthday: 'Cumpleaños', family: 'Viaje en familia', mice: 'Grupo / MICE' },
    s1Title: '¿Cómo quieres que sea el viaje?', s1Hint: 'Elige uno o varios — define los destinos y experiencias que sugerimos.',
    s2Title: '¿Qué experiencias te atraen más?', s2Hint: 'Opcional — afina los extras que preseleccionamos por ciudad.',
    excursionPref: 'Abierto a excursiones cercanas / visitas de un día', excursionTag: 'excursión',
    s3Title: 'Elige tus destinos', s3Hint: 'Según tus temas. Ajusta las noches por ciudad y ordénalas según quieras viajar.', s3Empty: 'Elige primero un estilo de viaje.', nights: 'noches',
    delhiGateway: 'Delhi — tu estancia', gatewayTag: 'llegada y salida', reorderHint: 'Ordena tu ruta con ↑ ↓. Delhi queda en ambos extremos.', routeLabel: 'Ruta',
    s4Title: '¿Cuándo empieza el viaje?', startDate: 'Fecha de inicio', showPricesIn: 'Ver precios en',
    langName: 'Spanish',
    s5Title: '¿Quién viaja?', adults: 'Adultos', children: 'Niños', natQ: 'Nacionalidad', natIntl: 'Internacional (extranjero)', natIndian: 'India',
    vehQ: 'Vehículo', vehChooseHint: 'Elige el vehículo para tu grupo:', vehSedanDesc: 'hasta 3 adultos · cómodo para pareja o familia pequeña · ₹20/km', vehSuvDesc: 'hasta 5 adultos (6 con un niño) · más espacio para equipaje · ₹26/km', vehAutoSuvNote: 'Para 4 o más adultos usamos un SUV espacioso (₹26/km).',
    s6Title: 'Añade experiencias opcionales', s6Hint: 'Una breve selección por ciudad según tus temas. Elige las que quieras — IVY confirma el precio exacto.', excursionsNear: 'Excursiones / visitas cerca de',
    s7Title: 'Listo para enviar a IVY', s7Hint: 'Enviaremos tu resumen a IVY por WhatsApp. IVY solo necesita confirmar tu preferencia de hotel y preparará el presupuesto completo — transporte, experiencias, hoteles y 5% de IVA (GST).',
    send: 'Enviar mi resumen a IVY', sending: 'Enviando…', back: 'Atrás', cont: 'Continuar',
    doneTitle: 'Todo listo', doneRef: 'Tu referencia es {ref}. Toca abajo para abrir WhatsApp y enviar el mensaje — IVY ya tiene tu resumen y continuará desde ahí.', openWa: 'Abrir WhatsApp con IVY',
    errMsg: 'No pudimos enviar tu resumen, pero ya puedes escribir a IVY.',
    prefs: { forts_palaces_architecture: 'Fuertes, palacios y arquitectura', museums_history: 'Museos e historia', old_city_walks: 'Paseos por el casco antiguo y cultura local', temples_rituals: 'Templos, rituales y lugares sagrados', aarti_darshan: 'Aarti / darshan / devocional', pilgrimage_circuits: 'Circuitos de peregrinación / ríos sagrados', scenic_photography: 'Miradores y fotografía', nature_walks_treks: 'Paseos por la naturaleza / treks', boating_lakes: 'Paseos en barco / lagos', adventure_snow: 'Aventura / nieve / activo', wildlife_safari_birding: 'Fauna / safari / aves', food_local_cuisine: 'Rutas gastronómicas y cocina local', crafts_village_life: 'Artesanía / pueblos / vida local' },
  },
  de: {
    steps: ['Sie', 'Reisestil', 'Erlebnisse', 'Termine', 'Ziele', 'Reisende', 'Extras', 'Senden'],
    s0Title: 'Für wen planen wir?', name: 'Ihr Name', namePh: 'z. B. Priya Sharma',
    wa: 'WhatsApp-Nummer (mit Ländercode)', waPh: 'z. B. 49 1512 3456789', email: 'E-Mail', emailPh: 'sie@email.com',
    firstTimeQ: 'Ist es Ihr erstes Mal in Indien?', yes: 'Ja', no: 'Nein',
    delhiExploreQ: 'Möchten Sie Delhi mit uns erkunden?', delhiStayQ: 'Benötigen Sie eine Unterkunft in Delhi?', occasionQ: 'Ein besonderer Anlass?',
    occ: { none: 'Kein besonderer Anlass', honeymoon: 'Flitterwochen', anniversary: 'Jubiläum', birthday: 'Geburtstag', family: 'Familienreise', mice: 'Gruppe / MICE' },
    s1Title: 'Wie soll sich die Reise anfühlen?', s1Hint: 'Wählen Sie eines oder mehrere — das bestimmt Ziele und Erlebnisse.',
    s2Title: 'Welche Erlebnisse reizen Sie am meisten?', s2Hint: 'Optional — verfeinert die Extras, die wir pro Stadt vorschlagen.',
    excursionPref: 'Offen für Ausflüge in der Nähe / Tagesausflüge', excursionTag: 'Ausflug',
    s3Title: 'Wählen Sie Ihre Ziele', s3Hint: 'Aus Ihren Themen. Nächte pro Stadt einstellen und in Reisereihenfolge bringen.', s3Empty: 'Wählen Sie zuerst einen Reisestil.', nights: 'Nächte',
    delhiGateway: 'Delhi — Ihr Aufenthalt', gatewayTag: 'An- & Abreise', reorderHint: 'Reihenfolge mit ↑ ↓ festlegen. Delhi bleibt an beiden Enden.', routeLabel: 'Route',
    s4Title: 'Wann beginnt die Reise?', startDate: 'Reisebeginn', showPricesIn: 'Preise anzeigen in',
    langName: 'German',
    s5Title: 'Wer reist?', adults: 'Erwachsene', children: 'Kinder', natQ: 'Nationalität', natIntl: 'International (ausländisch)', natIndian: 'Indisch',
    vehQ: 'Fahrzeug', vehChooseHint: 'Wählen Sie das Fahrzeug für Ihre Gruppe:', vehSedanDesc: 'bis zu 3 Erwachsene · bequem für Paare oder kleine Familien · ₹20/km', vehSuvDesc: 'bis zu 5 Erwachsene (6 mit Kind) · mehr Gepäckraum · ₹26/km', vehAutoSuvNote: 'Ab 4 Erwachsenen nutzen wir einen geräumigen SUV (₹26/km).',
    s6Title: 'Optionale Erlebnisse hinzufügen', s6Hint: 'Eine kurze, themenpassende Auswahl pro Stadt. Wählen Sie beliebig — IVY bestätigt den genauen Preis.', excursionsNear: 'Ausflüge / Tagestouren bei',
    s7Title: 'Bereit zum Senden an IVY', s7Hint: 'Wir senden Ihren Brief per WhatsApp an IVY. IVY muss nur Ihre Hotelpräferenz bestätigen und erstellt dann das volle Angebot — Transport, Erlebnisse, Hotels und 5% GST.',
    send: 'Meinen Brief an IVY senden', sending: 'Senden…', back: 'Zurück', cont: 'Weiter',
    doneTitle: 'Alles bereit', doneRef: 'Ihre Referenz ist {ref}. Tippen Sie unten, um WhatsApp zu öffnen und die Nachricht zu senden — IVY hat Ihren Brief bereits und macht dort weiter.', openWa: 'WhatsApp mit IVY öffnen',
    errMsg: 'Wir konnten Ihren Brief nicht vorab senden, aber Sie können IVY jetzt schreiben.',
    prefs: { forts_palaces_architecture: 'Forts, Paläste & Architektur', museums_history: 'Museen & Geschichte', old_city_walks: 'Altstadt-Spaziergänge & lokale Kultur', temples_rituals: 'Tempel, Rituale & heilige Stätten', aarti_darshan: 'Aarti / Darshan / Andacht', pilgrimage_circuits: 'Pilgerrouten / heilige Flüsse', scenic_photography: 'Aussichtspunkte & Fotografie', nature_walks_treks: 'Naturwanderungen / Treks', boating_lakes: 'Bootsfahrten / Seen', adventure_snow: 'Abenteuer / Schnee / aktiv', wildlife_safari_birding: 'Tierwelt / Safari / Vögel', food_local_cuisine: 'Food-Walks & lokale Küche', crafts_village_life: 'Handwerk / Dörfer / lokales Leben' },
  },
  fr: {
    steps: ['Vous', 'Style', 'Expériences', 'Dates', 'Destinations', 'Voyageurs', 'Options', 'Envoyer'],
    s0Title: 'Pour qui organisons-nous ?', name: 'Votre nom', namePh: 'p. ex. Priya Sharma',
    wa: 'Numéro WhatsApp (avec indicatif)', waPh: 'p. ex. 33 6 12 34 56 78', email: 'E-mail', emailPh: 'vous@email.com',
    firstTimeQ: 'Est-ce votre première fois en Inde ?', yes: 'Oui', no: 'Non',
    delhiExploreQ: 'Souhaitez-vous explorer Delhi avec nous ?', delhiStayQ: 'Besoin d’un hébergement à Delhi ?', occasionQ: 'Une occasion spéciale ?',
    occ: { none: 'Aucune occasion particulière', honeymoon: 'Lune de miel', anniversary: 'Anniversaire de mariage', birthday: 'Anniversaire', family: 'Voyage en famille', mice: 'Groupe / MICE' },
    s1Title: 'Quelle ambiance pour ce voyage ?', s1Hint: 'Choisissez une ou plusieurs — cela oriente les destinations et expériences.',
    s2Title: 'Quelles expériences vous attirent ?', s2Hint: 'Facultatif — affine les options proposées par ville.',
    excursionPref: 'Ouvert aux excursions proches / sorties à la journée', excursionTag: 'excursion',
    s3Title: 'Choisissez vos destinations', s3Hint: 'Selon vos thèmes. Réglez les nuits par ville, puis classez-les dans l’ordre de voyage.', s3Empty: "Choisissez d'abord un style de voyage.", nights: 'nuits',
    delhiGateway: 'Delhi — votre séjour', gatewayTag: 'arrivée et départ', reorderHint: 'Ordonnez votre itinéraire avec ↑ ↓. Delhi reste aux deux extrémités.', routeLabel: 'Itinéraire',
    s4Title: 'Quand commence le voyage ?', startDate: 'Date de départ', showPricesIn: 'Afficher les prix en',
    langName: 'French',
    s5Title: 'Qui voyage ?', adults: 'Adultes', children: 'Enfants', natQ: 'Nationalité', natIntl: 'International (étranger)', natIndian: 'Indien',
    vehQ: 'Véhicule', vehChooseHint: 'Choisissez le véhicule pour votre groupe :', vehSedanDesc: 'jusqu’à 3 adultes · confortable pour un couple ou une petite famille · ₹20/km', vehSuvDesc: 'jusqu’à 5 adultes (6 avec un enfant) · plus d’espace bagages · ₹26/km', vehAutoSuvNote: 'À partir de 4 adultes, nous utilisons un SUV spacieux (₹26/km).',
    s6Title: 'Ajoutez des expériences en option', s6Hint: 'Une courte sélection par ville selon vos thèmes. Choisissez librement — IVY confirme le prix exact.', excursionsNear: 'Excursions / sorties près de',
    s7Title: 'Prêt à envoyer à IVY', s7Hint: 'Nous transmettons votre brief à IVY sur WhatsApp. IVY confirme simplement votre préférence d’hôtel puis prépare le devis complet — transport, expériences, hôtels et 5% de GST.',
    send: 'Envoyer mon brief à IVY', sending: 'Envoi…', back: 'Retour', cont: 'Continuer',
    doneTitle: 'Tout est prêt', doneRef: 'Votre référence est {ref}. Touchez ci-dessous pour ouvrir WhatsApp et envoyer le message — IVY a déjà votre brief et continue à partir de là.', openWa: 'Ouvrir WhatsApp avec IVY',
    errMsg: 'Nous n’avons pas pu pré-envoyer votre brief, mais vous pouvez écrire à IVY maintenant.',
    prefs: { forts_palaces_architecture: 'Forts, palais & architecture', museums_history: 'Musées & histoire', old_city_walks: 'Balades en vieille ville & culture locale', temples_rituals: 'Temples, rituels & sites sacrés', aarti_darshan: 'Aarti / darshan / dévotion', pilgrimage_circuits: 'Circuits de pèlerinage / rivières sacrées', scenic_photography: 'Points de vue & photographie', nature_walks_treks: 'Balades nature / treks', boating_lakes: 'Bateau / lacs', adventure_snow: 'Aventure / neige / actif', wildlife_safari_birding: 'Faune / safari / oiseaux', food_local_cuisine: 'Balades gourmandes & cuisine locale', crafts_village_life: 'Artisanat / villages / vie locale' },
  },
  it: {
    steps: ['Tu', 'Stile', 'Esperienze', 'Date', 'Destinazioni', 'Viaggiatori', 'Extra', 'Invia'],
    s0Title: 'Per chi organizziamo?', name: 'Il tuo nome', namePh: 'es. Priya Sharma',
    wa: 'Numero WhatsApp (con prefisso)', waPh: 'es. 39 333 1234567', email: 'Email', emailPh: 'tu@email.com',
    firstTimeQ: 'È la tua prima volta in India?', yes: 'Sì', no: 'No',
    delhiExploreQ: 'Vuoi esplorare Delhi con noi?', delhiStayQ: 'Hai bisogno di alloggio a Delhi?', occasionQ: 'Un’occasione speciale?',
    occ: { none: 'Nessuna occasione speciale', honeymoon: 'Luna di miele', anniversary: 'Anniversario', birthday: 'Compleanno', family: 'Vacanza in famiglia', mice: 'Gruppo / MICE' },
    s1Title: 'Che atmosfera deve avere il viaggio?', s1Hint: 'Scegline uno o più — definisce destinazioni ed esperienze.',
    s2Title: 'Quali esperienze ti attraggono di più?', s2Hint: 'Facoltativo — affina gli extra proposti per città.',
    excursionPref: 'Aperto a escursioni vicine / gite di un giorno', excursionTag: 'escursione',
    s3Title: 'Scegli le destinazioni', s3Hint: 'Dai tuoi temi. Imposta le notti per città e mettile nell’ordine di viaggio.', s3Empty: 'Scegli prima uno stile di viaggio.', nights: 'notti',
    delhiGateway: 'Delhi — il tuo soggiorno', gatewayTag: 'arrivo e partenza', reorderHint: 'Ordina il percorso con ↑ ↓. Delhi resta a entrambe le estremità.', routeLabel: 'Itinerario',
    s4Title: 'Quando inizia il viaggio?', startDate: 'Data di partenza', showPricesIn: 'Mostra i prezzi in',
    langName: 'Italian',
    s5Title: 'Chi viaggia?', adults: 'Adulti', children: 'Bambini', natQ: 'Nazionalità', natIntl: 'Internazionale (straniero)', natIndian: 'Indiana',
    vehQ: 'Veicolo', vehChooseHint: 'Scegli il veicolo per il tuo gruppo:', vehSedanDesc: 'fino a 3 adulti · comoda per coppia o piccola famiglia · ₹20/km', vehSuvDesc: 'fino a 5 adulti (6 con un bambino) · più spazio per i bagagli · ₹26/km', vehAutoSuvNote: 'Per 4 o più adulti usiamo un SUV spazioso (₹26/km).',
    s6Title: 'Aggiungi esperienze opzionali', s6Hint: 'Una breve selezione per città in base ai tuoi temi. Scegli quelle che vuoi — IVY conferma il prezzo esatto.', excursionsNear: 'Escursioni / gite vicino a',
    s7Title: 'Pronto per inviare a IVY', s7Hint: 'Invieremo il tuo brief a IVY su WhatsApp. IVY deve solo confermare la preferenza d’hotel e prepara il preventivo completo — trasporto, esperienze, hotel e 5% di GST.',
    send: 'Invia il mio brief a IVY', sending: 'Invio…', back: 'Indietro', cont: 'Continua',
    doneTitle: 'Tutto pronto', doneRef: 'Il tuo riferimento è {ref}. Tocca qui sotto per aprire WhatsApp e inviare il messaggio — IVY ha già il tuo brief e continuerà da lì.', openWa: 'Apri WhatsApp con IVY',
    errMsg: 'Non siamo riusciti a inviare il brief, ma puoi scrivere a IVY ora.',
    prefs: { forts_palaces_architecture: 'Forti, palazzi e architettura', museums_history: 'Musei e storia', old_city_walks: 'Passeggiate nel centro storico e cultura locale', temples_rituals: 'Templi, riti e luoghi sacri', aarti_darshan: 'Aarti / darshan / devozione', pilgrimage_circuits: 'Circuiti di pellegrinaggio / fiumi sacri', scenic_photography: 'Punti panoramici e fotografia', nature_walks_treks: 'Passeggiate nella natura / trek', boating_lakes: 'Barca / laghi', adventure_snow: 'Avventura / neve / attivo', wildlife_safari_birding: 'Fauna / safari / birdwatching', food_local_cuisine: 'Passeggiate gastronomiche e cucina locale', crafts_village_life: 'Artigianato / villaggi / vita locale' },
  },
  ru: {
    steps: ['Вы', 'Стиль', 'Впечатления', 'Даты', 'Направления', 'Путешественники', 'Доп.', 'Отправить'],
    s0Title: 'Для кого планируем?', name: 'Ваше имя', namePh: 'напр. Прия Шарма',
    wa: 'Номер WhatsApp (с кодом страны)', waPh: 'напр. 7 900 000 0000', email: 'Эл. почта', emailPh: 'you@email.com',
    firstTimeQ: 'Вы впервые в Индии?', yes: 'Да', no: 'Нет',
    delhiExploreQ: 'Хотите осмотреть Дели с нами?', delhiStayQ: 'Нужно ли жильё в Дели?', occasionQ: 'Особый повод?',
    occ: { none: 'Без особого повода', honeymoon: 'Медовый месяц', anniversary: 'Годовщина', birthday: 'День рождения', family: 'Семейный отдых', mice: 'Группа / MICE' },
    s1Title: 'Какой должна быть поездка?', s1Hint: 'Выберите одно или несколько — это определяет направления и впечатления.',
    s2Title: 'Какие впечатления вам ближе?', s2Hint: 'Необязательно — уточняет подборку дополнений по каждому городу.',
    excursionPref: 'Готов(а) к ближним экскурсиям / однодневным поездкам', excursionTag: 'экскурсия',
    s3Title: 'Выберите направления', s3Hint: 'По выбранным темам. Укажите ночи по городам и расставьте их в порядке поездки.', s3Empty: 'Сначала выберите стиль поездки.', nights: 'ночей',
    delhiGateway: 'Дели — ваше проживание', gatewayTag: 'прибытие и отъезд', reorderHint: 'Задайте порядок маршрута стрелками ↑ ↓. Дели остаётся с обоих концов.', routeLabel: 'Маршрут',
    s4Title: 'Когда начинается поездка?', startDate: 'Дата начала', showPricesIn: 'Показывать цены в',
    langName: 'Russian',
    s5Title: 'Кто едет?', adults: 'Взрослые', children: 'Дети', natQ: 'Гражданство', natIntl: 'Иностранное', natIndian: 'Индия',
    vehQ: 'Транспорт', vehChooseHint: 'Выберите автомобиль для вашей группы:', vehSedanDesc: 'до 3 взрослых · удобно для пары или небольшой семьи · ₹20/км', vehSuvDesc: 'до 5 взрослых (6 с ребёнком) · больше места для багажа · ₹26/км', vehAutoSuvNote: 'Для 4 и более взрослых мы используем просторный внедорожник (₹26/км).',
    s6Title: 'Добавьте дополнительные впечатления', s6Hint: 'Короткая подборка по каждому городу по вашим темам. Выбирайте любые — IVY подтвердит точную цену.', excursionsNear: 'Экскурсии / поездки рядом с',
    s7Title: 'Готово к отправке IVY', s7Hint: 'Мы передадим вашу заявку IVY в WhatsApp. IVY останется уточнить лишь предпочтения по отелю и подготовит полный расчёт — транспорт, впечатления, отели и 5% GST.',
    send: 'Отправить заявку IVY', sending: 'Отправка…', back: 'Назад', cont: 'Далее',
    doneTitle: 'Всё готово', doneRef: 'Ваш номер — {ref}. Нажмите ниже, чтобы открыть WhatsApp и отправить сообщение — у IVY уже есть ваша заявка, и он продолжит.', openWa: 'Открыть WhatsApp с IVY',
    errMsg: 'Не удалось предварительно отправить заявку, но вы можете написать IVY сейчас.',
    prefs: { forts_palaces_architecture: 'Форты, дворцы и архитектура', museums_history: 'Музеи и история', old_city_walks: 'Прогулки по старому городу и местная культура', temples_rituals: 'Храмы, ритуалы и святые места', aarti_darshan: 'Аарти / даршан / религиозное', pilgrimage_circuits: 'Паломнические маршруты / священные реки', scenic_photography: 'Смотровые площадки и фотография', nature_walks_treks: 'Прогулки на природе / треки', boating_lakes: 'Лодки / озёра', adventure_snow: 'Приключения / снег / актив', wildlife_safari_birding: 'Дикая природа / сафари / птицы', food_local_cuisine: 'Гастропрогулки и местная кухня', crafts_village_life: 'Ремёсла / деревни / местная жизнь' },
  },
};

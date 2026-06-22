/* Estimator UI strings in all six site languages. Theme labels reuse the
   existing i18n (interest.*); these cover the estimator's own chrome + the
   experience-preference chip labels. Keep concise and clear. */
import type { Lang } from '../i18n/ui';

export interface EstStrings {
  steps: string[]; // 8: You, Trip style, Experiences, Destinations, Dates, Travellers, Add-ons, Send
  s0Title: string; name: string; namePh: string; wa: string; waPh: string; email: string; emailPh: string;
  firstTimeQ: string; yes: string; no: string; occasionQ: string;
  occ: { none: string; honeymoon: string; anniversary: string; birthday: string; family: string; mice: string };
  s1Title: string; s1Hint: string;
  s2Title: string; s2Hint: string; excursionPref: string; excursionTag: string;
  s3Title: string; s3Hint: string; s3Empty: string; nights: string;
  s4Title: string; startCity: string; startCityPh: string; startDate: string; showPricesIn: string;
  s5Title: string; adults: string; children: string; natQ: string; natIntl: string; natIndian: string;
  vehQ: string; vehRecommend: string;
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
    steps: ['You', 'Trip style', 'Experiences', 'Destinations', 'Dates', 'Travellers', 'Add-ons', 'Send'],
    s0Title: 'First, who shall we plan for?', name: 'Your name', namePh: 'e.g. Priya Sharma',
    wa: 'WhatsApp number (with country code)', waPh: 'e.g. 44 7700 900123', email: 'Email', emailPh: 'you@email.com',
    firstTimeQ: 'Is this your first time in India?', yes: 'Yes', no: 'No', occasionQ: 'Any special occasion?',
    occ: { none: 'No special occasion', honeymoon: 'Honeymoon', anniversary: 'Anniversary', birthday: 'Birthday', family: 'Family holiday', mice: 'Group / MICE' },
    s1Title: 'What should this trip feel like?', s1Hint: 'Pick one or more — it shapes the destinations and experiences we suggest.',
    s2Title: 'Which experiences appeal most?', s2Hint: 'Optional — this fine-tunes the add-ons we shortlist for each city.',
    excursionPref: 'Open to nearby excursions / day trips', excursionTag: 'excursion',
    s3Title: 'Choose your destinations', s3Hint: 'From your chosen themes. Set nights per city — Delhi is your start city.', s3Empty: 'Pick a trip style first.', nights: 'nights',
    s4Title: 'When does the journey start?', startCity: 'Start city', startCityPh: 'Delhi', startDate: 'Travel start date', showPricesIn: 'Show prices in',
    s5Title: "Who's travelling?", adults: 'Adults', children: 'Children', natQ: 'Nationality', natIntl: 'International (foreign national)', natIndian: 'Indian',
    vehQ: 'Vehicle preference', vehRecommend: 'Recommend the right one for my group',
    s6Title: 'Add optional experiences', s6Hint: 'A short, theme-matched shortlist per city. Pick any you like — IVY confirms exact pricing.', excursionsNear: 'Excursions / day trips near',
    s7Title: 'Ready to send to IVY', s7Hint: "We'll pass your brief to IVY on WhatsApp. IVY only needs to confirm your hotel preference, then prepares the full quote — transport, experiences, hotels, and 5% GST.",
    send: 'Send my brief to IVY', sending: 'Sending…', back: 'Back', cont: 'Continue',
    doneTitle: "You're all set", doneRef: 'Your reference is {ref}. We\u2019ve opened WhatsApp — just send the pre-filled message and IVY will take it from there.', openWa: 'Open WhatsApp with IVY',
    errMsg: 'We could not pre-send your brief, but you can still message IVY now.', prefs: PREF_EN,
  },
  es: {
    steps: ['Tú', 'Estilo', 'Experiencias', 'Destinos', 'Fechas', 'Viajeros', 'Extras', 'Enviar'],
    s0Title: '¿Para quién planificamos?', name: 'Tu nombre', namePh: 'p. ej. Priya Sharma',
    wa: 'Número de WhatsApp (con código de país)', waPh: 'p. ej. 34 600 000 000', email: 'Correo', emailPh: 'tu@email.com',
    firstTimeQ: '¿Es tu primera vez en India?', yes: 'Sí', no: 'No', occasionQ: '¿Alguna ocasión especial?',
    occ: { none: 'Sin ocasión especial', honeymoon: 'Luna de miel', anniversary: 'Aniversario', birthday: 'Cumpleaños', family: 'Viaje en familia', mice: 'Grupo / MICE' },
    s1Title: '¿Cómo quieres que sea el viaje?', s1Hint: 'Elige uno o varios — define los destinos y experiencias que sugerimos.',
    s2Title: '¿Qué experiencias te atraen más?', s2Hint: 'Opcional — afina los extras que preseleccionamos por ciudad.',
    excursionPref: 'Abierto a excursiones cercanas / visitas de un día', excursionTag: 'excursión',
    s3Title: 'Elige tus destinos', s3Hint: 'Según tus temas. Ajusta las noches por ciudad — Delhi es tu ciudad de inicio.', s3Empty: 'Elige primero un estilo de viaje.', nights: 'noches',
    s4Title: '¿Cuándo empieza el viaje?', startCity: 'Ciudad de inicio', startCityPh: 'Delhi', startDate: 'Fecha de inicio', showPricesIn: 'Ver precios en',
    s5Title: '¿Quién viaja?', adults: 'Adultos', children: 'Niños', natQ: 'Nacionalidad', natIntl: 'Internacional (extranjero)', natIndian: 'India',
    vehQ: 'Preferencia de vehículo', vehRecommend: 'Recomiéndame el adecuado para mi grupo',
    s6Title: 'Añade experiencias opcionales', s6Hint: 'Una breve selección por ciudad según tus temas. Elige las que quieras — IVY confirma el precio exacto.', excursionsNear: 'Excursiones / visitas cerca de',
    s7Title: 'Listo para enviar a IVY', s7Hint: 'Enviaremos tu resumen a IVY por WhatsApp. IVY solo necesita confirmar tu preferencia de hotel y preparará el presupuesto completo — transporte, experiencias, hoteles y 5% de IVA (GST).',
    send: 'Enviar mi resumen a IVY', sending: 'Enviando…', back: 'Atrás', cont: 'Continuar',
    doneTitle: 'Todo listo', doneRef: 'Tu referencia es {ref}. Hemos abierto WhatsApp — solo envía el mensaje y IVY se encargará.', openWa: 'Abrir WhatsApp con IVY',
    errMsg: 'No pudimos enviar tu resumen, pero ya puedes escribir a IVY.',
    prefs: { forts_palaces_architecture: 'Fuertes, palacios y arquitectura', museums_history: 'Museos e historia', old_city_walks: 'Paseos por el casco antiguo y cultura local', temples_rituals: 'Templos, rituales y lugares sagrados', aarti_darshan: 'Aarti / darshan / devocional', pilgrimage_circuits: 'Circuitos de peregrinación / ríos sagrados', scenic_photography: 'Miradores y fotografía', nature_walks_treks: 'Paseos por la naturaleza / treks', boating_lakes: 'Paseos en barco / lagos', adventure_snow: 'Aventura / nieve / activo', wildlife_safari_birding: 'Fauna / safari / aves', food_local_cuisine: 'Rutas gastronómicas y cocina local', crafts_village_life: 'Artesanía / pueblos / vida local' },
  },
  de: {
    steps: ['Sie', 'Reisestil', 'Erlebnisse', 'Ziele', 'Termine', 'Reisende', 'Extras', 'Senden'],
    s0Title: 'Für wen planen wir?', name: 'Ihr Name', namePh: 'z. B. Priya Sharma',
    wa: 'WhatsApp-Nummer (mit Ländercode)', waPh: 'z. B. 49 1512 3456789', email: 'E-Mail', emailPh: 'sie@email.com',
    firstTimeQ: 'Ist es Ihr erstes Mal in Indien?', yes: 'Ja', no: 'Nein', occasionQ: 'Ein besonderer Anlass?',
    occ: { none: 'Kein besonderer Anlass', honeymoon: 'Flitterwochen', anniversary: 'Jubiläum', birthday: 'Geburtstag', family: 'Familienreise', mice: 'Gruppe / MICE' },
    s1Title: 'Wie soll sich die Reise anfühlen?', s1Hint: 'Wählen Sie eines oder mehrere — das bestimmt Ziele und Erlebnisse.',
    s2Title: 'Welche Erlebnisse reizen Sie am meisten?', s2Hint: 'Optional — verfeinert die Extras, die wir pro Stadt vorschlagen.',
    excursionPref: 'Offen für Ausflüge in der Nähe / Tagesausflüge', excursionTag: 'Ausflug',
    s3Title: 'Wählen Sie Ihre Ziele', s3Hint: 'Aus Ihren Themen. Nächte pro Stadt einstellen — Delhi ist Ihre Startstadt.', s3Empty: 'Wählen Sie zuerst einen Reisestil.', nights: 'Nächte',
    s4Title: 'Wann beginnt die Reise?', startCity: 'Startstadt', startCityPh: 'Delhi', startDate: 'Reisebeginn', showPricesIn: 'Preise anzeigen in',
    s5Title: 'Wer reist?', adults: 'Erwachsene', children: 'Kinder', natQ: 'Nationalität', natIntl: 'International (ausländisch)', natIndian: 'Indisch',
    vehQ: 'Fahrzeugwunsch', vehRecommend: 'Empfehlen Sie das passende für meine Gruppe',
    s6Title: 'Optionale Erlebnisse hinzufügen', s6Hint: 'Eine kurze, themenpassende Auswahl pro Stadt. Wählen Sie beliebig — IVY bestätigt den genauen Preis.', excursionsNear: 'Ausflüge / Tagestouren bei',
    s7Title: 'Bereit zum Senden an IVY', s7Hint: 'Wir senden Ihren Brief per WhatsApp an IVY. IVY muss nur Ihre Hotelpräferenz bestätigen und erstellt dann das volle Angebot — Transport, Erlebnisse, Hotels und 5% GST.',
    send: 'Meinen Brief an IVY senden', sending: 'Senden…', back: 'Zurück', cont: 'Weiter',
    doneTitle: 'Alles bereit', doneRef: 'Ihre Referenz ist {ref}. Wir haben WhatsApp geöffnet — senden Sie einfach die Nachricht und IVY übernimmt.', openWa: 'WhatsApp mit IVY öffnen',
    errMsg: 'Wir konnten Ihren Brief nicht vorab senden, aber Sie können IVY jetzt schreiben.',
    prefs: { forts_palaces_architecture: 'Forts, Paläste & Architektur', museums_history: 'Museen & Geschichte', old_city_walks: 'Altstadt-Spaziergänge & lokale Kultur', temples_rituals: 'Tempel, Rituale & heilige Stätten', aarti_darshan: 'Aarti / Darshan / Andacht', pilgrimage_circuits: 'Pilgerrouten / heilige Flüsse', scenic_photography: 'Aussichtspunkte & Fotografie', nature_walks_treks: 'Naturwanderungen / Treks', boating_lakes: 'Bootsfahrten / Seen', adventure_snow: 'Abenteuer / Schnee / aktiv', wildlife_safari_birding: 'Tierwelt / Safari / Vögel', food_local_cuisine: 'Food-Walks & lokale Küche', crafts_village_life: 'Handwerk / Dörfer / lokales Leben' },
  },
  fr: {
    steps: ['Vous', 'Style', 'Expériences', 'Destinations', 'Dates', 'Voyageurs', 'Options', 'Envoyer'],
    s0Title: 'Pour qui organisons-nous ?', name: 'Votre nom', namePh: 'p. ex. Priya Sharma',
    wa: 'Numéro WhatsApp (avec indicatif)', waPh: 'p. ex. 33 6 12 34 56 78', email: 'E-mail', emailPh: 'vous@email.com',
    firstTimeQ: 'Est-ce votre première fois en Inde ?', yes: 'Oui', no: 'Non', occasionQ: 'Une occasion spéciale ?',
    occ: { none: 'Aucune occasion particulière', honeymoon: 'Lune de miel', anniversary: 'Anniversaire de mariage', birthday: 'Anniversaire', family: 'Voyage en famille', mice: 'Groupe / MICE' },
    s1Title: 'Quelle ambiance pour ce voyage ?', s1Hint: 'Choisissez une ou plusieurs — cela oriente les destinations et expériences.',
    s2Title: 'Quelles expériences vous attirent ?', s2Hint: 'Facultatif — affine les options proposées par ville.',
    excursionPref: 'Ouvert aux excursions proches / sorties à la journée', excursionTag: 'excursion',
    s3Title: 'Choisissez vos destinations', s3Hint: 'Selon vos thèmes. Réglez les nuits par ville — Delhi est votre ville de départ.', s3Empty: "Choisissez d'abord un style de voyage.", nights: 'nuits',
    s4Title: 'Quand commence le voyage ?', startCity: 'Ville de départ', startCityPh: 'Delhi', startDate: 'Date de départ', showPricesIn: 'Afficher les prix en',
    s5Title: 'Qui voyage ?', adults: 'Adultes', children: 'Enfants', natQ: 'Nationalité', natIntl: 'International (étranger)', natIndian: 'Indien',
    vehQ: 'Préférence de véhicule', vehRecommend: 'Recommandez celui qui convient à mon groupe',
    s6Title: 'Ajoutez des expériences en option', s6Hint: 'Une courte sélection par ville selon vos thèmes. Choisissez librement — IVY confirme le prix exact.', excursionsNear: 'Excursions / sorties près de',
    s7Title: 'Prêt à envoyer à IVY', s7Hint: 'Nous transmettons votre brief à IVY sur WhatsApp. IVY confirme simplement votre préférence d’hôtel puis prépare le devis complet — transport, expériences, hôtels et 5% de GST.',
    send: 'Envoyer mon brief à IVY', sending: 'Envoi…', back: 'Retour', cont: 'Continuer',
    doneTitle: 'Tout est prêt', doneRef: 'Votre référence est {ref}. Nous avons ouvert WhatsApp — envoyez le message et IVY prend le relais.', openWa: 'Ouvrir WhatsApp avec IVY',
    errMsg: 'Nous n’avons pas pu pré-envoyer votre brief, mais vous pouvez écrire à IVY maintenant.',
    prefs: { forts_palaces_architecture: 'Forts, palais & architecture', museums_history: 'Musées & histoire', old_city_walks: 'Balades en vieille ville & culture locale', temples_rituals: 'Temples, rituels & sites sacrés', aarti_darshan: 'Aarti / darshan / dévotion', pilgrimage_circuits: 'Circuits de pèlerinage / rivières sacrées', scenic_photography: 'Points de vue & photographie', nature_walks_treks: 'Balades nature / treks', boating_lakes: 'Bateau / lacs', adventure_snow: 'Aventure / neige / actif', wildlife_safari_birding: 'Faune / safari / oiseaux', food_local_cuisine: 'Balades gourmandes & cuisine locale', crafts_village_life: 'Artisanat / villages / vie locale' },
  },
  it: {
    steps: ['Tu', 'Stile', 'Esperienze', 'Destinazioni', 'Date', 'Viaggiatori', 'Extra', 'Invia'],
    s0Title: 'Per chi organizziamo?', name: 'Il tuo nome', namePh: 'es. Priya Sharma',
    wa: 'Numero WhatsApp (con prefisso)', waPh: 'es. 39 333 1234567', email: 'Email', emailPh: 'tu@email.com',
    firstTimeQ: 'È la tua prima volta in India?', yes: 'Sì', no: 'No', occasionQ: 'Un’occasione speciale?',
    occ: { none: 'Nessuna occasione speciale', honeymoon: 'Luna di miele', anniversary: 'Anniversario', birthday: 'Compleanno', family: 'Vacanza in famiglia', mice: 'Gruppo / MICE' },
    s1Title: 'Che atmosfera deve avere il viaggio?', s1Hint: 'Scegline uno o più — definisce destinazioni ed esperienze.',
    s2Title: 'Quali esperienze ti attraggono di più?', s2Hint: 'Facoltativo — affina gli extra proposti per città.',
    excursionPref: 'Aperto a escursioni vicine / gite di un giorno', excursionTag: 'escursione',
    s3Title: 'Scegli le destinazioni', s3Hint: 'Dai tuoi temi. Imposta le notti per città — Delhi è la città di partenza.', s3Empty: 'Scegli prima uno stile di viaggio.', nights: 'notti',
    s4Title: 'Quando inizia il viaggio?', startCity: 'Città di partenza', startCityPh: 'Delhi', startDate: 'Data di partenza', showPricesIn: 'Mostra i prezzi in',
    s5Title: 'Chi viaggia?', adults: 'Adulti', children: 'Bambini', natQ: 'Nazionalità', natIntl: 'Internazionale (straniero)', natIndian: 'Indiana',
    vehQ: 'Preferenza veicolo', vehRecommend: 'Consiglia quello giusto per il mio gruppo',
    s6Title: 'Aggiungi esperienze opzionali', s6Hint: 'Una breve selezione per città in base ai tuoi temi. Scegli quelle che vuoi — IVY conferma il prezzo esatto.', excursionsNear: 'Escursioni / gite vicino a',
    s7Title: 'Pronto per inviare a IVY', s7Hint: 'Invieremo il tuo brief a IVY su WhatsApp. IVY deve solo confermare la preferenza d’hotel e prepara il preventivo completo — trasporto, esperienze, hotel e 5% di GST.',
    send: 'Invia il mio brief a IVY', sending: 'Invio…', back: 'Indietro', cont: 'Continua',
    doneTitle: 'Tutto pronto', doneRef: 'Il tuo riferimento è {ref}. Abbiamo aperto WhatsApp — invia il messaggio e IVY farà il resto.', openWa: 'Apri WhatsApp con IVY',
    errMsg: 'Non siamo riusciti a inviare il brief, ma puoi scrivere a IVY ora.',
    prefs: { forts_palaces_architecture: 'Forti, palazzi e architettura', museums_history: 'Musei e storia', old_city_walks: 'Passeggiate nel centro storico e cultura locale', temples_rituals: 'Templi, riti e luoghi sacri', aarti_darshan: 'Aarti / darshan / devozione', pilgrimage_circuits: 'Circuiti di pellegrinaggio / fiumi sacri', scenic_photography: 'Punti panoramici e fotografia', nature_walks_treks: 'Passeggiate nella natura / trek', boating_lakes: 'Barca / laghi', adventure_snow: 'Avventura / neve / attivo', wildlife_safari_birding: 'Fauna / safari / birdwatching', food_local_cuisine: 'Passeggiate gastronomiche e cucina locale', crafts_village_life: 'Artigianato / villaggi / vita locale' },
  },
  ru: {
    steps: ['Вы', 'Стиль', 'Впечатления', 'Направления', 'Даты', 'Путешественники', 'Доп.', 'Отправить'],
    s0Title: 'Для кого планируем?', name: 'Ваше имя', namePh: 'напр. Прия Шарма',
    wa: 'Номер WhatsApp (с кодом страны)', waPh: 'напр. 7 900 000 0000', email: 'Эл. почта', emailPh: 'you@email.com',
    firstTimeQ: 'Вы впервые в Индии?', yes: 'Да', no: 'Нет', occasionQ: 'Особый повод?',
    occ: { none: 'Без особого повода', honeymoon: 'Медовый месяц', anniversary: 'Годовщина', birthday: 'День рождения', family: 'Семейный отдых', mice: 'Группа / MICE' },
    s1Title: 'Какой должна быть поездка?', s1Hint: 'Выберите одно или несколько — это определяет направления и впечатления.',
    s2Title: 'Какие впечатления вам ближе?', s2Hint: 'Необязательно — уточняет подборку дополнений по каждому городу.',
    excursionPref: 'Готов(а) к ближним экскурсиям / однодневным поездкам', excursionTag: 'экскурсия',
    s3Title: 'Выберите направления', s3Hint: 'По выбранным темам. Укажите ночи по городам — Дели ваш стартовый город.', s3Empty: 'Сначала выберите стиль поездки.', nights: 'ночей',
    s4Title: 'Когда начинается поездка?', startCity: 'Стартовый город', startCityPh: 'Дели', startDate: 'Дата начала', showPricesIn: 'Показывать цены в',
    s5Title: 'Кто едет?', adults: 'Взрослые', children: 'Дети', natQ: 'Гражданство', natIntl: 'Иностранное', natIndian: 'Индия',
    vehQ: 'Предпочтения по транспорту', vehRecommend: 'Подберите подходящий для моей группы',
    s6Title: 'Добавьте дополнительные впечатления', s6Hint: 'Короткая подборка по каждому городу по вашим темам. Выбирайте любые — IVY подтвердит точную цену.', excursionsNear: 'Экскурсии / поездки рядом с',
    s7Title: 'Готово к отправке IVY', s7Hint: 'Мы передадим вашу заявку IVY в WhatsApp. IVY останется уточнить лишь предпочтения по отелю и подготовит полный расчёт — транспорт, впечатления, отели и 5% GST.',
    send: 'Отправить заявку IVY', sending: 'Отправка…', back: 'Назад', cont: 'Далее',
    doneTitle: 'Всё готово', doneRef: 'Ваш номер — {ref}. Мы открыли WhatsApp — просто отправьте сообщение, и IVY продолжит.', openWa: 'Открыть WhatsApp с IVY',
    errMsg: 'Не удалось предварительно отправить заявку, но вы можете написать IVY сейчас.',
    prefs: { forts_palaces_architecture: 'Форты, дворцы и архитектура', museums_history: 'Музеи и история', old_city_walks: 'Прогулки по старому городу и местная культура', temples_rituals: 'Храмы, ритуалы и святые места', aarti_darshan: 'Аарти / даршан / религиозное', pilgrimage_circuits: 'Паломнические маршруты / священные реки', scenic_photography: 'Смотровые площадки и фотография', nature_walks_treks: 'Прогулки на природе / треки', boating_lakes: 'Лодки / озёра', adventure_snow: 'Приключения / снег / актив', wildlife_safari_birding: 'Дикая природа / сафари / птицы', food_local_cuisine: 'Гастропрогулки и местная кухня', crafts_village_life: 'Ремёсла / деревни / местная жизнь' },
  },
};

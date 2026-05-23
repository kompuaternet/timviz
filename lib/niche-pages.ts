import type { SeoCopy } from "./seo";
import { withEnglishFallback, withNestedExtraLanguageFallbacks, type SiteLanguage } from "./site-language";

export type NicheKey = "manicure" | "hairdressers" | "barbers" | "cosmetologists" | "massage";

export const nicheSlugMap: Record<SiteLanguage, Record<NicheKey, string>> = withEnglishFallback<Record<NicheKey, string>>({
  uk: {
    manicure: "dlya-manikyuru",
    hairdressers: "dlya-perukariv",
    barbers: "dlya-barberiv",
    cosmetologists: "dlya-kosmetologiv",
    massage: "dlya-masazhu"
  },
  ru: {
    manicure: "dlya-manikyura",
    hairdressers: "dlya-parikmaherov",
    barbers: "dlya-barberov",
    cosmetologists: "dlya-kosmetologov",
    massage: "dlya-massazhistov"
  },
  en: {
    manicure: "for-nail-technicians",
    hairdressers: "for-hairdressers",
    barbers: "for-barbers",
    cosmetologists: "for-cosmetologists",
    massage: "for-massage-therapists"
  }
});

export const nicheKeys: NicheKey[] = ["manicure", "hairdressers", "barbers", "cosmetologists", "massage"];

export function getNicheSlug(language: SiteLanguage, key: NicheKey) {
  return nicheSlugMap[language][key];
}

export function getNicheKeyBySlug(language: SiteLanguage, slug: string): NicheKey | null {
  return nicheKeys.find((key) => nicheSlugMap[language][key] === slug) ?? null;
}

export function getAllNicheParams() {
  return (Object.keys(nicheSlugMap) as SiteLanguage[]).flatMap((lang) =>
    nicheKeys.map((key) => ({ lang, niche: nicheSlugMap[lang][key], key }))
  );
}

type NicheCardCopy = { shortTitle: string; description: string };
type NichePageCopy = { h1: string; lead: string; body: string[] };

export const nicheCards: Record<NicheKey, Record<SiteLanguage, NicheCardCopy>> = withNestedExtraLanguageFallbacks<NicheKey, NicheCardCopy>({
  manicure: {
    uk: { shortTitle: "Для майстрів манікюру", description: "Онлайн-запис, послуги, ціни та календар для майстрів нігтьового сервісу." },
    ru: { shortTitle: "Для мастеров маникюра", description: "Онлайн-запись, услуги, цены и календарь для мастеров ногтевого сервиса." },
    en: { shortTitle: "For nail technicians", description: "Online booking, pricing and calendar management for nail professionals." }
  },
  hairdressers: {
    uk: { shortTitle: "Для перукарів", description: "Керування записами, тривалістю послуг і графіком для перукарів." },
    ru: { shortTitle: "Для парикмахеров", description: "Управление записью, длительностью услуг и графиком для парикмахеров." },
    en: { shortTitle: "For hairdressers", description: "Booking, service duration and schedule tools for hairdressers." }
  },
  barbers: {
    uk: { shortTitle: "Для барберів", description: "Щільний календар, повторні візити та швидкий онлайн-запис для барберів." },
    ru: { shortTitle: "Для барберов", description: "Плотный календарь, повторные визиты и быстрая онлайн-запись для барберов." },
    en: { shortTitle: "For barbers", description: "Keep a high-load calendar under control with quick online booking." }
  },
  cosmetologists: {
    uk: { shortTitle: "Для косметологів", description: "Плануйте довгі процедури та керуйте щоденним завантаженням без стресу." },
    ru: { shortTitle: "Для косметологов", description: "Планируйте длительные процедуры и управляйте загрузкой дня без стресса." },
    en: { shortTitle: "For cosmetologists", description: "Organize longer procedures and keep daily workload balanced." }
  },
  massage: {
    uk: { shortTitle: "Для масажистів", description: "Гнучкий розклад сесій різної тривалості та зручний онлайн-запис." },
    ru: { shortTitle: "Для массажистов", description: "Гибкое расписание сессий разной длительности и удобная онлайн-запись." },
    en: { shortTitle: "For massage therapists", description: "Flexible scheduling for sessions of different durations." }
  }
}, {
  manicure: { fr: { shortTitle: "Pour prothésistes ongulaires", description: "Réservation en ligne, prix et agenda pour les professionnels des ongles." }, pl: { shortTitle: "Dla stylistek paznokci", description: "Rezerwacje online, ceny i kalendarz dla branży paznokci." }, cs: { shortTitle: "Pro nehtové specialisty", description: "Online rezervace, ceny a kalendář pro nehtové služby." }, es: { shortTitle: "Para especialistas en uñas", description: "Reservas online, precios y calendario para profesionales de uñas." }, de: { shortTitle: "Für Nagelstudios", description: "Online-Buchung, Preise und Kalender für Nagelprofis." } },
  hairdressers: { fr: { shortTitle: "Pour coiffeurs", description: "Gestion des rendez-vous, durées de services et horaires pour coiffeurs." }, pl: { shortTitle: "Dla fryzjerów", description: "Rezerwacje, czas usług i grafik pracy dla fryzjerów." }, cs: { shortTitle: "Pro kadeřníky", description: "Rezervace, délky služeb a rozvrh pro kadeřníky." }, es: { shortTitle: "Para peluqueros", description: "Reservas, duración de servicios y agenda para peluquerías." }, de: { shortTitle: "Für Friseure", description: "Buchungen, Leistungsdauer und Planung für Friseure." } },
  barbers: { fr: { shortTitle: "Pour barbiers", description: "Agenda chargé, visites répétées et réservation rapide pour barbiers." }, pl: { shortTitle: "Dla barberów", description: "Gęsty kalendarz, powracające wizyty i szybkie rezerwacje online." }, cs: { shortTitle: "Pro barbery", description: "Plný kalendář, opakované návštěvy a rychlé online rezervace." }, es: { shortTitle: "Para barberos", description: "Agenda intensa, visitas recurrentes y reservas online rápidas." }, de: { shortTitle: "Für Barber", description: "Volle Kalender, Wiederholungsbesuche und schnelle Online-Buchung." } },
  cosmetologists: { fr: { shortTitle: "Pour esthéticiennes", description: "Planifiez les soins longs et maîtrisez la charge quotidienne." }, pl: { shortTitle: "Dla kosmetologów", description: "Planuj dłuższe zabiegi i kontroluj obłożenie dnia." }, cs: { shortTitle: "Pro kosmetology", description: "Plánujte delší procedury a udržte denní vytížení pod kontrolou." }, es: { shortTitle: "Para cosmetólogos", description: "Planifica tratamientos largos y controla la carga diaria." }, de: { shortTitle: "Für Kosmetiker", description: "Plane längere Behandlungen und behalte die Tagesauslastung im Griff." } },
  massage: { fr: { shortTitle: "Pour masseurs", description: "Planning flexible pour séances de différentes durées." }, pl: { shortTitle: "Dla masażystów", description: "Elastyczny grafik sesji o różnej długości." }, cs: { shortTitle: "Pro maséry", description: "Flexibilní rozvrh pro sezení různých délek." }, es: { shortTitle: "Para masajistas", description: "Agenda flexible para sesiones de diferentes duraciones." }, de: { shortTitle: "Für Masseure", description: "Flexible Planung für Sitzungen unterschiedlicher Dauer." } }
});

export const nicheContent: Record<NicheKey, Record<SiteLanguage, NichePageCopy>> = withNestedExtraLanguageFallbacks<NicheKey, NichePageCopy>({
  manicure: {
    uk: { h1: "Timviz для майстрів манікюру", lead: "Приймайте онлайн-запис 24/7 і керуйте послугами без хаосу в месенджерах.", body: ["Timviz допомагає майстрам манікюру зібрати запис, прайс і календар в одному місці.", "Клієнти самі обирають послугу й час, а ви отримуєте передбачуваний графік дня."] },
    ru: { h1: "Timviz для мастеров маникюра", lead: "Принимайте онлайн-запись 24/7 и управляйте услугами без хаоса в мессенджерах.", body: ["Timviz помогает мастерам маникюра собрать запись, прайс и календарь в одном кабинете.", "Клиенты выбирают услугу и время сами, а вы работаете с прозрачным расписанием."] },
    en: { h1: "Timviz for nail technicians", lead: "Run online booking 24/7 and manage services without messenger chaos.", body: ["Timviz keeps bookings, pricing and calendar planning in one workspace.", "Clients choose services and slots on their own, while you keep schedule control."] }
  },
  hairdressers: {
    uk: { h1: "Timviz для перукарів", lead: "Плануйте стрижки, фарбування та комплексні послуги без накладок.", body: ["Налаштуйте тривалість і вартість послуг, щоб клієнти записувалися у правильні слоти.", "Календар показує завантаження за день, тиждень і місяць."] },
    ru: { h1: "Timviz для парикмахеров", lead: "Планируйте стрижки, окрашивания и сложные услуги без накладок.", body: ["Гибко настраивайте длительность и стоимость услуг, чтобы клиенты попадали в правильные слоты.", "Календарь показывает загрузку на день, неделю и месяц."] },
    en: { h1: "Timviz for hairdressers", lead: "Plan cuts, coloring and complex services without scheduling conflicts.", body: ["Configure service duration and pricing so clients book accurate time slots.", "Use daily, weekly and monthly views to keep your workload balanced."] }
  },
  barbers: {
    uk: { h1: "Timviz для барберів", lead: "Контролюйте щільний потік записів і зменшуйте кількість дзвінків.", body: ["Клієнти бронюють онлайн, а ви бачите реальні вільні слоти.", "Платформа підходить для індивідуальних барберів і барбершопів."] },
    ru: { h1: "Timviz для барберов", lead: "Контролируйте плотный поток записей и уменьшайте количество звонков.", body: ["Клиенты бронируют онлайн, а вы видите реальные свободные слоты.", "Платформа подходит для индивидуальных барберов и барбершопов."] },
    en: { h1: "Timviz for barbers", lead: "Control high booking flow and reduce manual call coordination.", body: ["Clients book online while you manage a clear real-time schedule.", "Works well for solo barbers and busy barbershops."] }
  },
  cosmetologists: {
    uk: { h1: "Timviz для косметологів", lead: "Плануйте довгі процедури й уникайте накладок у графіку.", body: ["Налаштуйте процедури з тривалістю та ціною для точного планування.", "Клієнти записуються онлайн, а ви бачите завантаження наперед."] },
    ru: { h1: "Timviz для косметологов", lead: "Планируйте длинные процедуры и избегайте накладок в графике.", body: ["Настройте процедуры с длительностью и ценой для точного планирования.", "Клиенты записываются онлайн, а вы видите загрузку заранее."] },
    en: { h1: "Timviz for cosmetologists", lead: "Plan longer procedures and avoid schedule overlaps.", body: ["Configure treatment duration and pricing for accurate planning.", "Clients book online and you track workload in advance."] }
  },
  massage: {
    uk: { h1: "Timviz для масажистів", lead: "Керуйте короткими й довгими сесіями в одному календарі.", body: ["Налаштуйте тривалість кожної сесії та працюйте зі зрозумілим графіком.", "Клієнти бронюють вільний час онлайн без зайвих узгоджень."] },
    ru: { h1: "Timviz для массажистов", lead: "Управляйте короткими и длинными сессиями в одном календаре.", body: ["Настройте длительность каждой услуги и работайте с прозрачным расписанием.", "Клиенты бронируют свободное время онлайн без лишних согласований."] },
    en: { h1: "Timviz for massage therapists", lead: "Manage short and long sessions in one calendar.", body: ["Set duration per service and keep a clear schedule every day.", "Clients book available slots online with less manual coordination."] }
  }
}, {
  manicure: { fr: { h1: "Timviz pour prothésistes ongulaires", lead: "Acceptez les réservations 24/7 et gérez vos services sans chaos dans les messages.", body: ["Timviz réunit réservations, tarifs et agenda dans un seul espace de travail.", "Les clientes choisissent service et créneau, pendant que vous gardez le contrôle du planning."] }, pl: { h1: "Timviz dla stylistek paznokci", lead: "Przyjmuj rezerwacje 24/7 i zarządzaj usługami bez chaosu w wiadomościach.", body: ["Timviz łączy rezerwacje, cennik i kalendarz w jednym miejscu.", "Klientki same wybierają usługę i termin, a Ty kontrolujesz grafik dnia."] }, cs: { h1: "Timviz pro nehtové specialisty", lead: "Přijímejte rezervace 24/7 a spravujte služby bez chaosu ve zprávách.", body: ["Timviz spojuje rezervace, ceník a kalendář v jednom pracovním prostoru.", "Klienti si vyberou službu a čas, vy máte plán dne pod kontrolou."] }, es: { h1: "Timviz para especialistas en uñas", lead: "Acepta reservas 24/7 y gestiona servicios sin caos en mensajes.", body: ["Timviz reúne reservas, precios y calendario en un solo espacio.", "Los clientes eligen servicio y hora, mientras tú controlas la agenda."] }, de: { h1: "Timviz für Nagelprofis", lead: "Nimm Buchungen rund um die Uhr an und verwalte Leistungen ohne Nachrichtenchaos.", body: ["Timviz bündelt Buchungen, Preise und Kalender in einem Arbeitsbereich.", "Kunden wählen Leistung und Termin selbst, du behältst den Tagesplan im Griff."] } },
  hairdressers: { fr: { h1: "Timviz pour coiffeurs", lead: "Planifiez coupes, couleurs et services complexes sans conflits d’horaires.", body: ["Configurez durée et prix pour que les clients réservent le bon créneau.", "Le calendrier montre la charge par jour, semaine et mois."] }, pl: { h1: "Timviz dla fryzjerów", lead: "Planuj strzyżenia, koloryzacje i złożone usługi bez nakładek.", body: ["Ustaw czas i cenę usług, aby klienci trafiali w poprawne terminy.", "Kalendarz pokazuje obłożenie dnia, tygodnia i miesiąca."] }, cs: { h1: "Timviz pro kadeřníky", lead: "Plánujte střihy, barvení a složité služby bez kolizí.", body: ["Nastavte délku a cenu služeb, aby klienti rezervovali správné časy.", "Kalendář ukazuje vytížení za den, týden i měsíc."] }, es: { h1: "Timviz para peluqueros", lead: "Planifica cortes, coloraciones y servicios complejos sin solapamientos.", body: ["Configura duración y precio para que los clientes reserven el horario correcto.", "El calendario muestra la carga por día, semana y mes."] }, de: { h1: "Timviz für Friseure", lead: "Plane Schnitte, Farbe und komplexe Leistungen ohne Terminkonflikte.", body: ["Lege Dauer und Preise fest, damit Kunden passende Slots buchen.", "Der Kalender zeigt Auslastung nach Tag, Woche und Monat."] } },
  barbers: { fr: { h1: "Timviz pour barbiers", lead: "Contrôlez un flux dense de réservations et réduisez les appels.", body: ["Les clients réservent en ligne et vous voyez les vrais créneaux libres.", "La plateforme convient aux barbiers indépendants et barbershops."] }, pl: { h1: "Timviz dla barberów", lead: "Kontroluj gęsty strumień rezerwacji i ogranicz liczbę telefonów.", body: ["Klienci rezerwują online, a Ty widzisz realnie wolne terminy.", "Platforma pasuje do barberów solo i barbershopów."] }, cs: { h1: "Timviz pro barbery", lead: "Zvládněte hustý tok rezervací a omezte telefonáty.", body: ["Klienti rezervují online a vy vidíte skutečně volné časy.", "Platforma se hodí pro jednotlivé barbery i barbershopy."] }, es: { h1: "Timviz para barberos", lead: "Controla un alto flujo de reservas y reduce llamadas.", body: ["Los clientes reservan online y tú ves los horarios realmente libres.", "Funciona para barberos individuales y barberías."] }, de: { h1: "Timviz für Barber", lead: "Steuere hohe Buchungszahlen und reduziere Anrufe.", body: ["Kunden buchen online und du siehst echte freie Slots.", "Geeignet für einzelne Barber und Barbershops."] } },
  cosmetologists: { fr: { h1: "Timviz pour esthéticiennes", lead: "Planifiez les soins longs et évitez les conflits d’agenda.", body: ["Définissez durée et prix des soins pour une planification précise.", "Les clients réservent en ligne et vous voyez la charge à l’avance."] }, pl: { h1: "Timviz dla kosmetologów", lead: "Planuj długie zabiegi i unikaj nakładek w grafiku.", body: ["Ustaw czas i cenę zabiegów dla dokładnego planowania.", "Klienci rezerwują online, a Ty widzisz obłożenie z wyprzedzeniem."] }, cs: { h1: "Timviz pro kosmetology", lead: "Plánujte delší procedury a vyhněte se kolizím v rozvrhu.", body: ["Nastavte délku a cenu procedur pro přesné plánování.", "Klienti rezervují online a vy vidíte vytížení dopředu."] }, es: { h1: "Timviz para cosmetólogos", lead: "Planifica tratamientos largos y evita solapamientos.", body: ["Configura duración y precio para planificar con precisión.", "Los clientes reservan online y ves la carga con antelación."] }, de: { h1: "Timviz für Kosmetiker", lead: "Plane längere Behandlungen und vermeide Überschneidungen.", body: ["Lege Dauer und Preise für genaue Planung fest.", "Kunden buchen online und du siehst die Auslastung im Voraus."] } },
  massage: { fr: { h1: "Timviz pour masseurs", lead: "Gérez les séances courtes et longues dans un seul calendrier.", body: ["Définissez la durée de chaque séance et travaillez avec un planning clair.", "Les clients réservent les créneaux libres en ligne sans échanges inutiles."] }, pl: { h1: "Timviz dla masażystów", lead: "Zarządzaj krótkimi i długimi sesjami w jednym kalendarzu.", body: ["Ustaw czas każdej usługi i pracuj z przejrzystym grafikiem.", "Klienci rezerwują wolne terminy online bez zbędnych ustaleń."] }, cs: { h1: "Timviz pro maséry", lead: "Spravujte krátká i dlouhá sezení v jednom kalendáři.", body: ["Nastavte délku každé služby a pracujte s jasným rozvrhem.", "Klienti rezervují volné časy online bez zbytečné koordinace."] }, es: { h1: "Timviz para masajistas", lead: "Gestiona sesiones cortas y largas en un solo calendario.", body: ["Configura la duración de cada sesión y trabaja con una agenda clara.", "Los clientes reservan horarios libres online sin coordinación extra."] }, de: { h1: "Timviz für Masseure", lead: "Verwalte kurze und lange Sitzungen in einem Kalender.", body: ["Lege die Dauer jeder Sitzung fest und arbeite mit einem klaren Plan.", "Kunden buchen freie Zeiten online ohne unnötige Abstimmung."] } }
});

export const nicheSeo: Record<NicheKey, Record<SiteLanguage, SeoCopy>> = withNestedExtraLanguageFallbacks<NicheKey, SeoCopy>({
  manicure: {
    uk: { title: "Timviz для майстрів манікюру — онлайн-запис і календар", description: "Онлайн-запис для майстрів манікюру: календар, послуги, ціни та керування вільними вікнами в Timviz." },
    ru: { title: "Timviz для мастеров маникюра — онлайн-запись и календарь", description: "Онлайн-запись для мастеров маникюра: календарь, услуги, цены и управление свободными окнами в Timviz." },
    en: { title: "Timviz for nail technicians — online booking and calendar", description: "Online booking for nail technicians with service management, pricing and calendar planning in Timviz." }
  },
  hairdressers: {
    uk: { title: "Timviz для перукарів — онлайн-запис і розклад", description: "Онлайн-запис для перукарів: календар, послуги та керування завантаженням робочого дня." },
    ru: { title: "Timviz для парикмахеров — онлайн-запись и расписание", description: "Онлайн-запись для парикмахеров: календарь, услуги и управление загрузкой рабочего дня." },
    en: { title: "Timviz for hairdressers — online booking and schedule", description: "Online booking and schedule management for hairdressers with service setup in Timviz." }
  },
  barbers: {
    uk: { title: "Timviz для барберів — онлайн-запис барбершопу", description: "Платформа онлайн-запису для барберів і барбершопів: календар, послуги та клієнти в одному кабінеті." },
    ru: { title: "Timviz для барберов — онлайн-запись барбершопа", description: "Онлайн-запись для барберов и барбершопов: календарь, услуги и клиенты в одном кабинете." },
    en: { title: "Timviz for barbers — barbershop booking software", description: "Online booking and calendar management for barbers and barbershops in Timviz." }
  },
  cosmetologists: {
    uk: { title: "Timviz для косметологів — онлайн-запис і календар процедур", description: "Сервіс онлайн-запису для косметологів: графік процедур, ціни, послуги та керування завантаженням." },
    ru: { title: "Timviz для косметологов — онлайн-запись и календарь процедур", description: "Онлайн-запись для косметологов: график процедур, цены, услуги и управление загрузкой." },
    en: { title: "Timviz for cosmetologists — online booking for treatments", description: "Online booking and calendar planning for cosmetologists with structured treatment scheduling." }
  },
  massage: {
    uk: { title: "Timviz для масажистів — онлайн-запис і графік сесій", description: "Онлайн-запис для масажистів: гнучкий календар, послуги різної тривалості та керування розкладом." },
    ru: { title: "Timviz для массажистов — онлайн-запись и график сессий", description: "Онлайн-запись для массажистов: гибкий календарь, услуги разной длительности и управление расписанием." },
    en: { title: "Timviz for massage therapists — online booking and scheduling", description: "Online booking for massage therapists with flexible session durations and calendar management." }
  }
}, {
  manicure: { fr: { title: "Timviz pour prothésistes ongulaires — réservation en ligne", description: "Réservation en ligne pour prothésistes ongulaires avec agenda, services, prix et créneaux disponibles." }, pl: { title: "Timviz dla stylistek paznokci — rezerwacje online", description: "Rezerwacje online dla stylistek paznokci: kalendarz, usługi, ceny i wolne terminy." }, cs: { title: "Timviz pro nehtové specialisty — online rezervace", description: "Online rezervace pro nehtové specialisty: kalendář, služby, ceny a volné termíny." }, es: { title: "Timviz para especialistas en uñas — reservas online", description: "Reservas online para uñas con calendario, servicios, precios y horarios disponibles." }, de: { title: "Timviz für Nagelprofis — Online-Buchung", description: "Online-Buchung für Nagelprofis mit Kalender, Leistungen, Preisen und freien Zeiten." } },
  hairdressers: { fr: { title: "Timviz pour coiffeurs — réservation et agenda", description: "Réservation en ligne pour coiffeurs avec calendrier, services et gestion de la charge." }, pl: { title: "Timviz dla fryzjerów — rezerwacje i grafik", description: "Rezerwacje online dla fryzjerów z kalendarzem, usługami i kontrolą obłożenia." }, cs: { title: "Timviz pro kadeřníky — rezervace a rozvrh", description: "Online rezervace pro kadeřníky s kalendářem, službami a plánováním vytížení." }, es: { title: "Timviz para peluqueros — reservas y agenda", description: "Reservas online para peluquerías con calendario, servicios y gestión de carga." }, de: { title: "Timviz für Friseure — Buchung und Kalender", description: "Online-Buchung für Friseure mit Kalender, Leistungen und Auslastungsplanung." } },
  barbers: { fr: { title: "Timviz pour barbiers — logiciel de réservation", description: "Réservation en ligne pour barbiers et barbershops avec agenda, services et clients." }, pl: { title: "Timviz dla barberów — system rezerwacji", description: "Rezerwacje online dla barberów i barbershopów: kalendarz, usługi i klienci." }, cs: { title: "Timviz pro barbery — rezervační software", description: "Online rezervace pro barbery a barbershopy s kalendářem, službami a klienty." }, es: { title: "Timviz para barberos — software de reservas", description: "Reservas online para barberos y barberías con calendario, servicios y clientes." }, de: { title: "Timviz für Barber — Buchungssoftware", description: "Online-Buchung für Barber und Barbershops mit Kalender, Leistungen und Kunden." } },
  cosmetologists: { fr: { title: "Timviz pour esthéticiennes — réservations de soins", description: "Réservation en ligne pour soins esthétiques avec planning, prix, services et charge." }, pl: { title: "Timviz dla kosmetologów — rezerwacje zabiegów", description: "Rezerwacje online dla kosmetologów: harmonogram zabiegów, ceny, usługi i obłożenie." }, cs: { title: "Timviz pro kosmetology — rezervace procedur", description: "Online rezervace pro kosmetology: plán procedur, ceny, služby a vytížení." }, es: { title: "Timviz para cosmetólogos — reservas de tratamientos", description: "Reservas online para cosmetólogos con agenda de tratamientos, precios y servicios." }, de: { title: "Timviz für Kosmetiker — Behandlungsbuchung", description: "Online-Buchung für Kosmetiker mit Behandlungsplan, Preisen, Leistungen und Auslastung." } },
  massage: { fr: { title: "Timviz pour masseurs — réservation et planning", description: "Réservation en ligne pour masseurs avec calendrier flexible et séances de différentes durées." }, pl: { title: "Timviz dla masażystów — rezerwacje i grafik", description: "Rezerwacje online dla masażystów z elastycznym kalendarzem i różnymi długościami sesji." }, cs: { title: "Timviz pro maséry — rezervace a rozvrh", description: "Online rezervace pro maséry s flexibilním kalendářem a různými délkami sezení." }, es: { title: "Timviz para masajistas — reservas y agenda", description: "Reservas online para masajistas con calendario flexible y sesiones de distintas duraciones." }, de: { title: "Timviz für Masseure — Buchung und Planung", description: "Online-Buchung für Masseure mit flexiblem Kalender und Sitzungen unterschiedlicher Dauer." } }
});

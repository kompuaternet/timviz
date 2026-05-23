import type { SeoCopy } from "./seo";
import { getContentLanguage, type BaseSiteLanguage, type SiteLanguage } from "./site-language";

export type FeatureSlug =
  | "kalendar-zapisey"
  | "telegram-bot-dlya-zapisey"
  | "crm-dlya-salona"
  | "programma-dlya-zapisi-klientov";


type FeaturePage = {
  slug: FeatureSlug;
  copy: Record<BaseSiteLanguage, { h1: string; lead: string; body: string[] }>;
  seo: Record<BaseSiteLanguage, SeoCopy>;
};

type FeatureCopy = FeaturePage["copy"][BaseSiteLanguage];

const featureCopyTranslations: Partial<Record<FeatureSlug, Partial<Record<SiteLanguage, FeatureCopy>>>> = {
  "kalendar-zapisey": {
    fr: { h1: "Calendrier de réservations pour professionnels et salons", lead: "Timviz garde tous les rendez-vous dans un calendrier clair et évite les conflits d’horaires.", body: ["Le calendrier Timviz convient aux indépendants, studios et salons. Vous voyez les créneaux libres, les visites confirmées et la charge par jour, semaine et mois.", "Les services, durées et prix sont pris en compte avant la réservation pour garder un planning fiable."] },
    pl: { h1: "Kalendarz rezerwacji dla specjalistów i salonów", lead: "Timviz pokazuje wszystkie wizyty w jednym kalendarzu i pomaga uniknąć nakładek.", body: ["Kalendarz Timviz pasuje do specjalistów, studiów i salonów. Widzisz wolne terminy, potwierdzone wizyty i obłożenie dnia, tygodnia oraz miesiąca.", "Usługi, czas trwania i ceny są uwzględniane przed rezerwacją, więc grafik pozostaje dokładny."] },
    cs: { h1: "Rezervační kalendář pro profesionály a salony", lead: "Timviz drží všechny návštěvy v jednom kalendáři a pomáhá vyhnout se kolizím.", body: ["Kalendář Timviz je vhodný pro profesionály, studia i salony. Vidíte volné časy, potvrzené návštěvy a vytížení po dnech, týdnech i měsících.", "Služby, délky a ceny se zohlední před rezervací, takže rozvrh zůstává přesný."] },
    es: { h1: "Calendario de reservas para profesionales y salones", lead: "Timviz reúne todas las citas en un calendario y ayuda a evitar solapamientos.", body: ["El calendario Timviz sirve para profesionales, estudios y salones. Ves horarios libres, visitas confirmadas y carga por día, semana y mes.", "Servicios, duración y precios se tienen en cuenta antes de reservar para mantener una agenda precisa."] },
    de: { h1: "Buchungskalender für Profis und Salons", lead: "Timviz zeigt alle Termine in einem Kalender und hilft, Konflikte zu vermeiden.", body: ["Der Timviz-Kalender passt für Profis, Studios und Salons. Du siehst freie Zeiten, bestätigte Besuche und Auslastung nach Tag, Woche und Monat.", "Leistungen, Dauer und Preise werden vor der Buchung berücksichtigt, damit der Plan korrekt bleibt."] }
  },
  "telegram-bot-dlya-zapisey": {
    fr: { h1: "Notifications Telegram pour les réservations", lead: "Recevez les nouveaux rendez-vous et changements sans vérifier le tableau de bord.", body: ["Timviz envoie les événements importants dans Telegram pour réagir vite aux changements de planning.", "C’est pratique pour les professionnels occupés: moins de rendez-vous manqués et plus de contrôle."] },
    pl: { h1: "Powiadomienia Telegram o rezerwacjach", lead: "Otrzymuj nowe wizyty i zmiany bez ciągłego sprawdzania panelu.", body: ["Timviz wysyła ważne zdarzenia do Telegrama, aby szybko reagować na zmiany w grafiku.", "To wygodne przy intensywnej pracy: mniej pominiętych wizyt i więcej kontroli."] },
    cs: { h1: "Telegram upozornění na rezervace", lead: "Dostávejte nové návštěvy a změny bez neustálé kontroly panelu.", body: ["Timviz posílá klíčové události do Telegramu, abyste rychle reagovali na změny rozvrhu.", "Hodí se pro vytížené profesionály: méně zmeškaných návštěv a větší kontrola."] },
    es: { h1: "Notificaciones de Telegram para reservas", lead: "Recibe nuevas citas y cambios sin revisar el panel constantemente.", body: ["Timviz envía eventos clave a Telegram para reaccionar rápido a cambios de agenda.", "Es útil para profesionales ocupados: menos citas perdidas y más control."] },
    de: { h1: "Telegram-Benachrichtigungen für Buchungen", lead: "Erhalte neue Termine und Änderungen, ohne ständig das Dashboard zu prüfen.", body: ["Timviz sendet wichtige Ereignisse an Telegram, damit du schnell auf Planänderungen reagierst.", "Praktisch für volle Kalender: weniger verpasste Termine und mehr Kontrolle."] }
  },
  "crm-dlya-salona": {
    fr: { h1: "CRM pour salons et professionnels", lead: "Timviz combine réservation en ligne, calendrier clients et gestion des services.", body: ["Un CRM salon doit réunir rendez-vous, services, prix et charge de l’équipe. Timviz le fait sans déploiement complexe.", "Il convient aux indépendants comme aux salons avec plusieurs spécialistes."] },
    pl: { h1: "CRM dla salonów i specjalistów", lead: "Timviz łączy rezerwacje online, kalendarz klientów i zarządzanie usługami.", body: ["CRM salonu powinien łączyć wizyty, usługi, ceny i grafik zespołu. Timviz robi to bez skomplikowanego wdrożenia.", "Pasuje do pracy solo i salonów z kilkoma specjalistami."] },
    cs: { h1: "CRM pro salony a profesionály", lead: "Timviz spojuje online rezervace, klientský kalendář a správu služeb.", body: ["CRM pro salon má mít návštěvy, služby, ceny a týmové rozvrhy na jednom místě. Timviz to řeší bez složitého nasazení.", "Hodí se pro jednotlivce i salony s více specialisty."] },
    es: { h1: "CRM para salones y profesionales", lead: "Timviz combina reservas online, calendario de clientes y gestión de servicios.", body: ["Un CRM de salón debe reunir citas, servicios, precios y agenda del equipo. Timviz lo hace sin una implementación compleja.", "Sirve para profesionales individuales y salones con varios especialistas."] },
    de: { h1: "CRM für Salons und Profis", lead: "Timviz verbindet Online-Buchung, Kundenkalender und Leistungsverwaltung.", body: ["Ein Salon-CRM sollte Termine, Leistungen, Preise und Teamplanung bündeln. Timviz löst das ohne komplexe Einführung.", "Geeignet für Einzelprofis und Salons mit mehreren Spezialisten."] }
  },
  "programma-dlya-zapisi-klientov": {
    fr: { h1: "Logiciel de réservation client en ligne", lead: "Timviz est un service de réservation pour professionnels, salons et studios.", body: ["Timviz automatise les rendez-vous sans échanges interminables. Le client choisit service et heure, puis la visite apparaît dans le calendrier.", "Vous gérez services, prix, durées et horaires au même endroit."] },
    pl: { h1: "Program do rezerwacji klientów online", lead: "Timviz to system rezerwacji dla specjalistów, salonów i studiów.", body: ["Timviz automatyzuje umawianie wizyt bez długich rozmów. Klient wybiera usługę i termin, a wizyta trafia do kalendarza.", "Zarządzasz usługami, cenami, czasem trwania i grafikiem w jednym miejscu."] },
    cs: { h1: "Software pro online rezervace klientů", lead: "Timviz je rezervační systém pro profesionály, salony a studia.", body: ["Timviz automatizuje objednávání bez nekonečného psaní. Klient vybere službu a čas, návštěva se objeví v kalendáři.", "Služby, ceny, délky a pracovní dobu spravujete na jednom místě."] },
    es: { h1: "Software de reservas online para clientes", lead: "Timviz es una plataforma de reservas para profesionales, salones y estudios.", body: ["Timviz automatiza las citas sin mensajes interminables. El cliente elige servicio y hora, y la visita aparece en el calendario.", "Gestionas servicios, precios, duraciones y horarios en un solo lugar."] },
    de: { h1: "Software für Online-Kundenbuchungen", lead: "Timviz ist Buchungssoftware für Profis, Salons und Studios.", body: ["Timviz automatisiert Termine ohne endlose Nachrichten. Kunden wählen Leistung und Zeit, der Besuch erscheint im Kalender.", "Du verwaltest Leistungen, Preise, Dauer und Arbeitszeiten an einem Ort."] }
  }
};

const featureSeoTranslations: Partial<Record<FeatureSlug, Partial<Record<SiteLanguage, SeoCopy>>>> = {
  "kalendar-zapisey": {
    fr: { title: "Calendrier de réservations pour salons — Timviz", description: "Calendrier de rendez-vous pour professionnels et salons avec réservation en ligne, services et planning.", keywords: ["calendrier de réservation", "agenda de rendez-vous", "réservation en ligne", "Timviz"] },
    pl: { title: "Kalendarz rezerwacji dla salonów — Timviz", description: "Kalendarz wizyt dla specjalistów i salonów: rezerwacje online, usługi i grafik w Timviz.", keywords: ["kalendarz rezerwacji", "kalendarz wizyt", "rezerwacje online", "Timviz"] },
    cs: { title: "Rezervační kalendář pro salony — Timviz", description: "Kalendář návštěv pro profesionály a salony: online rezervace, služby a rozvrh v Timviz.", keywords: ["rezervační kalendář", "kalendář návštěv", "online rezervace", "Timviz"] },
    es: { title: "Calendario de reservas para salones — Timviz", description: "Calendario de citas para profesionales y salones con reservas online, servicios y horarios.", keywords: ["calendario de reservas", "agenda de citas", "reservas online", "Timviz"] },
    de: { title: "Buchungskalender für Salons — Timviz", description: "Terminkalender für Profis und Salons mit Online-Buchung, Leistungen und Planung.", keywords: ["Buchungskalender", "Terminkalender", "Online-Buchung", "Timviz"] }
  },
  "telegram-bot-dlya-zapisey": {
    fr: { title: "Notifications Telegram de réservation — Timviz", description: "Recevez dans Telegram les nouvelles réservations, changements et confirmations Timviz.", keywords: ["notifications Telegram", "réservations", "Timviz"] },
    pl: { title: "Powiadomienia Telegram o rezerwacjach — Timviz", description: "Otrzymuj w Telegramie nowe rezerwacje, zmiany i potwierdzenia z Timviz.", keywords: ["powiadomienia Telegram", "rezerwacje", "Timviz"] },
    cs: { title: "Telegram upozornění na rezervace — Timviz", description: "Dostávejte do Telegramu nové rezervace, změny a potvrzení z Timviz.", keywords: ["Telegram upozornění", "rezervace", "Timviz"] },
    es: { title: "Notificaciones Telegram de reservas — Timviz", description: "Recibe en Telegram nuevas reservas, cambios y confirmaciones de Timviz.", keywords: ["notificaciones Telegram", "reservas", "Timviz"] },
    de: { title: "Telegram-Benachrichtigungen für Buchungen — Timviz", description: "Erhalte neue Buchungen, Änderungen und Bestätigungen aus Timviz in Telegram.", keywords: ["Telegram Benachrichtigungen", "Buchungen", "Timviz"] }
  },
  "crm-dlya-salona": {
    fr: { title: "CRM salon avec réservation en ligne — Timviz", description: "CRM pour salons: réservations en ligne, calendrier, services et prix dans Timviz.", keywords: ["CRM salon", "réservation salon", "Timviz"] },
    pl: { title: "CRM dla salonu z rezerwacjami online — Timviz", description: "CRM dla salonów: rezerwacje online, kalendarz, usługi i ceny w Timviz.", keywords: ["CRM salon", "rezerwacje salonu", "Timviz"] },
    cs: { title: "CRM pro salon s online rezervacemi — Timviz", description: "CRM pro salony: online rezervace, kalendář, služby a ceny v Timviz.", keywords: ["CRM salon", "rezervace salonu", "Timviz"] },
    es: { title: "CRM para salones con reservas online — Timviz", description: "CRM para salones: reservas online, calendario, servicios y precios en Timviz.", keywords: ["CRM salón", "reservas salón", "Timviz"] },
    de: { title: "Salon-CRM mit Online-Buchung — Timviz", description: "CRM für Salons: Online-Buchungen, Kalender, Leistungen und Preise in Timviz.", keywords: ["Salon CRM", "Salon Buchung", "Timviz"] }
  },
  "programma-dlya-zapisi-klientov": {
    fr: { title: "Logiciel de réservation client — Timviz", description: "Logiciel de réservation en ligne avec calendrier, services, prix et notifications Telegram.", keywords: ["logiciel de réservation", "réservation client", "Timviz"] },
    pl: { title: "Program do rezerwacji klientów — Timviz", description: "System rezerwacji online z kalendarzem, usługami, cenami i powiadomieniami Telegram.", keywords: ["program do rezerwacji", "rezerwacje klientów", "Timviz"] },
    cs: { title: "Software pro rezervace klientů — Timviz", description: "Online rezervační software s kalendářem, službami, cenami a Telegram upozorněními.", keywords: ["rezervační software", "rezervace klientů", "Timviz"] },
    es: { title: "Software de reservas para clientes — Timviz", description: "Software de reservas online con calendario, servicios, precios y notificaciones Telegram.", keywords: ["software de reservas", "reservas de clientes", "Timviz"] },
    de: { title: "Software für Kundenbuchungen — Timviz", description: "Online-Buchungssoftware mit Kalender, Leistungen, Preisen und Telegram-Benachrichtigungen.", keywords: ["Buchungssoftware", "Kundenbuchungen", "Timviz"] }
  }
};

export const forBusinessFeaturePages: FeaturePage[] = [
  {
    slug: "kalendar-zapisey",
    copy: {
      ru: {
        h1: "Календарь записей для мастеров и салонов",
        lead: "Timviz показывает все визиты в одном календаре и помогает планировать день без накладок.",
        body: [
          "Календарь записей в Timviz подходит для мастеров, студий и салонов. Вы видите свободные окна, подтвержденные визиты и загрузку по дням, неделям и месяцам.",
          "Это удобный формат для записи клиентов онлайн: услуги, длительность и стоимость заранее учитываются, поэтому в расписании меньше ошибок."
        ]
      },
      uk: {
        h1: "Календар записів для майстрів і салонів",
        lead: "Timviz показує всі візити в одному календарі та допомагає планувати день без накладок.",
        body: [
          "Календар записів у Timviz підходить для майстрів, студій і салонів. Ви бачите вільні вікна, підтверджені візити та завантаження по днях, тижнях і місяцях.",
          "Це зручний формат для онлайн-запису клієнтів: послуги, тривалість і вартість враховуються заздалегідь, тому в розкладі менше помилок."
        ]
      },
      en: {
        h1: "Booking calendar for professionals and salons",
        lead: "Timviz keeps all appointments in one calendar and helps teams avoid schedule conflicts.",
        body: [
          "Timviz booking calendar is built for professionals, studios and salons. You can track available slots, confirmed visits and workload across day, week and month views.",
          "It supports online client booking with service duration and pricing rules, so your schedule stays accurate."
        ]
      }
    },
    seo: {
      ru: { title: "Календарь записей для мастеров — Timviz", description: "Календарь записей для мастеров и салонов: онлайн-запись клиентов, услуги и график в одном кабинете Timviz.", keywords: ["календарь записей", "календарь для записи клиентов", "запись клиентов онлайн", "Timviz"] },
      uk: { title: "Календар записів для майстрів — Timviz", description: "Календар записів для майстрів і салонів: онлайн-запис клієнтів, послуги та графік у Timviz.", keywords: ["календар записів", "календар для запису клієнтів", "онлайн-запис клієнтів", "Timviz"] },
      en: { title: "Booking calendar for service businesses — Timviz", description: "Manage online appointments with a structured booking calendar for professionals and salons.", keywords: ["booking calendar", "appointment schedule", "online client booking", "Timviz"] }
    }
  },
  {
    slug: "telegram-bot-dlya-zapisey",
    copy: {
      ru: {
        h1: "Telegram-уведомления о записях",
        lead: "Получайте уведомления о новых визитах и изменениях без постоянной проверки кабинета.",
        body: [
          "Timviz помогает быстро реагировать на изменения в расписании: уведомления о записи клиентов онлайн и обновлениях приходят в Telegram.",
          "Это удобно для мастеров с плотным графиком: меньше пропущенных визитов и больше контроля над календарем записей."
        ]
      },
      uk: {
        h1: "Telegram-сповіщення про записи",
        lead: "Отримуйте сповіщення про нові візити та зміни без постійної перевірки кабінету.",
        body: [
          "Timviz допомагає швидко реагувати на зміни в розкладі: сповіщення про онлайн-запис клієнтів і оновлення приходять у Telegram.",
          "Це зручно для майстрів із щільним графіком: менше пропущених візитів і більше контролю над календарем записів."
        ]
      },
      en: {
        h1: "Telegram notifications for bookings",
        lead: "Receive booking updates instantly without constantly checking your dashboard.",
        body: [
          "Timviz sends key appointment events to Telegram so professionals can react quickly to schedule changes.",
          "This improves calendar visibility and reduces missed updates for busy service teams."
        ]
      }
    },
    seo: {
      ru: { title: "Telegram-уведомления о записях клиентов — Timviz", description: "Подключите Telegram-уведомления о новых записях, изменениях и подтверждениях в Timviz.", keywords: ["telegram уведомления о записях", "запись клиентов онлайн", "календарь записей", "Timviz"] },
      uk: { title: "Telegram-сповіщення про записи клієнтів — Timviz", description: "Підключіть Telegram-сповіщення про нові записи, зміни й підтвердження в Timviz.", keywords: ["telegram сповіщення про записи", "онлайн-запис клієнтів", "календар записів", "Timviz"] },
      en: { title: "Telegram booking notifications — Timviz", description: "Get Telegram notifications about new bookings and schedule updates in Timviz.", keywords: ["telegram booking alerts", "appointment notifications", "Timviz"] }
    }
  },
  {
    slug: "crm-dlya-salona",
    copy: {
      ru: {
        h1: "CRM для салона и мастеров",
        lead: "Timviz объединяет онлайн-запись, календарь клиентов и управление услугами в одном кабинете.",
        body: [
          "CRM для салона нужна, чтобы видеть записи клиентов, услуги, цены и расписание команды в одном месте. Timviz закрывает эту задачу без сложного внедрения.",
          "Сервис подходит как для одного мастера, так и для салона с несколькими специалистами."
        ]
      },
      uk: {
        h1: "CRM для салону і майстрів",
        lead: "Timviz об'єднує онлайн-запис, календар клієнтів і керування послугами в одному кабінеті.",
        body: [
          "CRM для салону потрібна, щоб бачити записи клієнтів, послуги, ціни й графік команди в одному місці. Timviz вирішує це без складного впровадження.",
          "Сервіс підходить як для одного майстра, так і для салону з кількома спеціалістами."
        ]
      },
      en: {
        h1: "CRM for salons and professionals",
        lead: "Timviz combines online booking, client schedule and service management in one workspace.",
        body: [
          "A salon CRM should keep appointments, services, pricing and team workload in one place. Timviz is built exactly for this use case.",
          "It fits both solo professionals and multi-staff salons with growing booking volume."
        ]
      }
    },
    seo: {
      ru: { title: "CRM для салона — онлайн-запись и календарь | Timviz", description: "CRM для салона: запись клиентов онлайн, календарь мастеров, услуги и цены в одном сервисе Timviz.", keywords: ["crm для салона", "онлайн-запись для салона", "программа для записи клиентов", "Timviz"] },
      uk: { title: "CRM для салону — онлайн-запис і календар | Timviz", description: "CRM для салону: онлайн-запис клієнтів, календар майстрів, послуги й ціни в одному сервісі Timviz.", keywords: ["crm для салону", "онлайн-запис для салону", "програма для запису клієнтів", "Timviz"] },
      en: { title: "Salon CRM with online booking — Timviz", description: "Salon CRM platform with online appointments, service pricing and calendar management.", keywords: ["salon crm", "online booking crm", "Timviz"] }
    }
  },
  {
    slug: "programma-dlya-zapisi-klientov",
    copy: {
      ru: {
        h1: "Программа для записи клиентов онлайн",
        lead: "Timviz — сервис онлайн-записи для мастеров, салонов и студий с удобным календарем.",
        body: [
          "Если нужна программа для записи клиентов, Timviz помогает автоматизировать запись без бесконечных переписок. Клиент выбирает услугу и время, а визит сразу появляется в календаре.",
          "Вы управляете услугами, ценами, длительностью процедур и графиком работы мастера в одном месте."
        ]
      },
      uk: {
        h1: "Програма для запису клієнтів онлайн",
        lead: "Timviz — сервіс онлайн-запису для майстрів, салонів і студій зі зручним календарем.",
        body: [
          "Якщо потрібна програма для запису клієнтів, Timviz допоможе автоматизувати запис без нескінченних переписок. Клієнт обирає послугу й час, а візит одразу з'являється в календарі.",
          "Ви керуєте послугами, цінами, тривалістю процедур і графіком роботи майстра в одному місці."
        ]
      },
      en: {
        h1: "Client booking software for service businesses",
        lead: "Timviz is online booking software for professionals, salons and studios.",
        body: [
          "If you need client booking software, Timviz helps automate appointments without manual back-and-forth messaging.",
          "You can manage services, pricing, durations and working schedule in one dashboard."
        ]
      }
    },
    seo: {
      ru: { title: "Программа для записи клиентов — Timviz", description: "Программа для записи клиентов онлайн: календарь записей, услуги, цены и Telegram-уведомления в Timviz.", keywords: ["программа для записи клиентов", "сервис онлайн-записи", "онлайн-запись клиентов", "Timviz"] },
      uk: { title: "Програма для запису клієнтів — Timviz", description: "Програма для онлайн-запису клієнтів: календар записів, послуги, ціни та Telegram-сповіщення у Timviz.", keywords: ["програма для запису клієнтів", "сервіс онлайн-запису", "онлайн-запис клієнтів", "Timviz"] },
      en: { title: "Client booking software — Timviz", description: "Online client booking software with service calendar and pricing management.", keywords: ["client booking software", "online appointment platform", "Timviz"] }
    }
  }
];

export const forBusinessFeatureBySlug = Object.fromEntries(
  forBusinessFeaturePages.map((page) => [page.slug, page])
) as Record<FeatureSlug, FeaturePage>;

export function getFeaturePageCopy(page: FeaturePage, language: SiteLanguage) {
  return featureCopyTranslations[page.slug]?.[language] ?? page.copy[getContentLanguage(language)];
}

export function getFeaturePageSeo(page: FeaturePage, language: SiteLanguage) {
  return featureSeoTranslations[page.slug]?.[language] ?? page.seo[getContentLanguage(language)];
}

export function isFeatureSlug(value: string): value is FeatureSlug {
  return value in forBusinessFeatureBySlug;
}

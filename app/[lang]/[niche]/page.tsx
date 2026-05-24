import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import BusinessIcon from "../../BusinessIcon";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import {
  getAllNicheParams,
  getNicheKeyBySlug,
  getNicheSlug,
  nicheCards,
  nicheContent,
  nicheKeys,
  nicheSeo,
  type NicheKey
} from "../../../lib/niche-pages";
import {
  forBusinessFeatureBySlug,
  forBusinessFeaturePages,
  getFeaturePageCopy,
  getFeaturePageSeo,
  isFeatureSlug
} from "../../../lib/for-business-seo-pages";
import { buildMetadata } from "../../../lib/seo";
import {
  getLocalizedPath,
  isSiteLanguage,
  publicFooterLabels,
  siteLanguages,
  type SiteLanguage,
  withEnglishFallback,
  withNestedExtraLanguageFallbacks
} from "../../../lib/site-language";
import { siteUrl } from "../../../lib/seo";

type LocalizedSeoPageProps = {
  params: Promise<{ lang: string; niche: string }>;
};

const pageCopy = withEnglishFallback<Record<string, string>>({
  ru: {
    home: "Главная",
    forBusiness: "Бизнесу",
    ctaTitle: "Запустите онлайн-запись с Timviz",
    ctaText: "Создайте профиль, добавьте услуги и принимайте записи без хаоса в мессенджерах.",
    ctaButton: "Создать профиль компании",
    otherTitle: "Другие направления",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами"
  },
  uk: {
    home: "Головна",
    forBusiness: "Бізнесу",
    ctaTitle: "Запустіть онлайн-запис із Timviz",
    ctaText: "Створіть профіль, додайте послуги й приймайте записи без хаосу в месенджерах.",
    ctaButton: "Створити профіль компанії",
    otherTitle: "Інші напрямки",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    ctaTitle: "Launch online booking with Timviz",
    ctaText: "Create your profile, add services and accept bookings with less manual admin.",
    ctaButton: "Create company profile",
    otherTitle: "Other directions",
    privacy: "Privacy policy",
    terms: "Terms of use",
    footerText: "Timviz for business · online client booking and service management"
  }
}) satisfies Record<SiteLanguage, Record<string, string>>;

Object.assign(pageCopy, {
  fr: {
    home: "Accueil",
    forBusiness: "Pour les pros",
    ctaTitle: "Lancez la réservation en ligne avec Timviz",
    ctaText: "Créez votre profil, ajoutez vos services et acceptez les réservations avec moins d'administration manuelle.",
    ctaButton: "Créer un profil d'entreprise",
    otherTitle: "Autres secteurs",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    footerText: "Timviz pour les pros · réservation client en ligne et gestion des services"
  },
  pl: {
    home: "Strona główna",
    forBusiness: "Dla firm",
    ctaTitle: "Uruchom rezerwacje online z Timviz",
    ctaText: "Utwórz profil, dodaj usługi i przyjmuj rezerwacje bez chaosu w komunikatorach.",
    ctaButton: "Utwórz profil firmy",
    otherTitle: "Inne branże",
    privacy: "Polityka prywatności",
    terms: "Warunki korzystania",
    footerText: "Timviz dla firm · rezerwacje klientów online i zarządzanie usługami"
  },
  cs: {
    home: "Domů",
    forBusiness: "Pro firmy",
    ctaTitle: "Spusťte online rezervace s Timviz",
    ctaText: "Vytvořte profil, přidejte služby a přijímejte rezervace bez chaosu ve zprávách.",
    ctaButton: "Vytvořit profil firmy",
    otherTitle: "Další obory",
    privacy: "Zásady ochrany osobních údajů",
    terms: "Podmínky použití",
    footerText: "Timviz pro firmy · online rezervace klientů a správa služeb"
  },
  es: {
    home: "Inicio",
    forBusiness: "Para empresas",
    ctaTitle: "Activa las reservas online con Timviz",
    ctaText: "Crea tu perfil, añade servicios y recibe reservas con menos gestión manual.",
    ctaButton: "Crear perfil de empresa",
    otherTitle: "Otros sectores",
    privacy: "Política de privacidad",
    terms: "Condiciones de uso",
    footerText: "Timviz para empresas · reservas online y gestión de servicios"
  },
  de: {
    home: "Startseite",
    forBusiness: "Für Unternehmen",
    ctaTitle: "Starten Sie Online-Buchungen mit Timviz",
    ctaText: "Erstellen Sie Ihr Profil, fügen Sie Leistungen hinzu und nehmen Sie Buchungen ohne Nachrichtenchaos an.",
    ctaButton: "Unternehmensprofil erstellen",
    otherTitle: "Weitere Bereiche",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    footerText: "Timviz für Unternehmen · Online-Kundenbuchung und Leistungsverwaltung"
  }
});

type RichInfoCard = {
  title: string;
  text: string;
};

type RichNicheChrome = {
  ctaHint: string;
  sampleClient: string;
  sampleStatus: string;
  problemsTitle: string;
  problems: RichInfoCard[];
  solutionTitle: string;
  solutionText: string;
  solutionCards: RichInfoCard[];
  valueTitle: string;
  valueItems: string[];
  servicesTitle: string;
  servicesText: string;
  calendarTitle: string;
  calendarText: string;
  calendarItems: string[];
  howTitle: string;
  howText: string[];
  howSteps: string[];
  compareTitle: string;
  compareLeftTitle: string;
  compareRightTitle: string;
  compareLeft: string[];
  compareRight: string[];
  telegramTitle: string;
  telegramText: string;
  dayTitle: string;
  trustTitle: string;
  trustCards: RichInfoCard[];
  seoBlockTitle: string;
  faqTitle: string;
  finalTitle: string;
  finalText: string;
  finalMicrocopy: string;
  screenshotAltCalendar: string;
  screenshotAltServices: string;
  screenshotAltTelegram: string;
};

type NicheServiceDetails = {
  sampleService: string;
  services: string[];
  serviceSample: string;
  fitItems: string[];
  fitSample: string;
  dayItems: string[];
};

const richChrome = withEnglishFallback<RichNicheChrome>({
  ru: {
    ctaHint: "Без сайта • без сложных настроек • бесплатный старт",
    sampleClient: "Клиент: Анна К.",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо специалисту?",
    problems: [
      { title: "Заявки в разных мессенджерах", text: "Клиенты пишут в Instagram, Telegram и Viber, а записи легко теряются в переписках." },
      { title: "Сложно быстро найти свободное время", text: "Без единого календаря приходится вручную сверять график и длительность услуг." },
      { title: "Накладки и пустые окна", text: "Короткие и длинные процедуры перемешиваются, из-за чего день становится нервным и непредсказуемым." },
      { title: "Клиенты ждут ответа", text: "Пока специалист занят услугой, новый клиент может уйти к тому, у кого запись доступна сразу." },
      { title: "Нет понятной страницы записи", text: "Без публичной ссылки приходится каждый раз объяснять услуги, цены и свободные часы." },
      { title: "Сложно удерживать повторные визиты", text: "Когда расписание не структурировано, труднее быстро предложить клиенту удобный следующий слот." }
    ],
    solutionTitle: "Timviz наводит порядок в записях",
    solutionText: "Клиенты выбирают услугу и свободное время онлайн, а специалист видит записи, длительность, статусы и изменения в одном рабочем кабинете.",
    solutionCards: [
      { title: "Онлайн-запись 24/7", text: "Клиент бронирует время без звонков и ожидания ответа." },
      { title: "Календарь с длительностью", text: "Система учитывает продолжительность услуги и помогает избежать накладок." },
      { title: "Услуги и цены", text: "Публичная страница показывает понятный список услуг перед записью." },
      { title: "Рабочие дни и окна", text: "Вы контролируете доступные часы, выходные и загрузку дня." },
      { title: "Telegram-уведомления", text: "Новые заявки и изменения приходят сразу в Telegram." },
      { title: "Ссылка для клиентов", text: "Одну страницу можно отправлять в соцсети, мессенджеры и профиль." }
    ],
    valueTitle: "Что это дает бизнесу",
    valueItems: ["меньше ручных переписок", "больше подтвержденных записей", "понятный график дня", "быстрый старт без сайта"],
    servicesTitle: "Настройте услуги за несколько минут",
    servicesText: "Добавьте услуги, длительность и цену, чтобы клиент сразу понимал, что бронирует и сколько времени займет визит.",
    calendarTitle: "Календарь записей для ежедневной работы",
    calendarText: "В календаре видно все визиты, свободные окна, длительность процедур и загрузку дня. Это помогает планировать работу без хаоса.",
    calendarItems: ["дневной календарь", "недельный график", "свободные окна", "статусы записей", "повторные визиты"],
    howTitle: "Как работает онлайн-запись",
    howText: ["Вы создаете профиль, добавляете услуги и рабочее время.", "Клиент открывает ссылку, выбирает услугу и отправляет заявку в свободный слот."],
    howSteps: ["Создайте профиль", "Добавьте услуги", "Настройте график", "Принимайте записи онлайн"],
    compareTitle: "Без Timviz и с Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "С Timviz",
    compareLeft: ["записи в разных чатах", "ручной поиск свободного времени", "клиенты ждут ответа", "легко перепутать длительность"],
    compareRight: ["запись клиентов онлайн", "календарь с доступным временем", "услуги с длительностью и ценой", "уведомления в Telegram"],
    telegramTitle: "Новые записи — сразу в Telegram",
    telegramText: "Подключите Telegram-бот Timviz, чтобы получать новые заявки, переносы и отмены без постоянной проверки чатов.",
    dayTitle: "Пример рабочего дня",
    trustTitle: "Почему специалисты выбирают Timviz",
    trustCards: [
      { title: "Быстрый запуск", text: "Профиль, услуги и график можно настроить за несколько минут." },
      { title: "Меньше администрирования", text: "Онлайн-запись сокращает одинаковые сообщения и ручные уточнения." },
      { title: "Лучше клиентский путь", text: "Клиент видит услуги, время и понятную кнопку записи." }
    ],
    seoBlockTitle: "SEO-страница для онлайн-записи",
    faqTitle: "FAQ",
    finalTitle: "Запустите онлайн-запись с Timviz",
    finalText: "Создайте профиль, добавьте услуги и начните принимать записи без хаоса в переписках.",
    finalMicrocopy: "Это займет несколько минут",
    screenshotAltCalendar: "Календарь записей Timviz",
    screenshotAltServices: "Услуги и длительность в Timviz",
    screenshotAltTelegram: "Telegram-уведомления Timviz"
  },
  uk: {
    ctaHint: "Без сайту • без складних налаштувань • безкоштовний старт",
    sampleClient: "Клієнт: Анна К.",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо спеціалісту?",
    problems: [
      { title: "Заявки в різних месенджерах", text: "Клієнти пишуть в Instagram, Telegram і Viber, а записи легко губляться в переписках." },
      { title: "Складно швидко знайти вільний час", text: "Без єдиного календаря доводиться вручну звіряти графік і тривалість послуг." },
      { title: "Накладки й порожні вікна", text: "Короткі та довгі процедури змішуються, і день стає нервовим та непередбачуваним." },
      { title: "Клієнти чекають відповіді", text: "Поки спеціаліст зайнятий послугою, новий клієнт може піти туди, де запис доступний одразу." },
      { title: "Немає зрозумілої сторінки запису", text: "Без публічного посилання доводиться щоразу пояснювати послуги, ціни й вільні години." },
      { title: "Важче утримувати повторні візити", text: "Коли розклад не структурований, складніше швидко запропонувати клієнту наступний зручний слот." }
    ],
    solutionTitle: "Timviz наводить порядок у записах",
    solutionText: "Клієнти обирають послугу й вільний час онлайн, а спеціаліст бачить записи, тривалість, статуси та зміни в одному кабінеті.",
    solutionCards: [
      { title: "Онлайн-запис 24/7", text: "Клієнт бронює час без дзвінків і очікування відповіді." },
      { title: "Календар із тривалістю", text: "Система враховує тривалість послуги й допомагає уникати накладок." },
      { title: "Послуги та ціни", text: "Публічна сторінка показує зрозумілий список послуг перед записом." },
      { title: "Робочі дні та вікна", text: "Ви контролюєте доступні години, вихідні та завантаження дня." },
      { title: "Telegram-сповіщення", text: "Нові заявки та зміни приходять одразу в Telegram." },
      { title: "Посилання для клієнтів", text: "Одну сторінку можна додати в соцмережі, месенджери та профіль." }
    ],
    valueTitle: "Що це дає бізнесу",
    valueItems: ["менше ручних переписок", "більше підтверджених записів", "зрозумілий графік дня", "швидкий старт без сайту"],
    servicesTitle: "Налаштуйте послуги за кілька хвилин",
    servicesText: "Додайте послуги, тривалість і ціну, щоб клієнт одразу розумів, що бронює і скільки триватиме візит.",
    calendarTitle: "Календар записів для щоденної роботи",
    calendarText: "У календарі видно всі візити, вільні вікна, тривалість процедур і завантаження дня. Це допомагає планувати роботу без хаосу.",
    calendarItems: ["денний календар", "тижневий графік", "вільні вікна", "статуси записів", "повторні візити"],
    howTitle: "Як працює онлайн-запис",
    howText: ["Ви створюєте профіль, додаєте послуги й робочий час.", "Клієнт відкриває посилання, обирає послугу й надсилає заявку у вільний слот."],
    howSteps: ["Створіть профіль", "Додайте послуги", "Налаштуйте графік", "Приймайте записи онлайн"],
    compareTitle: "Без Timviz і з Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "З Timviz",
    compareLeft: ["записи в різних чатах", "ручний пошук вільного часу", "клієнти чекають відповіді", "легко переплутати тривалість"],
    compareRight: ["запис клієнтів онлайн", "календар із доступним часом", "послуги з тривалістю і ціною", "сповіщення в Telegram"],
    telegramTitle: "Нові записи — одразу в Telegram",
    telegramText: "Підключіть Telegram-бот Timviz, щоб отримувати нові заявки, перенесення й скасування без постійної перевірки чатів.",
    dayTitle: "Приклад робочого дня",
    trustTitle: "Чому спеціалісти обирають Timviz",
    trustCards: [
      { title: "Швидкий запуск", text: "Профіль, послуги й графік можна налаштувати за кілька хвилин." },
      { title: "Менше адміністрування", text: "Онлайн-запис скорочує однакові повідомлення й ручні уточнення." },
      { title: "Кращий шлях клієнта", text: "Клієнт бачить послуги, час і зрозумілу кнопку запису." }
    ],
    seoBlockTitle: "SEO-сторінка для онлайн-запису",
    faqTitle: "FAQ",
    finalTitle: "Запустіть онлайн-запис із Timviz",
    finalText: "Створіть профіль, додайте послуги й почніть приймати записи без хаосу в переписках.",
    finalMicrocopy: "Це займе кілька хвилин",
    screenshotAltCalendar: "Календар записів Timviz",
    screenshotAltServices: "Послуги та тривалість у Timviz",
    screenshotAltTelegram: "Telegram-сповіщення Timviz"
  },
  en: {
    ctaHint: "No website needed • no complex setup • free start",
    sampleClient: "Client: Anna K.",
    sampleStatus: "Status: Confirmed",
    problemsTitle: "Does this sound familiar?",
    problems: [
      { title: "Requests across different messengers", text: "Clients write in Instagram, Telegram and Viber, so bookings are easy to lose in chats." },
      { title: "Hard to find available time quickly", text: "Without one calendar, schedule and service duration must be checked manually." },
      { title: "Overlaps and idle gaps", text: "Short and long procedures mix together, making the day stressful and unpredictable." },
      { title: "Clients wait for replies", text: "While the professional is busy, a new client may choose someone with instant booking." },
      { title: "No clear booking page", text: "Without a public link, services, prices and available hours must be explained repeatedly." },
      { title: "Harder repeat visits", text: "When the schedule is not structured, it is harder to offer a client the next convenient slot." }
    ],
    solutionTitle: "Timviz brings order to bookings",
    solutionText: "Clients choose a service and available time online, while the professional sees bookings, duration, statuses and changes in one workspace.",
    solutionCards: [
      { title: "24/7 online booking", text: "Clients book time without calls or waiting for a reply." },
      { title: "Duration-aware calendar", text: "The system respects service duration and helps prevent overlaps." },
      { title: "Services and prices", text: "The public page shows a clear service list before booking." },
      { title: "Working hours and slots", text: "You control available hours, days off and daily workload." },
      { title: "Telegram notifications", text: "New requests and changes arrive instantly in Telegram." },
      { title: "Client booking link", text: "One page can be shared in social profiles, messengers and bios." }
    ],
    valueTitle: "What it gives your business",
    valueItems: ["less manual messaging", "more confirmed bookings", "clear daily schedule", "fast launch without a website"],
    servicesTitle: "Set up services in minutes",
    servicesText: "Add services, duration and price so clients understand what they book and how long the visit takes.",
    calendarTitle: "Booking calendar for daily work",
    calendarText: "The calendar shows every visit, open slots, procedure duration and daily workload. It helps plan work without chaos.",
    calendarItems: ["daily calendar", "weekly schedule", "free slots", "booking statuses", "repeat visits"],
    howTitle: "How online booking works",
    howText: ["Create a profile, add services and working hours.", "The client opens your link, chooses a service and sends a request into an available slot."],
    howSteps: ["Create a profile", "Add services", "Set your schedule", "Accept bookings online"],
    compareTitle: "Without Timviz vs with Timviz",
    compareLeftTitle: "Without Timviz",
    compareRightTitle: "With Timviz",
    compareLeft: ["bookings in different chats", "manual search for free time", "clients waiting for a reply", "easy to mix up duration"],
    compareRight: ["online client booking", "calendar with available time", "services with duration and price", "Telegram notifications"],
    telegramTitle: "New bookings directly in Telegram",
    telegramText: "Connect the Timviz Telegram bot to receive new requests, reschedules and cancellations without checking chats constantly.",
    dayTitle: "Example workday",
    trustTitle: "Why professionals choose Timviz",
    trustCards: [
      { title: "Fast launch", text: "Profile, services and schedule can be configured in minutes." },
      { title: "Less admin", text: "Online booking reduces repeated messages and manual clarifications." },
      { title: "Better client journey", text: "Clients see services, time and a clear booking button." }
    ],
    seoBlockTitle: "SEO landing page for online booking",
    faqTitle: "FAQ",
    finalTitle: "Launch online booking with Timviz",
    finalText: "Create a profile, add services and start accepting bookings without chat chaos.",
    finalMicrocopy: "It takes just a few minutes",
    screenshotAltCalendar: "Timviz booking calendar",
    screenshotAltServices: "Services and duration in Timviz",
    screenshotAltTelegram: "Timviz Telegram notifications"
  }
});

Object.assign(richChrome, {
  fr: {
    ctaHint: "Sans site web • sans configuration complexe • démarrage gratuit",
    sampleClient: "Cliente : Anna K.",
    sampleStatus: "Statut : confirmé",
    problemsTitle: "Cela vous parle ?",
    problems: [
      { title: "Demandes dans plusieurs messageries", text: "Les clients écrivent sur Instagram, Telegram et Viber, et les réservations se perdent facilement." },
      { title: "Difficile de trouver vite un créneau", text: "Sans calendrier unique, il faut vérifier manuellement le planning et la durée des services." },
      { title: "Chevauchements et créneaux vides", text: "Les services courts et longs se mélangent, ce qui rend la journée moins prévisible." },
      { title: "Les clients attendent une réponse", text: "Pendant que vous travaillez, un nouveau client peut partir vers une réservation disponible immédiatement." },
      { title: "Pas de page de réservation claire", text: "Sans lien public, il faut répéter les services, prix et horaires disponibles." },
      { title: "Moins de visites répétées", text: "Quand le planning n’est pas structuré, il est plus difficile de proposer le prochain bon créneau." }
    ],
    solutionTitle: "Timviz structure les réservations",
    solutionText: "Les clients choisissent un service et un créneau en ligne, tandis que vous voyez les réservations, durées, statuts et changements dans un seul espace.",
    solutionCards: [
      { title: "Réservation en ligne 24/7", text: "Les clients réservent sans appels ni attente de réponse." },
      { title: "Calendrier avec durées", text: "Le système respecte la durée du service et évite les chevauchements." },
      { title: "Services et prix", text: "La page publique présente une liste de services claire avant la réservation." },
      { title: "Horaires et créneaux", text: "Vous contrôlez les heures disponibles, les jours off et la charge de la journée." },
      { title: "Notifications Telegram", text: "Les nouvelles demandes et modifications arrivent directement dans Telegram." },
      { title: "Lien pour les clients", text: "Une seule page peut être partagée dans les réseaux sociaux, messageries et profils." }
    ],
    valueTitle: "Ce que cela apporte",
    valueItems: ["moins de messages manuels", "plus de réservations confirmées", "planning clair", "lancement rapide sans site"],
    servicesTitle: "Configurez les services en quelques minutes",
    servicesText: "Ajoutez services, durée et prix pour que le client comprenne immédiatement ce qu’il réserve.",
    calendarTitle: "Calendrier de réservation pour le quotidien",
    calendarText: "Le calendrier affiche les visites, créneaux libres, durées et charge de la journée pour travailler sans chaos.",
    calendarItems: ["calendrier journalier", "planning hebdomadaire", "créneaux libres", "statuts de réservation", "visites répétées"],
    howTitle: "Comment fonctionne la réservation en ligne",
    howText: ["Créez un profil, ajoutez les services et horaires de travail.", "Le client ouvre votre lien, choisit un service et envoie une demande sur un créneau disponible."],
    howSteps: ["Créer un profil", "Ajouter les services", "Configurer le planning", "Recevoir les réservations en ligne"],
    compareTitle: "Sans Timviz et avec Timviz",
    compareLeftTitle: "Sans Timviz",
    compareRightTitle: "Avec Timviz",
    compareLeft: ["réservations dans différents chats", "recherche manuelle des créneaux", "clients en attente de réponse", "durées faciles à confondre"],
    compareRight: ["réservation client en ligne", "calendrier avec disponibilité", "services avec durée et prix", "notifications Telegram"],
    telegramTitle: "Nouvelles réservations dans Telegram",
    telegramText: "Connectez le bot Telegram Timviz pour recevoir demandes, reports et annulations sans vérifier les chats en permanence.",
    dayTitle: "Exemple de journée",
    trustTitle: "Pourquoi les pros choisissent Timviz",
    trustCards: [
      { title: "Lancement rapide", text: "Profil, services et planning se configurent en quelques minutes." },
      { title: "Moins d’administration", text: "La réservation en ligne réduit les messages répétitifs." },
      { title: "Meilleur parcours client", text: "Le client voit les services, l’heure et un bouton clair pour réserver." }
    ],
    seoBlockTitle: "Page SEO pour la réservation en ligne",
    faqTitle: "FAQ",
    finalTitle: "Lancez la réservation en ligne avec Timviz",
    finalText: "Créez votre profil, ajoutez vos services et recevez des réservations sans chaos dans les messages.",
    finalMicrocopy: "Cela prend quelques minutes",
    screenshotAltCalendar: "Calendrier de réservation Timviz",
    screenshotAltServices: "Services et durées dans Timviz",
    screenshotAltTelegram: "Notifications Telegram Timviz"
  },
  pl: {
    ctaHint: "Bez strony www • bez skomplikowanej konfiguracji • darmowy start",
    sampleClient: "Klientka: Anna K.",
    sampleStatus: "Status: potwierdzono",
    problemsTitle: "Brzmi znajomo?",
    problems: [
      { title: "Zapytania w różnych komunikatorach", text: "Klienci piszą na Instagramie, Telegramie i Viberze, a rezerwacje łatwo gubią się w rozmowach." },
      { title: "Trudno szybko znaleźć wolny termin", text: "Bez jednego kalendarza trzeba ręcznie sprawdzać grafik i czas usług." },
      { title: "Nakładki i puste okienka", text: "Krótkie i długie usługi mieszają się, przez co dzień staje się mniej przewidywalny." },
      { title: "Klienci czekają na odpowiedź", text: "Gdy specjalista jest zajęty, nowy klient może wybrać miejsce z natychmiastową rezerwacją." },
      { title: "Brak jasnej strony rezerwacji", text: "Bez publicznego linku trzeba ciągle tłumaczyć usługi, ceny i wolne godziny." },
      { title: "Trudniejsze powroty klientów", text: "Bez uporządkowanego grafiku trudniej szybko zaproponować kolejny wygodny termin." }
    ],
    solutionTitle: "Timviz porządkuje rezerwacje",
    solutionText: "Klienci wybierają usługę i wolny termin online, a specjalista widzi rezerwacje, czas, statusy i zmiany w jednym panelu.",
    solutionCards: [
      { title: "Rezerwacje online 24/7", text: "Klienci rezerwują bez telefonów i czekania na odpowiedź." },
      { title: "Kalendarz z czasem usług", text: "System uwzględnia długość usługi i pomaga uniknąć nakładek." },
      { title: "Usługi i ceny", text: "Publiczna strona pokazuje przejrzystą listę usług przed rezerwacją." },
      { title: "Godziny pracy i okienka", text: "Kontrolujesz dostępne godziny, dni wolne i obłożenie dnia." },
      { title: "Powiadomienia Telegram", text: "Nowe zgłoszenia i zmiany przychodzą od razu w Telegramie." },
      { title: "Link dla klientów", text: "Jedną stronę można udostępniać w social mediach, komunikatorach i profilu." }
    ],
    valueTitle: "Co daje to firmie",
    valueItems: ["mniej ręcznych wiadomości", "więcej potwierdzonych rezerwacji", "czytelny grafik dnia", "szybki start bez strony"],
    servicesTitle: "Skonfiguruj usługi w kilka minut",
    servicesText: "Dodaj usługi, czas i cenę, aby klient od razu wiedział, co rezerwuje i ile potrwa wizyta.",
    calendarTitle: "Kalendarz rezerwacji do codziennej pracy",
    calendarText: "Kalendarz pokazuje wizyty, wolne okienka, czas usług i obłożenie dnia, dzięki czemu łatwiej pracować bez chaosu.",
    calendarItems: ["kalendarz dzienny", "grafik tygodniowy", "wolne okienka", "statusy rezerwacji", "powracające wizyty"],
    howTitle: "Jak działa rezerwacja online",
    howText: ["Tworzysz profil, dodajesz usługi i godziny pracy.", "Klient otwiera link, wybiera usługę i wysyła zgłoszenie w wolnym terminie."],
    howSteps: ["Utwórz profil", "Dodaj usługi", "Ustaw grafik", "Przyjmuj rezerwacje online"],
    compareTitle: "Bez Timviz i z Timviz",
    compareLeftTitle: "Bez Timviz",
    compareRightTitle: "Z Timviz",
    compareLeft: ["rezerwacje w różnych czatach", "ręczne szukanie wolnego czasu", "klienci czekają na odpowiedź", "łatwo pomylić czas usługi"],
    compareRight: ["rezerwacje klientów online", "kalendarz z dostępnością", "usługi z czasem i ceną", "powiadomienia Telegram"],
    telegramTitle: "Nowe rezerwacje od razu w Telegramie",
    telegramText: "Podłącz bota Timviz Telegram, aby dostawać nowe zgłoszenia, zmiany i anulacje bez ciągłego sprawdzania czatów.",
    dayTitle: "Przykład dnia pracy",
    trustTitle: "Dlaczego specjaliści wybierają Timviz",
    trustCards: [
      { title: "Szybki start", text: "Profil, usługi i grafik ustawisz w kilka minut." },
      { title: "Mniej administracji", text: "Rezerwacje online ograniczają powtarzalne wiadomości i ręczne ustalenia." },
      { title: "Lepsza ścieżka klienta", text: "Klient widzi usługi, czas i jasny przycisk rezerwacji." }
    ],
    seoBlockTitle: "Strona SEO dla rezerwacji online",
    faqTitle: "FAQ",
    finalTitle: "Uruchom rezerwacje online z Timviz",
    finalText: "Utwórz profil, dodaj usługi i przyjmuj rezerwacje bez chaosu w wiadomościach.",
    finalMicrocopy: "To zajmie kilka minut",
    screenshotAltCalendar: "Kalendarz rezerwacji Timviz",
    screenshotAltServices: "Usługi i czas trwania w Timviz",
    screenshotAltTelegram: "Powiadomienia Telegram Timviz"
  },
  cs: {
    ctaHint: "Bez webu • bez složitého nastavení • start zdarma",
    sampleClient: "Klientka: Anna K.",
    sampleStatus: "Stav: potvrzeno",
    problemsTitle: "Je vám to povědomé?",
    problems: [
      { title: "Požadavky v různých messengerech", text: "Klienti píší na Instagramu, Telegramu a Viberu a rezervace se snadno ztratí ve zprávách." },
      { title: "Těžké rychle najít volný čas", text: "Bez jednoho kalendáře je nutné ručně kontrolovat rozvrh a délku služeb." },
      { title: "Kolize a prázdná okna", text: "Krátké a dlouhé služby se míchají a den je méně předvídatelný." },
      { title: "Klienti čekají na odpověď", text: "Když specialista pracuje, nový klient může odejít tam, kde je rezervace okamžitá." },
      { title: "Chybí jasná rezervační stránka", text: "Bez veřejného odkazu musíte opakovaně vysvětlovat služby, ceny a volné hodiny." },
      { title: "Těžší opakované návštěvy", text: "Bez strukturovaného rozvrhu se hůře nabízí další vhodný termín." }
    ],
    solutionTitle: "Timviz dává rezervacím řád",
    solutionText: "Klienti si vyberou službu a volný čas online, zatímco specialista vidí rezervace, délky, stavy a změny v jednom panelu.",
    solutionCards: [
      { title: "Online rezervace 24/7", text: "Klienti rezervují bez telefonátů a čekání na odpověď." },
      { title: "Kalendář s délkami", text: "Systém respektuje délku služby a pomáhá předcházet kolizím." },
      { title: "Služby a ceny", text: "Veřejná stránka ukáže jasný seznam služeb před rezervací." },
      { title: "Pracovní hodiny a sloty", text: "Řídíte dostupné hodiny, volna i vytížení dne." },
      { title: "Telegram oznámení", text: "Nové žádosti a změny přicházejí ihned do Telegramu." },
      { title: "Odkaz pro klienty", text: "Jednu stránku lze sdílet v sítích, messengerech i profilu." }
    ],
    valueTitle: "Co to přináší firmě",
    valueItems: ["méně ručních zpráv", "více potvrzených rezervací", "jasný denní rozvrh", "rychlý start bez webu"],
    servicesTitle: "Nastavte služby během pár minut",
    servicesText: "Přidejte služby, délku a cenu, aby klient hned věděl, co rezervuje a jak dlouho návštěva potrvá.",
    calendarTitle: "Rezervační kalendář pro každodenní práci",
    calendarText: "Kalendář ukazuje návštěvy, volné sloty, délku služeb i denní vytížení. Pomáhá plánovat bez chaosu.",
    calendarItems: ["denní kalendář", "týdenní rozvrh", "volné sloty", "stavy rezervací", "opakované návštěvy"],
    howTitle: "Jak funguje online rezervace",
    howText: ["Vytvoříte profil, přidáte služby a pracovní dobu.", "Klient otevře odkaz, vybere službu a pošle žádost do volného slotu."],
    howSteps: ["Vytvořte profil", "Přidejte služby", "Nastavte rozvrh", "Přijímejte rezervace online"],
    compareTitle: "Bez Timviz a s Timviz",
    compareLeftTitle: "Bez Timviz",
    compareRightTitle: "S Timviz",
    compareLeft: ["rezervace v různých chatech", "ruční hledání volného času", "klienti čekají na odpověď", "snadno se splete délka služby"],
    compareRight: ["online rezervace klientů", "kalendář s dostupností", "služby s délkou a cenou", "Telegram oznámení"],
    telegramTitle: "Nové rezervace ihned v Telegramu",
    telegramText: "Připojte Telegram bota Timviz a dostávejte nové žádosti, přesuny i zrušení bez neustálé kontroly chatů.",
    dayTitle: "Příklad pracovního dne",
    trustTitle: "Proč specialisté volí Timviz",
    trustCards: [
      { title: "Rychlý start", text: "Profil, služby a rozvrh nastavíte během pár minut." },
      { title: "Méně administrativy", text: "Online rezervace omezují opakované zprávy a ruční domluvy." },
      { title: "Lepší cesta klienta", text: "Klient vidí služby, čas a jasné tlačítko rezervace." }
    ],
    seoBlockTitle: "SEO stránka pro online rezervace",
    faqTitle: "FAQ",
    finalTitle: "Spusťte online rezervace s Timviz",
    finalText: "Vytvořte profil, přidejte služby a přijímejte rezervace bez chaosu ve zprávách.",
    finalMicrocopy: "Zabere to pár minut",
    screenshotAltCalendar: "Rezervační kalendář Timviz",
    screenshotAltServices: "Služby a délky v Timviz",
    screenshotAltTelegram: "Telegram oznámení Timviz"
  },
  es: {
    ctaHint: "Sin sitio web • sin configuración compleja • inicio gratis",
    sampleClient: "Cliente: Anna K.",
    sampleStatus: "Estado: confirmado",
    problemsTitle: "¿Te resulta familiar?",
    problems: [
      { title: "Solicitudes en varios chats", text: "Los clientes escriben en Instagram, Telegram y Viber, y las reservas se pierden fácilmente." },
      { title: "Difícil encontrar una hora libre rápido", text: "Sin un calendario único, hay que revisar manualmente agenda y duración de servicios." },
      { title: "Solapamientos y huecos vacíos", text: "Los servicios cortos y largos se mezclan, haciendo el día menos predecible." },
      { title: "Los clientes esperan respuesta", text: "Mientras el profesional trabaja, un nuevo cliente puede elegir una reserva inmediata." },
      { title: "No hay página clara de reservas", text: "Sin enlace público, hay que explicar servicios, precios y horarios una y otra vez." },
      { title: "Más difícil repetir visitas", text: "Sin una agenda estructurada, cuesta ofrecer rápido el siguiente horario conveniente." }
    ],
    solutionTitle: "Timviz ordena las reservas",
    solutionText: "Los clientes eligen servicio y hora disponible online, mientras el profesional ve reservas, duración, estados y cambios en un solo panel.",
    solutionCards: [
      { title: "Reservas online 24/7", text: "Los clientes reservan sin llamadas ni espera de respuesta." },
      { title: "Calendario con duración", text: "El sistema respeta la duración del servicio y ayuda a evitar solapamientos." },
      { title: "Servicios y precios", text: "La página pública muestra una lista clara antes de reservar." },
      { title: "Horario y huecos", text: "Controlas horas disponibles, días libres y carga diaria." },
      { title: "Notificaciones Telegram", text: "Nuevas solicitudes y cambios llegan al instante en Telegram." },
      { title: "Enlace para clientes", text: "Una página puede compartirse en redes, mensajería y perfil." }
    ],
    valueTitle: "Qué aporta al negocio",
    valueItems: ["menos mensajes manuales", "más reservas confirmadas", "agenda diaria clara", "inicio rápido sin web"],
    servicesTitle: "Configura servicios en minutos",
    servicesText: "Añade servicios, duración y precio para que el cliente entienda qué reserva y cuánto dura la visita.",
    calendarTitle: "Calendario de reservas para el día a día",
    calendarText: "El calendario muestra visitas, huecos libres, duración y carga diaria. Ayuda a planificar sin caos.",
    calendarItems: ["calendario diario", "agenda semanal", "huecos libres", "estados de reserva", "visitas recurrentes"],
    howTitle: "Cómo funciona la reserva online",
    howText: ["Creas un perfil, añades servicios y horario de trabajo.", "El cliente abre tu enlace, elige un servicio y envía una solicitud en un hueco disponible."],
    howSteps: ["Crea un perfil", "Añade servicios", "Configura la agenda", "Recibe reservas online"],
    compareTitle: "Sin Timviz y con Timviz",
    compareLeftTitle: "Sin Timviz",
    compareRightTitle: "Con Timviz",
    compareLeft: ["reservas en varios chats", "búsqueda manual de horas libres", "clientes esperando respuesta", "duraciones fáciles de confundir"],
    compareRight: ["reservas online de clientes", "calendario con disponibilidad", "servicios con duración y precio", "notificaciones Telegram"],
    telegramTitle: "Nuevas reservas directamente en Telegram",
    telegramText: "Conecta el bot de Timviz en Telegram para recibir solicitudes, cambios y cancelaciones sin revisar chats constantemente.",
    dayTitle: "Ejemplo de día de trabajo",
    trustTitle: "Por qué los profesionales eligen Timviz",
    trustCards: [
      { title: "Inicio rápido", text: "Perfil, servicios y agenda se configuran en minutos." },
      { title: "Menos administración", text: "La reserva online reduce mensajes repetidos y aclaraciones manuales." },
      { title: "Mejor experiencia de cliente", text: "El cliente ve servicios, hora y un botón claro para reservar." }
    ],
    seoBlockTitle: "Página SEO para reservas online",
    faqTitle: "FAQ",
    finalTitle: "Activa las reservas online con Timviz",
    finalText: "Crea tu perfil, añade servicios y recibe reservas sin caos en los mensajes.",
    finalMicrocopy: "Solo toma unos minutos",
    screenshotAltCalendar: "Calendario de reservas Timviz",
    screenshotAltServices: "Servicios y duración en Timviz",
    screenshotAltTelegram: "Notificaciones Telegram Timviz"
  },
  de: {
    ctaHint: "Keine Website nötig • keine komplexe Einrichtung • kostenlos starten",
    sampleClient: "Kundin: Anna K.",
    sampleStatus: "Status: bestätigt",
    problemsTitle: "Kommt Ihnen das bekannt vor?",
    problems: [
      { title: "Anfragen in mehreren Messengern", text: "Kunden schreiben auf Instagram, Telegram und Viber, und Buchungen gehen leicht in Chats verloren." },
      { title: "Freie Zeit schwer schnell zu finden", text: "Ohne einen Kalender müssen Zeitplan und Leistungsdauer manuell geprüft werden." },
      { title: "Überschneidungen und Leerlauf", text: "Kurze und lange Leistungen mischen sich, wodurch der Tag weniger planbar wird." },
      { title: "Kunden warten auf Antwort", text: "Während der Profi arbeitet, kann ein neuer Kunde jemanden mit sofortiger Buchung wählen." },
      { title: "Keine klare Buchungsseite", text: "Ohne öffentlichen Link müssen Leistungen, Preise und freie Zeiten immer wieder erklärt werden." },
      { title: "Wiederholte Besuche sind schwerer", text: "Ohne strukturierten Plan ist der nächste passende Termin schwerer anzubieten." }
    ],
    solutionTitle: "Timviz bringt Ordnung in Buchungen",
    solutionText: "Kunden wählen Leistung und freie Zeit online, während Profis Buchungen, Dauer, Status und Änderungen in einem Arbeitsbereich sehen.",
    solutionCards: [
      { title: "Online-Buchung 24/7", text: "Kunden buchen ohne Anrufe und ohne Warten auf Antwort." },
      { title: "Kalender mit Dauer", text: "Das System berücksichtigt die Leistungsdauer und verhindert Überschneidungen." },
      { title: "Leistungen und Preise", text: "Die öffentliche Seite zeigt vor der Buchung eine klare Liste." },
      { title: "Arbeitszeiten und Slots", text: "Sie steuern verfügbare Stunden, freie Tage und Tagesauslastung." },
      { title: "Telegram-Benachrichtigungen", text: "Neue Anfragen und Änderungen kommen sofort in Telegram an." },
      { title: "Link für Kunden", text: "Eine Seite kann in sozialen Netzwerken, Messengern und Profilen geteilt werden." }
    ],
    valueTitle: "Was es dem Unternehmen bringt",
    valueItems: ["weniger manuelle Nachrichten", "mehr bestätigte Buchungen", "klarer Tagesplan", "schneller Start ohne Website"],
    servicesTitle: "Leistungen in Minuten einrichten",
    servicesText: "Fügen Sie Leistungen, Dauer und Preis hinzu, damit Kunden sofort verstehen, was sie buchen.",
    calendarTitle: "Buchungskalender für den Alltag",
    calendarText: "Der Kalender zeigt Besuche, freie Slots, Dauer und Tagesauslastung. So lässt sich ohne Chaos planen.",
    calendarItems: ["Tageskalender", "Wochenplan", "freie Slots", "Buchungsstatus", "Wiederholungsbesuche"],
    howTitle: "So funktioniert Online-Buchung",
    howText: ["Sie erstellen ein Profil, fügen Leistungen und Arbeitszeiten hinzu.", "Der Kunde öffnet den Link, wählt eine Leistung und sendet eine Anfrage in einen freien Slot."],
    howSteps: ["Profil erstellen", "Leistungen hinzufügen", "Zeitplan einrichten", "Online-Buchungen annehmen"],
    compareTitle: "Ohne Timviz und mit Timviz",
    compareLeftTitle: "Ohne Timviz",
    compareRightTitle: "Mit Timviz",
    compareLeft: ["Buchungen in verschiedenen Chats", "manuelle Suche nach freier Zeit", "Kunden warten auf Antwort", "Dauer wird leicht verwechselt"],
    compareRight: ["Online-Kundenbuchung", "Kalender mit Verfügbarkeit", "Leistungen mit Dauer und Preis", "Telegram-Benachrichtigungen"],
    telegramTitle: "Neue Buchungen direkt in Telegram",
    telegramText: "Verbinden Sie den Timviz Telegram-Bot, um Anfragen, Verschiebungen und Stornierungen ohne ständige Chatprüfung zu erhalten.",
    dayTitle: "Beispiel für einen Arbeitstag",
    trustTitle: "Warum Profis Timviz wählen",
    trustCards: [
      { title: "Schneller Start", text: "Profil, Leistungen und Plan sind in wenigen Minuten eingerichtet." },
      { title: "Weniger Verwaltung", text: "Online-Buchung reduziert wiederholte Nachrichten und manuelle Klärungen." },
      { title: "Besserer Kundenweg", text: "Kunden sehen Leistungen, Zeit und einen klaren Buchungsbutton." }
    ],
    seoBlockTitle: "SEO-Seite für Online-Buchung",
    faqTitle: "FAQ",
    finalTitle: "Starten Sie Online-Buchungen mit Timviz",
    finalText: "Erstellen Sie Ihr Profil, fügen Sie Leistungen hinzu und nehmen Sie Buchungen ohne Nachrichtenchaos an.",
    finalMicrocopy: "Es dauert nur wenige Minuten",
    screenshotAltCalendar: "Timviz Buchungskalender",
    screenshotAltServices: "Leistungen und Dauer in Timviz",
    screenshotAltTelegram: "Timviz Telegram-Benachrichtigungen"
  }
});

const nicheServiceDetails: Record<NicheKey, Record<SiteLanguage, NicheServiceDetails>> =
  withNestedExtraLanguageFallbacks<NicheKey, NicheServiceDetails>({
    manicure: {
      ru: {
        sampleService: "Маникюр с покрытием · 90 мин",
        services: ["Маникюр", "Маникюр с покрытием", "Гель-лак", "Наращивание", "Коррекция", "Педикюр"],
        serviceSample: "Маникюр с покрытием — 90 мин",
        fitItems: ["гель-лак", "наращивание", "коррекция", "педикюр", "дизайн ногтей"],
        fitSample: "Маникюр + гель-лак — 90 мин",
        dayItems: [
          "09:00 — маникюр с покрытием на 90 минут сразу попадает в календарь.",
          "11:00 — коррекция на 120 минут планируется без накладок.",
          "14:00 — короткое окно закрывается услугой снятия покрытия.",
          "17:00 — постоянный клиент записывается по ссылке без переписки."
        ]
      },
      uk: {
        sampleService: "Манікюр із покриттям · 90 хв",
        services: ["Манікюр", "Манікюр із покриттям", "Гель-лак", "Нарощування", "Корекція", "Педикюр"],
        serviceSample: "Манікюр із покриттям — 90 хв",
        fitItems: ["гель-лак", "нарощування", "корекція", "педикюр", "дизайн нігтів"],
        fitSample: "Манікюр + гель-лак — 90 хв",
        dayItems: [
          "09:00 — манікюр із покриттям на 90 хвилин одразу з’являється в календарі.",
          "11:00 — корекція на 120 хвилин планується без накладок.",
          "14:00 — коротке вікно закривається послугою зняття покриття.",
          "17:00 — постійний клієнт записується за посиланням без переписки."
        ]
      },
      en: {
        sampleService: "Manicure with coating · 90 min",
        services: ["Manicure", "Manicure with coating", "Gel polish", "Nail extension", "Correction", "Pedicure"],
        serviceSample: "Manicure with coating — 90 min",
        fitItems: ["gel polish", "extensions", "correction", "pedicure", "nail design"],
        fitSample: "Manicure + gel polish — 90 min",
        dayItems: [
          "09:00 — manicure with coating for 90 minutes appears in the calendar.",
          "11:00 — 120-minute correction is planned without overlap.",
          "14:00 — a short gap is filled with coating removal.",
          "17:00 — a returning client books by link without messaging."
        ]
      }
    },
    hairdressers: {
      ru: {
        sampleService: "Стрижка + укладка · 75 мин",
        services: ["Женская стрижка", "Мужская стрижка", "Окрашивание", "Укладка", "Сложное окрашивание", "Уход"],
        serviceSample: "Стрижка — 60 мин",
        fitItems: ["стрижки", "окрашивания", "укладки", "уход", "сложные процедуры"],
        fitSample: "Стрижка + укладка — 75 мин",
        dayItems: [
          "09:00 — мужская стрижка закрывает короткий утренний слот.",
          "10:00 — женская стрижка идет без накладки на окрашивание.",
          "13:00 — сложное окрашивание занимает длинное окно.",
          "17:00 — укладка бронируется онлайн без звонка."
        ]
      },
      uk: {
        sampleService: "Стрижка + укладка · 75 хв",
        services: ["Жіноча стрижка", "Чоловіча стрижка", "Фарбування", "Укладка", "Складне фарбування", "Догляд"],
        serviceSample: "Стрижка — 60 хв",
        fitItems: ["стрижки", "фарбування", "укладки", "догляд", "складні процедури"],
        fitSample: "Стрижка + укладка — 75 хв",
        dayItems: [
          "09:00 — чоловіча стрижка закриває короткий ранковий слот.",
          "10:00 — жіноча стрижка не накладається на фарбування.",
          "13:00 — складне фарбування займає довге вікно.",
          "17:00 — укладка бронюється онлайн без дзвінка."
        ]
      },
      en: {
        sampleService: "Haircut + styling · 75 min",
        services: ["Women's haircut", "Men's haircut", "Coloring", "Styling", "Complex coloring", "Hair care"],
        serviceSample: "Haircut — 60 min",
        fitItems: ["haircuts", "coloring", "styling", "care", "complex procedures"],
        fitSample: "Haircut + styling — 75 min",
        dayItems: [
          "09:00 — men’s haircut fills a short morning slot.",
          "10:00 — women’s haircut stays clear of a coloring service.",
          "13:00 — complex coloring occupies a long window.",
          "17:00 — styling is booked online without a call."
        ]
      }
    },
    barbers: {
      ru: {
        sampleService: "Стрижка + борода · 60 мин",
        services: ["Мужская стрижка", "Борода", "Fade", "Стрижка + борода", "Камуфляж седины", "Укладка"],
        serviceSample: "Стрижка + борода — 60 мин",
        fitItems: ["стрижка", "борода", "fade", "комплексы", "повторные визиты"],
        fitSample: "Стрижка + борода — 60 мин",
        dayItems: [
          "10:00 — классическая стрижка занимает точный слот.",
          "11:00 — стрижка + борода планируется как комплексная услуга.",
          "14:00 — fade не накладывается на следующего клиента.",
          "18:00 — постоянный клиент бронирует вечернее окно."
        ]
      },
      uk: {
        sampleService: "Стрижка + борода · 60 хв",
        services: ["Чоловіча стрижка", "Борода", "Fade", "Стрижка + борода", "Камуфляж сивини", "Укладка"],
        serviceSample: "Стрижка + борода — 60 хв",
        fitItems: ["стрижка", "борода", "fade", "комплекси", "повторні візити"],
        fitSample: "Стрижка + борода — 60 хв",
        dayItems: [
          "10:00 — класична стрижка займає точний слот.",
          "11:00 — стрижка + борода планується як комплексна послуга.",
          "14:00 — fade не накладається на наступного клієнта.",
          "18:00 — постійний клієнт бронює вечірнє вікно."
        ]
      },
      en: {
        sampleService: "Haircut + beard · 60 min",
        services: ["Men's haircut", "Beard trim", "Fade", "Haircut + beard", "Grey blending", "Styling"],
        serviceSample: "Haircut + beard — 60 min",
        fitItems: ["haircut", "beard", "fade", "combined services", "repeat visits"],
        fitSample: "Haircut + beard — 60 min",
        dayItems: [
          "10:00 — classic haircut takes a precise slot.",
          "11:00 — haircut + beard is planned as a combined service.",
          "14:00 — fade does not overlap with the next client.",
          "18:00 — a returning client books an evening window."
        ]
      }
    },
    cosmetologists: {
      ru: {
        sampleService: "Чистка лица · 90 мин",
        services: ["Консультация", "Чистка лица", "Пилинг", "Уходовая процедура", "Массаж лица", "Курс процедур"],
        serviceSample: "Чистка лица — 90 мин",
        fitItems: ["консультации", "пилинги", "уход", "курсы", "повторные визиты"],
        fitSample: "Пилинг + уход — 75 мин",
        dayItems: [
          "10:00 — консультация занимает короткий слот.",
          "11:00 — чистка лица планируется как длинная процедура.",
          "14:00 — курс процедур ведется по понятному расписанию.",
          "17:00 — клиент бронирует повторный визит онлайн."
        ]
      },
      uk: {
        sampleService: "Чистка обличчя · 90 хв",
        services: ["Консультація", "Чистка обличчя", "Пілінг", "Доглядова процедура", "Масаж обличчя", "Курс процедур"],
        serviceSample: "Чистка обличчя — 90 хв",
        fitItems: ["консультації", "пілінги", "догляд", "курси", "повторні візити"],
        fitSample: "Пілінг + догляд — 75 хв",
        dayItems: [
          "10:00 — консультація займає короткий слот.",
          "11:00 — чистка обличчя планується як довга процедура.",
          "14:00 — курс процедур ведеться за зрозумілим розкладом.",
          "17:00 — клієнт бронює повторний візит онлайн."
        ]
      },
      en: {
        sampleService: "Facial cleansing · 90 min",
        services: ["Consultation", "Facial cleansing", "Peeling", "Skin care treatment", "Face massage", "Treatment course"],
        serviceSample: "Facial cleansing — 90 min",
        fitItems: ["consultations", "peelings", "skin care", "courses", "repeat visits"],
        fitSample: "Peeling + care — 75 min",
        dayItems: [
          "10:00 — consultation fills a short slot.",
          "11:00 — facial cleansing is planned as a long procedure.",
          "14:00 — a treatment course follows a clear schedule.",
          "17:00 — a client books a repeat visit online."
        ]
      }
    },
    massage: {
      ru: {
        sampleService: "Классический массаж · 60 мин",
        services: ["Классический массаж", "Расслабляющий массаж", "Лечебный массаж", "Спортивный массаж", "Антицеллюлитный массаж", "Курс массажа"],
        serviceSample: "Классический массаж — 60 мин",
        fitItems: ["30/60/90 минут", "лечебный массаж", "релакс", "курсы", "буферы между сеансами"],
        fitSample: "Расслабляющий массаж — 90 мин",
        dayItems: [
          "09:00 — лечебный массаж занимает короткое утреннее окно.",
          "10:00 — классический массаж идет по стандартному таймингу.",
          "12:00 — релакс-массаж планируется как длинный сеанс.",
          "18:00 — вечерний клиент бронирует свободный слот онлайн."
        ]
      },
      uk: {
        sampleService: "Класичний масаж · 60 хв",
        services: ["Класичний масаж", "Розслаблювальний масаж", "Лікувальний масаж", "Спортивний масаж", "Антицелюлітний масаж", "Курс масажу"],
        serviceSample: "Класичний масаж — 60 хв",
        fitItems: ["30/60/90 хвилин", "лікувальний масаж", "релакс", "курси", "буфери між сеансами"],
        fitSample: "Розслаблювальний масаж — 90 хв",
        dayItems: [
          "09:00 — лікувальний масаж займає коротке ранкове вікно.",
          "10:00 — класичний масаж іде за стандартним таймінгом.",
          "12:00 — релакс-масаж планується як довгий сеанс.",
          "18:00 — вечірній клієнт бронює вільний слот онлайн."
        ]
      },
      en: {
        sampleService: "Classic massage · 60 min",
        services: ["Classic massage", "Relax massage", "Therapeutic massage", "Sports massage", "Anti-cellulite massage", "Massage course"],
        serviceSample: "Classic massage — 60 min",
        fitItems: ["30/60/90 minutes", "therapeutic massage", "relax", "courses", "buffers between sessions"],
        fitSample: "Relax massage — 90 min",
        dayItems: [
          "09:00 — therapeutic massage fills a short morning window.",
          "10:00 — classic massage follows standard timing.",
          "12:00 — relax massage is planned as a long session.",
          "18:00 — an evening client books an available slot online."
        ]
      }
    }
  }, {
    manicure: {
      fr: { sampleService: "Manucure avec vernis · 90 min", services: ["Manucure", "Manucure avec vernis", "Gel polish", "Extensions", "Correction", "Pédicure"], serviceSample: "Manucure avec vernis — 90 min", fitItems: ["gel polish", "extensions", "correction", "pédicure", "nail art"], fitSample: "Manucure + gel — 90 min", dayItems: ["09:00 — manucure avec vernis de 90 minutes dans le calendrier.", "11:00 — correction de 120 minutes sans chevauchement.", "14:00 — un petit créneau se remplit avec une dépose.", "17:00 — une cliente régulière réserve via le lien."] },
      pl: { sampleService: "Manicure z malowaniem · 90 min", services: ["Manicure", "Manicure z malowaniem", "Lakier hybrydowy", "Przedłużanie", "Korekta", "Pedicure"], serviceSample: "Manicure z malowaniem — 90 min", fitItems: ["hybryda", "przedłużanie", "korekta", "pedicure", "zdobienia"], fitSample: "Manicure + hybryda — 90 min", dayItems: ["09:00 — manicure z malowaniem trafia do kalendarza.", "11:00 — korekta 120 min planuje się bez nakładek.", "14:00 — krótkie okienko wypełnia zdjęcie stylizacji.", "17:00 — stała klientka rezerwuje przez link."] },
      cs: { sampleService: "Manikúra s lakem · 90 min", services: ["Manikúra", "Manikúra s lakem", "Gel lak", "Modeláž nehtů", "Korekce", "Pedikúra"], serviceSample: "Manikúra s lakem — 90 min", fitItems: ["gel lak", "modeláž", "korekce", "pedikúra", "nail art"], fitSample: "Manikúra + gel lak — 90 min", dayItems: ["09:00 — manikúra s lakem je v kalendáři.", "11:00 — 120min korekce je bez kolize.", "14:00 — krátký slot vyplní odstranění laku.", "17:00 — stálá klientka rezervuje přes odkaz."] },
      es: { sampleService: "Manicura con esmaltado · 90 min", services: ["Manicura", "Manicura con esmaltado", "Gel polish", "Extensiones", "Corrección", "Pedicura"], serviceSample: "Manicura con esmaltado — 90 min", fitItems: ["gel", "extensiones", "corrección", "pedicura", "diseño de uñas"], fitSample: "Manicura + gel — 90 min", dayItems: ["09:00 — manicura con esmaltado entra al calendario.", "11:00 — corrección de 120 min sin solaparse.", "14:00 — un hueco corto se llena con retirada.", "17:00 — una clienta habitual reserva por enlace."] },
      de: { sampleService: "Maniküre mit Lack · 90 Min.", services: ["Maniküre", "Maniküre mit Lack", "Gel-Lack", "Nagelverlängerung", "Korrektur", "Pediküre"], serviceSample: "Maniküre mit Lack — 90 Min.", fitItems: ["Gel-Lack", "Verlängerung", "Korrektur", "Pediküre", "Nageldesign"], fitSample: "Maniküre + Gel — 90 Min.", dayItems: ["09:00 — Maniküre mit Lack steht im Kalender.", "11:00 — 120-minütige Korrektur ohne Überschneidung.", "14:00 — kurzer Slot für Entfernung.", "17:00 — Stammkundin bucht per Link."] }
    },
    hairdressers: {
      fr: { sampleService: "Coupe + brushing · 75 min", services: ["Coupe femme", "Coupe homme", "Coloration", "Brushing", "Coloration complexe", "Soin capillaire"], serviceSample: "Coupe — 60 min", fitItems: ["coupes", "colorations", "brushing", "soins", "procédures longues"], fitSample: "Coupe + brushing — 75 min", dayItems: ["09:00 — coupe homme dans un créneau court.", "10:00 — coupe femme sans conflit avec la coloration.", "13:00 — coloration complexe dans un long créneau.", "17:00 — brushing réservé en ligne."] },
      pl: { sampleService: "Strzyżenie + stylizacja · 75 min", services: ["Strzyżenie damskie", "Strzyżenie męskie", "Koloryzacja", "Stylizacja", "Koloryzacja złożona", "Pielęgnacja włosów"], serviceSample: "Strzyżenie — 60 min", fitItems: ["strzyżenia", "koloryzacje", "stylizacja", "pielęgnacja", "złożone usługi"], fitSample: "Strzyżenie + stylizacja — 75 min", dayItems: ["09:00 — męskie strzyżenie zamyka krótki slot.", "10:00 — damskie strzyżenie bez konfliktu z koloryzacją.", "13:00 — złożona koloryzacja zajmuje długie okno.", "17:00 — stylizacja rezerwowana online."] },
      cs: { sampleService: "Střih + styling · 75 min", services: ["Dámský střih", "Pánský střih", "Barvení", "Styling", "Složité barvení", "Péče o vlasy"], serviceSample: "Střih — 60 min", fitItems: ["střihy", "barvení", "styling", "péče", "dlouhé služby"], fitSample: "Střih + styling — 75 min", dayItems: ["09:00 — pánský střih vyplní krátký slot.", "10:00 — dámský střih se nekříží s barvením.", "13:00 — složité barvení zabere dlouhé okno.", "17:00 — styling je rezervován online."] },
      es: { sampleService: "Corte + peinado · 75 min", services: ["Corte mujer", "Corte hombre", "Coloración", "Peinado", "Coloración compleja", "Cuidado capilar"], serviceSample: "Corte — 60 min", fitItems: ["cortes", "coloración", "peinados", "cuidado", "servicios largos"], fitSample: "Corte + peinado — 75 min", dayItems: ["09:00 — corte masculino en un hueco corto.", "10:00 — corte femenino sin conflicto con coloración.", "13:00 — coloración compleja ocupa un hueco largo.", "17:00 — peinado reservado online."] },
      de: { sampleService: "Schnitt + Styling · 75 Min.", services: ["Damenhaarschnitt", "Herrenhaarschnitt", "Färben", "Styling", "Komplexe Farbe", "Haarpflege"], serviceSample: "Haarschnitt — 60 Min.", fitItems: ["Schnitte", "Färben", "Styling", "Pflege", "lange Leistungen"], fitSample: "Schnitt + Styling — 75 Min.", dayItems: ["09:00 — Herrenschnitt füllt einen kurzen Slot.", "10:00 — Damenschnitt ohne Konflikt mit Farbe.", "13:00 — komplexe Farbe nutzt ein langes Fenster.", "17:00 — Styling wird online gebucht."] }
    },
    barbers: {
      fr: { sampleService: "Coupe + barbe · 60 min", services: ["Coupe homme", "Barbe", "Fade", "Coupe + barbe", "Camouflage gris", "Coiffage"], serviceSample: "Coupe + barbe — 60 min", fitItems: ["coupe", "barbe", "fade", "services combinés", "visites répétées"], fitSample: "Coupe + barbe — 60 min", dayItems: ["10:00 — coupe classique dans un créneau précis.", "11:00 — coupe + barbe comme service combiné.", "14:00 — fade sans chevauchement.", "18:00 — client régulier réserve le soir."] },
      pl: { sampleService: "Strzyżenie + broda · 60 min", services: ["Strzyżenie męskie", "Broda", "Fade", "Strzyżenie + broda", "Kamuflaż siwizny", "Stylizacja"], serviceSample: "Strzyżenie + broda — 60 min", fitItems: ["strzyżenie", "broda", "fade", "usługi łączone", "powracające wizyty"], fitSample: "Strzyżenie + broda — 60 min", dayItems: ["10:00 — klasyczne strzyżenie ma dokładny slot.", "11:00 — strzyżenie + broda jako usługa łączona.", "14:00 — fade bez nakładki na kolejnego klienta.", "18:00 — stały klient rezerwuje wieczór."] },
      cs: { sampleService: "Střih + vousy · 60 min", services: ["Pánský střih", "Vousy", "Fade", "Střih + vousy", "Kamufláž šedin", "Styling"], serviceSample: "Střih + vousy — 60 min", fitItems: ["střih", "vousy", "fade", "kombinované služby", "opakované návštěvy"], fitSample: "Střih + vousy — 60 min", dayItems: ["10:00 — klasický střih má přesný slot.", "11:00 — střih + vousy jako kombinovaná služba.", "14:00 — fade bez kolize s dalším klientem.", "18:00 — stálý klient rezervuje večer."] },
      es: { sampleService: "Corte + barba · 60 min", services: ["Corte hombre", "Barba", "Fade", "Corte + barba", "Camuflaje de canas", "Peinado"], serviceSample: "Corte + barba — 60 min", fitItems: ["corte", "barba", "fade", "servicios combinados", "visitas recurrentes"], fitSample: "Corte + barba — 60 min", dayItems: ["10:00 — corte clásico con horario preciso.", "11:00 — corte + barba como servicio combinado.", "14:00 — fade sin solapar al siguiente cliente.", "18:00 — cliente habitual reserva por la tarde."] },
      de: { sampleService: "Haarschnitt + Bart · 60 Min.", services: ["Herrenhaarschnitt", "Bart", "Fade", "Haarschnitt + Bart", "Grau-Kaschierung", "Styling"], serviceSample: "Haarschnitt + Bart — 60 Min.", fitItems: ["Haarschnitt", "Bart", "Fade", "Kombis", "Wiederholungsbesuche"], fitSample: "Haarschnitt + Bart — 60 Min.", dayItems: ["10:00 — klassischer Schnitt nutzt einen präzisen Slot.", "11:00 — Schnitt + Bart als Kombi-Leistung.", "14:00 — Fade ohne Überschneidung.", "18:00 — Stammkunde bucht abends."] }
    },
    cosmetologists: {
      fr: { sampleService: "Nettoyage du visage · 90 min", services: ["Consultation", "Nettoyage du visage", "Peeling", "Soin visage", "Massage du visage", "Cure de soins"], serviceSample: "Nettoyage du visage — 90 min", fitItems: ["consultations", "peelings", "soins", "cures", "visites répétées"], fitSample: "Peeling + soin — 75 min", dayItems: ["10:00 — consultation dans un créneau court.", "11:00 — nettoyage du visage comme soin long.", "14:00 — cure suivie dans un planning clair.", "17:00 — réservation d’une visite répétée."] },
      pl: { sampleService: "Oczyszczanie twarzy · 90 min", services: ["Konsultacja", "Oczyszczanie twarzy", "Peeling", "Zabieg pielęgnacyjny", "Masaż twarzy", "Kurs zabiegów"], serviceSample: "Oczyszczanie twarzy — 90 min", fitItems: ["konsultacje", "peelingi", "pielęgnacja", "kursy", "powracające wizyty"], fitSample: "Peeling + pielęgnacja — 75 min", dayItems: ["10:00 — konsultacja zajmuje krótki slot.", "11:00 — oczyszczanie twarzy jako długi zabieg.", "14:00 — kurs zabiegów w czytelnym grafiku.", "17:00 — klient rezerwuje kolejną wizytę."] },
      cs: { sampleService: "Čištění pleti · 90 min", services: ["Konzultace", "Čištění pleti", "Peeling", "Ošetření pleti", "Masáž obličeje", "Kúra procedur"], serviceSample: "Čištění pleti — 90 min", fitItems: ["konzultace", "peelingy", "péče", "kúry", "opakované návštěvy"], fitSample: "Peeling + péče — 75 min", dayItems: ["10:00 — konzultace vyplní krátký slot.", "11:00 — čištění pleti jako dlouhá procedura.", "14:00 — kúra má jasný harmonogram.", "17:00 — klient rezervuje další návštěvu."] },
      es: { sampleService: "Limpieza facial · 90 min", services: ["Consulta", "Limpieza facial", "Peeling", "Tratamiento facial", "Masaje facial", "Curso de tratamientos"], serviceSample: "Limpieza facial — 90 min", fitItems: ["consultas", "peelings", "cuidado", "cursos", "visitas recurrentes"], fitSample: "Peeling + cuidado — 75 min", dayItems: ["10:00 — consulta en un hueco corto.", "11:00 — limpieza facial como tratamiento largo.", "14:00 — curso con agenda clara.", "17:00 — cliente reserva visita recurrente."] },
      de: { sampleService: "Gesichtsreinigung · 90 Min.", services: ["Beratung", "Gesichtsreinigung", "Peeling", "Pflegebehandlung", "Gesichtsmassage", "Behandlungskurs"], serviceSample: "Gesichtsreinigung — 90 Min.", fitItems: ["Beratungen", "Peelings", "Pflege", "Kurse", "Wiederholungsbesuche"], fitSample: "Peeling + Pflege — 75 Min.", dayItems: ["10:00 — Beratung füllt kurzen Slot.", "11:00 — Gesichtsreinigung als lange Behandlung.", "14:00 — Kurs folgt klarem Plan.", "17:00 — Kunde bucht Wiederholungsbesuch."] }
    },
    massage: {
      fr: { sampleService: "Massage classique · 60 min", services: ["Massage classique", "Massage relaxant", "Massage thérapeutique", "Massage sportif", "Massage anticellulite", "Cure de massage"], serviceSample: "Massage classique — 60 min", fitItems: ["30/60/90 minutes", "thérapeutique", "relax", "cures", "buffers entre séances"], fitSample: "Massage relaxant — 90 min", dayItems: ["09:00 — massage thérapeutique dans un créneau court.", "10:00 — massage classique au timing standard.", "12:00 — massage relaxant comme séance longue.", "18:00 — client du soir réserve en ligne."] },
      pl: { sampleService: "Masaż klasyczny · 60 min", services: ["Masaż klasyczny", "Masaż relaksacyjny", "Masaż leczniczy", "Masaż sportowy", "Masaż antycellulitowy", "Kurs masażu"], serviceSample: "Masaż klasyczny — 60 min", fitItems: ["30/60/90 minut", "masaż leczniczy", "relaks", "kursy", "bufory między sesjami"], fitSample: "Masaż relaksacyjny — 90 min", dayItems: ["09:00 — masaż leczniczy zajmuje krótki poranny slot.", "10:00 — masaż klasyczny według standardowego czasu.", "12:00 — masaż relaksacyjny jako długa sesja.", "18:00 — wieczorny klient rezerwuje online."] },
      cs: { sampleService: "Klasická masáž · 60 min", services: ["Klasická masáž", "Relaxační masáž", "Terapeutická masáž", "Sportovní masáž", "Anticelulitidní masáž", "Masážní kurz"], serviceSample: "Klasická masáž — 60 min", fitItems: ["30/60/90 minut", "terapeutická masáž", "relax", "kurzy", "pauzy mezi sezeními"], fitSample: "Relaxační masáž — 90 min", dayItems: ["09:00 — terapeutická masáž vyplní krátký ranní slot.", "10:00 — klasická masáž má standardní délku.", "12:00 — relaxační masáž jako dlouhé sezení.", "18:00 — večerní klient rezervuje online."] },
      es: { sampleService: "Masaje clásico · 60 min", services: ["Masaje clásico", "Masaje relajante", "Masaje terapéutico", "Masaje deportivo", "Masaje anticelulítico", "Curso de masaje"], serviceSample: "Masaje clásico — 60 min", fitItems: ["30/60/90 minutos", "masaje terapéutico", "relax", "cursos", "buffers entre sesiones"], fitSample: "Masaje relajante — 90 min", dayItems: ["09:00 — masaje terapéutico en un hueco corto.", "10:00 — masaje clásico con duración estándar.", "12:00 — masaje relajante como sesión larga.", "18:00 — cliente de tarde reserva online."] },
      de: { sampleService: "Klassische Massage · 60 Min.", services: ["Klassische Massage", "Entspannungsmassage", "Therapeutische Massage", "Sportmassage", "Anti-Cellulite-Massage", "Massagekurs"], serviceSample: "Klassische Massage — 60 Min.", fitItems: ["30/60/90 Minuten", "therapeutische Massage", "Relax", "Kurse", "Puffer zwischen Sitzungen"], fitSample: "Entspannungsmassage — 90 Min.", dayItems: ["09:00 — therapeutische Massage füllt kurzen Morgen-Slot.", "10:00 — klassische Massage mit Standarddauer.", "12:00 — Entspannungsmassage als lange Sitzung.", "18:00 — Abendkunde bucht online."] }
    }
  });

export async function generateStaticParams() {
  return siteLanguages.flatMap((lang) => [
    ...getAllNicheParams().filter((item) => item.lang === lang).map((item) => ({ lang, niche: item.niche })),
    ...forBusinessFeaturePages.map((item) => ({ lang, niche: item.slug }))
  ]);
}

export async function generateMetadata({ params }: LocalizedSeoPageProps): Promise<Metadata> {
  const { lang, niche } = await params;
  if (!isSiteLanguage(lang)) return {};

  const nicheKey = getNicheKeyBySlug(lang, niche);
  const featurePage = isFeatureSlug(niche) ? forBusinessFeatureBySlug[niche] : null;
  if (!nicheKey && !featurePage) {
    return {};
  }

  const pathname = `/${lang}/${niche}`;
  const canonicalPathname = nicheKey ? getLocalizedPath(lang, `/${getNicheSlug(lang, nicheKey)}`) : pathname;
  const seoCopy = nicheKey ? nicheSeo[nicheKey][lang] : getFeaturePageSeo(featurePage!, lang);
  const metadata = buildMetadata(canonicalPathname, seoCopy, lang);
  return {
    ...metadata,
    alternates: nicheKey
      ? {
          canonical: `${siteUrl}${canonicalPathname}`,
          languages: {
            ...Object.fromEntries(
              siteLanguages.map((language) => [
                language,
                `${siteUrl}${getLocalizedPath(language, `/${getNicheSlug(language, nicheKey)}`)}`
              ])
            ),
            "x-default": `${siteUrl}${getLocalizedPath("en", `/${getNicheSlug("en", nicheKey)}`)}`
          }
        }
      : metadata.alternates
  };
}

const screenshotsByLanguage = withEnglishFallback<{ day: string; week: string; month: string }>({
  ru: { day: "/for-business/ru-day.png", week: "/for-business/ru-week.png", month: "/for-business/ru-month.png" },
  uk: { day: "/for-business/uk-day.png", week: "/for-business/uk-week.png", month: "/for-business/uk-month.png" },
  en: { day: "/for-business/en-day.png", week: "/for-business/en-week.png", month: "/for-business/en-month.png" }
});

function buildNicheFaq(language: SiteLanguage, nicheKey: NicheKey, title: string) {
  const yes = {
    ru: "Да",
    uk: "Так",
    en: "Yes",
    fr: "Oui",
    pl: "Tak",
    cs: "Ano",
    es: "Sí",
    de: "Ja"
  }[language];
  const booking = {
    ru: "Клиенты выбирают услугу и время онлайн, а заявка появляется в календаре Timviz.",
    uk: "Клієнти обирають послугу й час онлайн, а заявка з’являється в календарі Timviz.",
    en: "Clients choose a service and time online, and the request appears in the Timviz calendar.",
    fr: "Les clients choisissent un service et un créneau en ligne, puis la demande apparaît dans le calendrier Timviz.",
    pl: "Klienci wybierają usługę i termin online, a zgłoszenie pojawia się w kalendarzu Timviz.",
    cs: "Klienti si vyberou službu a čas online a žádost se zobrazí v kalendáři Timviz.",
    es: "Los clientes eligen servicio y hora online, y la solicitud aparece en el calendario de Timviz.",
    de: "Kunden wählen Leistung und Zeit online, und die Anfrage erscheint im Timviz Kalender."
  }[language];
  const duration = {
    ru: "У каждой услуги можно указать длительность и цену, чтобы график строился без накладок.",
    uk: "Для кожної послуги можна вказати тривалість і ціну, щоб графік будувався без накладок.",
    en: "Each service can have duration and price so the schedule is built without overlaps.",
    fr: "Chaque service peut avoir une durée et un prix afin de construire le planning sans chevauchement.",
    pl: "Każda usługa może mieć czas i cenę, aby grafik układał się bez nakładek.",
    cs: "Každá služba může mít délku a cenu, aby se rozvrh skládal bez kolizí.",
    es: "Cada servicio puede tener duración y precio para crear la agenda sin solapamientos.",
    de: "Jede Leistung kann Dauer und Preis haben, damit der Plan ohne Überschneidungen entsteht."
  }[language];
  const freeStart = {
    ru: "Можно начать бесплатно: создать профиль, добавить услуги и открыть ссылку для клиентов.",
    uk: "Можна почати безкоштовно: створити профіль, додати послуги й відкрити посилання для клієнтів.",
    en: "You can start for free: create a profile, add services and open the booking link for clients.",
    fr: "Vous pouvez commencer gratuitement : créez un profil, ajoutez les services et ouvrez le lien de réservation.",
    pl: "Możesz zacząć za darmo: utwórz profil, dodaj usługi i otwórz link dla klientów.",
    cs: "Můžete začít zdarma: vytvořte profil, přidejte služby a otevřete odkaz pro klienty.",
    es: "Puedes empezar gratis: crea un perfil, añade servicios y abre el enlace para clientes.",
    de: "Sie können kostenlos starten: Profil erstellen, Leistungen hinzufügen und den Link für Kunden öffnen."
  }[language];
  const questions = {
    ru: [`Подходит ли Timviz: ${title}?`, "Можно ли принимать онлайн-запись?", "Можно ли указать длительность услуг?", "Можно ли начать бесплатно?"],
    uk: [`Чи підходить Timviz: ${title}?`, "Чи можна приймати онлайн-запис?", "Чи можна вказати тривалість послуг?", "Чи можна почати безкоштовно?"],
    en: [`Is Timviz suitable: ${title}?`, "Can I accept online booking?", "Can I set service duration?", "Can I start for free?"],
    fr: [`Timviz convient-il : ${title} ?`, "Puis-je accepter les réservations en ligne ?", "Puis-je définir la durée des services ?", "Puis-je commencer gratuitement ?"],
    pl: [`Czy Timviz pasuje: ${title}?`, "Czy mogę przyjmować rezerwacje online?", "Czy mogę ustawić czas trwania usług?", "Czy mogę zacząć za darmo?"],
    cs: [`Hodí se Timviz: ${title}?`, "Mohu přijímat online rezervace?", "Mohu nastavit délku služeb?", "Mohu začít zdarma?"],
    es: [`¿Timviz sirve para: ${title}?`, "¿Puedo aceptar reservas online?", "¿Puedo definir la duración de servicios?", "¿Puedo empezar gratis?"],
    de: [`Passt Timviz für: ${title}?`, "Kann ich Online-Buchungen annehmen?", "Kann ich Leistungsdauer festlegen?", "Kann ich kostenlos starten?"]
  }[language];

  return [
    { q: questions[0], a: `${yes}. ${booking}` },
    { q: questions[1], a: booking },
    { q: questions[2], a: duration },
    { q: questions[3], a: freeStart }
  ];
}

function RichLocalizedNicheLanding({ language, nicheKey }: { language: SiteLanguage; nicheKey: NicheKey }) {
  const t = pageCopy[language];
  const rich = richChrome[language];
  const content = nicheContent[nicheKey][language];
  const details = nicheServiceDetails[nicheKey][language];
  const footerLabels = publicFooterLabels[language];
  const screenshots = screenshotsByLanguage[language];
  const otherKeys = nicheKeys.filter((key) => key !== nicheKey);
  const faq = buildNicheFaq(language, nicheKey, nicheCards[nicheKey][language].shortTitle);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } }))
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Timviz", item: `${siteUrl}${getLocalizedPath(language)}` },
      { "@type": "ListItem", position: 2, name: t.forBusiness, item: `${siteUrl}${getLocalizedPath(language, "/for-business")}` },
      { "@type": "ListItem", position: 3, name: content.h1, item: `${siteUrl}${getLocalizedPath(language, `/${getNicheSlug(language, nicheKey)}`)}` }
    ]
  };

  return (
    <main className="manicure-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.forBusiness}>
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href="/pro/login">Pro</a>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="manicure-hero" id="top">
        <div>
          <h1>{content.h1}</h1>
          <p>{content.lead}</p>
          <div className="business-hero-actions">
            <a className="business-primary" href="/pro/create-account">{t.ctaButton}</a>
          </div>
          <small>{rich.ctaHint}</small>
        </div>
        <aside className="manicure-hero-card">
          <img src={screenshots.day} alt={rich.screenshotAltCalendar} loading="lazy" />
          <div>
            <strong>{rich.sampleClient}</strong>
            <p>{details.sampleService}</p>
            <span>{rich.sampleStatus}</span>
          </div>
        </aside>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.problemsTitle}</h2></div>
        <div className="hair-card-grid">
          {rich.problems.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head"><h2>{rich.solutionTitle}</h2><p>{rich.solutionText}</p></div>
        <div className="hair-card-grid">
          {rich.solutionCards.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
        <div className="business-inline-cta">
          <a className="business-primary" href="/pro/create-account">{t.ctaButton}</a>
          <small className="hair-cta-caption">{rich.ctaHint}</small>
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.valueTitle}</h2></div>
        <ul className="business-seo-list">{rich.valueItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head"><h2>{rich.servicesTitle}</h2><p>{rich.servicesText}</p></div>
        <div className="manicure-services-grid">
          <div className="manicure-services-list">{details.services.map((item) => <span key={item}>{item}</span>)}</div>
          <article className="manicure-service-card"><img src={screenshots.week} alt={rich.screenshotAltServices} loading="lazy" /><strong>{details.serviceSample}</strong></article>
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.calendarTitle}</h2><p>{rich.calendarText}</p></div>
        <ul className="business-seo-list">{rich.calendarItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="business-workflow-section">
        <div><h2>{rich.howTitle}</h2><div className="hair-seo-text">{rich.howText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div>
        <ol>{rich.howSteps.map((step) => <li key={step}><div><strong>{step}</strong></div></li>)}</ol>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.compareTitle}</h2></div>
        <div className="business-compare-grid">
          <article><h3>{rich.compareLeftTitle}</h3><ul>{rich.compareLeft.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><h3>{rich.compareRightTitle}</h3><ul>{rich.compareRight.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      </section>

      <section className="business-seo-section">
        <h2>{rich.telegramTitle}</h2>
        <p>{rich.telegramText}</p>
        <img src={screenshots.month} alt={rich.screenshotAltTelegram} loading="lazy" className="manicure-telegram-image" />
        <a className="business-secondary" href="/pro/create-account">{t.ctaButton}</a>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.dayTitle}</h2></div>
        <ul className="business-seo-list">{details.dayItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.trustTitle}</h2></div>
        <div className="hair-card-grid">
          {rich.trustCards.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>

      <section className="business-feature-section niche-showcase-section">
        <div className="niche-showcase-copy">
          <div className="business-section-head"><h2>{nicheCards[nicheKey][language].shortTitle}</h2><p>{nicheCards[nicheKey][language].description}</p></div>
          <ul className="business-seo-list">{details.fitItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <article className="manicure-service-card niche-showcase-card"><img src={screenshots.week} alt={rich.screenshotAltServices} loading="lazy" /><strong>{details.fitSample}</strong></article>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.seoBlockTitle}</h2></div>
        <div className="hair-seo-text">
          {content.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ul className="business-seo-list">{rich.valueItems.concat(rich.calendarItems).map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.otherTitle}</h2></div>
        <div className="niche-links-grid">
          {otherKeys.map((key) => {
            const card = nicheCards[key][language];
            return (
              <a className="niche-link-card" href={getLocalizedPath(language, `/${getNicheSlug(language, key)}`)} key={key}>
                <span className="niche-link-icon" aria-hidden="true">
                  <BusinessIcon name={key} className="niche-link-icon-svg" />
                </span>
                <h3>{card.shortTitle}</h3>
                <p>{card.description}</p>
                <span className="niche-link-arrow" aria-hidden="true">→</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{rich.faqTitle}</h2></div>
        <div className="business-faq-list">
          {faq.map((item) => <details key={item.q} className="business-faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}
        </div>
      </section>

      <section className="business-final-section">
        <h2>{rich.finalTitle}</h2>
        <p>{rich.finalText}</p>
        <a className="business-primary" href="/pro/create-account">{t.ctaButton}</a>
        <small className="hair-cta-caption">{rich.ctaHint}</small>
        <small>{rich.finalMicrocopy}</small>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footerText}</span>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href={getLocalizedPath(language, "/pricing")}>{footerLabels.pricing}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
          <a href={getLocalizedPath(language, "/refund-policy")}>{footerLabels.refund}</a>
          <a href={getLocalizedPath(language, "/contact")}>{footerLabels.contact}</a>
          <a href="mailto:adm@timviz.com">adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}

export default async function LocalizedNichePage({ params }: LocalizedSeoPageProps) {
  const { lang, niche } = await params;
  const nicheKey = isSiteLanguage(lang) ? getNicheKeyBySlug(lang, niche) : null;
  const featurePage = isFeatureSlug(niche) ? forBusinessFeatureBySlug[niche] : null;

  if (!isSiteLanguage(lang) || (!nicheKey && !featurePage)) {
    notFound();
  }

  const language = lang as SiteLanguage;
  if (nicheKey) {
    return <RichLocalizedNicheLanding language={language} nicheKey={nicheKey} />;
  }

  const t = pageCopy[language];
  const footerLabels = publicFooterLabels[language];
  const content = getFeaturePageCopy(featurePage!, language);

  return (
    <main className="niche-page">
      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.forBusiness}>
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href="/pro/login">Pro</a>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="niche-page-hero">
        <span className="niche-page-hero-icon"><BusinessIcon name="default" className="niche-page-hero-icon-svg" /></span>
        <h1>{content.h1}</h1>
        <p>{content.lead}</p>
      </section>

      <section className="niche-page-content">
        {content.body.map((paragraph: string) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="niche-page-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <a className="business-primary" href="/pro/create-account">{t.ctaButton}</a>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footerText}</span>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href={getLocalizedPath(language, "/pricing")}>{footerLabels.pricing}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
          <a href={getLocalizedPath(language, "/refund-policy")}>{footerLabels.refund}</a>
          <a href={getLocalizedPath(language, "/contact")}>{footerLabels.contact}</a>
          <a href="mailto:adm@timviz.com">adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}

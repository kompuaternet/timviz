"use client";

import { useEffect, useMemo, useState } from "react";
import { timvizMasterAppStoreUrl } from "../../lib/mobile-apps";
import { getNicheSlug } from "../../lib/niche-pages";
import { getLocalizedPath, isSiteLanguage, publicFooterLabels, type SiteLanguage, withEnglishFallback } from "../../lib/site-language";
import BrandLogo from "../BrandLogo";
import BusinessIcon from "../BusinessIcon";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import NicheLinksSection from "../NicheLinksSection";
import PublicHeaderAuthMenu from "../PublicHeaderAuthMenu";

type LandingLanguage = SiteLanguage;

type LocalCopy = {
  logo: string;
  login: string;
  clientLogin: string;
  create: string;
  menu: string;
  clients: string;
  catalog: string;
  business: string;
  businessLogin: string;
  heroBadge: string;
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
  proof: string;
  screenshotAlt: string;
  whyTitle: string;
  whyCards: Array<{ title: string; text: string }>;
  onlineBookingTitle: string;
  onlineBookingText: string;
  betterThanMessengersTitle: string;
  betterThanMessengers: string[];
  middleCtaTitle: string;
  middleCtaText: string;
  middleCtaButton: string;
  uiTitle: string;
  uiText: string;
  screenLabels: string[];
  stepsTitle: string;
  steps: Array<{ title: string; text: string }>;
  nichesTitle: string;
  niches: Array<{ title: string; text: string }>;
  compareTitle: string;
  compareWithout: string[];
  compareWith: string[];
  telegramTitle: string;
  telegramText: string;
  telegramCta: string;
  faqTitle: string;
  faqItems: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  finalHint: string;
  appStoreCta: string;
  appStoreNote: string;
  capabilitiesTitle: string;
  capabilitiesSubtitle: string;
  usefulForProsTitle: string;
  footer: string;
  privacy: string;
  terms: string;
  nichesSubtitle: string;
  mastersColumn: string;
  nicheLinksTitle: string;
};

const copy: Record<LandingLanguage, LocalCopy> = withEnglishFallback<LocalCopy>({
  uk: {
    logo: "timviz",
    login: "Увійти",
    clientLogin: "Вхід для клієнта",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    catalog: "Пошук профілів",
    business: "Для бізнесу",
    businessLogin: "Увійти в кабінет",
    heroBadge: "SaaS-сервіс для майстрів і салонів",
    heroTitle: "Онлайн-запис клієнтів для майстрів і салонів",
    heroText:
      "Приймайте записи онлайн, ведіть календар, керуйте послугами та отримуйте сповіщення в Telegram.",
    primaryCta: "Почати безкоштовно",
    secondaryCta: "Подивитися можливості",
    proof: "Без складних налаштувань • запуск за кілька хвилин",
    screenshotAlt: "Інтерфейс Timviz для бізнесу",
    whyTitle: "Чому майстри переходять на Timviz",
    whyCards: [
      { title: "Менше дзвінків", text: "Клієнти самі обирають послугу, день і час." },
      { title: "Менше плутанини", text: "Усі записи видно в одному календарі." },
      {
        title: "Більше контролю",
        text: "Послуги, ціни, графік і клієнти зібрані в одному кабінеті."
      },
      { title: "Швидкі сповіщення", text: "Отримуйте важливі події в Telegram." }
    ],
    onlineBookingTitle: "Що таке онлайн-запис клієнтів",
    onlineBookingText:
      "Онлайн-запис клієнтів — це спосіб приймати заявки без дзвінків і переписок. Клієнт обирає послугу, день і час, а запис автоматично з'являється в календарі записів майстра. Timviz працює як програма для запису клієнтів і сервіс онлайн-запису: допомагає вести графік роботи майстра, керувати послугами та цінами, а також отримувати Telegram-сповіщення про записи.",
    betterThanMessengersTitle: "Чому це краще, ніж записи в месенджерах",
    betterThanMessengers: [
      "клієнт сам обирає вільний час",
      "майстер бачить усі записи в календарі",
      "менше помилок і накладок",
      "послуги, ціни й тривалість уже вказані",
      "можна підключити Telegram-сповіщення",
      "простіше вести постійних клієнтів"
    ],
    middleCtaTitle: "Готові приймати записи онлайн?",
    middleCtaText: "Додайте послуги, графік роботи й почніть отримувати записи без зайвих переписок.",
    middleCtaButton: "Створити профіль компанії",
    uiTitle: "Покажіть клієнтам тільки доступний час",
    uiText: "Покажіть клієнтам тільки доступний час, а самі керуйте записами з календаря.",
    screenLabels: [
      "Денний календар записів",
      "Тижневий розклад",
      "Місячний огляд",
      "Графік роботи"
    ],
    stepsTitle: "Як це працює",
    steps: [
      {
        title: "Створіть профіль",
        text: "Додайте назву бізнесу, категорію та формат роботи."
      },
      {
        title: "Налаштуйте послуги і графік",
        text: "Вкажіть ціни, тривалість і робочі дні."
      },
      {
        title: "Приймайте записи",
        text: "Клієнти записуються онлайн, а ви бачите все в календарі."
      }
    ],
    nichesTitle: "Для кого підходить Timviz",
    niches: [
      { title: "Майстри манікюру", text: "Онлайн-запис, послуги, ціни, тривалість процедур і повторні візити в одному календарі." },
      { title: "Перукарі", text: "Календар записів для стрижок, фарбувань і складних послуг різної тривалості." },
      { title: "Барбери", text: "Щільний графік, швидкі записи й нагадування клієнтам без зайвих дзвінків." },
      { title: "Косметологи", text: "Зручний запис на консультації, процедури та повторні візити." },
      { title: "Масажисти", text: "Керування сеансами різної тривалості, вільними вікнами й постійними клієнтами." },
      { title: "Салони краси", text: "Онлайн-запис для команди майстрів, послуг, графіків і клієнтів салону." },
      { title: "Брови та вії", text: "Запис клієнтів онлайн, ціни, статуси візитів і нагадування в Telegram." },
      { title: "Студії депіляції", text: "Чіткий розклад процедур, онлайн-запис і керування клієнтами." },
      { title: "Візажисти", text: "Запис на макіяж, пробні образи, весільні послуги та виїзні записи." },
      { title: "Репетитори", text: "Онлайн-запис на заняття, розклад уроків і нагадування учням." },
      { title: "Тренери", text: "Запис на персональні тренування, консультації та вільні вікна." },
      { title: "Лікарі та приватні спеціалісти", text: "Онлайн-запис на консультації та прийоми зі зручним календарем." },
      { title: "Автосервіси та сервісні послуги", text: "Запис клієнтів на послуги, діагностику, ремонт і обслуговування." }
    ],
    compareTitle: "Без Timviz і з Timviz",
    compareWithout: [
      "записи в месенджерах",
      "клієнти губляться",
      "важко бачити вільний час",
      "ціни і послуги в різних місцях"
    ],
    compareWith: [
      "онлайн-запис 24/7",
      "календар записів",
      "послуги з ціною і тривалістю",
      "Telegram-сповіщення"
    ],
    telegramTitle: "Записи і сповіщення в Telegram",
    telegramText:
      "Підключіть Telegram, щоб отримувати нові записи, підтвердження, нагадування та звернення клієнтів без зайвих панелей.",
    telegramCta: "Підключити після реєстрації",
    faqTitle: "Поширені запитання",
    faqItems: [
      { q: "Чим Timviz відрізняється від запису через Telegram або Instagram?", a: "Timviz дає структурований календар записів, послуги з цінами й тривалістю та менше ручної роботи, ніж запис у чатах." },
      { q: "Чи можна використовувати Timviz одному майстру?", a: "Так, платформа підходить одному спеціалісту і допомагає вести онлайн-запис для майстрів без адміністратора." },
      { q: "Чи підходить Timviz для салону з кількома майстрами?", a: "Так, це CRM для салону, де можна вести графіки, послуги та клієнтів команди в одному кабінеті." },
      { q: "Чи можна вказати ціну і тривалість послуги?", a: "Так, ви налаштовуєте ціну, тривалість і порядок послуг у кілька кліків." },
      { q: "Як працює календар записів?", a: "Запис клієнтів онлайн автоматично потрапляє в календар, де видно вільний час і завантаження за день, тиждень або місяць." },
      { q: "Чи можна отримувати сповіщення в Telegram?", a: "Так, Timviz надсилає Telegram-сповіщення про нові записи, зміни та підтвердження." },
      { q: "Чи потрібен окремий сайт для онлайн-запису?", a: "Ні, достатньо профілю Timviz і публічного посилання на онлайн-запис для салону або майстра." },
      { q: "Чи можна почати безкоштовно?", a: "Так, ви можете створити профіль компанії й запустити сервіс запису клієнтів безкоштовно." }
    ],
    finalTitle: "Запустіть онлайн-запис уже сьогодні",
    finalText:
      "Створіть профіль, додайте послуги і налаштуйте графік. Timviz допоможе швидко перейти від хаосу в месенджерах до зручного календаря записів.",
    finalHint: "Це займе кілька хвилин",
    appStoreCta: "Завантажити Timviz Master",
    appStoreNote: "Доступно в App Store для iPhone",
    capabilitiesTitle: "Можливості Timviz",
    capabilitiesSubtitle: "Усі інструменти для запису клієнтів, календаря та керування послугами в одному кабінеті.",
    usefulForProsTitle: "Корисно для майстрів",
    footer: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    privacy: "Політика конфіденційності",
    terms: "Умови використання"
    ,
    nichesSubtitle: "Timviz підходить усім, хто працює за попереднім записом: майстрам, салонам, студіям і приватним спеціалістам.",
    mastersColumn: "Для майстрів",
    nicheLinksTitle: "Для кого Timviz"
  },
  ru: {
    logo: "timviz",
    login: "Войти",
    clientLogin: "Вход для клиента",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    catalog: "Поиск профилей",
    business: "Для бизнеса",
    businessLogin: "Войти в кабинет",
    heroBadge: "SaaS-сервис для мастеров и салонов",
    heroTitle: "Онлайн-запись клиентов для мастеров и салонов",
    heroText:
      "Принимайте записи онлайн, ведите календарь, управляйте услугами и получайте уведомления в Telegram.",
    primaryCta: "Начать бесплатно",
    secondaryCta: "Посмотреть возможности",
    proof: "Без сложных настроек • запуск за несколько минут",
    screenshotAlt: "Интерфейс Timviz для бизнеса",
    whyTitle: "Почему мастера переходят на Timviz",
    whyCards: [
      { title: "Меньше звонков", text: "Клиенты сами выбирают услугу, день и время." },
      { title: "Меньше путаницы", text: "Все записи видны в одном календаре." },
      { title: "Больше контроля", text: "Услуги, цены, график и клиенты собраны в одном кабинете." },
      { title: "Быстрые уведомления", text: "Получайте важные события в Telegram." }
    ],
    onlineBookingTitle: "Что такое онлайн-запись клиентов",
    onlineBookingText:
      "Онлайн-запись клиентов — это способ принимать заявки без звонков и переписок. Клиент выбирает услугу, день и время, а запись автоматически появляется в календаре записей мастера. Timviz работает как программа для записи клиентов и сервис онлайн-записи: помогает вести график работы мастера, управлять услугами и ценами, а также получать Telegram-уведомления о записях.",
    betterThanMessengersTitle: "Почему это лучше, чем записи в мессенджерах",
    betterThanMessengers: [
      "клиент сам выбирает свободное время",
      "мастер видит все записи в календаре",
      "меньше ошибок и накладок",
      "услуги, цены и длительность уже указаны",
      "можно подключить Telegram-уведомления",
      "проще вести постоянных клиентов"
    ],
    middleCtaTitle: "Готовы принимать записи онлайн?",
    middleCtaText: "Добавьте услуги, график работы и начните получать записи без лишних переписок.",
    middleCtaButton: "Создать профиль компании",
    uiTitle: "Покажите клиентам только доступное время",
    uiText: "Покажите клиентам только доступное время, а сами управляйте записями из календаря.",
    screenLabels: ["Дневной календарь записей", "Недельное расписание", "Месячный обзор", "График работы"],
    stepsTitle: "Как это работает",
    steps: [
      { title: "Создайте профиль", text: "Добавьте название бизнеса, категорию и формат работы." },
      { title: "Настройте услуги и график", text: "Укажите цены, длительность и рабочие дни." },
      { title: "Принимайте записи", text: "Клиенты записываются онлайн, а вы видите всё в календаре." }
    ],
    nichesTitle: "Для кого подходит Timviz",
    niches: [
      { title: "Мастера маникюра", text: "Онлайн-запись, услуги, цены, длительность процедур и повторные визиты в одном календаре." },
      { title: "Парикмахеры", text: "Календарь записей для стрижек, окрашиваний и сложных услуг разной длительности." },
      { title: "Барберы", text: "Плотный график, быстрые записи и напоминания клиентам без лишних звонков." },
      { title: "Косметологи", text: "Удобная запись на консультации, процедуры и повторные визиты." },
      { title: "Массажисты", text: "Управление сеансами разной длительности, свободными окнами и постоянными клиентами." },
      { title: "Салоны красоты", text: "Онлайн-запись для команды мастеров, услуг, графиков и клиентов салона." },
      { title: "Брови и ресницы", text: "Запись клиентов онлайн, цены, статусы визитов и напоминания в Telegram." },
      { title: "Студии депиляции", text: "Чёткое расписание процедур, онлайн-запись и управление клиентами." },
      { title: "Визажисты", text: "Запись на макияж, пробные образы, свадебные услуги и выездные записи." },
      { title: "Репетиторы", text: "Онлайн-запись на занятия, расписание уроков и напоминания ученикам." },
      { title: "Тренеры", text: "Запись на персональные тренировки, консультации и свободные окна." },
      { title: "Врачи и частные специалисты", text: "Онлайн-запись на консультации и приёмы с удобным календарём." },
      { title: "Автосервисы и сервисные услуги", text: "Запись клиентов на услуги, диагностику, ремонт и обслуживание." }
    ],
    compareTitle: "Без Timviz и с Timviz",
    compareWithout: [
      "записи в мессенджерах",
      "клиенты теряются",
      "сложно видеть свободное время",
      "цены и услуги в разных местах"
    ],
    compareWith: ["онлайн-запись 24/7", "календарь записей", "услуги с ценой и длительностью", "Telegram-уведомления"],
    telegramTitle: "Записи и уведомления в Telegram",
    telegramText:
      "Подключите Telegram, чтобы получать новые записи, подтверждения, напоминания и обращения клиентов без лишних панелей.",
    telegramCta: "Подключить после регистрации",
    faqTitle: "Частые вопросы",
    faqItems: [
      { q: "Чем Timviz отличается от записи через Telegram или Instagram?", a: "Timviz дает структурированный календарь записей, услуги с ценами и длительностью, поэтому ручной работы и ошибок меньше, чем при записи в чатах." },
      { q: "Можно ли использовать Timviz одному мастеру?", a: "Да, платформа подходит одному специалисту и помогает вести онлайн-запись для мастеров без администратора." },
      { q: "Подходит ли Timviz для салона с несколькими мастерами?", a: "Да, это CRM для салона, где можно вести графики, услуги и клиентов команды в одном кабинете." },
      { q: "Можно ли указать цену и длительность услуги?", a: "Да, вы настраиваете цену, длительность и порядок услуг в несколько кликов." },
      { q: "Как работает календарь записей?", a: "Запись клиентов онлайн автоматически попадает в календарь, где видно свободное время и загрузку на день, неделю или месяц." },
      { q: "Можно ли получать уведомления в Telegram?", a: "Да, Timviz отправляет Telegram-уведомления о новых записях, изменениях и подтверждениях." },
      { q: "Нужен ли отдельный сайт для онлайн-записи?", a: "Нет, достаточно профиля Timviz и публичной ссылки на онлайн-запись для салона или мастера." },
      { q: "Можно ли начать бесплатно?", a: "Да, вы можете создать профиль компании и запустить сервис записи клиентов бесплатно." }
    ],
    finalTitle: "Запустите онлайн-запись уже сегодня",
    finalText:
      "Создайте профиль, добавьте услуги и настройте график. Timviz поможет быстро перейти от хаоса в мессенджерах к удобному календарю записей.",
    finalHint: "Это займет несколько минут",
    appStoreCta: "Скачать Timviz Master",
    appStoreNote: "Доступно в App Store для iPhone",
    capabilitiesTitle: "Возможности Timviz",
    capabilitiesSubtitle: "Все инструменты для записи клиентов, календаря и управления услугами в одном кабинете.",
    usefulForProsTitle: "Полезно для мастеров",
    footer: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования"
    ,
    nichesSubtitle: "Timviz подходит всем, кто работает по предварительной записи: мастерам, салонам, студиям и частным специалистам.",
    mastersColumn: "Для мастеров",
    nicheLinksTitle: "Для кого Timviz"
  },
  en: {
    logo: "timviz",
    login: "Log in",
    clientLogin: "Client sign in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    catalog: "Search profiles",
    business: "For business",
    businessLogin: "Open dashboard",
    heroBadge: "SaaS for professionals and salons",
    heroTitle: "Online client booking for professionals and salons",
    heroText:
      "Accept bookings online, manage your calendar, control services and receive Telegram notifications.",
    primaryCta: "Start for free",
    secondaryCta: "See features",
    proof: "No complex setup • launch in minutes",
    screenshotAlt: "Timviz business interface",
    whyTitle: "Why professionals switch to Timviz",
    whyCards: [
      { title: "Fewer calls", text: "Clients choose service, day and time on their own." },
      { title: "Less confusion", text: "All bookings are visible in one calendar." },
      { title: "More control", text: "Services, prices, schedule and clients in one dashboard." },
      { title: "Fast alerts", text: "Get important events in Telegram." }
    ],
    onlineBookingTitle: "What is online client booking",
    onlineBookingText:
      "Online client booking lets people choose a service, day and time without calls or endless messages. The appointment appears instantly in your booking calendar. Timviz works as booking software for professionals and salons: manage service pricing, duration, team schedule and Telegram booking notifications in one place.",
    betterThanMessengersTitle: "Why this is better than messenger-based booking",
    betterThanMessengers: [
      "clients choose available time on their own",
      "professionals see all appointments in one calendar",
      "fewer scheduling errors and overlaps",
      "services, prices and durations are predefined",
      "Telegram notifications can be connected",
      "easier repeat-client management"
    ],
    middleCtaTitle: "Ready to accept online bookings?",
    middleCtaText: "Add services, set working hours and start receiving bookings without manual back-and-forth messages.",
    middleCtaButton: "Create company profile",
    uiTitle: "Show only available time to clients",
    uiText: "Show clients only available slots while you manage everything from one calendar.",
    screenLabels: ["Daily booking calendar", "Weekly schedule", "Monthly overview", "Working schedule"],
    stepsTitle: "How it works",
    steps: [
      { title: "Create your profile", text: "Add your business name, category and work format." },
      { title: "Set services and schedule", text: "Define prices, duration and working days." },
      { title: "Accept bookings", text: "Clients book online while you see everything in the calendar." }
    ],
    nichesTitle: "Who Timviz is suitable for",
    niches: [
      { title: "Nail artists", text: "Online booking, service pricing, duration setup and repeat visits in one calendar." },
      { title: "Hairdressers", text: "Booking calendar for haircuts, coloring and complex services with different duration." },
      { title: "Barbers", text: "High-load schedule, fast bookings and reminders without extra calls." },
      { title: "Cosmetologists", text: "Convenient booking for consultations, procedures and repeat visits." },
      { title: "Massage therapists", text: "Manage sessions of different duration, free slots and repeat clients." },
      { title: "Beauty salons", text: "Online booking for team schedules, services and salon clients." },
      { title: "Brows & lashes", text: "Client booking online, service prices, visit statuses and Telegram reminders." },
      { title: "Depilation studios", text: "Clear procedure schedule, online bookings and client management." },
      { title: "Makeup artists", text: "Bookings for makeup sessions, trials, wedding services and on-site visits." },
      { title: "Tutors", text: "Online booking for lessons, class schedule and student reminders." },
      { title: "Coaches", text: "Bookings for personal training, consultations and available slots." },
      { title: "Doctors and private specialists", text: "Online booking for consultations and appointments with a clear calendar." },
      { title: "Car service and field services", text: "Client booking for diagnostics, repair, maintenance and service visits." }
    ],
    compareTitle: "Without Timviz vs With Timviz",
    compareWithout: [
      "bookings in messengers",
      "lost clients",
      "hard to see free time",
      "prices and services in different places"
    ],
    compareWith: ["24/7 online booking", "booking calendar", "services with price and duration", "Telegram notifications"],
    telegramTitle: "Bookings and alerts in Telegram",
    telegramText:
      "Connect Telegram to receive new bookings, confirmations, reminders and client requests without extra admin panels.",
    telegramCta: "Connect after sign up",
    faqTitle: "FAQ",
    faqItems: [
      { q: "What is Timviz?", a: "Timviz combines online client booking, calendar management and services in one dashboard." },
      { q: "Is Timviz suitable for solo professionals?", a: "Yes, it works great for solo specialists and growing teams." },
      { q: "Can I use Timviz for a salon?", a: "Yes, you can manage multiple staff members, schedules and bookings in one account." },
      { q: "How do clients book online?", a: "Share your booking link: clients pick a service, day and time and the visit appears in your calendar." },
      { q: "Can I customize services, prices and duration?", a: "Yes, all service parameters can be changed at any time." },
      { q: "Are Telegram notifications available?", a: "Yes, Timviz sends key booking events directly to Telegram." },
      { q: "Can I start for free?", a: "Yes, create your profile and start quickly." },
      { q: "Do I need a separate website?", a: "No, your Timviz business profile and booking link are enough to start." }
    ],
    finalTitle: "Start accepting bookings today",
    finalText:
      "Create your profile, add services and configure your schedule. Timviz helps you move from messenger chaos to a clear booking calendar.",
    finalHint: "It takes just a few minutes",
    appStoreCta: "Download Timviz Master",
    appStoreNote: "Available on the App Store for iPhone",
    capabilitiesTitle: "Timviz capabilities",
    capabilitiesSubtitle: "All tools for client booking, calendar planning and service management in one workspace.",
    usefulForProsTitle: "Useful for professionals",
    footer: "Timviz for business · online client booking and service management",
    privacy: "Privacy policy",
    terms: "Terms of use"
    ,
    nichesSubtitle: "Timviz is built for everyone who works by appointment: professionals, salons, studios and private specialists.",
    mastersColumn: "For professionals",
    nicheLinksTitle: "Who Timviz is for"
  }
});

Object.assign(copy, {
  fr: {
    logo: "timviz",
    login: "Connexion",
    clientLogin: "Connexion client",
    create: "Créer un profil d’entreprise",
    menu: "Menu",
    clients: "Pour les clients",
    catalog: "Recherche de profils",
    business: "Pour les entreprises",
    businessLogin: "Ouvrir le tableau de bord",
    heroBadge: "SaaS pour professionnels et salons",
    heroTitle: "Réservation client en ligne pour professionnels et salons",
    heroText: "Acceptez les réservations en ligne, gérez votre calendrier, vos services et recevez les notifications Telegram.",
    primaryCta: "Commencer gratuitement",
    secondaryCta: "Voir les fonctionnalités",
    proof: "Sans configuration complexe • lancement en quelques minutes",
    screenshotAlt: "Interface Timviz pour entreprises",
    whyTitle: "Pourquoi les professionnels passent à Timviz",
    whyCards: [
      { title: "Moins d’appels", text: "Les clients choisissent eux-mêmes service, jour et heure." },
      { title: "Moins de confusion", text: "Toutes les réservations sont visibles dans un seul calendrier." },
      { title: "Plus de contrôle", text: "Services, prix, horaires et clients dans un seul espace." },
      { title: "Alertes rapides", text: "Recevez les événements importants dans Telegram." }
    ],
    onlineBookingTitle: "Qu’est-ce que la réservation client en ligne",
    onlineBookingText: "La réservation client en ligne permet aux clients de choisir un service, un jour et une heure sans appels ni messages interminables. Le rendez-vous apparaît immédiatement dans votre calendrier. Timviz fonctionne comme un logiciel de réservation pour professionnels et salons : prix, durée, planning d’équipe et notifications Telegram au même endroit.",
    betterThanMessengersTitle: "Pourquoi c’est mieux que les réservations par messagerie",
    betterThanMessengers: ["le client choisit lui-même un créneau libre", "le professionnel voit tous les rendez-vous dans un calendrier", "moins d’erreurs et de chevauchements", "services, prix et durées déjà définis", "notifications Telegram disponibles", "gestion plus simple des clients réguliers"],
    middleCtaTitle: "Prêt à accepter les réservations en ligne ?",
    middleCtaText: "Ajoutez vos services, définissez vos horaires et recevez des réservations sans échanges manuels.",
    middleCtaButton: "Créer un profil d’entreprise",
    uiTitle: "Montrez uniquement les créneaux disponibles",
    uiText: "Les clients voient les créneaux libres pendant que vous gérez tout depuis un seul calendrier.",
    screenLabels: ["Calendrier quotidien", "Planning hebdomadaire", "Vue mensuelle", "Horaires de travail"],
    stepsTitle: "Comment ça marche",
    steps: [
      { title: "Créez votre profil", text: "Ajoutez le nom, la catégorie et le format de votre entreprise." },
      { title: "Configurez services et horaires", text: "Définissez prix, durées et jours de travail." },
      { title: "Acceptez les réservations", text: "Les clients réservent en ligne et vous voyez tout dans le calendrier." }
    ],
    nichesTitle: "Pour qui Timviz est adapté",
    niches: [
      { title: "Prothésistes ongulaires", text: "Réservation, prix, durées et visites répétées dans un calendrier." },
      { title: "Coiffeurs", text: "Calendrier pour coupes, colorations et services complexes." },
      { title: "Barbiers", text: "Planning chargé, réservations rapides et rappels sans appels." },
      { title: "Esthéticiennes", text: "Réservations pour consultations, soins et visites répétées." },
      { title: "Masseurs", text: "Gérez les séances, créneaux libres et clients réguliers." },
      { title: "Instituts de beauté", text: "Réservation en ligne pour équipes, services et clients." },
      { title: "Sourcils et cils", text: "Prix, statuts de visite et rappels Telegram." },
      { title: "Studios d’épilation", text: "Planning clair, réservations et gestion client." },
      { title: "Maquilleurs", text: "Réservations pour essais, mariages et déplacements." },
      { title: "Tuteurs", text: "Réservation de cours, planning et rappels." },
      { title: "Coach sportifs", text: "Créneaux pour entraînements et consultations." },
      { title: "Médecins privés", text: "Consultations et rendez-vous dans un calendrier clair." },
      { title: "Services auto et terrain", text: "Réservations pour diagnostic, réparation et maintenance." }
    ],
    compareTitle: "Sans Timviz vs avec Timviz",
    compareWithout: ["réservations dans les messageries", "clients perdus", "créneaux libres difficiles à voir", "prix et services dispersés"],
    compareWith: ["réservation en ligne 24/7", "calendrier de réservations", "services avec prix et durée", "notifications Telegram"],
    telegramTitle: "Réservations et alertes dans Telegram",
    telegramText: "Connectez Telegram pour recevoir nouvelles réservations, confirmations, rappels et demandes clients sans panneaux supplémentaires.",
    telegramCta: "Connecter après l’inscription",
    faqTitle: "FAQ",
    faqItems: [
      { q: "Qu’est-ce que Timviz ?", a: "Timviz réunit réservation en ligne, calendrier et services dans un seul tableau de bord." },
      { q: "Timviz convient-il aux indépendants ?", a: "Oui, il fonctionne pour les spécialistes solo et les équipes en croissance." },
      { q: "Puis-je l’utiliser pour un salon ?", a: "Oui, vous gérez équipe, horaires et réservations dans un compte." },
      { q: "Comment les clients réservent-ils ?", a: "Partagez votre lien : ils choisissent service, jour et heure." },
      { q: "Puis-je modifier prix et durées ?", a: "Oui, tous les paramètres des services se changent à tout moment." },
      { q: "Les notifications Telegram existent-elles ?", a: "Oui, Timviz envoie les événements clés directement dans Telegram." },
      { q: "Puis-je commencer gratuitement ?", a: "Oui, créez votre profil et démarrez rapidement." },
      { q: "Ai-je besoin d’un site séparé ?", a: "Non, votre profil Timviz et le lien de réservation suffisent." }
    ],
    finalTitle: "Commencez à recevoir des réservations aujourd’hui",
    finalText: "Créez votre profil, ajoutez vos services et configurez votre planning. Timviz vous aide à passer du chaos des messages à un calendrier clair.",
    finalHint: "Cela prend quelques minutes",
    appStoreCta: "Télécharger Timviz Master",
    appStoreNote: "Disponible sur l’App Store pour iPhone",
    capabilitiesTitle: "Fonctionnalités Timviz",
    capabilitiesSubtitle: "Tous les outils pour la réservation, le calendrier et la gestion des services dans un seul espace.",
    usefulForProsTitle: "Utile pour les professionnels",
    footer: "Timviz pour entreprises · réservation client en ligne et gestion des services",
    privacy: "Politique de confidentialité",
    terms: "Conditions d’utilisation",
    nichesSubtitle: "Timviz convient à tous ceux qui travaillent sur rendez-vous : professionnels, salons, studios et spécialistes privés.",
    mastersColumn: "Pour les professionnels",
    nicheLinksTitle: "Pour qui est Timviz"
  },
  pl: {
    logo: "timviz",
    login: "Zaloguj się",
    clientLogin: "Logowanie klienta",
    create: "Utwórz profil firmy",
    menu: "Menu",
    clients: "Dla klientów",
    catalog: "Wyszukiwanie profili",
    business: "Dla biznesu",
    businessLogin: "Otwórz panel",
    heroBadge: "SaaS dla specjalistów i salonów",
    heroTitle: "Rezerwacje klientów online dla specjalistów i salonów",
    heroText: "Przyjmuj rezerwacje online, prowadź kalendarz, zarządzaj usługami i odbieraj powiadomienia Telegram.",
    primaryCta: "Zacznij za darmo",
    secondaryCta: "Zobacz funkcje",
    proof: "Bez skomplikowanej konfiguracji • start w kilka minut",
    screenshotAlt: "Interfejs biznesowy Timviz",
    whyTitle: "Dlaczego specjaliści przechodzą na Timviz",
    whyCards: [
      { title: "Mniej telefonów", text: "Klienci sami wybierają usługę, dzień i godzinę." },
      { title: "Mniej chaosu", text: "Wszystkie rezerwacje są w jednym kalendarzu." },
      { title: "Więcej kontroli", text: "Usługi, ceny, grafik i klienci w jednym panelu." },
      { title: "Szybkie alerty", text: "Ważne zdarzenia trafiają do Telegrama." }
    ],
    onlineBookingTitle: "Czym są rezerwacje klientów online",
    onlineBookingText: "Rezerwacje online pozwalają klientom wybrać usługę, dzień i godzinę bez telefonów i długich wiadomości. Wizyta od razu pojawia się w kalendarzu. Timviz działa jako program do rezerwacji dla specjalistów i salonów: ceny, czas usług, grafik zespołu i powiadomienia Telegram w jednym miejscu.",
    betterThanMessengersTitle: "Dlaczego to lepsze niż zapisy w komunikatorach",
    betterThanMessengers: ["klient sam wybiera wolny termin", "specjalista widzi wizyty w kalendarzu", "mniej błędów i nakładek", "usługi, ceny i czas są ustawione", "można podłączyć Telegram", "łatwiej obsługiwać stałych klientów"],
    middleCtaTitle: "Gotowy na rezerwacje online?",
    middleCtaText: "Dodaj usługi, ustaw godziny pracy i przyjmuj rezerwacje bez ręcznego ustalania.",
    middleCtaButton: "Utwórz profil firmy",
    uiTitle: "Pokaż klientom tylko dostępny czas",
    uiText: "Klienci widzą wolne terminy, a Ty zarządzasz wszystkim z jednego kalendarza.",
    screenLabels: ["Kalendarz dnia", "Grafik tygodnia", "Widok miesiąca", "Godziny pracy"],
    stepsTitle: "Jak to działa",
    steps: [
      { title: "Utwórz profil", text: "Dodaj nazwę firmy, kategorię i format pracy." },
      { title: "Ustaw usługi i grafik", text: "Określ ceny, czas trwania i dni pracy." },
      { title: "Przyjmuj rezerwacje", text: "Klienci rezerwują online, a Ty widzisz wszystko w kalendarzu." }
    ],
    nichesTitle: "Dla kogo jest Timviz",
    niches: [
      { title: "Stylistki paznokci", text: "Rezerwacje, cennik, czas usług i powroty w jednym kalendarzu." },
      { title: "Fryzjerzy", text: "Kalendarz strzyżeń, koloryzacji i dłuższych usług." },
      { title: "Barberzy", text: "Gęsty grafik, szybkie rezerwacje i przypomnienia." },
      { title: "Kosmetolodzy", text: "Rezerwacje konsultacji, zabiegów i wizyt powrotnych." },
      { title: "Masażyści", text: "Sesje różnej długości, wolne okna i stali klienci." },
      { title: "Salony kosmetyczne", text: "Rezerwacje zespołu, usług i klientów salonu." },
      { title: "Brwi i rzęsy", text: "Ceny, statusy wizyt i przypomnienia Telegram." },
      { title: "Studia depilacji", text: "Czytelny grafik zabiegów i obsługa klientów." },
      { title: "Makijażyści", text: "Rezerwacje prób, ślubów i usług z dojazdem." },
      { title: "Korepetytorzy", text: "Lekcje, harmonogram zajęć i przypomnienia." },
      { title: "Trenerzy", text: "Treningi personalne, konsultacje i wolne terminy." },
      { title: "Lekarze prywatni", text: "Konsultacje i wizyty w przejrzystym kalendarzu." },
      { title: "Serwis samochodowy", text: "Rezerwacje diagnostyki, napraw i wizyt serwisowych." }
    ],
    compareTitle: "Bez Timviz vs z Timviz",
    compareWithout: ["zapisy w komunikatorach", "utraceni klienci", "trudno zobaczyć wolny czas", "ceny i usługi w różnych miejscach"],
    compareWith: ["rezerwacje online 24/7", "kalendarz rezerwacji", "usługi z ceną i czasem", "powiadomienia Telegram"],
    telegramTitle: "Rezerwacje i alerty w Telegramie",
    telegramText: "Podłącz Telegram, aby dostawać nowe rezerwacje, potwierdzenia, przypomnienia i prośby klientów.",
    telegramCta: "Podłącz po rejestracji",
    faqTitle: "FAQ",
    faqItems: [
      { q: "Czym jest Timviz?", a: "Timviz łączy rezerwacje online, kalendarz i usługi w jednym panelu." },
      { q: "Czy działa dla specjalistów solo?", a: "Tak, działa dla pojedynczych specjalistów i rosnących zespołów." },
      { q: "Czy mogę używać go w salonie?", a: "Tak, zarządzasz zespołem, grafikami i rezerwacjami w jednym koncie." },
      { q: "Jak klienci rezerwują online?", a: "Udostępniasz link, a klient wybiera usługę, dzień i godzinę." },
      { q: "Czy mogę zmieniać ceny i czas usług?", a: "Tak, parametry usług można zmienić w dowolnym momencie." },
      { q: "Czy są powiadomienia Telegram?", a: "Tak, Timviz wysyła kluczowe zdarzenia prosto do Telegrama." },
      { q: "Czy mogę zacząć za darmo?", a: "Tak, utwórz profil i zacznij szybko." },
      { q: "Czy potrzebuję osobnej strony?", a: "Nie, profil Timviz i link do rezerwacji wystarczą." }
    ],
    finalTitle: "Zacznij przyjmować rezerwacje już dziś",
    finalText: "Utwórz profil, dodaj usługi i skonfiguruj grafik. Timviz pomaga przejść od chaosu wiadomości do jasnego kalendarza.",
    finalHint: "To zajmie kilka minut",
    appStoreCta: "Pobierz Timviz Master",
    appStoreNote: "Dostępne w App Store na iPhone’a",
    capabilitiesTitle: "Możliwości Timviz",
    capabilitiesSubtitle: "Wszystkie narzędzia do rezerwacji, kalendarza i usług w jednym miejscu.",
    usefulForProsTitle: "Przydatne dla specjalistów",
    footer: "Timviz dla biznesu · rezerwacje klientów online i zarządzanie usługami",
    privacy: "Polityka prywatności",
    terms: "Warunki korzystania",
    nichesSubtitle: "Timviz pasuje do wszystkich, którzy pracują na zapisy: specjalistów, salonów, studiów i praktyk prywatnych.",
    mastersColumn: "Dla specjalistów",
    nicheLinksTitle: "Dla kogo jest Timviz"
  },
  cs: {
    logo: "timviz",
    login: "Přihlásit se",
    clientLogin: "Přihlášení klienta",
    create: "Vytvořit profil firmy",
    menu: "Menu",
    clients: "Pro klienty",
    catalog: "Vyhledávání profilů",
    business: "Pro firmy",
    businessLogin: "Otevřít panel",
    heroBadge: "SaaS pro profesionály a salony",
    heroTitle: "Online rezervace klientů pro profesionály a salony",
    heroText: "Přijímejte rezervace online, spravujte kalendář, služby a dostávejte Telegram upozornění.",
    primaryCta: "Začít zdarma",
    secondaryCta: "Zobrazit funkce",
    proof: "Bez složitého nastavení • spuštění za pár minut",
    screenshotAlt: "Business rozhraní Timviz",
    whyTitle: "Proč profesionálové přechází na Timviz",
    whyCards: [
      { title: "Méně hovorů", text: "Klienti si sami vybírají službu, den a čas." },
      { title: "Méně zmatků", text: "Všechny rezervace jsou v jednom kalendáři." },
      { title: "Více kontroly", text: "Služby, ceny, rozvrh i klienti v jednom panelu." },
      { title: "Rychlá upozornění", text: "Důležité události chodí do Telegramu." }
    ],
    onlineBookingTitle: "Co jsou online rezervace klientů",
    onlineBookingText: "Online rezervace klientů umožní vybrat službu, den a čas bez telefonátů a dlouhých zpráv. Rezervace se hned objeví v kalendáři. Timviz funguje jako rezervační software pro profesionály a salony: ceny, délky služeb, týmový rozvrh a Telegram upozornění na jednom místě.",
    betterThanMessengersTitle: "Proč je to lepší než rezervace ve zprávách",
    betterThanMessengers: ["klient si sám vybere volný čas", "profesionál vidí návštěvy v kalendáři", "méně chyb a kolizí", "služby, ceny a délky jsou nastavené", "lze připojit Telegram", "jednodušší práce se stálými klienty"],
    middleCtaTitle: "Jste připraveni přijímat rezervace online?",
    middleCtaText: "Přidejte služby, nastavte pracovní dobu a přijímejte rezervace bez ruční domluvy.",
    middleCtaButton: "Vytvořit profil firmy",
    uiTitle: "Ukažte klientům jen dostupné časy",
    uiText: "Klienti vidí volné termíny a vy vše spravujete z jednoho kalendáře.",
    screenLabels: ["Denní kalendář", "Týdenní rozvrh", "Měsíční přehled", "Pracovní doba"],
    stepsTitle: "Jak to funguje",
    steps: [
      { title: "Vytvořte profil", text: "Přidejte název firmy, kategorii a formát práce." },
      { title: "Nastavte služby a rozvrh", text: "Určete ceny, délky a pracovní dny." },
      { title: "Přijímejte rezervace", text: "Klienti rezervují online a vy vše vidíte v kalendáři." }
    ],
    nichesTitle: "Pro koho je Timviz vhodný",
    niches: [
      { title: "Nehtové specialistky", text: "Rezervace, ceník, délky služeb a opakované návštěvy." },
      { title: "Kadeřníci", text: "Kalendář pro střihy, barvení a delší služby." },
      { title: "Barbeři", text: "Plný rozvrh, rychlé rezervace a připomenutí." },
      { title: "Kosmetologové", text: "Rezervace konzultací, procedur a opakovaných návštěv." },
      { title: "Maséři", text: "Sezení různých délek, volná okna a stálí klienti." },
      { title: "Kosmetické salony", text: "Rezervace týmů, služeb a salonních klientů." },
      { title: "Obočí a řasy", text: "Ceny, stavy návštěv a Telegram připomenutí." },
      { title: "Depilační studia", text: "Jasný rozvrh procedur a správa klientů." },
      { title: "Vizážisté", text: "Rezervace zkoušek, svateb a výjezdů." },
      { title: "Lektoři", text: "Lekce, rozvrh hodin a připomenutí." },
      { title: "Trenéři", text: "Osobní tréninky, konzultace a volné časy." },
      { title: "Soukromí lékaři", text: "Konzultace a návštěvy v přehledném kalendáři." },
      { title: "Autoservis", text: "Rezervace diagnostiky, oprav a servisních návštěv." }
    ],
    compareTitle: "Bez Timviz vs s Timviz",
    compareWithout: ["rezervace ve zprávách", "ztracení klienti", "volný čas není jasný", "ceny a služby na různých místech"],
    compareWith: ["online rezervace 24/7", "rezervační kalendář", "služby s cenou a délkou", "Telegram upozornění"],
    telegramTitle: "Rezervace a upozornění v Telegramu",
    telegramText: "Připojte Telegram a dostávejte nové rezervace, potvrzení, připomenutí a požadavky klientů.",
    telegramCta: "Připojit po registraci",
    faqTitle: "FAQ",
    faqItems: [
      { q: "Co je Timviz?", a: "Timviz spojuje online rezervace, kalendář a služby v jednom panelu." },
      { q: "Hodí se pro jednotlivce?", a: "Ano, funguje pro samostatné specialisty i rostoucí týmy." },
      { q: "Mohu ho použít pro salon?", a: "Ano, spravujete tým, rozvrhy a rezervace v jednom účtu." },
      { q: "Jak klienti rezervují online?", a: "Sdílíte odkaz a klient vybere službu, den a čas." },
      { q: "Lze měnit ceny a délky služeb?", a: "Ano, parametry služeb můžete kdykoliv změnit." },
      { q: "Jsou dostupná Telegram upozornění?", a: "Ano, Timviz posílá klíčové události přímo do Telegramu." },
      { q: "Mohu začít zdarma?", a: "Ano, vytvořte profil a rychle začněte." },
      { q: "Potřebuji vlastní web?", a: "Ne, profil Timviz a rezervační odkaz stačí." }
    ],
    finalTitle: "Začněte přijímat rezervace ještě dnes",
    finalText: "Vytvořte profil, přidejte služby a nastavte rozvrh. Timviz pomáhá přejít od chaosu ve zprávách k jasnému kalendáři.",
    finalHint: "Zabere to pár minut",
    appStoreCta: "Stáhnout Timviz Master",
    appStoreNote: "Dostupné v App Storu pro iPhone",
    capabilitiesTitle: "Možnosti Timviz",
    capabilitiesSubtitle: "Všechny nástroje pro rezervace, kalendář a služby v jednom prostoru.",
    usefulForProsTitle: "Užitečné pro profesionály",
    footer: "Timviz pro firmy · online rezervace klientů a správa služeb",
    privacy: "Zásady ochrany osobních údajů",
    terms: "Podmínky použití",
    nichesSubtitle: "Timviz se hodí pro všechny, kdo pracují na objednávku: profesionály, salony, studia i soukromé specialisty.",
    mastersColumn: "Pro profesionály",
    nicheLinksTitle: "Pro koho je Timviz"
  },
  es: {
    logo: "timviz",
    login: "Iniciar sesión",
    clientLogin: "Acceso de cliente",
    create: "Crear perfil de empresa",
    menu: "Menú",
    clients: "Para clientes",
    catalog: "Búsqueda de perfiles",
    business: "Para negocios",
    businessLogin: "Abrir panel",
    heroBadge: "SaaS para profesionales y salones",
    heroTitle: "Reservas online para profesionales y salones",
    heroText: "Acepta reservas online, gestiona calendario y servicios, y recibe notificaciones Telegram.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Ver funciones",
    proof: "Sin configuración compleja • listo en minutos",
    screenshotAlt: "Interfaz empresarial de Timviz",
    whyTitle: "Por qué los profesionales cambian a Timviz",
    whyCards: [
      { title: "Menos llamadas", text: "Los clientes eligen servicio, día y hora." },
      { title: "Menos confusión", text: "Todas las reservas están en un calendario." },
      { title: "Más control", text: "Servicios, precios, agenda y clientes en un panel." },
      { title: "Alertas rápidas", text: "Recibe eventos importantes en Telegram." }
    ],
    onlineBookingTitle: "Qué son las reservas online",
    onlineBookingText: "Las reservas online permiten elegir servicio, día y hora sin llamadas ni mensajes interminables. La cita aparece al instante en el calendario. Timviz funciona como software de reservas para profesionales y salones: precios, duración, equipo y notificaciones Telegram en un solo lugar.",
    betterThanMessengersTitle: "Por qué es mejor que reservar por mensajes",
    betterThanMessengers: ["el cliente elige un horario libre", "ves todas las citas en el calendario", "menos errores y solapamientos", "servicios, precios y duración ya definidos", "se puede conectar Telegram", "clientes recurrentes más fáciles de gestionar"],
    middleCtaTitle: "¿Listo para aceptar reservas online?",
    middleCtaText: "Añade servicios, configura horarios y recibe reservas sin coordinación manual.",
    middleCtaButton: "Crear perfil de empresa",
    uiTitle: "Muestra solo horarios disponibles",
    uiText: "Los clientes ven horarios libres mientras tú gestionas todo desde un calendario.",
    screenLabels: ["Calendario diario", "Horario semanal", "Vista mensual", "Horario de trabajo"],
    stepsTitle: "Cómo funciona",
    steps: [
      { title: "Crea tu perfil", text: "Añade nombre, categoría y formato de trabajo." },
      { title: "Configura servicios y agenda", text: "Define precios, duración y días laborales." },
      { title: "Acepta reservas", text: "Los clientes reservan online y tú ves todo en el calendario." }
    ],
    nichesTitle: "Para quién es Timviz",
    niches: [
      { title: "Especialistas en uñas", text: "Reservas, precios, duración y visitas recurrentes en un calendario." },
      { title: "Peluqueros", text: "Calendario para cortes, coloraciones y servicios complejos." },
      { title: "Barberos", text: "Agenda intensa, reservas rápidas y recordatorios." },
      { title: "Cosmetólogos", text: "Reservas para consultas, tratamientos y visitas recurrentes." },
      { title: "Masajistas", text: "Sesiones de distinta duración, horarios libres y clientes recurrentes." },
      { title: "Salones de belleza", text: "Reservas online para equipo, servicios y clientes del salón." },
      { title: "Cejas y pestañas", text: "Precios, estados de visita y recordatorios Telegram." },
      { title: "Estudios de depilación", text: "Agenda clara de procedimientos y gestión de clientes." },
      { title: "Maquilladores", text: "Reservas para pruebas, bodas y servicios a domicilio." },
      { title: "Tutores", text: "Reservas de clases, horario y recordatorios." },
      { title: "Entrenadores", text: "Entrenamientos personales, consultas y horarios disponibles." },
      { title: "Médicos privados", text: "Consultas y citas en un calendario claro." },
      { title: "Servicios de auto y campo", text: "Reservas para diagnóstico, reparación y mantenimiento." }
    ],
    compareTitle: "Sin Timviz vs con Timviz",
    compareWithout: ["reservas en mensajes", "clientes perdidos", "horarios libres poco claros", "precios y servicios dispersos"],
    compareWith: ["reservas online 24/7", "calendario de reservas", "servicios con precio y duración", "notificaciones Telegram"],
    telegramTitle: "Reservas y alertas en Telegram",
    telegramText: "Conecta Telegram para recibir nuevas reservas, confirmaciones, recordatorios y solicitudes de clientes.",
    telegramCta: "Conectar después del registro",
    faqTitle: "FAQ",
    faqItems: [
      { q: "¿Qué es Timviz?", a: "Timviz combina reservas online, calendario y servicios en un solo panel." },
      { q: "¿Sirve para profesionales independientes?", a: "Sí, funciona para especialistas individuales y equipos en crecimiento." },
      { q: "¿Puedo usarlo para un salón?", a: "Sí, puedes gestionar equipo, horarios y reservas en una cuenta." },
      { q: "¿Cómo reservan los clientes?", a: "Comparte tu enlace: el cliente elige servicio, día y hora." },
      { q: "¿Puedo cambiar precios y duración?", a: "Sí, todos los parámetros de servicios se pueden cambiar en cualquier momento." },
      { q: "¿Hay notificaciones Telegram?", a: "Sí, Timviz envía eventos clave directamente a Telegram." },
      { q: "¿Puedo empezar gratis?", a: "Sí, crea tu perfil y empieza rápido." },
      { q: "¿Necesito un sitio separado?", a: "No, tu perfil Timviz y el enlace de reserva son suficientes." }
    ],
    finalTitle: "Empieza a recibir reservas hoy",
    finalText: "Crea tu perfil, añade servicios y configura tu agenda. Timviz te ayuda a pasar del caos de mensajes a un calendario claro.",
    finalHint: "Solo toma unos minutos",
    appStoreCta: "Descargar Timviz Master",
    appStoreNote: "Disponible en App Store para iPhone",
    capabilitiesTitle: "Funciones de Timviz",
    capabilitiesSubtitle: "Todas las herramientas para reservas, calendario y servicios en un solo espacio.",
    usefulForProsTitle: "Útil para profesionales",
    footer: "Timviz para negocios · reservas online y gestión de servicios",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    nichesSubtitle: "Timviz sirve para quienes trabajan con cita previa: profesionales, salones, estudios y especialistas privados.",
    mastersColumn: "Para profesionales",
    nicheLinksTitle: "Para quién es Timviz"
  },
  de: {
    logo: "timviz",
    login: "Einloggen",
    clientLogin: "Kundenlogin",
    create: "Firmenprofil erstellen",
    menu: "Menü",
    clients: "Für Kunden",
    catalog: "Profilsuche",
    business: "Für Unternehmen",
    businessLogin: "Dashboard öffnen",
    heroBadge: "SaaS für Profis und Salons",
    heroTitle: "Online-Kundenbuchung für Profis und Salons",
    heroText: "Nimm Buchungen online an, verwalte Kalender und Leistungen und erhalte Telegram-Benachrichtigungen.",
    primaryCta: "Kostenlos starten",
    secondaryCta: "Funktionen ansehen",
    proof: "Ohne komplizierte Einrichtung • Start in wenigen Minuten",
    screenshotAlt: "Timviz Business-Oberfläche",
    whyTitle: "Warum Profis zu Timviz wechseln",
    whyCards: [
      { title: "Weniger Anrufe", text: "Kunden wählen Leistung, Tag und Uhrzeit selbst." },
      { title: "Weniger Chaos", text: "Alle Buchungen sind in einem Kalender sichtbar." },
      { title: "Mehr Kontrolle", text: "Leistungen, Preise, Zeitplan und Kunden in einem Dashboard." },
      { title: "Schnelle Hinweise", text: "Wichtige Ereignisse kommen in Telegram an." }
    ],
    onlineBookingTitle: "Was Online-Kundenbuchung ist",
    onlineBookingText: "Online-Kundenbuchung lässt Kunden Leistung, Tag und Uhrzeit ohne Anrufe oder lange Nachrichten wählen. Der Termin erscheint sofort im Kalender. Timviz ist Buchungssoftware für Profis und Salons: Preise, Dauer, Teamplanung und Telegram-Hinweise an einem Ort.",
    betterThanMessengersTitle: "Warum das besser ist als Buchungen per Messenger",
    betterThanMessengers: ["Kunden wählen freie Zeiten selbst", "Profis sehen alle Termine im Kalender", "weniger Fehler und Überschneidungen", "Leistungen, Preise und Dauer sind definiert", "Telegram kann verbunden werden", "Stammkunden lassen sich leichter verwalten"],
    middleCtaTitle: "Bereit für Online-Buchungen?",
    middleCtaText: "Füge Leistungen hinzu, stelle Arbeitszeiten ein und erhalte Buchungen ohne manuelle Abstimmung.",
    middleCtaButton: "Firmenprofil erstellen",
    uiTitle: "Zeige Kunden nur verfügbare Zeiten",
    uiText: "Kunden sehen freie Slots, während du alles aus einem Kalender verwaltest.",
    screenLabels: ["Tageskalender", "Wochenplan", "Monatsübersicht", "Arbeitszeiten"],
    stepsTitle: "So funktioniert es",
    steps: [
      { title: "Profil erstellen", text: "Füge Name, Kategorie und Arbeitsformat hinzu." },
      { title: "Leistungen und Zeitplan festlegen", text: "Definiere Preise, Dauer und Arbeitstage." },
      { title: "Buchungen annehmen", text: "Kunden buchen online und du siehst alles im Kalender." }
    ],
    nichesTitle: "Für wen Timviz geeignet ist",
    niches: [
      { title: "Nagelprofis", text: "Buchungen, Preise, Dauer und Wiederholungsbesuche in einem Kalender." },
      { title: "Friseure", text: "Kalender für Schnitte, Farbe und komplexe Leistungen." },
      { title: "Barber", text: "Volle Zeitpläne, schnelle Buchungen und Erinnerungen." },
      { title: "Kosmetiker", text: "Buchungen für Beratungen, Behandlungen und Folgebesuche." },
      { title: "Masseure", text: "Sitzungen unterschiedlicher Dauer, freie Slots und Stammkunden." },
      { title: "Kosmetikstudios", text: "Online-Buchung für Teampläne, Leistungen und Kunden." },
      { title: "Brows & Lashes", text: "Preise, Besuchsstatus und Telegram-Erinnerungen." },
      { title: "Depilationsstudios", text: "Klarer Behandlungsplan und Kundenverwaltung." },
      { title: "Make-up Artists", text: "Buchungen für Probetermine, Hochzeiten und Vor-Ort-Leistungen." },
      { title: "Tutoren", text: "Online-Buchung für Unterricht, Stundenplan und Erinnerungen." },
      { title: "Trainer", text: "Buchungen für Personal Training, Beratungen und freie Slots." },
      { title: "Private Ärzte", text: "Online-Buchung für Beratungen und Termine mit klarem Kalender." },
      { title: "Autoservice und Außendienst", text: "Buchungen für Diagnose, Reparatur, Wartung und Servicebesuche." }
    ],
    compareTitle: "Ohne Timviz vs mit Timviz",
    compareWithout: ["Buchungen in Messengern", "verlorene Kunden", "freie Zeiten schwer sichtbar", "Preise und Leistungen verstreut"],
    compareWith: ["Online-Buchung 24/7", "Buchungskalender", "Leistungen mit Preis und Dauer", "Telegram-Benachrichtigungen"],
    telegramTitle: "Buchungen und Hinweise in Telegram",
    telegramText: "Verbinde Telegram, um neue Buchungen, Bestätigungen, Erinnerungen und Kundenanfragen zu erhalten.",
    telegramCta: "Nach Registrierung verbinden",
    faqTitle: "FAQ",
    faqItems: [
      { q: "Was ist Timviz?", a: "Timviz verbindet Online-Buchung, Kalenderverwaltung und Leistungen in einem Dashboard." },
      { q: "Ist Timviz für Solo-Profis geeignet?", a: "Ja, es funktioniert für einzelne Spezialisten und wachsende Teams." },
      { q: "Kann ich Timviz für einen Salon nutzen?", a: "Ja, du kannst mehrere Teammitglieder, Zeitpläne und Buchungen verwalten." },
      { q: "Wie buchen Kunden online?", a: "Teile deinen Buchungslink: Kunden wählen Leistung, Tag und Uhrzeit." },
      { q: "Kann ich Leistungen, Preise und Dauer anpassen?", a: "Ja, alle Serviceparameter können jederzeit geändert werden." },
      { q: "Gibt es Telegram-Benachrichtigungen?", a: "Ja, Timviz sendet wichtige Buchungsereignisse direkt an Telegram." },
      { q: "Kann ich kostenlos starten?", a: "Ja, erstelle dein Profil und starte schnell." },
      { q: "Brauche ich eine eigene Website?", a: "Nein, dein Timviz Profil und der Buchungslink reichen aus." }
    ],
    finalTitle: "Starte heute mit Buchungen",
    finalText: "Erstelle dein Profil, füge Leistungen hinzu und richte deinen Zeitplan ein. Timviz macht aus Nachrichtenchaos einen klaren Kalender.",
    finalHint: "Dauert nur wenige Minuten",
    appStoreCta: "Timviz Master laden",
    appStoreNote: "Im App Store für iPhone verfügbar",
    capabilitiesTitle: "Timviz Funktionen",
    capabilitiesSubtitle: "Alle Werkzeuge für Buchungen, Kalender und Leistungsverwaltung in einem Arbeitsbereich.",
    usefulForProsTitle: "Nützlich für Profis",
    footer: "Timviz für Unternehmen · Online-Kundenbuchung und Leistungsverwaltung",
    privacy: "Datenschutzrichtlinie",
    terms: "Nutzungsbedingungen",
    nichesSubtitle: "Timviz passt für alle, die mit Terminen arbeiten: Profis, Salons, Studios und private Spezialisten.",
    mastersColumn: "Für Profis",
    nicheLinksTitle: "Für wen Timviz ist"
  }
});

const screenAssets: Record<LandingLanguage, string[]> = withEnglishFallback<string[]>({
  ru: ["/for-business/ru-day.png", "/for-business/ru-week.png", "/for-business/ru-month.png", "/for-business/ru-schedule-wide.png"],
  uk: ["/for-business/uk-day.png", "/for-business/uk-week.png", "/for-business/uk-month.png", "/for-business/ru-schedule-wide.png"],
  en: ["/for-business/en-day.png", "/for-business/en-week.png", "/for-business/en-month.png", "/for-business/en-schedule.png"]
});

const capabilityLabels: Record<LandingLanguage, string[]> = withEnglishFallback<string[]>({
  ru: ["Онлайн-запись клиентов", "Календарь записей", "Telegram-уведомления", "CRM для салона", "Программа для записи клиентов"],
  uk: ["Онлайн-запис клієнтів", "Календар записів", "Telegram-сповіщення", "CRM для салону", "Програма для запису клієнтів"],
  en: ["Online client booking", "Booking calendar", "Telegram notifications", "Salon CRM", "Client booking software"]
});

Object.assign(capabilityLabels, {
  fr: ["Réservation client en ligne", "Calendrier de réservations", "Notifications Telegram", "CRM salon", "Logiciel de réservation client"],
  pl: ["Rezerwacje klientów online", "Kalendarz rezerwacji", "Powiadomienia Telegram", "CRM dla salonu", "Program do rezerwacji klientów"],
  cs: ["Online rezervace klientů", "Rezervační kalendář", "Telegram upozornění", "CRM pro salon", "Software pro rezervace klientů"],
  es: ["Reservas online de clientes", "Calendario de reservas", "Notificaciones Telegram", "CRM para salón", "Software de reservas de clientes"],
  de: ["Online-Kundenbuchung", "Buchungskalender", "Telegram-Benachrichtigungen", "Salon-CRM", "Software für Kundenbuchungen"]
});

const usefulLabels: Record<LandingLanguage, string[]> = withEnglishFallback<string[]>({
  ru: ["Онлайн-запись для мастеров", "Для мастеров маникюра", "Для парикмахеров", "Для барберов", "Для косметологов", "Для массажистов"],
  uk: ["Онлайн-запис для майстрів", "Для майстрів манікюру", "Для перукарів", "Для барберів", "Для косметологів", "Для масажистів"],
  en: ["Online booking for professionals", "For nail artists", "For hairdressers", "For barbers", "For cosmetologists", "For massage therapists"]
});

Object.assign(usefulLabels, {
  fr: ["Réservation pour professionnels", "Pour prothésistes ongulaires", "Pour coiffeurs", "Pour barbiers", "Pour esthéticiennes", "Pour masseurs"],
  pl: ["Rezerwacje dla specjalistów", "Dla stylistek paznokci", "Dla fryzjerów", "Dla barberów", "Dla kosmetologów", "Dla masażystów"],
  cs: ["Rezervace pro profesionály", "Pro nehtové specialisty", "Pro kadeřníky", "Pro barbery", "Pro kosmetology", "Pro maséry"],
  es: ["Reservas para profesionales", "Para especialistas en uñas", "Para peluqueros", "Para barberos", "Para cosmetólogos", "Para masajistas"],
  de: ["Buchung für Profis", "Für Nagelprofis", "Für Friseure", "Für Barber", "Für Kosmetiker", "Für Masseure"]
});

function getInitialLanguage(): LandingLanguage {
  if (typeof window === "undefined") return "ru";
  let saved: string | null = null;
  try {
    saved =
      typeof window.localStorage?.getItem === "function"
        ? window.localStorage.getItem("rezervo-pro-language")
        : null;
  } catch {
    saved = null;
  }
  if (isSiteLanguage(saved)) return saved;
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith("uk") || browserLanguage.startsWith("ua")) return "uk";
  if (browserLanguage.startsWith("fr")) return "fr";
  if (browserLanguage.startsWith("pl")) return "pl";
  if (browserLanguage.startsWith("cs") || browserLanguage.startsWith("cz")) return "cs";
  if (browserLanguage.startsWith("es")) return "es";
  if (browserLanguage.startsWith("de")) return "de";
  if (browserLanguage.startsWith("en")) return "en";
  return "ru";
}

type BusinessLandingProps = {
  initialLanguage?: LandingLanguage;
};

export default function BusinessLanding({ initialLanguage = "ru" }: BusinessLandingProps) {
  const [language, setLanguage] = useState<LandingLanguage>(initialLanguage);
  const t = copy[language];
  const assets = screenAssets[language];
  const createProfileLink = "/pro/create-account";
  const footerLabels = publicFooterLabels[language];
  const capability = capabilityLabels[language];
  const useful = usefulLabels[language];
  const capabilitiesLinks: Array<{ label: string; href: string }> = [
    { label: capability[0], href: getLocalizedPath(language, "/for-business") },
    { label: capability[1], href: getLocalizedPath(language, "/kalendar-zapisey") },
    { label: capability[2], href: getLocalizedPath(language, "/telegram-bot-dlya-zapisey") },
    { label: capability[3], href: getLocalizedPath(language, "/crm-dlya-salona") },
    { label: capability[4], href: getLocalizedPath(language, "/programma-dlya-zapisi-klientov") }
  ];
  const usefulLinks: Array<{ label: string; href: string }> = [
    { label: useful[0], href: getLocalizedPath(language, "/for-business") },
    { label: useful[1], href: getLocalizedPath(language, `/${getNicheSlug(language, "manicure")}`) },
    { label: useful[2], href: getLocalizedPath(language, `/${getNicheSlug(language, "hairdressers")}`) },
    { label: useful[3], href: getLocalizedPath(language, `/${getNicheSlug(language, "barbers")}`) },
    { label: useful[4], href: getLocalizedPath(language, `/${getNicheSlug(language, "cosmetologists")}`) },
    { label: useful[5], href: getLocalizedPath(language, `/${getNicheSlug(language, "massage")}`) }
  ];

  useEffect(() => {
    setLanguage(initialLanguage || getInitialLanguage());
    try {
      if (typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem("rezervo-pro-language", initialLanguage);
      }
    } catch {
      // Landing should render even when storage is unavailable.
    }
    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<LandingLanguage>).detail;
      if (next === "ru" || next === "uk" || next === "en") setLanguage(next);
    };
    window.addEventListener("rezervo-language-change", onLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", onLanguageChange);
  }, [initialLanguage]);

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a
        }
      }))
    }),
    [t.faqItems]
  );

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Timviz",
          item: `https://timviz.com${getLocalizedPath(language)}`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t.business,
          item: `https://timviz.com${getLocalizedPath(language, "/for-business")}`
        }
      ]
    }),
    [language, t.business]
  );

  return (
    <main className="business-landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.menu}>
          <PublicHeaderAuthMenu language={language} />
          <a href={createProfileLink} className="public-company-button">{t.create}</a>
          <details className="public-menu">
            <summary aria-label={t.menu} title={t.menu}>
              <span>{t.menu}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{t.clients}</strong>
              <a href={getLocalizedPath(language, "/catalog")}>{t.catalog}</a>
              <a href={getLocalizedPath(language, "/account")}>{t.clientLogin}</a>
              <hr />
              <strong>{t.business}</strong>
              <a href={createProfileLink}>{t.create}</a>
              <a href="/pro/login">{t.businessLogin}</a>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="business-hero">
        <div className="business-hero-copy">
          <span>{t.heroBadge}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="business-hero-actions">
            <a className="business-primary" href={createProfileLink}>{t.primaryCta}</a>
            <a className="business-secondary" href="#features">{t.secondaryCta}</a>
            <a className="business-secondary" href={timvizMasterAppStoreUrl} rel="noopener noreferrer" target="_blank">
              {t.appStoreCta}
            </a>
          </div>
          <small>{t.proof} · {t.appStoreNote}</small>
        </div>
        <div className="business-hero-visual">
          <img src={assets[0]} alt={t.screenshotAlt} />
        </div>
      </section>

      <section className="business-feature-section" id="features">
        <div className="business-section-head">
          <h2>{t.whyTitle}</h2>
        </div>
        <div className="business-feature-grid business-feature-grid--compact">
          {t.whyCards.map((feature, index) => (
            <article key={feature.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
        <div className="business-inline-cta">
          <a className="business-primary" href={createProfileLink}>{t.primaryCta}</a>
        </div>
      </section>
      <section className="business-seo-section">
        <h2>{t.onlineBookingTitle}</h2>
        <p>{t.onlineBookingText}</p>
      </section>
      <section className="business-seo-section">
        <h2>{t.middleCtaTitle}</h2>
        <p>{t.middleCtaText}</p>
        <a className="business-primary" href={createProfileLink}>{t.middleCtaButton}</a>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head">
          <h2>{t.uiTitle}</h2>
          <p>{t.uiText}</p>
        </div>
        <div className="business-screen-grid">
          {assets.map((asset, index) => (
            <article key={asset}>
              <div>
                <span>{t.screenLabels[index]}</span>
              </div>
              <img src={asset} alt={`${t.screenshotAlt}: ${t.screenLabels[index]}`} />
            </article>
          ))}
        </div>
      </section>

      <section className="business-workflow-section">
        <div>
          <h2>{t.stepsTitle}</h2>
        </div>
        <ol>
          {t.steps.map((step) => (
            <li key={step.title}>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.nichesTitle}</h2>
          <p>{t.nichesSubtitle}</p>
        </div>
        <div className="business-feature-grid business-feature-grid--4">
          {t.niches.map((niche) => (
            <article key={niche.title}>
              <h3>{niche.title}</h3>
              <p>{niche.text}</p>
            </article>
          ))}
        </div>
      </section>
      <NicheLinksSection
        language={language}
        title={t.nicheLinksTitle}
        subtitle={t.nichesSubtitle}
        className="niche-links-section niche-links-section--business"
      />

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.betterThanMessengersTitle}</h2>
        </div>
        <ul className="business-seo-list">
          {t.betterThanMessengers.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="business-seo-section">
        <h2>{t.telegramTitle}</h2>
        <p>{t.telegramText}</p>
        <a className="business-secondary" href={createProfileLink}>{t.telegramCta}</a>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.faqTitle}</h2>
        </div>
        <div className="business-faq-list">
          {t.faqItems.map((item) => (
            <details key={item.q} className="business-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.capabilitiesTitle}</h2>
          <p>{t.capabilitiesSubtitle}</p>
        </div>
        <div className="niche-links-grid">
          {capabilitiesLinks.map((link) => (
            <a className="niche-link-card" href={link.href} key={link.href}>
              <span className="niche-link-icon" aria-hidden="true">
                <BusinessIcon name="default" className="niche-link-icon-svg" />
              </span>
              <h3>{link.label}</h3>
              <p>{t.capabilitiesSubtitle}</p>
              <span className="niche-link-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </section>

      <section className="business-final-section">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalText}</p>
        <a className="business-primary" href={createProfileLink}>{copy[language].create}</a>
        <a className="business-secondary" href={timvizMasterAppStoreUrl} rel="noopener noreferrer" target="_blank">
          {t.appStoreCta}
        </a>
        <small>{t.finalHint} · {t.appStoreNote}</small>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footer}</span>
        <div className="business-footer-links">
          <strong>{t.usefulForProsTitle}</strong>
          {usefulLinks.map((link) => (
            <a href={link.href} key={link.href}>{link.label}</a>
          ))}
          <a href={getLocalizedPath(language, "/pricing")}>{footerLabels.pricing}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
          <a href={getLocalizedPath(language, "/refund-policy")}>{footerLabels.refund}</a>
          <a href={getLocalizedPath(language, "/contact")}>{footerLabels.contact}</a>
          <a href={timvizMasterAppStoreUrl} rel="noopener noreferrer" target="_blank">{t.appStoreCta}</a>
          <a href="mailto:adm@timviz.com">adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}

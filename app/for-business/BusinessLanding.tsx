"use client";

import { useEffect, useMemo, useState } from "react";
import { getNicheSlug } from "../../lib/niche-pages";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
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

const copy: Record<LandingLanguage, LocalCopy> = {
  uk: {
    logo: "timviz",
    login: "Увійти",
    clientLogin: "Вхід для клієнта",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    catalog: "Переглянути бізнеси",
    business: "Для бізнесу",
    businessLogin: "Увійти в кабінет",
    heroBadge: "Платформа для майстрів і салонів",
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
    catalog: "Посмотреть бизнесы",
    business: "Для бизнеса",
    businessLogin: "Войти в кабинет",
    heroBadge: "Платформа для мастеров и салонов",
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
    catalog: "Browse businesses",
    business: "For business",
    businessLogin: "Open dashboard",
    heroBadge: "Platform for professionals and salons",
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
};

const screenAssets: Record<LandingLanguage, string[]> = {
  ru: ["/for-business/ru-day.png", "/for-business/ru-week.png", "/for-business/ru-month.png", "/for-business/ru-schedule-wide.png"],
  uk: ["/for-business/uk-day.png", "/for-business/uk-week.png", "/for-business/uk-month.png", "/for-business/ru-schedule-wide.png"],
  en: ["/for-business/en-day.png", "/for-business/en-week.png", "/for-business/en-month.png", "/for-business/en-schedule.png"]
};

function getInitialLanguage(): LandingLanguage {
  if (typeof window === "undefined") return "ru";
  const saved = window.localStorage.getItem("rezervo-pro-language");
  if (saved === "uk" || saved === "en" || saved === "ru") return saved;
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith("uk") || browserLanguage.startsWith("ua")) return "uk";
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
  const capabilitiesLinks: Array<{ label: string; href: string }> = [
    { label: language === "uk" ? "Онлайн-запис клієнтів" : language === "ru" ? "Онлайн-запись клиентов" : "Online client booking", href: getLocalizedPath(language, "/for-business") },
    { label: language === "uk" ? "Календар записів" : language === "ru" ? "Календарь записей" : "Booking calendar", href: getLocalizedPath(language, "/kalendar-zapisey") },
    { label: language === "uk" ? "Telegram-сповіщення" : language === "ru" ? "Telegram-уведомления" : "Telegram notifications", href: getLocalizedPath(language, "/telegram-bot-dlya-zapisey") },
    { label: language === "uk" ? "CRM для салону" : language === "ru" ? "CRM для салона" : "Salon CRM", href: getLocalizedPath(language, "/crm-dlya-salona") },
    { label: language === "uk" ? "Програма для запису клієнтів" : language === "ru" ? "Программа для записи клиентов" : "Client booking software", href: getLocalizedPath(language, "/programma-dlya-zapisi-klientov") }
  ];
  const usefulLinks: Array<{ label: string; href: string }> = [
    { label: language === "uk" ? "Онлайн-запис для майстрів" : language === "ru" ? "Онлайн-запись для мастеров" : "Online booking for professionals", href: getLocalizedPath(language, "/for-business") },
    { label: language === "uk" ? "Для майстрів манікюру" : language === "ru" ? "Для мастеров маникюра" : "For nail artists", href: getLocalizedPath(language, `/${getNicheSlug(language, "manicure")}`) },
    { label: language === "uk" ? "Для перукарів" : language === "ru" ? "Для парикмахеров" : "For hairdressers", href: getLocalizedPath(language, `/${getNicheSlug(language, "hairdressers")}`) },
    { label: language === "uk" ? "Для барберів" : language === "ru" ? "Для барберов" : "For barbers", href: getLocalizedPath(language, `/${getNicheSlug(language, "barbers")}`) },
    { label: language === "uk" ? "Для косметологів" : language === "ru" ? "Для косметологов" : "For cosmetologists", href: getLocalizedPath(language, `/${getNicheSlug(language, "cosmetologists")}`) },
    { label: language === "uk" ? "Для масажистів" : language === "ru" ? "Для массажистов" : "For massage therapists", href: getLocalizedPath(language, `/${getNicheSlug(language, "massage")}`) }
  ];

  useEffect(() => {
    setLanguage(initialLanguage || getInitialLanguage());
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
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
            <summary>
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
          </div>
          <small>{t.proof}</small>
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
        <small>{t.finalHint}</small>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footer}</span>
        <div className="business-footer-links">
          <strong>{t.usefulForProsTitle}</strong>
          {usefulLinks.map((link) => (
            <a href={link.href} key={link.href}>{link.label}</a>
          ))}
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
        </div>
      </footer>
    </main>
  );
}

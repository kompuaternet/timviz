import type { Metadata } from "next";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import { getNicheSlug, nicheCards, nicheKeys } from "../../lib/niche-pages";
import { buildMetadata } from "../../lib/seo";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";

type InfoCard = {
  title: string;
  text: string;
};

type Copy = {
  home: string;
  forBusiness: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaAfterSolution: string;
  ctaFinal: string;
  microcopy: string;
  sampleClient: string;
  sampleService: string;
  sampleStatus: string;
  problemsTitle: string;
  problems: InfoCard[];
  solutionTitle: string;
  solutionText: string;
  solutionCards: InfoCard[];
  servicesTitle: string;
  servicesText: string;
  servicesList: string[];
  serviceSample: string;
  calendarTitle: string;
  calendarText: string;
  calendarItems: string[];
  howTitle: string;
  howSteps: string[];
  compareTitle: string;
  compareLeftTitle: string;
  compareRightTitle: string;
  compareLeft: string[];
  compareRight: string[];
  telegramTitle: string;
  telegramText: string;
  telegramCta: string;
  reasonsTitle: string;
  reasons: string[];
  otherTitle: string;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  finalMicrocopy: string;
  privacy: string;
  terms: string;
  footerText: string;
  screenshotAltCalendar: string;
  screenshotAltServices: string;
  screenshotAltTelegram: string;
};

const copy: Record<SiteLanguage, Copy> = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для мастера маникюра",
    subtitle: "Принимайте записи клиентов онлайн, ведите календарь, услуги, цены и рабочий график в одном кабинете.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Посмотреть возможности",
    ctaAfterSolution: "Создать профиль мастера",
    ctaFinal: "Запустить онлайн-запись",
    microcopy: "Без сложных настроек • запуск за несколько минут",
    sampleClient: "Клиент: Анна К.",
    sampleService: "Маникюр с покрытием · 90 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо мастеру маникюра?",
    problems: [
      {
        title: "Клиенты пишут в Instagram, Telegram и Viber",
        text: "Записи остаются в разных чатах, и легко потерять важное сообщение."
      },
      {
        title: "Записи теряются в переписках",
        text: "Сложно быстро понять, кто записан, на какое время и какую услугу выбрал."
      },
      {
        title: "Сложно помнить цену и длительность каждой услуги",
        text: "Маникюр, покрытие, дизайн и коррекция занимают разное время."
      },
      {
        title: "Бывают накладки по времени",
        text: "Без календаря легко поставить клиентов слишком близко друг к другу."
      },
      {
        title: "Клиенты забывают о записи",
        text: "Напоминания помогают уменьшить пропуски и отмены в последний момент."
      },
      {
        title: "Трудно видеть свободные окна на день",
        text: "Timviz показывает расписание и помогает быстрее найти свободное время."
      }
    ],
    solutionTitle: "Timviz наводит порядок в записях",
    solutionText:
      "Timviz помогает мастеру маникюра принимать онлайн-запись клиентов, показывать свободное время, вести календарь процедур и управлять услугами без хаоса в мессенджерах.",
    solutionCards: [
      {
        title: "Онлайн-запись 24/7",
        text: "Клиенты могут выбрать услугу и время без звонков и ожидания ответа."
      },
      {
        title: "Календарь записей",
        text: "Все визиты, длительность процедур и свободные окна видны в одном месте."
      },
      {
        title: "Услуги с ценой и длительностью",
        text: "Клиент заранее видит стоимость и понимает, сколько займёт процедура."
      },
      {
        title: "Рабочие дни и свободные окна",
        text: "Настройте график, выходные и доступное время для записи."
      },
      {
        title: "Telegram-уведомления",
        text: "Получайте новые записи и изменения сразу в Telegram."
      },
      {
        title: "Клиентская страница для записи",
        text: "Дайте клиентам ссылку, где они смогут записаться самостоятельно."
      }
    ],
    servicesTitle: "Настройте услуги маникюра за несколько минут",
    servicesText:
      "Добавьте услуги, укажите цену и длительность, чтобы клиент сразу понимал, сколько стоит процедура и сколько времени она занимает.",
    servicesList: [
      "Маникюр",
      "Маникюр с покрытием",
      "Гель-лак",
      "Наращивание ногтей",
      "Коррекция",
      "Снятие покрытия",
      "Дизайн ногтей",
      "Педикюр",
      "Укрепление ногтей",
      "Ремонт ногтя"
    ],
    serviceSample: "Маникюр с покрытием — 90 мин — 650 грн",
    calendarTitle: "Календарь записей для мастера маникюра",
    calendarText:
      "В календаре видно все записи, длительность процедур, свободные окна и загруженность дня. Это помогает не ставить клиентов слишком близко и не терять время между визитами.",
    calendarItems: ["дневной календарь", "недельный график", "свободные окна", "статусы записей", "повторные визиты"],
    howTitle: "Как работает онлайн-запись",
    howSteps: [
      "Создайте профиль мастера",
      "Добавьте услуги, цены и длительность",
      "Настройте рабочие дни",
      "Получайте записи клиентов онлайн"
    ],
    compareTitle: "Без Timviz и с Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "С Timviz",
    compareLeft: [
      "записи в разных мессенджерах",
      "нужно вручную искать свободное время",
      "клиентам надо ждать ответа",
      "легко забыть или перепутать запись"
    ],
    compareRight: [
      "запись клиентов онлайн",
      "календарь с доступным временем",
      "услуги с ценой и длительностью",
      "уведомления в Telegram",
      "меньше ручных переписок"
    ],
    telegramTitle: "Новые записи — сразу в Telegram",
    telegramText:
      "Подключите Telegram-бот Timviz, чтобы получать уведомления о новых записях, подтверждать заявки и быстро открывать календарь.",
    telegramCta: "Подключить после регистрации",
    reasonsTitle: "Почему мастеру удобно начать с Timviz",
    reasons: [
      "можно начать бесплатно",
      "не нужен отдельный сайт",
      "подходит для одного мастера",
      "можно работать без сложной CRM",
      "все на русском и украинском",
      "клиентам удобно записываться с телефона"
    ],
    otherTitle: "Другие направления",
    faqTitle: "FAQ",
    faq: [
      {
        q: "Что такое Timviz для мастера маникюра?",
        a: "Timviz — это сервис онлайн-записи для мастеров красоты с календарем записей, услугами, ценами и графиком работы."
      },
      {
        q: "Можно ли принимать онлайн-запись клиентов?",
        a: "Да, клиенты выбирают услугу и время сами, а запись сразу появляется в вашем календаре."
      },
      {
        q: "Можно ли указать цену и длительность услуг?",
        a: "Да, вы задаете стоимость и длительность каждой услуги маникюра отдельно."
      },
      {
        q: "Подходит ли Timviz для одного мастера?",
        a: "Да, платформа отлично подходит для частных мастеров без отдельного администратора."
      },
      {
        q: "Можно ли вести календарь записей?",
        a: "Да, доступен календарь записей с дневным и недельным представлением."
      },
      {
        q: "Есть ли Telegram-уведомления?",
        a: "Да, Timviz отправляет Telegram-уведомления о новых записях и изменениях."
      },
      {
        q: "Нужно ли создавать отдельный сайт?",
        a: "Нет, достаточно профиля Timviz и клиентской страницы для записи онлайн."
      },
      {
        q: "Можно ли начать бесплатно?",
        a: "Да, вы можете запустить сервис онлайн-записи бесплатно и настроить всё за несколько минут."
      }
    ],
    finalTitle: "Начните принимать записи на маникюр онлайн",
    finalText:
      "Создайте профиль, добавьте услуги и рабочие дни. Timviz поможет клиентам записываться без лишних переписок.",
    finalMicrocopy: "Это займёт несколько минут",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    screenshotAltCalendar: "Календарь записей для мастера маникюра в Timviz",
    screenshotAltServices: "Услуги и цены мастера маникюра в Timviz",
    screenshotAltTelegram: "Telegram-уведомления о новых записях Timviz"
  },
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    title: "Онлайн-запис для майстра манікюру",
    subtitle: "Приймайте записи клієнтів онлайн, ведіть календар, послуги, ціни та робочий графік в одному кабінеті.",
    ctaPrimary: "Почати безкоштовно",
    ctaSecondary: "Подивитися можливості",
    ctaAfterSolution: "Створити профіль майстра",
    ctaFinal: "Запустити онлайн-запис",
    microcopy: "Без складних налаштувань • запуск за кілька хвилин",
    sampleClient: "Клієнт: Анна К.",
    sampleService: "Манікюр із покриттям · 90 хв",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо майстру манікюру?",
    problems: [
      {
        title: "Клієнти пишуть в Instagram, Telegram і Viber",
        text: "Записи залишаються в різних чатах, і важливе повідомлення легко пропустити."
      },
      {
        title: "Записи губляться в переписках",
        text: "Важко швидко зрозуміти, хто записаний, на який час і яку послугу обрав."
      },
      {
        title: "Складно пам'ятати ціну й тривалість кожної послуги",
        text: "Манікюр, покриття, дизайн і корекція мають різну тривалість."
      },
      {
        title: "Бувають накладки за часом",
        text: "Без календаря легко поставити клієнтів занадто близько один до одного."
      },
      {
        title: "Клієнти забувають про запис",
        text: "Нагадування допомагають зменшити пропуски й скасування в останній момент."
      },
      {
        title: "Важко бачити вільні вікна на день",
        text: "Timviz показує розклад і допомагає швидше знаходити доступний час."
      }
    ],
    solutionTitle: "Timviz наводить порядок у записах",
    solutionText:
      "Timviz допомагає майстру манікюру приймати онлайн-запис клієнтів, показувати вільний час, вести календар процедур і керувати послугами без хаосу в месенджерах.",
    solutionCards: [
      {
        title: "Онлайн-запис 24/7",
        text: "Клієнти можуть обрати послугу й час без дзвінків та очікування відповіді."
      },
      {
        title: "Календар записів",
        text: "Усі візити, тривалість процедур і вільні вікна видно в одному місці."
      },
      {
        title: "Послуги з ціною і тривалістю",
        text: "Клієнт заздалегідь бачить вартість і розуміє, скільки триватиме процедура."
      },
      {
        title: "Робочі дні і вільні вікна",
        text: "Налаштуйте графік, вихідні та доступний час для запису."
      },
      {
        title: "Telegram-сповіщення",
        text: "Отримуйте нові записи та зміни одразу в Telegram."
      },
      {
        title: "Клієнтська сторінка для запису",
        text: "Дайте клієнтам посилання, де вони зможуть записатися самостійно."
      }
    ],
    servicesTitle: "Налаштуйте послуги манікюру за кілька хвилин",
    servicesText:
      "Додайте послуги, вкажіть ціну й тривалість, щоб клієнт одразу розумів вартість і час процедури.",
    servicesList: [
      "Манікюр",
      "Манікюр із покриттям",
      "Гель-лак",
      "Нарощування нігтів",
      "Корекція",
      "Зняття покриття",
      "Дизайн нігтів",
      "Педикюр",
      "Зміцнення нігтів",
      "Ремонт нігтя"
    ],
    serviceSample: "Манікюр із покриттям — 90 хв — 650 грн",
    calendarTitle: "Календар записів для майстра манікюру",
    calendarText:
      "У календарі видно всі записи, тривалість процедур, вільні вікна та завантаженість дня. Це допомагає не створювати накладок і не втрачати час між візитами.",
    calendarItems: ["денний календар", "тижневий графік", "вільні вікна", "статуси записів", "повторні візити"],
    howTitle: "Як працює онлайн-запис",
    howSteps: [
      "Створіть профіль майстра",
      "Додайте послуги, ціни й тривалість",
      "Налаштуйте робочі дні",
      "Отримуйте записи клієнтів онлайн"
    ],
    compareTitle: "Без Timviz і з Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "З Timviz",
    compareLeft: [
      "записи в різних месенджерах",
      "потрібно вручну шукати вільний час",
      "клієнтам треба чекати відповіді",
      "легко забути або переплутати запис"
    ],
    compareRight: [
      "запис клієнтів онлайн",
      "календар із доступним часом",
      "послуги з ціною і тривалістю",
      "сповіщення в Telegram",
      "менше ручних переписок"
    ],
    telegramTitle: "Нові записи — одразу в Telegram",
    telegramText:
      "Підключіть Telegram-бот Timviz, щоб отримувати сповіщення про нові записи, підтверджувати заявки й швидко відкривати календар.",
    telegramCta: "Підключити після реєстрації",
    reasonsTitle: "Чому майстру зручно почати з Timviz",
    reasons: [
      "можна почати безкоштовно",
      "не потрібен окремий сайт",
      "підходить для одного майстра",
      "можна працювати без складної CRM",
      "усе українською та російською",
      "клієнтам зручно записуватись із телефона"
    ],
    otherTitle: "Інші напрямки",
    faqTitle: "FAQ",
    faq: [
      {
        q: "Що таке Timviz для майстра манікюру?",
        a: "Timviz — це сервіс онлайн-запису для майстрів краси з календарем записів, послугами, цінами й графіком роботи."
      },
      {
        q: "Чи можна приймати онлайн-запис клієнтів?",
        a: "Так, клієнти самі обирають послугу й час, а запис одразу потрапляє у ваш календар."
      },
      {
        q: "Чи можна вказати ціну і тривалість послуг?",
        a: "Так, ви задаєте вартість і тривалість кожної послуги манікюру окремо."
      },
      {
        q: "Чи підходить Timviz для одного майстра?",
        a: "Так, платформа підходить для приватних майстрів без окремого адміністратора."
      },
      {
        q: "Чи можна вести календар записів?",
        a: "Так, доступний календар записів із денним і тижневим переглядом."
      },
      {
        q: "Чи є Telegram-сповіщення?",
        a: "Так, Timviz надсилає Telegram-сповіщення про нові записи та зміни."
      },
      {
        q: "Чи потрібен окремий сайт?",
        a: "Ні, достатньо профілю Timviz і клієнтської сторінки для онлайн-запису."
      },
      {
        q: "Чи можна почати безкоштовно?",
        a: "Так, ви можете запустити сервіс онлайн-запису безкоштовно й налаштувати все за кілька хвилин."
      }
    ],
    finalTitle: "Почніть приймати записи на манікюр онлайн",
    finalText:
      "Створіть профіль, додайте послуги й робочі дні. Timviz допоможе клієнтам записуватись без зайвих переписок.",
    finalMicrocopy: "Це займе кілька хвилин",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    screenshotAltCalendar: "Календар записів для майстра манікюру в Timviz",
    screenshotAltServices: "Послуги та ціни майстра манікюру в Timviz",
    screenshotAltTelegram: "Telegram-сповіщення про нові записи Timviz"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    title: "Online booking for nail technicians",
    subtitle: "Accept client bookings online, manage your calendar, services, pricing and working hours in one dashboard.",
    ctaPrimary: "Start for free",
    ctaSecondary: "See features",
    ctaAfterSolution: "Create professional profile",
    ctaFinal: "Launch online booking",
    microcopy: "No complex setup • launch in minutes",
    sampleClient: "Client: Anna K.",
    sampleService: "Manicure with coating · 90 min",
    sampleStatus: "Status: Confirmed",
    problemsTitle: "Does this sound familiar?",
    problems: [
      {
        title: "Clients write in Instagram, Telegram and Viber",
        text: "Bookings are spread across chats and important messages get lost easily."
      },
      {
        title: "Bookings get lost in conversations",
        text: "It is hard to quickly see who booked, for what time and for which service."
      },
      {
        title: "Service pricing and duration are hard to track",
        text: "Manicure services often have different duration and pricing rules."
      },
      {
        title: "Time overlaps happen",
        text: "Without one calendar it is easy to place appointments too close together."
      },
      {
        title: "Clients forget appointments",
        text: "Reminders help reduce no-shows and last-minute cancellations."
      },
      {
        title: "Free slots are hard to see",
        text: "Timviz shows your schedule clearly and helps find available time faster."
      }
    ],
    solutionTitle: "Timviz brings order to bookings",
    solutionText:
      "Timviz helps nail technicians accept online client booking, show available time, manage appointment calendar and control services without messenger chaos.",
    solutionCards: [
      {
        title: "24/7 online booking",
        text: "Clients choose service and time on their own without calls or waiting for replies."
      },
      {
        title: "Booking calendar",
        text: "Appointments, service duration and free slots are visible in one place."
      },
      {
        title: "Services with price and duration",
        text: "Clients see pricing upfront and understand how long each service takes."
      },
      {
        title: "Working days and free slots",
        text: "Set schedule, days off and available booking windows with full control."
      },
      {
        title: "Telegram notifications",
        text: "Receive new bookings and schedule changes instantly in Telegram."
      },
      {
        title: "Client booking page",
        text: "Share one link where clients can book appointments on their own."
      }
    ],
    servicesTitle: "Set up nail services in minutes",
    servicesText:
      "Add services with price and duration so clients understand cost and timing before booking.",
    servicesList: [
      "Manicure",
      "Manicure with coating",
      "Gel polish",
      "Nail extension",
      "Correction",
      "Coating removal",
      "Nail design",
      "Pedicure",
      "Nail strengthening",
      "Nail repair"
    ],
    serviceSample: "Manicure with coating — 90 min — 650 UAH",
    calendarTitle: "Booking calendar for nail technicians",
    calendarText:
      "In the calendar you can see all bookings, service durations, open slots and daily workload. It helps avoid overlaps and reduce idle gaps between appointments.",
    calendarItems: ["daily calendar", "weekly schedule", "free slots", "booking statuses", "repeat visits"],
    howTitle: "How online booking works",
    howSteps: [
      "Create your professional profile",
      "Add services, prices and duration",
      "Set working days",
      "Receive client bookings online"
    ],
    compareTitle: "Without Timviz vs with Timviz",
    compareLeftTitle: "Without Timviz",
    compareRightTitle: "With Timviz",
    compareLeft: [
      "bookings across multiple messengers",
      "manual search for free time",
      "clients waiting for reply",
      "easy to miss or mix up appointments"
    ],
    compareRight: [
      "online client booking",
      "calendar with available time",
      "services with price and duration",
      "Telegram notifications",
      "less manual messaging"
    ],
    telegramTitle: "New bookings directly in Telegram",
    telegramText:
      "Connect Timviz Telegram bot to receive booking alerts, confirmations and quick access to your calendar.",
    telegramCta: "Connect after sign up",
    reasonsTitle: "Why Timviz is easy to start",
    reasons: [
      "free start",
      "no separate website needed",
      "works for solo professionals",
      "no complex CRM setup required",
      "available in Ukrainian and Russian",
      "easy mobile booking experience for clients"
    ],
    otherTitle: "Other directions",
    faqTitle: "FAQ",
    faq: [
      {
        q: "What is Timviz for nail technicians?",
        a: "Timviz is online booking software with appointment calendar, services, pricing and schedule management."
      },
      {
        q: "Can I accept online client bookings?",
        a: "Yes, clients choose service and time, and bookings appear instantly in your calendar."
      },
      {
        q: "Can I set price and duration per service?",
        a: "Yes, each manicure service can have its own price and duration."
      },
      {
        q: "Is Timviz suitable for solo professionals?",
        a: "Yes, Timviz works well for individual specialists without admin staff."
      },
      {
        q: "Can I manage a booking calendar?",
        a: "Yes, Timviz provides daily and weekly booking views."
      },
      {
        q: "Are Telegram notifications available?",
        a: "Yes, Timviz sends Telegram notifications for new and updated bookings."
      },
      {
        q: "Do I need a separate website?",
        a: "No, your Timviz profile and booking page are enough to start."
      },
      {
        q: "Can I start for free?",
        a: "Yes, you can start quickly with a free setup."
      }
    ],
    finalTitle: "Start accepting manicure bookings online",
    finalText:
      "Create your profile, add services and working days. Timviz helps clients book without endless messaging.",
    finalMicrocopy: "It takes just a few minutes",
    privacy: "Privacy policy",
    terms: "Terms of use",
    footerText: "Timviz for business · online client booking and service management",
    screenshotAltCalendar: "Booking calendar for nail technicians in Timviz",
    screenshotAltServices: "Nail technician services and pricing in Timviz",
    screenshotAltTelegram: "Telegram notifications for new Timviz bookings"
  }
};

const screenshotByLanguage: Record<SiteLanguage, { day: string; week: string; month: string }> = {
  ru: { day: "/for-business/ru-day.png", week: "/for-business/ru-week.png", month: "/for-business/ru-month.png" },
  uk: { day: "/for-business/uk-day.png", week: "/for-business/uk-week.png", month: "/for-business/uk-month.png" },
  en: { day: "/for-business/en-day.png", week: "/for-business/en-week.png", month: "/for-business/en-month.png" }
};

const manicurePathByLanguage: Record<SiteLanguage, string> = {
  ru: "/ru/dlya-manikyura",
  uk: "/uk/dlya-manikyuru",
  en: "/en/for-nail-technicians"
};

export function buildManicureMetadata(lang: SiteLanguage, pathname: string): Metadata {
  const title =
    lang === "ru"
      ? "Онлайн-запись для мастера маникюра — календарь и CRM | Timviz"
      : lang === "uk"
        ? "Онлайн-запис для майстра манікюру — календар і CRM | Timviz"
        : "Online booking for nail technicians — calendar & CRM | Timviz";

  const description =
    lang === "ru"
      ? "Timviz — сервис онлайн-записи для мастеров маникюра: календарь клиентов, услуги, цены, длительность процедур, график работы и Telegram-уведомления."
      : lang === "uk"
        ? "Timviz — сервіс онлайн-запису для майстрів манікюру: календар клієнтів, послуги, ціни, тривалість процедур, графік роботи та Telegram-сповіщення."
        : "Timviz is online booking software for nail technicians: client calendar, services, pricing, procedure duration, work schedule and Telegram notifications.";

  const metadata = buildMetadata(
    pathname,
    {
      title,
      description,
      keywords: [
        "онлайн запись для мастера маникюра",
        "программа для записи клиентов",
        "календарь записей для мастера маникюра",
        "crm для мастера маникюра",
        "запись клиентов онлайн",
        "сервис онлайн-записи"
      ]
    },
    lang
  );

  return {
    ...metadata,
    alternates: {
      canonical: `https://timviz.com${pathname}`,
      languages: {
        ru: `https://timviz.com${manicurePathByLanguage.ru}`,
        uk: `https://timviz.com${manicurePathByLanguage.uk}`,
        en: `https://timviz.com${manicurePathByLanguage.en}`,
        "x-default": `https://timviz.com${manicurePathByLanguage.en}`
      }
    }
  };
}

export default function ManicureLanding({ language }: { language: SiteLanguage }) {
  const t = copy[language];
  const screenshots = screenshotByLanguage[language];
  const otherKeys = nicheKeys.filter((key) => key !== "manicure");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  const breadcrumbSchema = {
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
        name: t.forBusiness,
        item: `https://timviz.com${getLocalizedPath(language, "/for-business")}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t.title,
        item: `https://timviz.com${manicurePathByLanguage[language]}`
      }
    ]
  };

  return (
    <main className="manicure-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.forBusiness}>
          <a href={getLocalizedPath(language)}>{t.home}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href="/pro/login">Timviz Pro</a>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="manicure-hero" id="top">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <div className="business-hero-actions">
            <a className="business-primary" href="/pro/create-account">{t.ctaPrimary}</a>
            <a className="business-secondary" href="#solution">{t.ctaSecondary}</a>
          </div>
          <small>{t.microcopy}</small>
        </div>
        <aside className="manicure-hero-card">
          <img src={screenshots.day} alt={t.screenshotAltCalendar} loading="lazy" />
          <div>
            <strong>{t.sampleClient}</strong>
            <p>{t.sampleService}</p>
            <span>{t.sampleStatus}</span>
          </div>
        </aside>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.problemsTitle}</h2></div>
        <div className="hair-card-grid">
          {t.problems.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head">
          <h2>{t.solutionTitle}</h2>
          <p>{t.solutionText}</p>
        </div>
        <div className="hair-card-grid">
          {t.solutionCards.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="business-inline-cta">
          <a className="business-primary" href="/pro/create-account">{t.ctaAfterSolution}</a>
        </div>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head">
          <h2>{t.servicesTitle}</h2>
          <p>{t.servicesText}</p>
        </div>
        <div className="manicure-services-grid">
          <div className="manicure-services-list">
            {t.servicesList.map((item) => <span key={item}>{item}</span>)}
          </div>
          <article className="manicure-service-card">
            <img src={screenshots.week} alt={t.screenshotAltServices} loading="lazy" />
            <strong>{t.serviceSample}</strong>
          </article>
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.calendarTitle}</h2>
          <p>{t.calendarText}</p>
        </div>
        <ul className="business-seo-list">
          {t.calendarItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="business-workflow-section">
        <div><h2>{t.howTitle}</h2></div>
        <ol>
          {t.howSteps.map((step) => (
            <li key={step}><div><strong>{step}</strong></div></li>
          ))}
        </ol>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.compareTitle}</h2></div>
        <div className="business-compare-grid">
          <article>
            <h3>{t.compareLeftTitle}</h3>
            <ul>{t.compareLeft.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <h3>{t.compareRightTitle}</h3>
            <ul>{t.compareRight.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </section>

      <section className="business-seo-section">
        <h2>{t.telegramTitle}</h2>
        <p>{t.telegramText}</p>
        <img src={screenshots.month} alt={t.screenshotAltTelegram} loading="lazy" className="manicure-telegram-image" />
        <a className="business-secondary" href="/pro/create-account">{t.telegramCta}</a>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.reasonsTitle}</h2></div>
        <ul className="business-seo-list">{t.reasons.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.otherTitle}</h2></div>
        <div className="niche-links-grid">
          {otherKeys.map((key) => {
            const card = nicheCards[key][language];
            return (
              <a className="niche-link-card" href={getLocalizedPath(language, `/${getNicheSlug(language, key)}`)} key={key}>
                <h3>{card.shortTitle}</h3>
                <p>{card.description}</p>
                <span className="niche-link-arrow" aria-hidden="true">→</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.faqTitle}</h2></div>
        <div className="business-faq-list">
          {t.faq.map((item) => (
            <details key={item.q} className="business-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="business-final-section">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalText}</p>
        <a className="business-primary" href="/pro/create-account">{t.ctaFinal}</a>
        <small>{t.finalMicrocopy}</small>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footerText}</span>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
        </div>
      </footer>
    </main>
  );
}

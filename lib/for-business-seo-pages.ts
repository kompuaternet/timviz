import type { SeoCopy } from "./seo";
import type { SiteLanguage } from "./site-language";

export type FeatureSlug =
  | "kalendar-zapisey"
  | "telegram-bot-dlya-zapisey"
  | "crm-dlya-salona"
  | "programma-dlya-zapisi-klientov";

export type NicheAliasSlug =
  | "dlya-manikyura"
  | "dlya-parikmaherov"
  | "dlya-barberov"
  | "dlya-kosmetologov"
  | "dlya-massazhistov";

export const nicheAliasToPrimary: Record<NicheAliasSlug, "dlya-manikyuru" | "dlya-perukariv" | "dlya-barberiv" | "dlya-kosmetologiv" | "dlya-masazhu"> = {
  "dlya-manikyura": "dlya-manikyuru",
  "dlya-parikmaherov": "dlya-perukariv",
  "dlya-barberov": "dlya-barberiv",
  "dlya-kosmetologov": "dlya-kosmetologiv",
  "dlya-massazhistov": "dlya-masazhu"
};

type FeaturePage = {
  slug: FeatureSlug;
  copy: Record<SiteLanguage, { h1: string; lead: string; body: string[] }>;
  seo: Record<SiteLanguage, SeoCopy>;
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

export function isFeatureSlug(value: string): value is FeatureSlug {
  return value in forBusinessFeatureBySlug;
}

export function isNicheAliasSlug(value: string): value is NicheAliasSlug {
  return value in nicheAliasToPrimary;
}

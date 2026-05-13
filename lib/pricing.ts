import type { Metadata } from "next";
import { buildLanguageAlternates, buildMetadata } from "./seo";
import type { SiteLanguage } from "./site-language";

export type PricingPlanKey = "free" | "monthly" | "yearly";

type PricingFeatureKey =
  | "basicAccess"
  | "oneMaster"
  | "appointmentsLimit"
  | "onlineBooking"
  | "calendar"
  | "services"
  | "clients"
  | "publicProfile"
  | "unlimitedAppointments"
  | "telegram"
  | "reminders"
  | "extendedCalendar"
  | "clientManagement"
  | "analytics"
  | "priorityCatalog"
  | "unlimitedServices"
  | "cancelAnytime";

export type PricingCopy = {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  trialBadge: string;
  cancelAnytime: string;
  securePaddle: string;
  loginRequired: string;
  missingConfig: string;
  startingCheckout: string;
  buttons: Record<PricingPlanKey, string>;
  plans: Record<
    PricingPlanKey,
    {
      name: string;
      tagline: string;
      price: string;
      billing: string;
      badge?: string;
      savings?: string;
      features: PricingFeatureKey[];
    }
  >;
  features: Record<PricingFeatureKey, string>;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
};

const paddleAnswer = {
  ru: "Paddle используется только для обработки оплаты подписки на программное обеспечение Timviz. Paddle не используется для оплаты сторонних услуг, записей, салонов, мастеров или клиентов.",
  uk: "Paddle використовується лише для обробки оплати підписки на програмне забезпечення Timviz. Paddle не використовується для оплати сторонніх послуг, записів, салонів, майстрів або клієнтів.",
  en: "Paddle is used only to process Timviz software subscription payments. It is not used to process payments for third-party services or appointments."
} satisfies Record<SiteLanguage, string>;

export const pricingCopy: Record<SiteLanguage, PricingCopy> = {
  ru: {
    seoTitle: "Тарифы Timviz — Free и Premium для онлайн-записи",
    seoDescription:
      "Выберите тариф Timviz для онлайн-записи, календаря, клиентов, Telegram-уведомлений и статистики. Premium от $3 в месяц с 14 днями бесплатно.",
    eyebrow: "Timviz Pricing",
    title: "Тарифы для роста вашего сервиса",
    subtitle:
      "Начните бесплатно, а когда понадобится больше автоматизации, подключите Premium с 14-дневным пробным периодом.",
    trialBadge: "14 дней бесплатно",
    cancelAnytime: "Отменить можно в любое время",
    securePaddle: "Безопасные платежи через Paddle",
    loginRequired: "Сначала войдите или создайте аккаунт, чтобы запустить пробный период.",
    missingConfig: "Paddle пока не настроен. Добавьте Price ID и Client Token в переменные окружения.",
    startingCheckout: "Открываем Paddle Checkout...",
    buttons: {
      free: "Начать бесплатно",
      monthly: "Start monthly trial",
      yearly: "Start yearly trial"
    },
    plans: {
      free: {
        name: "Free",
        tagline: "Для старта",
        price: "$0",
        billing: "навсегда",
        features: [
          "basicAccess",
          "oneMaster",
          "appointmentsLimit",
          "onlineBooking",
          "calendar",
          "services",
          "clients",
          "publicProfile"
        ]
      },
      monthly: {
        name: "Timviz Premium Monthly",
        tagline: "Для мастеров, которым нужна автоматизация",
        price: "$3",
        billing: "в месяц",
        badge: "14 дней бесплатно",
        features: [
          "unlimitedAppointments",
          "onlineBooking",
          "telegram",
          "reminders",
          "extendedCalendar",
          "clientManagement",
          "analytics",
          "priorityCatalog",
          "unlimitedServices",
          "cancelAnytime"
        ]
      },
      yearly: {
        name: "Timviz Premium Yearly",
        tagline: "Лучшее предложение",
        price: "$29",
        billing: "в год",
        badge: "Best value",
        savings: "2 months free",
        features: [
          "unlimitedAppointments",
          "onlineBooking",
          "telegram",
          "reminders",
          "extendedCalendar",
          "clientManagement",
          "analytics",
          "priorityCatalog",
          "unlimitedServices",
          "cancelAnytime"
        ]
      }
    },
    features: {
      basicAccess: "Базовый доступ",
      oneMaster: "1 мастер / 1 сотрудник",
      appointmentsLimit: "До 100 записей в месяц",
      onlineBooking: "Онлайн-запись",
      calendar: "Календарь",
      services: "Услуги",
      clients: "Клиентская база",
      publicProfile: "Базовый публичный профиль",
      unlimitedAppointments: "Безлимитные записи",
      telegram: "Telegram-уведомления",
      reminders: "Напоминания клиентам",
      extendedCalendar: "Расширенный календарь",
      clientManagement: "Управление клиентами",
      analytics: "Статистика / аналитика",
      priorityCatalog: "Приоритет в каталоге",
      unlimitedServices: "Несколько услуг без ограничений",
      cancelAnytime: "Отмена подписки в любое время"
    },
    faqTitle: "FAQ",
    faq: [
      {
        question: "Что будет после бесплатного периода?",
        answer: "После 14 дней пробного периода подписка автоматически продлевается через Paddle по выбранному тарифу: $3 в месяц или $29 в год."
      },
      {
        question: "Можно ли отменить в любое время?",
        answer: "Да. Вы можете отменить Premium в любое время. Доступ сохранится до конца оплаченного периода."
      },
      {
        question: "Что входит в Premium?",
        answer: "Безлимитные записи, Telegram-уведомления, напоминания клиентам, расширенный календарь, статистика, приоритет в каталоге и услуги без ограничений."
      },
      {
        question: "Paddle используется для оплаты услуг салонов или мастеров?",
        answer: paddleAnswer.ru
      },
      {
        question: "Можно ли пользоваться Timviz бесплатно?",
        answer: "Да. Free подходит для старта и включает до 100 записей в месяц, онлайн-запись, календарь, услуги и клиентскую базу."
      }
    ]
  },
  uk: {
    seoTitle: "Тарифи Timviz — Free і Premium для онлайн-запису",
    seoDescription:
      "Оберіть тариф Timviz для онлайн-запису, календаря, клієнтів, Telegram-сповіщень і статистики. Premium від $3 на місяць із 14 днями безкоштовно.",
    eyebrow: "Timviz Pricing",
    title: "Тарифи для розвитку вашого сервісу",
    subtitle:
      "Почніть безкоштовно, а коли знадобиться більше автоматизації, підключіть Premium із 14-денним пробним періодом.",
    trialBadge: "14 днів безкоштовно",
    cancelAnytime: "Скасувати можна будь-коли",
    securePaddle: "Безпечні платежі через Paddle",
    loginRequired: "Спочатку увійдіть або створіть акаунт, щоб запустити пробний період.",
    missingConfig: "Paddle поки не налаштовано. Додайте Price ID і Client Token у змінні середовища.",
    startingCheckout: "Відкриваємо Paddle Checkout...",
    buttons: {
      free: "Почати безкоштовно",
      monthly: "Start monthly trial",
      yearly: "Start yearly trial"
    },
    plans: {
      free: {
        name: "Free",
        tagline: "Для старту",
        price: "$0",
        billing: "назавжди",
        features: [
          "basicAccess",
          "oneMaster",
          "appointmentsLimit",
          "onlineBooking",
          "calendar",
          "services",
          "clients",
          "publicProfile"
        ]
      },
      monthly: {
        name: "Timviz Premium Monthly",
        tagline: "Для майстрів, яким потрібна автоматизація",
        price: "$3",
        billing: "на місяць",
        badge: "14 днів безкоштовно",
        features: [
          "unlimitedAppointments",
          "onlineBooking",
          "telegram",
          "reminders",
          "extendedCalendar",
          "clientManagement",
          "analytics",
          "priorityCatalog",
          "unlimitedServices",
          "cancelAnytime"
        ]
      },
      yearly: {
        name: "Timviz Premium Yearly",
        tagline: "Найкраща пропозиція",
        price: "$29",
        billing: "на рік",
        badge: "Best value",
        savings: "2 months free",
        features: [
          "unlimitedAppointments",
          "onlineBooking",
          "telegram",
          "reminders",
          "extendedCalendar",
          "clientManagement",
          "analytics",
          "priorityCatalog",
          "unlimitedServices",
          "cancelAnytime"
        ]
      }
    },
    features: {
      basicAccess: "Базовий доступ",
      oneMaster: "1 майстер / 1 співробітник",
      appointmentsLimit: "До 100 записів на місяць",
      onlineBooking: "Онлайн-запис",
      calendar: "Календар",
      services: "Послуги",
      clients: "Клієнтська база",
      publicProfile: "Базовий публічний профіль",
      unlimitedAppointments: "Необмежені записи",
      telegram: "Telegram-сповіщення",
      reminders: "Нагадування клієнтам",
      extendedCalendar: "Розширений календар",
      clientManagement: "Керування клієнтами",
      analytics: "Статистика / аналітика",
      priorityCatalog: "Пріоритет у каталозі",
      unlimitedServices: "Кілька послуг без обмежень",
      cancelAnytime: "Скасування підписки будь-коли"
    },
    faqTitle: "FAQ",
    faq: [
      {
        question: "Що буде після безкоштовного періоду?",
        answer: "Після 14 днів пробного періоду підписка автоматично продовжується через Paddle за обраним тарифом: $3 на місяць або $29 на рік."
      },
      {
        question: "Чи можна скасувати будь-коли?",
        answer: "Так. Ви можете скасувати Premium будь-коли. Доступ збережеться до кінця оплаченого періоду."
      },
      {
        question: "Що входить у Premium?",
        answer: "Необмежені записи, Telegram-сповіщення, нагадування клієнтам, розширений календар, статистика, пріоритет у каталозі та послуги без обмежень."
      },
      {
        question: "Paddle використовується для оплати послуг салонів або майстрів?",
        answer: paddleAnswer.uk
      },
      {
        question: "Чи можна користуватися Timviz безкоштовно?",
        answer: "Так. Free підходить для старту і включає до 100 записів на місяць, онлайн-запис, календар, послуги та клієнтську базу."
      }
    ]
  },
  en: {
    seoTitle: "Timviz Pricing — Free and Premium appointment scheduling",
    seoDescription:
      "Choose Timviz for online booking, calendar, clients, Telegram notifications and analytics. Premium starts at $3/month with a 14-day free trial.",
    eyebrow: "Timviz Pricing",
    title: "Plans for growing your service business",
    subtitle:
      "Start free, then upgrade to Premium when you want more automation. Premium includes a 14-day free trial.",
    trialBadge: "14 days free",
    cancelAnytime: "Cancel anytime",
    securePaddle: "Secure payments powered by Paddle",
    loginRequired: "Please sign in or create an account first to start your free trial.",
    missingConfig: "Paddle is not configured yet. Add Price IDs and Client Token to environment variables.",
    startingCheckout: "Opening Paddle Checkout...",
    buttons: {
      free: "Start free",
      monthly: "Start monthly trial",
      yearly: "Start yearly trial"
    },
    plans: {
      free: {
        name: "Free",
        tagline: "For getting started",
        price: "$0",
        billing: "forever",
        features: [
          "basicAccess",
          "oneMaster",
          "appointmentsLimit",
          "onlineBooking",
          "calendar",
          "services",
          "clients",
          "publicProfile"
        ]
      },
      monthly: {
        name: "Timviz Premium Monthly",
        tagline: "For professionals who want automation",
        price: "$3",
        billing: "per month",
        badge: "14 days free",
        features: [
          "unlimitedAppointments",
          "onlineBooking",
          "telegram",
          "reminders",
          "extendedCalendar",
          "clientManagement",
          "analytics",
          "priorityCatalog",
          "unlimitedServices",
          "cancelAnytime"
        ]
      },
      yearly: {
        name: "Timviz Premium Yearly",
        tagline: "Best value",
        price: "$29",
        billing: "per year",
        badge: "Best value",
        savings: "2 months free",
        features: [
          "unlimitedAppointments",
          "onlineBooking",
          "telegram",
          "reminders",
          "extendedCalendar",
          "clientManagement",
          "analytics",
          "priorityCatalog",
          "unlimitedServices",
          "cancelAnytime"
        ]
      }
    },
    features: {
      basicAccess: "Basic access",
      oneMaster: "1 master / 1 staff member",
      appointmentsLimit: "Up to 100 appointments per month",
      onlineBooking: "Online booking",
      calendar: "Calendar",
      services: "Services",
      clients: "Client database",
      publicProfile: "Basic public profile",
      unlimitedAppointments: "Unlimited appointments",
      telegram: "Telegram notifications",
      reminders: "Client reminders",
      extendedCalendar: "Extended calendar",
      clientManagement: "Client management",
      analytics: "Statistics / analytics",
      priorityCatalog: "Priority catalog profile",
      unlimitedServices: "Multiple services without limits",
      cancelAnytime: "Cancel subscription anytime"
    },
    faqTitle: "FAQ",
    faq: [
      {
        question: "What happens after the free trial?",
        answer: "After the 14-day trial, the subscription renews automatically through Paddle on your selected plan: $3/month or $29/year."
      },
      {
        question: "Can I cancel anytime?",
        answer: "Yes. You can cancel Premium anytime. Access stays available until the end of the paid period."
      },
      {
        question: "What is included in Premium?",
        answer: "Unlimited appointments, Telegram notifications, client reminders, extended calendar, analytics, priority catalog profile and services without limits."
      },
      {
        question: "Is Paddle used to pay for salon or master services?",
        answer: paddleAnswer.en
      },
      {
        question: "Can I use Timviz for free?",
        answer: "Yes. Free is designed for getting started and includes up to 100 appointments per month, online booking, calendar, services and client database."
      }
    ]
  }
};

export function buildPricingMetadata(language: SiteLanguage): Metadata {
  return {
    ...buildMetadata(`/${language}/pricing`, {
      title: pricingCopy[language].seoTitle,
      description: pricingCopy[language].seoDescription
    }, language),
    alternates: buildLanguageAlternates("/pricing", language)
  };
}

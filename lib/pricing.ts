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
  | "allFree"
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
  softwareNotice: string;
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
    seoTitle: "Тарифы Timviz — онлайн-запись для мастеров",
    seoDescription:
      "Бесплатный тариф и Premium-подписка Timviz для мастеров и сервисного бизнеса. Календарь, онлайн-запись, клиенты, аналитика и уведомления.",
    eyebrow: "Timviz Pricing",
    title: "Тарифы для роста вашего сервиса",
    subtitle:
      "Начните бесплатно, а когда понадобится больше автоматизации, подключите Premium с 14-дневным пробным периодом.",
    trialBadge: "14 дней бесплатно",
    cancelAnytime: "Отменить можно в любое время",
    securePaddle: "Безопасные платежи через Paddle",
    softwareNotice:
      "Timviz продаёт подписку на программное обеспечение для управления записью. Мы не являемся маркетплейсом и не обрабатываем платежи между клиентами и мастерами.",
    loginRequired: "Сначала войдите или создайте аккаунт, чтобы запустить пробный период.",
    missingConfig: "Paddle пока не настроен. Добавьте Price ID и Client Token в переменные окружения.",
    startingCheckout: "Открываем Paddle Checkout...",
    buttons: {
      free: "Начать бесплатно",
      monthly: "Начать пробный период",
      yearly: "Начать годовой Premium"
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
          "allFree",
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
          "allFree",
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
      appointmentsLimit: "До 500 записей",
      onlineBooking: "Онлайн-запись",
      calendar: "Календарь",
      services: "Услуги",
      clients: "Клиентская база",
      publicProfile: "Базовый публичный профиль",
      allFree: "Всё из Free",
      unlimitedAppointments: "Безлимитные записи",
      telegram: "Telegram-уведомления",
      reminders: "Напоминания клиентам",
      extendedCalendar: "Расширенный календарь",
      clientManagement: "Управление клиентами",
      analytics: "Статистика / аналитика",
      priorityCatalog: "Дополнительные бизнес-инструменты",
      unlimitedServices: "Услуги и расписание без ограничений",
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
        answer: "Всё из Free, расширенная аналитика, уведомления, Telegram-интеграции и дополнительные бизнес-инструменты."
      },
      {
        question: "Paddle используется для оплаты услуг салонов или мастеров?",
        answer: paddleAnswer.ru
      },
      {
        question: "Можно ли пользоваться Timviz бесплатно?",
        answer: "Да. Free подходит для старта и включает до 500 записей, базовый календарь, услуги, расписание, ссылку онлайн-записи и публичный профиль."
      }
    ]
  },
  uk: {
    seoTitle: "Тарифи Timviz — онлайн-запис для майстрів",
    seoDescription:
      "Безкоштовний тариф і Premium-підписка Timviz для майстрів і сервісного бізнесу. Календар, онлайн-запис, клієнти, аналітика та сповіщення.",
    eyebrow: "Timviz Pricing",
    title: "Тарифи для розвитку вашого сервісу",
    subtitle:
      "Почніть безкоштовно, а коли знадобиться більше автоматизації, підключіть Premium із 14-денним пробним періодом.",
    trialBadge: "14 днів безкоштовно",
    cancelAnytime: "Скасувати можна будь-коли",
    securePaddle: "Безпечні платежі через Paddle",
    softwareNotice:
      "Timviz продає підписку на програмне забезпечення для керування записом. Ми не є маркетплейсом і не обробляємо платежі між клієнтами та майстрами.",
    loginRequired: "Спочатку увійдіть або створіть акаунт, щоб запустити пробний період.",
    missingConfig: "Paddle поки не налаштовано. Додайте Price ID і Client Token у змінні середовища.",
    startingCheckout: "Відкриваємо Paddle Checkout...",
    buttons: {
      free: "Почати безкоштовно",
      monthly: "Почати пробний період",
      yearly: "Почати річний Premium"
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
          "allFree",
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
          "allFree",
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
      appointmentsLimit: "До 500 записів",
      onlineBooking: "Онлайн-запис",
      calendar: "Календар",
      services: "Послуги",
      clients: "Клієнтська база",
      publicProfile: "Базовий публічний профіль",
      allFree: "Усе з Free",
      unlimitedAppointments: "Необмежені записи",
      telegram: "Telegram-сповіщення",
      reminders: "Нагадування клієнтам",
      extendedCalendar: "Розширений календар",
      clientManagement: "Керування клієнтами",
      analytics: "Статистика / аналітика",
      priorityCatalog: "Додаткові бізнес-інструменти",
      unlimitedServices: "Послуги та розклад без обмежень",
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
        answer: "Усе з Free, розширена аналітика, сповіщення, Telegram-інтеграції та додаткові бізнес-інструменти."
      },
      {
        question: "Paddle використовується для оплати послуг салонів або майстрів?",
        answer: paddleAnswer.uk
      },
      {
        question: "Чи можна користуватися Timviz безкоштовно?",
        answer: "Так. Free підходить для старту і включає до 500 записів, базовий календар, послуги, розклад, посилання для онлайн-запису та публічний профіль."
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
    softwareNotice:
      "Timviz sells a software subscription for appointment management. We are not a marketplace and do not process payments between clients and service providers.",
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
          "allFree",
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
          "allFree",
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
      appointmentsLimit: "Up to 500 appointments",
      onlineBooking: "Online booking",
      calendar: "Calendar",
      services: "Services",
      clients: "Client database",
      publicProfile: "Basic public profile",
      allFree: "Everything in Free",
      unlimitedAppointments: "Unlimited appointments",
      telegram: "Telegram notifications",
      reminders: "Client reminders",
      extendedCalendar: "Extended calendar",
      clientManagement: "Client management",
      analytics: "Statistics / analytics",
      priorityCatalog: "Additional business tools",
      unlimitedServices: "Services and scheduling without limits",
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
        answer: "Everything in Free, advanced analytics, notifications, Telegram integrations and additional business tools."
      },
      {
        question: "Is Paddle used to pay for salon or master services?",
        answer: paddleAnswer.en
      },
      {
        question: "Can I use Timviz for free?",
        answer: "Yes. Free is designed for getting started and includes up to 500 appointments, basic calendar, services, working hours, online booking link and public profile."
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

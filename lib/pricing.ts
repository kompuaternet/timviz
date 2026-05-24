import type { Metadata } from "next";
import { buildLanguageAlternates, buildMetadata } from "./seo";
import { withEnglishFallback, type SiteLanguage } from "./site-language";

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
  secureBilling: string;
  softwareNotice: string;
  loginRequired: string;
  startingCheckout: string;
  billingError: string;
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

export const pricingCopy: Record<SiteLanguage, PricingCopy> = withEnglishFallback<PricingCopy>({
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
    secureBilling: "Безопасное управление подпиской",
    softwareNotice:
      "Timviz продаёт подписку на программное обеспечение для управления записью. Мы не являемся маркетплейсом и не обрабатываем платежи между клиентами и мастерами.",
    loginRequired: "Сначала войдите или создайте аккаунт, чтобы запустить пробный период.",
    startingCheckout: "Готовим защищённую оплату...",
    billingError: "Не удалось открыть оплату. Попробуйте ещё раз или напишите в поддержку.",
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
      appointmentsLimit: "До 100 записей в месяц",
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
        answer: "После 14 дней пробного периода Premium можно продолжить по выбранному тарифу: $3 в месяц или $29 в год."
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
        question: "Timviz используется для оплаты услуг салонов или мастеров?",
        answer: "Нет. Timviz продаёт только подписку на программное обеспечение и не обрабатывает платежи между клиентами и мастерами."
      },
      {
        question: "Можно ли пользоваться Timviz бесплатно?",
        answer: "Да. Free подходит для старта и включает до 100 записей в месяц, базовый календарь, услуги, расписание и публичный профиль."
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
    secureBilling: "Безпечне керування підпискою",
    softwareNotice:
      "Timviz продає підписку на програмне забезпечення для керування записом. Ми не є маркетплейсом і не обробляємо платежі між клієнтами та майстрами.",
    loginRequired: "Спочатку увійдіть або створіть акаунт, щоб запустити пробний період.",
    startingCheckout: "Готуємо захищену оплату...",
    billingError: "Не вдалося відкрити оплату. Спробуйте ще раз або напишіть у підтримку.",
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
      appointmentsLimit: "До 100 записів на місяць",
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
        answer: "Після 14 днів пробного періоду Premium можна продовжити за обраним тарифом: $3 на місяць або $29 на рік."
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
        question: "Timviz використовується для оплати послуг салонів або майстрів?",
        answer: "Ні. Timviz продає лише підписку на програмне забезпечення і не обробляє платежі між клієнтами та майстрами."
      },
      {
        question: "Чи можна користуватися Timviz безкоштовно?",
        answer: "Так. Free підходить для старту і включає до 100 записів на місяць, базовий календар, послуги, розклад і публічний профіль."
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
    secureBilling: "Secure subscription management",
    softwareNotice:
      "Timviz sells a software subscription for appointment management. We are not a marketplace and do not process payments between clients and service providers.",
    loginRequired: "Please sign in or create an account first to start your free trial.",
    startingCheckout: "Preparing secure checkout...",
    billingError: "Could not open checkout. Please try again or contact support.",
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
      appointmentsLimit: "Up to 100 appointments per month",
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
        answer: "After the 14-day trial, Premium can continue on your selected plan: $3/month or $29/year."
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
        question: "Is Timviz used to pay for salon or master services?",
        answer: "No. Timviz only sells a software subscription and does not process payments between clients and service providers."
      },
      {
        question: "Can I use Timviz for free?",
        answer: "Yes. Free is designed for getting started and includes up to 100 appointments per month, basic calendar, services, working hours and public profile."
      }
    ]
  }
});

Object.assign(pricingCopy, {
  fr: {
    ...pricingCopy.en,
    seoTitle: "Tarifs Timviz — réservation en ligne pour professionnels",
    seoDescription: "Tarif gratuit et Premium Timviz pour gérer réservations, calendrier, clients, notifications et analytics.",
    eyebrow: "Tarifs Timviz",
    title: "Des offres pour développer votre activité",
    subtitle: "Commencez gratuitement, puis passez à Premium quand vous avez besoin de plus d’automatisation.",
    trialBadge: "14 jours gratuits",
    cancelAnytime: "Annulation à tout moment",
    secureBilling: "Gestion sécurisée de l’abonnement",
    softwareNotice: "Timviz vend un abonnement logiciel pour gérer les rendez-vous. Nous ne sommes pas une marketplace et ne traitons pas les paiements entre clients et prestataires.",
    loginRequired: "Connectez-vous ou créez un compte pour démarrer l’essai gratuit.",
    startingCheckout: "Préparation du paiement sécurisé...",
    billingError: "Impossible d’ouvrir le paiement. Réessayez ou contactez le support.",
    buttons: { free: "Commencer gratuitement", monthly: "Essayer Premium", yearly: "Premium annuel" },
    plans: {
      ...pricingCopy.en.plans,
      free: { ...pricingCopy.en.plans.free, name: "Gratuit", tagline: "Pour commencer", billing: "pour toujours" },
      monthly: { ...pricingCopy.en.plans.monthly, name: "Timviz Premium mensuel", tagline: "Pour automatiser votre activité", billing: "par mois", badge: "14 jours gratuits" },
      yearly: { ...pricingCopy.en.plans.yearly, name: "Timviz Premium annuel", tagline: "Meilleure offre", billing: "par an", badge: "Meilleure offre", savings: "2 mois offerts" }
    },
    features: { basicAccess: "Accès de base", oneMaster: "1 professionnel / 1 membre d’équipe", appointmentsLimit: "Jusqu’à 100 rendez-vous par mois", onlineBooking: "Réservation en ligne", calendar: "Calendrier", services: "Services", clients: "Base clients", publicProfile: "Profil public de base", allFree: "Tout ce qui est inclus dans Gratuit", unlimitedAppointments: "Rendez-vous illimités", telegram: "Notifications Telegram", reminders: "Rappels clients", extendedCalendar: "Calendrier avancé", clientManagement: "Gestion des clients", analytics: "Statistiques / analytics", priorityCatalog: "Outils business supplémentaires", unlimitedServices: "Services et planning sans limites", cancelAnytime: "Annulation à tout moment" },
    faqTitle: "FAQ",
    faq: [
      { question: "Que se passe-t-il après l’essai gratuit ?", answer: "Après l’essai de 14 jours, Premium continue selon l’offre choisie : 3 $/mois ou 29 $/an." },
      { question: "Puis-je annuler à tout moment ?", answer: "Oui. Vous pouvez annuler Premium à tout moment. L’accès reste actif jusqu’à la fin de la période payée." },
      { question: "Qu’est-ce qui est inclus dans Premium ?", answer: "Tout le gratuit, les analytics avancées, notifications, intégrations Telegram et outils business supplémentaires." },
      { question: "Timviz sert-il à payer les services du salon ou du professionnel ?", answer: "Non. Timviz vend uniquement un abonnement logiciel et ne traite pas les paiements entre clients et prestataires." },
      { question: "Puis-je utiliser Timviz gratuitement ?", answer: "Oui. Le plan gratuit permet de démarrer avec jusqu’à 100 rendez-vous par mois, calendrier, services, horaires et profil public." }
    ]
  },
  pl: {
    ...pricingCopy.en,
    seoTitle: "Cennik Timviz — rezerwacje online dla specjalistów",
    seoDescription: "Darmowy plan i Premium Timviz do rezerwacji online, kalendarza, klientów, powiadomień i analityki.",
    eyebrow: "Cennik Timviz",
    title: "Plany dla rozwoju Twojej usługi",
    subtitle: "Zacznij za darmo, a Premium włącz wtedy, gdy potrzebujesz większej automatyzacji.",
    trialBadge: "14 dni za darmo",
    cancelAnytime: "Anuluj w dowolnym momencie",
    secureBilling: "Bezpieczne zarządzanie subskrypcją",
    softwareNotice: "Timviz sprzedaje subskrypcję oprogramowania do zarządzania rezerwacjami. Nie jesteśmy marketplace’em i nie obsługujemy płatności między klientami a usługodawcami.",
    loginRequired: "Najpierw zaloguj się lub utwórz konto, aby rozpocząć okres próbny.",
    startingCheckout: "Przygotowujemy bezpieczną płatność...",
    billingError: "Nie udało się otworzyć płatności. Spróbuj ponownie lub skontaktuj się z pomocą.",
    buttons: { free: "Zacznij za darmo", monthly: "Rozpocznij okres próbny", yearly: "Premium roczne" },
    plans: {
      ...pricingCopy.en.plans,
      free: { ...pricingCopy.en.plans.free, name: "Darmowy", tagline: "Na start", billing: "na zawsze" },
      monthly: { ...pricingCopy.en.plans.monthly, name: "Timviz Premium miesięczny", tagline: "Dla specjalistów z automatyzacją", billing: "miesięcznie", badge: "14 dni za darmo" },
      yearly: { ...pricingCopy.en.plans.yearly, name: "Timviz Premium roczny", tagline: "Najlepsza oferta", billing: "rocznie", badge: "Najlepsza oferta", savings: "2 miesiące gratis" }
    },
    features: { basicAccess: "Podstawowy dostęp", oneMaster: "1 specjalista / 1 członek zespołu", appointmentsLimit: "Do 100 rezerwacji miesięcznie", onlineBooking: "Rezerwacje online", calendar: "Kalendarz", services: "Usługi", clients: "Baza klientów", publicProfile: "Podstawowy profil publiczny", allFree: "Wszystko z planu darmowego", unlimitedAppointments: "Nielimitowane rezerwacje", telegram: "Powiadomienia Telegram", reminders: "Przypomnienia klientom", extendedCalendar: "Rozszerzony kalendarz", clientManagement: "Zarządzanie klientami", analytics: "Statystyki / analityka", priorityCatalog: "Dodatkowe narzędzia biznesowe", unlimitedServices: "Usługi i grafik bez limitów", cancelAnytime: "Anulowanie w dowolnym momencie" },
    faqTitle: "FAQ",
    faq: [
      { question: "Co dzieje się po okresie próbnym?", answer: "Po 14 dniach Premium może działać dalej w wybranym planie: 3 $ miesięcznie albo 29 $ rocznie." },
      { question: "Czy mogę anulować w dowolnym momencie?", answer: "Tak. Premium można anulować w dowolnym momencie, a dostęp zostaje do końca opłaconego okresu." },
      { question: "Co zawiera Premium?", answer: "Wszystko z planu darmowego, zaawansowane statystyki, powiadomienia, integracje Telegram i dodatkowe narzędzia biznesowe." },
      { question: "Czy Timviz służy do płacenia za usługi salonu lub specjalisty?", answer: "Nie. Timviz sprzedaje tylko subskrypcję oprogramowania i nie obsługuje płatności między klientami a usługodawcami." },
      { question: "Czy mogę korzystać z Timviz za darmo?", answer: "Tak. Plan darmowy pozwala zacząć i obejmuje do 100 rezerwacji miesięcznie, kalendarz, usługi, godziny pracy i profil publiczny." }
    ]
  },
  cs: {
    ...pricingCopy.en,
    seoTitle: "Ceník Timviz — online rezervace pro profesionály",
    seoDescription: "Bezplatný tarif a Premium Timviz pro online rezervace, kalendář, klienty, upozornění a analytiku.",
    eyebrow: "Ceník Timviz",
    title: "Tarify pro růst vašeho podnikání",
    subtitle: "Začněte zdarma a Premium zapněte, až budete potřebovat více automatizace.",
    trialBadge: "14 dní zdarma",
    cancelAnytime: "Zrušení kdykoliv",
    secureBilling: "Bezpečná správa předplatného",
    softwareNotice: "Timviz prodává softwarové předplatné pro správu rezervací. Nejsme marketplace a nezpracováváme platby mezi klienty a poskytovateli služeb.",
    loginRequired: "Nejprve se přihlaste nebo vytvořte účet, abyste mohli spustit zkušební období.",
    startingCheckout: "Připravujeme bezpečnou platbu...",
    billingError: "Platbu se nepodařilo otevřít. Zkuste to znovu nebo kontaktujte podporu.",
    buttons: { free: "Začít zdarma", monthly: "Spustit zkušební období", yearly: "Roční Premium" },
    plans: {
      ...pricingCopy.en.plans,
      free: { ...pricingCopy.en.plans.free, name: "Zdarma", tagline: "Pro začátek", billing: "navždy" },
      monthly: { ...pricingCopy.en.plans.monthly, name: "Timviz Premium měsíčně", tagline: "Pro profesionály s automatizací", billing: "měsíčně", badge: "14 dní zdarma" },
      yearly: { ...pricingCopy.en.plans.yearly, name: "Timviz Premium ročně", tagline: "Nejlepší nabídka", billing: "ročně", badge: "Nejlepší nabídka", savings: "2 měsíce zdarma" }
    },
    features: { basicAccess: "Základní přístup", oneMaster: "1 profesionál / 1 člen týmu", appointmentsLimit: "Až 100 rezervací měsíčně", onlineBooking: "Online rezervace", calendar: "Kalendář", services: "Služby", clients: "Klientská databáze", publicProfile: "Základní veřejný profil", allFree: "Vše z tarifu Zdarma", unlimitedAppointments: "Neomezené rezervace", telegram: "Telegram upozornění", reminders: "Připomenutí klientům", extendedCalendar: "Rozšířený kalendář", clientManagement: "Správa klientů", analytics: "Statistiky / analytika", priorityCatalog: "Další obchodní nástroje", unlimitedServices: "Služby a rozvrh bez omezení", cancelAnytime: "Zrušení kdykoliv" },
    faqTitle: "FAQ",
    faq: [
      { question: "Co se stane po zkušebním období?", answer: "Po 14denní zkušební době může Premium pokračovat podle zvoleného tarifu: 3 $ měsíčně nebo 29 $ ročně." },
      { question: "Mohu kdykoliv zrušit?", answer: "Ano. Premium můžete kdykoliv zrušit. Přístup zůstane do konce zaplaceného období." },
      { question: "Co je součástí Premium?", answer: "Vše z tarifu Zdarma, pokročilé statistiky, upozornění, integrace Telegram a další obchodní nástroje." },
      { question: "Slouží Timviz k platbám za služby salonu nebo profesionála?", answer: "Ne. Timviz prodává pouze softwarové předplatné a nezpracovává platby mezi klienty a poskytovateli služeb." },
      { question: "Mohu používat Timviz zdarma?", answer: "Ano. Tarif Zdarma je pro začátek a zahrnuje až 100 rezervací měsíčně, kalendář, služby, pracovní dobu a veřejný profil." }
    ]
  },
  es: {
    ...pricingCopy.en,
    seoTitle: "Precios Timviz — reservas online para profesionales",
    seoDescription: "Plan gratuito y Premium Timviz para reservas online, calendario, clientes, notificaciones y analítica.",
    eyebrow: "Precios Timviz",
    title: "Planes para hacer crecer tu negocio",
    subtitle: "Empieza gratis y pasa a Premium cuando necesites más automatización.",
    trialBadge: "14 días gratis",
    cancelAnytime: "Cancela cuando quieras",
    secureBilling: "Gestión segura de suscripción",
    softwareNotice: "Timviz vende una suscripción de software para gestionar reservas. No somos un marketplace y no procesamos pagos entre clientes y proveedores.",
    loginRequired: "Primero inicia sesión o crea una cuenta para empezar la prueba gratuita.",
    startingCheckout: "Preparando pago seguro...",
    billingError: "No se pudo abrir el pago. Inténtalo de nuevo o contacta con soporte.",
    buttons: { free: "Empezar gratis", monthly: "Iniciar prueba", yearly: "Premium anual" },
    plans: {
      ...pricingCopy.en.plans,
      free: { ...pricingCopy.en.plans.free, name: "Gratis", tagline: "Para empezar", billing: "para siempre" },
      monthly: { ...pricingCopy.en.plans.monthly, name: "Timviz Premium mensual", tagline: "Para profesionales que quieren automatizar", billing: "al mes", badge: "14 días gratis" },
      yearly: { ...pricingCopy.en.plans.yearly, name: "Timviz Premium anual", tagline: "Mejor oferta", billing: "al año", badge: "Mejor oferta", savings: "2 meses gratis" }
    },
    features: { basicAccess: "Acceso básico", oneMaster: "1 profesional / 1 miembro del equipo", appointmentsLimit: "Hasta 100 reservas al mes", onlineBooking: "Reserva online", calendar: "Calendario", services: "Servicios", clients: "Base de clientes", publicProfile: "Perfil público básico", allFree: "Todo lo incluido en Gratis", unlimitedAppointments: "Reservas ilimitadas", telegram: "Notificaciones Telegram", reminders: "Recordatorios a clientes", extendedCalendar: "Calendario ampliado", clientManagement: "Gestión de clientes", analytics: "Estadísticas / analítica", priorityCatalog: "Herramientas de negocio adicionales", unlimitedServices: "Servicios y horarios sin límites", cancelAnytime: "Cancelar en cualquier momento" },
    faqTitle: "FAQ",
    faq: [
      { question: "¿Qué pasa después de la prueba gratuita?", answer: "Tras la prueba de 14 días, Premium puede continuar en el plan elegido: 3 $/mes o 29 $/año." },
      { question: "¿Puedo cancelar cuando quiera?", answer: "Sí. Puedes cancelar Premium en cualquier momento. El acceso se mantiene hasta el final del periodo pagado." },
      { question: "¿Qué incluye Premium?", answer: "Todo lo incluido en Gratis, analítica avanzada, notificaciones, integraciones Telegram y herramientas de negocio adicionales." },
      { question: "¿Timviz se usa para pagar servicios del salón o profesional?", answer: "No. Timviz solo vende una suscripción de software y no procesa pagos entre clientes y proveedores." },
      { question: "¿Puedo usar Timviz gratis?", answer: "Sí. Gratis está pensado para empezar e incluye hasta 100 reservas al mes, calendario, servicios, horarios y perfil público." }
    ]
  },
  de: {
    ...pricingCopy.en,
    seoTitle: "Timviz Preise — Online-Buchung für Dienstleister",
    seoDescription: "Kostenloser Tarif und Timviz Premium für Online-Buchungen, Kalender, Kunden, Benachrichtigungen und Analytics.",
    eyebrow: "Timviz Preise",
    title: "Tarife für das Wachstum deines Geschäfts",
    subtitle: "Starte kostenlos und wechsle zu Premium, wenn du mehr Automatisierung brauchst.",
    trialBadge: "14 Tage kostenlos",
    cancelAnytime: "Jederzeit kündbar",
    secureBilling: "Sichere Abo-Verwaltung",
    softwareNotice: "Timviz verkauft ein Software-Abonnement zur Terminverwaltung. Wir sind kein Marketplace und verarbeiten keine Zahlungen zwischen Kunden und Dienstleistern.",
    loginRequired: "Bitte melde dich zuerst an oder erstelle ein Konto, um die kostenlose Testphase zu starten.",
    startingCheckout: "Sichere Zahlung wird vorbereitet...",
    billingError: "Die Zahlung konnte nicht geöffnet werden. Bitte versuche es erneut oder kontaktiere den Support.",
    buttons: { free: "Kostenlos starten", monthly: "Test starten", yearly: "Jährliches Premium" },
    plans: {
      ...pricingCopy.en.plans,
      free: { ...pricingCopy.en.plans.free, name: "Kostenlos", tagline: "Für den Start", billing: "für immer" },
      monthly: { ...pricingCopy.en.plans.monthly, name: "Timviz Premium monatlich", tagline: "Für Profis mit Automatisierung", billing: "pro Monat", badge: "14 Tage kostenlos" },
      yearly: { ...pricingCopy.en.plans.yearly, name: "Timviz Premium jährlich", tagline: "Bestes Angebot", billing: "pro Jahr", badge: "Bestes Angebot", savings: "2 Monate kostenlos" }
    },
    features: { basicAccess: "Basiszugang", oneMaster: "1 Profi / 1 Teammitglied", appointmentsLimit: "Bis zu 100 Buchungen pro Monat", onlineBooking: "Online-Buchung", calendar: "Kalender", services: "Leistungen", clients: "Kundendatenbank", publicProfile: "Einfaches öffentliches Profil", allFree: "Alles aus Kostenlos", unlimitedAppointments: "Unbegrenzte Buchungen", telegram: "Telegram-Benachrichtigungen", reminders: "Kundenerinnerungen", extendedCalendar: "Erweiterter Kalender", clientManagement: "Kundenverwaltung", analytics: "Statistiken / Analytics", priorityCatalog: "Zusätzliche Business-Tools", unlimitedServices: "Leistungen und Planung ohne Limits", cancelAnytime: "Abo jederzeit kündbar" },
    faqTitle: "FAQ",
    faq: [
      { question: "Was passiert nach der kostenlosen Testphase?", answer: "Nach 14 Tagen kann Premium im gewählten Tarif weiterlaufen: 3 $ pro Monat oder 29 $ pro Jahr." },
      { question: "Kann ich jederzeit kündigen?", answer: "Ja. Du kannst Premium jederzeit kündigen. Der Zugang bleibt bis zum Ende des bezahlten Zeitraums aktiv." },
      { question: "Was ist in Premium enthalten?", answer: "Alles aus Kostenlos, erweiterte Statistiken, Benachrichtigungen, Telegram-Integrationen und zusätzliche Business-Tools." },
      { question: "Wird Timviz für Zahlungen an Salons oder Profis genutzt?", answer: "Nein. Timviz verkauft nur ein Software-Abonnement und verarbeitet keine Zahlungen zwischen Kunden und Dienstleistern." },
      { question: "Kann ich Timviz kostenlos nutzen?", answer: "Ja. Kostenlos ist für den Start gedacht und enthält bis zu 100 Buchungen pro Monat, Kalender, Leistungen, Arbeitszeiten und ein öffentliches Profil." }
    ]
  }
});

export function buildPricingMetadata(language: SiteLanguage): Metadata {
  return {
    ...buildMetadata(`/${language}/pricing`, {
      title: pricingCopy[language].seoTitle,
      description: pricingCopy[language].seoDescription
    }, language),
    alternates: buildLanguageAlternates("/pricing", language)
  };
}

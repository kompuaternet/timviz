import type { Metadata } from "next";
import { buildLanguageAlternates, buildMetadata } from "./seo";
import type { SiteLanguage } from "./site-language";

type LegalCopy = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
  }>;
};

export const legalCopy: Record<
  "privacy" | "terms",
  Record<SiteLanguage, LegalCopy>
> = {
  privacy: {
    ru: {
      title: "Политика конфиденциальности Timviz",
      description:
        "Как Timviz собирает, использует и защищает данные пользователей, клиентов, компаний и онлайн-записей.",
      eyebrow: "Timviz Privacy",
      heading: "Политика конфиденциальности",
      intro:
        "Timviz помогает управлять онлайн-записью, клиентами, расписанием и публичными страницами компаний. На этой странице мы коротко объясняем, какие данные используем и зачем.",
      sections: [
        {
          title: "Какие данные мы обрабатываем",
          paragraphs: [
            "Мы можем хранить имя, email, телефон, язык интерфейса, данные компании, услуги, расписание, записи клиентов, фотографии и технические данные, которые нужны для работы платформы.",
            "Если вы входите через Google, мы можем получить базовые данные профиля, например имя, email и язык, чтобы создать или связать ваш аккаунт."
          ]
        },
        {
          title: "Зачем мы используем данные",
          paragraphs: [
            "Данные используются для авторизации, создания аккаунта, ведения календаря, записи клиентов, показа карточек компаний, поддержки пользователей и защиты аккаунтов.",
            "Мы также можем использовать обезличенные технические данные для улучшения стабильности, безопасности и удобства сервиса."
          ]
        },
        {
          title: "Фото, услуги и контент компании",
          paragraphs: [
            "Пользователи могут добавлять фотографии, услуги, описания и другие материалы для своих компаний. Эти данные могут отображаться публично в карточках бизнеса и результатах поиска.",
            "Администраторы платформы могут модерировать такой контент, если он нарушает правила сервиса или мешает безопасной работе платформы."
          ]
        },
        {
          title: "Хранение и защита",
          paragraphs: [
            "Мы стараемся хранить данные только столько, сколько нужно для работы сервиса, исполнения обязательств и обеспечения безопасности.",
            "Для защиты используются ограничения доступа, серверные проверки, резервные механизмы и другие разумные технические меры."
          ]
        },
        {
          title: "Связь с нами",
          paragraphs: [
            "Если вам нужно уточнить, какие данные связаны с вашим аккаунтом, или вы хотите обновить информацию, свяжитесь с нами через контакты, указанные на сайте Timviz."
          ]
        }
      ]
    },
    uk: {
      title: "Політика конфіденційності Timviz",
      description:
        "Як Timviz збирає, використовує та захищає дані користувачів, клієнтів, компаній і онлайн-записів.",
      eyebrow: "Timviz Privacy",
      heading: "Політика конфіденційності",
      intro:
        "Timviz допомагає керувати онлайн-записом, клієнтами, розкладом і публічними сторінками компаній. На цій сторінці коротко пояснюємо, які дані використовуємо і навіщо.",
      sections: [
        {
          title: "Які дані ми обробляємо",
          paragraphs: [
            "Ми можемо зберігати ім'я, email, телефон, мову інтерфейсу, дані компанії, послуги, графік, записи клієнтів, фотографії та технічні дані, потрібні для роботи платформи.",
            "Якщо ви входите через Google, ми можемо отримати базові дані профілю, наприклад ім'я, email і мову, щоб створити або зв'язати ваш акаунт."
          ]
        },
        {
          title: "Навіщо ми використовуємо дані",
          paragraphs: [
            "Дані використовуються для авторизації, створення акаунта, ведення календаря, запису клієнтів, показу карток компаній, підтримки користувачів і захисту акаунтів.",
            "Також ми можемо використовувати знеособлені технічні дані для покращення стабільності, безпеки та зручності сервісу."
          ]
        },
        {
          title: "Фото, послуги та контент компанії",
          paragraphs: [
            "Користувачі можуть додавати фотографії, послуги, описи та інші матеріали для своїх компаній. Ці дані можуть відображатися публічно в картках бізнесу та результатах пошуку.",
            "Адміністратори платформи можуть модерувати такий контент, якщо він порушує правила сервісу або заважає безпечній роботі платформи."
          ]
        },
        {
          title: "Зберігання і захист",
          paragraphs: [
            "Ми намагаємося зберігати дані лише стільки, скільки потрібно для роботи сервісу, виконання зобов'язань і забезпечення безпеки.",
            "Для захисту використовуються обмеження доступу, серверні перевірки, резервні механізми та інші розумні технічні заходи."
          ]
        },
        {
          title: "Зв'язок з нами",
          paragraphs: [
            "Якщо вам потрібно уточнити, які дані пов'язані з вашим акаунтом, або ви хочете оновити інформацію, зв'яжіться з нами через контакти, вказані на сайті Timviz."
          ]
        }
      ]
    },
    en: {
      title: "Timviz Privacy Policy",
      description:
        "How Timviz collects, uses and protects user, client, business and online booking data.",
      eyebrow: "Timviz Privacy",
      heading: "Privacy Policy",
      intro:
        "Timviz helps businesses manage online bookings, clients, schedules and public business pages. This page explains what data we use and why.",
      sections: [
        {
          title: "What data we process",
          paragraphs: [
            "We may store your name, email, phone number, interface language, business details, services, schedule, client bookings, photos and technical data required to operate the platform.",
            "If you sign in with Google, we may receive basic profile details such as your name, email and locale to create or connect your account."
          ]
        },
        {
          title: "Why we use data",
          paragraphs: [
            "We use data for authentication, account creation, calendar management, client bookings, public business listings, user support and account security.",
            "We may also use aggregated technical data to improve reliability, security and product usability."
          ]
        },
        {
          title: "Business photos, services and content",
          paragraphs: [
            "Users can upload business photos, services, descriptions and related content. This information may be shown publicly in business cards and search results.",
            "Platform administrators may moderate this content if it violates service rules or affects platform safety."
          ]
        },
        {
          title: "Storage and protection",
          paragraphs: [
            "We aim to retain data only for as long as it is needed to operate the service, fulfill obligations and keep the platform secure.",
            "Access restrictions, server-side checks, recovery mechanisms and other reasonable technical safeguards are used to protect the platform."
          ]
        },
        {
          title: "Contact",
          paragraphs: [
            "If you need to clarify what data is linked to your account or you want to update your information, contact us using the details published on the Timviz website."
          ]
        }
      ]
    }
  },
  terms: {
    ru: {
      title: "Условия использования Timviz",
      description:
        "Правила использования Timviz для владельцев бизнеса, сотрудников и клиентов, которые записываются на услуги онлайн.",
      eyebrow: "Timviz Terms",
      heading: "Условия использования",
      intro:
        "Эти условия описывают базовые правила использования Timviz для владельцев бизнеса, сотрудников и клиентов, которые записываются на услуги через платформу.",
      sections: [
        {
          title: "Использование сервиса",
          paragraphs: [
            "Timviz предоставляет инструменты для онлайн-записи, управления расписанием, клиентами, услугами, фотографиями и публичными страницами бизнеса.",
            "Пользователь обязуется указывать корректные данные и не использовать сервис для незаконной, вводящей в заблуждение или вредоносной активности."
          ]
        },
        {
          title: "Аккаунты и доступ",
          paragraphs: [
            "Пользователь отвечает за сохранность доступа к своему аккаунту и за действия, совершённые под его учётной записью.",
            "Timviz может ограничить доступ, если обнаружена подозрительная активность, нарушение правил сервиса или угроза безопасности."
          ]
        },
        {
          title: "Контент пользователей",
          paragraphs: [
            "Пользователь несёт ответственность за добавленные услуги, описания, фотографии, цены, расписание и другую информацию, размещённую в сервисе.",
            "Timviz может скрыть, ограничить или удалить контент, который нарушает правила, вводит пользователей в заблуждение или мешает работе платформы."
          ]
        },
        {
          title: "Записи и взаимодействие с клиентами",
          paragraphs: [
            "Timviz помогает организовать процесс записи, но качество и фактическое оказание услуги определяются самой компанией или специалистом.",
            "Компания обязуется поддерживать актуальность графика, стоимости, услуг и доступных временных окон."
          ]
        },
        {
          title: "Изменения сервиса",
          paragraphs: [
            "Мы можем обновлять функции, интерфейс, тарифы, ограничения и внутренние правила работы платформы по мере развития продукта.",
            "Продолжая использовать Timviz, пользователь соглашается с актуальной версией условий."
          ]
        }
      ]
    },
    uk: {
      title: "Умови використання Timviz",
      description:
        "Правила використання Timviz для власників бізнесу, співробітників і клієнтів, які записуються на послуги онлайн.",
      eyebrow: "Timviz Terms",
      heading: "Умови використання",
      intro:
        "Ці умови описують базові правила використання Timviz для власників бізнесу, співробітників і клієнтів, які записуються на послуги через платформу.",
      sections: [
        {
          title: "Використання сервісу",
          paragraphs: [
            "Timviz надає інструменти для онлайн-запису, керування розкладом, клієнтами, послугами, фотографіями та публічними сторінками бізнесу.",
            "Користувач зобов'язується вказувати коректні дані і не використовувати сервіс для незаконної, оманливої або шкідливої активності."
          ]
        },
        {
          title: "Акаунти та доступ",
          paragraphs: [
            "Користувач відповідає за збереження доступу до свого акаунта і за дії, вчинені під його обліковим записом.",
            "Timviz може обмежити доступ, якщо виявлено підозрілу активність, порушення правил сервісу або загрозу безпеці."
          ]
        },
        {
          title: "Контент користувачів",
          paragraphs: [
            "Користувач несе відповідальність за додані послуги, описи, фотографії, ціни, графік та іншу інформацію, розміщену в сервісі.",
            "Timviz може приховати, обмежити або видалити контент, який порушує правила, вводить користувачів в оману або заважає роботі платформи."
          ]
        },
        {
          title: "Записи та взаємодія з клієнтами",
          paragraphs: [
            "Timviz допомагає організувати процес запису, але якість і фактичне надання послуги визначаються самою компанією або спеціалістом.",
            "Компанія зобов'язується підтримувати актуальність графіка, вартості, послуг і доступних часових вікон."
          ]
        },
        {
          title: "Зміни сервісу",
          paragraphs: [
            "Ми можемо оновлювати функції, інтерфейс, тарифи, обмеження та внутрішні правила роботи платформи в міру розвитку продукту.",
            "Продовжуючи використовувати Timviz, користувач погоджується з актуальною версією умов."
          ]
        }
      ]
    },
    en: {
      title: "Timviz Terms of Service",
      description:
        "Rules for using Timviz for business owners, staff members and clients who book services online.",
      eyebrow: "Timviz Terms",
      heading: "Terms of Service",
      intro:
        "These terms describe the basic rules for using Timviz by business owners, team members and clients who book services through the platform.",
      sections: [
        {
          title: "Using the service",
          paragraphs: [
            "Timviz provides tools for online booking, schedule management, clients, services, business photos and public business pages.",
            "Users agree to provide accurate information and not use the service for unlawful, misleading or harmful activity."
          ]
        },
        {
          title: "Accounts and access",
          paragraphs: [
            "Users are responsible for maintaining access to their account and for actions performed under that account.",
            "Timviz may restrict access if suspicious activity, a rule violation or a security risk is detected."
          ]
        },
        {
          title: "User content",
          paragraphs: [
            "Users are responsible for services, descriptions, photos, prices, schedules and other content added to the platform.",
            "Timviz may hide, limit or remove content that breaks the rules, misleads users or disrupts the platform."
          ]
        },
        {
          title: "Bookings and client interactions",
          paragraphs: [
            "Timviz helps organize the booking workflow, but the actual quality and delivery of the service are determined by the business or professional.",
            "Businesses are responsible for keeping schedules, pricing, services and available time slots up to date."
          ]
        },
        {
          title: "Service changes",
          paragraphs: [
            "We may update product features, interface details, pricing, limits and internal platform rules as the service evolves.",
            "By continuing to use Timviz, the user agrees to the current version of these terms."
          ]
        }
      ]
    }
  }
};

export function buildLegalMetadata(type: "privacy" | "terms", language: SiteLanguage): Metadata {
  const copy = legalCopy[type][language];
  const pathname = `/${language}/${type}`;
  const metadata = buildMetadata(pathname, copy, language);

  return {
    ...metadata,
    alternates: buildLanguageAlternates(`/${type}`, language)
  };
}

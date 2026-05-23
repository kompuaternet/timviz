import type { Metadata } from "next";
import { buildLanguageAlternates, buildMetadata } from "./seo";
import { withNestedEnglishFallback, type SiteLanguage } from "./site-language";

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

export type LegalPageType = "privacy" | "terms" | "subscription-terms" | "refund-policy" | "support" | "account-deletion" | "contact";

export const legalCopy: Record<
  LegalPageType,
  Record<SiteLanguage, LegalCopy>
> = withNestedEnglishFallback<LegalPageType, LegalCopy>({
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
          title: "Подписки и платежи",
          paragraphs: [
            "Email может использоваться для аккаунта, подписки, поддержки, сервисных уведомлений и важных сообщений о работе Timviz.",
            "Платежный статус подписки может поступать от Apple In-App Purchase для iOS или от Monobank для платежей на сайте. Timviz не хранит полные номера банковских карт."
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
          title: "Підписки та платежі",
          paragraphs: [
            "Email може використовуватися для акаунта, підписки, підтримки, сервісних сповіщень і важливих повідомлень про роботу Timviz.",
            "Платіжний статус підписки може надходити від Apple In-App Purchase для iOS або від Monobank для платежів на сайті. Timviz не зберігає повні номери банківських карток."
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
          title: "Subscriptions and payments",
          paragraphs: [
            "Email may be used for account, subscription, support, service notifications and important Timviz product messages.",
            "Subscription payment status may be provided by Apple In-App Purchase for iOS or by Monobank for website payments. Timviz does not store full card numbers."
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
          title: "Подписки Timviz",
          paragraphs: [
            "Timviz — это программное обеспечение для онлайн-записи и управления сервисным бизнесом. Timviz продаёт подписки на доступ к SaaS-функциям платформы.",
            "Premium-подписка продлевается автоматически после пробного периода, если пользователь не отменит её заранее. Отменить подписку можно в любое время."
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
          title: "Подписки и сторонние услуги",
          paragraphs: [
            "В iOS подписки Timviz оформляются через Apple In-App Purchase. На сайте платежи за подписку могут обрабатываться через Monobank.",
            "Timviz предоставляет программные инструменты для онлайн-записи и управления бизнесом. Timviz не продаёт сторонние услуги, не является маркетплейсом и не обрабатывает платежи между клиентами и поставщиками услуг.",
            "Пользователи сами отвечают за свои записи, услуги, цены, выполнение работ и отношения с клиентами. Legal/business name: [LEGAL_BUSINESS_NAME]. Support: adm@timviz.com."
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
          title: "Підписки Timviz",
          paragraphs: [
            "Timviz — це програмне забезпечення для онлайн-запису та керування сервісним бізнесом. Timviz продає підписки на доступ до SaaS-функцій платформи.",
            "Premium-підписка продовжується автоматично після пробного періоду, якщо користувач не скасує її заздалегідь. Скасувати підписку можна будь-коли."
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
          title: "Підписки та сторонні послуги",
          paragraphs: [
            "В iOS підписки Timviz оформлюються через Apple In-App Purchase. На сайті платежі за підписку можуть оброблятися через Monobank.",
            "Timviz надає програмні інструменти для онлайн-запису та керування бізнесом. Timviz не продає сторонні послуги, не є маркетплейсом і не обробляє платежі між клієнтами та постачальниками послуг.",
            "Користувачі самі відповідають за свої записи, послуги, ціни, виконання робіт і відносини з клієнтами. Legal/business name: [LEGAL_BUSINESS_NAME]. Support: adm@timviz.com."
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
          title: "Timviz subscriptions",
          paragraphs: [
            "Timviz is appointment scheduling software for managing service businesses. Timviz sells software subscriptions that provide access to SaaS platform features.",
            "A Premium subscription renews automatically after the free trial unless it is cancelled before renewal. Users can cancel anytime."
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
          title: "Subscriptions and third-party services",
          paragraphs: [
            "On iOS, Timviz subscriptions are purchased through Apple In-App Purchase. On the website, subscription payments may be processed through Monobank.",
            "Timviz provides software tools for appointment scheduling and business management. Timviz does not sell third-party services, act as a marketplace, or process payments between clients and service providers.",
            "Users are responsible for their own appointments, services, pricing, delivery and client relationships. Legal/business name: [LEGAL_BUSINESS_NAME]. Support: adm@timviz.com."
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
  },
  "refund-policy": {
    ru: {
      title: "Политика возвратов Timviz",
      description: "Условия возврата платежей за подписку на программное обеспечение Timviz.",
      eyebrow: "Timviz Refund Policy",
      heading: "Политика возвратов",
      intro:
        "Timviz продаёт доступ к SaaS-программному обеспечению для онлайн-записи и управления сервисным бизнесом. Возвраты рассматриваются индивидуально.",
      sections: [
        {
          title: "Подписка на программное обеспечение",
          paragraphs: [
            "Оплата Timviz относится только к доступу к программному обеспечению Timviz и Premium-функциям платформы.",
            "В iOS возвраты за покупки в App Store обрабатывает Apple. Платежи на сайте могут обрабатываться через Monobank и не используются для оплаты услуг мастеров, салонов или клиентов."
          ]
        },
        {
          title: "Отмена подписки",
          paragraphs: [
            "Пользователь может отменить подписку в любое время. После отмены доступ обычно сохраняется до конца уже оплаченного периода.",
            "Если вы считаете, что списание произошло по ошибке, напишите нам на adm@timviz.com."
          ]
        },
        {
          title: "Когда возможен возврат",
          paragraphs: [
            "Запросы на возврат рассматриваются индивидуально. Возврат может быть одобрен в течение 14 дней после первого платежа, если пользователь не использовал платные функции существенно.",
            "Пользователь может отменить автоматическое продление Premium-подписки в любое время.",
            "Возвраты не предоставляются за уже завершённые периоды, а также при злоупотреблении, мошенничестве или нарушении правил сервиса."
          ]
        }
      ]
    },
    uk: {
      title: "Політика повернень Timviz",
      description: "Умови повернення платежів за підписку на програмне забезпечення Timviz.",
      eyebrow: "Timviz Refund Policy",
      heading: "Політика повернень",
      intro:
        "Timviz продає доступ до SaaS-програмного забезпечення для онлайн-запису та керування сервісним бізнесом. Повернення розглядаються індивідуально.",
      sections: [
        {
          title: "Підписка на програмне забезпечення",
          paragraphs: [
            "Оплата Timviz стосується лише доступу до програмного забезпечення Timviz і Premium-функцій платформи.",
            "В iOS повернення за покупки в App Store обробляє Apple. Платежі на сайті можуть оброблятися через Monobank і не використовуються для оплати послуг майстрів, салонів або клієнтів."
          ]
        },
        {
          title: "Скасування підписки",
          paragraphs: [
            "Користувач може скасувати підписку будь-коли. Після скасування доступ зазвичай зберігається до кінця вже оплаченого періоду.",
            "Якщо ви вважаєте, що списання відбулося помилково, напишіть нам на adm@timviz.com."
          ]
        },
        {
          title: "Коли можливе повернення",
          paragraphs: [
            "Запити на повернення розглядаються індивідуально. Повернення може бути схвалене протягом 14 днів після першого платежу, якщо користувач не використовував платні функції суттєво.",
            "Користувач може скасувати автоматичне продовження Premium-підписки будь-коли.",
            "Повернення не надаються за вже завершені періоди, а також у разі зловживання, шахрайства або порушення правил сервісу."
          ]
        }
      ]
    },
    en: {
      title: "Timviz Refund Policy",
      description: "Refund terms for Timviz software subscription payments.",
      eyebrow: "Timviz Refund Policy",
      heading: "Refund Policy",
      intro:
        "Timviz sells access to SaaS software for appointment scheduling and service business management. Refund requests are reviewed individually.",
      sections: [
        {
          title: "Software subscription",
          paragraphs: [
            "Timviz payments relate only to access to Timviz software and Premium platform features.",
            "Apple handles refunds for App Store purchases. Website payments may be processed through Monobank and are not used to pay for master, salon or client services."
          ]
        },
        {
          title: "Cancelling a subscription",
          paragraphs: [
            "Users can cancel anytime. After cancellation, access usually remains available until the end of the already paid period.",
            "If you believe you were charged by mistake, contact adm@timviz.com."
          ]
        },
        {
          title: "When refunds may be approved",
          paragraphs: [
            "Refund requests are reviewed individually. A refund may be approved within 14 days of the first payment if the user has not substantially used paid features.",
            "Users can cancel Premium subscription renewal at any time.",
            "No refunds are provided for periods that have already ended or in cases of abuse, fraud or violation of service rules."
          ]
        }
      ]
    }
  },
  "subscription-terms": {
    ru: {
      title: "Условия подписки Timviz",
      description: "Как работают Free, PRO, пробный период и Apple In-App Purchase.",
      eyebrow: "Timviz Subscription Terms",
      heading: "Условия подписки",
      intro: "Эта страница объясняет доступ к Timviz PRO, продление, отмену и период действия подписки.",
      sections: [
        {
          title: "Free и PRO",
          paragraphs: [
            "Free позволяет начать работу с базовыми возможностями Timviz. PRO открывает расширенные возможности, включая больший лимит записей, уведомления, команду и дополнительные инструменты.",
            "Доступ PRO действует до даты active until, рассчитанной по активной подписке, пробному периоду, промо или ручной активации."
          ]
        },
        {
          title: "Apple In-App Purchase",
          paragraphs: [
            "В iOS подписка PRO оформляется через Apple In-App Purchase. Оплата списывается с Apple ID пользователя.",
            "Подписка продлевается автоматически, если пользователь не отменит её минимум за 24 часа до окончания текущего периода. Управлять подпиской можно в настройках Apple ID."
          ]
        },
        {
          title: "Платежи на сайте",
          paragraphs: [
            "На сайте Timviz подписка может оплачиваться через Monobank. Доступ активируется после успешного платежа.",
            "Если у пользователя есть несколько активных источников доступа, Timviz применяет максимальную дату действия PRO."
          ]
        },
        {
          title: "Возвраты и истечение доступа",
          paragraphs: [
            "После окончания оплаченного периода или пробного доступа платные возможности могут быть ограничены до Free.",
            "Возвраты по покупкам App Store обрабатывает Apple. Вопросы по платежам на сайте рассматривает поддержка Timviz."
          ]
        }
      ]
    },
    uk: {
      title: "Умови підписки Timviz",
      description: "Як працюють Free, PRO, пробний період та Apple In-App Purchase.",
      eyebrow: "Timviz Subscription Terms",
      heading: "Умови підписки",
      intro: "Ця сторінка пояснює доступ до Timviz PRO, продовження, скасування та період дії підписки.",
      sections: [
        {
          title: "Free і PRO",
          paragraphs: [
            "Free дозволяє почати роботу з базовими можливостями Timviz. PRO відкриває розширені можливості, зокрема більший ліміт записів, сповіщення, команду та додаткові інструменти.",
            "Доступ PRO діє до дати active until, розрахованої за активною підпискою, пробним періодом, промо або ручною активацією."
          ]
        },
        {
          title: "Apple In-App Purchase",
          paragraphs: [
            "В iOS підписка PRO оформлюється через Apple In-App Purchase. Оплата списується з Apple ID користувача.",
            "Підписка продовжується автоматично, якщо користувач не скасує її щонайменше за 24 години до завершення поточного періоду. Керувати підпискою можна в налаштуваннях Apple ID."
          ]
        },
        {
          title: "Платежі на сайті",
          paragraphs: [
            "На сайті Timviz підписка може оплачуватися через Monobank. Доступ активується після успішного платежу.",
            "Якщо користувач має кілька активних джерел доступу, Timviz застосовує максимальну дату дії PRO."
          ]
        },
        {
          title: "Повернення та завершення доступу",
          paragraphs: [
            "Після завершення оплаченого періоду або пробного доступу платні можливості можуть бути обмежені до Free.",
            "Повернення за покупки App Store обробляє Apple. Питання щодо платежів на сайті розглядає підтримка Timviz."
          ]
        }
      ]
    },
    en: {
      title: "Timviz Subscription Terms",
      description: "How Free and PRO plans, trial access and Apple In-App Purchase work.",
      eyebrow: "Timviz Subscription Terms",
      heading: "Subscription Terms",
      intro: "This page explains Timviz PRO access, renewal, cancellation and subscription access periods.",
      sections: [
        {
          title: "Free and PRO",
          paragraphs: [
            "Free lets users start with the basic Timviz features. PRO unlocks extended capabilities, including higher appointment limits, notifications, team tools and additional business features.",
            "PRO access remains active until the active until date calculated from an active subscription, trial, promo or manual activation."
          ]
        },
        {
          title: "Apple In-App Purchase",
          paragraphs: [
            "In the iOS app, PRO subscriptions are purchased through Apple In-App Purchase. Payment is charged to the user's Apple ID.",
            "The subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Users can manage or cancel it in Apple ID settings."
          ]
        },
        {
          title: "Website payments",
          paragraphs: [
            "On the Timviz website, subscriptions may be paid through Monobank. Access is activated after a successful payment.",
            "If a user has multiple active access sources, Timviz applies the latest PRO active until date."
          ]
        },
        {
          title: "Refunds and expiration",
          paragraphs: [
            "After a paid period or trial ends, paid capabilities may be limited back to Free.",
            "Apple handles refunds for App Store purchases. Website payment questions are reviewed by Timviz support."
          ]
        }
      ]
    }
  },
  support: {
    ru: {
      title: "Поддержка Timviz",
      description: "Помощь по аккаунту, подписке, приложению и удалению аккаунта Timviz.",
      eyebrow: "Timviz Support",
      heading: "Поддержка Timviz",
      intro: "Мы помогаем с аккаунтом, календарём, подпиской, приложением и вопросами безопасности.",
      sections: [
        { title: "Как связаться", paragraphs: ["Email: adm@timviz.com", "Обычно мы отвечаем в течение 1–2 рабочих дней."] },
        { title: "Подписка", paragraphs: ["Подписками Apple нужно управлять в настройках Apple ID.", "По вопросам платежей на сайте напишите в поддержку Timviz."] },
        { title: "Удаление аккаунта", paragraphs: ["Удаление можно инициировать внутри iOS-приложения в меню Account → Delete account.", "Также можно обратиться на adm@timviz.com, если доступ к аккаунту потерян."] }
      ]
    },
    uk: {
      title: "Підтримка Timviz",
      description: "Допомога щодо акаунта, підписки, застосунку та видалення акаунта Timviz.",
      eyebrow: "Timviz Support",
      heading: "Підтримка Timviz",
      intro: "Ми допомагаємо з акаунтом, календарем, підпискою, застосунком і питаннями безпеки.",
      sections: [
        { title: "Як зв'язатися", paragraphs: ["Email: adm@timviz.com", "Зазвичай ми відповідаємо протягом 1–2 робочих днів."] },
        { title: "Підписка", paragraphs: ["Підписками Apple потрібно керувати в налаштуваннях Apple ID.", "Щодо платежів на сайті напишіть у підтримку Timviz."] },
        { title: "Видалення акаунта", paragraphs: ["Видалення можна ініціювати в iOS-застосунку в меню Account → Delete account.", "Також можна звернутися на adm@timviz.com, якщо доступ до акаунта втрачено."] }
      ]
    },
    en: {
      title: "Timviz Support",
      description: "Help with Timviz account, subscription, app and account deletion questions.",
      eyebrow: "Timviz Support",
      heading: "Timviz Support",
      intro: "We help with account, calendar, subscription, app and safety questions.",
      sections: [
        { title: "How to contact support", paragraphs: ["Email: adm@timviz.com", "Typical response time: 1–2 business days."] },
        { title: "Subscription management", paragraphs: ["For Apple subscriptions, manage or cancel your subscription in Apple ID settings.", "For website payment questions, contact Timviz support."] },
        { title: "Account deletion", paragraphs: ["Deletion can be initiated inside the iOS app from Account → Delete account.", "You can also contact adm@timviz.com if you cannot access your account."] }
      ]
    }
  },
  "account-deletion": {
    ru: {
      title: "Удаление аккаунта Timviz",
      description: "Как запросить удаление аккаунта и персональных данных Timviz.",
      eyebrow: "Timviz Account Deletion",
      heading: "Удаление аккаунта",
      intro: "Пользователь может инициировать удаление аккаунта внутри приложения или обратиться в поддержку, если потерял доступ.",
      sections: [
        { title: "В приложении", paragraphs: ["Откройте Account → Delete account, прочитайте предупреждение, введите DELETE и подтвердите действие.", "После подтверждения аккаунт помечается как удалённый, персональные поля очищаются там, где это возможно, и выполняется выход из приложения."] },
        { title: "Какие данные могут сохраняться", paragraphs: ["Некоторые записи, платежные события и технические журналы могут храниться, если это требуется законом, безопасностью или финансовой отчётностью.", "Мы стараемся удалить или обезличить персональные данные, которые больше не нужны для работы сервиса."] },
        { title: "Контакт", paragraphs: ["Если вы не можете войти в аккаунт, напишите на adm@timviz.com с email аккаунта."] }
      ]
    },
    uk: {
      title: "Видалення акаунта Timviz",
      description: "Як запросити видалення акаунта та персональних даних Timviz.",
      eyebrow: "Timviz Account Deletion",
      heading: "Видалення акаунта",
      intro: "Користувач може ініціювати видалення акаунта в застосунку або звернутися до підтримки, якщо втратив доступ.",
      sections: [
        { title: "У застосунку", paragraphs: ["Відкрийте Account → Delete account, прочитайте попередження, введіть DELETE і підтвердьте дію.", "Після підтвердження акаунт позначається як видалений, персональні поля очищуються там, де це можливо, і виконується вихід із застосунку."] },
        { title: "Які дані можуть зберігатися", paragraphs: ["Деякі записи, платіжні події та технічні журнали можуть зберігатися, якщо це потрібно за законом, для безпеки або фінансової звітності.", "Ми намагаємося видалити або знеособити персональні дані, які більше не потрібні для роботи сервісу."] },
        { title: "Контакт", paragraphs: ["Якщо ви не можете увійти в акаунт, напишіть на adm@timviz.com з email акаунта."] }
      ]
    },
    en: {
      title: "Timviz Account Deletion",
      description: "How to request deletion of your Timviz account and personal data.",
      eyebrow: "Timviz Account Deletion",
      heading: "Account Deletion",
      intro: "Users can initiate account deletion inside the app or contact support if they no longer have access.",
      sections: [
        { title: "Inside the app", paragraphs: ["Open Account → Delete account, read the warning, type DELETE and confirm.", "After confirmation, the account is marked as deleted, personal fields are cleared where possible, and the user is signed out."] },
        { title: "Data that may be retained", paragraphs: ["Some booking, payment event and technical records may be retained when required for legal, safety or financial reporting reasons.", "We aim to delete or anonymize personal data that is no longer needed to operate the service."] },
        { title: "Contact", paragraphs: ["If you cannot access your account, contact adm@timviz.com from the account email address."] }
      ]
    }
  },
  contact: {
    ru: {
      title: "Контакты Timviz",
      description: "Как связаться с поддержкой Timviz по вопросам аккаунта, подписки и продукта.",
      eyebrow: "Timviz Contact",
      heading: "Контакты",
      intro:
        "Свяжитесь с нами по вопросам Timviz appointment scheduling software, аккаунта, подписки или поддержки.",
      sections: [
        {
          title: "Поддержка",
          paragraphs: [
            "Email: adm@timviz.com",
            "Обычно мы отвечаем в течение 1–2 рабочих дней."
          ]
        },
        {
          title: "Продукт",
          paragraphs: [
            "Product: Timviz appointment scheduling software.",
            "Business/legal name: [LEGAL_BUSINESS_NAME]."
          ]
        }
      ]
    },
    uk: {
      title: "Контакти Timviz",
      description: "Як зв'язатися з підтримкою Timviz щодо акаунта, підписки та продукту.",
      eyebrow: "Timviz Contact",
      heading: "Контакти",
      intro:
        "Зв'яжіться з нами щодо Timviz appointment scheduling software, акаунта, підписки або підтримки.",
      sections: [
        {
          title: "Підтримка",
          paragraphs: [
            "Email: adm@timviz.com",
            "Зазвичай ми відповідаємо протягом 1–2 робочих днів."
          ]
        },
        {
          title: "Продукт",
          paragraphs: [
            "Product: Timviz appointment scheduling software.",
            "Business/legal name: [LEGAL_BUSINESS_NAME]."
          ]
        }
      ]
    },
    en: {
      title: "Contact Timviz",
      description: "Contact Timviz support for account, subscription and product questions.",
      eyebrow: "Timviz Contact",
      heading: "Contact",
      intro:
        "Contact us about Timviz appointment scheduling software, your account, subscription or support request.",
      sections: [
        {
          title: "Support",
          paragraphs: [
            "Email: adm@timviz.com",
            "Typical response time: 1–2 business days."
          ]
        },
        {
          title: "Product",
          paragraphs: [
            "Product: Timviz appointment scheduling software.",
            "Business/legal name: [LEGAL_BUSINESS_NAME]."
          ]
        }
      ]
    }
  }
});

const legalExtraCopy: Partial<
  Record<LegalPageType, Partial<Record<Exclude<SiteLanguage, "ru" | "uk" | "en">, Omit<LegalCopy, "sections"> & { sections?: LegalCopy["sections"] }>>>
> = {
  privacy: {
    fr: { title: "Politique de confidentialité Timviz", description: "Comment Timviz collecte, utilise et protège les données des utilisateurs, clients, entreprises et réservations.", eyebrow: "Confidentialité Timviz", heading: "Politique de confidentialité", intro: "Timviz aide les entreprises à gérer les réservations en ligne, les clients, les plannings et les pages publiques. Cette page explique quelles données nous utilisons et pourquoi." },
    pl: { title: "Polityka prywatności Timviz", description: "Jak Timviz zbiera, wykorzystuje i chroni dane użytkowników, klientów, firm oraz rezerwacji online.", eyebrow: "Prywatność Timviz", heading: "Polityka prywatności", intro: "Timviz pomaga firmom zarządzać rezerwacjami online, klientami, grafikami i publicznymi stronami firm. Ta strona wyjaśnia, jakich danych używamy i dlaczego." },
    cs: { title: "Zásady ochrany osobních údajů Timviz", description: "Jak Timviz shromažďuje, používá a chrání data uživatelů, klientů, firem a online rezervací.", eyebrow: "Soukromí Timviz", heading: "Zásady ochrany osobních údajů", intro: "Timviz pomáhá firmám spravovat online rezervace, klienty, rozvrhy a veřejné stránky. Tato stránka vysvětluje, jaká data používáme a proč." },
    es: { title: "Política de privacidad de Timviz", description: "Cómo Timviz recopila, utiliza y protege datos de usuarios, clientes, empresas y reservas online.", eyebrow: "Privacidad de Timviz", heading: "Política de privacidad", intro: "Timviz ayuda a las empresas a gestionar reservas online, clientes, horarios y páginas públicas. Esta página explica qué datos usamos y por qué." },
    de: { title: "Timviz Datenschutzrichtlinie", description: "Wie Timviz Daten von Nutzern, Kunden, Unternehmen und Online-Buchungen erhebt, verwendet und schützt.", eyebrow: "Timviz Datenschutz", heading: "Datenschutzrichtlinie", intro: "Timviz hilft Unternehmen, Online-Buchungen, Kunden, Zeitpläne und öffentliche Seiten zu verwalten. Diese Seite erklärt, welche Daten wir verwenden und warum." }
  },
  terms: {
    fr: { title: "Conditions d’utilisation Timviz", description: "Règles d’utilisation de Timviz pour les entreprises, les équipes et les clients qui réservent en ligne.", eyebrow: "Conditions Timviz", heading: "Conditions d’utilisation", intro: "Ces conditions décrivent les règles de base pour utiliser Timviz comme propriétaire, membre d’équipe ou client." },
    pl: { title: "Warunki korzystania z Timviz", description: "Zasady korzystania z Timviz dla właścicieli firm, zespołów i klientów rezerwujących online.", eyebrow: "Warunki Timviz", heading: "Warunki korzystania", intro: "Te warunki opisują podstawowe zasady korzystania z Timviz przez właścicieli firm, zespoły i klientów." },
    cs: { title: "Podmínky použití Timviz", description: "Pravidla používání Timviz pro firmy, týmy a klienty, kteří se objednávají online.", eyebrow: "Podmínky Timviz", heading: "Podmínky použití", intro: "Tyto podmínky popisují základní pravidla používání Timviz pro majitele firem, týmy a klienty." },
    es: { title: "Términos de uso de Timviz", description: "Reglas de uso de Timviz para empresas, equipos y clientes que reservan online.", eyebrow: "Términos de Timviz", heading: "Términos de uso", intro: "Estos términos describen las reglas básicas para usar Timviz como propietario, equipo o cliente." },
    de: { title: "Timviz Nutzungsbedingungen", description: "Regeln für die Nutzung von Timviz durch Unternehmen, Teams und Kunden, die online buchen.", eyebrow: "Timviz Bedingungen", heading: "Nutzungsbedingungen", intro: "Diese Bedingungen beschreiben die Grundregeln für die Nutzung von Timviz durch Inhaber, Teams und Kunden." }
  },
  "subscription-terms": {
    fr: { title: "Conditions d’abonnement Timviz", description: "Conditions des abonnements Timviz Premium, essai gratuit, renouvellement et annulation.", eyebrow: "Abonnement Timviz", heading: "Conditions d’abonnement", intro: "Cette page décrit le fonctionnement des abonnements Timviz Premium, de l’essai gratuit, du renouvellement et de l’annulation." },
    pl: { title: "Warunki subskrypcji Timviz", description: "Warunki Timviz Premium, okresu próbnego, odnowienia i anulowania.", eyebrow: "Subskrypcja Timviz", heading: "Warunki subskrypcji", intro: "Ta strona opisuje działanie subskrypcji Timviz Premium, okresu próbnego, odnowienia i anulowania." },
    cs: { title: "Podmínky předplatného Timviz", description: "Podmínky Timviz Premium, zkušební doby, obnovení a zrušení.", eyebrow: "Předplatné Timviz", heading: "Podmínky předplatného", intro: "Tato stránka popisuje, jak funguje Timviz Premium, zkušební doba, obnovení a zrušení." },
    es: { title: "Condiciones de suscripción de Timviz", description: "Condiciones de Timviz Premium, prueba gratuita, renovación y cancelación.", eyebrow: "Suscripción Timviz", heading: "Condiciones de suscripción", intro: "Esta página describe cómo funcionan Timviz Premium, la prueba gratuita, la renovación y la cancelación." },
    de: { title: "Timviz Abonnementbedingungen", description: "Bedingungen für Timviz Premium, Testphase, Verlängerung und Kündigung.", eyebrow: "Timviz Abonnement", heading: "Abonnementbedingungen", intro: "Diese Seite beschreibt, wie Timviz Premium, Testphase, Verlängerung und Kündigung funktionieren." }
  },
  "refund-policy": {
    fr: { title: "Politique de remboursement Timviz", description: "Règles de remboursement pour les abonnements et services numériques Timviz.", eyebrow: "Remboursements Timviz", heading: "Politique de remboursement", intro: "Cette page explique comment Timviz traite les demandes de remboursement liées aux abonnements et aux services numériques." },
    pl: { title: "Polityka zwrotów Timviz", description: "Zasady zwrotów dla subskrypcji i usług cyfrowych Timviz.", eyebrow: "Zwroty Timviz", heading: "Polityka zwrotów", intro: "Ta strona wyjaśnia, jak Timviz obsługuje prośby o zwrot dotyczące subskrypcji i usług cyfrowych." },
    cs: { title: "Zásady vrácení peněz Timviz", description: "Pravidla vrácení peněz pro předplatné a digitální služby Timviz.", eyebrow: "Vrácení peněz Timviz", heading: "Zásady vrácení peněz", intro: "Tato stránka vysvětluje, jak Timviz řeší žádosti o vrácení peněz za předplatné a digitální služby." },
    es: { title: "Política de reembolso de Timviz", description: "Reglas de reembolso para suscripciones y servicios digitales de Timviz.", eyebrow: "Reembolsos Timviz", heading: "Política de reembolso", intro: "Esta página explica cómo Timviz gestiona solicitudes de reembolso relacionadas con suscripciones y servicios digitales." },
    de: { title: "Timviz Rückerstattungsrichtlinie", description: "Regeln für Rückerstattungen bei Timviz Abonnements und digitalen Services.", eyebrow: "Timviz Rückerstattungen", heading: "Rückerstattungsrichtlinie", intro: "Diese Seite erklärt, wie Timviz Rückerstattungsanfragen zu Abonnements und digitalen Services bearbeitet." }
  },
  support: {
    fr: { title: "Support Timviz", description: "Obtenez de l’aide pour votre compte Timviz, votre abonnement ou le produit.", eyebrow: "Support Timviz", heading: "Support", intro: "Contactez le support Timviz pour toute question liée au compte, à l’abonnement ou au produit." },
    pl: { title: "Pomoc Timviz", description: "Uzyskaj pomoc dotyczącą konta Timviz, subskrypcji lub produktu.", eyebrow: "Pomoc Timviz", heading: "Pomoc", intro: "Skontaktuj się z pomocą Timviz w sprawach konta, subskrypcji lub produktu." },
    cs: { title: "Podpora Timviz", description: "Získejte pomoc s účtem Timviz, předplatným nebo produktem.", eyebrow: "Podpora Timviz", heading: "Podpora", intro: "Kontaktujte podporu Timviz s dotazy k účtu, předplatnému nebo produktu." },
    es: { title: "Soporte Timviz", description: "Obtén ayuda con tu cuenta Timviz, suscripción o producto.", eyebrow: "Soporte Timviz", heading: "Soporte", intro: "Contacta con soporte de Timviz para preguntas sobre cuenta, suscripción o producto." },
    de: { title: "Timviz Support", description: "Erhalten Sie Hilfe zu Ihrem Timviz Konto, Abonnement oder Produkt.", eyebrow: "Timviz Support", heading: "Support", intro: "Kontaktieren Sie den Timviz Support bei Fragen zu Konto, Abonnement oder Produkt." }
  },
  "account-deletion": {
    fr: { title: "Suppression de compte Timviz", description: "Comment demander la suppression de votre compte Timviz et des données associées.", eyebrow: "Compte Timviz", heading: "Suppression de compte", intro: "Cette page explique comment demander la suppression d’un compte Timviz et des données associées." },
    pl: { title: "Usunięcie konta Timviz", description: "Jak poprosić o usunięcie konta Timviz i powiązanych danych.", eyebrow: "Konto Timviz", heading: "Usunięcie konta", intro: "Ta strona wyjaśnia, jak poprosić o usunięcie konta Timviz i powiązanych danych." },
    cs: { title: "Smazání účtu Timviz", description: "Jak požádat o smazání účtu Timviz a souvisejících dat.", eyebrow: "Účet Timviz", heading: "Smazání účtu", intro: "Tato stránka vysvětluje, jak požádat o smazání účtu Timviz a souvisejících dat." },
    es: { title: "Eliminación de cuenta Timviz", description: "Cómo solicitar la eliminación de tu cuenta Timviz y los datos asociados.", eyebrow: "Cuenta Timviz", heading: "Eliminación de cuenta", intro: "Esta página explica cómo solicitar la eliminación de una cuenta Timviz y los datos asociados." },
    de: { title: "Timviz Konto löschen", description: "So beantragen Sie die Löschung Ihres Timviz Kontos und der zugehörigen Daten.", eyebrow: "Timviz Konto", heading: "Konto löschen", intro: "Diese Seite erklärt, wie Sie die Löschung eines Timviz Kontos und der zugehörigen Daten beantragen." }
  },
  contact: {
    fr: { title: "Contacter Timviz", description: "Contactez le support Timviz pour les questions de compte, d’abonnement et de produit.", eyebrow: "Contact Timviz", heading: "Contact", intro: "Contactez-nous au sujet du logiciel de réservation Timviz, de votre compte, de votre abonnement ou d’une demande de support.", sections: [{ title: "Support", paragraphs: ["Email : adm@timviz.com", "Délai de réponse habituel : 1 à 2 jours ouvrés."] }, { title: "Produit", paragraphs: ["Produit : logiciel de réservation Timviz.", "Nom légal de l’entreprise : [LEGAL_BUSINESS_NAME]."] }] },
    pl: { title: "Kontakt z Timviz", description: "Skontaktuj się z pomocą Timviz w sprawach konta, subskrypcji i produktu.", eyebrow: "Kontakt Timviz", heading: "Kontakt", intro: "Skontaktuj się z nami w sprawie oprogramowania Timviz, konta, subskrypcji lub prośby o pomoc.", sections: [{ title: "Pomoc", paragraphs: ["Email: adm@timviz.com", "Typowy czas odpowiedzi: 1–2 dni robocze."] }, { title: "Produkt", paragraphs: ["Produkt: oprogramowanie do rezerwacji Timviz.", "Nazwa prawna firmy: [LEGAL_BUSINESS_NAME]."] }] },
    cs: { title: "Kontakt Timviz", description: "Kontaktujte podporu Timviz s dotazy k účtu, předplatnému a produktu.", eyebrow: "Kontakt Timviz", heading: "Kontakt", intro: "Kontaktujte nás ohledně rezervačního softwaru Timviz, účtu, předplatného nebo podpory.", sections: [{ title: "Podpora", paragraphs: ["Email: adm@timviz.com", "Obvyklá doba odpovědi: 1–2 pracovní dny."] }, { title: "Produkt", paragraphs: ["Produkt: rezervační software Timviz.", "Právní název firmy: [LEGAL_BUSINESS_NAME]."] }] },
    es: { title: "Contactar con Timviz", description: "Contacta con soporte de Timviz para preguntas sobre cuenta, suscripción y producto.", eyebrow: "Contacto Timviz", heading: "Contacto", intro: "Contacta con nosotros sobre el software de reservas Timviz, tu cuenta, suscripción o solicitud de soporte.", sections: [{ title: "Soporte", paragraphs: ["Email: adm@timviz.com", "Tiempo habitual de respuesta: 1–2 días laborables."] }, { title: "Producto", paragraphs: ["Producto: software de reservas Timviz.", "Nombre legal de la empresa: [LEGAL_BUSINESS_NAME]."] }] },
    de: { title: "Timviz kontaktieren", description: "Kontaktieren Sie den Timviz Support bei Fragen zu Konto, Abonnement und Produkt.", eyebrow: "Timviz Kontakt", heading: "Kontakt", intro: "Kontaktieren Sie uns zum Timviz Buchungssystem, Ihrem Konto, Abonnement oder einer Supportanfrage.", sections: [{ title: "Support", paragraphs: ["E-Mail: adm@timviz.com", "Übliche Antwortzeit: 1–2 Werktage."] }, { title: "Produkt", paragraphs: ["Produkt: Timviz Buchungssoftware.", "Rechtlicher Firmenname: [LEGAL_BUSINESS_NAME]."] }] }
  }
};

for (const [type, translations] of Object.entries(legalExtraCopy) as Array<[LegalPageType, NonNullable<(typeof legalExtraCopy)[LegalPageType]>]>) {
  for (const [language, patch] of Object.entries(translations) as Array<[Exclude<SiteLanguage, "ru" | "uk" | "en">, NonNullable<(typeof translations)[Exclude<SiteLanguage, "ru" | "uk" | "en">]>]>) {
    legalCopy[type][language] = {
      ...legalCopy[type].en,
      ...patch,
      sections: patch.sections ?? legalCopy[type].en.sections
    };
  }
}

export function buildLegalMetadata(type: LegalPageType, language: SiteLanguage): Metadata {
  const copy = legalCopy[type][language];
  const pathname = `/${language}/${type}`;
  const metadata = buildMetadata(pathname, copy, language);

  return {
    ...metadata,
    alternates: buildLanguageAlternates(`/${type}`, language)
  };
}

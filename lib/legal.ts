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
            "Пользователи сами отвечают за свои записи, услуги, цены, выполнение работ и отношения с клиентами. Юридическое название компании: [LEGAL_BUSINESS_NAME]. Поддержка: adm@timviz.com."
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
            "Користувачі самі відповідають за свої записи, послуги, ціни, виконання робіт і відносини з клієнтами. Юридична назва компанії: [LEGAL_BUSINESS_NAME]. Підтримка: adm@timviz.com."
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
            "Доступ PRO действует до даты окончания доступа, рассчитанной по активной подписке, пробному периоду, промо или ручной активации."
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
            "Доступ PRO діє до дати завершення доступу, розрахованої за активною підпискою, пробним періодом, промо або ручною активацією."
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
            "PRO access remains active until the access end date calculated from an active subscription, trial, promo or manual activation."
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
            "If a user has multiple active access sources, Timviz applies the latest PRO access end date."
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
        { title: "Удаление аккаунта", paragraphs: ["Удаление можно инициировать внутри iOS-приложения в меню Аккаунт → Удалить аккаунт.", "Также можно обратиться на adm@timviz.com, если доступ к аккаунту потерян."] }
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
        { title: "Видалення акаунта", paragraphs: ["Видалення можна ініціювати в iOS-застосунку в меню Акаунт → Видалити акаунт.", "Також можна звернутися на adm@timviz.com, якщо доступ до акаунта втрачено."] }
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
        { title: "В приложении", paragraphs: ["Откройте Аккаунт → Удалить аккаунт, прочитайте предупреждение, введите DELETE и подтвердите действие.", "После подтверждения аккаунт помечается как удалённый, персональные поля очищаются там, где это возможно, и выполняется выход из приложения."] },
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
        { title: "У застосунку", paragraphs: ["Відкрийте Акаунт → Видалити акаунт, прочитайте попередження, введіть DELETE і підтвердьте дію.", "Після підтвердження акаунт позначається як видалений, персональні поля очищуються там, де це можливо, і виконується вихід із застосунку."] },
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

type ExtraLegalLanguage = Exclude<SiteLanguage, "ru" | "uk" | "en">;

const legalExtraSections: Record<LegalPageType, Record<ExtraLegalLanguage, LegalCopy["sections"]>> = {
  privacy: {
    fr: [
      {
        title: "Données que nous traitons",
        paragraphs: [
          "Nous pouvons stocker votre nom, email, téléphone, langue d’interface, informations d’entreprise, services, planning, réservations clients, photos et données techniques nécessaires au fonctionnement de la plateforme.",
          "Si vous vous connectez avec Google, nous pouvons recevoir des informations de profil de base, comme le nom, l’email et la langue, afin de créer ou relier votre compte."
        ]
      },
      {
        title: "Pourquoi nous utilisons les données",
        paragraphs: [
          "Les données servent à l’authentification, à la création de compte, à la gestion du calendrier, aux réservations, aux fiches publiques, à l’assistance et à la sécurité des comptes.",
          "Nous pouvons aussi utiliser des données techniques agrégées pour améliorer la fiabilité, la sécurité et l’expérience du produit."
        ]
      },
      {
        title: "Photos, services et contenu d’entreprise",
        paragraphs: [
          "Les utilisateurs peuvent ajouter des photos, services, descriptions et autres contenus liés à leur entreprise. Ces informations peuvent être affichées publiquement dans les fiches et les résultats de recherche.",
          "Les administrateurs de la plateforme peuvent modérer ce contenu s’il enfreint les règles du service ou affecte la sécurité de la plateforme."
        ]
      },
      {
        title: "Abonnements et paiements",
        paragraphs: [
          "L’email peut être utilisé pour le compte, l’abonnement, l’assistance, les notifications de service et les messages importants concernant Timviz.",
          "Le statut de paiement d’un abonnement peut provenir d’Apple In-App Purchase pour iOS ou de Monobank pour les paiements sur le site. Timviz ne stocke pas les numéros complets de carte bancaire."
        ]
      },
      {
        title: "Conservation et protection",
        paragraphs: [
          "Nous cherchons à conserver les données uniquement aussi longtemps que nécessaire pour exploiter le service, remplir nos obligations et protéger la plateforme.",
          "Des restrictions d’accès, contrôles côté serveur, mécanismes de récupération et autres mesures techniques raisonnables protègent la plateforme."
        ]
      },
      {
        title: "Contact",
        paragraphs: [
          "Si vous souhaitez savoir quelles données sont liées à votre compte ou mettre à jour vos informations, contactez-nous via les coordonnées publiées sur le site Timviz."
        ]
      }
    ],
    pl: [
      {
        title: "Jakie dane przetwarzamy",
        paragraphs: [
          "Możemy przechowywać imię i nazwisko, email, telefon, język interfejsu, dane firmy, usługi, grafik, rezerwacje klientów, zdjęcia oraz dane techniczne potrzebne do działania platformy.",
          "Jeśli logujesz się przez Google, możemy otrzymać podstawowe dane profilu, takie jak imię, email i język, aby utworzyć lub połączyć konto."
        ]
      },
      {
        title: "Dlaczego używamy danych",
        paragraphs: [
          "Dane są używane do logowania, tworzenia konta, zarządzania kalendarzem, rezerwacji klientów, publicznych wizytówek firm, wsparcia użytkowników i bezpieczeństwa kont.",
          "Możemy też używać zagregowanych danych technicznych, aby poprawiać stabilność, bezpieczeństwo i wygodę produktu."
        ]
      },
      {
        title: "Zdjęcia, usługi i treści firmy",
        paragraphs: [
          "Użytkownicy mogą dodawać zdjęcia, usługi, opisy i inne materiały dotyczące firmy. Te informacje mogą być widoczne publicznie w wizytówkach i wynikach wyszukiwania.",
          "Administratorzy platformy mogą moderować takie treści, jeśli naruszają zasady usługi lub wpływają na bezpieczeństwo platformy."
        ]
      },
      {
        title: "Subskrypcje i płatności",
        paragraphs: [
          "Email może być używany do konta, subskrypcji, wsparcia, powiadomień serwisowych i ważnych wiadomości dotyczących Timviz.",
          "Status płatności subskrypcji może pochodzić z Apple In-App Purchase dla iOS albo z Monobank dla płatności na stronie. Timviz nie przechowuje pełnych numerów kart."
        ]
      },
      {
        title: "Przechowywanie i ochrona",
        paragraphs: [
          "Staramy się przechowywać dane tylko tak długo, jak jest to potrzebne do działania usługi, wypełnienia zobowiązań i bezpieczeństwa platformy.",
          "Platformę chronią ograniczenia dostępu, kontrole po stronie serwera, mechanizmy odzyskiwania oraz inne rozsądne środki techniczne."
        ]
      },
      {
        title: "Kontakt",
        paragraphs: [
          "Jeśli chcesz wyjaśnić, jakie dane są powiązane z Twoim kontem, albo zaktualizować informacje, skontaktuj się z nami przez dane podane na stronie Timviz."
        ]
      }
    ],
    cs: [
      {
        title: "Jaká data zpracováváme",
        paragraphs: [
          "Můžeme ukládat jméno, email, telefon, jazyk rozhraní, údaje firmy, služby, rozvrh, rezervace klientů, fotografie a technická data potřebná pro provoz platformy.",
          "Pokud se přihlásíte přes Google, můžeme získat základní údaje profilu, například jméno, email a jazyk, abychom vytvořili nebo propojili váš účet."
        ]
      },
      {
        title: "Proč data používáme",
        paragraphs: [
          "Data používáme k přihlášení, vytvoření účtu, správě kalendáře, rezervacím klientů, veřejným profilům firem, podpoře uživatelů a zabezpečení účtů.",
          "Můžeme také používat agregovaná technická data ke zlepšení spolehlivosti, bezpečnosti a použitelnosti produktu."
        ]
      },
      {
        title: "Fotografie, služby a obsah firmy",
        paragraphs: [
          "Uživatelé mohou přidávat firemní fotografie, služby, popisy a další související obsah. Tyto informace se mohou zobrazovat veřejně v profilech firem a výsledcích hledání.",
          "Administrátoři platformy mohou tento obsah moderovat, pokud porušuje pravidla služby nebo ovlivňuje bezpečnost platformy."
        ]
      },
      {
        title: "Předplatné a platby",
        paragraphs: [
          "Email může být použit pro účet, předplatné, podporu, servisní oznámení a důležité zprávy o Timviz.",
          "Stav platby předplatného může poskytovat Apple In-App Purchase pro iOS nebo Monobank pro platby na webu. Timviz neukládá úplná čísla platebních karet."
        ]
      },
      {
        title: "Uchovávání a ochrana",
        paragraphs: [
          "Snažíme se uchovávat data pouze tak dlouho, jak je potřeba pro provoz služby, plnění povinností a zabezpečení platformy.",
          "Platformu chrání omezení přístupu, kontroly na serveru, mechanismy obnovy a další přiměřená technická opatření."
        ]
      },
      {
        title: "Kontakt",
        paragraphs: [
          "Pokud potřebujete upřesnit, jaká data jsou spojena s vaším účtem, nebo chcete aktualizovat informace, kontaktujte nás přes údaje uvedené na webu Timviz."
        ]
      }
    ],
    es: [
      {
        title: "Qué datos procesamos",
        paragraphs: [
          "Podemos almacenar tu nombre, email, teléfono, idioma de la interfaz, datos de empresa, servicios, horario, reservas de clientes, fotos y datos técnicos necesarios para operar la plataforma.",
          "Si inicias sesión con Google, podemos recibir datos básicos del perfil, como nombre, email e idioma, para crear o vincular tu cuenta."
        ]
      },
      {
        title: "Por qué usamos los datos",
        paragraphs: [
          "Usamos datos para autenticación, creación de cuentas, gestión del calendario, reservas de clientes, fichas públicas de empresas, soporte y seguridad de cuentas.",
          "También podemos usar datos técnicos agregados para mejorar la fiabilidad, la seguridad y la usabilidad del producto."
        ]
      },
      {
        title: "Fotos, servicios y contenido de empresa",
        paragraphs: [
          "Los usuarios pueden subir fotos de empresa, servicios, descripciones y contenido relacionado. Esta información puede mostrarse públicamente en fichas y resultados de búsqueda.",
          "Los administradores de la plataforma pueden moderar este contenido si infringe las reglas del servicio o afecta a la seguridad de la plataforma."
        ]
      },
      {
        title: "Suscripciones y pagos",
        paragraphs: [
          "El email puede usarse para la cuenta, suscripción, soporte, notificaciones de servicio y mensajes importantes de Timviz.",
          "El estado de pago de la suscripción puede venir de Apple In-App Purchase para iOS o de Monobank para pagos en el sitio. Timviz no almacena números completos de tarjetas."
        ]
      },
      {
        title: "Conservación y protección",
        paragraphs: [
          "Intentamos conservar los datos solo durante el tiempo necesario para operar el servicio, cumplir obligaciones y mantener segura la plataforma.",
          "Usamos restricciones de acceso, comprobaciones del servidor, mecanismos de recuperación y otras medidas técnicas razonables para proteger la plataforma."
        ]
      },
      {
        title: "Contacto",
        paragraphs: [
          "Si necesitas aclarar qué datos están vinculados a tu cuenta o quieres actualizar tu información, contáctanos con los datos publicados en el sitio de Timviz."
        ]
      }
    ],
    de: [
      {
        title: "Welche Daten wir verarbeiten",
        paragraphs: [
          "Wir können Name, E-Mail, Telefonnummer, Sprache der Oberfläche, Unternehmensdaten, Dienstleistungen, Zeitplan, Kundenbuchungen, Fotos und technische Daten speichern, die für den Betrieb der Plattform erforderlich sind.",
          "Wenn Sie sich mit Google anmelden, können wir grundlegende Profildaten wie Name, E-Mail und Sprache erhalten, um Ihr Konto zu erstellen oder zu verbinden."
        ]
      },
      {
        title: "Warum wir Daten verwenden",
        paragraphs: [
          "Wir verwenden Daten für Anmeldung, Kontoerstellung, Kalenderverwaltung, Kundenbuchungen, öffentliche Unternehmensprofile, Hilfe und Kontosicherheit.",
          "Außerdem können wir aggregierte technische Daten nutzen, um Zuverlässigkeit, Sicherheit und Benutzerfreundlichkeit des Produkts zu verbessern."
        ]
      },
      {
        title: "Fotos, Dienstleistungen und Unternehmensinhalte",
        paragraphs: [
          "Nutzer können Unternehmensfotos, Dienstleistungen, Beschreibungen und weitere Inhalte hochladen. Diese Informationen können öffentlich in Unternehmensprofilen und Suchergebnissen erscheinen.",
          "Plattformadministratoren können solche Inhalte moderieren, wenn sie gegen Serviceregeln verstoßen oder die Sicherheit der Plattform beeinträchtigen."
        ]
      },
      {
        title: "Abonnements und Zahlungen",
        paragraphs: [
          "Die E-Mail kann für Konto, Abonnement, Hilfe, Servicemitteilungen und wichtige Timviz Produktnachrichten verwendet werden.",
          "Der Zahlungsstatus eines Abonnements kann von Apple In-App Purchase für iOS oder von Monobank für Website-Zahlungen kommen. Timviz speichert keine vollständigen Kartennummern."
        ]
      },
      {
        title: "Speicherung und Schutz",
        paragraphs: [
          "Wir möchten Daten nur so lange speichern, wie es für den Betrieb des Dienstes, die Erfüllung von Pflichten und die Sicherheit der Plattform erforderlich ist.",
          "Zugriffsbeschränkungen, serverseitige Prüfungen, Wiederherstellungsmechanismen und weitere angemessene technische Schutzmaßnahmen schützen die Plattform."
        ]
      },
      {
        title: "Kontakt",
        paragraphs: [
          "Wenn Sie klären möchten, welche Daten mit Ihrem Konto verbunden sind, oder Informationen aktualisieren wollen, kontaktieren Sie uns über die auf der Timviz Website veröffentlichten Angaben."
        ]
      }
    ]
  },
  terms: {
    fr: [
      {
        title: "Utilisation du service",
        paragraphs: [
          "Timviz fournit des outils pour la réservation en ligne, la gestion du planning, les clients, les services, les photos d’entreprise et les pages publiques.",
          "L’utilisateur s’engage à fournir des informations exactes et à ne pas utiliser le service pour une activité illégale, trompeuse ou nuisible."
        ]
      },
      {
        title: "Comptes et accès",
        paragraphs: [
          "L’utilisateur est responsable de la conservation de l’accès à son compte et des actions effectuées sous ce compte.",
          "Timviz peut limiter l’accès en cas d’activité suspecte, de violation des règles ou de risque de sécurité."
        ]
      },
      {
        title: "Contenu des utilisateurs",
        paragraphs: [
          "L’utilisateur est responsable des services, descriptions, photos, prix, plannings et autres contenus ajoutés à la plateforme.",
          "Timviz peut masquer, limiter ou supprimer un contenu qui enfreint les règles, induit les utilisateurs en erreur ou perturbe la plateforme."
        ]
      },
      {
        title: "Abonnements Timviz",
        paragraphs: [
          "Timviz est un logiciel de réservation pour gérer les entreprises de services. Timviz vend des abonnements logiciels donnant accès aux fonctions SaaS de la plateforme.",
          "Un abonnement Premium se renouvelle automatiquement après l’essai gratuit sauf s’il est annulé avant le renouvellement. Les utilisateurs peuvent annuler à tout moment."
        ]
      },
      {
        title: "Réservations et interactions avec les clients",
        paragraphs: [
          "Timviz aide à organiser le processus de réservation, mais la qualité et la prestation réelle du service relèvent de l’entreprise ou du professionnel.",
          "Les entreprises sont responsables de maintenir à jour les horaires, prix, services et créneaux disponibles."
        ]
      },
      {
        title: "Abonnements et services tiers",
        paragraphs: [
          "Sur iOS, les abonnements Timviz sont achetés via Apple In-App Purchase. Sur le site, les paiements d’abonnement peuvent être traités via Monobank.",
          "Timviz fournit des outils logiciels pour la réservation et la gestion d’entreprise. Timviz ne vend pas de services tiers, n’agit pas comme marketplace et ne traite pas les paiements entre clients et prestataires.",
          "Les utilisateurs sont responsables de leurs propres réservations, services, prix, prestations et relations avec les clients. Nom légal de l’entreprise : [LEGAL_BUSINESS_NAME]. Assistance : adm@timviz.com."
        ]
      },
      {
        title: "Évolution du service",
        paragraphs: [
          "Nous pouvons mettre à jour les fonctions, l’interface, les tarifs, les limites et les règles internes de la plateforme à mesure que le service évolue.",
          "En continuant à utiliser Timviz, l’utilisateur accepte la version actuelle de ces conditions."
        ]
      }
    ],
    pl: [
      {
        title: "Korzystanie z usługi",
        paragraphs: [
          "Timviz udostępnia narzędzia do rezerwacji online, zarządzania grafikiem, klientami, usługami, zdjęciami firmy i publicznymi stronami firm.",
          "Użytkownik zobowiązuje się podawać prawidłowe dane i nie używać usługi do działań nielegalnych, wprowadzających w błąd lub szkodliwych."
        ]
      },
      {
        title: "Konta i dostęp",
        paragraphs: [
          "Użytkownik odpowiada za utrzymanie dostępu do konta oraz za działania wykonane na tym koncie.",
          "Timviz może ograniczyć dostęp, jeśli wykryje podejrzaną aktywność, naruszenie zasad lub ryzyko bezpieczeństwa."
        ]
      },
      {
        title: "Treści użytkowników",
        paragraphs: [
          "Użytkownik odpowiada za usługi, opisy, zdjęcia, ceny, grafiki i inne treści dodane do platformy.",
          "Timviz może ukryć, ograniczyć lub usunąć treści, które naruszają zasady, wprowadzają użytkowników w błąd lub zakłócają działanie platformy."
        ]
      },
      {
        title: "Subskrypcje Timviz",
        paragraphs: [
          "Timviz to oprogramowanie do rezerwacji i zarządzania firmami usługowymi. Timviz sprzedaje subskrypcje oprogramowania dające dostęp do funkcji SaaS platformy.",
          "Subskrypcja Premium odnawia się automatycznie po okresie próbnym, jeśli nie zostanie anulowana przed odnowieniem. Użytkownik może anulować ją w dowolnym momencie."
        ]
      },
      {
        title: "Rezerwacje i relacje z klientami",
        paragraphs: [
          "Timviz pomaga organizować proces rezerwacji, ale faktyczna jakość i wykonanie usługi zależą od firmy lub specjalisty.",
          "Firmy odpowiadają za aktualność grafików, cen, usług i dostępnych terminów."
        ]
      },
      {
        title: "Subskrypcje i usługi zewnętrzne",
        paragraphs: [
          "Na iOS subskrypcje Timviz są kupowane przez Apple In-App Purchase. Na stronie płatności za subskrypcję mogą być obsługiwane przez Monobank.",
          "Timviz udostępnia narzędzia programowe do rezerwacji i zarządzania firmą. Timviz nie sprzedaje usług zewnętrznych, nie jest marketplace i nie obsługuje płatności między klientami a usługodawcami.",
          "Użytkownicy odpowiadają za własne rezerwacje, usługi, ceny, wykonanie i relacje z klientami. Nazwa prawna firmy: [LEGAL_BUSINESS_NAME]. Pomoc: adm@timviz.com."
        ]
      },
      {
        title: "Zmiany usługi",
        paragraphs: [
          "Możemy aktualizować funkcje produktu, interfejs, ceny, limity i wewnętrzne zasady platformy wraz z rozwojem usługi.",
          "Kontynuując korzystanie z Timviz, użytkownik akceptuje aktualną wersję tych warunków."
        ]
      }
    ],
    cs: [
      {
        title: "Používání služby",
        paragraphs: [
          "Timviz poskytuje nástroje pro online rezervace, správu rozvrhu, klientů, služeb, firemních fotografií a veřejných stránek firem.",
          "Uživatel se zavazuje poskytovat správné údaje a nepoužívat službu k nezákonné, klamavé nebo škodlivé aktivitě."
        ]
      },
      {
        title: "Účty a přístup",
        paragraphs: [
          "Uživatel odpovídá za zachování přístupu ke svému účtu a za akce provedené pod tímto účtem.",
          "Timviz může omezit přístup, pokud zjistí podezřelou aktivitu, porušení pravidel nebo bezpečnostní riziko."
        ]
      },
      {
        title: "Obsah uživatelů",
        paragraphs: [
          "Uživatel odpovídá za služby, popisy, fotografie, ceny, rozvrhy a další obsah přidaný na platformu.",
          "Timviz může skrýt, omezit nebo odstranit obsah, který porušuje pravidla, uvádí uživatele v omyl nebo narušuje platformu."
        ]
      },
      {
        title: "Předplatné Timviz",
        paragraphs: [
          "Timviz je rezervační software pro správu servisních firem. Timviz prodává softwarová předplatná, která poskytují přístup k SaaS funkcím platformy.",
          "Předplatné Premium se po bezplatné zkušební době automaticky obnovuje, pokud není před obnovením zrušeno. Uživatelé ho mohou zrušit kdykoli."
        ]
      },
      {
        title: "Rezervace a interakce s klienty",
        paragraphs: [
          "Timviz pomáhá organizovat rezervační proces, ale skutečnou kvalitu a provedení služby určuje firma nebo specialista.",
          "Firmy odpovídají za aktuálnost rozvrhů, cen, služeb a dostupných časových slotů."
        ]
      },
      {
        title: "Předplatné a služby třetích stran",
        paragraphs: [
          "Na iOS se předplatné Timviz kupuje přes Apple In-App Purchase. Na webu mohou být platby za předplatné zpracovány přes Monobank.",
          "Timviz poskytuje softwarové nástroje pro rezervace a správu firmy. Timviz neprodává služby třetích stran, nepůsobí jako marketplace a nezpracovává platby mezi klienty a poskytovateli služeb.",
          "Uživatelé odpovídají za své rezervace, služby, ceny, poskytování služeb a vztahy s klienty. Právní název firmy: [LEGAL_BUSINESS_NAME]. Podpora: adm@timviz.com."
        ]
      },
      {
        title: "Změny služby",
        paragraphs: [
          "S rozvojem služby můžeme aktualizovat funkce, rozhraní, ceny, limity a interní pravidla platformy.",
          "Pokračováním v používání Timviz uživatel souhlasí s aktuální verzí těchto podmínek."
        ]
      }
    ],
    es: [
      {
        title: "Uso del servicio",
        paragraphs: [
          "Timviz ofrece herramientas para reservas online, gestión de horarios, clientes, servicios, fotos de empresa y páginas públicas.",
          "El usuario acepta proporcionar información correcta y no usar el servicio para actividades ilegales, engañosas o perjudiciales."
        ]
      },
      {
        title: "Cuentas y acceso",
        paragraphs: [
          "El usuario es responsable de mantener el acceso a su cuenta y de las acciones realizadas con esa cuenta.",
          "Timviz puede restringir el acceso si detecta actividad sospechosa, una infracción de las reglas o un riesgo de seguridad."
        ]
      },
      {
        title: "Contenido de los usuarios",
        paragraphs: [
          "El usuario es responsable de los servicios, descripciones, fotos, precios, horarios y demás contenido añadido a la plataforma.",
          "Timviz puede ocultar, limitar o eliminar contenido que infrinja las reglas, confunda a los usuarios o afecte al funcionamiento de la plataforma."
        ]
      },
      {
        title: "Suscripciones Timviz",
        paragraphs: [
          "Timviz es software de reservas para gestionar empresas de servicios. Timviz vende suscripciones de software que dan acceso a funciones SaaS de la plataforma.",
          "Una suscripción Premium se renueva automáticamente tras la prueba gratuita salvo que se cancele antes de la renovación. Los usuarios pueden cancelarla en cualquier momento."
        ]
      },
      {
        title: "Reservas e interacción con clientes",
        paragraphs: [
          "Timviz ayuda a organizar el flujo de reservas, pero la calidad real y la prestación del servicio dependen de la empresa o profesional.",
          "Las empresas son responsables de mantener actualizados horarios, precios, servicios y franjas disponibles."
        ]
      },
      {
        title: "Suscripciones y servicios de terceros",
        paragraphs: [
          "En iOS, las suscripciones Timviz se compran mediante Apple In-App Purchase. En el sitio, los pagos de suscripción pueden procesarse mediante Monobank.",
          "Timviz proporciona herramientas de software para reservas y gestión empresarial. Timviz no vende servicios de terceros, no actúa como marketplace y no procesa pagos entre clientes y proveedores.",
          "Los usuarios son responsables de sus propias reservas, servicios, precios, prestación y relación con clientes. Nombre legal de la empresa: [LEGAL_BUSINESS_NAME]. Soporte: adm@timviz.com."
        ]
      },
      {
        title: "Cambios del servicio",
        paragraphs: [
          "Podemos actualizar funciones, interfaz, precios, límites y reglas internas de la plataforma a medida que evoluciona el servicio.",
          "Al seguir usando Timviz, el usuario acepta la versión actual de estos términos."
        ]
      }
    ],
    de: [
      {
        title: "Nutzung des Dienstes",
        paragraphs: [
          "Timviz bietet Werkzeuge für Online-Buchungen, Zeitplanverwaltung, Kunden, Dienstleistungen, Unternehmensfotos und öffentliche Unternehmensseiten.",
          "Nutzer verpflichten sich, korrekte Informationen anzugeben und den Dienst nicht für rechtswidrige, irreführende oder schädliche Aktivitäten zu verwenden."
        ]
      },
      {
        title: "Konten und Zugriff",
        paragraphs: [
          "Nutzer sind dafür verantwortlich, den Zugriff auf ihr Konto zu sichern und für Handlungen, die unter diesem Konto erfolgen.",
          "Timviz kann den Zugriff einschränken, wenn verdächtige Aktivitäten, Regelverstöße oder Sicherheitsrisiken erkannt werden."
        ]
      },
      {
        title: "Nutzerinhalte",
        paragraphs: [
          "Nutzer sind für Dienstleistungen, Beschreibungen, Fotos, Preise, Zeitpläne und andere Inhalte verantwortlich, die sie zur Plattform hinzufügen.",
          "Timviz kann Inhalte ausblenden, einschränken oder entfernen, wenn sie Regeln verletzen, Nutzer täuschen oder die Plattform stören."
        ]
      },
      {
        title: "Timviz Abonnements",
        paragraphs: [
          "Timviz ist Buchungssoftware zur Verwaltung von Dienstleistungsunternehmen. Timviz verkauft Software-Abonnements mit Zugriff auf SaaS-Funktionen der Plattform.",
          "Ein Premium-Abonnement verlängert sich nach der kostenlosen Testphase automatisch, sofern es nicht vor der Verlängerung gekündigt wird. Nutzer können jederzeit kündigen."
        ]
      },
      {
        title: "Buchungen und Kundeninteraktionen",
        paragraphs: [
          "Timviz hilft, den Buchungsablauf zu organisieren, aber die tatsächliche Qualität und Erbringung der Dienstleistung werden vom Unternehmen oder Profi bestimmt.",
          "Unternehmen sind dafür verantwortlich, Zeitpläne, Preise, Dienstleistungen und verfügbare Termine aktuell zu halten."
        ]
      },
      {
        title: "Abonnements und Drittleistungen",
        paragraphs: [
          "Auf iOS werden Timviz Abonnements über Apple In-App Purchase gekauft. Auf der Website können Abonnementzahlungen über Monobank verarbeitet werden.",
          "Timviz stellt Softwarewerkzeuge für Buchungen und Unternehmensverwaltung bereit. Timviz verkauft keine Drittleistungen, ist kein Marketplace und verarbeitet keine Zahlungen zwischen Kunden und Dienstleistern.",
          "Nutzer sind für ihre eigenen Buchungen, Dienstleistungen, Preise, Leistungserbringung und Kundenbeziehungen verantwortlich. Rechtlicher Firmenname: [LEGAL_BUSINESS_NAME]. Hilfe: adm@timviz.com."
        ]
      },
      {
        title: "Änderungen des Dienstes",
        paragraphs: [
          "Wir können Produktfunktionen, Oberfläche, Preise, Limits und interne Plattformregeln aktualisieren, während sich der Dienst weiterentwickelt.",
          "Durch die weitere Nutzung von Timviz akzeptiert der Nutzer die aktuelle Version dieser Bedingungen."
        ]
      }
    ]
  },
  "subscription-terms": {
    fr: [
      {
        title: "Free et PRO",
        paragraphs: [
          "Free permet de commencer avec les fonctions de base de Timviz. PRO débloque des possibilités étendues, notamment plus de réservations, les notifications, les outils d’équipe et des fonctions supplémentaires pour l’entreprise.",
          "L’accès PRO reste actif jusqu’à la date de fin d’accès calculée selon l’abonnement actif, l’essai, une promotion ou une activation manuelle."
        ]
      },
      {
        title: "Apple In-App Purchase",
        paragraphs: [
          "Dans l’application iOS, les abonnements PRO sont achetés via Apple In-App Purchase. Le paiement est débité de l’identifiant Apple de l’utilisateur.",
          "L’abonnement se renouvelle automatiquement sauf s’il est annulé au moins 24 heures avant la fin de la période en cours. Les utilisateurs peuvent le gérer ou l’annuler dans les réglages Apple ID."
        ]
      },
      {
        title: "Paiements sur le site",
        paragraphs: [
          "Sur le site Timviz, les abonnements peuvent être payés via Monobank. L’accès est activé après un paiement réussi.",
          "Si un utilisateur dispose de plusieurs sources d’accès actives, Timviz applique la date de fin d’accès PRO la plus éloignée."
        ]
      },
      {
        title: "Remboursements et expiration",
        paragraphs: [
          "Après la fin d’une période payée ou d’un essai, les fonctions payantes peuvent être limitées au niveau Free.",
          "Apple traite les remboursements des achats App Store. Les questions sur les paiements du site sont examinées par l’assistance Timviz."
        ]
      }
    ],
    pl: [
      {
        title: "Free i PRO",
        paragraphs: [
          "Free pozwala rozpocząć pracę z podstawowymi funkcjami Timviz. PRO odblokowuje rozszerzone możliwości, w tym większe limity rezerwacji, powiadomienia, narzędzia zespołu i dodatkowe funkcje biznesowe.",
          "Dostęp PRO pozostaje aktywny do daty zakończenia dostępu wyliczonej z aktywnej subskrypcji, okresu próbnego, promocji lub ręcznej aktywacji."
        ]
      },
      {
        title: "Apple In-App Purchase",
        paragraphs: [
          "W aplikacji iOS subskrypcje PRO są kupowane przez Apple In-App Purchase. Płatność jest pobierana z Apple ID użytkownika.",
          "Subskrypcja odnawia się automatycznie, jeśli nie zostanie anulowana co najmniej 24 godziny przed końcem bieżącego okresu. Można nią zarządzać lub anulować w ustawieniach Apple ID."
        ]
      },
      {
        title: "Płatności na stronie",
        paragraphs: [
          "Na stronie Timviz subskrypcje mogą być opłacane przez Monobank. Dostęp aktywuje się po udanej płatności.",
          "Jeśli użytkownik ma kilka aktywnych źródeł dostępu, Timviz stosuje najpóźniejszą datę zakończenia dostępu PRO."
        ]
      },
      {
        title: "Zwroty i wygaśnięcie",
        paragraphs: [
          "Po zakończeniu opłaconego okresu lub okresu próbnego funkcje płatne mogą zostać ograniczone do Free.",
          "Zwroty zakupów w App Store obsługuje Apple. Pytania dotyczące płatności na stronie rozpatruje pomoc Timviz."
        ]
      }
    ],
    cs: [
      {
        title: "Free a PRO",
        paragraphs: [
          "Free umožňuje začít se základními funkcemi Timviz. PRO odemyká rozšířené možnosti, včetně vyšších limitů rezervací, oznámení, týmových nástrojů a dalších firemních funkcí.",
          "Přístup PRO zůstává aktivní do data ukončení přístupu vypočteného z aktivního předplatného, zkušebního období, promo akce nebo ruční aktivace."
        ]
      },
      {
        title: "Apple In-App Purchase",
        paragraphs: [
          "V aplikaci iOS se předplatné PRO kupuje přes Apple In-App Purchase. Platba je stržena z Apple ID uživatele.",
          "Předplatné se automaticky obnovuje, pokud není zrušeno alespoň 24 hodin před koncem aktuálního období. Uživatelé ho mohou spravovat nebo zrušit v nastavení Apple ID."
        ]
      },
      {
        title: "Platby na webu",
        paragraphs: [
          "Na webu Timviz lze předplatné platit přes Monobank. Přístup se aktivuje po úspěšné platbě.",
          "Pokud má uživatel více aktivních zdrojů přístupu, Timviz použije nejpozdější datum ukončení přístupu PRO."
        ]
      },
      {
        title: "Vrácení peněz a vypršení",
        paragraphs: [
          "Po skončení placeného období nebo zkušebního přístupu mohou být placené funkce omezeny zpět na Free.",
          "Vrácení peněz za nákupy v App Store řeší Apple. Otázky k platbám na webu posuzuje podpora Timviz."
        ]
      }
    ],
    es: [
      {
        title: "Free y PRO",
        paragraphs: [
          "Free permite empezar con las funciones básicas de Timviz. PRO desbloquea funciones ampliadas, incluidos límites de reservas más altos, notificaciones, herramientas de equipo y funciones adicionales para empresas.",
          "El acceso PRO permanece activo hasta la fecha de finalización de acceso calculada a partir de una suscripción activa, prueba, promoción o activación manual."
        ]
      },
      {
        title: "Apple In-App Purchase",
        paragraphs: [
          "En la aplicación iOS, las suscripciones PRO se compran mediante Apple In-App Purchase. El pago se carga al Apple ID del usuario.",
          "La suscripción se renueva automáticamente salvo que se cancele al menos 24 horas antes del final del periodo actual. Los usuarios pueden gestionarla o cancelarla en los ajustes de Apple ID."
        ]
      },
      {
        title: "Pagos en el sitio",
        paragraphs: [
          "En el sitio de Timviz, las suscripciones pueden pagarse mediante Monobank. El acceso se activa tras un pago correcto.",
          "Si un usuario tiene varias fuentes de acceso activas, Timviz aplica la fecha de finalización de acceso PRO más lejana."
        ]
      },
      {
        title: "Reembolsos y vencimiento",
        paragraphs: [
          "Después de finalizar un periodo pagado o una prueba, las funciones de pago pueden limitarse de nuevo a Free.",
          "Apple gestiona los reembolsos de compras en App Store. Las preguntas sobre pagos del sitio las revisa el soporte de Timviz."
        ]
      }
    ],
    de: [
      {
        title: "Free und PRO",
        paragraphs: [
          "Free ermöglicht den Start mit den grundlegenden Timviz Funktionen. PRO schaltet erweiterte Möglichkeiten frei, darunter höhere Buchungslimits, Benachrichtigungen, Teamwerkzeuge und zusätzliche Unternehmensfunktionen.",
          "Der PRO-Zugriff bleibt bis zum berechneten Zugriffsende aktiv, das aus aktivem Abonnement, Testphase, Promo oder manueller Aktivierung entsteht."
        ]
      },
      {
        title: "Apple In-App Purchase",
        paragraphs: [
          "In der iOS-App werden PRO-Abonnements über Apple In-App Purchase gekauft. Die Zahlung wird dem Apple ID Konto des Nutzers belastet.",
          "Das Abonnement verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ende des aktuellen Zeitraums gekündigt wird. Nutzer können es in den Apple ID Einstellungen verwalten oder kündigen."
        ]
      },
      {
        title: "Website-Zahlungen",
        paragraphs: [
          "Auf der Timviz Website können Abonnements über Monobank bezahlt werden. Der Zugriff wird nach erfolgreicher Zahlung aktiviert.",
          "Wenn ein Nutzer mehrere aktive Zugriffsquellen hat, verwendet Timviz das späteste PRO-Zugriffsende."
        ]
      },
      {
        title: "Rückerstattungen und Ablauf",
        paragraphs: [
          "Nach Ende eines bezahlten Zeitraums oder einer Testphase können kostenpflichtige Funktionen auf Free beschränkt werden.",
          "Apple bearbeitet Rückerstattungen für App Store Käufe. Fragen zu Website-Zahlungen prüft die Timviz Hilfe."
        ]
      }
    ]
  },
  "refund-policy": {
    fr: [
      {
        title: "Abonnement logiciel",
        paragraphs: [
          "Les paiements Timviz concernent uniquement l’accès au logiciel Timviz et aux fonctions Premium de la plateforme.",
          "Apple traite les remboursements des achats App Store. Les paiements sur le site peuvent être traités via Monobank et ne servent pas à payer les services de spécialistes, salons ou clients."
        ]
      },
      {
        title: "Annulation d’un abonnement",
        paragraphs: [
          "Les utilisateurs peuvent annuler à tout moment. Après annulation, l’accès reste généralement disponible jusqu’à la fin de la période déjà payée.",
          "Si vous pensez avoir été facturé par erreur, contactez adm@timviz.com."
        ]
      },
      {
        title: "Quand un remboursement peut être accepté",
        paragraphs: [
          "Les demandes de remboursement sont examinées individuellement. Un remboursement peut être accepté dans les 14 jours suivant le premier paiement si les fonctions payantes n’ont pas été utilisées de manière substantielle.",
          "Les utilisateurs peuvent annuler le renouvellement de l’abonnement Premium à tout moment.",
          "Aucun remboursement n’est accordé pour des périodes déjà terminées ni en cas d’abus, de fraude ou de violation des règles du service."
        ]
      }
    ],
    pl: [
      {
        title: "Subskrypcja oprogramowania",
        paragraphs: [
          "Płatności Timviz dotyczą wyłącznie dostępu do oprogramowania Timviz i funkcji Premium platformy.",
          "Zwroty zakupów w App Store obsługuje Apple. Płatności na stronie mogą być obsługiwane przez Monobank i nie służą do opłacania usług specjalistów, salonów ani klientów."
        ]
      },
      {
        title: "Anulowanie subskrypcji",
        paragraphs: [
          "Użytkownicy mogą anulować w dowolnym momencie. Po anulowaniu dostęp zwykle pozostaje aktywny do końca już opłaconego okresu.",
          "Jeśli uważasz, że opłata została pobrana przez pomyłkę, napisz na adm@timviz.com."
        ]
      },
      {
        title: "Kiedy zwrot może zostać zatwierdzony",
        paragraphs: [
          "Prośby o zwrot są rozpatrywane indywidualnie. Zwrot może zostać zatwierdzony w ciągu 14 dni od pierwszej płatności, jeśli użytkownik nie korzystał znacząco z funkcji płatnych.",
          "Użytkownik może anulować odnowienie subskrypcji Premium w dowolnym momencie.",
          "Zwroty nie są udzielane za okresy, które już się zakończyły, ani w przypadkach nadużycia, oszustwa lub naruszenia zasad usługi."
        ]
      }
    ],
    cs: [
      {
        title: "Softwarové předplatné",
        paragraphs: [
          "Platby Timviz se týkají pouze přístupu k softwaru Timviz a Premium funkcím platformy.",
          "Vrácení peněz za nákupy v App Store řeší Apple. Platby na webu mohou být zpracovány přes Monobank a nepoužívají se k platbě za služby specialistů, salonů nebo klientů."
        ]
      },
      {
        title: "Zrušení předplatného",
        paragraphs: [
          "Uživatelé mohou zrušit předplatné kdykoli. Po zrušení zůstává přístup obvykle dostupný do konce již zaplaceného období.",
          "Pokud se domníváte, že vám byla částka stržena omylem, kontaktujte adm@timviz.com."
        ]
      },
      {
        title: "Kdy může být vrácení schváleno",
        paragraphs: [
          "Žádosti o vrácení peněz posuzujeme individuálně. Vrácení může být schváleno do 14 dnů od první platby, pokud uživatel podstatně nevyužíval placené funkce.",
          "Uživatelé mohou kdykoli zrušit obnovení předplatného Premium.",
          "Vrácení se neposkytuje za již ukončená období ani v případech zneužití, podvodu nebo porušení pravidel služby."
        ]
      }
    ],
    es: [
      {
        title: "Suscripción de software",
        paragraphs: [
          "Los pagos de Timviz corresponden únicamente al acceso al software Timviz y a las funciones Premium de la plataforma.",
          "Apple gestiona los reembolsos de compras en App Store. Los pagos del sitio pueden procesarse mediante Monobank y no se usan para pagar servicios de profesionales, salones o clientes."
        ]
      },
      {
        title: "Cancelar una suscripción",
        paragraphs: [
          "Los usuarios pueden cancelar en cualquier momento. Después de cancelar, el acceso suele seguir disponible hasta el final del periodo ya pagado.",
          "Si crees que se te cobró por error, contacta con adm@timviz.com."
        ]
      },
      {
        title: "Cuándo puede aprobarse un reembolso",
        paragraphs: [
          "Las solicitudes de reembolso se revisan individualmente. Un reembolso puede aprobarse dentro de los 14 días posteriores al primer pago si el usuario no ha usado de forma significativa las funciones de pago.",
          "Los usuarios pueden cancelar la renovación de la suscripción Premium en cualquier momento.",
          "No se conceden reembolsos por periodos que ya hayan terminado ni en casos de abuso, fraude o infracción de las reglas del servicio."
        ]
      }
    ],
    de: [
      {
        title: "Software-Abonnement",
        paragraphs: [
          "Timviz Zahlungen beziehen sich ausschließlich auf den Zugriff auf die Timviz Software und Premium-Funktionen der Plattform.",
          "Apple bearbeitet Rückerstattungen für App Store Käufe. Website-Zahlungen können über Monobank verarbeitet werden und werden nicht zur Bezahlung von Dienstleistungen von Spezialisten, Salons oder Kunden verwendet."
        ]
      },
      {
        title: "Abonnement kündigen",
        paragraphs: [
          "Nutzer können jederzeit kündigen. Nach der Kündigung bleibt der Zugriff in der Regel bis zum Ende des bereits bezahlten Zeitraums verfügbar.",
          "Wenn Sie glauben, dass Ihnen versehentlich etwas berechnet wurde, kontaktieren Sie adm@timviz.com."
        ]
      },
      {
        title: "Wann Rückerstattungen genehmigt werden können",
        paragraphs: [
          "Rückerstattungsanfragen werden individuell geprüft. Eine Rückerstattung kann innerhalb von 14 Tagen nach der ersten Zahlung genehmigt werden, wenn der Nutzer kostenpflichtige Funktionen nicht wesentlich genutzt hat.",
          "Nutzer können die Verlängerung des Premium-Abonnements jederzeit kündigen.",
          "Für bereits beendete Zeiträume sowie bei Missbrauch, Betrug oder Verstößen gegen Serviceregeln werden keine Rückerstattungen gewährt."
        ]
      }
    ]
  },
  support: {
    fr: [
      { title: "Comment contacter l’assistance", paragraphs: ["Email : adm@timviz.com", "Délai de réponse habituel : 1 à 2 jours ouvrés."] },
      { title: "Gestion de l’abonnement", paragraphs: ["Pour les abonnements Apple, gérez ou annulez l’abonnement dans les réglages Apple ID.", "Pour les questions de paiement sur le site, contactez l’assistance Timviz."] },
      { title: "Suppression de compte", paragraphs: ["La suppression peut être lancée dans l’application iOS depuis Compte → Supprimer le compte.", "Vous pouvez aussi contacter adm@timviz.com si vous ne pouvez pas accéder à votre compte."] }
    ],
    pl: [
      { title: "Jak skontaktować się z pomocą", paragraphs: ["Email: adm@timviz.com", "Typowy czas odpowiedzi: 1–2 dni robocze."] },
      { title: "Zarządzanie subskrypcją", paragraphs: ["Subskrypcjami Apple należy zarządzać lub je anulować w ustawieniach Apple ID.", "W sprawach płatności na stronie skontaktuj się z pomocą Timviz."] },
      { title: "Usunięcie konta", paragraphs: ["Usunięcie można rozpocząć w aplikacji iOS z menu Konto → Usuń konto.", "Możesz też napisać na adm@timviz.com, jeśli nie masz dostępu do konta."] }
    ],
    cs: [
      { title: "Jak kontaktovat podporu", paragraphs: ["Email: adm@timviz.com", "Obvyklá doba odpovědi: 1–2 pracovní dny."] },
      { title: "Správa předplatného", paragraphs: ["Předplatné Apple spravujte nebo rušte v nastavení Apple ID.", "S dotazy k platbám na webu kontaktujte podporu Timviz."] },
      { title: "Smazání účtu", paragraphs: ["Smazání lze zahájit v aplikaci iOS v menu Účet → Smazat účet.", "Pokud se k účtu nemůžete dostat, můžete také kontaktovat adm@timviz.com."] }
    ],
    es: [
      { title: "Cómo contactar con soporte", paragraphs: ["Email: adm@timviz.com", "Tiempo habitual de respuesta: 1–2 días laborables."] },
      { title: "Gestión de la suscripción", paragraphs: ["Para suscripciones de Apple, gestiona o cancela la suscripción en los ajustes de Apple ID.", "Para preguntas sobre pagos del sitio, contacta con soporte de Timviz."] },
      { title: "Eliminación de cuenta", paragraphs: ["La eliminación puede iniciarse en la aplicación iOS desde Cuenta → Eliminar cuenta.", "También puedes contactar con adm@timviz.com si no puedes acceder a tu cuenta."] }
    ],
    de: [
      { title: "Hilfe kontaktieren", paragraphs: ["E-Mail: adm@timviz.com", "Übliche Antwortzeit: 1–2 Werktage."] },
      { title: "Abonnementverwaltung", paragraphs: ["Apple Abonnements verwalten oder kündigen Sie in den Apple ID Einstellungen.", "Bei Fragen zu Website-Zahlungen kontaktieren Sie die Timviz Hilfe."] },
      { title: "Konto löschen", paragraphs: ["Die Löschung kann in der iOS-App über Konto → Konto löschen gestartet werden.", "Sie können auch adm@timviz.com kontaktieren, wenn Sie keinen Zugriff auf Ihr Konto haben."] }
    ]
  },
  "account-deletion": {
    fr: [
      { title: "Dans l’application", paragraphs: ["Ouvrez Compte → Supprimer le compte, lisez l’avertissement, saisissez DELETE et confirmez.", "Après confirmation, le compte est marqué comme supprimé, les champs personnels sont effacés lorsque c’est possible et l’utilisateur est déconnecté."] },
      { title: "Données pouvant être conservées", paragraphs: ["Certaines réservations, événements de paiement et journaux techniques peuvent être conservés si la loi, la sécurité ou les rapports financiers l’exigent.", "Nous cherchons à supprimer ou anonymiser les données personnelles qui ne sont plus nécessaires au fonctionnement du service."] },
      { title: "Contact", paragraphs: ["Si vous ne pouvez pas accéder à votre compte, écrivez à adm@timviz.com depuis l’adresse email du compte."] }
    ],
    pl: [
      { title: "W aplikacji", paragraphs: ["Otwórz Konto → Usuń konto, przeczytaj ostrzeżenie, wpisz DELETE i potwierdź.", "Po potwierdzeniu konto zostaje oznaczone jako usunięte, pola osobowe są czyszczone tam, gdzie to możliwe, a użytkownik zostaje wylogowany."] },
      { title: "Dane, które mogą zostać zachowane", paragraphs: ["Niektóre rezerwacje, zdarzenia płatnicze i logi techniczne mogą być zachowane, jeśli wymagają tego przepisy, bezpieczeństwo lub sprawozdawczość finansowa.", "Staramy się usuwać lub anonimizować dane osobowe, które nie są już potrzebne do działania usługi."] },
      { title: "Kontakt", paragraphs: ["Jeśli nie możesz uzyskać dostępu do konta, napisz na adm@timviz.com z adresu email konta."] }
    ],
    cs: [
      { title: "V aplikaci", paragraphs: ["Otevřete Účet → Smazat účet, přečtěte si upozornění, napište DELETE a potvrďte.", "Po potvrzení je účet označen jako smazaný, osobní pole jsou tam, kde je to možné, vyčištěna a uživatel je odhlášen."] },
      { title: "Data, která mohou být uchována", paragraphs: ["Některé rezervace, platební události a technické záznamy mohou být uchovány, pokud to vyžaduje zákon, bezpečnost nebo finanční evidence.", "Snažíme se odstranit nebo anonymizovat osobní údaje, které již nejsou potřeba pro provoz služby."] },
      { title: "Kontakt", paragraphs: ["Pokud se nemůžete dostat ke svému účtu, kontaktujte adm@timviz.com z emailové adresy účtu."] }
    ],
    es: [
      { title: "Dentro de la aplicación", paragraphs: ["Abre Cuenta → Eliminar cuenta, lee la advertencia, escribe DELETE y confirma.", "Tras la confirmación, la cuenta se marca como eliminada, los campos personales se limpian cuando es posible y el usuario cierra sesión."] },
      { title: "Datos que pueden conservarse", paragraphs: ["Algunas reservas, eventos de pago y registros técnicos pueden conservarse cuando sea necesario por motivos legales, de seguridad o de informes financieros.", "Intentamos eliminar o anonimizar los datos personales que ya no son necesarios para operar el servicio."] },
      { title: "Contacto", paragraphs: ["Si no puedes acceder a tu cuenta, contacta con adm@timviz.com desde el email de la cuenta."] }
    ],
    de: [
      { title: "In der App", paragraphs: ["Öffnen Sie Konto → Konto löschen, lesen Sie den Hinweis, geben Sie DELETE ein und bestätigen Sie.", "Nach der Bestätigung wird das Konto als gelöscht markiert, personenbezogene Felder werden soweit möglich geleert und der Nutzer wird abgemeldet."] },
      { title: "Daten, die aufbewahrt werden können", paragraphs: ["Einige Buchungen, Zahlungsereignisse und technische Protokolle können aufbewahrt werden, wenn dies aus rechtlichen, sicherheitsbezogenen oder finanziellen Gründen erforderlich ist.", "Wir bemühen uns, personenbezogene Daten zu löschen oder zu anonymisieren, die für den Betrieb des Dienstes nicht mehr benötigt werden."] },
      { title: "Kontakt", paragraphs: ["Wenn Sie keinen Zugriff auf Ihr Konto haben, kontaktieren Sie adm@timviz.com von der E-Mail-Adresse des Kontos."] }
    ]
  },
  contact: {
    fr: [
      { title: "Assistance", paragraphs: ["Email : adm@timviz.com", "Délai de réponse habituel : 1 à 2 jours ouvrés."] },
      { title: "Produit", paragraphs: ["Produit : logiciel de réservation Timviz.", "Nom légal de l’entreprise : [LEGAL_BUSINESS_NAME]."] }
    ],
    pl: [
      { title: "Pomoc", paragraphs: ["Email: adm@timviz.com", "Typowy czas odpowiedzi: 1–2 dni robocze."] },
      { title: "Produkt", paragraphs: ["Produkt: oprogramowanie do rezerwacji Timviz.", "Nazwa prawna firmy: [LEGAL_BUSINESS_NAME]."] }
    ],
    cs: [
      { title: "Podpora", paragraphs: ["Email: adm@timviz.com", "Obvyklá doba odpovědi: 1–2 pracovní dny."] },
      { title: "Produkt", paragraphs: ["Produkt: rezervační software Timviz.", "Právní název firmy: [LEGAL_BUSINESS_NAME]."] }
    ],
    es: [
      { title: "Soporte", paragraphs: ["Email: adm@timviz.com", "Tiempo habitual de respuesta: 1–2 días laborables."] },
      { title: "Producto", paragraphs: ["Producto: software de reservas Timviz.", "Nombre legal de la empresa: [LEGAL_BUSINESS_NAME]."] }
    ],
    de: [
      { title: "Hilfe", paragraphs: ["E-Mail: adm@timviz.com", "Übliche Antwortzeit: 1–2 Werktage."] },
      { title: "Produkt", paragraphs: ["Produkt: Timviz Buchungssoftware.", "Rechtlicher Firmenname: [LEGAL_BUSINESS_NAME]."] }
    ]
  }
};

const legalExtraCopy: Partial<
  Record<LegalPageType, Partial<Record<ExtraLegalLanguage, Omit<LegalCopy, "sections"> & { sections?: LegalCopy["sections"] }>>>
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
    fr: { title: "Assistance Timviz", description: "Obtenez de l’aide pour votre compte Timviz, votre abonnement ou le produit.", eyebrow: "Assistance Timviz", heading: "Assistance", intro: "Contactez l’assistance Timviz pour toute question liée au compte, à l’abonnement ou au produit." },
    pl: { title: "Pomoc Timviz", description: "Uzyskaj pomoc dotyczącą konta Timviz, subskrypcji lub produktu.", eyebrow: "Pomoc Timviz", heading: "Pomoc", intro: "Skontaktuj się z pomocą Timviz w sprawach konta, subskrypcji lub produktu." },
    cs: { title: "Podpora Timviz", description: "Získejte pomoc s účtem Timviz, předplatným nebo produktem.", eyebrow: "Podpora Timviz", heading: "Podpora", intro: "Kontaktujte podporu Timviz s dotazy k účtu, předplatnému nebo produktu." },
    es: { title: "Soporte Timviz", description: "Obtén ayuda con tu cuenta Timviz, suscripción o producto.", eyebrow: "Soporte Timviz", heading: "Soporte", intro: "Contacta con soporte de Timviz para preguntas sobre cuenta, suscripción o producto." },
    de: { title: "Timviz Hilfe", description: "Erhalten Sie Hilfe zu Ihrem Timviz Konto, Abonnement oder Produkt.", eyebrow: "Timviz Hilfe", heading: "Hilfe", intro: "Kontaktieren Sie die Timviz Hilfe bei Fragen zu Konto, Abonnement oder Produkt." }
  },
  "account-deletion": {
    fr: { title: "Suppression de compte Timviz", description: "Comment demander la suppression de votre compte Timviz et des données associées.", eyebrow: "Compte Timviz", heading: "Suppression de compte", intro: "Cette page explique comment demander la suppression d’un compte Timviz et des données associées." },
    pl: { title: "Usunięcie konta Timviz", description: "Jak poprosić o usunięcie konta Timviz i powiązanych danych.", eyebrow: "Konto Timviz", heading: "Usunięcie konta", intro: "Ta strona wyjaśnia, jak poprosić o usunięcie konta Timviz i powiązanych danych." },
    cs: { title: "Smazání účtu Timviz", description: "Jak požádat o smazání účtu Timviz a souvisejících dat.", eyebrow: "Účet Timviz", heading: "Smazání účtu", intro: "Tato stránka vysvětluje, jak požádat o smazání účtu Timviz a souvisejících dat." },
    es: { title: "Eliminación de cuenta Timviz", description: "Cómo solicitar la eliminación de tu cuenta Timviz y los datos asociados.", eyebrow: "Cuenta Timviz", heading: "Eliminación de cuenta", intro: "Esta página explica cómo solicitar la eliminación de una cuenta Timviz y los datos asociados." },
    de: { title: "Timviz Konto löschen", description: "So beantragen Sie die Löschung Ihres Timviz Kontos und der zugehörigen Daten.", eyebrow: "Timviz Konto", heading: "Konto löschen", intro: "Diese Seite erklärt, wie Sie die Löschung eines Timviz Kontos und der zugehörigen Daten beantragen." }
  },
  contact: {
    fr: { title: "Contacter Timviz", description: "Contactez l’assistance Timviz pour les questions de compte, d’abonnement et de produit.", eyebrow: "Contact Timviz", heading: "Contact", intro: "Contactez-nous au sujet du logiciel de réservation Timviz, de votre compte, de votre abonnement ou d’une demande d’assistance.", sections: [{ title: "Assistance", paragraphs: ["Email : adm@timviz.com", "Délai de réponse habituel : 1 à 2 jours ouvrés."] }, { title: "Produit", paragraphs: ["Produit : logiciel de réservation Timviz.", "Nom légal de l’entreprise : [LEGAL_BUSINESS_NAME]."] }] },
    pl: { title: "Kontakt z Timviz", description: "Skontaktuj się z pomocą Timviz w sprawach konta, subskrypcji i produktu.", eyebrow: "Kontakt Timviz", heading: "Kontakt", intro: "Skontaktuj się z nami w sprawie oprogramowania Timviz, konta, subskrypcji lub prośby o pomoc.", sections: [{ title: "Pomoc", paragraphs: ["Email: adm@timviz.com", "Typowy czas odpowiedzi: 1–2 dni robocze."] }, { title: "Produkt", paragraphs: ["Produkt: oprogramowanie do rezerwacji Timviz.", "Nazwa prawna firmy: [LEGAL_BUSINESS_NAME]."] }] },
    cs: { title: "Kontakt Timviz", description: "Kontaktujte podporu Timviz s dotazy k účtu, předplatnému a produktu.", eyebrow: "Kontakt Timviz", heading: "Kontakt", intro: "Kontaktujte nás ohledně rezervačního softwaru Timviz, účtu, předplatného nebo podpory.", sections: [{ title: "Podpora", paragraphs: ["Email: adm@timviz.com", "Obvyklá doba odpovědi: 1–2 pracovní dny."] }, { title: "Produkt", paragraphs: ["Produkt: rezervační software Timviz.", "Právní název firmy: [LEGAL_BUSINESS_NAME]."] }] },
    es: { title: "Contactar con Timviz", description: "Contacta con soporte de Timviz para preguntas sobre cuenta, suscripción y producto.", eyebrow: "Contacto Timviz", heading: "Contacto", intro: "Contacta con nosotros sobre el software de reservas Timviz, tu cuenta, suscripción o solicitud de soporte.", sections: [{ title: "Soporte", paragraphs: ["Email: adm@timviz.com", "Tiempo habitual de respuesta: 1–2 días laborables."] }, { title: "Producto", paragraphs: ["Producto: software de reservas Timviz.", "Nombre legal de la empresa: [LEGAL_BUSINESS_NAME]."] }] },
    de: { title: "Timviz kontaktieren", description: "Kontaktieren Sie die Timviz Hilfe bei Fragen zu Konto, Abonnement und Produkt.", eyebrow: "Timviz Kontakt", heading: "Kontakt", intro: "Kontaktieren Sie uns zum Timviz Buchungssystem, Ihrem Konto, Abonnement oder einer Hilfeanfrage.", sections: [{ title: "Hilfe", paragraphs: ["E-Mail: adm@timviz.com", "Übliche Antwortzeit: 1–2 Werktage."] }, { title: "Produkt", paragraphs: ["Produkt: Timviz Buchungssoftware.", "Rechtlicher Firmenname: [LEGAL_BUSINESS_NAME]."] }] }
  }
};

for (const [type, translations] of Object.entries(legalExtraCopy) as Array<[LegalPageType, NonNullable<(typeof legalExtraCopy)[LegalPageType]>]>) {
  for (const [language, patch] of Object.entries(translations) as Array<[ExtraLegalLanguage, NonNullable<(typeof translations)[ExtraLegalLanguage]>]>) {
    legalCopy[type][language] = {
      ...legalCopy[type].en,
      ...patch,
      sections: patch.sections ?? legalExtraSections[type][language]
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

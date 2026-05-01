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
  ctaHint: string;
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
  nicheFitTitle: string;
  nicheFitItems: string[];
  nicheFitSample: string;
  seoBlockTitle: string;
  seoParagraphs: string[];
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

const ukSeoParagraphs = [
  "Для майстрів, які працюють у щільному ритмі, онлайн запис манікюр уже давно став практичною необхідністю. Коли клієнти пишуть одночасно в Instagram, Telegram і Viber, заявки легко губляться, а вільний час витрачається на ручні уточнення. Timviz вирішує цю проблему як програма для манікюру: клієнт бачить доступні слоти, обирає послугу, а запис одразу потрапляє в систему. Це дозволяє перейти від хаотичних переписок до стабільного робочого процесу, де майстер більше часу приділяє якості сервісу, а не адмініструванню.",
  "Запис клієнтів манікюр часто ускладнюється різною тривалістю процедур. Класичний манікюр, гель-лак, дизайн і корекція мають різний таймінг, і без структури легко зробити накладки. Саме тому календар записів у Timviz показує не лише час візиту, а й логіку завантаження дня. Ви бачите, де є вільні вікна, де треба залишити буфер і де краще не ставити довгу процедуру. Такий підхід знижує ризик запізнень, допомагає уникати стресу й підтримує комфортний темп навіть у найбільш завантажені дні.",
  "Коли майстер веде запис вручну, клієнти часто не мають чіткого розуміння ціни й тривалості послуги. Через це виникають уточнення, переноси та непорозуміння в день візиту. У Timviz кожна послуга налаштовується заздалегідь: назва, вартість, тривалість і доступність у розкладі. Програма для манікюру дає прозорий сценарій для обох сторін: клієнт записується на конкретну процедуру, а майстер отримує коректно сформований графік. У результаті запис клієнтів манікюр стає передбачуваним, а сервіс виглядає професійно з першого контакту.",
  "Для приватного майстра важливо, щоб CRM для майстра манікюру не була перевантаженою та складною в запуску. Timviz побудований саме як легкий робочий інструмент: без довгого навчання, без технічного налаштування й без окремого сайту. Ви створюєте профіль, додаєте послуги та відкриваєте посилання на запис. Далі система бере на себе базову організацію потоку заявок. Це особливо зручно, коли потрібно швидко стартувати, не витрачати бюджет на додаткові рішення і при цьому отримати повноцінний календар записів у щоденній роботі.",
  "Окрема перевага Timviz — контроль змін у графіку. У реальній практиці клієнти переносять візити, додають послуги або скасовують запис в останній момент. Якщо все це зберігається в чатах, легко щось пропустити. Календар записів у Timviz миттєво відображає актуальний стан і допомагає приймати рішення без плутанини. Ви швидко бачите, де з’явилося вільне вікно, кому можна запропонувати ранній час і як не зламати структуру дня. Такий формат робить запис клієнтів манікюр системним і суттєво знижує кількість операційних помилок.",
  "Пошукові запити на кшталт «онлайн запис манікюр» або «запис клієнтів манікюр» зазвичай роблять майстри, які хочуть менше ручної комунікації й більше стабільних візитів. Timviz дає саме цей результат: клієнт самостійно бронює час, а ви отримуєте підтверджений запис у своєму кабінеті. Вам не потрібно постійно повертатися до старих повідомлень, щоб перевірити деталі візиту. Усе зібрано в одному місці, і це підвищує конверсію з заявки у реальний візит. Для майстра це означає більш передбачуваний дохід і рівніший графік протягом тижня.",
  "Ще один важливий компонент — Telegram-сповіщення. Навіть якщо ви зайняті процедурою, система повідомляє про нові записи або зміни одразу після їх появи. Це дає швидку реакцію без постійного моніторингу кількох каналів. CRM для майстра манікюру у зв’язці з такими сповіщеннями працює як єдиний центр керування графіком. Ви бачите, що відбувається, і не пропускаєте важливі оновлення, а клієнти отримують більш оперативний сервіс. У підсумку програма для манікюру допомагає тримати високий рівень обслуговування навіть при щільному завантаженні.",
  "Timviz підходить не лише для базових послуг, а й для складніших сценаріїв: комбінацій процедур, тривалих візитів і повторних бронювань. Коли клієнт повертається регулярно, майстру важливо швидко знайти зручне вікно без довгих погоджень. Календар записів дозволяє працювати з повторними візитами значно швидше. Ви бачите повну картину дня, тижня та загального навантаження, а отже можете краще планувати робочі зміни. Такий рівень контролю позитивно впливає і на якість сервісу, і на фінальний дохід майстра.",
  "Щоб онлайн запис манікюр справді працював на конверсію, важливо правильно оформити клієнтський шлях: зрозумілі назви послуг, актуальні ціни, реальні тривалості та доступний час без прихованих нюансів. У Timviz це налаштовується у кілька кроків, тому навіть новачок може швидко запустити робочу схему. Запис клієнтів манікюр стає простішим для клієнта і прогнозованим для майстра. Ви менше переписуєтесь вручну, менше пояснюєте однакові деталі й більше фокусуєтесь на результаті процедури. У довгій перспективі це підвищує лояльність клієнтів і збільшує частку повторних візитів.",
  "Коли майстер починає працювати з системним інструментом, змінюється не лише графік, а й загальна якість бізнес-процесу. Програма для манікюру допомагає краще планувати навантаження, уникати простоїв і формувати рівномірний потік записів протягом тижня. Календар записів стає базою для прийняття рішень: коли додати новий слот, коли закрити день, коли варто перенести довгу процедуру. CRM для майстра манікюру в цьому випадку працює не як складна таблиця, а як зрозумілий помічник, який підказує, де втрачаються заявки й як перетворити інтерес у підтверджений візит.",
  "Якщо узагальнити, Timviz закриває ключові задачі майстра: онлайн запис манікюр, структурований запис клієнтів манікюр, гнучкий календар записів, зрозуміла CRM для майстра манікюру та швидкий старт без технічних складнощів. Це не складна корпоративна система, а практичний інструмент для щоденної роботи. Програма для манікюру допомагає навести порядок, скоротити хаос у переписках і підвищити конверсію в реальні візити. Саме тому все більше майстрів переходять на такий формат і отримують стабільніший, більш контрольований робочий процес."
];

const copy: Record<SiteLanguage, Copy> = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для мастера маникюра",
    subtitle: "Принимайте записи клиентов онлайн, ведите календарь, услуги, цены и рабочий график в одном кабинете.",
    ctaPrimary: "Начать принимать записи за 2 минуты",
    ctaSecondary: "Посмотреть возможности",
    ctaAfterSolution: "Начать принимать записи за 2 минуты",
    ctaFinal: "Начать принимать записи за 2 минуты",
    ctaHint: "Без сложных настроек • без сайта • бесплатно",
    microcopy: "Без сложных настроек • запуск за 2 минуты",
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
    reasonsTitle: "Реальные сценарии работы мастера маникюра",
    reasons: [
      "Утро: маникюр с покрытием — 90 мин — 650 грн, запись приходит автоматически в календарь.",
      "День: коррекция + дизайн — 120 мин — 900 грн, клиент сразу видит длительность и цену.",
      "Окно между визитами: система показывает свободный слот на 45 минут для снятия покрытия.",
      "Вечер: повторный клиент записывается сам по ссылке без переписки в мессенджерах.",
      "Перенос визита: статус и время обновляются в календаре без ручных таблиц.",
      "Новая заявка: Telegram-уведомления помогают не пропустить запись в загруженный день."
    ],
    nicheFitTitle: "Идеально для мастеров маникюра",
    nicheFitItems: [
      "Гель-лак — 90 мин — от 650 грн",
      "Наращивание — 150 мин — от 1200 грн",
      "Коррекция — 120 мин — от 900 грн",
      "Педикюр — 75 мин — от 700 грн",
      "Дизайн ногтей — 30 мин — от 250 грн"
    ],
    nicheFitSample: "Маникюр + гель-лак — 90 мин — 700 грн",
    seoBlockTitle: "Программа для записи клиентов для мастеров маникюра",
    seoParagraphs: [
      "Онлайн запись для мастера маникюра давно стала не бонусом, а обязательной частью стабильной загрузки. Когда клиентские обращения идут сразу через Instagram, Telegram и мессенджеры, мастер тратит много времени на уточнения и вручную ищет свободные окна. Timviz решает эту проблему как сервис онлайн-записи: клиент видит доступные слоты, выбирает услугу и моментально создает заявку. В результате онлайн-запись клиентов перестает быть хаотичным процессом, а превращается в понятную систему, где меньше ручной рутины и больше подтвержденных визитов.",
      "Главное преимущество для специалиста — прозрачный календарь записей для мастера маникюра. В одном экране видно, какие процедуры запланированы, сколько времени они занимают и где остаются короткие или длинные окна. Это критично, потому что услуги маникюра отличаются по длительности: базовый маникюр, гель-лак, наращивание, дизайн, коррекция и педикюр занимают разное время. Когда календарь считает это автоматически, график работы мастера становится предсказуемым, а риск накладок между клиентами снижается в разы.",
      "Timviz работает как программа для записи клиентов, в которой можно заранее настроить каждую услугу: название, цену, длительность и доступность по дням. Клиент до записи понимает, сколько стоит процедура и сколько времени она займет, поэтому меньше уточняющих сообщений и спонтанных отмен. Для мастера это дает сильный эффект по конверсии: вместо длинной переписки сразу приходит структурированная запись. Такой формат особенно полезен тем, кто работает один и совмещает обслуживание клиентов с администрированием расписания.",
      "Если вы ищете CRM для мастера маникюра без сложного внедрения, Timviz дает быстрый старт без отдельного сайта и технической настройки. Достаточно создать профиль, добавить услуги маникюра и открыть клиентскую страницу по ссылке. После этого запись клиентов онлайн работает 24/7: люди бронируют время даже вне рабочего дня, а утром у вас уже есть готовые заявки в календаре. Программа для ногтевого мастера в таком формате помогает увеличить загрузку без постоянных звонков и ручной координации.",
      "Практический сценарий выглядит так: утром в расписании стоит маникюр с покрытием на 90 минут, далее коррекция на 120 минут, а между ними остается короткое окно на снятие покрытия. Без системы такие слоты часто теряются, потому что их сложно быстро предложить в переписке. Timviz автоматически показывает доступное время для каждой услуги, поэтому клиент сразу видит подходящий вариант. Это повышает плотность графика без перегруза и делает рабочий день более ровным по доходу и нагрузке.",
      "Отдельно стоит отметить Telegram-уведомления: новые заявки, переносы и отмены приходят сразу, без необходимости постоянно проверять несколько каналов. Для специалиста, который работает руками и не может каждые пять минут отвечать в чат, это критичный инструмент. Telegram-уведомления помогают быстро реагировать на изменения и сохранять контроль над расписанием. В связке с календарем и услугами это формирует полноценный цикл: клиентская запись онлайн, подтверждение, выполнение услуги и повторная запись без лишней ручной работы.",
      "Программа для записи клиентов также помогает выстроить повторные визиты. В nail-сфере многие клиенты возвращаются каждые 2–4 недели, и важно заранее понимать, где есть удобные окна. Когда календарь записей для мастера маникюра всегда актуален, вы быстрее предлагаете альтернативы и реже теряете клиента из-за долгого согласования времени. Это напрямую влияет на выручку: выше доля повторных визитов, меньше пустых часов и меньше ситуаций, когда день формально заполнен, но с неэффективными разрывами.",
      "Для небольших студий Timviz тоже работает эффективно: можно стандартизировать процесс записи, разгрузить администраторские задачи и повысить качество клиентского пути. Сервис онлайн-записи показывает одинаково понятный сценарий для новых и постоянных клиентов: выбор услуги, времени и подтверждение визита. Внутри кабинета мастер или администратор видит ту же структуру, что снижает количество ошибок и недопониманий. Это не перегруженная корпоративная система, а практичный рабочий инструмент для ежедневного применения.",
      "Поисковые запросы вроде «программа для записи клиентов маникюр», «клиентская запись онлайн» или «онлайн-запись клиентов для мастера маникюра» обычно означают конкретный запрос на порядок и конверсию. Timviz закрывает этот запрос: помогает быстро запуститься, держать график под контролем и принимать записи без постоянного ручного администрирования. Вы получаете понятную CRM для мастера маникюра, где услуги, цены, длительность и расписание связаны в одну систему, которая реально экономит время и помогает зарабатывать стабильнее.",
      "Итоговый результат для мастера — не просто красивый календарь, а управляемый поток записей. Программа для ногтевого мастера позволяет уменьшить хаос в коммуникации, ускорить подтверждение заявок и выстроить рабочий ритм без перегрузки. Когда график работы мастера понятен и прозрачен для клиента, доверие к специалисту растет, а запись клиентов онлайн превращается в устойчивый канал продаж. Именно поэтому Timviz подходит как для старта частной практики, так и для роста уже работающего кабинета маникюра.",
      "В повседневной работе особенно ценны микросценарии, которые съедают время: срочный перенос, запись «на сегодня», изменение услуги в последний момент. Когда такие ситуации решаются вручную, мастер быстро устает от администрирования. В Timviz изменения сразу отражаются в календаре, а клиент видит только актуальные слоты. Это повышает операционную устойчивость даже в загруженные дни. Сервис онлайн-записи в таком формате помогает не терять фокус на качестве процедуры и поддерживать высокий стандарт обслуживания без перегруза.",
      "Для продвижения услуг маникюра онлайн важна скорость ответа, и здесь автоматизированная запись выигрывает у чатов. Клиент не ждет подтверждения, а завершает бронирование в тот момент, когда готов записаться. Для мастера это означает больше закрытых заявок и меньше «остывших» лидов. Программа для записи клиентов работает как постоянный конвертер спроса в визиты: пока вы заняты с текущим клиентом, новые заявки продолжают приходить в систему и формировать заполненный, предсказуемый график."
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
    title: "Онлайн-запис для майстрів манікюру",
    subtitle: "Приймайте записи клієнтів онлайн, ведіть календар і не втрачайте клієнтів",
    ctaPrimary: "Почати приймати записи за 2 хвилини",
    ctaSecondary: "Подивитися можливості",
    ctaAfterSolution: "Почати приймати записи за 2 хвилини",
    ctaFinal: "Почати приймати записи за 2 хвилини",
    ctaHint: "Без сайту • без складних налаштувань",
    microcopy: "Без складних налаштувань • без сайту • безкоштовно",
    sampleClient: "Клієнт: Анна К.",
    sampleService: "Манікюр із покриттям · 90 хв",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо майстру манікюру?",
    problems: [
      {
        title: "Клієнти пишуть в Instagram",
        text: "Записи залишаються в чатах і їх легко втратити."
      },
      {
        title: "Записи губляться",
        text: "Складно швидко зрозуміти хто і коли записаний."
      },
      {
        title: "Різна тривалість послуг",
        text: "Манікюр, гель-лак і нарощування займають різний час."
      },
      {
        title: "Накладки по часу",
        text: "Клієнти можуть бути записані на один час."
      },
      {
        title: "Клієнти забувають",
        text: "Без нагадувань клієнти не приходять."
      },
      {
        title: "Немає вільних вікон",
        text: "Складно швидко знайти час."
      }
    ],
    solutionTitle: "Timviz наводить порядок у записах",
    solutionText:
      "Timviz допомагає майстру манікюру приймати онлайн-запис клієнтів, показувати вільний час, вести календар процедур і керувати послугами без хаосу в месенджерах.",
    solutionCards: [
      {
        title: "Онлайн-запис 24/7",
        text: "Клієнти записуються самі без дзвінків."
      },
      {
        title: "Календар записів",
        text: "Усі записи в одному місці."
      },
      {
        title: "Послуги з ціною",
        text: "Клієнт бачить вартість і тривалість."
      },
      {
        title: "Графік роботи",
        text: "Налаштуйте робочі дні."
      },
      {
        title: "Telegram",
        text: "Отримуйте записи миттєво."
      },
      {
        title: "Клієнтська сторінка для запису",
        text: "Клієнти записуються самі."
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
    serviceSample: "Манікюр + гель-лак — 90 хв — 700 грн",
    calendarTitle: "Календар записів для майстра манікюру",
    calendarText:
      "У календарі видно всі записи, тривалість процедур, вільні вікна та завантаженість дня. Це допомагає не створювати накладок і не втрачати час між візитами.",
    calendarItems: ["денний календар", "тижневий графік", "вільні вікна", "статуси записів", "повторні візити"],
    howTitle: "Як працює онлайн-запис",
    howSteps: ["Створіть профіль", "Додайте послуги", "Почніть приймати записи"],
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
    nicheFitTitle: "Ідеально для майстрів манікюру",
    nicheFitItems: ["гель-лак", "нарощування", "дизайн", "корекція", "педикюр"],
    nicheFitSample: "Манікюр + гель-лак — 90 хв — 700 грн",
    seoBlockTitle: "Програма для запису клієнтів для майстрів манікюру",
    seoParagraphs: ukSeoParagraphs,
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
    ctaHint: "No website needed • no complex setup",
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
    nicheFitTitle: "Perfect for nail technicians",
    nicheFitItems: ["gel polish", "extensions", "nail design", "correction", "pedicure"],
    nicheFitSample: "Manicure + gel polish — 90 min — 700 UAH",
    seoBlockTitle: "Client booking software for nail technicians",
    seoParagraphs: [
      "Timviz helps nail technicians run online booking with clear scheduling and less messenger chaos.",
      "You can manage services, durations and prices from one calendar-based workflow.",
      "This is a practical lightweight CRM setup for professionals who need higher booking conversion."
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
          <small className="hair-cta-caption">{t.ctaHint}</small>
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

      <section className="business-feature-section niche-showcase-section">
        <div className="niche-showcase-copy">
          <div className="business-section-head">
            <h2>{t.nicheFitTitle}</h2>
          </div>
          <ul className="business-seo-list">{t.nicheFitItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <article className="manicure-service-card niche-showcase-card">
          <img src={screenshots.week} alt={t.screenshotAltServices} loading="lazy" />
          <strong>{t.nicheFitSample}</strong>
        </article>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.seoBlockTitle}</h2>
        </div>
        <div className="hair-seo-text">
          {t.seoParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
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
        <small className="hair-cta-caption">{t.ctaHint}</small>
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

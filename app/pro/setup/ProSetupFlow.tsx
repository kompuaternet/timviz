"use client";

import type { SVGProps } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import styles from "../pro.module.css";
import { isProLanguage, profileLanguageFromCode, type ProLanguage } from "../i18n";
import type { AccountDraft, JoinBusinessSearchResult } from "../../../lib/pro-data";
import {
  clearScheduleReminder,
  markScheduleReminderPending
} from "../../../lib/schedule-reminder";
import {
  getCategoryOptions,
  type CategoryTemplate,
  getServicesForCategories
} from "../../../lib/service-templates";

const serviceModes = [
  "Клиенты приходят в мое физическое заведение",
  "Я работаю с выездом к клиенту",
  "Я предоставляю услуги онлайн"
] as const;

type ServiceMode = (typeof serviceModes)[number];

const categoryNameTranslations: Record<string, Record<ProLanguage, string>> = {
  "Парикмахерская": {
    ru: "Парикмахерская",
    uk: "Перукарня",
    en: "Hair salon"
  },
  "Ногти": {
    ru: "Ногти",
    uk: "Нігті",
    en: "Nails"
  },
  "Брови и ресницы": {
    ru: "Брови и ресницы",
    uk: "Брови та вії",
    en: "Brows and lashes"
  },
  "Салон красоты": {
    ru: "Салон красоты",
    uk: "Салон краси",
    en: "Beauty salon"
  },
  "Медспа": {
    ru: "Медспа",
    uk: "Медспа",
    en: "Medspa"
  },
  "Парикмахер": {
    ru: "Парикмахер",
    uk: "Перукар",
    en: "Hairdresser"
  },
  "Массажный салон": {
    ru: "Массажный салон",
    uk: "Масажний салон",
    en: "Massage studio"
  },
  "Спа-салон и сауна": {
    ru: "Спа-салон и сауна",
    uk: "Спа-салон і сауна",
    en: "Spa and sauna"
  },
  "Салон депиляции": {
    ru: "Салон депиляции",
    uk: "Салон депіляції",
    en: "Hair removal salon"
  },
  "Тату и пирсинг": {
    ru: "Тату и пирсинг",
    uk: "Тату та пірсинг",
    en: "Tattoo and piercing"
  },
  "Студия загара": {
    ru: "Студия загара",
    uk: "Студія засмаги",
    en: "Tanning studio"
  },
  "Физиотерапия": {
    ru: "Физиотерапия",
    uk: "Фізіотерапія",
    en: "Physiotherapy"
  },
  "Другая": {
    ru: "Другая",
    uk: "Інша",
    en: "Other"
  }
};

function getLocalizedCategoryName(category: string, language: ProLanguage) {
  return categoryNameTranslations[category]?.[language] ?? category;
}

function CategoryScissorsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="6" cy="17.5" r="2.5" />
      <path d="M8 8l10 8" />
      <path d="M8 16l10-8" />
    </svg>
  );
}

function CategoryNailsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.2 5.2c1.3-.9 2.8-.5 3.5.9l3 6c.5 1 .2 2.2-.7 2.9L11 17.5c-1 .8-2.5.6-3.2-.5L5.5 13" />
      <path d="M11.5 4.5l1.7 3.4" />
      <path d="M14.9 7.2l1.5 3" />
      <path d="M6 18.8c2.2-.4 4-.2 5.9 1.2" />
    </svg>
  );
}

function CategoryBrowsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 9.5c2-2.2 4-3.3 6.2-3.3 2.1 0 3.7 1 5 3" />
      <path d="M9.8 8.5l1.2 1.4" />
      <path d="M14 8.5l1.2 1.4" />
      <path d="M17 9.2c1.1-1.8 2-2.7 3-2.7" />
    </svg>
  );
}

function CategoryBeautyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="7" y="9" width="10" height="10" rx="2.2" />
      <path d="M9.5 9V7.6A2.5 2.5 0 0112 5h0a2.5 2.5 0 012.5 2.6V9" />
      <path d="M10 13h4" />
    </svg>
  );
}

function CategorySparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z" />
      <path d="M18.5 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </svg>
  );
}

function CategoryChairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 6h6v5H7z" />
      <path d="M6 11h8l2 5H8z" />
      <path d="M8 16v3" />
      <path d="M15 16v3" />
    </svg>
  );
}

function CategoryMassageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 11h13c1.7 0 3 1.3 3 3v1" />
      <path d="M8 11V8.5A2.5 2.5 0 0110.5 6h1A2.5 2.5 0 0114 8.5V11" />
      <path d="M5 15h7" />
      <path d="M6 18h10" />
    </svg>
  );
}

function CategorySpaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 18c-1.8 0-3-1.1-3-2.7 0-1.3.9-2.4 2.2-3 .1 2.1 1.2 3.8 3.3 5.7H8z" />
      <path d="M12 18c-2.2-1.9-3.5-4.1-3.5-6.5 0-1.8.7-3.5 2.1-4.7.2 2.6 1.3 4.9 3.7 7.2" />
      <path d="M16 18c-2.4-1.8-3.8-4-3.8-6.7 0-1.9.7-3.8 2.1-5.3.3 2.9 1.4 5.4 3.7 7.8" />
    </svg>
  );
}

function CategoryRazorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 18l6-6" />
      <path d="M10.8 6.2l7 7" />
      <path d="M12.2 4.8l2.6-2.1 4.4 4.4-2.1 2.6" />
      <path d="M6.7 16.3l1.9 1.9" />
    </svg>
  );
}

function CategoryTattooIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 17l8-8" />
      <path d="M13 6l5 5" />
      <path d="M6.5 17.5l-1 2.5 2.5-1" />
      <path d="M15.5 3.8l4.7 4.7" />
    </svg>
  );
}

function CategorySunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3.3" />
      <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.3 6.3l1.6 1.6M16.1 16.1l1.6 1.6M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6" />
    </svg>
  );
}

function CategoryPhysioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 5v14" />
      <path d="M5 8h6" />
      <path d="M15.5 6.5c1.9 0 3.5 1.6 3.5 3.5 0 4.3-4.1 7.3-5.8 8.4a1.3 1.3 0 01-1.4 0C10.1 17.3 6 14.3 6 10c0-1.9 1.6-3.5 3.5-3.5 1 0 2 .4 2.7 1.2.7-.8 1.7-1.2 2.8-1.2z" />
    </svg>
  );
}

function CategoryDefaultIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function getCategoryIcon(category: string) {
  const iconProps = {
    className: styles.categoryIconSvg,
    "aria-hidden": "true" as const
  };

  switch (category) {
    case "Парикмахерская":
      return <CategoryScissorsIcon {...iconProps} />;
    case "Ногти":
      return <CategoryNailsIcon {...iconProps} />;
    case "Брови и ресницы":
      return <CategoryBrowsIcon {...iconProps} />;
    case "Салон красоты":
      return <CategoryBeautyIcon {...iconProps} />;
    case "Медспа":
      return <CategorySparkleIcon {...iconProps} />;
    case "Парикмахер":
      return <CategoryChairIcon {...iconProps} />;
    case "Массажный салон":
      return <CategoryMassageIcon {...iconProps} />;
    case "Спа-салон и сауна":
      return <CategorySpaIcon {...iconProps} />;
    case "Салон депиляции":
      return <CategoryRazorIcon {...iconProps} />;
    case "Тату и пирсинг":
      return <CategoryTattooIcon {...iconProps} />;
    case "Студия загара":
      return <CategorySunIcon {...iconProps} />;
    case "Физиотерапия":
      return <CategoryPhysioIcon {...iconProps} />;
    default:
      return <CategoryDefaultIcon {...iconProps} />;
  }
}

function getCategoryServicesMeta(category: string, catalog: CategoryTemplate[], language: ProLanguage) {
  const count = getServicesForCategories([category], catalog).length;
  if (language === "uk") {
    return `${count} типових послуг`;
  }
  if (language === "en") {
    return `${count} starter services`;
  }
  return `${count} типовых услуг`;
}

const setupText = {
  ru: {
    close: "Закрыть",
    continue: "Продолжить →",
    saving: "Сохраняем...",
    ownerSetup: {
      eyebrow: "Настройка аккаунта",
      title: "Как вы хотите настроить профессиональный аккаунт?",
      text: "Можно создать новый бизнес-аккаунт владельца или присоединиться к уже существующему салону как мастер или сотрудник.",
      ownerTitle: "Создать бизнес-аккаунт",
      ownerText: "Пользователь будет владельцем бизнеса, увидит основное меню, настроит услуги, мастеров, расписание и все записи салона.",
      memberTitle: "Присоединиться к существующему бизнесу",
      memberText: "Пользователь подключается к салону и управляет только своими записями и рабочим графиком в составе команды."
    },
    businessName: {
      eyebrow: "Настройка владельца бизнеса",
      title: "Как называется ваш бизнес?",
      text: "Название бизнеса увидят клиенты и сотрудники внутри системы.",
      name: "Название бизнеса",
      website: "Сайт бизнеса",
      namePlaceholder: "Название бизнеса"
    },
    join: {
      eyebrow: "Подключение к салону",
      title: "К какому бизнесу вы хотите присоединиться?",
      text: "Для мастера или сотрудника это отдельный путь: без создания своего бизнеса, но с собственным графиком и личными записями.",
      searchPlaceholder: "Ищите по названию, email или телефону",
      searchLabel: "Поиск организации",
      searching: "Ищем подходящие бизнесы...",
      searchHint: "Найдите бизнес и выберите его из списка, чтобы отправить владельцу запрос на присоединение.",
      owner: "Владелец",
      ownerContact: "Контакты",
      selectProfile: "Профиль",
      requestTitle: "Проверьте и отправьте запрос",
      requestText: "Мы отправим владельцу бизнеса запрос на присоединение. После подтверждения вы получите доступ к рабочему кабинету.",
      requestButton: "Отправить запрос",
      selectedBusiness: "Выбранный бизнес",
      selectedRole: "Роль после подтверждения",
      requestNotice: "После отправки запроса вы попадёте на страницу ожидания. Владелец бизнеса подтвердит присоединение в настройках кабинета.",
      noResults: "Ничего не найдено. Попробуйте другое название, email или телефон."
    },
    categories: {
      eyebrow: "Категория бизнеса",
      title: "Чем вы занимаетесь?",
      text: "Мы автоматически подготовим услуги для вашего профиля",
      primary: "Основной",
      categoryHint: "Услуги будут предложены автоматически на следующем шаге кабинета.",
      deleteService: "Удалить услугу"
    },
    servicesReview: {
      eyebrow: "Подготовка услуг",
      title: "Ваш профиль почти готов",
      text: "Мы подготовили услуги за вас — проверьте и продолжайте",
      selectOnly: "Выберите только те услуги, которые вы оказываете",
      continue: "Продолжить",
      addManual: "Добавить свою услугу",
      showMore: "+ ещё {count} услуг",
      showLess: "Скрыть список",
      empty: "Пока список услуг пуст. Можно продолжить и настроить его позже в кабинете."
      ,
      trustLead: "Дальше вы сможете:",
      trustPoints: [
        "установить цены",
        "добавить график",
        "начать принимать клиентов"
      ]
    },
    format: {
      eyebrow: "Формат бизнеса",
      title: "Сколько мастеров будет работать в аккаунте?",
      text: "Если это один мастер, кабинет будет проще. Если команда, владелец получит расширенное меню: сотрудники, роли, графики и общие записи.",
      solo: "Один мастер",
      soloText: "Упрощенный личный кабинет: услуги, рабочее время, свои записи и клиенты.",
      team: "Группа мастеров",
      teamText: "Расширенный кабинет владельца: команда, расписание по мастерам, общая запись и управление салоном."
    },
    place: {
      eyebrow: "Место оказания услуг",
      title: "Добавьте адрес, чтобы клиенты могли вас найти",
      text: "Профиль появится на карте и в поиске рядом",
      helper: "Это займёт меньше 30 секунд",
      addAddress: "📍 Добавить адрес",
      skip: "Пропустить →",
      withoutAddressTitle: "Без адреса",
      withoutAddressText: "вас не видно на карте",
      withAddressTitle: "С адресом",
      withAddressText: "клиенты находят вас рядом",
      findAddress: "Найти адрес на карте",
      addressPlaceholder: "Начните вводить реальный адрес",
      searching: "Ищем адрес...",
      selectAddress: "Выбрать адрес",
      preview: "Предпросмотр первого найденного адреса на карте. Нажмите на вариант выше, чтобы сохранить его в аккаунте.",
      warning: "Введите адрес и выберите результат поиска, чтобы сохранить координаты бизнеса.",
      openGoogle: "Открыть в Google Maps"
    },
    serviceModes: {
      "Клиенты приходят в мое физическое заведение": "Клиенты приходят в мое физическое заведение",
      "Я работаю с выездом к клиенту": "Я работаю с выездом к клиенту",
      "Я предоставляю услуги онлайн": "Я предоставляю услуги онлайн"
    },
    modal: {
      chooseServices: "Выберите услуги",
      templateText: "Шаблон для категории",
      templateSuffix: "собран из предложений из вашего справочника услуг.",
      best: "Лучшие предложения",
      bestText: "80% бизнесов похожего профиля обычно начинают с этих услуг.",
      popular: "Другие популярные услуги",
      selected: "Выбрано",
      choose: "+ Выбрать",
      addServices: "Добавить услуги",
      addService: "Добавить услугу",
      addServiceText: "Добавьте основную информацию об услуге прямо сейчас. Позже можно будет настроить описание и дополнительные параметры.",
      serviceName: "Название услуги",
      serviceType: "Тип услуги",
      otherCategory: "Другая",
      hours: "Часы",
      minutes: "Минут",
      price: "Цена",
      add: "Добавить"
    }
  },
  uk: {
    close: "Закрити",
    continue: "Продовжити →",
    saving: "Зберігаємо...",
    ownerSetup: {
      eyebrow: "Налаштування акаунта",
      title: "Як ви хочете налаштувати професійний акаунт?",
      text: "Можна створити новий бізнес-акаунт власника або приєднатися до вже існуючого салону як майстер чи співробітник.",
      ownerTitle: "Створити бізнес-акаунт",
      ownerText: "Користувач буде власником бізнесу, побачить основне меню, налаштує послуги, майстрів, розклад і всі записи салону.",
      memberTitle: "Приєднатися до існуючого бізнесу",
      memberText: "Користувач підключається до салону і керує тільки своїми записами та робочим графіком у складі команди."
    },
    businessName: {
      eyebrow: "Налаштування власника бізнесу",
      title: "Як називається ваш бізнес?",
      text: "Назву бізнесу бачитимуть клієнти та співробітники всередині системи.",
      name: "Назва бізнесу",
      website: "Сайт бізнесу",
      namePlaceholder: "Назва бізнесу"
    },
    join: {
      eyebrow: "Підключення до салону",
      title: "До якого бізнесу ви хочете приєднатися?",
      text: "Для майстра або співробітника це окремий шлях: без створення свого бізнесу, але з власним графіком і особистими записами.",
      searchPlaceholder: "Шукайте за назвою, email або телефоном",
      searchLabel: "Пошук організації",
      searching: "Шукаємо відповідні бізнеси...",
      searchHint: "Знайдіть бізнес і виберіть його зі списку, щоб надіслати власнику запит на приєднання.",
      owner: "Власник",
      ownerContact: "Контакти",
      selectProfile: "Профіль",
      requestTitle: "Перевірте та надішліть запит",
      requestText: "Ми надішлемо власнику бізнесу запит на приєднання. Після підтвердження ви отримаєте доступ до робочого кабінету.",
      requestButton: "Надіслати запит",
      selectedBusiness: "Обраний бізнес",
      selectedRole: "Роль після підтвердження",
      requestNotice: "Після надсилання запиту ви потрапите на сторінку очікування. Власник бізнесу підтвердить приєднання в налаштуваннях кабінету.",
      noResults: "Нічого не знайдено. Спробуйте іншу назву, email або телефон."
    },
    categories: {
      eyebrow: "Категорія бізнесу",
      title: "Чим ви займаєтесь?",
      text: "Ми автоматично підготуємо послуги для вашого профілю",
      primary: "Основна",
      categoryHint: "Послуги будуть запропоновані автоматично на наступному кроці кабінету.",
      deleteService: "Видалити послугу"
    },
    servicesReview: {
      eyebrow: "Підготовка послуг",
      title: "Ваш профіль майже готовий",
      text: "Ми підготували послуги за вас — перевірте та продовжуйте",
      selectOnly: "Оберіть тільки ті, які ви надаєте",
      continue: "Продовжити",
      addManual: "Додати свою послугу",
      showMore: "+ ще {count} послуг",
      showLess: "Згорнути список",
      empty: "Поки список послуг порожній. Можна продовжити та налаштувати його пізніше в кабінеті."
      ,
      trustLead: "Далі ви зможете:",
      trustPoints: [
        "встановити ціни",
        "додати графік",
        "почати приймати клієнтів"
      ]
    },
    format: {
      eyebrow: "Формат бізнесу",
      title: "Скільки майстрів працюватиме в акаунті?",
      text: "Якщо це один майстер, кабінет буде простішим. Якщо команда, власник отримає розширене меню: співробітники, ролі, графіки та спільні записи.",
      solo: "Один майстер",
      soloText: "Спрощений кабінет: послуги, робочий час, свої записи і клієнти.",
      team: "Група майстрів",
      teamText: "Розширений кабінет власника: команда, розклад по майстрах, спільний запис і керування салоном."
    },
    place: {
      eyebrow: "Місце надання послуг",
      title: "Додайте адресу, щоб клієнти могли вас знайти",
      text: "Ваш профіль з’явиться на карті та в пошуку поруч",
      helper: "Це займе менше 30 секунд",
      addAddress: "📍 Додати адресу",
      skip: "Пропустити →",
      withoutAddressTitle: "Без адреси",
      withoutAddressText: "вас не видно на карті",
      withAddressTitle: "З адресою",
      withAddressText: "клієнти знаходять вас поруч",
      findAddress: "Знайти адресу на карті",
      addressPlaceholder: "Почніть вводити реальну адресу",
      searching: "Шукаємо адресу...",
      selectAddress: "Вибрати адресу",
      preview: "Попередній перегляд першої знайденої адреси на карті. Натисніть на варіант вище, щоб зберегти його в акаунті.",
      warning: "Введіть адресу і виберіть результат пошуку, щоб зберегти координати бізнесу.",
      openGoogle: "Відкрити в Google Maps"
    },
    serviceModes: {
      "Клиенты приходят в мое физическое заведение": "Клієнти приходять у мій фізичний заклад",
      "Я работаю с выездом к клиенту": "Я працюю з виїздом до клієнта",
      "Я предоставляю услуги онлайн": "Я надаю послуги онлайн"
    },
    modal: {
      chooseServices: "Виберіть послуги",
      templateText: "Шаблон для категорії",
      templateSuffix: "зібраний із пропозицій вашого довідника послуг.",
      best: "Найкращі пропозиції",
      bestText: "80% бізнесів схожого профілю зазвичай починають із цих послуг.",
      popular: "Інші популярні послуги",
      selected: "Вибрано",
      choose: "+ Вибрати",
      addServices: "Додати послуги",
      addService: "Додати послугу",
      addServiceText: "Додайте основну інформацію про послугу зараз. Пізніше можна буде налаштувати опис і додаткові параметри.",
      serviceName: "Назва послуги",
      serviceType: "Тип послуги",
      otherCategory: "Інша",
      hours: "Години",
      minutes: "Хвилин",
      price: "Ціна",
      add: "Додати"
    }
  },
  en: {
    close: "Close",
    continue: "Continue →",
    saving: "Saving...",
    ownerSetup: {
      eyebrow: "Account setup",
      title: "How do you want to set up your professional account?",
      text: "Create a new owner account or join an existing salon as a specialist or team member.",
      ownerTitle: "Create a business account",
      ownerText: "The user becomes the business owner and manages services, staff, schedules and all salon bookings.",
      memberTitle: "Join an existing business",
      memberText: "The user joins a salon and manages only their own bookings and working schedule within the team."
    },
    businessName: {
      eyebrow: "Business owner setup",
      title: "What is your business called?",
      text: "Clients and team members will see this name inside the system.",
      name: "Business name",
      website: "Business website",
      namePlaceholder: "Business name"
    },
    join: {
      eyebrow: "Join a salon",
      title: "Which business do you want to join?",
      text: "For a specialist or employee this is a separate path: no own business account, but personal schedule and bookings.",
      searchPlaceholder: "Search by business name, email or phone",
      searchLabel: "Find a business",
      searching: "Looking for matching businesses...",
      searchHint: "Find a business and select it from the list to send the owner a join request.",
      owner: "Owner",
      ownerContact: "Contact",
      selectProfile: "Profile",
      requestTitle: "Review and send request",
      requestText: "We will send the business owner a join request. After approval you will get access to the workspace.",
      requestButton: "Send request",
      selectedBusiness: "Selected business",
      selectedRole: "Role after approval",
      requestNotice: "After the request is sent, you will land on a waiting page. The business owner will confirm the request in workspace settings.",
      noResults: "No businesses found. Try another name, email or phone."
    },
    categories: {
      eyebrow: "Business category",
      title: "What do you do?",
      text: "We will automatically prepare services for your profile",
      primary: "Primary",
      categoryHint: "Services will be suggested automatically on the next setup step.",
      deleteService: "Remove service"
    },
    servicesReview: {
      eyebrow: "Service setup",
      title: "Your profile is almost ready",
      text: "We prepared services for you — review them and keep going",
      selectOnly: "Keep only the services you actually provide",
      continue: "Continue",
      addManual: "Add your own service",
      showMore: "+ {count} more services",
      showLess: "Collapse list",
      empty: "The service list is empty for now. You can continue and configure it later in the workspace."
      ,
      trustLead: "Next you will be able to:",
      trustPoints: [
        "set prices",
        "add a schedule",
        "start accepting clients"
      ]
    },
    format: {
      eyebrow: "Business format",
      title: "How many specialists will work in this account?",
      text: "A solo account is simpler. A team account unlocks staff, roles, schedules and shared bookings.",
      solo: "One specialist",
      soloText: "Simple workspace: services, working hours, own bookings and clients.",
      team: "Team of specialists",
      teamText: "Extended owner workspace: team, staff schedules, shared booking and salon management."
    },
    place: {
      eyebrow: "Service location",
      title: "Add an address so clients can find you",
      text: "Your profile will appear on the map and in nearby search",
      helper: "This takes less than 30 seconds",
      addAddress: "📍 Add address",
      skip: "Skip →",
      withoutAddressTitle: "Without an address",
      withoutAddressText: "you won't appear on the map",
      withAddressTitle: "With an address",
      withAddressText: "clients can find you nearby",
      findAddress: "Find address on map",
      addressPlaceholder: "Start typing a real address",
      searching: "Searching address...",
      selectAddress: "Choose address",
      preview: "Preview of the first found address on the map. Click a result above to save it to the account.",
      warning: "Enter an address and choose a search result to save business coordinates.",
      openGoogle: "Open in Google Maps"
    },
    serviceModes: {
      "Клиенты приходят в мое физическое заведение": "Clients come to my physical venue",
      "Я работаю с выездом к клиенту": "I travel to the client",
      "Я предоставляю услуги онлайн": "I provide services online"
    },
    modal: {
      chooseServices: "Choose services",
      templateText: "Template for",
      templateSuffix: "is built from your service catalog suggestions.",
      best: "Best suggestions",
      bestText: "80% of similar businesses usually start with these services.",
      popular: "Other popular services",
      selected: "Selected",
      choose: "+ Choose",
      addServices: "Add services",
      addService: "Add service",
      addServiceText: "Add the basic service information now. You can configure description and extra settings later.",
      serviceName: "Service name",
      serviceType: "Service type",
      otherCategory: "Other",
      hours: "Hours",
      minutes: "Minutes",
      price: "Price",
      add: "Add"
    }
  }
};

function getInitialSetupLanguage(): ProLanguage {
  if (typeof window === "undefined") return "ru";

  const savedLanguage = window.localStorage.getItem("rezervo-pro-language");
  if (isProLanguage(savedLanguage)) return savedLanguage;

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (candidates.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
  if (candidates.some((value) => value.startsWith("en"))) return "en";
  return "ru";
}

type AddressSuggestion = {
  label: string;
  details: string;
  lat: number;
  lon: number;
};

type Draft = {
  ownerMode: "owner" | "member";
  joinBusinessId: string;
  joinBusinessName: string;
  joinBusinessRole: string;
  companyName: string;
  website: string;
  categories: string[];
  services: string[];
  accountType: "solo" | "team";
  serviceMode: ServiceMode;
  address: string;
  addressDetails: string;
  addressLat: number | null;
  addressLon: number | null;
};

const initialDraft: Draft = {
  ownerMode: "owner",
  joinBusinessId: "",
  joinBusinessName: "",
  joinBusinessRole: "",
  companyName: "",
  website: "",
  categories: [],
  services: [],
  accountType: "solo",
  serviceMode: "Клиенты приходят в мое физическое заведение",
  address: "",
  addressDetails: "",
  addressLat: null,
  addressLon: null
};

export default function ProSetupFlow({ catalog }: { catalog: CategoryTemplate[] }) {
  const router = useRouter();
  const [language, setLanguage] = useState<ProLanguage>("ru");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [joinQuery, setJoinQuery] = useState("");
  const [joinResults, setJoinResults] = useState<JoinBusinessSearchResult[]>([]);
  const [isSearchingJoin, setIsSearchingJoin] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showManualService, setShowManualService] = useState(false);
  const [showAllSuggestedServices, setShowAllSuggestedServices] = useState(false);
  const [manualServiceName, setManualServiceName] = useState("");
  const [manualServiceCategory, setManualServiceCategory] = useState("Другая");
  const [manualServiceHours, setManualServiceHours] = useState("0");
  const [manualServiceMinutes, setManualServiceMinutes] = useState("30");
  const [manualServicePrice, setManualServicePrice] = useState("");
  const t = setupText[language];

  const totalSteps = draft.ownerMode === "owner" ? 5 : 3;

  const progress = useMemo(
    () => Array.from({ length: totalSteps }, (_, index) => index <= step),
    [step, totalSteps]
  );

  const canContinue =
    (step === 0 && Boolean(draft.ownerMode)) ||
    (step === 1 &&
      (draft.ownerMode === "member"
        ? draft.joinBusinessId.trim().length > 0
        : draft.companyName.trim().length > 1)) ||
    (draft.ownerMode === "member" && step === 2 && draft.joinBusinessId.trim().length > 0) ||
    (draft.ownerMode === "owner" && step === 2 && draft.categories.length > 0) ||
    (draft.ownerMode === "owner" && step === 3) ||
    (draft.ownerMode === "owner" && step === 4);
  const continueLabel =
    draft.ownerMode === "member" && step === 2 ? t.join.requestButton : t.continue;

  const mapEmbedUrl = useMemo(() => {
    if (draft.addressLat === null || draft.addressLon === null) {
      return "";
    }

    const delta = 0.008;
    const left = draft.addressLon - delta;
    const right = draft.addressLon + delta;
    const top = draft.addressLat + delta;
    const bottom = draft.addressLat - delta;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${draft.addressLat}%2C${draft.addressLon}`;
  }, [draft.addressLat, draft.addressLon]);

  const previewSuggestion = addressSuggestions[0] ?? null;
  const categoryOptions = useMemo(() => getCategoryOptions(catalog), [catalog]);
  const manualCategoryOptions = useMemo(
    () => Array.from(new Set(["Другая", ...categoryOptions.filter((category) => category !== "Другая")])),
    [categoryOptions]
  );
  const initialSuggestedServicesCount = 8;
  const hiddenSuggestedServicesCount = Math.max(0, draft.services.length - initialSuggestedServicesCount);
  const visibleSuggestedServices = useMemo(
    () =>
      showAllSuggestedServices
        ? draft.services
        : draft.services.slice(0, initialSuggestedServicesCount),
    [draft.services, showAllSuggestedServices]
  );

  useEffect(() => {
    setManualServiceCategory((current) =>
      current === "Інша" || current === "Other" ? "Другая" : current
    );
  }, []);

  const previewMapEmbedUrl = useMemo(() => {
    if (!previewSuggestion) {
      return "";
    }

    const delta = 0.008;
    const left = previewSuggestion.lon - delta;
    const right = previewSuggestion.lon + delta;
    const top = previewSuggestion.lat + delta;
    const bottom = previewSuggestion.lat - delta;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${previewSuggestion.lat}%2C${previewSuggestion.lon}`;
  }, [previewSuggestion]);

  useEffect(() => {
    const nextLanguage = getInitialSetupLanguage();
    setLanguage(nextLanguage);

    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<ProLanguage>).detail;
      if (isProLanguage(next)) {
        setLanguage(next);
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    if (
      step !== 4 ||
      draft.address.trim().length < 3
    ) {
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const response = await fetch(`/api/address/search?q=${encodeURIComponent(draft.address)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        const payload = (await response.json()) as {
          results?: Array<{
            display_name: string;
            lat: string;
            lon: string;
            address?: Record<string, string>;
          }>;
        };
        const result = Array.isArray(payload.results) ? payload.results : [];

        setAddressSuggestions(
          result.map((item) => {
            const address = item.address ?? {};
            const house = address.house_number ?? "";
            const street =
              address.road ?? address.pedestrian ?? address.footway ?? address.neighbourhood ?? "";
            const city = address.city ?? address.town ?? address.village ?? address.municipality ?? "";
            const region = address.state ?? address.region ?? address.county ?? "";
            const country = address.country ?? "";
            const postcode = address.postcode ?? "";
            const primaryLine =
              [street, house].filter(Boolean).join(", ") ||
              item.display_name.split(",")[0]?.trim() ||
              item.display_name;

            return {
              label: item.display_name,
              details: [primaryLine, city, region, postcode, country].filter(Boolean).join("\n"),
              lat: Number(item.lat),
              lon: Number(item.lon)
            };
          })
        );
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [draft.address, step]);

  useEffect(() => {
    if (draft.ownerMode !== "owner" || step !== 4) return;
    if (draft.address.trim().length > 0 || draft.addressDetails.trim().length > 0) {
      setShowAddressForm(true);
    }
  }, [draft.address, draft.addressDetails, draft.ownerMode, step]);

  useEffect(() => {
    if (draft.ownerMode !== "member" || step !== 1 || joinQuery.trim().length < 2) {
      setJoinResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingJoin(true);
        const response = await fetch(`/api/pro/setup/business-search?q=${encodeURIComponent(joinQuery)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as { results?: JoinBusinessSearchResult[] };
        setJoinResults(Array.isArray(payload.results) ? payload.results : []);
      } catch {
        setJoinResults([]);
      } finally {
        setIsSearchingJoin(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [draft.ownerMode, joinQuery, step]);

  function goBack() {
    if (step === 0) {
      router.push("/pro/create-account");
      return;
    }

    setStep((current) => current - 1);
  }

  async function finishSetup() {
    setIsSaving(true);

    const accountDraftRaw = window.localStorage.getItem("rezervo-pro-account-draft");
    const accountDraft: AccountDraft = accountDraftRaw
      ? JSON.parse(accountDraftRaw)
          : {
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              phone: "",
              country: "Ukraine",
              timezone: "Europe/Kiev",
              language: "русский (RU)",
              currency: "UAH"
            };

    accountDraft.language = profileLanguageFromCode(language);

    const response = await fetch("/api/pro/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        account: accountDraft,
        setup: draft
      })
    });

    const result = await response.json();

    if (!response.ok) {
      setIsSaving(false);
      throw new Error(result.error || "Failed to save professional setup.");
    }

    if (draft.ownerMode === "owner") {
      markScheduleReminderPending(result.professionalId);
      router.push(`/pro/workspace?professionalId=${result.professionalId}`);
      return;
    }

    clearScheduleReminder(result.professionalId);
    router.push("/pro/pending");
  }

  async function handleContinue() {
    if (draft.ownerMode === "member") {
      if (step === 2) {
        await finishSetup();
        return;
      }

      setStep((current) => current + 1);
      return;
    }

    if (step === totalSteps - 1) {
      await finishSetup();
      return;
    }

    setStep((current) => current + 1);
  }

  function selectOwnerMode(mode: "owner" | "member") {
    setDraft((current) => ({
      ...current,
      ownerMode: mode,
      joinBusinessId: "",
      joinBusinessName: "",
      joinBusinessRole: mode === "member" ? "Specialist" : ""
    }));
    setJoinQuery("");
    setJoinResults([]);
    setStep(0);
  }

  function selectJoinBusiness(item: JoinBusinessSearchResult) {
    setDraft((current) => ({
      ...current,
      joinBusinessId: item.businessId,
      joinBusinessName: item.businessName,
      joinBusinessRole: language === "en" ? "Specialist" : language === "uk" ? "Майстер" : "Мастер"
    }));
    setJoinQuery(item.businessName);
  }

  function toggleCategory(category: string) {
    setDraft((current) => {
      const exists = current.categories.includes(category);
      const nextCategories = exists
        ? current.categories.filter((item) => item !== category)
        : current.categories.length >= 3
          ? current.categories
          : [...current.categories, category];

      return {
        ...current,
        categories: nextCategories,
        services: getServicesForCategories(nextCategories, catalog)
      };
    });
  }

  function addManualService() {
    const name = manualServiceName.trim();

    if (!name) {
      return;
    }

    setDraft((current) => ({
      ...current,
      categories: Array.from(new Set([...current.categories, manualServiceCategory || "Другая"])),
      services: Array.from(new Set([...current.services, name]))
    }));
    setManualServiceName("");
    setManualServiceCategory("Другая");
    setManualServiceHours("0");
    setManualServiceMinutes("30");
    setManualServicePrice("");
    setShowManualService(false);
  }

  function applyAddress(suggestion: AddressSuggestion) {
    setDraft((current) => ({
      ...current,
      address: suggestion.label,
      addressDetails: suggestion.details,
      addressLat: suggestion.lat,
      addressLon: suggestion.lon
    }));
    setAddressSuggestions([]);
  }

  function formatShowMoreLabel(template: string, count: number) {
    return template.replace("{count}", String(count));
  }

  return (
    <div className={styles.onboardingShell}>
      <div className={styles.onboardingTop}>
        <div className={styles.progressRail}>
          {progress.map((active, index) => (
            <div
              key={index}
              className={`${styles.progressStep} ${active ? styles.progressActive : ""}`}
            />
          ))}
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.circleButton} onClick={goBack}>
            ←
          </button>
          <button type="button" className={styles.ghostButton} onClick={() => router.push("/pro")}>
            {t.close}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!canContinue || isSaving}
            onClick={() => {
              void handleContinue();
            }}
          >
            {isSaving ? t.saving : continueLabel}
          </button>
          <GlobalLanguageSwitcher mode="inline" />
        </div>
      </div>

      <div className={styles.wizardFrame}>
        {step === 0 ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.ownerSetup.eyebrow}</p>
              <h1>{t.ownerSetup.title}</h1>
              <p>{t.ownerSetup.text}</p>
            </div>

            <div className={styles.choiceGrid}>
              <button
                type="button"
                className={`${styles.choiceCard} ${
                  draft.ownerMode === "owner" ? styles.selectedCard : ""
                }`}
                onClick={() => selectOwnerMode("owner")}
              >
                <span className={styles.choiceTitle}>{t.ownerSetup.ownerTitle}</span>
                <span className={styles.choiceText}>{t.ownerSetup.ownerText}</span>
              </button>

              <button
                type="button"
                className={`${styles.choiceCard} ${
                  draft.ownerMode === "member" ? styles.selectedCard : ""
                }`}
                onClick={() => selectOwnerMode("member")}
              >
                <span className={styles.choiceTitle}>{t.ownerSetup.memberTitle}</span>
                <span className={styles.choiceText}>{t.ownerSetup.memberText}</span>
              </button>
            </div>
          </section>
        ) : null}

        {step === 1 && draft.ownerMode === "owner" ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.businessName.eyebrow}</p>
              <h1>{t.businessName.title}</h1>
              <p>{t.businessName.text}</p>
            </div>

            <div className={styles.fieldStack}>
              <div className={styles.field}>
                <label htmlFor="companyName">{t.businessName.name}</label>
                <input
                  id="companyName"
                  className={styles.input}
                  placeholder={t.businessName.namePlaceholder}
                  value={draft.companyName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, companyName: event.target.value }))
                  }
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="website">{t.businessName.website}</label>
                <input
                  id="website"
                  className={styles.input}
                  placeholder="www.yoursite.com"
                  value={draft.website}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, website: event.target.value }))
                  }
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 1 && draft.ownerMode === "member" ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.join.eyebrow}</p>
              <h1>{t.join.title}</h1>
              <p>{t.join.text}</p>
            </div>

            <div className={styles.fieldStack}>
              <div className={styles.field}>
                <label htmlFor="joinBusinessSearch">{t.join.searchLabel}</label>
                <input
                  id="joinBusinessSearch"
                  className={styles.input}
                  placeholder={t.join.searchPlaceholder}
                  value={joinQuery}
                  onChange={(event) => setJoinQuery(event.target.value)}
                />
              </div>
            </div>

            <div className={styles.serviceStack}>
              {!isSearchingJoin && joinQuery.trim().length < 2 ? (
                <div className={styles.generatedBlock}>
                  <strong>{t.join.searchLabel}</strong>
                  <p className={styles.choiceText}>{t.join.searchHint}</p>
                </div>
              ) : null}
              {isSearchingJoin ? <div className={styles.generatedBlock}>{t.join.searching}</div> : null}
              {joinResults.map((item) => (
                <div
                  key={item.businessId}
                  className={`${styles.serviceOption} ${styles.joinBusinessCard} ${
                    draft.joinBusinessId === item.businessId ? styles.selectedCard : ""
                  }`}
                >
                  <div className={styles.joinBusinessCardMain}>
                    <div className={styles.joinBusinessCardThumb}>
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt="" className={styles.joinBusinessCardImage} />
                      ) : (
                        <span>{item.businessName.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className={styles.joinBusinessCardBody}>
                      <span className={styles.choiceTitle}>{item.businessName}</span>
                      <span className={styles.choiceText}>{item.city}</span>
                      <span className={styles.choiceText}>
                        {`${t.join.owner}: ${item.ownerName || item.ownerEmail || item.ownerPhone}`}
                      </span>
                      {item.ownerEmail || item.ownerPhone ? (
                        <span className={styles.choiceText}>
                          {`${t.join.ownerContact}: ${item.ownerEmail || item.ownerPhone}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.joinBusinessCardActions}>
                    <a
                      href={`/${language}/businesses/${item.businessPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.ghostButton}
                    >
                      {t.join.selectProfile}
                    </a>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={draft.joinBusinessId === item.businessId}
                      onClick={() => selectJoinBusiness(item)}
                    >
                      {draft.joinBusinessId === item.businessId ? t.join.requestButton : t.continue}
                    </button>
                  </div>
                </div>
              ))}
              {!isSearchingJoin && joinQuery.trim().length >= 2 && joinResults.length === 0 ? (
                <div className={styles.generatedBlock}>{t.join.noResults}</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 2 && draft.ownerMode === "member" ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.join.eyebrow}</p>
              <h1>{t.join.requestTitle}</h1>
              <p>{t.join.requestText}</p>
            </div>

            <div className={styles.generatedBlock}>
              <strong>{t.join.selectedBusiness}</strong>
              <div className={styles.serviceStack}>
                <div className={`${styles.serviceOption} ${styles.selectedCard}`}>
                  <span className={styles.choiceTitle}>{draft.joinBusinessName}</span>
                  <span className={styles.choiceText}>{`${t.join.selectedRole}: ${draft.joinBusinessRole}`}</span>
                </div>
              </div>
              <p className={styles.choiceText}>{t.join.requestNotice}</p>
              <div className={styles.templateActions}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setStep(1)}
                >
                  {t.join.searchLabel}
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={isSaving}
                  onClick={() => {
                    void handleContinue();
                  }}
                >
                  {isSaving ? t.saving : t.join.requestButton}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {step === 2 && draft.ownerMode === "owner" ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.categories.eyebrow}</p>
              <h1>{t.categories.title}</h1>
              <p>{t.categories.text}</p>
            </div>

            <div className={styles.categoryGrid}>
              {categoryOptions.map((category) => {
                const selected = draft.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`${styles.categoryCard} ${selected ? styles.selectedCard : ""}`}
                    onClick={() => toggleCategory(category)}
                  >
                    {selected ? (
                      <span className={styles.categoryBadge}>
                        {draft.categories.indexOf(category) === 0
                          ? t.categories.primary
                          : draft.categories.indexOf(category) + 1}
                      </span>
                    ) : null}
                    <span className={styles.categoryIcon} aria-hidden="true">
                      {getCategoryIcon(category)}
                    </span>
                    <span className={styles.choiceTitle}>{getLocalizedCategoryName(category, language)}</span>
                    <span className={styles.categoryMeta}>
                      {getCategoryServicesMeta(category, catalog, language)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 3 && draft.ownerMode === "owner" ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.servicesReview.eyebrow}</p>
              <h1>{t.servicesReview.title}</h1>
              <p>{t.servicesReview.text}</p>
            </div>

            <div className={styles.generatedBlock}>
              <p className={styles.generatedHint}>{t.servicesReview.selectOnly}</p>
              {draft.services.length > 0 ? (
                <>
                  <div className={styles.generatedList}>
                    {visibleSuggestedServices.map((service) => (
                      <button
                        key={service}
                        type="button"
                        className={styles.generatedChipButton}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            services: current.services.filter((item) => item !== service)
                          }))
                        }
                        aria-label={`${t.categories.deleteService} ${service}`}
                        title={t.categories.deleteService}
                      >
                        <span className={styles.generatedChip}>{service}</span>
                        <span className={styles.generatedChipRemove}>×</span>
                      </button>
                    ))}
                  </div>

                  {hiddenSuggestedServicesCount > 0 ? (
                    <button
                      type="button"
                      className={styles.inlineTextButton}
                      onClick={() => setShowAllSuggestedServices((current) => !current)}
                    >
                      {showAllSuggestedServices
                        ? t.servicesReview.showLess
                        : formatShowMoreLabel(t.servicesReview.showMore, hiddenSuggestedServicesCount)}
                    </button>
                  ) : null}
                </>
              ) : (
                <p className={styles.choiceText}>{t.servicesReview.empty}</p>
              )}

              <div className={styles.templateActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    void handleContinue();
                  }}
                >
                  {t.servicesReview.continue}
                </button>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => {
                    setManualServiceCategory(draft.categories[0] ?? "Другая");
                    setShowManualService(true);
                  }}
                >
                  {t.servicesReview.addManual}
                </button>
              </div>

              <div className={styles.generatedTrustBlock}>
                <strong>{t.servicesReview.trustLead}</strong>
                <ul className={styles.generatedTrustList}>
                  {t.servicesReview.trustPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {step === 4 && draft.ownerMode === "owner" ? (
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <p className={styles.eyebrow}>{t.place.eyebrow}</p>
              <h1>{t.place.title}</h1>
              <p>{t.place.text}</p>
            </div>

            <div className={styles.addressPrompt}>
              <p className={styles.addressHelper}>{t.place.helper}</p>

              <div className={styles.addressComparison}>
                <div className={styles.addressComparisonCard}>
                  <strong>{t.place.withoutAddressTitle}</strong>
                  <span>{t.place.withoutAddressText}</span>
                </div>
                <div className={styles.addressComparisonCard}>
                  <strong>{t.place.withAddressTitle}</strong>
                  <span>{t.place.withAddressText}</span>
                </div>
              </div>

              <div className={styles.addressPromptActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setShowAddressForm(true)}
                >
                  {t.place.addAddress}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    void handleContinue();
                  }}
                >
                  {t.place.skip}
                </button>
              </div>
            </div>

            {showAddressForm ? (
              <div className={styles.mapCard}>
                <div className={styles.field}>
                  <label htmlFor="address">{t.place.findAddress}</label>
                  <input
                    id="address"
                    className={styles.input}
                    value={draft.address}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        address: event.target.value,
                        addressDetails: "",
                        addressLat: null,
                        addressLon: null
                      }))
                    }
                    placeholder={t.place.addressPlaceholder}
                  />
                </div>

                <div className={styles.addressSearchList}>
                  {isSearchingAddress ? (
                    <div className={styles.addressHint}>{t.place.searching}</div>
                  ) : null}
                  {addressSuggestions.map((item) => (
                    <button
                      key={`${item.label}-${item.lat}-${item.lon}`}
                      type="button"
                      className={styles.addressSearchItem}
                      onClick={() => applyAddress(item)}
                    >
                      <span className={styles.addressSearchText}>
                        <strong>{item.details.split("\n")[0] ?? item.label}</strong>
                        <span>{item.label}</span>
                      </span>
                      <span className={styles.addressSearchAction}>{t.place.selectAddress}</span>
                    </button>
                  ))}
                </div>

                {draft.addressDetails ? (
                  <>
                    {mapEmbedUrl ? (
                      <iframe
                        title={t.place.openGoogle}
                        className={styles.mapFrame}
                        src={mapEmbedUrl}
                      />
                    ) : null}
                    {draft.addressLat !== null && draft.addressLon !== null ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${draft.addressLat},${draft.addressLon}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.ghostButton}
                      >
                        {t.place.openGoogle}
                      </a>
                    ) : null}
                  </>
                ) : previewSuggestion ? (
                  <>
                    <div className={styles.addressHint}>{t.place.preview}</div>
                    {previewMapEmbedUrl ? (
                      <iframe
                        title={t.place.selectAddress}
                        className={styles.mapFrame}
                        src={previewMapEmbedUrl}
                      />
                    ) : null}
                  </>
                ) : (
                  <div className={styles.addressWarning}>{t.place.warning}</div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {showManualService ? (
        <div className={styles.templateModalBackdrop}>
          <div className={styles.templateFormModal}>
            <div className={styles.templateModalHeader}>
              <button type="button" className={styles.circleButton} onClick={() => setShowManualService(false)}>
                ×
              </button>
              <div>
                <h2>{t.modal.addService}</h2>
                <p>{t.modal.addServiceText}</p>
              </div>
            </div>

            <div className={styles.fieldStack}>
              <div className={styles.field}>
                <label htmlFor="manualServiceName">{t.modal.serviceName}</label>
                <input
                  id="manualServiceName"
                  className={styles.input}
                  value={manualServiceName}
                  onChange={(event) => setManualServiceName(event.target.value)}
                  placeholder={t.modal.serviceName}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="manualServiceType">{t.modal.serviceType}</label>
                <select
                  id="manualServiceType"
                  className={styles.select}
                  value={manualServiceCategory}
                  onChange={(event) => setManualServiceCategory(event.target.value)}
                >
                  {manualCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {getLocalizedCategoryName(category, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.templateDurationRow}>
                <div className={styles.field}>
                  <label htmlFor="manualHours">{t.modal.hours}</label>
                  <select
                    id="manualHours"
                    className={styles.select}
                    value={manualServiceHours}
                    onChange={(event) => setManualServiceHours(event.target.value)}
                  >
                    {Array.from({ length: 25 }, (_, hour) => (
                      <option key={hour} value={String(hour)}>
                        {hour}h
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="manualMinutes">{t.modal.minutes}</label>
                  <select
                    id="manualMinutes"
                    className={styles.select}
                    value={manualServiceMinutes}
                    onChange={(event) => setManualServiceMinutes(event.target.value)}
                  >
                    <option value="15">15min</option>
                    <option value="30">30min</option>
                    <option value="45">45min</option>
                    <option value="60">60min</option>
                  </select>
                </div>
              </div>

              <div className={styles.templateDurationRow}>
                <div className={styles.field}>
                  <label htmlFor="manualPrice">{t.modal.price}</label>
                  <input
                    id="manualPrice"
                    className={styles.input}
                    value={manualServicePrice}
                    onChange={(event) => setManualServicePrice(event.target.value)}
                    placeholder={t.modal.price}
                  />
                </div>
              </div>
            </div>

            <div className={styles.templateModalFooter}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!manualServiceName.trim()}
                onClick={addManualService}
              >
                {t.modal.add}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

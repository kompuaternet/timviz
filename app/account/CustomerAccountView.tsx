"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import PublicSearch from "../PublicSearch";
import type {
  CustomerAccountRecord,
  CustomerAddress,
  CustomerBookingSummary,
  CustomerNotifications
} from "../../lib/customer-account";
import type { PublicSearchIndex } from "../../lib/public-search";
import type { PublicCustomerSession } from "../../lib/public-customer-auth";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneLocalDigits,
  getPhoneRule,
  inferPhoneCountryFromLocale,
  onlyPhoneDigits,
  phoneCountries
} from "../../lib/phone-format";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
import styles from "./customer-account.module.css";

type AccountSection = "profile" | "activity" | "wallet" | "favorites" | "forms" | "settings";
type ActivityFilter = "all" | "upcoming" | "history";

type AccountCopy = {
  profile: string;
  activity: string;
  wallet: string;
  favorites: string;
  forms: string;
  settings: string;
  allServices: string;
  currentLocation: string;
  anyTime: string;
  search: string;
  edit: string;
  save: string;
  addAddress: string;
  remove: string;
  empty: string;
  noBookings: string;
  profileTitle: string;
  addressesTitle: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  gender: string;
  home: string;
  work: string;
  other: string;
  title: string;
  address: string;
  upcoming: string;
  bookingHistory: string;
  all: string;
  bookingDetails: string;
  service: string;
  total: string;
  date: string;
  time: string;
  status: string;
  openVenue: string;
  route: string;
  linkedGoogle: string;
  connected: string;
  signOut: string;
  marketing: string;
  reminders: string;
  soon: string;
  signInTitle: string;
  signInText: string;
  signInGoogle: string;
  confirmed: string;
  pending: string;
  cancelled: string;
  completed: string;
  pageTitle: string;
  couldNotSave: string;
  saved: string;
  genderFemale: string;
  genderMale: string;
  genderUnspecified: string;
};

const copy: Record<SiteLanguage, AccountCopy> = {
  ru: {
    profile: "Профиль",
    activity: "Действие",
    wallet: "Кошелёк",
    favorites: "Избранное",
    forms: "Анкеты",
    settings: "Настройки",
    allServices: "Все услуги",
    currentLocation: "Текущее местоположение",
    anyTime: "Любое время",
    search: "Поиск",
    edit: "Изменить",
    save: "Сохранить",
    addAddress: "Добавить",
    remove: "Удалить",
    empty: "Пока пусто",
    noBookings: "Здесь появятся ваши записи после онлайн-бронирования.",
    profileTitle: "Профиль",
    addressesTitle: "Мои адреса",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Мобильный телефон",
    email: "Электронная почта",
    birthday: "Дата рождения",
    gender: "Пол",
    home: "Главная",
    work: "Рабочий",
    other: "Другое",
    title: "Название",
    address: "Адрес",
    upcoming: "Предстоящие",
    bookingHistory: "История",
    all: "Все",
    bookingDetails: "Детали записи",
    service: "Услуга",
    total: "Всего к оплате",
    date: "Дата",
    time: "Время",
    status: "Статус",
    openVenue: "Открыть заведение",
    route: "Проложить маршрут",
    linkedGoogle: "Google аккаунт",
    connected: "Подключён",
    signOut: "Выйти",
    marketing: "Маркетинговые уведомления",
    reminders: "Напоминания о записях",
    soon: "Этот раздел подготовим следующим этапом.",
    signInTitle: "Кабинет клиента",
    signInText: "Войдите через Google, чтобы видеть свои записи, профиль и настройки.",
    signInGoogle: "Продолжить через Google",
    confirmed: "Подтверждено",
    pending: "Ожидает подтверждения",
    cancelled: "Отменено",
    completed: "Завершено",
    pageTitle: "Личный кабинет",
    couldNotSave: "Не удалось сохранить изменения.",
    saved: "Сохранено.",
    genderFemale: "Женский",
    genderMale: "Мужской",
    genderUnspecified: "Не указан"
  },
  uk: {
    profile: "Профіль",
    activity: "Дії",
    wallet: "Гаманець",
    favorites: "Обране",
    forms: "Анкети",
    settings: "Налаштування",
    allServices: "Усі послуги",
    currentLocation: "Поточне місцезнаходження",
    anyTime: "Будь-який час",
    search: "Пошук",
    edit: "Змінити",
    save: "Зберегти",
    addAddress: "Додати",
    remove: "Видалити",
    empty: "Поки порожньо",
    noBookings: "Тут з’являться ваші записи після онлайн-бронювання.",
    profileTitle: "Профіль",
    addressesTitle: "Мої адреси",
    firstName: "Ім’я",
    lastName: "Прізвище",
    phone: "Мобільний телефон",
    email: "Електронна пошта",
    birthday: "Дата народження",
    gender: "Стать",
    home: "Головна",
    work: "Робоча",
    other: "Інше",
    title: "Назва",
    address: "Адреса",
    upcoming: "Майбутні",
    bookingHistory: "Історія",
    all: "Усі",
    bookingDetails: "Деталі запису",
    service: "Послуга",
    total: "Усього до оплати",
    date: "Дата",
    time: "Час",
    status: "Статус",
    openVenue: "Відкрити заклад",
    route: "Прокласти маршрут",
    linkedGoogle: "Google акаунт",
    connected: "Підключено",
    signOut: "Вийти",
    marketing: "Маркетингові сповіщення",
    reminders: "Нагадування про записи",
    soon: "Цей розділ підготуємо наступним етапом.",
    signInTitle: "Кабінет клієнта",
    signInText: "Увійдіть через Google, щоб бачити свої записи, профіль і налаштування.",
    signInGoogle: "Продовжити через Google",
    confirmed: "Підтверджено",
    pending: "Очікує підтвердження",
    cancelled: "Скасовано",
    completed: "Завершено",
    pageTitle: "Особистий кабінет",
    couldNotSave: "Не вдалося зберегти зміни.",
    saved: "Збережено.",
    genderFemale: "Жіноча",
    genderMale: "Чоловіча",
    genderUnspecified: "Не вказано"
  },
  en: {
    profile: "Profile",
    activity: "Activity",
    wallet: "Wallet",
    favorites: "Favorites",
    forms: "Forms",
    settings: "Settings",
    allServices: "All services",
    currentLocation: "Current location",
    anyTime: "Any time",
    search: "Search",
    edit: "Edit",
    save: "Save",
    addAddress: "Add",
    remove: "Remove",
    empty: "Nothing here yet",
    noBookings: "Your online bookings will appear here.",
    profileTitle: "Profile",
    addressesTitle: "My addresses",
    firstName: "First name",
    lastName: "Last name",
    phone: "Mobile phone",
    email: "Email",
    birthday: "Birthday",
    gender: "Gender",
    home: "Home",
    work: "Work",
    other: "Other",
    title: "Title",
    address: "Address",
    upcoming: "Upcoming",
    bookingHistory: "History",
    all: "All",
    bookingDetails: "Booking details",
    service: "Service",
    total: "Total",
    date: "Date",
    time: "Time",
    status: "Status",
    openVenue: "Open venue",
    route: "Get directions",
    linkedGoogle: "Google account",
    connected: "Connected",
    signOut: "Log out",
    marketing: "Marketing notifications",
    reminders: "Booking reminders",
    soon: "We’ll build this section next.",
    signInTitle: "Customer account",
    signInText: "Sign in with Google to see your bookings, profile and preferences.",
    signInGoogle: "Continue with Google",
    confirmed: "Confirmed",
    pending: "Waiting for confirmation",
    cancelled: "Cancelled",
    completed: "Completed",
    pageTitle: "My account",
    couldNotSave: "Could not save changes.",
    saved: "Saved.",
    genderFemale: "Female",
    genderMale: "Male",
    genderUnspecified: "Not specified"
  }
};

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "T") + (parts[1]?.[0] || "");
}

function formatBookingDate(date: string, time: string, language: SiteLanguage) {
  const locale = language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`)) + (time ? ` · ${time}` : "");
}

function getStatusLabel(status: string, t: AccountCopy) {
  if (status === "pending") return t.pending;
  if (status === "cancelled") return t.cancelled;
  if (status === "completed") return t.completed;
  return t.confirmed;
}

export default function CustomerAccountView({
  language,
  session,
  initialAccount,
  initialBookings,
  searchIndex
}: {
  language: SiteLanguage;
  session: PublicCustomerSession | null;
  initialAccount: CustomerAccountRecord | null;
  initialBookings: CustomerBookingSummary[];
  searchIndex: PublicSearchIndex;
}) {
  const t = copy[language];
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("upcoming");
  const [account, setAccount] = useState<CustomerAccountRecord | null>(initialAccount);
  const [bookings] = useState<CustomerBookingSummary[]>(initialBookings);
  const [selectedBookingId, setSelectedBookingId] = useState(initialBookings[0]?.id ?? "");
  const [statusText, setStatusText] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [localPhone, setLocalPhone] = useState("");
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const phoneMenuRef = useRef<HTMLDivElement | null>(null);

  const nowKey = new Date().toISOString().slice(0, 16);
  const phoneRule = getPhoneRule(phoneCountry);

  useEffect(() => {
    if (!account) {
      return;
    }

    const digits = onlyPhoneDigits(account.phone);
    const matchedCountry =
      phoneCountries.find((country) => {
        const prefixDigits = onlyPhoneDigits(getPhoneRule(country).prefix);
        return digits.startsWith(prefixDigits);
      }) ||
      inferPhoneCountryFromLocale(session?.locale || "") ||
      "Ukraine";

    const nextRule = getPhoneRule(matchedCountry);
    setPhoneCountry(matchedCountry);
    setLocalPhone(formatPhoneLocal(getPhoneLocalDigits(account.phone, nextRule), nextRule));
  }, [account?.phone, session?.locale]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!phoneMenuRef.current) {
        return;
      }

      if (!phoneMenuRef.current.contains(event.target as Node)) {
        setPhoneMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const filteredBookings = useMemo(() => {
    if (activityFilter === "all") {
      return bookings;
    }

    if (activityFilter === "history") {
      return bookings.filter((item) => `${item.appointmentDate}T${item.appointmentTime}` < nowKey);
    }

    return bookings.filter((item) => `${item.appointmentDate}T${item.appointmentTime}` >= nowKey);
  }, [activityFilter, bookings, nowKey]);

  const selectedBooking =
    filteredBookings.find((item) => item.id === selectedBookingId) ?? filteredBookings[0] ?? null;

  async function saveAccount(nextAccount: CustomerAccountRecord) {
    const nextPhone = localPhone.trim() ? buildInternationalPhone(phoneCountry, localPhone) : "";
    const response = await fetch("/api/public/account", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...nextAccount,
        phone: nextPhone
      })
    });

    if (!response.ok) {
      setStatusText(t.couldNotSave);
      return;
    }

    const payload = (await response.json()) as { account: CustomerAccountRecord };
    setAccount(payload.account);
    setStatusText(t.saved);
  }

  async function logout() {
    await fetch("/api/public/auth/logout", { method: "POST" });
    window.location.href = getLocalizedPath(language);
  }

  if (!session || !account) {
    const returnTo = getLocalizedPath(language, "/account");
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <Link href={getLocalizedPath(language)} className={styles.brand}>
            <BrandLogo />
          </Link>
        </header>
        <section className={`${styles.card} ${styles.signInCard}`}>
          <h1 className={styles.sectionTitle}>{t.signInTitle}</h1>
          <p>{t.signInText}</p>
          <a className={styles.saveButton} href={`/api/public/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}>
            {t.signInGoogle}
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href={getLocalizedPath(language)} className={styles.brand}>
          <BrandLogo />
        </Link>
        <div className={styles.searchHost}>
          <PublicSearch index={searchIndex} language={language} />
        </div>
        <div className={styles.headerActions}>
          <div className={styles.avatar}>{getInitials(account.fullName || session.fullName)}</div>
          <GlobalLanguageSwitcher mode="inline" />
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarName}>{account.fullName || session.fullName}</p>
          <nav className={styles.nav}>
            {([
              ["profile", t.profile],
              ["activity", t.activity],
              ["wallet", t.wallet],
              ["favorites", t.favorites],
              ["forms", t.forms],
              ["settings", t.settings]
            ] as Array<[AccountSection, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.navButton} ${activeSection === key ? styles.navButtonActive : ""}`}
                onClick={() => setActiveSection(key)}
              >
                <span>◦</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className={styles.main}>
          {statusText ? <p className={styles.status}>{statusText}</p> : null}

          {activeSection === "profile" ? (
            <>
              <h1 className={styles.sectionTitle}>{t.profileTitle}</h1>
              <div className={styles.profileGrid}>
                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h2 className={styles.cardTitle}>{t.profile}</h2>
                    <button type="button" className={styles.editButton}>
                      {t.edit}
                    </button>
                  </div>

                  <div className={styles.profileHero}>
                    <div className={styles.profileAvatar}>{getInitials(account.fullName || session.fullName)}</div>
                    <h3 className={styles.profileName}>{account.fullName || session.fullName}</h3>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.inlineGrid}>
                      <label className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>{t.firstName}</span>
                        <input
                          className={styles.input}
                          value={account.givenName}
                          onChange={(event) => setAccount({ ...account, givenName: event.target.value, fullName: `${event.target.value} ${account.familyName}`.trim() })}
                        />
                      </label>
                      <label className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>{t.lastName}</span>
                        <input
                          className={styles.input}
                          value={account.familyName}
                          onChange={(event) => setAccount({ ...account, familyName: event.target.value, fullName: `${account.givenName} ${event.target.value}`.trim() })}
                        />
                      </label>
                    </div>
                    <label className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>{t.phone}</span>
                      <div className={styles.phoneRow}>
                        <div className={styles.phonePrefixSelect} ref={phoneMenuRef}>
                          <button
                            type="button"
                            className={styles.phonePrefixTrigger}
                            onClick={() => setPhoneMenuOpen((value) => !value)}
                            aria-haspopup="listbox"
                            aria-expanded={phoneMenuOpen}
                          >
                            <span>{phoneRule.prefix}</span>
                            <span className={styles.phonePrefixChevron} aria-hidden="true" />
                          </button>
                          {phoneMenuOpen ? (
                            <div className={styles.phonePrefixMenu} role="listbox">
                              {phoneCountries.map((country) => {
                                const rule = getPhoneRule(country);
                                const active = country === phoneCountry;
                                return (
                                  <button
                                    key={country}
                                    type="button"
                                    className={`${styles.phonePrefixOption} ${active ? styles.phonePrefixOptionActive : ""}`}
                                    onClick={() => {
                                      const nextRule = getPhoneRule(country);
                                      setPhoneCountry(country);
                                      setLocalPhone(formatPhoneLocal(onlyPhoneDigits(localPhone), nextRule));
                                      setPhoneMenuOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={active}
                                  >
                                    <strong>{rule.prefix}</strong>
                                    <span>{country}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                        <input
                          className={styles.input}
                          type="tel"
                          inputMode="numeric"
                          placeholder={phoneRule.placeholder}
                          value={localPhone}
                          onChange={(event) => setLocalPhone(formatPhoneLocal(event.target.value, phoneRule))}
                        />
                      </div>
                    </label>
                    <label className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>{t.email}</span>
                      <input className={styles.input} value={account.email} readOnly />
                    </label>
                    <div className={`${styles.inlineGrid} ${styles.dateGenderGrid}`}>
                      <label className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>{t.birthday}</span>
                        <input
                          className={`${styles.input} ${styles.compactControl}`}
                          type="date"
                          value={account.birthday}
                          onChange={(event) => setAccount({ ...account, birthday: event.target.value })}
                        />
                      </label>
                      <label className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>{t.gender}</span>
                        <select
                          className={`${styles.select} ${styles.compactControl}`}
                          value={account.gender}
                          onChange={(event) => setAccount({ ...account, gender: event.target.value })}
                        >
                          <option value="">{t.genderUnspecified}</option>
                          <option value="female">{t.genderFemale}</option>
                          <option value="male">{t.genderMale}</option>
                        </select>
                      </label>
                    </div>
                    <button type="button" className={styles.saveButton} onClick={() => void saveAccount(account)}>
                      {t.save}
                    </button>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h2 className={styles.cardTitle}>{t.addressesTitle}</h2>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() =>
                        setAccount({
                          ...account,
                          addresses: [
                            ...account.addresses,
                            {
                              id: `addr_${crypto.randomUUID()}`,
                              label: "other",
                              title: "",
                              address: ""
                            }
                          ]
                        })
                      }
                    >
                      {t.addAddress}
                    </button>
                  </div>

                  <div className={styles.addressList}>
                    {account.addresses.length ? (
                      account.addresses.map((address, index) => (
                        <div className={styles.addressCard} key={address.id}>
                          <div className={styles.inlineGrid}>
                            <label className={styles.fieldRow}>
                              <span className={styles.fieldLabel}>{t.title}</span>
                              <input
                                className={styles.input}
                                value={address.title}
                                onChange={(event) => {
                                  const next = [...account.addresses];
                                  next[index] = { ...address, title: event.target.value };
                                  setAccount({ ...account, addresses: next });
                                }}
                              />
                            </label>
                            <label className={styles.fieldRow}>
                              <span className={styles.fieldLabel}>{t.address}</span>
                              <input
                                className={styles.input}
                                value={address.address}
                                onChange={(event) => {
                                  const next = [...account.addresses];
                                  next[index] = { ...address, address: event.target.value };
                                  setAccount({ ...account, addresses: next });
                                }}
                              />
                            </label>
                          </div>
                          <div className={styles.addressActions}>
                            <select
                              className={styles.select}
                              value={address.label}
                              onChange={(event) => {
                                const next = [...account.addresses];
                                next[index] = { ...address, label: event.target.value };
                                setAccount({ ...account, addresses: next });
                              }}
                            >
                              <option value="home">{t.home}</option>
                              <option value="work">{t.work}</option>
                              <option value="other">{t.other}</option>
                            </select>
                            <button
                              type="button"
                              className={styles.dangerButton}
                              onClick={() => setAccount({ ...account, addresses: account.addresses.filter((item) => item.id !== address.id) })}
                            >
                              {t.remove}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyCard}>
                        <strong>{t.empty}</strong>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {activeSection === "activity" ? (
            <>
              <h1 className={styles.sectionTitle}>{t.activity}</h1>
              <div className={styles.activityTabs}>
                {([
                  ["upcoming", t.upcoming],
                  ["all", t.all],
                  ["history", t.bookingHistory]
                ] as Array<[ActivityFilter, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.tabButton} ${activityFilter === key ? styles.tabButtonActive : ""}`}
                    onClick={() => {
                      setActivityFilter(key);
                      setSelectedBookingId("");
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={styles.activityShell}>
                <div className={styles.bookingList}>
                  {filteredBookings.length ? (
                    filteredBookings.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        className={`${styles.bookingItem} ${selectedBooking?.id === booking.id ? styles.bookingItemActive : ""}`}
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <img src={booking.businessImage} alt={booking.businessName} />
                        <div className={styles.bookingItemContent}>
                          <strong>{booking.businessName}</strong>
                          <span>{formatBookingDate(booking.appointmentDate, booking.appointmentTime, language)}</span>
                          <small>{booking.serviceName}</small>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className={`${styles.card} ${styles.emptyCard}`}>
                      <strong>{t.empty}</strong>
                      <span>{t.noBookings}</span>
                    </div>
                  )}
                </div>

                <section className={styles.card}>
                  {selectedBooking ? (
                    <>
                      <img className={styles.bookingDetailImage} src={selectedBooking.businessImage} alt={selectedBooking.businessName} />
                      <div className={styles.cardTitleRow}>
                        <h2 className={styles.cardTitle}>{selectedBooking.businessName}</h2>
                        <span
                          className={`${styles.badge} ${
                            selectedBooking.status === "pending"
                              ? styles.badgePending
                              : selectedBooking.status === "cancelled"
                                ? styles.badgeCancelled
                                : selectedBooking.status === "completed"
                                  ? styles.badgeCompleted
                                  : styles.badgeConfirmed
                          }`}
                        >
                          {getStatusLabel(selectedBooking.status, t)}
                        </span>
                      </div>
                      <div className={styles.detailMeta}>
                        <div className={styles.detailRow}>
                          <span>{t.date}</span>
                          <strong>{formatBookingDate(selectedBooking.appointmentDate, "", language)}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>{t.time}</span>
                          <strong>{selectedBooking.appointmentTime}</strong>
                        </div>
                        <div className={styles.detailRow}>
                          <span>{t.service}</span>
                          <strong>{selectedBooking.serviceName}</strong>
                        </div>
                      </div>
                      <div className={styles.detailActions}>
                        {selectedBooking.businessPath ? (
                          <Link href={getLocalizedPath(language, `/businesses/${selectedBooking.businessPath}`)} className={styles.ghostButton}>
                            {t.openVenue}
                          </Link>
                        ) : null}
                        {selectedBooking.businessAddress ? (
                          <a
                            className={styles.ghostButton}
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBooking.businessAddress)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t.route}
                          </a>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyCard}>
                      <strong>{t.bookingDetails}</strong>
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : null}

          {activeSection === "settings" ? (
            <>
              <h1 className={styles.sectionTitle}>{t.settings}</h1>
              <div className={styles.settingsGrid}>
                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h2 className={styles.cardTitle}>{t.linkedGoogle}</h2>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.fieldRow}>
                      <strong>{session.email}</strong>
                      <span className={styles.fieldLabel}>{t.connected}</span>
                    </div>
                    <button type="button" className={styles.dangerButton} onClick={() => void logout()}>
                      {t.signOut}
                    </button>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h2 className={styles.cardTitle}>{t.reminders}</h2>
                  </div>
                  <div className={styles.toggleList}>
                    {([
                      ["bookingSms", "SMS"],
                      ["bookingWhatsapp", "WhatsApp"],
                      ["marketingEmail", "Email"],
                      ["marketingSms", "SMS marketing"],
                      ["marketingWhatsapp", "WhatsApp marketing"]
                    ] as Array<[keyof CustomerNotifications, string]>).map(([key, label]) => (
                      <div key={key} className={styles.toggleRow}>
                        <div className={styles.toggleLabel}>
                          <strong>{label}</strong>
                          <span>{key.startsWith("marketing") ? t.marketing : t.reminders}</span>
                        </div>
                        <button
                          type="button"
                          className={`${styles.toggle} ${account.notifications[key] ? styles.toggleActive : ""}`}
                          onClick={() => {
                            const nextAccount = {
                              ...account,
                              notifications: { ...account.notifications, [key]: !account.notifications[key] }
                            };
                            setAccount(nextAccount);
                            void saveAccount(nextAccount);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {activeSection === "wallet" || activeSection === "favorites" || activeSection === "forms" ? (
            <>
              <h1 className={styles.sectionTitle}>
                {activeSection === "wallet" ? t.wallet : activeSection === "favorites" ? t.favorites : t.forms}
              </h1>
              <div className={`${styles.card} ${styles.emptyCard}`}>
                <strong>{t.empty}</strong>
                <span>{t.soon}</span>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

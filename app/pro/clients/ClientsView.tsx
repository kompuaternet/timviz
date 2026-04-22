"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../pro.module.css";
import ProSidebar from "../ProSidebar";
import type { ClientListItem } from "../../../lib/pro-clients";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneLocalDigits,
  getPhoneRule,
  getPhoneValidationMessage,
  isPhoneValid
} from "../../../lib/phone-format";

type ClientsViewProps = {
  professionalId: string;
  accountCountry: string;
  accountCurrency: string;
  businessName: string;
  initialClients: ClientListItem[];
};

type ClientForm = {
  clientId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  notes: string;
  notificationsTelegram: boolean;
  marketingTelegram: boolean;
};

type AppLanguage = "ru" | "uk" | "en";
type AppLocale = "ru-RU" | "uk-UA" | "en-US";

const CLIENTS_TEXT: Record<AppLanguage, {
  title: string;
  count: string;
  searchPlaceholder: string;
  addClient: string;
  name: string;
  phone: string;
  reviews: string;
  sales: string;
  createdAt: string;
  visits: string;
  noClientsTitle: string;
  noClientsHint: string;
  close: string;
  save: string;
  saving: string;
  editClient: string;
  newClient: string;
  personalInfo: string;
  profile: string;
  settings: string;
  profileHint: string;
  firstName: string;
  lastName: string;
  email: string;
  telegram: string;
  firstNamePlaceholder: string;
  lastNamePlaceholder: string;
  settingsHint: string;
  notifyTelegram: string;
  notifyTelegramHint: string;
  marketingTelegram: string;
  marketingTelegramHint: string;
  note: string;
  notePlaceholder: string;
  saved: string;
  created: string;
  saveError: string;
}> = {
  ru: {
    title: "Клиенты",
    count: "клиентов",
    searchPlaceholder: "Имя, телефон, email или Telegram",
    addClient: "Добавить клиента",
    name: "Имя клиента",
    phone: "Телефон",
    reviews: "Отзывы",
    sales: "Продажи",
    createdAt: "Дата создания",
    visits: "визитов",
    noClientsTitle: "Клиенты не найдены",
    noClientsHint: "Попробуй другой номер или имя, либо добавь нового клиента.",
    close: "Закрыть",
    save: "Сохранить",
    saving: "Сохраняем...",
    editClient: "Редактировать клиента",
    newClient: "Добавить нового клиента",
    personalInfo: "Личные сведения",
    profile: "Профиль",
    settings: "Настройки",
    profileHint: "Управляйте личным профилем клиента",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Эл. почта",
    telegram: "Telegram",
    firstNamePlaceholder: "Например, Саша",
    lastNamePlaceholder: "Например, Мороз",
    settingsHint: "Выберите, как клиент будет получать уведомления и маркетинговые предложения",
    notifyTelegram: "Уведомления о записи в Telegram",
    notifyTelegramHint: "Использовать Telegram вместо SMS",
    marketingTelegram: "Маркетинговая рассылка в Telegram",
    marketingTelegramHint: "Клиент согласен получать акции и напоминания",
    note: "Заметка о клиенте",
    notePlaceholder: "Например: предпочитает напоминания только в Telegram",
    saved: "Карточка клиента обновлена.",
    created: "Клиент добавлен.",
    saveError: "Не удалось сохранить клиента."
  },
  uk: {
    title: "Клієнти",
    count: "клієнтів",
    searchPlaceholder: "Ім'я, телефон, email або Telegram",
    addClient: "Додати клієнта",
    name: "Ім'я клієнта",
    phone: "Телефон",
    reviews: "Відгуки",
    sales: "Продажі",
    createdAt: "Дата створення",
    visits: "візитів",
    noClientsTitle: "Клієнтів не знайдено",
    noClientsHint: "Спробуй інший номер або ім'я, або додай нового клієнта.",
    close: "Закрити",
    save: "Зберегти",
    saving: "Зберігаємо...",
    editClient: "Редагувати клієнта",
    newClient: "Додати нового клієнта",
    personalInfo: "Особисті дані",
    profile: "Профіль",
    settings: "Налаштування",
    profileHint: "Керуйте особистим профілем клієнта",
    firstName: "Ім'я",
    lastName: "Прізвище",
    email: "Ел. пошта",
    telegram: "Telegram",
    firstNamePlaceholder: "Наприклад, Саша",
    lastNamePlaceholder: "Наприклад, Мороз",
    settingsHint: "Виберіть, як клієнт отримуватиме сповіщення та маркетингові пропозиції",
    notifyTelegram: "Сповіщення про запис у Telegram",
    notifyTelegramHint: "Використовувати Telegram замість SMS",
    marketingTelegram: "Маркетингова розсилка в Telegram",
    marketingTelegramHint: "Клієнт погодився отримувати акції та нагадування",
    note: "Нотатка про клієнта",
    notePlaceholder: "Наприклад: хоче нагадування тільки в Telegram",
    saved: "Картку клієнта оновлено.",
    created: "Клієнта додано.",
    saveError: "Не вдалося зберегти клієнта."
  },
  en: {
    title: "Clients",
    count: "clients",
    searchPlaceholder: "Name, phone, email or Telegram",
    addClient: "Add client",
    name: "Client name",
    phone: "Phone",
    reviews: "Reviews",
    sales: "Sales",
    createdAt: "Created",
    visits: "visits",
    noClientsTitle: "No clients found",
    noClientsHint: "Try another name or phone, or add a new client.",
    close: "Close",
    save: "Save",
    saving: "Saving...",
    editClient: "Edit client",
    newClient: "Add new client",
    personalInfo: "Personal details",
    profile: "Profile",
    settings: "Settings",
    profileHint: "Manage the client's personal profile",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    telegram: "Telegram",
    firstNamePlaceholder: "For example, Sasha",
    lastNamePlaceholder: "For example, Frost",
    settingsHint: "Choose how the client receives notifications and marketing",
    notifyTelegram: "Appointment notifications in Telegram",
    notifyTelegramHint: "Use Telegram instead of SMS",
    marketingTelegram: "Marketing messages in Telegram",
    marketingTelegramHint: "Client agrees to receive offers and reminders",
    note: "Client note",
    notePlaceholder: "For example: prefers reminders only in Telegram",
    saved: "Client card updated.",
    created: "Client added.",
    saveError: "Could not save client."
  }
};

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "ru" || value === "uk" || value === "en";
}

function getLocale(language: AppLanguage): AppLocale {
  if (language === "uk") {
    return "uk-UA";
  }

  if (language === "en") {
    return "en-US";
  }

  return "ru-RU";
}

const emptyForm: ClientForm = {
  clientId: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  telegram: "",
  notes: "",
  notificationsTelegram: true,
  marketingTelegram: false
};

function makeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "К";
  }

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "К";
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatDate(date: string, locale: AppLocale) {
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatMoney(value: number, locale: AppLocale, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function ClientsView({ professionalId, accountCountry, accountCurrency, initialClients }: ClientsViewProps) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [uiLanguage, setUiLanguage] = useState<AppLanguage>("ru");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const phoneRule = getPhoneRule(accountCountry);
  const t = CLIENTS_TEXT[uiLanguage];
  const locale = getLocale(uiLanguage);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("rezervo-pro-language");
    if (isAppLanguage(storedLanguage)) {
      setUiLanguage(storedLanguage);
    }

    function handleLanguageChange(event: Event) {
      const nextLanguage = (event as CustomEvent<string>).detail;
      if (isAppLanguage(nextLanguage)) {
        setUiLanguage(nextLanguage);
      }
    }

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const queryDigits = digitsOnly(query);

    if (!normalizedQuery && !queryDigits) {
      return clients;
    }

    return clients.filter((client) => {
      const haystack = `${client.fullName} ${client.phone} ${client.email} ${client.telegram}`.toLowerCase();
      const textMatch = normalizedQuery ? haystack.includes(normalizedQuery) : false;
      const phoneDigits = digitsOnly(client.phone || "");
      const digitsMatch = queryDigits ? phoneDigits.includes(queryDigits) : false;
      return textMatch || digitsMatch;
    });
  }, [clients, query]);

  function openCreateModal() {
    setForm(emptyForm);
    setActiveTab("profile");
    setStatusText("");
    setModalOpen(true);
  }

  function openEditModal(client: ClientListItem) {
    setForm({
      clientId: client.id.startsWith("derived_") ? null : client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: formatPhoneLocal(getPhoneLocalDigits(client.phone, phoneRule), phoneRule),
      telegram: client.telegram,
      notes: client.notes,
      notificationsTelegram: client.notificationsTelegram,
      marketingTelegram: client.marketingTelegram
    });
    setActiveTab("profile");
    setStatusText("");
    setModalOpen(true);
  }

  async function refreshClients() {
    const response = await fetch("/api/pro/clients");
    const payload = await response.json();
    setClients(payload.clients ?? []);
  }

  async function handleSave() {
    if (form.phone.trim() && !isPhoneValid(accountCountry, form.phone)) {
      setStatusText(getPhoneValidationMessage(accountCountry));
      return;
    }

    setSaving(true);
    setStatusText("");
    const payloadForm = {
      ...form,
      phone: buildInternationalPhone(accountCountry, form.phone)
    };

    const response = await fetch("/api/pro/clients", {
      method: form.clientId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form.clientId ? { ...payloadForm, clientId: form.clientId } : payloadForm)
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatusText(payload.error || t.saveError);
      setSaving(false);
      return;
    }

    await refreshClients();
    setSaving(false);
    setModalOpen(false);
    setStatusText(form.clientId ? t.saved : t.created);
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="clients" professionalId={professionalId} />

      <section className={styles.clientsShell}>
        <section className={styles.clientsMain}>
          <header className={styles.clientsHeader}>
            <div>
              <div className={styles.clientsTitleRow}>
                <h1 className={styles.clientsTitle}>{t.title}</h1>
                <span className={styles.clientsBadge}>{clients.length}</span>
              </div>
            </div>

            <div className={styles.clientsActions}>
              <button type="button" className={styles.clientsPrimaryAddButton} onClick={openCreateModal}>
                + {t.addClient}
              </button>
            </div>
          </header>

          <section className={styles.clientsToolbar}>
            <div className={styles.clientsToolbarLeft}>
              <div className={styles.clientsSearch}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.8" />
                  <path d="m20 20-3.8-3.8" />
                </svg>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchPlaceholder}
                />
                {query ? (
                  <button type="button" className={styles.clientsSearchClear} onClick={() => setQuery("")}>
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {statusText ? <div className={styles.clientsStatus}>{statusText}</div> : null}

          <section id="clients-table" className={styles.clientsTable}>
            <div className={styles.clientsTableHead}>
              <div className={styles.clientsCheckboxCell}>
                <input type="checkbox" aria-label="Выбрать всех клиентов" />
              </div>
              <div>{t.name}</div>
              <div>{t.phone}</div>
              <div>{t.reviews}</div>
              <div>{t.sales}</div>
              <div>{t.createdAt}</div>
            </div>

            <div className={styles.clientsRows}>
              {filteredClients.map((client) => (
                <article key={client.id} className={styles.clientsRow} onClick={() => openEditModal(client)}>
                  <div className={styles.clientsCheckboxCell} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" aria-label={`Выбрать ${client.fullName}`} />
                  </div>
                  <div className={styles.clientIdentity}>
                    <div className={styles.clientAvatar}>{makeInitials(client.fullName)}</div>
                    <div>
                      <strong>{client.fullName}</strong>
                      <span>{client.email || `${client.visitsCount} ${t.visits}`}</span>
                    </div>
                  </div>
                  <div data-label={t.phone}>{client.phone || "—"}</div>
                  <div data-label={t.reviews}>—</div>
                  <div data-label={t.sales}>{formatMoney(client.totalSales, locale, accountCurrency)}</div>
                  <div data-label={t.createdAt}>{formatDate(client.createdAt, locale)}</div>
                </article>
              ))}

              {filteredClients.length === 0 ? (
                <div className={styles.clientsEmptyState}>
                  <strong>{t.noClientsTitle}</strong>
                  <span>{t.noClientsHint}</span>
                  <button type="button" className={styles.clientsPrimaryAddButton} onClick={openCreateModal}>
                    + {t.addClient}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </section>

      {modalOpen ? (
        <div className={styles.clientsModalBackdrop}>
          <div className={styles.clientsModal}>
            <header className={styles.clientsDrawerHeader}>
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setModalOpen(false)}>
                ←
              </button>
              <div>
                <strong>{form.clientId ? t.editClient : t.newClient}</strong>
                <span>{t.personalInfo}</span>
              </div>
            </header>

            <div className={styles.clientsDrawerTabs}>
              <button
                type="button"
                className={activeTab === "profile" ? styles.clientsDrawerTabActive : ""}
                onClick={() => setActiveTab("profile")}
              >
                {t.profile}
              </button>
              <button
                type="button"
                className={activeTab === "settings" ? styles.clientsDrawerTabActive : ""}
                onClick={() => setActiveTab("settings")}
              >
                {t.settings}
              </button>
            </div>

            <section className={styles.clientsModalContent}>
                {activeTab === "profile" ? (
                  <div className={styles.clientsFormSection}>
                    <h3>{t.profile}</h3>

                    <div className={styles.clientsFormGrid}>
                      <label>
                        <span>{t.firstName}</span>
                        <input
                          className={styles.input}
                          value={form.firstName}
                          onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                          placeholder={t.firstNamePlaceholder}
                        />
                      </label>
                      <label>
                        <span>{t.lastName}</span>
                        <input
                          className={styles.input}
                          value={form.lastName}
                          onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                          placeholder={t.lastNamePlaceholder}
                        />
                      </label>
                      <label>
                        <span>{t.email}</span>
                        <input
                          className={styles.input}
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          placeholder="example@domain.com"
                        />
                      </label>
                      <label>
                        <span>{t.phone}</span>
                        <div className={styles.phoneRow}>
                          <div className={styles.phoneCode}>{phoneRule.prefix}</div>
                          <input
                            className={styles.phoneInput}
                            inputMode="numeric"
                            value={form.phone}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                phone: formatPhoneLocal(event.target.value, phoneRule)
                              }))
                            }
                            placeholder={phoneRule.placeholder}
                          />
                        </div>
                      </label>
                      <label>
                        <span>{t.telegram}</span>
                        <input
                          className={styles.input}
                          value={form.telegram}
                          onChange={(event) => setForm((current) => ({ ...current, telegram: event.target.value }))}
                          placeholder="@username"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className={styles.clientsFormSection}>
                    <h3>{t.settings}</h3>

                    <div className={styles.clientsSettingsList}>
                      <label className={styles.clientsSettingRow}>
                        <input
                          type="checkbox"
                          checked={form.notificationsTelegram}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, notificationsTelegram: event.target.checked }))
                          }
                        />
                        <div>
                          <strong>{t.notifyTelegram}</strong>
                          <span>{t.notifyTelegramHint}</span>
                        </div>
                      </label>

                      <label className={styles.clientsSettingRow}>
                        <input
                          type="checkbox"
                          checked={form.marketingTelegram}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, marketingTelegram: event.target.checked }))
                          }
                        />
                        <div>
                          <strong>{t.marketingTelegram}</strong>
                          <span>{t.marketingTelegramHint}</span>
                        </div>
                      </label>

                      <label className={styles.clientsTextareaWrap}>
                        <span>{t.note}</span>
                        <textarea
                          className={styles.textarea}
                          value={form.notes}
                          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                          placeholder={t.notePlaceholder}
                        />
                      </label>
                    </div>
                  </div>
                )}
            </section>

            <footer className={styles.clientsDrawerFooter}>
              <button type="button" className={styles.calendarSecondaryAction} onClick={() => setModalOpen(false)}>
                {t.close}
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => void handleSave()} disabled={saving}>
                {saving ? t.saving : t.save}
              </button>
            </footer>
            </div>
        </div>
      ) : null}
    </main>
  );
}

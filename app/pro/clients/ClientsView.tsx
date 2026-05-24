"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../pro.module.css";
import ProSidebar from "../ProSidebar";
import ProWorkspaceHeader from "../ProWorkspaceHeader";
import type { ClientListItem } from "../../../lib/pro-clients";
import type { OnboardingCtaState } from "../../../lib/pro-onboarding";
import { localeBySiteLanguage } from "../../../lib/site-language";
import { isProLanguage, type BaseProLanguage, type ProLanguage } from "../i18n";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneEditingState,
  getPhoneRule,
  getPhoneValidationMessage,
  isPhoneValid,
  onlyPhoneDigits,
  phoneCountries
} from "../../../lib/phone-format";

type ClientsViewProps = {
  professionalId: string;
  accountCountry: string;
  accountCurrency: string;
  businessName: string;
  canManageStaff: boolean;
  onboardingCta: OnboardingCtaState;
  initialClients: ClientListItem[];
  header: {
    viewerName: string;
    viewerAvatarUrl?: string;
    viewerInitials: string;
    isPremium?: boolean;
    publicBookingUrl?: string;
    publicBookingEnabled?: boolean;
  };
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

type AppLanguage = ProLanguage;
type AppLocale = string;

type ClientsCopy = {
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
  deleteClient: string;
  deleting: string;
  deleteConfirm: string;
  deleteError: string;
  editClient: string;
  newClient: string;
  personalInfo: string;
  profile: string;
  settings: string;
  profileHint: string;
  firstName: string;
  lastName: string;
  email: string;
  prefixAria: string;
  prefixSearch: string;
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
  totalSales: string;
  returningClients: string;
  withPhone: string;
  emptyAction: string;
  quickHintTitle: string;
  quickHintText: string;
};

const CLIENTS_TEXT: Record<AppLanguage, ClientsCopy> = {
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
    deleteClient: "Удалить клиента",
    deleting: "Удаляем...",
    deleteConfirm: "Удалить эту карточку клиента?",
    deleteError: "Не удалось удалить клиента.",
    editClient: "Редактировать клиента",
    newClient: "Добавить нового клиента",
    personalInfo: "Личные сведения",
    profile: "Профиль",
    settings: "Настройки",
    profileHint: "Управляйте личным профилем клиента",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Эл. почта",
    prefixAria: "Выберите телефонный код",
    prefixSearch: "Поиск по стране или коду",
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
    saveError: "Не удалось сохранить клиента.",
    totalSales: "Оборот",
    returningClients: "Повторные",
    withPhone: "С телефоном",
    emptyAction: "Добавить первого клиента",
    quickHintTitle: "База клиентов всегда под рукой",
    quickHintText: "Сохраняйте телефон, Telegram и заметки, чтобы быстрее создавать повторные записи."
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
    deleteClient: "Видалити клієнта",
    deleting: "Видаляємо...",
    deleteConfirm: "Видалити цю картку клієнта?",
    deleteError: "Не вдалося видалити клієнта.",
    editClient: "Редагувати клієнта",
    newClient: "Додати нового клієнта",
    personalInfo: "Особисті дані",
    profile: "Профіль",
    settings: "Налаштування",
    profileHint: "Керуйте особистим профілем клієнта",
    firstName: "Ім'я",
    lastName: "Прізвище",
    email: "Ел. пошта",
    prefixAria: "Виберіть телефонний код",
    prefixSearch: "Пошук за країною або кодом",
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
    saveError: "Не вдалося зберегти клієнта.",
    totalSales: "Оборот",
    returningClients: "Повторні",
    withPhone: "З телефоном",
    emptyAction: "Додати першого клієнта",
    quickHintTitle: "База клієнтів завжди під рукою",
    quickHintText: "Зберігайте телефон, Telegram і нотатки, щоб швидше створювати повторні записи."
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
    deleteClient: "Delete client",
    deleting: "Deleting...",
    deleteConfirm: "Delete this client card?",
    deleteError: "Could not delete client.",
    editClient: "Edit client",
    newClient: "Add new client",
    personalInfo: "Personal details",
    profile: "Profile",
    settings: "Settings",
    profileHint: "Manage the client's personal profile",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    prefixAria: "Choose phone prefix",
    prefixSearch: "Search by country or code",
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
    saveError: "Could not save client.",
    totalSales: "Revenue",
    returningClients: "Returning",
    withPhone: "With phone",
    emptyAction: "Add first client",
    quickHintTitle: "Client base at your fingertips",
    quickHintText: "Save phone, Telegram and notes to create repeat bookings faster."
  },
  fr: {
    title: "Clients",
    count: "clients",
    searchPlaceholder: "Nom, téléphone, e-mail ou Telegram",
    addClient: "Ajouter un client",
    name: "Nom du client",
    phone: "Téléphone",
    reviews: "Avis",
    sales: "Ventes",
    createdAt: "Créé",
    visits: "visites",
    noClientsTitle: "Aucun client trouvé",
    noClientsHint: "Essayez un autre nom ou téléphone, ou ajoutez un nouveau client.",
    close: "Fermer",
    save: "Enregistrer",
    saving: "Enregistrement...",
    deleteClient: "Supprimer le client",
    deleting: "Suppression...",
    deleteConfirm: "Supprimer cette fiche client ?",
    deleteError: "Impossible de supprimer le client.",
    editClient: "Modifier le client",
    newClient: "Ajouter un nouveau client",
    personalInfo: "Informations personnelles",
    profile: "Profil",
    settings: "Réglages",
    profileHint: "Gérez le profil personnel du client",
    firstName: "Prénom",
    lastName: "Nom",
    email: "E-mail",
    prefixAria: "Choisir l’indicatif téléphonique",
    prefixSearch: "Recherche par pays ou code",
    telegram: "Telegram",
    firstNamePlaceholder: "Par exemple, Sasha",
    lastNamePlaceholder: "Par exemple, Moreau",
    settingsHint: "Choisissez comment le client reçoit les notifications et le marketing",
    notifyTelegram: "Notifications de rendez-vous dans Telegram",
    notifyTelegramHint: "Utiliser Telegram au lieu du SMS",
    marketingTelegram: "Messages marketing dans Telegram",
    marketingTelegramHint: "Le client accepte de recevoir offres et rappels",
    note: "Note client",
    notePlaceholder: "Par exemple : préfère les rappels uniquement dans Telegram",
    saved: "Fiche client mise à jour.",
    created: "Client ajouté.",
    saveError: "Impossible d’enregistrer le client.",
    totalSales: "Revenu",
    returningClients: "Récurrents",
    withPhone: "Avec téléphone",
    emptyAction: "Ajouter le premier client",
    quickHintTitle: "Base clients toujours sous la main",
    quickHintText: "Enregistrez téléphone, Telegram et notes pour créer plus vite les réservations répétées."
  },
  pl: {
    title: "Klienci",
    count: "klientów",
    searchPlaceholder: "Imię, telefon, e-mail lub Telegram",
    addClient: "Dodaj klienta",
    name: "Nazwa klienta",
    phone: "Telefon",
    reviews: "Opinie",
    sales: "Sprzedaż",
    createdAt: "Utworzono",
    visits: "wizyt",
    noClientsTitle: "Nie znaleziono klientów",
    noClientsHint: "Spróbuj innego imienia lub telefonu albo dodaj nowego klienta.",
    close: "Zamknij",
    save: "Zapisz",
    saving: "Zapisywanie...",
    deleteClient: "Usuń klienta",
    deleting: "Usuwanie...",
    deleteConfirm: "Usunąć tę kartę klienta?",
    deleteError: "Nie udało się usunąć klienta.",
    editClient: "Edytuj klienta",
    newClient: "Dodaj nowego klienta",
    personalInfo: "Dane osobowe",
    profile: "Profil",
    settings: "Ustawienia",
    profileHint: "Zarządzaj profilem klienta",
    firstName: "Imię",
    lastName: "Nazwisko",
    email: "E-mail",
    prefixAria: "Wybierz numer kierunkowy",
    prefixSearch: "Szukaj kraju lub kodu",
    telegram: "Telegram",
    firstNamePlaceholder: "Na przykład Sasha",
    lastNamePlaceholder: "Na przykład Moroz",
    settingsHint: "Wybierz, jak klient otrzymuje powiadomienia i marketing",
    notifyTelegram: "Powiadomienia o wizycie w Telegramie",
    notifyTelegramHint: "Używaj Telegrama zamiast SMS",
    marketingTelegram: "Wiadomości marketingowe w Telegramie",
    marketingTelegramHint: "Klient zgadza się otrzymywać oferty i przypomnienia",
    note: "Notatka o kliencie",
    notePlaceholder: "Na przykład: woli przypomnienia tylko w Telegramie",
    saved: "Karta klienta zaktualizowana.",
    created: "Klient dodany.",
    saveError: "Nie udało się zapisać klienta.",
    totalSales: "Przychód",
    returningClients: "Powracający",
    withPhone: "Z telefonem",
    emptyAction: "Dodaj pierwszego klienta",
    quickHintTitle: "Baza klientów zawsze pod ręką",
    quickHintText: "Zapisuj telefon, Telegram i notatki, aby szybciej tworzyć kolejne rezerwacje."
  },
  cs: {
    title: "Klienti",
    count: "klientů",
    searchPlaceholder: "Jméno, telefon, e-mail nebo Telegram",
    addClient: "Přidat klienta",
    name: "Jméno klienta",
    phone: "Telefon",
    reviews: "Recenze",
    sales: "Prodeje",
    createdAt: "Vytvořeno",
    visits: "návštěv",
    noClientsTitle: "Klienti nenalezeni",
    noClientsHint: "Zkuste jiné jméno nebo telefon, nebo přidejte nového klienta.",
    close: "Zavřít",
    save: "Uložit",
    saving: "Ukládání...",
    deleteClient: "Smazat klienta",
    deleting: "Mazání...",
    deleteConfirm: "Smazat tuto kartu klienta?",
    deleteError: "Klienta se nepodařilo smazat.",
    editClient: "Upravit klienta",
    newClient: "Přidat nového klienta",
    personalInfo: "Osobní údaje",
    profile: "Profil",
    settings: "Nastavení",
    profileHint: "Spravujte osobní profil klienta",
    firstName: "Jméno",
    lastName: "Příjmení",
    email: "E-mail",
    prefixAria: "Vyberte telefonní předvolbu",
    prefixSearch: "Hledat podle země nebo kódu",
    telegram: "Telegram",
    firstNamePlaceholder: "Například Sasha",
    lastNamePlaceholder: "Například Novák",
    settingsHint: "Vyberte, jak klient dostává oznámení a marketing",
    notifyTelegram: "Oznámení o rezervaci v Telegramu",
    notifyTelegramHint: "Používat Telegram místo SMS",
    marketingTelegram: "Marketingové zprávy v Telegramu",
    marketingTelegramHint: "Klient souhlasí s nabídkami a připomenutími",
    note: "Poznámka ke klientovi",
    notePlaceholder: "Například: preferuje připomenutí pouze v Telegramu",
    saved: "Karta klienta aktualizována.",
    created: "Klient přidán.",
    saveError: "Klienta se nepodařilo uložit.",
    totalSales: "Tržby",
    returningClients: "Vracející se",
    withPhone: "S telefonem",
    emptyAction: "Přidat prvního klienta",
    quickHintTitle: "Klientská databáze vždy po ruce",
    quickHintText: "Ukládejte telefon, Telegram a poznámky, abyste rychleji vytvářeli opakované rezervace."
  },
  es: {
    title: "Clientes",
    count: "clientes",
    searchPlaceholder: "Nombre, teléfono, email o Telegram",
    addClient: "Añadir cliente",
    name: "Nombre del cliente",
    phone: "Teléfono",
    reviews: "Reseñas",
    sales: "Ventas",
    createdAt: "Creado",
    visits: "visitas",
    noClientsTitle: "No se encontraron clientes",
    noClientsHint: "Prueba otro nombre o teléfono, o añade un cliente nuevo.",
    close: "Cerrar",
    save: "Guardar",
    saving: "Guardando...",
    deleteClient: "Eliminar cliente",
    deleting: "Eliminando...",
    deleteConfirm: "¿Eliminar esta ficha de cliente?",
    deleteError: "No se pudo eliminar el cliente.",
    editClient: "Editar cliente",
    newClient: "Añadir nuevo cliente",
    personalInfo: "Datos personales",
    profile: "Perfil",
    settings: "Ajustes",
    profileHint: "Gestiona el perfil personal del cliente",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Email",
    prefixAria: "Elegir prefijo telefónico",
    prefixSearch: "Buscar por país o código",
    telegram: "Telegram",
    firstNamePlaceholder: "Por ejemplo, Sasha",
    lastNamePlaceholder: "Por ejemplo, García",
    settingsHint: "Elige cómo el cliente recibe notificaciones y marketing",
    notifyTelegram: "Notificaciones de cita en Telegram",
    notifyTelegramHint: "Usar Telegram en lugar de SMS",
    marketingTelegram: "Mensajes de marketing en Telegram",
    marketingTelegramHint: "El cliente acepta recibir ofertas y recordatorios",
    note: "Nota del cliente",
    notePlaceholder: "Por ejemplo: prefiere recordatorios solo en Telegram",
    saved: "Ficha de cliente actualizada.",
    created: "Cliente añadido.",
    saveError: "No se pudo guardar el cliente.",
    totalSales: "Ingresos",
    returningClients: "Recurrentes",
    withPhone: "Con teléfono",
    emptyAction: "Añadir primer cliente",
    quickHintTitle: "Base de clientes siempre a mano",
    quickHintText: "Guarda teléfono, Telegram y notas para crear reservas repetidas más rápido."
  },
  de: {
    title: "Kunden",
    count: "Kunden",
    searchPlaceholder: "Name, Telefon, E-Mail oder Telegram",
    addClient: "Kunden hinzufügen",
    name: "Kundenname",
    phone: "Telefon",
    reviews: "Bewertungen",
    sales: "Umsatz",
    createdAt: "Erstellt",
    visits: "Besuche",
    noClientsTitle: "Keine Kunden gefunden",
    noClientsHint: "Versuche einen anderen Namen oder eine andere Telefonnummer, oder füge einen neuen Kunden hinzu.",
    close: "Schließen",
    save: "Speichern",
    saving: "Speichern...",
    deleteClient: "Kunden löschen",
    deleting: "Löschen...",
    deleteConfirm: "Diese Kundenkarte löschen?",
    deleteError: "Kunde konnte nicht gelöscht werden.",
    editClient: "Kunden bearbeiten",
    newClient: "Neuen Kunden hinzufügen",
    personalInfo: "Persönliche Daten",
    profile: "Profil",
    settings: "Einstellungen",
    profileHint: "Persönliches Kundenprofil verwalten",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    prefixAria: "Telefonvorwahl wählen",
    prefixSearch: "Nach Land oder Code suchen",
    telegram: "Telegram",
    firstNamePlaceholder: "Zum Beispiel Sasha",
    lastNamePlaceholder: "Zum Beispiel Müller",
    settingsHint: "Wähle, wie der Kunde Benachrichtigungen und Marketing erhält",
    notifyTelegram: "Terminbenachrichtigungen in Telegram",
    notifyTelegramHint: "Telegram statt SMS verwenden",
    marketingTelegram: "Marketingnachrichten in Telegram",
    marketingTelegramHint: "Kunde stimmt Angeboten und Erinnerungen zu",
    note: "Kundennotiz",
    notePlaceholder: "Zum Beispiel: bevorzugt Erinnerungen nur in Telegram",
    saved: "Kundenkarte aktualisiert.",
    created: "Kunde hinzugefügt.",
    saveError: "Kunde konnte nicht gespeichert werden.",
    totalSales: "Umsatz",
    returningClients: "Wiederkehrend",
    withPhone: "Mit Telefon",
    emptyAction: "Ersten Kunden hinzufügen",
    quickHintTitle: "Kundendatenbank immer griffbereit",
    quickHintText: "Speichere Telefon, Telegram und Notizen, um Folgebuchungen schneller zu erstellen."
  }
};

function isAppLanguage(value: string | null): value is AppLanguage {
  return isProLanguage(value);
}

function getLocale(language: AppLanguage): AppLocale {
  return localeBySiteLanguage[language];
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
    return parts[0]?.[0]?.toUpperCase() ?? "К";
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
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

function getClientStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    return storage && typeof storage.getItem === "function" ? storage : null;
  } catch {
    return null;
  }
}

export default function ClientsView({
  professionalId,
  accountCountry,
  accountCurrency,
  businessName,
  canManageStaff,
  onboardingCta,
  initialClients,
  header
}: ClientsViewProps) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [uiLanguage, setUiLanguage] = useState<AppLanguage>("ru");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [phoneCountry, setPhoneCountry] = useState(accountCountry || "Ukraine");
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);
  const [isRefreshingClients, setIsRefreshingClients] = useState(false);
  const [statusText, setStatusText] = useState("");
  const phoneRule = getPhoneRule(phoneCountry || accountCountry || "Ukraine");
  const t = (CLIENTS_TEXT as unknown as Record<string, typeof CLIENTS_TEXT.en>)[uiLanguage] ?? CLIENTS_TEXT.en;
  const syncLabel = t.saving;
  const locale = getLocale(uiLanguage);
  const prefixMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedLanguage = getClientStorage()?.getItem("rezervo-pro-language") ?? null;
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

  useEffect(() => {
    setPhoneCountry((current) => current || accountCountry || "Ukraine");
  }, [accountCountry]);

  useEffect(() => {
    if (!isPrefixOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (prefixMenuRef.current && !prefixMenuRef.current.contains(event.target as Node)) {
        setIsPrefixOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isPrefixOpen]);

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

  const filteredPhoneCountries = useMemo(() => {
    const normalizedQuery = prefixSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return phoneCountries;
    }

    return phoneCountries.filter((country) => {
      const rule = getPhoneRule(country);
      return country.toLowerCase().includes(normalizedQuery) || rule.prefix.toLowerCase().includes(normalizedQuery);
    });
  }, [prefixSearch]);
  const clientsTotalSales = useMemo(
    () => clients.reduce((sum, client) => sum + client.totalSales, 0),
    [clients]
  );
  const returningClientsCount = useMemo(
    () => clients.filter((client) => client.visitsCount > 1).length,
    [clients]
  );
  const clientsWithPhoneCount = useMemo(
    () => clients.filter((client) => Boolean(client.phone)).length,
    [clients]
  );

  function openCreateModal() {
    setForm(emptyForm);
    setPhoneCountry(accountCountry || "Ukraine");
    setIsPrefixOpen(false);
    setPrefixSearch("");
    setActiveTab("profile");
    setStatusText("");
    setModalOpen(true);
  }

  function openEditModal(client: ClientListItem) {
    const phoneState = getPhoneEditingState(client.phone, accountCountry || "Ukraine");

    setForm({
      clientId: client.id.startsWith("derived_") ? null : client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: phoneState.localPhone,
      telegram: client.telegram,
      notes: client.notes,
      notificationsTelegram: client.notificationsTelegram,
      marketingTelegram: client.marketingTelegram
    });
    setPhoneCountry(phoneState.country);
    setIsPrefixOpen(false);
    setPrefixSearch("");
    setActiveTab("profile");
    setStatusText("");
    setModalOpen(true);
  }

  async function refreshClients() {
    setIsRefreshingClients(true);

    try {
      const response = await fetch("/api/pro/clients");
      const payload = await response.json();
      setClients(payload.clients ?? []);
    } finally {
      setIsRefreshingClients(false);
    }
  }

  async function handleSave() {
    if (form.phone.trim() && !isPhoneValid(phoneCountry, form.phone)) {
      setStatusText(getPhoneValidationMessage(phoneCountry));
      return;
    }

    setSaving(true);
    setStatusText("");
    const payloadForm = {
      ...form,
      phone: buildInternationalPhone(phoneCountry, form.phone)
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

  async function handleDelete() {
    if (!form.clientId || deletingClient || saving) {
      return;
    }

    if (!window.confirm(t.deleteConfirm)) {
      return;
    }

    setDeletingClient(true);
    setStatusText("");

    const response = await fetch(`/api/pro/clients?clientId=${encodeURIComponent(form.clientId)}`, {
      method: "DELETE"
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatusText(payload.error || t.deleteError);
      setDeletingClient(false);
      return;
    }

    await refreshClients();
    setDeletingClient(false);
    setModalOpen(false);
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar
        active="clients"
        professionalId={professionalId}
        canManageStaff={canManageStaff}
      />

      <section className={styles.clientsShell}>
        <section className={styles.clientsMain}>
          <ProWorkspaceHeader
            businessName={businessName}
            viewerName={header.viewerName}
            viewerAvatarUrl={header.viewerAvatarUrl}
            viewerInitials={header.viewerInitials}
            isPremium={header.isPremium === true}
            publicBookingUrl={header.publicBookingUrl}
            publicBookingEnabled={header.publicBookingEnabled === true}
            canTogglePublicBooking={canManageStaff}
            onboardingCta={onboardingCta}
          />

          <header className={styles.clientsHeader}>
            <div>
              <div className={styles.clientsTitleRow}>
                <h1 className={styles.clientsTitle}>{t.title}</h1>
                <span className={styles.clientsBadge}>{clients.length}</span>
              </div>
              <p className={styles.clientsSubtitle}>{t.quickHintText}</p>
            </div>

            <div className={styles.clientsActions}>
              {isRefreshingClients ? <span className={styles.clientsSyncPill}>{syncLabel}</span> : null}
              <button type="button" className={styles.clientsPrimaryAddButton} onClick={openCreateModal}>
                + {t.addClient}
              </button>
            </div>
          </header>

          <section className={styles.clientsSummaryGrid} aria-label={t.quickHintTitle}>
            <article>
              <span>{t.totalSales}</span>
              <strong>{formatMoney(clientsTotalSales, locale, accountCurrency)}</strong>
              <small>{t.quickHintTitle}</small>
            </article>
            <article>
              <span>{t.returningClients}</span>
              <strong>{returningClientsCount}</strong>
              <small>{clients.length ? `${Math.round((returningClientsCount / clients.length) * 100)}%` : "0%"}</small>
            </article>
            <article>
              <span>{t.withPhone}</span>
              <strong>{clientsWithPhoneCount}</strong>
              <small>{clients.length ? `${clientsWithPhoneCount}/${clients.length}` : "0"}</small>
            </article>
          </section>

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
              {isRefreshingClients && filteredClients.length === 0 ? (
                <div className={styles.clientsSkeletonList} aria-hidden="true">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className={styles.clientsSkeletonRow}>
                      <span className={styles.mobileSkeletonDot} />
                      <span className={styles.mobileSkeletonLine} />
                      <span className={styles.mobileSkeletonLineShort} />
                    </div>
                  ))}
                </div>
              ) : null}

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

              {filteredClients.length === 0 && !isRefreshingClients ? (
                <div className={styles.clientsEmptyState}>
                  <strong>{t.noClientsTitle}</strong>
                  <span>{t.noClientsHint}</span>
                  <button type="button" className={styles.clientsPrimaryAddButton} onClick={openCreateModal}>
                    + {clients.length ? t.addClient : t.emptyAction}
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
                        <div className={`${styles.phoneRow} ${isPrefixOpen ? styles.phoneRowExpanded : ""}`}>
                          <div className={styles.phonePrefixPicker} ref={prefixMenuRef}>
                            <button
                              type="button"
                              className={`${styles.phonePrefixButton} ${styles.phonePrefixButtonWide} ${isPrefixOpen ? styles.phonePrefixButtonOpen : ""}`}
                              aria-label={t.prefixAria}
                              aria-expanded={isPrefixOpen}
                              onClick={() => setIsPrefixOpen((value) => !value)}
                            >
                              <span>{phoneRule.prefix}</span>
                              <span aria-hidden="true">⌄</span>
                            </button>
                            {isPrefixOpen ? (
                              <div className={`${styles.phonePrefixMenu} ${styles.phonePrefixMenuRich}`}>
                                <div className={styles.phonePrefixSearchWrap}>
                                  <input
                                    type="search"
                                    className={styles.phonePrefixSearch}
                                    placeholder={t.prefixSearch}
                                    value={prefixSearch}
                                    onChange={(event) => setPrefixSearch(event.target.value)}
                                    autoFocus
                                  />
                                </div>
                                <div className={styles.phonePrefixList}>
                                  {filteredPhoneCountries.map((country) => {
                                    const rule = getPhoneRule(country);
                                    const active = phoneCountry === country;
                                    return (
                                      <button
                                        key={country}
                                        type="button"
                                        className={active ? styles.phonePrefixOptionActive : ""}
                                        onClick={() => {
                                          setPhoneCountry(country);
                                          setForm((current) => ({
                                            ...current,
                                            phone: formatPhoneLocal(onlyPhoneDigits(current.phone), rule)
                                          }));
                                          setPrefixSearch("");
                                          setIsPrefixOpen(false);
                                        }}
                                      >
                                        <span>{country}</span>
                                        <strong>{rule.prefix}</strong>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
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
              {form.clientId ? (
                <button type="button" className={styles.dangerTextButton} onClick={() => void handleDelete()} disabled={saving || deletingClient}>
                  {deletingClient ? t.deleting : t.deleteClient}
                </button>
              ) : (
                <button type="button" className={styles.calendarSecondaryAction} onClick={() => setModalOpen(false)}>
                  {t.close}
                </button>
              )}
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

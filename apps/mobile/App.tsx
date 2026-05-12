import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Localization from "expo-localization";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type AppLanguage = "uk" | "ru" | "en";
type AuthMode = "login" | "register";
type AppTab = "calendar" | "services" | "clients" | "telegram" | "settings";

type MobileSession = {
  token: string;
  professionalId: string;
  email: string;
  displayName: string;
};

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
};

type ServiceRecord = {
  id: string;
  name: string;
  price: number;
  category?: string;
  durationMinutes?: number;
  color?: string;
};

type AppointmentRecord = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  kind: "appointment" | "blocked";
  customerName: string;
  customerPhone: string;
  serviceName: string;
  attendance: "pending" | "confirmed" | "arrived" | "no_show";
  priceAmount: number;
};

type ClientRecord = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  visitsCount: number;
  totalSales: number;
};

type WorkspaceSnapshot = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    language: string;
    currency?: string;
    timezone: string;
    country: string;
  };
  business: {
    id: string;
    name: string;
    address: string;
    publicBookingUrl?: string;
    allowOnlineBooking?: boolean;
    workScheduleMode?: string;
  };
  services: ServiceRecord[];
  telegram?: {
    connected: boolean;
    chatId: string | null;
  };
};

type CalendarSnapshot = {
  appointments: AppointmentRecord[];
  stats: {
    day: { visitsCount: number; revenue: number };
    week: { visitsCount: number; revenue: number };
    month: { visitsCount: number; revenue: number };
  };
  recentActivity: Array<{
    id: string;
    appointmentDate: string;
    startTime: string;
    customerName: string;
    serviceName: string;
  }>;
};

const STORAGE_KEY = "timviz_mobile_session_v2";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");
const WORDMARK = require("./assets/timviz-wordmark.png");
const APP_ICON = require("./assets/timviz-icon.png");

const languageNames: Record<AppLanguage, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
};

const copy = {
  uk: {
    login: "Увійти",
    register: "Створити акаунт",
    email: "Email",
    password: "Пароль",
    firstName: "Ім'я",
    lastName: "Прізвище",
    phone: "Телефон",
    companyName: "Назва бізнесу",
    continue: "Продовжити",
    creating: "Створюємо...",
    signingIn: "Вхід...",
    calendar: "Календар",
    clients: "Клієнти",
    services: "Послуги",
    telegram: "Telegram",
    settings: "Налаштування",
    signOut: "Вийти",
    requiredTitle: "Потрібні дані",
    requiredText: "Заповніть усі поля.",
    loginError: "Помилка входу",
    registerError: "Помилка реєстрації",
    passwordHint: "Мінімум 6 символів",
    proTitle: "Timviz для майстра",
    proSubtitle: "Календар, послуги, клієнти й сповіщення в одному застосунку.",
    dashboard: "Робочий кабінет",
    home: "Головна",
    today: "Сьогодні",
    week: "Тиждень",
    month: "Місяць",
    newVisit: "Новий візит",
    compact: "Стиснутий",
    dayView: "День",
    ready: "Готово",
    reminders: "Сповіщення",
    addVisit: "Додати запис",
    customer: "Клієнт",
    service: "Послуга",
    start: "Початок",
    end: "Кінець",
    save: "Зберегти",
    noAppointments: "На цей день записів поки немає.",
    recent: "Останні записи",
    addService: "Додати послугу",
    price: "Ціна",
    duration: "Хвилини",
    delete: "Видалити",
    addClient: "Додати клієнта",
    connected: "Підключено",
    notConnected: "Не підключено",
    telegramHint: "Підключення Telegram керується через налаштування кабінету. У застосунку видно поточний статус.",
    onlineBooking: "Онлайн-запис",
    address: "Адреса",
    publicPage: "Сторінка запису",
    empty: "Поки порожньо",
  },
  ru: {
    login: "Войти",
    register: "Создать аккаунт",
    email: "Email",
    password: "Пароль",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    companyName: "Название бизнеса",
    continue: "Продолжить",
    creating: "Создаем...",
    signingIn: "Вход...",
    calendar: "Календарь",
    clients: "Клиенты",
    services: "Услуги",
    telegram: "Telegram",
    settings: "Настройки",
    signOut: "Выйти",
    requiredTitle: "Нужны данные",
    requiredText: "Заполните все поля.",
    loginError: "Ошибка входа",
    registerError: "Ошибка регистрации",
    passwordHint: "Минимум 6 символов",
    proTitle: "Timviz для мастера",
    proSubtitle: "Календарь, услуги, клиенты и уведомления в одном приложении.",
    dashboard: "Рабочий кабинет",
    home: "Главная",
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    newVisit: "Новый визит",
    compact: "Сжатый",
    dayView: "День",
    ready: "Готово",
    reminders: "Уведомления",
    addVisit: "Добавить запись",
    customer: "Клиент",
    service: "Услуга",
    start: "Начало",
    end: "Конец",
    save: "Сохранить",
    noAppointments: "На этот день записей пока нет.",
    recent: "Последние записи",
    addService: "Добавить услугу",
    price: "Цена",
    duration: "Минуты",
    delete: "Удалить",
    addClient: "Добавить клиента",
    connected: "Подключено",
    notConnected: "Не подключено",
    telegramHint: "Подключение Telegram управляется через настройки кабинета. В приложении виден текущий статус.",
    onlineBooking: "Онлайн-запись",
    address: "Адрес",
    publicPage: "Страница записи",
    empty: "Пока пусто",
  },
  en: {
    login: "Sign in",
    register: "Create account",
    email: "Email",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    companyName: "Business name",
    continue: "Continue",
    creating: "Creating...",
    signingIn: "Signing in...",
    calendar: "Calendar",
    clients: "Clients",
    services: "Services",
    telegram: "Telegram",
    settings: "Settings",
    signOut: "Sign out",
    requiredTitle: "Missing details",
    requiredText: "Fill in all fields.",
    loginError: "Sign-in error",
    registerError: "Registration error",
    passwordHint: "At least 6 characters",
    proTitle: "Timviz for pros",
    proSubtitle: "Calendar, services, clients and alerts in one app.",
    dashboard: "Workspace",
    home: "Home",
    today: "Today",
    week: "Week",
    month: "Month",
    newVisit: "New visit",
    compact: "Compact",
    dayView: "Day",
    ready: "Done",
    reminders: "Alerts",
    addVisit: "Add booking",
    customer: "Client",
    service: "Service",
    start: "Start",
    end: "End",
    save: "Save",
    noAppointments: "No bookings for this day yet.",
    recent: "Recent bookings",
    addService: "Add service",
    price: "Price",
    duration: "Minutes",
    delete: "Delete",
    addClient: "Add client",
    connected: "Connected",
    notConnected: "Not connected",
    telegramHint: "Telegram connection is managed in workspace settings. The app shows the current status.",
    onlineBooking: "Online booking",
    address: "Address",
    publicPage: "Booking page",
    empty: "Empty for now",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function detectLanguage(): AppLanguage {
  const languageCode = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  if (languageCode === "ru") return "ru";
  if (languageCode === "uk") return "uk";
  return "en";
}

function getDetectedCountry() {
  const regionCode = Localization.getLocales()[0]?.regionCode?.toUpperCase();
  if (regionCode === "UA") return { country: "Ukraine", currency: "UAH", phonePrefix: "+380" };
  if (regionCode === "PL") return { country: "Poland", currency: "PLN", phonePrefix: "+48" };
  if (regionCode === "US") return { country: "United States", currency: "USD", phonePrefix: "+1" };
  if (regionCode === "GB") return { country: "United Kingdom", currency: "GBP", phonePrefix: "+44" };
  return { country: "Ukraine", currency: "UAH", phonePrefix: "+380" };
}

function getDetectedTimezone() {
  return Localization.getCalendars()[0]?.timeZone || "Europe/Kyiv";
}

function normalizeApiSession(result: any, fallbackEmail: string): MobileSession {
  return {
    token: String(result.token || ""),
    professionalId: String(result.professionalId || ""),
    email: String(result.profile?.email || fallbackEmail),
    displayName: String(result.profile?.displayName || result.profile?.email || fallbackEmail),
  };
}

function formatMoney(value: number, currency?: string) {
  const amount = Number.isFinite(value) ? value : 0;
  return `${amount.toLocaleString("uk-UA")} ${currency || "UAH"}`;
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getRoundedTime(step = 10) {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(total / step) * step;
  const hours = Math.floor(rounded / 60) % 24;
  const minutes = rounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map((item) => Number(item));
  const base = Number.isFinite(hours) && Number.isFinite(mins) ? hours * 60 + mins : 9 * 60;
  const total = base + Math.max(0, minutes || 0);
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function timeToMinutes(time: string) {
  const [hours, mins] = time.split(":").map((item) => Number(item));
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return 9 * 60;
  return hours * 60 + mins;
}

function formatDayLabel(date: string, language: AppLanguage) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(parsed)
    .replace(".", "");
}

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());
  const [mode, setMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<MobileSession | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [calendar, setCalendar] = useState<CalendarSnapshot | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>("calendar");
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [loadingSession, setLoadingSession] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visitComposerOpen, setVisitComposerOpen] = useState(false);
  const detectedCountry = useMemo(() => getDetectedCountry(), []);
  const detectedTimezone = useMemo(() => getDetectedTimezone(), []);
  const t = copy[language];

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: detectedCountry.phonePrefix,
    companyName: "",
  });
  const [visitDraft, setVisitDraft] = useState({
    customerName: "",
    customerPhone: "",
    startTime: "09:00",
    serviceId: "",
  });
  const [serviceDraft, setServiceDraft] = useState({ name: "", durationMinutes: "60", price: "0" });
  const [clientDraft, setClientDraft] = useState({ firstName: "", lastName: "", phone: "", email: "" });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        setLoadingSession(false);
        return;
      }
      try {
        setSession(JSON.parse(raw) as MobileSession);
      } catch {
        setSession(null);
      }
      setLoadingSession(false);
    });
  }, []);

  useEffect(() => {
    if (session) {
      refreshAll(session, selectedDate);
    }
  }, [session, selectedDate]);

  async function apiFetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || `HTTP ${response.status}`);
    }
    return result;
  }

  async function refreshAll(currentSession = session, date = selectedDate) {
    if (!currentSession) return;

    setRefreshing(true);
    try {
      const headers = { Authorization: `Bearer ${currentSession.token}` };
      const [workspaceResult, calendarResult, clientsResult] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mobile/pro/workspace/${currentSession.professionalId}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/clients`, { headers }).then((item) => item.json()),
      ]);

      if (workspaceResult?.error) throw new Error(workspaceResult.error);
      if (calendarResult?.error) throw new Error(calendarResult.error);
      if (clientsResult?.error) throw new Error(clientsResult.error);

      setWorkspace(workspaceResult);
      setCalendar(calendarResult);
      setClients(Array.isArray(clientsResult.clients) ? clientsResult.clients : []);
      setVisitDraft((current) => ({
        ...current,
        serviceId: current.serviceId || workspaceResult.services?.[0]?.id || "",
      }));
    } catch (error) {
      Alert.alert("Timviz", error instanceof Error ? error.message : "Failed to load workspace.");
    } finally {
      setRefreshing(false);
    }
  }

  async function persistSession(nextSession: MobileSession) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    await refreshAll(nextSession, selectedDate);
  }

  async function signIn() {
    const email = loginForm.email.trim().toLowerCase();
    if (!email || !loginForm.password.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginForm.password }),
      });
      const result = await response.json();
      if (!response.ok) {
        Alert.alert(t.loginError, result?.error || t.loginError);
        return;
      }
      await persistSession(normalizeApiSession(result, email));
    } catch (error) {
      Alert.alert(t.loginError, error instanceof Error ? error.message : t.loginError);
    } finally {
      setBusy(false);
    }
  }

  async function register() {
    const payload = {
      ...registerForm,
      email: registerForm.email.trim().toLowerCase(),
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      phone: registerForm.phone.trim(),
      companyName: registerForm.companyName.trim(),
      language,
      country: detectedCountry.country,
      currency: detectedCountry.currency,
      timezone: detectedTimezone,
    };

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.password ||
      !payload.phone ||
      !payload.companyName
    ) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        Alert.alert(t.registerError, result?.error || t.registerError);
        return;
      }
      await persistSession(normalizeApiSession(result, payload.email));
    } catch (error) {
      Alert.alert(t.registerError, error instanceof Error ? error.message : t.registerError);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setWorkspace(null);
    setCalendar(null);
    setClients([]);
    setBusy(false);
  }

  async function createVisit() {
    const service = workspace?.services.find((item) => item.id === visitDraft.serviceId) || workspace?.services[0];
    if (!service || !visitDraft.customerName.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          appointmentDate: selectedDate,
          startTime: visitDraft.startTime,
          endTime: addMinutes(visitDraft.startTime, service.durationMinutes || 60),
          customerName: visitDraft.customerName.trim(),
          customerPhone: visitDraft.customerPhone.trim(),
          serviceName: service.name,
          priceAmount: Number(service.price || 0),
          attendance: "confirmed",
        }),
      });
      setVisitDraft({ customerName: "", customerPhone: "", startTime: visitDraft.startTime, serviceId: service.id });
      await refreshAll();
      return true;
    } catch (error) {
      Alert.alert(t.addVisit, error instanceof Error ? error.message : t.addVisit);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createService() {
    if (!serviceDraft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/services", {
        method: "POST",
        body: JSON.stringify({
          name: serviceDraft.name.trim(),
          durationMinutes: Number(serviceDraft.durationMinutes || 60),
          price: Number(serviceDraft.price || 0),
          source: "custom",
        }),
      });
      setServiceDraft({ name: "", durationMinutes: "60", price: "0" });
      await refreshAll();
    } catch (error) {
      Alert.alert(t.addService, error instanceof Error ? error.message : t.addService);
    } finally {
      setBusy(false);
    }
  }

  async function removeService(serviceId: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/mobile/pro/services?serviceId=${encodeURIComponent(serviceId)}`, { method: "DELETE" });
      await refreshAll();
    } catch (error) {
      Alert.alert(t.delete, error instanceof Error ? error.message : t.delete);
    } finally {
      setBusy(false);
    }
  }

  async function createClient() {
    if (!clientDraft.firstName.trim() && !clientDraft.phone.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/clients", {
        method: "POST",
        body: JSON.stringify({
          firstName: clientDraft.firstName.trim(),
          lastName: clientDraft.lastName.trim(),
          phone: clientDraft.phone.trim(),
          email: clientDraft.email.trim(),
          notificationsTelegram: true,
          marketingTelegram: false,
        }),
      });
      setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
      await refreshAll();
    } catch (error) {
      Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
    } finally {
      setBusy(false);
    }
  }

  if (loadingSession) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.appScreen}>
        <WorkspaceHeader
          t={t}
          session={session}
          workspace={workspace}
          activeTab={activeTab}
          onTelegramPress={() => setActiveTab("telegram")}
          onSettingsPress={() => setActiveTab("settings")}
        />

        {activeTab === "calendar" ? (
          <CalendarTab
            t={t}
            language={language}
            workspace={workspace}
            calendar={calendar}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            visitDraft={visitDraft}
            setVisitDraft={setVisitDraft}
            onCreateVisit={createVisit}
            busy={busy}
            refreshing={refreshing}
            onRefresh={() => refreshAll()}
            composerOpen={visitComposerOpen}
            setComposerOpen={setVisitComposerOpen}
          />
        ) : (
          <ScrollView
            style={styles.workspaceScroll}
            contentContainerStyle={styles.workspaceContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refreshAll()} tintColor="#7C3AED" />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.workspaceHero}>
              <Text style={styles.workspaceEyebrow}>{t.dashboard}</Text>
              <Text style={styles.workspaceTitle}>{t[activeTab]}</Text>
              <Text style={styles.workspaceSubtitle}>{workspace?.business.name || session.displayName}</Text>
            </View>

            {activeTab === "services" ? (
              <ServicesTab
                t={t}
                workspace={workspace}
                draft={serviceDraft}
                setDraft={setServiceDraft}
                onCreate={createService}
                onDelete={removeService}
                busy={busy}
              />
            ) : null}
            {activeTab === "clients" ? (
              <ClientsTab
                t={t}
                clients={clients}
                draft={clientDraft}
                setDraft={setClientDraft}
                onCreate={createClient}
                busy={busy}
              />
            ) : null}
            {activeTab === "telegram" ? <TelegramTab t={t} workspace={workspace} /> : null}
            {activeTab === "settings" ? (
              <SettingsTab
                t={t}
                language={language}
                setLanguage={setLanguage}
                workspace={workspace}
                onSignOut={signOut}
                busy={busy}
              />
            ) : null}
          </ScrollView>
        )}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <BrandLogo />
            <LanguageSwitch language={language} setLanguage={setLanguage} />
          </View>

          <View style={styles.authIntro}>
            <Image source={APP_ICON} style={styles.authIcon} />
            <Text style={styles.authTitle}>{t.proTitle}</Text>
            <Text style={styles.authSubtitle}>{t.proSubtitle}</Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.segment}>
              <Pressable onPress={() => setMode("login")} style={[styles.segmentButton, mode === "login" && styles.segmentButtonActive]}>
                <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>{t.login}</Text>
              </Pressable>
              <Pressable onPress={() => setMode("register")} style={[styles.segmentButton, mode === "register" && styles.segmentButtonActive]}>
                <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>{t.register}</Text>
              </Pressable>
            </View>

            {mode === "login" ? (
              <View style={styles.form}>
                <Field
                  label={t.email}
                  value={loginForm.email}
                  onChangeText={(value) => setLoginForm((current) => ({ ...current, email: value }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@email.com"
                />
                <Field
                  label={t.password}
                  value={loginForm.password}
                  onChangeText={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                  secureTextEntry
                />
                <PrimaryButton label={busy ? t.signingIn : t.login} onPress={signIn} disabled={busy} />
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.twoColumns}>
                  <Field label={t.firstName} value={registerForm.firstName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, firstName: value }))} />
                  <Field label={t.lastName} value={registerForm.lastName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, lastName: value }))} />
                </View>
                <Field label={t.email} value={registerForm.email} onChangeText={(value) => setRegisterForm((current) => ({ ...current, email: value }))} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" />
                <Field label={t.password} hint={t.passwordHint} value={registerForm.password} onChangeText={(value) => setRegisterForm((current) => ({ ...current, password: value }))} secureTextEntry />
                <Field label={t.phone} value={registerForm.phone} onChangeText={(value) => setRegisterForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" />
                <Field label={t.companyName} value={registerForm.companyName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, companyName: value }))} />
                <PrimaryButton label={busy ? t.creating : t.continue} onPress={register} disabled={busy} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function CalendarTab({
  t,
  language,
  workspace,
  calendar,
  selectedDate,
  setSelectedDate,
  visitDraft,
  setVisitDraft,
  onCreateVisit,
  busy,
  refreshing,
  onRefresh,
  composerOpen,
  setComposerOpen,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  workspace: WorkspaceSnapshot | null;
  calendar: CalendarSnapshot | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  visitDraft: { customerName: string; customerPhone: string; startTime: string; serviceId: string };
  setVisitDraft: (draft: { customerName: string; customerPhone: string; startTime: string; serviceId: string }) => void;
  onCreateVisit: () => Promise<boolean>;
  busy: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
}) {
  const currency = workspace?.professional.currency;
  const services = workspace?.services || [];
  const currentService = services.find((item) => item.id === visitDraft.serviceId) || services[0];
  const endTime = addMinutes(visitDraft.startTime, currentService?.durationMinutes || 60);

  return (
    <View style={styles.calendarScreen}>
      <View style={styles.calendarToolbar}>
        <Pressable style={styles.dateButton} onPress={() => setSelectedDate(shiftDate(selectedDate, -1))}>
          <Ionicons name="chevron-back" size={18} color="#0F172A" />
        </Pressable>
        <View style={styles.datePill}>
          <Text style={styles.dateText}>{formatDayLabel(selectedDate, language)}</Text>
          <Text style={styles.dateSubText}>09:00 - 18:00</Text>
        </View>
        <Pressable style={styles.dateButton} onPress={() => setSelectedDate(shiftDate(selectedDate, 1))}>
          <Ionicons name="chevron-forward" size={18} color="#0F172A" />
        </Pressable>
        <View style={styles.toolbarSpacer} />
        <Pressable style={styles.modeButton}>
          <Text style={styles.modeButtonText}>{t.compact}</Text>
        </Pressable>
        <Pressable style={styles.modeButton}>
          <Text style={styles.modeButtonText}>{t.dayView}</Text>
          <Ionicons name="chevron-down" size={14} color="#475569" />
        </Pressable>
      </View>

      <View style={styles.masterStrip}>
        <View style={styles.masterAvatar}>
          <Text style={styles.masterAvatarText}>{workspace?.professional.firstName?.slice(0, 1).toUpperCase() || "T"}</Text>
        </View>
        <Text style={styles.masterName}>
          {`${workspace?.professional.firstName || ""} ${workspace?.professional.lastName || ""}`.trim() || "Timviz"}
        </Text>
      </View>

      <ScrollView
        style={styles.calendarScroll}
        contentContainerStyle={styles.calendarContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        showsVerticalScrollIndicator={false}
      >
        <CalendarTimeline appointments={calendar?.appointments || []} currency={currency} />
      </ScrollView>

      <Pressable
        style={styles.fabButton}
        onPress={() => {
          setVisitDraft({ ...visitDraft, startTime: getRoundedTime(10) });
          setComposerOpen(true);
        }}
      >
        <Ionicons name="add" size={34} color="#FFFFFF" />
      </Pressable>

      <Modal transparent visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.visitSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t.newVisit}</Text>
              <Pressable style={styles.sheetClose} onPress={() => setComposerOpen(false)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>
            <Field label={t.customer} value={visitDraft.customerName} onChangeText={(value) => setVisitDraft({ ...visitDraft, customerName: value })} />
            <Field label={t.phone} value={visitDraft.customerPhone} onChangeText={(value) => setVisitDraft({ ...visitDraft, customerPhone: value })} keyboardType="phone-pad" />
            <View style={styles.twoColumns}>
              <Field label={t.start} value={visitDraft.startTime} onChangeText={(value) => setVisitDraft({ ...visitDraft, startTime: value })} />
              <Field label={t.end} value={endTime} editable={false} />
            </View>
            <View style={styles.servicePicker}>
              {services.slice(0, 8).map((service) => (
                <Pressable
                  key={service.id}
                  onPress={() => setVisitDraft({ ...visitDraft, serviceId: service.id })}
                  style={[styles.choiceChip, visitDraft.serviceId === service.id && styles.choiceChipActive]}
                >
                  <Text style={[styles.choiceText, visitDraft.serviceId === service.id && styles.choiceTextActive]}>{service.name}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton
              label={t.addVisit}
              onPress={async () => {
                const saved = await onCreateVisit();
                if (saved) setComposerOpen(false);
              }}
              disabled={busy || !services.length}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CalendarTimeline({ appointments, currency }: { appointments: AppointmentRecord[]; currency?: string }) {
  const { width } = useWindowDimensions();
  const startHour = 5;
  const endHour = 22;
  const hourHeight = 92;
  const timelineHeight = (endHour - startHour + 1) * hourHeight;
  const timeColumnWidth = 43;
  const gridWidth = Math.max(280, width - timeColumnWidth);
  const laneGap = 8;
  const laneWidth = Math.max(132, (gridWidth - laneGap * 3) / 2);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - startHour * 60) / 60) * hourHeight;

  return (
    <View style={[styles.timeline, { height: timelineHeight }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
        const hour = startHour + index;
        return (
          <View key={hour} style={[styles.hourRow, { top: index * hourHeight, height: hourHeight }]}>
            <Text style={styles.hourText}>{String(hour).padStart(2, "0")}:00</Text>
            <View style={styles.hourGrid}>
              <View style={styles.majorLine} />
              {[1, 2, 3, 4, 5].map((part) => (
                <View key={part} style={[styles.minorLine, { top: (hourHeight / 6) * part }]} />
              ))}
            </View>
          </View>
        );
      })}

      <View style={[styles.closedBlock, { top: 0, height: 4 * hourHeight }]} />
      <View style={[styles.closedBlock, { top: 13 * hourHeight, height: 5 * hourHeight }]} />

      {nowTop >= 0 && nowTop <= timelineHeight ? (
        <View style={[styles.currentTimeLine, { top: nowTop }]}>
          <View style={styles.currentTimeDot} />
        </View>
      ) : null}

      {appointments.map((appointment, index) => {
        const start = timeToMinutes(appointment.startTime);
        const end = Math.max(timeToMinutes(appointment.endTime), start + 30);
        const top = ((start - startHour * 60) / 60) * hourHeight;
        const height = Math.max(68, ((end - start) / 60) * hourHeight);
        const isOffset = index % 2 === 1;
        const color = appointment.kind === "blocked" ? "#94A3B8" : index % 3 === 0 ? "#FF9A82" : index % 3 === 1 ? "#FFD166" : "#9ED96B";

        return (
          <View
            key={appointment.id}
            style={[
              styles.appointmentBlock,
              {
                top,
                height,
                left: timeColumnWidth + laneGap + (isOffset ? laneWidth + laneGap : 0),
                width: laneWidth,
                backgroundColor: color,
              },
            ]}
          >
            <Text style={styles.appointmentTime}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
            <Text style={styles.appointmentClient} numberOfLines={2}>
              {appointment.customerName || "Клиент"}
            </Text>
            <Text style={styles.appointmentService} numberOfLines={1}>
              {appointment.serviceName}
            </Text>
            <Text style={styles.appointmentPrice}>{formatMoney(appointment.priceAmount, currency)}</Text>
            <View style={styles.appointmentHandle} />
          </View>
        );
      })}
    </View>
  );
}

function WorkspaceHeader({
  t,
  session,
  workspace,
  activeTab,
  onTelegramPress,
  onSettingsPress,
}: {
  t: Record<string, string>;
  session: MobileSession;
  workspace: WorkspaceSnapshot | null;
  activeTab: AppTab;
  onTelegramPress: () => void;
  onSettingsPress: () => void;
}) {
  const title = activeTab === "calendar" ? "денний календар" : t[activeTab];

  return (
    <View style={styles.nativeHeader}>
      <View style={styles.headerTitleStack}>
        <Text style={styles.nativeHeaderTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.headerBusinessInline} numberOfLines={1}>
          {workspace?.business.name || session.displayName}
        </Text>
      </View>
      <View style={styles.nativeHeaderActions}>
        <AppIconButton icon="rocket" active />
        <AppIconButton icon="cloud-upload-outline" />
        <AppIconButton icon="chatbubble-ellipses-outline" tone="cyan" onPress={onTelegramPress} />
        <AppIconButton icon="notifications-outline" />
        <Pressable style={styles.profilePill} onPress={onSettingsPress}>
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarText}>{session.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Ionicons name="chevron-down" size={12} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );
}

function AppIconButton({
  icon,
  active,
  tone,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  active?: boolean;
  tone?: "cyan";
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.headerIconButton, active && styles.headerIconButtonActive, tone === "cyan" && styles.headerIconButtonCyan]}>
      <Ionicons name={icon} size={20} color={active ? "#FFFFFF" : tone === "cyan" ? "#0891B2" : "#432C75"} />
    </Pressable>
  );
}

function BottomNavigation({
  activeTab,
  setActiveTab,
  t,
}: {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  t: Record<string, string>;
}) {
  const items: Array<{ tab: AppTab; icon: ComponentProps<typeof Ionicons>["name"]; label: string }> = [
    { tab: "calendar", icon: "home-outline", label: t.home },
    { tab: "services", icon: "pricetag-outline", label: t.services },
    { tab: "clients", icon: "id-card-outline", label: t.clients },
    { tab: "telegram", icon: "people-outline", label: t.telegram },
    { tab: "settings", icon: "settings-outline", label: t.settings },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = activeTab === item.tab;
        return (
          <Pressable key={item.tab} onPress={() => setActiveTab(item.tab)} style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}>
            <Ionicons name={item.icon} size={19} color={active ? "#FFFFFF" : "#64748B"} />
            <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ServicesTab({
  t,
  workspace,
  draft,
  setDraft,
  onCreate,
  onDelete,
  busy,
}: {
  t: Record<string, string>;
  workspace: WorkspaceSnapshot | null;
  draft: { name: string; durationMinutes: string; price: string };
  setDraft: (draft: { name: string; durationMinutes: string; price: string }) => void;
  onCreate: () => void;
  onDelete: (serviceId: string) => void;
  busy: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <Panel title={t.addService}>
        <Field label={t.service} value={draft.name} onChangeText={(value) => setDraft({ ...draft, name: value })} />
        <View style={styles.twoColumns}>
          <Field label={t.duration} value={draft.durationMinutes} onChangeText={(value) => setDraft({ ...draft, durationMinutes: value })} keyboardType="number-pad" />
          <Field label={t.price} value={draft.price} onChangeText={(value) => setDraft({ ...draft, price: value })} keyboardType="number-pad" />
        </View>
        <PrimaryButton label={t.addService} onPress={onCreate} disabled={busy} />
      </Panel>

      <Panel title={t.services}>
        {workspace?.services.length ? (
          workspace.services.map((service) => (
            <View key={service.id} style={styles.listItem}>
              <View style={styles.serviceColorRow}>
                <View style={[styles.serviceDot, { backgroundColor: service.color || "#7C3AED" }]} />
                <View>
                  <Text style={styles.listTitle}>{service.name}</Text>
                  <Text style={styles.listCaption}>{service.durationMinutes || 60} хв</Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.moneyText}>{formatMoney(service.price, workspace.professional.currency)}</Text>
                <Pressable style={styles.smallDanger} onPress={() => onDelete(service.id)}>
                  <Text style={styles.smallDangerText}>×</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.empty}</Text>
        )}
      </Panel>
    </View>
  );
}

function ClientsTab({
  t,
  clients,
  draft,
  setDraft,
  onCreate,
  busy,
}: {
  t: Record<string, string>;
  clients: ClientRecord[];
  draft: { firstName: string; lastName: string; phone: string; email: string };
  setDraft: (draft: { firstName: string; lastName: string; phone: string; email: string }) => void;
  onCreate: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <Panel title={t.addClient}>
        <View style={styles.twoColumns}>
          <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => setDraft({ ...draft, firstName: value })} />
          <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => setDraft({ ...draft, lastName: value })} />
        </View>
        <Field label={t.phone} value={draft.phone} onChangeText={(value) => setDraft({ ...draft, phone: value })} keyboardType="phone-pad" />
        <Field label={t.email} value={draft.email} onChangeText={(value) => setDraft({ ...draft, email: value })} keyboardType="email-address" autoCapitalize="none" />
        <PrimaryButton label={t.addClient} onPress={onCreate} disabled={busy} />
      </Panel>

      <Panel title={t.clients}>
        {clients.length ? (
          clients.map((client) => (
            <View key={client.id} style={styles.listItem}>
              <View>
                <Text style={styles.listTitle}>{client.fullName || client.phone}</Text>
                <Text style={styles.listCaption}>{client.phone || client.email}</Text>
              </View>
              <Text style={styles.badgeText}>{client.visitsCount}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.empty}</Text>
        )}
      </Panel>
    </View>
  );
}

function TelegramTab({ t, workspace }: { t: Record<string, string>; workspace: WorkspaceSnapshot | null }) {
  const connected = workspace?.telegram?.connected;
  return (
    <View style={styles.sectionStack}>
      <Panel title="Telegram">
        <View style={styles.telegramStatus}>
          <View style={[styles.telegramDot, connected ? styles.telegramDotConnected : styles.telegramDotMuted]} />
          <View>
            <Text style={styles.listTitle}>{connected ? t.connected : t.notConnected}</Text>
            <Text style={styles.listCaption}>{connected ? workspace?.telegram?.chatId : "Timviz bot"}</Text>
          </View>
        </View>
        <Text style={styles.emptyText}>{t.telegramHint}</Text>
      </Panel>
    </View>
  );
}

function SettingsTab({
  t,
  language,
  setLanguage,
  workspace,
  onSignOut,
  busy,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  workspace: WorkspaceSnapshot | null;
  onSignOut: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <Panel title={t.settings}>
        <LanguageSwitch language={language} setLanguage={setLanguage} />
        <InfoLine label={t.onlineBooking} value={workspace?.business.allowOnlineBooking ? t.connected : t.notConnected} />
        <InfoLine label={t.address} value={workspace?.business.address || t.empty} />
        <InfoLine label={t.publicPage} value={workspace?.business.publicBookingUrl || t.empty} />
        <SecondaryButton label={t.signOut} onPress={onSignOut} disabled={busy} />
      </Panel>
    </View>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Image source={WORDMARK} style={[styles.wordmark, compact && styles.wordmarkCompact]} resizeMode="contain" />;
}

function LanguageSwitch({
  language,
  setLanguage,
}: {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}) {
  return (
    <View style={styles.languageRow}>
      {(["uk", "ru", "en"] as AppLanguage[]).map((item) => (
        <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.languageButton, language === item && styles.languageButtonActive]}>
          <Text style={[styles.languageText, language === item && styles.languageTextActive]}>{languageNames[item]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({
  label,
  hint,
  ...props
}: {
  label: string;
  hint?: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <TextInput {...props} autoCorrect={false} placeholderTextColor="#94A3B8" style={[styles.input, props.editable === false && styles.inputDisabled]} />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryButton, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function StatTile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  authScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboard: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  wordmark: {
    width: 132,
    height: 38,
  },
  wordmarkCompact: {
    width: 118,
    height: 34,
  },
  authIntro: {
    alignItems: "center",
    marginBottom: 18,
  },
  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    marginBottom: 10,
  },
  authTitle: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  authSubtitle: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  languageRow: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
  },
  languageButton: {
    minWidth: 40,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  languageButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  languageText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  languageTextActive: {
    color: "#0F172A",
  },
  authCard: {
    width: "100%",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  segmentButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  segmentButtonActive: {
    backgroundColor: "#0F172A",
  },
  segmentText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  form: {
    gap: 12,
  },
  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldHeader: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  hint: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: "#F8FAFC",
    color: "#475569",
  },
  primaryButton: {
    minHeight: 56,
    marginTop: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.62,
  },
  appScreen: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  nativeHeader: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerTitleStack: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  nativeHeaderTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
  },
  headerBusinessInline: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  nativeHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FFFFFF",
  },
  headerIconButtonActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#7047EE",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerIconButtonCyan: {
    borderColor: "#BAE6FD",
    backgroundColor: "#ECFEFF",
  },
  profilePill: {
    height: 34,
    minWidth: 52,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  smallAvatar: {
    width: 25,
    height: 25,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A7A72",
  },
  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  calendarScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  calendarToolbar: {
    minHeight: 54,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  toolbarSpacer: {
    flex: 1,
  },
  modeButton: {
    minWidth: 62,
    height: 38,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  modeButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  masterStrip: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  masterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A7A72",
  },
  masterAvatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  masterName: {
    marginTop: 5,
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
  },
  calendarScroll: {
    flex: 1,
  },
  calendarContent: {
    paddingBottom: 96,
  },
  timeline: {
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  hourRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  hourText: {
    width: 43,
    paddingTop: 2,
    paddingRight: 5,
    textAlign: "right",
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  hourGrid: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
  },
  majorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "#DDE4EE",
  },
  minorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEF2F7",
  },
  closedBlock: {
    position: "absolute",
    left: 44,
    right: 0,
    backgroundColor: "#F8FAFC",
    opacity: 0.88,
  },
  currentTimeLine: {
    position: "absolute",
    left: 43,
    right: 0,
    height: 2,
    backgroundColor: "#F43F5E",
  },
  currentTimeDot: {
    position: "absolute",
    left: -5,
    top: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F43F5E",
    backgroundColor: "#FFFFFF",
  },
  appointmentBlock: {
    position: "absolute",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  appointmentTime: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  appointmentClient: {
    marginTop: 3,
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
  },
  appointmentService: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  appointmentPrice: {
    display: "none",
  },
  appointmentHandle: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
  },
  fabButton: {
    position: "absolute",
    right: 24,
    bottom: 88,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7047EE",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  visitSheet: {
    gap: 12,
    padding: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },
  sheetClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  bottomNav: {
    position: "absolute",
    left: 5,
    right: 5,
    bottom: 2,
    minHeight: 56,
    paddingHorizontal: 3,
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 7 : 4,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
  bottomNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 8,
  },
  bottomNavItemActive: {
    backgroundColor: "#241642",
  },
  bottomNavText: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "900",
  },
  bottomNavTextActive: {
    color: "#FFFFFF",
  },
  appHeader: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  workspaceScroll: {
    flex: 1,
  },
  workspaceContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 34,
  },
  workspaceHero: {
    marginBottom: 14,
  },
  workspaceEyebrow: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  workspaceTitle: {
    marginTop: 6,
    color: "#0F172A",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  workspaceSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  tabButton: {
    paddingHorizontal: 14,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: {
    borderColor: "#0F172A",
    backgroundColor: "#0F172A",
  },
  tabText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  sectionStack: {
    gap: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  dateButtonText: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
  },
  datePill: {
    minWidth: 126,
    height: 43,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  dateText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  dateSubText: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statTile: {
    flex: 1,
    minHeight: 82,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  statValue: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  statCaption: {
    marginTop: 2,
    color: "#334155",
    fontSize: 12,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  panelTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  panelBody: {
    gap: 10,
    marginTop: 12,
  },
  servicePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  choiceChipActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#F3E8FF",
  },
  choiceText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#5B21B6",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  listItemCompact: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  listTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  listText: {
    marginTop: 2,
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  listCaption: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  moneyText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  serviceColorRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  smallDangerText: {
    color: "#DC2626",
    fontSize: 20,
    fontWeight: "900",
  },
  badgeText: {
    minWidth: 34,
    textAlign: "center",
    color: "#5B21B6",
    fontSize: 14,
    fontWeight: "900",
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  telegramStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  telegramDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  telegramDotConnected: {
    backgroundColor: "#22C55E",
  },
  telegramDotMuted: {
    backgroundColor: "#CBD5E1",
  },
  infoLine: {
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  infoValue: {
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
});

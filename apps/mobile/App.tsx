import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type AppLanguage = "uk" | "ru" | "en";
type AuthMode = "login" | "register";

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

const STORAGE_KEY = "timviz_mobile_session_v1";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");

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
    signedIn: "Кабінет",
    today: "Сьогодні",
    calendar: "Календар",
    clients: "Клієнти",
    services: "Послуги",
    settings: "Налаштування",
    signOut: "Вийти",
    requiredTitle: "Потрібні дані",
    requiredText: "Заповніть усі поля.",
    loginError: "Помилка входу",
    registerError: "Помилка реєстрації",
    passwordHint: "Мінімум 6 символів",
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
    signedIn: "Кабинет",
    today: "Сегодня",
    calendar: "Календарь",
    clients: "Клиенты",
    services: "Услуги",
    settings: "Настройки",
    signOut: "Выйти",
    requiredTitle: "Нужны данные",
    requiredText: "Заполните все поля.",
    loginError: "Ошибка входа",
    registerError: "Ошибка регистрации",
    passwordHint: "Минимум 6 символов",
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
    signedIn: "Workspace",
    today: "Today",
    calendar: "Calendar",
    clients: "Clients",
    services: "Services",
    settings: "Settings",
    signOut: "Sign out",
    requiredTitle: "Missing details",
    requiredText: "Fill in all fields.",
    loginError: "Sign-in error",
    registerError: "Registration error",
    passwordHint: "At least 6 characters",
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

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());
  const [mode, setMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [busy, setBusy] = useState(false);
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

  async function persistSession(nextSession: MobileSession) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
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
    setBusy(false);
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
        <View style={styles.appHeader}>
          <BrandLogo compact />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{session.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.workspaceHeader}>
          <Text style={styles.workspaceEyebrow}>{t.signedIn}</Text>
          <Text style={styles.workspaceTitle}>{session.displayName}</Text>
        </View>
        <View style={styles.statsGrid}>
          <DashboardTile label={t.today} value="0" />
          <DashboardTile label={t.calendar} value="0" />
          <DashboardTile label={t.clients} value="0" />
          <DashboardTile label={t.services} value="0" />
        </View>
        <Pressable onPress={signOut} style={styles.logoutButton} disabled={busy}>
          <Text style={styles.logoutText}>{t.signOut}</Text>
        </Pressable>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <BrandLogo />
            <View style={styles.languageRow}>
              {(["uk", "ru", "en"] as AppLanguage[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setLanguage(item)}
                  style={[styles.languageButton, language === item && styles.languageButtonActive]}
                >
                  <Text style={[styles.languageText, language === item && styles.languageTextActive]}>
                    {languageNames[item]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.authCard}>
            <View style={styles.segment}>
              <Pressable
                onPress={() => setMode("login")}
                style={[styles.segmentButton, mode === "login" && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>
                  {t.login}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("register")}
                style={[styles.segmentButton, mode === "register" && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>
                  {t.register}
                </Text>
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
                  <Field
                    label={t.firstName}
                    value={registerForm.firstName}
                    onChangeText={(value) =>
                      setRegisterForm((current) => ({ ...current, firstName: value }))
                    }
                  />
                  <Field
                    label={t.lastName}
                    value={registerForm.lastName}
                    onChangeText={(value) =>
                      setRegisterForm((current) => ({ ...current, lastName: value }))
                    }
                  />
                </View>
                <Field
                  label={t.email}
                  value={registerForm.email}
                  onChangeText={(value) => setRegisterForm((current) => ({ ...current, email: value }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field
                  label={t.password}
                  hint={t.passwordHint}
                  value={registerForm.password}
                  onChangeText={(value) => setRegisterForm((current) => ({ ...current, password: value }))}
                  secureTextEntry
                />
                <Field
                  label={t.phone}
                  value={registerForm.phone}
                  onChangeText={(value) => setRegisterForm((current) => ({ ...current, phone: value }))}
                  keyboardType="phone-pad"
                />
                <Field
                  label={t.companyName}
                  value={registerForm.companyName}
                  onChangeText={(value) =>
                    setRegisterForm((current) => ({ ...current, companyName: value }))
                  }
                />
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

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <Text style={[styles.brandTim, compact && styles.brandCompact]}>Tim</Text>
      <Text style={[styles.brandViz, compact && styles.brandCompact]}>viz</Text>
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
      <TextInput
        {...props}
        autoCorrect={false}
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function DashboardTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dashboardTile}>
      <Text style={styles.dashboardValue}>{value}</Text>
      <Text style={styles.dashboardLabel}>{label}</Text>
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTim: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0,
  },
  brandViz: {
    fontSize: 30,
    fontWeight: "900",
    color: "#7C3AED",
    letterSpacing: 0,
  },
  brandCompact: {
    fontSize: 28,
  },
  languageRow: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
  },
  languageButton: {
    minWidth: 42,
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
  primaryButton: {
    height: 56,
    marginTop: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.62,
  },
  appScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    backgroundColor: "#F8FAFC",
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  workspaceHeader: {
    marginTop: 28,
    marginBottom: 16,
  },
  workspaceEyebrow: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  workspaceTitle: {
    marginTop: 8,
    color: "#0F172A",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dashboardTile: {
    width: "48%",
    minHeight: 94,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  dashboardValue: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
  },
  dashboardLabel: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  logoutButton: {
    height: 48,
    marginTop: "auto",
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  logoutText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
});

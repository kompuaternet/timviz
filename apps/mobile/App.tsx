import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import { WebView } from "react-native-webview";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  initiateFirebaseMobileRegistrationConversion,
  setFirebaseMobileUser,
  trackFirebaseMobileEvent,
  type MobileAnalyticsPayload
} from "./src/lib/mobileAnalytics";

WebBrowser.maybeCompleteAuthSession();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type BaseAppLanguage = "uk" | "ru" | "en";
type AppLanguage = BaseAppLanguage | "fr" | "pl" | "cs" | "es" | "de";
type AuthMode = "login" | "register";
type AppTab = "calendar" | "services" | "clients" | "staff" | "settings";
type ServiceTabMode = "mine" | "custom" | "catalog";
type CalendarViewMode = "day" | "threeDays" | "week" | "month";
type LocalizedText = Partial<Record<AppLanguage, string>>;

type MobileSession = {
  token: string;
  professionalId: string;
  email: string;
  displayName: string;
  language?: AppLanguage;
  isNewRegistration?: boolean;
};

type MobileAdsEventName =
  | "mobile_app_open"
  | "mobile_sign_up_complete"
  | "mobile_login_complete"
  | "mobile_social_auth_complete"
  | "mobile_service_added"
  | "mobile_appointment_created"
  | "mobile_checkout_start"
  | "mobile_purchase_complete"
  | "support_message_sent"
  | "premium_gate_view";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
};

type PhoneCountryOption = {
  iso: string;
  country: string;
  callingCode: string;
  currency: string;
};

type VisitServiceDraft = {
  id: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  priceAmount: number;
  durationMinutes: number;
};

type VisitDraft = {
  customerName: string;
  customerPhone: string;
  startTime: string;
  serviceId: string;
  appointmentDate: string;
  notes: string;
  targetProfessionalId?: string;
  selectedClientId?: string;
  items: VisitServiceDraft[];
};

type BlockedTimeDraft = {
  date: string;
  startTime: string;
  endTime: string;
  targetProfessionalId?: string;
  label: string;
  title: string;
  appointment?: AppointmentRecord;
};

type ServiceRecord = {
  id: string;
  name: string;
  localizedName?: LocalizedText;
  price: number;
  category?: string;
  localizedCategory?: LocalizedText;
  durationMinutes?: number;
  color?: string;
  source?: "catalog" | "custom";
};

type ServiceTemplateRecord = {
  name: string;
  localizedName?: LocalizedText;
  durationMinutes?: number;
  price?: number;
};

type ServiceCatalogCategory = {
  key: string;
  title: string;
  localizedTitle?: LocalizedText;
  topSuggestions?: ServiceTemplateRecord[];
  popularServices?: ServiceTemplateRecord[];
};

type CatalogServiceOption = ServiceTemplateRecord & {
  category: string;
  localizedLabel: string;
  localizationKey: string;
};

type CatalogGroupOption = {
  category: ServiceCatalogCategory;
  services: CatalogServiceOption[];
};

type PendingServiceSave = {
  key: string;
  keys: string[];
  optimisticService: ServiceRecord;
  payload: {
    name: string;
    localizedName?: LocalizedText;
    category: string;
    durationMinutes: number;
    price: number;
    color: string;
    source: "catalog" | "custom";
  };
  attempts: number;
};

type ServiceUpdatePayload = {
  name: string;
  localizedName?: LocalizedText;
  category: string;
  durationMinutes: number;
  price: number;
  color: string;
};

type AppointmentRecord = {
  id: string;
  professionalId?: string;
  professionalName?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  kind: "appointment" | "blocked";
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes?: string;
  attendance: "pending" | "confirmed" | "arrived" | "no_show";
  priceAmount: number;
};

type WorkBreakRecord = {
  startTime: string;
  endTime: string;
};

type WorkIntervalRecord = {
  startTime: string;
  endTime: string;
};

type WorkDayScheduleRecord = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervals?: WorkIntervalRecord[];
  breakStart?: string;
  breakEnd?: string;
  breaks?: WorkBreakRecord[];
  dayType?: "workday" | "day-off" | "holiday";
};

type WorkScheduleRecord = Record<string, WorkDayScheduleRecord>;

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

type ClientDraftState = {
  clientId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

type WorkspaceSnapshot = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    email: string;
    phone: string;
    language: string;
    currency?: string;
    timezone: string;
    country: string;
    bookingCreditsTotal?: number;
    plan?: "free" | "premium";
    premiumStatus?: "inactive" | "trialing" | "active" | "past_due" | "canceled";
    premiumUntil?: string;
  };
  business: {
    id: string;
    name: string;
    website?: string;
    categories?: string[];
    accountType?: "solo" | "team";
    serviceMode?: string;
    address: string;
    addressDetails?: string;
    addressLat?: number | null;
    addressLon?: number | null;
    publicBookingUrl?: string;
    allowOnlineBooking?: boolean;
    workScheduleMode?: string;
    photos?: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
      createdAt: string;
      caption?: string;
      status?: "active" | "blocked";
    }>;
  };
  membership?: {
    scope: "owner" | "member" | "pending";
    role: string;
  };
  memberSchedule?: {
    workScheduleMode?: string;
    workSchedule?: WorkScheduleRecord;
    customSchedule?: Record<string, WorkDayScheduleRecord>;
  };
  services: ServiceRecord[];
  telegram?: {
    connected: boolean;
    chatId: string | null;
  };
  bookingCredits?: {
    total: number;
    used: number;
    remaining: number;
  };
};

type BusinessPhotoRecord = NonNullable<WorkspaceSnapshot["business"]["photos"]>[number];

type StaffMemberRecord = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    language?: string;
    accountStatus?: "active" | "placeholder";
    createdAt?: string;
    avatarUrl?: string | null;
  };
  membership: {
    id?: string;
    role: string;
    scope: "owner" | "member";
    createdAt?: string;
    workScheduleMode: "fixed" | "flexible";
    workSchedule: WorkScheduleRecord;
    customSchedule?: Record<string, WorkDayScheduleRecord>;
  };
  source?: "owner" | "join_request" | "email_invitation" | "member";
  workspaceAccess?: "owner" | "active" | "invited" | "offline";
  pendingInvitation?: {
    id: string;
    email: string;
    createdAt: string;
  } | null;
  services?: string[];
  stats?: {
    totalBookings?: number;
    monthBookings?: number;
    upcomingBookings?: number;
    completedBookings?: number;
    revenue?: number;
  };
};

type StaffSnapshot = {
  business: {
    id: string;
    name: string;
    categories?: string[];
    accountType?: "solo" | "team";
    currency?: string;
  };
  summary?: {
    totalPeople?: number;
    activeEmployees?: number;
    pendingRequests?: number;
    pendingInvitations?: number;
    monthBookings?: number;
    monthRevenue?: number;
  };
  services?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  myMemberships?: Array<{
    business: {
      id: string;
      name: string;
      address?: string;
    };
    membership: {
      id: string;
      role: string;
      scope: "owner" | "member";
      createdAt: string;
    };
  }>;
  members: StaffMemberRecord[];
  joinRequests?: Array<{
    id: string;
    role: string;
    createdAt: string;
    professional: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    } | null;
  }>;
  invitations?: Array<{
    id: string;
    email: string;
    role: string;
    createdAt: string;
    invitedProfessional?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  incomingInvitations?: Array<{
    id: string;
    email: string;
    role: string;
    createdAt: string;
    business: {
      id: string;
      name: string;
      address?: string;
    };
    invitedBy?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
};

type MobileWorkspaceCache = {
  professionalId: string;
  selectedDate: string;
  updatedAt: number;
  workspace: WorkspaceSnapshot | null;
  calendar: CalendarSnapshot | null;
  clients: ClientRecord[];
  serviceCatalog: ServiceCatalogCategory[];
  staffSnapshot: StaffSnapshot | null;
};

type ServiceDraftState = {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  color: string;
};

function parseServiceNumberInput(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type CalendarSnapshot = {
  appointments: AppointmentRecord[];
  teamMembers?: CalendarTeamMemberRecord[];
  viewedProfessionalId?: string;
  memberCalendars?: CalendarMemberDaySnapshotRecord[];
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

type CalendarTeamMemberRecord = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  scope: "owner" | "member";
  isViewer?: boolean;
};

type CalendarMemberDaySnapshotRecord = {
  professionalId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  scope: "owner" | "member";
  isViewer?: boolean;
  memberSchedule?: WorkspaceSnapshot["memberSchedule"];
  appointments: AppointmentRecord[];
};

type CalendarMemberView = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  scope: "owner" | "member";
  isViewer?: boolean;
  memberSchedule?: WorkspaceSnapshot["memberSchedule"];
};

type MobileNotificationRecord = {
  id: string;
  bookingId?: string;
  appointmentId?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  professionalId?: string;
  professionalName?: string;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled";
};

type MobileAppNotificationRecord = {
  id: string;
  type: "online_booking" | "team_invitation" | "team_join_request" | "admin_message";
  title: string;
  body: string;
  actionUrl?: string;
  payload?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
};

type MobileNotificationsPayload = {
  pendingOnlineBookings?: MobileNotificationRecord[];
  archivedOnlineBookings?: MobileNotificationRecord[];
  pendingJoinRequests?: Array<{
    id: string;
    createdAt: string;
    role: string;
    professionalId?: string;
    professionalName: string;
    professionalEmail?: string;
    professionalPhone?: string;
  }>;
  appNotifications?: MobileAppNotificationRecord[];
};

type MobileSettingsSection = "general" | "online" | "services" | "schedule" | "push" | "telegram" | "address";
type PremiumFeature = "clients" | "staff" | "online" | "schedule" | "push" | "telegram" | "address";

type SettingsDraftState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  businessName: string;
  website: string;
  accountType: "solo" | "team";
  serviceMode: string;
  categories: string[];
  country: string;
  timezone: string;
  language: AppLanguage;
  currency: string;
  allowOnlineBooking: boolean;
  address: string;
  addressDetails: string;
  addressLat: number | null;
  addressLon: number | null;
};

type AddressSuggestionRecord = {
  label: string;
  details: string;
  street: string;
  house: string;
  city: string;
  region: string;
  country: string;
  postcode: string;
  lat: number;
  lon: number;
};

type TelegramPanelState = {
  deepLink: string;
  tokenExpiresAt: string;
  connected: boolean;
  chatId: string | null;
  settings: {
    notificationsNewBooking: boolean;
    notificationsCabinetBooking: boolean;
    notificationsRescheduled: boolean;
    notificationsCancelled: boolean;
    notificationsReminder: boolean;
    notificationsToday: boolean;
    forwardingEnabled: boolean;
    reminderLeadMinutes: number;
  };
};

type PushPanelState = {
  connected: boolean;
  tokenCount: number;
  settings: {
    notificationsNewBooking: boolean;
    notificationsCabinetBooking: boolean;
    notificationsRescheduled: boolean;
    notificationsCancelled: boolean;
    notificationsReminder: boolean;
    notificationsToday: boolean;
    reminderLeadMinutes: number;
  };
};

type TelegramBooleanSettingKey =
  | "notificationsNewBooking"
  | "notificationsCabinetBooking"
  | "notificationsRescheduled"
  | "notificationsCancelled"
  | "notificationsReminder"
  | "notificationsToday"
  | "forwardingEnabled";

type PushBooleanSettingKey =
  | "notificationsNewBooking"
  | "notificationsCabinetBooking"
  | "notificationsRescheduled"
  | "notificationsCancelled"
  | "notificationsReminder"
  | "notificationsToday";

const PUSH_BOOLEAN_SETTING_KEYS: PushBooleanSettingKey[] = [
  "notificationsNewBooking",
  "notificationsCabinetBooking",
  "notificationsRescheduled",
  "notificationsCancelled",
  "notificationsReminder",
  "notificationsToday",
];

type SupportChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  createdAt?: string;
  status?: "sending" | "failed";
};

type SettingsPatchPayload = {
  professional?: Record<string, unknown>;
  business?: Record<string, unknown>;
  newPassword?: string;
};

const DEFAULT_PUSH_PANEL_SETTINGS: PushPanelState["settings"] = {
  notificationsNewBooking: true,
  notificationsCabinetBooking: false,
  notificationsRescheduled: true,
  notificationsCancelled: true,
  notificationsReminder: false,
  notificationsToday: false,
  reminderLeadMinutes: 120,
};

const STORAGE_KEY = "timviz_mobile_session_v2";
const APP_LANGUAGE_KEY = "timviz_mobile_language_v1";
const SECURE_SESSION_KEY = "timviz_mobile_secure_session_v1";
const BIOMETRIC_ENABLED_KEY = "timviz_mobile_biometric_enabled_v1";
const PUSH_AUTO_REGISTER_KEY_PREFIX = "timviz_mobile_push_auto_register_v1:";
const SUPPORT_TICKET_KEY_PREFIX = "timviz_mobile_support_ticket_v1:";
const PUSH_PROJECT_ID_ERROR = "push_project_id_missing";
const WORKSPACE_CACHE_KEY = "timviz_mobile_workspace_cache_v2";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");
const MOBILE_PLATFORM_SOURCE = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "mobile";
const MOBILE_ANDROID_PACKAGE_NAME =
  ((Constants.expoConfig as { android?: { package?: string } } | null)?.android?.package || "com.timviz.master").trim();
const APPLE_STANDARD_EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

function getMobileStoreSource() {
  if (Platform.OS === "android") return "google_play";
  if (Platform.OS === "ios") return "app_store";
  return "mobile_store";
}

function getMobileSubscriptionManageUrl(productId?: string | null) {
  if (Platform.OS === "android") {
    const params = [`package=${encodeURIComponent(MOBILE_ANDROID_PACKAGE_NAME)}`];
    if (productId) params.unshift(`sku=${encodeURIComponent(productId)}`);
    return `https://play.google.com/store/account/subscriptions?${params.join("&")}`;
  }
  return "https://apps.apple.com/account/subscriptions";
}

function legalPageUrl(path: string) {
  return `${API_BASE_URL}${path}?source=${MOBILE_PLATFORM_SOURCE}`;
}

const LEGAL_URLS = {
  support: legalPageUrl("/support"),
  privacy: legalPageUrl("/privacy"),
  terms: Platform.OS === "ios" ? APPLE_STANDARD_EULA_URL : legalPageUrl("/terms"),
  subscriptionTerms: legalPageUrl("/subscription-terms"),
  refundPolicy: legalPageUrl("/refund-policy"),
  accountDeletion: legalPageUrl("/account-deletion"),
};

function openLegalUrl(url: string) {
  return Linking.openURL(url).catch(() => undefined);
}

const WORDMARK = require("./assets/timviz-wordmark.png");
const DEFAULT_SERVICE_CATEGORY = "Без категории";
const SERVICE_COLORS = ["#9AD86A", "#8ED1F2", "#FF9A84", "#F7C948", "#A78BFA", "#34D399", "#F472B6", "#60A5FA"];
const SYSTEM_SERVICE_CATEGORIES = [
  "Ногти",
  "Волосы и стрижки",
  "Барбер и мужские стрижки",
  "Брови и ресницы",
  "Массаж",
  "Косметология",
  "Лицо",
  "Депиляция",
  "Тело",
  "Макияж",
  "Перманентный макияж",
  "Тату",
  "Обучение",
  "Ремонт",
  "Другое",
];
const SERVICE_CATEGORY_SORT_ORDER: Record<string, number> = {
  "Ногти": 10,
  "Волосы и стрижки": 20,
  "Барбер и мужские стрижки": 25,
  "Брови и ресницы": 30,
  "Массаж": 40,
  "Косметология": 50,
  "Лицо": 60,
  "Депиляция": 70,
  "Тело": 80,
  "Макияж": 90,
  "Перманентный макияж": 100,
  "Тату": 110,
  "Обучение": 120,
  "Ремонт": 130,
  "Другое": 900,
  [DEFAULT_SERVICE_CATEGORY]: 999,
};
const SERVICE_CATALOG_CATEGORY_SORT_ORDER = new Map(
  ([
    ["Ногти", 10],
    ["Нігті", 10],
    ["Nails", 10],
    ["Волосы и стрижки", 20],
    ["Волосся та стрижки", 20],
    ["Hair & Haircuts", 20],
    ["Волосы", 20],
    ["Волосся", 20],
    ["Hair", 20],
    ["Парикмахерская", 20],
    ["Барбер и мужские стрижки", 25],
    ["Барбер і чоловічі стрижки", 25],
    ["Barber & Men's Haircuts", 25],
    ["Парикмахер", 25],
    ["Брови и ресницы", 30],
    ["Брови та вії", 30],
    ["Brows & Lashes", 30],
    ["Brows and lashes", 30],
    ["Массаж", 40],
    ["Масаж", 40],
    ["Massage", 40],
    ["Массажный салон", 40],
    ["Косметология", 50],
    ["Косметологія", 50],
    ["Cosmetology", 50],
    ["Медспа", 50],
    ["Салон красоты", 50],
    ["Обличчя", 60],
    ["Лицо", 60],
    ["Face Care", 60],
    ["Face", 60],
    ["Депіляція", 70],
    ["Депиляция", 70],
    ["Hair Removal", 70],
    ["Салон депиляции", 70],
    ["Тіло", 80],
    ["Тело", 80],
    ["Body / SPA", 80],
    ["Body", 80],
    ["Спа-салон и сауна", 80],
    ["Студия загара", 80],
    ["Макіяж", 90],
    ["Макияж", 90],
    ["Makeup", 90],
    ["Перманент", 100],
    ["Перманентный макияж", 100],
    ["Permanent Makeup", 100],
    ["Тату / Перманент", 100],
    ["Тату", 110],
    ["Tattoo", 110],
    ["Тату и пирсинг", 110],
    ["Навчання", 120],
    ["Обучение", 120],
    ["Education", 120],
    ["Ремонт", 130],
    ["Repair", 130],
    ["Інше", 900],
    ["Другое", 900],
    ["Другая", 900],
    ["Other", 900],
    ["Без категорії", 999],
    ["Без категории", 999],
    ["No Category", 999],
    ["No category", 999],
    ["Uncategorized", 999],
  ] as Array<[string, number]>).map(([category, order]) => [category.trim().toLocaleLowerCase(), order] as const)
);
const QUICK_DURATION_OPTIONS = [30, 45, 60, 90];
const APP_ICON = require("./assets/timviz-icon.png");
const SETTINGS_SECTIONS: MobileSettingsSection[] = ["general", "online", "services", "schedule", "push", "telegram", "address"];
const PREMIUM_LOCKED_TABS: AppTab[] = [];
const PREMIUM_LOCKED_SETTINGS_SECTIONS: MobileSettingsSection[] = ["online", "schedule", "push", "telegram"];
const COUNTRY_OPTIONS = ["Ukraine", "Russia", "Poland", "United Kingdom", "United States", "Germany", "France", "Spain", "Italy", "International"];
const TIMEZONE_OPTIONS = ["Europe/Kiev", "Europe/Warsaw", "Europe/Berlin", "Europe/London", "America/New_York", "Europe/Moscow", "Asia/Dubai", "UTC"];
const TIMEZONE_LABELS: Record<string, string> = {
  "Europe/Kiev": "UTC+2 · Kyiv",
  "Europe/Warsaw": "UTC+1 · Warsaw",
  "Europe/Berlin": "UTC+1 · Berlin",
  "Europe/London": "UTC+0 · London",
  "America/New_York": "UTC-5 · New York",
  "Europe/Moscow": "UTC+3 · Moscow",
  "Asia/Dubai": "UTC+4 · Dubai",
  UTC: "UTC+0 · UTC",
};
const CURRENCY_OPTIONS = ["UAH", "EUR", "USD", "PLN", "GBP", "KZT", "GEL", "AED", "CAD"];
const REVENUECAT_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "premium";
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
const REVENUECAT_MONTHLY_PRODUCT_ID = process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID || "timviz_premium_monthly";
const REVENUECAT_YEARLY_PRODUCT_ID = process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID || "timviz_premium_yearly";
const PREMIUM_PRODUCT_IDS = [REVENUECAT_MONTHLY_PRODUCT_ID, REVENUECAT_YEARLY_PRODUCT_ID].filter(Boolean);
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const EXPO_PUBLIC_EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  Constants.easConfig?.projectId ||
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
  "";
const PHONE_COUNTRIES: PhoneCountryOption[] = [
  { iso: "AF", country: "Afghanistan", callingCode: "+93", currency: "AFN" },
  { iso: "AL", country: "Albania", callingCode: "+355", currency: "ALL" },
  { iso: "DZ", country: "Algeria", callingCode: "+213", currency: "DZD" },
  { iso: "AS", country: "American Samoa", callingCode: "+1", currency: "USD" },
  { iso: "AD", country: "Andorra", callingCode: "+376", currency: "EUR" },
  { iso: "AO", country: "Angola", callingCode: "+244", currency: "AOA" },
  { iso: "AI", country: "Anguilla", callingCode: "+1", currency: "XCD" },
  { iso: "AG", country: "Antigua and Barbuda", callingCode: "+1", currency: "XCD" },
  { iso: "AR", country: "Argentina", callingCode: "+54", currency: "ARS" },
  { iso: "AM", country: "Armenia", callingCode: "+374", currency: "AMD" },
  { iso: "AW", country: "Aruba", callingCode: "+297", currency: "AWG" },
  { iso: "AU", country: "Australia", callingCode: "+61", currency: "AUD" },
  { iso: "AT", country: "Austria", callingCode: "+43", currency: "EUR" },
  { iso: "AZ", country: "Azerbaijan", callingCode: "+994", currency: "AZN" },
  { iso: "BS", country: "Bahamas", callingCode: "+1", currency: "BSD" },
  { iso: "BH", country: "Bahrain", callingCode: "+973", currency: "BHD" },
  { iso: "BD", country: "Bangladesh", callingCode: "+880", currency: "BDT" },
  { iso: "BB", country: "Barbados", callingCode: "+1", currency: "BBD" },
  { iso: "BY", country: "Belarus", callingCode: "+375", currency: "BYN" },
  { iso: "BE", country: "Belgium", callingCode: "+32", currency: "EUR" },
  { iso: "BZ", country: "Belize", callingCode: "+501", currency: "BZD" },
  { iso: "BJ", country: "Benin", callingCode: "+229", currency: "XOF" },
  { iso: "BM", country: "Bermuda", callingCode: "+1", currency: "BMD" },
  { iso: "BT", country: "Bhutan", callingCode: "+975", currency: "BTN" },
  { iso: "BO", country: "Bolivia", callingCode: "+591", currency: "BOB" },
  { iso: "BA", country: "Bosnia and Herzegovina", callingCode: "+387", currency: "BAM" },
  { iso: "BW", country: "Botswana", callingCode: "+267", currency: "BWP" },
  { iso: "BR", country: "Brazil", callingCode: "+55", currency: "BRL" },
  { iso: "IO", country: "British Indian Ocean Territory", callingCode: "+246", currency: "USD" },
  { iso: "VG", country: "British Virgin Islands", callingCode: "+1", currency: "USD" },
  { iso: "BN", country: "Brunei", callingCode: "+673", currency: "BND" },
  { iso: "BG", country: "Bulgaria", callingCode: "+359", currency: "BGN" },
  { iso: "BF", country: "Burkina Faso", callingCode: "+226", currency: "XOF" },
  { iso: "BI", country: "Burundi", callingCode: "+257", currency: "BIF" },
  { iso: "KH", country: "Cambodia", callingCode: "+855", currency: "KHR" },
  { iso: "CM", country: "Cameroon", callingCode: "+237", currency: "XAF" },
  { iso: "CA", country: "Canada", callingCode: "+1", currency: "CAD" },
  { iso: "CV", country: "Cape Verde", callingCode: "+238", currency: "CVE" },
  { iso: "KY", country: "Cayman Islands", callingCode: "+1", currency: "KYD" },
  { iso: "CF", country: "Central African Republic", callingCode: "+236", currency: "XAF" },
  { iso: "TD", country: "Chad", callingCode: "+235", currency: "XAF" },
  { iso: "CL", country: "Chile", callingCode: "+56", currency: "CLP" },
  { iso: "CN", country: "China", callingCode: "+86", currency: "CNY" },
  { iso: "CX", country: "Christmas Island", callingCode: "+61", currency: "AUD" },
  { iso: "CC", country: "Cocos Islands", callingCode: "+61", currency: "AUD" },
  { iso: "CO", country: "Colombia", callingCode: "+57", currency: "COP" },
  { iso: "KM", country: "Comoros", callingCode: "+269", currency: "KMF" },
  { iso: "CG", country: "Congo", callingCode: "+242", currency: "XAF" },
  { iso: "CD", country: "Congo (DRC)", callingCode: "+243", currency: "CDF" },
  { iso: "CK", country: "Cook Islands", callingCode: "+682", currency: "NZD" },
  { iso: "CR", country: "Costa Rica", callingCode: "+506", currency: "CRC" },
  { iso: "CI", country: "Cote d'Ivoire", callingCode: "+225", currency: "XOF" },
  { iso: "HR", country: "Croatia", callingCode: "+385", currency: "EUR" },
  { iso: "CU", country: "Cuba", callingCode: "+53", currency: "CUP" },
  { iso: "CW", country: "Curacao", callingCode: "+599", currency: "ANG" },
  { iso: "CY", country: "Cyprus", callingCode: "+357", currency: "EUR" },
  { iso: "CZ", country: "Czechia", callingCode: "+420", currency: "CZK" },
  { iso: "DK", country: "Denmark", callingCode: "+45", currency: "DKK" },
  { iso: "DJ", country: "Djibouti", callingCode: "+253", currency: "DJF" },
  { iso: "DM", country: "Dominica", callingCode: "+1", currency: "XCD" },
  { iso: "DO", country: "Dominican Republic", callingCode: "+1", currency: "DOP" },
  { iso: "EC", country: "Ecuador", callingCode: "+593", currency: "USD" },
  { iso: "EG", country: "Egypt", callingCode: "+20", currency: "EGP" },
  { iso: "SV", country: "El Salvador", callingCode: "+503", currency: "USD" },
  { iso: "GQ", country: "Equatorial Guinea", callingCode: "+240", currency: "XAF" },
  { iso: "ER", country: "Eritrea", callingCode: "+291", currency: "ERN" },
  { iso: "EE", country: "Estonia", callingCode: "+372", currency: "EUR" },
  { iso: "SZ", country: "Eswatini", callingCode: "+268", currency: "SZL" },
  { iso: "ET", country: "Ethiopia", callingCode: "+251", currency: "ETB" },
  { iso: "FK", country: "Falkland Islands", callingCode: "+500", currency: "FKP" },
  { iso: "FO", country: "Faroe Islands", callingCode: "+298", currency: "DKK" },
  { iso: "FJ", country: "Fiji", callingCode: "+679", currency: "FJD" },
  { iso: "FI", country: "Finland", callingCode: "+358", currency: "EUR" },
  { iso: "FR", country: "France", callingCode: "+33", currency: "EUR" },
  { iso: "GF", country: "French Guiana", callingCode: "+594", currency: "EUR" },
  { iso: "PF", country: "French Polynesia", callingCode: "+689", currency: "XPF" },
  { iso: "GA", country: "Gabon", callingCode: "+241", currency: "XAF" },
  { iso: "GM", country: "Gambia", callingCode: "+220", currency: "GMD" },
  { iso: "GE", country: "Georgia", callingCode: "+995", currency: "GEL" },
  { iso: "DE", country: "Germany", callingCode: "+49", currency: "EUR" },
  { iso: "GH", country: "Ghana", callingCode: "+233", currency: "GHS" },
  { iso: "GI", country: "Gibraltar", callingCode: "+350", currency: "GIP" },
  { iso: "GR", country: "Greece", callingCode: "+30", currency: "EUR" },
  { iso: "GL", country: "Greenland", callingCode: "+299", currency: "DKK" },
  { iso: "GD", country: "Grenada", callingCode: "+1", currency: "XCD" },
  { iso: "GP", country: "Guadeloupe", callingCode: "+590", currency: "EUR" },
  { iso: "GU", country: "Guam", callingCode: "+1", currency: "USD" },
  { iso: "GT", country: "Guatemala", callingCode: "+502", currency: "GTQ" },
  { iso: "GG", country: "Guernsey", callingCode: "+44", currency: "GBP" },
  { iso: "GN", country: "Guinea", callingCode: "+224", currency: "GNF" },
  { iso: "GW", country: "Guinea-Bissau", callingCode: "+245", currency: "XOF" },
  { iso: "GY", country: "Guyana", callingCode: "+592", currency: "GYD" },
  { iso: "HT", country: "Haiti", callingCode: "+509", currency: "HTG" },
  { iso: "HN", country: "Honduras", callingCode: "+504", currency: "HNL" },
  { iso: "HK", country: "Hong Kong", callingCode: "+852", currency: "HKD" },
  { iso: "HU", country: "Hungary", callingCode: "+36", currency: "HUF" },
  { iso: "IS", country: "Iceland", callingCode: "+354", currency: "ISK" },
  { iso: "IN", country: "India", callingCode: "+91", currency: "INR" },
  { iso: "ID", country: "Indonesia", callingCode: "+62", currency: "IDR" },
  { iso: "IR", country: "Iran", callingCode: "+98", currency: "IRR" },
  { iso: "IQ", country: "Iraq", callingCode: "+964", currency: "IQD" },
  { iso: "IE", country: "Ireland", callingCode: "+353", currency: "EUR" },
  { iso: "IM", country: "Isle of Man", callingCode: "+44", currency: "GBP" },
  { iso: "IL", country: "Israel", callingCode: "+972", currency: "ILS" },
  { iso: "IT", country: "Italy", callingCode: "+39", currency: "EUR" },
  { iso: "JM", country: "Jamaica", callingCode: "+1", currency: "JMD" },
  { iso: "JP", country: "Japan", callingCode: "+81", currency: "JPY" },
  { iso: "JE", country: "Jersey", callingCode: "+44", currency: "GBP" },
  { iso: "JO", country: "Jordan", callingCode: "+962", currency: "JOD" },
  { iso: "KZ", country: "Kazakhstan", callingCode: "+7", currency: "KZT" },
  { iso: "KE", country: "Kenya", callingCode: "+254", currency: "KES" },
  { iso: "KI", country: "Kiribati", callingCode: "+686", currency: "AUD" },
  { iso: "XK", country: "Kosovo", callingCode: "+383", currency: "EUR" },
  { iso: "KW", country: "Kuwait", callingCode: "+965", currency: "KWD" },
  { iso: "KG", country: "Kyrgyzstan", callingCode: "+996", currency: "KGS" },
  { iso: "LA", country: "Laos", callingCode: "+856", currency: "LAK" },
  { iso: "LV", country: "Latvia", callingCode: "+371", currency: "EUR" },
  { iso: "LB", country: "Lebanon", callingCode: "+961", currency: "LBP" },
  { iso: "LS", country: "Lesotho", callingCode: "+266", currency: "LSL" },
  { iso: "LR", country: "Liberia", callingCode: "+231", currency: "LRD" },
  { iso: "LY", country: "Libya", callingCode: "+218", currency: "LYD" },
  { iso: "LI", country: "Liechtenstein", callingCode: "+423", currency: "CHF" },
  { iso: "LT", country: "Lithuania", callingCode: "+370", currency: "EUR" },
  { iso: "LU", country: "Luxembourg", callingCode: "+352", currency: "EUR" },
  { iso: "MO", country: "Macau", callingCode: "+853", currency: "MOP" },
  { iso: "MG", country: "Madagascar", callingCode: "+261", currency: "MGA" },
  { iso: "MW", country: "Malawi", callingCode: "+265", currency: "MWK" },
  { iso: "MY", country: "Malaysia", callingCode: "+60", currency: "MYR" },
  { iso: "MV", country: "Maldives", callingCode: "+960", currency: "MVR" },
  { iso: "ML", country: "Mali", callingCode: "+223", currency: "XOF" },
  { iso: "MT", country: "Malta", callingCode: "+356", currency: "EUR" },
  { iso: "MH", country: "Marshall Islands", callingCode: "+692", currency: "USD" },
  { iso: "MQ", country: "Martinique", callingCode: "+596", currency: "EUR" },
  { iso: "MR", country: "Mauritania", callingCode: "+222", currency: "MRU" },
  { iso: "MU", country: "Mauritius", callingCode: "+230", currency: "MUR" },
  { iso: "YT", country: "Mayotte", callingCode: "+262", currency: "EUR" },
  { iso: "MX", country: "Mexico", callingCode: "+52", currency: "MXN" },
  { iso: "FM", country: "Micronesia", callingCode: "+691", currency: "USD" },
  { iso: "MD", country: "Moldova", callingCode: "+373", currency: "MDL" },
  { iso: "MC", country: "Monaco", callingCode: "+377", currency: "EUR" },
  { iso: "MN", country: "Mongolia", callingCode: "+976", currency: "MNT" },
  { iso: "ME", country: "Montenegro", callingCode: "+382", currency: "EUR" },
  { iso: "MS", country: "Montserrat", callingCode: "+1", currency: "XCD" },
  { iso: "MA", country: "Morocco", callingCode: "+212", currency: "MAD" },
  { iso: "MZ", country: "Mozambique", callingCode: "+258", currency: "MZN" },
  { iso: "MM", country: "Myanmar", callingCode: "+95", currency: "MMK" },
  { iso: "NA", country: "Namibia", callingCode: "+264", currency: "NAD" },
  { iso: "NR", country: "Nauru", callingCode: "+674", currency: "AUD" },
  { iso: "NP", country: "Nepal", callingCode: "+977", currency: "NPR" },
  { iso: "NL", country: "Netherlands", callingCode: "+31", currency: "EUR" },
  { iso: "NC", country: "New Caledonia", callingCode: "+687", currency: "XPF" },
  { iso: "NZ", country: "New Zealand", callingCode: "+64", currency: "NZD" },
  { iso: "NI", country: "Nicaragua", callingCode: "+505", currency: "NIO" },
  { iso: "NE", country: "Niger", callingCode: "+227", currency: "XOF" },
  { iso: "NG", country: "Nigeria", callingCode: "+234", currency: "NGN" },
  { iso: "NU", country: "Niue", callingCode: "+683", currency: "NZD" },
  { iso: "NF", country: "Norfolk Island", callingCode: "+672", currency: "AUD" },
  { iso: "KP", country: "North Korea", callingCode: "+850", currency: "KPW" },
  { iso: "MK", country: "North Macedonia", callingCode: "+389", currency: "MKD" },
  { iso: "MP", country: "Northern Mariana Islands", callingCode: "+1", currency: "USD" },
  { iso: "NO", country: "Norway", callingCode: "+47", currency: "NOK" },
  { iso: "OM", country: "Oman", callingCode: "+968", currency: "OMR" },
  { iso: "PK", country: "Pakistan", callingCode: "+92", currency: "PKR" },
  { iso: "PW", country: "Palau", callingCode: "+680", currency: "USD" },
  { iso: "PS", country: "Palestine", callingCode: "+970", currency: "ILS" },
  { iso: "PA", country: "Panama", callingCode: "+507", currency: "PAB" },
  { iso: "PG", country: "Papua New Guinea", callingCode: "+675", currency: "PGK" },
  { iso: "PY", country: "Paraguay", callingCode: "+595", currency: "PYG" },
  { iso: "PE", country: "Peru", callingCode: "+51", currency: "PEN" },
  { iso: "PH", country: "Philippines", callingCode: "+63", currency: "PHP" },
  { iso: "PN", country: "Pitcairn Islands", callingCode: "+64", currency: "NZD" },
  { iso: "PL", country: "Poland", callingCode: "+48", currency: "PLN" },
  { iso: "PT", country: "Portugal", callingCode: "+351", currency: "EUR" },
  { iso: "PR", country: "Puerto Rico", callingCode: "+1", currency: "USD" },
  { iso: "QA", country: "Qatar", callingCode: "+974", currency: "QAR" },
  { iso: "RE", country: "Reunion", callingCode: "+262", currency: "EUR" },
  { iso: "RO", country: "Romania", callingCode: "+40", currency: "RON" },
  { iso: "RU", country: "Russia", callingCode: "+7", currency: "RUB" },
  { iso: "RW", country: "Rwanda", callingCode: "+250", currency: "RWF" },
  { iso: "BL", country: "Saint Barthelemy", callingCode: "+590", currency: "EUR" },
  { iso: "SH", country: "Saint Helena", callingCode: "+290", currency: "SHP" },
  { iso: "KN", country: "Saint Kitts and Nevis", callingCode: "+1", currency: "XCD" },
  { iso: "LC", country: "Saint Lucia", callingCode: "+1", currency: "XCD" },
  { iso: "MF", country: "Saint Martin", callingCode: "+590", currency: "EUR" },
  { iso: "PM", country: "Saint Pierre and Miquelon", callingCode: "+508", currency: "EUR" },
  { iso: "VC", country: "Saint Vincent and the Grenadines", callingCode: "+1", currency: "XCD" },
  { iso: "WS", country: "Samoa", callingCode: "+685", currency: "WST" },
  { iso: "SM", country: "San Marino", callingCode: "+378", currency: "EUR" },
  { iso: "ST", country: "Sao Tome and Principe", callingCode: "+239", currency: "STN" },
  { iso: "SA", country: "Saudi Arabia", callingCode: "+966", currency: "SAR" },
  { iso: "SN", country: "Senegal", callingCode: "+221", currency: "XOF" },
  { iso: "RS", country: "Serbia", callingCode: "+381", currency: "RSD" },
  { iso: "SC", country: "Seychelles", callingCode: "+248", currency: "SCR" },
  { iso: "SL", country: "Sierra Leone", callingCode: "+232", currency: "SLL" },
  { iso: "SG", country: "Singapore", callingCode: "+65", currency: "SGD" },
  { iso: "SX", country: "Sint Maarten", callingCode: "+1", currency: "ANG" },
  { iso: "SK", country: "Slovakia", callingCode: "+421", currency: "EUR" },
  { iso: "SI", country: "Slovenia", callingCode: "+386", currency: "EUR" },
  { iso: "SB", country: "Solomon Islands", callingCode: "+677", currency: "SBD" },
  { iso: "SO", country: "Somalia", callingCode: "+252", currency: "SOS" },
  { iso: "ZA", country: "South Africa", callingCode: "+27", currency: "ZAR" },
  { iso: "KR", country: "South Korea", callingCode: "+82", currency: "KRW" },
  { iso: "SS", country: "South Sudan", callingCode: "+211", currency: "SSP" },
  { iso: "ES", country: "Spain", callingCode: "+34", currency: "EUR" },
  { iso: "LK", country: "Sri Lanka", callingCode: "+94", currency: "LKR" },
  { iso: "SD", country: "Sudan", callingCode: "+249", currency: "SDG" },
  { iso: "SR", country: "Suriname", callingCode: "+597", currency: "SRD" },
  { iso: "SJ", country: "Svalbard and Jan Mayen", callingCode: "+47", currency: "NOK" },
  { iso: "SE", country: "Sweden", callingCode: "+46", currency: "SEK" },
  { iso: "CH", country: "Switzerland", callingCode: "+41", currency: "CHF" },
  { iso: "SY", country: "Syria", callingCode: "+963", currency: "SYP" },
  { iso: "TW", country: "Taiwan", callingCode: "+886", currency: "TWD" },
  { iso: "TJ", country: "Tajikistan", callingCode: "+992", currency: "TJS" },
  { iso: "TZ", country: "Tanzania", callingCode: "+255", currency: "TZS" },
  { iso: "TH", country: "Thailand", callingCode: "+66", currency: "THB" },
  { iso: "TL", country: "Timor-Leste", callingCode: "+670", currency: "USD" },
  { iso: "TG", country: "Togo", callingCode: "+228", currency: "XOF" },
  { iso: "TK", country: "Tokelau", callingCode: "+690", currency: "NZD" },
  { iso: "TO", country: "Tonga", callingCode: "+676", currency: "TOP" },
  { iso: "TT", country: "Trinidad and Tobago", callingCode: "+1", currency: "TTD" },
  { iso: "TN", country: "Tunisia", callingCode: "+216", currency: "TND" },
  { iso: "TR", country: "Turkey", callingCode: "+90", currency: "TRY" },
  { iso: "TM", country: "Turkmenistan", callingCode: "+993", currency: "TMT" },
  { iso: "TC", country: "Turks and Caicos Islands", callingCode: "+1", currency: "USD" },
  { iso: "TV", country: "Tuvalu", callingCode: "+688", currency: "AUD" },
  { iso: "UG", country: "Uganda", callingCode: "+256", currency: "UGX" },
  { iso: "UA", country: "Ukraine", callingCode: "+380", currency: "UAH" },
  { iso: "AE", country: "United Arab Emirates", callingCode: "+971", currency: "AED" },
  { iso: "GB", country: "United Kingdom", callingCode: "+44", currency: "GBP" },
  { iso: "US", country: "United States", callingCode: "+1", currency: "USD" },
  { iso: "UY", country: "Uruguay", callingCode: "+598", currency: "UYU" },
  { iso: "VI", country: "U.S. Virgin Islands", callingCode: "+1", currency: "USD" },
  { iso: "UZ", country: "Uzbekistan", callingCode: "+998", currency: "UZS" },
  { iso: "VU", country: "Vanuatu", callingCode: "+678", currency: "VUV" },
  { iso: "VA", country: "Vatican City", callingCode: "+39", currency: "EUR" },
  { iso: "VE", country: "Venezuela", callingCode: "+58", currency: "VES" },
  { iso: "VN", country: "Vietnam", callingCode: "+84", currency: "VND" },
  { iso: "WF", country: "Wallis and Futuna", callingCode: "+681", currency: "XPF" },
  { iso: "EH", country: "Western Sahara", callingCode: "+212", currency: "MAD" },
  { iso: "YE", country: "Yemen", callingCode: "+967", currency: "YER" },
  { iso: "ZM", country: "Zambia", callingCode: "+260", currency: "ZMW" },
  { iso: "ZW", country: "Zimbabwe", callingCode: "+263", currency: "ZWL" },
];
const TELEGRAM_REMINDER_LEAD_OPTIONS = [15, 30, 60, 120, 180, 1440];
const CALENDAR_MEMORY_TTL_MS = 30_000;
const CALENDAR_BACKGROUND_SYNC_MS = 12_000;
const CALENDAR_WARM_CHUNK_SIZE = 90;
const CALENDAR_MEMBER_META_TTL_MS = 10 * 60 * 1000;
const CALENDAR_TIME_AXIS_WIDTH = 52;
const CALENDAR_MIN_MEMBER_COLUMN_WIDTH = 220;
const CALENDAR_TEAM_HEADER_HEIGHT = 58;
const CALENDAR_TEAM_HEADER_AVATAR_SIZE = 34;
const SERVICE_MODE_IDS = ["onsite", "travel", "online"] as const;
const SERVICE_MODE_VALUES: Record<(typeof SERVICE_MODE_IDS)[number], string> = {
  onsite: "Клиенты приходят в мое физическое заведение",
  travel: "Я работаю с выездом к клиенту",
  online: "Я предоставляю услуги онлайн",
};
const SUPPORTED_APP_LANGUAGES = ["uk", "ru", "en", "fr", "pl", "cs", "es", "de"] as const satisfies readonly AppLanguage[];
const languageNames: Record<AppLanguage, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
  fr: "FR",
  pl: "PL",
  cs: "CZ",
  es: "ES",
  de: "DE",
};
const languageDisplayNames: Record<AppLanguage, string> = {
  uk: "Українська",
  ru: "Русский",
  en: "English",
  fr: "Français",
  pl: "Polski",
  cs: "Čeština",
  es: "Español",
  de: "Deutsch",
};

function getCalendarMemberDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
}, fallback: string) {
  return [input.firstName, input.lastName].map((item) => safeText(item)).filter(Boolean).join(" ") ||
    safeText(input.email) ||
    fallback;
}

function getMasterFallback(language: AppLanguage) {
  if (language === "uk") return "Майстер";
  if (language === "ru") return "Мастер";
  return "Master";
}

function isGenericCalendarMemberName(name: string, role?: string | null) {
  const normalized = safeText(name).trim().toLowerCase();
  const normalizedRole = safeText(role).trim().toLowerCase();
  return !normalized ||
    normalized === normalizedRole ||
    normalized === "майстер" ||
    normalized === "мастер" ||
    normalized === "master" ||
    normalized === "сотрудник" ||
    normalized === "співробітник" ||
    normalized === "employee";
}

function mergeCalendarMemberView(previous: CalendarMemberView | undefined, incoming: CalendarMemberView, fallback: string): CalendarMemberView {
  const previousName = safeText(previous?.name).trim();
  const incomingName = safeText(incoming.name).trim();
  const incomingGeneric = isGenericCalendarMemberName(incomingName, incoming.role);
  const previousGeneric = isGenericCalendarMemberName(previousName, previous?.role);
  const name = incomingName && (!incomingGeneric || !previousName || previousGeneric)
    ? incomingName
    : previousName || incomingName || fallback;

  return {
    ...previous,
    ...incoming,
    name,
    avatarUrl: safeText(incoming.avatarUrl) || previous?.avatarUrl || null,
    role: safeText(incoming.role) || previous?.role || fallback,
    memberSchedule: incoming.memberSchedule || previous?.memberSchedule,
  };
}

function resolveCalendarMemberAvatarUrl(member: CalendarMemberView, workspace: WorkspaceSnapshot | null) {
  const ownAvatar = safeText(member.avatarUrl).trim();
  if (ownAvatar) return ownAvatar;
  if (workspace?.professional.id && member.id === workspace.professional.id) {
    return safeText(workspace.professional.avatarUrl).trim();
  }
  return "";
}

function mergeStaffSnapshotMedia(current: StaffSnapshot | null, incoming: StaffSnapshot | null): StaffSnapshot | null {
  if (!incoming) return current;
  if (!current?.members?.length) return incoming;
  const currentMembers = new Map(current.members.map((member) => [member.professional.id, member]));
  return {
    ...incoming,
    members: incoming.members.map((member) => {
      const previous = currentMembers.get(member.professional.id);
      if (!previous) return member;
      return {
        ...member,
        professional: {
          ...member.professional,
          firstName: safeText(member.professional.firstName) || previous.professional.firstName,
          lastName: safeText(member.professional.lastName) || previous.professional.lastName,
          email: safeText(member.professional.email) || previous.professional.email,
          avatarUrl: safeText(member.professional.avatarUrl) || previous.professional.avatarUrl || null,
        },
      };
    }),
  };
}

const baseCopy = {
  uk: {
    login: "Увійти",
    register: "Створити акаунт",
    registerShort: "Створити",
    newMasterCta: "Новий майстер? Створити акаунт",
    registerMasterCta: "Створити акаунт майстра",
    optionalDetails: "Додатково",
    email: "Email",
    password: "Пароль",
    forgotPassword: "Забули пароль?",
    forgotPasswordTitle: "Відновлення пароля",
    forgotPasswordText: "Введіть email, і ми надішлемо посилання для створення нового пароля.",
    forgotPasswordSubmit: "Надіслати посилання",
    forgotPasswordSending: "Надсилаємо...",
    forgotPasswordSentTitle: "Перевірте пошту",
    forgotPasswordSentText: "Якщо акаунт з таким email існує, ми надіслали посилання для відновлення пароля.",
    forgotPasswordEmailRequired: "Введіть email для відновлення.",
    forgotPasswordFailed: "Не вдалося надіслати лист. Спробуйте ще раз.",
    firstName: "Ім'я",
    lastName: "Прізвище",
    phone: "Телефон",
    phoneCountry: "Країна",
    selectCountryCode: "Код країни",
    searchCountryOrCode: "Країна або код",
    customPhonePrefix: "Свій код",
    customPhonePrefixHint: "Якщо потрібен нестандартний префікс",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Вибрати код",
    allCountries: "Усі країни",
    companyName: "Назва бізнесу",
    continue: "Продовжити",
    creating: "Створюємо...",
    signingIn: "Вхід...",
    calendar: "Календар",
    clients: "Клієнти",
    services: "Послуги",
    staff: "Команда",
    settings: "Налаштування",
    moreTab: "Ще",
    signOut: "Вийти",
    requiredTitle: "Потрібні дані",
    requiredText: "Заповніть усі поля.",
    registerFirstNameRequired: "Введіть ім'я.",
    registerEmailRequired: "Введіть email.",
    registerEmailInvalid: "Введіть коректний email.",
    registerPasswordRequired: "Введіть пароль.",
    registerPasswordTooShort: "Пароль має містити щонайменше 6 символів.",
    registerPhoneRequired: "Введіть телефон.",
    registerCompanyRequired: "Введіть назву бізнесу.",
    loginError: "Помилка входу",
    registerError: "Помилка реєстрації",
    passwordHint: "Мінімум 6 символів",
    captchaTitle: "Перевірка безпеки",
    captchaText: "Підтвердіть, що акаунт створює реальний майстер. Це займає кілька секунд.",
    captchaCancel: "Закрити",
    captchaOpenBrowser: "Відкрити перевірку в браузері",
    captchaBrowserHint: "Якщо перевірка не з'явилась, відкрийте її в браузері. Після проходження ми повернемо вас у застосунок.",
    captchaCanceled: "Перевірку скасовано. Пройдіть її, щоб створити акаунт.",
    captchaFailed: "Не вдалося пройти перевірку. Спробуйте ще раз.",
    continueWithGoogle: "Продовжити з Google",
    continueWithApple: "Продовжити з Apple",
    socialAuthDivider: "або",
    socialAuthConfigMissing: "Потрібно налаштувати ключі входу.",
    socialAuthFailed: "Не вдалося виконати вхід.",
    enableBiometricTitle: "Увімкнути Face ID?",
    enableBiometricText: "Наступного разу ви зможете швидко відкрити Timviz через Face ID або код пристрою.",
    enableBiometricAction: "Увімкнути",
    notNow: "Не зараз",
    unlockWithFaceId: "Увійти через Face ID",
    unlockWithBiometrics: "Швидкий вхід",
    useDevicePasscode: "Код пристрою",
    biometricUnavailable: "Face ID або Touch ID недоступні на цьому пристрої.",
    proTitle: "Timviz для майстра",
    proSubtitle: "Календар, послуги, клієнти й сповіщення в одному застосунку.",
    dashboard: "Робочий кабінет",
    home: "Головна",
    today: "Сьогодні",
    week: "Тиждень",
    month: "Місяць",
    newVisit: "Новий візит",
    editVisit: "Редагувати запис",
    bookTime: "Забронювати час",
    addBlockedTime: "Додати неробочий час",
    reservedTime: "Заброньований час",
    unavailableTime: "Неробочий час",
    chooseClient: "Обрати клієнта",
    withoutClient: "Без клієнта",
    quickBookingWithoutClient: "Швидкий запис без клієнта",
    chooseClientLater: "Можна обрати клієнта пізніше",
    chooseService: "Обрати послугу",
    comment: "Коментар",
    addAnotherService: "Додати ще послугу +",
    total: "Разом",
    payable: "До сплати",
    saveVisit: "Зберегти запис",
    visitTab: "Візит",
    search: "Пошук",
    searchService: "Назва послуги",
    serviceSearchEmpty: "Послугу не знайдено.",
    clientNameOrPhone: "Ім'я або телефон",
    addNewClient: "Додати нового клієнта",
    addAndSelectClient: "Додати й обрати",
    createClientFromSearch: "Створити клієнта",
    noClientFound: "Клієнта не знайдено. Можна створити нового.",
    newClientFormTitle: "Новий клієнт",
    newClientFormHint: "Додайте дані, і клієнт одразу буде обраний для візиту.",
    formOpened: "Форма відкрита нижче",
    clientName: "Ім'я клієнта",
    withoutService: "Без послуги",
    setupAssistant: "Помічник налаштування",
    setupAssistantText: "Пройдіть кроки, щоб профіль був готовий до онлайн-запису.",
    setupCompleteTitle: "Профіль готовий до онлайн-запису",
    setupCompleteText: "Клієнти вже можуть записуватися через ваше посилання.",
    setupProgress: "Готовність",
    setupServices: "Додайте послуги",
    setupSchedule: "Налаштуйте графік",
    setupBooking: "Увімкніть онлайн-запис",
    setupPhoto: "Додайте фото бізнесу",
    setupAddress: "Додайте адресу",
    setupTelegram: "Підключіть Telegram",
    staffSchedule: "Графік змін",
    staffScheduleHint: "Керуйте робочими днями співробітників так само, як у кабінеті на сайті.",
    teamMembers: "Учасники",
    teamMembersHint: "Додавайте співробітників, редагуйте контакти, роль і доступ до кабінету.",
    allTeam: "Вся команда",
    showWholeTeam: "Показати всю команду",
    selectedMasters: "Вибрані майстри",
    addMember: "Запросити",
    editMember: "Редагувати співробітника",
    saveMember: "Зберегти співробітника",
    fullName: "Ім'я та прізвище",
    role: "Роль",
    workspaceAccess: "Доступ",
    invite: "Запросити",
    resendInvite: "Надіслати ще раз",
    revokeInvite: "Скасувати запрошення",
    sendInvite: "Вкажіть email. Інші дані співробітник заповнить після прийняття.",
    pendingInvites: "Надіслані запрошення",
    incomingInvites: "Отримані запрошення",
    noIncomingInvites: "Вас поки ніхто не запросив.",
    noInvites: "Ви поки нікого не запросили.",
    removeMember: "Видалити з команди",
    removeMemberConfirm: "Видалити співробітника з команди? Його акаунт залишиться самостійним.",
    removeMemberSuccess: "Співробітника видалено з команди.",
    memberCompanyEyebrow: "Моя команда",
    memberCompanyTitle: "Ви в групі",
    memberCompanyRole: "Роль",
    memberCompanyJoined: "Приєдналися",
    leaveCompany: "Вийти з компанії",
    leaveCompanyConfirm: "Вийти з цієї компанії? Доступ до робочого кабінету буде закрито.",
    leaveCompanySuccess: "Ви вийшли з компанії.",
    acceptInvite: "Прийняти",
    declineInvite: "Відхилити",
    monthBookings: "Записів за місяць",
    upcomingBookings: "Майбутні записи",
    scheduleMenu: "Графік",
    currentWeek: "На цьому тижні",
    previousWeek: "Попередній тиждень",
    nextWeek: "Наступний тиждень",
    chooseWeek: "Обрати тиждень",
    repeatingSchedule: "Повторюваний графік",
    oneWeekSchedule: "Тиждень календаря",
    applyToWeekdays: "Застосувати до всіх буднів",
    clearWeek: "Очистити тиждень",
    noWork: "Не працює",
    workIntervals: "Робочий інтервал",
    addWorkTime: "Додати час",
    removeWorkTime: "Видалити робочий інтервал",
    monthPlanner: "Робочі дні місяця",
    selectedDays: "Обрано днів",
    applyToSelectedDays: "Застосувати до обраних",
    selectedDaysHint: "Оберіть дні на місяць і задайте їм однакові робочі інтервали.",
    noRoomForInterval: "Немає місця для ще одного інтервалу.",
    invalidIntervalRange: "Кінець має бути пізніше початку.",
    overlappingIntervals: "Інтервали не мають перетинатися.",
    addBreak: "Додати час",
    removeBreak: "Видалити робочий інтервал",
    onThisWeek: "На цьому тижні",
    saveSchedule: "Зберегти графік",
    workFrom: "З",
    workTo: "До",
    breakFrom: "Робочий інтервал з",
    breakTo: "До",
    owner: "Власник",
    employee: "Співробітник",
    hoursShort: "год",
    workingDay: "Робочий день",
    dayOff: "Вихідний",
    dayOffTitle: "Вихідний день",
    bookingUnavailable: "Запис недоступний",
    dayOffMessage: "Сьогодні у вас вихідний.",
    configureSchedule: "Налаштувати графік",
    bookingPage: "Картка компанії",
    bookingPageText: "Посилання для клієнтів і перемикач онлайн-запису.",
    onlineBookingOn: "Онлайн-запис увімкнено",
    onlineBookingOff: "Онлайн-запис вимкнено",
    openPage: "Відкрити сторінку",
    sharePage: "Поділитися",
    supportTitle: "Підтримка Timviz",
    supportGuideTitle: "Написати в підтримку",
    supportGuideText: "Опишіть, що ви робите, де виникло питання і що має вийти.",
    supportGreeting: "Вітаю! Напишіть питання щодо акаунта, записів, налаштувань або підписки. Ми допоможемо розібратися.",
    supportPlaceholder: "Напишіть питання одним повідомленням...",
    supportSend: "Надіслати",
    supportSent: "Повідомлення надіслано.",
    supportFailed: "Не вдалося надіслати повідомлення.",
    notificationPendingBookings: "Непідтверджені онлайн-записи",
    notificationsNew: "Нові",
    notificationsArchive: "Архів",
    notificationEmpty: "Поки немає нових подій.",
    statusPending: "Очікує підтвердження",
    statusConfirmed: "Підтверджена",
    statusCancelled: "Скасована",
    confirmBooking: "Підтвердити",
    cancelBooking: "Скасувати запис",
    companySettings: "Налаштування компанії",
    helpSupport: "Допомога та документи",
    profile: "Профіль",
    subscription: "Підписка",
    company: "Компанія",
    support: "Підтримка",
    timvizWebsite: "Сайт Timviz",
    privacyPolicy: "Політика конфіденційності",
    termsOfUse: "Умови використання",
    subscriptionTerms: "Умови підписки",
    refundPolicy: "Політика повернення",
    accountDeletion: "Видалення акаунта",
    dangerZone: "Небезпечна зона",
    deleteAccountIntroTitle: "Що буде видалено",
    deleteAccountIntroText: "Це дія видалить ваш акаунт Timviz і пов'язані особисті дані, які ми не зобов'язані зберігати за законом.",
    deleteAccountRemovedItems: "Профіль, налаштування, послуги, клієнти, записи та команда.",
    deleteAccountKeptItems: "Платіжні записи можуть бути збережені, якщо цього вимагає закон.",
    deletionUnderstand: "Я розумію, що дію не можна скасувати",
    deleteAccount: "Видалити акаунт",
    deleteAccountTitle: "Видалити акаунт",
    deleteAccountText: "Це видалить акаунт і пов'язані персональні дані, які ми не зобов'язані зберігати. Введіть DELETE для підтвердження.",
    deleteAccountConfirmPlaceholder: "DELETE",
    deleteAccountConfirm: "Підтвердити видалення",
    deleteAccountFailed: "Не вдалося видалити акаунт.",
    language: "Мова",
    compact: "Стиснутий",
    dayView: "День",
    detailed: "Детально",
    threeDays: "3 дні",
    weekView: "Тиждень",
    monthView: "Місяць",
    selected: "Вибрано",
    visits: "візитів",
    closedBySchedule: "Вихідний",
    ready: "Готово",
    reminders: "Сповіщення",
    addVisit: "Додати запис",
    customer: "Клієнт",
    service: "Послуга",
    start: "Початок",
    end: "Кінець",
    save: "Зберегти",
    cancel: "Скасувати",
    noAppointments: "На цей день записів поки немає.",
    recent: "Останні записи",
    addService: "Додати послугу",
    yourServices: "Ваші послуги",
    ownService: "Своя послуга",
    generalCatalog: "Загальний каталог",
    serviceName: "Назва послуги",
    category: "Категорія",
    newCategory: "Нова категорія",
    selectedCategory: "Обрана категорія",
    similarServices: "Схожі послуги",
    serviceCategory: "Категорія послуги",
    looksLikeCategory: "Схоже, це категорія:",
    useCategory: "Використати",
    cantFindCategory: "Не знайшли категорію",
    customCategory: "Своя категорія",
    enterCategoryName: "Введіть назву категорії",
    customCategoryHint: "Створюйте свою категорію тільки якщо її немає у списку.",
    similarCategoryExists: "Схоже, така категорія вже є:",
    similarServiceExists: "Схожа послуга вже існує",
    serviceAlreadyExistsSuffix: "вже є у ваших послугах",
    openExistingService: "Відкрити існуючу",
    createNewAnyway: "Все одно створити нову",
    chooseServiceCategoryOrAddCustom: "Оберіть категорію послуги або додайте свою.",
    serviceNameRequired: "Введіть назву послуги.",
    durationRequired: "Вкажіть тривалість.",
    editService: "Редагувати послугу",
    saveService: "Зберегти послугу",
    addFromCatalog: "Додати",
    alreadyAdded: "Вже додано",
    catalogHint: "Оберіть готову послугу.",
    myServicesHint: "Редагуйте ціну, тривалість і доступність.",
    price: "Ціна",
    duration: "Хвилини",
    delete: "Видалити",
    addClient: "Додати клієнта",
    editClient: "Редагувати клієнта",
    deleteClient: "Видалити клієнта",
    deleteClientConfirm: "Видалити цю картку клієнта?",
    clientFromAppointmentsCannotDelete: "Цей клієнт створений із записів. Щоб він зник, змініть або видаліть пов'язані записи.",
    connected: "Підключено",
    notConnected: "Не підключено",
    telegramHint: "Підключення Telegram керується через налаштування кабінету. У застосунку видно поточний статус.",
    onlineBooking: "Онлайн-запис",
    address: "Адреса",
    publicPage: "Сторінка запису",
    settingsSaved: "Зміни збережено",
    settingsSaving: "Зберігаємо...",
    settingsSaveError: "Не вдалося зберегти налаштування.",
    premiumSubscription: "Premium-підписка",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium активний",
    premiumSubscriptionTrial: "Пробний період",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Нові акаунти отримують 14 днів Premium безкоштовно. Free має 100 записів щомісяця, Pro відкриває інструменти без обмежень.",
    bookingLimitTitle: "Записи цього місяця",
    bookingLimitFreeText: "На Free доступно 100 записів на місяць. Ліміт оновиться на початку наступного місяця.",
    bookingLimitPremiumText: "На Premium записи не списуються: працюйте без обмежень.",
    bookingLimitEndedTitle: "Записи на цей місяць закінчилися",
    bookingLimitEndedText: "Підключіть Pro, щоб створювати записи без ліміту і відкрити онлайн-запис, Telegram та нагадування.",
    bookingLimitRemaining: "Залишилось",
    bookingLimitUsed: "Використано",
    bookingLimitLimit: "Ліміт",
    unlimitedShort: "unlim",
    premiumTrialIncluded: "14 днів Premium безкоштовно",
    premiumTrialDaysLeft: "Залишилось {count} дн. Premium",
    premiumTrialOneDayLeft: "Останній день Premium",
    premiumTrialExpired: "Пробний Premium завершився",
    premiumUpgradeCta: "Оформити Pro",
    premiumLockedBadge: "Pro",
    premiumFeatureBenefitsTitle: "У Pro відкривається",
    premiumBenefitOnlineBooking: "онлайн-запис і необмежені записи понад Free",
    premiumBenefitReminders: "push і Telegram-нагадування",
    premiumBenefitTeam: "більше співробітників, графіки і ролі",
    premiumBenefitClients: "розширені бізнес-інструменти для росту",
    premiumYearlyNudge: "Річний тариф вигідніший, якщо ви плануєте працювати в Timviz постійно.",
    premiumFeatureClientsTitle: "Клієнтська база входить у Free",
    premiumFeatureClientsText: "Зберігайте клієнтів, створюйте повторні записи і ведіть базову історію без оформлення Pro.",
    premiumFeatureStaffTitle: "Більше співробітників доступно в Pro",
    premiumFeatureStaffText: "Free залишає власника і 1 співробітника. Pro відкриває команду ширше, ролі і графіки без ліміту Free.",
    premiumFeatureOnlineTitle: "Онлайн-запис доступний у Pro",
    premiumFeatureOnlineText: "Free залишає ручні записи в календарі. Pro відкриває клієнтське посилання для самостійного запису.",
    premiumFeatureScheduleTitle: "Розширений календар доступний у Pro",
    premiumFeatureScheduleText: "Free дає базовий календар. Pro відкриває розширені графіки, режими роботи і командний розклад.",
    premiumFeaturePushTitle: "Push-нагадування доступні в Pro",
    premiumFeaturePushText: "Підключайте повідомлення про нові, перенесені і скасовані записи.",
    premiumFeatureTelegramTitle: "Telegram-сповіщення доступні в Pro",
    premiumFeatureTelegramText: "Отримуйте записи і нагадування в Telegram після оформлення Pro.",
    premiumFeatureAddressTitle: "Адреса і карта входять у Free",
    premiumFeatureAddressText: "Показуйте клієнтам адресу, деталі входу і карту на сторінці запису без оформлення Pro.",
    premiumMonthly: "Premium Monthly",
    premiumYearly: "Premium Yearly",
    premiumMonthlyFallback: "$3 / місяць",
    premiumYearlyFallback: "$29 / рік",
    premiumStartMonthly: "Підключити на місяць",
    premiumStartYearly: "Підключити на рік",
    premiumRestore: "Відновити покупку",
    premiumManage: "Керувати підпискою можна в магазині застосунків.",
    subscriptionAutoRenewText: "Підписка продовжується автоматично, якщо її не скасувати щонайменше за 24 години до завершення поточного періоду. Керувати підпискою можна в налаштуваннях магазину застосунків.",
    premiumReady: "Premium оновлено.",
    premiumUnavailable: "Покупки доступні у збірці з магазину застосунків.",
    premiumMissingConfig: "Покупка ще готується в магазині застосунків. Спробуйте ще раз після обробки продуктів.",
    premiumPurchaseCancelled: "Покупку скасовано.",
    premiumSyncFailed: "Не вдалося синхронізувати підписку.",
    settingsGeneral: "Налаштування компанії",
    settingsOnline: "Онлайн-запис",
    settingsServices: "Послуги",
    settingsSchedule: "Графік",
    settingsPush: "Push",
    settingsTelegram: "Telegram",
    settingsAddress: "Адреса",
    profileAndBusiness: "Профіль і бізнес",
    ownerContacts: "Контакти власника",
    avatarLink: "Аватар майстра",
    avatarHint: "Фото показується в календарі, картці майстра і верхньому меню.",
    changeAvatar: "Змінити аватар",
    deleteAvatar: "Видалити аватар",
    avatarPermission: "Дозвольте доступ до фото, щоб змінити аватар.",
    newPassword: "Новий пароль",
    leaveBlankPassword: "залиште порожнім, якщо пароль не змінюється",
    businessFormat: "Назва і формат",
    website: "Сайт",
    accountType: "Тип акаунта",
    soloAccount: "Я працюю один",
    teamAccount: "Команда",
    serviceMode: "Формат роботи",
    categoriesText: "Категорії",
    categoriesHint: "Оберіть одну або кілька категорій з каталогу",
    localization: "Країна, мова і валюта",
    country: "Країна",
    timezone: "Часовий пояс",
    currency: "Валюта",
    saveSettings: "Зберегти налаштування",
    publicLink: "Публічне посилання",
    copyLink: "Копіювати",
    manageServices: "Керувати послугами",
    manageSchedule: "Керувати графіком",
    joinRequests: "Запити на приєднання",
    noJoinRequests: "Нових запитів поки немає.",
    approve: "Підтвердити",
    reject: "Відхилити",
    businessPhotos: "Фото бізнесу",
    photosHint: "Перші фото відображаються на сторінці онлайн-запису.",
    businessPhotoUploadTitle: "Додати фото бізнесу",
    businessPhotoUploadSubtitle: "Профілі з фото виглядають професійніше",
    businessPhotoSourceTitle: "Звідки додати фото",
    businessPhotoFromCamera: "Зробити фото",
    businessPhotoFromGallery: "Обрати з галереї",
    businessPhotoDropHint: "На комп'ютері можна перетягнути фото сюди",
    addMorePhoto: "Додати ще фото",
    businessPhotoActionsTitle: "Дії з фото",
    streetAddress: "Адреса",
    addressDetails: "Деталі адреси",
    mapCoordinates: "Координати зберігаються з сайту; у застосунку редагується текстова адреса.",
    ownerOnlyHint: "Налаштування бізнесу може змінювати тільки власник акаунта.",
    launchChecklist: "Чекліст запуску",
    profileReady: "Профіль готовий",
    completedSteps: "виконано",
    photoUrl: "Посилання на фото",
    photoCaption: "Підпис до фото",
    addPhotoUrl: "Додати фото за посиланням",
    addPhoto: "Додати фото",
    uploadPhoto: "Завантажити фото",
    photoUploading: "Завантажуємо фото...",
    makePrimary: "Зробити головним",
    primaryPhoto: "Головне фото",
    addressSearch: "Знайти адресу на карті",
    addressPlaceholder: "Почніть вводити реальну адресу",
    searchingAddress: "Шукаємо адресу...",
    selectAddress: "Вибрати адресу",
    selectedAddress: "Вибрана адреса",
    streetHouse: "Будинок, вулиця",
    city: "Місто",
    region: "Регіон",
    postcode: "Індекс",
    openMap: "Відкрити карту",
    telegramConnectButton: "Підключити бота",
    telegramOpenBot: "Відкрити бота",
    telegramCopyLink: "Копіювати посилання",
    telegramRefreshLink: "Оновити посилання",
    telegramTokenExpires: "Посилання активне до",
    telegramSectionNotifications: "Сповіщення",
    telegramSectionReminders: "Нагадування",
    telegramSectionSupport: "Підтримка",
    telegramNotificationsHint: "Події для Telegram.",
    telegramOnlineBookings: "Нові онлайн-записи",
    telegramCabinetBookings: "Нові записи з кабінету",
    telegramRescheduled: "Зміна часу запису",
    telegramCancelled: "Скасування запису",
    telegramRemindersHint: "Нагадування про візити.",
    telegramReminders: "Нагадування перед записом",
    telegramToday: "Зведення на сьогодні",
    telegramReminderLead: "Коли нагадувати",
    telegramSupportHint: "Питання клієнтів і підтримки можуть приходити прямо в Telegram.",
    telegramForwarding: "Пересилати підтримку в Telegram",
    telegramSaved: "Telegram оновлено",
    telegramSaveFailed: "Не вдалося оновити Telegram.",
    pushTitle: "Сповіщення застосунку",
    pushHint: "Нові записи та зміни прямо на телефон.",
    pushEnable: "Увімкнути сповіщення",
    pushEnabled: "Сповіщення увімкнено",
    pushDisabled: "Сповіщення вимкнено",
    pushPermissionDenied: "Дозвольте сповіщення в налаштуваннях телефону.",
    pushSaved: "Сповіщення оновлено",
    pushSaveFailed: "Не вдалося оновити сповіщення.",
    pushOpenSettings: "Відкрити налаштування телефону",
    pushDeviceCount: "Пристроїв",
    pushProjectMissing: "Не налаштовано Expo projectId для push-сповіщень. Додайте EXPO_PUBLIC_EAS_PROJECT_ID у конфігурацію застосунку.",
    pushIosCapabilityMissing: "Для push-сповіщень потрібна нова TestFlight-збірка з увімкненими Push Notifications в Apple Developer.",
    minutesBefore: "хв до запису",
    hoursBefore: "год до запису",
    dayBefore: "за день",
    minutesShort: "хв",
    defaultServiceCategory: "Без категорії",
    serviceModeOnsite: "Клієнти приходять у мій заклад",
    serviceModeTravel: "Я працюю з виїздом до клієнта",
    serviceModeOnline: "Я надаю послуги онлайн",
    calendarHeaderTitle: "Календар",
    loadWorkspaceFailed: "Не вдалося завантажити кабінет.",
    empty: "Поки порожньо",
    emptyCalendarTitle: "Поки немає записів",
    emptyCalendarText: "Натисніть +, щоб додати перший візит",
    noBookingsToday: "Сьогодні записів немає",
    noBookingsTodaySpark: "Сьогодні записів немає ✨",
    fillFreeWindowsText: "Саме час заповнити вільні вікна.",
    noBookingsThisDay: "На цей день записів немає",
    calendarNoServicesText: "Додайте послуги й ціни, щоб перед першим записом усе було готово.",
    calendarEmptyActionText: "Додайте перший візит або налаштуйте послуги для онлайн-запису.",
    createBooking: "Створити запис",
    createAppointmentButton: "+ Створити запис",
    firstRunCalendarTitle: "Почніть з послуги",
    firstRunCalendarText: "Спочатку додайте послуги з цінами: так записи створюються швидше, а онлайн-запис зрозуміліший для клієнтів.",
    addFirstVisit: "Додати перший візит",
    quickVisit: "Швидкий запис",
    createVisitWithoutService: "Створити запис без послуги",
    onboardingStartTitle: "Додайте каталог послуг",
    onboardingStartText: "Перед першим записом додайте послуги, тривалість і ціни. Після цього створювати записи буде швидше, а клієнтам буде зрозуміло, що вони бронюють.",
    firstAppointmentCreated: "🎉 Ваш перший запис створено",
    addServiceFirstTitle: "Спочатку додайте послугу",
    addServiceFirstText: "У вас поки немає послуг. Додайте першу послугу з тривалістю і ціною.",
    servicesEmptyPickerTitle: "Послуг поки немає",
    servicesEmptyPickerText: "Додайте першу послугу з тривалістю і ціною, потім створіть запис.",
    createServiceAction: "Створити послугу",
    bookingWithoutService: "Запис без послуги",
    firstServiceTitle: "Додайте першу послугу",
    firstServiceText: "Оберіть послуги з каталогу, перевірте тривалість і проставте ціни. Після цього можна швидко створювати записи й відкривати онлайн-запис.",
    chooseFromCatalog: "Обрати з каталогу",
    createOwnService: "Створити свою послугу",
    servicesMineShort: "Мої",
    servicesCreateShort: "Створити",
    servicesCatalogShort: "Каталог",
    serviceSuggestionManicure: "Манікюр",
    serviceSuggestionHaircut: "Стрижка",
    serviceSuggestionConsultation: "Консультація",
    clientsEmptyTitle: "Клієнтів поки немає",
    clientsEmptyText: "Клієнт з'явиться після першого запису або ви можете додати його вручну.",
    setupRemaining: "Залишилось {count} кроки",
    setupFirstServiceText: "Додайте послуги - це перший крок до записів і онлайн-бронювання.",
  },
  ru: {
    login: "Войти",
    register: "Создать аккаунт",
    registerShort: "Создать",
    newMasterCta: "Новый мастер? Создать аккаунт",
    registerMasterCta: "Создать аккаунт мастера",
    optionalDetails: "Дополнительно",
    email: "Email",
    password: "Пароль",
    forgotPassword: "Забыли пароль?",
    forgotPasswordTitle: "Восстановление пароля",
    forgotPasswordText: "Введите email, и мы отправим ссылку для создания нового пароля.",
    forgotPasswordSubmit: "Отправить ссылку",
    forgotPasswordSending: "Отправляем...",
    forgotPasswordSentTitle: "Проверьте почту",
    forgotPasswordSentText: "Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля.",
    forgotPasswordEmailRequired: "Введите email для восстановления.",
    forgotPasswordFailed: "Не удалось отправить письмо. Попробуйте ещё раз.",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    phoneCountry: "Страна",
    selectCountryCode: "Код страны",
    searchCountryOrCode: "Страна или код",
    customPhonePrefix: "Свой код",
    customPhonePrefixHint: "Если нужен нестандартный префикс",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Выбрать код",
    allCountries: "Все страны",
    companyName: "Название бизнеса",
    continue: "Продолжить",
    creating: "Создаем...",
    signingIn: "Вход...",
    calendar: "Календарь",
    clients: "Клиенты",
    services: "Услуги",
    staff: "Команда",
    settings: "Настройки",
    moreTab: "Ещё",
    signOut: "Выйти",
    requiredTitle: "Нужны данные",
    requiredText: "Заполните все поля.",
    registerFirstNameRequired: "Введите имя.",
    registerEmailRequired: "Введите email.",
    registerEmailInvalid: "Введите корректный email.",
    registerPasswordRequired: "Введите пароль.",
    registerPasswordTooShort: "Пароль должен быть минимум 6 символов.",
    registerPhoneRequired: "Введите телефон.",
    registerCompanyRequired: "Введите название бизнеса.",
    loginError: "Ошибка входа",
    registerError: "Ошибка регистрации",
    passwordHint: "Минимум 6 символов",
    captchaTitle: "Проверка безопасности",
    captchaText: "Подтвердите, что аккаунт создаёт реальный мастер. Это займёт несколько секунд.",
    captchaCancel: "Закрыть",
    captchaOpenBrowser: "Открыть проверку в браузере",
    captchaBrowserHint: "Если проверка не появилась, откройте её в браузере. После прохождения мы вернём вас в приложение.",
    captchaCanceled: "Проверка отменена. Пройдите её, чтобы создать аккаунт.",
    captchaFailed: "Не удалось пройти проверку. Попробуйте ещё раз.",
    continueWithGoogle: "Продолжить с Google",
    continueWithApple: "Продолжить с Apple",
    socialAuthDivider: "или",
    socialAuthConfigMissing: "Нужно настроить ключи входа.",
    socialAuthFailed: "Не удалось выполнить вход.",
    enableBiometricTitle: "Включить Face ID?",
    enableBiometricText: "В следующий раз вы сможете быстро открыть Timviz через Face ID или код устройства.",
    enableBiometricAction: "Включить",
    notNow: "Не сейчас",
    unlockWithFaceId: "Войти через Face ID",
    unlockWithBiometrics: "Быстрый вход",
    useDevicePasscode: "Код устройства",
    biometricUnavailable: "Face ID или Touch ID недоступны на этом устройстве.",
    proTitle: "Timviz для мастера",
    proSubtitle: "Календарь, услуги, клиенты и уведомления в одном приложении.",
    dashboard: "Рабочий кабинет",
    home: "Главная",
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    newVisit: "Новый визит",
    editVisit: "Редактировать запись",
    bookTime: "Забронировать время",
    addBlockedTime: "Добавить нерабочее время",
    reservedTime: "Забронированное время",
    unavailableTime: "Нерабочее время",
    chooseClient: "Выбрать клиента",
    withoutClient: "Без клиента",
    quickBookingWithoutClient: "Быстрая запись без клиента",
    chooseClientLater: "Можно выбрать клиента позже",
    chooseService: "Выбрать услугу",
    comment: "Комментарий",
    addAnotherService: "Добавить еще услугу +",
    total: "Итого",
    payable: "К оплате",
    saveVisit: "Сохранить запись",
    visitTab: "Визит",
    search: "Поиск",
    searchService: "Название услуги",
    serviceSearchEmpty: "Услуга не найдена.",
    clientNameOrPhone: "Имя или телефон",
    addNewClient: "Добавить нового клиента",
    addAndSelectClient: "Добавить и выбрать",
    createClientFromSearch: "Создать клиента",
    noClientFound: "Клиент не найден. Можно создать нового.",
    newClientFormTitle: "Новый клиент",
    newClientFormHint: "Добавьте данные, и клиент сразу будет выбран для визита.",
    formOpened: "Форма открыта ниже",
    clientName: "Имя клиента",
    withoutService: "Без услуги",
    setupAssistant: "Помощник настройки",
    setupAssistantText: "Пройдите шаги, чтобы профиль был готов к онлайн-записи.",
    setupCompleteTitle: "Профиль готов к онлайн-записи",
    setupCompleteText: "Клиенты уже могут записываться через вашу ссылку.",
    setupProgress: "Готовность",
    setupServices: "Добавьте услуги",
    setupSchedule: "Настройте график",
    setupBooking: "Включите онлайн-запись",
    setupPhoto: "Добавьте фото бизнеса",
    setupAddress: "Добавьте адрес",
    setupTelegram: "Подключите Telegram",
    staffSchedule: "График смен",
    staffScheduleHint: "Управляйте рабочими днями сотрудников так же, как в кабинете на сайте.",
    teamMembers: "Участники",
    teamMembersHint: "Добавляйте сотрудников, редактируйте контакты, роль и доступ к кабинету.",
    allTeam: "Вся команда",
    showWholeTeam: "Показать всю команду",
    selectedMasters: "Выбранные мастера",
    addMember: "Пригласить",
    editMember: "Редактировать сотрудника",
    saveMember: "Сохранить сотрудника",
    fullName: "Имя и фамилия",
    role: "Роль",
    workspaceAccess: "Доступ",
    invite: "Пригласить",
    resendInvite: "Отправить еще раз",
    revokeInvite: "Отозвать приглашение",
    sendInvite: "Укажите email. Остальные данные сотрудник заполнит после принятия.",
    pendingInvites: "Отправленные приглашения",
    incomingInvites: "Полученные приглашения",
    noIncomingInvites: "Вас пока никто не пригласил.",
    noInvites: "Вы пока никого не пригласили.",
    removeMember: "Удалить из команды",
    removeMemberConfirm: "Удалить сотрудника из команды? Его аккаунт останется самостоятельным.",
    removeMemberSuccess: "Сотрудник удалён из команды.",
    memberCompanyEyebrow: "Моя команда",
    memberCompanyTitle: "Вы в группе",
    memberCompanyRole: "Роль",
    memberCompanyJoined: "Присоединились",
    leaveCompany: "Выйти из компании",
    leaveCompanyConfirm: "Выйти из этой компании? Доступ к рабочему кабинету будет закрыт.",
    leaveCompanySuccess: "Вы вышли из компании.",
    acceptInvite: "Принять",
    declineInvite: "Отклонить",
    monthBookings: "Записей за месяц",
    upcomingBookings: "Будущие записи",
    scheduleMenu: "График",
    currentWeek: "На этой неделе",
    previousWeek: "Предыдущая неделя",
    nextWeek: "Следующая неделя",
    chooseWeek: "Выбрать неделю",
    repeatingSchedule: "Повторяющийся график",
    oneWeekSchedule: "Неделя календаря",
    applyToWeekdays: "Применить ко всем будням",
    clearWeek: "Очистить неделю",
    noWork: "Не работает",
    workIntervals: "Рабочий интервал",
    addWorkTime: "Добавить время",
    removeWorkTime: "Удалить рабочий интервал",
    monthPlanner: "Рабочие дни месяца",
    selectedDays: "Выбрано дней",
    applyToSelectedDays: "Применить к выбранным",
    selectedDaysHint: "Выберите дни на месяц и задайте им одинаковые рабочие интервалы.",
    noRoomForInterval: "Нет места для еще одного интервала.",
    invalidIntervalRange: "Конец должен быть позже начала.",
    overlappingIntervals: "Интервалы не должны пересекаться.",
    addBreak: "Добавить время",
    removeBreak: "Удалить рабочий интервал",
    onThisWeek: "На этой неделе",
    saveSchedule: "Сохранить график",
    workFrom: "С",
    workTo: "До",
    breakFrom: "Рабочий интервал с",
    breakTo: "До",
    owner: "Владелец",
    employee: "Сотрудник",
    hoursShort: "ч",
    workingDay: "Рабочий день",
    dayOff: "Выходной",
    dayOffTitle: "Выходной день",
    bookingUnavailable: "Запись недоступна",
    dayOffMessage: "Сегодня у вас выходной.",
    configureSchedule: "Настроить график",
    bookingPage: "Карточка компании",
    bookingPageText: "Ссылка для клиентов и переключатель онлайн-записи.",
    onlineBookingOn: "Онлайн-запись включена",
    onlineBookingOff: "Онлайн-запись выключена",
    openPage: "Открыть страницу",
    sharePage: "Поделиться",
    supportTitle: "Поддержка Timviz",
    supportGuideTitle: "Написать в поддержку",
    supportGuideText: "Опишите, что вы делаете, где возник вопрос и что должно выйти.",
    supportGreeting: "Привет! Напишите вопрос по аккаунту, записям, настройкам или подписке. Мы поможем разобраться.",
    supportPlaceholder: "Напишите вопрос одним сообщением...",
    supportSend: "Отправить",
    supportSent: "Сообщение отправлено.",
    supportFailed: "Не удалось отправить сообщение.",
    notificationPendingBookings: "Неподтвержденные онлайн-записи",
    notificationsNew: "Новые",
    notificationsArchive: "Архив",
    notificationEmpty: "Пока нет новых событий.",
    statusPending: "Ожидает подтверждения",
    statusConfirmed: "Подтверждена",
    statusCancelled: "Отменена",
    confirmBooking: "Подтвердить",
    cancelBooking: "Отменить запись",
    companySettings: "Настройки компании",
    helpSupport: "Помощь и документы",
    profile: "Профиль",
    subscription: "Подписка",
    company: "Компания",
    support: "Поддержка",
    timvizWebsite: "Сайт Timviz",
    privacyPolicy: "Политика конфиденциальности",
    termsOfUse: "Условия использования",
    subscriptionTerms: "Условия подписки",
    refundPolicy: "Политика возврата",
    accountDeletion: "Удаление аккаунта",
    dangerZone: "Опасная зона",
    deleteAccountIntroTitle: "Что будет удалено",
    deleteAccountIntroText: "Это действие удалит ваш аккаунт Timviz и связанные личные данные, которые мы не обязаны хранить по закону.",
    deleteAccountRemovedItems: "Профиль, настройки, услуги, клиенты, записи и команда.",
    deleteAccountKeptItems: "Платежные записи могут быть сохранены, если это требуется законом.",
    deletionUnderstand: "Я понимаю, что действие нельзя отменить",
    deleteAccount: "Удалить аккаунт",
    deleteAccountTitle: "Удалить аккаунт",
    deleteAccountText: "Это удалит аккаунт и связанные персональные данные, которые мы не обязаны хранить. Введите DELETE для подтверждения.",
    deleteAccountConfirmPlaceholder: "DELETE",
    deleteAccountConfirm: "Подтвердить удаление",
    deleteAccountFailed: "Не удалось удалить аккаунт.",
    language: "Язык",
    compact: "Сжатый",
    dayView: "День",
    detailed: "Подробно",
    threeDays: "3 дня",
    weekView: "Неделя",
    monthView: "Месяц",
    selected: "Выбрано",
    visits: "визитов",
    closedBySchedule: "Выходной",
    ready: "Готово",
    reminders: "Уведомления",
    addVisit: "Добавить запись",
    customer: "Клиент",
    service: "Услуга",
    start: "Начало",
    end: "Конец",
    save: "Сохранить",
    cancel: "Отмена",
    noAppointments: "На этот день записей пока нет.",
    recent: "Последние записи",
    addService: "Добавить услугу",
    yourServices: "Ваши услуги",
    ownService: "Своя услуга",
    generalCatalog: "Общий каталог",
    serviceName: "Название услуги",
    category: "Категория",
    newCategory: "Новая категория",
    selectedCategory: "Выбранная категория",
    similarServices: "Похожие услуги",
    serviceCategory: "Категория услуги",
    looksLikeCategory: "Похоже, это категория:",
    useCategory: "Использовать",
    cantFindCategory: "Не нашёл категорию",
    customCategory: "Своя категория",
    enterCategoryName: "Введите название категории",
    customCategoryHint: "Создавайте свою категорию только если ее нет в списке.",
    similarCategoryExists: "Похоже, такая категория уже есть:",
    similarServiceExists: "Похожая услуга уже есть",
    serviceAlreadyExistsSuffix: "уже есть в ваших услугах",
    openExistingService: "Открыть существующую",
    createNewAnyway: "Все равно создать новую",
    chooseServiceCategoryOrAddCustom: "Выберите категорию услуги или добавьте свою.",
    serviceNameRequired: "Введите название услуги.",
    durationRequired: "Укажите длительность.",
    editService: "Редактировать услугу",
    saveService: "Сохранить услугу",
    addFromCatalog: "Добавить",
    alreadyAdded: "Уже добавлена",
    catalogHint: "Выберите готовую услугу.",
    myServicesHint: "Редактируйте цену, длительность и доступность.",
    price: "Цена",
    duration: "Минуты",
    delete: "Удалить",
    addClient: "Добавить клиента",
    editClient: "Редактировать клиента",
    deleteClient: "Удалить клиента",
    deleteClientConfirm: "Удалить эту карточку клиента?",
    clientFromAppointmentsCannotDelete: "Этот клиент создан из записей. Чтобы он исчез, измените или удалите связанные записи.",
    connected: "Подключено",
    notConnected: "Не подключено",
    telegramHint: "Подключение Telegram управляется через настройки кабинета. В приложении виден текущий статус.",
    onlineBooking: "Онлайн-запись",
    address: "Адрес",
    publicPage: "Страница записи",
    settingsSaved: "Изменения сохранены",
    settingsSaving: "Сохраняем...",
    settingsSaveError: "Не удалось сохранить настройки.",
    premiumSubscription: "Premium-подписка",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium активен",
    premiumSubscriptionTrial: "Пробный период",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Новые аккаунты получают 14 дней Premium бесплатно. Free дает 100 записей каждый месяц, Pro открывает инструменты без ограничений.",
    bookingLimitTitle: "Записи этого месяца",
    bookingLimitFreeText: "На Free доступно 100 записей в месяц. Лимит обновится в начале следующего месяца.",
    bookingLimitPremiumText: "На Premium записи не списываются: работайте без ограничений.",
    bookingLimitEndedTitle: "Записи на этот месяц закончились",
    bookingLimitEndedText: "Подключите Pro, чтобы создавать записи без лимита и открыть онлайн-запись, Telegram и напоминания.",
    bookingLimitRemaining: "Осталось",
    bookingLimitUsed: "Использовано",
    bookingLimitLimit: "Лимит",
    unlimitedShort: "unlim",
    premiumTrialIncluded: "14 дней Premium бесплатно",
    premiumTrialDaysLeft: "Осталось {count} дн. Premium",
    premiumTrialOneDayLeft: "Последний день Premium",
    premiumTrialExpired: "Пробный Premium закончился",
    premiumUpgradeCta: "Оформить Pro",
    premiumLockedBadge: "Pro",
    premiumFeatureBenefitsTitle: "В Pro открывается",
    premiumBenefitOnlineBooking: "онлайн-запись и неограниченные записи сверх Free",
    premiumBenefitReminders: "push и Telegram-напоминания",
    premiumBenefitTeam: "больше сотрудников, графики и роли",
    premiumBenefitClients: "расширенные бизнес-инструменты для роста",
    premiumYearlyNudge: "Годовой тариф выгоднее, если вы планируете работать в Timviz постоянно.",
    premiumFeatureClientsTitle: "Клиентская база входит в Free",
    premiumFeatureClientsText: "Сохраняйте клиентов, создавайте повторные записи и ведите базовую историю без оформления Pro.",
    premiumFeatureStaffTitle: "Больше сотрудников доступно в Pro",
    premiumFeatureStaffText: "Free оставляет владельца и 1 сотрудника. Pro открывает команду шире, роли и графики без лимита Free.",
    premiumFeatureOnlineTitle: "Онлайн-запись доступна в Pro",
    premiumFeatureOnlineText: "Free оставляет ручные записи в календаре. Pro открывает клиентскую ссылку для самостоятельной записи.",
    premiumFeatureScheduleTitle: "Расширенный календар доступен в Pro",
    premiumFeatureScheduleText: "Free дает базовый календар. Pro открывает расширенные графики, режимы работы и командное расписание.",
    premiumFeaturePushTitle: "Push-напоминания доступны в Pro",
    premiumFeaturePushText: "Подключайте уведомления о новых, перенесенных и отмененных записях.",
    premiumFeatureTelegramTitle: "Telegram-уведомления доступны в Pro",
    premiumFeatureTelegramText: "Получайте записи и напоминания в Telegram после оформления Pro.",
    premiumFeatureAddressTitle: "Адрес и карта входят в Free",
    premiumFeatureAddressText: "Показывайте клиентам адрес, детали входа и карту на странице записи без оформления Pro.",
    premiumMonthly: "Premium Monthly",
    premiumYearly: "Premium Yearly",
    premiumMonthlyFallback: "$3 / месяц",
    premiumYearlyFallback: "$29 / год",
    premiumStartMonthly: "Подключить на месяц",
    premiumStartYearly: "Подключить на год",
    premiumRestore: "Восстановить покупку",
    premiumManage: "Управлять подпиской можно в магазине приложений.",
    subscriptionAutoRenewText: "Подписка продлевается автоматически, если не отменить её минимум за 24 часа до конца текущего периода. Управлять подпиской можно в настройках магазина приложений.",
    premiumReady: "Premium обновлен.",
    premiumUnavailable: "Покупки доступны в сборке из магазина приложений.",
    premiumMissingConfig: "Покупка еще готовится в магазине приложений. Попробуйте еще раз после обработки продуктов.",
    premiumPurchaseCancelled: "Покупка отменена.",
    premiumSyncFailed: "Не удалось синхронизировать подписку.",
    settingsGeneral: "Настройки компании",
    settingsOnline: "Онлайн-запись",
    settingsServices: "Услуги",
    settingsSchedule: "График",
    settingsPush: "Push",
    settingsTelegram: "Telegram",
    settingsAddress: "Адрес",
    profileAndBusiness: "Профиль и бизнес",
    ownerContacts: "Контакты владельца",
    avatarLink: "Аватар мастера",
    avatarHint: "Фото показывается в календаре, карточке мастера и верхнем меню.",
    changeAvatar: "Сменить аватар",
    deleteAvatar: "Удалить аватар",
    avatarPermission: "Разрешите доступ к фото, чтобы изменить аватар.",
    newPassword: "Новый пароль",
    leaveBlankPassword: "оставьте пустым, если пароль не меняется",
    businessFormat: "Название и формат",
    website: "Сайт",
    accountType: "Тип аккаунта",
    soloAccount: "Я работаю один",
    teamAccount: "Команда",
    serviceMode: "Формат работы",
    categoriesText: "Категории",
    categoriesHint: "Выберите одну или несколько категорий из каталога",
    localization: "Страна, язык и валюта",
    country: "Страна",
    timezone: "Часовой пояс",
    currency: "Валюта",
    saveSettings: "Сохранить настройки",
    publicLink: "Публичная ссылка",
    copyLink: "Копировать",
    manageServices: "Управлять услугами",
    manageSchedule: "Управлять графиком",
    joinRequests: "Запросы на присоединение",
    noJoinRequests: "Новых запросов пока нет.",
    approve: "Подтвердить",
    reject: "Отклонить",
    businessPhotos: "Фото бизнеса",
    photosHint: "Первые фото отображаются на странице онлайн-записи.",
    businessPhotoUploadTitle: "Добавить фото бизнеса",
    businessPhotoUploadSubtitle: "Профили с фото выглядят профессиональнее",
    businessPhotoSourceTitle: "Откуда добавить фото",
    businessPhotoFromCamera: "Сделать фото",
    businessPhotoFromGallery: "Выбрать из галереи",
    businessPhotoDropHint: "На компьютере можно перетащить фото сюда",
    addMorePhoto: "Добавить еще фото",
    businessPhotoActionsTitle: "Действия с фото",
    streetAddress: "Адрес",
    addressDetails: "Детали адреса",
    mapCoordinates: "Координаты сохраняются с сайта; в приложении редактируется текстовый адрес.",
    ownerOnlyHint: "Настройки бизнеса может менять только владелец аккаунта.",
    launchChecklist: "Чеклист запуска",
    profileReady: "Профиль готов",
    completedSteps: "выполнено",
    photoUrl: "Ссылка на фото",
    photoCaption: "Подпись к фото",
    addPhotoUrl: "Добавить фото по ссылке",
    addPhoto: "Добавить фото",
    uploadPhoto: "Загрузить фото",
    photoUploading: "Загружаем фото...",
    makePrimary: "Сделать главным",
    primaryPhoto: "Главное фото",
    addressSearch: "Найти адрес на карте",
    addressPlaceholder: "Начните вводить реальный адрес",
    searchingAddress: "Ищем адрес...",
    selectAddress: "Выбрать адрес",
    selectedAddress: "Выбранный адрес",
    streetHouse: "Дом, улица",
    city: "Город",
    region: "Регион",
    postcode: "Индекс",
    openMap: "Открыть карту",
    telegramConnectButton: "Подключить бота",
    telegramOpenBot: "Открыть бота",
    telegramCopyLink: "Копировать ссылку",
    telegramRefreshLink: "Обновить ссылку",
    telegramTokenExpires: "Ссылка активна до",
    telegramSectionNotifications: "Уведомления",
    telegramSectionReminders: "Напоминания",
    telegramSectionSupport: "Поддержка",
    telegramNotificationsHint: "События для Telegram.",
    telegramOnlineBookings: "Новые онлайн-записи",
    telegramCabinetBookings: "Новые записи из кабинета",
    telegramRescheduled: "Изменение времени записи",
    telegramCancelled: "Отмена записи",
    telegramRemindersHint: "Напоминания о визитах.",
    telegramReminders: "Напоминание перед записью",
    telegramToday: "Сводка на сегодня",
    telegramReminderLead: "Когда напоминать",
    telegramSupportHint: "Вопросы клиентов и поддержки могут приходить прямо в Telegram.",
    telegramForwarding: "Пересылать поддержку в Telegram",
    telegramSaved: "Telegram обновлен",
    telegramSaveFailed: "Не удалось обновить Telegram.",
    pushTitle: "Уведомления приложения",
    pushHint: "Новые записи и изменения прямо на телефон.",
    pushEnable: "Включить уведомления",
    pushEnabled: "Уведомления включены",
    pushDisabled: "Уведомления выключены",
    pushPermissionDenied: "Разрешите уведомления в настройках телефона.",
    pushSaved: "Уведомления обновлены",
    pushSaveFailed: "Не удалось обновить уведомления.",
    pushOpenSettings: "Открыть настройки телефона",
    pushDeviceCount: "Устройств",
    pushProjectMissing: "Не настроен Expo projectId для push-уведомлений. Добавьте EXPO_PUBLIC_EAS_PROJECT_ID в конфигурацию приложения.",
    pushIosCapabilityMissing: "Для push-уведомлений нужна новая TestFlight-сборка с включенными Push Notifications в Apple Developer.",
    minutesBefore: "мин до записи",
    hoursBefore: "ч до записи",
    dayBefore: "за день",
    minutesShort: "мин",
    defaultServiceCategory: "Без категории",
    serviceModeOnsite: "Клиенты приходят в мое заведение",
    serviceModeTravel: "Я работаю с выездом к клиенту",
    serviceModeOnline: "Я предоставляю услуги онлайн",
    calendarHeaderTitle: "Календарь",
    loadWorkspaceFailed: "Не удалось загрузить кабинет.",
    empty: "Пока пусто",
    emptyCalendarTitle: "Пока нет записей",
    emptyCalendarText: "Нажмите +, чтобы добавить первый визит",
    noBookingsToday: "Сегодня записей нет",
    noBookingsTodaySpark: "Сегодня записей нет ✨",
    fillFreeWindowsText: "Самое время заполнить свободные окна.",
    noBookingsThisDay: "На этот день записей нет",
    calendarNoServicesText: "Добавьте услуги и цены, чтобы перед первой записью все было готово.",
    calendarEmptyActionText: "Добавьте первый визит или настройте услуги для онлайн-записи.",
    createBooking: "Создать запись",
    createAppointmentButton: "+ Создать запись",
    firstRunCalendarTitle: "Начните с услуги",
    firstRunCalendarText: "Сначала добавьте услуги с ценами: так записи создаются быстрее, а онлайн-запись понятнее для клиентов.",
    addFirstVisit: "Добавить первый визит",
    quickVisit: "Быстрая запись",
    createVisitWithoutService: "Создать запись без услуги",
    onboardingStartTitle: "Добавьте каталог услуг",
    onboardingStartText: "Перед первой записью добавьте услуги, длительность и цены. Так запись создается быстрее, а клиентам понятно, что они бронируют.",
    firstAppointmentCreated: "🎉 Ваша первая запись создана",
    addServiceFirstTitle: "Сначала добавьте услугу",
    addServiceFirstText: "У вас пока нет услуг. Добавьте первую услугу с длительностью и ценой.",
    servicesEmptyPickerTitle: "Услуг пока нет",
    servicesEmptyPickerText: "Добавьте первую услугу с длительностью и ценой, затем создайте запись.",
    createServiceAction: "Создать услугу",
    bookingWithoutService: "Запись без услуги",
    firstServiceTitle: "Добавьте первую услугу",
    firstServiceText: "Выберите услуги из каталога, проверьте длительность и проставьте цены. После этого можно быстро создавать записи и включать онлайн-запись.",
    chooseFromCatalog: "Выбрать из каталога",
    createOwnService: "Создать свою услугу",
    servicesMineShort: "Мои",
    servicesCreateShort: "Создать",
    servicesCatalogShort: "Каталог",
    serviceSuggestionManicure: "Маникюр",
    serviceSuggestionHaircut: "Стрижка",
    serviceSuggestionConsultation: "Консультация",
    clientsEmptyTitle: "Клиентов пока нет",
    clientsEmptyText: "Клиент появится после первой записи или вы можете добавить его вручную.",
    setupRemaining: "Осталось {count} шага",
    setupFirstServiceText: "Добавьте услуги - это первый шаг к записям и онлайн-бронированию.",
  },
  en: {
    login: "Sign in",
    register: "Create account",
    registerShort: "Create",
    newMasterCta: "New pro? Create account",
    registerMasterCta: "Create pro account",
    optionalDetails: "More details",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    forgotPasswordTitle: "Reset password",
    forgotPasswordText: "Enter your email and we will send a link to create a new password.",
    forgotPasswordSubmit: "Send link",
    forgotPasswordSending: "Sending...",
    forgotPasswordSentTitle: "Check your email",
    forgotPasswordSentText: "If an account with this email exists, we sent a password reset link.",
    forgotPasswordEmailRequired: "Enter the email to reset.",
    forgotPasswordFailed: "Could not send the email. Please try again.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    phoneCountry: "Country",
    selectCountryCode: "Country code",
    searchCountryOrCode: "Country or code",
    customPhonePrefix: "Custom code",
    customPhonePrefixHint: "Use this for a non-standard prefix",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Use code",
    allCountries: "All countries",
    companyName: "Business name",
    continue: "Continue",
    creating: "Creating...",
    signingIn: "Signing in...",
    calendar: "Calendar",
    clients: "Clients",
    services: "Services",
    staff: "Team",
    settings: "Settings",
    moreTab: "More",
    signOut: "Sign out",
    requiredTitle: "Missing details",
    requiredText: "Fill in all fields.",
    registerFirstNameRequired: "Enter your first name.",
    registerEmailRequired: "Enter your email.",
    registerEmailInvalid: "Enter a valid email.",
    registerPasswordRequired: "Enter your password.",
    registerPasswordTooShort: "Password must be at least 6 characters.",
    registerPhoneRequired: "Enter your phone number.",
    registerCompanyRequired: "Enter your business name.",
    loginError: "Sign-in error",
    registerError: "Registration error",
    passwordHint: "At least 6 characters",
    captchaTitle: "Security check",
    captchaText: "Confirm that a real professional is creating this account. It only takes a few seconds.",
    captchaCancel: "Close",
    captchaOpenBrowser: "Open check in browser",
    captchaBrowserHint: "If the check does not appear, open it in the browser. After completion we will return you to the app.",
    captchaCanceled: "The check was canceled. Complete it to create an account.",
    captchaFailed: "Could not complete the check. Please try again.",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    socialAuthDivider: "or",
    socialAuthConfigMissing: "Sign-in keys need to be configured.",
    socialAuthFailed: "Could not sign in.",
    enableBiometricTitle: "Enable Face ID?",
    enableBiometricText: "Next time you can open Timviz quickly with Face ID or your device passcode.",
    enableBiometricAction: "Enable",
    notNow: "Not now",
    unlockWithFaceId: "Sign in with Face ID",
    unlockWithBiometrics: "Quick sign-in",
    useDevicePasscode: "Device passcode",
    biometricUnavailable: "Face ID or Touch ID is unavailable on this device.",
    proTitle: "Timviz for pros",
    proSubtitle: "Calendar, services, clients and alerts in one app.",
    dashboard: "Workspace",
    home: "Home",
    today: "Today",
    week: "Week",
    month: "Month",
    newVisit: "New visit",
    editVisit: "Edit appointment",
    bookTime: "Book time",
    addBlockedTime: "Add unavailable time",
    reservedTime: "Reserved time",
    unavailableTime: "Unavailable time",
    chooseClient: "Choose client",
    withoutClient: "No client",
    quickBookingWithoutClient: "Quick booking without client",
    chooseClientLater: "You can choose a client later",
    chooseService: "Choose service",
    comment: "Comment",
    addAnotherService: "Add another service +",
    total: "Total",
    payable: "To pay",
    saveVisit: "Save booking",
    visitTab: "Visit",
    search: "Search",
    searchService: "Service name",
    serviceSearchEmpty: "Service not found.",
    clientNameOrPhone: "Name or phone",
    addNewClient: "Add new client",
    addAndSelectClient: "Add and select",
    createClientFromSearch: "Create client",
    noClientFound: "No client found. You can create a new one.",
    newClientFormTitle: "New client",
    newClientFormHint: "Add the details and the client will be selected for this visit.",
    formOpened: "Form is open below",
    clientName: "Client name",
    withoutService: "Without service",
    setupAssistant: "Setup assistant",
    setupAssistantText: "Finish the steps so your profile is ready for online booking.",
    setupCompleteTitle: "Profile is ready for online booking",
    setupCompleteText: "Clients can already book through your link.",
    setupProgress: "Readiness",
    setupServices: "Add services",
    setupSchedule: "Set schedule",
    setupBooking: "Enable online booking",
    setupPhoto: "Add business photos",
    setupAddress: "Add address",
    setupTelegram: "Connect Telegram",
    staffSchedule: "Shift schedule",
    staffScheduleHint: "Manage team working days like in the web workspace.",
    teamMembers: "Members",
    teamMembersHint: "Add employees, edit contacts, role, and workspace access.",
    allTeam: "Whole team",
    showWholeTeam: "Show the full team",
    selectedMasters: "Selected masters",
    addMember: "Invite",
    editMember: "Edit employee",
    saveMember: "Save employee",
    fullName: "Full name",
    role: "Role",
    workspaceAccess: "Access",
    invite: "Invite",
    resendInvite: "Resend invite",
    revokeInvite: "Revoke invite",
    sendInvite: "Enter an email. The employee fills in the rest after accepting.",
    pendingInvites: "Sent invitations",
    incomingInvites: "Received invitations",
    noIncomingInvites: "No one has invited you yet.",
    noInvites: "You have not invited anyone yet.",
    removeMember: "Remove from team",
    removeMemberConfirm: "Remove this employee from the team? Their account will remain standalone.",
    removeMemberSuccess: "Employee removed from the team.",
    memberCompanyEyebrow: "My team",
    memberCompanyTitle: "You are in",
    memberCompanyRole: "Role",
    memberCompanyJoined: "Joined",
    leaveCompany: "Leave company",
    leaveCompanyConfirm: "Leave this company? Workspace access will be closed.",
    leaveCompanySuccess: "You left the company.",
    acceptInvite: "Accept",
    declineInvite: "Decline",
    monthBookings: "Month bookings",
    upcomingBookings: "Upcoming bookings",
    scheduleMenu: "Schedule",
    currentWeek: "This week",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    chooseWeek: "Choose week",
    repeatingSchedule: "Repeating schedule",
    oneWeekSchedule: "Calendar week",
    applyToWeekdays: "Apply to weekdays",
    clearWeek: "Clear week",
    noWork: "Off",
    workIntervals: "Working interval",
    addWorkTime: "Add time",
    removeWorkTime: "Remove working interval",
    monthPlanner: "Month work days",
    selectedDays: "Selected days",
    applyToSelectedDays: "Apply to selected",
    selectedDaysHint: "Select month days and apply the same working intervals to them.",
    noRoomForInterval: "No room for another interval.",
    invalidIntervalRange: "End must be later than start.",
    overlappingIntervals: "Intervals cannot overlap.",
    addBreak: "Add time",
    removeBreak: "Remove working interval",
    onThisWeek: "This week",
    saveSchedule: "Save schedule",
    workFrom: "From",
    workTo: "To",
    breakFrom: "Working interval from",
    breakTo: "To",
    owner: "Owner",
    employee: "Employee",
    hoursShort: "h",
    workingDay: "Working day",
    dayOff: "Day off",
    dayOffTitle: "Day off",
    bookingUnavailable: "Booking unavailable",
    dayOffMessage: "Today is your day off.",
    configureSchedule: "Configure schedule",
    bookingPage: "Company page",
    bookingPageText: "Client link and online booking switch.",
    onlineBookingOn: "Online booking is on",
    onlineBookingOff: "Online booking is off",
    openPage: "Open page",
    sharePage: "Share",
    supportTitle: "Timviz support",
    supportGuideTitle: "Write to support",
    supportGuideText: "Describe what you are doing, where the issue appeared, and what should happen.",
    supportGreeting: "Hi! Ask us about your account, bookings, settings, or subscription. We will help.",
    supportPlaceholder: "Write your question in one message...",
    supportSend: "Send",
    supportSent: "Message sent.",
    supportFailed: "Could not send the message.",
    notificationPendingBookings: "Pending online bookings",
    notificationsNew: "New",
    notificationsArchive: "Archive",
    notificationEmpty: "There are no new updates yet.",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    confirmBooking: "Confirm",
    cancelBooking: "Cancel booking",
    companySettings: "Company settings",
    helpSupport: "Help & Legal",
    profile: "Profile",
    subscription: "Subscription",
    company: "Company",
    support: "Support",
    timvizWebsite: "Timviz website",
    privacyPolicy: "Privacy Policy",
    termsOfUse: "Terms of Use",
    subscriptionTerms: "Subscription Terms",
    refundPolicy: "Refund Policy",
    accountDeletion: "Account deletion",
    dangerZone: "Danger zone",
    deleteAccountIntroTitle: "What will be deleted",
    deleteAccountIntroText: "This action will delete your Timviz account and related personal data that we are not legally required to keep.",
    deleteAccountRemovedItems: "Profile, settings, services, clients, appointments, and team.",
    deleteAccountKeptItems: "Payment records may be retained where required by law.",
    deletionUnderstand: "I understand this action cannot be undone",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountText: "This will delete your account and related personal data that we are not legally required to keep. Type DELETE to confirm.",
    deleteAccountConfirmPlaceholder: "DELETE",
    deleteAccountConfirm: "Confirm deletion",
    deleteAccountFailed: "Could not delete account.",
    language: "Language",
    compact: "Compact",
    dayView: "Day",
    detailed: "Detailed",
    threeDays: "3 days",
    weekView: "Week",
    monthView: "Month",
    selected: "Selected",
    visits: "visits",
    closedBySchedule: "Closed",
    ready: "Done",
    reminders: "Alerts",
    addVisit: "Add booking",
    customer: "Client",
    service: "Service",
    start: "Start",
    end: "End",
    save: "Save",
    cancel: "Cancel",
    noAppointments: "No bookings for this day yet.",
    recent: "Recent bookings",
    addService: "Add service",
    yourServices: "Your services",
    ownService: "Custom service",
    generalCatalog: "Global catalog",
    serviceName: "Service name",
    category: "Category",
    newCategory: "New category",
    selectedCategory: "Selected category",
    similarServices: "Similar services",
    serviceCategory: "Service category",
    looksLikeCategory: "Looks like this category:",
    useCategory: "Use",
    cantFindCategory: "Can’t find category",
    customCategory: "Custom category",
    enterCategoryName: "Enter category name",
    customCategoryHint: "Create a custom category only if it is not in the list.",
    similarCategoryExists: "Looks like this category already exists:",
    similarServiceExists: "Similar service already exists",
    serviceAlreadyExistsSuffix: "already exists in your services",
    openExistingService: "Open existing",
    createNewAnyway: "Create new anyway",
    chooseServiceCategoryOrAddCustom: "Choose a service category or add your own.",
    serviceNameRequired: "Enter service name.",
    durationRequired: "Enter duration.",
    editService: "Edit service",
    saveService: "Save service",
    addFromCatalog: "Add",
    alreadyAdded: "Already added",
    catalogHint: "Choose a ready-made service.",
    myServicesHint: "Edit price, duration, and availability.",
    price: "Price",
    duration: "Minutes",
    delete: "Delete",
    addClient: "Add client",
    editClient: "Edit client",
    deleteClient: "Delete client",
    deleteClientConfirm: "Delete this client card?",
    clientFromAppointmentsCannotDelete: "This client is created from bookings. To remove it, edit or delete the related bookings.",
    connected: "Connected",
    notConnected: "Not connected",
    telegramHint: "Telegram connection is managed in workspace settings. The app shows the current status.",
    onlineBooking: "Online booking",
    address: "Address",
    publicPage: "Booking page",
    settingsSaved: "Changes saved",
    settingsSaving: "Saving...",
    settingsSaveError: "Could not save settings.",
    premiumSubscription: "Premium subscription",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium active",
    premiumSubscriptionTrial: "Trial period",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "New accounts get 14 days of Premium for free. Free includes 100 appointments every month, Pro keeps tools open without limits.",
    bookingLimitTitle: "This month's appointments",
    bookingLimitFreeText: "Free includes 100 appointments per month. The limit refreshes at the start of next month.",
    bookingLimitPremiumText: "Premium does not spend appointment credits: work without limits.",
    bookingLimitEndedTitle: "Appointments are used up for this month",
    bookingLimitEndedText: "Get Pro to create unlimited appointments and unlock online booking, Telegram, and reminders.",
    bookingLimitRemaining: "Remaining",
    bookingLimitUsed: "Used",
    bookingLimitLimit: "Limit",
    unlimitedShort: "unlim",
    premiumTrialIncluded: "14 days of Premium free",
    premiumTrialDaysLeft: "{count} days of Premium left",
    premiumTrialOneDayLeft: "Last day of Premium",
    premiumTrialExpired: "Premium trial ended",
    premiumUpgradeCta: "Get Pro",
    premiumLockedBadge: "Pro",
    premiumFeatureBenefitsTitle: "Pro unlocks",
    premiumBenefitOnlineBooking: "online booking and unlimited appointments beyond Free",
    premiumBenefitReminders: "push and Telegram reminders",
    premiumBenefitTeam: "more employees, schedules, and roles",
    premiumBenefitClients: "advanced business tools for growth",
    premiumYearlyNudge: "The yearly plan is better value when you plan to run Timviz continuously.",
    premiumFeatureClientsTitle: "Client base is included in Free",
    premiumFeatureClientsText: "Save clients, create repeat bookings, and keep basic history without Pro.",
    premiumFeatureStaffTitle: "More employees are available in Pro",
    premiumFeatureStaffText: "Free keeps the owner and 1 employee. Pro opens a larger team, roles, and schedules beyond the Free limit.",
    premiumFeatureOnlineTitle: "Online booking is available in Pro",
    premiumFeatureOnlineText: "Free keeps manual calendar bookings. Pro unlocks the client link for self-booking.",
    premiumFeatureScheduleTitle: "Advanced calendar is available in Pro",
    premiumFeatureScheduleText: "Free includes the basic calendar. Pro unlocks advanced schedules, work modes, and team planning.",
    premiumFeaturePushTitle: "Push reminders are available in Pro",
    premiumFeaturePushText: "Enable notifications for new, rescheduled, and cancelled bookings.",
    premiumFeatureTelegramTitle: "Telegram notifications are available in Pro",
    premiumFeatureTelegramText: "Receive bookings and reminders in Telegram after upgrading to Pro.",
    premiumFeatureAddressTitle: "Address and map are included in Free",
    premiumFeatureAddressText: "Show clients your address, entrance details, and map on the booking page without Pro.",
    premiumMonthly: "Premium Monthly",
    premiumYearly: "Premium Yearly",
    premiumMonthlyFallback: "$3 / month",
    premiumYearlyFallback: "$29 / year",
    premiumStartMonthly: "Start monthly",
    premiumStartYearly: "Start yearly",
    premiumRestore: "Restore purchase",
    premiumManage: "Manage the subscription in your app store.",
    subscriptionAutoRenewText: "Subscription renews automatically unless cancelled at least 24 hours before the end of the current period. You can manage or cancel it in your app store settings.",
    premiumReady: "Premium updated.",
    premiumUnavailable: "Purchases are available in app store builds.",
    premiumMissingConfig: "The app store purchase is still being prepared. Try again after products finish processing.",
    premiumPurchaseCancelled: "Purchase cancelled.",
    premiumSyncFailed: "Could not sync subscription.",
    settingsGeneral: "Company settings",
    settingsOnline: "Online booking",
    settingsServices: "Services",
    settingsSchedule: "Schedule",
    settingsPush: "Push",
    settingsTelegram: "Telegram",
    settingsAddress: "Address",
    profileAndBusiness: "Profile and business",
    ownerContacts: "Owner contacts",
    avatarLink: "Master avatar",
    avatarHint: "The photo appears in the calendar, master card, and top menu.",
    changeAvatar: "Change avatar",
    deleteAvatar: "Delete avatar",
    avatarPermission: "Allow photo access to change the avatar.",
    newPassword: "New password",
    leaveBlankPassword: "leave blank if unchanged",
    businessFormat: "Name and format",
    website: "Website",
    accountType: "Account type",
    soloAccount: "I work alone",
    teamAccount: "Team",
    serviceMode: "Work format",
    categoriesText: "Categories",
    categoriesHint: "Choose one or several categories from the catalog",
    localization: "Country, language and currency",
    country: "Country",
    timezone: "Timezone",
    currency: "Currency",
    saveSettings: "Save settings",
    publicLink: "Public link",
    copyLink: "Copy",
    manageServices: "Manage services",
    manageSchedule: "Manage schedule",
    joinRequests: "Join requests",
    noJoinRequests: "There are no new requests yet.",
    approve: "Approve",
    reject: "Reject",
    businessPhotos: "Business photos",
    photosHint: "The first photos appear on the online booking page.",
    businessPhotoUploadTitle: "Add business photo",
    businessPhotoUploadSubtitle: "Profiles with photos look more professional",
    businessPhotoSourceTitle: "Add photo from",
    businessPhotoFromCamera: "Take a photo",
    businessPhotoFromGallery: "Choose from gallery",
    businessPhotoDropHint: "On desktop you can drop a photo here",
    addMorePhoto: "Add another photo",
    businessPhotoActionsTitle: "Photo actions",
    streetAddress: "Address",
    addressDetails: "Address details",
    mapCoordinates: "Coordinates are saved from the website; the app edits the text address.",
    ownerOnlyHint: "Only the account owner can change business settings.",
    launchChecklist: "Launch checklist",
    profileReady: "Profile ready",
    completedSteps: "completed",
    photoUrl: "Photo link",
    photoCaption: "Photo caption",
    addPhotoUrl: "Add photo by link",
    addPhoto: "Add photo",
    uploadPhoto: "Upload photo",
    photoUploading: "Uploading photo...",
    makePrimary: "Make primary",
    primaryPhoto: "Primary photo",
    addressSearch: "Find address on map",
    addressPlaceholder: "Start typing a real address",
    searchingAddress: "Searching address...",
    selectAddress: "Choose address",
    selectedAddress: "Selected address",
    streetHouse: "House, street",
    city: "City",
    region: "Region",
    postcode: "Postcode",
    openMap: "Open map",
    telegramConnectButton: "Connect bot",
    telegramOpenBot: "Open bot",
    telegramCopyLink: "Copy link",
    telegramRefreshLink: "Refresh link",
    telegramTokenExpires: "Link active until",
    telegramSectionNotifications: "Notifications",
    telegramSectionReminders: "Reminders",
    telegramSectionSupport: "Support",
    telegramNotificationsHint: "Telegram events.",
    telegramOnlineBookings: "New online bookings",
    telegramCabinetBookings: "New workspace bookings",
    telegramRescheduled: "Booking time changed",
    telegramCancelled: "Booking cancelled",
    telegramRemindersHint: "Appointment reminders.",
    telegramReminders: "Reminder before booking",
    telegramToday: "Today summary",
    telegramReminderLead: "Reminder time",
    telegramSupportHint: "Client and support questions can arrive directly in Telegram.",
    telegramForwarding: "Forward support to Telegram",
    telegramSaved: "Telegram updated",
    telegramSaveFailed: "Could not update Telegram.",
    pushTitle: "App notifications",
    pushHint: "New bookings and changes on your phone.",
    pushEnable: "Enable notifications",
    pushEnabled: "Notifications enabled",
    pushDisabled: "Notifications disabled",
    pushPermissionDenied: "Allow notifications in phone settings.",
    pushSaved: "Notifications updated",
    pushSaveFailed: "Could not update notifications.",
    pushOpenSettings: "Open phone settings",
    pushDeviceCount: "Devices",
    pushProjectMissing: "Expo projectId is not configured for push notifications. Add EXPO_PUBLIC_EAS_PROJECT_ID to the app configuration.",
    pushIosCapabilityMissing: "Push notifications need a new TestFlight build with Push Notifications enabled in Apple Developer.",
    minutesBefore: "min before",
    hoursBefore: "h before",
    dayBefore: "one day before",
    minutesShort: "min",
    defaultServiceCategory: "Uncategorized",
    serviceModeOnsite: "Clients come to my location",
    serviceModeTravel: "I travel to clients",
    serviceModeOnline: "I provide services online",
    calendarHeaderTitle: "Calendar",
    loadWorkspaceFailed: "Failed to load workspace.",
    empty: "Empty for now",
    emptyCalendarTitle: "No bookings yet",
    emptyCalendarText: "Tap + to add the first visit",
    noBookingsToday: "No appointments today",
    noBookingsTodaySpark: "No appointments today ✨",
    fillFreeWindowsText: "It is a good time to fill your open slots.",
    noBookingsThisDay: "No bookings for this day",
    calendarNoServicesText: "Add services and prices so everything is ready before the first appointment.",
    calendarEmptyActionText: "Add your first visit or set up services for online booking.",
    createBooking: "Create booking",
    createAppointmentButton: "+ Create appointment",
    firstRunCalendarTitle: "Start with a service",
    firstRunCalendarText: "Start with priced services: bookings become faster to create and clearer for clients online.",
    addFirstVisit: "Add first visit",
    quickVisit: "Quick booking",
    createVisitWithoutService: "Create booking without service",
    onboardingStartTitle: "Add your service catalog",
    onboardingStartText: "Before the first appointment, add services, duration, and prices. Bookings will be faster to create, and clients will understand what they are booking.",
    firstAppointmentCreated: "🎉 First appointment created",
    addServiceFirstTitle: "Add a service first",
    addServiceFirstText: "You do not have services yet. Add your first service with duration and price.",
    servicesEmptyPickerTitle: "No services yet",
    servicesEmptyPickerText: "Add your first service with duration and price, then create the booking.",
    createServiceAction: "Create service",
    bookingWithoutService: "Booking without service",
    firstServiceTitle: "Add your first service",
    firstServiceText: "Choose services from the catalog, check durations, and set prices. After that you can create bookings quickly and enable online booking.",
    chooseFromCatalog: "Choose from catalog",
    createOwnService: "Create custom service",
    servicesMineShort: "Mine",
    servicesCreateShort: "Create",
    servicesCatalogShort: "Catalog",
    serviceSuggestionManicure: "Manicure",
    serviceSuggestionHaircut: "Haircut",
    serviceSuggestionConsultation: "Consultation",
    clientsEmptyTitle: "No clients yet",
    clientsEmptyText: "A client appears after the first booking, or you can add one manually.",
    setupRemaining: "{count} steps left",
    setupFirstServiceText: "Add services first - this unlocks faster bookings and online booking.",
  },
} satisfies Record<BaseAppLanguage, Record<string, string>>;

const generatedMobileCopy = {
  fr: {
    login: "Connectez-vous",
    register: "Créer un compte",
    registerShort: "Créer",
    newMasterCta: "Nouveau pro ? Créer un compte",
    registerMasterCta: "Créer un compte pro",
    optionalDetails: "Plus de détails",
    email: "Email",
    password: "Mot de passe",
    firstName: "Prénom",
    lastName: "Nom",
    phone: "Téléphone",
    phoneCountry: "Pays",
    selectCountryCode: "Indicatif du pays",
    searchCountryOrCode: "Pays ou code",
    customPhonePrefix: "Code personnalisé",
    customPhonePrefixHint: "Utilisez ceci pour un préfixe non standard",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Utilisez le code",
    allCountries: "Tous les pays",
    companyName: "Business nom",
    continue: "Continuer",
    creating: "Création...",
    signingIn: "Connexion...",
    calendar: "Calendrier",
    clients: "Clients",
    services: "Services",
    staff: "Équipe",
    settings: "Paramètres",
    moreTab: "Plus",
    signOut: "Déconnexion",
    requiredTitle: "Détails manquants",
    requiredText: "Remplissez tous les champs.",
    loginError: "Erreur de connexion",
    registerError: "Erreur d'enregistrement",
    passwordHint: "Au moins 6 caractères",
    proTitle: "Timviz pour les pros",
    proSubtitle: "Calendrier, services, clients et alertes dans une seule application.",
    dashboard: "Espace de travail",
    home: "Accueil",
    today: "Aujourd'hui",
    week: "Semaine",
    month: "Mois",
    newVisit: "Nouvelle visite",
    editVisit: "Modifier rendez-vous",
    bookTime: "Réserver une heure",
    addBlockedTime: "Ajouter une heure indisponible",
    reservedTime: "Heure réservée",
    unavailableTime: "Heure indisponible",
    chooseClient: "Choisir un client",
    withoutClient: "Aucun client",
    quickBookingWithoutClient: "Réservation rapide sans client",
    chooseClientLater: "Vous pouvez choisir un client plus tard",
    chooseService: "Choisir le service",
    comment: "Commentaire",
    addAnotherService: "Ajouter un autre service +",
    total: "Total",
    payable: "Payer",
    saveVisit: "Enregistrer la réservation",
    visitTab: "Visiter",
    search: "Rechercher",
    searchService: "Nom du service",
    serviceSearchEmpty: "Service introuvable.",
    clientNameOrPhone: "Nom ou téléphone",
    addNewClient: "Ajouter un nouveau client",
    addAndSelectClient: "Ajoutez et sélectionnez",
    createClientFromSearch: "Créer un client",
    noClientFound: "Aucun client trouvé. Vous pouvez en créer un nouveau.",
    newClientFormTitle: "Nouveau client",
    newClientFormHint: "Ajoutez les détails et le client sera sélectionné pour cette visite. Le formulaire",
    formOpened: "est ouvert ci-dessous",
    clientName: "Nom du client",
    withoutService: "Sans service",
    setupAssistant: "Assistant de configuration",
    setupAssistantText: "Terminez les étapes pour que votre profil soit prêt pour la réservation en ligne.",
    setupCompleteTitle: "Le profil est prêt pour la réservation en ligne",
    setupCompleteText: "Les clients peuvent déjà réserver via votre lien.",
    setupProgress: "Préparation",
    setupServices: "Ajouter des services",
    setupSchedule: "Définir le calendrier",
    setupBooking: "Activer la réservation en ligne",
    setupPhoto: "Ajouter des photos",
    setupAddress: "Ajouter une adresse",
    setupTelegram: "Connect Telegram",
    staffSchedule: "Horaire des équipes",
    staffScheduleHint: "Gérez les jours de travail de l'équipe comme dans l'espace de travail Web.",
    teamMembers: "Membres",
    teamMembersHint: "Ajoutez des employés, modifiez les contacts, les rôles et l'accès à l'espace de travail.",
    allTeam: "Toute l'équipe",
    showWholeTeam: "Afficher l'équipe complète",
    selectedMasters: "Maîtres sélectionnés",
    addMember: "Ajouter un employé",
    editMember: "Modifier l'employé",
    saveMember: "Enregistrer l'employé",
    fullName: "Nom complet",
    role: "Rôle",
    workspaceAccess: "Accès",
    invite: "Inviter",
    resendInvite: "Renvoyer l'invitation",
    revokeInvite: "Révoquer l'invitation",
    sendInvite: "Envoyer une invitation par e-mail",
    pendingInvites: "Invitations en attente",
    monthBookings: "Réservations mensuelles",
    upcomingBookings: "Réservations à venir",
    scheduleMenu: "Calendrier",
    currentWeek: "Cette semaine",
    previousWeek: "Semaine précédente",
    nextWeek: "Semaine prochaine",
    chooseWeek: "Choisir la semaine",
    repeatingSchedule: "Programme répétitif",
    oneWeekSchedule: "Semaine civile",
    applyToWeekdays: "Appliquer aux jours de la semaine",
    clearWeek: "Semaine claire",
    noWork: "Désactivé",
    workIntervals: "Temps de travail",
    addWorkTime: "Ajouter du temps",
    removeWorkTime: "Supprimer l'intervalle",
    monthPlanner: "Mois jours de travail",
    selectedDays: "Jours sélectionnés",
    applyToSelectedDays: "Appliquer à la sélection",
    selectedDaysHint: "Sélectionnez les jours du mois et appliquez-leur les mêmes intervalles de travail.",
    noRoomForInterval: "Pas de place pour un autre intervalle.",
    invalidIntervalRange: "La fin doit être postérieure au début.",
    overlappingIntervals: "Les intervalles ne peuvent pas se chevaucher.",
    addBreak: "Ajouter du temps",
    removeBreak: "Supprimer l'intervalle",
    onThisWeek: "Cette semaine",
    saveSchedule: "Enregistrer le programme",
    workFrom: "De",
    workTo: "À",
    breakFrom: "Intervalle de",
    breakTo: "À",
    owner: "Propriétaire",
    employee: "Employé",
    hoursShort: "h",
    workingDay: "Jour ouvrable",
    dayOff: "Jour de congé",
    dayOffTitle: "Jour de congé",
    bookingUnavailable: "Réservation indisponible",
    dayOffMessage: "Aujourd'hui, c'est votre jour de congé.",
    configureSchedule: "Configurer le planning",
    bookingPage: "Page Entreprise",
    bookingPageText: "Lien client et commutateur de réservation en ligne.",
    onlineBookingOn: "La réservation en ligne est activée",
    onlineBookingOff: "La réservation en ligne est désactivée",
    openPage: "Ouvrir la page",
    sharePage: "Partager",
    supportTitle: "Support Timviz",
    supportGuideTitle: "Écrivez au support",
    supportGuideText: "Décrivez ce que vous faites, où le problème est apparu et ce qui devrait arriver.",
    supportGreeting: "Salut ! Posez une question sur votre compte, les réservations, les paramètres ou l'abonnement. Nous allons vous aider.",
    supportPlaceholder: "Écrivez votre question dans un seul message...",
    supportSend: "Envoyer",
    supportSent: "Message envoyé.",
    supportFailed: "Impossible d'envoyer le message.",
    notificationPendingBookings: "Réservations en ligne en attente",
    notificationsNew: "Nouvelle",
    notificationsArchive: "Archive",
    notificationEmpty: "Il n'y a pas encore de nouvelles mises à jour.",
    statusPending: "En attente",
    statusConfirmed: "Confirmé",
    statusCancelled: "Annulé",
    confirmBooking: "Confirmer",
    cancelBooking: "Annuler la réservation",
    companySettings: "Paramètres de l'entreprise",
    helpSupport: "Aide et support",
    language: "Langue",
    compact: "Compact",
    dayView: "Jour",
    detailed: "Détaillé",
    threeDays: "3 jours",
    weekView: "Semaine",
    monthView: "Mois",
    selected: "Visites",
    visits: "sélectionnées",
    closedBySchedule: "Fermé",
    ready: "Terminé",
    reminders: "Alertes",
    addVisit: "Ajouter une réservation",
    customer: "Client",
    service: "Service",
    start: "Début",
    end: "Fin",
    save: "Enregistrer",
    cancel: "Annuler",
    noAppointments: "Aucune réservation pour ce jour pour l'instant.",
    recent: "Réservations récentes",
    addService: "Ajouter un service",
    yourServices: "Vos services",
    ownService: "Service personnalisé",
    generalCatalog: "Catalogue global",
    serviceName: "Nom du service",
    serviceCategory: "Catégorie du service",
    cantFindCategory: "Je ne trouve pas la catégorie",
    customCategory: "Catégorie personnalisée",
    enterCategoryName: "Saisissez le nom de la catégorie",
    customCategoryHint: "Créez une catégorie personnalisée seulement si elle n'existe pas dans la liste.",
    category: "Catégorie",
    newCategory: "Nouvelle catégorie",
    selectedCategory: "Catégorie sélectionnée",
    editService: "Modifier le service",
    saveService: "Enregistrer le service",
    addFromCatalog: "Ajouter",
    alreadyAdded: "Ajouté",
    catalogHint: "Choisissez un service prêt.",
    myServicesHint: "Modifiez le prix, la durée et la disponibilité.",
    price: "Price",
    duration: "Minutes",
    delete: "Supprimer",
    addClient: "Ajouter un client",
    editClient: "Modifier le client",
    deleteClient: "Supprimer le client",
    deleteClientConfirm: "Supprimer cette fiche client ?",
    clientFromAppointmentsCannotDelete: "Ce client vient des rendez-vous. Pour le retirer, modifiez ou supprimez les rendez-vous liés.",
    connected: "Connecté",
    notConnected: "Non connecté",
    telegramHint: "La connexion Telegram est gérée dans les paramètres de l'espace de travail. L'application affiche l'état actuel.",
    onlineBooking: "Réservation en ligne",
    address: "Adresse",
    publicPage: "Page de réservation",
    settingsSaved: "Modifications enregistrées",
    settingsSaving: "Enregistrement...",
    settingsSaveError: "Impossible d'enregistrer les paramètres.",
    premiumSubscription: "Abonnement Premium",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium actif",
    premiumSubscriptionTrial: "Période d'essai",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Premium fonctionne dans l'application et sur le site.",
    premiumMonthly: "Premium mensuel",
    premiumYearly: "Premium annuel",
    premiumMonthlyFallback: "3 $ / mois",
    premiumYearlyFallback: "29 $ / an",
    premiumStartMonthly: "Démarrer mensuellement",
    premiumStartYearly: "Démarrer annuellement",
    premiumRestore: "Restaurer l'achat",
    premiumManage: "Gérer l'abonnement dans votre boutique d'applications.",
    premiumReady: "Premium mis à jour.",
    premiumUnavailable: "Les achats sont disponibles dans les builds de boutique d'applications.",
    premiumMissingConfig: "L’achat en boutique d'applications est encore en préparation. Réessayez après le traitement des produits.",
    premiumPurchaseCancelled: "Achat annulé.",
    premiumSyncFailed: "Impossible de synchroniser l'abonnement.",
    settingsGeneral: "Paramètres de l'entreprise",
    settingsOnline: "Réservation en ligne",
    settingsServices: "Services",
    settingsSchedule: "Calendrier",
    settingsTelegram: "Télégramme",
    settingsAddress: "Adresse",
    profileAndBusiness: "Profil et activité",
    ownerContacts: "Contacts du propriétaire",
    avatarLink: "Avatar principal",
    avatarHint: "La photo apparaît dans le calendrier, la carte principale et le menu supérieur.",
    changeAvatar: "Changer d'avatar",
    deleteAvatar: "Supprimer l'avatar",
    avatarPermission: "Autoriser l'accès aux photos pour modifier l'avatar.",
    newPassword: "Nouveau mot de passe",
    leaveBlankPassword: "laisser vide si inchangé",
    businessFormat: "Nom et format",
    website: "Site Web",
    accountType: "Type de compte",
    soloAccount: "Je travaille seul",
    teamAccount: "Équipe",
    serviceMode: "Format de travail",
    categoriesText: "Catégories",
    categoriesHint: "Choisissez une ou plusieurs catégories du catalogue",
    localization: "Pays, langue et devise",
    country: "Pays",
    timezone: "Fuseau horaire",
    currency: "Devise",
    saveSettings: "Enregistrer les paramètres",
    publicLink: "Lien public",
    copyLink: "Copier",
    manageServices: "Gérer les services",
    manageSchedule: "Gérer le planning",
    joinRequests: "Demandes d'adhésion",
    noJoinRequests: "Il n'y a pas encore de nouvelles demandes.",
    approve: "Approuver",
    reject: "Rejeter",
    businessPhotos: "Photos professionnelles",
    photosHint: "Les premières photos apparaissent sur la page de réservation en ligne.",
    businessPhotoUploadTitle: "Ajouter une photo",
    businessPhotoUploadSubtitle: "Les profils avec photos attirent plus de clients",
    businessPhotoSourceTitle: "Ajouter une photo depuis",
    businessPhotoFromCamera: "Prendre une photo",
    businessPhotoFromGallery: "Choisir dans la galerie",
    businessPhotoDropHint: "Sur ordinateur, vous pouvez déposer une photo ici",
    addMorePhoto: "Ajouter une autre photo",
    businessPhotoActionsTitle: "Actions photo",
    streetAddress: "Adresse",
    addressDetails: "Détails de l'adresse",
    mapCoordinates: "Les coordonnées sont enregistrées à partir du site Web ; l'application modifie l'adresse texte.",
    ownerOnlyHint: "Seul le propriétaire du compte peut modifier les paramètres de l'entreprise.",
    launchChecklist: "Liste de contrôle de lancement",
    profileReady: "Profil prêt",
    completedSteps: "terminé",
    photoUrl: "Lien photo",
    photoCaption: "Légende de la photo",
    addPhotoUrl: "Ajouter une photo par lien",
    addPhoto: "Ajouter une photo",
    uploadPhoto: "Télécharger une photo",
    photoUploading: "Téléversement de la photo...",
    makePrimary: "Rendre primaire",
    primaryPhoto: "Photo principale",
    addressSearch: "Trouver l'adresse sur la carte",
    addressPlaceholder: "Commencez à saisir une adresse réelle",
    searchingAddress: "Recherche d'adresse...",
    selectAddress: "Choisissez l'adresse",
    selectedAddress: "Adresse sélectionnée",
    streetHouse: "Maison, rue",
    city: "Ville",
    region: "Région",
    postcode: "Code postal",
    openMap: "Ouvrir la carte",
    telegramConnectButton: "Connecter le bot",
    telegramOpenBot: "Ouvrir le bot",
    telegramCopyLink: "Copier le lien",
    telegramRefreshLink: "Actualiser le lien",
    telegramTokenExpires: "Lien actif jusqu'à",
    telegramSectionNotifications: "Notifications",
    telegramSectionReminders: "Rappels",
    telegramSectionSupport: "Support",
    telegramNotificationsHint: "Choisir les événements que le bot doit envoyer au télégramme.",
    telegramOnlineBookings: "Nouvelles réservations en ligne",
    telegramCabinetBookings: "Nouvelles réservations d'espace de travail",
    telegramRescheduled: "Heure de réservation modifiée",
    telegramCancelled: "Réservation annulée",
    telegramRemindersHint: "Les rappels vous aident à éviter de manquer les visites à venir.",
    telegramReminders: "Rappel avant de réserver",
    telegramToday: "Résumé du jour",
    telegramReminderLead: "Heure de rappel",
    telegramSupportHint: "Les questions des clients et de l'assistance peuvent arriver directement dans Telegram.",
    telegramForwarding: "Transférer le support vers Telegram",
    telegramSaved: "Telegram mis à jour",
    telegramSaveFailed: "Impossible de mettre à jour Telegram.",
    minutesBefore: "min avant",
    hoursBefore: "h avant",
    dayBefore: "un jour avant",
    minutesShort: "min",
    defaultServiceCategory: "Non classé",
    serviceModeOnsite: "Les clients viennent chez moi",
    serviceModeTravel: "Je me déplace chez les clients",
    serviceModeOnline: "Je fournis des services en ligne",
    calendarHeaderTitle: "Calendrier",
    loadWorkspaceFailed: "Échec du chargement de l'espace de travail.",
    empty: "Vide pour l'instant",
    emptyCalendarTitle: "Aucune réservation pour l'instant",
    emptyCalendarText: "Appuyez sur + pour ajouter la première visite",
    noBookingsToday: "Pas de rendez-vous aujourd'hui",
    noBookingsTodaySpark: "Pas de rendez-vous aujourd'hui ✨",
    fillFreeWindowsText: "C'est le bon moment pour combler vos créneaux libres.",
    noBookingsThisDay: "Aucune réservation pour ce jour",
    calendarNoServicesText: "Ajoutez vos services et vos prix afin que tout soit prêt avant le premier rendez-vous.",
    calendarEmptyActionText: "Ajoutez votre première visite ou configurez des services de réservation en ligne.",
    createBooking: "Créer une réservation",
    createAppointmentButton: "+ Créer un rendez-vous",
    firstRunCalendarTitle: "Démarrer avec un service",
    firstRunCalendarText: "Commencez par des services avec prix : les réservations seront plus rapides à créer et plus claires pour les clients.",
    addFirstVisit: "Ajouter une première visite",
    quickVisit: "Réservation rapide",
    createVisitWithoutService: "Créer une réservation sans service",
    onboardingStartTitle: "Ajoutez votre catalogue de services",
    onboardingStartText: "Avant le premier rendez-vous, ajoutez les services, les durées et les prix. Les réservations seront plus rapides à créer et plus claires pour les clients.",
    firstAppointmentCreated: "🎉 Premier rendez-vous créé",
    addServiceFirstTitle: "Ajoutez d'abord un service",
    addServiceFirstText: "Vous n'avez pas encore de services. Ajoutez votre premier service avec une durée et un prix.",
    servicesEmptyPickerTitle: "Aucun service pour l'instant",
    servicesEmptyPickerText: "Ajoutez votre premier service avec une durée et un prix, puis créez la réservation.",
    createServiceAction: "Créer un service",
    bookingWithoutService: "Réservation sans service",
    firstServiceTitle: "Ajoutez votre premier service",
    firstServiceText: "Choisissez des services dans le catalogue, vérifiez les durées et indiquez les prix. Ensuite, vous pourrez créer des réservations rapidement et activer la réservation en ligne.",
    chooseFromCatalog: "Choisissez dans le catalogue",
    createOwnService: "Créer un service personnalisé",
    servicesMineShort: "Mes",
    servicesCreateShort: "Créer",
    servicesCatalogShort: "Catalogue",
    serviceSuggestionManicure: "Manucure",
    serviceSuggestionHaircut: "Coupe de cheveux",
    serviceSuggestionConsultation: "Consultation",
    clientsEmptyTitle: "Aucun client pour l'instant",
    clientsEmptyText: "Un client apparaît après la première réservation, ou vous pouvez en ajouter un manuellement.",
    setupRemaining: "{count} pas restants",
    setupFirstServiceText: "Ajoutez d'abord des services - cela débloque des réservations plus rapides et des réservations en ligne.",
  },
  pl: {
    login: "Zaloguj się",
    register: "Utwórz konto",
    registerShort: "Utwórz",
    newMasterCta: "Nowy profesjonalista? Utwórz konto",
    registerMasterCta: "Utwórz konto pro",
    optionalDetails: "Więcej szczegółów",
    email: "E-mail",
    password: "Hasło",
    firstName: "Imię",
    lastName: "Nazwisko",
    phone: "Telefon",
    phoneCountry: "Kraj",
    selectCountryCode: "Kod kraju",
    searchCountryOrCode: "Kraj lub kod",
    customPhonePrefix: "Kod niestandardowy",
    customPhonePrefixHint: "Użyj tego dla niestandardowego prefiksu",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Użyj kodu",
    allCountries: "Wszystkie kraje",
    companyName: "Biznes imię",
    continue: "Kontynuuj",
    creating: "Tworzenie...",
    signingIn: "Logowanie...",
    calendar: "Kalendarz",
    clients: "Klienci",
    services: "Usługi",
    staff: "Zespół",
    settings: "Ustawienia",
    moreTab: "Więcej",
    signOut: "Wyloguj się",
    requiredTitle: "Brakujące szczegóły",
    requiredText: "Wypełnij wszystkie pola.",
    loginError: "Błąd logowania",
    registerError: "Błąd rejestracji",
    passwordHint: "Co najmniej 6 znaków",
    proTitle: "Timviz dla profesjonalistów",
    proSubtitle: "Kalendarz, usługi, klienci i alerty w jednej aplikacji.",
    dashboard: "Przestrzeń do pracy",
    home: "Strona główna",
    today: "Dzisiaj",
    week: "Tydzień",
    month: "Miesiąc",
    newVisit: "Nowa wizyta",
    editVisit: "Edytuj wizytę",
    bookTime: "Zarezerwuj czas",
    addBlockedTime: "Dodaj niedostępny czas",
    reservedTime: "Zarezerwowany czas",
    unavailableTime: "Niedostępny czas",
    chooseClient: "Wybierz klienta",
    withoutClient: "Brak klienta",
    quickBookingWithoutClient: "Szybka rezerwacja bez klienta",
    chooseClientLater: "Możesz wybrać klienta później",
    chooseService: "Wybierz usługę",
    comment: "Skomentuj",
    addAnotherService: "Dodaj kolejną usługę +",
    total: "Razem",
    payable: "Aby zapłacić",
    saveVisit: "Zapisz rezerwację",
    visitTab: "Odwiedź",
    search: "Szukaj",
    searchService: "Nazwa usługi",
    serviceSearchEmpty: "Nie znaleziono usługi.",
    clientNameOrPhone: "Nazwa lub telefon",
    addNewClient: "Dodaj nowego klienta",
    addAndSelectClient: "Dodaj i wybierz",
    createClientFromSearch: "Utwórz klienta",
    noClientFound: "Nie znaleziono klienta. Możesz utworzyć nowy.",
    newClientFormTitle: "Nowy klient",
    newClientFormHint: "Dodaj szczegóły, a klient zostanie wybrany na tę wizytę. Formularz",
    formOpened: "jest otwarty poniżej",
    clientName: "Nazwa klienta",
    withoutService: "Bez usługi",
    setupAssistant: "Asystent konfiguracji",
    setupAssistantText: "Wykonaj te czynności, aby Twój profil był gotowy do rezerwacji online. Profil",
    setupCompleteTitle: "jest gotowy do rezerwacji online",
    setupCompleteText: "Klienci mogą już dokonywać rezerwacji poprzez Twój link.",
    setupProgress: "Gotowość",
    setupServices: "Dodaj usługi",
    setupSchedule: "Ustaw harmonogram",
    setupBooking: "Włącz rezerwację online",
    setupPhoto: "Dodaj zdjęcia firmy",
    setupAddress: "Dodaj adres",
    setupTelegram: "Połącz telegram",
    staffSchedule: "Harmonogram zmian",
    staffScheduleHint: "Zarządzaj dniami pracy zespołu jak w internetowym obszarze roboczym.",
    teamMembers: "Członkowie",
    teamMembersHint: "Dodawaj pracowników, edytuj kontakty, role i dostęp do przestrzeni roboczej.",
    allTeam: "Cały zespół",
    showWholeTeam: "Pokaż cały zespół",
    selectedMasters: "Wybrani mistrzowie",
    addMember: "Dodaj pracownika",
    editMember: "Edytuj pracownika",
    saveMember: "Zapisz pracownika",
    fullName: "Imię i nazwisko",
    role: "Rola",
    workspaceAccess: "Dostęp",
    invite: "Zaproś",
    resendInvite: "Wyślij ponownie zaproszenie",
    revokeInvite: "Odwołaj zaproszenie",
    sendInvite: "Wyślij zaproszenie e-mailem",
    pendingInvites: "Oczekujące zaproszenia",
    monthBookings: "Rezerwacje miesięczne",
    upcomingBookings: "Nadchodzące rezerwacje",
    scheduleMenu: "Harmonogram",
    currentWeek: "W tym tygodniu",
    previousWeek: "Poprzedni tydzień",
    nextWeek: "Następny tydzień",
    chooseWeek: "Wybierz tydzień",
    repeatingSchedule: "Powtarzający się harmonogram",
    oneWeekSchedule: "Tydzień kalendarzowy",
    applyToWeekdays: "Zastosuj do dni powszednich",
    clearWeek: "Wyczyść tydzień",
    noWork: "Wył.",
    workIntervals: "Czas pracy",
    addWorkTime: "Dodaj czas",
    removeWorkTime: "Usuń interwał pracy",
    monthPlanner: "Dni robocze miesiąca",
    selectedDays: "Wybrane dni",
    applyToSelectedDays: "Zastosuj do wybranych",
    selectedDaysHint: "Wybierz dni miesiąca i zastosuj do nich te same interwały robocze.",
    noRoomForInterval: "Nie ma miejsca na kolejny interwał.",
    invalidIntervalRange: "Koniec musi być późniejszy niż początek.",
    overlappingIntervals: "Przedziały nie mogą się nakładać.",
    addBreak: "Dodaj czas",
    removeBreak: "Usuń interwał pracy",
    onThisWeek: "W tym tygodniu",
    saveSchedule: "Zapisz harmonogram",
    workFrom: "Od",
    workTo: "Do",
    breakFrom: "Interwał od",
    breakTo: "Do",
    owner: "Właściciel",
    employee: "Pracownik",
    hoursShort: "h",
    workingDay: "Dzień roboczy",
    dayOff: "Dzień wolny",
    dayOffTitle: "Dzień wolny",
    bookingUnavailable: "Rezerwacja niedostępna",
    dayOffMessage: "Dziś jest Twój dzień wolny.",
    configureSchedule: "Skonfiguruj harmonogram",
    bookingPage: "Strona firmowa",
    bookingPageText: "Link do klienta i przełącznik rezerwacji online.",
    onlineBookingOn: "Rezerwacja online jest włączona",
    onlineBookingOff: "Rezerwacja online jest wyłączona",
    openPage: "Otwórz stronę",
    sharePage: "Udostępnij",
    supportTitle: "Wsparcie Timviz",
    supportGuideTitle: "Napisz do wsparcia",
    supportGuideText: "Opisz, co robisz, gdzie pojawił się problem i co powinno się wydarzyć.",
    supportGreeting: "Cześć! Zapytaj nas o konto, rezerwacje, ustawienia lub subskrypcję. Pomożemy.",
    supportPlaceholder: "Napisz swoje pytanie w jednej wiadomości...",
    supportSend: "Wyślij",
    supportSent: "Wiadomość wysłana.",
    supportFailed: "Nie można wysłać wiadomości.",
    notificationPendingBookings: "Oczekujące rezerwacje online",
    notificationsNew: "Nowe",
    notificationsArchive: "Archiwum",
    notificationEmpty: "Nie ma jeszcze żadnych nowych aktualizacji.",
    statusPending: "Oczekuje",
    statusConfirmed: "Potwierdzono",
    statusCancelled: "Anulowano",
    confirmBooking: "Potwierdź",
    cancelBooking: "Anuluj rezerwację",
    companySettings: "Ustawienia firmy",
    helpSupport: "Pomoc i wsparcie",
    language: "Język",
    compact: "Kompaktowy",
    dayView: "Dzień",
    detailed: "Szczegółowy",
    threeDays: "3 dni",
    weekView: "Tydzień",
    monthView: "Miesiąc",
    selected: "Wybrane",
    visits: "wizyt",
    closedBySchedule: "Zamknięte",
    ready: "Gotowe",
    reminders: "Powiadomienia",
    addVisit: "Dodaj rezerwację",
    customer: "Klient",
    service: "Usługa",
    start: "Start",
    end: "Koniec",
    save: "Zapisz",
    cancel: "Anuluj",
    noAppointments: "Nie ma jeszcze rezerwacji na ten dzień.",
    recent: "Ostatnie rezerwacje",
    addService: "Dodaj usługę",
    yourServices: "Twoje usługi",
    ownService: "Usługa niestandardowa",
    generalCatalog: "Katalog globalny",
    serviceName: "Nazwa usługi",
    serviceCategory: "Kategoria usługi",
    cantFindCategory: "Nie widzę kategorii",
    customCategory: "Własna kategoria",
    enterCategoryName: "Wpisz nazwę kategorii",
    customCategoryHint: "Utwórz własną kategorię tylko wtedy, gdy nie ma jej na liście.",
    category: "Kategoria",
    newCategory: "Nowa kategoria",
    selectedCategory: "Wybrana kategoria",
    editService: "Edytuj usługę",
    saveService: "Zapisz usługę",
    addFromCatalog: "Dodaj",
    alreadyAdded: "Dodano",
    catalogHint: "Wybierz gotową usługę.",
    myServicesHint: "Edytuj cenę, czas i dostępność.",
    price: "Cena",
    duration: "Minuty",
    delete: "Usuń",
    addClient: "Dodaj klienta",
    editClient: "Edytuj klienta",
    deleteClient: "Usuń klienta",
    deleteClientConfirm: "Usunąć tę kartę klienta?",
    clientFromAppointmentsCannotDelete: "Ten klient pochodzi z wizyt. Aby go usunąć, edytuj lub usuń powiązane wizyty.",
    connected: "Połączono",
    notConnected: "Nie połączono",
    telegramHint: "Połączeniem telegramowym zarządza się w ustawieniach obszaru roboczego. Aplikacja pokazuje aktualny stan.",
    onlineBooking: "Rezerwacja online",
    address: "Adres",
    publicPage: "Strona rezerwacji",
    settingsSaved: "Zmiany zapisane",
    settingsSaving: "Zapisywanie...",
    settingsSaveError: "Nie można zapisać ustawień.",
    premiumSubscription: "Subskrypcja premium",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium aktywna",
    premiumSubscriptionTrial: "Okres próbny",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Premium działa w aplikacji i na stronie.",
    premiumMonthly: "Premium miesięczny",
    premiumYearly: "Premium roczny",
    premiumMonthlyFallback: "3 USD / miesiąc",
    premiumYearlyFallback: "29 USD / rok",
    premiumStartMonthly: "Rozpocznij co miesiąc",
    premiumStartYearly: "Rozpocznij co rok",
    premiumRestore: "Przywróć zakup",
    premiumManage: "Zarządzaj subskrypcją w sklepie z aplikacjami.",
    premiumReady: "Premium zaktualizowano.",
    premiumUnavailable: "Zakupy są dostępne w buildach ze sklepu z aplikacjami.",
    premiumMissingConfig: "Zakup w sklepie z aplikacjami jest jeszcze przygotowywany. Spróbuj ponownie po przetworzeniu produktów.",
    premiumPurchaseCancelled: "Zakup anulowany.",
    premiumSyncFailed: "Nie można zsynchronizować subskrypcji.",
    settingsGeneral: "Ustawienia firmy",
    settingsOnline: "Rezerwacja online",
    settingsServices: "Usługi",
    settingsSchedule: "Harmonogram",
    settingsTelegram: "Telegram",
    settingsAddress: "Adres",
    profileAndBusiness: "Profil i firma",
    ownerContacts: "Kontakty właściciela",
    avatarLink: "Główny awatar",
    avatarHint: "Zdjęcie pojawia się w kalendarzu, karcie głównej i górnym menu.",
    changeAvatar: "Zmień awatar",
    deleteAvatar: "Usuń awatar",
    avatarPermission: "Zezwól na dostęp do zdjęć, aby zmienić awatar.",
    newPassword: "Nowe hasło",
    leaveBlankPassword: "pozostaw puste, jeśli niezmienione",
    businessFormat: "Nazwa i format",
    website: "Strona internetowa",
    accountType: "Typ konta",
    soloAccount: "Pracuję sam",
    teamAccount: "Zespół",
    serviceMode: "Format pracy",
    categoriesText: "Kategorie",
    categoriesHint: "Wybierz jedną lub kilka kategorii z katalogu",
    localization: "Kraj, język i waluta",
    country: "Kraj",
    timezone: "Strefa czasowa",
    currency: "Waluta",
    saveSettings: "Zapisz ustawienia",
    publicLink: "Link publiczny",
    copyLink: "Kopiuj",
    manageServices: "Zarządzaj usługami",
    manageSchedule: "Zarządzaj harmonogramem",
    joinRequests: "Dołącz do próśb",
    noJoinRequests: "Nie ma jeszcze żadnych nowych próśb.",
    approve: "Zatwierdź",
    reject: "Odrzuć",
    businessPhotos: "Zdjęcia biznesowe",
    photosHint: "Pierwsze zdjęcia pojawiają się na stronie rezerwacji online.",
    businessPhotoUploadTitle: "Dodaj zdjęcie firmy",
    businessPhotoUploadSubtitle: "Profile ze zdjęciami zdobywają więcej klientów",
    businessPhotoSourceTitle: "Dodaj zdjęcie z",
    businessPhotoFromCamera: "Zrób zdjęcie",
    businessPhotoFromGallery: "Wybierz z galerii",
    businessPhotoDropHint: "Na komputerze możesz przeciągnąć zdjęcie tutaj",
    addMorePhoto: "Dodaj kolejne zdjęcie",
    businessPhotoActionsTitle: "Akcje zdjęcia",
    streetAddress: "Adres",
    addressDetails: "Dane adresowe",
    mapCoordinates: "Współrzędne zapisywane są ze strony internetowej; aplikacja edytuje adres tekstowy.",
    ownerOnlyHint: "Tylko właściciel konta może zmieniać ustawienia biznesowe.",
    launchChecklist: "Lista kontrolna uruchomienia",
    profileReady: "Profil gotowy",
    completedSteps: "ukończony",
    photoUrl: "Link do zdjęcia",
    photoCaption: "Podpis do zdjęcia",
    addPhotoUrl: "Dodaj zdjęcie przez link",
    addPhoto: "Dodaj zdjęcie",
    uploadPhoto: "Prześlij zdjęcie",
    photoUploading: "Przesyłanie zdjęcia...",
    makePrimary: "Ustaw jako główne",
    primaryPhoto: "Zdjęcie główne",
    addressSearch: "Znajdź adres na mapie",
    addressPlaceholder: "Zacznij wpisywać prawdziwy adres",
    searchingAddress: "Wyszukiwanie adresu...",
    selectAddress: "Wybierz adres",
    selectedAddress: "Wybrany adres",
    streetHouse: "Dom, ulica",
    city: "Miasto",
    region: "Region",
    postcode: "Kod pocztowy",
    openMap: "Otwórz mapę",
    telegramConnectButton: "Połącz bota",
    telegramOpenBot: "Otwórz bota",
    telegramCopyLink: "Skopiuj link",
    telegramRefreshLink: "Odśwież link",
    telegramTokenExpires: "Link aktywny do",
    telegramSectionNotifications: "Powiadomienia",
    telegramSectionReminders: "Przypomnienia",
    telegramSectionSupport: "Wsparcie",
    telegramNotificationsHint: "Wybierz zdarzenia bot powinien wysłać do Telegramu.",
    telegramOnlineBookings: "Nowe rezerwacje online",
    telegramCabinetBookings: "Nowe rezerwacje przestrzeni do pracy",
    telegramRescheduled: "Zmiana godziny rezerwacji",
    telegramCancelled: "Rezerwacja anulowana",
    telegramRemindersHint: "Przypomnienia pomogą Ci uniknąć przegapienia nadchodzących wizyt.",
    telegramReminders: "Przypomnienie przed rezerwacją",
    telegramToday: "Podsumowanie dzisiejszego dnia",
    telegramReminderLead: "Czas przypomnienia",
    telegramSupportHint: "Pytania klientów i wsparcia mogą przychodzić bezpośrednio do Telegramu.",
    telegramForwarding: "Prześlij wsparcie do Telegramu",
    telegramSaved: "Telegram zaktualizowany",
    telegramSaveFailed: "Nie można zaktualizować telegramu.",
    minutesBefore: "min przed",
    hoursBefore: "h przed",
    dayBefore: "dzień przed",
    minutesShort: "min",
    defaultServiceCategory: "Bez kategorii",
    serviceModeOnsite: "Klienci przychodzą do mnie",
    serviceModeTravel: "Dojeżdżam do klientów",
    serviceModeOnline: "Świadczę usługi online",
    calendarHeaderTitle: "Kalendarz",
    loadWorkspaceFailed: "Nie udało się załadować obszaru roboczego.",
    empty: "Na razie puste",
    emptyCalendarTitle: "Nie ma jeszcze rezerwacji",
    emptyCalendarText: "Naciśnij +, aby dodać pierwszą wizytę",
    noBookingsToday: "Dzisiaj brak spotkań",
    noBookingsTodaySpark: "Dzisiaj brak spotkań ✨",
    fillFreeWindowsText: "To dobry moment na uzupełnienie wolnych miejsc.",
    noBookingsThisDay: "Brak rezerwacji na ten dzień",
    calendarNoServicesText: "Dodaj usługi i ceny, aby wszystko było gotowe przed pierwszą wizytą.",
    calendarEmptyActionText: "Dodaj swoją pierwszą wizytę lub skonfiguruj usługi rezerwacji online.",
    createBooking: "Utwórz rezerwację",
    createAppointmentButton: "+ Utwórz spotkanie",
    firstRunCalendarTitle: "Zacznij od usługi",
    firstRunCalendarText: "Zacznij od usług z cenami: rezerwacje będą szybsze do tworzenia i czytelniejsze dla klientów online.",
    addFirstVisit: "Dodaj pierwszą wizytę",
    quickVisit: "Szybka rezerwacja",
    createVisitWithoutService: "Utwórz rezerwację bez usługi",
    onboardingStartTitle: "Dodaj katalog usług",
    onboardingStartText: "Przed pierwszą wizytą dodaj usługi, czas trwania i ceny. Rezerwacje będą szybsze do tworzenia, a klienci zrozumieją, co rezerwują.",
    firstAppointmentCreated: "🎉 Utworzono pierwsze spotkanie",
    addServiceFirstTitle: "Najpierw dodaj usługę",
    addServiceFirstText: "Nie masz jeszcze usług. Dodaj pierwszą usługę z czasem trwania i ceną.",
    servicesEmptyPickerTitle: "Brak jeszcze usług",
    servicesEmptyPickerText: "Dodaj pierwszą usługę z czasem trwania i ceną, a potem utwórz rezerwację.",
    createServiceAction: "Utwórz usługę",
    bookingWithoutService: "Rezerwacja bez usługi",
    firstServiceTitle: "Dodaj swoją pierwszą usługę",
    firstServiceText: "Wybierz usługi z katalogu, sprawdź czas trwania i ustaw ceny. Potem możesz szybko tworzyć rezerwacje i włączyć rezerwację online.",
    chooseFromCatalog: "Wybierz z katalogu",
    createOwnService: "Utwórz usługę niestandardową",
    servicesMineShort: "Moje",
    servicesCreateShort: "Utwórz",
    servicesCatalogShort: "Katalog",
    serviceSuggestionManicure: "Manicure",
    serviceSuggestionHaircut: "Strzyżenie",
    serviceSuggestionConsultation: "Konsultacje",
    clientsEmptyTitle: "Nie ma jeszcze klientów",
    clientsEmptyText: "Klient pojawia się po pierwszej rezerwacji lub możesz dodać go ręcznie. Pozostało",
    setupRemaining: "{count} kroków",
    setupFirstServiceText: "Najpierw dodaj usługi – odblokowuje to szybsze rezerwacje i rezerwacje online.",
  },
  cs: {
    login: "Přihlásit se",
    register: "Vytvořit účet",
    registerShort: "Vytvořit",
    newMasterCta: "Nový profesionál? Vytvořit účet",
    registerMasterCta: "Vytvořit pro účet",
    optionalDetails: "Více podrobností",
    email: "Email",
    password: "Heslo",
    firstName: "Jméno",
    lastName: "Příjmení",
    phone: "Telefon",
    phoneCountry: "Země",
    selectCountryCode: "Kód země",
    searchCountryOrCode: "Země nebo kód",
    customPhonePrefix: "Vlastní kód",
    customPhonePrefixHint: "Toto použijte pro nestandardní předponu",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Použijte kód",
    allCountries: "Všechny země",
    companyName: "Obchodní název",
    continue: "Pokračovat",
    creating: "Vytváření...",
    signingIn: "Přihlašování...",
    calendar: "Kalendář",
    clients: "Klienti",
    services: "Služby",
    staff: "Tým",
    settings: "Nastavení",
    moreTab: "Více",
    signOut: "Více",
    requiredTitle: "Chybějící detaily",
    requiredText: "Vyplňte všechna pole.",
    loginError: "Chyba přihlášení",
    registerError: "Chyba registrace",
    passwordHint: "Alespoň 6 znaků",
    proTitle: "Timviz pro profesionály",
    proSubtitle: "Kalendář, služby, klienti a upozornění v jedné aplikaci.",
    dashboard: "Pracovní plocha",
    home: "Domov",
    today: "Dnes",
    week: "Týden",
    month: "Měsíc",
    newVisit: "Nová návštěva",
    editVisit: "Upravit schůzku",
    bookTime: "Rezervujte si čas",
    addBlockedTime: "Přidat nedostupný čas",
    reservedTime: "Rezervovaný čas",
    unavailableTime: "Doba nedostupnosti",
    chooseClient: "Vyberte klienta",
    withoutClient: "Žádný klient",
    quickBookingWithoutClient: "Rychlá rezervace bez klienta",
    chooseClientLater: "Klienta si můžete vybrat později",
    chooseService: "Vyberte službu",
    comment: "Komentář",
    addAnotherService: "Přidat další službu +",
    total: "Celkový",
    payable: "platit",
    saveVisit: "Uložit rezervaci",
    visitTab: "Návštěva",
    search: "Vyhledávání",
    searchService: "Název služby",
    serviceSearchEmpty: "Služba nenalezena.",
    clientNameOrPhone: "Jméno nebo telefon",
    addNewClient: "Přidat nového klienta",
    addAndSelectClient: "Přidat a vybrat",
    createClientFromSearch: "Vytvořit klienta",
    noClientFound: "Nebyl nalezen žádný klient. Můžete vytvořit nový.",
    newClientFormTitle: "Nový klient",
    newClientFormHint: "Přidejte podrobnosti a klient bude vybrán pro tuto návštěvu.",
    formOpened: "Formulář je otevřen níže",
    clientName: "Jméno klienta",
    withoutService: "Bez služby",
    setupAssistant: "Asistent nastavení",
    setupAssistantText: "Dokončete kroky, aby byl váš profil připraven pro online rezervaci.",
    setupCompleteTitle: "Profil je připraven pro online rezervaci",
    setupCompleteText: "Klienti si již mohou rezervovat přes váš odkaz.",
    setupProgress: "Připravenost",
    setupServices: "Přidat služby",
    setupSchedule: "Nastavit plán",
    setupBooking: "Povolit online rezervaci",
    setupPhoto: "Přidat firemní fotografie",
    setupAddress: "Přidat adresu",
    setupTelegram: "Připojit telegram",
    staffSchedule: "Plán směn",
    staffScheduleHint: "Řídit týmové pracovní dny jako ve webovém pracovním prostoru.",
    teamMembers: "Členové",
    teamMembersHint: "Přidejte zaměstnance, upravte kontakty, role a přístup k pracovnímu prostoru.",
    allTeam: "Celý tým",
    showWholeTeam: "Zobrazit celý tým",
    selectedMasters: "Vybraní mistři",
    addMember: "Přidat zaměstnance",
    editMember: "Upravit zaměstnance",
    saveMember: "Uložit zaměstnance",
    fullName: "Celé jméno",
    role: "Role",
    workspaceAccess: "Přístup",
    invite: "Pozvat",
    resendInvite: "Znovu odeslat pozvánku",
    revokeInvite: "Zrušit pozvánku",
    sendInvite: "Odeslat e-mailovou pozvánku",
    pendingInvites: "Nevyřízené pozvánky",
    monthBookings: "Měsíční rezervace",
    upcomingBookings: "Nadcházející rezervace",
    scheduleMenu: "Naplánovat",
    currentWeek: "Tento týden",
    previousWeek: "Předchozí týden",
    nextWeek: "Příští týden",
    chooseWeek: "Vyberte týden",
    repeatingSchedule: "Opakující se rozvrh",
    oneWeekSchedule: "Kalendářní týden",
    applyToWeekdays: "Aplikujte na všední dny",
    clearWeek: "Jasný týden",
    noWork: "Vypnuto",
    workIntervals: "Pracovní doba",
    addWorkTime: "Přidejte čas",
    removeWorkTime: "Odebrat pracovní interval",
    monthPlanner: "Měsíc pracovní dny",
    selectedDays: "Vybrané dny",
    applyToSelectedDays: "Použít na vybrané",
    selectedDaysHint: "Vyberte měsíční dny a použijte na ně stejné pracovní intervaly.",
    noRoomForInterval: "Není místo na další interval.",
    invalidIntervalRange: "Konec musí být pozdější než začátek.",
    overlappingIntervals: "Intervaly se nemohou překrývat.",
    addBreak: "Přidat čas",
    removeBreak: "Odebrat pracovní interval",
    onThisWeek: "Tento týden",
    saveSchedule: "Uložit plán",
    workFrom: "Od",
    workTo: "do",
    breakFrom: "Pracovní interval od",
    breakTo: "Do",
    owner: "Vlastník",
    employee: "Zaměstnanec",
    hoursShort: "h",
    workingDay: "Pracovní den",
    dayOff: "Den volna",
    dayOffTitle: "Den volna",
    bookingUnavailable: "Rezervace není k dispozici",
    dayOffMessage: "Dnes máte volno.",
    configureSchedule: "Konfigurace plánu",
    bookingPage: "Stránka společnosti",
    bookingPageText: "Klientský odkaz a přepínač online rezervace.",
    onlineBookingOn: "Online rezervace je zapnutá",
    onlineBookingOff: "Online rezervace je vypnutá",
    openPage: "Otevřít stránku",
    sharePage: "Sdílet",
    supportTitle: "Podpora Timviz",
    supportGuideTitle: "Napište na podporu",
    supportGuideText: "Popište, co se objevilo, děláte, kde se problém vyskytl.",
    supportGreeting: "Ahoj! Zeptejte se nás na účet, rezervace, nastavení nebo předplatné. Pomůžeme.",
    supportPlaceholder: "Napište svůj dotaz do jedné zprávy...",
    supportSend: "Odeslat",
    supportSent: "Zpráva odeslána.",
    supportFailed: "Zprávu nelze odeslat.",
    notificationPendingBookings: "Nevyřízené online rezervace",
    notificationsNew: "Novinka",
    notificationsArchive: "Archiv",
    notificationEmpty: "Zatím nejsou žádné nové aktualizace.",
    statusPending: "Nevyřízeno",
    statusConfirmed: "Potvrzeno",
    statusCancelled: "Zrušeno",
    confirmBooking: "Potvrdit",
    cancelBooking: "Zrušit rezervaci",
    companySettings: "Nastavení společnosti",
    helpSupport: "Pomoc a podpora",
    language: "Jazyk",
    compact: "Kompaktní",
    dayView: "Den",
    detailed: "Detailní",
    threeDays: "3 dny",
    weekView: "Týden",
    monthView: "Měsíc",
    selected: "Vybrané",
    visits: "návštěv",
    closedBySchedule: "Uzavřené",
    ready: "Hotovo",
    reminders: "Upozornění",
    addVisit: "Přidat rezervaci",
    customer: "Klient",
    service: "Služba",
    start: "Konec",
    end: "Začátek",
    save: "Uložit",
    cancel: "Zrušit",
    noAppointments: "Na tento den zatím nejsou žádné rezervace.",
    recent: "Poslední rezervace",
    addService: "Přidat službu",
    yourServices: "Vaše služby",
    ownService: "Vlastní služba",
    generalCatalog: "Globální katalog",
    serviceName: "Název služby",
    serviceCategory: "Kategorie služby",
    cantFindCategory: "Nemohu najít kategorii",
    customCategory: "Vlastní kategorie",
    enterCategoryName: "Zadejte název kategorie",
    customCategoryHint: "Vlastní kategorii vytvořte pouze tehdy, když není v seznamu.",
    category: "Kategorie",
    newCategory: "Nová kategorie",
    selectedCategory: "Vybraná kategorie",
    editService: "Upravit službu",
    saveService: "Uložit službu",
    addFromCatalog: "Přidat",
    alreadyAdded: "Přidáno",
    catalogHint: "Vyberte hotovou službu.",
    myServicesHint: "Upravte cenu, délku a dostupnost.",
    price: "Cena",
    duration: "Minuty",
    delete: "Smazat",
    addClient: "Přidat klienta",
    editClient: "Upravit klienta",
    deleteClient: "Smazat klienta",
    deleteClientConfirm: "Smazat tuto kartu klienta?",
    clientFromAppointmentsCannotDelete: "Tento klient vznikl ze záznamů. Chcete-li ho odebrat, upravte nebo smažte související záznamy.",
    connected: "Připojeno",
    notConnected: "Nepřipojeno",
    telegramHint: "Telegramové připojení je spravováno v nastavení pracovního prostoru. Aplikace zobrazuje aktuální stav.",
    onlineBooking: "Online rezervace",
    address: "Adresa",
    publicPage: "Rezervační stránka",
    settingsSaved: "Změny uloženy",
    settingsSaving: "Ukládání...",
    settingsSaveError: "Nastavení nelze uložit.",
    premiumSubscription: "Prémiové předplatné",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Prémiové aktivní",
    premiumSubscriptionTrial: "Zkušební období",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Premium funguje v aplikaci i na webu.",
    premiumMonthly: "Premium měsíčně",
    premiumYearly: "Premium ročně",
    premiumMonthlyFallback: "$3/měsíc",
    premiumYearlyFallback: "$29/rok",
    premiumStartMonthly: "Začít měsíčně",
    premiumStartYearly: "Začít ročně",
    premiumRestore: "Obnovit nákup",
    premiumManage: "Spravovat předplatné v obchodě s aplikacemi.",
    premiumReady: "Premium aktualizováno.",
    premiumUnavailable: "Nákupy jsou dostupné v buildech z obchodu s aplikacemi.",
    premiumMissingConfig: "Nákup v obchodě s aplikacemi se ještě připravuje. Zkuste to znovu po zpracování produktů.",
    premiumPurchaseCancelled: "Nákup zrušen.",
    premiumSyncFailed: "Nelze synchronizovat předplatné.",
    settingsGeneral: "Nastavení společnosti",
    settingsOnline: "Online rezervace",
    settingsServices: "Služby",
    settingsSchedule: "Naplánovat",
    settingsTelegram: "Telegram",
    settingsAddress: "Adresa",
    profileAndBusiness: "Profil a podnikání",
    ownerContacts: "Kontakty na majitele",
    avatarLink: "Mistrovský avatar",
    avatarHint: "Fotografie se zobrazí v kalendáři, na hlavní kartě a v horní nabídce.",
    changeAvatar: "Změnit avatara",
    deleteAvatar: "Smazat avatar",
    avatarPermission: "Povolit přístup k fotografii pro změnu avatara.",
    newPassword: "Nové heslo",
    leaveBlankPassword: "ponechte prázdné, pokud se nezměnilo",
    businessFormat: "Název a formát",
    website: "Webová stránka",
    accountType: "Typ účtu",
    soloAccount: "Pracuji sám",
    teamAccount: "Tým",
    serviceMode: "Formát práce",
    categoriesText: "Kategorie",
    categoriesHint: "Vyberte jednu nebo více kategorií z katalogu",
    localization: "Země, jazyk a měna",
    country: "Země",
    timezone: "Časové pásmo",
    currency: "Měna",
    saveSettings: "Uložte nastavení",
    publicLink: "Veřejný odkaz",
    copyLink: "Kopie",
    manageServices: "Spravovat služby",
    manageSchedule: "Správa plánu",
    joinRequests: "Žádosti o připojení",
    noJoinRequests: "Zatím nejsou žádné nové žádosti.",
    approve: "Schválit",
    reject: "Odmítnout",
    businessPhotos: "Firemní fotografie",
    photosHint: "První fotografie se objeví na stránce online rezervace.",
    businessPhotoUploadTitle: "Přidat firemní fotografii",
    businessPhotoUploadSubtitle: "Profily s fotkami získávají více klientů",
    businessPhotoSourceTitle: "Přidat fotku z",
    businessPhotoFromCamera: "Vyfotit",
    businessPhotoFromGallery: "Vybrat z galerie",
    businessPhotoDropHint: "Na počítači sem můžete fotku přetáhnout",
    addMorePhoto: "Přidat další fotku",
    businessPhotoActionsTitle: "Akce s fotkou",
    streetAddress: "Adresa",
    addressDetails: "Podrobnosti adresy",
    mapCoordinates: "Souřadnice jsou uloženy z webové stránky; aplikace upraví textovou adresu.",
    ownerOnlyHint: "Firemní nastavení může měnit pouze vlastník účtu.",
    launchChecklist: "Spustit kontrolní seznam",
    profileReady: "Profil připraven",
    completedSteps: "dokončeno",
    photoUrl: "Odkaz na fotku",
    photoCaption: "Popisek fotografie",
    addPhotoUrl: "Přidejte fotku odkazem",
    addPhoto: "Přidat fotku",
    uploadPhoto: "Nahrajte fotografii",
    photoUploading: "Nahrávání fotografie...",
    makePrimary: "Udělat primární",
    primaryPhoto: "Primární fotka",
    addressSearch: "Najděte adresu na mapě",
    addressPlaceholder: "Začněte psát skutečnou adresu",
    searchingAddress: "Vyhledávání adresy...",
    selectAddress: "Vyberte adresu",
    selectedAddress: "Vybraná adresa",
    streetHouse: "Dům, ulice",
    city: "Město",
    region: "Kraj",
    postcode: "PSČ",
    openMap: "Otevřít mapu",
    telegramConnectButton: "Připojit robota",
    telegramOpenBot: "Otevřít bota",
    telegramCopyLink: "Kopírovat odkaz",
    telegramRefreshLink: "Obnovit odkaz",
    telegramTokenExpires: "Odkaz je aktivní do",
    telegramSectionNotifications: "Oznámení",
    telegramSectionReminders: "Připomenutí",
    telegramSectionSupport: "Připomenutí",
    telegramNotificationsHint: "bot by měl odeslat do telegramu.",
    telegramOnlineBookings: "Nové online rezervace",
    telegramCabinetBookings: "Nové rezervace pracovního prostoru",
    telegramRescheduled: "Změna času rezervace",
    telegramCancelled: "Rezervace zrušena",
    telegramRemindersHint: "Připomenutí vám pomohou vyhnout se promeškaným nadcházejícím návštěvám.",
    telegramReminders: "Připomenutí před rezervací",
    telegramToday: "Dnešní souhrn",
    telegramReminderLead: "Čas připomenutí",
    telegramSupportHint: "Otázky klientů a podpory mohou dorazit přímo do telegramu.",
    telegramForwarding: "Přepošlete podporu Telegramu",
    telegramSaved: "Telegram aktualizován",
    telegramSaveFailed: "Telegram nelze aktualizovat.",
    minutesBefore: "min před",
    hoursBefore: "h předtím",
    dayBefore: "jeden den předtím",
    minutesShort: "min",
    defaultServiceCategory: "Nezařazené",
    serviceModeOnsite: "Klienti přicházejí ke mně",
    serviceModeTravel: "Jezdím za klienty",
    serviceModeOnline: "Služby poskytuji online",
    calendarHeaderTitle: "Kalendář",
    loadWorkspaceFailed: "Načtení pracovního prostoru se nezdařilo.",
    empty: "Zatím prázdný",
    emptyCalendarTitle: "Zatím žádné rezervace",
    emptyCalendarText: "Klepnutím na + přidáte první návštěvu",
    noBookingsToday: "Dnes žádné schůzky",
    noBookingsTodaySpark: "Dnes žádné schůzky ✨",
    fillFreeWindowsText: "Je vhodná doba na zaplnění vašich volných míst.",
    noBookingsThisDay: "Pro tento den nejsou žádné rezervace",
    calendarNoServicesText: "Přidejte služby a ceny, aby bylo vše připravené před první rezervací.",
    calendarEmptyActionText: "Přidejte svou první návštěvu nebo nastavte služby pro online rezervaci.",
    createBooking: "Vytvořit rezervaci",
    createAppointmentButton: "+ Vytvořit schůzku",
    firstRunCalendarTitle: "Začněte se službou",
    firstRunCalendarText: "Začněte službami s cenami: rezervace se budou vytvářet rychleji a klientům budou jasnější.",
    addFirstVisit: "Přidat první návštěvu",
    quickVisit: "Rychlá rezervace",
    createVisitWithoutService: "Vytvořit rezervaci bez služby",
    onboardingStartTitle: "Přidejte katalog služeb",
    onboardingStartText: "Před první rezervací přidejte služby, délku trvání a ceny. Rezervace se budou vytvářet rychleji a klienti pochopí, co si rezervují.",
    firstAppointmentCreated: "🎉 Vytvořena první schůzka",
    addServiceFirstTitle: "Nejprve přidejte službu",
    addServiceFirstText: "Ještě nemáte služby. Přidejte první službu s délkou trvání a cenou.",
    servicesEmptyPickerTitle: "Zatím žádné služby",
    servicesEmptyPickerText: "Přidejte první službu s délkou trvání a cenou a potom vytvořte rezervaci.",
    createServiceAction: "Vytvořit službu",
    bookingWithoutService: "Rezervace bez služby",
    firstServiceTitle: "Přidejte svou první službu",
    firstServiceText: "Vyberte služby z katalogu, zkontrolujte délky trvání a nastavte ceny. Potom můžete rychle vytvářet rezervace a zapnout online rezervace.",
    chooseFromCatalog: "Vyberte si z katalogu",
    createOwnService: "Vytvořte vlastní službu",
    servicesMineShort: "Moje",
    servicesCreateShort: "Vytvořit",
    servicesCatalogShort: "Katalog",
    serviceSuggestionManicure: "Manikúra",
    serviceSuggestionHaircut: "Střih",
    serviceSuggestionConsultation: "Konzultace",
    clientsEmptyTitle: "Zatím žádní klienti",
    clientsEmptyText: "Klient se objeví po první rezervaci, nebo jej můžete přidat ručně.",
    setupRemaining: "Zbývá {count} kroků",
    setupFirstServiceText: "Nejprve přidejte služby – tím se odemknou rychlejší rezervace a online rezervace.",
  },
  es: {
    login: "Iniciar sesión",
    register: "Crear cuenta",
    registerShort: "Crear",
    newMasterCta: "¿Nuevo profesional? Crear cuenta",
    registerMasterCta: "Crear cuenta profesional",
    optionalDetails: "Más detalles",
    email: "Correo electrónico",
    password: "Contraseña",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono",
    phoneCountry: "País",
    selectCountryCode: "Código de país",
    searchCountryOrCode: "País o código",
    customPhonePrefix: "Código personalizado",
    customPhonePrefixHint: "Utilice esto para un prefijo no estándar",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Utilice el código",
    allCountries: "Todos los países",
    companyName: "Negocios nombre",
    continue: "Continuar",
    creating: "Creando...",
    signingIn: "Iniciando sesión...",
    calendar: "Calendario",
    clients: "Clientes",
    services: "Servicios",
    staff: "Equipo",
    settings: "Configuración",
    moreTab: "Más",
    signOut: "Cerrar sesión",
    requiredTitle: "Detalles faltantes",
    requiredText: "Complete todos los campos.",
    loginError: "Error de inicio de sesión",
    registerError: "Error de registro",
    passwordHint: "Al menos 6 caracteres",
    proTitle: "Timviz para profesionales",
    proSubtitle: "Calendario, servicios, clientes y alertas en una sola aplicación.",
    dashboard: "Espacio de trabajo",
    home: "Inicio",
    today: "Hoy",
    week: "Semana",
    month: "Mes",
    newVisit: "Nueva visita",
    editVisit: "Editar cita",
    bookTime: "Reservar hora",
    addBlockedTime: "Añadir hora no disponible",
    reservedTime: "Hora reservada",
    unavailableTime: "Hora no disponible",
    chooseClient: "Elegir cliente",
    withoutClient: "Sin cliente",
    quickBookingWithoutClient: "Reserva rápida sin cliente",
    chooseClientLater: "Puedes elegir cliente más tarde",
    chooseService: "Elegir servicio",
    comment: "Comentar",
    addAnotherService: "Añadir otro servicio +",
    total: "Total",
    payable: "Para pagar",
    saveVisit: "Guardar reserva",
    visitTab: "Visitar",
    search: "Buscar",
    searchService: "Nombre del servicio",
    serviceSearchEmpty: "Servicio no encontrado.",
    clientNameOrPhone: "Nombre o teléfono",
    addNewClient: "Agregar nuevo cliente",
    addAndSelectClient: "Agregar y seleccionar",
    createClientFromSearch: "Crear cliente",
    noClientFound: "No se encontró ningún cliente. Puedes crear uno nuevo.",
    newClientFormTitle: "Nuevo cliente",
    newClientFormHint: "Agregue los detalles y el cliente será seleccionado para esta visita.",
    formOpened: "El formulario está abierto a continuación",
    clientName: "Nombre del cliente",
    withoutService: "Sin servicio",
    setupAssistant: "Asistente de configuración",
    setupAssistantText: "Finaliza los pasos para que tu perfil esté listo para la reserva online.",
    setupCompleteTitle: "El perfil está listo para reservar en línea",
    setupCompleteText: "Los clientes ya pueden reservar a través de su enlace.",
    setupProgress: "Preparación",
    setupServices: "Agregar servicios",
    setupSchedule: "Establecer horario",
    setupBooking: "Habilitar reserva en línea",
    setupPhoto: "Agregar fotos del negocio",
    setupAddress: "Agregar dirección",
    setupTelegram: "Conectar Telegram",
    staffSchedule: "Horario de turnos",
    staffScheduleHint: "Administre los días de trabajo del equipo como en el espacio de trabajo web.",
    teamMembers: "Miembros",
    teamMembersHint: "Agregue empleados, edite contactos, roles y acceso al espacio de trabajo.",
    allTeam: "Equipo completo",
    showWholeTeam: "Mostrar el equipo completo",
    selectedMasters: "Maestros seleccionados",
    addMember: "Agregar empleado",
    editMember: "Editar empleado",
    saveMember: "Guardar empleado",
    fullName: "Nombre completo",
    role: "Rol",
    workspaceAccess: "Acceso",
    invite: "Invitar",
    resendInvite: "Reenviar invitación",
    revokeInvite: "Revocar invitación",
    sendInvite: "Enviar invitación por correo electrónico",
    pendingInvites: "Invitaciones pendientes",
    monthBookings: "Reservas del mes",
    upcomingBookings: "Próximas reservas",
    scheduleMenu: "Horario",
    currentWeek: "Esta semana",
    previousWeek: "Semana anterior",
    nextWeek: "Semana siguiente",
    chooseWeek: "Elige semana",
    repeatingSchedule: "Horario repetido",
    oneWeekSchedule: "Semana calendario",
    applyToWeekdays: "Aplica a días laborables",
    clearWeek: "Borrar semana",
    noWork: "Desactivado",
    workIntervals: "Tiempo de trabajo",
    addWorkTime: "Agregar tiempo",
    removeWorkTime: "Eliminar intervalo",
    monthPlanner: "Mes días laborales",
    selectedDays: "Días seleccionados",
    applyToSelectedDays: "Aplicar a",
    selectedDaysHint: "seleccionados Días del mes y aplicarles los mismos intervalos de trabajo.",
    noRoomForInterval: "No hay lugar para otro intervalo.",
    invalidIntervalRange: "El final debe ser posterior al inicio.",
    overlappingIntervals: "Los intervalos no pueden superponerse.",
    addBreak: "Agregar tiempo",
    removeBreak: "Eliminar intervalo",
    onThisWeek: "Esta semana",
    saveSchedule: "Guardar horario",
    workFrom: "De",
    workTo: "A",
    breakFrom: "Intervalo desde",
    breakTo: "Hasta",
    owner: "Propietario",
    employee: "Empleado",
    hoursShort: "h",
    workingDay: "Día laboral",
    dayOff: "Día libre",
    dayOffTitle: "Día libre",
    bookingUnavailable: "Reserva no disponible",
    dayOffMessage: "Hoy es tu día libre.",
    configureSchedule: "Configurar horario",
    bookingPage: "Página de empresa",
    bookingPageText: "Enlace de cliente y cambio de reserva online.",
    onlineBookingOn: "La reserva en línea está activada",
    onlineBookingOff: "La reserva en línea está desactivada",
    openPage: "Abrir página",
    sharePage: "Compartir",
    supportTitle: "Soporte de Timviz",
    supportGuideTitle: "Escribe al soporte",
    supportGuideText: "Describe lo que estás haciendo, dónde apareció el problema y qué debería suceder.",
    supportGreeting: "¡Hola! Pregúntanos sobre tu cuenta, reservas, ajustes o suscripción. Te ayudaremos.",
    supportPlaceholder: "Escribe tu pregunta en un solo mensaje...",
    supportSend: "Enviar",
    supportSent: "Mensaje enviado.",
    supportFailed: "No se pudo enviar el mensaje.",
    notificationPendingBookings: "Reservas online pendientes",
    notificationsNew: "Nuevo",
    notificationsArchive: "Archivo",
    notificationEmpty: "Aún no hay nuevas actualizaciones.",
    statusPending: "Pendiente",
    statusConfirmed: "Confirmado",
    statusCancelled: "Cancelado",
    confirmBooking: "Confirmar",
    cancelBooking: "Cancelar reserva",
    companySettings: "Ajustes de empresa",
    helpSupport: "Ayuda y soporte",
    language: "Idioma",
    compact: "Compacto",
    dayView: "Día",
    detailed: "Detallado",
    threeDays: "3 días",
    weekView: "Semana",
    monthView: "Mes",
    selected: "Visitas",
    visits: "seleccionadas",
    closedBySchedule: "Cerradas",
    ready: "Realizadas",
    reminders: "Alertas",
    addVisit: "Añadir reserva",
    customer: "Cliente",
    service: "Servicio",
    start: "Inicio",
    end: "Fin",
    save: "Guardar",
    cancel: "Cancelar",
    noAppointments: "Aún no hay reservas para este día.",
    recent: "Reservas recientes",
    addService: "Agregar servicio",
    yourServices: "Tus servicios",
    ownService: "Servicio personalizado",
    generalCatalog: "Catálogo global",
    serviceName: "Nombre del servicio",
    serviceCategory: "Categoría del servicio",
    cantFindCategory: "No encuentro la categoría",
    customCategory: "Categoría propia",
    enterCategoryName: "Introduce el nombre de la categoría",
    customCategoryHint: "Crea una categoría propia solo si no está en la lista.",
    category: "Categoría",
    newCategory: "Nueva categoría",
    selectedCategory: "Categoría seleccionada",
    editService: "Editar servicio",
    saveService: "Guardar servicio",
    addFromCatalog: "Agregar",
    alreadyAdded: "Agregado",
    catalogHint: "Elija un servicio listo.",
    myServicesHint: "Edita precio, duración y disponibilidad.",
    price: "Precio",
    duration: "Minutos",
    delete: "Eliminar",
    addClient: "Agregar cliente",
    editClient: "Editar cliente",
    deleteClient: "Eliminar cliente",
    deleteClientConfirm: "¿Eliminar esta ficha de cliente?",
    clientFromAppointmentsCannotDelete: "Este cliente se creó desde citas. Para quitarlo, edita o elimina las citas relacionadas.",
    connected: "Conectado",
    notConnected: "No conectado",
    telegramHint: "La conexión de Telegram se administra en la configuración del espacio de trabajo. La aplicación muestra el estado actual.",
    onlineBooking: "Reserva en línea",
    address: "Dirección",
    publicPage: "Página de reserva",
    settingsSaved: "Cambios guardados",
    settingsSaving: "Guardando...",
    settingsSaveError: "No se pudo guardar la configuración.",
    premiumSubscription: "Suscripción Premium",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium activo",
    premiumSubscriptionTrial: "Período de prueba",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Premium funciona en la app y en el sitio.",
    premiumMonthly: "Premium mensual",
    premiumYearly: "Premium anual",
    premiumMonthlyFallback: "$3 / mes",
    premiumYearlyFallback: "$29 / año",
    premiumStartMonthly: "Iniciar mensualmente",
    premiumStartYearly: "Iniciar anualmente",
    premiumRestore: "Restaurar compra",
    premiumManage: "Administrar la suscripción en tu tienda de apps.",
    premiumReady: "Premium actualizado.",
    premiumUnavailable: "Las compras están disponibles en builds de tienda de apps.",
    premiumMissingConfig: "La compra de la tienda de apps aún se está preparando. Inténtalo de nuevo cuando los productos terminen de procesarse.",
    premiumPurchaseCancelled: "Compra cancelada.",
    premiumSyncFailed: "No se pudo sincronizar la suscripción.",
    settingsGeneral: "Ajustes de empresa",
    settingsOnline: "Reserva online",
    settingsServices: "Servicios",
    settingsSchedule: "Horario",
    settingsTelegram: "Telegram",
    settingsAddress: "Dirección",
    profileAndBusiness: "Perfil y negocio",
    ownerContacts: "Contactos del propietario",
    avatarLink: "Avatar maestro",
    avatarHint: "La foto aparece en el calendario, tarjeta maestra y menú superior.",
    changeAvatar: "Cambiar avatar",
    deleteAvatar: "Eliminar avatar",
    avatarPermission: "Permitir acceso a la foto para cambiar el avatar.",
    newPassword: "Nueva contraseña",
    leaveBlankPassword: "dejar en blanco si no se modifica",
    businessFormat: "Nombre y formato",
    website: "Sitio web",
    accountType: "Tipo de cuenta",
    soloAccount: "Trabajo solo",
    teamAccount: "Equipo",
    serviceMode: "Formato de trabajo",
    categoriesText: "Categorías",
    categoriesHint: "Elige una o varias categorías del catálogo",
    localization: "País, idioma y moneda",
    country: "País",
    timezone: "Zona horaria",
    currency: "Moneda",
    saveSettings: "Guardar configuración",
    publicLink: "Enlace público",
    copyLink: "Copiar",
    manageServices: "Administrar servicios",
    manageSchedule: "Administrar programación",
    joinRequests: "Solicitudes de unión",
    noJoinRequests: "Aún no hay nuevas solicitudes.",
    approve: "Aprobar",
    reject: "Rechazar",
    businessPhotos: "Fotos comerciales",
    photosHint: "Las primeras fotos aparecen en la página de reservas online.",
    businessPhotoUploadTitle: "Agregar foto del negocio",
    businessPhotoUploadSubtitle: "Los perfiles con fotos consiguen más clientes",
    businessPhotoSourceTitle: "Agregar foto desde",
    businessPhotoFromCamera: "Tomar foto",
    businessPhotoFromGallery: "Elegir de la galería",
    businessPhotoDropHint: "En escritorio puedes arrastrar una foto aquí",
    addMorePhoto: "Agregar otra foto",
    businessPhotoActionsTitle: "Acciones de foto",
    streetAddress: "Dirección",
    addressDetails: "Detalles de la dirección",
    mapCoordinates: "Las coordenadas se guardan desde el sitio web; la aplicación edita la dirección de texto.",
    ownerOnlyHint: "Solo el propietario de la cuenta puede cambiar la configuración comercial.",
    launchChecklist: "Lista de verificación de inicio",
    profileReady: "Perfil listo",
    completedSteps: "completado",
    photoUrl: "Enlace de foto",
    photoCaption: "Pie de foto",
    addPhotoUrl: "Agregar foto por enlace",
    addPhoto: "Agregar foto",
    uploadPhoto: "Subir foto",
    photoUploading: "Subiendo foto...",
    makePrimary: "Convertir en principal",
    primaryPhoto: "Foto principal",
    addressSearch: "Buscar dirección en el mapa",
    addressPlaceholder: "Comienza a escribir una dirección real",
    searchingAddress: "Buscando dirección...",
    selectAddress: "Elige dirección",
    selectedAddress: "Dirección seleccionada",
    streetHouse: "Casa, calle",
    city: "Ciudad",
    region: "Región",
    postcode: "Código postal",
    openMap: "Abrir mapa",
    telegramConnectButton: "Conectar bot",
    telegramOpenBot: "Abrir bot",
    telegramCopyLink: "Copiar enlace",
    telegramRefreshLink: "Actualizar enlace",
    telegramTokenExpires: "Enlace activo hasta",
    telegramSectionNotifications: "Notificaciones",
    telegramSectionReminders: "Recordatorios",
    telegramSectionSupport: "Soporte",
    telegramNotificationsHint: "Elige qué eventos debe realizar el bot enviar a Telegram.",
    telegramOnlineBookings: "Nuevas reservas en línea",
    telegramCabinetBookings: "Nuevas reservas de espacios de trabajo",
    telegramRescheduled: "Hora de reserva modificada",
    telegramCancelled: "Reserva cancelada",
    telegramRemindersHint: "Los recordatorios le ayudan a evitar perderse próximas visitas.",
    telegramReminders: "Recordatorio antes de reservar",
    telegramToday: "Resumen de hoy",
    telegramReminderLead: "Hora del recordatorio",
    telegramSupportHint: "Las preguntas de clientes y soporte pueden llegar directamente a Telegram.",
    telegramForwarding: "Reenviar soporte a Telegram",
    telegramSaved: "Telegram actualizado",
    telegramSaveFailed: "No se pudo actualizar Telegram.",
    minutesBefore: "min antes",
    hoursBefore: "h antes",
    dayBefore: "un día antes",
    minutesShort: "min",
    defaultServiceCategory: "Sin categoría",
    serviceModeOnsite: "Los clientes vienen a mi ubicación",
    serviceModeTravel: "Viajo a los clientes",
    serviceModeOnline: "Brindo servicios en línea",
    calendarHeaderTitle: "Calendario",
    loadWorkspaceFailed: "No se pudo cargar el espacio de trabajo.",
    empty: "Vacío por ahora",
    emptyCalendarTitle: "Aún no hay reservas",
    emptyCalendarText: "Toca + para agregar la primera visita",
    noBookingsToday: "Hoy no hay citas",
    noBookingsTodaySpark: "Hoy no hay citas ✨",
    fillFreeWindowsText: "Es un buen momento para llenar tus espacios abiertos.",
    noBookingsThisDay: "No hay reservas para este día",
    calendarNoServicesText: "Agrega servicios y precios para que todo esté listo antes de la primera cita.",
    calendarEmptyActionText: "Agregue su primera visita o configure servicios para reservas en línea.",
    createBooking: "Crear reserva",
    createAppointmentButton: "+ Crear cita",
    firstRunCalendarTitle: "Comience con un servicio",
    firstRunCalendarText: "Empieza con servicios con precio: las reservas serán más rápidas de crear y más claras para los clientes.",
    addFirstVisit: "Agregar primera visita",
    quickVisit: "Reserva rápida",
    createVisitWithoutService: "Crear reserva sin servicio",
    onboardingStartTitle: "Agrega tu catálogo de servicios",
    onboardingStartText: "Antes de la primera cita, agrega servicios, duración y precios. Las reservas serán más rápidas de crear y los clientes entenderán qué reservan.",
    firstAppointmentCreated: "🎉 Primera cita creada",
    addServiceFirstTitle: "Agrega un servicio primero",
    addServiceFirstText: "Aún no tienes servicios. Añade tu primer servicio con duración y precio.",
    servicesEmptyPickerTitle: "Aún no hay servicios",
    servicesEmptyPickerText: "Añade tu primer servicio con duración y precio, luego crea la reserva.",
    createServiceAction: "Crear servicio",
    bookingWithoutService: "Reserva sin servicio",
    firstServiceTitle: "Agregue su primer servicio",
    firstServiceText: "Elige servicios del catálogo, revisa la duración y fija los precios. Después podrás crear reservas rápidamente y activar la reserva online.",
    chooseFromCatalog: "Elige del catálogo",
    createOwnService: "Crear servicio personalizado",
    servicesMineShort: "Mis",
    servicesCreateShort: "Crear",
    servicesCatalogShort: "Catálogo",
    serviceSuggestionManicure: "Manicura",
    serviceSuggestionHaircut: "Corte de pelo",
    serviceSuggestionConsultation: "Consulta",
    clientsEmptyTitle: "Aún no hay clientes",
    clientsEmptyText: "Un cliente aparece después de la primera reserva, o puedes agregar uno manualmente.",
    setupRemaining: "Faltan {count} pasos",
    setupFirstServiceText: "Agregue servicios primero: esto desbloquea reservas más rápidas y reservas en línea.",
  },
  de: {
    login: "Anmelden",
    register: "Konto erstellen",
    registerShort: "Erstellen",
    newMasterCta: "Neuer Profi? Konto erstellen",
    registerMasterCta: "Pro-Konto erstellen",
    optionalDetails: "Weitere Details",
    email: "E-Mail",
    password: "Passwort",
    firstName: "Vorname",
    lastName: "Nachname",
    phone: "Telefon",
    phoneCountry: "Land",
    selectCountryCode: "Ländercode",
    searchCountryOrCode: "Land oder Code",
    customPhonePrefix: "Benutzerdefinierter Code",
    customPhonePrefixHint: "Verwenden Sie dies für ein nicht standardmäßiges Präfix",
    customPhonePrefixPlaceholder: "+999",
    useCustomPrefix: "Verwenden Sie den Code",
    allCountries: "Alle Länder",
    companyName: "Business Namen",
    continue: "Weiter",
    creating: "Erstellen...",
    signingIn: "Anmelden...",
    calendar: "Kalender",
    clients: "Kunden",
    services: "Dienste",
    staff: "Team",
    settings: "Einstellungen",
    moreTab: "Mehr",
    signOut: "Abmelden",
    requiredTitle: "Fehlende Angaben",
    requiredText: "Füllen Sie alle Felder aus.",
    loginError: "Anmeldefehler",
    registerError: "Registrierungsfehler",
    passwordHint: "Mindestens 6 Zeichen",
    proTitle: "Timviz für Profis",
    proSubtitle: "Kalender, Dienste, Kunden und Benachrichtigungen in einer App.",
    dashboard: "Arbeitsbereich",
    home: "Startseite",
    today: "Heute",
    week: "Woche",
    month: "Monat",
    newVisit: "Neuer Besuch",
    editVisit: "Termin bearbeiten",
    bookTime: "Zeit buchen",
    addBlockedTime: "Nicht verfügbare Zeit hinzufügen",
    reservedTime: "Reservierte Zeit",
    unavailableTime: "Nicht verfügbare Zeit",
    chooseClient: "Kunde auswählen",
    withoutClient: "Kein Kunde",
    quickBookingWithoutClient: "Schnelle Buchung ohne Kunden",
    chooseClientLater: "Sie können später einen Kunden auswählen",
    chooseService: "Service auswählen",
    comment: "Kommentieren",
    addAnotherService: "Weiteren Service hinzufügen +",
    total: "Gesamt",
    payable: "Bezahlen",
    saveVisit: "Buchung speichern",
    visitTab: "Besuchen Sie",
    search: "Suchen",
    searchService: "Dienstname",
    serviceSearchEmpty: "Dienst nicht gefunden.",
    clientNameOrPhone: "Name oder Telefon",
    addNewClient: "Neuen Kunden hinzufügen",
    addAndSelectClient: "Hinzufügen und auswählen",
    createClientFromSearch: "Kunde erstellen",
    noClientFound: "Kein Kunde gefunden. Sie können ein neues erstellen.",
    newClientFormTitle: "Neuer Kunde",
    newClientFormHint: "Fügen Sie die Details hinzu und der Kunde wird für diesen Besuch ausgewählt. Das",
    formOpened: "-Formular ist unten geöffnet",
    clientName: "Kundenname",
    withoutService: "Ohne Service",
    setupAssistant: "Einrichtungsassistent",
    setupAssistantText: "Beenden Sie die Schritte, damit Ihr Profil für die Online-Buchung bereit ist.",
    setupCompleteTitle: "Profil ist bereit für die Online-Buchung",
    setupCompleteText: "Kunden können bereits über Ihren Link buchen.",
    setupProgress: "Bereitschaft",
    setupServices: "Dienste hinzufügen",
    setupSchedule: "Zeitplan festlegen",
    setupBooking: "Online-Buchung aktivieren",
    setupPhoto: "Geschäftsfotos hinzufügen",
    setupAddress: "Adresse hinzufügen",
    setupTelegram: "Telegram verbinden",
    staffSchedule: "Schichtplan",
    staffScheduleHint: "Team-Arbeitstage wie im Web-Workspace verwalten.",
    teamMembers: "Mitglieder",
    teamMembersHint: "Fügen Sie Mitarbeiter hinzu, bearbeiten Sie Kontakte, Rollen und Arbeitsbereichszugriff.",
    allTeam: "Ganzes Team",
    showWholeTeam: "Das gesamte Team anzeigen",
    selectedMasters: "Ausgewählte Meister",
    addMember: "Mitarbeiter hinzufügen",
    editMember: "Mitarbeiter bearbeiten",
    saveMember: "Mitarbeiter speichern",
    fullName: "Vollständiger Name",
    role: "Rolle",
    workspaceAccess: "Zugriff",
    invite: "Einladen",
    resendInvite: "Einladung erneut senden",
    revokeInvite: "Einladung widerrufen",
    sendInvite: "E-Mail-Einladung senden",
    pendingInvites: "Ausstehende Einladungen",
    monthBookings: "Monatsbuchungen",
    upcomingBookings: "Anstehende Buchungen",
    scheduleMenu: "Zeitplan",
    currentWeek: "Diese Woche",
    previousWeek: "Vorherige Woche",
    nextWeek: "Nächste Woche",
    chooseWeek: "Woche auswählen",
    repeatingSchedule: "Wiederholter Zeitplan",
    oneWeekSchedule: "Kalenderwoche",
    applyToWeekdays: "Auf Wochentage anwenden",
    clearWeek: "Woche löschen",
    noWork: "Aus",
    workIntervals: "Arbeitszeit",
    addWorkTime: "Zeit hinzufügen",
    removeWorkTime: "Arbeitsintervall entfernen",
    monthPlanner: "Monatsarbeitstage",
    selectedDays: "Ausgewählte Tage",
    applyToSelectedDays: "Auf ausgewählte anwenden",
    selectedDaysHint: "Monatstage auswählen und die gleichen Arbeitsintervalle auf sie anwenden.",
    noRoomForInterval: "Kein Platz für ein weiteres Intervall.",
    invalidIntervalRange: "Das Ende muss später als der Start liegen.",
    overlappingIntervals: "Intervalle dürfen sich nicht überschneiden.",
    addBreak: "Zeit hinzufügen",
    removeBreak: "Arbeitsintervall entfernen",
    onThisWeek: "Diese Woche",
    saveSchedule: "Zeitplan speichern",
    workFrom: "Von",
    workTo: "Bis",
    breakFrom: "Arbeitsintervall von",
    breakTo: "Bis",
    owner: "Inhaber",
    employee: "Angestellter",
    hoursShort: "h",
    workingDay: "Arbeitstag",
    dayOff: "Ruhetag",
    dayOffTitle: "Ruhetag",
    bookingUnavailable: "Buchung nicht möglich",
    dayOffMessage: "Heute ist Ihr freier Tag.",
    configureSchedule: "Zeitplan konfigurieren",
    bookingPage: "Unternehmensseite",
    bookingPageText: "Kundenlink und Online-Buchungsschalter.",
    onlineBookingOn: "Online-Buchung ist aktiviert",
    onlineBookingOff: "Online-Buchung ist deaktiviert",
    openPage: "Seite öffnen",
    sharePage: "Teilen",
    supportTitle: "Timviz-Support",
    supportGuideTitle: "Schreiben Sie an den Support",
    supportGuideText: "Beschreiben Sie, was Sie tun, wo das Problem aufgetreten ist und was passieren sollte.",
    supportGreeting: "Hallo! Fragen Sie uns zu Konto, Buchungen, Einstellungen oder Abonnement. Wir helfen.",
    supportPlaceholder: "Schreiben Sie Ihre Frage in einer Nachricht ...",
    supportSend: "Senden",
    supportSent: "Nachricht gesendet.",
    supportFailed: "Die Nachricht konnte nicht gesendet werden.",
    notificationPendingBookings: "Ausstehende Online-Buchungen",
    notificationsNew: "Neu",
    notificationsArchive: "Archiv",
    notificationEmpty: "Es gibt noch keine neuen Updates.",
    statusPending: "Ausstehend",
    statusConfirmed: "Bestätigt",
    statusCancelled: "Abgebrochen",
    confirmBooking: "Bestätigen",
    cancelBooking: "Buchung stornieren",
    companySettings: "Firmeneinstellungen",
    helpSupport: "Hilfe und Support",
    language: "Sprache",
    compact: "Kompakt",
    dayView: "Tag",
    detailed: "Detailliert",
    threeDays: "3 Tage",
    weekView: "Woche",
    monthView: "Monat",
    selected: "Ausgewählte",
    visits: "Besuche",
    closedBySchedule: "Geschlossen",
    ready: "Fertig",
    reminders: "Benachrichtigungen",
    addVisit: "Buchung hinzufügen",
    customer: "Kunde",
    service: "Service",
    start: "Start",
    end: "Ende",
    save: "Speichern",
    cancel: "Abbrechen",
    noAppointments: "Für diesen Tag liegen noch keine Buchungen vor.",
    recent: "Letzte Buchungen",
    addService: "Service hinzufügen",
    yourServices: "Ihre Services",
    ownService: "Individueller Service",
    generalCatalog: "Globaler Katalog",
    serviceName: "Servicename",
    serviceCategory: "Servicekategorie",
    cantFindCategory: "Kategorie nicht gefunden",
    customCategory: "Eigene Kategorie",
    enterCategoryName: "Kategoriename eingeben",
    customCategoryHint: "Erstellen Sie eine eigene Kategorie nur, wenn sie nicht in der Liste vorhanden ist.",
    category: "Kategorie",
    newCategory: "Neue Kategorie",
    selectedCategory: "Ausgewählte Kategorie",
    editService: "Dienst bearbeiten",
    saveService: "Dienst speichern",
    addFromCatalog: "Hinzufügen",
    alreadyAdded: "Hinzugefügt",
    catalogHint: "Wählen Sie einen fertigen Service.",
    myServicesHint: "Preis, Dauer und Verfügbarkeit bearbeiten.",
    price: "Preis",
    duration: "Minuten",
    delete: "Löschen",
    addClient: "Client hinzufügen",
    editClient: "Kunde bearbeiten",
    deleteClient: "Kunde löschen",
    deleteClientConfirm: "Diese Kundenkarte löschen?",
    clientFromAppointmentsCannotDelete: "Dieser Kunde wurde aus Terminen erstellt. Bearbeite oder lösche die zugehörigen Termine, um ihn zu entfernen.",
    connected: "Verbunden",
    notConnected: "Nicht verbunden",
    telegramHint: "Die Telegrammverbindung wird in den Arbeitsbereichseinstellungen verwaltet. Die App zeigt den aktuellen Status an.",
    onlineBooking: "Online-Buchung",
    address: "Adresse",
    publicPage: "Buchungsseite",
    settingsSaved: "Änderungen gespeichert",
    settingsSaving: "Speichern...",
    settingsSaveError: "Einstellungen konnten nicht gespeichert werden.",
    premiumSubscription: "Premium-Abonnement",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium aktiv",
    premiumSubscriptionTrial: "Testzeitraum",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Premium funktioniert in App und Website.",
    premiumMonthly: "Premium monatlich",
    premiumYearly: "Premium jährlich",
    premiumMonthlyFallback: "3 $ / Monat",
    premiumYearlyFallback: "29 $ / Jahr",
    premiumStartMonthly: "Monatlich starten",
    premiumStartYearly: "Jährlich starten",
    premiumRestore: "Kauf wiederherstellen",
    premiumManage: "Das Abonnement im App-Store des Geräts verwalten.",
    premiumReady: "Premium aktualisiert.",
    premiumUnavailable: "Käufe sind in App-Store-Builds verfügbar.",
    premiumMissingConfig: "Der Kauf im App-Store wird noch vorbereitet. Versuche es erneut, wenn die Produkte verarbeitet wurden.",
    premiumPurchaseCancelled: "Kauf storniert.",
    premiumSyncFailed: "Das Abonnement konnte nicht synchronisiert werden.",
    settingsGeneral: "Firmeneinstellungen",
    settingsOnline: "Online-Buchung",
    settingsServices: "Dienste",
    settingsSchedule: "Zeitplan",
    settingsTelegram: "Telegramm",
    settingsAddress: "Adresse",
    profileAndBusiness: "Profil und Unternehmen",
    ownerContacts: "Inhaberkontakte",
    avatarLink: "Master-Avatar",
    avatarHint: "Das Foto erscheint im Kalender, auf der Masterkarte und im oberen Menü.",
    changeAvatar: "Avatar ändern",
    deleteAvatar: "Avatar löschen",
    avatarPermission: "Fotozugriff erlauben, um den Avatar zu ändern.",
    newPassword: "Neues Passwort",
    leaveBlankPassword: "leer lassen, wenn unverändert",
    businessFormat: "Name und Format",
    website: "Website",
    accountType: "Kontotyp",
    soloAccount: "Ich arbeite alleine",
    teamAccount: "Team",
    serviceMode: "Arbeitsformat",
    categoriesText: "Kategorien",
    categoriesHint: "Wählen Sie eine oder mehrere Kategorien aus dem Katalog",
    localization: "Land, Sprache und Währung",
    country: "Land",
    timezone: "Zeitzone",
    currency: "Währung",
    saveSettings: "Einstellungen speichern",
    publicLink: "Öffentlicher Link",
    copyLink: "Kopieren",
    manageServices: "Dienste verwalten",
    manageSchedule: "Zeitplan verwalten",
    joinRequests: "Beitrittsanfragen",
    noJoinRequests: "Es liegen noch keine neuen Anfragen vor.",
    approve: "Genehmigen",
    reject: "Ablehnen",
    businessPhotos: "Geschäftsfotos",
    photosHint: "Die ersten Fotos erscheinen auf der Online-Buchungsseite.",
    businessPhotoUploadTitle: "Geschäftsfoto hinzufügen",
    businessPhotoUploadSubtitle: "Profile mit Fotos gewinnen mehr Kunden",
    businessPhotoSourceTitle: "Foto hinzufügen aus",
    businessPhotoFromCamera: "Foto aufnehmen",
    businessPhotoFromGallery: "Aus Galerie wählen",
    businessPhotoDropHint: "Am Desktop können Sie ein Foto hier ablegen",
    addMorePhoto: "Weiteres Foto hinzufügen",
    businessPhotoActionsTitle: "Fotoaktionen",
    streetAddress: "Adresse",
    addressDetails: "Adressdetails",
    mapCoordinates: "Koordinaten werden von der Website gespeichert; Die App bearbeitet die Textadresse.",
    ownerOnlyHint: "Nur der Kontoinhaber kann die Geschäftseinstellungen ändern.",
    launchChecklist: "Start-Checkliste",
    profileReady: "Profil bereit",
    completedSteps: "abgeschlossen",
    photoUrl: "Fotolink",
    photoCaption: "Bildunterschrift",
    addPhotoUrl: "Foto per Link hinzufügen",
    addPhoto: "Foto hinzufügen",
    uploadPhoto: "Foto hochladen",
    photoUploading: "Foto wird hochgeladen...",
    makePrimary: "Als primär festlegen",
    primaryPhoto: "Hauptfoto",
    addressSearch: "Adresse auf der Karte finden",
    addressPlaceholder: "Beginnen Sie mit der Eingabe einer echten Adresse",
    searchingAddress: "Adresse suchen...",
    selectAddress: "Adresse wählen",
    selectedAddress: "Ausgewählte Adresse",
    streetHouse: "Haus, Straße",
    city: "Stadt",
    region: "Region",
    postcode: "Postleitzahl",
    openMap: "Karte öffnen",
    telegramConnectButton: "Bot verbinden",
    telegramOpenBot: "Bot öffnen",
    telegramCopyLink: "Link kopieren",
    telegramRefreshLink: "Link aktualisieren",
    telegramTokenExpires: "Link aktiv bis",
    telegramSectionNotifications: "Benachrichtigungen",
    telegramSectionReminders: "Erinnerungen",
    telegramSectionSupport: "Support",
    telegramNotificationsHint: "Wählen Sie, welche Ereignisse der Bot ausführen soll an Telegram senden.",
    telegramOnlineBookings: "Neue Online-Buchungen",
    telegramCabinetBookings: "Neue Arbeitsplatzbuchungen",
    telegramRescheduled: "Buchungszeit geändert",
    telegramCancelled: "Buchung storniert",
    telegramRemindersHint: "Erinnerungen helfen Ihnen, bevorstehende Besuche nicht zu verpassen.",
    telegramReminders: "Erinnerung vor der Buchung",
    telegramToday: "Heute-Zusammenfassung",
    telegramReminderLead: "Erinnerungszeit",
    telegramSupportHint: "Kunden- und Supportfragen können direkt in Telegram eingehen.",
    telegramForwarding: "Leiten Sie den Support an Telegram weiter",
    telegramSaved: "Telegramm aktualisiert",
    telegramSaveFailed: "Telegramm konnte nicht aktualisiert werden.",
    minutesBefore: "min vorher",
    hoursBefore: "h vorher",
    dayBefore: "einen Tag vorher",
    minutesShort: "min",
    defaultServiceCategory: "Nicht kategorisiert",
    serviceModeOnsite: "Kunden kommen zu mir vor Ort",
    serviceModeTravel: "Ich reise zu Kunden",
    serviceModeOnline: "Ich biete Dienstleistungen online an",
    calendarHeaderTitle: "Kalender",
    loadWorkspaceFailed: "Der Arbeitsbereich konnte nicht geladen werden.",
    empty: "Vorerst leer",
    emptyCalendarTitle: "Noch keine Buchungen",
    emptyCalendarText: "Tippen Sie auf +, um den ersten Besuch hinzuzufügen",
    noBookingsToday: "Keine Termine heute",
    noBookingsTodaySpark: "Keine Termine heute ✨",
    fillFreeWindowsText: "Es ist ein guter Zeitpunkt, Ihre offenen Plätze zu besetzen.",
    noBookingsThisDay: "Keine Buchungen für diesen Tag",
    calendarNoServicesText: "Fügen Sie Leistungen und Preise hinzu, damit vor dem ersten Termin alles bereit ist.",
    calendarEmptyActionText: "Fügen Sie Ihren ersten Besuch hinzu oder richten Sie Dienste für die Online-Buchung ein.",
    createBooking: "Buchung erstellen",
    createAppointmentButton: "+ Termin erstellen",
    firstRunCalendarTitle: "Mit einem Dienst beginnen",
    firstRunCalendarText: "Beginnen Sie mit Leistungen und Preisen: Buchungen lassen sich schneller erstellen und sind für Kunden klarer.",
    addFirstVisit: "Erstbesuch hinzufügen",
    quickVisit: "Schnellbuchung",
    createVisitWithoutService: "Buchung ohne Leistung erstellen",
    onboardingStartTitle: "Leistungskatalog hinzufügen",
    onboardingStartText: "Fügen Sie vor dem ersten Termin Leistungen, Dauer und Preise hinzu. Buchungen lassen sich schneller erstellen und Kunden verstehen, was sie buchen.",
    firstAppointmentCreated: "🎉 Erster Termin erstellt",
    addServiceFirstTitle: "Zuerst einen Dienst hinzufügen",
    addServiceFirstText: "Sie haben noch keine Leistungen. Fügen Sie die erste Leistung mit Dauer und Preis hinzu.",
    servicesEmptyPickerTitle: "Noch keine Leistungen",
    servicesEmptyPickerText: "Fügen Sie die erste Leistung mit Dauer und Preis hinzu und erstellen Sie danach die Buchung.",
    createServiceAction: "Dienst erstellen",
    bookingWithoutService: "Buchen ohne Dienst",
    firstServiceTitle: "Fügen Sie Ihren ersten Dienst hinzu",
    firstServiceText: "Wählen Sie Leistungen aus dem Katalog, prüfen Sie die Dauer und legen Sie Preise fest. Danach können Sie Buchungen schnell erstellen und Online-Buchungen aktivieren.",
    chooseFromCatalog: "Wählen Sie aus dem Katalog",
    createOwnService: "Erstellen Sie einen benutzerdefinierten Service",
    servicesMineShort: "Meine",
    servicesCreateShort: "Erstellen",
    servicesCatalogShort: "Katalog",
    serviceSuggestionManicure: "Maniküre",
    serviceSuggestionHaircut: "Haarschnitt",
    serviceSuggestionConsultation: "Beratung",
    clientsEmptyTitle: "Noch keine Kunden",
    clientsEmptyText: "Ein Kunde erscheint nach der ersten Buchung, oder Sie können manuell einen hinzufügen.",
    setupRemaining: "{count} Schritte übrig",
    setupFirstServiceText: "Fügen Sie zuerst Dienste hinzu – dies ermöglicht schnellere Buchungen und Online-Buchungen.",
  },
} satisfies Record<Exclude<AppLanguage, "uk" | "ru" | "en">, Partial<Record<keyof typeof baseCopy.en, string>> & Record<string, string>>;

Object.assign(generatedMobileCopy.fr, {
  companyName: "Nom de l'entreprise",
  visitTab: "Visite",
  newClientFormHint: "Ajoutez les détails et le client sera sélectionné pour cette visite.",
  formOpened: "Le formulaire est ouvert ci-dessous",
  continueWithGoogle: "Continuer avec Google",
  continueWithApple: "Continuer avec Apple",
  socialAuthDivider: "ou",
  socialAuthConfigMissing: "Les clés de connexion doivent être configurées.",
  socialAuthFailed: "Connexion impossible.",
  enableBiometricTitle: "Activer Face ID ?",
  enableBiometricText: "La prochaine fois, vous pourrez ouvrir Timviz avec Face ID ou le code de l'appareil.",
  enableBiometricAction: "Activer",
  notNow: "Pas maintenant",
  unlockWithFaceId: "Se connecter avec Face ID",
  unlockWithBiometrics: "Connexion rapide",
  useDevicePasscode: "Code de l'appareil",
  biometricUnavailable: "Face ID ou Touch ID n'est pas disponible sur cet appareil.",
});

Object.assign(generatedMobileCopy.pl, {
  continueWithGoogle: "Kontynuuj z Google",
  continueWithApple: "Kontynuuj z Apple",
  socialAuthDivider: "lub",
  socialAuthConfigMissing: "Trzeba skonfigurować klucze logowania.",
  socialAuthFailed: "Nie udało się zalogować.",
  enableBiometricTitle: "Włączyć Face ID?",
  enableBiometricText: "Następnym razem otworzysz Timviz szybko przez Face ID lub kod urządzenia.",
  enableBiometricAction: "Włącz",
  notNow: "Nie teraz",
  unlockWithFaceId: "Zaloguj przez Face ID",
  unlockWithBiometrics: "Szybkie logowanie",
  useDevicePasscode: "Kod urządzenia",
  biometricUnavailable: "Face ID lub Touch ID nie jest dostępne na tym urządzeniu.",
});

Object.assign(generatedMobileCopy.cs, {
  continueWithGoogle: "Pokračovat přes Google",
  continueWithApple: "Pokračovat přes Apple",
  socialAuthDivider: "nebo",
  socialAuthConfigMissing: "Je třeba nastavit přihlašovací klíče.",
  socialAuthFailed: "Přihlášení se nezdařilo.",
  enableBiometricTitle: "Zapnout Face ID?",
  enableBiometricText: "Příště můžete Timviz rychle otevřít pomocí Face ID nebo kódu zařízení.",
  enableBiometricAction: "Zapnout",
  notNow: "Teď ne",
  unlockWithFaceId: "Přihlásit přes Face ID",
  unlockWithBiometrics: "Rychlé přihlášení",
  useDevicePasscode: "Kód zařízení",
  biometricUnavailable: "Face ID nebo Touch ID není na tomto zařízení dostupné.",
});

Object.assign(generatedMobileCopy.es, {
  continueWithGoogle: "Continuar con Google",
  continueWithApple: "Continuar con Apple",
  socialAuthDivider: "o",
  socialAuthConfigMissing: "Hay que configurar las claves de inicio de sesión.",
  socialAuthFailed: "No se pudo iniciar sesión.",
  enableBiometricTitle: "¿Activar Face ID?",
  enableBiometricText: "La próxima vez podrás abrir Timviz con Face ID o el código del dispositivo.",
  enableBiometricAction: "Activar",
  notNow: "Ahora no",
  unlockWithFaceId: "Entrar con Face ID",
  unlockWithBiometrics: "Inicio rápido",
  useDevicePasscode: "Código del dispositivo",
  biometricUnavailable: "Face ID o Touch ID no está disponible en este dispositivo.",
});

Object.assign(generatedMobileCopy.de, {
  continueWithGoogle: "Mit Google fortfahren",
  continueWithApple: "Mit Apple fortfahren",
  socialAuthDivider: "oder",
  socialAuthConfigMissing: "Anmeldeschlüssel müssen konfiguriert werden.",
  socialAuthFailed: "Anmeldung fehlgeschlagen.",
  enableBiometricTitle: "Face ID aktivieren?",
  enableBiometricText: "Beim nächsten Mal können Sie Timviz schnell mit Face ID oder Gerätecode öffnen.",
  enableBiometricAction: "Aktivieren",
  notNow: "Nicht jetzt",
  unlockWithFaceId: "Mit Face ID anmelden",
  unlockWithBiometrics: "Schnelle Anmeldung",
  useDevicePasscode: "Gerätecode",
  biometricUnavailable: "Face ID oder Touch ID ist auf diesem Gerät nicht verfügbar.",
});

Object.assign(generatedMobileCopy.fr, {
  premiumSubscriptionText: "Les nouveaux comptes reçoivent 14 jours de Premium gratuits. Free inclut 100 réservations par mois, Pro ouvre les outils sans limites.",
  bookingLimitTitle: "Réservations du mois",
  bookingLimitFreeText: "Free inclut 100 réservations par mois. La limite se renouvelle au début du mois suivant.",
  bookingLimitPremiumText: "Premium ne dépense pas de crédits de réservation.",
  bookingLimitEndedTitle: "Les réservations du mois sont épuisées",
  bookingLimitEndedText: "Passez à Pro pour créer des réservations sans limite et ouvrir la réservation en ligne, Telegram et les rappels.",
  bookingLimitRemaining: "Restant",
  bookingLimitUsed: "Utilisé",
  bookingLimitLimit: "Limite",
  unlimitedShort: "unlim",
  premiumTrialIncluded: "14 jours de Premium gratuits",
  premiumTrialDaysLeft: "{count} jours de Premium restants",
  premiumTrialOneDayLeft: "Dernier jour de Premium",
  premiumTrialExpired: "L'essai Premium est terminé",
  premiumUpgradeCta: "Passer à Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro débloque",
  premiumBenefitOnlineBooking: "la réservation en ligne et les réservations illimitées au-delà de Free",
  premiumBenefitReminders: "les rappels push et Telegram",
  premiumBenefitTeam: "plus d'employés, plannings et rôles",
  premiumBenefitClients: "des outils business avancés pour grandir",
  premiumYearlyNudge: "L'abonnement annuel est plus avantageux si vous utilisez Timviz toute l'année.",
  premiumFeatureClientsTitle: "La base clients est incluse dans Free",
  premiumFeatureClientsText: "Enregistrez les clients, créez des réservations répétées et gardez l'historique de base sans Pro.",
  premiumFeatureStaffTitle: "Plus d'employés sont disponibles avec Pro",
  premiumFeatureStaffText: "Free garde le propriétaire et 1 employé. Pro ouvre une équipe plus large, les rôles et les plannings au-delà de la limite Free.",
  premiumFeatureOnlineTitle: "La réservation en ligne est disponible avec Pro",
  premiumFeatureOnlineText: "Free garde les réservations manuelles dans le calendrier. Pro ouvre le lien client pour réserver seul.",
  premiumFeatureScheduleTitle: "Le calendrier avancé est disponible avec Pro",
  premiumFeatureScheduleText: "Free inclut le calendrier de base. Pro ouvre les plannings avancés, les modes de travail et l'équipe.",
  premiumFeaturePushTitle: "Les rappels push sont disponibles avec Pro",
  premiumFeaturePushText: "Activez les notifications pour les nouvelles réservations, reports et annulations.",
  premiumFeatureTelegramTitle: "Les notifications Telegram sont disponibles avec Pro",
  premiumFeatureTelegramText: "Recevez réservations et rappels dans Telegram après le passage à Pro.",
  premiumFeatureAddressTitle: "L'adresse et la carte sont incluses dans Free",
  premiumFeatureAddressText: "Affichez l'adresse, les détails d'entrée et la carte sur la page de réservation sans Pro.",
});

Object.assign(generatedMobileCopy.pl, {
  premiumSubscriptionText: "Nowe konta otrzymują 14 dni Premium za darmo. Free obejmuje 100 wizyt miesięcznie, Pro otwiera narzędzia bez limitów.",
  bookingLimitTitle: "Wizyty w tym miesiącu",
  bookingLimitFreeText: "Free obejmuje 100 wizyt miesięcznie. Limit odnawia się na początku następnego miesiąca.",
  bookingLimitPremiumText: "Premium nie zużywa kredytów wizyt.",
  bookingLimitEndedTitle: "Limit wizyt w tym miesiącu się skończył",
  bookingLimitEndedText: "Wybierz Pro, aby tworzyć wizyty bez limitu i odblokować rezerwacje online, Telegram i przypomnienia.",
  bookingLimitRemaining: "Pozostało",
  bookingLimitUsed: "Użyto",
  bookingLimitLimit: "Limit",
  unlimitedShort: "unlim",
  premiumTrialIncluded: "14 dni Premium za darmo",
  premiumTrialDaysLeft: "Pozostało {count} dni Premium",
  premiumTrialOneDayLeft: "Ostatni dzień Premium",
  premiumTrialExpired: "Okres próbny Premium się zakończył",
  premiumUpgradeCta: "Wybierz Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro odblokowuje",
  premiumBenefitOnlineBooking: "rezerwacje online i nielimitowane wizyty ponad Free",
  premiumBenefitReminders: "przypomnienia push i Telegram",
  premiumBenefitTeam: "więcej pracowników, grafiki i role",
  premiumBenefitClients: "zaawansowane narzędzia biznesowe do wzrostu",
  premiumYearlyNudge: "Plan roczny opłaca się bardziej, jeśli pracujesz w Timviz stale.",
  premiumFeatureClientsTitle: "Baza klientów jest w Free",
  premiumFeatureClientsText: "Zapisuj klientów, twórz ponowne wizyty i zachowuj podstawową historię bez Pro.",
  premiumFeatureStaffTitle: "Więcej pracowników jest dostępne w Pro",
  premiumFeatureStaffText: "Free zostawia właściciela i 1 pracownika. Pro otwiera większy zespół, role i grafiki ponad limit Free.",
  premiumFeatureOnlineTitle: "Rezerwacje online są dostępne w Pro",
  premiumFeatureOnlineText: "Free zostawia ręczne wizyty w kalendarzu. Pro otwiera link klienta do samodzielnej rezerwacji.",
  premiumFeatureScheduleTitle: "Zaawansowany kalendarz jest dostępny w Pro",
  premiumFeatureScheduleText: "Free obejmuje podstawowy kalendarz. Pro otwiera zaawansowane grafiki, tryby pracy i planowanie zespołu.",
  premiumFeaturePushTitle: "Przypomnienia push są dostępne w Pro",
  premiumFeaturePushText: "Włącz powiadomienia o nowych, przeniesionych i anulowanych wizytach.",
  premiumFeatureTelegramTitle: "Powiadomienia Telegram są dostępne w Pro",
  premiumFeatureTelegramText: "Otrzymuj wizyty i przypomnienia w Telegramie po przejściu na Pro.",
  premiumFeatureAddressTitle: "Adres i mapa są w Free",
  premiumFeatureAddressText: "Pokazuj klientom adres, wejście i mapę na stronie rezerwacji bez Pro.",
});

Object.assign(generatedMobileCopy.cs, {
  premiumSubscriptionText: "Nové účty získají 14 dní Premium zdarma. Free obsahuje 100 rezervací měsíčně, Pro otevírá nástroje bez omezení.",
  bookingLimitTitle: "Rezervace tento měsíc",
  bookingLimitFreeText: "Free obsahuje 100 rezervací měsíčně. Limit se obnoví na začátku dalšího měsíce.",
  bookingLimitPremiumText: "Premium nespotřebovává kredity rezervací.",
  bookingLimitEndedTitle: "Rezervace na tento měsíc došly",
  bookingLimitEndedText: "Přejděte na Pro pro rezervace bez limitu, online rezervace, Telegram a připomenutí.",
  bookingLimitRemaining: "Zbývá",
  bookingLimitUsed: "Použito",
  bookingLimitLimit: "Limit",
  unlimitedShort: "unlim",
  premiumTrialIncluded: "14 dní Premium zdarma",
  premiumTrialDaysLeft: "Zbývá {count} dní Premium",
  premiumTrialOneDayLeft: "Poslední den Premium",
  premiumTrialExpired: "Zkušební Premium skončilo",
  premiumUpgradeCta: "Přejít na Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro odemyká",
  premiumBenefitOnlineBooking: "online rezervace a neomezené rezervace nad rámec Free",
  premiumBenefitReminders: "push a Telegram připomenutí",
  premiumBenefitTeam: "více zaměstnanců, rozvrhy a role",
  premiumBenefitClients: "pokročilé firemní nástroje pro růst",
  premiumYearlyNudge: "Roční tarif je výhodnější, pokud plánujete Timviz používat dlouhodobě.",
  premiumFeatureClientsTitle: "Klientská databáze je ve Free",
  premiumFeatureClientsText: "Ukládejte klienty, vytvářejte opakované rezervace a držte základní historii bez Pro.",
  premiumFeatureStaffTitle: "Více zaměstnanců je v Pro",
  premiumFeatureStaffText: "Free ponechá vlastníka a 1 zaměstnance. Pro otevírá širší tým, role a rozvrhy nad limit Free.",
  premiumFeatureOnlineTitle: "Online rezervace jsou v Pro",
  premiumFeatureOnlineText: "Free ponechá ruční rezervace v kalendáři. Pro otevře klientský odkaz pro samostatnou rezervaci.",
  premiumFeatureScheduleTitle: "Pokročilý kalendář je v Pro",
  premiumFeatureScheduleText: "Free obsahuje základní kalendář. Pro otevírá pokročilé rozvrhy, pracovní režimy a týmové plánování.",
  premiumFeaturePushTitle: "Push připomenutí jsou v Pro",
  premiumFeaturePushText: "Zapněte upozornění na nové, přesunuté a zrušené rezervace.",
  premiumFeatureTelegramTitle: "Telegram upozornění jsou v Pro",
  premiumFeatureTelegramText: "Po přechodu na Pro dostávejte rezervace a připomenutí v Telegramu.",
  premiumFeatureAddressTitle: "Adresa a mapa jsou ve Free",
  premiumFeatureAddressText: "Ukažte klientům adresu, vstup a mapu na rezervační stránce bez Pro.",
});

Object.assign(generatedMobileCopy.es, {
  premiumSubscriptionText: "Las cuentas nuevas reciben 14 días de Premium gratis. Free incluye 100 reservas al mes, Pro abre herramientas sin límites.",
  bookingLimitTitle: "Reservas de este mes",
  bookingLimitFreeText: "Free incluye 100 reservas al mes. El límite se renueva al inicio del próximo mes.",
  bookingLimitPremiumText: "Premium no consume créditos de reserva.",
  bookingLimitEndedTitle: "Las reservas de este mes se agotaron",
  bookingLimitEndedText: "Activa Pro para crear reservas sin límite y desbloquear reserva online, Telegram y recordatorios.",
  bookingLimitRemaining: "Quedan",
  bookingLimitUsed: "Usado",
  bookingLimitLimit: "Límite",
  unlimitedShort: "unlim",
  premiumTrialIncluded: "14 días de Premium gratis",
  premiumTrialDaysLeft: "Quedan {count} días de Premium",
  premiumTrialOneDayLeft: "Último día de Premium",
  premiumTrialExpired: "La prueba Premium terminó",
  premiumUpgradeCta: "Activar Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro desbloquea",
  premiumBenefitOnlineBooking: "reserva online y reservas ilimitadas más allá de Free",
  premiumBenefitReminders: "recordatorios push y Telegram",
  premiumBenefitTeam: "más empleados, horarios y roles",
  premiumBenefitClients: "herramientas avanzadas de negocio para crecer",
  premiumYearlyNudge: "El plan anual conviene más si usarás Timviz de forma continua.",
  premiumFeatureClientsTitle: "La base de clientes está incluida en Free",
  premiumFeatureClientsText: "Guarda clientes, crea reservas repetidas y conserva el historial básico sin Pro.",
  premiumFeatureStaffTitle: "Más empleados están disponibles en Pro",
  premiumFeatureStaffText: "Free mantiene al propietario y 1 empleado. Pro abre un equipo más amplio, roles y horarios sin el límite Free.",
  premiumFeatureOnlineTitle: "La reserva online está disponible en Pro",
  premiumFeatureOnlineText: "Free mantiene reservas manuales en el calendario. Pro abre el enlace de cliente para reservar.",
  premiumFeatureScheduleTitle: "El calendario avanzado está disponible en Pro",
  premiumFeatureScheduleText: "Free incluye el calendario básico. Pro abre horarios avanzados, modos de trabajo y planificación de equipo.",
  premiumFeaturePushTitle: "Los recordatorios push están disponibles en Pro",
  premiumFeaturePushText: "Activa notificaciones para reservas nuevas, movidas y canceladas.",
  premiumFeatureTelegramTitle: "Las notificaciones de Telegram están disponibles en Pro",
  premiumFeatureTelegramText: "Recibe reservas y recordatorios en Telegram después de activar Pro.",
  premiumFeatureAddressTitle: "Dirección y mapa están incluidos en Free",
  premiumFeatureAddressText: "Muestra a los clientes la dirección, entrada y mapa en la página de reserva sin Pro.",
});

Object.assign(generatedMobileCopy.de, {
  premiumSubscriptionText: "Neue Konten erhalten 14 Tage Premium kostenlos. Free enthält 100 Termine pro Monat, Pro öffnet Werkzeuge ohne Limits.",
  bookingLimitTitle: "Termine dieses Monats",
  bookingLimitFreeText: "Free enthält 100 Termine pro Monat. Das Limit erneuert sich zu Beginn des nächsten Monats.",
  bookingLimitPremiumText: "Premium verbraucht keine Terminguthaben.",
  bookingLimitEndedTitle: "Termine für diesen Monat sind aufgebraucht",
  bookingLimitEndedText: "Aktivieren Sie Pro für unbegrenzte Termine, Online-Buchung, Telegram und Erinnerungen.",
  bookingLimitRemaining: "Übrig",
  bookingLimitUsed: "Genutzt",
  bookingLimitLimit: "Limit",
  unlimitedShort: "unlim",
  premiumTrialIncluded: "14 Tage Premium kostenlos",
  premiumTrialDaysLeft: "Noch {count} Tage Premium",
  premiumTrialOneDayLeft: "Letzter Premium-Tag",
  premiumTrialExpired: "Premium-Testzeitraum beendet",
  premiumUpgradeCta: "Pro aktivieren",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro schaltet frei",
  premiumBenefitOnlineBooking: "Online-Buchung und unbegrenzte Termine über Free hinaus",
  premiumBenefitReminders: "Push- und Telegram-Erinnerungen",
  premiumBenefitTeam: "mehr Mitarbeiter, Dienstpläne und Rollen",
  premiumBenefitClients: "erweiterte Business-Werkzeuge für Wachstum",
  premiumYearlyNudge: "Der Jahrestarif lohnt sich mehr, wenn Sie Timviz dauerhaft nutzen.",
  premiumFeatureClientsTitle: "Die Kundendatenbank ist in Free enthalten",
  premiumFeatureClientsText: "Speichern Sie Kunden, erstellen Sie Wiederholungsbuchungen und behalten Sie die Basis-Historie ohne Pro.",
  premiumFeatureStaffTitle: "Mehr Mitarbeiter sind in Pro verfügbar",
  premiumFeatureStaffText: "Free behält Inhaber und 1 Mitarbeiter. Pro öffnet ein größeres Team, Rollen und Dienstpläne über das Free-Limit hinaus.",
  premiumFeatureOnlineTitle: "Online-Buchung ist in Pro verfügbar",
  premiumFeatureOnlineText: "Free behält manuelle Kalendereinträge. Pro öffnet den Kundenlink zur Selbstbuchung.",
  premiumFeatureScheduleTitle: "Erweiterter Kalender ist in Pro verfügbar",
  premiumFeatureScheduleText: "Free enthält den Basiskalender. Pro öffnet erweiterte Dienstpläne, Arbeitsmodi und Teamplanung.",
  premiumFeaturePushTitle: "Push-Erinnerungen sind in Pro verfügbar",
  premiumFeaturePushText: "Aktivieren Sie Hinweise für neue, verschobene und stornierte Buchungen.",
  premiumFeatureTelegramTitle: "Telegram-Benachrichtigungen sind in Pro verfügbar",
  premiumFeatureTelegramText: "Erhalten Sie Buchungen und Erinnerungen in Telegram nach dem Upgrade auf Pro.",
  premiumFeatureAddressTitle: "Adresse und Karte sind in Free enthalten",
  premiumFeatureAddressText: "Zeigen Sie Kunden Adresse, Eingangshinweise und Karte auf der Buchungsseite ohne Pro.",
});

Object.assign(generatedMobileCopy.fr, {
  forgotPassword: "Mot de passe oublié ?",
  forgotPasswordTitle: "Réinitialiser le mot de passe",
  forgotPasswordText: "Saisissez votre email et nous enverrons un lien pour créer un nouveau mot de passe.",
  forgotPasswordSubmit: "Envoyer le lien",
  forgotPasswordSending: "Envoi...",
  forgotPasswordSentTitle: "Vérifiez votre email",
  forgotPasswordSentText: "Si un compte existe avec cet email, nous avons envoyé un lien de réinitialisation.",
  forgotPasswordEmailRequired: "Saisissez l'email de récupération.",
  forgotPasswordFailed: "Impossible d'envoyer l'email. Réessayez.",
  registerFirstNameRequired: "Saisissez votre prénom.",
  registerEmailRequired: "Saisissez votre email.",
  registerEmailInvalid: "Saisissez un email valide.",
  registerPasswordRequired: "Saisissez votre mot de passe.",
  registerPasswordTooShort: "Le mot de passe doit contenir au moins 6 caractères.",
  registerPhoneRequired: "Saisissez votre téléphone.",
  registerCompanyRequired: "Saisissez le nom de l'entreprise.",
  captchaTitle: "Vérification de sécurité",
  captchaText: "Confirmez qu'un vrai professionnel crée ce compte. Cela prend quelques secondes.",
  captchaCancel: "Fermer",
  captchaOpenBrowser: "Ouvrir la vérification dans le navigateur",
  captchaBrowserHint: "Si la vérification n'apparaît pas, ouvrez-la dans le navigateur. Après validation, nous reviendrons dans l'application.",
  captchaCanceled: "La vérification a été annulée. Terminez-la pour créer le compte.",
  captchaFailed: "Impossible de terminer la vérification. Réessayez.",
  incomingInvites: "Invitations reçues",
  noIncomingInvites: "Personne ne vous a encore invité.",
  noInvites: "Vous n'avez encore invité personne.",
  removeMember: "Retirer de l'équipe",
  removeMemberConfirm: "Retirer cet employé de l'équipe ? Son compte restera autonome.",
  removeMemberSuccess: "Employé retiré de l'équipe.",
  memberCompanyEyebrow: "Mon équipe",
  memberCompanyTitle: "Vous êtes dans",
  memberCompanyRole: "Rôle",
  memberCompanyJoined: "Inscrit le",
  leaveCompany: "Quitter l'entreprise",
  leaveCompanyConfirm: "Quitter cette entreprise ? L'accès à l'espace de travail sera fermé.",
  leaveCompanySuccess: "Vous avez quitté l'entreprise.",
  acceptInvite: "Accepter",
  declineInvite: "Refuser",
  similarServices: "Services similaires",
  looksLikeCategory: "Cela ressemble à une catégorie :",
  useCategory: "Utiliser",
  similarCategoryExists: "Une catégorie similaire existe déjà :",
  similarServiceExists: "Un service similaire existe déjà",
  serviceAlreadyExistsSuffix: "existe déjà dans vos services",
  openExistingService: "Ouvrir l'existant",
  createNewAnyway: "Créer quand même",
  chooseServiceCategoryOrAddCustom: "Choisissez une catégorie de service ou ajoutez la vôtre.",
  serviceNameRequired: "Saisissez le nom du service.",
  durationRequired: "Indiquez la durée.",
  settingsPush: "Push",
  pushTitle: "Notifications de l'application",
  pushHint: "Nouvelles réservations et changements directement sur votre téléphone.",
  pushEnable: "Activer les notifications",
  pushEnabled: "Notifications activées",
  pushDisabled: "Notifications désactivées",
  pushPermissionDenied: "Autorisez les notifications dans les réglages du téléphone.",
  pushSaved: "Notifications mises à jour",
  pushSaveFailed: "Impossible de mettre à jour les notifications.",
  pushOpenSettings: "Ouvrir les réglages du téléphone",
  pushDeviceCount: "Appareils",
  pushProjectMissing: "Expo projectId n'est pas configuré pour les notifications push.",
  pushIosCapabilityMissing: "Les notifications push nécessitent une nouvelle build avec Push Notifications activé dans Apple Developer.",
});

Object.assign(generatedMobileCopy.pl, {
  forgotPassword: "Nie pamiętasz hasła?",
  forgotPasswordTitle: "Reset hasła",
  forgotPasswordText: "Podaj email, a wyślemy link do utworzenia nowego hasła.",
  forgotPasswordSubmit: "Wyślij link",
  forgotPasswordSending: "Wysyłanie...",
  forgotPasswordSentTitle: "Sprawdź email",
  forgotPasswordSentText: "Jeśli konto z tym emailem istnieje, wysłaliśmy link resetujący hasło.",
  forgotPasswordEmailRequired: "Podaj email do resetu.",
  forgotPasswordFailed: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
  registerFirstNameRequired: "Podaj imię.",
  registerEmailRequired: "Podaj email.",
  registerEmailInvalid: "Podaj poprawny email.",
  registerPasswordRequired: "Podaj hasło.",
  registerPasswordTooShort: "Hasło musi mieć co najmniej 6 znaków.",
  registerPhoneRequired: "Podaj telefon.",
  registerCompanyRequired: "Podaj nazwę firmy.",
  captchaTitle: "Kontrola bezpieczeństwa",
  captchaText: "Potwierdź, że konto tworzy prawdziwy specjalista. To zajmie kilka sekund.",
  captchaCancel: "Zamknij",
  captchaOpenBrowser: "Otwórz kontrolę w przeglądarce",
  captchaBrowserHint: "Jeśli kontrola się nie pojawi, otwórz ją w przeglądarce. Po zakończeniu wrócimy do aplikacji.",
  captchaCanceled: "Kontrola została anulowana. Ukończ ją, aby utworzyć konto.",
  captchaFailed: "Nie udało się ukończyć kontroli. Spróbuj ponownie.",
  incomingInvites: "Otrzymane zaproszenia",
  noIncomingInvites: "Nikt jeszcze Cię nie zaprosił.",
  noInvites: "Nie zaproszono jeszcze nikogo.",
  removeMember: "Usuń z zespołu",
  removeMemberConfirm: "Usunąć tego pracownika z zespołu? Konto pozostanie samodzielne.",
  removeMemberSuccess: "Pracownik usunięty z zespołu.",
  memberCompanyEyebrow: "Mój zespół",
  memberCompanyTitle: "Jesteś w",
  memberCompanyRole: "Rola",
  memberCompanyJoined: "Dołączono",
  leaveCompany: "Opuść firmę",
  leaveCompanyConfirm: "Opuścić tę firmę? Dostęp do obszaru roboczego zostanie zamknięty.",
  leaveCompanySuccess: "Opuszczono firmę.",
  acceptInvite: "Przyjmij",
  declineInvite: "Odrzuć",
  similarServices: "Podobne usługi",
  looksLikeCategory: "Wygląda jak kategoria:",
  useCategory: "Użyj",
  similarCategoryExists: "Podobna kategoria już istnieje:",
  similarServiceExists: "Podobna usługa już istnieje",
  serviceAlreadyExistsSuffix: "już jest w Twoich usługach",
  openExistingService: "Otwórz istniejącą",
  createNewAnyway: "Utwórz mimo to",
  chooseServiceCategoryOrAddCustom: "Wybierz kategorię usługi albo dodaj własną.",
  serviceNameRequired: "Podaj nazwę usługi.",
  durationRequired: "Podaj czas trwania.",
  settingsPush: "Push",
  pushTitle: "Powiadomienia aplikacji",
  pushHint: "Nowe rezerwacje i zmiany prosto na telefon.",
  pushEnable: "Włącz powiadomienia",
  pushEnabled: "Powiadomienia włączone",
  pushDisabled: "Powiadomienia wyłączone",
  pushPermissionDenied: "Zezwól na powiadomienia w ustawieniach telefonu.",
  pushSaved: "Powiadomienia zaktualizowane",
  pushSaveFailed: "Nie udało się zaktualizować powiadomień.",
  pushOpenSettings: "Otwórz ustawienia telefonu",
  pushDeviceCount: "Urządzenia",
  pushProjectMissing: "Expo projectId nie jest skonfigurowany dla powiadomień push.",
  pushIosCapabilityMissing: "Powiadomienia push wymagają nowej build z włączonym Push Notifications w Apple Developer.",
});

Object.assign(generatedMobileCopy.cs, {
  forgotPassword: "Zapomenuté heslo?",
  forgotPasswordTitle: "Obnovit heslo",
  forgotPasswordText: "Zadejte email a pošleme odkaz pro vytvoření nového hesla.",
  forgotPasswordSubmit: "Poslat odkaz",
  forgotPasswordSending: "Odesílání...",
  forgotPasswordSentTitle: "Zkontrolujte email",
  forgotPasswordSentText: "Pokud účet s tímto emailem existuje, poslali jsme odkaz pro obnovu hesla.",
  forgotPasswordEmailRequired: "Zadejte email pro obnovu.",
  forgotPasswordFailed: "Email se nepodařilo odeslat. Zkuste to znovu.",
  registerFirstNameRequired: "Zadejte jméno.",
  registerEmailRequired: "Zadejte email.",
  registerEmailInvalid: "Zadejte platný email.",
  registerPasswordRequired: "Zadejte heslo.",
  registerPasswordTooShort: "Heslo musí mít alespoň 6 znaků.",
  registerPhoneRequired: "Zadejte telefon.",
  registerCompanyRequired: "Zadejte název firmy.",
  captchaTitle: "Bezpečnostní kontrola",
  captchaText: "Potvrďte, že účet vytváří skutečný profesionál. Zabere to pár sekund.",
  captchaCancel: "Zavřít",
  captchaOpenBrowser: "Otevřít kontrolu v prohlížeči",
  captchaBrowserHint: "Pokud se kontrola nezobrazí, otevřete ji v prohlížeči. Po dokončení se vrátíme do aplikace.",
  captchaCanceled: "Kontrola byla zrušena. Dokončete ji pro vytvoření účtu.",
  captchaFailed: "Kontrolu se nepodařilo dokončit. Zkuste to znovu.",
  incomingInvites: "Přijaté pozvánky",
  noIncomingInvites: "Nikdo vás zatím nepozval.",
  noInvites: "Zatím jste nikoho nepozvali.",
  removeMember: "Odebrat z týmu",
  removeMemberConfirm: "Odebrat tohoto zaměstnance z týmu? Jeho účet zůstane samostatný.",
  removeMemberSuccess: "Zaměstnanec odebrán z týmu.",
  memberCompanyEyebrow: "Můj tým",
  memberCompanyTitle: "Jste v",
  memberCompanyRole: "Role",
  memberCompanyJoined: "Připojeno",
  leaveCompany: "Opustit firmu",
  leaveCompanyConfirm: "Opustit tuto firmu? Přístup k pracovnímu prostoru bude uzavřen.",
  leaveCompanySuccess: "Opustili jste firmu.",
  acceptInvite: "Přijmout",
  declineInvite: "Odmítnout",
  similarServices: "Podobné služby",
  looksLikeCategory: "Vypadá to jako kategorie:",
  useCategory: "Použít",
  similarCategoryExists: "Podobná kategorie už existuje:",
  similarServiceExists: "Podobná služba už existuje",
  serviceAlreadyExistsSuffix: "už je ve vašich službách",
  openExistingService: "Otevřít existující",
  createNewAnyway: "Přesto vytvořit",
  chooseServiceCategoryOrAddCustom: "Vyberte kategorii služby nebo přidejte vlastní.",
  serviceNameRequired: "Zadejte název služby.",
  durationRequired: "Zadejte délku trvání.",
  settingsPush: "Push",
  pushTitle: "Upozornění aplikace",
  pushHint: "Nové rezervace a změny přímo na telefon.",
  pushEnable: "Zapnout upozornění",
  pushEnabled: "Upozornění zapnuta",
  pushDisabled: "Upozornění vypnuta",
  pushPermissionDenied: "Povolte upozornění v nastavení telefonu.",
  pushSaved: "Upozornění aktualizována",
  pushSaveFailed: "Upozornění se nepodařilo aktualizovat.",
  pushOpenSettings: "Otevřít nastavení telefonu",
  pushDeviceCount: "Zařízení",
  pushProjectMissing: "Expo projectId není nastaven pro push upozornění.",
  pushIosCapabilityMissing: "Push upozornění vyžadují novou build s povoleným Push Notifications v Apple Developer.",
});

Object.assign(generatedMobileCopy.es, {
  forgotPassword: "¿Olvidaste la contraseña?",
  forgotPasswordTitle: "Restablecer contraseña",
  forgotPasswordText: "Introduce tu email y enviaremos un enlace para crear una nueva contraseña.",
  forgotPasswordSubmit: "Enviar enlace",
  forgotPasswordSending: "Enviando...",
  forgotPasswordSentTitle: "Revisa tu email",
  forgotPasswordSentText: "Si existe una cuenta con este email, hemos enviado un enlace de restablecimiento.",
  forgotPasswordEmailRequired: "Introduce el email para restablecer.",
  forgotPasswordFailed: "No se pudo enviar el email. Inténtalo de nuevo.",
  registerFirstNameRequired: "Introduce tu nombre.",
  registerEmailRequired: "Introduce tu email.",
  registerEmailInvalid: "Introduce un email válido.",
  registerPasswordRequired: "Introduce tu contraseña.",
  registerPasswordTooShort: "La contraseña debe tener al menos 6 caracteres.",
  registerPhoneRequired: "Introduce tu teléfono.",
  registerCompanyRequired: "Introduce el nombre del negocio.",
  captchaTitle: "Verificación de seguridad",
  captchaText: "Confirma que una persona real está creando la cuenta. Tarda unos segundos.",
  captchaCancel: "Cerrar",
  captchaOpenBrowser: "Abrir verificación en navegador",
  captchaBrowserHint: "Si la verificación no aparece, ábrela en el navegador. Al terminar volveremos a la app.",
  captchaCanceled: "La verificación fue cancelada. Complétala para crear la cuenta.",
  captchaFailed: "No se pudo completar la verificación. Inténtalo de nuevo.",
  incomingInvites: "Invitaciones recibidas",
  noIncomingInvites: "Nadie te ha invitado todavía.",
  noInvites: "Todavía no has invitado a nadie.",
  removeMember: "Quitar del equipo",
  removeMemberConfirm: "¿Quitar este empleado del equipo? Su cuenta seguirá independiente.",
  removeMemberSuccess: "Empleado quitado del equipo.",
  memberCompanyEyebrow: "Mi equipo",
  memberCompanyTitle: "Estás en",
  memberCompanyRole: "Rol",
  memberCompanyJoined: "Se unió",
  leaveCompany: "Salir de la empresa",
  leaveCompanyConfirm: "¿Salir de esta empresa? Se cerrará el acceso al espacio de trabajo.",
  leaveCompanySuccess: "Has salido de la empresa.",
  acceptInvite: "Aceptar",
  declineInvite: "Rechazar",
  similarServices: "Servicios similares",
  looksLikeCategory: "Parece una categoría:",
  useCategory: "Usar",
  similarCategoryExists: "Ya existe una categoría similar:",
  similarServiceExists: "Ya existe un servicio similar",
  serviceAlreadyExistsSuffix: "ya está en tus servicios",
  openExistingService: "Abrir existente",
  createNewAnyway: "Crear igualmente",
  chooseServiceCategoryOrAddCustom: "Elige una categoría de servicio o añade la tuya.",
  serviceNameRequired: "Introduce el nombre del servicio.",
  durationRequired: "Indica la duración.",
  settingsPush: "Push",
  pushTitle: "Notificaciones de la app",
  pushHint: "Nuevas reservas y cambios directamente en tu teléfono.",
  pushEnable: "Activar notificaciones",
  pushEnabled: "Notificaciones activadas",
  pushDisabled: "Notificaciones desactivadas",
  pushPermissionDenied: "Permite las notificaciones en ajustes del teléfono.",
  pushSaved: "Notificaciones actualizadas",
  pushSaveFailed: "No se pudieron actualizar las notificaciones.",
  pushOpenSettings: "Abrir ajustes del teléfono",
  pushDeviceCount: "Dispositivos",
  pushProjectMissing: "Expo projectId no está configurado para notificaciones push.",
  pushIosCapabilityMissing: "Las notificaciones push requieren una nueva build con Push Notifications activado en Apple Developer.",
});

Object.assign(generatedMobileCopy.de, {
  forgotPassword: "Passwort vergessen?",
  forgotPasswordTitle: "Passwort zurücksetzen",
  forgotPasswordText: "Geben Sie Ihre E-Mail ein, wir senden einen Link zum Erstellen eines neuen Passworts.",
  forgotPasswordSubmit: "Link senden",
  forgotPasswordSending: "Senden...",
  forgotPasswordSentTitle: "E-Mail prüfen",
  forgotPasswordSentText: "Wenn ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet.",
  forgotPasswordEmailRequired: "E-Mail zum Zurücksetzen eingeben.",
  forgotPasswordFailed: "E-Mail konnte nicht gesendet werden. Bitte erneut versuchen.",
  registerFirstNameRequired: "Vorname eingeben.",
  registerEmailRequired: "E-Mail eingeben.",
  registerEmailInvalid: "Gültige E-Mail eingeben.",
  registerPasswordRequired: "Passwort eingeben.",
  registerPasswordTooShort: "Das Passwort muss mindestens 6 Zeichen haben.",
  registerPhoneRequired: "Telefon eingeben.",
  registerCompanyRequired: "Firmennamen eingeben.",
  captchaTitle: "Sicherheitsprüfung",
  captchaText: "Bestätigen Sie, dass ein echter Profi dieses Konto erstellt. Das dauert nur wenige Sekunden.",
  captchaCancel: "Schließen",
  captchaOpenBrowser: "Prüfung im Browser öffnen",
  captchaBrowserHint: "Wenn die Prüfung nicht erscheint, öffnen Sie sie im Browser. Danach kehren wir zur App zurück.",
  captchaCanceled: "Die Prüfung wurde abgebrochen. Schließen Sie sie ab, um das Konto zu erstellen.",
  captchaFailed: "Prüfung konnte nicht abgeschlossen werden. Bitte erneut versuchen.",
  incomingInvites: "Erhaltene Einladungen",
  noIncomingInvites: "Noch hat Sie niemand eingeladen.",
  noInvites: "Sie haben noch niemanden eingeladen.",
  removeMember: "Aus Team entfernen",
  removeMemberConfirm: "Diesen Mitarbeiter aus dem Team entfernen? Das Konto bleibt eigenständig.",
  removeMemberSuccess: "Mitarbeiter aus dem Team entfernt.",
  memberCompanyEyebrow: "Mein Team",
  memberCompanyTitle: "Sie sind in",
  memberCompanyRole: "Rolle",
  memberCompanyJoined: "Beigetreten",
  leaveCompany: "Firma verlassen",
  leaveCompanyConfirm: "Diese Firma verlassen? Der Zugriff auf den Arbeitsbereich wird geschlossen.",
  leaveCompanySuccess: "Sie haben die Firma verlassen.",
  acceptInvite: "Annehmen",
  declineInvite: "Ablehnen",
  similarServices: "Ähnliche Dienste",
  looksLikeCategory: "Sieht nach Kategorie aus:",
  useCategory: "Verwenden",
  similarCategoryExists: "Eine ähnliche Kategorie existiert bereits:",
  similarServiceExists: "Ein ähnlicher Dienst existiert bereits",
  serviceAlreadyExistsSuffix: "ist bereits in Ihren Diensten",
  openExistingService: "Vorhandenen öffnen",
  createNewAnyway: "Trotzdem erstellen",
  chooseServiceCategoryOrAddCustom: "Wählen Sie eine Dienstkategorie oder fügen Sie eine eigene hinzu.",
  serviceNameRequired: "Dienstnamen eingeben.",
  durationRequired: "Dauer angeben.",
  settingsPush: "Push",
  pushTitle: "App-Benachrichtigungen",
  pushHint: "Neue Buchungen und Änderungen direkt auf Ihrem Telefon.",
  pushEnable: "Benachrichtigungen aktivieren",
  pushEnabled: "Benachrichtigungen aktiviert",
  pushDisabled: "Benachrichtigungen deaktiviert",
  pushPermissionDenied: "Erlauben Sie Benachrichtigungen in den Telefoneinstellungen.",
  pushSaved: "Benachrichtigungen aktualisiert",
  pushSaveFailed: "Benachrichtigungen konnten nicht aktualisiert werden.",
  pushOpenSettings: "Telefoneinstellungen öffnen",
  pushDeviceCount: "Geräte",
  pushProjectMissing: "Expo projectId ist für Push-Benachrichtigungen nicht konfiguriert.",
  pushIosCapabilityMissing: "Push-Benachrichtigungen benötigen eine neue Build mit aktivierten Push Notifications in Apple Developer.",
});

Object.assign(generatedMobileCopy.pl, {
  notificationsNew: "Nowe",
  notificationsArchive: "Archiwum",
  visits: "wizyt",
});

Object.assign(generatedMobileCopy.cs, {
  serviceMode: "Formát práce",
  visits: "návštěv",
});

Object.assign(generatedMobileCopy.de, {
  registerShort: "Erstellen",
  newMasterCta: "Neuer Profi? Konto erstellen",
  supportSend: "Senden",
  supportSent: "Nachricht gesendet.",
});

const legalCopy = {
  uk: {
    legalSubscriptionIntro: "Оформлюючи підписку, ви погоджуєтесь з:",
    termsOfUse: "Умови використання",
    privacyPolicy: "Політика конфіденційності",
    premiumRestore: "Відновити покупки",
    helpSupport: "Допомога та документи",
    support: "Підтримка",
    subscriptionTerms: "Умови підписки",
    refundPolicy: "Політика повернення",
    accountDeletion: "Видалення акаунта",
  },
  ru: {
    legalSubscriptionIntro: "Оформляя подписку, вы соглашаетесь с:",
    termsOfUse: "Условия использования",
    privacyPolicy: "Политика конфиденциальности",
    premiumRestore: "Восстановить покупки",
    helpSupport: "Помощь и документы",
    support: "Поддержка",
    subscriptionTerms: "Условия подписки",
    refundPolicy: "Политика возврата",
    accountDeletion: "Удаление аккаунта",
  },
  en: {
    legalSubscriptionIntro: "By subscribing, you agree to:",
    termsOfUse: "Terms of Use",
    privacyPolicy: "Privacy Policy",
    premiumRestore: "Restore purchases",
    helpSupport: "Help & Legal",
    support: "Support",
    subscriptionTerms: "Subscription Terms",
    refundPolicy: "Refund Policy",
    accountDeletion: "Account deletion",
  },
  fr: {
    legalSubscriptionIntro: "En vous abonnant, vous acceptez :",
    termsOfUse: "Conditions d’utilisation",
    privacyPolicy: "Politique de confidentialité",
    premiumRestore: "Restaurer les achats",
    helpSupport: "Aide et documents légaux",
    support: "Assistance",
    subscriptionTerms: "Conditions d’abonnement",
    refundPolicy: "Politique de remboursement",
    accountDeletion: "Suppression du compte",
  },
  pl: {
    legalSubscriptionIntro: "Subskrybując, akceptujesz:",
    termsOfUse: "Warunki korzystania",
    privacyPolicy: "Polityka prywatności",
    premiumRestore: "Przywróć zakupy",
    helpSupport: "Pomoc i dokumenty prawne",
    support: "Wsparcie",
    subscriptionTerms: "Warunki subskrypcji",
    refundPolicy: "Polityka zwrotów",
    accountDeletion: "Usunięcie konta",
  },
  cs: {
    legalSubscriptionIntro: "Přihlášením k odběru souhlasíte s:",
    termsOfUse: "Podmínky použití",
    privacyPolicy: "Zásady ochrany osobních údajů",
    premiumRestore: "Obnovit nákupy",
    helpSupport: "Nápověda a právní dokumenty",
    support: "Podpora",
    subscriptionTerms: "Podmínky předplatného",
    refundPolicy: "Zásady vrácení peněz",
    accountDeletion: "Smazání účtu",
  },
  es: {
    legalSubscriptionIntro: "Al suscribirte, aceptas:",
    termsOfUse: "Términos de uso",
    privacyPolicy: "Política de privacidad",
    premiumRestore: "Restaurar compras",
    helpSupport: "Ayuda y documentos legales",
    support: "Soporte",
    subscriptionTerms: "Términos de suscripción",
    refundPolicy: "Política de reembolso",
    accountDeletion: "Eliminación de cuenta",
  },
  de: {
    legalSubscriptionIntro: "Mit dem Abonnement akzeptierst du:",
    termsOfUse: "Nutzungsbedingungen",
    privacyPolicy: "Datenschutzrichtlinie",
    premiumRestore: "Käufe wiederherstellen",
    helpSupport: "Hilfe & Rechtliches",
    support: "Support",
    subscriptionTerms: "Abonnementbedingungen",
    refundPolicy: "Rückerstattungsrichtlinie",
    accountDeletion: "Konto löschen",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

const copy = {
  uk: { ...baseCopy.uk, ...legalCopy.uk },
  ru: { ...baseCopy.ru, ...legalCopy.ru },
  en: { ...baseCopy.en, ...legalCopy.en },
  fr: { ...baseCopy.en, ...generatedMobileCopy.fr, ...legalCopy.fr },
  pl: { ...baseCopy.en, ...generatedMobileCopy.pl, ...legalCopy.pl },
  cs: { ...baseCopy.en, ...generatedMobileCopy.cs, ...legalCopy.cs },
  es: { ...baseCopy.en, ...generatedMobileCopy.es, ...legalCopy.es },
  de: { ...baseCopy.en, ...generatedMobileCopy.de, ...legalCopy.de },
} satisfies Record<AppLanguage, Record<keyof typeof baseCopy.en, string>>;

const TIMEZONE_COUNTRY_ISO: Record<string, string> = {
  "Europe/Kiev": "UA",
  "Europe/Kyiv": "UA",
  "Europe/Uzhgorod": "UA",
  "Europe/Zaporozhye": "UA",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/London": "GB",
  "Europe/Moscow": "RU",
  "Europe/Athens": "GR",
  "Europe/Sofia": "BG",
  "Europe/Bucharest": "RO",
  "Europe/Istanbul": "TR",
  "Africa/Cairo": "EG",
  "Africa/Johannesburg": "ZA",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "Asia/Dubai": "AE",
};

const COUNTRY_LANGUAGE_BY_ISO: Record<string, AppLanguage> = {
  UA: "uk",
  RU: "ru",
  PL: "pl",
  CZ: "cs",
  FR: "fr",
  DE: "de",
  ES: "es",
  GB: "en",
  US: "en",
  CA: "en",
};

function getCountryIsoFromTimezone(timeZone?: string | null) {
  const normalized = String(timeZone || "").trim();
  if (!normalized) return "";
  return TIMEZONE_COUNTRY_ISO[normalized] || "";
}

function detectLanguage(): AppLanguage {
  const locale = Localization.getLocales()[0];
  const languageCandidates = [
    locale?.languageCode,
    locale?.languageTag,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  if (languageCandidates.some((value) => value.startsWith("uk"))) return "uk";
  if (languageCandidates.some((value) => value.startsWith("ru"))) return "ru";
  if (languageCandidates.some((value) => value.startsWith("fr"))) return "fr";
  if (languageCandidates.some((value) => value.startsWith("pl"))) return "pl";
  if (languageCandidates.some((value) => value.startsWith("cs") || value.startsWith("cz"))) return "cs";
  if (languageCandidates.some((value) => value.startsWith("es"))) return "es";
  if (languageCandidates.some((value) => value.startsWith("de"))) return "de";

  const countryCandidates = [
    getCountryIsoFromTimezone(getDetectedTimezone()),
    locale?.regionCode,
  ]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());
  for (const countryIso of countryCandidates) {
    const countryLanguage = COUNTRY_LANGUAGE_BY_ISO[countryIso];
    if (countryLanguage) return countryLanguage;
  }

  if (languageCandidates.some((value) => value.startsWith("en"))) return "en";

  return "en";
}

function normalizeAppLanguage(value: unknown): AppLanguage | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("uk") || normalized.includes("ua") || normalized.includes("укра")) return "uk";
  if (normalized.startsWith("ru") || normalized.includes("рус")) return "ru";
  if (normalized.startsWith("fr") || normalized.includes("fran")) return "fr";
  if (normalized.startsWith("pl") || normalized.includes("pol")) return "pl";
  if (normalized.startsWith("cs") || normalized.startsWith("cz") || normalized.includes("czech")) return "cs";
  if (normalized.startsWith("es") || normalized.includes("span")) return "es";
  if (normalized.startsWith("de") || normalized.includes("german") || normalized.includes("deut")) return "de";
  if (normalized.startsWith("en") || normalized.includes("english")) return "en";
  return null;
}

function localeForLanguage(language: AppLanguage) {
  const locales: Record<AppLanguage, string> = {
    uk: "uk-UA",
    ru: "ru-RU",
    en: "en-US",
    fr: "fr-FR",
    pl: "pl-PL",
    cs: "cs-CZ",
    es: "es-ES",
    de: "de-DE",
  };
  return locales[language];
}

const COUNTRY_LABELS: Record<AppLanguage, Record<string, string>> = {
  uk: {
    Ukraine: "Україна",
    Russia: "Росія",
    Poland: "Польща",
    "United Kingdom": "Велика Британія",
    "United States": "США",
    Germany: "Німеччина",
    France: "Франція",
    Spain: "Іспанія",
    Italy: "Італія",
    International: "Міжнародний",
  },
  ru: {
    Ukraine: "Украина",
    Russia: "Россия",
    Poland: "Польша",
    "United Kingdom": "Великобритания",
    "United States": "США",
    Germany: "Германия",
    France: "Франция",
    Spain: "Испания",
    Italy: "Италия",
    International: "Международный",
  },
  en: {},
  fr: {},
  pl: {},
  cs: {},
  es: {},
  de: {},
};

const SERVICE_CATEGORY_LABELS: Record<AppLanguage, Record<string, string>> = {
  uk: {
    "Волосы и стрижки": "Волосся та стрижки",
    "Барбер и мужские стрижки": "Барбер і чоловічі стрижки",
    "Мужской парикмахер": "Барбер і чоловічі стрижки",
    "Парикмахерская": "Волосся та стрижки",
    "Массаж": "Масаж",
    "Волосы": "Волосся та стрижки",
    "Ногти": "Нігті",
    "Брови и ресницы": "Брови та вії",
    "Ресницы": "Вії",
    "Лицо": "Обличчя",
    "Косметология": "Косметологія",
    "Депиляция": "Депіляція",
	    "Тело": "Тіло",
	    "Макияж": "Макіяж",
	    "Перманентный макияж": "Перманент",
	    "Тату": "Тату",
	    "Тату / Перманент": "Перманент",
	    "Обучение": "Навчання",
	    "Ремонт": "Ремонт",
	    "Другое": "Інше",
	    "Без категории": "Без категорії",
    "Салон красоты": "Салон краси",
    "Медспа": "Медспа",
    "Парикмахер": "Барбер і чоловічі стрижки",
    "Массажный салон": "Масажний салон",
    "Спа-салон и сауна": "Спа-салон і сауна",
    "Салон депиляции": "Салон депіляції",
    "Тату и пирсинг": "Тату та пірсинг",
    "Студия загара": "Студія засмаги",
    "Физиотерапия": "Фізіотерапія",
    "Другая": "Інша",
  },
  ru: {},
  en: {
    "Волосы и стрижки": "Hair & Haircuts",
    "Барбер и мужские стрижки": "Barber & Men's Haircuts",
    "Мужской парикмахер": "Barber & Men's Haircuts",
    "Парикмахерская": "Hair & Haircuts",
    "Массаж": "Massage",
    "Волосы": "Hair & Haircuts",
    "Ногти": "Nails",
	    "Брови и ресницы": "Brows & Lashes",
    "Ресницы": "Lashes",
	    "Лицо": "Face Care",
	    "Перманентный макияж": "Permanent Makeup",
	    "Тату": "Tattoo",
	    "Косметология": "Cosmetology",
	    "Депиляция": "Hair Removal",
	    "Тело": "Body / SPA",
	    "Макияж": "Makeup",
	    "Тату / Перманент": "Permanent Makeup",
	    "Обучение": "Education",
	    "Ремонт": "Repair",
	    "Другое": "Other",
	    "Без категории": "No Category",
    "Салон красоты": "Beauty salon",
    "Медспа": "Medspa",
    "Парикмахер": "Barber & Men's Haircuts",
    "Массажный салон": "Massage studio",
    "Спа-салон и сауна": "Spa and sauna",
    "Салон депиляции": "Hair removal salon",
    "Тату и пирсинг": "Tattoo and piercing",
    "Студия загара": "Tanning studio",
    "Физиотерапия": "Physiotherapy",
    "Другая": "Other",
  },
  fr: {
    "Волосы и стрижки": "Cheveux et coupes",
    "Барбер и мужские стрижки": "Barbier et coupes homme",
    "Мужской парикмахер": "Barbier et coupes homme",
    "Парикмахерская": "Cheveux et coupes",
    "Массаж": "Massage",
    "Волосы": "Cheveux et coupes",
    "Ногти": "Ongles",
    "Брови и ресницы": "Sourcils et cils",
    "Ресницы": "Cils",
	    "Лицо": "Visage",
	    "Перманентный макияж": "Maquillage permanent",
	    "Тату": "Tatouage",
	    "Косметология": "Cosmétologie",
	    "Депиляция": "Épilation",
	    "Тело": "Corps / SPA",
	    "Макияж": "Maquillage",
	    "Тату / Перманент": "Maquillage permanent",
	    "Обучение": "Formation",
	    "Ремонт": "Réparation",
	    "Другое": "Autre",
	    "Без категории": "Sans catégorie",
    "Салон красоты": "Institut de beauté",
    "Медспа": "Medspa",
    "Парикмахер": "Barbier et coupes homme",
    "Массажный салон": "Salon de massage",
    "Спа-салон и сауна": "Spa et sauna",
    "Салон депиляции": "Salon d'épilation",
    "Тату и пирсинг": "Tatouage et piercing",
    "Студия загара": "Studio de bronzage",
    "Физиотерапия": "Kinésithérapie",
    "Другая": "Autre",
  },
  pl: {
    "Волосы и стрижки": "Włosy i strzyżenia",
    "Барбер и мужские стрижки": "Barber i strzyżenia męskie",
    "Мужской парикмахер": "Barber i strzyżenia męskie",
    "Парикмахерская": "Włosy i strzyżenia",
    "Массаж": "Masaż",
    "Волосы": "Włosy i strzyżenia",
    "Ногти": "Paznokcie",
    "Брови и ресницы": "Brwi i rzęsy",
    "Ресницы": "Rzęsy",
	    "Лицо": "Twarz",
	    "Перманентный макияж": "Makijaż permanentny",
	    "Тату": "Tatuaż",
	    "Косметология": "Kosmetologia",
	    "Депиляция": "Depilacja",
	    "Тело": "Ciało / SPA",
	    "Макияж": "Makijaż",
	    "Тату / Перманент": "Makijaż permanentny",
	    "Обучение": "Szkolenia",
	    "Ремонт": "Naprawa",
	    "Другое": "Inne",
	    "Без категории": "Bez kategorii",
    "Салон красоты": "Salon beauty",
    "Медспа": "Medspa",
    "Парикмахер": "Barber i strzyżenia męskie",
    "Массажный салон": "Gabinet masażu",
    "Спа-салон и сауна": "Spa i sauna",
    "Салон депиляции": "Salon depilacji",
    "Тату и пирсинг": "Tatuaż i piercing",
    "Студия загара": "Studio opalania",
    "Физиотерапия": "Fizjoterapia",
    "Другая": "Inne",
  },
  cs: {
    "Волосы и стрижки": "Vlasy a střihy",
    "Барбер и мужские стрижки": "Barber a pánské střihy",
    "Мужской парикмахер": "Barber a pánské střihy",
    "Парикмахерская": "Vlasy a střihy",
    "Массаж": "Masáž",
    "Волосы": "Vlasy a střihy",
    "Ногти": "Nehty",
    "Брови и ресницы": "Obočí a řasy",
    "Ресницы": "Řasy",
	    "Лицо": "Obličej",
	    "Перманентный макияж": "Permanentní make-up",
	    "Тату": "Tetování",
	    "Косметология": "Kosmetologie",
	    "Депиляция": "Depilace",
	    "Тело": "Tělo / SPA",
	    "Макияж": "Make-up",
	    "Тату / Перманент": "Permanentní make-up",
	    "Обучение": "Školení",
	    "Ремонт": "Opravy",
	    "Другое": "Jiné",
	    "Без категории": "Bez kategorie",
    "Салон красоты": "Kosmetický salon",
    "Медспа": "Medspa",
    "Парикмахер": "Barber a pánské střihy",
    "Массажный салон": "Masážní salon",
    "Спа-салон и сауна": "Spa a sauna",
    "Салон депиляции": "Depilační salon",
    "Тату и пирсинг": "Tetování a piercing",
    "Студия загара": "Solární studio",
    "Физиотерапия": "Fyzioterapie",
    "Другая": "Jiné",
  },
  es: {
    "Волосы и стрижки": "Cabello y cortes",
    "Барбер и мужские стрижки": "Barbería y cortes masculinos",
    "Мужской парикмахер": "Barbería y cortes masculinos",
    "Парикмахерская": "Cabello y cortes",
    "Массаж": "Masaje",
    "Волосы": "Cabello y cortes",
    "Ногти": "Uñas",
    "Брови и ресницы": "Cejas y pestañas",
    "Ресницы": "Pestañas",
	    "Лицо": "Rostro",
	    "Перманентный макияж": "Maquillaje permanente",
	    "Тату": "Tatuaje",
	    "Косметология": "Cosmetología",
	    "Депиляция": "Depilación",
	    "Тело": "Cuerpo / SPA",
	    "Макияж": "Maquillaje",
	    "Тату / Перманент": "Maquillaje permanente",
	    "Обучение": "Formación",
	    "Ремонт": "Reparación",
	    "Другое": "Otro",
	    "Без категории": "Sin categoría",
    "Салон красоты": "Salón de belleza",
    "Медспа": "Medspa",
    "Парикмахер": "Barbería y cortes masculinos",
    "Массажный салон": "Centro de masajes",
    "Спа-салон и сауна": "Spa y sauna",
    "Салон депиляции": "Centro de depilación",
    "Тату и пирсинг": "Tatuajes y piercing",
    "Студия загара": "Centro de bronceado",
    "Физиотерапия": "Fisioterapia",
    "Другая": "Otra",
  },
  de: {
    "Волосы и стрижки": "Haare und Haarschnitte",
    "Барбер и мужские стрижки": "Barber und Herrenhaarschnitte",
    "Мужской парикмахер": "Barber und Herrenhaarschnitte",
    "Парикмахерская": "Haare und Haarschnitte",
    "Массаж": "Massage",
    "Волосы": "Haare und Haarschnitte",
    "Ногти": "Nägel",
    "Брови и ресницы": "Augenbrauen und Wimpern",
    "Ресницы": "Wimpern",
	    "Лицо": "Gesicht",
	    "Перманентный макияж": "Permanent Make-up",
	    "Тату": "Tattoo",
	    "Косметология": "Kosmetologie",
	    "Депиляция": "Haarentfernung",
	    "Тело": "Körper / SPA",
	    "Макияж": "Make-up",
	    "Тату / Перманент": "Permanent Make-up",
	    "Обучение": "Schulung",
	    "Ремонт": "Reparatur",
	    "Другое": "Andere",
	    "Без категории": "Ohne Kategorie",
    "Салон красоты": "Kosmetikstudio",
    "Медспа": "Medspa",
    "Парикмахер": "Barber und Herrenhaarschnitte",
    "Массажный салон": "Massagestudio",
    "Спа-салон и сауна": "Spa und Sauna",
    "Салон депиляции": "Haarentfernungsstudio",
    "Тату и пирсинг": "Tattoo und Piercing",
    "Студия загара": "Sonnenstudio",
    "Физиотерапия": "Physiotherapie",
    "Другая": "Andere",
  },
};

const MOBILE_SERVICE_TRANSLATION_EXTRAS: Record<string, Partial<Record<AppLanguage, string>>> = {
  "Женская стрижка": { fr: "Coupe femme", pl: "Strzyżenie damskie", cs: "Dámský střih", es: "Corte de mujer", de: "Damenhaarschnitt" },
  "Мужская стрижка": { fr: "Coupe homme", pl: "Strzyżenie męskie", cs: "Pánský střih", es: "Corte de hombre", de: "Herrenhaarschnitt" },
  "Укладка волос": { fr: "Coiffure", pl: "Stylizacja włosów", cs: "Vlasový styling", es: "Peinado", de: "Haarstyling" },
  "Сушка феном": { fr: "Brushing", pl: "Suszenie", cs: "Vyfoukejte", es: "Blow-dry", de: "Föhnen" },
  "Детская стрижка": { fr: "Coupe enfant", pl: "Strzyżenie dziecięce", cs: "Dětský střih", es: "Corte infantil", de: "Kinderhaarschnitt" },
  "Окрашивание волос": { fr: "Coloration cheveux", pl: "Koloryzacja włosów", cs: "Barvení vlasů", es: "Tinte", de: "Haarfärben" },
  "Балаяж": { fr: "Balayage", pl: "Balayage", cs: "Balayage", es: "Balayage", de: "Balayage" },
  "Тонирование волос": { fr: "Tonification cheveux", pl: "Tonizacja włosów", cs: "Tónování vlasů", es: "Tonificación", de: "Haartonung" },
  "Подкрашивание корней": { fr: "Retouche racines", pl: "Retusz włosów", cs: "Kořenový retuš", es: "Retoque de raíces", de: "Ansatzausbesserung" },
  "Мытье волос": { fr: "Lavage des cheveux", pl: "Mycie włosów", cs: "Mytí vlasů", es: "Lavado de cabello", de: "Haarwäsche" },
  "Бритье головы": { fr: "Rasage de la tête", pl: "Golenie głowy", cs: "Holení hlavy", es: "Afeitado de cabeza", de: "Kopfrasur" },
  "Маникюр": { fr: "Manucure", pl: "Manicure", cs: "Manikúra", es: "Manicura", de: "Maniküre" },
  "Педикюр": { fr: "Pédicure", pl: "Pedicure", cs: "Pedikúra", es: "Pedicura", de: "Pediküre" },
  "Гелевый маникюр": { fr: "Manucure gel", pl: "Manicure żelowy", cs: "Gelová manikúra", es: "Manicura de gel", de: "Gel-Maniküre" },
  "Русский маникюр": { fr: "Manucure russe", pl: "Manicure rosyjski", cs: "Ruská manikúra", es: "Manicura rusa", de: "Russische Maniküre" },
  "Мужской маникюр и педикюр": { fr: "Manucure et pédicure homme", pl: "Manicure i pedicure męski", cs: "Pánská manikúra a pedikúra", es: "Manicura y pedicura masculina", de: "Herrenmaniküre und Pediküre" },
  "Акриловые ногти": { fr: "Ongles en acrylique", pl: "Paznokcie akrylowe", cs: "Akrylové nehty", es: "Uñas acrílicas", de: "Acrylnägel" },
  "Дизайн ногтей": { fr: "Nail art", pl: "Stylizacja paznokci", cs: "Nail art", es: "Diseño de uñas", de: "Nageldesign" },
  "Наращивание ногтей": { fr: "Extensions d’ongles", pl: "Przedłużanie paznokci", cs: "Prodloužení nehtů", es: "Extensiones de uñas", de: "Nagelverlängerung" },
  "Ремонт ногтей": { fr: "Réparation d’ongle", pl: "Naprawa paznokcia", cs: "Oprava nehtu", es: "Reparación de uñas", de: "Nagelreparatur" },
  "Маникюр и педикюр": { fr: "Manucure et pédicure", pl: "Manicure i pedicure", cs: "Manikúra & pedikúra", es: "Manicura y pedicura", de: "Maniküre und Pediküre" },
  "Парафиновый маникюр": { fr: "Manucure à la paraffine", pl: "Manicure parafinowy", cs: "Parafínová manikúra", es: "Manicura con parafina", de: "Paraffin-Maniküre" },
  "Медицинский педикюр": { fr: "Pédicure médicale", pl: "Pedicure medyczny", cs: "Lékařská pedikúra", es: "Pedicura médica", de: "Medizinische Pediküre" },
  "Детский маникюр и педикюр": { fr: "Manucure et pédicure pour enfants", pl: "Manicure i pedicure dziecięcy", cs: "Dětská manikúra a pedikúra", es: "Manicura y pedicura para niños", de: "Kinder-Maniküre und Pediküre" },
  "Коррекция формы бровей": { fr: "Mise en forme des sourcils", pl: "Kształtowanie brwi", cs: "Úprava obočí", es: "Modelado de cejas", de: "Augenbrauen formen" },
  "Окрашивание бровей": { fr: "Teinture des sourcils", pl: "Laminacja brwi", cs: "Barvení obočí", es: "Tinte de cejas", de: "Augenbrauen färben" },
  "Ламинирование бровей": { fr: "Stratification des sourcils", pl: "Laminowanie brwi", cs: "Laminace obočí", es: "Laminación de cejas", de: "Augenbrauenlaminierung" },
  "Наращивание ресниц": { fr: "Extensions de cils", pl: "Przedłużanie rzęs", cs: "Prodlužování řas", es: "Extensiones de pestañas", de: "Wimpernverlängerung" },
  "Ламинирование ресниц": { fr: "Rehaussement des cils", pl: "Lifting rzęs", cs: "Lash lift", es: "Levantamiento de pestañas", de: "Wimpernlifting" },
  "Коррекция бровей нитью": { fr: "Filage des sourcils", pl: "Nitkowanie brwi", cs: "Navlékání obočí", es: "Depilación de cejas", de: "Augenbrauen einfädeln" },
  "Восковая эпиляция бровей": { fr: "Épilation des sourcils", pl: "Depilacja brwi", cs: "Depilace obočí", es: "Depilación de cejas", de: "Augenbrauen wachsen" },
  "Микропигментация бровей": { fr: "Micropigmentation des sourcils", pl: "Mikropigmentacja brwi", cs: "Mikropigmentace obočí", es: "Micropigmentación de cejas", de: "Augenbrauen-Mikropigmentierung" },
  "Перманентный макияж бровей": { fr: "Maquillage permanent des sourcils", pl: "Makijaż permanentny brwi", cs: "Permanentní make-up obočí", es: "Maquillaje permanente de cejas", de: "Permanentes Augenbrauen-Make-up" },
  "Коррекция ресниц": { fr: "Correction des cils", pl: "Korekta rzęs", cs: "Korekce řas", es: "Corrección de pestañas", de: "Wimpernkorrektur" },
  "Подтяжка ресниц": { fr: "Traitement lifting des cils", pl: "Zabieg liftingu rzęs", cs: "Lish lift ošetření", es: "Tratamiento de levantamiento de pestañas", de: "Wimpernlifting-Behandlung" },
  "Удаление ресниц": { fr: "Élimination des cils", pl: "Depilacja rzęs", cs: "Odstranění řas", es: "Eliminación de pestañas", de: "Wimpernentfernung" },
  "Окрашивание ресниц": { fr: "Teinture de cils", pl: "Laminacja rzęs", cs: "Barvení řas", es: "Tinte de pestañas", de: "Wimpern färben" },
  "Уход за лицом": { fr: "Soin du visage", pl: "Zabieg na twarz", cs: "Ošetření obličeje", es: "Tratamiento facial", de: "Gesichtsbehandlung" },
  "Пилинг для лица": { fr: "Peeling du visage", pl: "Peeling twarzy", cs: "Peeling na obličej", es: "Peeling facial", de: "Gesichtspeeling" },
  "Спа-процедура для лица": { fr: "Soin spa du visage", pl: "Zabieg SPA na twarz", cs: "Lázeňské ošetření obličeje", es: "Tratamiento spa facial", de: "Gesichts-Spa-Behandlung" },
  "Консультация по эстетической медицине": { fr: "Consultation de médecine esthétique", pl: "Konsultacja medycyny estetycznej", cs: "Konzultace estetické medicíny", es: "Consulta de medicina estética", de: "Ästhetische Medizinberatung" },
  "Омоложение лица": { fr: "Rajeunissement du visage", pl: "Odmładzanie twarzy", cs: "Omlazení obličeje", es: "Rejuvenecimiento facial", de: "Gesichtsverjüngung" },
  "Химический пилинг": { fr: "Peeling chimique", pl: "Peeling chemiczny", cs: "Chemický peeling", es: "Peeling químico", de: "Chemisches Peeling" },
  "Мезотерапия": { fr: "Mésothérapie", pl: "Mezoterapia", cs: "Mezoterapie", es: "Mesoterapia", de: "Mesotherapie" },
  "Дарсонваль": { fr: "Thérapie Darsonval", pl: "Terapia darsonvalowa", cs: "Darsonvalová terapie", es: "Terapia Darsonval", de: "Darsonval-Therapie" },
  "Микродермабразия": { fr: "Microdermabrasion", pl: "Mikrodermabrazja", cs: "Mikrodermabraze", es: "Microdermoabrasión", de: "Mikrodermabrasion" },
  "Безоперационная подтяжка лица": { fr: "Lifting non chirurgical", pl: "Niechirurgiczny lifting twarzy", cs: "Nechirurgický facelift", es: "Lifting facial no quirúrgico", de: "Nicht-chirurgisches Facelift" },
  "Подтяжка лица": { fr: "Lifting", pl: "Lifting twarzy", cs: "Facelift", es: "Lifting facial", de: "Facelift" },
  "Подтяжка шеи": { fr: "Lifting du cou", pl: "Lifting szyi", cs: "Zvednutí krku", es: "Lifting de cuello", de: "Halsstraffung" },
  "Коррекция фигуры": { fr: "Contour du corps", pl: "Konturowanie ciała", cs: "Tvarování těla", es: "Contorno corporal", de: "Körperformung" },
  "Ультразвуковая кавитация": { fr: "Cavitation par ultrasons", pl: "Kawitacja ultradźwiękowa", cs: "Ultrazvuková kavitace", es: "Cavitación ultrasónica", de: "Ultraschallkavitation" },
  "Карбокситерапия": { fr: "Carboxythérapie", pl: "Karboksyterapia", cs: "Karboxyterapie", es: "Carboxiterapia", de: "Carboxytherapie" },
  "Стрижка под машинку": { fr: "Coupe de cheveux à la tondeuse", pl: "Strzyżenie maszynką", cs: "Clipper účes", es: "Corte de pelo con maquinilla", de: "Haarschneidemaschine" },
  "Стрижка и борода": { fr: "Coupe de cheveux et barbe", pl: "Strzyżenie i broda", cs: "Střih a vousy", es: "Corte de pelo y barba", de: "Haarschnitt und Bart" },
  "Уход за бородой": { fr: "Entretien de la barbe", pl: "Pielęgnacja brody", cs: "Úprava vousů", es: "Aseo de barba", de: "Bartpflege" },
  "Формирование бороды": { fr: "Mise en forme de la barbe", pl: "Kształtowanie brody", cs: "Tvarování vousů", es: "Modelado de barba", de: "Bartformung" },
  "Бритье бороды": { fr: "Rasage de la barbe", pl: "Golenie brody", cs: "Holení vousů", es: "Afeitado de barba", de: "Bartrasur" },
  "Бритье опасной бритвой": { fr: "Rasage au rasoir droit", pl: "Golenie brzytwą", cs: "Rovné holení břitvou", es: "Afeitado con navaja de afeitar", de: "Rasieren mit dem Rasiermesser" },
  "Бритье головы и стрижка бороды": { fr: "Rasage de la tête et taille de la barbe", pl: "Golenie głowy i przycinanie brody", cs: "Holení hlavy a zastřihování vousů", es: "Afeitado de cabeza y corte de barba", de: "Kopfrasur und Bartschneiden" },
  "Подстригание усов": { fr: "Taille de la moustache", pl: "Strzyżenie wąsów", cs: "Úprava kníru", es: "Recorte de bigote", de: "Schnurrbartschneiden" },
  "Окрашивание бороды": { fr: "Coloration de la barbe", pl: "Koloryzacja brody", cs: "Barvení vousů", es: "Coloración de barba", de: "Bartfärbung" },
  "Скин Фейд": { fr: "Décoloration de la peau", pl: "Blaknięcie skóry", cs: "Kůže vybledne", es: "Desvanecimiento de la piel", de: "Hautausbleichung" },
  "Классический массаж": { fr: "Massage classique", pl: "Masaż klasyczny", cs: "Klasická masáž", es: "Masaje clásico", de: "Klassische Massage" },
  "Расслабляющий массаж": { fr: "Massage relaxant", pl: "Masaż relaksacyjny", cs: "Relaxační masáž", es: "Masaje relajante", de: "Entspannungsmassage" },
  "Массаж спины": { fr: "Massage du dos", pl: "Masaż pleców", cs: "Masáž zad", es: "Masaje de espalda", de: "Rückenmassage" },
  "Массаж всего тела": { fr: "Massage complet du corps", pl: "Masaż całego ciała", cs: "Masáž celého těla", es: "Masaje de cuerpo completo", de: "Ganzkörpermassage" },
  "Лечебный массаж": { fr: "Massage thérapeutique", pl: "Masaż leczniczy", cs: "Terapeutická masáž", es: "Masaje terapéutico", de: "Therapeutische Massage" },
  "Антицеллюлитный массаж": { fr: "Massage anti-cellulite", pl: "Masaż antycellulitowy", cs: "Anticelulitidní masáž", es: "Masaje anticelulítico", de: "Anti-Cellulite-Massage" },
  "Глубокотканный массаж": { fr: "Massage des tissus profonds", pl: "Masaż tkanek głębokich", cs: "Masáž hlubokých tkání", es: "Masaje de tejido profundo", de: "Tiefengewebsmassage" },
  "Лимфатический массаж": { fr: "Massage lymphatique", pl: "Masaż limfatyczny", cs: "Lymfatická masáž", es: "Masaje linfático", de: "Lymphmassage" },
  "Массаж лица": { fr: "Massage du visage", pl: "Masaż twarzy", cs: "Masáž obličeje", es: "Masaje facial", de: "Gesichtsmassage" },
  "Массаж горячими камнями": { fr: "Massage aux pierres chaudes", pl: "Masaż gorącymi kamieniami", cs: "Masáž lávovými kameny", es: "Masaje con piedras calientes", de: "Hot-Stone-Massage" },
  "Спортивный массаж": { fr: "Massage sportif", pl: "Masaż sportowy", cs: "Sportovní masáž", es: "Masaje deportivo", de: "Sportmassage" },
  "Тайский массаж": { fr: "Massage thaïlandais", pl: "Masaż tajski", cs: "Thajská masáž", es: "Masaje tailandés", de: "Thai-Massage" },
  "Сауна": { fr: "Sauna", pl: "Sauna", cs: "Sauna", es: "Sauna", de: "Sauna" },
  "Скраб для тела": { fr: "Gommage corporel", pl: "Peeling ciała", cs: "Tělový peeling", es: "Exfoliante corporal", de: "Körperpeeling" },
  "Спа-салон для пар": { fr: "Séance spa en couple", pl: "Sesja spa dla par", cs: "Párové lázeňské sezení", es: "Sesión de spa para parejas", de: "Spa-Sitzung für Paare" },
  "Комната для медитации": { fr: "Salle de méditation", pl: "Pokój medytacyjny", cs: "Meditační místnost", es: "Sala de meditación", de: "Meditationsraum" },
  "Автозагар": { fr: "Spray bronzage", pl: "Opalenizna natryskowa", cs: "Opálení ve spreji", es: "Bronceado en spray", de: "Spray Tan" },
  "Автозагар с помощью аэрографа": { fr: "Spray bronzage à l'aérographe", pl: "Opalenizna natryskowa aerografem", cs: "Airbrush sprej opálení", es: "Bronceado en spray con aerógrafo", de: "Airbrush Spray Tan" },
  "Солярий": { fr: "Lit de bronzage", pl: "Solarium", cs: "Solárium", es: "Cama de bronceado", de: "Solarium" },
  "Соляная комната": { fr: "Salle de sel", pl: "Sala solna", cs: "Solná místnost", es: "Sala de sal", de: "Salzraum" },
  "Коррекция контуров тела": { fr: "Correction du contour du corps", pl: "Korekcja konturu ciała", cs: "Korekce kontur těla", es: "Corrección del contorno corporal", de: "Körperkonturkorrektur" },
  "Депиляция воском": { fr: "Épilation à la cire", pl: "Depilacja woskiem", cs: "Depilace voskem", es: "Depilación con cera", de: "Haarentfernung mit Wachs" },
  "Лазерная эпиляция": { fr: "Épilation laser", pl: "Depilacja laserowa", cs: "Laserové odstranění chloupků", es: "Depilación láser", de: "Laser-Haarentfernung" },
  "Удаление волос на лице": { fr: "Épilation du visage", pl: "Depilacja twarzy", cs: "Odstraňování chloupků na obličeji", es: "Depilación facial", de: "Gesichtshaarentfernung" },
  "Депиляция подмышек воском": { fr: "Épilation des aisselles", pl: "Depilacja pach", cs: "Depilace podpaží", es: "Depilación de axilas", de: "Achselentfernung" },
  "Депиляция зоны бикини": { fr: "Épilation du maillot", pl: "Depilacja okolic bikini", cs: "Depilace v oblasti bikin", es: "Depilación de bikini", de: "Bikini-Haarentfernung" },
  "Депиляция ног воском": { fr: "Épilation des jambes", pl: "Depilacja nóg", cs: "Depilace nohou", es: "Depilación de piernas", de: "Beinentfernung" },
  "Депиляция рук воском": { fr: "Épilation des bras", pl: "Depilacja ramion", cs: "Depilace paží", es: "Depilación de brazos", de: "Armentfernung" },
  "Депиляция губ воском": { fr: "Épilation de la lèvre supérieure", pl: "Depilacja górnej wargi", cs: "Depilace horního rtu", es: "Depilación de labio superior", de: "Oberlippenentfernung" },
  "Депиляция живота воском": { fr: "Épilation de l'abdomen", pl: "Depilacja brzucha", cs: "Depilace břicha", es: "Depilación de abdomen", de: "Bauchentfernung" },
  "Депиляция спины воском": { fr: "Épilation du dos", pl: "Depilacja pleców", cs: "Depilace zad voskem", es: "Depilación de espalda", de: "Rückenentfernung" },
  "IPL-эпиляция": { fr: "Épilation IPL", pl: "Depilacja IPL", cs: "IPL epilace", es: "Depilación IPL", de: "IPL-Haarentfernung" },
  "Электролиз": { fr: "Électrolyse", pl: "Elektroliza", cs: "Elektrolýza", es: "Electrólisis", de: "Elektrolyse" },
  "Резьба": { fr: "Filetage", pl: "Threading", cs: "Řezání závitů", es: "Roscado", de: "Threading" },
  "Сеанс татуировки": { fr: "Séance de tatouage", pl: "Sesja tatuażu", cs: "Sezení tetování", es: "Sesión de tatuaje", de: "Tattoo-Sitzung" },
  "Консультация по татуировкам": { fr: "Consultation de tatouage", pl: "Konsultacja tatuażu", cs: "Tetovací konzultace", es: "Consulta de tatuaje", de: "Tattoo-Beratung" },
  "Пирсинг носа": { fr: "Perçage du nez", pl: "Przekłuwanie nosa", cs: "Piercing do nosu", es: "Perforación de nariz", de: "Nasenpiercing" },
  "Прокалывание ушей": { fr: "Perçage des oreilles", pl: "Przekłuwanie uszu", cs: "Piercing do uší", es: "Perforación de oreja", de: "Ohrpiercing" },
  "Пирсинг тела": { fr: "Perçage du corps", pl: "Przekłuwanie ciała", cs: "Body piercing", es: "Perforación corporal", de: "Körperpiercing" },
  "Временные татуировки": { fr: "Tatouages temporaires", pl: "Tatuaże tymczasowe", cs: "Dočasná tetování", es: "Tatuajes temporales", de: "Temporäre Tattoos" },
  "Удаление татуировок": { fr: "Détatouage", pl: "Usuwanie tatuażu", cs: "Odstranění tetování", es: "Eliminación de tatuajes", de: "Tattooentfernung" },
  "Пирсинг пупка": { fr: "Perçage du nombril", pl: "Przekłuwanie pępka", cs: "Piercing do pupíku", es: "Perforación de ombligo", de: "Nabelpiercing" },
  "Пирсинг языка": { fr: "Perçage de la langue", pl: "Przekłuwanie języka", cs: "Piercing do jazyka", es: "Perforación de lengua", de: "Zungenpiercing" },
  "Пирсинг хряща": { fr: "Perçage du cartilage", pl: "Piercing chrząstki", cs: "Piercing do chrupavky", es: "Perforación de cartílago", de: "Knorpelpiercing" },
  "Интимный пирсинг": { fr: "Piercing intime", pl: "Piercing intymny", cs: "Intimní piercing", es: "Piercing íntimo", de: "Intimpiercing" },
  "Физиотерапия": { fr: "Physiothérapie", pl: "Fizjoterapia", cs: "Fyzioterapie", es: "Fisioterapia", de: "Physiotherapie" },
  "Реабилитация": { fr: "Rééducation", pl: "Rehabilitacja", cs: "Rehabilitace", es: "Rehabilitación", de: "Rehabilitation" },
  "Спортивная медицина": { fr: "Médecine du sport", pl: "Medycyna sportowa", cs: "Sportovní medicína", es: "Medicina deportiva", de: "Sportmedizin" },
  "Магнитотерапия": { fr: "Magnétothérapie", pl: "Magnetoterapia", cs: "Magnetoterapie", es: "Magnetoterapia", de: "Magnetfeldtherapie" },
  "Сухое иглоукалывание": { fr: "Aiguilles à sec", pl: "Suche igłowanie", cs: "Suché jehlování", es: "Punción seca", de: "Dry Needling" },
  "Кинезитерапия": { fr: "Kinésithérapie", pl: "Kinezyterapia", cs: "Kineziterapie", es: "Cinesiterapia", de: "Kinesitherapie" },
  "Терапия мягких тканей": { fr: "Thérapie des tissus mous", pl: "Terapia tkanek miękkich", cs: "Terapie měkkých tkání", es: "Terapia de tejidos blandos", de: "Weichteiltherapie" },
  "Реабилитация позвоночника": { fr: "Rééducation de la colonne vertébrale", pl: "Rehabilitacja kręgosłupa", cs: "Rehabilitace páteře", es: "Rehabilitación de la columna", de: "Wirbelsäulenrehabilitation" },
  "Лечение лимфедемы": { fr: "Traitement du lymphœdème", pl: "Leczenie obrzęku limfatycznego", cs: "Léčba lymfedému", es: "Tratamiento de linfedema", de: "Lymphödembehandlung" },
  "Вакуумная терапия": { fr: "Thérapie sous vide", pl: "Terapia próżniowa", cs: "Vakuová terapie", es: "Terapia de vacío", de: "Vakuumtherapie" },
  "Хиропрактика": { fr: "Soins chiropratiques", pl: "Chiropraktyka", cs: "Chiropraktická péče", es: "Atención quiropráctica", de: "Chiropraktische Pflege" },
  "Консультация": { fr: "Consultation", pl: "Konsultacje", cs: "Konzultace", es: "Consulta", de: "Beratung" },
  "Основная услуга": { fr: "Service de base", pl: "Usługa podstawowa", cs: "Základní služba", es: "Servicio principal", de: "Kerndienstleistung" },
  "Повторный визит": { fr: "Visite de suivi", pl: "Wizyta kontrolna", cs: "Následná návštěva", es: "Visita de seguimiento", de: "Folgebesuch" },
  "Пакет услуг": { fr: "Forfait services", pl: "Pakiet usług", cs: "Balíček služeb", es: "Paquete de servicios", de: "Servicepaket" },
  "Индивидуальная услуга": { fr: "Service personnalisé", pl: "Usługa niestandardowa", cs: "Zákaznická služba", es: "Servicio personalizado", de: "Individueller Service" },
  "Диагностика": { fr: "Diagnostic", pl: "Diagnostyka", cs: "Diagnostika", es: "Diagnóstico", de: "Diagnose" },
};

function normalizeMobileServiceLabel(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function hasCyrillicText(value: unknown) {
  return /[\u0400-\u04FF]/.test(String(value || ""));
}

function isUsableServiceTranslation(value: unknown, language: AppLanguage) {
  const text = String(value || "").trim();
  if (!text) return false;
  return language === "ru" || language === "uk" || !hasCyrillicText(text);
}

const MOBILE_SERVICE_TRANSLATION_INDEX = new Map<string, Partial<Record<AppLanguage, string>>>();

Object.assign(MOBILE_SERVICE_TRANSLATION_EXTRAS["Коррекция формы бровей"] || {}, { pl: "Regulacja brwi" });
Object.assign(MOBILE_SERVICE_TRANSLATION_EXTRAS["Окрашивание бровей"] || {}, { pl: "Farbowanie brwi" });
Object.assign(MOBILE_SERVICE_TRANSLATION_EXTRAS["Ламинирование бровей"] || {}, { pl: "Laminacja brwi" });
Object.assign(MOBILE_SERVICE_TRANSLATION_EXTRAS["Окрашивание ресниц"] || {}, { pl: "Farbowanie rzęs" });
Object.assign(MOBILE_SERVICE_TRANSLATION_EXTRAS["Ламинирование ресниц"] || {}, { pl: "Laminacja rzęs" });
Object.assign(MOBILE_SERVICE_TRANSLATION_EXTRAS["Скин Фейд"] || {}, {
  fr: "Dégradé à blanc",
  pl: "Skin fade",
  cs: "Skin fade",
  es: "Degradado skin fade",
  de: "Skin Fade",
});

for (const [sourceName, translations] of Object.entries(MOBILE_SERVICE_TRANSLATION_EXTRAS)) {
  MOBILE_SERVICE_TRANSLATION_INDEX.set(normalizeMobileServiceLabel(sourceName), translations);
  for (const translation of Object.values(translations)) {
    const key = normalizeMobileServiceLabel(translation);
    if (key) MOBILE_SERVICE_TRANSLATION_INDEX.set(key, translations);
  }
}

function getServiceFallbackTranslation(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined, language: AppLanguage) {
  const candidates = [
    service?.name,
    ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item]),
  ]
    .map(normalizeMobileServiceLabel)
    .filter(Boolean);
  for (const candidate of candidates) {
    const translated = MOBILE_SERVICE_TRANSLATION_INDEX.get(candidate)?.[language];
    if (typeof translated === "string" && isUsableServiceTranslation(translated, language)) return translated.trim();
  }
  return "";
}

function localizeCountry(country: string, language: AppLanguage) {
  return COUNTRY_LABELS[language][country] || country;
}

function localizeText(defaultValue: string | undefined, localized: LocalizedText | undefined, language: AppLanguage) {
  const current = localized?.[language]?.trim();
  if (current) return current;
  return localized?.ru?.trim() || localized?.uk?.trim() || localized?.en?.trim() || safeText(defaultValue).trim();
}

function getServiceDisplayName(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined, language: AppLanguage) {
  const direct = service?.localizedName?.[language]?.trim();
  if (typeof direct === "string" && isUsableServiceTranslation(direct, language)) return direct;
  const fallback = getServiceFallbackTranslation(service, language);
  if (fallback) return fallback;
  return localizeText(service?.name, service?.localizedName, language);
}

function normalizeServiceIdentityPart(value: unknown) {
  return safeText(value).trim().toLowerCase();
}

function getCatalogServiceLocalizationKey(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  return normalizeSmartSearchText(service?.name || getServiceIdentityKey(service));
}

function getServiceIdentityKey(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  return Array.from(getServiceIdentityKeys(service))[0] || "";
}

function getServiceIdentityKeys(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  const names = [
    service?.name,
    ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item]),
  ]
    .map(normalizeServiceIdentityPart)
    .filter(Boolean);
  return new Set(names);
}

function makePendingServiceKey(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  return Array.from(getServiceIdentityKeys(service)).sort().join("|");
}

function serviceIdentityOverlaps(
  left: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined,
  right: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined
) {
  const leftKeys = getServiceIdentityKeys(left);
  if (!leftKeys.size) return false;
  for (const key of getServiceIdentityKeys(right)) {
    if (leftKeys.has(key)) return true;
  }
  return false;
}

function getServiceCategoryDisplayName(category: string | undefined, localizedCategory: LocalizedText | undefined, language: AppLanguage, t: Record<string, string>) {
  const localized = localizeText(category, localizedCategory, language);
  return localizeCatalogCategory(localized || category, language, t);
}

function getServiceCategorySortOrder(category: string | undefined) {
  const canonical = getCanonicalServiceCategory(category);
  return SERVICE_CATEGORY_SORT_ORDER[canonical] ?? 500;
}

function compareServiceCategoryOptions(left: string, right: string) {
  const orderDiff = getServiceCategorySortOrder(left) - getServiceCategorySortOrder(right);
  return orderDiff || getCanonicalServiceCategory(left).localeCompare(getCanonicalServiceCategory(right));
}

function getCatalogCategorySortOrder(category: string | undefined) {
  return SERVICE_CATALOG_CATEGORY_SORT_ORDER.get(safeText(category).trim().toLocaleLowerCase()) ?? 500;
}

function compareCatalogCategories(left: string, right: string) {
  const orderDiff = getCatalogCategorySortOrder(left) - getCatalogCategorySortOrder(right);
  return orderDiff || left.localeCompare(right, "ru");
}

function sortServiceCategoryOptions(categories: string[]) {
  return [...categories].sort(compareServiceCategoryOptions);
}

function getCanonicalServiceCategory(category: string | undefined) {
  const value = safeText(category).trim();
  const normalized = normalizeSmartSearchText(value);
  if (!normalized) return DEFAULT_SERVICE_CATEGORY;
  const defaultLabels = [
    DEFAULT_SERVICE_CATEGORY,
    "Без категорії",
    "Uncategorized",
    "Non classé",
    "Bez kategorii",
    "Nezařazené",
    "Sin categoría",
    "Nicht kategorisiert",
  ].map(normalizeSmartSearchText);
  if (defaultLabels.includes(normalized)) return DEFAULT_SERVICE_CATEGORY;

  const aliases: Record<string, string> = {
    "ногти": "Ногти",
    "нігті": "Ногти",
    nails: "Ногти",
    "волосы": "Волосы и стрижки",
    "волосы и стрижки": "Волосы и стрижки",
    "волосся": "Волосы и стрижки",
    "волосся та стрижки": "Волосы и стрижки",
    hair: "Волосы и стрижки",
    "hair & haircuts": "Волосы и стрижки",
    "hair and haircuts": "Волосы и стрижки",
    "парикмахерская": "Волосы и стрижки",
    "перукарня": "Волосы и стрижки",
    "барбер": "Барбер и мужские стрижки",
    "барбер и мужские стрижки": "Барбер и мужские стрижки",
    "барбер і чоловічі стрижки": "Барбер и мужские стрижки",
    "мужской парикмахер": "Барбер и мужские стрижки",
    "чоловічий перукар": "Барбер и мужские стрижки",
    "парикмахер": "Барбер и мужские стрижки",
    "перукар": "Барбер и мужские стрижки",
    "barber & men's haircuts": "Барбер и мужские стрижки",
    "barber and men's haircuts": "Барбер и мужские стрижки",
    "брови и ресницы": "Брови и ресницы",
    "брови та вії": "Брови и ресницы",
    "brows & lashes": "Брови и ресницы",
    "brows and lashes": "Брови и ресницы",
    "массаж": "Массаж",
    "масаж": "Массаж",
    massage: "Массаж",
    "массажный салон": "Массаж",
    "косметология": "Косметология",
    "косметологія": "Косметология",
    cosmetology: "Косметология",
    "медспа": "Косметология",
    "лицо": "Лицо",
    "обличчя": "Лицо",
    face: "Лицо",
    "face care": "Лицо",
    "депиляция": "Депиляция",
    "депіляція": "Депиляция",
    depilation: "Депиляция",
    "hair removal": "Депиляция",
    "салон депиляции": "Депиляция",
    "тело": "Тело",
    "тіло": "Тело",
    body: "Тело",
    "body / spa": "Тело",
    "спа-салон и сауна": "Тело",
    "макияж": "Макияж",
    "макіяж": "Макияж",
    makeup: "Макияж",
    "перманент": "Перманентный макияж",
    "перманентный макияж": "Перманентный макияж",
    "permanent makeup": "Перманентный макияж",
    "тату / перманент": "Перманентный макияж",
    "тату": "Тату",
    tattoo: "Тату",
    "тату и пирсинг": "Тату",
    "обучение": "Обучение",
    "навчання": "Обучение",
    education: "Обучение",
    training: "Обучение",
    "ремонт": "Ремонт",
    repair: "Ремонт",
    "другое": "Другое",
    "інше": "Другое",
    "другая": "Другое",
    other: "Другое",
  };
  if (aliases[normalized]) return aliases[normalized];

  for (const systemCategory of SYSTEM_SERVICE_CATEGORIES) {
    if (normalizeSmartSearchText(systemCategory) === normalized) return systemCategory;
    for (const labels of Object.values(SERVICE_CATEGORY_LABELS)) {
      const translated = labels[systemCategory];
      if (translated && normalizeSmartSearchText(translated) === normalized) {
        return systemCategory;
      }
    }
  }

  return value;
}

function uniqueServiceCategoryOptions(categories: string[], includeDefault = false) {
  const seen = new Set<string>();
  const options: string[] = [];
  categories.forEach((category) => {
    const canonical = getCanonicalServiceCategory(category);
    if (!includeDefault && canonical === DEFAULT_SERVICE_CATEGORY) return;
    const key = normalizeSmartSearchText(canonical);
    if (!key || seen.has(key)) return;
    seen.add(key);
    options.push(canonical);
  });
  return sortServiceCategoryOptions(options);
}

function getServiceSearchText(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  return [service?.name, ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function serviceNameMatches(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined, value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return getServiceIdentityKeys(service).has(normalized);
}

function normalizeSmartSearchText(value: unknown) {
  return safeText(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .replace(/[ії]/g, "и")
    .replace(/є/g, "е")
    .replace(/ґ/g, "г")
    .replace(/\bmassage\b/g, "массаж")
    .replace(/\bmass\b/g, "массаж")
    .replace(/\bnails?\b/g, "ногти")
    .replace(/\bbrows?\b/g, "брови")
    .replace(/\blashes?\b/g, "ресницы")
    .replace(/\bhaircut\b/g, "стрижка")
    .replace(/\bhair\b/g, "волосы")
    .replace(/\bfacial\b/g, "лицо")
    .replace(/\bmakeup\b/g, "макияж")
    .replace(/\btattoo\b/g, "тату")
    .replace(/\bwaxing\b/g, "депиляция")
    .replace(/\bsugaring\b/g, "депиляция")
    .replace(/масаж/g, "массаж")
    .replace(/\s+/g, " ");
}

function getServiceSmartSearchText(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  return [service?.name, ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item])]
    .filter(Boolean)
    .map(normalizeSmartSearchText)
    .join(" ");
}

function areServiceNamesSimilar(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined, value: string) {
  const query = normalizeSmartSearchText(value);
  if (!query) return false;
  const names = [service?.name, ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item])]
    .filter(Boolean)
    .map(normalizeSmartSearchText)
    .filter(Boolean);
  return names.some((name) => name === query || name.includes(query) || query.includes(name));
}

function inferSystemServiceCategory(value: string) {
  const text = normalizeSmartSearchText(value);
  if (!text) return "";
  const rules: Array<[string, RegExp]> = [
    ["Массаж", /массаж|спина|шея|воротников|релакс|тайск|лимфат|тело/],
    ["Барбер и мужские стрижки", /барбер|fade|фейд|бород|ус|брить|бритв|beard|shave|mustache/],
    ["Волосы и стрижки", /стрижк|стриг|волос|окраш|фарб|уклад|hair|cut|перукар|kader|strih|strzyz/],
    ["Ногти", /маникюр|манікюр|ногт|нигт|nail|педикюр/],
    ["Брови и ресницы", /бров|brow/],
    ["Ресницы", /ресниц|вии|lash/],
    ["Лицо", /лицо|облич|facial|пилинг|маска/],
    ["Депиляция", /депиляц|эпиляц|епіляц|wax|sugar|шугар/],
    ["Косметология", /ботокс|filler|инъекц|ін'єкц|косметолог|мезотерап|плазм|контур/],
    ["Макияж", /макияж|makeup|візаж|визаж/],
    ["Тату / Перманент", /тату|tattoo|перманент|пирсинг/],
    ["Тело", /тело|body|скраб|обертыван|обгорт/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || "";
}

function isAppointmentWithoutServiceName(value: string | undefined) {
  const raw = safeText(value).trim().toLowerCase();
  const normalized = normalizeSmartSearchText(raw);
  if (!normalized) return true;
  return (
    normalized === "без услуги" ||
    normalized === "без послуги" ||
    normalized === "without service" ||
    normalized === "no service" ||
    normalized === "sans service" ||
    normalized === "bez usługi" ||
    normalized === "bez uslugi" ||
    normalized === "bez služby" ||
    normalized === "bez sluzby" ||
    normalized === "sin servicio" ||
    normalized === "ohne service" ||
    normalized === "ohne dienst" ||
    normalized.includes("без услуги") ||
    normalized.includes("без послуги") ||
    normalized.includes("without service") ||
    normalized.includes("no service") ||
    normalized.includes("sans service") ||
    normalized.includes("bez usługi") ||
    normalized.includes("bez uslugi") ||
    normalized.includes("bez služby") ||
    normalized.includes("bez sluzby") ||
    normalized.includes("sin servicio") ||
    normalized.includes("ohne service") ||
    normalized.includes("ohne dienst")
  );
}

function getAppointmentServiceColor(
  appointment: Pick<AppointmentRecord, "serviceName" | "kind"> | undefined,
  services: ServiceRecord[] = [],
  fallbackIndex = 0
) {
  if (!appointment || appointment.kind === "blocked") return "#CBD5E1";
  if (isAppointmentWithoutServiceName(appointment.serviceName)) return "#EEF2F7";
  const matchedService = services.find((service) => serviceNameMatches(service, appointment.serviceName) || areServiceNamesSimilar(service, appointment.serviceName));
  return safeText(matchedService?.color).trim() || SERVICE_COLORS[fallbackIndex % SERVICE_COLORS.length];
}

function normalizeHexColor(value: string) {
  const raw = safeText(value).trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.slice(1).split("").map((char) => `${char}${char}`).join("")}`;
  }
  return "";
}

function mixHexWithWhite(value: string, whiteRatio = 0.62) {
  const hex = normalizeHexColor(value);
  if (!hex) return value || "#EEF2FF";
  const amount = Math.max(0, Math.min(1, whiteRatio));
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const mix = (channel: number) => Math.round(channel * (1 - amount) + 255 * amount);
  return `#${[mix(red), mix(green), mix(blue)].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function localizeServiceCategory(category: string | undefined, t: Record<string, string>) {
  const value = getCanonicalServiceCategory(category);
  if (!value || value === DEFAULT_SERVICE_CATEGORY) {
    return t.defaultServiceCategory;
  }
  return value;
}

function localizeCatalogCategory(category: string | undefined, language: AppLanguage, t: Record<string, string>) {
  const value = localizeServiceCategory(category, t);
  return SERVICE_CATEGORY_LABELS[language][value] || value;
}

function getPhoneCountryLabel(country: PhoneCountryOption, language: AppLanguage, t?: Record<string, string>) {
  if (country.iso === "CUSTOM") return t?.customPhonePrefix || country.country;
  try {
    const DisplayNames = (Intl as any).DisplayNames;
    if (DisplayNames) {
      const label = new DisplayNames([localeForLanguage(language)], { type: "region" }).of(country.iso);
      if (label) return label;
    }
  } catch {
    // Some Expo runtimes may not ship Intl.DisplayNames. English names are the safe fallback.
  }
  return COUNTRY_LABELS[language][country.country] || country.country;
}

function normalizePhonePrefix(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 5);
  return digits ? `+${digits}` : "";
}

function getLocalPhoneNumber(phone: string, selectedPrefix?: string) {
  let rest = String(phone || "").trim();
  if (!rest) return "";
  if (selectedPrefix && rest.startsWith(selectedPrefix)) {
    rest = rest.slice(selectedPrefix.length);
  } else {
    rest = rest.replace(/^\+\d{1,5}/, "");
  }
  return rest.replace(/^[\s-]+/, "");
}

function composePhoneWithPrefix(prefix: string, localPhone: string) {
  const rest = getLocalPhoneNumber(localPhone, prefix);
  return rest ? `${prefix} ${rest}` : "";
}

function formatDuration(minutes: number | undefined, t: Record<string, string>) {
  return `${Number(minutes || 0)} ${t.minutesShort}`;
}

function getServiceModeId(value: string): (typeof SERVICE_MODE_IDS)[number] {
  const normalized = safeText(value).trim().toLowerCase();
  if (!normalized) return "onsite";
  if (normalized === SERVICE_MODE_VALUES.travel.toLowerCase() || normalized.includes("выезд") || normalized.includes("виїзд") || normalized.includes("travel")) return "travel";
  if (normalized === SERVICE_MODE_VALUES.online.toLowerCase() || normalized.includes("online") || normalized.includes("онлайн")) return "online";
  return "onsite";
}

function localizeServiceMode(value: string, t: Record<string, string>) {
  const modeId = getServiceModeId(value);
  if (modeId === "travel") return t.serviceModeTravel;
  if (modeId === "online") return t.serviceModeOnline;
  return t.serviceModeOnsite;
}

function getDetectedCountry() {
  const timeZoneCountryCode = getCountryIsoFromTimezone(getDetectedTimezone());
  const regionCode = Localization.getLocales()[0]?.regionCode?.toUpperCase();
  const preferredCountryCode = timeZoneCountryCode || regionCode;
  const phoneCountry = PHONE_COUNTRIES.find((country) => country.iso === preferredCountryCode) || PHONE_COUNTRIES.find((country) => country.iso === "UA") || PHONE_COUNTRIES[0];
  return {
    country: phoneCountry.country,
    currency: phoneCountry.currency,
    phonePrefix: phoneCountry.callingCode,
    phoneCountry,
  };
}

function getDetectedTimezone() {
  return Localization.getCalendars()[0]?.timeZone || "Europe/Kyiv";
}

function inferCurrency(country: string) {
  const normalized = country.toLowerCase();
  if (normalized.includes("ukraine") || normalized.includes("укра")) return "UAH";
  if (normalized.includes("poland") || normalized.includes("поль")) return "PLN";
  if (normalized.includes("united kingdom") || normalized.includes("великобритан")) return "GBP";
  if (normalized.includes("united states") || normalized.includes("сша")) return "USD";
  if (normalized.includes("germany") || normalized.includes("france") || normalized.includes("spain") || normalized.includes("italy")) return "EUR";
  return "UAH";
}

function getRevenueCatApiKey() {
  if (Platform.OS === "ios") return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return REVENUECAT_ANDROID_API_KEY;
  return "";
}

function isPremiumActive(input?: WorkspaceSnapshot["professional"] | null) {
  if (input?.plan !== "premium") return false;
  if (input.premiumStatus === "active") return true;
  if (input.premiumStatus === "trialing") return isFutureIsoDate(input.premiumUntil);
  if (input.premiumStatus === "canceled" && input.premiumUntil) {
    return isFutureIsoDate(input.premiumUntil);
  }
  return false;
}

function getPremiumStatusLabel(input: WorkspaceSnapshot["professional"] | undefined, t: Record<string, string>) {
  if (!input || input.plan !== "premium") return t.premiumSubscriptionFree;
  if (input.premiumStatus === "trialing" && isPremiumActive(input)) return t.premiumSubscriptionTrial;
  if (isPremiumActive(input)) return t.premiumSubscriptionActive;
  return t.premiumSubscriptionFree;
}

function isFutureIsoDate(value?: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function getPremiumDaysRemaining(input?: WorkspaceSnapshot["professional"] | null) {
  if (!input?.premiumUntil) return null;
  const time = new Date(input.premiumUntil).getTime();
  if (!Number.isFinite(time)) return null;
  const diff = time - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function getPremiumStatusDetail(input: WorkspaceSnapshot["professional"] | undefined, t: Record<string, string>) {
  if (input?.premiumStatus !== "trialing") return "";
  const daysRemaining = getPremiumDaysRemaining(input);
  if (daysRemaining === null) return t.premiumTrialIncluded;
  if (daysRemaining <= 0) return t.premiumTrialExpired;
  if (daysRemaining === 1) return t.premiumTrialOneDayLeft;
  return t.premiumTrialDaysLeft.replace("{count}", String(daysRemaining));
}

function isPremiumSettingsSection(section: MobileSettingsSection) {
  return PREMIUM_LOCKED_SETTINGS_SECTIONS.includes(section);
}

function getPackagePriceLabel(pkg: PurchasesPackage | null, fallback: string) {
  return pkg?.product?.priceString || fallback;
}

function getPremiumProductId(billing: "monthly" | "yearly") {
  return billing === "yearly" ? REVENUECAT_YEARLY_PRODUCT_ID : REVENUECAT_MONTHLY_PRODUCT_ID;
}

function findRevenueCatPackage(packages: PurchasesPackage[], billing: "monthly" | "yearly") {
  const productId = getPremiumProductId(billing);
  const packageType = billing === "yearly" ? "ANNUAL" : "MONTHLY";
  return (
    packages.find((item) => item.product.identifier === productId) ||
    packages.find((item) => String(item.packageType) === packageType) ||
    null
  );
}

async function configureRevenueCatForProfessional(professionalId: string) {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey || !professionalId) {
    throw new Error("revenuecat_not_configured");
  }
  await Purchases.setLogLevel(LOG_LEVEL.WARN).catch(() => undefined);
  const configured = await Purchases.isConfigured().catch(() => false);
  if (configured) {
    await Purchases.logIn(professionalId).catch(() => undefined);
  } else {
    Purchases.configure({ apiKey, appUserID: professionalId });
  }
}

function getCustomerInfoEntitlement(customerInfo: CustomerInfo) {
  return (
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ||
    customerInfo.entitlements.all[REVENUECAT_ENTITLEMENT_ID] ||
    null
  );
}

function formatReminderLead(minutes: number, t: Record<string, string>) {
  if (minutes >= 1440) return t.dayBefore;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} ${t.hoursBefore}`;
  return `${minutes} ${t.minutesBefore}`;
}

function normalizeTelegramPanel(payload: any, fallback?: TelegramPanelState | null): TelegramPanelState {
  const settings = payload?.settings || {};
  return {
    deepLink: typeof payload?.deepLink === "string" ? payload.deepLink : fallback?.deepLink || "",
    tokenExpiresAt: typeof payload?.tokenExpiresAt === "string" ? payload.tokenExpiresAt : fallback?.tokenExpiresAt || "",
    connected: payload?.connected === true,
    chatId: typeof payload?.chatId === "string" ? payload.chatId : null,
    settings: {
      notificationsNewBooking: typeof settings.notificationsNewBooking === "boolean" ? settings.notificationsNewBooking : fallback?.settings.notificationsNewBooking ?? false,
      notificationsCabinetBooking: typeof settings.notificationsCabinetBooking === "boolean" ? settings.notificationsCabinetBooking : fallback?.settings.notificationsCabinetBooking ?? false,
      notificationsRescheduled: typeof settings.notificationsRescheduled === "boolean" ? settings.notificationsRescheduled : fallback?.settings.notificationsRescheduled ?? true,
      notificationsCancelled: typeof settings.notificationsCancelled === "boolean" ? settings.notificationsCancelled : fallback?.settings.notificationsCancelled ?? true,
      notificationsReminder: typeof settings.notificationsReminder === "boolean" ? settings.notificationsReminder : fallback?.settings.notificationsReminder ?? true,
      notificationsToday: typeof settings.notificationsToday === "boolean" ? settings.notificationsToday : fallback?.settings.notificationsToday ?? false,
      forwardingEnabled: typeof settings.forwardingEnabled === "boolean" ? settings.forwardingEnabled : fallback?.settings.forwardingEnabled ?? true,
      reminderLeadMinutes: typeof settings.reminderLeadMinutes === "number" ? settings.reminderLeadMinutes : fallback?.settings.reminderLeadMinutes ?? 120,
    },
  };
}

function normalizePushPanel(payload: any, fallback?: PushPanelState | null): PushPanelState {
  const settings = payload?.settings || {};
  return {
    connected: payload?.connected === true,
    tokenCount: Number(payload?.tokenCount || 0),
    settings: {
      notificationsNewBooking:
        typeof settings.notificationsNewBooking === "boolean"
          ? settings.notificationsNewBooking
          : fallback?.settings.notificationsNewBooking ?? DEFAULT_PUSH_PANEL_SETTINGS.notificationsNewBooking,
      notificationsCabinetBooking:
        typeof settings.notificationsCabinetBooking === "boolean"
          ? settings.notificationsCabinetBooking
          : fallback?.settings.notificationsCabinetBooking ?? DEFAULT_PUSH_PANEL_SETTINGS.notificationsCabinetBooking,
      notificationsRescheduled:
        typeof settings.notificationsRescheduled === "boolean"
          ? settings.notificationsRescheduled
          : fallback?.settings.notificationsRescheduled ?? DEFAULT_PUSH_PANEL_SETTINGS.notificationsRescheduled,
      notificationsCancelled:
        typeof settings.notificationsCancelled === "boolean"
          ? settings.notificationsCancelled
          : fallback?.settings.notificationsCancelled ?? DEFAULT_PUSH_PANEL_SETTINGS.notificationsCancelled,
      notificationsReminder:
        typeof settings.notificationsReminder === "boolean"
          ? settings.notificationsReminder
          : fallback?.settings.notificationsReminder ?? DEFAULT_PUSH_PANEL_SETTINGS.notificationsReminder,
      notificationsToday:
        typeof settings.notificationsToday === "boolean"
          ? settings.notificationsToday
          : fallback?.settings.notificationsToday ?? DEFAULT_PUSH_PANEL_SETTINGS.notificationsToday,
      reminderLeadMinutes:
        typeof settings.reminderLeadMinutes === "number"
          ? settings.reminderLeadMinutes
          : fallback?.settings.reminderLeadMinutes ?? DEFAULT_PUSH_PANEL_SETTINGS.reminderLeadMinutes,
    },
  };
}

function getExpoProjectId() {
  return (
    EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
    ""
  );
}

async function requestExpoPushToken() {
  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;
  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    return { status: finalStatus, expoPushToken: "" };
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    throw new Error(PUSH_PROJECT_ID_ERROR);
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return { status: finalStatus, expoPushToken: token.data };
}

function normalizeApiSession(result: any, fallbackEmail: string): MobileSession {
  const sessionLanguage = normalizeAppLanguage(result.profile?.language || result.language);
  return {
    token: String(result.token || ""),
    professionalId: String(result.professionalId || ""),
    email: String(result.profile?.email || fallbackEmail),
    displayName: String(result.profile?.displayName || result.profile?.email || fallbackEmail),
    isNewRegistration: result.isNewRegistration === true || result.isNewRegistration === "true",
    ...(sessionLanguage ? { language: sessionLanguage } : {}),
  };
}

function getMobileAppVersion() {
  return Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || "1.0.0";
}

async function hasBiometricUnlockAvailable() {
  if (Platform.OS === "web") return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return Boolean(hasHardware && isEnrolled);
  } catch {
    return false;
  }
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
  const [hours, mins] = normalizeTimeInput(time).split(":").map((item) => Number(item));
  const base = Number.isFinite(hours) && Number.isFinite(mins) ? hours * 60 + mins : 9 * 60;
  const total = base + Math.max(0, minutes || 0);
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function normalizeTimeInput(time: string) {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(safeText(time).trim());
  if (!match) return safeText(time).trim();
  const hours = Number(match[1]);
  if (!Number.isFinite(hours) || hours < 0 || hours > 23) return safeText(time).trim();
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function createLocalId(prefix = "draft") {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createVisitServiceDraft(startTime: string, service?: ServiceRecord, language: AppLanguage = "ru"): VisitServiceDraft {
  const normalizedStartTime = normalizeTimeInput(startTime);
  const duration = Math.max(5, service?.durationMinutes || 15);
  return {
    id: createLocalId("service"),
    serviceId: service?.id || "",
    serviceName: getServiceDisplayName(service, language) || "",
    startTime: normalizedStartTime,
    endTime: addMinutes(normalizedStartTime, duration),
    priceAmount: Number(service?.price || 0),
    durationMinutes: duration,
  };
}

function createDefaultVisitDraft(date: string, startTime: string): VisitDraft {
  return {
    customerName: "",
    customerPhone: "",
    startTime,
    serviceId: "",
    appointmentDate: date,
    notes: "",
    targetProfessionalId: undefined,
    selectedClientId: undefined,
    items: [createVisitServiceDraft(startTime)],
  };
}

function timeToMinutes(time: string) {
  const [hours, mins] = normalizeTimeInput(time).split(":").map((item) => Number(item));
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return 9 * 60;
  return hours * 60 + mins;
}

function getAppointmentInstanceKey(appointment: AppointmentRecord) {
  return [
    appointment.id,
    appointment.appointmentDate,
    appointment.professionalId || "",
    appointment.startTime,
    appointment.endTime,
    appointment.serviceName || "",
  ].join(":");
}

function minutesToTime(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function isValidTime(time: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(normalizeTimeInput(time));
  return Boolean(match);
}

function safeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function formatDayLabel(date: string, language: AppLanguage) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(parsed)
    .replace(".", "");
}

function getWeekDates(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const day = parsed.getDay() || 7;
  parsed.setDate(parsed.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(parsed);
    next.setDate(parsed.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function getCalendarModeDates(mode: CalendarViewMode, date: string) {
  if (mode === "threeDays") return [date, shiftDate(date, 1), shiftDate(date, 2)];
  if (mode === "week") return getWeekDates(date);
  if (mode === "month") {
    return getMonthGridDates(date);
  }
  return [date];
}

function uniqueDates(dates: string[]) {
  return Array.from(new Set(dates.filter(Boolean))).sort();
}

function chunkDates(dates: string[], size = CALENDAR_WARM_CHUNK_SIZE) {
  const chunks: string[][] = [];
  for (let index = 0; index < dates.length; index += size) {
    chunks.push(dates.slice(index, index + size));
  }
  return chunks;
}

function getCalendarWarmDates(mode: CalendarViewMode, date: string) {
  if (mode === "month") {
    return getMonthGridDates(date);
  }
  if (mode === "week") {
    return uniqueDates(Array.from({ length: 21 }, (_, index) => shiftDate(date, index - 7)));
  }
  if (mode === "threeDays") {
    return uniqueDates(Array.from({ length: 11 }, (_, index) => shiftDate(date, index - 4)));
  }
  return uniqueDates(Array.from({ length: 7 }, (_, index) => shiftDate(date, index - 3)));
}

function getMonthGridDates(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const first = new Date(year, month, 1, 12);
  const firstDay = first.getDay() || 7;
  first.setDate(first.getDate() - firstDay + 1);
  const daysInGrid = 42;
  return Array.from({ length: daysInGrid }, (_, index) => {
    const next = new Date(first);
    next.setDate(first.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function shiftCalendarDate(mode: CalendarViewMode, date: string, direction: -1 | 1) {
  if (mode === "threeDays") return shiftDate(date, direction * 3);
  if (mode === "week") return shiftDate(date, direction * 7);
  if (mode === "month") {
    const parsed = new Date(`${date}T12:00:00`);
    parsed.setMonth(parsed.getMonth() + direction);
    return parsed.toISOString().slice(0, 10);
  }
  return shiftDate(date, direction);
}

function formatShortDate(date: string, language: AppLanguage) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    weekday: "short",
    day: "numeric",
  })
    .format(parsed)
    .replace(".", "");
}

function formatWeekdayShort(date: string, language: AppLanguage) {
  const day = new Date(`${date}T12:00:00`).getDay();
  const labels: Record<AppLanguage, string[]> = {
    uk: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    pl: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"],
    cs: ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"],
    es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  };
  return labels[language][day] || labels.ru[day] || "";
}

function formatTimeFromMinutes(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatCalendarTitle(mode: CalendarViewMode, date: string, language: AppLanguage) {
  if (mode === "day") return formatDayLabel(date, language);
  const locale = localeForLanguage(language);
  if (mode === "month") {
    return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(`${date}T12:00:00`));
  }
  const range = mode === "week" ? getCalendarModeDates("week", date) : [date, shiftDate(date, 2)];
  const start = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${range[0]}T12:00:00`));
  const endDate = range[range.length - 1];
  const end = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${endDate}T12:00:00`));
  return `${start} - ${end}`.replace(/\./g, "");
}

function isWeekend(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

function isSameMonth(left: string, right: string) {
  return left.slice(0, 7) === right.slice(0, 7);
}

const dayScheduleKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DEFAULT_FLEXIBLE_INTERVALS: WorkIntervalRecord[] = [
  { startTime: "09:00", endTime: "13:00" },
  { startTime: "14:00", endTime: "18:00" },
];

function getFallbackSchedule(date: string): WorkDayScheduleRecord {
  const weekend = isWeekend(date);
  return {
    enabled: !weekend,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [],
    dayType: weekend ? "day-off" : "workday",
  };
}

function getClosedScheduleForDate(date: string): WorkDayScheduleRecord {
  const fallback = getFallbackSchedule(date);
  return serializeIntervalsToDay(false, getDayIntervalsRecord(fallback), fallback);
}

function getScheduleForDate(workspace: WorkspaceSnapshot | null, date: string): WorkDayScheduleRecord {
  const custom = workspace?.memberSchedule?.customSchedule?.[date];
  if (custom) return normalizeScheduleDay(custom, date);
  if (workspace?.memberSchedule?.workScheduleMode === "flexible") {
    return getClosedScheduleForDate(date);
  }
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  const schedule = workspace?.memberSchedule?.workSchedule?.[dayScheduleKeys[dayIndex]];
  return normalizeScheduleDay(schedule, date);
}

function getMemberScheduleForDate(member: CalendarMemberView | null, workspace: WorkspaceSnapshot | null, date: string): WorkDayScheduleRecord {
  if (!member?.memberSchedule) return getScheduleForDate(workspace, date);
  const custom = member.memberSchedule.customSchedule?.[date];
  if (custom) return normalizeScheduleDay(custom, date);
  if (member.memberSchedule.workScheduleMode === "flexible") {
    return getClosedScheduleForDate(date);
  }
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  return normalizeScheduleDay(member.memberSchedule.workSchedule?.[dayScheduleKeys[dayIndex]], date);
}

function normalizeScheduleDay(day: WorkDayScheduleRecord | undefined, date: string): WorkDayScheduleRecord {
  const fallback = getFallbackSchedule(date);
  if (!day) return fallback;
  const enabled = day.enabled === true && day.dayType !== "day-off" && day.dayType !== "holiday";
  const startTime = typeof day.startTime === "string" && day.startTime ? day.startTime : fallback.startTime;
  const endTime = typeof day.endTime === "string" && day.endTime ? day.endTime : fallback.endTime;
  const breaks = Array.isArray(day.breaks)
    ? day.breaks
        .filter((item) => item?.startTime && item?.endTime && item.startTime < item.endTime)
        .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
    : day.breakStart && day.breakEnd && day.breakStart < day.breakEnd
      ? [{ startTime: day.breakStart, endTime: day.breakEnd }]
      : [];
  const intervals = Array.isArray(day.intervals)
    ? day.intervals
        .filter((item) => item?.startTime && item?.endTime)
        .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
        .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime))
    : undefined;

  return {
    ...day,
    enabled,
    startTime,
    endTime,
    intervals,
    breaks,
    dayType: enabled ? "workday" : day.dayType || "day-off",
  };
}

function getWorkTimeLabel(schedule: WorkDayScheduleRecord, t: Record<string, string>) {
  if (!schedule.enabled) return t.closedBySchedule;
  return `${schedule.startTime}-${schedule.endTime}`;
}

function getWorkTimeParts(schedule: WorkDayScheduleRecord) {
  return {
    start: schedule.startTime,
    end: schedule.endTime,
  };
}

function getDayBreaksRecord(day: WorkDayScheduleRecord | undefined) {
  if (!day) return [];
  if (Array.isArray(day.breaks)) {
    return day.breaks
      .filter((item) => item?.startTime && item?.endTime && item.startTime < item.endTime)
      .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  }
  if (day.breakStart && day.breakEnd && day.breakStart < day.breakEnd) {
    return [{ startTime: day.breakStart, endTime: day.breakEnd }];
  }
  return [];
}

function getDayIntervalsRecord(day: WorkDayScheduleRecord | undefined) {
  if (!day) return [{ startTime: "09:00", endTime: "18:00" }];
  if (Array.isArray(day.intervals) && day.intervals.length > 0) {
    return day.intervals
      .filter((item) => item?.startTime && item?.endTime)
      .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  }
  const dayStart = timeToMinutes(day.startTime);
  const dayEnd = timeToMinutes(day.endTime);
  if (dayStart >= dayEnd) {
    return [{ startTime: day.startTime, endTime: day.endTime }];
  }

  const intervals: WorkIntervalRecord[] = [];
  let cursor = dayStart;
  for (const item of getDayBreaksRecord(day)) {
    const breakStart = Math.max(dayStart, Math.min(dayEnd, timeToMinutes(item.startTime)));
    const breakEnd = Math.max(dayStart, Math.min(dayEnd, timeToMinutes(item.endTime)));
    if (breakStart > cursor) {
      intervals.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(breakStart) });
    }
    cursor = Math.max(cursor, breakEnd);
  }
  if (cursor < dayEnd) {
    intervals.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(dayEnd) });
  }
  return intervals.length ? intervals : [{ startTime: day.startTime, endTime: day.endTime }];
}

function validateWorkIntervals(intervals: WorkIntervalRecord[]) {
  const sorted = [...intervals]
    .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
    .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));

  if (sorted.some((item) => timeToMinutes(item.startTime) >= timeToMinutes(item.endTime))) {
    return { ok: false as const, reason: "range" as const, intervals: sorted };
  }

  const normalized: WorkIntervalRecord[] = [];
  for (const interval of sorted) {
    const previous = normalized[normalized.length - 1];
    if (!previous) {
      normalized.push(interval);
      continue;
    }
    if (timeToMinutes(interval.startTime) < timeToMinutes(previous.endTime)) {
      return { ok: false as const, reason: "overlap" as const, intervals: sorted };
    }
    if (interval.startTime === previous.endTime) {
      previous.endTime = interval.endTime;
      continue;
    }
    normalized.push(interval);
  }

  return { ok: true as const, reason: null, intervals: normalized };
}

function serializeIntervalsToDay(enabled: boolean, intervals: WorkIntervalRecord[], fallback?: WorkDayScheduleRecord) {
  const validation = validateWorkIntervals(intervals);
  const normalized = validation.ok ? validation.intervals : intervals;
  const fallbackStart = fallback?.startTime || normalized[0]?.startTime || "09:00";
  const fallbackEnd = fallback?.endTime || normalized[normalized.length - 1]?.endTime || "18:00";

  if (!enabled || normalized.length === 0) {
    return {
      enabled: false,
      startTime: fallbackStart,
      endTime: fallbackEnd,
      intervals,
      breakStart: fallbackStart,
      breakEnd: fallbackStart,
      breaks: [],
      dayType: "day-off" as const,
    };
  }

  const sorted = [...normalized].sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const breaks: WorkBreakRecord[] = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (current.endTime < next.startTime) {
      breaks.push({ startTime: current.endTime, endTime: next.startTime });
    }
  }

  return {
    enabled: true,
    startTime: first.startTime,
    endTime: last.endTime,
    intervals: sorted,
    breakStart: breaks[0]?.startTime || first.startTime,
    breakEnd: breaks[0]?.endTime || first.startTime,
    breaks,
    dayType: "workday" as const,
  };
}

function getIntervalsDurationMinutes(intervals: WorkIntervalRecord[]) {
  return intervals.reduce((sum, item) => sum + Math.max(0, timeToMinutes(item.endTime) - timeToMinutes(item.startTime)), 0);
}

function formatMoneylessHours(minutes: number, unit: string) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
  return `${value} ${unit}`;
}

function createSplitWorkIntervals(interval: WorkIntervalRecord) {
  const start = timeToMinutes(interval.startTime);
  const end = timeToMinutes(interval.endTime);
  const duration = end - start;
  if (duration < 360) return null;
  const gap = 60;
  const firstEnd = Math.round((start + (duration - gap) / 2) / 15) * 15;
  const safeFirstEnd = Math.max(start + 60, Math.min(firstEnd, end - gap - 60));
  const secondStart = safeFirstEnd + gap;
  if (safeFirstEnd <= start || secondStart >= end) return null;
  return [
    { startTime: minutesToTime(start), endTime: minutesToTime(safeFirstEnd) },
    { startTime: minutesToTime(secondStart), endTime: minutesToTime(end) },
  ];
}

function createWorkIntervalAfter(intervals: WorkIntervalRecord[], index: number) {
  const current = intervals[index];
  if (!current) return null;
  const next = intervals[index + 1];
  const minGap = 15;
  const currentEnd = timeToMinutes(current.endTime);
  const nextStart = next ? timeToMinutes(next.startTime) : 24 * 60;
  if (nextStart - currentEnd > minGap) {
    const windowStart = currentEnd + minGap;
    const desiredEnd = Math.min(nextStart - minGap, windowStart + 60);
    if (desiredEnd - windowStart >= 15) {
      return { startTime: minutesToTime(windowStart), endTime: minutesToTime(desiredEnd) };
    }
  }
  const desiredGap = currentEnd < timeToMinutes("14:00") ? 60 : 15;
  const desiredDuration = currentEnd < timeToMinutes("14:00") ? 240 : 60;
  const desiredStart = Math.min(currentEnd + desiredGap, 24 * 60 - 30);
  const desiredEnd = Math.min(24 * 60 - 1, desiredStart + desiredDuration);
  if (desiredEnd - desiredStart < 15) return null;
  return { startTime: minutesToTime(desiredStart), endTime: minutesToTime(desiredEnd) };
}

function insertWorkIntervalRecord(intervals: WorkIntervalRecord[], index: number) {
  if (intervals.length === 1) {
    const split = createSplitWorkIntervals(intervals[0]);
    if (split) return split;
  }
  const suggestion = createWorkIntervalAfter(intervals, index);
  if (!suggestion) return null;
  return [...intervals.slice(0, index + 1), suggestion, ...intervals.slice(index + 1)];
}

function getClosedShortLabel(language: AppLanguage) {
  if (language === "uk") return "Вих.";
  if (language === "ru") return "Вых.";
  if (language === "fr") return "Ferm.";
  if (language === "pl") return "Wol.";
  if (language === "cs") return "Vol.";
  if (language === "es") return "Cerr.";
  if (language === "de") return "Zu";
  return "Off";
}

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());
  const [mode, setMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<MobileSession | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [calendar, setCalendar] = useState<CalendarSnapshot | null>(null);
  const [calendarDate, setCalendarDate] = useState(getTodayIso());
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogCategory[]>([]);
  const [staffSnapshot, setStaffSnapshot] = useState<StaffSnapshot | null>(null);
  const staffMediaLoadedAtRef = useRef(0);
  const [activeTab, setActiveTab] = useState<AppTab>("calendar");
  const [servicesModeRequest, setServicesModeRequest] = useState<{ mode: ServiceTabMode; id: number } | null>(null);
  const [settingsSection, setSettingsSection] = useState<MobileSettingsSection>("general");
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [loadingSession, setLoadingSession] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState<"google" | "apple" | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pendingBiometricSession, setPendingBiometricSession] = useState<MobileSession | null>(null);
  const [visitComposerOpen, setVisitComposerOpen] = useState(false);
  const [registerDetailsOpen, setRegisterDetailsOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const authScrollRef = useRef<ScrollView | null>(null);
  const handleServicesModeRequestHandled = useCallback(() => setServicesModeRequest(null), []);
  const detectedCountry = useMemo(() => getDetectedCountry(), []);
  const detectedTimezone = useMemo(() => getDetectedTimezone(), []);
  const t = copy[language];
  const hasPremium = isPremiumActive(workspace?.professional);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    companyName: "",
  });
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordBusy, setForgotPasswordBusy] = useState(false);
  const [registerPhoneCountry, setRegisterPhoneCountry] = useState<PhoneCountryOption>(() => detectedCountry.phoneCountry);
  const [phoneCountryPickerOpen, setPhoneCountryPickerOpen] = useState(false);
  const [phoneCountryQuery, setPhoneCountryQuery] = useState("");
  const [customPhonePrefix, setCustomPhonePrefix] = useState("");
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState("");
  const captchaResolverRef = useRef<((token: string) => void) | null>(null);
  const [visitDraft, setVisitDraft] = useState<VisitDraft>(() => createDefaultVisitDraft(selectedDate, "09:00"));
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null);
  const [timeAction, setTimeAction] = useState<{ date: string; time: string; targetProfessionalId?: string } | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [clientDraft, setClientDraft] = useState<ClientDraftState>({ firstName: "", lastName: "", phone: "", email: "" });
  const pendingServiceSavesRef = useRef<Map<string, PendingServiceSave>>(new Map());
  const pendingServiceDeletesRef = useRef<Set<string>>(new Set());
  const pendingServicePatchesRef = useRef<Map<string, Partial<ServiceRecord>>>(new Map());
  const pendingAppointmentCreatesRef = useRef<Map<string, AppointmentRecord>>(new Map());
  const pendingAppointmentDeletesRef = useRef<Set<string>>(new Set());
  const pendingAppointmentPatchesRef = useRef<Map<string, Partial<AppointmentRecord>>>(new Map());
  const appointmentDeleteFlushTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingClientCreatesRef = useRef<Map<string, ClientRecord>>(new Map());
  const serviceSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceSaveInFlightRef = useRef(false);
  const serviceSaveFlushPromiseRef = useRef<Promise<void> | null>(null);
  const serviceCreatePromiseRef = useRef<Promise<void> | null>(null);
  const latestLanguageRef = useRef(language);
  const initialLanguageRef = useRef(language);
  const pendingProfileLanguageRef = useRef<AppLanguage | null>(null);
  const languageStorageReadyRef = useRef(false);
  const autoPushRegisteringRef = useRef(false);
  const lastTrackedAppOpenSessionRef = useRef("");
  const nativeGoogleConfigured = Platform.select({
    ios: Boolean(GOOGLE_IOS_CLIENT_ID),
    android: Boolean(GOOGLE_ANDROID_CLIENT_ID),
    default: Boolean(GOOGLE_WEB_CLIENT_ID),
  });

  function handleGoogleAuthCallbackUrl(url: string) {
    void WebBrowser.dismissBrowser();
    try {
      const parsed = new URL(url);
      const error = parsed.searchParams.get("error") || "";
      if (error) {
        Alert.alert("Google", error === "config" ? t.socialAuthConfigMissing : t.socialAuthFailed);
        return;
      }
      const nextSession = normalizeApiSession(
        {
          token: parsed.searchParams.get("token") || "",
          professionalId: parsed.searchParams.get("professionalId") || "",
          profile: {
            email: parsed.searchParams.get("email") || "",
            displayName: parsed.searchParams.get("displayName") || "",
            language: parsed.searchParams.get("language") || "",
          },
        },
        parsed.searchParams.get("email") || ""
      );
      if (nextSession.token && nextSession.professionalId) {
        void persistSession(nextSession);
        if (nextSession.isNewRegistration) {
          void initiateFirebaseMobileRegistrationConversion({ email: nextSession.email }).then(() =>
            trackMobileAdsEvent(
              "mobile_sign_up_complete",
              {
                method: "google",
                country: registerPhoneCountry.country,
                currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country)
              },
              nextSession.token
            )
          );
          return;
        }
        void trackMobileAdsEvent(
          "mobile_social_auth_complete",
          {
            provider: "google",
            country: registerPhoneCountry.country,
            currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country)
          },
          nextSession.token
        );
      } else {
        Alert.alert("Google", t.socialAuthFailed);
      }
    } catch {
      Alert.alert("Google", t.socialAuthFailed);
    }
  }

  useEffect(() => {
    const handleIncomingUrl = (url: string) => {
      if (!url) return;
      if (url.includes("timviz-master://google-auth")) {
        handleGoogleAuthCallbackUrl(url);
        return;
      }
      if (url.includes("timviz-master://captcha")) {
        try {
          const parsed = new URL(url);
          const token = parsed.searchParams.get("token") || "";
          if (token) {
            void WebBrowser.dismissBrowser();
            closeCaptcha(token);
          }
        } catch {
          // Ignore malformed deep links.
        }
        return;
      }
      if (url.includes("timviz-master://password-reset")) {
        try {
          const parsed = new URL(url);
          const email = parsed.searchParams.get("email")?.trim().toLowerCase() || "";
          if (email) {
            setLoginForm((current) => ({ ...current, email }));
          }
        } catch {
          // Ignore malformed deep links.
        }
        void WebBrowser.dismissBrowser();
        setMode("login");
        return;
      }
      if (url.includes("create-account")) setMode("register");
      if (url.includes("pro/login")) setMode("login");
    };

    Linking.getInitialURL()
      .then((url) => {
        if (!url) return;
        handleIncomingUrl(url);
      })
      .catch(() => undefined);

    const subscription = Linking.addEventListener("url", ({ url }) => handleIncomingUrl(url));
    return () => subscription.remove();
  }, [t.socialAuthConfigMissing, t.socialAuthFailed]);

  useEffect(() => {
    AsyncStorage.getItem(APP_LANGUAGE_KEY)
      .then((value) => {
        const savedLanguage = normalizeAppLanguage(value);
        if (savedLanguage && latestLanguageRef.current === initialLanguageRef.current) {
          latestLanguageRef.current = savedLanguage;
          setLanguage(savedLanguage);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        languageStorageReadyRef.current = true;
        void AsyncStorage.setItem(APP_LANGUAGE_KEY, latestLanguageRef.current).catch(() => undefined);
      });
  }, []);

  useEffect(() => {
    latestLanguageRef.current = language;
    if (!languageStorageReadyRef.current) return;
    void AsyncStorage.setItem(APP_LANGUAGE_KEY, language).catch(() => undefined);
  }, [language]);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleSignInAvailable)
      .catch(() => setAppleSignInAvailable(false));
    hasBiometricUnlockAvailable()
      .then(setBiometricAvailable)
      .catch(() => setBiometricAvailable(false));
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  function hasVisibleWorkspaceData() {
    return Boolean(workspace || calendar || clients.length || staffSnapshot);
  }

  function syncLanguageFromWorkspace(value: unknown) {
    const profileLanguage = normalizeAppLanguage(value);
    if (!profileLanguage) return;
    if (pendingProfileLanguageRef.current && pendingProfileLanguageRef.current !== profileLanguage) {
      return;
    }
    pendingProfileLanguageRef.current = null;
    if (latestLanguageRef.current !== profileLanguage) {
      latestLanguageRef.current = profileLanguage;
      setLanguage(profileLanguage);
    }
  }

  function setWorkspaceLanguage(nextLanguage: AppLanguage) {
    pendingProfileLanguageRef.current = nextLanguage;
    latestLanguageRef.current = nextLanguage;
    setLanguage(nextLanguage);
  }

  function applyWorkspaceCache(cache: MobileWorkspaceCache) {
    setWorkspace(cache.workspace);
    setCalendar(cache.calendar);
    setCalendarDate(cache.selectedDate || selectedDate);
    setClients(Array.isArray(cache.clients) ? cache.clients : []);
    setServiceCatalog(Array.isArray(cache.serviceCatalog) ? cache.serviceCatalog : []);
    setStaffSnapshot(cache.staffSnapshot || null);
    if (cache.staffSnapshot?.members?.some((member) => safeText(member.professional.avatarUrl))) {
      staffMediaLoadedAtRef.current = Date.now();
    }
    syncLanguageFromWorkspace(cache.workspace?.professional?.language);
    if (cache.selectedDate) setSelectedDate(cache.selectedDate);
  }

  function persistWorkspaceCache(currentSession: MobileSession, date: string, snapshot: Omit<MobileWorkspaceCache, "professionalId" | "selectedDate" | "updatedAt">) {
    const payload: MobileWorkspaceCache = {
      professionalId: currentSession.professionalId,
      selectedDate: date,
      updatedAt: Date.now(),
      ...snapshot,
    };
    void AsyncStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }

  function mergeCalendarAppointments(date: string, updater: (appointments: AppointmentRecord[]) => AppointmentRecord[]) {
    setCalendar((current) => {
      if (!current) return current;
      if (calendarDate !== date) return current;
      const nextAppointments = updater(current.appointments || []);
      const nextMemberCalendars = current.memberCalendars?.map((member) => ({
        ...member,
        appointments: updater(member.appointments || []).filter((appointment) => (appointment.professionalId || member.professionalId) === member.professionalId),
      }));
      return {
        ...current,
        appointments: nextAppointments,
        memberCalendars: nextMemberCalendars,
        stats: {
          ...current.stats,
          day: {
            ...current.stats.day,
            visitsCount: nextAppointments.filter((item) => item.kind === "appointment" && (item.appointmentDate || date) === date).length,
          },
        },
      };
    });
  }

  function applyPendingAppointmentStateToList(appointments: AppointmentRecord[], date: string) {
    const pendingCreates = Array.from(pendingAppointmentCreatesRef.current.values()).filter((item) => (item.appointmentDate || date) === date);
    const nextAppointments = appointments
      .filter((appointment) => !pendingAppointmentDeletesRef.current.has(appointment.id))
      .map((appointment) => ({ ...appointment, ...(pendingAppointmentPatchesRef.current.get(appointment.id) || {}) }));

    pendingCreates.forEach((appointment) => {
      if (!nextAppointments.some((item) => item.id === appointment.id)) {
        nextAppointments.push(appointment);
      }
    });

    return nextAppointments.sort((left, right) => left.startTime.localeCompare(right.startTime));
  }

  function withPendingCalendarState(snapshot: CalendarSnapshot, date: string): CalendarSnapshot {
    const appointments = applyPendingAppointmentStateToList(snapshot.appointments || [], date);
    return {
      ...snapshot,
      appointments,
      memberCalendars: snapshot.memberCalendars?.map((member) => ({
        ...member,
        appointments: applyPendingAppointmentStateToList(member.appointments || [], date).filter((appointment) => (appointment.professionalId || member.professionalId) === member.professionalId),
      })),
      stats: {
        ...snapshot.stats,
        day: {
          ...snapshot.stats.day,
          visitsCount: appointments.filter((item) => item.kind === "appointment" && (item.appointmentDate || date) === date).length,
        },
      },
    };
  }

  function withPendingClientCreates(nextClients: ClientRecord[]) {
    const pendingClients = Array.from(pendingClientCreatesRef.current.values());
    if (!pendingClients.length) return nextClients;
    const existingIds = new Set(nextClients.map((client) => client.id));
    return [
      ...pendingClients.filter((client) => !existingIds.has(client.id)),
      ...nextClients,
    ];
  }

  function mergeWorkspaceServices(updater: (services: ServiceRecord[]) => ServiceRecord[]) {
    setWorkspace((current) => {
      if (!current) return current;
      return {
        ...current,
        services: updater(current.services || []),
      };
    });
  }

  function mergeRemoteServicesPreservingLocal(remoteServices: ServiceRecord[], localServices: ServiceRecord[]) {
    if (!localServices.length || remoteServices.length >= localServices.length || pendingServiceDeletesRef.current.size > 0) {
      return remoteServices;
    }

    const merged = [...remoteServices];
    localServices.forEach((localService) => {
      const existingIndex = merged.findIndex(
        (remoteService) => remoteService.id === localService.id || serviceIdentityOverlaps(remoteService, localService)
      );
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...localService, ...merged[existingIndex] };
      } else {
        merged.push(localService);
      }
    });

    return merged;
  }

  function isOptimisticServiceId(serviceId: string | undefined) {
    return safeText(serviceId).startsWith("service-");
  }

  function servicePatchPayload(service: ServiceRecord): ServiceUpdatePayload {
    return {
      name: safeText(service.name).trim(),
      localizedName: service.localizedName,
      category: getCanonicalServiceCategory(service.category),
      durationMinutes: Number(service.durationMinutes || 60),
      price: Number(service.price || 0),
      color: service.color || SERVICE_COLORS[0],
    };
  }

  function findPendingServiceSave(serviceId: string, service?: Pick<ServiceRecord, "name" | "localizedName">) {
    return Array.from(pendingServiceSavesRef.current.values()).find((item) =>
      item.optimisticService.id === serviceId || Boolean(service && serviceIdentityOverlaps(item.optimisticService, service))
    );
  }

  function updatePendingServiceSave(serviceId: string, updatedService: ServiceRecord) {
    const pending = findPendingServiceSave(serviceId, updatedService);
    if (!pending) return false;
    const nextService = { ...pending.optimisticService, ...updatedService, id: pending.optimisticService.id };
    pendingServiceSavesRef.current.set(pending.key, {
      ...pending,
      optimisticService: nextService,
      payload: {
        ...pending.payload,
        ...servicePatchPayload(nextService),
      },
    });
    return true;
  }

  function findSavedServiceForPatch(serviceId: string, service?: Pick<ServiceRecord, "name" | "localizedName">) {
    const services = workspace?.services || [];
    return services.find((item) => item.id === serviceId && !isOptimisticServiceId(item.id)) ||
      services.find((item) => !isOptimisticServiceId(item.id) && Boolean(service && serviceIdentityOverlaps(item, service)));
  }

  function isServiceNotFoundError(error: unknown) {
    return error instanceof Error && /service\s+not\s+found/i.test(error.message);
  }

  function serviceMatchesPending(service: ServiceRecord, pending: PendingServiceSave) {
    return service.id === pending.optimisticService.id || serviceIdentityOverlaps(service, pending.optimisticService);
  }

  function hasServiceOrPendingSave(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName">, key = makePendingServiceKey(service)) {
    if (!key) return false;
    if (pendingServiceSavesRef.current.has(key)) return true;
    if (Array.from(pendingServiceSavesRef.current.values()).some((item) => serviceIdentityOverlaps(item.optimisticService, service))) {
      return true;
    }
    return Boolean(workspace?.services.some((item) => serviceIdentityOverlaps(item, service) && !pendingServiceDeletesRef.current.has(item.id)));
  }

  function serviceIsPendingDelete(service: ServiceRecord) {
    return pendingServiceDeletesRef.current.has(service.id);
  }

  function withPendingServiceSaves(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
    const pending = Array.from(pendingServiceSavesRef.current.values());
    const hasPendingDeletes = pendingServiceDeletesRef.current.size > 0;
    const hasPendingPatches = pendingServicePatchesRef.current.size > 0;
    if (!pending.length && !hasPendingDeletes && !hasPendingPatches) return snapshot;

    const nextServices = (snapshot.services || [])
      .filter((service) => !serviceIsPendingDelete(service))
      .map((service) => ({ ...service, ...(pendingServicePatchesRef.current.get(service.id) || {}) }));
    pending.forEach((item) => {
      if (!nextServices.some((service) => serviceMatchesPending(service, item))) {
        nextServices.unshift(item.optimisticService);
      }
    });

    return {
      ...snapshot,
      services: nextServices,
    };
  }

  function replaceOptimisticServices(savedServices: ServiceRecord[], pendingItems: PendingServiceSave[]) {
    if (!savedServices.length || !pendingItems.length) return;
    const optimisticIds = new Set(pendingItems.map((item) => item.optimisticService.id));
    const patchesToFlush: Array<{ serviceId: string; patch: ServiceRecord }> = [];
    const patchedSavedServices = savedServices.map((savedService) => {
      const pendingItem = pendingItems.find((item) => serviceMatchesPending(savedService, item));
      const optimisticPatch = pendingItem ? pendingServicePatchesRef.current.get(pendingItem.optimisticService.id) : undefined;
      if (!optimisticPatch || !pendingItem) return savedService;
      const patchedSavedService = { ...savedService, ...optimisticPatch, id: savedService.id };
      pendingServicePatchesRef.current.delete(pendingItem.optimisticService.id);
      pendingServicePatchesRef.current.set(savedService.id, patchedSavedService);
      patchesToFlush.push({ serviceId: savedService.id, patch: patchedSavedService });
      return patchedSavedService;
    });

    setWorkspace((current) => {
      if (!current) return current;
      const nextServices = (current.services || []).filter((service) => !optimisticIds.has(service.id));

      patchedSavedServices.forEach((patchedSavedService) => {
        const existingIndex = nextServices.findIndex((service) => service.id === patchedSavedService.id || serviceIdentityOverlaps(service, patchedSavedService));
        if (existingIndex >= 0) {
          nextServices[existingIndex] = { ...nextServices[existingIndex], ...patchedSavedService };
        } else {
          nextServices.unshift(patchedSavedService);
        }
      });

      return {
        ...current,
        services: nextServices,
      };
    });

    patchesToFlush.forEach((item) => {
      void flushServicePatch(item.serviceId, item.patch, { silent: true });
    });
  }

  function scheduleServiceSaveFlush(delay = 450) {
    if (serviceSaveTimerRef.current) return;
    serviceSaveTimerRef.current = setTimeout(() => {
      serviceSaveTimerRef.current = null;
      void flushPendingServiceSaves();
    }, delay);
  }

  async function flushPendingServiceSaves() {
    if (!session) return;
    if (serviceSaveFlushPromiseRef.current) return serviceSaveFlushPromiseRef.current;
    const pendingItems = Array.from(pendingServiceSavesRef.current.values()).slice(0, 5);
    if (!pendingItems.length) return;

    const flushPromise = (async () => {
      serviceSaveInFlightRef.current = true;
      try {
        const result = await apiFetch("/api/mobile/pro/services", {
          method: "POST",
          body: JSON.stringify({
            services: pendingItems.map((item) => item.payload),
          }),
        });
        const savedServices: ServiceRecord[] = Array.isArray(result?.services)
          ? result.services
          : result?.service
            ? [result.service]
            : [];

        pendingItems.forEach((item) => pendingServiceSavesRef.current.delete(item.key));
        replaceOptimisticServices(savedServices, pendingItems);
        setVisitDraft((current) => {
          const items = Array.isArray(current.items) ? current.items : [];
          if (!items.length || !savedServices.length) return current;
          let changed = false;
          const nextItems = items.map((item) => {
            if (!item.serviceId.startsWith("service-")) return item;
            const saved = savedServices.find((service) => serviceNameMatches(service, item.serviceName) || serviceIdentityOverlaps(service, { name: item.serviceName }));
            if (!saved) return item;
            changed = true;
            return {
              ...item,
              serviceId: saved.id,
              serviceName: getServiceDisplayName(saved, language) || item.serviceName,
              priceAmount: Number(saved.price || item.priceAmount || 0),
              durationMinutes: Number(saved.durationMinutes || item.durationMinutes || 15),
            };
          });
          if (!changed) return current;
          return {
            ...current,
            serviceId: current.serviceId.startsWith("service-") ? nextItems[0]?.serviceId || current.serviceId : current.serviceId,
            items: nextItems,
          };
        });
      } catch {
        pendingItems.forEach((item) => {
          pendingServiceSavesRef.current.set(item.key, { ...item, attempts: item.attempts + 1 });
        });
        scheduleServiceSaveFlush(2500);
      } finally {
        serviceSaveInFlightRef.current = false;
        serviceSaveFlushPromiseRef.current = null;
        if (pendingServiceSavesRef.current.size) {
          scheduleServiceSaveFlush(650);
        }
      }
    })();

    serviceSaveFlushPromiseRef.current = flushPromise;
    return flushPromise;
  }

  function makeOptimisticAppointment(input: {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    priceAmount: number;
    targetProfessionalId?: string;
    kind?: "appointment" | "blocked";
  }): AppointmentRecord {
    return {
      id: createLocalId("optimistic"),
      professionalId: input.targetProfessionalId || workspace?.professional.id,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      kind: input.kind || "appointment",
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      serviceName: input.serviceName,
      attendance: "confirmed",
      priceAmount: input.priceAmount,
    };
  }

  function revalidateWorkspace(date = selectedDate, silent = true) {
    if (!session) return;
    void refreshAll(session, date, { silent });
  }

  function openServicesCatalog() {
    setServicesModeRequest({ mode: "catalog", id: Date.now() });
    setActiveTab("services");
  }

  function patchWorkspaceBusiness(patch: Partial<WorkspaceSnapshot["business"]>) {
    setWorkspace((current) => current ? { ...current, business: { ...current.business, ...patch } } : current);
  }

  function openSettingsSection(section: MobileSettingsSection = "general") {
    setSettingsSection(section);
    setActiveTab("settings");
  }

  function activateCachedSession(cachedSession: MobileSession) {
    setSession(cachedSession);
    AsyncStorage.getItem(WORKSPACE_CACHE_KEY)
      .then((cacheRaw) => {
        if (!cacheRaw) return;
        const cache = JSON.parse(cacheRaw) as MobileWorkspaceCache;
        if (cache.professionalId === cachedSession.professionalId) {
          applyWorkspaceCache(cache);
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(SECURE_SESSION_KEY).catch(() => null),
      AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
      AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY).catch(() => null),
      hasBiometricUnlockAvailable(),
    ]).then(([secureRaw, legacyRaw, biometricFlag, biometricReady]) => {
      const raw = secureRaw || legacyRaw;
      const nextBiometricEnabled = biometricFlag === "1";
      setBiometricAvailable(biometricReady);
      setBiometricEnabled(nextBiometricEnabled);
      if (!raw) return;
      try {
        const cachedSession = JSON.parse(raw) as MobileSession;
        if (!secureRaw) {
          void SecureStore.setItemAsync(SECURE_SESSION_KEY, JSON.stringify(cachedSession)).catch(() => undefined);
        }
        if (nextBiometricEnabled && biometricReady) {
          setPendingBiometricSession(cachedSession);
          return;
        }
        activateCachedSession(cachedSession);
      } catch {
        setSession(null);
      }
    }).finally(() => {
      setLoadingSession(false);
    });
  }, []);

  useEffect(() => {
    if (session) {
      refreshAll(session, selectedDate, { silent: hasVisibleWorkspaceData() });
    }
  }, [session]);

  useEffect(() => {
    if (!session?.token || lastTrackedAppOpenSessionRef.current === session.token) return;
    lastTrackedAppOpenSessionRef.current = session.token;
    void trackMobileAdsEvent("mobile_app_open", {
      language,
      timezone: detectedTimezone,
      country: registerPhoneCountry.country,
      currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country)
    });
  }, [detectedTimezone, language, registerPhoneCountry, session?.token]);

  useEffect(() => {
    if (!session || autoPushRegisteringRef.current) return;
    const storageKey = `${PUSH_AUTO_REGISTER_KEY_PREFIX}${session.professionalId}`;
    autoPushRegisteringRef.current = true;
    AsyncStorage.getItem(storageKey)
      .then(async (alreadyPrompted) => {
        const permission = await Notifications.getPermissionsAsync();
        if (alreadyPrompted === "1" && permission.status !== "granted") return;
        await registerPushForSession(session, { markPrompted: true });
      })
      .catch(() => undefined)
      .finally(() => {
        autoPushRegisteringRef.current = false;
      });
  }, [session?.professionalId, session?.token]);

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

  async function trackMobileAdsEvent(
    eventName: MobileAdsEventName,
    payload: MobileAnalyticsPayload = {},
    token = session?.token
  ) {
    const enrichedPayload = {
      ...payload,
      language,
      timezone: detectedTimezone,
      platform: Platform.OS,
      app_version: getMobileAppVersion(),
    };
    void trackFirebaseMobileEvent(eventName, enrichedPayload);
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/mobile/pro/ads/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventName,
          platform: Platform.OS,
          appVersion: getMobileAppVersion(),
          payload: enrichedPayload,
        }),
      });
    } catch {
      // Ads signals are best-effort and must not interrupt the mobile workflow.
    }
  }

  async function registerPushForSession(currentSession: MobileSession, options: { markPrompted?: boolean } = {}) {
    if (Platform.OS === "web") return false;
    const pushResult = await requestExpoPushToken();
    if (pushResult.status !== "granted" || !pushResult.expoPushToken) {
      if (options.markPrompted) {
        await AsyncStorage.setItem(`${PUSH_AUTO_REGISTER_KEY_PREFIX}${currentSession.professionalId}`, "1").catch(() => undefined);
      }
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/mobile/pro/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentSession.token}`,
      },
      body: JSON.stringify({
        expoPushToken: pushResult.expoPushToken,
        platform: Platform.OS,
        deviceName: `${Platform.OS} ${Platform.Version}`,
        language,
        timezone: workspace?.professional.timezone || detectedTimezone || "UTC",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `HTTP ${response.status}`);
    }
    await AsyncStorage.setItem(`${PUSH_AUTO_REGISTER_KEY_PREFIX}${currentSession.professionalId}`, "1").catch(() => undefined);
    return true;
  }

  const loadCalendarDays = useCallback(async (dates: string[]) => {
    if (!session) return {};
    const requestedDates = uniqueDates(dates);
    const headers = { Authorization: `Bearer ${session.token}` };

    if (requestedDates.length > 1) {
      const params = new URLSearchParams({ mode: "range", meta: "0", dates: requestedDates.join(",") });
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/calendar?${params.toString()}`, { headers });
      const result = await response.json().catch(() => ({}));
      if (response.ok && !result?.error && result?.snapshots && typeof result.snapshots === "object") {
        return result.snapshots as Record<string, CalendarSnapshot>;
      }
      if (requestedDates.length > 3) {
        return {};
      }
    }

    const entries = await Promise.all(
      requestedDates.map(async (date) => {
        const response = await fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.error) {
          return [date, null] as const;
        }
        return [date, result as CalendarSnapshot] as const;
      })
    );

    return Object.fromEntries(entries.filter((entry): entry is readonly [string, CalendarSnapshot] => Boolean(entry[1])));
  }, [session]);

  async function refreshCalendarOnly(currentSession = session, date = selectedDate) {
    if (!currentSession) return;
    try {
      const headers = { Authorization: `Bearer ${currentSession.token}` };
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.error) return;
      setCalendar(withPendingCalendarState(result as CalendarSnapshot, date));
      setCalendarDate(date);
    } catch {
      // Background calendar refresh should never block navigation.
    }
  }

  useEffect(() => {
    if (!session) return;
    void refreshCalendarOnly(session, selectedDate);
  }, [session, selectedDate]);

  async function refreshAll(currentSession = session, date = selectedDate, options: { silent?: boolean; media?: boolean } = {}) {
    if (!currentSession) return;

    if (!options.silent) setRefreshing(true);
    try {
      const headers = { Authorization: `Bearer ${currentSession.token}` };
      const shouldLoadStaffMedia = options.media === true || Date.now() - staffMediaLoadedAtRef.current > CALENDAR_MEMBER_META_TTL_MS;
      const staffUrl = `${API_BASE_URL}/api/mobile/pro/staff${shouldLoadStaffMedia ? "?media=1" : ""}`;
      const [workspaceResult, calendarResult, clientsResult, servicesResult, staffResult] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mobile/pro/workspace/${currentSession.professionalId}?media=1`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/clients`, { headers }).then((item) => item.json()),
        fetch(`${API_BASE_URL}/api/mobile/pro/services`, { headers }).then((item) => item.json()),
        fetch(staffUrl, { headers }).then((item) => item.json().catch(() => null)).catch(() => null),
      ]);

      if (workspaceResult?.error) throw new Error(workspaceResult.error);
      if (calendarResult?.error) throw new Error(calendarResult.error);
      if (clientsResult?.error) throw new Error(clientsResult.error);
      if (servicesResult?.error) throw new Error(servicesResult.error);
      if (staffResult?.error) throw new Error(staffResult.error);

      const nextClients = withPendingClientCreates(Array.isArray(clientsResult.clients) ? clientsResult.clients : []);
      const nextCatalog = Array.isArray(servicesResult.catalog) ? servicesResult.catalog : [];
      const serviceEndpointServices = Array.isArray(servicesResult.services) ? servicesResult.services : null;
      const workspaceEndpointServices = Array.isArray(workspaceResult.services) ? workspaceResult.services : [];
      const hasLocalServiceState = Boolean(
        workspace?.services?.length ||
          pendingServiceSavesRef.current.size ||
          pendingServicePatchesRef.current.size
      );
      const localServices = workspace?.services || [];
      let resolvedServices = serviceEndpointServices ?? workspaceEndpointServices;
      resolvedServices = mergeRemoteServicesPreservingLocal(resolvedServices, localServices);
      if (
        resolvedServices.length === 0 &&
        hasLocalServiceState &&
        pendingServiceDeletesRef.current.size === 0
      ) {
        resolvedServices = localServices;
      }
      const nextWorkspace = withPendingServiceSaves({
        ...workspaceResult,
        services: resolvedServices,
      });
      const nextStaffSnapshot = mergeStaffSnapshotMedia(staffSnapshot, staffResult || null);
      if (shouldLoadStaffMedia && nextStaffSnapshot?.members?.length) {
        staffMediaLoadedAtRef.current = Date.now();
      }
      syncLanguageFromWorkspace(nextWorkspace.professional?.language);
      setWorkspace(nextWorkspace);
      setCalendar(withPendingCalendarState(calendarResult, date));
      setCalendarDate(date);
      setClients(nextClients);
      setServiceCatalog(nextCatalog);
      setStaffSnapshot(nextStaffSnapshot);
      persistWorkspaceCache(currentSession, date, {
        workspace: nextWorkspace,
        calendar: calendarResult,
        clients: nextClients,
        serviceCatalog: nextCatalog,
        staffSnapshot: nextStaffSnapshot,
      });
      setVisitDraft((current) => ({
        ...current,
        customerName: safeText(current.customerName),
        customerPhone: safeText(current.customerPhone),
        startTime: safeText(current.startTime) || "09:00",
        appointmentDate: safeText(current.appointmentDate) || date,
        serviceId: current.serviceId || workspaceResult.services?.[0]?.id || "",
        items: Array.isArray(current.items) && current.items.length ? current.items : [createVisitServiceDraft(safeText(current.startTime) || "09:00")],
      }));
    } catch (error) {
      if (!options.silent) {
        Alert.alert("Timviz", error instanceof Error ? error.message : t.loadWorkspaceFailed);
      }
    } finally {
      if (!options.silent) setRefreshing(false);
    }
  }

  useEffect(() => {
    if (session && activeTab === "settings") {
      refreshAll(session, selectedDate, { silent: true, media: true });
    }
  }, [activeTab, session]);

  async function persistSession(nextSession: MobileSession, preferredLanguage?: AppLanguage) {
    const sessionLanguage = preferredLanguage || nextSession.language;
    if (sessionLanguage) {
      pendingProfileLanguageRef.current = sessionLanguage;
      latestLanguageRef.current = sessionLanguage;
      setLanguage(sessionLanguage);
      void AsyncStorage.setItem(APP_LANGUAGE_KEY, sessionLanguage).catch(() => undefined);
    }
    const serialized = JSON.stringify(nextSession);
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
    await SecureStore.setItemAsync(SECURE_SESSION_KEY, serialized).catch(() => undefined);
    setPendingBiometricSession(null);
    setSession(nextSession);
    void setFirebaseMobileUser(nextSession.professionalId, {
      language: sessionLanguage || language,
      platform: Platform.OS,
    });
    void maybeOfferBiometricUnlock();
    await refreshAll(nextSession, selectedDate);
  }

  async function maybeOfferBiometricUnlock() {
    if (biometricEnabled || !biometricAvailable) return;
    Alert.alert(t.enableBiometricTitle, t.enableBiometricText, [
      { text: t.notNow, style: "cancel" },
      {
        text: t.enableBiometricAction,
        onPress: () => {
          setBiometricEnabled(true);
          void AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "1").catch(() => undefined);
        },
      },
    ]);
  }

  async function unlockPendingSessionWithBiometrics() {
    if (!pendingBiometricSession) return;
    if (!biometricAvailable) {
      Alert.alert("Timviz", t.biometricUnavailable);
      return;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.unlockWithFaceId,
        fallbackLabel: t.useDevicePasscode,
        cancelLabel: t.cancel,
        disableDeviceFallback: false,
      });
      if (!result.success) return;
      const nextSession = pendingBiometricSession;
      setPendingBiometricSession(null);
      activateCachedSession(nextSession);
    } catch (error) {
      Alert.alert("Timviz", error instanceof Error ? error.message : t.socialAuthFailed);
    }
  }

  async function toggleBiometricUnlock() {
    if (!biometricAvailable) {
      Alert.alert("Timviz", t.biometricUnavailable);
      return;
    }
    const nextValue = !biometricEnabled;
    setBiometricEnabled(nextValue);
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, nextValue ? "1" : "0").catch(() => undefined);
  }

  function closePhoneCountryPicker() {
    setPhoneCountryPickerOpen(false);
    setPhoneCountryQuery("");
  }

  function selectRegisterPhoneCountry(country: PhoneCountryOption) {
    const previousPrefix = registerPhoneCountry.callingCode;
    setRegisterPhoneCountry(country);
    setRegisterForm((current) => ({
      ...current,
      phone: getLocalPhoneNumber(current.phone, previousPrefix),
    }));
    closePhoneCountryPicker();
  }

  function selectCustomPhonePrefix(prefix: string) {
    const normalizedPrefix = normalizePhonePrefix(prefix);
    if (!normalizedPrefix) return;
    selectRegisterPhoneCountry({
      iso: "CUSTOM",
      country: "International",
      callingCode: normalizedPrefix,
      currency: detectedCountry.currency || "UAH",
    });
    setCustomPhonePrefix("");
  }

  function closeCaptcha(token = "") {
    const resolver = captchaResolverRef.current;
    captchaResolverRef.current = null;
    setCaptchaVisible(false);
    setCaptchaUrl("");
    resolver?.(token);
  }

  async function requestMobileCaptchaFallbackToken() {
    const response = await fetch(`${API_BASE_URL}/api/mobile/captcha/fallback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: `mobile-${Platform.OS}`, language }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.token) {
      throw new Error(payload?.error || t.captchaFailed);
    }
    return String(payload.token);
  }

  async function requestCaptchaToken() {
    if (Platform.OS === "android") {
      try {
        return await requestMobileCaptchaFallbackToken();
      } catch {
        return "";
      }
    }

    return new Promise<string>((resolve) => {
      captchaResolverRef.current = resolve;
      const params = new URLSearchParams();
      params.set("embedded", "1");
      params.set("language", language);
      params.set("return_to", "timviz-master://captcha");
      setCaptchaUrl(`${API_BASE_URL}/mobile-captcha?${params.toString()}`);
      setCaptchaVisible(true);
    });
  }

  async function openCaptchaInBrowser() {
    if (!captchaUrl) return;
    try {
      await WebBrowser.openBrowserAsync(captchaUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: DESIGN.colors.primary,
      });
    } catch {
      await Linking.openURL(captchaUrl).catch(() => undefined);
    }
  }

  function handleCaptchaMessage(message: string) {
    try {
      const parsed = JSON.parse(message) as { type?: string; token?: string };
      if (parsed.type === "turnstile-token" && parsed.token) {
        closeCaptcha(parsed.token);
      }
    } catch {
      // Ignore messages that do not belong to the captcha bridge.
    }
  }

  function getRegisterValidationMessage(payload: {
    firstName: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
  }) {
    if (!payload.firstName) return t.registerFirstNameRequired;
    if (!payload.email) return t.registerEmailRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return t.registerEmailInvalid;
    if (!payload.password) return t.registerPasswordRequired;
    if (payload.password.length < 6) return t.registerPasswordTooShort;
    if (!payload.phone) return t.registerPhoneRequired;
    if (!payload.companyName) return t.registerCompanyRequired;
    return "";
  }

  async function signIn() {
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password.trim();
    if (!email || !password) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, language }),
      });
      const result = await response.json();
      if (!response.ok) {
        Alert.alert(t.loginError, result?.error || t.loginError);
        return;
      }
      const nextSession = normalizeApiSession(result, email);
      await persistSession(nextSession);
      void trackMobileAdsEvent(
        "mobile_login_complete",
        {
          method: "email",
          country: registerPhoneCountry.country,
          currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country)
        },
        nextSession.token
      );
    } catch (error) {
      Alert.alert(t.loginError, error instanceof Error ? error.message : t.loginError);
    } finally {
      setBusy(false);
    }
  }

  function scrollAuthFieldIntoView(y: number) {
    const scroll = () => authScrollRef.current?.scrollTo({ y, animated: true });
    if (Platform.OS === "android") {
      setTimeout(scroll, 140);
      return;
    }
    scroll();
  }

  function openForgotPassword() {
    setForgotPasswordEmail(loginForm.email.trim().toLowerCase());
    setForgotPasswordVisible(true);
  }

  async function sendForgotPasswordEmail() {
    const email = forgotPasswordEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert(t.requiredTitle, t.forgotPasswordEmailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t.requiredTitle, t.registerEmailInvalid);
      return;
    }

    setForgotPasswordVisible(false);
    const captchaToken = await requestCaptchaToken();
    if (!captchaToken) {
      setForgotPasswordVisible(true);
      Alert.alert(t.forgotPasswordTitle, t.captchaCanceled);
      return;
    }

    setForgotPasswordBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pro/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          language,
          captchaToken,
          source: "mobile",
          returnTo: "timviz-master://password-reset",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert(t.forgotPasswordTitle, result?.error || t.forgotPasswordFailed);
        return;
      }
      setLoginForm((current) => ({ ...current, email }));
      Alert.alert(t.forgotPasswordSentTitle, t.forgotPasswordSentText);
    } catch (error) {
      Alert.alert(t.forgotPasswordTitle, error instanceof Error ? error.message : t.forgotPasswordFailed);
    } finally {
      setForgotPasswordBusy(false);
    }
  }

  async function authenticateWithSocialProvider(
    provider: "google" | "apple",
    idToken: string,
    profile: { email?: string | null; firstName?: string | null; lastName?: string | null; fullName?: string | null; avatarUrl?: string | null } = {}
  ) {
    if (!idToken) {
      setSocialBusy(null);
      Alert.alert(t.loginError, t.socialAuthFailed);
      return;
    }

    setSocialBusy(provider);
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/social-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          idToken,
          profile,
          language,
          platform: Platform.OS,
          signupSource: `mobile_${Platform.OS}`,
          country: registerPhoneCountry.country,
          timezone: detectedTimezone,
          currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert(t.loginError, result?.error || t.socialAuthFailed);
        return;
      }
      const nextSession = normalizeApiSession(result, String(result?.profile?.email || profile.email || ""));
      await persistSession(nextSession);
      if (nextSession.isNewRegistration) {
        void initiateFirebaseMobileRegistrationConversion({ email: nextSession.email }).then(() =>
          trackMobileAdsEvent(
            "mobile_sign_up_complete",
            {
              method: provider,
              country: registerPhoneCountry.country,
              currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country)
            },
            nextSession.token
          )
        );
        return;
      }
      void trackMobileAdsEvent(
        "mobile_social_auth_complete",
        {
          provider,
          country: registerPhoneCountry.country,
          currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country)
        },
        nextSession.token
      );
    } catch (error) {
      Alert.alert(t.loginError, error instanceof Error ? error.message : t.socialAuthFailed);
    } finally {
      setSocialBusy(null);
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setSocialBusy("google");
    try {
      const params = new URLSearchParams();
      params.set("language", language);
      params.set("country", registerPhoneCountry.country);
      params.set("timezone", detectedTimezone);
      params.set("currency", registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country));
      const authUrl = `${API_BASE_URL}/api/mobile/pro/auth/google/start?${params.toString()}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, "timviz-master://google-auth");
      if (result.type === "success" && result.url) {
        handleGoogleAuthCallbackUrl(result.url);
      }
    } catch (error) {
      Alert.alert("Google", error instanceof Error ? error.message : t.socialAuthFailed);
    } finally {
      setSocialBusy(null);
    }
  }

  async function signInWithApple() {
    if (!appleSignInAvailable) {
      Alert.alert("Apple", t.socialAuthConfigMissing);
      return;
    }
    setSocialBusy("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await authenticateWithSocialProvider("apple", credential.identityToken || "", {
        email: credential.email,
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
        fullName: [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" "),
      });
    } catch (error: any) {
      setSocialBusy(null);
      if (error?.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Apple", error instanceof Error ? error.message : t.socialAuthFailed);
    }
  }

  async function register() {
    const firstName = registerForm.firstName.trim();
    const companyName = registerForm.companyName.trim();
    const payload = {
      ...registerForm,
      email: registerForm.email.trim().toLowerCase(),
      firstName,
      lastName: registerForm.lastName.trim(),
      phone: composePhoneWithPrefix(registerPhoneCountry.callingCode, registerForm.phone),
      companyName,
      language,
      country: registerPhoneCountry.country,
      currency: registerPhoneCountry.currency || inferCurrency(registerPhoneCountry.country),
      timezone: detectedTimezone,
      platform: Platform.OS,
      signupSource: `mobile_${Platform.OS}`,
    };

    const validationMessage = getRegisterValidationMessage(payload);
    if (validationMessage) {
      Alert.alert(t.requiredTitle, validationMessage);
      return;
    }

    const captchaToken = await requestCaptchaToken();
    if (!captchaToken) {
      Alert.alert(t.registerError, t.captchaCanceled);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, captchaToken }),
      });
      const result = await response.json();
      if (!response.ok) {
        Alert.alert(t.registerError, result?.error || t.registerError);
        return;
      }
      const nextSession = normalizeApiSession(result, payload.email);
      await persistSession(nextSession, payload.language);
      void initiateFirebaseMobileRegistrationConversion({ email: payload.email, phone: payload.phone }).then(() =>
        trackMobileAdsEvent(
          "mobile_sign_up_complete",
          {
            method: "email",
            country: payload.country,
            currency: payload.currency
          },
          nextSession.token
        )
      );
    } catch (error) {
      Alert.alert(t.registerError, error instanceof Error ? error.message : t.registerError);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    pendingServiceSavesRef.current.clear();
    serviceCreatePromiseRef.current = null;
    pendingProfileLanguageRef.current = null;
    if (serviceSaveTimerRef.current) {
      clearTimeout(serviceSaveTimerRef.current);
      serviceSaveTimerRef.current = null;
    }
    appointmentDeleteFlushTimersRef.current.forEach((timer) => clearTimeout(timer));
    appointmentDeleteFlushTimersRef.current.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
    await SecureStore.deleteItemAsync(SECURE_SESSION_KEY).catch(() => undefined);
    await AsyncStorage.removeItem(WORKSPACE_CACHE_KEY);
    setPendingBiometricSession(null);
    setSession(null);
    setWorkspace(null);
    setCalendar(null);
    setCalendarDate(getTodayIso());
    setClients([]);
    setServiceCatalog([]);
    setStaffSnapshot(null);
    pendingServiceSavesRef.current.clear();
    pendingServiceDeletesRef.current.clear();
    pendingServicePatchesRef.current.clear();
    pendingAppointmentCreatesRef.current.clear();
    pendingAppointmentDeletesRef.current.clear();
    pendingAppointmentPatchesRef.current.clear();
    pendingClientCreatesRef.current.clear();
    setBusy(false);
  }

  function getNormalizedVisitItems() {
    return (Array.isArray(visitDraft.items) ? visitDraft.items : []).map((item) => ({
      ...item,
      serviceId: safeText(item.serviceId),
      serviceName:
        getServiceDisplayName(workspace?.services.find((service) => service.id === item.serviceId), language) ||
        getServiceDisplayName(Array.from(pendingServiceSavesRef.current.values()).find((pending) => pending.optimisticService.id === item.serviceId)?.optimisticService, language) ||
        safeText(item.serviceName).trim() ||
        t.withoutService,
      startTime: normalizeTimeInput(safeText(item.startTime)),
      endTime: normalizeTimeInput(safeText(item.endTime)),
      priceAmount: Number(item.priceAmount || 0),
      durationMinutes: Number(item.durationMinutes || 15),
    }));
  }

  function getVisitValidationMessage(items: VisitServiceDraft[]) {
    if (!items.length) return t.chooseService;
    const invalidItem = items.find((item) => !item.serviceName || !isValidTime(item.startTime) || !isValidTime(item.endTime) || timeToMinutes(item.endTime) <= timeToMinutes(item.startTime));
    if (!invalidItem) return "";
    if (!invalidItem.serviceName) return t.chooseService;
    if (!isValidTime(invalidItem.startTime)) return `${t.start}: ${invalidItem.startTime || "09:00"}`;
    if (!isValidTime(invalidItem.endTime)) return `${t.end}: ${invalidItem.endTime || "10:00"}`;
    return `${t.end}: ${invalidItem.endTime} ≤ ${invalidItem.startTime}`;
  }

  async function createVisit() {
    const draftHasSelectedService = (Array.isArray(visitDraft.items) ? visitDraft.items : []).some((item) => {
      const serviceName = safeText(item.serviceName).trim();
      return Boolean(item.serviceId || (serviceName && serviceName !== t.withoutService));
    });

    if (!workspace?.services.length && !pendingServiceSavesRef.current.size && !serviceCreatePromiseRef.current && !draftHasSelectedService) {
      Alert.alert(t.onboardingStartTitle, t.onboardingStartText, [
        { text: t.cancel, style: "cancel" },
        { text: t.chooseFromCatalog || t.addService, onPress: openServicesCatalog },
      ]);
      return false;
    }

    const items = getNormalizedVisitItems();
    const validationMessage = getVisitValidationMessage(items);
    if (validationMessage) {
      Alert.alert(t.requiredTitle, validationMessage);
      return false;
    }

    if (pendingServiceSavesRef.current.size) {
      await flushPendingServiceSaves();
    }

    const appointmentDate = visitDraft.appointmentDate || selectedDate;
    const hadAppointmentsBefore = (calendar?.appointments || []).filter((appointment) => appointment.kind !== "blocked").length > 0;
    const customerName = safeText(visitDraft.customerName).trim() || t.customer;
    const customerPhone = safeText(visitDraft.customerPhone).trim();
    const notes = safeText(visitDraft.notes).trim();
    const optimisticAppointments = items.map((item) =>
      makeOptimisticAppointment({
        appointmentDate,
        startTime: item.startTime,
        endTime: item.endTime,
        customerName,
        customerPhone,
        serviceName: item.serviceName,
        priceAmount: item.priceAmount,
        targetProfessionalId: visitDraft.targetProfessionalId,
      })
    );
    optimisticAppointments.forEach((appointment) => pendingAppointmentCreatesRef.current.set(appointment.id, appointment));
    mergeCalendarAppointments(appointmentDate, (appointments) =>
      [...appointments, ...optimisticAppointments].sort((left, right) => left.startTime.localeCompare(right.startTime))
    );
    setVisitDraft(createDefaultVisitDraft(appointmentDate, items[0]?.startTime || "09:00"));
    void trackMobileAdsEvent("mobile_appointment_created", {
      items_count: items.length,
      has_customer_phone: Boolean(customerPhone),
      has_service: items.some((item) => !isAppointmentWithoutServiceName(item.serviceName)),
      total_value: items.reduce((sum, item) => sum + Number(item.priceAmount || 0), 0),
      currency: workspace?.professional.currency || inferCurrency(workspace?.professional.country || registerPhoneCountry.country),
      source: "calendar",
    });
    if (!hadAppointmentsBefore) {
      Alert.alert("Timviz", t.firstAppointmentCreated);
    }
    scheduleServiceSaveFlush(120);
    void apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          targetProfessionalId: visitDraft.targetProfessionalId,
          items: items.map((item) => ({
            appointmentDate,
            startTime: item.startTime,
            endTime: item.endTime,
            customerName,
            customerNameFallback: t.customer,
            customerPhone,
            serviceName: item.serviceName,
            priceAmount: item.priceAmount,
            attendance: "confirmed",
            notes,
          })),
        }),
      })
      .then(async () => {
      optimisticAppointments.forEach((appointment) => pendingAppointmentCreatesRef.current.delete(appointment.id));
      await refreshCalendarOnly(session, appointmentDate);
      })
      .catch((error) => {
        optimisticAppointments.forEach((appointment) => pendingAppointmentCreatesRef.current.delete(appointment.id));
        Alert.alert(t.addVisit, error instanceof Error ? error.message : t.addVisit);
        revalidateWorkspace(appointmentDate);
      });
    return true;
  }

  async function saveEditedVisit() {
    if (!editingAppointment) return false;
    const items = getNormalizedVisitItems();
    const validationMessage = getVisitValidationMessage(items);
    if (validationMessage) {
      Alert.alert(t.requiredTitle, validationMessage);
      return false;
    }

    const primaryItem = items[0];
    const extraItems = items.slice(1);
    const appointmentDate = visitDraft.appointmentDate || editingAppointment.appointmentDate || selectedDate;
    const customerName = safeText(visitDraft.customerName).trim() || t.customer;
    const customerPhone = safeText(visitDraft.customerPhone).trim();
    const notes = safeText(visitDraft.notes).trim();
    const updatedAppointment: AppointmentRecord = {
      ...editingAppointment,
      professionalId: editingAppointment.professionalId || visitDraft.targetProfessionalId,
      appointmentDate,
      customerName,
      customerPhone,
      startTime: primaryItem.startTime,
      endTime: primaryItem.endTime,
      serviceName: primaryItem.serviceName,
      notes,
      priceAmount: primaryItem.priceAmount,
    };
    const optimisticExtraAppointments = extraItems.map((item) =>
      makeOptimisticAppointment({
        appointmentDate,
        startTime: item.startTime,
        endTime: item.endTime,
        customerName,
        customerPhone,
        serviceName: item.serviceName,
        priceAmount: item.priceAmount,
        targetProfessionalId: editingAppointment.professionalId || visitDraft.targetProfessionalId,
      })
    );
    pendingAppointmentPatchesRef.current.set(editingAppointment.id, updatedAppointment);
    optimisticExtraAppointments.forEach((appointment) => pendingAppointmentCreatesRef.current.set(appointment.id, appointment));
    mergeCalendarAppointments(appointmentDate, (appointments) =>
      [
        ...appointments.map((appointment) => (appointment.id === editingAppointment.id ? updatedAppointment : appointment)),
        ...optimisticExtraAppointments,
      ].sort((left, right) => left.startTime.localeCompare(right.startTime))
    );
    setEditingAppointment(null);
    void apiFetch("/api/mobile/pro/calendar", {
        method: "PATCH",
        body: JSON.stringify({
          mode: "meta",
          targetProfessionalId: editingAppointment.professionalId || visitDraft.targetProfessionalId,
          appointmentId: editingAppointment.id,
          customerName,
          customerNameFallback: t.customer,
          customerPhone,
          startTime: primaryItem.startTime,
          endTime: primaryItem.endTime,
          serviceName: primaryItem.serviceName,
          priceAmount: primaryItem.priceAmount,
          attendance: editingAppointment.attendance,
          notes,
          previousCustomerName: editingAppointment.customerName,
          previousCustomerPhone: editingAppointment.customerPhone,
          previousAppointmentTime: editingAppointment.startTime,
        }),
      })
      .then(() => {
        if (!extraItems.length) return null;
        return apiFetch("/api/mobile/pro/calendar", {
          method: "POST",
          body: JSON.stringify({
            targetProfessionalId: editingAppointment.professionalId || visitDraft.targetProfessionalId,
            items: extraItems.map((item) => ({
              appointmentDate,
              startTime: item.startTime,
              endTime: item.endTime,
              customerName,
              customerNameFallback: t.customer,
              customerPhone,
              serviceName: item.serviceName,
              priceAmount: item.priceAmount,
              attendance: editingAppointment.attendance,
              notes,
            })),
          }),
        });
      })
      .then(async () => {
        pendingAppointmentPatchesRef.current.delete(editingAppointment.id);
        optimisticExtraAppointments.forEach((appointment) => pendingAppointmentCreatesRef.current.delete(appointment.id));
        await refreshCalendarOnly(session, appointmentDate);
      })
      .catch((error) => {
        pendingAppointmentPatchesRef.current.delete(editingAppointment.id);
        optimisticExtraAppointments.forEach((appointment) => pendingAppointmentCreatesRef.current.delete(appointment.id));
        Alert.alert(t.editVisit, error instanceof Error ? error.message : t.editVisit);
        revalidateWorkspace(appointmentDate);
      });
    return true;
  }

  async function createClientFromVisit(input: { fullName: string; phone: string; email: string }) {
    const parts = input.fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length && !input.phone.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return null;
    }

    const optimisticClient: ClientRecord = {
      id: createLocalId("client"),
      fullName: input.fullName.trim() || input.phone.trim(),
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" "),
      phone: input.phone.trim(),
      email: input.email.trim(),
      visitsCount: 0,
      totalSales: 0,
    };
    pendingClientCreatesRef.current.set(optimisticClient.id, optimisticClient);
    setClients((current) => [optimisticClient, ...current]);
    void apiFetch("/api/mobile/pro/clients", {
        method: "POST",
        body: JSON.stringify({
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" "),
          phone: input.phone.trim(),
          email: input.email.trim(),
          notificationsTelegram: true,
          marketingTelegram: false,
        }),
      })
      .then(async () => {
        pendingClientCreatesRef.current.delete(optimisticClient.id);
        await refreshAll(session, selectedDate, { silent: true });
      })
      .catch((error) => {
        pendingClientCreatesRef.current.delete(optimisticClient.id);
        setClients((current) => current.filter((client) => client.id !== optimisticClient.id));
        Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
        revalidateWorkspace();
      });
    return optimisticClient;
  }

  function scheduleAppointmentDeleteFlush(
    appointment: AppointmentRecord,
    appointmentDate: string,
    target: string,
    attempt = 0
  ) {
    if (appointmentDeleteFlushTimersRef.current.has(appointment.id)) return;
    const delay = attempt === 0 ? 80 : Math.min(30000, 1200 * 2 ** Math.min(attempt, 5));
    const timer = setTimeout(() => {
      appointmentDeleteFlushTimersRef.current.delete(appointment.id);
      if (!pendingAppointmentDeletesRef.current.has(appointment.id)) return;
      void apiFetch(`/api/mobile/pro/calendar?appointmentId=${encodeURIComponent(appointment.id)}${target}`, { method: "DELETE" })
        .then(async () => {
          pendingAppointmentDeletesRef.current.delete(appointment.id);
          await refreshCalendarOnly(session, appointmentDate);
        })
        .catch(() => {
          if (pendingAppointmentDeletesRef.current.has(appointment.id)) {
            scheduleAppointmentDeleteFlush(appointment, appointmentDate, target, attempt + 1);
          }
        });
    }, delay);
    appointmentDeleteFlushTimersRef.current.set(appointment.id, timer);
  }

  async function deleteAppointment(appointment: AppointmentRecord) {
    Alert.alert(t.delete, appointment.serviceName || t.newVisit, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          const appointmentDate = appointment.appointmentDate || selectedDate;
          pendingAppointmentDeletesRef.current.add(appointment.id);
          pendingAppointmentCreatesRef.current.delete(appointment.id);
          pendingAppointmentPatchesRef.current.delete(appointment.id);
          mergeCalendarAppointments(appointmentDate, (appointments) => appointments.filter((item) => item.id !== appointment.id));
          const target = appointment.professionalId ? `&targetProfessionalId=${encodeURIComponent(appointment.professionalId)}` : "";
          scheduleAppointmentDeleteFlush(appointment, appointmentDate, target);
        },
      },
    ]);
  }

  async function updateAppointmentTime(appointment: AppointmentRecord, startTime: string, endTime: string) {
    const appointmentDate = appointment.appointmentDate || selectedDate;
    pendingAppointmentPatchesRef.current.set(appointment.id, { startTime, endTime });
    mergeCalendarAppointments(appointmentDate, (appointments) =>
      appointments
        .map((item) => (item.id === appointment.id ? { ...item, startTime, endTime } : item))
        .sort((left, right) => left.startTime.localeCompare(right.startTime))
    );
    void apiFetch("/api/mobile/pro/calendar", {
        method: "PATCH",
        body: JSON.stringify({
          targetProfessionalId: appointment.professionalId,
          appointmentId: appointment.id,
          startTime,
          endTime,
          previousAppointmentTime: appointment.startTime,
          previousAppointmentDate: appointment.appointmentDate,
        }),
      })
      .then(async () => {
        pendingAppointmentPatchesRef.current.delete(appointment.id);
        await refreshCalendarOnly(session, appointmentDate);
      })
      .catch((error) => {
        pendingAppointmentPatchesRef.current.delete(appointment.id);
        Alert.alert(t.editVisit, error instanceof Error ? error.message : t.editVisit);
        revalidateWorkspace(appointmentDate);
      });
    return true;
  }

  async function createBlockedTime(date: string, startTime: string, endTime: string, label: string, targetProfessionalId?: string) {
    const optimisticBlocked = makeOptimisticAppointment({
      appointmentDate: date,
      startTime,
      endTime,
      customerName: "",
      customerPhone: "",
      serviceName: label,
      priceAmount: 0,
      targetProfessionalId,
      kind: "blocked",
    });
    mergeCalendarAppointments(date, (appointments) =>
      [...appointments, optimisticBlocked].sort((left, right) => left.startTime.localeCompare(right.startTime))
    );
    pendingAppointmentCreatesRef.current.set(optimisticBlocked.id, optimisticBlocked);
    void apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          kind: "blocked",
          targetProfessionalId,
          appointmentDate: date,
          startTime,
          endTime,
          serviceName: label,
        }),
      })
      .then(async () => {
        pendingAppointmentCreatesRef.current.delete(optimisticBlocked.id);
        await refreshCalendarOnly(session, date);
      })
      .catch((error) => {
        pendingAppointmentCreatesRef.current.delete(optimisticBlocked.id);
        Alert.alert(label, error instanceof Error ? error.message : label);
        revalidateWorkspace(date);
      });
  }

  async function createService() {
    if (!serviceDraft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }
    const serviceName = serviceDraft.name.trim();
    const localizedName = SUPPORTED_APP_LANGUAGES.reduce<LocalizedText>(
      (acc, item) => ({ ...acc, [item]: serviceName }),
      {}
    );
    const optimisticService: ServiceRecord = {
      id: createLocalId("service"),
      name: serviceName,
      localizedName,
      category: serviceDraft.category.trim() || DEFAULT_SERVICE_CATEGORY,
      durationMinutes: Math.max(5, parseServiceNumberInput(serviceDraft.durationMinutes, 60)),
      price: Math.max(0, parseServiceNumberInput(serviceDraft.price, 0)),
      color: serviceDraft.color || SERVICE_COLORS[0],
      source: "custom",
    };
    optimisticService.category = getCanonicalServiceCategory(optimisticService.category);
    mergeWorkspaceServices((services) => [optimisticService, ...services]);
    setServiceDraft({ name: "", category: getCanonicalServiceCategory(serviceDraft.category), durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
    const key = makePendingServiceKey(optimisticService) || optimisticService.id;
    pendingServiceSavesRef.current.set(key, {
      key,
      keys: Array.from(getServiceIdentityKeys(optimisticService)),
      optimisticService,
      payload: {
        name: optimisticService.name,
        localizedName: optimisticService.localizedName,
        category: getCanonicalServiceCategory(optimisticService.category),
        durationMinutes: optimisticService.durationMinutes || 60,
        price: optimisticService.price || 0,
        color: optimisticService.color || SERVICE_COLORS[0],
        source: "custom",
      },
      attempts: 0,
    });
    scheduleServiceSaveFlush(120);
    void trackMobileAdsEvent("mobile_service_added", {
      source: "custom",
      category: optimisticService.category,
      duration_minutes: optimisticService.durationMinutes,
      price: optimisticService.price,
      currency: workspace?.professional.currency || inferCurrency(workspace?.professional.country || registerPhoneCountry.country),
    });
    return true;
  }

  async function flushServicePatch(serviceId: string, updatedService: ServiceRecord, options: { silent?: boolean; resolveRetry?: boolean } = {}) {
    if (!session) return false;
    if (isOptimisticServiceId(serviceId)) {
      pendingServicePatchesRef.current.set(serviceId, updatedService);
      updatePendingServiceSave(serviceId, updatedService);
      scheduleServiceSaveFlush(80);
      return true;
    }

    const payload = servicePatchPayload(updatedService);
    try {
      const result = await apiFetch("/api/mobile/pro/services", {
        method: "PATCH",
        body: JSON.stringify({
          serviceId,
          ...payload,
        }),
      });
      const savedService = result?.service as ServiceRecord | undefined;
      pendingServicePatchesRef.current.delete(serviceId);
      if (savedService?.id) {
        mergeWorkspaceServices((services) =>
          services.map((service) =>
            service.id === serviceId || service.id === savedService.id
              ? { ...service, ...savedService, ...updatedService, id: savedService.id }
              : service
          )
        );
      }
      return true;
    } catch (error) {
      const resolvedService = options.resolveRetry === false ? null : findSavedServiceForPatch(serviceId, updatedService);
      if (isServiceNotFoundError(error) && resolvedService && resolvedService.id !== serviceId) {
        const resolvedPatch = { ...resolvedService, ...updatedService, id: resolvedService.id };
        pendingServicePatchesRef.current.delete(serviceId);
        pendingServicePatchesRef.current.set(resolvedService.id, resolvedPatch);
        mergeWorkspaceServices((services) => services.map((service) => (service.id === resolvedService.id ? { ...service, ...resolvedPatch } : service)));
        return flushServicePatch(resolvedService.id, resolvedPatch, { ...options, resolveRetry: false });
      }
      if (!options.silent) {
        Alert.alert(t.editService, error instanceof Error ? error.message : t.editService);
      }
      return false;
    }
  }

  async function updateService(serviceId: string, draft: ServiceDraftState) {
    if (!draft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    const existingService = workspace?.services.find((service) => service.id === serviceId);
    const nextLocalizedName: LocalizedText = {
      ...(existingService?.localizedName || {}),
      [language]: draft.name.trim(),
    };
    if (!nextLocalizedName.ru && existingService?.name) {
      nextLocalizedName.ru = existingService.name;
    }

    const updatedService: ServiceRecord = {
      id: serviceId,
      name: language === "ru" ? draft.name.trim() : existingService?.name || draft.name.trim(),
      localizedName: nextLocalizedName,
      category: getCanonicalServiceCategory(draft.category),
      durationMinutes: Math.max(5, parseServiceNumberInput(draft.durationMinutes, 60)),
      price: Math.max(0, parseServiceNumberInput(draft.price, 0)),
      color: draft.color || SERVICE_COLORS[0],
    };
    pendingServicePatchesRef.current.set(serviceId, updatedService);
    mergeWorkspaceServices((services) => services.map((service) => (service.id === serviceId ? { ...service, ...updatedService } : service)));
    if (updatePendingServiceSave(serviceId, updatedService)) {
      scheduleServiceSaveFlush(80);
      return true;
    }
    if (isOptimisticServiceId(serviceId)) {
      const resolvedService = findSavedServiceForPatch(serviceId, updatedService);
      if (resolvedService) {
        const resolvedPatch = { ...resolvedService, ...updatedService, id: resolvedService.id };
        pendingServicePatchesRef.current.delete(serviceId);
        pendingServicePatchesRef.current.set(resolvedService.id, resolvedPatch);
        mergeWorkspaceServices((services) => services.map((service) => (service.id === resolvedService.id ? { ...service, ...resolvedPatch } : service)));
        void flushServicePatch(resolvedService.id, resolvedPatch, { silent: true }).then((saved) => {
          if (!saved) revalidateWorkspace();
        });
        return true;
      }
      scheduleServiceSaveFlush(80);
      return true;
    }
    void flushServicePatch(serviceId, updatedService, { silent: true }).then((saved) => {
      if (!saved) revalidateWorkspace();
    });
    return true;
  }

  async function addCatalogService(service: ServiceTemplateRecord & { category: string }) {
    const key = makePendingServiceKey(service);
    if (!key) return;
    if (hasServiceOrPendingSave(service, key)) return;
    const optimisticService: ServiceRecord = {
      id: createLocalId("service"),
      name: service.name,
      localizedName: service.localizedName,
      category: getCanonicalServiceCategory(service.category),
      durationMinutes: Number(service.durationMinutes || 60),
      price: Number(service.price || 0),
      color: SERVICE_COLORS[((workspace?.services.length || 0) + pendingServiceSavesRef.current.size) % SERVICE_COLORS.length],
      source: "catalog",
    };
    const pendingSave: PendingServiceSave = {
      key,
      keys: Array.from(getServiceIdentityKeys(optimisticService)),
      optimisticService,
      payload: {
        name: optimisticService.name,
        localizedName: optimisticService.localizedName,
        category: getCanonicalServiceCategory(optimisticService.category),
        durationMinutes: optimisticService.durationMinutes || 60,
        price: optimisticService.price,
        color: optimisticService.color || SERVICE_COLORS[0],
        source: "catalog",
      },
      attempts: 0,
    };
    pendingServiceSavesRef.current.set(key, pendingSave);
    mergeWorkspaceServices((services) => (services.some((item) => serviceMatchesPending(item, pendingSave)) ? services : [optimisticService, ...services]));
    scheduleServiceSaveFlush();
    void trackMobileAdsEvent("mobile_service_added", {
      source: "catalog",
      category: optimisticService.category,
      duration_minutes: optimisticService.durationMinutes,
      price: optimisticService.price,
      currency: workspace?.professional.currency || inferCurrency(workspace?.professional.country || registerPhoneCountry.country),
    });
  }

  async function saveStaffSchedule(
    member: StaffMemberRecord,
    workSchedule: WorkScheduleRecord,
    customSchedule: Record<string, WorkDayScheduleRecord> = member.membership.customSchedule || {},
    workScheduleMode: "fixed" | "flexible" = member.membership.workScheduleMode || "fixed",
    options: { silent?: boolean } = {}
  ) {
    if (!options.silent) setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/staff", {
        method: "POST",
        body: JSON.stringify({
          action: "saveSchedule",
          targetProfessionalId: member.professional.id,
          workScheduleMode,
          workSchedule,
          customSchedule,
        }),
      });
      await refreshAll(session, selectedDate, { silent: options.silent === true });
      return true;
    } catch (error) {
      if (!options.silent) {
        Alert.alert(t.staffSchedule, error instanceof Error ? error.message : t.staffSchedule);
      }
      return false;
    } finally {
      if (!options.silent) setBusy(false);
    }
  }

  async function removeService(serviceId: string) {
    const serviceToDelete = workspace?.services.find((service) => service.id === serviceId);
    if (serviceToDelete) {
      const pendingKey = makePendingServiceKey(serviceToDelete);
      if (pendingKey) pendingServiceSavesRef.current.delete(pendingKey);
    }
    pendingServiceDeletesRef.current.add(serviceId);
    mergeWorkspaceServices((services) => services.filter((service) => service.id !== serviceId));

    if (serviceId.startsWith("service-")) {
      return;
    }

    void apiFetch(`/api/mobile/pro/services?serviceId=${encodeURIComponent(serviceId)}`, { method: "DELETE" })
      .then(() => refreshAll(session, selectedDate, { silent: true }))
      .catch((error) => {
        pendingServiceDeletesRef.current.delete(serviceId);
        Alert.alert(t.delete, error instanceof Error ? error.message : t.delete);
        revalidateWorkspace();
      });
  }

  async function createClient() {
    if (!clientDraft.firstName.trim() && !clientDraft.phone.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    const optimisticClient: ClientRecord = {
      id: createLocalId("client"),
      fullName: [clientDraft.firstName.trim(), clientDraft.lastName.trim()].filter(Boolean).join(" ") || clientDraft.phone.trim(),
      firstName: clientDraft.firstName.trim(),
      lastName: clientDraft.lastName.trim(),
      phone: clientDraft.phone.trim(),
      email: clientDraft.email.trim(),
      visitsCount: 0,
      totalSales: 0,
    };
    pendingClientCreatesRef.current.set(optimisticClient.id, optimisticClient);
    setClients((current) => [optimisticClient, ...current]);
    setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
    void apiFetch("/api/mobile/pro/clients", {
        method: "POST",
        body: JSON.stringify({
          firstName: optimisticClient.firstName,
          lastName: optimisticClient.lastName,
          phone: optimisticClient.phone,
          email: optimisticClient.email,
          notificationsTelegram: true,
          marketingTelegram: false,
        }),
      })
      .then(async () => {
        pendingClientCreatesRef.current.delete(optimisticClient.id);
        await refreshAll(session, selectedDate, { silent: true });
      })
      .catch((error) => {
        pendingClientCreatesRef.current.delete(optimisticClient.id);
        setClients((current) => current.filter((client) => client.id !== optimisticClient.id));
        Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
        revalidateWorkspace();
      });
  }

  async function updateClient() {
    if (!clientDraft.clientId) return;
    if (!clientDraft.firstName.trim() && !clientDraft.phone.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    const previousClients = clients;
    const updatedClient: ClientRecord = {
      id: clientDraft.clientId,
      fullName: [clientDraft.firstName.trim(), clientDraft.lastName.trim()].filter(Boolean).join(" ") || clientDraft.phone.trim(),
      firstName: clientDraft.firstName.trim(),
      lastName: clientDraft.lastName.trim(),
      phone: clientDraft.phone.trim(),
      email: clientDraft.email.trim(),
      visitsCount: clients.find((client) => client.id === clientDraft.clientId)?.visitsCount || 0,
      totalSales: clients.find((client) => client.id === clientDraft.clientId)?.totalSales || 0,
    };
    setClients((current) => current.map((client) => (client.id === updatedClient.id ? { ...client, ...updatedClient } : client)));
    setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
    const isDerivedClient = updatedClient.id.startsWith("derived_");
    void apiFetch("/api/mobile/pro/clients", {
        method: isDerivedClient ? "POST" : "PATCH",
        body: JSON.stringify({
          clientId: isDerivedClient ? undefined : updatedClient.id,
          firstName: updatedClient.firstName,
          lastName: updatedClient.lastName,
          phone: updatedClient.phone,
          email: updatedClient.email,
          notificationsTelegram: true,
          marketingTelegram: false,
        }),
      })
      .then(async () => {
        await refreshAll(session, selectedDate, { silent: true });
      })
      .catch((error) => {
        setClients(previousClients);
        Alert.alert(t.editClient || t.addClient, error instanceof Error ? error.message : t.editClient || t.addClient);
        revalidateWorkspace();
      });
  }

  async function deleteClient(client: ClientRecord) {
    if (client.id.startsWith("derived_")) {
      Alert.alert(t.deleteClient || t.delete, t.clientFromAppointmentsCannotDelete || t.delete);
      return;
    }

    Alert.alert(t.deleteClient || t.delete, t.deleteClientConfirm || client.fullName || client.phone, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: () => {
          const previousClients = clients;
          setClients((current) => current.filter((item) => item.id !== client.id));
          void apiFetch(`/api/mobile/pro/clients?clientId=${encodeURIComponent(client.id)}`, { method: "DELETE" })
            .then(async () => {
              await refreshAll(session, selectedDate, { silent: true });
            })
            .catch((error) => {
              setClients(previousClients);
              Alert.alert(t.deleteClient || t.delete, error instanceof Error ? error.message : t.delete);
              revalidateWorkspace();
            });
        },
      },
    ]);
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
          language={language}
          setLanguage={setWorkspaceLanguage}
          session={session}
          workspace={workspace}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiFetch={apiFetch}
          onRefreshWorkspace={() => refreshAll()}
          onPatchBusiness={patchWorkspaceBusiness}
          onOpenNotification={(item) => {
            setActiveTab("calendar");
            setSelectedDate(item.appointmentDate);
          }}
          onOpenSettingsSection={openSettingsSection}
          onSignOut={signOut}
          trackAdsEvent={trackMobileAdsEvent}
        />

        {activeTab === "calendar" ? (
          <CalendarTab
            t={t}
            language={language}
            sessionDisplayName={session.displayName}
            workspace={workspace}
            staff={staffSnapshot}
            calendar={calendar}
            calendarDate={calendarDate}
            clients={clients}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            visitDraft={visitDraft}
            setVisitDraft={setVisitDraft}
            onCreateVisit={createVisit}
            onUpdateVisit={saveEditedVisit}
            onCreateClientFromVisit={createClientFromVisit}
            editingAppointment={editingAppointment}
            setEditingAppointment={setEditingAppointment}
            timeAction={timeAction}
            setTimeAction={setTimeAction}
            onDeleteAppointment={deleteAppointment}
            onMoveAppointment={(appointment) => updateAppointmentTime(appointment, addMinutes(appointment.startTime, 10), addMinutes(appointment.endTime, 10))}
            onResizeAppointment={(appointment) => updateAppointmentTime(appointment, appointment.startTime, addMinutes(appointment.endTime, 10))}
            onUpdateBlockedTime={updateAppointmentTime}
            onCreateBlockedTime={createBlockedTime}
            onOpenServices={openServicesCatalog}
            onOpenSchedule={() => openSettingsSection("schedule")}
            busy={busy}
            refreshing={refreshing}
            onRefresh={() => refreshAll()}
            composerOpen={visitComposerOpen}
            setComposerOpen={setVisitComposerOpen}
            loadCalendarDays={loadCalendarDays}
          />
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.workspaceKeyboard}>
          <ScrollView
            style={styles.workspaceScroll}
            contentContainerStyle={[styles.workspaceContent, keyboardVisible && styles.workspaceContentKeyboardOpen]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refreshAll()} tintColor="#7C3AED" />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {activeTab === "services" ? (
              <ServicesTab
                t={t}
                language={language}
                workspace={workspace}
                catalog={serviceCatalog}
                draft={serviceDraft}
                setDraft={setServiceDraft}
                onCreate={createService}
                onUpdate={updateService}
                onAddCatalog={addCatalogService}
                onDelete={removeService}
                busy={busy}
                modeRequest={servicesModeRequest}
                onModeRequestHandled={handleServicesModeRequestHandled}
              />
            ) : null}
            {activeTab === "clients" ? (
              <ClientsTab
                t={t}
                clients={clients}
                draft={clientDraft}
                setDraft={setClientDraft}
                onCreate={createClient}
                onUpdate={updateClient}
                onDelete={deleteClient}
                onCreateVisit={() => {
                  if (!workspace?.services.length) {
                    openServicesCatalog();
                    return;
                  }
                  const startTime = getRoundedTime(10);
                  const firstService = workspace.services[0];
                  setActiveTab("calendar");
                  setVisitDraft({
                    ...createDefaultVisitDraft(selectedDate, startTime),
                    serviceId: firstService.id,
                    items: [createVisitServiceDraft(startTime, firstService, language)],
                  });
                  setVisitComposerOpen(true);
                }}
                busy={busy}
              />
            ) : null}
            {activeTab === "staff" ? (
              <StaffWorkspaceTab
                t={t}
                language={language}
                staff={staffSnapshot}
                workspace={workspace}
                busy={busy}
                apiFetch={apiFetch}
                onRefreshWorkspace={() => refreshAll(session, selectedDate)}
                onSaveSchedule={saveStaffSchedule}
              />
            ) : null}
            {activeTab === "settings" ? (
              <SettingsTab
                t={t}
                language={language}
                setLanguage={setWorkspaceLanguage}
                workspace={workspace}
                staff={staffSnapshot}
                catalog={serviceCatalog}
                apiFetch={apiFetch}
                trackAdsEvent={trackMobileAdsEvent}
                onRefreshWorkspace={() => refreshAll(session, selectedDate)}
                onWorkspaceUpdated={(nextWorkspace) => setWorkspace(withPendingServiceSaves(nextWorkspace))}
                setActiveTab={setActiveTab}
                  activeSection={settingsSection}
                  setActiveSection={setSettingsSection}
                  onSignOut={signOut}
                  biometricAvailable={biometricAvailable}
                  biometricEnabled={biometricEnabled}
                  onToggleBiometric={toggleBiometricUnlock}
                  busy={busy}
                  onRequestPremium={() => openSettingsSection("general")}
                />
            ) : null}
          </ScrollView>
          </KeyboardAvoidingView>
        )}
        {!keyboardVisible ? <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} lockedTabs={hasPremium ? [] : PREMIUM_LOCKED_TABS} t={t} /> : null}
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? Math.max(Constants.statusBarHeight || 0, 24) : 0}
        style={styles.keyboard}
      >
        <ScrollView
          ref={authScrollRef}
          contentContainerStyle={[
            styles.authContent,
            mode === "register" && styles.authContentWithStickyFooter,
            keyboardVisible && styles.authContentKeyboardOpen,
          ]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
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
                <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>{t.registerShort || t.register}</Text>
                </Pressable>
              </View>

              {pendingBiometricSession ? (
                <Pressable style={styles.biometricUnlockCard} onPress={unlockPendingSessionWithBiometrics}>
                  <View style={styles.biometricUnlockIcon}>
                    <Ionicons name="scan-outline" size={20} color="#6D4AFF" />
                  </View>
                  <View style={styles.biometricUnlockText}>
                    <Text style={styles.socialButtonText}>{t.unlockWithBiometrics}</Text>
                    <Text style={styles.socialButtonCaption}>{pendingBiometricSession.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>
              ) : null}

              <SocialAuthButtons
                t={t}
                googleEnabled={Boolean(nativeGoogleConfigured)}
                appleEnabled={appleSignInAvailable}
                busyProvider={socialBusy}
                disabled={busy}
                onGoogle={signInWithGoogle}
                onGoogleToken={(idToken) => authenticateWithSocialProvider("google", idToken)}
                onApple={signInWithApple}
              />

              {mode === "login" ? (
              <View style={styles.form}>
                <Pressable style={styles.authInlineCta} onPress={() => setMode("register")}>
                  <Text style={styles.authInlineCtaText}>{t.newMasterCta}</Text>
                </Pressable>
                <Field
                  label={t.email}
                  value={loginForm.email}
                  onChangeText={(value) => setLoginForm((current) => ({ ...current, email: value }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@email.com"
                  returnKeyType="next"
                  onFocus={() => scrollAuthFieldIntoView(330)}
                />
                <Field
                  label={t.password}
                  value={loginForm.password}
                  onChangeText={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={signIn}
                  onFocus={() => scrollAuthFieldIntoView(430)}
                />
                <Pressable style={styles.forgotPasswordLink} onPress={openForgotPassword}>
                  <Text style={styles.forgotPasswordLinkText}>{t.forgotPassword}</Text>
                </Pressable>
                <PrimaryButton label={busy ? t.signingIn : t.login} onPress={signIn} disabled={busy} />
              </View>
            ) : (
              <View style={styles.form}>
                <Field label={t.firstName} value={registerForm.firstName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, firstName: value }))} returnKeyType="next" onFocus={() => scrollAuthFieldIntoView(300)} />
                <Field label={t.email} value={registerForm.email} onChangeText={(value) => setRegisterForm((current) => ({ ...current, email: value }))} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" returnKeyType="next" onFocus={() => scrollAuthFieldIntoView(360)} />
                <Field label={t.companyName} value={registerForm.companyName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, companyName: value }))} returnKeyType="next" onFocus={() => scrollAuthFieldIntoView(430)} />
                <RegisterPhoneField
                  label={t.phone}
                  selectedCountry={registerPhoneCountry}
                  language={language}
                  t={t}
                  value={getLocalPhoneNumber(registerForm.phone, registerPhoneCountry.callingCode)}
                  onChangeText={(value) => setRegisterForm((current) => ({ ...current, phone: getLocalPhoneNumber(value, registerPhoneCountry.callingCode) }))}
                  onOpenPicker={() => setPhoneCountryPickerOpen(true)}
                  onFocus={() => scrollAuthFieldIntoView(500)}
                />
                <Field label={t.password} hint={t.passwordHint} value={registerForm.password} onChangeText={(value) => setRegisterForm((current) => ({ ...current, password: value }))} secureTextEntry returnKeyType="done" onSubmitEditing={register} onFocus={() => scrollAuthFieldIntoView(590)} />
                <Pressable style={styles.authDetailsToggle} onPress={() => setRegisterDetailsOpen((current) => !current)}>
                  <Text style={styles.authDetailsToggleText}>{t.optionalDetails}</Text>
                  <Ionicons name={registerDetailsOpen ? "chevron-up" : "chevron-down"} size={18} color="#6D4AFF" />
                </Pressable>
                {registerDetailsOpen ? (
                  <View style={styles.authOptionalBlock}>
                    <Field label={t.lastName} value={registerForm.lastName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, lastName: value }))} returnKeyType="done" onFocus={() => scrollAuthFieldIntoView(690)} />
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
        {mode === "register" ? (
          <View style={styles.authStickyFooter}>
            <PrimaryButton label={busy ? t.creating : t.registerMasterCta || t.register} onPress={register} disabled={busy} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
      <Modal visible={captchaVisible} transparent animationType="slide" onRequestClose={() => closeCaptcha("")}>
        <View style={styles.modalBackdrop}>
          <View style={styles.captchaSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.captchaTitleWrap}>
                <Text style={styles.sheetTitle}>{t.captchaTitle}</Text>
                <Text style={styles.captchaSubtitle}>{t.captchaText}</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => closeCaptcha("")}>
                <Ionicons name="close" size={22} color="#334155" />
              </Pressable>
            </View>
            {captchaUrl ? (
              <WebView
                source={{ uri: captchaUrl }}
                originWhitelist={["https://*", "http://*"]}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                onMessage={(event) => handleCaptchaMessage(event.nativeEvent.data)}
                onError={() => {
                  Alert.alert(t.registerError, t.captchaFailed);
                  closeCaptcha("");
                }}
                style={styles.captchaWebView}
              />
            ) : (
              <View style={styles.captchaLoading}>
                <ActivityIndicator color={DESIGN.colors.primary} />
              </View>
            )}
            <Text style={styles.captchaBrowserHint}>{t.captchaBrowserHint}</Text>
            <Pressable style={styles.captchaBrowserButton} onPress={() => void openCaptchaInBrowser()}>
              <Ionicons name="open-outline" size={18} color={DESIGN.colors.primaryDark} />
              <Text style={styles.captchaBrowserButtonText}>{t.captchaOpenBrowser}</Text>
            </Pressable>
            <Pressable style={styles.captchaCancelButton} onPress={() => closeCaptcha("")}>
              <Text style={styles.captchaCancelText}>{t.captchaCancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal transparent visible={forgotPasswordVisible} animationType="slide" onRequestClose={() => setForgotPasswordVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={styles.forgotPasswordSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.captchaTitleWrap}>
                <Text style={styles.sheetTitle}>{t.forgotPasswordTitle}</Text>
                <Text style={styles.captchaSubtitle}>{t.forgotPasswordText}</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => setForgotPasswordVisible(false)}>
                <Ionicons name="close" size={22} color="#334155" />
              </Pressable>
            </View>
            <View style={styles.forgotPasswordField}>
              <Text style={styles.label}>{t.email}</Text>
              <TextInput
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                placeholder="you@email.com"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.forgotPasswordInput]}
              />
            </View>
            <PrimaryButton
              label={forgotPasswordBusy ? t.forgotPasswordSending : t.forgotPasswordSubmit}
              onPress={() => void sendForgotPasswordEmail()}
              disabled={forgotPasswordBusy}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <PhoneCountryPickerModal
        visible={phoneCountryPickerOpen}
        language={language}
        t={t}
        query={phoneCountryQuery}
        setQuery={setPhoneCountryQuery}
        customPrefix={customPhonePrefix}
        setCustomPrefix={setCustomPhonePrefix}
        selectedCountry={registerPhoneCountry}
        onSelect={selectRegisterPhoneCountry}
        onSelectCustom={selectCustomPhonePrefix}
        onClose={closePhoneCountryPicker}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function CalendarTab({
  t,
  language,
  sessionDisplayName,
  workspace,
  staff,
  calendar,
  calendarDate,
  clients,
  selectedDate,
  setSelectedDate,
  visitDraft,
  setVisitDraft,
  onCreateVisit,
  onUpdateVisit,
  onCreateClientFromVisit,
  editingAppointment,
  setEditingAppointment,
  timeAction,
  setTimeAction,
  onDeleteAppointment,
  onMoveAppointment,
  onResizeAppointment,
  onUpdateBlockedTime,
  onCreateBlockedTime,
  onOpenServices,
  onOpenSchedule,
  busy,
  refreshing,
  onRefresh,
  composerOpen,
  setComposerOpen,
  loadCalendarDays,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  sessionDisplayName?: string;
  workspace: WorkspaceSnapshot | null;
  staff: StaffSnapshot | null;
  calendar: CalendarSnapshot | null;
  calendarDate: string;
  clients: ClientRecord[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  visitDraft: VisitDraft;
  setVisitDraft: Dispatch<SetStateAction<VisitDraft>>;
  onCreateVisit: () => Promise<boolean>;
  onUpdateVisit: () => Promise<boolean>;
  onCreateClientFromVisit: (input: { fullName: string; phone: string; email: string }) => Promise<ClientRecord | null>;
  editingAppointment: AppointmentRecord | null;
  setEditingAppointment: (appointment: AppointmentRecord | null) => void;
  timeAction: { date: string; time: string; targetProfessionalId?: string } | null;
  setTimeAction: (action: { date: string; time: string; targetProfessionalId?: string } | null) => void;
  onDeleteAppointment: (appointment: AppointmentRecord) => void;
  onMoveAppointment: (appointment: AppointmentRecord) => void;
  onResizeAppointment: (appointment: AppointmentRecord) => void;
  onUpdateBlockedTime: (appointment: AppointmentRecord, startTime: string, endTime: string) => Promise<boolean>;
  onCreateBlockedTime: (date: string, startTime: string, endTime: string, label: string, targetProfessionalId?: string) => Promise<void>;
  onOpenServices: () => void;
  onOpenSchedule: () => void;
  busy: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  loadCalendarDays: (dates: string[]) => Promise<Record<string, CalendarSnapshot>>;
}) {
  const currency = workspace?.professional.currency;
  const services = workspace?.services || [];
  const hasServices = services.length > 0;
  const { width: screenWidth } = useWindowDimensions();
  const [isCompact, setIsCompact] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [blockedTimeDraft, setBlockedTimeDraft] = useState<BlockedTimeDraft | null>(null);
  const [visitPickerMode, setVisitPickerMode] = useState<"client" | "service" | null>(null);
  const [noServicesHelper, setNoServicesHelper] = useState<{ date: string; time: string; targetProfessionalId?: string; source: "time" | "visit" } | null>(null);
  const [noServicesIntroDismissed, setNoServicesIntroDismissed] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState(0);
  const [serviceQuery, setServiceQuery] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientCreateOpen, setClientCreateOpen] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState({ firstName: "", lastName: "", phone: "" });
  const visibleDates = useMemo(() => getCalendarModeDates(viewMode, selectedDate), [selectedDate, viewMode]);
  const visibleDatesKey = visibleDates.join("|");
  const preloadDates = useMemo(
    () => (viewMode === "day" ? [shiftDate(selectedDate, -1), selectedDate, shiftDate(selectedDate, 1)] : visibleDates),
    [selectedDate, viewMode, visibleDatesKey]
  );
  const preloadDatesKey = preloadDates.join("|");
  const warmDates = useMemo(() => getCalendarWarmDates(viewMode, selectedDate), [selectedDate, viewMode]);
  const warmDatesKey = warmDates.join("|");
  const [rangeSnapshots, setRangeSnapshots] = useState<Record<string, CalendarSnapshot>>({});
  const rangeSnapshotsRef = useRef<Record<string, CalendarSnapshot>>({});
  const rangeSnapshotTimesRef = useRef<Record<string, number>>({});
  const loadingDatesRef = useRef<Set<string>>(new Set());
  const calendarMembers = useMemo<CalendarMemberView[]>(() => {
    const map = new Map<string, CalendarMemberView>();
    const masterFallback = getMasterFallback(language);
    const addMember = (member: CalendarMemberView) => {
      if (!member.id) return;
      const viewerProfileName = workspace?.professional.id === member.id
        ? getCalendarMemberDisplayName(workspace.professional, "")
        : "";
      const displayName = viewerProfileName || safeText(sessionDisplayName).trim();
      const name = member.isViewer && displayName && (isGenericCalendarMemberName(member.name, member.role) || member.name.includes("@"))
        ? displayName
        : member.name;
      map.set(
        member.id,
        mergeCalendarMemberView(
          map.get(member.id),
          { ...member, name, avatarUrl: resolveCalendarMemberAvatarUrl(member, workspace) },
          masterFallback
        )
      );
    };
    for (const member of makeStaffMembers(staff, workspace, t)) {
      addMember({
        id: member.professional.id,
        name: makeStaffMemberName(member, masterFallback),
        avatarUrl: member.professional.avatarUrl,
        role: member.membership.role || t.employee,
        scope: member.membership.scope,
        isViewer: member.professional.id === workspace?.professional.id,
        memberSchedule: {
          workScheduleMode: member.membership.workScheduleMode,
          workSchedule: member.membership.workSchedule,
          customSchedule: member.membership.customSchedule,
        },
      });
    }
    for (const member of calendar?.teamMembers || []) {
      addMember({
        id: member.id,
        name: getCalendarMemberDisplayName(member, masterFallback),
        avatarUrl: member.avatarUrl,
        role: member.role || t.employee,
        scope: member.scope,
        isViewer: member.isViewer,
      });
    }
    for (const member of calendar?.memberCalendars || []) {
      addMember({
        id: member.professionalId,
        name: getCalendarMemberDisplayName(member, masterFallback),
        avatarUrl: member.avatarUrl,
        role: member.role || t.employee,
        scope: member.scope,
        isViewer: member.isViewer,
        memberSchedule: member.memberSchedule,
      });
    }
    if (workspace?.professional.id && !map.has(workspace.professional.id)) {
      addMember({
        id: workspace.professional.id,
        name: getCalendarMemberDisplayName(workspace.professional, masterFallback),
        avatarUrl: workspace.professional.avatarUrl,
        role: workspace.membership?.role || t.owner,
        scope: workspace.membership?.scope === "member" ? "member" : "owner",
        isViewer: true,
        memberSchedule: workspace.memberSchedule,
      });
    }
    return Array.from(map.values());
  }, [calendar?.memberCalendars, calendar?.teamMembers, language, sessionDisplayName, staff, t, workspace]);
  const selectedMembers = calendarMembers.filter((member) => selectedMemberIds.includes(member.id));
  const primaryMember = selectedMembers[0] || calendarMembers[0] || null;
  const visibleCalendarMembers = selectedMembers.length ? selectedMembers : calendarMembers.slice(0, 1);
  const availableCalendarWidth = Math.max(0, screenWidth - CALENDAR_TIME_AXIS_WIDTH);
  const dayMemberColumnWidth = Math.floor(
    visibleCalendarMembers.length > 1
      ? Math.max(CALENDAR_MIN_MEMBER_COLUMN_WIDTH, availableCalendarWidth / visibleCalendarMembers.length)
      : Math.max(280, availableCalendarWidth)
  );
  const selectedSchedule = getMemberScheduleForDate(primaryMember, workspace, selectedDate);
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>();
    for (const [date, snapshot] of Object.entries(rangeSnapshots)) {
      map.set(date, snapshot.appointments || []);
    }
    if (calendar) {
      map.set(calendarDate, calendar.appointments || []);
    }
    return map;
  }, [calendar?.appointments, calendarDate, rangeSnapshots]);
  const viewOptions: Array<{ value: CalendarViewMode; label: string }> = [
    { value: "day", label: t.dayView },
    { value: "threeDays", label: t.threeDays },
    { value: "week", label: t.weekView },
    { value: "month", label: t.monthView },
  ];
  const activeViewLabel = viewOptions.find((item) => item.value === viewMode)?.label || t.dayView;
  const titleText = formatCalendarTitle(viewMode, selectedDate, language);
  const selectedClient = visitDraft.selectedClientId ? clients.find((client) => client.id === visitDraft.selectedClientId) || null : null;
  const draftVisitItems = Array.isArray(visitDraft.items) && visitDraft.items.length ? visitDraft.items : [createVisitServiceDraft(visitDraft.startTime || "09:00")];
  const visitTotal = draftVisitItems.reduce((sum, item) => sum + Number(item.priceAmount || 0), 0);
  const filteredServices = useMemo(() => {
    const query = serviceQuery.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) => getServiceSearchText(service).includes(query));
  }, [serviceQuery, services]);
  const filteredClients = clients.filter((client) => {
    const query = clientQuery.trim().toLowerCase();
    if (!query) return true;
    return `${client.fullName || ""} ${client.phone || ""} ${client.email || ""}`.toLowerCase().includes(query);
  });
  const hasClientSearch = clientQuery.trim().length > 0;
  const showCreateFromSearch = hasClientSearch && filteredClients.length === 0 && !clientCreateOpen;
  const filteredMembers = calendarMembers.filter((member) => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) return true;
    return `${member.name} ${member.role}`.toLowerCase().includes(query);
  });
  const visibleDayAppointmentCount = visibleCalendarMembers.reduce(
    (sum, member) => sum + getAppointmentsForMember(selectedDate, member.id).filter((appointment) => appointment.kind !== "blocked").length,
    0
  );
  const isSelectedDateToday = selectedDate === getTodayIso();
  const emptyCalendarTitle = hasServices
    ? (isSelectedDateToday ? t.noBookingsTodaySpark || t.noBookingsToday : t.noBookingsThisDay || t.emptyCalendarTitle)
    : t.firstServiceTitle;
  const emptyCalendarText = hasServices ? t.fillFreeWindowsText || t.emptyCalendarText : t.calendarNoServicesText || t.firstRunCalendarText;
  const emptyCalendarPrimaryLabel = hasServices ? t.createAppointmentButton || t.addFirstVisit : t.chooseFromCatalog || t.addService;
  const emptyCalendarSecondaryLabel = "";
  const emptyCalendarTop = (() => {
    const workStart = selectedSchedule.enabled ? timeToMinutes(selectedSchedule.startTime) : 9 * 60;
    const workHourHeight = isCompact ? 72 : 88;
    const offHourHeight = isCompact ? workHourHeight / 10 : workHourHeight;
    const compressedStartTop = selectedSchedule.enabled && isCompact ? Math.min(workStart, 9 * 60) / 60 * offHourHeight : Math.min(workStart / 60 * offHourHeight, 92);
    return 58 + Math.max(52, Math.min(112, compressedStartTop + 10));
  })();

  function openEmptyCalendarPrimaryAction() {
    if (!hasServices) {
      onOpenServices();
      return;
    }
    openComposerAt("", selectedDate, primaryMember?.id);
  }

  function openEmptyCalendarSecondaryAction() {
    setNoServicesHelper({ date: selectedDate, time: getDefaultVisitStartTime(selectedDate, primaryMember?.id), targetProfessionalId: primaryMember?.id, source: "time" });
  }

  const mergeRangeSnapshots = useCallback((snapshots: Record<string, CalendarSnapshot>) => {
    const entries = Object.entries(snapshots);
    if (!entries.length) return;
    const loadedAt = Date.now();
    for (const [date] of entries) {
      rangeSnapshotTimesRef.current[date] = loadedAt;
    }
    setRangeSnapshots((current) => {
      const next = { ...current, ...snapshots };
      rangeSnapshotsRef.current = next;
      return next;
    });
  }, []);

  const loadCalendarSnapshotDates = useCallback(
    async (dates: string[], options: { force?: boolean } = {}) => {
      const now = Date.now();
      const targetDates = uniqueDates(dates).filter((date) => {
        if (loadingDatesRef.current.has(date)) return false;
        if (options.force) return true;
        const loadedAt = rangeSnapshotTimesRef.current[date] || 0;
        return !rangeSnapshotsRef.current[date] || now - loadedAt > CALENDAR_MEMORY_TTL_MS;
      });

      if (!targetDates.length) return;

      targetDates.forEach((date) => loadingDatesRef.current.add(date));
      try {
        for (const chunk of chunkDates(targetDates)) {
          const snapshots = await loadCalendarDays(chunk);
          mergeRangeSnapshots(snapshots);
        }
      } finally {
        targetDates.forEach((date) => loadingDatesRef.current.delete(date));
      }
    },
    [loadCalendarDays, mergeRangeSnapshots]
  );

  useEffect(() => {
    if (!calendarMembers.length) return;
    const validIds = new Set(calendarMembers.map((member) => member.id));
    setSelectedMemberIds((current) => {
      const kept = current.filter((id) => validIds.has(id));
      if (kept.length) return kept;
      const preferred = calendar?.viewedProfessionalId || workspace?.professional.id || calendarMembers[0].id;
      return preferred && validIds.has(preferred) ? [preferred] : [calendarMembers[0].id];
    });
  }, [calendar?.viewedProfessionalId, calendarMembers, workspace?.professional.id]);

  useEffect(() => {
    if (!calendar) return;
    mergeRangeSnapshots({ [calendarDate]: calendar });
  }, [calendar, calendarDate, mergeRangeSnapshots]);

  useEffect(() => {
    void loadCalendarSnapshotDates(preloadDates);
  }, [loadCalendarSnapshotDates, preloadDatesKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCalendarSnapshotDates(warmDates);
    }, 180);
    return () => clearTimeout(timer);
  }, [loadCalendarSnapshotDates, warmDatesKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const syncDates = viewMode === "day" ? preloadDates : visibleDates;
      void loadCalendarSnapshotDates(syncDates, { force: true });
    }, CALENDAR_BACKGROUND_SYNC_MS);
    return () => clearInterval(interval);
  }, [loadCalendarSnapshotDates, preloadDatesKey, viewMode, visibleDatesKey]);

  useEffect(() => {
    if (!workspace?.professional.id || hasServices || noServicesIntroDismissed) return;
    if (composerOpen || blockedTimeDraft || timeAction || noServicesHelper || memberPickerOpen || viewMenuOpen) return;
    const timer = setTimeout(() => {
      setNoServicesHelper({
        date: selectedDate,
        time: getDefaultVisitStartTime(selectedDate, primaryMember?.id),
        targetProfessionalId: primaryMember?.id,
        source: "time",
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [
    workspace?.professional.id,
    hasServices,
    noServicesIntroDismissed,
    composerOpen,
    blockedTimeDraft,
    timeAction,
    noServicesHelper,
    memberPickerOpen,
    viewMenuOpen,
    selectedDate,
    primaryMember?.id,
  ]);

  function getAppointmentsForDate(date: string) {
    return appointmentsByDate.get(date) || [];
  }

  function getSnapshotForDate(date: string) {
    return date === calendarDate && calendar ? calendar : rangeSnapshots[date] || null;
  }

  function getAppointmentsForMember(date: string, memberId: string) {
    const snapshot = getSnapshotForDate(date);
    const memberCalendar = snapshot?.memberCalendars?.find((member) => member.professionalId === memberId);
    if (memberCalendar) return memberCalendar.appointments || [];
    return getAppointmentsForDate(date).filter((appointment) => (appointment.professionalId || workspace?.professional.id || memberId) === memberId);
  }

  function getScheduleForMember(date: string, member: CalendarMemberView | null) {
    return getMemberScheduleForDate(member, workspace, date);
  }

  function getCalendarMemberById(memberId?: string) {
    if (!memberId) return primaryMember;
    return calendarMembers.find((member) => member.id === memberId) || primaryMember;
  }

  function roundUpMinuteValue(minutes: number, step = 10) {
    return Math.max(0, Math.min(24 * 60 - step, Math.ceil(minutes / step) * step));
  }

  function getDefaultVisitStartTime(date = selectedDate, targetProfessionalId = primaryMember?.id) {
    const member = getCalendarMemberById(targetProfessionalId);
    const schedule = getScheduleForMember(date, member);
    const duration = Math.max(5, services[0]?.durationMinutes || 15);
    const isToday = date === getTodayIso();
    const nowMinutes = timeToMinutes(getRoundedTime(10));
    const appointments = getAppointmentsForMember(date, member?.id || targetProfessionalId || workspace?.professional.id || "")
      .filter((appointment) => isValidTime(appointment.startTime) && isValidTime(appointment.endTime))
      .map((appointment) => ({
        start: timeToMinutes(appointment.startTime),
        end: timeToMinutes(appointment.endTime),
      }))
      .filter((range) => range.end > range.start)
      .sort((left, right) => left.start - right.start);

    const scheduleIntervals = schedule.enabled ? getDayIntervalsRecord(schedule) : [];
    let intervals = scheduleIntervals
      .map((interval) => ({
        start: timeToMinutes(interval.startTime),
        end: timeToMinutes(interval.endTime),
      }))
      .filter((interval) => interval.end > interval.start);

    if (isToday) {
      intervals = [{ start: nowMinutes, end: 24 * 60 - 1 }];
    } else if (!intervals.length) {
      const start = isValidTime(schedule.startTime) ? timeToMinutes(schedule.startTime) : 9 * 60;
      const end = isValidTime(schedule.endTime) && timeToMinutes(schedule.endTime) > start ? timeToMinutes(schedule.endTime) : 18 * 60;
      intervals = [{ start, end }];
    }

    for (const interval of intervals) {
      let cursor = roundUpMinuteValue(interval.start, 10);
      while (cursor + duration <= interval.end) {
        const blocking = appointments.find((appointment) => cursor < appointment.end && cursor + duration > appointment.start);
        if (!blocking) return minutesToTime(cursor);
        cursor = roundUpMinuteValue(blocking.end, 10);
      }
    }

    if (isToday) return minutesToTime(nowMinutes);
    const fallbackStart = intervals[0]?.start ?? (isValidTime(schedule.startTime) ? timeToMinutes(schedule.startTime) : 9 * 60);
    return minutesToTime(roundUpMinuteValue(fallbackStart, 10));
  }

  function getLocalizedAppointmentServiceName(appointment: Pick<AppointmentRecord, "serviceName">) {
    if (isAppointmentWithoutServiceName(appointment.serviceName)) return t.withoutService;
    const matchedService = services.find((service) => serviceNameMatches(service, appointment.serviceName));
    return getServiceDisplayName(matchedService, language) || appointment.serviceName;
  }

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      if (current.includes(memberId)) {
        return current.length > 1 ? current.filter((id) => id !== memberId) : current;
      }
      return [...current, memberId];
    });
  }

  function selectAllMembers() {
    setSelectedMemberIds(calendarMembers.map((member) => member.id));
  }

  function setDraftClient(client: ClientRecord | null) {
    setVisitDraft({
      ...visitDraft,
      selectedClientId: client?.id,
      customerName: client?.fullName || "",
      customerPhone: client?.phone || "",
    });
    setClientQuery("");
    setClientCreateOpen(false);
    setVisitPickerMode(null);
  }

  function getClientDraftFromQuery(query: string) {
    const value = query.trim();
    if (!value) return { firstName: "", lastName: "", phone: "" };
    const looksLikePhone = /^[+\d\s().-]+$/.test(value) && /\d/.test(value);
    if (looksLikePhone) return { firstName: "", lastName: "", phone: value };
    const parts = value.split(/\s+/).filter(Boolean);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" "), phone: "" };
  }

  function openInlineClientForm(seed = clientQuery) {
    setNewClientDraft(getClientDraftFromQuery(seed));
    setClientCreateOpen(true);
  }

  async function createInlineClient() {
    const fullName = [newClientDraft.firstName, newClientDraft.lastName].map((item) => item.trim()).filter(Boolean).join(" ");
    const client = await onCreateClientFromVisit({
      fullName,
      phone: newClientDraft.phone.trim(),
      email: "",
    });
    if (client) setDraftClient(client);
  }

  function updateVisitItem(index: number, patch: Partial<VisitServiceDraft>) {
    setVisitDraft((currentDraft) => {
      const draftItems = Array.isArray(currentDraft.items) && currentDraft.items.length ? currentDraft.items : [createVisitServiceDraft(currentDraft.startTime || "09:00")];
      return {
        ...currentDraft,
        serviceId: index === 0 && patch.serviceId !== undefined ? patch.serviceId : currentDraft.serviceId,
        items: draftItems.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          const next = { ...item, ...patch };
          if (patch.startTime && !patch.endTime && timeToMinutes(safeText(next.endTime)) <= timeToMinutes(patch.startTime)) {
            next.endTime = addMinutes(patch.startTime, next.durationMinutes || 15);
          }
          return next;
        }),
      };
    });
  }

  function selectVisitService(service: ServiceRecord) {
    Keyboard.dismiss();
    const duration = Math.max(5, service.durationMinutes || 60);
    const serviceName = getServiceDisplayName(service, language);
    setVisitPickerMode(null);
    setServiceQuery("");
    setVisitDraft((currentDraft) => {
      const draftItems = Array.isArray(currentDraft.items) && currentDraft.items.length ? currentDraft.items : [createVisitServiceDraft(currentDraft.startTime || "09:00")];
      const currentItem = draftItems[editingServiceIndex] || createVisitServiceDraft(currentDraft.startTime || "09:00");
      const nextItems = draftItems.map((item, itemIndex) => {
        if (itemIndex !== editingServiceIndex) return item;
        return {
          ...item,
          serviceId: service.id,
          serviceName,
          priceAmount: Number(service.price || 0),
          durationMinutes: duration,
          endTime: addMinutes(currentItem.startTime, duration),
        };
      });
      return {
        ...currentDraft,
        serviceId: editingServiceIndex === 0 ? service.id : currentDraft.serviceId,
        items: nextItems,
      };
    });
  }

  function openVisitServicePicker(index: number, item: VisitServiceDraft) {
    setEditingServiceIndex(index);
    if (!hasServices) {
      setNoServicesHelper({
        date: visitDraft.appointmentDate || selectedDate,
        time: item.startTime || visitDraft.startTime || getRoundedTime(10),
        targetProfessionalId: visitDraft.targetProfessionalId,
        source: "visit",
      });
      return;
    }
    setVisitPickerMode("service");
  }

  function closeNoServicesHelper() {
    setNoServicesIntroDismissed(true);
    setNoServicesHelper(null);
  }

  function openServicesFromCalendar() {
    setNoServicesIntroDismissed(true);
    setNoServicesHelper(null);
    setTimeAction(null);
    setVisitPickerMode(null);
    setComposerOpen(false);
    setEditingAppointment(null);
    onOpenServices();
  }

  function addAnotherService() {
    if (!hasServices) {
      setNoServicesHelper({
        date: visitDraft.appointmentDate || selectedDate,
        time: draftVisitItems[draftVisitItems.length - 1]?.endTime || visitDraft.startTime || getRoundedTime(10),
        targetProfessionalId: visitDraft.targetProfessionalId,
        source: "visit",
      });
      return;
    }
    const draftItems = Array.isArray(visitDraft.items) && visitDraft.items.length ? visitDraft.items : [createVisitServiceDraft(visitDraft.startTime || "09:00")];
    const lastItem = draftItems[draftItems.length - 1];
    const nextStart = lastItem?.endTime || visitDraft.startTime || "09:00";
    setVisitDraft({
      ...visitDraft,
      items: [...draftItems, createVisitServiceDraft(nextStart)],
    });
  }

  function removeVisitService(index: number) {
    const draftItems = Array.isArray(visitDraft.items) ? visitDraft.items : [];
    if (draftItems.length <= 1) return;
    setVisitDraft({
      ...visitDraft,
      items: draftItems.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  function openComposerAt(time: string, date = selectedDate, targetProfessionalId = primaryMember?.id) {
    const startTime = isValidTime(time) ? normalizeTimeInput(time) : getDefaultVisitStartTime(date, targetProfessionalId);
    if (!hasServices) {
      setNoServicesHelper({ date, time: startTime, targetProfessionalId, source: "time" });
      return;
    }
    setEditingAppointment(null);
    setSelectedDate(date);
    const nextDraft = createDefaultVisitDraft(date, startTime);
    setVisitDraft({ ...nextDraft, targetProfessionalId });
    setComposerOpen(true);
  }

  function openAppointmentEditor(appointment: AppointmentRecord) {
    const withoutService = isAppointmentWithoutServiceName(appointment.serviceName);
    const matchedService = withoutService ? undefined : services.find((service) => serviceNameMatches(service, appointment.serviceName)) || services[0];
    const matchedClient = clients.find((client) => {
      const samePhone = appointment.customerPhone && client.phone === appointment.customerPhone;
      const sameName = appointment.customerName && client.fullName === appointment.customerName;
      return samePhone || sameName;
    });
    setEditingAppointment(appointment);
    setSelectedDate(appointment.appointmentDate || selectedDate);
    setVisitDraft({
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      startTime: appointment.startTime,
      serviceId: matchedService?.id || "",
      appointmentDate: appointment.appointmentDate || selectedDate,
      notes: appointment.notes || "",
      targetProfessionalId: appointment.professionalId || primaryMember?.id,
      selectedClientId: matchedClient?.id,
      items: [
        {
          id: appointment.id,
          serviceId: matchedService?.id || "",
          serviceName: withoutService ? t.withoutService : getServiceDisplayName(matchedService, language) || appointment.serviceName,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          priceAmount: Number(appointment.priceAmount || matchedService?.price || 0),
          durationMinutes: Math.max(5, timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)),
        },
      ],
    });
    setComposerOpen(true);
  }

  function normalizeContactPhone(value: string) {
    const phone = safeText(value).replace(/[^\d+]/g, "");
    if (!phone) return "";
    if (phone.startsWith("+")) return phone;
    return `+${phone}`;
  }

  async function openContactAction(kind: "phone" | "telegram" | "viber" | "whatsapp") {
    const phone = normalizeContactPhone(visitDraft.customerPhone || selectedClient?.phone || "");
    if (!phone) {
      Alert.alert(t.customer, t.clientNameOrPhone || t.phone);
      return;
    }
    const encodedPhone = encodeURIComponent(phone);
    const plainPhone = phone.replace(/[^\d]/g, "");
    const urls =
      kind === "phone"
        ? [`tel:${phone}`]
        : kind === "whatsapp"
          ? [`whatsapp://send?phone=${plainPhone}`, `https://wa.me/${plainPhone}`]
          : kind === "viber"
            ? [`viber://chat?number=${encodedPhone}`]
            : [`tg://resolve?phone=${plainPhone}`, `https://t.me/+${plainPhone}`];

    for (const url of urls) {
      const opened = await Linking.openURL(url).then(() => true).catch(() => false);
      if (opened) return;
    }
  }

  function openBlockedTimeComposer(action: { date: string; time: string; targetProfessionalId?: string }, label: string, title: string) {
    setBlockedTimeDraft({
      date: action.date,
      startTime: action.time,
      endTime: addMinutes(action.time, 60),
      targetProfessionalId: action.targetProfessionalId,
      label,
      title,
    });
  }

  function openBlockedAppointmentEditor(appointment: AppointmentRecord) {
    setBlockedTimeDraft({
      date: appointment.appointmentDate || selectedDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      targetProfessionalId: appointment.professionalId,
      label: appointment.serviceName || t.unavailableTime,
      title: appointment.serviceName || t.unavailableTime,
      appointment,
    });
  }

  async function saveBlockedTimeDraft() {
    if (!blockedTimeDraft) return;
    const startTime = blockedTimeDraft.startTime.trim();
    const endTime = blockedTimeDraft.endTime.trim();
    if (!isValidTime(startTime) || !isValidTime(endTime) || timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }
    const saved = blockedTimeDraft.appointment
      ? await onUpdateBlockedTime(blockedTimeDraft.appointment, startTime, endTime)
      : (await onCreateBlockedTime(blockedTimeDraft.date, startTime, endTime, blockedTimeDraft.label, blockedTimeDraft.targetProfessionalId), true);
    if (saved) setBlockedTimeDraft(null);
  }

  function warmCalendarMode(date: string, nextMode = viewMode) {
    void loadCalendarSnapshotDates(getCalendarModeDates(nextMode, date));
    void loadCalendarSnapshotDates(getCalendarWarmDates(nextMode, date));
  }

  function chooseDate(date: string, nextMode: CalendarViewMode = viewMode) {
    warmCalendarMode(date, nextMode);
    setSelectedDate(date);
    if (nextMode !== viewMode) setViewMode(nextMode);
  }

  function chooseViewMode(nextMode: CalendarViewMode) {
    warmCalendarMode(selectedDate, nextMode);
    setViewMode(nextMode);
  }

  function showDayOffSchedulePrompt() {
    Alert.alert(t.dayOffTitle, t.dayOffMessage, [
      { text: t.cancel, style: "cancel" },
      { text: t.configureSchedule, onPress: onOpenSchedule },
    ]);
  }

  return (
    <View style={styles.calendarScreen}>
      <View style={styles.calendarToolbar}>
        <Pressable style={styles.dateButton} onPress={() => chooseDate(shiftCalendarDate(viewMode, selectedDate, -1))}>
          <Ionicons name="chevron-back" size={18} color="#0F172A" />
        </Pressable>
        <View style={styles.datePill}>
          <Text style={styles.dateText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>
            {titleText}
          </Text>
          <Text style={styles.dateSubText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>
            {viewMode === "day" ? getWorkTimeLabel(selectedSchedule, t) : t.selected}
          </Text>
        </View>
        <Pressable style={styles.dateButton} onPress={() => chooseDate(shiftCalendarDate(viewMode, selectedDate, 1))}>
          <Ionicons name="chevron-forward" size={18} color="#0F172A" />
        </Pressable>
        <View style={styles.toolbarSpacer} />
        <Pressable style={styles.modeButton} onPress={() => setViewMenuOpen(true)}>
          <Text style={styles.modeButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>
            {activeViewLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#475569" />
        </Pressable>
      </View>

      {viewMode === "day" ? (
        <>
          {!selectedSchedule.enabled ? (
            <Pressable style={styles.dayOffBanner} onPress={showDayOffSchedulePrompt}>
              <Text style={styles.dayOffBannerTitle}>{t.dayOffTitle}</Text>
              <Text style={styles.dayOffBannerText}>{t.bookingUnavailable}</Text>
            </Pressable>
          ) : null}
          <View style={styles.teamCalendarBoard}>
            <ScrollView
              style={styles.calendarScroll}
              contentContainerStyle={styles.calendarContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
              showsVerticalScrollIndicator
              alwaysBounceVertical
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.teamCalendarBodyRow}>
                <View style={styles.teamLeftAxisColumn}>
                  <View style={styles.teamPickerRail}>
                    {calendarMembers.length > 1 ? (
                      <Pressable style={styles.teamPickerButton} onPress={() => setMemberPickerOpen(true)}>
                        <Ionicons name="people-outline" size={18} color="#0F172A" />
                        <View style={styles.teamPickerBadge}>
                          <Text style={styles.teamPickerBadgeText} allowFontScaling={false}>{selectedMembers.length || 1}</Text>
                        </View>
                      </Pressable>
                    ) : null}
                  </View>
                  <CalendarTimeAxis date={selectedDate} compact={isCompact} schedule={selectedSchedule} />
                </View>
                <ScrollView
                  horizontal
                  style={styles.teamMembersHorizontal}
                  contentContainerStyle={styles.teamMembersHorizontalContent}
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View>
                    <View style={styles.teamMembersHeaderRow}>
                      {visibleCalendarMembers.map((member) => (
                        <View key={member.id} style={[styles.teamDayHeader, { width: dayMemberColumnWidth }]}>
                          <MemberAvatar member={member} size={CALENDAR_TEAM_HEADER_AVATAR_SIZE} />
                          <Text style={styles.masterName} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                            {member.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.teamMembersBodyRow}>
                      {visibleCalendarMembers.map((member) => {
                        const memberAppointments = getAppointmentsForMember(selectedDate, member.id);
                        const memberSchedule = getScheduleForMember(selectedDate, member);
                        return (
                          <View key={member.id} style={[styles.teamDayColumn, { width: dayMemberColumnWidth }]}>
                            <CalendarTimeline
                              date={selectedDate}
                              appointments={memberAppointments}
                              services={workspace?.services || []}
                              currency={currency}
                              compact={isCompact}
                              schedule={memberSchedule}
                              t={t}
                              formatAppointmentServiceName={getLocalizedAppointmentServiceName}
                              columnWidth={dayMemberColumnWidth}
                              showTimeColumn={false}
                              onTimePress={(time) => setTimeAction({ date: selectedDate, time, targetProfessionalId: member.id })}
                              onAppointmentPress={openAppointmentEditor}
                              onBlockedAppointmentPress={openBlockedAppointmentEditor}
                              onAppointmentDelete={onDeleteAppointment}
                              onAppointmentMove={onMoveAppointment}
                              onAppointmentResize={onResizeAppointment}
                              onClosedDayPress={showDayOffSchedulePrompt}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
            {!visibleDayAppointmentCount && selectedSchedule.enabled ? (
              <Pressable style={[styles.calendarEmptyState, { top: emptyCalendarTop }]} onPress={openEmptyCalendarPrimaryAction}>
                <Text style={styles.calendarEmptyTitle}>{emptyCalendarTitle}</Text>
                <Text style={styles.calendarEmptyText}>{emptyCalendarText}</Text>
                <View style={styles.emptyActionRow}>
                  <Pressable style={styles.emptyPrimaryAction} onPress={openEmptyCalendarPrimaryAction}>
                    <Text style={styles.emptyPrimaryActionText}>{emptyCalendarPrimaryLabel}</Text>
                  </Pressable>
                  {emptyCalendarSecondaryLabel ? (
                    <Pressable style={styles.emptySecondaryAction} onPress={openEmptyCalendarSecondaryAction}>
                      <Text style={styles.emptySecondaryActionText}>{emptyCalendarSecondaryLabel}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : (
        <CalendarOverview
          t={t}
          language={language}
          mode={viewMode}
          selectedDate={selectedDate}
          dates={visibleDates}
          currency={currency}
          workspace={workspace}
          members={selectedMembers.length ? selectedMembers : calendarMembers.slice(0, 1)}
          getAppointmentsForDate={getAppointmentsForDate}
          getAppointmentsForMember={getAppointmentsForMember}
          getScheduleForMember={getScheduleForMember}
          onSelectDate={(date) => chooseDate(date, viewMode)}
          onOpenDay={(date) => chooseDate(date, "day")}
          onCreateAt={(date, memberId) => openComposerAt("", date, memberId)}
        />
      )}

      {!(composerOpen || blockedTimeDraft || timeAction || noServicesHelper || memberPickerOpen || viewMenuOpen) ? (
        <Pressable
          style={({ pressed }) => [styles.fabButton, pressed && styles.fabButtonPressed]}
          onPress={() => {
            setTimeAction({ date: selectedDate, time: getDefaultVisitStartTime(selectedDate, primaryMember?.id), targetProfessionalId: primaryMember?.id });
          }}
        >
          <Ionicons name="add" size={31} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Modal transparent visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
          <View style={[styles.visitSheet, styles.visitEditorSheet]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
                {visitPickerMode === "client" ? t.chooseClient : visitPickerMode === "service" ? t.chooseService : editingAppointment ? t.editVisit : t.newVisit}
              </Text>
              <Pressable
                style={styles.sheetClose}
                onPress={() => {
                  if (visitPickerMode) {
                    setVisitPickerMode(null);
                    return;
                  }
                  setComposerOpen(false);
                  setEditingAppointment(null);
                }}
              >
                <Ionicons name={visitPickerMode ? "chevron-back" : "close"} size={22} color="#0F172A" />
              </Pressable>
            </View>
            {visitPickerMode === "client" ? (
              <ScrollView
                style={styles.clientPickerScroll}
                contentContainerStyle={styles.clientPickerScrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
              >
                <SearchInput value={clientQuery} onChangeText={setClientQuery} placeholder={t.clientNameOrPhone} />
                <Pressable style={styles.clientOptionCard} onPress={() => setDraftClient(null)}>
                  <View style={styles.clientAvatar}>
                    <Ionicons name="person-outline" size={18} color="#6D4AFF" />
                  </View>
                  <View style={styles.clientOptionText}>
                    <Text style={styles.clientOptionTitle}>{t.quickBookingWithoutClient}</Text>
                    <Text style={styles.clientOptionCaption}>{t.chooseClientLater}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>
                <Pressable
                  style={[styles.clientOptionCard, clientCreateOpen && styles.clientOptionCardActive]}
                  onPress={() => {
                    if (clientCreateOpen) {
                      setClientCreateOpen(false);
                      return;
                    }
                    openInlineClientForm();
                  }}
                >
                  <View style={styles.clientAvatar}>
                    <Ionicons name={clientCreateOpen ? "chevron-up" : "add"} size={20} color="#6D4AFF" />
                  </View>
                  <View style={styles.clientOptionText}>
                    <Text style={styles.clientOptionTitle}>{t.addNewClient}</Text>
                    <Text style={styles.clientOptionCaption}>{clientCreateOpen ? t.formOpened : t.clientNameOrPhone}</Text>
                  </View>
                  <Ionicons name={clientCreateOpen ? "chevron-up" : "chevron-forward"} size={18} color="#94A3B8" />
                </Pressable>
                {showCreateFromSearch ? (
                  <Pressable style={styles.clientCreateSuggestion} onPress={() => openInlineClientForm(clientQuery)}>
                    <Ionicons name="search" size={17} color="#6D4AFF" />
                    <View style={styles.clientOptionText}>
                      <Text style={styles.clientOptionTitle}>{t.createClientFromSearch}: {clientQuery.trim()}</Text>
                      <Text style={styles.clientOptionCaption}>{t.noClientFound}</Text>
                    </View>
                  </Pressable>
                ) : null}
                {clientCreateOpen ? (
                  <View style={styles.inlineClientForm}>
                    <View>
                      <Text style={styles.inlineClientFormTitle}>{t.newClientFormTitle}</Text>
                      <Text style={styles.inlineClientFormHint}>{t.newClientFormHint}</Text>
                    </View>
                    <InlineClientInput label={t.firstName} value={newClientDraft.firstName} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, firstName: value })} />
                    <InlineClientInput label={t.lastName} value={newClientDraft.lastName} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, lastName: value })} />
                    <InlineClientInput label={t.phone} value={newClientDraft.phone} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, phone: value })} keyboardType="phone-pad" />
                    <PrimaryButton label={t.addAndSelectClient} onPress={() => void createInlineClient()} disabled={busy} />
                  </View>
                ) : null}
                <View style={styles.clientPickerResults}>
                  {filteredClients.map((client) => (
                    <Pressable key={client.id} style={styles.clientOptionCard} onPress={() => setDraftClient(client)}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>{(client.fullName || client.phone || "C").slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <View style={styles.clientOptionText}>
                        <Text style={styles.clientOptionTitle} numberOfLines={1} ellipsizeMode="tail">{client.fullName || client.phone}</Text>
                        <Text style={styles.clientOptionCaption} numberOfLines={1} ellipsizeMode="tail">{client.phone || client.email || t.clients}</Text>
                      </View>
                    </Pressable>
                  ))}
                  {!filteredClients.length && hasClientSearch ? (
                    <View style={styles.pickerEmptyState}>
                      <Text style={styles.pickerEmptyTitle}>{t.noClientFound}</Text>
                      <Pressable style={styles.pickerEmptyButton} onPress={() => openInlineClientForm(clientQuery)}>
                        <Text style={styles.pickerEmptyButtonText}>{t.createClientFromSearch}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            ) : visitPickerMode === "service" ? (
              <>
                {hasServices ? (
                  <>
                    <View style={styles.servicePickerSearchBar}>
                      <SearchInput value={serviceQuery} onChangeText={setServiceQuery} placeholder={t.searchService} />
                    </View>
                    <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
                      {filteredServices.length ? (
                        filteredServices.map((service) => (
                          <Pressable key={service.id} style={styles.serviceOptionCard} onPress={() => selectVisitService(service)}>
                            <View style={[styles.serviceTone, { backgroundColor: service.color || "#6D4AFF" }]} />
                            <View style={styles.serviceOptionInfo}>
                              <Text style={styles.serviceOptionTitle} numberOfLines={1} ellipsizeMode="tail">{getServiceDisplayName(service, language)}</Text>
                              <Text style={styles.serviceOptionDuration}>{formatDuration(service.durationMinutes || 60, t)}</Text>
                            </View>
                            <Text style={styles.serviceOptionPrice} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{formatMoney(service.price, currency)}</Text>
                          </Pressable>
                        ))
                      ) : (
                        <View style={styles.servicePickerEmptyCard}>
                          <Text style={styles.firstRunTitle}>{t.serviceSearchEmpty}</Text>
                          <Text style={styles.firstRunText}>{t.servicesEmptyPickerText}</Text>
                          <View style={styles.firstRunActions}>
                            <Pressable style={styles.firstRunPrimaryButton} onPress={openServicesFromCalendar}>
                              <Text style={styles.firstRunPrimaryText}>{t.chooseFromCatalog}</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.servicePickerEmptyCard}>
                    <View style={styles.firstRunIcon}>
                      <Ionicons name="pricetag-outline" size={22} color="#6D4AFF" />
                    </View>
                    <Text style={styles.firstRunTitle}>{t.servicesEmptyPickerTitle}</Text>
                    <Text style={styles.firstRunText}>{t.servicesEmptyPickerText}</Text>
                    <View style={styles.firstRunActions}>
                      <Pressable style={styles.firstRunPrimaryButton} onPress={openServicesFromCalendar}>
                        <Text style={styles.firstRunPrimaryText}>{t.chooseFromCatalog}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <ScrollView style={styles.visitEditorScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.visitClientCard}>
                    <Pressable style={styles.visitClientCardMain} onPress={() => setVisitPickerMode("client")}>
                      <View style={styles.clientAvatarLarge}>
                        <Text style={styles.clientAvatarLargeText}>{selectedClient ? (selectedClient.fullName || "C").slice(0, 1).toUpperCase() : "○"}</Text>
                      </View>
                      <View style={styles.clientOptionText}>
                        <Text style={styles.visitCardEyebrow}>{t.customer}</Text>
                        <Text style={styles.visitClientTitle}>{selectedClient ? selectedClient.fullName : visitDraft.customerName || t.quickBookingWithoutClient}</Text>
                        <Text style={styles.clientOptionCaption}>{visitDraft.customerPhone || t.chooseClientLater}</Text>
                      </View>
                      <Ionicons name="add" size={18} color="#6D4AFF" />
                    </Pressable>
                    {editingAppointment ? (
                      <View style={styles.visitContactActions}>
                        <Pressable style={[styles.visitContactActionButton, styles.visitContactActionPhone]} onPress={() => void openContactAction("phone")}>
                          <Ionicons name="call" size={17} color="#2563EB" />
                        </Pressable>
                        <Pressable style={[styles.visitContactActionButton, styles.visitContactActionWhatsApp]} onPress={() => void openContactAction("whatsapp")}>
                          <Ionicons name="logo-whatsapp" size={17} color="#16A34A" />
                        </Pressable>
                        <Pressable style={[styles.visitContactActionButton, styles.visitContactActionTelegram]} onPress={() => void openContactAction("telegram")}>
                          <Ionicons name="paper-plane" size={17} color="#0284C7" />
                        </Pressable>
                        <Pressable style={[styles.visitContactActionButton, styles.visitContactActionViber]} onPress={() => void openContactAction("viber")}>
                          <Ionicons name="chatbubble-ellipses" size={17} color="#6D4AFF" />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.visitSectionHeader}>
                    <Text style={styles.visitSectionTitle}>{t.visitTab || t.newVisit}</Text>
                    <Text style={styles.visitSectionDate}>{formatDayLabel(visitDraft.appointmentDate || selectedDate, language)}</Text>
                  </View>

                  {draftVisitItems.map((item, index) => (
                    <View key={item.id} style={styles.visitServiceCard}>
                      <View style={styles.visitServiceCardHeader}>
                        <Pressable
                          style={styles.visitServicePickerButton}
                          onPress={() => openVisitServicePicker(index, item)}
                        >
                          <Text style={[styles.visitServicePickerText, !item.serviceName && styles.mutedText]} numberOfLines={1}>
                            {(getServiceDisplayName(services.find((service) => service.id === item.serviceId), language) || item.serviceName || t.chooseService)} →
                          </Text>
                        </Pressable>
                        {draftVisitItems.length > 1 ? (
                          <Pressable style={styles.smallIconButton} onPress={() => removeVisitService(index)}>
                            <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.twoColumns}>
                        <Field label={t.start} value={item.startTime} onChangeText={(value) => updateVisitItem(index, { startTime: value })} keyboardType="numbers-and-punctuation" placeholder="09:00" />
                        <Field label={t.end} value={item.endTime} onChangeText={(value) => updateVisitItem(index, { endTime: value })} keyboardType="numbers-and-punctuation" placeholder="10:00" />
                      </View>
                      <Field
                        label={t.price}
                        value={String(Number(item.priceAmount || 0))}
                        onChangeText={(value) => updateVisitItem(index, { priceAmount: Number(value.replace(",", ".")) || 0 })}
                        keyboardType="decimal-pad"
                        placeholder="0"
                      />
                      <View style={styles.visitServiceMeta}>
                        <Text style={styles.clientOptionCaption}>{getServiceDisplayName(services.find((service) => service.id === item.serviceId), language) || item.serviceName || t.withoutService}</Text>
                        <Text style={styles.visitServicePrice}>{formatMoney(item.priceAmount, currency)}</Text>
                      </View>
                    </View>
                  ))}
                  <Pressable style={styles.addAnotherServiceButton} onPress={addAnotherService}>
                    <Text style={styles.addAnotherServiceText}>{t.addAnotherService}</Text>
                  </Pressable>
                </ScrollView>
                <View style={styles.visitTotals}>
                  <Text style={styles.visitTotalsText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {t.total} {formatMoney(visitTotal, currency)} · {t.payable.toLowerCase()} {formatMoney(visitTotal, currency)}
                  </Text>
                </View>
                <PrimaryButton
                  label={editingAppointment ? t.save : t.saveVisit}
                  onPress={async () => {
                    const saved = editingAppointment ? await onUpdateVisit() : await onCreateVisit();
                    if (saved) {
                      setComposerOpen(false);
                      setEditingAppointment(null);
                    }
                  }}
                  disabled={busy}
                />
                {editingAppointment ? (
                  <Pressable
                    style={[styles.dangerTextButton, busy && styles.disabled]}
                    disabled={busy}
                    onPress={() => {
                      setComposerOpen(false);
                      onDeleteAppointment(editingAppointment);
                    }}
                  >
                    <Text style={styles.dangerTextButtonText}>{t.delete}</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={memberPickerOpen} animationType="fade" onRequestClose={() => setMemberPickerOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMemberPickerOpen(false)}>
          <Pressable style={styles.teamPickerMenu} onPress={(event) => event.stopPropagation()}>
            <SearchInput value={memberQuery} onChangeText={setMemberQuery} placeholder={t.search} />
            <Text style={styles.teamPickerSectionTitle}>{t.teamMembers}</Text>
            {calendarMembers.length > 1 ? (
              <Pressable style={[styles.teamPickerOption, selectedMemberIds.length === calendarMembers.length && styles.teamPickerOptionActive]} onPress={selectAllMembers}>
                <View style={[styles.teamCheckBox, selectedMemberIds.length === calendarMembers.length && styles.teamCheckBoxActive]}>
                  {selectedMemberIds.length === calendarMembers.length ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                </View>
                <View style={styles.clientOptionText}>
                  <Text style={styles.clientOptionTitle}>{t.allTeam}</Text>
                  <Text style={styles.clientOptionCaption}>{t.showWholeTeam}</Text>
                </View>
              </Pressable>
            ) : null}
            <Text style={styles.teamPickerSectionTitle}>{t.selectedMasters}</Text>
            <ScrollView style={styles.teamPickerList} showsVerticalScrollIndicator={false}>
              {filteredMembers.map((member) => {
                const active = selectedMemberIds.includes(member.id);
                return (
                  <Pressable key={member.id} style={[styles.teamPickerOption, active && styles.teamPickerOptionActive]} onPress={() => toggleMember(member.id)}>
                    <View style={[styles.teamCheckBox, active && styles.teamCheckBoxActive]}>
                      {active ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                    </View>
                    <MemberAvatar member={member} size={34} />
                    <View style={styles.clientOptionText}>
                      <Text style={[styles.clientOptionTitle, active && styles.teamPickerOptionTitleActive]}>{member.name}</Text>
                      <Text style={styles.clientOptionCaption}>{member.scope === "owner" ? t.owner : member.role || t.employee}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={viewMenuOpen} animationType="fade" onRequestClose={() => setViewMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setViewMenuOpen(false)}>
          <View style={styles.viewMenu}>
            {viewOptions.map((option) => {
              const active = option.value === viewMode;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.viewMenuItem, active && styles.viewMenuItemActive]}
                  onPress={() => {
                    chooseViewMode(option.value);
                    setViewMenuOpen(false);
                  }}
                >
                  <Text style={[styles.viewMenuText, active && styles.viewMenuTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color="#7C3AED" /> : null}
                </Pressable>
              );
            })}
            <View style={styles.viewMenuDivider} />
            <Pressable
              style={styles.viewMenuItem}
              onPress={() => {
                setIsCompact((current) => !current);
                setViewMenuOpen(false);
              }}
            >
              <Text style={styles.viewMenuText}>{isCompact ? t.detailed : t.compact}</Text>
              <Ionicons name="options-outline" size={18} color="#64748B" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(timeAction)} animationType="fade" onRequestClose={() => setTimeAction(null)}>
        <Pressable style={styles.timeActionBackdrop} onPress={() => setTimeAction(null)}>
          <View style={styles.timeActionMenu}>
            <View style={styles.sheetHandle} />
            {!hasServices ? (
              <View style={styles.noServicesActionSheet}>
                <View style={styles.firstRunIcon}>
                  <Ionicons name="pricetag-outline" size={22} color="#6D4AFF" />
                </View>
                <Text style={styles.noServicesActionTitle}>{t.onboardingStartTitle}</Text>
                <Text style={styles.noServicesActionText}>{t.onboardingStartText}</Text>
                <Pressable
                  style={[styles.firstRunPrimaryButton, styles.noServicesFullButton]}
                  onPress={openServicesFromCalendar}
                >
                  <Text style={styles.firstRunPrimaryText}>{t.chooseFromCatalog}</Text>
                </Pressable>
                <Pressable style={styles.noServicesCancelButton} onPress={() => setTimeAction(null)}>
                  <Text style={styles.noServicesCancelText}>{t.cancel}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.timeActionTitle}>{timeAction?.time}</Text>
                <Pressable
                  style={styles.timeActionItem}
                  onPress={() => {
                    if (!timeAction) return;
                    const action = timeAction;
                    setTimeAction(null);
                    openComposerAt(action.time, action.date, action.targetProfessionalId);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#0F172A" />
                  <Text style={styles.timeActionText}>{t.newVisit}</Text>
                </Pressable>
                <Pressable
                  style={styles.timeActionItem}
                  onPress={() => {
                    if (!timeAction) return;
                    const action = timeAction;
                    setTimeAction(null);
                    openBlockedTimeComposer(action, t.reservedTime, t.reservedTime);
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#0F172A" />
                  <Text style={styles.timeActionText}>{t.bookTime}</Text>
                </Pressable>
                <Pressable
                  style={styles.timeActionItem}
                  onPress={() => {
                    if (!timeAction) return;
                    const action = timeAction;
                    setTimeAction(null);
                    openBlockedTimeComposer(action, t.unavailableTime, t.unavailableTime);
                  }}
                >
                  <Ionicons name="ban-outline" size={20} color="#0F172A" />
                  <Text style={styles.timeActionText}>{t.addBlockedTime}</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(noServicesHelper)} animationType="fade" onRequestClose={closeNoServicesHelper}>
        <Pressable style={styles.timeActionBackdrop} onPress={closeNoServicesHelper}>
          <View style={styles.timeActionMenu}>
            <View style={styles.noServicesActionSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.firstRunIcon}>
                <Ionicons name="pricetag-outline" size={22} color="#6D4AFF" />
              </View>
              <Text style={styles.noServicesActionTitle}>{t.onboardingStartTitle}</Text>
              <Text style={styles.noServicesActionText}>{t.onboardingStartText}</Text>
              <Pressable style={[styles.firstRunPrimaryButton, styles.noServicesFullButton]} onPress={openServicesFromCalendar}>
                <Text style={styles.firstRunPrimaryText}>{t.chooseFromCatalog}</Text>
              </Pressable>
              <Pressable style={styles.noServicesCancelButton} onPress={closeNoServicesHelper}>
                <Text style={styles.noServicesCancelText}>{t.cancel}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(blockedTimeDraft)} animationType="slide" onRequestClose={() => setBlockedTimeDraft(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
          <View style={styles.visitSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>{blockedTimeDraft?.title || t.unavailableTime}</Text>
              <Pressable style={styles.sheetClose} onPress={() => setBlockedTimeDraft(null)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>
            <View style={styles.blockedTimeSummary}>
              <Ionicons name="time-outline" size={18} color="#6D4AFF" />
              <Text style={styles.blockedTimeSummaryText}>
                {blockedTimeDraft ? formatDayLabel(blockedTimeDraft.date, language) : ""}
              </Text>
            </View>
            <View style={styles.twoColumns}>
              <Field
                label={t.start}
                value={blockedTimeDraft?.startTime || ""}
                onChangeText={(value) => setBlockedTimeDraft((current) => (current ? { ...current, startTime: value } : current))}
                keyboardType="numbers-and-punctuation"
                placeholder="09:00"
              />
              <Field
                label={t.end}
                value={blockedTimeDraft?.endTime || ""}
                onChangeText={(value) => setBlockedTimeDraft((current) => (current ? { ...current, endTime: value } : current))}
                keyboardType="numbers-and-punctuation"
                placeholder="10:00"
              />
            </View>
            <PrimaryButton label={t.save} onPress={saveBlockedTimeDraft} disabled={busy} />
            {blockedTimeDraft?.appointment ? (
              <Pressable
                style={[styles.secondaryButton, styles.dangerButton, busy && styles.disabled]}
                disabled={busy}
                onPress={() => {
                  const appointment = blockedTimeDraft.appointment;
                  setBlockedTimeDraft(null);
                  if (appointment) onDeleteAppointment(appointment);
                }}
              >
                <Text style={styles.dangerButtonText}>{t.delete}</Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function MemberAvatar({ member, size = 34 }: { member: CalendarMemberView; size?: number }) {
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("") || "M";
  const fallbackColors = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#A855F7"];
  const colorSeed = (member.name || member.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const fallbackColor = fallbackColors[colorSeed % fallbackColors.length];
  return (
    <View style={[styles.masterAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: fallbackColor }]}>
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={[styles.memberAvatarImage, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.masterAvatarText, { fontSize: Math.max(12, size / 2.2) }]} allowFontScaling={false}>{initials}</Text>
      )}
    </View>
  );
}

function CalendarTimeAxis({ date, compact, schedule }: { date: string; compact: boolean; schedule: WorkDayScheduleRecord }) {
  const startHour = schedule.enabled ? 0 : 8;
  const endHour = schedule.enabled ? 23 : 22;
  const displayStartMinutes = startHour * 60;
  const displayEndMinutes = schedule.enabled ? (endHour + 1) * 60 : endHour * 60;
  const workStart = schedule.enabled ? timeToMinutes(schedule.startTime) : 9 * 60;
  const workEnd = schedule.enabled ? timeToMinutes(schedule.endTime) : 18 * 60;
  const workHourHeight = compact ? 72 : 88;
  const offHourHeight = compact ? workHourHeight / 10 : workHourHeight;
  const breakHourHeight = compact ? workHourHeight / 2.5 : workHourHeight;
  const breaks = schedule.enabled ? schedule.breaks || [] : [];
  const compactBreaks = breaks
    .map((item) => ({
      start: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.startTime))),
      end: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.endTime))),
    }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start);
  const compactSegments = (() => {
    if (!compact || !schedule.enabled) return [];
    const segments: Array<{ start: number; end: number; height: number }> = [];
    const pushSegment = (start: number, end: number, height: number) => {
      if (end > start) segments.push({ start, end, height });
    };
    let cursor = 0;
    pushSegment(cursor, workStart, offHourHeight);
    cursor = workStart;
    for (const item of compactBreaks) {
      pushSegment(cursor, item.start, workHourHeight);
      pushSegment(item.start, item.end, breakHourHeight);
      cursor = Math.max(cursor, item.end);
    }
    pushSegment(cursor, workEnd, workHourHeight);
    pushSegment(workEnd, 24 * 60, offHourHeight);
    return segments;
  })();

  function getScaledMinuteTop(minutes: number) {
    const safe = Math.max(displayStartMinutes, Math.min(displayEndMinutes, minutes));
    if (!schedule.enabled) return ((safe - displayStartMinutes) / 60) * workHourHeight;
    if (!compact) return (safe / 60) * workHourHeight;
    let top = 0;
    for (const segment of compactSegments) {
      if (safe >= segment.end) {
        top += ((segment.end - segment.start) / 60) * segment.height;
      } else if (safe > segment.start) {
        top += ((safe - segment.start) / 60) * segment.height;
        break;
      } else {
        break;
      }
    }
    return top;
  }

  function getRangeHeight(start: number, end: number) {
    return Math.max(1, getScaledMinuteTop(end) - getScaledMinuteTop(start));
  }

  const timelineHeight = getScaledMinuteTop(displayEndMinutes);
  const now = new Date();
  const nowTop = getScaledMinuteTop(now.getHours() * 60 + now.getMinutes());
  const showCurrentTime = schedule.enabled && date === getTodayIso();

  return (
    <View style={[styles.timeAxisColumn, { height: timelineHeight }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
        const hour = startHour + index;
        const rowStart = hour * 60;
        const rowEnd = (hour + 1) * 60;
        const top = getScaledMinuteTop(rowStart);
        const height = getRangeHeight(rowStart, rowEnd);
        const showLabel = height >= 18 || hour === Math.floor(workStart / 60);
        return (
          <View key={hour} pointerEvents="none" style={[styles.timeAxisHour, { top, height }]}>
            <Text style={[styles.hourText, !showLabel && styles.hourTextHidden]} allowFontScaling={false}>
              {showLabel ? `${String(hour).padStart(2, "0")}:00` : ""}
            </Text>
          </View>
        );
      })}
      {showCurrentTime && nowTop >= 0 && nowTop <= timelineHeight ? (
        <View pointerEvents="none" style={[styles.timeAxisCurrentDot, { top: nowTop - 5 }]} />
      ) : null}
    </View>
  );
}

function CalendarOverview({
  t,
  language,
  mode,
  selectedDate,
  dates,
  currency,
  workspace,
  members,
  getAppointmentsForDate,
  getAppointmentsForMember,
  getScheduleForMember,
  onSelectDate,
  onOpenDay,
  onCreateAt,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  mode: CalendarViewMode;
  selectedDate: string;
  dates: string[];
  currency?: string;
  workspace: WorkspaceSnapshot | null;
  members: CalendarMemberView[];
  getAppointmentsForDate: (date: string) => AppointmentRecord[];
  getAppointmentsForMember: (date: string, memberId: string) => AppointmentRecord[];
  getScheduleForMember: (date: string, member: CalendarMemberView | null) => WorkDayScheduleRecord;
  onSelectDate: (date: string) => void;
  onOpenDay: (date: string) => void;
  onCreateAt: (date: string, memberId?: string) => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const formatServiceName = (appointment: Pick<AppointmentRecord, "serviceName">) => {
    if (isAppointmentWithoutServiceName(appointment.serviceName)) return t.withoutService;
    const matchedService = (workspace?.services || []).find((service) => serviceNameMatches(service, appointment.serviceName));
    return getServiceDisplayName(matchedService, language) || appointment.serviceName;
  };

  if (mode === "month") {
    return (
      <ScrollView style={styles.overviewScroll} contentContainerStyle={styles.monthGrid} showsVerticalScrollIndicator={false}>
        {dates.map((date) => {
          const appointments = members.length ? members.flatMap((member) => getAppointmentsForMember(date, member.id)) : getAppointmentsForDate(date);
          const schedule = getScheduleForDate(workspace, date);
          const selected = date === selectedDate;
          const muted = !isSameMonth(date, selectedDate);
          const closed = !schedule.enabled;
          return (
            <Pressable
              key={date}
              style={[styles.monthCell, closed && styles.summaryCardClosed, selected && styles.monthCellActive, muted && styles.monthCellMuted]}
              onPress={() => onOpenDay(date)}
            >
              <View style={styles.monthCellTop}>
                <Text style={[styles.monthDayNumber, selected && styles.summaryDateActive, closed && styles.summaryClosedText, muted && styles.mutedText]}>
                  {Number(date.slice(-2))}
                </Text>
              </View>
              {closed ? (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedBadgeText}>{getClosedShortLabel(language)}</Text>
                </View>
              ) : appointments.length ? (
                <View style={styles.monthVisitBadge}>
                  <Text style={styles.monthVisitBadgeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{appointments.length} {t.visits}</Text>
                  <View style={styles.monthVisitDots}>
                    {appointments.slice(0, 3).map((appointment, index) => (
                      <View key={`${appointment.id}-${appointment.startTime}-${index}`} style={[styles.monthVisitDot, { backgroundColor: getAppointmentServiceColor(appointment, workspace?.services || [], index) }]} />
                    ))}
                  </View>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  if (mode === "week") {
    const weekDayCardWidth = Math.min(132, Math.max(96, Math.floor((screenWidth - 36) / 3)));
    const selectedDateIndex = Math.max(0, dates.indexOf(selectedDate));
    const initialWeekOffset = Math.max(0, Math.min(selectedDateIndex, Math.max(0, dates.length - 3))) * (weekDayCardWidth + 8);
    return (
      <ScrollView
        key={`week-${dates[0]}-${selectedDate}`}
        style={styles.overviewScroll}
        horizontal
        contentContainerStyle={styles.mobileWeekContent}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initialWeekOffset, y: 0 }}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={weekDayCardWidth + 8}
      >
        {dates.map((date) => {
          const selected = date === selectedDate;
          const memberAppointments = members.length
            ? members.flatMap((member) => getAppointmentsForMember(date, member.id).map((appointment) => ({ appointment, member })))
            : getAppointmentsForDate(date).map((appointment) => ({ appointment, member: null as CalendarMemberView | null }));
          const appointments = memberAppointments
            .sort((left, right) => left.appointment.startTime.localeCompare(right.appointment.startTime));
          const hasWorkDay = members.length
            ? members.some((member) => getScheduleForMember(date, member).enabled)
            : getScheduleForDate(workspace, date).enabled;
          const visibleAppointments = appointments.slice(0, 3);
          const emptyLabel = hasWorkDay ? (date === getTodayIso() ? t.noBookingsToday : t.noBookingsThisDay || t.emptyCalendarTitle) : t.dayOff;
          return (
            <Pressable
              key={date}
              style={[styles.mobileWeekDayCard, { width: weekDayCardWidth }, !hasWorkDay && styles.mobileWeekDayCardClosed, selected && styles.mobileWeekDayCardActive]}
              onPress={() => onSelectDate(date)}
              onLongPress={() => onCreateAt(date, members[0]?.id)}
            >
              <View style={styles.mobileWeekDayHeader}>
                <View>
                  <Text style={[styles.mobileWeekWeekday, selected && styles.mobileWeekDateActive]}>{formatWeekdayShort(date, language)}</Text>
                  <Text style={[styles.mobileWeekDateNumber, selected && styles.mobileWeekDateActive]}>{Number(date.slice(8, 10))}</Text>
                </View>
                {appointments.length ? (
                  <View style={styles.mobileWeekBadge}>
                    <Text style={styles.mobileWeekBadgeText}>{appointments.length}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.mobileWeekAppointments}>
                {visibleAppointments.length ? (
                  visibleAppointments.map(({ appointment, member }, index) => {
                    const blocked = appointment.kind === "blocked";
                    const serviceColor = getAppointmentServiceColor(appointment, workspace?.services || [], index);
                    const serviceName = formatServiceName(appointment);
                    const title = blocked ? appointment.serviceName || t.unavailableTime : appointment.customerName || serviceName || t.customer;
                    const subtitle = blocked ? t.unavailableTime : serviceName || member?.name || "";
                    return (
                      <Pressable
                        key={`${appointment.id}-${appointment.startTime}-${index}`}
                        style={[styles.mobileWeekAppointmentPill, { backgroundColor: serviceColor }, blocked && styles.mobileWeekAppointmentPillBlocked]}
                        onPress={() => onOpenDay(date)}
                      >
                        <Text style={styles.mobileWeekAppointmentTime} numberOfLines={1}>{appointment.startTime}</Text>
                        <Text style={styles.mobileWeekAppointmentTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                        {subtitle ? <Text style={styles.mobileWeekAppointmentSubtitle} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text> : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <Pressable style={styles.mobileWeekEmptySlot} onPress={() => (hasWorkDay ? onCreateAt(date, members[0]?.id) : onSelectDate(date))}>
                    <Text style={styles.mobileWeekEmptyText} numberOfLines={2}>{emptyLabel}</Text>
                  </Pressable>
                )}
                {appointments.length > visibleAppointments.length ? (
                  <Pressable style={styles.mobileWeekMorePill} onPress={() => onOpenDay(date)}>
                    <Text style={styles.mobileWeekMoreText}>+{appointments.length - visibleAppointments.length}</Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  const overviewDates = dates;
  const dayColumnWidth = 104;
  const memberRowHeight = 104;

  return (
    <ScrollView
      style={styles.overviewScroll}
      horizontal
      contentContainerStyle={styles.teamOverviewContent}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.teamOverviewGrid}>
        <View style={styles.teamOverviewHeaderRow}>
          <View style={styles.teamOverviewMemberHeader} />
          {overviewDates.map((date) => {
            const selected = date === selectedDate;
            return (
              <Pressable
                key={date}
                style={[styles.teamOverviewDateHeader, { width: dayColumnWidth }, selected && styles.teamOverviewDateHeaderActive]}
                onPress={() => onSelectDate(date)}
              >
                <Text style={[styles.teamOverviewDateNumber, selected && styles.summaryDateActive]}>{Number(date.slice(8, 10))}</Text>
                <Text style={styles.teamOverviewDateWeekday}>{formatShortDate(date, language).split(" ").slice(-1)[0]}</Text>
              </Pressable>
            );
          })}
        </View>
        {(members.length ? members : []).map((member) => (
          <View key={member.id} style={[styles.teamOverviewRow, { minHeight: memberRowHeight }]}>
            <Pressable style={styles.teamOverviewMemberCell} onPress={() => onOpenDay(selectedDate)}>
              <MemberAvatar member={member} size={34} />
              <Text style={styles.teamOverviewMemberName} numberOfLines={1}>{member.name}</Text>
            </Pressable>
            {overviewDates.map((date) => {
              const appointments = getAppointmentsForMember(date, member.id);
              const schedule = getScheduleForMember(date, member);
              const selected = date === selectedDate;
              return (
                <Pressable
                  key={`${member.id}-${date}`}
                  style={[styles.teamOverviewDayCell, { width: dayColumnWidth, minHeight: memberRowHeight }, !schedule.enabled && styles.summaryCardClosed, selected && styles.teamOverviewDayCellActive]}
                  onPress={() => onOpenDay(date)}
                  onLongPress={() => onCreateAt(date, member.id)}
                >
                  {appointments.slice(0, 3).map((appointment, index) => (
                    <View key={appointment.id} style={[styles.teamOverviewAppointmentBar, { backgroundColor: getAppointmentServiceColor(appointment, workspace?.services || [], index) }]}>
                      <Text style={styles.teamOverviewAppointmentText}>{appointment.startTime}</Text>
                    </View>
                  ))}
                  {appointments.length > 3 ? <Text style={styles.teamOverviewMoreText}>+{appointments.length - 3}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CalendarTimeline({
  date,
  appointments,
  services = [],
  currency,
  compact,
  schedule,
  t,
  onTimePress,
  onAppointmentPress,
  onBlockedAppointmentPress,
  onAppointmentDelete,
  onAppointmentMove,
  onAppointmentResize,
  onClosedDayPress,
  formatAppointmentServiceName,
  columnWidth,
  showTimeColumn = true,
}: {
  date: string;
  appointments: AppointmentRecord[];
  services?: ServiceRecord[];
  currency?: string;
  compact: boolean;
  schedule: WorkDayScheduleRecord;
  t: Record<string, string>;
  onTimePress: (time: string) => void;
  onAppointmentPress: (appointment: AppointmentRecord) => void;
  onBlockedAppointmentPress: (appointment: AppointmentRecord) => void;
  onAppointmentDelete: (appointment: AppointmentRecord) => void;
  onAppointmentMove: (appointment: AppointmentRecord) => void;
  onAppointmentResize: (appointment: AppointmentRecord) => void;
  onClosedDayPress?: () => void;
  formatAppointmentServiceName?: (appointment: AppointmentRecord) => string;
  columnWidth?: number;
  showTimeColumn?: boolean;
}) {
  const { width } = useWindowDimensions();
  const startHour = schedule.enabled ? 0 : 8;
  const endHour = schedule.enabled ? 23 : 22;
  const displayStartMinutes = startHour * 60;
  const displayEndMinutes = schedule.enabled ? (endHour + 1) * 60 : endHour * 60;
  const workStart = schedule.enabled ? timeToMinutes(schedule.startTime) : 9 * 60;
  const workEnd = schedule.enabled ? timeToMinutes(schedule.endTime) : 18 * 60;
  const workHourHeight = compact ? 72 : 88;
  const offHourHeight = compact ? workHourHeight / 10 : workHourHeight;
  const breakHourHeight = compact ? workHourHeight / 2.5 : workHourHeight;
  const timeColumnWidth = showTimeColumn ? CALENDAR_TIME_AXIS_WIDTH : 0;
  const effectiveWidth = columnWidth || width;
  const gridWidth = Math.max(140, effectiveWidth - timeColumnWidth);
  const laneGap = 0;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showCurrentTime = schedule.enabled && date === getTodayIso();
  const breaks = schedule.enabled ? schedule.breaks || [] : [];
  const compactBreaks = breaks
    .map((item) => ({
      start: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.startTime))),
      end: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.endTime))),
      label: `${item.startTime} - ${item.endTime}`,
    }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start);
  const compactSegments = (() => {
    if (!compact || !schedule.enabled) return [];
    const segments: Array<{ start: number; end: number; height: number }> = [];
    const pushSegment = (start: number, end: number, height: number) => {
      if (end > start) segments.push({ start, end, height });
    };
    let cursor = 0;
    pushSegment(cursor, workStart, offHourHeight);
    cursor = workStart;
    for (const item of compactBreaks) {
      pushSegment(cursor, item.start, workHourHeight);
      pushSegment(item.start, item.end, breakHourHeight);
      cursor = Math.max(cursor, item.end);
    }
    pushSegment(cursor, workEnd, workHourHeight);
    pushSegment(workEnd, 24 * 60, offHourHeight);
    return segments;
  })();
  const timelineHeight = getScaledMinuteTop(displayEndMinutes);
  const nowTop = getScaledMinuteTop(nowMinutes);
  const closedRanges = schedule.enabled
    ? [
        { start: 0, end: workStart, label: "00:00 - " + schedule.startTime, kind: "off" },
        ...compactBreaks.map((item) => ({
          start: item.start,
          end: item.end,
          label: item.label,
          kind: "break",
        })),
        { start: workEnd, end: 24 * 60, label: `${schedule.endTime} - 24:00`, kind: "off" },
      ].filter((item) => item.end > item.start)
    : [{ start: displayStartMinutes, end: displayEndMinutes, label: t.dayOffTitle, kind: "closed" }];
  const blockedAppointments = appointments
    .filter((appointment) => appointment.kind === "blocked")
    .map((appointment) => ({
      appointment,
      start: timeToMinutes(appointment.startTime),
      end: Math.max(timeToMinutes(appointment.endTime), timeToMinutes(appointment.startTime) + 10),
      label: appointment.serviceName || t.closedBySchedule,
    }));
  const regularAppointments = appointments.filter((appointment) => appointment.kind !== "blocked");
  const appointmentLayouts = regularAppointments.map((appointment) => {
    const appointmentKey = getAppointmentInstanceKey(appointment);
    const start = timeToMinutes(appointment.startTime);
    const end = Math.max(timeToMinutes(appointment.endTime), start + 5);
    const overlapping = regularAppointments
      .filter((item) => {
        const itemStart = timeToMinutes(item.startTime);
        const itemEnd = Math.max(timeToMinutes(item.endTime), itemStart + 5);
        return start < itemEnd && end > itemStart;
      })
      .sort(
        (left, right) =>
          timeToMinutes(left.startTime) - timeToMinutes(right.startTime) ||
          getAppointmentInstanceKey(left).localeCompare(getAppointmentInstanceKey(right))
      );
    const laneCount = Math.max(1, overlapping.length);
    const laneIndex = Math.max(0, overlapping.findIndex((item) => getAppointmentInstanceKey(item) === appointmentKey));
    return { appointment, appointmentKey, start, end, laneCount, laneIndex };
  });

  function getScaledMinuteTop(minutes: number) {
    const safe = Math.max(displayStartMinutes, Math.min(displayEndMinutes, minutes));
    if (!schedule.enabled) return ((safe - displayStartMinutes) / 60) * workHourHeight;
    if (!compact) return (safe / 60) * workHourHeight;
    let top = 0;
    for (const segment of compactSegments) {
      if (safe >= segment.end) {
        top += ((segment.end - segment.start) / 60) * segment.height;
      } else if (safe > segment.start) {
        top += ((safe - segment.start) / 60) * segment.height;
        break;
      } else {
        break;
      }
    }
    return top;
  }

  function getRangeHeight(start: number, end: number) {
    return Math.max(1, getScaledMinuteTop(end) - getScaledMinuteTop(start));
  }

  function isWorkingSlot(minutes: number) {
    if (!schedule.enabled || minutes < workStart || minutes >= workEnd) return false;
    return !breaks.some((item) => {
      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);
      return minutes >= start && minutes < end;
    });
  }

  return (
    <View style={[styles.timeline, { height: timelineHeight, width: effectiveWidth }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
        const hour = startHour + index;
        const rowStart = hour * 60;
        const rowEnd = (hour + 1) * 60;
        const top = getScaledMinuteTop(rowStart);
        const height = getRangeHeight(rowStart, rowEnd);
        const showLabel = height >= 18 || hour === Math.floor(workStart / 60);
        return (
          <View pointerEvents="none" key={hour} style={[styles.hourRow, { top, height }]}>
            {showTimeColumn ? (
              <Text style={[styles.hourText, !showLabel && styles.hourTextHidden]}>{showLabel ? String(hour).padStart(2, "0") : ""}</Text>
            ) : null}
            <View style={styles.hourGrid}>
              {(height >= 34 ? [0, 1, 2, 3, 4, 5, 6] : [0, 6]).map((part) => (
                <View
                  key={part}
                  style={[
                    part === 0 || part === 6 ? styles.majorLine : styles.minorLine,
                    { top: (height / 6) * part },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      })}

      {Array.from({ length: (endHour - startHour + 1) * 6 }).map((_, index) => {
        const minutes = startHour * 60 + index * 10;
        if (!isWorkingSlot(minutes)) return null;
        return (
          <Pressable
            key={minutes}
            style={[
              styles.timeSlotHitbox,
              {
                top: getScaledMinuteTop(minutes),
                left: timeColumnWidth,
                height: getRangeHeight(minutes, minutes + 10),
              },
            ]}
            onPress={() => onTimePress(formatTimeFromMinutes(minutes))}
          />
        );
      })}

      {closedRanges.map((range, index) => (
        <View
          key={`${range.start}-${range.end}-${index}`}
          pointerEvents="none"
          style={[
            styles.closedBlock,
            {
              top: getScaledMinuteTop(range.start),
              height: getRangeHeight(range.start, range.end),
              left: timeColumnWidth + 1,
            },
          ]}
        />
      ))}

      {!schedule.enabled ? (
        <Pressable
          style={[
            styles.closedDayHitbox,
            {
              top: 0,
              left: timeColumnWidth,
              height: timelineHeight,
            },
          ]}
          onPress={onClosedDayPress}
        />
      ) : null}

      {blockedAppointments.map((range) => (
        <Pressable
          key={range.appointment.id}
          style={[
            styles.closedBlock,
            styles.editableClosedBlock,
            {
              top: getScaledMinuteTop(range.start),
              height: getRangeHeight(range.start, range.end),
              left: timeColumnWidth + 1,
            },
          ]}
          onPress={() => onBlockedAppointmentPress(range.appointment)}
        >
          {getRangeHeight(range.start, range.end) >= 24 ? (
            <>
              <Text style={styles.closedBlockText}>{range.label}</Text>
              <Text style={styles.closedBlockTimeText}>{range.appointment.startTime} - {range.appointment.endTime}</Text>
            </>
          ) : null}
        </Pressable>
      ))}

      {showCurrentTime && nowTop >= 0 && nowTop <= timelineHeight ? (
        <View style={[styles.currentTimeLine, { top: nowTop, left: timeColumnWidth }]}>
          {showTimeColumn ? <View style={styles.currentTimeDot} /> : null}
        </View>
      ) : null}

      {appointmentLayouts.map(({ appointment, appointmentKey, start, end, laneCount, laneIndex }, index) => {
        const top = getScaledMinuteTop(start);
        const actualHeight = getRangeHeight(start, end);
        const visualGap = actualHeight > 8 ? 2 : 0;
        const blockTop = top + visualGap / 2;
        const height = Math.max(1, actualHeight - visualGap);
        const serviceColor = getAppointmentServiceColor(appointment, services, index);
        const color = mixHexWithWhite(serviceColor, 0.58);
        const availableWidth = gridWidth - laneGap * 2;
        const blockGap = laneCount > 1 ? 2 : 0;
        const blockWidth = laneCount > 1 ? (availableWidth - blockGap * (laneCount - 1)) / laneCount : availableWidth;
        const blockLeft = timeColumnWidth + laneGap + laneIndex * (blockWidth + blockGap);
        const isNarrowCard = blockWidth < 92;
        const isTightCard = height < 72 || isNarrowCard;
        const isVeryTightCard = height < 58 || blockWidth < 82;
        const isTinyCard = height < 44 || blockWidth < 68;
        const isCompactCard = compact || isTightCard;
        const timeLabel = isTinyCard ? appointment.startTime : `${appointment.startTime} - ${appointment.endTime}`;

        return (
          <Pressable
            key={appointmentKey}
            style={[
              styles.appointmentBlock,
              isCompactCard && styles.appointmentBlockTight,
              isVeryTightCard && styles.appointmentBlockVeryTight,
              {
                top: blockTop,
                height,
                left: blockLeft,
                width: blockWidth,
                backgroundColor: color,
                borderColor: mixHexWithWhite(serviceColor, 0.22),
              },
            ]}
            onPress={() => onAppointmentPress(appointment)}
            onLongPress={() => onAppointmentMove(appointment)}
          >
            <Text style={[styles.appointmentTime, isCompactCard && styles.appointmentTimeTight, isVeryTightCard && styles.appointmentTimeVeryTight]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.78}>
              {timeLabel}
            </Text>
            {height >= 36 ? (
              <Text style={[styles.appointmentClient, isCompactCard && styles.appointmentClientTight, isVeryTightCard && styles.appointmentClientVeryTight]} numberOfLines={1} ellipsizeMode="tail">
                {appointment.customerName || t.customer}
              </Text>
            ) : null}
            {height > 56 ? (
              <Text style={[styles.appointmentService, isCompactCard && styles.appointmentServiceTight, isVeryTightCard && styles.appointmentServiceVeryTight]} numberOfLines={1} ellipsizeMode="tail">
                {formatAppointmentServiceName ? formatAppointmentServiceName(appointment) : appointment.serviceName}
              </Text>
            ) : null}
            {height > 86 ? <Text style={styles.appointmentPrice}>{formatMoney(appointment.priceAmount, currency)}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function WorkspaceHeader({
  t,
  language,
  setLanguage,
  session,
  workspace,
  activeTab,
  setActiveTab,
  apiFetch,
  onRefreshWorkspace,
  onPatchBusiness,
  onOpenNotification,
  onOpenSettingsSection,
  onSignOut,
  trackAdsEvent,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  session: MobileSession;
  workspace: WorkspaceSnapshot | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  onPatchBusiness: (patch: Partial<WorkspaceSnapshot["business"]>) => void;
  onOpenNotification: (item: MobileNotificationRecord) => void;
  onOpenSettingsSection: (section?: MobileSettingsSection) => void;
  onSignOut: () => void;
  trackAdsEvent: (eventName: MobileAdsEventName, payload?: Record<string, string | number | boolean | null | undefined>) => void;
}) {
  const title = activeTab === "calendar" ? t.calendarHeaderTitle : t[activeTab];
  const [panel, setPanel] = useState<"setup" | "share" | "support" | "notifications" | "account" | "profile" | "subscription" | "language" | "help" | "deleteAccount" | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [deleteAccountStep, setDeleteAccountStep] = useState<"intro" | "confirm">("intro");
  const [deleteAccountUnderstood, setDeleteAccountUnderstood] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [supportTicketId, setSupportTicketId] = useState("");
  const [supportStatus, setSupportStatus] = useState("");
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([
    { id: "hello", role: "bot", text: t.supportGreeting },
  ]);
  const supportLastMessageCreatedAtRef = useRef("");
  const supportPollingRef = useRef(false);
  const [notifications, setNotifications] = useState<MobileNotificationsPayload>({});
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationActionId, setNotificationActionId] = useState("");
  const [busy, setBusy] = useState(false);
  const bookingToggleRequestRef = useRef(0);
  const publicBookingUrl = workspace?.business.publicBookingUrl || "";
  const onlineBookingEnabled = workspace?.business.allowOnlineBooking === true;
  const headerHasPremium = isPremiumActive(workspace?.professional);
  const premiumStatusLabel = getPremiumStatusLabel(workspace?.professional, t);
  const accountDisplayName = getCalendarMemberDisplayName(workspace?.professional || session, session.displayName);
  const accountInitial = accountDisplayName.slice(0, 1).toUpperCase() || "T";
  const accountAvatarUrl = safeText(workspace?.professional.avatarUrl).trim();
  const appVersion = getMobileAppVersion();
  const headerBookingCredits = workspace?.bookingCredits || {
    total: 100,
    used: 0,
    remaining: 100,
  };
  const headerBookingLimitPercent = headerBookingCredits.total > 0
    ? Math.min(100, Math.round((headerBookingCredits.used / headerBookingCredits.total) * 100))
    : 0;
  const businessHasPhoto = Boolean(workspace?.business.photos?.some((photo) => photo.status !== "blocked"));
  const setupItems = [
    { id: "services", title: t.setupServices, done: Boolean(workspace?.services?.length), icon: "pricetag-outline" as const },
    { id: "schedule", title: t.setupSchedule, done: Boolean(workspace?.memberSchedule?.workSchedule || workspace?.memberSchedule?.customSchedule), icon: "time-outline" as const },
    { id: "booking", title: t.setupBooking, done: onlineBookingEnabled, icon: "cloud-upload-outline" as const },
    { id: "photos", title: t.setupPhoto, done: businessHasPhoto, icon: "image-outline" as const },
    { id: "telegram", title: t.setupTelegram, done: Boolean(workspace?.telegram?.connected), icon: "chatbubble-ellipses-outline" as const },
  ];
  const setupDone = setupItems.filter((item) => item.done).length;
  const setupMissingCount = setupItems.length - setupDone;
  const setupComplete = setupMissingCount === 0;
  const setupHintText = setupComplete
    ? t.setupCompleteText
    : !workspace?.services?.length
      ? t.setupFirstServiceText
      : (t.setupRemaining || t.setupAssistantText).replace("{count}", String(setupMissingCount));
  const visibleAppNotifications = (notifications.appNotifications || []).filter(
    (item) => item.type !== "online_booking" && item.type !== "team_join_request"
  );
  const unreadAppNotificationCount = visibleAppNotifications.filter((item) => !item.readAt).length;
  const pendingCount =
    (notifications.pendingOnlineBookings?.length || 0) +
    (notifications.pendingJoinRequests?.length || 0) +
    unreadAppNotificationCount;

  const panelTitles: Record<NonNullable<typeof panel>, string> = {
    setup: setupComplete ? t.setupCompleteTitle : t.setupAssistant,
    share: t.bookingPage,
    support: t.support || t.supportTitle,
    notifications: t.reminders,
    account: t.accountMenu || t.settings,
    profile: t.profile || "Profile",
    subscription: t.subscription || t.premiumSubscription || "Subscription",
    language: t.language || "Language",
    help: t.helpSupport || "Help & Legal",
    deleteAccount: t.deleteAccountTitle || "Delete account",
  };

  function mergeSupportMessages(current: SupportChatMessage[], incoming: SupportChatMessage[]) {
    const seen = new Set(current.map((message) => message.id));
    const merged = [...current];
    incoming.forEach((message) => {
      if (!message.text.trim() || seen.has(message.id)) return;
      seen.add(message.id);
      merged.push(message);
    });
    return merged.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return leftTime - rightTime;
    });
  }

  async function loadSupportMessages(ticketId = supportTicketId, options: { replace?: boolean } = {}) {
    if (!ticketId || supportPollingRef.current) return;
    supportPollingRef.current = true;
    try {
      const params = new URLSearchParams({ ticketId, includeUser: "1" });
      if (!options.replace && supportLastMessageCreatedAtRef.current) {
        params.set("after", supportLastMessageCreatedAtRef.current);
      }
      const payload = await apiFetch(`/api/mobile/pro/support?${params.toString()}`);
      const incoming = (Array.isArray(payload?.messages) ? payload.messages : [])
        .map((item: any): SupportChatMessage => ({
          id: String(item.id || createLocalId("support")),
          role: item.role === "user" ? "user" : "bot",
          text: String(item.text || ""),
          createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
        }))
        .filter((item: SupportChatMessage) => item.text.trim());

      if (incoming.length) {
        const sortedCreatedAt = incoming
          .map((item: SupportChatMessage) => item.createdAt || "")
          .filter(Boolean)
          .sort();
        const latest = sortedCreatedAt[sortedCreatedAt.length - 1];
        if (latest) supportLastMessageCreatedAtRef.current = latest;
        setSupportMessages((current) => mergeSupportMessages(options.replace ? [{ id: "hello", role: "bot", text: t.supportGreeting }] : current, incoming));
      } else if (options.replace) {
        setSupportMessages([{ id: "hello", role: "bot", text: t.supportGreeting }]);
      }
    } catch {
      // Support polling is best-effort and should never interrupt the workspace.
    } finally {
      supportPollingRef.current = false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    supportLastMessageCreatedAtRef.current = "";
    setSupportMessages([{ id: "hello", role: "bot", text: t.supportGreeting }]);
    AsyncStorage.getItem(`${SUPPORT_TICKET_KEY_PREFIX}${session.professionalId}`)
      .then((storedTicketId) => {
        if (cancelled) return;
        const nextTicketId = storedTicketId || "";
        setSupportTicketId(nextTicketId);
        if (nextTicketId) {
          void loadSupportMessages(nextTicketId, { replace: true });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [session.professionalId, t.supportGreeting]);

  useEffect(() => {
    if (panel !== "support" || !supportTicketId) return;
    void loadSupportMessages(supportTicketId);
    const intervalId = setInterval(() => void loadSupportMessages(supportTicketId), 8000);
    return () => clearInterval(intervalId);
  }, [panel, supportTicketId]);

  async function loadNotifications(options: { spinner?: boolean } = {}) {
    if (options.spinner) setLoadingNotifications(true);
    try {
      const payload = await apiFetch("/api/mobile/pro/calendar?mode=notifications");
      setNotifications(payload || {});
      return payload;
    } catch {
      if (options.spinner) setNotifications({});
      return null;
    } finally {
      if (options.spinner) setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (cancelled) return;
      await loadNotifications();
    };
    void refresh();
    const intervalId = setInterval(() => void refresh(), 12000);
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void refresh();
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      void refresh();
      setPanel("notifications");
    });
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [session.professionalId, session.token]);

  async function openPanel(nextPanel: typeof panel) {
    setPanel(nextPanel);
    if (nextPanel === "notifications") {
      await loadNotifications({ spinner: true });
    }
  }

  async function togglePublicBooking() {
    if (!headerHasPremium) {
      setPanel(null);
      setActiveTab("settings");
      onOpenSettingsSection("online");
      return;
    }
    const previousValue = onlineBookingEnabled;
    const nextValue = !previousValue;
    const requestId = bookingToggleRequestRef.current + 1;
    bookingToggleRequestRef.current = requestId;
    onPatchBusiness({ allowOnlineBooking: nextValue });
    setBusy(true);
    try {
      const payload = await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ business: { allowOnlineBooking: nextValue } }),
      });
      if (bookingToggleRequestRef.current !== requestId) return;
      if (typeof payload?.workspace?.business?.allowOnlineBooking === "boolean") {
        onPatchBusiness({ allowOnlineBooking: payload.workspace.business.allowOnlineBooking });
      }
      void onRefreshWorkspace();
    } catch (error) {
      if (bookingToggleRequestRef.current !== requestId) return;
      onPatchBusiness({ allowOnlineBooking: previousValue });
      Alert.alert(t.bookingPage, error instanceof Error ? error.message : t.supportFailed);
    } finally {
      if (bookingToggleRequestRef.current === requestId) {
        setBusy(false);
      }
    }
  }

  async function shareBookingPage() {
    if (!publicBookingUrl) return;
    await Share.share({ message: publicBookingUrl, url: publicBookingUrl }).catch(() => undefined);
  }

  async function openBookingPage() {
    if (!publicBookingUrl) return;
    await Linking.openURL(publicBookingUrl).catch(() => undefined);
  }

  async function saveAccountLanguage(nextLanguage: AppLanguage) {
    const previousLanguage = language;
    setLanguage(nextLanguage);
    setPanel("account");
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ professional: { language: nextLanguage } }),
      });
      void onRefreshWorkspace();
    } catch (error) {
      setLanguage(previousLanguage);
      Alert.alert(t.language || "Language", error instanceof Error ? error.message : t.supportFailed);
    } finally {
      setBusy(false);
    }
  }

  async function sendSupportMessage() {
    const message = supportMessage.trim();
    if (!message) return;
    const optimisticId = createLocalId("support-user");
    setBusy(true);
    setSupportStatus("");
    setSupportMessage("");
    setSupportMessages((current) => [
      ...current,
      { id: optimisticId, role: "user", text: message, createdAt: new Date().toISOString(), status: "sending" },
    ]);
    try {
      const payload = await apiFetch("/api/mobile/pro/support", {
        method: "POST",
        body: JSON.stringify({ message, ticketId: supportTicketId, language, page: "mobile-app" }),
      });
      const nextTicketId = String(payload?.ticketId || supportTicketId || "");
      if (nextTicketId) {
        setSupportTicketId(nextTicketId);
        await AsyncStorage.setItem(`${SUPPORT_TICKET_KEY_PREFIX}${session.professionalId}`, nextTicketId).catch(() => undefined);
      }
      const savedMessage = payload?.message;
      if (savedMessage?.id) {
        const nextCreatedAt = typeof savedMessage.createdAt === "string" ? savedMessage.createdAt : new Date().toISOString();
        supportLastMessageCreatedAtRef.current = nextCreatedAt;
        setSupportMessages((current) =>
          current.map((item) =>
            item.id === optimisticId
              ? {
                  id: String(savedMessage.id),
                  role: "user",
                  text: String(savedMessage.text || message),
                  createdAt: nextCreatedAt,
                }
              : item
          )
        );
      } else {
        setSupportMessages((current) => current.map((item) => (item.id === optimisticId ? { ...item, status: undefined } : item)));
      }
      setSupportStatus(t.supportSent);
      trackAdsEvent("support_message_sent", {
        source: "mobile_support",
        ticket_id: nextTicketId || supportTicketId || ""
      });
      if (nextTicketId) {
        void loadSupportMessages(nextTicketId);
      }
    } catch {
      setSupportMessages((current) => current.map((item) => (item.id === optimisticId ? { ...item, status: "failed" } : item)));
      setSupportStatus(t.supportFailed);
    } finally {
      setBusy(false);
    }
  }

  async function openLegalPage(target: string) {
    const url = target.startsWith("http") ? target : `${API_BASE_URL}/${language}${target}?source=${MOBILE_PLATFORM_SOURCE}`;
    await openLegalUrl(url);
  }

  function openDeleteAccountFlow() {
    setDeleteAccountStep("intro");
    setDeleteAccountUnderstood(false);
    setDeleteAccountConfirm("");
    setPanel("deleteAccount");
  }

  async function deleteAccount() {
    if (!deleteAccountUnderstood || deleteAccountConfirm.trim() !== "DELETE" || busy) return;
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/account", { method: "DELETE" });
      await onSignOut();
    } catch (error) {
      Alert.alert(t.deleteAccountTitle || "Delete account", error instanceof Error ? error.message : t.deleteAccountFailed || "Could not delete account.");
    } finally {
      setBusy(false);
    }
  }

  function confirmSignOut() {
    Alert.alert(t.signOut || "Log out", t.signOutConfirm || "Выйти из аккаунта?", [
      { text: t.cancel || "Cancel", style: "cancel" },
      {
        text: t.signOut || "Log out",
        style: "default",
        onPress: () => {
          setPanel(null);
          void onSignOut();
        },
      },
    ]);
  }

  function openAppNotification(item: MobileAppNotificationRecord) {
    if (!item.readAt) {
      const readAt = new Date().toISOString();
      setNotifications((current) => ({
        ...current,
        appNotifications: (current.appNotifications || []).map((notification) =>
          notification.id === item.id ? { ...notification, readAt } : notification
        )
      }));
      apiFetch("/api/mobile/pro/notifications", {
        method: "PATCH",
        body: JSON.stringify({ ids: [item.id] })
      }).catch(() => undefined);
    }

    if (item.type === "team_join_request") {
      openJoinRequestsFromNotification();
    } else if (item.type === "team_invitation") {
      setActiveTab("staff");
    }
  }

  function openJoinRequestsFromNotification() {
    setNotifications((current) => ({ ...current, pendingJoinRequests: [] }));
    apiFetch("/api/mobile/pro/join-requests", { method: "PATCH" }).catch(() => undefined);
    setActiveTab("settings");
    onOpenSettingsSection("general");
  }

  function moveOnlineBookingNotificationToArchive(item: MobileNotificationRecord, status: "confirmed" | "cancelled") {
    const updatedItem = { ...item, status };
    setNotifications((current) => ({
      ...current,
      pendingOnlineBookings: (current.pendingOnlineBookings || []).filter((notification) => notification.id !== item.id),
      archivedOnlineBookings: [
        updatedItem,
        ...(current.archivedOnlineBookings || []).filter((notification) => notification.id !== item.id),
      ].slice(0, 12),
    }));
  }

  async function handleOnlineBookingAction(item: MobileNotificationRecord, action: "confirm" | "cancel") {
    const appointmentId = safeText(item.appointmentId).trim();
    if (!appointmentId) {
      onOpenNotification(item);
      return;
    }

    const actionKey = `${action}:${item.id}`;
    setNotificationActionId(actionKey);
    moveOnlineBookingNotificationToArchive(item, action === "confirm" ? "confirmed" : "cancelled");

    try {
      if (action === "confirm") {
        await apiFetch("/api/mobile/pro/calendar", {
          method: "PATCH",
          body: JSON.stringify({
            mode: "meta",
            appointmentId,
            bookingId: item.bookingId,
            targetProfessionalId: item.professionalId,
            attendance: "confirmed",
          }),
        });
      } else {
        const target = item.professionalId ? `&targetProfessionalId=${encodeURIComponent(item.professionalId)}` : "";
        const booking = item.bookingId ? `&bookingId=${encodeURIComponent(item.bookingId)}` : "";
        await apiFetch(`/api/mobile/pro/calendar?appointmentId=${encodeURIComponent(appointmentId)}${target}${booking}`, { method: "DELETE" });
      }

      await loadNotifications();
      onRefreshWorkspace();
    } catch (error) {
      await loadNotifications();
      Alert.alert("Timviz", error instanceof Error ? error.message : action === "confirm" ? t.confirmBooking || t.statusConfirmed : t.cancelBooking || t.statusCancelled);
    } finally {
      setNotificationActionId((current) => (current === actionKey ? "" : current));
    }
  }

  function renderPanel() {
    if (!panel) return null;
    const close = () => setPanel(null);
    const panelContent = (
      <View style={styles.headerPanel}>
            <View style={styles.sheetHandle} />
            <View style={styles.headerPanelTop}>
              <View style={styles.headerPanelTitleStack}>
                <Text style={styles.headerPanelEyebrow}>Timviz</Text>
                <Text style={styles.headerPanelTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
                  {panel ? panelTitles[panel] : t.settings}
                </Text>
              </View>
              <Pressable style={styles.headerPanelClose} onPress={close}>
                <Ionicons name="close" size={21} color="#0F172A" />
              </Pressable>
            </View>

            {panel === "setup" ? (
              <View style={styles.headerPanelBody}>
                <Text style={styles.panelHint}>{setupHintText}</Text>
                <View style={[styles.setupProgressRow, setupComplete && styles.setupProgressRowDone]}>
                  <Text style={styles.setupProgressTitle}>{t.setupProgress}</Text>
                  <View style={styles.setupProgressValueRow}>
                    {setupComplete ? <Text style={styles.setupReadyBadge}>{t.ready}</Text> : null}
                    <Text style={styles.setupProgressValue}>{setupDone}/{setupItems.length}</Text>
                  </View>
                </View>
                {setupComplete ? (
                  <View style={styles.headerPanelActions}>
                    <Pressable style={styles.headerGhostButton} onPress={shareBookingPage} disabled={!publicBookingUrl}>
                      <Text style={styles.headerGhostButtonText}>{t.copyLink}</Text>
                    </Pressable>
                    <Pressable style={styles.headerPrimaryButton} onPress={openBookingPage} disabled={!publicBookingUrl}>
                      <Text style={styles.headerPrimaryButtonText}>{t.openPage}</Text>
                    </Pressable>
                  </View>
                ) : null}
                {setupItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.setupStep, item.done && styles.setupStepDone]}
                    onPress={() => {
                      if (item.id === "services") setActiveTab("services");
                      if (item.id === "booking") onOpenSettingsSection("online");
                      if (item.id === "photos") onOpenSettingsSection("general");
                      if (item.id === "telegram") onOpenSettingsSection("telegram");
                      if (item.id === "schedule") onOpenSettingsSection("schedule");
                      close();
                    }}
                  >
                    <View style={[styles.setupStepIcon, item.done && styles.setupStepIconDone]}>
                      <Ionicons name={item.done ? "checkmark" : item.icon} size={18} color={item.done ? "#FFFFFF" : "#6D4AFF"} />
                    </View>
                    <Text style={styles.setupStepText}>{item.title}</Text>
                    {item.done ? <Text style={styles.setupDoneText}>{t.ready}</Text> : <Ionicons name="chevron-forward" size={18} color="#94A3B8" />}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {panel === "share" ? (
              <View style={styles.headerPanelBody}>
                <Text style={styles.panelHint}>{t.bookingPageText}</Text>
                <Pressable style={styles.shareToggleRow} onPress={togglePublicBooking} disabled={!workspace}>
                  <View>
                    <Text style={styles.shareToggleTitle}>{onlineBookingEnabled ? t.onlineBookingOn : t.onlineBookingOff}</Text>
                    <Text style={styles.clientOptionCaption}>{workspace?.business.name || "Timviz"}</Text>
                  </View>
                  <View style={[styles.mobileSwitch, onlineBookingEnabled && styles.mobileSwitchActive]}>
                    <View style={[styles.mobileSwitchThumb, onlineBookingEnabled && styles.mobileSwitchThumbActive]} />
                  </View>
                </Pressable>
                <TextInput value={publicBookingUrl} editable={false} style={styles.shareUrlInput} />
                <View style={styles.headerPanelActions}>
                  <Pressable style={styles.headerGhostButton} onPress={openBookingPage} disabled={!publicBookingUrl}>
                    <Text style={styles.headerGhostButtonText}>{t.openPage}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.headerPrimaryButton}
                    onPress={
                      publicBookingUrl
                        ? shareBookingPage
                        : () => {
                            setPanel(null);
                            setActiveTab("settings");
                            onOpenSettingsSection("online");
                          }
                    }
                  >
                    <Text style={styles.headerPrimaryButtonText}>{publicBookingUrl ? t.sharePage : t.settingsOnline}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {panel === "support" ? (
              <View style={styles.headerPanelKeyboard}>
                <ScrollView
                  style={styles.headerPanelScrollBody}
                  contentContainerStyle={styles.supportPanelContent}
                  keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.supportGuideCard}>
                    <Text style={styles.supportGuideTitle}>{t.supportGuideTitle}</Text>
                    <Text style={styles.panelHint}>{t.supportGuideText}</Text>
                    {supportTicketId ? <Text style={styles.supportTicket}>{supportTicketId}</Text> : null}
                  </View>
                  <View style={styles.supportMessagesStack}>
                    {supportMessages.map((item) => (
                      <Text
                        key={item.id}
                        style={[
                          styles.supportBubble,
                          item.role === "user" && styles.supportBubbleUser,
                          item.status === "failed" && styles.supportBubbleFailed,
                        ]}
                      >
                        {item.text}
                      </Text>
                    ))}
                  </View>
                  <TextInput
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    placeholder={t.supportPlaceholder}
                    multiline
                    style={styles.supportInput}
                  />
                  {supportStatus ? <Text style={styles.supportStatusText}>{supportStatus}</Text> : null}
                </ScrollView>
                <View style={styles.supportPanelFooter}>
                  <Pressable style={[styles.headerPrimaryButton, styles.headerPrimaryButtonFull, busy && styles.disabled]} onPress={sendSupportMessage} disabled={busy}>
                    <Text style={styles.headerPrimaryButtonText}>{t.supportSend}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {panel === "notifications" ? (
              <ScrollView style={styles.headerPanelBody} showsVerticalScrollIndicator={false}>
                <View style={styles.notificationHeading}>
                  <View style={styles.notificationHeadingTextStack}>
                    <Text style={styles.notificationHeadingText}>{t.notificationsNew}</Text>
                    <Text style={styles.notificationHeadingCaption}>{t.notificationPendingBookings}</Text>
                  </View>
                  <Text style={styles.notificationBadgeText}>{pendingCount}</Text>
                </View>
                {loadingNotifications ? <ActivityIndicator color="#6D4AFF" /> : null}
                {!loadingNotifications && !(notifications.pendingOnlineBookings?.length || notifications.pendingJoinRequests?.length || visibleAppNotifications.length) ? (
                  <View style={styles.notificationEmptyCard}>
                    <Text style={styles.notificationCardTitle}>{t.reminders}</Text>
                    <Text style={styles.clientOptionCaption}>{t.notificationEmpty}</Text>
                  </View>
                ) : null}
                {visibleAppNotifications.map((item) => (
                  <AppNotificationCard
                    key={item.id}
                    item={item}
                    language={language}
                    onPress={() => {
                      close();
                      openAppNotification(item);
                    }}
                  />
                ))}
                {(notifications.pendingJoinRequests || []).map((item) => (
                  <JoinRequestNotificationCard
                    key={item.id}
                    item={item}
                    t={t}
                    language={language}
                    onPress={() => {
                      close();
                      openJoinRequestsFromNotification();
                    }}
                  />
                ))}
                {(notifications.pendingOnlineBookings || []).map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    t={t}
                    language={language}
                    services={workspace?.services || []}
                    onConfirm={() => void handleOnlineBookingAction(item, "confirm")}
                    onCancel={() => void handleOnlineBookingAction(item, "cancel")}
                    actionBusy={notificationActionId === `confirm:${item.id}` || notificationActionId === `cancel:${item.id}`}
                    onPress={() => {
                      close();
                      onOpenNotification(item);
                    }}
                  />
                ))}
                <View style={styles.notificationHeading}>
                  <Text style={styles.notificationHeadingText}>{t.notificationsArchive}</Text>
                  <Text style={styles.notificationBadgeText}>{notifications.archivedOnlineBookings?.length || 0}</Text>
                </View>
                {(notifications.archivedOnlineBookings || []).map((item) => (
                  <NotificationCard key={item.id} item={item} t={t} language={language} services={workspace?.services || []} />
                ))}
              </ScrollView>
            ) : null}

            {panel === "account" ? (
              <ScrollView style={styles.headerPanelBody} showsVerticalScrollIndicator={false}>
                <View style={styles.accountMenuHeader}>
                  <View style={styles.accountAvatarLarge}>
                    {accountAvatarUrl ? (
                      <Image source={{ uri: accountAvatarUrl }} style={styles.accountAvatarLargeImage} />
                    ) : (
                      <Text style={styles.accountAvatarLargeText}>{accountInitial}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.accountName}>{accountDisplayName}</Text>
                    <Text style={styles.clientOptionCaption}>{workspace?.business.name || session.email}</Text>
                    <Text style={styles.accountPlanText}>{headerHasPremium ? "Premium active" : "Free"}</Text>
                  </View>
                </View>
                <View style={styles.accountBookingCard}>
                  <View style={styles.bookingLimitHeader}>
                    <Text style={styles.bookingLimitTitle}>{t.bookingLimitTitle || "This month's appointments"}</Text>
                    <Text style={styles.bookingLimitValue}>
                      {headerHasPremium ? t.unlimitedShort || "unlim" : `${headerBookingCredits.remaining}/${headerBookingCredits.total}`}
                    </Text>
                  </View>
                  <View style={styles.bookingLimitTrack}>
                    <View style={[styles.bookingLimitTrackFill, { width: headerHasPremium ? "100%" : `${headerBookingLimitPercent}%` }]} />
                  </View>
                  <Text style={styles.bookingLimitHint}>
                    {headerHasPremium ? t.bookingLimitPremiumText || "Premium does not spend appointment credits." : t.bookingLimitFreeText || "Free includes 100 appointments per month."}
                  </Text>
                  {!headerHasPremium ? (
                    <Pressable style={styles.accountUpgradeButton} onPress={() => { close(); setActiveTab("settings"); onOpenSettingsSection("general"); }}>
                      <Text style={styles.accountUpgradeText}>{t.upgradePlan || t.premiumSubscribe || "Upgrade"}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <AccountMenuRow icon="person-outline" title={t.profile || "Profile"} onPress={() => setPanel("profile")} />
                <AccountMenuRow icon="card-outline" title={t.subscription || t.premiumSubscription || "Subscription"} onPress={() => setPanel("subscription")} />
                <AccountMenuRow icon="business-outline" title={t.company || t.companySettings || "Company"} onPress={() => { close(); setActiveTab("settings"); onOpenSettingsSection("general"); }} />
                <AccountMenuRow icon="language-outline" title={t.language || "Language"} value={languageDisplayNames[language]} onPress={() => setPanel("language")} />
                <AccountMenuRow icon="help-circle-outline" title={t.helpSupport || "Help & Legal"} onPress={() => setPanel("help")} />
                <Pressable style={styles.accountLogout} onPress={confirmSignOut}>
                  <Ionicons name="log-out-outline" size={20} color="#64748B" />
                  <Text style={styles.accountLogoutText}>{t.signOut}</Text>
                </Pressable>
                <Text style={styles.accountVersionText}>Timviz v{appVersion}</Text>
              </ScrollView>
            ) : null}

            {panel === "profile" ? (
              <ScrollView style={styles.headerPanelBody} showsVerticalScrollIndicator={false}>
                <View style={styles.accountMenuHeader}>
                  <View style={styles.accountAvatarLarge}>
                    {accountAvatarUrl ? <Image source={{ uri: accountAvatarUrl }} style={styles.accountAvatarLargeImage} /> : <Text style={styles.accountAvatarLargeText}>{accountInitial}</Text>}
                  </View>
                  <View style={styles.accountHeaderText}>
                    <Text style={styles.accountName}>{accountDisplayName}</Text>
                    <Text style={styles.clientOptionCaption}>{session.email}</Text>
                    {workspace?.professional.phone ? <Text style={styles.clientOptionCaption}>{workspace.professional.phone}</Text> : null}
                  </View>
                </View>
                <AccountInfoRow label={t.firstName || "Name"} value={workspace?.professional.firstName || accountDisplayName} />
                <AccountInfoRow label={t.email || "Email"} value={workspace?.professional.email || session.email} />
                {workspace?.professional.phone ? <AccountInfoRow label={t.phone || "Phone"} value={workspace.professional.phone} /> : null}
                <AccountMenuRow icon="create-outline" title={t.companySettings || t.settingsGeneral} onPress={() => { close(); setActiveTab("settings"); onOpenSettingsSection("general"); }} />
                <Text style={styles.accountMenuLabel}>{t.dangerZone || "Danger zone"}</Text>
                <AccountMenuRow icon="trash-outline" title={t.deleteAccount || "Delete account"} danger onPress={openDeleteAccountFlow} />
              </ScrollView>
            ) : null}

            {panel === "subscription" ? (
              <View style={styles.headerPanelBody}>
                <View style={styles.accountBookingCard}>
                  <Text style={styles.bookingLimitTitle}>{headerHasPremium ? "PRO active" : t.premiumSubscription || "Timviz Premium"}</Text>
                  <Text style={styles.bookingLimitHint}>{premiumStatusLabel || (headerHasPremium ? "Your PRO plan is active." : t.premiumFeatureOnlineText || "")}</Text>
                  {!headerHasPremium ? (
                    <Pressable style={styles.headerPrimaryButton} onPress={() => { close(); setActiveTab("settings"); onOpenSettingsSection("general"); }}>
                      <Text style={styles.headerPrimaryButtonText}>{t.premiumSubscribe || t.upgradePlan || "Subscribe"}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {panel === "language" ? (
              <View style={styles.headerPanelBody}>
                {SUPPORTED_APP_LANGUAGES.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.accountLanguageListItem, language === item && styles.accountLanguageListItemActive]}
                    onPress={() => void saveAccountLanguage(item)}
                  >
                    <Text style={[styles.accountLanguageText, language === item && styles.accountLanguageTextActive]}>{languageDisplayNames[item]}</Text>
                    {language === item ? <Ionicons name="checkmark" size={20} color="#6D4AFF" /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {panel === "help" ? (
              <View style={styles.headerPanelBody}>
                <AccountMenuRow icon="chatbubble-ellipses-outline" title={t.support || t.supportTitle || "Support"} onPress={() => setPanel("support")} />
                <AccountMenuRow icon="document-text-outline" title={t.termsOfUse || "Terms of Use"} onPress={() => void openLegalPage(LEGAL_URLS.terms)} />
                <AccountMenuRow icon="shield-checkmark-outline" title={t.privacyPolicy || "Privacy Policy"} onPress={() => void openLegalPage(LEGAL_URLS.privacy)} />
                <AccountMenuRow icon="receipt-outline" title={t.subscriptionTerms || "Subscription Terms"} onPress={() => void openLegalPage(LEGAL_URLS.subscriptionTerms)} />
                <AccountMenuRow icon="return-down-back-outline" title={t.refundPolicy || "Refund Policy"} onPress={() => void openLegalPage(LEGAL_URLS.refundPolicy)} />
                <AccountMenuRow icon="trash-outline" title={t.accountDeletion || "Account deletion"} danger onPress={openDeleteAccountFlow} />
              </View>
            ) : null}

            {panel === "deleteAccount" ? (
              <ScrollView style={styles.headerPanelBody} showsVerticalScrollIndicator={false}>
                {deleteAccountStep === "intro" ? (
                  <>
                    <Text style={styles.panelHint}>{t.deleteAccountIntroText || t.deleteAccountText}</Text>
                    <View style={styles.deleteAccountInfoCard}>
                      <Text style={styles.deleteAccountInfoTitle}>{t.deleteAccountIntroTitle || "What will be deleted"}</Text>
                      <Text style={styles.panelHint}>{t.deleteAccountRemovedItems || ""}</Text>
                      <Text style={styles.panelHint}>{t.deleteAccountKeptItems || ""}</Text>
                    </View>
                    <View style={styles.headerPanelActions}>
                      <Pressable style={styles.headerGhostButton} onPress={() => setPanel("profile")}>
                        <Text style={styles.headerGhostButtonText}>{t.cancel}</Text>
                      </Pressable>
                      <Pressable style={styles.headerPrimaryButton} onPress={() => setDeleteAccountStep("confirm")}>
                        <Text style={styles.headerPrimaryButtonText}>{t.continue || "Continue"}</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <Pressable style={styles.deleteCheckRow} onPress={() => setDeleteAccountUnderstood((value) => !value)}>
                      <View style={[styles.deleteCheckbox, deleteAccountUnderstood && styles.deleteCheckboxActive]}>
                        {deleteAccountUnderstood ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                      </View>
                      <Text style={styles.deleteCheckText}>{t.deletionUnderstand || "I understand this action cannot be undone"}</Text>
                    </Pressable>
                    <TextInput
                      value={deleteAccountConfirm}
                      onChangeText={setDeleteAccountConfirm}
                      placeholder={t.deleteAccountConfirmPlaceholder || "DELETE"}
                      autoCapitalize="characters"
                      style={styles.supportInput}
                    />
                    <Pressable
                      style={[styles.headerPrimaryButton, styles.headerPrimaryButtonFull, styles.deleteConfirmButton, (!deleteAccountUnderstood || deleteAccountConfirm.trim() !== "DELETE") && styles.disabled]}
                      onPress={() => void deleteAccount()}
                      disabled={!deleteAccountUnderstood || deleteAccountConfirm.trim() !== "DELETE" || busy}
                    >
                      <Text style={styles.headerPrimaryButtonText}>{t.deleteAccount || "Delete account"}</Text>
                    </Pressable>
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
    );

    return (
      <Modal transparent visible animationType="slide" onRequestClose={close}>
        {panel === "support" ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={styles.headerPanelBackdrop}
          >
            {panelContent}
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.headerPanelBackdrop}>{panelContent}</View>
        )}
      </Modal>
    );
  }

  return (
    <View style={styles.nativeHeader}>
      <View style={styles.headerTitleStack}>
        <Text style={styles.nativeHeaderTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.nativeHeaderActions}>
        {setupMissingCount ? (
          <AppIconButton icon="rocket" active={panel === "setup"} badge={setupMissingCount} badgeTone="red" onPress={() => void openPanel("setup")} />
        ) : null}
        <AppIconButton icon="cloud-upload-outline" active={panel === "share"} onPress={() => void openPanel("share")} />
        <AppIconButton icon="chatbubble-ellipses-outline" tone="cyan" active={panel === "support"} onPress={() => void openPanel("support")} />
        <AppIconButton icon="notifications-outline" active={panel === "notifications"} badge={pendingCount} onPress={() => void openPanel("notifications")} />
        <Pressable style={styles.profilePill} onPress={() => void openPanel("account")}>
          <View style={styles.smallAvatar}>
            {accountAvatarUrl ? (
              <Image source={{ uri: accountAvatarUrl }} style={styles.smallAvatarImage} />
            ) : (
              <Text style={styles.smallAvatarText}>{accountInitial}</Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={12} color="#64748B" />
        </Pressable>
      </View>
      {renderPanel()}
    </View>
  );
}

function AccountMenuRow({
  icon,
  title,
  value,
  danger,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.accountMenuItem, pressed && styles.pressablePressed]} onPress={onPress}>
      <View style={styles.accountMenuItemLeft}>
        <Ionicons name={icon} size={21} color={danger ? "#E11D48" : "#64748B"} />
        <Text style={[styles.accountMenuItemText, danger && styles.accountDangerText]}>{title}</Text>
      </View>
      <View style={styles.accountMenuItemRight}>
        {value ? <Text style={styles.accountMenuItemValue} numberOfLines={1}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </Pressable>
  );
}

function AccountInfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.accountInfoRow}>
      <Text style={styles.accountInfoLabel}>{label}</Text>
      <Text style={styles.accountInfoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function AppIconButton({
  icon,
  active,
  tone,
  badge,
  badgeTone,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  active?: boolean;
  tone?: "cyan";
  badge?: number;
  badgeTone?: "red";
  onPress?: () => void;
}) {
  const doneIcon = icon === "checkmark";
  return (
    <Pressable onPress={onPress} style={[styles.headerIconButton, doneIcon && styles.headerIconButtonDone, active && styles.headerIconButtonActive, tone === "cyan" && styles.headerIconButtonCyan]}>
      <Ionicons name={icon} size={18} color={active ? DESIGN.colors.primary : doneIcon ? "#16A34A" : tone === "cyan" ? "#0891B2" : "#432C75"} />
      {badge ? (
        <View style={[styles.headerIconBadge, badgeTone === "red" && styles.headerIconBadgeRed]}>
          <Text style={styles.headerIconBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function getAppNotificationIcon(type: MobileAppNotificationRecord["type"]): ComponentProps<typeof Ionicons>["name"] {
  if (type === "team_invitation") return "people-outline";
  if (type === "team_join_request") return "person-add-outline";
  if (type === "online_booking") return "calendar-outline";
  return "megaphone-outline";
}

function AppNotificationCard({
  item,
  language,
  onPress,
}: {
  item: MobileAppNotificationRecord;
  language: AppLanguage;
  onPress?: () => void;
}) {
  const createdDate = item.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return (
    <Pressable style={[styles.notificationCard, !item.readAt && styles.notificationCardUnread]} onPress={onPress} disabled={!onPress}>
      <View style={styles.notificationCardHeader}>
        <View style={styles.notificationTitleRow}>
          <Ionicons name={getAppNotificationIcon(item.type)} size={17} color="#6D4AFF" />
          <Text style={styles.notificationCardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.clientOptionCaption}>{formatShortDate(createdDate, language)}</Text>
      </View>
      {item.body ? <Text style={styles.notificationService}>{item.body}</Text> : null}
    </Pressable>
  );
}

function JoinRequestNotificationCard({
  item,
  t,
  language,
  onPress,
}: {
  item: NonNullable<MobileNotificationsPayload["pendingJoinRequests"]>[number];
  t: Record<string, string>;
  language: AppLanguage;
  onPress?: () => void;
}) {
  const createdDate = item.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return (
    <Pressable style={styles.notificationCard} onPress={onPress} disabled={!onPress}>
      <View style={styles.notificationCardHeader}>
        <View style={styles.notificationTitleRow}>
          <Ionicons name="person-add-outline" size={17} color="#6D4AFF" />
          <Text style={styles.notificationCardTitle}>{t.joinRequests}</Text>
        </View>
        <Text style={styles.clientOptionCaption}>{formatShortDate(createdDate, language)}</Text>
      </View>
      <Text style={styles.notificationService}>{item.professionalName || item.professionalEmail || item.professionalPhone || t.customer} · {item.role}</Text>
      {item.professionalEmail || item.professionalPhone ? (
        <Text style={styles.clientOptionCaption}>{item.professionalEmail || item.professionalPhone}</Text>
      ) : null}
      <View style={styles.notificationStatusPill}>
        <Text style={styles.notificationStatusText}>{t.statusPending}</Text>
      </View>
    </Pressable>
  );
}

function NotificationCard({
  item,
  t,
  language,
  services,
  onPress,
  onConfirm,
  onCancel,
  actionBusy,
}: {
  item: MobileNotificationRecord;
  t: Record<string, string>;
  language: AppLanguage;
  services: ServiceRecord[];
  onPress?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  actionBusy?: boolean;
}) {
  const statusText = item.status === "cancelled" ? t.statusCancelled : item.status === "confirmed" ? t.statusConfirmed : t.statusPending;
  const serviceName = isAppointmentWithoutServiceName(item.serviceName)
    ? t.withoutService
    : getServiceDisplayName(services.find((service) => serviceNameMatches(service, item.serviceName)), language) || item.serviceName;
  const showActions = item.status === "pending" && (onConfirm || onCancel);
  return (
    <Pressable style={styles.notificationCard} onPress={onPress} disabled={!onPress}>
      <View style={styles.notificationCardHeader}>
        <Text style={styles.notificationCardTitle}>{item.customerName || t.customer}</Text>
        <Text style={styles.clientOptionCaption}>{formatShortDate(item.appointmentDate, language)}</Text>
      </View>
      <Text style={styles.notificationService}>{serviceName}</Text>
      <Text style={styles.clientOptionCaption}>
        {item.appointmentDate} · {item.startTime}{item.professionalName ? ` · ${item.professionalName}` : ""}
      </Text>
      <View style={[styles.notificationStatusPill, item.status === "cancelled" ? styles.notificationStatusCancelled : item.status === "confirmed" ? styles.notificationStatusConfirmed : null]}>
        <Text style={[styles.notificationStatusText, item.status === "cancelled" ? styles.notificationStatusCancelledText : item.status === "confirmed" ? styles.notificationStatusConfirmedText : null]}>{statusText}</Text>
      </View>
      {showActions ? (
        <View style={styles.notificationActionRow}>
          <Pressable
            style={[styles.notificationActionButton, styles.notificationConfirmButton, actionBusy && styles.disabled]}
            onPress={(event) => {
              event.stopPropagation();
              onConfirm?.();
            }}
            disabled={actionBusy || !onConfirm}
          >
            {actionBusy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            <Text style={styles.notificationConfirmButtonText}>{t.confirmBooking || t.statusConfirmed}</Text>
          </Pressable>
          <Pressable
            style={[styles.notificationActionButton, styles.notificationCancelButton, actionBusy && styles.disabled]}
            onPress={(event) => {
              event.stopPropagation();
              onCancel?.();
            }}
            disabled={actionBusy || !onCancel}
          >
            <Ionicons name="close" size={16} color="#BE123C" />
            <Text style={styles.notificationCancelButtonText}>{t.cancelBooking || t.statusCancelled}</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

function BottomNavigation({
  activeTab,
  setActiveTab,
  lockedTabs = [],
  t,
}: {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  lockedTabs?: AppTab[];
  t: Record<string, string>;
}) {
  const items: Array<{ tab: AppTab; icon: ComponentProps<typeof Ionicons>["name"]; label: string }> = [
    { tab: "calendar", icon: "home-outline", label: t.home },
    { tab: "services", icon: "pricetag-outline", label: t.services },
    { tab: "clients", icon: "id-card-outline", label: t.clients },
    { tab: "staff", icon: "people-outline", label: t.teamAccount || t.staff },
    { tab: "settings", icon: "ellipsis-horizontal-circle-outline", label: t.moreTab || t.settings },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = activeTab === item.tab;
        const locked = lockedTabs.includes(item.tab);
        return (
          <Pressable
            key={item.tab}
            onPress={() => setActiveTab(item.tab)}
            style={({ pressed }) => [styles.bottomNavItem, active && styles.bottomNavItemActive, pressed && styles.bottomNavItemPressed]}
          >
            <View style={styles.bottomNavIconWrap}>
              <Ionicons name={item.icon} size={19} color={active ? DESIGN.colors.primary : "#7A8599"} />
              {locked ? (
                <View style={styles.bottomNavLockBadge}>
                  <Ionicons name="lock-closed" size={8} color="#7C3AED" />
                </View>
              ) : null}
            </View>
            <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getPremiumFeatureIcon(feature: PremiumFeature): ComponentProps<typeof Ionicons>["name"] {
  if (feature === "clients") return "id-card-outline";
  if (feature === "staff") return "people-outline";
  if (feature === "online") return "calendar-number-outline";
  if (feature === "schedule") return "time-outline";
  if (feature === "push") return "notifications-outline";
  if (feature === "telegram") return "paper-plane-outline";
  return "location-outline";
}

function getPremiumFeatureTitle(feature: PremiumFeature, t: Record<string, string>) {
  if (feature === "clients") return t.premiumFeatureClientsTitle;
  if (feature === "staff") return t.premiumFeatureStaffTitle;
  if (feature === "online") return t.premiumFeatureOnlineTitle;
  if (feature === "schedule") return t.premiumFeatureScheduleTitle;
  if (feature === "push") return t.premiumFeaturePushTitle;
  if (feature === "telegram") return t.premiumFeatureTelegramTitle;
  return t.premiumFeatureAddressTitle;
}

function getPremiumFeatureText(feature: PremiumFeature, t: Record<string, string>) {
  if (feature === "clients") return t.premiumFeatureClientsText;
  if (feature === "staff") return t.premiumFeatureStaffText;
  if (feature === "online") return t.premiumFeatureOnlineText;
  if (feature === "schedule") return t.premiumFeatureScheduleText;
  if (feature === "push") return t.premiumFeaturePushText;
  if (feature === "telegram") return t.premiumFeatureTelegramText;
  return t.premiumFeatureAddressText;
}

function PremiumFeatureGate({
  t,
  feature,
  professional,
  onUpgrade,
}: {
  t: Record<string, string>;
  feature: PremiumFeature;
  professional?: WorkspaceSnapshot["professional"];
  onUpgrade: () => void;
}) {
  const badgeText = getPremiumStatusDetail(professional, t) || t.premiumLockedBadge;
  const benefits = [t.premiumBenefitOnlineBooking, t.premiumBenefitReminders, t.premiumBenefitTeam, t.premiumBenefitClients];

  return (
    <Panel title={t.premiumSubscriptionTitle}>
      <View style={styles.premiumGate}>
        <View style={styles.premiumGateHero}>
          <View style={styles.premiumGateIcon}>
            <Ionicons name={getPremiumFeatureIcon(feature)} size={24} color={DESIGN.colors.primary} />
          </View>
          <View style={styles.premiumGateCopy}>
            <View style={styles.premiumGateTitleRow}>
              <Text style={styles.premiumGateTitle}>{getPremiumFeatureTitle(feature, t)}</Text>
              <View style={styles.premiumGateBadge}>
                <Text style={styles.premiumGateBadgeText}>{badgeText}</Text>
              </View>
            </View>
            <Text style={styles.premiumGateText}>{getPremiumFeatureText(feature, t)}</Text>
          </View>
        </View>
        <View style={styles.premiumGateBenefits}>
          <Text style={styles.premiumGateBenefitsTitle}>{t.premiumFeatureBenefitsTitle}</Text>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.premiumGateBenefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.premiumGateBenefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton label={t.premiumUpgradeCta} onPress={onUpgrade} />
        <Text style={styles.premiumGateNudge}>{t.premiumYearlyNudge}</Text>
      </View>
    </Panel>
  );
}

function ServicesTab({
  t,
  language,
  workspace,
  catalog,
  draft,
  setDraft,
  onCreate,
  onUpdate,
  onAddCatalog,
  onDelete,
  busy,
  modeRequest,
  onModeRequestHandled,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  workspace: WorkspaceSnapshot | null;
  catalog: ServiceCatalogCategory[];
  draft: ServiceDraftState;
  setDraft: (draft: ServiceDraftState) => void;
  onCreate: () => Promise<boolean>;
  onUpdate: (serviceId: string, draft: ServiceDraftState) => Promise<boolean>;
  onAddCatalog: (service: ServiceTemplateRecord & { category: string }) => void;
  onDelete: (serviceId: string) => void;
  busy: boolean;
  modeRequest?: { mode: ServiceTabMode; id: number } | null;
  onModeRequestHandled?: () => void;
}) {
  const services = workspace?.services || [];
  const currency = workspace?.professional.currency;
  const [mode, setMode] = useState<ServiceTabMode>("mine");
  const [editId, setEditId] = useState("");
  const [editDraft, setEditDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
  const [allowDuplicateCreate, setAllowDuplicateCreate] = useState(false);
  const [customServiceError, setCustomServiceError] = useState("");
  const [debouncedServiceName, setDebouncedServiceName] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [activeCatalogCategory, setActiveCatalogCategory] = useState("");

  useEffect(() => {
    if (!modeRequest) return;
    setMode(modeRequest.mode);
    onModeRequestHandled?.();
  }, [modeRequest, onModeRequestHandled]);

  const categories = useMemo(() => uniqueServiceCategoryOptions(SYSTEM_SERVICE_CATEGORIES), []);
  const sortedCatalog = useMemo(
    () => [...catalog].sort((left, right) => compareCatalogCategories(left.title, right.title)),
    [catalog]
  );
  const catalogGroups = useMemo<CatalogGroupOption[]>(() => {
    const query = catalogQuery.trim().toLowerCase();
    const normalizedQuery = normalizeSmartSearchText(catalogQuery);

    return sortedCatalog
      .map((category) => {
        const localizedCategory = localizeCatalogCategory(localizeText(category.title, category.localizedTitle, language), language, t);
        const services = [...(category.topSuggestions || []), ...(category.popularServices || [])]
          .map((service) => {
            const localizedLabel = getServiceDisplayName(service, language) || service.name;
            return {
              ...service,
              category: category.title,
              localizedLabel,
              localizationKey: getCatalogServiceLocalizationKey(service),
            };
          })
          .filter((service, index, list) => list.findIndex((item) => item.localizationKey === service.localizationKey) === index)
          .filter((service) => {
            if (!query) return true;
            const searchText = `${service.name} ${service.localizedLabel} ${category.title} ${localizedCategory}`.toLowerCase();
            const normalizedSearchText = normalizeSmartSearchText(searchText);
            return searchText.includes(query) || Boolean(normalizedQuery && normalizedSearchText.includes(normalizedQuery));
          });

        return { category, services };
      })
      .filter((group) => group.services.length > 0);
  }, [catalogQuery, language, sortedCatalog, t]);

  const recommendedCategory = useMemo(() => inferSystemServiceCategory(draft.name), [draft.name]);

  useEffect(() => {
    setAllowDuplicateCreate(false);
    setCustomServiceError("");
  }, [draft.name]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedServiceName(draft.name), 300);
    return () => clearTimeout(timer);
  }, [draft.name]);

  useEffect(() => {
    if (recommendedCategory && (!draft.category || getCanonicalServiceCategory(draft.category) === DEFAULT_SERVICE_CATEGORY)) {
      setDraft({ ...draft, category: recommendedCategory });
    }
  }, [draft.category, draft.name, recommendedCategory, setDraft]);

  const activeCatalogGroup = useMemo(() => {
    if (!catalogGroups.length) return null;
    if (!activeCatalogCategory) return catalogGroups[0];
    return catalogGroups.find((group) => group.category.title === activeCatalogCategory) || null;
  }, [activeCatalogCategory, catalogGroups]);
  const currentCatalogCategory = activeCatalogGroup?.category.title || catalogGroups[0]?.category.title || categories[0] || DEFAULT_SERVICE_CATEGORY;
  useEffect(() => {
    if (activeCatalogCategory && !activeCatalogGroup) {
      setActiveCatalogCategory("");
    }
  }, [activeCatalogCategory, activeCatalogGroup]);

  const catalogServices = useMemo(() => {
    if (catalogQuery.trim()) return catalogGroups.flatMap((group) => group.services);
    return activeCatalogGroup?.services || [];
  }, [catalogGroups, catalogQuery, activeCatalogGroup]);
  const quickServiceSuggestions = useMemo(() => {
    const catalogSuggestions = sortedCatalog
      .flatMap((group) => [...(group.topSuggestions || []), ...(group.popularServices || [])].map((service) => ({
        name: getServiceDisplayName(service, language),
        category: group.title,
        durationMinutes: String(service.durationMinutes || 60),
        price: String(service.price || 0),
      })))
      .filter((item) => item.name)
      .slice(0, 3);
    if (catalogSuggestions.length) return catalogSuggestions;
    return [
      { name: t.serviceSuggestionManicure, category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0" },
      { name: t.serviceSuggestionHaircut, category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "45", price: "0" },
      { name: t.serviceSuggestionConsultation, category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "30", price: "0" },
    ];
  }, [language, sortedCatalog, t]);

  function startCustomServiceFromSuggestion(item?: { name?: string; category?: string; durationMinutes?: string; price?: string }) {
    setDraft({
      ...draft,
      name: item?.name || draft.name,
      category: getCanonicalServiceCategory(item?.category || draft.category || DEFAULT_SERVICE_CATEGORY),
      durationMinutes: item?.durationMinutes || draft.durationMinutes || "60",
      price: item?.price || draft.price || "0",
    });
    setMode("custom");
  }

  function startEdit(service: ServiceRecord) {
    setEditId(service.id);
    setEditDraft({
      name: getServiceDisplayName(service, language) || service.name,
      category: getCanonicalServiceCategory(service.category),
      durationMinutes: String(service.durationMinutes || 60),
      price: String(service.price || 0),
      color: service.color || SERVICE_COLORS[0],
    });
  }

  async function saveEdit() {
    const saved = await onUpdate(editId, editDraft);
    if (saved) {
      setEditId("");
    }
  }

  function addCustomCategory() {
    const value = customCategory.trim();
    if (!value) return;
    const canonical = getCanonicalServiceCategory(value);
    setDraft({ ...draft, category: canonical });
    setActiveCatalogCategory(canonical);
    setCustomCategory("");
  }

  function catalogServiceExists(serviceTemplate: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName">) {
    return services.some((service) => serviceIdentityOverlaps(service, serviceTemplate));
  }

  const similarServices = useMemo(() => {
    const query = normalizeSmartSearchText(debouncedServiceName);
    if (query.length < 2) return [];
    const items: Array<{
      key: string;
      service: ServiceRecord | (ServiceTemplateRecord & { category: string });
      category: string;
      source: "user" | "catalog";
      alreadyAdded: boolean;
    }> = [];
    const seen = new Set<string>();
    const pushItem = (
      service: ServiceRecord | (ServiceTemplateRecord & { category: string }),
      category: string,
      source: "user" | "catalog"
    ) => {
      const canonicalCategory = getCanonicalServiceCategory(category);
      const display = getServiceDisplayName(service, language);
      const smart = getServiceSmartSearchText(service);
      if (!smart || (!smart.includes(query) && !query.includes(smart) && !areServiceNamesSimilar(service, debouncedServiceName))) return;
      const key = normalizeSmartSearchText(display || service.name || "");
      if (!key || seen.has(key)) return;
      seen.add(key);
      items.push({
        key: `${source}-${key}`,
        service,
        category: canonicalCategory,
        source,
        alreadyAdded: source === "user" || services.some((item) => areServiceNamesSimilar(item, display || service.name || "")),
      });
    };
    services.forEach((service) => pushItem(service, service.category || DEFAULT_SERVICE_CATEGORY, "user"));
    catalog.forEach((group) => {
      [...(group.topSuggestions || []), ...(group.popularServices || [])].forEach((service) => {
        pushItem({ ...service, category: group.title }, group.title, "catalog");
      });
    });
    return items.slice(0, 7);
  }, [catalog, debouncedServiceName, language, services]);

  const duplicateService = useMemo(
    () => services.find((service) => areServiceNamesSimilar(service, draft.name)),
    [draft.name, services]
  );

  const similarSystemCategory = useMemo(() => {
    const value = normalizeSmartSearchText(customCategory);
    if (!value) return "";
    return SYSTEM_SERVICE_CATEGORIES.find((category) => {
      const label = localizeCatalogCategory(category, language, t);
      const normalizedCategory = normalizeSmartSearchText(`${category} ${label}`);
      return normalizedCategory === value || normalizedCategory.includes(value) || value.includes(normalizedCategory) || inferSystemServiceCategory(value) === category;
    }) || "";
  }, [customCategory, language, t]);

  function applyServiceSuggestion(item: {
    service: ServiceRecord | (ServiceTemplateRecord & { category: string });
    category: string;
    source: "user" | "catalog";
  }) {
    const name = getServiceDisplayName(item.service, language) || item.service.name || "";
    setDraft({
      ...draft,
      name,
      category: getCanonicalServiceCategory(item.category || draft.category || DEFAULT_SERVICE_CATEGORY),
      durationMinutes: String(item.service.durationMinutes || 60),
      price: String(Number("price" in item.service ? item.service.price || 0 : 0)),
      color: "color" in item.service ? item.service.color || draft.color || SERVICE_COLORS[0] : draft.color || SERVICE_COLORS[0],
    });
    if (item.source === "user" && "id" in item.service) {
      setMode("mine");
      startEdit(item.service);
    }
  }

  function openExistingDuplicate() {
    if (!duplicateService) return;
    setMode("mine");
    startEdit(duplicateService);
  }

  async function saveCustomService() {
    const hasName = draft.name.trim().length > 0;
    const hasCategory = Boolean(draft.category.trim() && getCanonicalServiceCategory(draft.category) !== DEFAULT_SERVICE_CATEGORY);
    const hasDuration = Number(draft.durationMinutes) > 0;
    if (!hasName) {
      setCustomServiceError(t.serviceNameRequired || t.serviceName);
      return;
    }
    if (!hasCategory) {
      setCustomServiceError(t.chooseServiceCategoryOrAddCustom);
      return;
    }
    if (!hasDuration) {
      setCustomServiceError(t.durationRequired || t.duration);
      return;
    }
    if (duplicateService && !allowDuplicateCreate) {
      setCustomServiceError(t.similarServiceExists);
      return;
    }
    setMode("mine");
    setCustomCategoryOpen(false);
    setCustomServiceError("");
    void onCreate();
  }

  function openServiceActions(service: ServiceRecord) {
    Alert.alert(getServiceDisplayName(service, language), "", [
      { text: t.cancel, style: "cancel" },
      { text: t.editService, onPress: () => startEdit(service) },
      { text: t.delete, style: "destructive", onPress: () => onDelete(service.id) },
    ]);
  }

  return (
    <View style={styles.sectionStack}>
      <View style={styles.servicesModeRow}>
        {[
          { id: "mine", label: t.servicesMineShort || t.yourServices },
          { id: "custom", label: t.servicesCreateShort || t.ownService },
          { id: "catalog", label: t.servicesCatalogShort || t.generalCatalog },
        ].map((item) => {
          const active = mode === item.id;
          return (
            <Pressable key={item.id} style={[styles.servicesModeButton, active && styles.servicesModeButtonActive]} onPress={() => setMode(item.id as ServiceTabMode)}>
              <Text style={[styles.servicesModeText, active && styles.servicesModeTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === "mine" ? (
        <Panel title={t.yourServices}>
          {services.length ? (
            <>
              {services.map((service) => {
                const isEditing = editId === service.id;
                return (
                  <View key={service.id} style={styles.serviceManageCard}>
                    {isEditing ? (
                      <View style={styles.serviceEditStack}>
                        <Field label={t.serviceName} value={editDraft.name} onChangeText={(value) => setEditDraft({ ...editDraft, name: value })} />
                        <CategoryChips t={t} language={language} categories={categories} selected={editDraft.category} onSelect={(category) => setEditDraft({ ...editDraft, category })} />
                        <View style={styles.twoColumns}>
                          <Field label={t.duration} value={editDraft.durationMinutes} onChangeText={(value) => setEditDraft({ ...editDraft, durationMinutes: value })} keyboardType="number-pad" />
                          <Field label={t.price} value={editDraft.price} onChangeText={(value) => setEditDraft({ ...editDraft, price: value })} keyboardType="number-pad" />
                        </View>
                        <ColorSwatches value={editDraft.color} onChange={(color) => setEditDraft({ ...editDraft, color })} />
                        <View style={styles.serviceActionRow}>
                          <SecondaryButton label={t.cancel} onPress={() => setEditId("")} disabled={busy} />
                          <PrimaryButton label={t.saveService} onPress={() => void saveEdit()} disabled={busy} />
                        </View>
                      </View>
                    ) : (
                      <Pressable style={styles.serviceManageSummary} onPress={() => startEdit(service)} onLongPress={() => openServiceActions(service)}>
                        <View style={styles.serviceColorRow}>
                          <View style={[styles.serviceDot, { backgroundColor: service.color || "#7C3AED" }]} />
                          <View style={styles.serviceTextBlock}>
                            <Text style={styles.listTitle} numberOfLines={1}>{getServiceDisplayName(service, language)}</Text>
                            <Text style={styles.listCaption} numberOfLines={1}>
                              {getServiceCategoryDisplayName(service.category, service.localizedCategory, language, t)} · {formatDuration(service.durationMinutes || 60, t)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.rowRight}>
                          <Text style={styles.moneyText}>{formatMoney(service.price, currency)}</Text>
                          <Ionicons name="ellipsis-horizontal" size={17} color="#94A3B8" />
                        </View>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </>
          ) : (
            <View style={styles.firstRunCard}>
              <View style={styles.firstRunIcon}>
                <Ionicons name="pricetag-outline" size={22} color="#6D4AFF" />
              </View>
              <Text style={styles.firstRunTitle}>{t.firstServiceTitle}</Text>
              <Text style={styles.firstRunText}>{t.firstServiceText}</Text>
              <View style={styles.firstRunActions}>
                <Pressable style={styles.firstRunPrimaryButton} onPress={() => setMode("catalog")}>
                  <Text style={styles.firstRunPrimaryText}>{t.chooseFromCatalog}</Text>
                </Pressable>
                <Pressable style={styles.firstRunSecondaryButton} onPress={() => startCustomServiceFromSuggestion()}>
                  <Text style={styles.firstRunSecondaryText}>{t.createOwnService}</Text>
                </Pressable>
              </View>
              <View style={styles.quickSuggestionRow}>
                {quickServiceSuggestions.map((item) => (
                  <Pressable key={`${item.category}-${item.name}`} style={styles.quickSuggestionChip} onPress={() => startCustomServiceFromSuggestion(item)}>
                    <Text style={styles.quickSuggestionText}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Panel>
      ) : null}

      {mode === "custom" ? (
        <Panel title={t.ownService}>
          <View style={styles.serviceCreateForm}>
            <Field label={t.serviceName} value={draft.name} onChangeText={(value) => setDraft({ ...draft, name: value })} />

            {similarServices.length ? (
              <View style={styles.smartBlock}>
                <Text style={styles.smartBlockTitle}>{t.similarServices}</Text>
                {similarServices.map((item) => {
                  const selected = areServiceNamesSimilar(item.service, draft.name) && normalizeSmartSearchText(getServiceDisplayName(item.service, language)) === normalizeSmartSearchText(draft.name);
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.smartSuggestionCard, selected && styles.smartSuggestionCardSelected]}
                      onPress={() => applyServiceSuggestion(item)}
                      disabled={busy}
                    >
                      <View style={styles.serviceTextBlock}>
                        <Text style={styles.smartSuggestionTitle}>{getServiceDisplayName(item.service, language)}</Text>
                        <Text style={styles.smartSuggestionMeta}>
                          {formatDuration(item.service.durationMinutes || 60, t)} · {localizeCatalogCategory(item.category, language, t)}
                          {"price" in item.service && Number(item.service.price || 0) ? ` · ${formatMoney(Number(item.service.price || 0), currency)}` : ""}
                        </Text>
                      </View>
                      {item.alreadyAdded ? <Text style={styles.alreadyAddedBadge}>{t.alreadyAdded}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {recommendedCategory ? (
              <View style={styles.recommendedCategoryBox}>
                <Text style={styles.recommendedCategoryText}>
                  {t.looksLikeCategory} {localizeCatalogCategory(recommendedCategory, language, t)}
                </Text>
                <Pressable style={styles.recommendedCategoryButton} onPress={() => setDraft({ ...draft, category: recommendedCategory })}>
                  <Text style={styles.recommendedCategoryButtonText}>{t.useCategory}</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.label}>{t.serviceCategory}</Text>
            <CategoryChips
              t={t}
              language={language}
              categories={categories}
              selected={draft.category}
              recommended={recommendedCategory}
              onSelect={(category) => {
                setDraft({ ...draft, category });
                setCustomServiceError("");
              }}
            />

            <Pressable style={styles.customCategoryToggle} onPress={() => setCustomCategoryOpen((current) => !current)}>
              <Ionicons name={customCategoryOpen ? "chevron-up" : "add"} size={16} color="#64748B" />
              <Text style={styles.customCategoryToggleText}>{t.cantFindCategory}</Text>
            </Pressable>

            {customCategoryOpen ? (
              <View style={styles.customCategoryPanel}>
                <Text style={styles.compactHelperText}>{t.customCategoryHint}</Text>
                <View style={styles.categoryAddRow}>
                  <Field label={t.customCategory} value={customCategory} onChangeText={setCustomCategory} placeholder={t.enterCategoryName} />
                  <Pressable style={styles.categoryAddButton} onPress={addCustomCategory}>
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>
                {similarSystemCategory ? (
                  <View style={styles.softWarningBox}>
                    <Text style={styles.softWarningText}>
                      {t.similarCategoryExists} {localizeCatalogCategory(similarSystemCategory, language, t)}
                    </Text>
                    <Pressable style={styles.warningInlineButton} onPress={() => {
                      setDraft({ ...draft, category: similarSystemCategory });
                      setCustomCategory("");
                    }}>
                      <Text style={styles.warningInlineButtonText}>{t.useCategory}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.durationQuickRow}>
              {QUICK_DURATION_OPTIONS.map((minutes) => {
                const active = String(minutes) === String(draft.durationMinutes);
                return (
                  <Pressable key={minutes} style={[styles.durationQuickChip, active && styles.durationQuickChipActive]} onPress={() => setDraft({ ...draft, durationMinutes: String(minutes) })}>
                    <Text style={[styles.durationQuickText, active && styles.durationQuickTextActive]}>{minutes}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.twoColumns}>
              <Field label={t.duration} value={draft.durationMinutes} onChangeText={(value) => setDraft({ ...draft, durationMinutes: value })} keyboardType="number-pad" />
              <Field label={t.price} value={draft.price} onChangeText={(value) => setDraft({ ...draft, price: value })} keyboardType="number-pad" />
            </View>
            <ColorSwatches value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />

            {duplicateService && !allowDuplicateCreate ? (
              <View style={styles.softWarningBox}>
                <Text style={styles.softWarningTitle}>{t.similarServiceExists}</Text>
                <Text style={styles.softWarningText}>
                  {getServiceDisplayName(duplicateService, language)} {t.serviceAlreadyExistsSuffix}
                </Text>
                <View style={styles.warningActionRow}>
                  <SecondaryButton label={t.openExistingService} onPress={openExistingDuplicate} disabled={busy} />
                  <SecondaryButton label={t.createNewAnyway} onPress={() => setAllowDuplicateCreate(true)} disabled={busy} />
                </View>
              </View>
            ) : null}

            {customServiceError ? <Text style={styles.formErrorNotice}>{customServiceError}</Text> : null}
            <View style={styles.submitBar}>
              <PrimaryButton
                label={t.addService}
                onPress={() => void saveCustomService()}
                disabled={busy || !draft.name.trim() || !draft.category.trim() || getCanonicalServiceCategory(draft.category) === DEFAULT_SERVICE_CATEGORY || !Number(draft.durationMinutes || 0)}
              />
            </View>
          </View>
        </Panel>
      ) : null}

      {mode === "catalog" ? (
        <Panel title={t.generalCatalog}>
          <Field label={t.search} value={catalogQuery} onChangeText={setCatalogQuery} placeholder={t.searchService} />
          <CatalogCategoryChips t={t} language={language} categories={catalogGroups} selected={currentCatalogCategory} onSelect={setActiveCatalogCategory} />
          {catalogServices.length ? (
            catalogServices.map((service) => {
              const exists = catalogServiceExists(service);
              return (
                <Pressable key={`${service.category}-${service.name}`} style={[styles.catalogServiceCard, exists && styles.catalogServiceCardActive]} onPress={() => !exists && onAddCatalog(service)} disabled={busy || exists}>
                  <View style={styles.serviceTextBlock}>
                    <Text style={styles.listTitle}>{service.localizedLabel}</Text>
                    <Text style={styles.listCaption}>{localizeCatalogCategory(localizeText(service.category, catalog.find((group) => group.title === service.category)?.localizedTitle, language), language, t)} · {formatDuration(service.durationMinutes || 60, t)} · {formatMoney(Number(service.price || 0), currency)}</Text>
                  </View>
                  <View style={[styles.catalogAddBadge, exists && styles.catalogAddBadgeDone]}>
                    <Ionicons name={exists ? "checkmark" : "add"} size={20} color={exists ? "#166534" : "#FFFFFF"} />
                  </View>
                  {exists ? <Text style={[styles.catalogStateText, styles.catalogStateTextDone]}>{t.alreadyAdded}</Text> : null}
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t.empty}</Text>
          )}
        </Panel>
      ) : null}
    </View>
  );
}

function CategoryChips({
  t,
  language,
  categories,
  selected,
  recommended,
  onSelect,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  categories: string[];
  selected: string;
  recommended?: string;
  onSelect: (category: string) => void;
}) {
  const safeCategories = uniqueServiceCategoryOptions(categories.length ? categories : SYSTEM_SERVICE_CATEGORIES);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.servicePicker}>
      {safeCategories.map((category) => {
        const selectedCategory = getCanonicalServiceCategory(selected);
        const active = category === selectedCategory;
        const isRecommended = Boolean(recommended && category === getCanonicalServiceCategory(recommended) && !active);
        return (
          <Pressable key={category} style={[styles.choiceChip, isRecommended && styles.choiceChipRecommended, active && styles.choiceChipActive]} onPress={() => onSelect(category)}>
            <Text style={[styles.choiceText, isRecommended && styles.choiceTextRecommended, active && styles.choiceTextActive]}>{localizeCatalogCategory(category, language, t)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function CatalogCategoryChips({
  t,
  language,
  categories,
  selected,
  onSelect,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  categories: CatalogGroupOption[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.servicePicker}>
      {categories.map((group) => {
        const active = group.category.title === selected;
        const label = localizeCatalogCategory(localizeText(group.category.title, group.category.localizedTitle, language), language, t);
        return (
          <Pressable key={group.category.title} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={() => onSelect(group.category.title)}>
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MultiCategoryPicker({
  t,
  language,
  categories,
  selected,
  onToggle,
  disabled,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  categories: string[];
  selected: string[];
  onToggle: (category: string) => void;
  disabled?: boolean;
}) {
  const safeCategories = categories.length ? categories : [DEFAULT_SERVICE_CATEGORY];
  const selectedKeys = new Set(selected.map((item) => item.toLocaleLowerCase()));

  return (
    <View style={styles.businessCategoryPicker}>
      {safeCategories.map((category) => {
        const active = selectedKeys.has(category.toLocaleLowerCase());
        return (
          <Pressable
            key={category}
            style={[styles.businessCategoryChip, active && styles.businessCategoryChipActive, disabled && styles.businessCategoryChipDisabled]}
            onPress={() => onToggle(category)}
            disabled={disabled}
          >
            <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={16} color={active ? "#6D4AFF" : "#94A3B8"} />
            <Text style={[styles.businessCategoryText, active && styles.businessCategoryTextActive]}>{localizeCatalogCategory(category, language, t)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View style={styles.colorSwatchRow}>
      {SERVICE_COLORS.map((color) => (
        <Pressable key={color} style={[styles.colorSwatch, { backgroundColor: color }, value === color && styles.colorSwatchActive]} onPress={() => onChange(color)} />
      ))}
    </View>
  );
}

function ClientsTab({
  t,
  clients,
  draft,
  setDraft,
  onCreate,
  onUpdate,
  onDelete,
  onCreateVisit,
  busy,
}: {
  t: Record<string, string>;
  clients: ClientRecord[];
  draft: ClientDraftState;
  setDraft: (draft: ClientDraftState) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (client: ClientRecord) => void;
  onCreateVisit: () => void;
  busy: boolean;
}) {
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const editingClient = draft.clientId ? clients.find((client) => client.id === draft.clientId) ?? null : null;
  const canDeleteEditingClient = Boolean(editingClient && !editingClient.id.startsWith("derived_"));

  function openCreateClientForm() {
    setDraft({ firstName: "", lastName: "", phone: "", email: "" });
    setClientFormOpen(true);
  }

  function openEditClientForm(client: ClientRecord) {
    setDraft({
      clientId: client.id,
      firstName: client.firstName || client.fullName || "",
      lastName: client.lastName || "",
      phone: client.phone || "",
      email: client.email || "",
    });
    setClientFormOpen(true);
  }

  function handleSaveClient() {
    if (!draft.firstName.trim() && !draft.phone.trim()) {
      draft.clientId ? onUpdate() : onCreate();
      return;
    }
    draft.clientId ? onUpdate() : onCreate();
    setClientFormOpen(false);
  }

  return (
    <View style={styles.sectionStack}>
      <Panel title={t.clients}>
        {clients.length ? (
          <Pressable style={styles.compactAddRow} onPress={openCreateClientForm}>
            <View style={styles.compactAddIcon}>
              <Ionicons name="add" size={18} color="#6D4AFF" />
            </View>
            <Text style={styles.compactAddText}>{t.addClient}</Text>
          </Pressable>
        ) : null}
        {clients.length ? (
          clients.map((client) => (
            <Pressable key={client.id} style={({ pressed }) => [styles.listItem, pressed && styles.pressablePressed]} onPress={() => openEditClientForm(client)}>
              <View>
                <Text style={styles.listTitle} numberOfLines={1}>{client.fullName || client.phone}</Text>
                <Text style={styles.listCaption} numberOfLines={1}>{client.phone || client.email}</Text>
              </View>
              <View style={styles.clientListActions}>
                <Text style={styles.badgeText}>{client.visitsCount}</Text>
                <Ionicons name="create-outline" size={18} color="#64748B" />
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.firstRunCard}>
            <View style={styles.firstRunIcon}>
              <Ionicons name="people-outline" size={22} color="#6D4AFF" />
            </View>
            <Text style={styles.firstRunTitle}>{t.clientsEmptyTitle}</Text>
            <Text style={styles.firstRunText}>{t.clientsEmptyText}</Text>
            <View style={styles.firstRunActions}>
              <Pressable style={styles.firstRunPrimaryButton} onPress={openCreateClientForm}>
                <Text style={styles.firstRunPrimaryText}>{t.addClient}</Text>
              </Pressable>
              <Pressable style={styles.firstRunSecondaryButton} onPress={onCreateVisit}>
                <Text style={styles.firstRunSecondaryText}>{t.newVisit}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Panel>
      <Pressable style={styles.screenFabMini} onPress={openCreateClientForm}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </Pressable>
      <Modal transparent visible={clientFormOpen} animationType="slide" onRequestClose={() => setClientFormOpen(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.clientFormSheetWrap}>
            <View style={styles.visitSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{draft.clientId ? t.editClient : t.addClient}</Text>
                <Pressable style={styles.sheetClose} onPress={() => setClientFormOpen(false)}>
                  <Ionicons name="close" size={22} color="#0F172A" />
                </Pressable>
              </View>
              <ScrollView
                style={styles.clientModalScroll}
                contentContainerStyle={styles.clientModalScrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
              >
                <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => setDraft({ ...draft, firstName: value })} />
                <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => setDraft({ ...draft, lastName: value })} />
                <Field label={t.phone} value={draft.phone} onChangeText={(value) => setDraft({ ...draft, phone: value })} keyboardType="phone-pad" />
                <Field label={t.email} value={draft.email} onChangeText={(value) => setDraft({ ...draft, email: value })} keyboardType="email-address" autoCapitalize="none" />
                <PrimaryButton label={draft.clientId ? t.save : t.addClient} onPress={handleSaveClient} disabled={busy} />
                {canDeleteEditingClient && editingClient ? (
                  <Pressable
                    style={({ pressed }) => [styles.clientDeleteButton, pressed && styles.pressablePressed]}
                    onPress={() => {
                      setClientFormOpen(false);
                      onDelete(editingClient);
                    }}
                    disabled={busy}
                  >
                    <Ionicons name="trash-outline" size={18} color="#E11D48" />
                    <Text style={styles.clientDeleteButtonText}>{t.deleteClient || t.delete}</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const staffWeekKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function makeStaffMembers(staff: StaffSnapshot | null, workspace: WorkspaceSnapshot | null, t: Record<string, string>): StaffMemberRecord[] {
  return staff?.members?.length
    ? staff.members
    : workspace
      ? [
          {
            professional: workspace.professional,
            membership: {
              role: t.owner,
              scope: "owner" as const,
              workScheduleMode: workspace.memberSchedule?.workScheduleMode === "flexible" ? "flexible" as const : "fixed" as const,
              workSchedule: workspace.memberSchedule?.workSchedule || {},
              customSchedule: workspace.memberSchedule?.customSchedule || {},
            },
            workspaceAccess: "owner" as const,
            pendingInvitation: null,
            stats: {
              monthBookings: 0,
              upcomingBookings: 0,
            },
          },
        ]
      : [];
}

function makeStaffMemberName(member: StaffMemberRecord, fallback: string) {
  return getCalendarMemberDisplayName(member.professional, fallback);
}

function splitStaffFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function StaffWorkspaceTab({
  t,
  language,
  staff,
  workspace,
  busy,
  apiFetch,
  onRefreshWorkspace,
  onSaveSchedule,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  staff: StaffSnapshot | null;
  workspace: WorkspaceSnapshot | null;
  busy: boolean;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  onSaveSchedule: (member: StaffMemberRecord, workSchedule: WorkScheduleRecord, customSchedule?: Record<string, WorkDayScheduleRecord>, mode?: "fixed" | "flexible", options?: { silent?: boolean }) => Promise<boolean>;
}) {
  const [section, setSection] = useState<"members" | "schedule">("members");

  return (
    <View style={styles.staffScreen}>
      <View style={styles.staffScreenHeader}>
        <Text style={styles.staffScreenTitle}>{section === "members" ? t.teamMembers : t.staffSchedule}</Text>
      </View>

      <View style={styles.staffLocalNav}>
        <Pressable style={[styles.staffLocalNavItem, section === "members" && styles.staffLocalNavItemActive]} onPress={() => setSection("members")}>
          <Ionicons name="people-outline" size={16} color={section === "members" ? "#6D4AFF" : "#64748B"} />
          <Text style={[styles.staffLocalNavText, section === "members" && styles.staffLocalNavTextActive]}>{t.teamMembers}</Text>
        </Pressable>
        <Pressable style={[styles.staffLocalNavItem, section === "schedule" && styles.staffLocalNavItemActive]} onPress={() => setSection("schedule")}>
          <Ionicons name="calendar-outline" size={16} color={section === "schedule" ? "#6D4AFF" : "#64748B"} />
          <Text style={[styles.staffLocalNavText, section === "schedule" && styles.staffLocalNavTextActive]}>{t.staffSchedule}</Text>
        </Pressable>
      </View>

      {section === "members" ? (
        <StaffMembersTab
          t={t}
          staff={staff}
          workspace={workspace}
          busy={busy}
          apiFetch={apiFetch}
          onRefreshWorkspace={onRefreshWorkspace}
          onOpenSchedule={() => setSection("schedule")}
        />
      ) : (
        <StaffScheduleTab
          t={t}
          language={language}
          staff={staff}
          workspace={workspace}
          busy={busy}
          onSaveSchedule={onSaveSchedule}
          onOpenMembers={() => setSection("members")}
        />
      )}
    </View>
  );
}

function StaffMembersTab({
  t,
  staff,
  workspace,
  busy,
  apiFetch,
  onRefreshWorkspace,
  onOpenSchedule,
}: {
  t: Record<string, string>;
  staff: StaffSnapshot | null;
  workspace: WorkspaceSnapshot | null;
  busy: boolean;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  onOpenSchedule: () => void;
}) {
  const members = makeStaffMembers(staff, workspace, t);
  const isOwner = workspace?.membership?.scope === "owner";
  const joinedBusinessMemberships = (staff?.myMemberships || []).filter(
    (item) => item.business.id !== workspace?.business.id || item.membership.scope !== "owner"
  );
  const [resolvedInvitationIds, setResolvedInvitationIds] = useState<Set<string>>(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editDraft, setEditDraft] = useState({ fullName: "", role: "", email: "", phone: "" });

  async function staffAction(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await apiFetch("/api/mobile/pro/staff", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onRefreshWorkspace();
      return true;
    } catch (error) {
      Alert.alert(t.staff, error instanceof Error ? error.message : t.staff);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function createMember() {
    if (!inviteEmail.trim()) {
      Alert.alert(t.requiredTitle, t.email);
      return;
    }
    const ok = await staffAction({
      action: "inviteMember",
      email: inviteEmail,
    });
    if (ok) {
      setInviteEmail("");
      setAddOpen(false);
    }
  }

  function startEdit(member: StaffMemberRecord) {
    setEditId(member.professional.id);
    setEditDraft({
      fullName: makeStaffMemberName(member, t.employee),
      role: member.membership.role || t.employee,
      email: member.professional.email || "",
      phone: member.professional.phone || "",
    });
  }

  async function updateMember(member: StaffMemberRecord) {
    const parsed = splitStaffFullName(editDraft.fullName);
    if (!parsed.firstName) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }
    const ok = await staffAction({
      action: "updateMember",
      memberProfessionalId: member.professional.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: editDraft.role,
      email: editDraft.email,
      phone: editDraft.phone,
    });
    if (ok) setEditId("");
  }

  async function inviteMember(member: StaffMemberRecord) {
    if (!member.professional.email) {
      startEdit(member);
      return;
    }
    await staffAction({
      action: "inviteMember",
      memberProfessionalId: member.professional.id,
      email: member.professional.email,
      role: member.membership.role,
    });
  }

  async function revokeInvitation(invitationId: string) {
    await staffAction({ action: "revokeInvitation", invitationId });
  }

  async function removeMember(member: StaffMemberRecord) {
    Alert.alert(t.removeMember || t.deleteConfirm || t.staff, t.removeMemberConfirm || "", [
      { text: t.cancel, style: "cancel" },
      {
        text: t.removeMember || t.deleteConfirm || t.staff,
        style: "destructive",
        onPress: async () => {
          const ok = await staffAction({ action: "removeMember", memberProfessionalId: member.professional.id });
          if (ok) {
            Alert.alert("Timviz", t.removeMemberSuccess || t.saved);
          }
        },
      },
    ]);
  }

  async function resolveInvitation(invitationId: string, invitationAction: "acceptInvitation" | "declineInvitation") {
    setResolvedInvitationIds((current) => new Set([...current, invitationId]));
    const ok = await staffAction({ action: invitationAction, invitationId });
    if (!ok) {
      setResolvedInvitationIds((current) => {
        const next = new Set(current);
        next.delete(invitationId);
        return next;
      });
    }
  }

  async function leaveCompany(businessId?: string) {
    Alert.alert(t.leaveCompany || t.logout, t.leaveCompanyConfirm || "", [
      { text: t.cancel, style: "cancel" },
      {
        text: t.leaveCompany || t.logout,
        style: "destructive",
        onPress: async () => {
          const ok = await staffAction({ action: "leaveCompany", businessId });
          if (ok) {
            Alert.alert("Timviz", t.leaveCompanySuccess || t.logout);
          }
        },
      },
    ]);
  }

  if (!isOwner) {
    const currentMember = members.find((member) => member.professional.id === workspace?.professional.id) || members[0] || null;
    const visibleMemberships = joinedBusinessMemberships.length
      ? joinedBusinessMemberships
      : workspace
        ? [{
            business: {
              id: workspace.business.id,
              name: workspace.business.name,
              address: workspace.business.address,
            },
            membership: {
              id: currentMember?.membership.id || workspace.business.id,
              role: currentMember?.membership.role || workspace.membership?.role || t.employee,
              scope: "member" as const,
              createdAt: currentMember?.membership.createdAt || new Date().toISOString(),
            },
          }]
        : [];

    return (
      <View style={styles.sectionStack}>
        <Panel title={t.teamMembers}>
          {visibleMemberships.map((item) => {
            const joinedAt = item.membership.createdAt
              ? new Date(item.membership.createdAt).toLocaleDateString()
              : "";
            return (
              <View key={`${item.business.id}:${item.membership.id}`} style={styles.staffMembershipCard}>
                <Text style={styles.staffMembershipEyebrow}>{t.memberCompanyEyebrow || t.teamMembers}</Text>
                <Text style={styles.staffMembershipTitle}>
                  {t.memberCompanyTitle} <Text style={styles.staffMembershipBusinessName}>{item.business.name || "Timviz"}</Text>
                </Text>
                <View style={styles.staffMembershipDetails}>
                  <View style={styles.staffMembershipDetailItem}>
                    <Text style={styles.clientOptionCaption}>{t.memberCompanyRole || t.role}</Text>
                    <Text style={styles.settingsMiniTitle}>{item.membership.role || t.employee}</Text>
                  </View>
                  {joinedAt ? (
                    <View style={styles.staffMembershipDetailItem}>
                      <Text style={styles.clientOptionCaption}>{t.memberCompanyJoined || ""}</Text>
                      <Text style={styles.settingsMiniTitle}>{joinedAt}</Text>
                    </View>
                  ) : null}
                </View>
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, styles.dangerButton, pressed && styles.pressablePressed, (busy || saving) && styles.disabled]}
                  onPress={() => void leaveCompany(item.business.id)}
                  disabled={busy || saving}
                >
                  <Text style={styles.dangerButtonText}>{saving ? t.signingIn : t.leaveCompany || t.logout}</Text>
                </Pressable>
              </View>
            );
          })}
        </Panel>

        <Panel title={t.incomingInvites || t.pendingInvites}>
          {staff?.incomingInvitations?.filter((invitation) => !resolvedInvitationIds.has(invitation.id)).length ? (
            staff.incomingInvitations.filter((invitation) => !resolvedInvitationIds.has(invitation.id)).map((invitation) => (
              <View key={invitation.id} style={styles.staffInviteCard}>
                <View style={styles.staffInviteInfo}>
                  <Text style={styles.staffInviteCompany} numberOfLines={2}>{invitation.business.name}</Text>
                </View>
                <View style={styles.staffInviteActions}>
                  <Pressable
                    style={({ pressed }) => [styles.staffInviteButton, styles.staffInviteDeclineButton, pressed && styles.pressablePressed, saving && styles.disabled]}
                    onPress={() => void resolveInvitation(invitation.id, "declineInvitation")}
                    disabled={saving}
                  >
                    <Text style={styles.staffInviteDeclineText}>{t.declineInvite}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.staffInviteButton, styles.staffInviteAcceptButton, pressed && styles.pressablePressed, saving && styles.disabled]}
                    onPress={() => void resolveInvitation(invitation.id, "acceptInvitation")}
                    disabled={saving}
                  >
                    <Text style={styles.staffInviteAcceptText}>{t.acceptInvite}</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t.noIncomingInvites || t.noJoinRequests}</Text>
          )}
        </Panel>
      </View>
    );
  }

  return (
    <View style={styles.sectionStack}>
      <Panel title={t.teamMembers}>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.staffSchedule} onPress={onOpenSchedule} />
          {isOwner ? (
            <PrimaryButton label={addOpen ? t.cancel : t.addMember} onPress={() => setAddOpen(!addOpen)} disabled={busy || saving} />
          ) : null}
        </View>
        {joinedBusinessMemberships.length ? (
          <View style={styles.sectionStack}>
            {joinedBusinessMemberships.map((item) => {
              const joinedAt = item.membership.createdAt
                ? new Date(item.membership.createdAt).toLocaleDateString()
                : "";
              return (
                <View key={`${item.business.id}:${item.membership.id}`} style={styles.staffMembershipCard}>
                  <Text style={styles.staffMembershipEyebrow}>{t.memberCompanyEyebrow || t.teamMembers}</Text>
                  <Text style={styles.staffMembershipTitle}>
                    {t.memberCompanyTitle} <Text style={styles.staffMembershipBusinessName}>{item.business.name || "Timviz"}</Text>
                  </Text>
                  <View style={styles.staffMembershipDetails}>
                    <View style={styles.staffMembershipDetailItem}>
                      <Text style={styles.clientOptionCaption}>{t.memberCompanyRole || t.role}</Text>
                      <Text style={styles.settingsMiniTitle}>{item.membership.role || t.employee}</Text>
                    </View>
                    {joinedAt ? (
                      <View style={styles.staffMembershipDetailItem}>
                        <Text style={styles.clientOptionCaption}>{t.memberCompanyJoined || ""}</Text>
                        <Text style={styles.settingsMiniTitle}>{joinedAt}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, styles.dangerButton, pressed && styles.pressablePressed, (busy || saving) && styles.disabled]}
                    onPress={() => void leaveCompany(item.business.id)}
                    disabled={busy || saving}
                  >
                    <Text style={styles.dangerButtonText}>{saving ? t.signingIn : t.leaveCompany || t.logout}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </Panel>

      {addOpen && isOwner ? (
        <Panel title={t.addMember}>
          <Field label={t.email} value={inviteEmail} onChangeText={setInviteEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.clientOptionCaption}>{t.sendInvite}</Text>
          <PrimaryButton label={t.addMember} onPress={() => void createMember()} disabled={busy || saving || !inviteEmail.trim()} />
        </Panel>
      ) : null}

      {isOwner ? (
        <Panel title={t.pendingInvites}>
          {staff?.invitations?.length ? (
            staff.invitations.map((invitation) => (
              <View key={invitation.id} style={styles.joinRequestCard}>
                <View>
                  <Text style={styles.settingsMiniTitle}>{invitation.email}</Text>
                  <Text style={styles.clientOptionCaption}>{new Date(invitation.createdAt).toLocaleDateString()}</Text>
                </View>
                <Pressable style={styles.joinRejectButton} onPress={() => void revokeInvitation(invitation.id)} disabled={saving}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t.noInvites || t.noIncomingInvites || t.empty}</Text>
          )}
        </Panel>
      ) : null}

      <Panel title={t.incomingInvites || t.pendingInvites}>
        {staff?.incomingInvitations?.filter((invitation) => !resolvedInvitationIds.has(invitation.id)).length ? (
          staff.incomingInvitations.filter((invitation) => !resolvedInvitationIds.has(invitation.id)).map((invitation) => (
            <View key={invitation.id} style={styles.staffInviteCard}>
              <View style={styles.staffInviteInfo}>
                <Text style={styles.staffInviteCompany} numberOfLines={2}>{invitation.business.name}</Text>
              </View>
              <View style={styles.staffInviteActions}>
                <Pressable
                  style={({ pressed }) => [styles.staffInviteButton, styles.staffInviteDeclineButton, pressed && styles.pressablePressed, saving && styles.disabled]}
                  onPress={() => void resolveInvitation(invitation.id, "declineInvitation")}
                  disabled={saving}
                >
                  <Text style={styles.staffInviteDeclineText}>{t.declineInvite}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.staffInviteButton, styles.staffInviteAcceptButton, pressed && styles.pressablePressed, saving && styles.disabled]}
                  onPress={() => void resolveInvitation(invitation.id, "acceptInvitation")}
                  disabled={saving}
                >
                  <Text style={styles.staffInviteAcceptText}>{t.acceptInvite}</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.noIncomingInvites || t.noJoinRequests}</Text>
        )}
      </Panel>

      {members.map((member) => {
        const editing = editId === member.professional.id;
        const name = makeStaffMemberName(member, t.employee);
        const memberIsOwner = member.membership.scope === "owner";
        const access = member.workspaceAccess === "owner" ? t.owner : member.workspaceAccess === "active" ? t.connected : member.workspaceAccess === "invited" ? t.pendingInvites : t.notConnected;
        return (
          <View key={member.professional.id} style={styles.staffMemberCard}>
            {editing ? (
              <View style={styles.sectionStack}>
                <Field label={t.fullName} value={editDraft.fullName} onChangeText={(value) => setEditDraft({ ...editDraft, fullName: value })} />
                <Field label={t.role} value={editDraft.role} onChangeText={(value) => setEditDraft({ ...editDraft, role: value })} editable={!memberIsOwner} />
                <Field label={t.email} value={editDraft.email} onChangeText={(value) => setEditDraft({ ...editDraft, email: value })} keyboardType="email-address" autoCapitalize="none" editable={!memberIsOwner} />
                <Field label={t.phone} value={editDraft.phone} onChangeText={(value) => setEditDraft({ ...editDraft, phone: value })} keyboardType="phone-pad" />
                <View style={styles.settingsActionRow}>
                  <SecondaryButton label={t.cancel} onPress={() => setEditId("")} disabled={saving} />
                  <PrimaryButton label={t.saveMember} onPress={() => void updateMember(member)} disabled={saving || busy} />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.staffMemberCardTop}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>{name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.staffMemberCardInfo}>
                    <Text style={styles.settingsCardTitle}>{name}</Text>
                    <Text style={styles.clientOptionCaption}>{member.membership.role || t.employee} · {access}</Text>
                    <Text style={styles.clientOptionCaption}>{member.professional.email || member.professional.phone || t.empty}</Text>
                  </View>
                  <Pressable style={styles.iconGhostButton} onPress={() => startEdit(member)}>
                    <Ionicons name="create-outline" size={18} color="#334155" />
                  </Pressable>
                </View>
                <View style={styles.staffMemberStatsRow}>
                  <View style={styles.staffMemberStatPill}>
                    <Text style={styles.staffMemberStatValue}>{member.stats?.monthBookings || 0}</Text>
                    <Text style={styles.staffMemberStatLabel} numberOfLines={1}>{t.monthBookings}</Text>
                  </View>
                  <View style={styles.staffMemberStatPill}>
                    <Text style={styles.staffMemberStatValue}>{member.stats?.upcomingBookings || 0}</Text>
                    <Text style={styles.staffMemberStatLabel} numberOfLines={1}>{t.upcomingBookings}</Text>
                  </View>
                </View>
                <View style={styles.settingsActionRow}>
                  <SecondaryButton label={t.scheduleMenu} onPress={onOpenSchedule} />
                  {isOwner && !memberIsOwner && member.pendingInvitation ? (
                    <SecondaryButton label={t.revokeInvite} onPress={() => void revokeInvitation(member.pendingInvitation?.id || "")} disabled={saving || busy} />
                  ) : isOwner && !memberIsOwner ? (
                    <SecondaryButton label={member.workspaceAccess === "invited" ? t.resendInvite : t.invite} onPress={() => void inviteMember(member)} disabled={saving || busy} />
                  ) : null}
                  {isOwner && !memberIsOwner ? (
                    <SecondaryButton label={t.removeMember || t.deleteConfirm || t.staff} onPress={() => void removeMember(member)} disabled={saving || busy} />
                  ) : null}
                </View>
              </>
            )}
          </View>
        );
      })}

    </View>
  );
}

function StaffScheduleTab({
  t,
  language,
  staff,
  workspace,
  busy,
  onSaveSchedule,
  onOpenMembers,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  staff: StaffSnapshot | null;
  workspace: WorkspaceSnapshot | null;
  busy: boolean;
  onSaveSchedule: (member: StaffMemberRecord, workSchedule: WorkScheduleRecord, customSchedule?: Record<string, WorkDayScheduleRecord>, mode?: "fixed" | "flexible", options?: { silent?: boolean }) => Promise<boolean>;
  onOpenMembers: () => void;
}) {
  const members = makeStaffMembers(staff, workspace, t);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const selectedMember = members.find((member) => member.professional.id === selectedMemberId) || members[0] || null;
  const [workDraft, setWorkDraft] = useState<WorkScheduleRecord>({});
  const [customDraft, setCustomDraft] = useState<Record<string, WorkDayScheduleRecord>>({});
  const [scheduleMode, setScheduleMode] = useState<"fixed" | "flexible">("fixed");
  const [weekStart, setWeekStart] = useState(getWeekDates(getTodayIso())[0]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(getTodayIso().slice(0, 7) + "-01");
  const [selectedFlexibleDate, setSelectedFlexibleDate] = useState(getTodayIso());
  const [scheduleAutoStatus, setScheduleAutoStatus] = useState("");
  const scheduleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSaveInFlightRef = useRef(false);
  const latestScheduleDraftRef = useRef({ workDraft, customDraft, scheduleMode });
  const flexibleTemplateRef = useRef<Record<string, WorkIntervalRecord[]>>({});
  const weekDates = getWeekDates(weekStart);
  const weekTitle = formatCalendarTitle("week", weekDates[0], language);
  const monthDates = getMonthGridDates(pickerMonth);
  const monthTitle = new Intl.DateTimeFormat(localeForLanguage(language), { month: "long", year: "numeric" }).format(new Date(`${pickerMonth}T12:00:00`));

  useEffect(() => {
    if (!selectedMemberId && members[0]?.professional.id) {
      setSelectedMemberId(members[0].professional.id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (!selectedMember) return;
    setWorkDraft(copyWorkSchedule(selectedMember.membership.workSchedule, weekDates[0]));
    setCustomDraft({ ...(selectedMember.membership.customSchedule || {}) });
    setScheduleMode(selectedMember.membership.workScheduleMode || "fixed");
    setScheduleAutoStatus("");
  }, [selectedMember?.professional.id, weekStart]);

  useEffect(() => {
    setSelectedFlexibleDate(getTodayIso());
    setPickerMonth(getTodayIso().slice(0, 7) + "-01");
  }, [selectedMember?.professional.id]);

  useEffect(() => {
    latestScheduleDraftRef.current = { workDraft, customDraft, scheduleMode };
  }, [workDraft, customDraft, scheduleMode]);

  useEffect(() => {
    return () => {
      if (scheduleSaveTimerRef.current) {
        clearTimeout(scheduleSaveTimerRef.current);
      }
    };
  }, []);

  function queueScheduleAutosave(delay = 700) {
    if (!selectedMember) return;
    setScheduleAutoStatus("");
    if (scheduleSaveTimerRef.current) {
      clearTimeout(scheduleSaveTimerRef.current);
    }
    scheduleSaveTimerRef.current = setTimeout(() => {
      scheduleSaveTimerRef.current = null;
      void flushScheduleAutosave();
    }, delay);
  }

  async function flushScheduleAutosave() {
    if (!selectedMember || scheduleSaveInFlightRef.current) return;
    const latest = latestScheduleDraftRef.current;
    if (!validateScheduleBeforeSave(false, latest.workDraft, latest.customDraft, latest.scheduleMode)) {
      setScheduleAutoStatus(t.invalidIntervalRange);
      return;
    }
    scheduleSaveInFlightRef.current = true;
    setScheduleAutoStatus(t.settingsSaving);
    const ok = await onSaveSchedule(selectedMember, latest.workDraft, latest.customDraft, latest.scheduleMode, { silent: true });
    setScheduleAutoStatus(ok ? t.settingsSaved : t.settingsSaveError);
    scheduleSaveInFlightRef.current = false;
  }

  function updateScheduleMode(mode: "fixed" | "flexible") {
    setScheduleMode(mode);
    if (mode === "flexible") {
      setCalendarOpen(false);
      setPickerMonth(selectedFlexibleDate.slice(0, 7) + "-01");
    }
    latestScheduleDraftRef.current = { workDraft, customDraft, scheduleMode: mode };
    queueScheduleAutosave(120);
  }

  function getDraftDay(key: string, date: string) {
    if (scheduleMode === "flexible") {
      return normalizeScheduleDay(customDraft[date] || selectedMember?.membership.customSchedule?.[date], date);
    }
    return normalizeScheduleDay(workDraft[key], date);
  }

  function setDaySchedule(key: string, date: string, next: WorkDayScheduleRecord) {
    if (scheduleMode === "flexible") {
      const nextCustomDraft = { ...customDraft, [date]: next };
      setCustomDraft(nextCustomDraft);
      latestScheduleDraftRef.current = { workDraft, customDraft: nextCustomDraft, scheduleMode };
      queueScheduleAutosave();
      return;
    }
    const nextWorkDraft = { ...workDraft, [key]: next };
    setWorkDraft(nextWorkDraft);
    latestScheduleDraftRef.current = { workDraft: nextWorkDraft, customDraft, scheduleMode };
    queueScheduleAutosave();
  }

  function updateDayEnabled(key: string, date: string, enabled: boolean) {
    const current = getDraftDay(key, date);
    const intervals = getDayIntervalsRecord(current);
    setDaySchedule(key, date, serializeIntervalsToDay(enabled, intervals, current));
  }

  function updateDayInterval(key: string, date: string, index: number, field: keyof WorkIntervalRecord, value: string) {
    const current = getDraftDay(key, date);
    const intervals = getDayIntervalsRecord(current).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
    setDaySchedule(key, date, serializeIntervalsToDay(true, intervals, current));
  }

  function addDayInterval(key: string, date: string, index: number) {
    const current = getDraftDay(key, date);
    const nextIntervals = insertWorkIntervalRecord(getDayIntervalsRecord(current), index);
    if (!nextIntervals) {
      Alert.alert(t.staffSchedule, t.noRoomForInterval);
      return;
    }
    setDaySchedule(key, date, serializeIntervalsToDay(true, nextIntervals, current));
  }

  function removeDayInterval(key: string, date: string, index: number) {
    const current = getDraftDay(key, date);
    const nextIntervals = getDayIntervalsRecord(current).filter((_, itemIndex) => itemIndex !== index);
    setDaySchedule(key, date, serializeIntervalsToDay(nextIntervals.length > 0, nextIntervals, current));
  }

  function getRememberedFlexibleIntervals(member = selectedMember) {
    const memberId = member?.professional.id || "";
    const remembered = flexibleTemplateRef.current[memberId];
    if (remembered?.length) {
      return remembered.map((interval) => ({ ...interval }));
    }

    const source = customDraft || member?.membership.customSchedule || {};
    const latestDate = Object.keys(source)
      .sort()
      .reverse()
      .find((date) => source[date]?.enabled);
    const intervals = latestDate ? getDayIntervalsRecord(source[latestDate]) : DEFAULT_FLEXIBLE_INTERVALS;
    return intervals.length ? intervals.map((interval) => ({ ...interval })) : DEFAULT_FLEXIBLE_INTERVALS.map((interval) => ({ ...interval }));
  }

  function rememberFlexibleIntervals(memberId: string, intervals: WorkIntervalRecord[]) {
    if (!intervals.length) {
      delete flexibleTemplateRef.current[memberId];
      return;
    }
    flexibleTemplateRef.current[memberId] = intervals.map((interval) => ({ ...interval }));
  }

  function selectFlexibleDate(date: string) {
    if (!selectedMember) return;
    setSelectedFlexibleDate(date);
    setPickerMonth(date.slice(0, 7) + "-01");

    const existing = customDraft[date] || selectedMember.membership.customSchedule?.[date];
    if (existing) {
      if (existing.enabled) {
        rememberFlexibleIntervals(selectedMember.professional.id, getDayIntervalsRecord(existing));
      }
      return;
    }

    const intervals = getRememberedFlexibleIntervals(selectedMember);
    const nextDay = serializeIntervalsToDay(true, intervals, getFallbackSchedule(date));
    const nextCustomDraft = { ...customDraft, [date]: nextDay };
    setCustomDraft(nextCustomDraft);
    rememberFlexibleIntervals(selectedMember.professional.id, intervals);
    latestScheduleDraftRef.current = { workDraft, customDraft: nextCustomDraft, scheduleMode };
    queueScheduleAutosave(120);
  }

  function getMonthDraftDay(date: string) {
    const existing = customDraft[date] || selectedMember?.membership.customSchedule?.[date];
    return existing ? normalizeScheduleDay(existing, date) : getClosedScheduleForDate(date);
  }

  function setMonthDateSchedule(date: string, next: WorkDayScheduleRecord) {
    const nextCustomDraft = { ...customDraft, [date]: next };
    setCustomDraft(nextCustomDraft);
    if (selectedMember && next.enabled) {
      rememberFlexibleIntervals(selectedMember.professional.id, getDayIntervalsRecord(next));
    }
    latestScheduleDraftRef.current = { workDraft, customDraft: nextCustomDraft, scheduleMode };
    queueScheduleAutosave();
  }

  function updateMonthDateEnabled(date: string, enabled: boolean) {
    const existing = customDraft[date] || selectedMember?.membership.customSchedule?.[date];
    if (enabled && !existing && selectedMember) {
      const intervals = getRememberedFlexibleIntervals(selectedMember);
      setMonthDateSchedule(date, serializeIntervalsToDay(true, intervals, getFallbackSchedule(date)));
      return;
    }

    const current = getMonthDraftDay(date);
    setMonthDateSchedule(date, serializeIntervalsToDay(enabled, getDayIntervalsRecord(current), current));
  }

  function updateMonthDateInterval(date: string, index: number, field: keyof WorkIntervalRecord, value: string) {
    const current = getMonthDraftDay(date);
    const intervals = getDayIntervalsRecord(current).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
    setMonthDateSchedule(date, serializeIntervalsToDay(true, intervals, current));
  }

  function addMonthDateInterval(date: string, index: number) {
    const current = getMonthDraftDay(date);
    const nextIntervals = insertWorkIntervalRecord(getDayIntervalsRecord(current), index);
    if (!nextIntervals) {
      Alert.alert(t.staffSchedule, t.noRoomForInterval);
      return;
    }
    setMonthDateSchedule(date, serializeIntervalsToDay(true, nextIntervals, current));
  }

  function removeMonthDateInterval(date: string, index: number) {
    const current = getMonthDraftDay(date);
    const nextIntervals = getDayIntervalsRecord(current).filter((_, itemIndex) => itemIndex !== index);
    setMonthDateSchedule(date, serializeIntervalsToDay(nextIntervals.length > 0, nextIntervals, current));
  }

  function validateScheduleBeforeSave(showAlert = true, workSchedule = workDraft, customSchedule = customDraft, mode = scheduleMode) {
    const daysToCheck = mode === "flexible"
      ? Object.entries(customSchedule).map(([date, day]) => normalizeScheduleDay(day, date))
      : staffWeekKeys.map((key, index) => normalizeScheduleDay(workSchedule[key], weekDates[index]));

    for (const day of daysToCheck) {
      if (!day.enabled) continue;
      const validation = validateWorkIntervals(getDayIntervalsRecord(day));
      if (!validation.ok) {
        if (showAlert) {
          Alert.alert(t.staffSchedule, validation.reason === "overlap" ? t.overlappingIntervals : t.invalidIntervalRange);
        }
        return false;
      }
    }

    return true;
  }

  function shiftMonth(monthDate: string, months: number) {
    const date = new Date(`${monthDate}T12:00:00`);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  if (!selectedMember) {
    return (
      <View style={styles.sectionStack}>
        <Panel title={t.staffSchedule}>
          <Text style={styles.emptyText}>{t.empty}</Text>
        </Panel>
      </View>
    );
  }

  return (
    <View style={styles.sectionStack}>
      <View style={styles.staffSelectorCard}>
        <View style={styles.staffSelectorHeader}>
          <View style={styles.staffMemberCardInfo}>
            <Text style={styles.settingsCardTitle}>{makeStaffMemberName(selectedMember, t.employee)}</Text>
            <Text style={styles.clientOptionCaption}>{selectedMember.membership.scope === "owner" ? t.owner : selectedMember.membership.role || t.employee}</Text>
          </View>
          <SecondaryButton label={t.teamMembers} onPress={onOpenMembers} />
        </View>
        {members.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.staffMemberRail}>
            {members.map((member) => {
              const active = member.professional.id === selectedMember.professional.id;
              const name = makeStaffMemberName(member, t.employee);
              return (
                <Pressable key={member.professional.id} style={[styles.staffMemberChip, active && styles.staffMemberChipActive]} onPress={() => setSelectedMemberId(member.professional.id)}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>{name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[styles.staffMemberName, active && styles.staffMemberNameActive]}>{name}</Text>
                    <Text style={[styles.staffMemberRole, active && styles.staffMemberNameActive]}>{member.membership.scope === "owner" ? t.owner : member.membership.role || t.employee}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.staffWeekCard}>
        <View style={styles.staffCalendarControls}>
          <Pressable
            style={styles.dateButton}
            onPress={() => {
              if (scheduleMode === "flexible") {
                const nextMonth = shiftMonth(pickerMonth, -1);
                setPickerMonth(nextMonth);
                setSelectedFlexibleDate(nextMonth);
              } else {
                setWeekStart(shiftDate(weekStart, -7));
              }
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>
          <Pressable
            style={styles.staffWeekPickerButton}
            onPress={() => {
              if (scheduleMode === "fixed") {
                setPickerMonth(weekStart.slice(0, 7) + "-01");
                setCalendarOpen(!calendarOpen);
              }
            }}
          >
            <Text style={styles.staffWeekPickerText}>{scheduleMode === "flexible" ? monthTitle : weekTitle}</Text>
          </Pressable>
          <Pressable
            style={styles.dateButton}
            onPress={() => {
              if (scheduleMode === "flexible") {
                const nextMonth = shiftMonth(pickerMonth, 1);
                setPickerMonth(nextMonth);
                setSelectedFlexibleDate(nextMonth);
              } else {
                setWeekStart(shiftDate(weekStart, 7));
              }
            }}
          >
            <Ionicons name="chevron-forward" size={22} color="#0F172A" />
          </Pressable>
        </View>
        {scheduleMode === "fixed" ? (
          <View style={styles.settingsActionRow}>
            <SecondaryButton label={t.currentWeek} onPress={() => setWeekStart(getWeekDates(getTodayIso())[0])} />
          </View>
        ) : null}
        {calendarOpen && scheduleMode === "fixed" ? (
          <View style={styles.staffCalendarBox}>
            <View style={styles.staffDayHeader}>
              <Pressable style={styles.iconGhostButton} onPress={() => setPickerMonth(shiftMonth(pickerMonth, -1))}>
                <Ionicons name="chevron-back" size={18} color="#334155" />
              </Pressable>
              <Text style={styles.settingsCardTitle}>{monthTitle}</Text>
              <Pressable style={styles.iconGhostButton} onPress={() => setPickerMonth(shiftMonth(pickerMonth, 1))}>
                <Ionicons name="chevron-forward" size={18} color="#334155" />
              </Pressable>
            </View>
            <View style={styles.staffCalendarGrid}>
              {monthDates.map((date) => {
                const inMonth = date.slice(0, 7) === pickerMonth.slice(0, 7);
                const selected = weekDates.includes(date);
                return (
                  <Pressable
                    key={date}
                    style={[styles.staffCalendarDay, !inMonth && styles.staffCalendarDayMuted, selected && styles.staffCalendarDayActive]}
                    onPress={() => {
                      setWeekStart(getWeekDates(date)[0]);
                      setCalendarOpen(false);
                    }}
                  >
                    <Text style={[styles.staffCalendarDayText, selected && styles.staffCalendarDayTextActive]}>{Number(date.slice(8, 10))}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <Panel title={t.scheduleMenu}>
        <View style={styles.staffScheduleModeRow}>
          {[
            { id: "fixed", label: t.weekView || t.repeatingSchedule },
            { id: "flexible", label: t.calendar },
          ].map((item) => {
            const active = scheduleMode === item.id;
            return (
                <Pressable key={item.id} style={[styles.staffScheduleModeButton, active && styles.staffScheduleModeButtonActive]} onPress={() => updateScheduleMode(item.id as "fixed" | "flexible")}>
                <Text style={[styles.staffScheduleModeText, active && styles.staffScheduleModeTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {scheduleMode === "flexible" ? (
          <View style={styles.staffMonthPlanner}>
            <View style={styles.staffCalendarGrid}>
              {monthDates.map((date) => {
                const inMonth = date.slice(0, 7) === pickerMonth.slice(0, 7);
                const selected = selectedFlexibleDate === date;
                const day = getMonthDraftDay(date);
                const working = day.enabled === true;
                const intervals = getDayIntervalsRecord(day);
                return (
                  <Pressable
                    key={`month-${date}`}
                    style={[
                      styles.staffCalendarDay,
                      styles.staffFlexibleCalendarDay,
                      !inMonth && styles.staffCalendarDayMuted,
                      working && styles.staffCalendarDayWork,
                      selected && styles.staffCalendarDayActive,
                    ]}
                    onPress={() => selectFlexibleDate(date)}
                  >
                    <Text style={[styles.staffCalendarDayText, selected && styles.staffCalendarDayTextActive]}>{Number(date.slice(8, 10))}</Text>
                    {working ? (
                      <Text style={[styles.staffCalendarDayCaption, selected && styles.staffCalendarDayTextActive]} numberOfLines={1}>
                        {intervals.map((interval) => `${interval.startTime}-${interval.endTime}`).join(" · ")}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.staffSelectedDayCard}>
              {(() => {
                const day = getMonthDraftDay(selectedFlexibleDate);
                const intervals = getDayIntervalsRecord(day);
                return (
                  <>
                    <View style={styles.staffDayHeader}>
                      <View style={styles.staffMemberCardInfo}>
                        <Text style={styles.staffDayTitle}>{formatShortDate(selectedFlexibleDate, language)}</Text>
                        <Text style={styles.clientOptionCaption}>
                          {day.enabled ? `${t.workingDay} · ${formatMoneylessHours(getIntervalsDurationMinutes(intervals), t.hoursShort)}` : t.dayOff}
                        </Text>
                      </View>
                      <Pressable style={[styles.mobileSwitch, day.enabled && styles.mobileSwitchActive]} onPress={() => updateMonthDateEnabled(selectedFlexibleDate, !day.enabled)}>
                        <View style={[styles.mobileSwitchThumb, day.enabled && styles.mobileSwitchThumbActive]} />
                      </Pressable>
                    </View>
                    {day.enabled ? (
                      <View style={styles.staffIntervalsBox}>
                        <Text style={styles.staffTimeLabel}>{t.workIntervals}</Text>
                        <WorkIntervalsEditor
                          t={t}
                          intervals={intervals}
                          onChange={(intervalIndex, field, value) => updateMonthDateInterval(selectedFlexibleDate, intervalIndex, field, value)}
                          onAddAfter={(intervalIndex) => addMonthDateInterval(selectedFlexibleDate, intervalIndex)}
                          onRemove={(intervalIndex) => removeMonthDateInterval(selectedFlexibleDate, intervalIndex)}
                        />
                      </View>
                    ) : null}
                  </>
                );
              })()}
            </View>
          </View>
        ) : (
          staffWeekKeys.map((key, index) => {
          const date = weekDates[index] || getTodayIso();
          const day = getDraftDay(key, date);
          const active = day.enabled;
          const intervals = getDayIntervalsRecord(day);
          return (
            <View key={key} style={styles.staffDayCard}>
              <View style={styles.staffDayHeader}>
                <View>
                  <Text style={styles.staffDayTitle}>{formatShortDate(weekDates[index] || getTodayIso(), language)}</Text>
                  <Text style={styles.clientOptionCaption}>{active ? `${t.workingDay} · ${formatMoneylessHours(getIntervalsDurationMinutes(intervals), t.hoursShort)}` : t.dayOff}</Text>
                </View>
                <Pressable style={[styles.mobileSwitch, active && styles.mobileSwitchActive]} onPress={() => updateDayEnabled(key, date, !active)}>
                  <View style={[styles.mobileSwitchThumb, active && styles.mobileSwitchThumbActive]} />
                </Pressable>
              </View>
              {active ? (
                <View style={styles.staffIntervalsBox}>
                  <Text style={styles.staffTimeLabel}>{t.workIntervals}</Text>
                  <WorkIntervalsEditor
                    t={t}
                    intervals={intervals}
                    onChange={(intervalIndex, field, value) => updateDayInterval(key, date, intervalIndex, field, value)}
                    onAddAfter={(intervalIndex) => addDayInterval(key, date, intervalIndex)}
                    onRemove={(intervalIndex) => removeDayInterval(key, date, intervalIndex)}
                  />
                </View>
              ) : null}
            </View>
          );
          })
        )}
        {scheduleAutoStatus ? <Text style={styles.settingsMutedNotice}>{scheduleAutoStatus}</Text> : null}
        <PrimaryButton label={t.saveSchedule} onPress={() => { if (validateScheduleBeforeSave()) void onSaveSchedule(selectedMember, workDraft, customDraft, scheduleMode); }} disabled={busy} />
      </Panel>
    </View>
  );
}

function copyWorkSchedule(schedule: WorkScheduleRecord | undefined, anchorDate = getTodayIso()) {
  const source = schedule || {};
  return Object.fromEntries(
    staffWeekKeys.map((key, index) => {
      const date = shiftDate(getWeekDates(anchorDate)[0], index);
      return [key, normalizeScheduleDay(source[key], date)];
    })
  ) as WorkScheduleRecord;
}

function WorkIntervalsEditor({
  t,
  intervals,
  onChange,
  onAddAfter,
  onRemove,
}: {
  t: Record<string, string>;
  intervals: WorkIntervalRecord[];
  onChange: (index: number, field: keyof WorkIntervalRecord, value: string) => void;
  onAddAfter: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View style={styles.staffIntervalsStack}>
      {intervals.map((interval, index) => (
        <View key={index} style={styles.staffIntervalRow}>
          <StaffTimeInput label={t.workFrom} value={interval.startTime} onChangeText={(value) => onChange(index, "startTime", value)} />
          <StaffTimeInput label={t.workTo} value={interval.endTime} onChangeText={(value) => onChange(index, "endTime", value)} />
          <View style={styles.staffIntervalActions}>
            <Pressable style={styles.staffIntervalIconButton} onPress={() => onAddAfter(index)} accessibilityLabel={t.addWorkTime}>
              <Ionicons name="add-circle-outline" size={22} color="#334155" />
            </Pressable>
            <Pressable style={styles.staffIntervalIconButton} onPress={() => onRemove(index)} accessibilityLabel={t.removeWorkTime}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function StaffTimeInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.staffTimeField}>
      <Text style={styles.staffTimeLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="numbers-and-punctuation" style={styles.staffTimeInput} />
    </View>
  );
}

function normalizeCategoryList(categories: unknown[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of categories) {
    const value = safeText(item).trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return sortServiceCategoryOptions(result);
}

function makeSettingsDraft(workspace: WorkspaceSnapshot | null, language: AppLanguage): SettingsDraftState {
  return {
    firstName: workspace?.professional.firstName || "",
    lastName: workspace?.professional.lastName || "",
    email: workspace?.professional.email || "",
    phone: workspace?.professional.phone || "",
    avatarUrl: workspace?.professional.avatarUrl || "",
    businessName: workspace?.business.name || "",
    website: workspace?.business.website || "",
    accountType: workspace?.business.accountType || "solo",
    serviceMode: workspace?.business.serviceMode || SERVICE_MODE_VALUES.onsite,
    categories: normalizeCategoryList(workspace?.business.categories || []),
    country: workspace?.professional.country || "Ukraine",
    timezone: workspace?.professional.timezone || "Europe/Kiev",
    language,
    currency: workspace?.professional.currency || "UAH",
    allowOnlineBooking: workspace?.business.allowOnlineBooking === true,
    address: workspace?.business.address || "",
    addressDetails: workspace?.business.addressDetails || "",
    addressLat: typeof workspace?.business.addressLat === "number" ? workspace.business.addressLat : null,
    addressLon: typeof workspace?.business.addressLon === "number" ? workspace.business.addressLon : null,
  };
}

function settingsSectionLabel(section: MobileSettingsSection, t: Record<string, string>) {
  if (section === "general") return t.settingsGeneral;
  if (section === "online") return t.settingsOnline;
  if (section === "services") return t.settingsServices;
  if (section === "schedule") return t.settingsSchedule;
  if (section === "push") return t.settingsPush;
  if (section === "telegram") return t.settingsTelegram;
  return t.settingsAddress;
}

function SettingsTab({
  t,
  language,
  setLanguage,
  workspace,
  staff,
  catalog,
  apiFetch,
  trackAdsEvent,
  onRefreshWorkspace,
  onWorkspaceUpdated,
  setActiveTab,
  activeSection,
  setActiveSection,
  onSignOut,
  biometricAvailable,
  biometricEnabled,
  onToggleBiometric,
  busy,
  onRequestPremium,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  workspace: WorkspaceSnapshot | null;
  staff: StaffSnapshot | null;
  catalog: ServiceCatalogCategory[];
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  trackAdsEvent: (eventName: MobileAdsEventName, payload?: Record<string, string | number | boolean | null | undefined>) => void;
  onRefreshWorkspace: () => void;
  onWorkspaceUpdated: (workspace: WorkspaceSnapshot) => void;
  setActiveTab: (tab: AppTab) => void;
  activeSection: MobileSettingsSection;
  setActiveSection: (section: MobileSettingsSection) => void;
  onSignOut: () => void;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  onToggleBiometric: () => void;
  busy: boolean;
  onRequestPremium: () => void;
}) {
  const [draft, setDraft] = useState<SettingsDraftState>(() => makeSettingsDraft(workspace, language));
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [pendingJoinRequests, setPendingJoinRequests] = useState<NonNullable<MobileNotificationsPayload["pendingJoinRequests"]>>([]);
  const pendingJoinRequestResolvesRef = useRef<Set<string>>(new Set());
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [photoActionPhoto, setPhotoActionPhoto] = useState<BusinessPhotoRecord | null>(null);
  const [photosDraft, setPhotosDraft] = useState<BusinessPhotoRecord[]>(() => workspace?.business.photos?.filter((photo) => photo.status !== "blocked") || []);
  const [photoUploadStatus, setPhotoUploadStatus] = useState("");
  const [addressSearchValue, setAddressSearchValue] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestionRecord[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [telegramPanel, setTelegramPanel] = useState<TelegramPanelState | null>(null);
  const [telegramSection, setTelegramSection] = useState<"notifications" | "reminders" | "support">("notifications");
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [isTelegramSaving, setIsTelegramSaving] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [pushPanel, setPushPanel] = useState<PushPanelState | null>(null);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<Notifications.PermissionStatus | "unknown">("unknown");
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isPushSaving, setIsPushSaving] = useState(false);
  const [pushError, setPushError] = useState("");
  const [premiumPackages, setPremiumPackages] = useState<{ monthly: PurchasesPackage | null; yearly: PurchasesPackage | null }>({ monthly: null, yearly: null });
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [premiumMessage, setPremiumMessage] = useState("");
  const [isAutoSavingSettings, setIsAutoSavingSettings] = useState(false);
  const pendingSettingsPatchRef = useRef<SettingsPatchPayload>({});
  const pendingPhotoDeletesRef = useRef<Set<string>>(new Set());
  const settingsPatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsPatchInFlightRef = useRef(false);
  const isOwner = workspace?.membership?.scope !== "member";
  const publicBookingUrl = workspace?.business.publicBookingUrl || "";
  const photos = photosDraft.filter((photo) => photo.status !== "blocked");
  const hasPremium = isPremiumActive(workspace?.professional);
  const premiumStatusLabel = getPremiumStatusLabel(workspace?.professional, t);
  const premiumStatusDetail = getPremiumStatusDetail(workspace?.professional, t);
  const activeSectionLocked = !hasPremium && isPremiumSettingsSection(activeSection);
  const bookingCredits = workspace?.bookingCredits || {
    total: 100,
    used: 0,
    remaining: 100,
  };
  const bookingLimitPercent = bookingCredits.total > 0 ? Math.min(100, Math.round((bookingCredits.used / bookingCredits.total) * 100)) : 0;
  const bookingLimitEnded = !hasPremium && bookingCredits.remaining <= 0;
  const selectedBusinessCategories = useMemo(() => normalizeCategoryList(draft.categories), [draft.categories]);
  const businessCategoryOptions = useMemo(
    () => normalizeCategoryList([...SYSTEM_SERVICE_CATEGORIES, ...(workspace?.business.categories || []), ...selectedBusinessCategories]).sort(
      (left, right) => getServiceCategorySortOrder(left) - getServiceCategorySortOrder(right) || left.localeCompare(right)
    ),
    [selectedBusinessCategories, workspace?.business.categories]
  );

  function filterPendingPhotoDeletes(nextPhotos: BusinessPhotoRecord[]) {
    return nextPhotos.filter((photo) => !pendingPhotoDeletesRef.current.has(photo.id) && photo.status !== "blocked");
  }

  function applySettingsPayload(payload: any) {
    if (payload?.workspace?.professional?.id) {
      onWorkspaceUpdated({
        ...(payload.workspace as WorkspaceSnapshot),
        bookingCredits: payload.bookingCredits || (payload.workspace as WorkspaceSnapshot).bookingCredits,
      });
    }
  }

  function hasSettingsPatch(patch: SettingsPatchPayload) {
    return Boolean(
      (patch.professional && Object.keys(patch.professional).length > 0) ||
      (patch.business && Object.keys(patch.business).length > 0) ||
      typeof patch.newPassword === "string"
    );
  }

  function mergeSettingsPatch(target: SettingsPatchPayload, patch: SettingsPatchPayload) {
    if (patch.professional) {
      target.professional = { ...(target.professional || {}), ...patch.professional };
    }
    if (patch.business) {
      target.business = { ...(target.business || {}), ...patch.business };
    }
    if (typeof patch.newPassword === "string") {
      target.newPassword = patch.newPassword;
    }
  }

  function scheduleSettingsPatchFlush(delay = 350) {
    if (settingsPatchTimerRef.current) {
      clearTimeout(settingsPatchTimerRef.current);
    }
    settingsPatchTimerRef.current = setTimeout(() => {
      settingsPatchTimerRef.current = null;
      void flushSettingsPatch();
    }, delay);
  }

  function queueSettingsPatch(patch: SettingsPatchPayload, delay = 350) {
    mergeSettingsPatch(pendingSettingsPatchRef.current, patch);
    setStatusText("");
    scheduleSettingsPatchFlush(delay);
  }

  async function flushSettingsPatch() {
    if (settingsPatchInFlightRef.current) return;
    const patch = pendingSettingsPatchRef.current;
    if (!hasSettingsPatch(patch)) return;

    pendingSettingsPatchRef.current = {};
    settingsPatchInFlightRef.current = true;
    setIsAutoSavingSettings(true);
    try {
      const payload = await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      applySettingsPayload(payload);
      setStatusText(t.settingsSaved);
    } catch {
      setStatusText(t.settingsSaveError);
    } finally {
      settingsPatchInFlightRef.current = false;
      setIsAutoSavingSettings(false);
      if (hasSettingsPatch(pendingSettingsPatchRef.current)) {
        scheduleSettingsPatchFlush(80);
      }
    }
  }

  function updateDraftAndQueue<K extends keyof SettingsDraftState>(key: K, value: SettingsDraftState[K], patch: SettingsPatchPayload, delay = 350) {
    updateDraft(key, value);
    queueSettingsPatch(patch, delay);
  }

  function toggleBusinessCategory(category: string) {
    if (!isOwner) return;
    const normalized = normalizeCategoryList([category])[0];
    if (!normalized) return;
    const isSelected = selectedBusinessCategories.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase());
    const nextCategories = isSelected
      ? selectedBusinessCategories.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())
      : [...selectedBusinessCategories, normalized];
    updateDraftAndQueue("categories", nextCategories, { business: { categories: nextCategories } }, 80);
  }

  async function uploadMediaDataUrl(dataUrl: string, kind: "avatar" | "business-photo") {
    const payload = await apiFetch("/api/mobile/pro/media/upload", {
      method: "POST",
      body: JSON.stringify({ kind, dataUrl }),
    });
    const url = typeof payload?.url === "string" ? payload.url.trim() : "";
    if (!url) {
      throw new Error(t.settingsSaveError);
    }
    return url;
  }

  function getUploadImageMimeType(value?: string | null) {
    const mimeType = String(value || "").trim().toLowerCase();
    if (mimeType === "image/png" || mimeType === "image/webp" || mimeType === "image/gif") {
      return mimeType;
    }
    return "image/jpeg";
  }

  async function imageAssetToDataUrl(asset: ImagePicker.ImagePickerAsset, options: { compress?: number } = {}) {
    if (!asset.uri) {
      if (asset.base64) {
        return `data:${getUploadImageMimeType(asset.mimeType)};base64,${asset.base64}`;
      }
      throw new Error(t.settingsSaveError);
    }

    if (Platform.OS !== "web") {
      const result = await ImageManipulator.manipulateAsync(asset.uri, [], {
        compress: options.compress ?? 0.72,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });
      if (result.base64) {
        return `data:image/jpeg;base64,${result.base64}`;
      }
      throw new Error(t.settingsSaveError);
    }

    if (asset.base64) {
      return `data:${getUploadImageMimeType(asset.mimeType)};base64,${asset.base64}`;
    }

    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function syncPremiumCustomerInfo(customerInfo: CustomerInfo) {
    const entitlement = getCustomerInfoEntitlement(customerInfo);
    const store = getMobileStoreSource();
    await apiFetch("/api/mobile/pro/subscription/store", {
      method: "POST",
      body: JSON.stringify({
        platform: Platform.OS,
        store,
        customerInfo: {
          originalAppUserId: customerInfo.originalAppUserId,
          activeSubscriptions: customerInfo.activeSubscriptions,
          latestExpirationDate: customerInfo.latestExpirationDate,
          store,
          platform: Platform.OS,
          entitlement: entitlement
            ? {
                identifier: entitlement.identifier,
                isActive: entitlement.isActive,
                productIdentifier: entitlement.productIdentifier,
                expirationDate: entitlement.expirationDate,
                periodType: entitlement.periodType,
                store: entitlement.store || store,
              }
            : null,
        },
      }),
    });
    setPremiumMessage(t.premiumReady);
    onRefreshWorkspace();
  }

  async function loadPremiumPackages(silent = false) {
    if (!workspace?.professional.id || isPremiumLoading) return;
    if (!silent) {
      setIsPremiumLoading(true);
      setPremiumMessage("");
    }
    try {
      await configureRevenueCatForProfessional(workspace.professional.id);
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages || Object.values(offerings.all)[0]?.availablePackages || [];
      setPremiumPackages({
        monthly: offerings.current?.monthly || findRevenueCatPackage(packages, "monthly"),
        yearly: offerings.current?.annual || findRevenueCatPackage(packages, "yearly"),
      });
      const customerInfo = await Purchases.getCustomerInfo();
      if (getCustomerInfoEntitlement(customerInfo)?.isActive) {
        await syncPremiumCustomerInfo(customerInfo);
      }
    } catch (error) {
      if (!silent) {
        const message =
          error instanceof Error && error.message === "revenuecat_not_configured" ? t.premiumMissingConfig : t.premiumUnavailable;
        setPremiumMessage(message);
      }
    } finally {
      if (!silent) setIsPremiumLoading(false);
    }
  }

  async function buyPremiumPackage(billing: "monthly" | "yearly") {
    if (!workspace?.professional.id) return;
    setIsPremiumLoading(true);
    setPremiumMessage("");
    try {
      await configureRevenueCatForProfessional(workspace.professional.id);
      let targetPackage = premiumPackages[billing];
      if (!targetPackage) {
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages || Object.values(offerings.all)[0]?.availablePackages || [];
        targetPackage = (billing === "yearly" ? offerings.current?.annual : offerings.current?.monthly) || findRevenueCatPackage(packages, billing);
      }
      if (!targetPackage) {
        throw new Error("missing_package");
      }
      trackAdsEvent("mobile_checkout_start", {
        billing,
        product_id: targetPackage.product.identifier,
        source: "premium",
        country: workspace.professional.country || "Ukraine",
        currency: workspace.professional.currency || inferCurrency(workspace.professional.country || "Ukraine")
      });
      const result = await Purchases.purchasePackage(targetPackage);
      await syncPremiumCustomerInfo(result.customerInfo);
      trackAdsEvent("mobile_purchase_complete", {
        billing,
        product_id: targetPackage.product.identifier,
        source: "premium",
        store: getMobileStoreSource(),
        country: workspace.professional.country || "Ukraine",
        currency: workspace.professional.currency || inferCurrency(workspace.professional.country || "Ukraine")
      });
    } catch (error: any) {
      if (error?.userCancelled || (error instanceof Error && error.message === "purchase_cancelled")) {
        setPremiumMessage(t.premiumPurchaseCancelled);
      } else if (error instanceof Error && error.message === "purchase_deferred") {
        setPremiumMessage(t.premiumUnavailable);
      } else if (error instanceof Error && error.message === "missing_package") {
        setPremiumMessage(t.premiumMissingConfig);
      } else if (error instanceof Error && error.message === "revenuecat_not_configured") {
        setPremiumMessage(t.premiumMissingConfig);
      } else {
        setPremiumMessage(error instanceof Error ? error.message : t.premiumSyncFailed);
      }
    } finally {
      setIsPremiumLoading(false);
    }
  }

  async function restorePremiumPurchase() {
    if (!workspace?.professional.id) return;
    setIsPremiumLoading(true);
    setPremiumMessage("");
    try {
      await configureRevenueCatForProfessional(workspace.professional.id);
      const customerInfo = await Purchases.restorePurchases();
      await syncPremiumCustomerInfo(customerInfo);
    } catch (error) {
      if (error instanceof Error && error.message === "revenuecat_not_configured") {
        setPremiumMessage(t.premiumMissingConfig);
      } else if (error instanceof Error && error.message === "missing_package") {
        setPremiumMessage(t.premiumMissingConfig);
      } else {
        setPremiumMessage(error instanceof Error ? error.message : t.premiumSyncFailed);
      }
    } finally {
      setIsPremiumLoading(false);
    }
  }

  useEffect(() => {
    if (settingsPatchInFlightRef.current || hasSettingsPatch(pendingSettingsPatchRef.current)) {
      return;
    }
    setDraft(makeSettingsDraft(workspace, language));
    setNewPassword("");
    setAddressSearchValue(workspace?.business.address || "");
    setPhotosDraft(filterPendingPhotoDeletes(workspace?.business.photos || []));
  }, [workspace, language]);

  useEffect(() => {
    return () => {
      if (settingsPatchTimerRef.current) {
        clearTimeout(settingsPatchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!workspace?.professional.id) return;
    void loadPremiumPackages(true);
  }, [workspace?.professional.id]);

  useEffect(() => {
    if (staff?.joinRequests) {
      setPendingJoinRequests(
        staff.joinRequests.map((request) => ({
          id: request.id,
          createdAt: request.createdAt,
          role: request.role,
          professionalId: request.professional?.id || "",
          professionalName:
            request.professional
              ? `${request.professional.firstName} ${request.professional.lastName}`.trim() ||
                request.professional.email ||
                request.professional.phone
              : "",
          professionalEmail: request.professional?.email || "",
          professionalPhone: request.professional?.phone || "",
        })).filter((request) => !pendingJoinRequestResolvesRef.current.has(request.id))
      );
      return;
    }

    apiFetch("/api/mobile/pro/calendar?mode=notifications")
      .then((payload) => setPendingJoinRequests((payload?.pendingJoinRequests || []).filter((request: NonNullable<MobileNotificationsPayload["pendingJoinRequests"]>[number]) => !pendingJoinRequestResolvesRef.current.has(request.id))))
      .catch(() => setPendingJoinRequests([]));
  }, [staff?.joinRequests, workspace?.business.id]);

  useEffect(() => {
    if (!hasPremium || activeSection !== "telegram" || telegramPanel || isTelegramLoading) return;
    void loadTelegramPanel(true);
  }, [activeSection, hasPremium, telegramPanel, isTelegramLoading]);

  useEffect(() => {
    if (!hasPremium || activeSection !== "push" || pushPanel || isPushLoading) return;
    void loadPushPanel(true);
  }, [activeSection, hasPremium, pushPanel, isPushLoading]);

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then((permission) => setPushPermissionStatus(permission.status))
      .catch(() => setPushPermissionStatus("unknown"));
  }, []);

  useEffect(() => {
    const query = addressSearchValue.trim();
    if (activeSection !== "address" || query.length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/address/search?q=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => ({}));
        const results = Array.isArray(payload?.results) ? payload.results : [];
        if (cancelled) return;
        setAddressSuggestions(
          results.map((item: any) => {
            const address = item.address || {};
            const house = String(address.house_number || "");
            const street = String(address.road || address.pedestrian || address.footway || address.neighbourhood || "");
            const city = String(address.city || address.town || address.village || address.municipality || "");
            const region = String(address.state || address.region || address.county || "");
            const country = String(address.country || "");
            const postcode = String(address.postcode || "");
            const displayName = String(item.display_name || "");
            const primaryLine = [street, house].filter(Boolean).join(", ") || displayName.split(",")[0]?.trim() || displayName;
            return {
              label: displayName,
              details: [primaryLine, city, region, postcode, country].filter(Boolean).join("\n"),
              street,
              house,
              city,
              region,
              country,
              postcode,
              lat: Number(item.lat),
              lon: Number(item.lon),
            };
          })
        );
      } catch {
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeSection, addressSearchValue]);

  function updateDraft<K extends keyof SettingsDraftState>(key: K, value: SettingsDraftState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatusText("");
  }

  async function saveSettings() {
    if (!workspace) return;
    if (settingsPatchTimerRef.current) {
      clearTimeout(settingsPatchTimerRef.current);
      settingsPatchTimerRef.current = null;
    }
    pendingSettingsPatchRef.current = {};
    setSaving(true);
    setStatusText("");
    try {
      const nextLanguage: AppLanguage = SUPPORTED_APP_LANGUAGES.includes(draft.language as AppLanguage) ? draft.language : language;
      const payload = await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({
          professional: {
            firstName: draft.firstName,
            lastName: draft.lastName,
            avatarUrl: draft.avatarUrl,
            email: draft.email,
            phone: draft.phone,
            country: draft.country,
            timezone: draft.timezone,
            language: nextLanguage,
            currency: draft.currency,
          },
          business: isOwner
            ? {
                name: draft.businessName,
                website: draft.website,
                accountType: draft.accountType,
                serviceMode: draft.serviceMode,
                categories: normalizeCategoryList(draft.categories),
                allowOnlineBooking: draft.allowOnlineBooking,
                address: draft.address,
                addressDetails: draft.addressDetails,
                addressLat: draft.addressLat,
                addressLon: draft.addressLon,
              }
            : undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });
      setLanguage(nextLanguage);
      setNewPassword("");
      applySettingsPayload(payload);
      setStatusText(t.settingsSaved);
    } catch (error) {
      Alert.alert(t.settings, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function copyPublicLink() {
    if (!publicBookingUrl) return;
    await Share.share({ message: publicBookingUrl, url: publicBookingUrl }).catch(() => undefined);
  }

  async function openPublicLink() {
    if (!publicBookingUrl) return;
    await Linking.openURL(publicBookingUrl).catch(() => undefined);
  }

  async function pickAvatar() {
    if (isAvatarUploading || busy) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.avatarLink, t.avatarPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.45,
      base64: false,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setIsAvatarUploading(true);
    try {
      const avatarUrl = await uploadMediaDataUrl(await imageAssetToDataUrl(asset, { compress: 0.72 }), "avatar");
      updateDraft("avatarUrl", avatarUrl);
      if (workspace) {
        onWorkspaceUpdated({
          ...workspace,
          professional: {
            ...workspace.professional,
            avatarUrl,
          },
        });
      }
      queueSettingsPatch({ professional: { avatarUrl } }, 80);
    } catch (error) {
      Alert.alert(t.avatarLink, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setIsAvatarUploading(false);
    }
  }

  function removeAvatar() {
    if (isAvatarUploading || busy || !draft.avatarUrl) return;
    updateDraft("avatarUrl", "");
    queueSettingsPatch({ professional: { avatarUrl: "" } }, 80);
  }

  async function resolveJoinRequest(requestId: string, action: "approve" | "reject") {
    const previousRequests = pendingJoinRequests;
    pendingJoinRequestResolvesRef.current.add(requestId);
    setPendingJoinRequests((items) => items.filter((item) => item.id !== requestId));
    setSaving(true);
    try {
      await apiFetch("/api/mobile/pro/join-requests", {
        method: "POST",
        body: JSON.stringify({ requestId, action }),
      });
      onRefreshWorkspace();
    } catch (error) {
      pendingJoinRequestResolvesRef.current.delete(requestId);
      setPendingJoinRequests(previousRequests);
      Alert.alert(t.joinRequests, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function saveBusinessPhotos(nextPhotos: BusinessPhotoRecord[], options: { deletedPhotoId?: string } = {}) {
    if (!workspace || !isOwner) return;
    const previousPhotos = photosDraft;
    const normalizedPhotos = nextPhotos.slice(0, 5).map((photo, index) => ({
      ...photo,
      isPrimary: nextPhotos.some((item) => item.isPrimary) ? photo.isPrimary : index === 0,
    }));
    setPhotosDraft(normalizedPhotos);
    setSaving(true);
    setStatusText("");
    try {
      const payload = await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ business: { photos: normalizedPhotos } }),
      });
      if (payload?.workspace?.business?.photos) {
        setPhotosDraft(filterPendingPhotoDeletes(payload.workspace.business.photos));
      }
      if (options.deletedPhotoId) pendingPhotoDeletesRef.current.delete(options.deletedPhotoId);
      applySettingsPayload(payload);
      setStatusText(t.settingsSaved);
    } catch (error) {
      if (options.deletedPhotoId) pendingPhotoDeletesRef.current.delete(options.deletedPhotoId);
      setPhotosDraft(previousPhotos);
      Alert.alert(t.businessPhotos, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function addBusinessPhotoFromDataUrl(dataUrl: string) {
    if (photos.length >= 5) {
      throw new Error("Maximum 5 photos.");
    }
    const nextPhoto: BusinessPhotoRecord = {
      id: createLocalId("photo"),
      url: await uploadMediaDataUrl(dataUrl, "business-photo"),
      caption: "",
      isPrimary: photos.length === 0,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    await saveBusinessPhotos([...photos, nextPhoto]);
  }

  async function pickBusinessPhoto(source: "camera" | "gallery") {
    setPhotoSourceOpen(false);
    const permission = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.businessPhotos, t.avatarPermission);
      return;
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.42,
      base64: false,
    };
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setSaving(true);
      setPhotoUploadStatus(t.photoUploading);
    try {
      await addBusinessPhotoFromDataUrl(await imageAssetToDataUrl(asset, { compress: 0.68 }));
    } catch (error) {
      Alert.alert(t.businessPhotos, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setPhotoUploadStatus("");
      setSaving(false);
    }
  }

  async function uploadDroppedBusinessPhoto(event: any) {
    event?.preventDefault?.();
    const file = event?.dataTransfer?.files?.[0];
    if (!file) return;
    setPhotoSourceOpen(false);
    setSaving(true);
    setPhotoUploadStatus(t.photoUploading);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (dataUrl) {
        await addBusinessPhotoFromDataUrl(dataUrl);
      }
    } catch (error) {
      Alert.alert(t.businessPhotos, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setPhotoUploadStatus("");
      setSaving(false);
    }
  }

  function makePrimaryPhoto(photoId: string) {
    void saveBusinessPhotos(photos.map((photo) => ({ ...photo, isPrimary: photo.id === photoId })));
  }

  function removeBusinessPhoto(photoId: string) {
    pendingPhotoDeletesRef.current.add(photoId);
    const remaining = photos.filter((photo) => photo.id !== photoId);
    const hasPrimary = remaining.some((photo) => photo.isPrimary);
    void saveBusinessPhotos(remaining.map((photo, index) => ({ ...photo, isPrimary: hasPrimary ? photo.isPrimary : index === 0 })), { deletedPhotoId: photoId });
  }

  function renderBusinessPhotosPanel() {
    const dropHandlers = Platform.OS === "web"
      ? ({
          onDragOver: (event: any) => event?.preventDefault?.(),
          onDrop: uploadDroppedBusinessPhoto,
        } as any)
      : {};

    return (
      <Panel title={t.businessPhotos}>
        {photoUploadStatus ? (
          <View style={styles.businessPhotoStatusRow}>
            <ActivityIndicator size="small" color="#6D4AFF" />
            <Text style={styles.businessPhotoStatusText}>{photoUploadStatus}</Text>
          </View>
        ) : null}
        {!photos.length ? (
          <Pressable
            {...dropHandlers}
            style={({ pressed }) => [styles.businessPhotoUploadCard, pressed && !saving && styles.pressablePressed, (!isOwner || saving) && styles.disabled]}
            onPress={() => setPhotoSourceOpen(true)}
            disabled={!isOwner || saving}
          >
            <View style={styles.businessPhotoUploadIcon}>
              <Ionicons name="camera" size={26} color="#6D4AFF" />
            </View>
            <Text style={styles.businessPhotoUploadTitle}>{t.businessPhotoUploadTitle}</Text>
            <Text style={styles.businessPhotoUploadSubtitle}>{t.businessPhotoUploadSubtitle}</Text>
            <View style={styles.businessPhotoExampleRow}>
              {["storefront-outline", "sparkles-outline", "image-outline"].map((icon) => (
                <View key={icon} style={styles.businessPhotoExamplePill}>
                  <Ionicons name={icon as ComponentProps<typeof Ionicons>["name"]} size={15} color="#6D4AFF" />
                </View>
              ))}
            </View>
            {Platform.OS === "web" ? <Text style={styles.businessPhotoDropHint}>{t.businessPhotoDropHint}</Text> : null}
          </Pressable>
        ) : (
          <View style={styles.businessPhotoGrid}>
            {photos.map((photo) => (
              <Pressable
                key={photo.id}
                style={({ pressed }) => [styles.businessPhotoTile, pressed && styles.pressablePressed]}
                onPress={() => setPhotoActionPhoto(photo)}
                onLongPress={() => setPhotoActionPhoto(photo)}
              >
                <Image source={{ uri: photo.url }} style={styles.businessPhotoGridImage} />
                {photo.isPrimary ? (
                  <View style={styles.businessPhotoPrimaryBadge}>
                    <Ionicons name="star" size={11} color="#FFFFFF" />
                    <Text style={styles.businessPhotoPrimaryText}>{t.primaryPhoto}</Text>
                  </View>
                ) : null}
                <View style={styles.businessPhotoTileAction}>
                  <Ionicons name="ellipsis-horizontal" size={15} color="#0F172A" />
                </View>
              </Pressable>
            ))}
            <Pressable
              {...dropHandlers}
              style={({ pressed }) => [styles.businessPhotoAddTile, pressed && !saving && styles.pressablePressed, (!isOwner || saving) && styles.disabled]}
              onPress={() => setPhotoSourceOpen(true)}
              disabled={!isOwner || saving}
            >
              <Ionicons name="add" size={24} color="#6D4AFF" />
              <Text style={styles.businessPhotoAddText}>{t.addMorePhoto}</Text>
            </Pressable>
          </View>
        )}
      </Panel>
    );
  }

  function renderBusinessPhotoSourceSheet() {
    return (
      <Modal transparent visible={photoSourceOpen} animationType="slide" onRequestClose={() => setPhotoSourceOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoSourceOpen(false)} />
          <View style={styles.mediaActionSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.mediaSheetHeader}>
              <Text style={styles.mediaSheetTitle}>{t.businessPhotoSourceTitle}</Text>
              <Pressable style={styles.mediaSheetClose} onPress={() => setPhotoSourceOpen(false)}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </Pressable>
            </View>
            <Pressable style={styles.mediaActionRow} onPress={() => void pickBusinessPhoto("camera")} disabled={saving}>
              <View style={styles.mediaActionIcon}>
                <Ionicons name="camera-outline" size={20} color="#6D4AFF" />
              </View>
              <Text style={styles.mediaActionText}>{t.businessPhotoFromCamera}</Text>
            </Pressable>
            <Pressable style={styles.mediaActionRow} onPress={() => void pickBusinessPhoto("gallery")} disabled={saving}>
              <View style={styles.mediaActionIcon}>
                <Ionicons name="images-outline" size={20} color="#6D4AFF" />
              </View>
              <Text style={styles.mediaActionText}>{t.businessPhotoFromGallery}</Text>
            </Pressable>
            {Platform.OS === "web" ? <Text style={styles.mediaSheetHint}>{t.businessPhotoDropHint}</Text> : null}
          </View>
        </View>
      </Modal>
    );
  }

  function renderBusinessPhotoActionsSheet() {
    const photo = photoActionPhoto;
    return (
      <Modal transparent visible={Boolean(photo)} animationType="slide" onRequestClose={() => setPhotoActionPhoto(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoActionPhoto(null)} />
          <View style={styles.mediaActionSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.mediaSheetHeader}>
              <Text style={styles.mediaSheetTitle}>{t.businessPhotoActionsTitle}</Text>
              <Pressable style={styles.mediaSheetClose} onPress={() => setPhotoActionPhoto(null)}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </Pressable>
            </View>
            {photo ? <Image source={{ uri: photo.url }} style={styles.mediaPhotoPreview} /> : null}
            {photo && !photo.isPrimary ? (
              <Pressable
                style={styles.mediaActionRow}
                onPress={() => {
                  setPhotoActionPhoto(null);
                  makePrimaryPhoto(photo.id);
                }}
                disabled={saving}
              >
                <View style={styles.mediaActionIcon}>
                  <Ionicons name="star-outline" size={20} color="#6D4AFF" />
                </View>
                <Text style={styles.mediaActionText}>{t.makePrimary}</Text>
              </Pressable>
            ) : null}
            {photo ? (
              <Pressable
                style={[styles.mediaActionRow, styles.mediaDangerActionRow]}
                onPress={() => {
                  setPhotoActionPhoto(null);
                  removeBusinessPhoto(photo.id);
                }}
                disabled={saving}
              >
                <View style={[styles.mediaActionIcon, styles.mediaDangerActionIcon]}>
                  <Ionicons name="trash-outline" size={20} color="#E11D48" />
                </View>
                <Text style={styles.mediaDangerActionText}>{t.delete}</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.mediaCancelButton} onPress={() => setPhotoActionPhoto(null)}>
              <Text style={styles.mediaCancelText}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  function applyAddressSuggestion(suggestion: AddressSuggestionRecord) {
    const nextCurrency = suggestion.country ? inferCurrency(suggestion.country) : draft.currency;
    updateDraft("address", suggestion.label);
    updateDraft("addressDetails", suggestion.details);
    updateDraft("addressLat", Number.isFinite(suggestion.lat) ? suggestion.lat : null);
    updateDraft("addressLon", Number.isFinite(suggestion.lon) ? suggestion.lon : null);
    if (suggestion.country) {
      updateDraft("country", suggestion.country);
      updateDraft("currency", nextCurrency);
    }
    setAddressSearchValue(suggestion.label);
    setAddressSuggestions([]);
    const patch: SettingsPatchPayload = {
      business: {
        address: suggestion.label,
        addressDetails: suggestion.details,
        addressLat: Number.isFinite(suggestion.lat) ? suggestion.lat : null,
        addressLon: Number.isFinite(suggestion.lon) ? suggestion.lon : null,
      },
    };
    if (suggestion.country) {
      patch.professional = { country: suggestion.country, currency: nextCurrency };
    }
    queueSettingsPatch(patch, 80);
  }

  async function openMap() {
    if (typeof draft.addressLat === "number" && typeof draft.addressLon === "number") {
      await Linking.openURL(`https://www.openstreetmap.org/?mlat=${draft.addressLat}&mlon=${draft.addressLon}#map=16/${draft.addressLat}/${draft.addressLon}`).catch(() => undefined);
      return;
    }
    if (draft.address.trim()) {
      await Linking.openURL(`https://www.openstreetmap.org/search?query=${encodeURIComponent(draft.address.trim())}`).catch(() => undefined);
    }
  }

  async function loadTelegramPanel(silent = false) {
    if (!silent) setIsTelegramLoading(true);
    setTelegramError("");
    try {
      const payload = await apiFetch("/api/mobile/pro/telegram/connect");
      setTelegramPanel(normalizeTelegramPanel(payload, telegramPanel));
    } catch (error) {
      setTelegramError(error instanceof Error ? error.message : t.telegramSaveFailed);
    } finally {
      setIsTelegramLoading(false);
    }
  }

  async function updateTelegramSettings(patch: Partial<TelegramPanelState["settings"]>) {
    const previousSettings = telegramPanel?.settings;
    setIsTelegramSaving(true);
    setTelegramError("");
    setTelegramPanel((current) => (current ? { ...current, settings: { ...current.settings, ...patch } } : current));
    try {
      const payload = await apiFetch("/api/mobile/pro/telegram/connect", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const normalized = normalizeTelegramPanel(payload, telegramPanel);
      setTelegramPanel((current) => ({
        ...normalized,
        settings: { ...normalized.settings, ...(current?.settings || {}), ...patch },
      }));
      setStatusText(t.telegramSaved);
    } catch (error) {
      if (previousSettings) {
        const rollback: Partial<TelegramPanelState["settings"]> = {};
        for (const key of Object.keys(patch) as Array<keyof TelegramPanelState["settings"]>) {
          (rollback as Record<string, boolean | number>)[key] = previousSettings[key] as boolean | number;
        }
        setTelegramPanel((current) => (current ? { ...current, settings: { ...current.settings, ...rollback } } : current));
      }
      setTelegramError(error instanceof Error ? error.message : t.telegramSaveFailed);
    } finally {
      setIsTelegramSaving(false);
    }
  }

  function toggleTelegramSetting(key: TelegramBooleanSettingKey) {
    if (!telegramPanel) return;
    void updateTelegramSettings({ [key]: !telegramPanel.settings[key] });
  }

  async function openTelegramBot() {
    if (!telegramPanel?.deepLink) return;
    await Linking.openURL(telegramPanel.deepLink).catch(() => undefined);
  }

  async function shareTelegramLink() {
    if (!telegramPanel?.deepLink) return;
    await Share.share({ message: telegramPanel.deepLink, url: telegramPanel.deepLink }).catch(() => undefined);
  }

  async function loadPushPanel(silent = false) {
    if (!silent) setIsPushLoading(true);
    setPushError("");
    try {
      const payload = await apiFetch("/api/mobile/pro/push");
      setPushPanel(normalizePushPanel(payload, pushPanel));
    } catch (error) {
      setPushError(error instanceof Error ? error.message : t.pushSaveFailed);
    } finally {
      setIsPushLoading(false);
    }
  }

  async function registerPushNotifications() {
    setIsPushSaving(true);
    setPushError("");
    try {
      const pushResult = await requestExpoPushToken();
      setPushPermissionStatus(pushResult.status);

      if (pushResult.status !== "granted") {
        setPushError(t.pushPermissionDenied);
        return false;
      }

      const payload = await apiFetch("/api/mobile/pro/push", {
        method: "POST",
        body: JSON.stringify({
          expoPushToken: pushResult.expoPushToken,
          platform: Platform.OS,
          deviceName: `${Platform.OS} ${Platform.Version}`,
          language,
          timezone: draft.timezone || workspace?.professional.timezone || "UTC",
        }),
      });
      setPushPanel(normalizePushPanel(payload, pushPanel));
      setStatusText(t.pushSaved);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setPushError(
        message === PUSH_PROJECT_ID_ERROR
          ? t.pushProjectMissing || t.pushSaveFailed
          : message.includes("aps-environment")
            ? t.pushIosCapabilityMissing || t.pushSaveFailed
            : message || t.pushSaveFailed
      );
      return false;
    } finally {
      setIsPushSaving(false);
    }
  }

  async function updatePushSettings(patch: Partial<PushPanelState["settings"]>) {
    const previousSettings = pushPanel?.settings;
    setIsPushSaving(true);
    setPushError("");
    setPushPanel((current) => (current ? { ...current, settings: { ...current.settings, ...patch } } : current));
    try {
      const payload = await apiFetch("/api/mobile/pro/push", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const normalized = normalizePushPanel(payload, pushPanel);
      setPushPanel((current) => ({
        ...normalized,
        settings: { ...normalized.settings, ...(current?.settings || {}), ...patch },
      }));
      setStatusText(t.pushSaved);
    } catch (error) {
      if (previousSettings) {
        const rollback: Partial<PushPanelState["settings"]> = {};
        for (const key of Object.keys(patch) as Array<keyof PushPanelState["settings"]>) {
          (rollback as Record<string, boolean | number>)[key] = previousSettings[key] as boolean | number;
        }
        setPushPanel((current) => (current ? { ...current, settings: { ...current.settings, ...rollback } } : current));
      }
      setPushError(error instanceof Error ? error.message : t.pushSaveFailed);
    } finally {
      setIsPushSaving(false);
    }
  }

  function togglePushSetting(key: PushBooleanSettingKey) {
    if (!pushPanel) return;
    void updatePushSettings({ [key]: !pushPanel.settings[key] });
  }

  const pushGlobalEnabled = Boolean(pushPanel?.connected && PUSH_BOOLEAN_SETTING_KEYS.some((key) => pushPanel.settings[key]));

  async function togglePushGlobal() {
    if (isPushSaving || isPushLoading) return;
    if (pushGlobalEnabled) {
      await updatePushSettings(Object.fromEntries(PUSH_BOOLEAN_SETTING_KEYS.map((key) => [key, false])) as Partial<PushPanelState["settings"]>);
      return;
    }

    if (!pushPanel?.connected || pushPermissionStatus !== "granted") {
      const registered = await registerPushNotifications();
      if (!registered) return;
    }

    await updatePushSettings(Object.fromEntries(PUSH_BOOLEAN_SETTING_KEYS.map((key) => [key, true])) as Partial<PushPanelState["settings"]>);
  }

  const settingsBusinessName = workspace?.business.name || workspace?.professional.email || "";

  return (
    <View style={styles.settingsRoot}>
      <View style={styles.settingsTopPanel}>
        <View style={styles.settingsTopCopy}>
          <Text style={styles.settingsTopTitle}>{t.settings}</Text>
          <Text style={styles.settingsTopSubtitle} numberOfLines={1}>{settingsBusinessName}</Text>
        </View>
        {statusText || isAutoSavingSettings ? (
          <View style={styles.settingsStatusBadge}>
            {isAutoSavingSettings && !statusText ? <ActivityIndicator size="small" color="#047857" /> : <Ionicons name="checkmark" size={13} color="#047857" />}
            <Text style={styles.settingsStatusBadgeText} numberOfLines={1}>
              {statusText || t.settingsSaving}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.settingsAccordionNav}>
        {SETTINGS_SECTIONS.map((section) => {
          const locked = !hasPremium && isPremiumSettingsSection(section);
          return (
            <Pressable
              key={section}
              style={[styles.settingsAccordionHeader, activeSection === section && styles.settingsAccordionHeaderActive]}
              onPress={() => setActiveSection(section)}
            >
              <View style={styles.settingsSectionTitleRow}>
                <Text style={[styles.settingsSectionText, activeSection === section && styles.settingsSectionTextActive]}>{settingsSectionLabel(section, t)}</Text>
                {locked ? <Ionicons name="lock-closed-outline" size={14} color="#7C3AED" /> : null}
              </View>
              <Ionicons name={activeSection === section ? "chevron-up" : "chevron-down"} size={16} color={activeSection === section ? "#6D4AFF" : "#94A3B8"} />
            </Pressable>
          );
        })}
      </View>

      {!isOwner ? <Text style={styles.settingsMutedNotice}>{t.ownerOnlyHint}</Text> : null}

      <View style={styles.settingsAccordionBody}>
      {activeSectionLocked ? (
        <PremiumFeatureGate t={t} feature={activeSection as PremiumFeature} professional={workspace?.professional} onUpgrade={onRequestPremium} />
      ) : null}

      {!activeSectionLocked && activeSection === "general" ? (
        <>
          <Panel title={t.premiumSubscription}>
            <View style={styles.premiumMobileHeader}>
              <View style={styles.premiumMobileHeaderCopy}>
                <Text style={styles.settingsCardTitle} numberOfLines={2}>{t.premiumSubscriptionTitle}</Text>
                {premiumStatusDetail ? <Text style={styles.premiumMobileDetail}>{premiumStatusDetail}</Text> : null}
              </View>
              <View style={[styles.premiumMobileBadge, hasPremium && styles.premiumMobileBadgeActive]}>
                <Text style={[styles.premiumMobileBadgeText, hasPremium && styles.premiumMobileBadgeTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                  {premiumStatusLabel}
                </Text>
              </View>
            </View>
            <View style={[styles.bookingLimitCard, bookingLimitEnded && styles.bookingLimitCardWarning]}>
              <View style={styles.bookingLimitHeader}>
                <Text style={styles.bookingLimitTitle}>{t.bookingLimitTitle || "This month's appointments"}</Text>
                <Text style={styles.bookingLimitValue}>
                  {hasPremium ? t.unlimitedShort || "unlim" : `${bookingCredits.remaining}/${bookingCredits.total}`}
                </Text>
              </View>
              <View style={styles.bookingLimitTrack}>
                <View style={[styles.bookingLimitTrackFill, { width: hasPremium ? "100%" : `${bookingLimitPercent}%` }]} />
              </View>
              <View style={styles.bookingLimitMetrics}>
                <Text style={styles.bookingLimitMetricText}>{t.bookingLimitRemaining || "Remaining"}: {hasPremium ? t.unlimitedShort || "unlim" : bookingCredits.remaining}</Text>
                <Text style={styles.bookingLimitMetricText}>{t.bookingLimitUsed || "Used"}: {hasPremium ? t.unlimitedShort || "unlim" : bookingCredits.used}</Text>
              </View>
              <Text style={styles.bookingLimitHint}>
                {hasPremium
                  ? t.bookingLimitPremiumText || "Premium does not spend appointment credits."
                  : bookingLimitEnded
                    ? t.bookingLimitEndedText || "Get Pro to create unlimited appointments."
                    : t.bookingLimitFreeText || "Free includes 100 appointments per month."}
              </Text>
            </View>
            <View style={styles.premiumBenefitList}>
              {[t.premiumBenefitOnlineBooking, t.premiumBenefitReminders, t.premiumBenefitTeam, t.premiumBenefitClients].map((benefit) => (
                <View key={benefit} style={styles.premiumBenefitItem}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={styles.premiumBenefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            <View style={styles.premiumMobilePlans}>
              <Pressable
                style={[styles.premiumMobilePlan, premiumPackages.monthly && styles.premiumMobilePlanReady]}
                onPress={() => void buyPremiumPackage("monthly")}
                disabled={isPremiumLoading}
              >
                <Text style={styles.premiumMobilePlanTitle}>{t.premiumMonthly}</Text>
                <Text style={styles.premiumMobilePlanPrice}>{getPackagePriceLabel(premiumPackages.monthly, t.premiumMonthlyFallback)}</Text>
                <Text style={styles.premiumMobilePlanAction}>{t.premiumStartMonthly}</Text>
              </Pressable>
              <Pressable
                style={[styles.premiumMobilePlan, styles.premiumMobilePlanFeatured, premiumPackages.yearly && styles.premiumMobilePlanReady]}
                onPress={() => void buyPremiumPackage("yearly")}
                disabled={isPremiumLoading}
              >
                <Text style={styles.premiumMobilePlanTitle}>{t.premiumYearly}</Text>
                <Text style={styles.premiumMobilePlanPrice}>{getPackagePriceLabel(premiumPackages.yearly, t.premiumYearlyFallback)}</Text>
                <Text style={styles.premiumMobilePlanAction}>{t.premiumStartYearly}</Text>
              </Pressable>
            </View>
            <View style={styles.settingsActionRow}>
              <SecondaryButton label={t.premiumRestore} onPress={() => void restorePremiumPurchase()} disabled={isPremiumLoading} />
              <SecondaryButton label={t.premiumManage} onPress={() => Linking.openURL(getMobileSubscriptionManageUrl()).catch(() => undefined)} disabled={Platform.OS === "web"} />
            </View>
            <Text style={styles.settingsMutedNotice}>
              {t.subscriptionAutoRenewText ||
                "Subscription renews automatically unless cancelled at least 24 hours before the end of the current period. You can manage or cancel it in your app store settings."}
            </Text>
            <Text style={styles.premiumLegalText}>
              {t.legalSubscriptionIntro || "By subscribing, you agree to:"}
              {"\n"}
              <Text style={styles.premiumLegalLink} onPress={() => void openLegalUrl(LEGAL_URLS.terms)}>
                {t.termsOfUse || "Terms of Use"}
              </Text>
              <Text> · </Text>
              <Text style={styles.premiumLegalLink} onPress={() => void openLegalUrl(LEGAL_URLS.privacy)}>
                {t.privacyPolicy || "Privacy Policy"}
              </Text>
            </Text>
            {isPremiumLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
            {premiumMessage ? <Text style={styles.settingsMutedNotice}>{premiumMessage}</Text> : null}
          </Panel>

          <Panel title={t.ownerContacts}>
            <View style={styles.settingsAvatarRow}>
              <Pressable
                style={styles.settingsAvatarButton}
                onPress={pickAvatar}
                disabled={isAvatarUploading || busy}
                accessibilityRole="button"
                accessibilityLabel={t.changeAvatar}
              >
                {draft.avatarUrl ? (
                  <Image source={{ uri: draft.avatarUrl }} style={styles.settingsAvatarImage} />
                ) : (
                  <View style={styles.settingsAvatar}>
                    <Text style={styles.settingsAvatarText}>{(draft.firstName || draft.email || "T").slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.settingsAvatarCameraBadge}>
                  {isAvatarUploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="camera" size={16} color="#FFFFFF" />}
                </View>
              </Pressable>
              <View style={styles.settingsAvatarInfo}>
                <View style={styles.settingsAvatarTitleRow}>
                  <Text style={styles.settingsCardTitle}>{t.avatarLink}</Text>
                  {draft.avatarUrl ? (
                    <Pressable
                      style={styles.settingsAvatarDeleteButton}
                      onPress={removeAvatar}
                      disabled={isAvatarUploading || busy}
                      accessibilityRole="button"
                      accessibilityLabel={t.deleteAvatar}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
            <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => updateDraft("firstName", value)} onBlur={() => queueSettingsPatch({ professional: { firstName: draft.firstName } })} />
            <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => updateDraft("lastName", value)} onBlur={() => queueSettingsPatch({ professional: { lastName: draft.lastName } })} />
            <Field label={t.email} value={draft.email} onChangeText={(value) => updateDraft("email", value)} onBlur={() => queueSettingsPatch({ professional: { email: draft.email } })} keyboardType="email-address" autoCapitalize="none" />
            <Field label={t.phone} value={draft.phone} onChangeText={(value) => updateDraft("phone", value)} onBlur={() => queueSettingsPatch({ professional: { phone: draft.phone } })} keyboardType="phone-pad" />
              <Field label={t.newPassword} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <SettingsToggleRow label={t.unlockWithFaceId} value={biometricEnabled} onPress={onToggleBiometric} disabled={!biometricAvailable} />
              {!biometricAvailable ? <Text style={styles.clientOptionCaption}>{t.biometricUnavailable}</Text> : null}
            </Panel>

          <Panel title={t.businessFormat}>
            <Field label={t.companyName} value={draft.businessName} editable={isOwner} onChangeText={(value) => updateDraft("businessName", value)} onBlur={() => queueSettingsPatch({ business: { name: draft.businessName } })} />
            <Field label={t.website} value={draft.website} editable={isOwner} onChangeText={(value) => updateDraft("website", value)} onBlur={() => queueSettingsPatch({ business: { website: draft.website } })} placeholder="www.yoursite.com" autoCapitalize="none" />
            <Text style={styles.label}>{t.accountType}</Text>
            <View style={styles.settingsChoiceRow}>
              {[
                { value: "solo" as const, label: t.soloAccount },
                { value: "team" as const, label: t.teamAccount },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  disabled={!isOwner}
                  style={[styles.settingsChoice, draft.accountType === item.value && styles.settingsChoiceActive]}
                    onPress={() => updateDraftAndQueue("accountType", item.value, { business: { accountType: item.value } }, 80)}
                >
                  <Text style={[styles.settingsChoiceText, draft.accountType === item.value && styles.settingsChoiceTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Panel>

          {renderBusinessPhotosPanel()}

          <Panel title={t.localization}>
              <LanguageSwitch language={draft.language} setLanguage={(value) => { setLanguage(value); updateDraftAndQueue("language", value, { professional: { language: value } }, 80); }} />
              <SettingsOptionRail
                label={t.country}
                value={draft.country}
                options={COUNTRY_OPTIONS}
                onSelect={(value) => {
                  const nextCurrency = inferCurrency(value);
                  updateDraft("country", value);
                  updateDraft("currency", nextCurrency);
                  queueSettingsPatch({ professional: { country: value, currency: nextCurrency } }, 80);
                }}
                renderLabel={(value) => localizeCountry(value, language)}
              />
              <SettingsOptionRail label={t.timezone} value={draft.timezone} options={TIMEZONE_OPTIONS} onSelect={(value) => updateDraftAndQueue("timezone", value, { professional: { timezone: value } }, 80)} renderLabel={(value) => TIMEZONE_LABELS[value] || value} />
              <SettingsOptionRail label={t.currency} value={draft.currency} options={CURRENCY_OPTIONS} onSelect={(value) => updateDraftAndQueue("currency", value, { professional: { currency: value } }, 80)} />
          </Panel>

          <Panel title={t.joinRequests}>
            {pendingJoinRequests.length === 0 ? <Text style={styles.emptyText}>{t.noJoinRequests}</Text> : null}
            {pendingJoinRequests.map((request) => (
              <View key={request.id} style={styles.joinRequestCard}>
                <View>
                  <Text style={styles.settingsMiniTitle}>{request.professionalName || request.professionalEmail || request.professionalPhone || t.empty}</Text>
                  <Text style={styles.clientOptionCaption}>
                    {[request.professionalEmail || request.professionalPhone, request.role].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <View style={styles.joinRequestActions}>
                  <Pressable style={styles.joinApproveButton} onPress={() => resolveJoinRequest(request.id, "approve")} disabled={saving}>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={styles.joinRejectButton} onPress={() => resolveJoinRequest(request.id, "reject")} disabled={saving}>
                    <Ionicons name="close" size={18} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            ))}
          </Panel>
        </>
      ) : null}

      {!activeSectionLocked && activeSection === "online" ? (
        <Panel title={t.settingsOnline}>
            <Pressable style={styles.shareToggleRow} onPress={() => updateDraftAndQueue("allowOnlineBooking", !draft.allowOnlineBooking, { business: { allowOnlineBooking: !draft.allowOnlineBooking } }, 80)} disabled={!isOwner}>
            <View>
              <Text style={styles.shareToggleTitle}>{draft.allowOnlineBooking ? t.onlineBookingOn : t.onlineBookingOff}</Text>
              <Text style={styles.clientOptionCaption}>{workspace?.business.name || t.companyName}</Text>
            </View>
            <View style={[styles.mobileSwitch, draft.allowOnlineBooking && styles.mobileSwitchActive]}>
              <View style={[styles.mobileSwitchThumb, draft.allowOnlineBooking && styles.mobileSwitchThumbActive]} />
            </View>
          </Pressable>
          <View style={styles.bookingLinkCard}>
            <Text style={styles.bookingLinkText} numberOfLines={1}>{publicBookingUrl || t.empty}</Text>
            <View style={styles.bookingLinkActions}>
              <Pressable style={styles.iconGhostButton} onPress={copyPublicLink} disabled={!publicBookingUrl}>
                <Ionicons name="copy-outline" size={17} color="#334155" />
              </Pressable>
              <Pressable style={styles.iconGhostButton} onPress={openPublicLink} disabled={!publicBookingUrl}>
                <Ionicons name="open-outline" size={17} color="#334155" />
              </Pressable>
              <Pressable style={styles.iconGhostButton} onPress={copyPublicLink} disabled={!publicBookingUrl}>
                <Ionicons name="share-outline" size={17} color="#334155" />
              </Pressable>
            </View>
          </View>
        </Panel>
      ) : null}

      {!activeSectionLocked && activeSection === "services" ? (
        <>
          <Panel title={t.businessFormat}>
            <View style={styles.settingsStackedChoices}>
              {SERVICE_MODE_IDS.map((item) => (
                <Pressable
                  key={item}
                  disabled={!isOwner}
                  style={[styles.settingsLongChoice, getServiceModeId(draft.serviceMode) === item && styles.settingsChoiceActive]}
                    onPress={() => updateDraftAndQueue("serviceMode", SERVICE_MODE_VALUES[item], { business: { serviceMode: SERVICE_MODE_VALUES[item] } }, 80)}
                >
                  <Text style={[styles.settingsChoiceText, getServiceModeId(draft.serviceMode) === item && styles.settingsChoiceTextActive]}>{localizeServiceMode(SERVICE_MODE_VALUES[item], t)}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>{t.categoriesText}</Text>
            <MultiCategoryPicker
              t={t}
              language={language}
              categories={businessCategoryOptions}
              selected={selectedBusinessCategories}
              onToggle={toggleBusinessCategory}
              disabled={!isOwner}
            />
          </Panel>

          <Panel title={t.settingsServices}>
            <View style={styles.settingsSummaryGrid}>
              <View style={styles.settingsSummaryTile}>
                <Text style={styles.statValue}>{workspace?.services.length || 0}</Text>
                <Text style={styles.statLabel}>{t.yourServices}</Text>
              </View>
              <View style={styles.settingsSummaryTile}>
                <Text style={styles.statValue}>{selectedBusinessCategories.length}</Text>
                <Text style={styles.statLabel}>{t.categoriesText}</Text>
              </View>
            </View>
            {(workspace?.services || []).slice(0, 4).map((service) => (
              <View key={service.id} style={styles.settingsMiniRow}>
                <View style={[styles.serviceDot, { backgroundColor: service.color || "#8ED1F2" }]} />
                <View style={styles.settingsMiniInfo}>
                  <Text style={styles.settingsMiniTitle}>{getServiceDisplayName(service, language)}</Text>
                  <Text style={styles.clientOptionCaption}>{formatDuration(service.durationMinutes || 0, t)}</Text>
                </View>
                <Text style={styles.settingsMiniPrice}>{formatMoney(service.price, workspace?.professional.currency || "UAH")}</Text>
              </View>
            ))}
            <SecondaryButton label={t.manageServices} onPress={() => setActiveTab("services")} />
          </Panel>
        </>
      ) : null}

      {!activeSectionLocked && activeSection === "schedule" ? (
        <Panel title={t.settingsSchedule}>
          <View style={styles.settingsSummaryGrid}>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statValue}>{staff?.summary?.totalPeople || staff?.members.length || 1}</Text>
              <Text style={styles.statLabel}>{t.staff}</Text>
            </View>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statValue}>{workspace?.memberSchedule?.workScheduleMode === "flexible" ? t.compact : t.weekView}</Text>
              <Text style={styles.statLabel}>{t.staffSchedule}</Text>
            </View>
          </View>
          <SecondaryButton label={t.manageSchedule} onPress={() => setActiveTab("staff")} />
        </Panel>
      ) : null}

      {!activeSectionLocked && activeSection === "push" ? (
        <Panel title={t.pushTitle}>
          <View style={styles.telegramStatus}>
            <View style={[styles.telegramDot, pushPanel?.connected ? styles.telegramDotConnected : styles.telegramDotDisconnected]} />
            <View style={styles.settingsMiniInfo}>
              <Text style={styles.settingsCardTitle}>{pushPanel?.connected ? t.pushEnabled : t.pushDisabled}</Text>
            </View>
          </View>
          {pushError ? <Text style={styles.settingsMutedNotice}>{pushError}</Text> : null}
          {isPushLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
          <SettingsToggleRow label={pushGlobalEnabled ? t.pushEnabled : t.pushDisabled} value={pushGlobalEnabled} onPress={() => void togglePushGlobal()} disabled={isPushSaving || isPushLoading} />
          <View style={styles.settingsActionRow}>
            {pushPermissionStatus === "denied" ? (
              <SecondaryButton label={t.pushOpenSettings} onPress={() => Linking.openSettings().catch(() => undefined)} />
            ) : null}
          </View>
          <InfoLine label={t.pushDeviceCount} value={String(pushPanel?.tokenCount || 0)} />
          {pushPanel ? (
            <>
              <SettingsToggleRow label={t.telegramOnlineBookings} value={pushPanel.settings.notificationsNewBooking} onPress={() => togglePushSetting("notificationsNewBooking")} />
              <SettingsToggleRow label={t.telegramCabinetBookings} value={pushPanel.settings.notificationsCabinetBooking} onPress={() => togglePushSetting("notificationsCabinetBooking")} />
              <SettingsToggleRow label={t.telegramRescheduled} value={pushPanel.settings.notificationsRescheduled} onPress={() => togglePushSetting("notificationsRescheduled")} />
              <SettingsToggleRow label={t.telegramCancelled} value={pushPanel.settings.notificationsCancelled} onPress={() => togglePushSetting("notificationsCancelled")} />
              <SettingsToggleRow label={t.telegramReminders} value={pushPanel.settings.notificationsReminder} onPress={() => togglePushSetting("notificationsReminder")} />
              <SettingsOptionRail
                label={t.telegramReminderLead}
                value={String(pushPanel.settings.reminderLeadMinutes)}
                options={TELEGRAM_REMINDER_LEAD_OPTIONS.map(String)}
                onSelect={(value) => void updatePushSettings({ reminderLeadMinutes: Number(value) || 120 })}
                renderLabel={(value) => formatReminderLead(Number(value), t)}
              />
            </>
          ) : null}
        </Panel>
      ) : null}

      {!activeSectionLocked && activeSection === "telegram" ? (
        <Panel title={t.settingsTelegram}>
          <View style={styles.telegramStatus}>
            <View style={[styles.telegramDot, telegramPanel?.connected || workspace?.telegram?.connected ? styles.telegramDotConnected : styles.telegramDotDisconnected]} />
            <View style={styles.settingsMiniInfo}>
              <Text style={styles.settingsCardTitle}>{telegramPanel?.connected || workspace?.telegram?.connected ? t.connected : t.notConnected}</Text>
              {telegramPanel?.chatId || workspace?.telegram?.chatId ? <Text style={styles.clientOptionCaption}>{telegramPanel?.chatId || workspace?.telegram?.chatId}</Text> : null}
            </View>
          </View>
          {telegramError ? <Text style={styles.settingsMutedNotice}>{telegramError}</Text> : null}
          {isTelegramLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
          {telegramPanel ? (
            <>
              <View style={styles.settingsActionRow}>
                <SecondaryButton label={telegramPanel.connected ? t.telegramOpenBot : t.telegramConnectButton} onPress={openTelegramBot} disabled={!telegramPanel.deepLink} />
                <SecondaryButton label={t.telegramCopyLink} onPress={shareTelegramLink} disabled={!telegramPanel.deepLink} />
                <SecondaryButton label={t.telegramRefreshLink} onPress={() => void loadTelegramPanel()} disabled={isTelegramLoading || isTelegramSaving} />
              </View>
              <View style={styles.servicesModeRow}>
                {[
                  { id: "notifications" as const, label: t.telegramSectionNotifications },
                  { id: "reminders" as const, label: t.telegramSectionReminders },
                  { id: "support" as const, label: t.telegramSectionSupport },
                ].map((item) => (
                  <Pressable key={item.id} style={[styles.servicesModeButton, telegramSection === item.id && styles.servicesModeButtonActive]} onPress={() => setTelegramSection(item.id)}>
                    <Text style={[styles.servicesModeText, telegramSection === item.id && styles.servicesModeTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              {telegramSection === "notifications" ? (
                <View>
                  <SettingsToggleRow label={t.telegramOnlineBookings} value={telegramPanel.settings.notificationsNewBooking} onPress={() => toggleTelegramSetting("notificationsNewBooking")} />
                  <SettingsToggleRow label={t.telegramCabinetBookings} value={telegramPanel.settings.notificationsCabinetBooking} onPress={() => toggleTelegramSetting("notificationsCabinetBooking")} />
                  <SettingsToggleRow label={t.telegramRescheduled} value={telegramPanel.settings.notificationsRescheduled} onPress={() => toggleTelegramSetting("notificationsRescheduled")} />
                  <SettingsToggleRow label={t.telegramCancelled} value={telegramPanel.settings.notificationsCancelled} onPress={() => toggleTelegramSetting("notificationsCancelled")} />
                </View>
              ) : null}
              {telegramSection === "reminders" ? (
                <View>
                  <SettingsToggleRow label={t.telegramReminders} value={telegramPanel.settings.notificationsReminder} onPress={() => toggleTelegramSetting("notificationsReminder")} />
                  <SettingsToggleRow label={t.telegramToday} value={telegramPanel.settings.notificationsToday} onPress={() => toggleTelegramSetting("notificationsToday")} />
                  <SettingsOptionRail
                    label={t.telegramReminderLead}
                    value={String(telegramPanel.settings.reminderLeadMinutes)}
                    options={TELEGRAM_REMINDER_LEAD_OPTIONS.map(String)}
                    onSelect={(value) => void updateTelegramSettings({ reminderLeadMinutes: Number(value) || 120 })}
                    renderLabel={(value) => formatReminderLead(Number(value), t)}
                  />
                </View>
              ) : null}
              {telegramSection === "support" ? (
                <View>
                  <SettingsToggleRow label={t.telegramForwarding} value={telegramPanel.settings.forwardingEnabled} onPress={() => toggleTelegramSetting("forwardingEnabled")} disabled={isTelegramSaving} />
                </View>
              ) : null}
            </>
          ) : (
            <SecondaryButton label={t.telegramRefreshLink} onPress={() => void loadTelegramPanel()} disabled={isTelegramLoading} />
          )}
        </Panel>
      ) : null}

      {!activeSectionLocked && activeSection === "address" ? (
        <Panel title={t.settingsAddress}>
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <Text style={styles.label}>{t.addressSearch}</Text>
            </View>
            <SearchInput
              value={addressSearchValue}
              onChangeText={setAddressSearchValue}
              placeholder={t.addressPlaceholder}
              editable={isOwner}
              selectTextOnFocus
            />
          </View>
          {isSearchingAddress ? <Text style={styles.emptyText}>{t.searchingAddress}</Text> : null}
          {addressSuggestions.map((suggestion) => (
            <Pressable key={`${suggestion.label}-${suggestion.lat}-${suggestion.lon}`} style={styles.addressSuggestionCard} onPress={() => applyAddressSuggestion(suggestion)}>
              <View style={styles.settingsMiniInfo}>
                <Text style={styles.settingsMiniTitle}>{[suggestion.street, suggestion.house].filter(Boolean).join(", ") || suggestion.label}</Text>
                <Text style={styles.clientOptionCaption}>{[suggestion.city, suggestion.region, suggestion.postcode, suggestion.country ? localizeCountry(suggestion.country, language) : ""].filter(Boolean).join(", ")}</Text>
              </View>
              <Text style={styles.addressSuggestionAction}>{t.selectAddress}</Text>
            </Pressable>
          ))}
            <Field label={t.streetAddress} value={draft.address} editable={isOwner} onChangeText={(value) => updateDraft("address", value)} onBlur={() => queueSettingsPatch({ business: { address: draft.address } })} />
          <View style={styles.field}>
            <Text style={styles.label}>{t.addressDetails}</Text>
            <TextInput
                value={draft.addressDetails}
                editable={isOwner}
                onChangeText={(value) => updateDraft("addressDetails", value)}
                onBlur={() => queueSettingsPatch({ business: { addressDetails: draft.addressDetails } })}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.settingsMultilineInput, !isOwner && styles.inputDisabled]}
            />
          </View>
          <View style={styles.settingsSummaryGrid}>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statLabel}>{t.streetHouse}</Text>
              <Text style={styles.settingsMiniTitle}>{draft.addressDetails.split("\n")[0] || draft.address || t.empty}</Text>
            </View>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statLabel}>{t.country}</Text>
              <Text style={styles.settingsMiniTitle}>{draft.country ? localizeCountry(draft.country, language) : t.empty}</Text>
            </View>
          </View>
          <InfoLine label={t.selectedAddress} value={typeof draft.addressLat === "number" && typeof draft.addressLon === "number" ? `${draft.addressLat.toFixed(5)}, ${draft.addressLon.toFixed(5)}` : t.empty} />
          <View style={styles.settingsActionRow}>
            <SecondaryButton label={t.openMap} onPress={openMap} disabled={!draft.address && typeof draft.addressLat !== "number"} />
          </View>
        </Panel>
      ) : null}
      </View>

      <Panel title={t.profileAndBusiness}>
        <PrimaryButton label={saving ? t.signingIn : t.saveSettings} onPress={saveSettings} disabled={saving || busy || !workspace} />
        <SecondaryButton label={t.signOut} onPress={onSignOut} disabled={busy || saving} />
      </Panel>
      {renderBusinessPhotoSourceSheet()}
      {renderBusinessPhotoActionsSheet()}
    </View>
  );
}

function SettingsToggleRow({ label, value, onPress, disabled }: { label: string; value: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.settingsToggleRow, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.settingsToggleText}>{label}</Text>
      <View style={[styles.mobileSwitch, value && styles.mobileSwitchActive]}>
        <View style={[styles.mobileSwitchThumb, value && styles.mobileSwitchThumbActive]} />
      </View>
    </Pressable>
  );
}

function SettingsOptionRail({
  label,
  value,
  options,
  onSelect,
  renderLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  renderLabel?: (value: string) => string;
}) {
  return (
    <View style={styles.settingsOptionBlock}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settingsOptionRail}>
        {options.map((item) => (
          <Pressable key={item} style={[styles.choiceChip, value === item && styles.choiceChipActive]} onPress={() => onSelect(item)}>
            <Text style={[styles.choiceText, value === item && styles.choiceTextActive]}>{renderLabel ? renderLabel(item) : item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Image source={WORDMARK} style={[styles.wordmark, compact && styles.wordmarkCompact]} resizeMode="contain" />;
}

function ConfiguredGoogleAuthButton({
  t,
  busyProvider,
  disabled,
  onToken,
}: {
  t: Record<string, string>;
  busyProvider: "google" | "apple" | null;
  disabled?: boolean;
  onToken: (idToken: string) => void | Promise<void>;
}) {
  const [prompting, setPrompting] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.params?.id_token || response.authentication?.idToken || "";
    if (!idToken) {
      Alert.alert("Google", t.socialAuthFailed);
      return;
    }
    void onToken(idToken);
  }, [onToken, response, t.socialAuthFailed]);

  async function handleGooglePress() {
    if (!request) {
      Alert.alert("Google", t.socialAuthConfigMissing);
      return;
    }
    setPrompting(true);
    try {
      await promptAsync();
    } catch (error) {
      Alert.alert("Google", error instanceof Error ? error.message : t.socialAuthFailed);
    } finally {
      setPrompting(false);
    }
  }

  const isBusy = prompting || busyProvider === "google";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialAuthButton,
        pressed && !disabled && styles.pressablePressed,
        disabled && styles.disabled,
      ]}
      onPress={handleGooglePress}
      disabled={disabled || Boolean(busyProvider) || !request}
    >
      <View style={styles.socialProviderIcon}>
        <Text style={styles.socialProviderLetter}>G</Text>
      </View>
      <Text style={styles.socialButtonText}>{isBusy ? t.signingIn : t.continueWithGoogle}</Text>
    </Pressable>
  );
}

function SocialAuthButtons({
  t,
  googleEnabled,
  appleEnabled,
  busyProvider,
  disabled,
  onGoogle,
  onGoogleToken,
  onApple,
}: {
  t: Record<string, string>;
  googleEnabled: boolean;
  appleEnabled: boolean;
  busyProvider: "google" | "apple" | null;
  disabled?: boolean;
  onGoogle: () => void;
  onGoogleToken: (idToken: string) => void | Promise<void>;
  onApple: () => void;
}) {
  const showApple = Platform.OS === "ios";

  return (
    <View style={styles.socialAuthBlock}>
      {googleEnabled ? (
        <ConfiguredGoogleAuthButton t={t} busyProvider={busyProvider} disabled={disabled} onToken={onGoogleToken} />
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.socialAuthButton,
            styles.socialAuthButtonMuted,
            pressed && !disabled && styles.pressablePressed,
            disabled && styles.disabled,
          ]}
          onPress={onGoogle}
          disabled={disabled || Boolean(busyProvider)}
        >
          <View style={styles.socialProviderIcon}>
            <Text style={styles.socialProviderLetter}>G</Text>
          </View>
          <Text style={styles.socialButtonText}>{busyProvider === "google" ? t.signingIn : t.continueWithGoogle}</Text>
        </Pressable>
      )}
      {showApple ? (
        <Pressable
          style={({ pressed }) => [
            styles.socialAuthButton,
            styles.socialAuthButtonDark,
            !appleEnabled && styles.socialAuthButtonMuted,
            pressed && !disabled && styles.pressablePressed,
            disabled && styles.disabled,
          ]}
          onPress={onApple}
          disabled={disabled || Boolean(busyProvider)}
        >
          <Ionicons name="logo-apple" size={19} color="#FFFFFF" />
          <Text style={styles.socialButtonTextDark}>{busyProvider === "apple" ? t.signingIn : t.continueWithApple}</Text>
        </Pressable>
      ) : null}
      <View style={styles.socialDivider}>
        <View style={styles.socialDividerLine} />
        <Text style={styles.socialDividerText}>{t.socialAuthDivider}</Text>
        <View style={styles.socialDividerLine} />
      </View>
    </View>
  );
}

function LanguageSwitch({
  language,
  setLanguage,
}: {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const menuMaxHeight = Math.min(420, Math.max(260, screenHeight - 96));

  function selectLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    setOpen(false);
  }

  return (
    <View style={styles.languageMenuAnchor}>
      <Pressable style={[styles.languageTrigger, open && styles.languageTriggerActive]} onPress={() => setOpen(true)} hitSlop={8}>
        <Text style={styles.languageTriggerCode}>{languageNames[language]}</Text>
        <Text style={styles.languageTriggerLabel} numberOfLines={1}>
          {languageDisplayNames[language]}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={15} color="#64748B" />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={styles.languageSheetLayer}>
          <Pressable style={styles.languageDropdownBackdrop} onPress={() => setOpen(false)} />
          <View style={[styles.languageSheetMenu, { maxHeight: menuMaxHeight }]}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {SUPPORTED_APP_LANGUAGES.map((item) => {
                const active = language === item;
                return (
                  <Pressable key={item} style={[styles.languageDropdownItem, active && styles.languageDropdownItemActive]} onPress={() => selectLanguage(item)}>
                    <View style={styles.languageDropdownCode}>
                      <Text style={[styles.languageDropdownCodeText, active && styles.languageDropdownTextActive]}>{languageNames[item]}</Text>
                    </View>
                    <Text style={[styles.languageDropdownText, active && styles.languageDropdownTextActive]} numberOfLines={1}>
                      {languageDisplayNames[item]}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={17} color="#6D4AFF" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RegisterPhoneField({
  label,
  selectedCountry,
  language,
  t,
  value,
  onChangeText,
  onOpenPicker,
  onFocus,
}: {
  label: string;
  selectedCountry: PhoneCountryOption;
  language: AppLanguage;
  t: Record<string, string>;
  value: string;
  onChangeText: (value: string) => void;
  onOpenPicker: () => void;
  onFocus?: () => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{getPhoneCountryLabel(selectedCountry, language, t)}</Text>
      </View>
      <View style={styles.phoneInputRow}>
        <Pressable style={styles.phoneCountryButton} onPress={onOpenPicker}>
          <Text style={styles.phoneCountryIso}>{selectedCountry.iso === "CUSTOM" ? t.customPhonePrefix : selectedCountry.iso}</Text>
          <Text style={styles.phoneCountryPrefix}>{selectedCountry.callingCode}</Text>
          <Ionicons name="chevron-down" size={14} color={DESIGN.colors.muted} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          showSoftInputOnFocus
          keyboardType="phone-pad"
          autoCorrect={false}
          placeholder="00 000 00 00"
          placeholderTextColor="#94A3B8"
          style={styles.phoneNumberInput}
        />
      </View>
    </View>
  );
}

function PhoneCountryPickerModal({
  visible,
  language,
  t,
  query,
  setQuery,
  customPrefix,
  setCustomPrefix,
  selectedCountry,
  onSelect,
  onSelectCustom,
  onClose,
}: {
  visible: boolean;
  language: AppLanguage;
  t: Record<string, string>;
  query: string;
  setQuery: (value: string) => void;
  customPrefix: string;
  setCustomPrefix: (value: string) => void;
  selectedCountry: PhoneCountryOption;
  onSelect: (country: PhoneCountryOption) => void;
  onSelectCustom: (prefix: string) => void;
  onClose: () => void;
}) {
  const normalizedCustomPrefix = normalizePhonePrefix(customPrefix);
  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((country) => {
      const localizedName = getPhoneCountryLabel(country, language, t).toLowerCase();
      return (
        localizedName.includes(normalizedQuery) ||
        country.country.toLowerCase().includes(normalizedQuery) ||
        country.iso.toLowerCase().includes(normalizedQuery) ||
        country.callingCode.includes(normalizedQuery.replace(/\s/g, ""))
      );
    });
  }, [language, query, t]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.phoneCountryBackdrop}>
        <View style={styles.phoneCountrySheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.phoneCountryHeader}>
            <View style={styles.headerTitleStack}>
              <Text style={styles.phoneCountryTitle}>{t.selectCountryCode}</Text>
              <Text style={styles.phoneCountrySubtitle}>{t.allCountries}</Text>
            </View>
            <Pressable style={styles.sheetClose} onPress={onClose}>
              <Ionicons name="close" size={21} color="#0F172A" />
            </Pressable>
          </View>
          <View style={styles.phoneCountrySearchWrap}>
            <SearchInput value={query} onChangeText={setQuery} placeholder={t.searchCountryOrCode} />
          </View>
          <View style={styles.customPrefixCard}>
            <View style={styles.customPrefixTextBlock}>
              <Text style={styles.customPrefixTitle}>{t.customPhonePrefix}</Text>
              <Text style={styles.customPrefixHint}>{t.customPhonePrefixHint}</Text>
            </View>
            <View style={styles.customPrefixRow}>
              <TextInput
                value={customPrefix}
                onChangeText={setCustomPrefix}
                keyboardType="phone-pad"
                autoCorrect={false}
                placeholder={t.customPhonePrefixPlaceholder}
                placeholderTextColor="#94A3B8"
                style={styles.customPrefixInput}
              />
              <Pressable
                disabled={!normalizedCustomPrefix}
                onPress={() => onSelectCustom(normalizedCustomPrefix)}
                style={[styles.customPrefixButton, !normalizedCustomPrefix && styles.disabled]}
              >
                <Text style={styles.customPrefixButtonText}>{t.useCustomPrefix}</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView style={styles.phoneCountryList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {filteredCountries.map((country) => {
              const isSelected = selectedCountry.iso === country.iso && selectedCountry.callingCode === country.callingCode;
              return (
                <Pressable key={`${country.iso}-${country.callingCode}`} style={[styles.phoneCountryOption, isSelected && styles.phoneCountryOptionActive]} onPress={() => onSelect(country)}>
                  <View style={styles.phoneCountryOptionCode}>
                    <Text style={[styles.phoneCountryOptionIso, isSelected && styles.phoneCountryOptionTextActive]}>{country.iso}</Text>
                  </View>
                  <View style={styles.phoneCountryOptionBody}>
                    <Text style={[styles.phoneCountryOptionName, isSelected && styles.phoneCountryOptionTextActive]} numberOfLines={1} ellipsizeMode="tail">
                      {getPhoneCountryLabel(country, language, t)}
                    </Text>
                    <Text style={styles.phoneCountryOptionCaption}>{country.country}</Text>
                  </View>
                  <Text style={[styles.phoneCountryOptionPrefix, isSelected && styles.phoneCountryOptionTextActive]}>{country.callingCode}</Text>
                  {isSelected ? <Ionicons name="checkmark-circle" size={20} color={DESIGN.colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
        showSoftInputOnFocus={props.showSoftInputOnFocus ?? true}
        placeholderTextColor="#94A3B8"
        style={[styles.input, props.editable === false && styles.inputDisabled]}
      />
    </View>
  );
}

function SearchInput({
  value,
  onChangeText,
  placeholder,
  editable = true,
  selectTextOnFocus,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
  selectTextOnFocus?: boolean;
}) {
  return (
    <View style={[styles.searchInputShell, !editable && styles.inputDisabled]}>
      <Ionicons name="search" size={18} color="#64748B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCorrect={false}
        editable={editable}
        selectTextOnFocus={selectTextOnFocus}
        style={styles.searchInput}
      />
      {editable && value.trim() ? (
        <Pressable style={styles.searchClearButton} onPress={() => onChangeText("")}>
          <Ionicons name="close" size={16} color="#64748B" />
        </Pressable>
      ) : null}
    </View>
  );
}

function InlineClientInput({
  label,
  ...props
}: {
  label: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inlineClientField}>
      <Text style={styles.inlineClientLabel}>{label}</Text>
      <TextInput
        {...props}
        autoCorrect={false}
        placeholderTextColor="#94A3B8"
        style={styles.inlineClientInput}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && !disabled && styles.pressablePressed, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && !disabled && styles.pressablePressed, disabled && styles.disabled]} disabled={disabled}>
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

const DESIGN = {
  colors: {
    background: "#F5F7FC",
    surface: "#FFFFFF",
    surfaceSoft: "#F8FAFF",
    text: "#101828",
    muted: "#6F7A90",
    faint: "#A4AEC0",
    border: "#E2EAF5",
    primary: "#7357F6",
    primaryDark: "#46316F",
    primarySoft: "#F2EEFF",
    success: "#16A34A",
    danger: "#E11D48",
    warning: "#F59E0B",
    cyan: "#0891B2",
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 26,
    pill: 999,
  },
  spacing: {
    screen: 16,
    card: 16,
  },
  type: {
    pageTitle: 18,
    sheetTitle: 23,
    section: 14,
    body: 14,
    caption: 12,
  },
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.background,
  },
  authScreen: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? Math.max(Constants.statusBarHeight || 0, 24) : 0,
    backgroundColor: DESIGN.colors.background,
  },
  keyboard: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    paddingHorizontal: DESIGN.spacing.screen,
    paddingTop: 12,
    paddingBottom: 30,
  },
  authContentWithStickyFooter: {
    paddingBottom: 126,
  },
  authContentKeyboardOpen: {
    paddingBottom: Platform.OS === "android" ? 340 : 180,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
    marginTop: 2,
    marginBottom: 18,
  },
  authIcon: {
    width: 76,
    height: 76,
    borderRadius: DESIGN.radius.xl,
    marginBottom: 12,
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  authTitle: {
    color: DESIGN.colors.text,
    fontSize: 29,
    lineHeight: 33,
    fontWeight: "800",
    textAlign: "center",
  },
  authSubtitle: {
    marginTop: 7,
    color: DESIGN.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  languageMenuAnchor: {
    alignSelf: "flex-start",
    zIndex: 30,
  },
  languageTrigger: {
    minWidth: 116,
    maxWidth: 156,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  languageTriggerActive: {
    borderColor: "#C4B5FD",
    backgroundColor: "#FFFFFF",
  },
  languageTriggerCode: {
    color: DESIGN.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  languageTriggerLabel: {
    flexShrink: 1,
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
  languageDropdownLayer: {
    flex: 1,
  },
  languageSheetLayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 48,
  },
  languageDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
  languageSheetMenu: {
    width: "100%",
    maxWidth: 360,
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  languageDropdownMenu: {
    position: "absolute",
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  languageDropdownItem: {
    minHeight: 42,
    paddingHorizontal: 9,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  languageDropdownItemActive: {
    backgroundColor: DESIGN.colors.primarySoft,
  },
  languageDropdownCode: {
    width: 34,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  languageDropdownCodeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
  },
  languageDropdownText: {
    flex: 1,
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  languageDropdownTextActive: {
    color: DESIGN.colors.primary,
  },
  authCard: {
    width: "100%",
    borderRadius: 24,
    padding: 16,
    backgroundColor: DESIGN.colors.surface,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.045,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 14,
    borderRadius: DESIGN.radius.lg,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  segmentButton: {
    flex: 1,
    height: 44,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
  },
  segmentButtonActive: {
    borderWidth: 1,
    borderColor: "#D9D2FF",
    backgroundColor: DESIGN.colors.surface,
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  segmentText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#5B4BDB",
  },
  socialAuthBlock: {
    gap: 8,
    marginBottom: 13,
  },
  socialAuthButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  socialAuthButtonDark: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  socialAuthButtonMuted: {
    opacity: 0.78,
  },
  socialProviderIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  socialProviderLetter: {
    color: "#4285F4",
    fontSize: 14,
    fontWeight: "900",
  },
  socialButtonText: {
    color: DESIGN.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  socialButtonTextDark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  socialButtonCaption: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  socialDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  socialDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  socialDividerText: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  biometricUnlockCard: {
    minHeight: 62,
    marginBottom: 14,
    padding: 12,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: DESIGN.colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  biometricUnlockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  biometricUnlockText: {
    flex: 1,
    minWidth: 0,
  },
  form: {
    gap: 10,
  },
  authInlineCta: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
    backgroundColor: DESIGN.colors.primarySoft,
  },
  authInlineCtaText: {
    color: DESIGN.colors.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },
  forgotPasswordLink: {
    minHeight: 36,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  forgotPasswordLinkText: {
    color: DESIGN.colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
  authDetailsToggle: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  authDetailsToggleText: {
    color: DESIGN.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  authOptionalBlock: {
    gap: 12,
    padding: 12,
    borderRadius: DESIGN.radius.lg,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  authStickyFooter: {
    paddingHorizontal: DESIGN.spacing.screen,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 18 : 12,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  captchaSheet: {
    maxHeight: "86%",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: Platform.OS === "ios" ? 24 : 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#142033",
    shadowOpacity: 0.13,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -12 },
  },
  captchaTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  captchaSubtitle: {
    color: DESIGN.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  captchaWebView: {
    height: 250,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
  },
  captchaLoading: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
  },
  captchaBrowserHint: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  captchaBrowserButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  captchaBrowserButtonText: {
    color: DESIGN.colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
  captchaCancelButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
  },
  captchaCancelText: {
    color: DESIGN.colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  forgotPasswordSheet: {
    gap: 14,
    minHeight: 330,
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: Platform.OS === "ios" ? 24 : 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#142033",
    shadowOpacity: 0.13,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -12 },
  },
  forgotPasswordField: {
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  forgotPasswordInput: {
    height: 56,
    fontSize: 16,
    fontWeight: "800",
  },
  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 7,
  },
  fieldHeader: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    flexShrink: 1,
    color: DESIGN.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    flexShrink: 1,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(214, 224, 239, 0.78)",
    backgroundColor: "#FBFCFF",
    paddingHorizontal: 15,
    color: DESIGN.colors.text,
    fontSize: 14,
    shadowColor: "#64748B",
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  inputDisabled: {
    backgroundColor: DESIGN.colors.surfaceSoft,
    color: DESIGN.colors.muted,
  },
  phoneInputRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phoneCountryButton: {
    minWidth: 116,
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  phoneCountryIso: {
    maxWidth: 44,
    color: DESIGN.colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  phoneCountryPrefix: {
    color: DESIGN.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  phoneNumberInput: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: 14,
    color: DESIGN.colors.text,
    fontSize: 16,
  },
  phoneCountryBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  phoneCountrySheet: {
    maxHeight: "90%",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DESIGN.colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 8,
  },
  phoneCountryHeader: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 10,
  },
  phoneCountryTitle: {
    color: DESIGN.colors.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
  },
  phoneCountrySubtitle: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  phoneCountrySearchWrap: {
    marginBottom: 10,
  },
  customPrefixCard: {
    gap: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  customPrefixTextBlock: {
    gap: 3,
  },
  customPrefixTitle: {
    color: DESIGN.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  customPrefixHint: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  customPrefixRow: {
    flexDirection: "row",
    gap: 8,
  },
  customPrefixInput: {
    width: 94,
    height: 46,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: 12,
    color: DESIGN.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  customPrefixButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: 12,
  },
  customPrefixButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  phoneCountryList: {
    maxHeight: 420,
  },
  phoneCountryOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  phoneCountryOptionActive: {
    borderColor: "#C4B5FD",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  phoneCountryOptionCode: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
    backgroundColor: "#F1F5F9",
  },
  phoneCountryOptionIso: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  phoneCountryOptionBody: {
    flex: 1,
    minWidth: 0,
  },
  phoneCountryOptionName: {
    color: DESIGN.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  phoneCountryOptionCaption: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  phoneCountryOptionPrefix: {
    color: DESIGN.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  phoneCountryOptionTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  primaryButton: {
    minHeight: 50,
    marginTop: 6,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
    paddingHorizontal: 18,
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(214, 224, 239, 0.9)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: DESIGN.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  dangerButton: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.62,
  },
  pressablePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  appScreen: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? Math.max(Constants.statusBarHeight || 0, 24) : 0,
    backgroundColor: DESIGN.colors.background,
  },
  nativeHeader: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.56)",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    shadowColor: "#415169",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  headerTitleStack: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  nativeHeaderTitle: {
    color: DESIGN.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  headerBusinessInline: {
    marginTop: 2,
    color: "#7F8A9E",
    fontSize: 10,
    fontWeight: "700",
  },
  nativeHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(221, 229, 242, 0.86)",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: "#415169",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerIconBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  headerIconBadgeRed: {
    backgroundColor: "#EF4444",
  },
  headerIconBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  headerIconButtonActive: {
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  headerIconButtonDone: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  headerIconButtonCyan: {
    borderColor: "#BAE6FD",
    backgroundColor: "#ECFEFF",
  },
  profilePill: {
    height: 40,
    minWidth: 58,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: DESIGN.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(221, 229, 242, 0.86)",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: "#415169",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A7A72",
    overflow: "hidden",
  },
  smallAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: "cover",
  },
  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  headerPanelBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.24)",
  },
  headerPanel: {
    maxHeight: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  headerPanelTop: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  headerPanelTitleStack: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  headerPanelEyebrow: {
    color: DESIGN.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  headerPanelTitle: {
    marginTop: 4,
    color: DESIGN.colors.text,
    fontSize: DESIGN.type.sheetTitle,
    lineHeight: 28,
    fontWeight: "800",
  },
  headerPanelClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  headerPanelBody: {
    padding: 14,
  },
  panelHint: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  setupProgressRow: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: DESIGN.radius.lg,
    backgroundColor: DESIGN.colors.primarySoft,
  },
  setupProgressRowDone: {
    backgroundColor: "#F0FDF4",
  },
  setupProgressValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setupReadyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    color: DESIGN.colors.success,
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: "#DCFCE7",
  },
  setupProgressTitle: {
    color: DESIGN.colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
  setupProgressValue: {
    color: DESIGN.colors.primaryDark,
    fontSize: 16,
    fontWeight: "900",
  },
  setupStep: {
    minHeight: 58,
    marginTop: 8,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  setupStepDone: {
    backgroundColor: "#FAFBFF",
    opacity: 0.86,
  },
  setupStepIcon: {
    width: 36,
    height: 36,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  setupStepIconDone: {
    backgroundColor: "#22C55E",
  },
  setupStepText: {
    flex: 1,
    color: DESIGN.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  setupDoneText: {
    color: DESIGN.colors.success,
    fontSize: 12,
    fontWeight: "800",
  },
  shareToggleRow: {
    minHeight: 58,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "#F8FAFF",
  },
  shareToggleTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  bookingLinkCard: {
    minHeight: 50,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "#FFFFFF",
  },
  bookingLinkText: {
    flex: 1,
    minWidth: 0,
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  bookingLinkActions: {
    flexDirection: "row",
    gap: 6,
  },
  mobileSwitch: {
    width: 54,
    height: 32,
    padding: 3,
    borderRadius: 16,
    backgroundColor: "#CBD5E1",
  },
  mobileSwitchActive: {
    backgroundColor: "#6D4AFF",
  },
  mobileSwitchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  mobileSwitchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  shareUrlInput: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    color: "#475569",
    backgroundColor: "#F8FAFC",
  },
  headerPanelActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  headerGhostButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  headerGhostButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  headerPrimaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#6D4AFF",
    shadowColor: "#6D4AFF",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  headerPrimaryButtonFull: {
    flex: 0,
  },
  headerPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  headerPanelKeyboard: {
    flexShrink: 1,
    minHeight: 0,
  },
  headerPanelScrollBody: {
    flexShrink: 1,
    minHeight: 0,
  },
  supportPanelContent: {
    padding: 16,
    paddingBottom: 12,
  },
  supportPanelFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  supportGuideCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  supportGuideTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
  supportTicket: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: "hidden",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#5B4BDB",
  },
  supportMessagesStack: {
    marginTop: 10,
    gap: 8,
  },
  supportBubble: {
    alignSelf: "flex-start",
    maxWidth: "86%",
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
    color: "#171717",
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: "#F1F2F4",
  },
  supportBubbleUser: {
    alignSelf: "flex-end",
    color: "#FFFFFF",
    backgroundColor: "#5B4BDB",
  },
  supportBubbleFailed: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  supportInput: {
    minHeight: 92,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8CFC7",
    color: "#0F172A",
    textAlignVertical: "top",
  },
  supportStatusText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  notificationHeading: {
    marginTop: 6,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationHeadingTextStack: {
    flex: 1,
    minWidth: 0,
  },
  notificationHeadingText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  notificationHeadingCaption: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  notificationBadgeText: {
    minWidth: 26,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    overflow: "hidden",
    textAlign: "center",
    color: "#6D4AFF",
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "#EEF2FF",
  },
  notificationEmptyCard: {
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#F8FAFC",
  },
  notificationCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  notificationCardUnread: {
    borderColor: "#B7C6FF",
    backgroundColor: "#F8FAFF",
  },
  notificationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  notificationTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  notificationCardTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  notificationService: {
    marginTop: 8,
    color: "#667085",
    fontSize: 13,
    fontWeight: "600",
  },
  notificationStatusPill: {
    marginTop: 8,
    minHeight: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#FEF3C7",
  },
  notificationStatusConfirmed: {
    backgroundColor: "#D1FAE5",
  },
  notificationStatusCancelled: {
    backgroundColor: "#FCE7F3",
  },
  notificationStatusText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "800",
  },
  notificationStatusConfirmedText: {
    color: "#047857",
  },
  notificationStatusCancelledText: {
    color: "#BE123C",
  },
  notificationActionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  notificationActionButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  notificationConfirmButton: {
    borderColor: "#6D4AFF",
    backgroundColor: "#6D4AFF",
  },
  notificationCancelButton: {
    borderColor: "#FBCFE8",
    backgroundColor: "#FFF1F2",
  },
  notificationConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  notificationCancelButtonText: {
    color: "#BE123C",
    fontSize: 12,
    fontWeight: "900",
  },
  accountMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  accountHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  accountPlanText: {
    marginTop: 3,
    color: "#6D4AFF",
    fontSize: 13,
    fontWeight: "900",
  },
  accountBookingCard: {
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFF",
  },
  accountUpgradeButton: {
    minHeight: 40,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#6D4AFF",
  },
  accountUpgradeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  accountAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
    overflow: "hidden",
  },
  accountAvatarLargeImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: "cover",
  },
  accountAvatarLargeText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  accountName: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  accountMenuItem: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  accountMenuItemLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountMenuItemRight: {
    maxWidth: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  accountMenuItemText: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "700",
  },
  accountMenuItemValue: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  accountDangerText: {
    color: "#E11D48",
    fontWeight: "800",
  },
  accountMenuLabel: {
    marginTop: 14,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  accountLanguageRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  accountLanguageButton: {
    minWidth: 74,
    flexGrow: 1,
    flexBasis: "22%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  accountLanguageButtonActive: {
    borderColor: "#A5B4FC",
    backgroundColor: "#EEF2FF",
  },
  accountLanguageText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  accountLanguageTextActive: {
    color: "#6D4AFF",
  },
  accountLogout: {
    minHeight: 54,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  accountLogoutText: {
    color: "#64748B",
    fontSize: 17,
    fontWeight: "700",
  },
  accountVersionText: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  accountInfoRow: {
    minHeight: 54,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  accountInfoLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  accountInfoValue: {
    marginTop: 3,
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },
  accountLanguageListItem: {
    minHeight: 56,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  accountLanguageListItemActive: {
    borderColor: "#C4B5FD",
    backgroundColor: "#F5F3FF",
  },
  deleteAccountInfoCard: {
    gap: 8,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    backgroundColor: "#FFF7F8",
  },
  deleteAccountInfoTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  deleteCheckRow: {
    minHeight: 58,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  deleteCheckboxActive: {
    borderColor: "#E11D48",
    backgroundColor: "#E11D48",
  },
  deleteCheckText: {
    flex: 1,
    color: "#334155",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  deleteConfirmButton: {
    backgroundColor: "#E11D48",
  },
  calendarScreen: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },
  calendarToolbar: {
    minHeight: 44,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.36)",
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  toolbarSpacer: {
    flex: 1,
  },
  modeButton: {
    minWidth: 58,
    maxWidth: 98,
    flexShrink: 1,
    height: 32,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.56)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    shadowColor: "#64748B",
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modeButtonActive: {
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  modeButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  modeButtonTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  dateStrip: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.52)",
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  dateStripContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 7,
  },
  dateChip: {
    height: 32,
    minWidth: 62,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.sm,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  dateChipActive: {
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  dateChipText: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  dateChipTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  masterStrip: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.36)",
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  masterAvatar: {
    width: 28,
    height: 28,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "#9A7A72",
    overflow: "hidden",
  },
  memberAvatarImage: {
    resizeMode: "cover",
  },
  masterAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  masterName: {
    width: "100%",
    maxWidth: "100%",
    marginTop: 4,
    paddingHorizontal: 10,
    color: "#0F172A",
    fontSize: 13,
    lineHeight: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  masterRole: {
    width: "100%",
    maxWidth: "100%",
    marginTop: 1,
    paddingHorizontal: 10,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  calendarScroll: {
    flex: 1,
    minHeight: 0,
  },
  calendarContent: {
    paddingBottom: 10,
  },
  teamCalendarBoard: {
    flex: 1,
  },
  dayOffBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  dayOffBannerTitle: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "900",
  },
  dayOffBannerText: {
    marginTop: 2,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "800",
  },
  calendarEmptyState: {
    position: "absolute",
    left: CALENDAR_TIME_AXIS_WIDTH + 14,
    right: 14,
    top: 120,
    padding: 12,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  calendarEmptyTitle: {
    color: "#0F172A",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  calendarEmptyText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  emptyActionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  emptyPrimaryAction: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
  },
  emptyPrimaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySecondaryAction: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  emptySecondaryActionText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  teamMembersHorizontal: {
    flex: 1,
  },
  teamMembersHorizontalContent: {
    alignItems: "stretch",
  },
  teamMembersHeaderRow: {
    flexDirection: "row",
    minHeight: CALENDAR_TEAM_HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  teamMembersBodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  teamCalendarBodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  teamLeftAxisColumn: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    flexShrink: 0,
  },
  teamPickerRail: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    height: CALENDAR_TEAM_HEADER_HEIGHT,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: "#E5E7EB",
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
  },
  teamPickerRailBody: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    alignSelf: "stretch",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
  },
  timeAxisColumn: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
  },
  timeAxisHour: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  timeAxisCurrentDot: {
    position: "absolute",
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#F43F5E",
    backgroundColor: "#FFFFFF",
    zIndex: 5,
  },
  teamPickerButton: {
    width: 36,
    height: 36,
    marginTop: 11,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  teamPickerBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#6D4AFF",
  },
  teamPickerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  teamDayColumn: {
    minWidth: CALENDAR_MIN_MEMBER_COLUMN_WIDTH,
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  teamDayHeader: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: CALENDAR_MIN_MEMBER_COLUMN_WIDTH,
    minHeight: CALENDAR_TEAM_HEADER_HEIGHT,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  teamPickerMenu: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "72%",
    marginTop: 132,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  teamPickerSectionTitle: {
    marginTop: 12,
    marginBottom: 7,
    color: "#7B8498",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  teamPickerList: {
    maxHeight: 360,
  },
  teamPickerOption: {
    minHeight: 66,
    marginBottom: 7,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  teamPickerOptionActive: {
    backgroundColor: "#EEF2FF",
  },
  teamPickerOptionTitleActive: {
    color: "#5B21F3",
  },
  teamCheckBox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  teamCheckBoxActive: {
    borderColor: "#6D4AFF",
    backgroundColor: "#6D4AFF",
  },
  overviewScroll: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  mobileWeekContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
    alignItems: "flex-start",
  },
  mobileWeekDayCard: {
    minHeight: 198,
    padding: 10,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  mobileWeekDayCardActive: {
    borderColor: DESIGN.colors.primary,
    backgroundColor: "#FBFAFF",
  },
  mobileWeekDayCardClosed: {
    backgroundColor: "#F8FAFC",
  },
  mobileWeekDayHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  mobileWeekWeekday: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  mobileWeekDateNumber: {
    marginTop: 1,
    color: DESIGN.colors.text,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "900",
  },
  mobileWeekDateActive: {
    color: DESIGN.colors.primary,
  },
  mobileWeekBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: DESIGN.colors.primary,
  },
  mobileWeekBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  mobileWeekAppointments: {
    marginTop: 8,
    gap: 7,
  },
  mobileWeekAppointmentPill: {
    minHeight: 42,
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
  },
  mobileWeekAppointmentPillBlocked: {
    backgroundColor: "#EEF2F7",
  },
  mobileWeekAppointmentTime: {
    color: DESIGN.colors.text,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900",
  },
  mobileWeekAppointmentTitle: {
    marginTop: 2,
    color: DESIGN.colors.text,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "800",
  },
  mobileWeekAppointmentSubtitle: {
    marginTop: 1,
    color: DESIGN.colors.muted,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },
  mobileWeekEmptySlot: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  mobileWeekEmptyText: {
    color: DESIGN.colors.faint,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  mobileWeekMorePill: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: DESIGN.colors.primarySoft,
  },
  mobileWeekMoreText: {
    color: DESIGN.colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  summaryStrip: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  teamOverviewContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  teamOverviewGrid: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
  },
  teamOverviewHeaderRow: {
    flexDirection: "row",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  teamOverviewMemberHeader: {
    width: 70,
    borderRightWidth: 1,
    borderRightColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  teamOverviewDateHeader: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
  },
  teamOverviewDateHeaderActive: {
    backgroundColor: DESIGN.colors.primarySoft,
  },
  teamOverviewDateNumber: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  teamOverviewDateWeekday: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  teamOverviewRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  teamOverviewMemberCell: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
  },
  teamOverviewMemberName: {
    marginTop: 6,
    textAlign: "center",
    color: "#0F172A",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
  },
  teamOverviewDayCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
  },
  teamOverviewDayCellActive: {
    borderWidth: 1,
    borderColor: "#C4B5FD",
    backgroundColor: "#FBFAFF",
  },
  teamOverviewAppointmentBar: {
    height: 16,
    marginBottom: 4,
    paddingHorizontal: 5,
    justifyContent: "center",
    borderRadius: 6,
  },
  teamOverviewAppointmentText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "800",
  },
  teamOverviewMoreText: {
    color: "#6D4AFF",
    fontSize: 11,
    fontWeight: "900",
  },
  summaryCard: {
    minHeight: 214,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  summaryCardActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#FAF7FF",
  },
  summaryCardClosed: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  summaryHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryDate: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  summaryDateActive: {
    color: "#6D4AFF",
  },
  summaryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#7047EE",
  },
  summaryHours: {
    marginTop: 8,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryHoursRow: {
    marginTop: 8,
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  summaryHoursPart: {
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
  },
  summaryClosedText: {
    color: "#64748B",
    fontSize: 16,
  },
  summaryCount: {
    marginTop: 8,
    color: "#5B21B6",
    fontSize: 13,
    fontWeight: "900",
  },
  dayCountBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#6D4AFF",
  },
  dayCountBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  summaryClosedBadge: {
    marginTop: 8,
    height: 30,
    paddingHorizontal: 9,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
  },
  summaryClosedBadgeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryVisitsLine: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  summaryCountCompact: {
    color: "#94A3B8",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
  },
  summaryCountCompactActive: {
    color: "#6D4AFF",
  },
  summaryAppointments: {
    marginTop: 12,
    gap: 7,
  },
  summaryAppointment: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FFE4DB",
  },
  summaryAppointmentTime: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },
  summaryAppointmentText: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryAddButton: {
    height: 38,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  summaryAddText: {
    color: "#5B21B6",
    fontSize: 12,
    fontWeight: "900",
  },
  openDayButton: {
    marginTop: "auto",
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  openDayButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },
  monthGrid: {
    padding: 10,
    paddingBottom: 130,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  monthCell: {
    width: "12.85%",
    minHeight: 64,
    padding: 5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: "#FFFFFF",
  },
  monthCellTop: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  monthCellActive: {
    borderColor: "#A78BFA",
    borderWidth: 1,
    backgroundColor: "#FBFAFF",
  },
  monthCellMuted: {
    opacity: 0.45,
  },
  monthDayNumber: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  monthWorkText: {
    color: "#64748B",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "700",
  },
  compactWorkTime: {
    marginTop: 5,
    minHeight: 20,
    width: "100%",
  },
  closedBadge: {
    marginTop: 6,
    height: 20,
    paddingHorizontal: 5,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 7,
    backgroundColor: "#EEF2F7",
  },
  closedBadgeText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "800",
  },
  monthVisitBadge: {
    marginTop: 6,
    maxWidth: "100%",
    alignSelf: "flex-start",
    gap: 4,
  },
  monthVisitBadgeText: {
    maxWidth: "100%",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    color: DESIGN.colors.primaryDark,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  monthVisitDots: {
    flexDirection: "row",
    gap: 3,
  },
  monthVisitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  visitMiniLine: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  visitMiniText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "900",
  },
  visitMiniTextActive: {
    color: "#6D4AFF",
  },
  mutedText: {
    color: DESIGN.colors.faint,
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
    zIndex: 1,
  },
  hourText: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    paddingRight: 0,
    height: 18,
    lineHeight: 18,
    marginTop: -9,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },
  hourTextHidden: {
    opacity: 0,
  },
  hourGrid: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(226, 232, 240, 0.48)",
  },
  majorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(203, 213, 225, 0.44)",
  },
  minorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(226, 232, 240, 0.28)",
  },
  closedBlock: {
    position: "absolute",
    left: CALENDAR_TIME_AXIS_WIDTH,
    right: 0,
    justifyContent: "center",
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.86)",
    backgroundColor: "#F8FAFC",
    opacity: 1,
    zIndex: 0,
  },
  editableClosedBlock: {
    zIndex: 2,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(115, 87, 246, 0.48)",
    backgroundColor: "#F6F7FB",
    opacity: 0.96,
  },
  closedBlockText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
  },
  closedBlockTimeText: {
    marginTop: 2,
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
  },
  closedDayHitbox: {
    position: "absolute",
    right: 0,
    zIndex: 2,
    backgroundColor: "transparent",
  },
  timeSlotHitbox: {
    position: "absolute",
    right: 0,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  currentTimeLine: {
    position: "absolute",
    left: CALENDAR_TIME_AXIS_WIDTH,
    right: 0,
    height: 2,
    backgroundColor: "rgba(244, 63, 94, 0.84)",
    zIndex: 30,
  },
  currentTimeDot: {
    position: "absolute",
    left: -5,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#F43F5E",
  },
  appointmentBlock: {
    position: "absolute",
    zIndex: 3,
    borderRadius: 12,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 10,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#243044",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  appointmentBlockTight: {
    borderRadius: 11,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },
  appointmentBlockVeryTight: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 6,
  },
  appointmentDeleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    zIndex: 4,
  },
  appointmentDeleteButtonTight: {
    top: 5,
    right: 5,
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  appointmentMoveButton: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    zIndex: 4,
  },
  appointmentMoveButtonTight: {
    right: 5,
    bottom: 5,
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  appointmentTime: {
    color: "#475569",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
  appointmentTimeTight: {
    fontSize: 10,
    lineHeight: 12,
  },
  appointmentTimeVeryTight: {
    fontSize: 9,
    lineHeight: 10,
  },
  appointmentClient: {
    maxWidth: "100%",
    marginTop: 2,
    color: "#0F172A",
    fontSize: 14,
    lineHeight: 15,
    fontWeight: "900",
  },
  appointmentClientTight: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 15,
  },
  appointmentClientVeryTight: {
    marginTop: 0,
    fontSize: 12,
    lineHeight: 14,
  },
  appointmentService: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
  },
  appointmentServiceTight: {
    fontSize: 11,
    lineHeight: 13,
  },
  appointmentServiceVeryTight: {
    marginTop: 0,
    fontSize: 10,
    lineHeight: 12,
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
    zIndex: 5,
  },
  fabButton: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 106 : 96,
    width: 56,
    height: 56,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.82)",
    backgroundColor: "rgba(109, 74, 255, 0.88)",
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 13 },
    elevation: 7,
  },
  fabButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.30)",
  },
  menuBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 108,
    paddingHorizontal: 12,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
  },
  timeActionBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "ios" ? 98 : 88,
    backgroundColor: "rgba(15, 23, 42, 0.20)",
  },
  viewMenu: {
    width: 176,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  timeActionMenu: {
    width: "100%",
    padding: 10,
    paddingTop: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  timeActionTitle: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 7,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  noServicesActionSheet: {
    alignItems: "center",
    gap: 10,
    padding: 8,
  },
  noServicesActionTitle: {
    color: DESIGN.colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    textAlign: "center",
  },
  noServicesActionText: {
    marginBottom: 4,
    color: DESIGN.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
  noServicesCancelButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: DESIGN.radius.md,
  },
  noServicesFullButton: {
    width: "100%",
  },
  noServicesCancelText: {
    color: DESIGN.colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  timeActionItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  timeActionText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  viewMenuItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
  },
  viewMenuItemActive: {
    backgroundColor: "#F3E8FF",
  },
  viewMenuDivider: {
    height: 1,
    marginVertical: 5,
    backgroundColor: DESIGN.colors.border,
  },
  viewMenuText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  viewMenuTextActive: {
    color: "#5B21B6",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 999,
    backgroundColor: "#D8E0EC",
  },
  visitSheet: {
    gap: 10,
    maxHeight: "91%",
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 26,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#142033",
    shadowOpacity: 0.13,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -12 },
  },
  visitEditorSheet: {
    maxHeight: "90%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 2,
  },
  sheetTitle: {
    flex: 1,
    color: DESIGN.colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
  },
  sheetClose: {
    width: 42,
    height: 42,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  blockedTimeSummary: {
    minHeight: 46,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    backgroundColor: "#FAF7FF",
  },
  blockedTimeSummaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  visitEditorScroll: {
    maxHeight: 490,
  },
  visitClientCard: {
    minHeight: 78,
    padding: 13,
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCD6FF",
    backgroundColor: "#F4F0FF",
  },
  visitClientCardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visitContactActions: {
    flexDirection: "row",
    gap: 9,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(216, 208, 255, 0.64)",
  },
  visitContactActionButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.82)",
    backgroundColor: "#FFFFFF",
  },
  visitContactActionPhone: {
    backgroundColor: "#EFF6FF",
  },
  visitContactActionWhatsApp: {
    backgroundColor: "#ECFDF5",
  },
  visitContactActionTelegram: {
    backgroundColor: "#E0F2FE",
  },
  visitContactActionViber: {
    backgroundColor: "#F1EEFF",
  },
  clientAvatarLarge: {
    width: 46,
    height: 46,
    borderRadius: DESIGN.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.surface,
  },
  clientAvatarLargeText: {
    color: DESIGN.colors.primary,
    fontSize: 19,
    fontWeight: "900",
  },
  visitCardEyebrow: {
    color: DESIGN.colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  visitClientTitle: {
    marginTop: 2,
    color: DESIGN.colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  visitSectionHeader: {
    marginTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  visitSectionTitle: {
    color: DESIGN.colors.text,
    fontSize: DESIGN.type.section,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  visitSectionDate: {
    marginTop: 4,
    color: DESIGN.colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  visitServiceCard: {
    marginTop: 11,
    padding: 11,
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DDE6F2",
    backgroundColor: "#FFFFFF",
  },
  visitServiceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visitServicePickerButton: {
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DDE6F2",
    backgroundColor: "#F8FAFF",
  },
  visitServicePickerText: {
    color: DESIGN.colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  smallIconButton: {
    width: 38,
    height: 38,
    borderRadius: DESIGN.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },
  visitServiceMeta: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visitServicePrice: {
    color: DESIGN.colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  addAnotherServiceButton: {
    marginTop: 10,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCD6FF",
    backgroundColor: DESIGN.colors.surface,
  },
  addAnotherServiceText: {
    color: DESIGN.colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  visitTotals: {
    minHeight: 34,
    paddingTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  visitTotalsText: {
    color: DESIGN.colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  dangerTextButton: {
    minHeight: 44,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
  },
  dangerTextButtonText: {
    color: DESIGN.colors.danger,
    fontSize: 14,
    fontWeight: "800",
  },
  visitTotalValue: {
    color: DESIGN.colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  pickerList: {
    maxHeight: 470,
  },
  clientPickerScroll: {
    maxHeight: 650,
  },
  clientPickerScrollContent: {
    paddingBottom: 220,
  },
  clientPickerResults: {
    paddingTop: 2,
  },
  clientModalScroll: {
    maxHeight: 520,
  },
  clientModalScrollContent: {
    gap: 10,
    paddingBottom: 220,
  },
  clientDeleteButton: {
    minHeight: 50,
    marginTop: 2,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF1F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  clientDeleteButtonText: {
    color: "#E11D48",
    fontSize: 15,
    fontWeight: "900",
  },
  servicePickerSearchBar: {
    zIndex: 2,
    paddingBottom: 8,
    backgroundColor: DESIGN.colors.surface,
  },
  pickerEmptyState: {
    marginTop: 8,
    padding: 14,
    alignItems: "center",
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  pickerEmptyTitle: {
    color: DESIGN.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "700",
  },
  pickerEmptyButton: {
    marginTop: 10,
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DESIGN.radius.md,
    backgroundColor: DESIGN.colors.primarySoft,
  },
  pickerEmptyButtonText: {
    color: DESIGN.colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  searchInputShell: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    color: DESIGN.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  searchClearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.border,
  },
  clientOptionCard: {
    minHeight: 60,
    marginBottom: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  clientOptionCardActive: {
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  clientCreateSuggestion: {
    minHeight: 64,
    marginBottom: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  inlineClientForm: {
    marginBottom: 10,
    padding: 14,
    gap: 12,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: DESIGN.colors.primarySoft,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  inlineClientField: {
    gap: 6,
  },
  inlineClientLabel: {
    color: DESIGN.colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  inlineClientInput: {
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    color: DESIGN.colors.text,
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: DESIGN.colors.surface,
  },
  inlineClientFormTitle: {
    color: DESIGN.colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  inlineClientFormHint: {
    marginTop: 3,
    color: DESIGN.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  clientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  clientAvatarText: {
    color: DESIGN.colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  clientOptionText: {
    flex: 1,
    minWidth: 0,
  },
  clientOptionTitle: {
    color: DESIGN.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  clientOptionCaption: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  serviceOptionCard: {
    minHeight: 76,
    maxHeight: 84,
    marginBottom: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  serviceTone: {
    width: 8,
    height: 48,
    borderRadius: 4,
  },
  serviceOptionInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  serviceOptionTitle: {
    color: DESIGN.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  serviceOptionDuration: {
    marginTop: 3,
    color: DESIGN.colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
  },
  serviceOptionPrice: {
    color: DESIGN.colors.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    minWidth: 74,
    maxWidth: 92,
  },
  servicePickerEmptyCard: {
    marginTop: 10,
    padding: 16,
    alignItems: "center",
    borderRadius: DESIGN.radius.xl,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FBFAFF",
  },
  bottomNav: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 10 : 8,
    minHeight: Platform.OS === "ios" ? 70 : 66,
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: Platform.OS === "ios" ? 14 : 8,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 5,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.46)",
    backgroundColor: "rgba(255, 255, 255, 0.91)",
    shadowColor: "#1D2B44",
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -7 },
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 23,
  },
  bottomNavIconWrap: {
    width: 24,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavLockBadge: {
    position: "absolute",
    right: 1,
    top: -2,
    width: 13,
    height: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#F5F3FF",
  },
  bottomNavItemActive: {
    borderWidth: 1,
    borderColor: "rgba(115, 87, 246, 0.08)",
    backgroundColor: "rgba(115, 87, 246, 0.035)",
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  bottomNavItemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  bottomNavText: {
    color: "#7F8A9E",
    fontSize: 9,
    fontWeight: "600",
  },
  bottomNavTextActive: {
    color: "#5B4BDB",
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
    backgroundColor: DESIGN.colors.background,
  },
  workspaceKeyboard: {
    flex: 1,
  },
  workspaceContent: {
    paddingHorizontal: DESIGN.spacing.screen,
    paddingTop: 10,
    paddingBottom: 132,
  },
  workspaceContentKeyboardOpen: {
    paddingBottom: 430,
  },
  workspaceHero: {
    marginBottom: 16,
    paddingHorizontal: 2,
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
    fontSize: 28,
    lineHeight: 33,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  tabText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#4F46E5",
  },
  sectionStack: {
    gap: 10,
  },
  settingsRoot: {
    gap: 10,
  },
  settingsTopPanel: {
    minHeight: 38,
    paddingHorizontal: 2,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingsTopCopy: {
    flex: 1,
    minWidth: 0,
  },
  settingsTopKicker: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  settingsTopTitle: {
    color: DESIGN.colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
  },
  settingsTopSubtitle: {
    marginTop: 1,
    color: DESIGN.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  settingsStatusBadge: {
    maxWidth: 132,
    minHeight: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: DESIGN.radius.pill,
    backgroundColor: "#ECFDF5",
  },
  settingsStatusBadgeText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "900",
  },
  settingsSectionHint: {
    marginTop: -3,
    paddingHorizontal: 2,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  settingsAccordionNav: {
    gap: 6,
  },
  settingsAccordionHeader: {
    minHeight: 52,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.58)",
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  settingsAccordionHeaderActive: {
    borderColor: "rgba(216, 208, 255, 0.92)",
    backgroundColor: "#F7F4FF",
  },
  settingsAccordionBody: {
    gap: 10,
  },
  servicesModeRow: {
    flexDirection: "row",
    gap: 5,
    padding: 3,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  servicesModeButton: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: DESIGN.radius.md,
    backgroundColor: "transparent",
  },
  servicesModeButtonActive: {
    borderWidth: 1,
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.surface,
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  servicesModeText: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  servicesModeTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "rgba(255,255,255,0.78)",
    shadowColor: "#64748B",
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  dateButtonText: {
    color: DESIGN.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  datePill: {
    minWidth: 122,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "rgba(255,255,255,0.80)",
    shadowColor: "#64748B",
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  dateText: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "800",
  },
  dateSubText: {
    marginTop: 1,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statTile: {
    flex: 1,
    minHeight: 82,
    padding: 14,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  statValue: {
    color: DESIGN.colors.text,
    fontSize: 23,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  statCaption: {
    marginTop: 2,
    color: DESIGN.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.58)",
    backgroundColor: DESIGN.colors.surface,
    padding: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.022,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  panelTitle: {
    color: DESIGN.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  panelBody: {
    gap: 8,
    marginTop: 9,
  },
  servicePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 2,
  },
  choiceChip: {
    paddingHorizontal: 11,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.68)",
    backgroundColor: DESIGN.colors.surface,
  },
    choiceChipActive: {
      borderColor: "#7C3AED",
      backgroundColor: "#EEF2FF",
    },
    choiceChipRecommended: {
      borderColor: "#86EFAC",
      backgroundColor: "#ECFDF5",
    },
    choiceText: {
      color: DESIGN.colors.muted,
      fontSize: 12,
      fontWeight: "700",
    },
    choiceTextActive: {
      color: DESIGN.colors.primaryDark,
    },
    choiceTextRecommended: {
      color: "#166534",
    },
  businessCategoryPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  businessCategoryChip: {
    minHeight: 36,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: DESIGN.colors.surface,
  },
  businessCategoryChipActive: {
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  businessCategoryChipDisabled: {
    opacity: 0.56,
  },
  businessCategoryText: {
    flexShrink: 1,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  businessCategoryTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 54,
    marginTop: 6,
    padding: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.74)",
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  clientListActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceManageCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceSoft,
  },
  firstRunCard: {
    padding: 13,
    alignItems: "center",
    borderRadius: DESIGN.radius.xl,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FBFAFF",
  },
  firstRunIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  firstRunTitle: {
    marginTop: 9,
    color: DESIGN.colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  firstRunText: {
    marginTop: 6,
    color: DESIGN.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
  firstRunActions: {
    width: "100%",
    marginTop: 11,
    gap: 8,
  },
  firstRunPrimaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#7C3AED",
  },
  firstRunPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  firstRunSecondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  firstRunSecondaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  quickSuggestionRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 7,
  },
  quickSuggestionChip: {
    minHeight: 34,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: DESIGN.colors.surface,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  quickSuggestionText: {
    color: DESIGN.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  serviceManageSummary: {
    minHeight: 58,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  serviceTextBlock: {
    flex: 1,
    minWidth: 0,
  },
    serviceEditStack: {
      padding: 12,
      gap: 10,
    },
    serviceCreateForm: {
      gap: 12,
      paddingBottom: 108,
    },
    smartBlock: {
      gap: 8,
    },
    smartBlockTitle: {
      color: DESIGN.colors.text,
      fontSize: 13,
      fontWeight: "900",
    },
    smartSuggestionCard: {
      minHeight: 62,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#F8FAFC",
    },
    smartSuggestionCardSelected: {
      borderColor: "#7C3AED",
      backgroundColor: "#EEF2FF",
    },
    smartSuggestionTitle: {
      color: "#0F172A",
      fontSize: 14,
      fontWeight: "900",
    },
    smartSuggestionMeta: {
      marginTop: 3,
      color: "#64748B",
      fontSize: 12,
      fontWeight: "700",
    },
    alreadyAddedBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      overflow: "hidden",
      color: "#166534",
      fontSize: 10,
      fontWeight: "900",
      backgroundColor: "#DCFCE7",
    },
    recommendedCategoryBox: {
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#86EFAC",
      backgroundColor: "#ECFDF5",
    },
    recommendedCategoryText: {
      flex: 1,
      color: "#166534",
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
    },
    recommendedCategoryButton: {
      minHeight: 34,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      backgroundColor: "#FFFFFF",
    },
    recommendedCategoryButtonText: {
      color: "#166534",
      fontSize: 12,
      fontWeight: "900",
    },
    serviceActionRow: {
      flexDirection: "row",
      gap: 10,
    },
  iconGhostButton: {
    width: 32,
    height: 32,
    borderRadius: DESIGN.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },
  colorSwatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  colorSwatchActive: {
    borderColor: "#6D4AFF",
  },
    categoryAddRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
    },
    customCategoryToggle: {
      minHeight: 40,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "#CBD5E1",
      backgroundColor: "transparent",
    },
    customCategoryToggleText: {
      color: "#64748B",
      fontSize: 12,
      fontWeight: "900",
    },
    customCategoryPanel: {
      gap: 8,
      padding: 11,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#F8FAFC",
    },
    categoryAddButton: {
      width: 50,
      height: 50,
    marginBottom: 1,
    borderRadius: 12,
    alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#6D4AFF",
    },
    durationQuickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    durationQuickChip: {
      minWidth: 58,
      minHeight: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
    },
    durationQuickChipActive: {
      borderColor: "#7C3AED",
      backgroundColor: "#EEF2FF",
    },
    durationQuickText: {
      color: "#64748B",
      fontSize: 13,
      fontWeight: "900",
    },
    durationQuickTextActive: {
      color: "#5B21B6",
    },
    softWarningBox: {
      gap: 8,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#FDE68A",
      backgroundColor: "#FEF3C7",
    },
    formErrorNotice: {
      padding: 12,
      overflow: "hidden",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#FDE68A",
      color: "#92400E",
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900",
      backgroundColor: "#FEF3C7",
    },
    softWarningTitle: {
      color: "#92400E",
      fontSize: 13,
      fontWeight: "900",
    },
    softWarningText: {
      color: "#92400E",
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
    },
    warningActionRow: {
      flexDirection: "row",
      gap: 8,
    },
    warningInlineButton: {
      alignSelf: "flex-start",
      minHeight: 32,
      paddingHorizontal: 11,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      backgroundColor: "#FFFFFF",
    },
    warningInlineButtonText: {
      color: "#92400E",
      fontSize: 12,
      fontWeight: "900",
    },
    submitBar: {
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: "#FFFFFF",
    },
  catalogServiceCard: {
    minHeight: 66,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216, 226, 241, 0.78)",
    backgroundColor: "#F8FAFF",
  },
  catalogServiceCardActive: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  catalogAddBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
  },
  catalogAddBadgeDone: {
    backgroundColor: "#DCFCE7",
  },
  catalogStateText: {
    width: 68,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    color: "#166534",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    textAlign: "center",
    backgroundColor: "#DCFCE7",
  },
  catalogStateTextDone: {
    color: "#166534",
  },
  listItemCompact: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  listTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  listText: {
    marginTop: 2,
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  listCaption: {
    marginTop: 2,
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  moneyText: {
    color: DESIGN.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyText: {
    color: DESIGN.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    paddingVertical: 4,
  },
  compactHelperText: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
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
    gap: 6,
  },
  compactAddRow: {
    minHeight: 44,
    marginBottom: 4,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 16,
    backgroundColor: "#F7F4FF",
  },
  compactAddIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  compactAddText: {
    color: "#5B4BDB",
    fontSize: 13,
    fontWeight: "800",
  },
  screenFabMini: {
    position: "absolute",
    right: 2,
    bottom: -74,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: DESIGN.colors.primary,
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  clientFormSheetWrap: {
    width: "100%",
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
    minWidth: 30,
    textAlign: "center",
    color: "#5B21B6",
    fontSize: 12,
    fontWeight: "800",
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  staffScreen: {
    gap: 12,
  },
  staffScreenHeader: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 2,
  },
  staffScreenKicker: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  staffScreenTitle: {
    marginTop: 4,
    color: DESIGN.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  staffScreenSubtitle: {
    marginTop: 3,
    color: DESIGN.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  staffLocalNav: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.7)",
    backgroundColor: "#EEF2F7",
  },
  staffLocalNavItem: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  staffLocalNavItemActive: {
    borderWidth: 1,
    borderColor: "rgba(216, 208, 255, 0.9)",
    backgroundColor: "#FFFFFF",
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.07,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
  },
  staffLocalNavText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  staffLocalNavTextActive: {
    color: "#5B4BDB",
  },
  staffSummaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  staffSummaryTile: {
    flex: 1,
    minHeight: 74,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  staffMemberRail: {
    gap: 8,
    paddingVertical: 2,
  },
  staffMemberChip: {
    minWidth: 174,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.74)",
    backgroundColor: "#FFFFFF",
  },
  staffMemberChipActive: {
    borderColor: "rgba(115, 87, 246, 0.24)",
    backgroundColor: "#F7F4FF",
  },
  staffAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FE",
  },
  staffAvatarText: {
    color: "#6D4AFF",
    fontSize: 15,
    fontWeight: "800",
  },
  staffMemberName: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  staffMemberNameActive: {
    color: DESIGN.colors.primaryDark,
  },
  staffMemberRole: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  staffMemberCard: {
    gap: 9,
    padding: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#172033",
    shadowOpacity: 0.025,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  staffMemberCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  staffMemberCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  staffMemberStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  staffMemberStatPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: DESIGN.radius.pill,
    backgroundColor: "#F8FAFC",
  },
  staffMemberStatValue: {
    color: DESIGN.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  staffMemberStatLabel: {
    maxWidth: 118,
    color: DESIGN.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  staffToggleRow: {
    minHeight: 48,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#F8FAFF",
  },
  staffSelectorCard: {
    gap: 10,
    padding: 13,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#172033",
    shadowOpacity: 0.035,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  staffSelectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  staffWeekHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  staffWeekCard: {
    gap: 9,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    shadowColor: "#172033",
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  staffCalendarControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  staffWeekPickerButton: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(216, 226, 241, 0.82)",
    backgroundColor: "#FBFCFF",
  },
  staffWeekPickerText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  staffCalendarBox: {
    gap: 10,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "#F8FAFF",
  },
  staffCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  staffCalendarDay: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
  },
  staffCalendarDayMuted: {
    opacity: 0.35,
  },
  staffCalendarDayActive: {
    backgroundColor: "#7357F6",
  },
  staffCalendarDayWork: {
    backgroundColor: "#DCFCE7",
  },
  staffFlexibleCalendarDay: {
    width: 38,
    height: 58,
    paddingHorizontal: 2,
    paddingVertical: 5,
    justifyContent: "flex-start",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "#F8FAFC",
  },
  staffCalendarDayText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  staffCalendarDayCaption: {
    maxWidth: "100%",
    color: "#64748B",
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  staffCalendarDayTextActive: {
    color: "#FFFFFF",
  },
  staffMonthPlanner: {
    gap: 10,
    padding: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.72)",
    backgroundColor: "#F8FAFF",
  },
  staffSelectedDaysStack: {
    gap: 10,
  },
  staffSelectedDayCard: {
    gap: 8,
    padding: 11,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#FFFFFF",
  },
  staffDayCard: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.78)",
  },
  staffDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  staffDayTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  staffTimeGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  staffIntervalsBox: {
    marginTop: 10,
    gap: 8,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.74)",
    backgroundColor: "#F8FAFC",
  },
  staffIntervalsStack: {
    gap: 10,
  },
  staffIntervalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  staffIntervalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 1,
  },
  staffIntervalIconButton: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  staffTimeField: {
    flex: 1,
    minWidth: 92,
    gap: 5,
  },
  staffTimeLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },
  staffTimeInput: {
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 226, 241, 0.82)",
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: "#FFFFFF",
  },
  staffScheduleModeRow: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.7)",
    backgroundColor: "#EEF2F7",
  },
  staffScheduleModeButton: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  staffScheduleModeButtonActive: {
    borderWidth: 1,
    borderColor: "rgba(216, 208, 255, 0.9)",
    backgroundColor: "#FFFFFF",
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.07,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
  },
  staffScheduleModeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  staffScheduleModeTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  settingsHero: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  settingsEyebrow: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  settingsHeroTitle: {
    marginTop: 5,
    color: "#0F172A",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
  },
  settingsHeroText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsSectionRail: {
    gap: 4,
    padding: 4,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: "#EEF2F7",
  },
  settingsSectionChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  settingsSectionChipActive: {
    borderColor: "rgba(216, 208, 255, 0.9)",
    backgroundColor: "#FFFFFF",
    shadowColor: DESIGN.colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  settingsSectionText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  settingsSectionTitleRow: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsSectionTextActive: {
    color: DESIGN.colors.primaryDark,
  },
  settingsStatusText: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    overflow: "hidden",
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
    backgroundColor: "#DCFCE7",
  },
  settingsMutedNotice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    overflow: "hidden",
    color: "#92400E",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    backgroundColor: "#FFF7D6",
  },
  bookingLimitCard: {
    gap: 9,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFF",
  },
  bookingLimitCardWarning: {
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
  },
  bookingLimitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  bookingLimitTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  bookingLimitValue: {
    color: DESIGN.colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  bookingLimitTrack: {
    height: 9,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  bookingLimitTrackFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: DESIGN.colors.primary,
  },
  bookingLimitMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bookingLimitMetricText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
  },
  bookingLimitHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  settingsAvatarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#FBFCFF",
  },
  settingsAvatarButton: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  settingsAvatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
  },
  settingsAvatarText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },
  settingsAvatarImage: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  settingsAvatarCameraBadge: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#6D4AFF",
  },
  settingsAvatarInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingsAvatarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  settingsAvatarDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF7F7",
  },
  settingsCardTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  premiumMobileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  premiumMobileHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  premiumMobileDetail: {
    marginTop: 6,
    color: DESIGN.colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  premiumBenefitList: {
    gap: 6,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  premiumBenefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  premiumBenefitText: {
    flex: 1,
    minWidth: 0,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  premiumMobileBadge: {
    maxWidth: 104,
    flexShrink: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: DESIGN.radius.pill,
    backgroundColor: "#F1F5F9",
  },
  premiumMobileBadgeActive: {
    backgroundColor: "#ECFDF5",
  },
  premiumMobileBadgeText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  premiumMobileBadgeTextActive: {
    color: "#047857",
  },
  premiumMobilePlans: {
    flexDirection: "row",
    gap: 8,
  },
  premiumMobilePlan: {
    flex: 1,
    minHeight: 72,
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.82)",
    backgroundColor: "#FBFCFF",
  },
  premiumMobilePlanReady: {
    borderColor: "#D8D0FF",
  },
  premiumMobilePlanFeatured: {
    backgroundColor: DESIGN.colors.primarySoft,
  },
  premiumMobilePlanTitle: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
  },
  premiumMobilePlanPrice: {
    marginTop: 4,
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
  },
  premiumMobilePlanAction: {
    marginTop: 5,
    color: DESIGN.colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
  premiumLegalText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  premiumLegalLink: {
    color: "#2563EB",
    fontWeight: "800",
  },
  premiumGate: {
    gap: 13,
  },
  premiumGateHero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  premiumGateIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F4F0FF",
  },
  premiumGateCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  premiumGateTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 7,
  },
  premiumGateTitle: {
    flex: 1,
    minWidth: 160,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  premiumGateText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  premiumGateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: DESIGN.radius.pill,
    backgroundColor: "#EEF2FF",
  },
  premiumGateBadgeText: {
    color: DESIGN.colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
  premiumGateBenefits: {
    gap: 7,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "#FBFCFF",
  },
  premiumGateBenefitsTitle: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },
  premiumGateBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumGateBenefitText: {
    flex: 1,
    minWidth: 0,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  premiumGateNudge: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  settingsChoiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  settingsChoice: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(216, 226, 239, 0.78)",
    backgroundColor: "#FBFCFF",
  },
  settingsChoiceActive: {
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  settingsChoiceText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  settingsChoiceTextActive: {
    color: "#4F46E5",
  },
  settingsStackedChoices: {
    gap: 8,
  },
  settingsLongChoice: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(216, 226, 239, 0.78)",
    backgroundColor: "#FBFCFF",
  },
  settingsOptionBlock: {
    gap: 8,
  },
  settingsOptionRail: {
    gap: 8,
    paddingRight: 8,
  },
  settingsActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  settingsSummaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  settingsSummaryTile: {
    flex: 1,
    minHeight: 58,
    padding: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#F8FAFF",
  },
  settingsMiniRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.82)",
  },
  settingsMiniInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingsMiniTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsMiniPrice: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  joinRequestCard: {
    minHeight: 62,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#FBFCFF",
  },
  joinRequestActions: {
    flexDirection: "row",
    gap: 8,
  },
  staffInviteCard: {
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#FBFCFF",
  },
  staffInviteInfo: {
    minWidth: 0,
  },
  staffInviteCompany: {
    color: "#0F172A",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    flexShrink: 1,
  },
  staffInviteActions: {
    flexDirection: "row",
    gap: 10,
  },
  staffInviteButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  staffInviteAcceptButton: {
    backgroundColor: "#6D4AFF",
  },
  staffInviteDeclineButton: {
    borderWidth: 1,
    borderColor: "rgba(252, 165, 165, 0.8)",
    backgroundColor: "#FFF1F2",
  },
  staffInviteAcceptText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  staffInviteDeclineText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "900",
  },
  staffMembershipCard: {
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.18)",
    backgroundColor: "#F8FAFF",
  },
  staffMembershipEyebrow: {
    color: "#6D4AFF",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  staffMembershipTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  staffMembershipBusinessName: {
    color: "#4C1D95",
  },
  staffMembershipDetails: {
    gap: 10,
  },
  staffMembershipDetailItem: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "#FFFFFF",
  },
  joinApproveButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  joinRejectButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  settingsToggleRow: {
    minHeight: 48,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "#F8FAFF",
  },
  settingsToggleText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  addressSuggestionCard: {
    minHeight: 62,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(216, 208, 255, 0.82)",
    backgroundColor: "#FBFAFF",
  },
  addressSuggestionAction: {
    color: "#5B4BDB",
    fontSize: 12,
    fontWeight: "900",
  },
  settingsMultilineInput: {
    minHeight: 104,
    height: 104,
    paddingTop: 12,
    paddingBottom: 12,
  },
  settingsPhotosBox: {
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  settingsPhotoRail: {
    gap: 10,
    paddingRight: 8,
  },
  settingsPhotoCard: {
    width: 160,
    gap: 8,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  settingsPhoto: {
    width: "100%",
    height: 110,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  settingsPhotoActions: {
    gap: 8,
  },
  settingsPhotoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    color: "#5B4BDB",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#EEF2FF",
  },
  settingsPhotoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  businessPhotoUploadCard: {
    minHeight: 158,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(196, 181, 253, 0.72)",
    backgroundColor: "#FBFAFF",
    shadowColor: "#6D4AFF",
    shadowOpacity: 0.055,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  businessPhotoUploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EEFF",
  },
  businessPhotoUploadTitle: {
    marginTop: 4,
    color: "#111827",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  businessPhotoUploadSubtitle: {
    maxWidth: 260,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  businessPhotoDropHint: {
    color: "#8B7CF6",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  businessPhotoExampleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  businessPhotoExamplePill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E0FF",
  },
  businessPhotoStatusRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
  },
  businessPhotoStatusText: {
    flex: 1,
    color: "#5B4BDB",
    fontSize: 12,
    fontWeight: "900",
  },
  businessPhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  businessPhotoTile: {
    width: "48%",
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    shadowColor: "#142033",
    shadowOpacity: 0.055,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  businessPhotoGridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E2E8F0",
  },
  businessPhotoPrimaryBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    maxWidth: "82%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(109, 74, 255, 0.92)",
  },
  businessPhotoPrimaryText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  businessPhotoTileAction: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  businessPhotoAddTile: {
    width: "48%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(196, 181, 253, 0.82)",
    borderStyle: "dashed",
    backgroundColor: "#FBFAFF",
  },
  businessPhotoAddText: {
    maxWidth: 112,
    color: "#5B4BDB",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  mediaActionSheet: {
    gap: 10,
    marginTop: "auto",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#142033",
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
  },
  mediaSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  mediaSheetTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },
  mediaSheetClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#E5EAF3",
  },
  mediaActionRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#F8FAFF",
  },
  mediaActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EEFF",
  },
  mediaActionText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },
  mediaSheetHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  mediaPhotoPreview: {
    width: "100%",
    height: 190,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  mediaDangerActionRow: {
    backgroundColor: "#FFF1F2",
  },
  mediaDangerActionIcon: {
    backgroundColor: "#FFE4E6",
  },
  mediaDangerActionText: {
    color: "#E11D48",
    fontSize: 15,
    fontWeight: "900",
  },
  mediaCancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  mediaCancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
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
  telegramDotDisconnected: {
    backgroundColor: "#CBD5E1",
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

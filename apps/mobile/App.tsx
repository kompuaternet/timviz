import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
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
type CalendarViewMode = "day" | "threeDays" | "week" | "month";
type LocalizedText = Partial<Record<AppLanguage, string>>;

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

type PendingServiceSave = {
  key: string;
  optimisticService: ServiceRecord;
  payload: {
    name: string;
    category: string;
    durationMinutes: number;
    price: number;
    color: string;
    source: "catalog" | "custom";
  };
  attempts: number;
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
    paddlePriceId?: string;
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

type MobileNotificationsPayload = {
  pendingOnlineBookings?: MobileNotificationRecord[];
  archivedOnlineBookings?: MobileNotificationRecord[];
  pendingJoinRequests?: Array<{
    id: string;
    createdAt: string;
    role: string;
    professionalName: string;
  }>;
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
  categoriesText: string;
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

const STORAGE_KEY = "timviz_mobile_session_v2";
const SECURE_SESSION_KEY = "timviz_mobile_secure_session_v1";
const BIOMETRIC_ENABLED_KEY = "timviz_mobile_biometric_enabled_v1";
const PUSH_AUTO_REGISTER_KEY_PREFIX = "timviz_mobile_push_auto_register_v1:";
const PUSH_PROJECT_ID_ERROR = "push_project_id_missing";
const WORKSPACE_CACHE_KEY = "timviz_mobile_workspace_cache_v2";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");
const WORDMARK = require("./assets/timviz-wordmark.png");
const DEFAULT_SERVICE_CATEGORY = "Без категории";
const SERVICE_COLORS = ["#9AD86A", "#8ED1F2", "#FF9A84", "#F7C948", "#A78BFA", "#34D399", "#F472B6", "#60A5FA"];
const APP_ICON = require("./assets/timviz-icon.png");
const SETTINGS_SECTIONS: MobileSettingsSection[] = ["general", "online", "services", "schedule", "push", "telegram", "address"];
const PREMIUM_LOCKED_TABS: AppTab[] = ["clients", "staff"];
const PREMIUM_LOCKED_SETTINGS_SECTIONS: MobileSettingsSection[] = ["online", "schedule", "push", "telegram", "address"];
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
const CALENDAR_TIME_AXIS_WIDTH = 28;
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
    loginError: "Помилка входу",
    registerError: "Помилка реєстрації",
    passwordHint: "Мінімум 6 символів",
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
    teamMembers: "Учасники команди",
    teamMembersHint: "Додавайте співробітників, редагуйте контакти, роль і доступ до кабінету.",
    allTeam: "Вся команда",
    showWholeTeam: "Показати всю команду",
    selectedMasters: "Вибрані майстри",
    addMember: "Додати співробітника",
    editMember: "Редагувати співробітника",
    saveMember: "Зберегти співробітника",
    fullName: "Ім'я та прізвище",
    role: "Роль",
    workspaceAccess: "Доступ",
    invite: "Запросити",
    resendInvite: "Надіслати ще раз",
    revokeInvite: "Скасувати запрошення",
    sendInvite: "Надіслати запрошення на email",
    pendingInvites: "Очікують запрошення",
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
    workIntervals: "Робочий час",
    addWorkTime: "Додати час",
    removeWorkTime: "Видалити час",
    monthPlanner: "Робочі дні місяця",
    selectedDays: "Обрано днів",
    applyToSelectedDays: "Застосувати до обраних",
    selectedDaysHint: "Оберіть дні на місяць і задайте їм однакові робочі інтервали.",
    noRoomForInterval: "Немає місця для ще одного інтервалу.",
    invalidIntervalRange: "Кінець має бути пізніше початку.",
    overlappingIntervals: "Інтервали не мають перетинатися.",
    addBreak: "Додати перерву",
    removeBreak: "Прибрати перерву",
    onThisWeek: "На цьому тижні",
    saveSchedule: "Зберегти графік",
    workFrom: "З",
    workTo: "До",
    breakFrom: "Перерва з",
    breakTo: "Перерва до",
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
    supportGuideText: "Опишіть, що ви робите, на якій сторінці виникло питання і що має вийти.",
    supportGreeting: "Вітаю! Напишіть питання щодо сайту, записів, налаштувань або оплати. Ми допоможемо розібратися.",
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
    myProfile: "Мій профіль",
    personalSettings: "Особисті налаштування",
    helpSupport: "Допомога і підтримка",
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
    editService: "Редагувати послугу",
    saveService: "Зберегти послугу",
    addFromCatalog: "Додати",
    alreadyAdded: "Додано",
    catalogHint: "Оберіть готову послугу.",
    myServicesHint: "Редагуйте ціну, тривалість і доступність.",
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
    settingsSaved: "Зміни збережено",
    settingsSaveError: "Не вдалося зберегти налаштування.",
    premiumSubscription: "Premium-підписка",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium активний",
    premiumSubscriptionTrial: "Пробний період",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Нові акаунти отримують 14 днів Premium безкоштовно. Після пробного періоду Pro відкриває платні інструменти без обмежень.",
    premiumTrialIncluded: "14 днів Premium безкоштовно",
    premiumTrialDaysLeft: "Залишилось {count} дн. Premium",
    premiumTrialOneDayLeft: "Останній день Premium",
    premiumTrialExpired: "Пробний Premium завершився",
    premiumUpgradeCta: "Оформити Pro",
    premiumLockedBadge: "Pro",
    premiumFeatureBenefitsTitle: "У Pro відкривається",
    premiumBenefitOnlineBooking: "онлайн-запис і публічна сторінка",
    premiumBenefitReminders: "push і Telegram-нагадування",
    premiumBenefitTeam: "команда, графіки і ролі",
    premiumBenefitClients: "клієнтська база без ручних обхідних шляхів",
    premiumYearlyNudge: "Річний тариф вигідніший, якщо ви плануєте працювати в Timviz постійно.",
    premiumFeatureClientsTitle: "Клієнтська база доступна в Pro",
    premiumFeatureClientsText: "Зберігайте клієнтів, швидко створюйте повторні записи і ведіть історію після пробного періоду.",
    premiumFeatureStaffTitle: "Команда і графіки доступні в Pro",
    premiumFeatureStaffText: "Додавайте співробітників, керуйте змінами і доступами без змішування всіх записів в одному календарі.",
    premiumFeatureOnlineTitle: "Онлайн-запис доступний в Pro",
    premiumFeatureOnlineText: "Після пробного періоду клієнтське посилання і самостійний запис працюють на тарифі Pro.",
    premiumFeatureScheduleTitle: "Розширений графік доступний в Pro",
    premiumFeatureScheduleText: "Налаштовуйте зміни, вихідні, перерви і командні графіки без обмежень.",
    premiumFeaturePushTitle: "Push-нагадування доступні в Pro",
    premiumFeaturePushText: "Підключайте повідомлення про нові, перенесені і скасовані записи.",
    premiumFeatureTelegramTitle: "Telegram-сповіщення доступні в Pro",
    premiumFeatureTelegramText: "Отримуйте записи і нагадування в Telegram після оформлення Pro.",
    premiumFeatureAddressTitle: "Адреса і карта доступні в Pro",
    premiumFeatureAddressText: "Покажіть клієнтам точну адресу, деталі входу і карту на сторінці запису.",
    premiumMonthly: "Premium Monthly",
    premiumYearly: "Premium Yearly",
    premiumMonthlyFallback: "$3 / місяць",
    premiumYearlyFallback: "$29 / рік",
    premiumStartMonthly: "Підключити на місяць",
    premiumStartYearly: "Підключити на рік",
    premiumRestore: "Відновити покупку",
    premiumManage: "Керувати підпискою можна в App Store.",
    premiumReady: "Premium оновлено.",
    premiumUnavailable: "Покупки доступні у TestFlight або App Store збірці.",
    premiumMissingConfig: "Потрібно налаштувати RevenueCat і продукти App Store.",
    premiumPurchaseCancelled: "Покупку скасовано.",
    premiumSyncFailed: "Не вдалося синхронізувати підписку.",
    settingsGeneral: "Основне",
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
    categoriesHint: "через кому",
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
    pushHint: "Нові записи та зміни прямо на iPhone.",
    pushEnable: "Увімкнути сповіщення",
    pushEnabled: "Сповіщення увімкнено",
    pushDisabled: "Сповіщення вимкнено",
    pushPermissionDenied: "Дозвольте сповіщення в налаштуваннях iPhone.",
    pushSaved: "Сповіщення оновлено",
    pushSaveFailed: "Не вдалося оновити сповіщення.",
    pushOpenSettings: "Відкрити налаштування iPhone",
    pushDeviceCount: "Пристроїв",
    pushProjectMissing: "Не налаштовано Expo projectId для push-сповіщень. Додайте EXPO_PUBLIC_EAS_PROJECT_ID у конфігурацію застосунку.",
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
    calendarNoServicesText: "Додайте першу послугу, щоб почати приймати клієнтів.",
    calendarEmptyActionText: "Додайте перший візит або налаштуйте послуги для онлайн-запису.",
    createBooking: "Створити запис",
    createAppointmentButton: "+ Створити запис",
    firstRunCalendarTitle: "Почніть з послуги",
    firstRunCalendarText: "Додайте послугу, щоб швидше створювати записи й відкрити онлайн-запис.",
    addFirstVisit: "Додати перший візит",
    quickVisit: "Швидкий запис",
    createVisitWithoutService: "Створити запис без послуги",
    onboardingStartTitle: "Щоб почати роботу 👋",
    onboardingStartText: "У вас поки немає послуг.\n\nДодайте першу послугу, щоб почати приймати записи клієнтів.",
    firstAppointmentCreated: "🎉 Ваш перший запис створено",
    addServiceFirstTitle: "Спочатку додайте послугу",
    addServiceFirstText: "У вас поки немає послуг. Додайте першу послугу або створіть швидкий запис без послуги.",
    servicesEmptyPickerTitle: "Послуг поки немає",
    servicesEmptyPickerText: "Додайте першу послугу або створіть запис без послуги.",
    createServiceAction: "Створити послугу",
    bookingWithoutService: "Запис без послуги",
    firstServiceTitle: "Додайте першу послугу",
    firstServiceText: "Послуги потрібні, щоб створювати записи й відкрити онлайн-запис для клієнтів.",
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
    loginError: "Ошибка входа",
    registerError: "Ошибка регистрации",
    passwordHint: "Минимум 6 символов",
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
    teamMembers: "Участники команды",
    teamMembersHint: "Добавляйте сотрудников, редактируйте контакты, роль и доступ к кабинету.",
    allTeam: "Вся команда",
    showWholeTeam: "Показать всю команду",
    selectedMasters: "Выбранные мастера",
    addMember: "Добавить сотрудника",
    editMember: "Редактировать сотрудника",
    saveMember: "Сохранить сотрудника",
    fullName: "Имя и фамилия",
    role: "Роль",
    workspaceAccess: "Доступ",
    invite: "Пригласить",
    resendInvite: "Отправить еще раз",
    revokeInvite: "Отозвать приглашение",
    sendInvite: "Отправить приглашение на email",
    pendingInvites: "Ожидают приглашение",
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
    workIntervals: "Рабочее время",
    addWorkTime: "Добавить время",
    removeWorkTime: "Удалить время",
    monthPlanner: "Рабочие дни месяца",
    selectedDays: "Выбрано дней",
    applyToSelectedDays: "Применить к выбранным",
    selectedDaysHint: "Выберите дни на месяц и задайте им одинаковые рабочие интервалы.",
    noRoomForInterval: "Нет места для еще одного интервала.",
    invalidIntervalRange: "Конец должен быть позже начала.",
    overlappingIntervals: "Интервалы не должны пересекаться.",
    addBreak: "Добавить перерыв",
    removeBreak: "Убрать перерыв",
    onThisWeek: "На этой неделе",
    saveSchedule: "Сохранить график",
    workFrom: "С",
    workTo: "До",
    breakFrom: "Перерыв с",
    breakTo: "Перерыв до",
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
    supportGuideText: "Опишите, что вы делаете, на какой странице возник вопрос и что должно выйти.",
    supportGreeting: "Привет! Напишите вопрос по сайту, записям, настройкам или оплате. Мы поможем разобраться.",
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
    myProfile: "Мой профиль",
    personalSettings: "Личные настройки",
    helpSupport: "Помощь и поддержка",
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
    editService: "Редактировать услугу",
    saveService: "Сохранить услугу",
    addFromCatalog: "Добавить",
    alreadyAdded: "Добавлено",
    catalogHint: "Выберите готовую услугу.",
    myServicesHint: "Редактируйте цену, длительность и доступность.",
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
    settingsSaved: "Изменения сохранены",
    settingsSaveError: "Не удалось сохранить настройки.",
    premiumSubscription: "Premium-подписка",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium активен",
    premiumSubscriptionTrial: "Пробный период",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "Новые аккаунты получают 14 дней Premium бесплатно. После пробного периода Pro открывает платные инструменты без ограничений.",
    premiumTrialIncluded: "14 дней Premium бесплатно",
    premiumTrialDaysLeft: "Осталось {count} дн. Premium",
    premiumTrialOneDayLeft: "Последний день Premium",
    premiumTrialExpired: "Пробный Premium закончился",
    premiumUpgradeCta: "Оформить Pro",
    premiumLockedBadge: "Pro",
    premiumFeatureBenefitsTitle: "В Pro открывается",
    premiumBenefitOnlineBooking: "онлайн-запись и публичная страница",
    premiumBenefitReminders: "push и Telegram-напоминания",
    premiumBenefitTeam: "команда, графики и роли",
    premiumBenefitClients: "клиентская база без ручных обходов",
    premiumYearlyNudge: "Годовой тариф выгоднее, если вы планируете работать в Timviz постоянно.",
    premiumFeatureClientsTitle: "Клиентская база доступна в Pro",
    premiumFeatureClientsText: "Сохраняйте клиентов, быстро создавайте повторные записи и ведите историю после пробного периода.",
    premiumFeatureStaffTitle: "Команда и графики доступны в Pro",
    premiumFeatureStaffText: "Добавляйте сотрудников, управляйте сменами и доступами без смешивания всех записей в одном календаре.",
    premiumFeatureOnlineTitle: "Онлайн-запись доступна в Pro",
    premiumFeatureOnlineText: "После пробного периода клиентская ссылка и самостоятельная запись работают на тарифе Pro.",
    premiumFeatureScheduleTitle: "Расширенный график доступен в Pro",
    premiumFeatureScheduleText: "Настраивайте смены, выходные, перерывы и командные графики без ограничений.",
    premiumFeaturePushTitle: "Push-напоминания доступны в Pro",
    premiumFeaturePushText: "Подключайте уведомления о новых, перенесенных и отмененных записях.",
    premiumFeatureTelegramTitle: "Telegram-уведомления доступны в Pro",
    premiumFeatureTelegramText: "Получайте записи и напоминания в Telegram после оформления Pro.",
    premiumFeatureAddressTitle: "Адрес и карта доступны в Pro",
    premiumFeatureAddressText: "Покажите клиентам точный адрес, детали входа и карту на странице записи.",
    premiumMonthly: "Premium Monthly",
    premiumYearly: "Premium Yearly",
    premiumMonthlyFallback: "$3 / месяц",
    premiumYearlyFallback: "$29 / год",
    premiumStartMonthly: "Подключить на месяц",
    premiumStartYearly: "Подключить на год",
    premiumRestore: "Восстановить покупку",
    premiumManage: "Управлять подпиской можно в App Store.",
    premiumReady: "Premium обновлен.",
    premiumUnavailable: "Покупки доступны в TestFlight или App Store сборке.",
    premiumMissingConfig: "Нужно настроить RevenueCat и продукты App Store.",
    premiumPurchaseCancelled: "Покупка отменена.",
    premiumSyncFailed: "Не удалось синхронизировать подписку.",
    settingsGeneral: "Основное",
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
    categoriesHint: "через запятую",
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
    pushHint: "Новые записи и изменения прямо на iPhone.",
    pushEnable: "Включить уведомления",
    pushEnabled: "Уведомления включены",
    pushDisabled: "Уведомления выключены",
    pushPermissionDenied: "Разрешите уведомления в настройках iPhone.",
    pushSaved: "Уведомления обновлены",
    pushSaveFailed: "Не удалось обновить уведомления.",
    pushOpenSettings: "Открыть настройки iPhone",
    pushDeviceCount: "Устройств",
    pushProjectMissing: "Не настроен Expo projectId для push-уведомлений. Добавьте EXPO_PUBLIC_EAS_PROJECT_ID в конфигурацию приложения.",
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
    calendarNoServicesText: "Добавьте первую услугу, чтобы начать принимать клиентов.",
    calendarEmptyActionText: "Добавьте первый визит или настройте услуги для онлайн-записи.",
    createBooking: "Создать запись",
    createAppointmentButton: "+ Создать запись",
    firstRunCalendarTitle: "Начните с услуги",
    firstRunCalendarText: "Добавьте услугу, чтобы создавать записи быстрее и открыть онлайн-запись.",
    addFirstVisit: "Добавить первый визит",
    quickVisit: "Быстрая запись",
    createVisitWithoutService: "Создать запись без услуги",
    onboardingStartTitle: "Чтобы начать работу 👋",
    onboardingStartText: "У вас пока нет услуг.\n\nДобавьте первую услугу, чтобы начать принимать записи клиентов.",
    firstAppointmentCreated: "🎉 Ваша первая запись создана",
    addServiceFirstTitle: "Сначала добавьте услугу",
    addServiceFirstText: "У вас пока нет услуг. Добавьте первую услугу или создайте быструю запись без услуги.",
    servicesEmptyPickerTitle: "Услуг пока нет",
    servicesEmptyPickerText: "Добавьте первую услугу или создайте запись без услуги.",
    createServiceAction: "Создать услугу",
    bookingWithoutService: "Запись без услуги",
    firstServiceTitle: "Добавьте первую услугу",
    firstServiceText: "Услуги нужны, чтобы создавать записи и открыть онлайн-запись для клиентов.",
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
    loginError: "Sign-in error",
    registerError: "Registration error",
    passwordHint: "At least 6 characters",
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
    teamMembers: "Team members",
    teamMembersHint: "Add employees, edit contacts, role, and workspace access.",
    allTeam: "Whole team",
    showWholeTeam: "Show the full team",
    selectedMasters: "Selected masters",
    addMember: "Add employee",
    editMember: "Edit employee",
    saveMember: "Save employee",
    fullName: "Full name",
    role: "Role",
    workspaceAccess: "Access",
    invite: "Invite",
    resendInvite: "Resend invite",
    revokeInvite: "Revoke invite",
    sendInvite: "Send email invite",
    pendingInvites: "Pending invites",
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
    workIntervals: "Work time",
    addWorkTime: "Add time",
    removeWorkTime: "Remove time",
    monthPlanner: "Month work days",
    selectedDays: "Selected days",
    applyToSelectedDays: "Apply to selected",
    selectedDaysHint: "Select month days and apply the same working intervals to them.",
    noRoomForInterval: "No room for another interval.",
    invalidIntervalRange: "End must be later than start.",
    overlappingIntervals: "Intervals cannot overlap.",
    addBreak: "Add break",
    removeBreak: "Remove break",
    onThisWeek: "This week",
    saveSchedule: "Save schedule",
    workFrom: "From",
    workTo: "To",
    breakFrom: "Break from",
    breakTo: "Break to",
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
    supportGreeting: "Hi! Ask us about the site, bookings, settings, or payments. We will help.",
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
    myProfile: "My profile",
    personalSettings: "Personal settings",
    helpSupport: "Help and support",
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
    editService: "Edit service",
    saveService: "Save service",
    addFromCatalog: "Add",
    alreadyAdded: "Added",
    catalogHint: "Choose a ready-made service.",
    myServicesHint: "Edit price, duration, and availability.",
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
    settingsSaved: "Changes saved",
    settingsSaveError: "Could not save settings.",
    premiumSubscription: "Premium subscription",
    premiumSubscriptionTitle: "Timviz Premium",
    premiumSubscriptionActive: "Premium active",
    premiumSubscriptionTrial: "Trial period",
    premiumSubscriptionFree: "Free",
    premiumSubscriptionText: "New accounts get 14 days of Premium for free. After the trial, Pro keeps paid tools open without limits.",
    premiumTrialIncluded: "14 days of Premium free",
    premiumTrialDaysLeft: "{count} days of Premium left",
    premiumTrialOneDayLeft: "Last day of Premium",
    premiumTrialExpired: "Premium trial ended",
    premiumUpgradeCta: "Get Pro",
    premiumLockedBadge: "Pro",
    premiumFeatureBenefitsTitle: "Pro unlocks",
    premiumBenefitOnlineBooking: "online booking and a public page",
    premiumBenefitReminders: "push and Telegram reminders",
    premiumBenefitTeam: "team members, schedules, and roles",
    premiumBenefitClients: "a client base without manual workarounds",
    premiumYearlyNudge: "The yearly plan is better value when you plan to run Timviz continuously.",
    premiumFeatureClientsTitle: "Client base is available in Pro",
    premiumFeatureClientsText: "Save clients, create repeat bookings faster, and keep history after the trial.",
    premiumFeatureStaffTitle: "Team and schedules are available in Pro",
    premiumFeatureStaffText: "Add employees, manage shifts, and control access without mixing all bookings in one calendar.",
    premiumFeatureOnlineTitle: "Online booking is available in Pro",
    premiumFeatureOnlineText: "After the trial, client booking links and self-service booking stay active on Pro.",
    premiumFeatureScheduleTitle: "Advanced schedule is available in Pro",
    premiumFeatureScheduleText: "Set shifts, days off, breaks, and team schedules without limits.",
    premiumFeaturePushTitle: "Push reminders are available in Pro",
    premiumFeaturePushText: "Enable notifications for new, rescheduled, and cancelled bookings.",
    premiumFeatureTelegramTitle: "Telegram notifications are available in Pro",
    premiumFeatureTelegramText: "Receive bookings and reminders in Telegram after upgrading to Pro.",
    premiumFeatureAddressTitle: "Address and map are available in Pro",
    premiumFeatureAddressText: "Show clients the exact address, entrance details, and map on the booking page.",
    premiumMonthly: "Premium Monthly",
    premiumYearly: "Premium Yearly",
    premiumMonthlyFallback: "$3 / month",
    premiumYearlyFallback: "$29 / year",
    premiumStartMonthly: "Start monthly",
    premiumStartYearly: "Start yearly",
    premiumRestore: "Restore purchase",
    premiumManage: "Manage the subscription in the App Store.",
    premiumReady: "Premium updated.",
    premiumUnavailable: "Purchases are available in TestFlight or App Store builds.",
    premiumMissingConfig: "RevenueCat and App Store products need to be configured.",
    premiumPurchaseCancelled: "Purchase cancelled.",
    premiumSyncFailed: "Could not sync subscription.",
    settingsGeneral: "General",
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
    categoriesHint: "comma separated",
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
    pushHint: "New bookings and changes on your iPhone.",
    pushEnable: "Enable notifications",
    pushEnabled: "Notifications enabled",
    pushDisabled: "Notifications disabled",
    pushPermissionDenied: "Allow notifications in iPhone settings.",
    pushSaved: "Notifications updated",
    pushSaveFailed: "Could not update notifications.",
    pushOpenSettings: "Open iPhone settings",
    pushDeviceCount: "Devices",
    pushProjectMissing: "Expo projectId is not configured for push notifications. Add EXPO_PUBLIC_EAS_PROJECT_ID to the app configuration.",
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
    calendarNoServicesText: "Add your first service to start accepting clients.",
    calendarEmptyActionText: "Add your first visit or set up services for online booking.",
    createBooking: "Create booking",
    createAppointmentButton: "+ Create appointment",
    firstRunCalendarTitle: "Start with a service",
    firstRunCalendarText: "Add a service to create bookings faster and open online booking.",
    addFirstVisit: "Add first visit",
    quickVisit: "Quick booking",
    createVisitWithoutService: "Create booking without service",
    onboardingStartTitle: "To get started 👋",
    onboardingStartText: "You do not have services yet.\n\nAdd your first service to start accepting client appointments.",
    firstAppointmentCreated: "🎉 First appointment created",
    addServiceFirstTitle: "Add a service first",
    addServiceFirstText: "You do not have services yet. Add your first service or create a quick booking without a service.",
    servicesEmptyPickerTitle: "No services yet",
    servicesEmptyPickerText: "Add your first service or create a booking without a service.",
    createServiceAction: "Create service",
    bookingWithoutService: "Booking without service",
    firstServiceTitle: "Add your first service",
    firstServiceText: "Services help you create bookings and open online booking for clients.",
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
    teamMembers: "Membres de l'équipe",
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
    removeWorkTime: "Supprimer l'heure",
    monthPlanner: "Mois jours de travail",
    selectedDays: "Jours sélectionnés",
    applyToSelectedDays: "Appliquer à la sélection",
    selectedDaysHint: "Sélectionnez les jours du mois et appliquez-leur les mêmes intervalles de travail.",
    noRoomForInterval: "Pas de place pour un autre intervalle.",
    invalidIntervalRange: "La fin doit être postérieure au début.",
    overlappingIntervals: "Les intervalles ne peuvent pas se chevaucher.",
    addBreak: "Ajouter une pause",
    removeBreak: "Supprimer la pause",
    onThisWeek: "Cette semaine",
    saveSchedule: "Enregistrer le programme",
    workFrom: "De",
    workTo: "À",
    breakFrom: "Pause de",
    breakTo: "Pause à",
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
    supportGreeting: "Salut ! Renseignez-vous sur le site, les réservations, les paramètres ou les paiements. Nous allons vous aider.",
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
    myProfile: "Mon profil",
    personalSettings: "Paramètres personnels",
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
    connected: "Connecté",
    notConnected: "Non connecté",
    telegramHint: "La connexion Telegram est gérée dans les paramètres de l'espace de travail. L'application affiche l'état actuel.",
    onlineBooking: "Réservation en ligne",
    address: "Adresse",
    publicPage: "Page de réservation",
    settingsSaved: "Modifications enregistrées",
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
    premiumManage: "Gérer l'abonnement dans l'App Store.",
    premiumReady: "Premium mis à jour.",
    premiumUnavailable: "Les achats sont disponibles dans TestFlight ou dans la version App Store.",
    premiumMissingConfig: "RevenueCat et les produits App Store doivent être configurés.",
    premiumPurchaseCancelled: "Achat annulé.",
    premiumSyncFailed: "Impossible de synchroniser l'abonnement.",
    settingsGeneral: "Général",
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
    categoriesHint: "virgules séparées",
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
    calendarNoServicesText: "Ajoutez votre premier service pour commencer à accepter des clients.",
    calendarEmptyActionText: "Ajoutez votre première visite ou configurez des services de réservation en ligne.",
    createBooking: "Créer une réservation",
    createAppointmentButton: "+ Créer un rendez-vous",
    firstRunCalendarTitle: "Démarrer avec un service",
    firstRunCalendarText: "Ajouter un service pour créer des réservations plus rapidement et ouvrir une réservation en ligne.",
    addFirstVisit: "Ajouter une première visite",
    quickVisit: "Réservation rapide",
    createVisitWithoutService: "Créer une réservation sans service",
    onboardingStartTitle: "Pour commencer 👋",
    onboardingStartText: "Vous n'avez pas encore de services.\n\nAjoutez votre premier service pour commencer à accepter des rendez-vous clients.",
    firstAppointmentCreated: "🎉 Premier rendez-vous créé",
    addServiceFirstTitle: "Ajoutez d'abord un service",
    addServiceFirstText: "Vous n'avez pas encore de services. Ajoutez votre premier service ou créez une réservation rapide sans service.",
    servicesEmptyPickerTitle: "Aucun service pour l'instant",
    servicesEmptyPickerText: "Ajoutez votre premier service ou créez une réservation sans service.",
    createServiceAction: "Créer un service",
    bookingWithoutService: "Réservation sans service",
    firstServiceTitle: "Ajoutez votre premier service",
    firstServiceText: "Les services vous aident à créer des réservations et à ouvrir des réservations en ligne pour les clients.",
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
    teamMembers: "Członkowie zespołu",
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
    removeWorkTime: "Usuń czas",
    monthPlanner: "Dni robocze miesiąca",
    selectedDays: "Wybrane dni",
    applyToSelectedDays: "Zastosuj do wybranych",
    selectedDaysHint: "Wybierz dni miesiąca i zastosuj do nich te same interwały robocze.",
    noRoomForInterval: "Nie ma miejsca na kolejną przerwę.",
    invalidIntervalRange: "Koniec musi być późniejszy niż początek.",
    overlappingIntervals: "Przedziały nie mogą się nakładać.",
    addBreak: "Dodaj przerwę",
    removeBreak: "Usuń przerwę",
    onThisWeek: "W tym tygodniu",
    saveSchedule: "Zapisz harmonogram",
    workFrom: "Od",
    workTo: "Do",
    breakFrom: "Przerwa od",
    breakTo: "Przerwa do",
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
    supportGreeting: "Cześć! Zapytaj nas o stronę, rezerwacje, ustawienia lub płatności. Pomożemy.",
    supportPlaceholder: "Napisz swoje pytanie w jednej wiadomości...",
    supportSend: "Wyślij",
    supportSent: "Wiadomość wysłana.",
    supportFailed: "Nie można wysłać wiadomości.",
    notificationPendingBookings: "Oczekujące rezerwacje online",
    notificationsNew: "Nowe archiwum",
    notificationsArchive: "",
    notificationEmpty: "Nie ma jeszcze żadnych nowych aktualizacji.",
    statusPending: "Oczekuje",
    statusConfirmed: "Potwierdzono",
    statusCancelled: "Anulowano",
    myProfile: "Mój profil",
    personalSettings: "Ustawienia osobiste",
    helpSupport: "Pomoc i wsparcie",
    language: "Język",
    compact: "Kompaktowy",
    dayView: "Dzień",
    detailed: "Szczegółowy",
    threeDays: "3 dni",
    weekView: "Tydzień",
    monthView: "Miesiąc",
    selected: "Wybrane wizyty",
    visits: "",
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
    connected: "Połączono",
    notConnected: "Nie połączono",
    telegramHint: "Połączeniem telegramowym zarządza się w ustawieniach obszaru roboczego. Aplikacja pokazuje aktualny stan.",
    onlineBooking: "Rezerwacja online",
    address: "Adres",
    publicPage: "Strona rezerwacji",
    settingsSaved: "Zmiany zapisane",
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
    premiumManage: "Zarządzaj subskrypcją w App Store.",
    premiumReady: "Premium zaktualizowano. Zakupy",
    premiumUnavailable: "Zakupy są dostępne w TestFlight albo w wersji App Store.",
    premiumMissingConfig: "Należy skonfigurować RevenueCat i produkty App Store.",
    premiumPurchaseCancelled: "Zakup anulowany.",
    premiumSyncFailed: "Nie można zsynchronizować subskrypcji.",
    settingsGeneral: "Generał",
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
    categoriesHint: "oddzielone przecinkami",
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
    calendarNoServicesText: "Dodaj swoją pierwszą usługę, aby rozpocząć przyjmowanie klientów.",
    calendarEmptyActionText: "Dodaj swoją pierwszą wizytę lub skonfiguruj usługi rezerwacji online.",
    createBooking: "Utwórz rezerwację",
    createAppointmentButton: "+ Utwórz spotkanie",
    firstRunCalendarTitle: "Zacznij od usługi",
    firstRunCalendarText: "Dodaj usługę, aby szybciej tworzyć rezerwacje i otwierać rezerwacje online.",
    addFirstVisit: "Dodaj pierwszą wizytę",
    quickVisit: "Szybka rezerwacja",
    createVisitWithoutService: "Utwórz rezerwację bez usługi",
    onboardingStartTitle: "Aby rozpocząć 👋",
    onboardingStartText: "Nie masz jeszcze usług.\n\nDodaj swoją pierwszą usługę, aby rozpocząć przyjmowanie spotkań z klientami.",
    firstAppointmentCreated: "🎉 Utworzono pierwsze spotkanie",
    addServiceFirstTitle: "Najpierw dodaj usługę",
    addServiceFirstText: "Nie masz jeszcze usług. Dodaj swoją pierwszą usługę lub utwórz szybką rezerwację bez usługi.",
    servicesEmptyPickerTitle: "Brak jeszcze usług",
    servicesEmptyPickerText: "Dodaj swoją pierwszą usługę lub utwórz rezerwację bez usługi.",
    createServiceAction: "Utwórz usługę",
    bookingWithoutService: "Rezerwacja bez usługi",
    firstServiceTitle: "Dodaj swoją pierwszą usługę",
    firstServiceText: "Usługi pomagają Ci tworzyć rezerwacje i otwierać rezerwacje online dla klientów.",
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
    teamMembers: "Členové týmu",
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
    removeWorkTime: "Odstraňte čas",
    monthPlanner: "Měsíc pracovní dny",
    selectedDays: "Vybrané dny",
    applyToSelectedDays: "Použít na vybrané",
    selectedDaysHint: "Vyberte měsíční dny a použijte na ně stejné pracovní intervaly.",
    noRoomForInterval: "Není místo na další interval.",
    invalidIntervalRange: "Konec musí být pozdější než začátek.",
    overlappingIntervals: "Intervaly se nemohou překrývat.",
    addBreak: "Přidat přestávku",
    removeBreak: "Odebrat přestávku",
    onThisWeek: "Tento týden",
    saveSchedule: "Uložit plán",
    workFrom: "Od",
    workTo: "do",
    breakFrom: "Přestávka od",
    breakTo: "Přestávka do",
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
    supportGreeting: "Ahoj! Zeptejte se nás na stránky, rezervace, nastavení nebo platby. pomůžeme.",
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
    myProfile: "Můj profil",
    personalSettings: "Osobní nastavení",
    helpSupport: "Pomoc a podpora",
    language: "Jazyk",
    compact: "Kompaktní",
    dayView: "Den",
    detailed: "Detailní",
    threeDays: "3 dny",
    weekView: "Týden",
    monthView: "Měsíc",
    selected: "Vybrané návštěvy",
    visits: "",
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
    connected: "Připojeno",
    notConnected: "Nepřipojeno",
    telegramHint: "Telegramové připojení je spravováno v nastavení pracovního prostoru. Aplikace zobrazuje aktuální stav.",
    onlineBooking: "Online rezervace",
    address: "Adresa",
    publicPage: "Rezervační stránka",
    settingsSaved: "Změny uloženy",
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
    premiumManage: "Spravovat předplatné v App Store.",
    premiumReady: "Premium aktualizováno.",
    premiumUnavailable: "Nákupy jsou dostupné v TestFlightu nebo ve verzi z App Storu.",
    premiumMissingConfig: "Je potřeba nastavit RevenueCat a produkty App Store.",
    premiumPurchaseCancelled: "Nákup zrušen.",
    premiumSyncFailed: "Nelze synchronizovat předplatné.",
    settingsGeneral: "Obecné",
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
    serviceMode: "",
    categoriesText: "Kategorie",
    categoriesHint: "oddělena čárkou",
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
    calendarNoServicesText: "Přidejte svou první službu a začněte přijímat klienty.",
    calendarEmptyActionText: "Přidejte svou první návštěvu nebo nastavte služby pro online rezervaci.",
    createBooking: "Vytvořit rezervaci",
    createAppointmentButton: "+ Vytvořit schůzku",
    firstRunCalendarTitle: "Začněte se službou",
    firstRunCalendarText: "Přidejte službu pro rychlejší vytváření rezervací a otevření online rezervace.",
    addFirstVisit: "Přidat první návštěvu",
    quickVisit: "Rychlá rezervace",
    createVisitWithoutService: "Vytvořit rezervaci bez služby",
    onboardingStartTitle: "Začít 👋",
    onboardingStartText: "Ještě nemáte služby.\n\nPřidejte svou první službu a začněte přijímat schůzky klientů.",
    firstAppointmentCreated: "🎉 Vytvořena první schůzka",
    addServiceFirstTitle: "Nejprve přidejte službu",
    addServiceFirstText: "Ještě nemáte služby. Přidejte svou první službu nebo vytvořte rychlou rezervaci bez služby.",
    servicesEmptyPickerTitle: "Zatím žádné služby",
    servicesEmptyPickerText: "Přidejte svou první službu nebo vytvořte rezervaci bez služby.",
    createServiceAction: "Vytvořit službu",
    bookingWithoutService: "Rezervace bez služby",
    firstServiceTitle: "Přidejte svou první službu",
    firstServiceText: "Služby vám pomohou vytvořit rezervace a otevřít online rezervaci pro klienty.",
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
    teamMembers: "Miembros del equipo",
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
    removeWorkTime: "Eliminar tiempo",
    monthPlanner: "Mes días laborales",
    selectedDays: "Días seleccionados",
    applyToSelectedDays: "Aplicar a",
    selectedDaysHint: "seleccionados Días del mes y aplicarles los mismos intervalos de trabajo.",
    noRoomForInterval: "No hay lugar para otro intervalo.",
    invalidIntervalRange: "El final debe ser posterior al inicio.",
    overlappingIntervals: "Los intervalos no pueden superponerse.",
    addBreak: "Agregar descanso",
    removeBreak: "Eliminar descanso",
    onThisWeek: "Esta semana",
    saveSchedule: "Guardar horario",
    workFrom: "De",
    workTo: "A",
    breakFrom: "Descanso de",
    breakTo: "Descanso a",
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
    supportGreeting: "¡Hola! Pregúntanos sobre el sitio, las reservas, la configuración o los pagos. Le ayudaremos.",
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
    myProfile: "Mi perfil",
    personalSettings: "Configuración personal",
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
    connected: "Conectado",
    notConnected: "No conectado",
    telegramHint: "La conexión de Telegram se administra en la configuración del espacio de trabajo. La aplicación muestra el estado actual.",
    onlineBooking: "Reserva en línea",
    address: "Dirección",
    publicPage: "Página de reserva",
    settingsSaved: "Cambios guardados",
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
    premiumManage: "Administrar la suscripción en App Store.",
    premiumReady: "Premium actualizado.",
    premiumUnavailable: "Las compras están disponibles en TestFlight o en la versión de App Store.",
    premiumMissingConfig: "Hay que configurar RevenueCat y los productos de App Store.",
    premiumPurchaseCancelled: "Compra cancelada.",
    premiumSyncFailed: "No se pudo sincronizar la suscripción.",
    settingsGeneral: "Generalidades",
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
    categoriesHint: "separados por comas",
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
    calendarNoServicesText: "Agrega tu primer servicio para comenzar a aceptar clientes.",
    calendarEmptyActionText: "Agregue su primera visita o configure servicios para reservas en línea.",
    createBooking: "Crear reserva",
    createAppointmentButton: "+ Crear cita",
    firstRunCalendarTitle: "Comience con un servicio",
    firstRunCalendarText: "Agregue un servicio para crear reservas más rápido y abrir reservas en línea.",
    addFirstVisit: "Agregar primera visita",
    quickVisit: "Reserva rápida",
    createVisitWithoutService: "Crear reserva sin servicio",
    onboardingStartTitle: "Para comenzar 👋",
    onboardingStartText: "Aún no tienes servicios.\n\nAgregue su primer servicio para comenzar a aceptar citas de clientes.",
    firstAppointmentCreated: "🎉 Primera cita creada",
    addServiceFirstTitle: "Agrega un servicio primero",
    addServiceFirstText: "Aún no tienes servicios. Añade tu primer servicio o crea una reserva rápida sin servicio.",
    servicesEmptyPickerTitle: "Aún no hay servicios",
    servicesEmptyPickerText: "Añade tu primer servicio o crea una reserva sin servicio.",
    createServiceAction: "Crear servicio",
    bookingWithoutService: "Reserva sin servicio",
    firstServiceTitle: "Agregue su primer servicio",
    firstServiceText: "Los servicios lo ayudan a crear reservas y abrir reservas en línea para los clientes.",
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
    registerShort: "",
    newMasterCta: "erstellen Neuer Profi? Konto erstellen",
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
    teamMembers: "Teammitglieder",
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
    removeWorkTime: "Zeit entfernen",
    monthPlanner: "Monatsarbeitstage",
    selectedDays: "Ausgewählte Tage",
    applyToSelectedDays: "Auf ausgewählte anwenden",
    selectedDaysHint: "Monatstage auswählen und die gleichen Arbeitsintervalle auf sie anwenden.",
    noRoomForInterval: "Kein Platz für ein weiteres Intervall.",
    invalidIntervalRange: "Das Ende muss später als der Start liegen.",
    overlappingIntervals: "Intervalle dürfen sich nicht überschneiden.",
    addBreak: "Pause hinzufügen",
    removeBreak: "Pause entfernen",
    onThisWeek: "Diese Woche",
    saveSchedule: "Zeitplan speichern",
    workFrom: "Von",
    workTo: "Bis",
    breakFrom: "Pause von",
    breakTo: "Pause bis",
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
    supportGreeting: "Hallo! Fragen Sie uns nach der Website, Buchungen, Einstellungen oder Zahlungen. Wir helfen.",
    supportPlaceholder: "Schreiben Sie Ihre Frage in einer Nachricht ...",
    supportSend: "",
    supportSent: "-Nachricht senden.",
    supportFailed: "Die Nachricht konnte nicht gesendet werden.",
    notificationPendingBookings: "Ausstehende Online-Buchungen",
    notificationsNew: "Neu",
    notificationsArchive: "Archiv",
    notificationEmpty: "Es gibt noch keine neuen Updates.",
    statusPending: "Ausstehend",
    statusConfirmed: "Bestätigt",
    statusCancelled: "Abgebrochen",
    myProfile: "Mein Profil",
    personalSettings: "Persönliche Einstellungen",
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
    connected: "Verbunden",
    notConnected: "Nicht verbunden",
    telegramHint: "Die Telegrammverbindung wird in den Arbeitsbereichseinstellungen verwaltet. Die App zeigt den aktuellen Status an.",
    onlineBooking: "Online-Buchung",
    address: "Adresse",
    publicPage: "Buchungsseite",
    settingsSaved: "Änderungen gespeichert",
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
    premiumManage: "Das Abonnement im App Store verwalten.",
    premiumReady: "Premium aktualisiert.",
    premiumUnavailable: "Käufe sind in TestFlight oder im App-Store-Build verfügbar.",
    premiumMissingConfig: "RevenueCat und die App-Store-Produkte müssen eingerichtet werden.",
    premiumPurchaseCancelled: "Kauf storniert.",
    premiumSyncFailed: "Das Abonnement konnte nicht synchronisiert werden.",
    settingsGeneral: "Allgemein",
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
    categoriesHint: "Komma getrennt",
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
    calendarNoServicesText: "Fügen Sie Ihren ersten Service hinzu, um mit der Annahme von Kunden zu beginnen.",
    calendarEmptyActionText: "Fügen Sie Ihren ersten Besuch hinzu oder richten Sie Dienste für die Online-Buchung ein.",
    createBooking: "Buchung erstellen",
    createAppointmentButton: "+ Termin erstellen",
    firstRunCalendarTitle: "Mit einem Dienst beginnen",
    firstRunCalendarText: "Fügen Sie einen Dienst hinzu, um Buchungen schneller zu erstellen und Online-Buchungen zu öffnen.",
    addFirstVisit: "Erstbesuch hinzufügen",
    quickVisit: "Schnellbuchung",
    createVisitWithoutService: "Buchung ohne Leistung erstellen",
    onboardingStartTitle: "Zum Einstieg 👋",
    onboardingStartText: "Sie haben noch keine Leistungen.\n\nFügen Sie Ihren ersten Service hinzu, um mit der Annahme von Kundenterminen zu beginnen.",
    firstAppointmentCreated: "🎉 Erster Termin erstellt",
    addServiceFirstTitle: "Zuerst einen Dienst hinzufügen",
    addServiceFirstText: "Sie haben noch keine Dienste. Fügen Sie Ihren ersten Service hinzu oder erstellen Sie eine Schnellbuchung ohne Service.",
    servicesEmptyPickerTitle: "Noch keine Leistungen",
    servicesEmptyPickerText: "Fügen Sie Ihre erste Leistung hinzu oder erstellen Sie eine Buchung ohne Leistung.",
    createServiceAction: "Dienst erstellen",
    bookingWithoutService: "Buchen ohne Dienst",
    firstServiceTitle: "Fügen Sie Ihren ersten Dienst hinzu",
    firstServiceText: "Dienste helfen Ihnen beim Erstellen von Buchungen und beim Öffnen von Online-Buchungen für Kunden.",
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
  premiumSubscriptionText: "Les nouveaux comptes reçoivent 14 jours de Premium gratuits. Après l'essai, Pro garde les outils payants ouverts sans limites.",
  premiumTrialIncluded: "14 jours de Premium gratuits",
  premiumTrialDaysLeft: "{count} jours de Premium restants",
  premiumTrialOneDayLeft: "Dernier jour de Premium",
  premiumTrialExpired: "L'essai Premium est terminé",
  premiumUpgradeCta: "Passer à Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro débloque",
  premiumBenefitOnlineBooking: "la réservation en ligne et la page publique",
  premiumBenefitReminders: "les rappels push et Telegram",
  premiumBenefitTeam: "l'équipe, les plannings et les rôles",
  premiumBenefitClients: "la base clients sans solutions manuelles",
  premiumYearlyNudge: "L'abonnement annuel est plus avantageux si vous utilisez Timviz toute l'année.",
  premiumFeatureClientsTitle: "La base clients est disponible avec Pro",
  premiumFeatureClientsText: "Enregistrez les clients, créez des réservations répétées plus vite et gardez l'historique après l'essai.",
  premiumFeatureStaffTitle: "L'équipe et les plannings sont disponibles avec Pro",
  premiumFeatureStaffText: "Ajoutez des employés, gérez les shifts et les accès sans mélanger toutes les réservations.",
  premiumFeatureOnlineTitle: "La réservation en ligne est disponible avec Pro",
  premiumFeatureOnlineText: "Après l'essai, les liens de réservation client restent actifs avec Pro.",
  premiumFeatureScheduleTitle: "Le planning avancé est disponible avec Pro",
  premiumFeatureScheduleText: "Configurez shifts, jours libres, pauses et plannings d'équipe sans limites.",
  premiumFeaturePushTitle: "Les rappels push sont disponibles avec Pro",
  premiumFeaturePushText: "Activez les notifications pour les nouvelles réservations, reports et annulations.",
  premiumFeatureTelegramTitle: "Les notifications Telegram sont disponibles avec Pro",
  premiumFeatureTelegramText: "Recevez réservations et rappels dans Telegram après le passage à Pro.",
  premiumFeatureAddressTitle: "L'adresse et la carte sont disponibles avec Pro",
  premiumFeatureAddressText: "Affichez l'adresse exacte, les détails d'entrée et la carte sur la page de réservation.",
});

Object.assign(generatedMobileCopy.pl, {
  premiumSubscriptionText: "Nowe konta otrzymują 14 dni Premium za darmo. Po okresie próbnym Pro utrzymuje płatne narzędzia bez limitów.",
  premiumTrialIncluded: "14 dni Premium za darmo",
  premiumTrialDaysLeft: "Pozostało {count} dni Premium",
  premiumTrialOneDayLeft: "Ostatni dzień Premium",
  premiumTrialExpired: "Okres próbny Premium się zakończył",
  premiumUpgradeCta: "Wybierz Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro odblokowuje",
  premiumBenefitOnlineBooking: "rezerwacje online i stronę publiczną",
  premiumBenefitReminders: "przypomnienia push i Telegram",
  premiumBenefitTeam: "zespół, grafiki i role",
  premiumBenefitClients: "bazę klientów bez ręcznych obejść",
  premiumYearlyNudge: "Plan roczny opłaca się bardziej, jeśli pracujesz w Timviz stale.",
  premiumFeatureClientsTitle: "Baza klientów jest dostępna w Pro",
  premiumFeatureClientsText: "Zapisuj klientów, szybciej twórz ponowne wizyty i zachowuj historię po okresie próbnym.",
  premiumFeatureStaffTitle: "Zespół i grafiki są dostępne w Pro",
  premiumFeatureStaffText: "Dodawaj pracowników, zarządzaj zmianami i dostępami bez mieszania wszystkich wizyt.",
  premiumFeatureOnlineTitle: "Rezerwacje online są dostępne w Pro",
  premiumFeatureOnlineText: "Po okresie próbnym linki do rezerwacji klientów pozostają aktywne w Pro.",
  premiumFeatureScheduleTitle: "Zaawansowany grafik jest dostępny w Pro",
  premiumFeatureScheduleText: "Ustawiaj zmiany, dni wolne, przerwy i grafiki zespołu bez limitów.",
  premiumFeaturePushTitle: "Przypomnienia push są dostępne w Pro",
  premiumFeaturePushText: "Włącz powiadomienia o nowych, przeniesionych i anulowanych wizytach.",
  premiumFeatureTelegramTitle: "Powiadomienia Telegram są dostępne w Pro",
  premiumFeatureTelegramText: "Otrzymuj wizyty i przypomnienia w Telegramie po przejściu na Pro.",
  premiumFeatureAddressTitle: "Adres i mapa są dostępne w Pro",
  premiumFeatureAddressText: "Pokaż klientom dokładny adres, wejście i mapę na stronie rezerwacji.",
});

Object.assign(generatedMobileCopy.cs, {
  premiumSubscriptionText: "Nové účty získají 14 dní Premium zdarma. Po zkušební době Pro ponechá placené nástroje bez omezení.",
  premiumTrialIncluded: "14 dní Premium zdarma",
  premiumTrialDaysLeft: "Zbývá {count} dní Premium",
  premiumTrialOneDayLeft: "Poslední den Premium",
  premiumTrialExpired: "Zkušební Premium skončilo",
  premiumUpgradeCta: "Přejít na Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro odemyká",
  premiumBenefitOnlineBooking: "online rezervace a veřejnou stránku",
  premiumBenefitReminders: "push a Telegram připomenutí",
  premiumBenefitTeam: "tým, rozvrhy a role",
  premiumBenefitClients: "klientskou databázi bez ruční práce",
  premiumYearlyNudge: "Roční tarif je výhodnější, pokud plánujete Timviz používat dlouhodobě.",
  premiumFeatureClientsTitle: "Klientská databáze je v Pro",
  premiumFeatureClientsText: "Ukládejte klienty, rychleji vytvářejte opakované rezervace a držte historii po zkušební době.",
  premiumFeatureStaffTitle: "Tým a rozvrhy jsou v Pro",
  premiumFeatureStaffText: "Přidávejte zaměstnance, spravujte směny a přístupy bez míchání všech rezervací.",
  premiumFeatureOnlineTitle: "Online rezervace jsou v Pro",
  premiumFeatureOnlineText: "Po zkušební době zůstávají klientské rezervační odkazy aktivní v Pro.",
  premiumFeatureScheduleTitle: "Pokročilý rozvrh je v Pro",
  premiumFeatureScheduleText: "Nastavujte směny, volné dny, pauzy a týmové rozvrhy bez omezení.",
  premiumFeaturePushTitle: "Push připomenutí jsou v Pro",
  premiumFeaturePushText: "Zapněte upozornění na nové, přesunuté a zrušené rezervace.",
  premiumFeatureTelegramTitle: "Telegram upozornění jsou v Pro",
  premiumFeatureTelegramText: "Po přechodu na Pro dostávejte rezervace a připomenutí v Telegramu.",
  premiumFeatureAddressTitle: "Adresa a mapa jsou v Pro",
  premiumFeatureAddressText: "Ukažte klientům přesnou adresu, vstup a mapu na rezervační stránce.",
});

Object.assign(generatedMobileCopy.es, {
  premiumSubscriptionText: "Las cuentas nuevas reciben 14 días de Premium gratis. Después de la prueba, Pro mantiene abiertas las herramientas de pago sin límites.",
  premiumTrialIncluded: "14 días de Premium gratis",
  premiumTrialDaysLeft: "Quedan {count} días de Premium",
  premiumTrialOneDayLeft: "Último día de Premium",
  premiumTrialExpired: "La prueba Premium terminó",
  premiumUpgradeCta: "Activar Pro",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro desbloquea",
  premiumBenefitOnlineBooking: "reservas online y página pública",
  premiumBenefitReminders: "recordatorios push y Telegram",
  premiumBenefitTeam: "equipo, horarios y roles",
  premiumBenefitClients: "base de clientes sin atajos manuales",
  premiumYearlyNudge: "El plan anual conviene más si usarás Timviz de forma continua.",
  premiumFeatureClientsTitle: "La base de clientes está disponible en Pro",
  premiumFeatureClientsText: "Guarda clientes, crea reservas repetidas más rápido y conserva el historial después de la prueba.",
  premiumFeatureStaffTitle: "Equipo y horarios están disponibles en Pro",
  premiumFeatureStaffText: "Añade empleados, gestiona turnos y accesos sin mezclar todas las reservas.",
  premiumFeatureOnlineTitle: "La reserva online está disponible en Pro",
  premiumFeatureOnlineText: "Después de la prueba, los enlaces de reserva de clientes siguen activos en Pro.",
  premiumFeatureScheduleTitle: "El horario avanzado está disponible en Pro",
  premiumFeatureScheduleText: "Configura turnos, días libres, pausas y horarios del equipo sin límites.",
  premiumFeaturePushTitle: "Los recordatorios push están disponibles en Pro",
  premiumFeaturePushText: "Activa notificaciones para reservas nuevas, movidas y canceladas.",
  premiumFeatureTelegramTitle: "Las notificaciones de Telegram están disponibles en Pro",
  premiumFeatureTelegramText: "Recibe reservas y recordatorios en Telegram después de activar Pro.",
  premiumFeatureAddressTitle: "Dirección y mapa están disponibles en Pro",
  premiumFeatureAddressText: "Muestra a los clientes la dirección exacta, entrada y mapa en la página de reserva.",
});

Object.assign(generatedMobileCopy.de, {
  premiumSubscriptionText: "Neue Konten erhalten 14 Tage Premium kostenlos. Danach hält Pro die kostenpflichtigen Werkzeuge ohne Limits offen.",
  premiumTrialIncluded: "14 Tage Premium kostenlos",
  premiumTrialDaysLeft: "Noch {count} Tage Premium",
  premiumTrialOneDayLeft: "Letzter Premium-Tag",
  premiumTrialExpired: "Premium-Testzeitraum beendet",
  premiumUpgradeCta: "Pro aktivieren",
  premiumLockedBadge: "Pro",
  premiumFeatureBenefitsTitle: "Pro schaltet frei",
  premiumBenefitOnlineBooking: "Online-Buchung und öffentliche Seite",
  premiumBenefitReminders: "Push- und Telegram-Erinnerungen",
  premiumBenefitTeam: "Team, Dienstpläne und Rollen",
  premiumBenefitClients: "Kundendatenbank ohne manuelle Umwege",
  premiumYearlyNudge: "Der Jahrestarif lohnt sich mehr, wenn Sie Timviz dauerhaft nutzen.",
  premiumFeatureClientsTitle: "Die Kundendatenbank ist in Pro verfügbar",
  premiumFeatureClientsText: "Speichern Sie Kunden, erstellen Sie Wiederholungsbuchungen schneller und behalten Sie die Historie nach der Testphase.",
  premiumFeatureStaffTitle: "Team und Dienstpläne sind in Pro verfügbar",
  premiumFeatureStaffText: "Fügen Sie Mitarbeiter hinzu und verwalten Sie Schichten und Zugriffe ohne vermischte Buchungen.",
  premiumFeatureOnlineTitle: "Online-Buchung ist in Pro verfügbar",
  premiumFeatureOnlineText: "Nach der Testphase bleiben Kunden-Buchungslinks mit Pro aktiv.",
  premiumFeatureScheduleTitle: "Erweiterte Dienstpläne sind in Pro verfügbar",
  premiumFeatureScheduleText: "Richten Sie Schichten, freie Tage, Pausen und Teampläne ohne Limits ein.",
  premiumFeaturePushTitle: "Push-Erinnerungen sind in Pro verfügbar",
  premiumFeaturePushText: "Aktivieren Sie Hinweise für neue, verschobene und stornierte Buchungen.",
  premiumFeatureTelegramTitle: "Telegram-Benachrichtigungen sind in Pro verfügbar",
  premiumFeatureTelegramText: "Erhalten Sie Buchungen und Erinnerungen in Telegram nach dem Upgrade auf Pro.",
  premiumFeatureAddressTitle: "Adresse und Karte sind in Pro verfügbar",
  premiumFeatureAddressText: "Zeigen Sie Kunden die genaue Adresse, Eingangshinweise und Karte auf der Buchungsseite.",
});

const copy = {
  uk: baseCopy.uk,
  ru: baseCopy.ru,
  en: baseCopy.en,
  fr: { ...baseCopy.en, ...generatedMobileCopy.fr },
  pl: { ...baseCopy.en, ...generatedMobileCopy.pl },
  cs: { ...baseCopy.en, ...generatedMobileCopy.cs },
  es: { ...baseCopy.en, ...generatedMobileCopy.es },
  de: { ...baseCopy.en, ...generatedMobileCopy.de },
} satisfies Record<AppLanguage, Record<keyof typeof baseCopy.en, string>>;

function detectLanguage(): AppLanguage {
  const locale = Localization.getLocales()[0];
  const candidates = [
    locale?.languageCode,
    locale?.languageTag,
    locale?.regionCode,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  if (candidates.some((value) => value.startsWith("uk") || value === "ua")) return "uk";
  if (candidates.some((value) => value.startsWith("ru"))) return "ru";
  if (candidates.some((value) => value.startsWith("fr"))) return "fr";
  if (candidates.some((value) => value.startsWith("pl"))) return "pl";
  if (candidates.some((value) => value.startsWith("cs") || value.startsWith("cz"))) return "cs";
  if (candidates.some((value) => value.startsWith("es"))) return "es";
  if (candidates.some((value) => value.startsWith("de"))) return "de";
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
    "Парикмахерская": "Перукарня",
    "Ногти": "Нігті",
    "Брови и ресницы": "Брови та вії",
    "Салон красоты": "Салон краси",
    "Медспа": "Медспа",
    "Парикмахер": "Перукар",
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
    "Парикмахерская": "Hair salon",
    "Ногти": "Nails",
    "Брови и ресницы": "Brows and lashes",
    "Салон красоты": "Beauty salon",
    "Медспа": "Medspa",
    "Парикмахер": "Hairdresser",
    "Массажный салон": "Massage studio",
    "Спа-салон и сауна": "Spa and sauna",
    "Салон депиляции": "Hair removal salon",
    "Тату и пирсинг": "Tattoo and piercing",
    "Студия загара": "Tanning studio",
    "Физиотерапия": "Physiotherapy",
    "Другая": "Other",
  },
  fr: {
    "Парикмахерская": "Salon de coiffure",
    "Ногти": "Ongles",
    "Брови и ресницы": "Sourcils et cils",
    "Салон красоты": "Institut de beauté",
    "Медспа": "Medspa",
    "Парикмахер": "Coiffeur",
    "Массажный салон": "Salon de massage",
    "Спа-салон и сауна": "Spa et sauna",
    "Салон депиляции": "Salon d'épilation",
    "Тату и пирсинг": "Tatouage et piercing",
    "Студия загара": "Studio de bronzage",
    "Физиотерапия": "Kinésithérapie",
    "Другая": "Autre",
  },
  pl: {
    "Парикмахерская": "Salon fryzjerski",
    "Ногти": "Paznokcie",
    "Брови и ресницы": "Brwi i rzęsy",
    "Салон красоты": "Salon beauty",
    "Медспа": "Medspa",
    "Парикмахер": "Fryzjer",
    "Массажный салон": "Gabinet masażu",
    "Спа-салон и сауна": "Spa i sauna",
    "Салон депиляции": "Salon depilacji",
    "Тату и пирсинг": "Tatuaż i piercing",
    "Студия загара": "Studio opalania",
    "Физиотерапия": "Fizjoterapia",
    "Другая": "Inne",
  },
  cs: {
    "Парикмахерская": "Kadeřnictví",
    "Ногти": "Nehty",
    "Брови и ресницы": "Obočí a řasy",
    "Салон красоты": "Kosmetický salon",
    "Медспа": "Medspa",
    "Парикмахер": "Kadeřník",
    "Массажный салон": "Masážní salon",
    "Спа-салон и сауна": "Spa a sauna",
    "Салон депиляции": "Depilační salon",
    "Тату и пирсинг": "Tetování a piercing",
    "Студия загара": "Solární studio",
    "Физиотерапия": "Fyzioterapie",
    "Другая": "Jiné",
  },
  es: {
    "Парикмахерская": "Peluquería",
    "Ногти": "Uñas",
    "Брови и ресницы": "Cejas y pestañas",
    "Салон красоты": "Salón de belleza",
    "Медспа": "Medspa",
    "Парикмахер": "Peluquero",
    "Массажный салон": "Centro de masajes",
    "Спа-салон и сауна": "Spa y sauna",
    "Салон депиляции": "Centro de depilación",
    "Тату и пирсинг": "Tatuajes y piercing",
    "Студия загара": "Centro de bronceado",
    "Физиотерапия": "Fisioterapia",
    "Другая": "Otra",
  },
  de: {
    "Парикмахерская": "Friseursalon",
    "Ногти": "Nägel",
    "Брови и ресницы": "Augenbrauen und Wimpern",
    "Салон красоты": "Kosmetikstudio",
    "Медспа": "Medspa",
    "Парикмахер": "Friseur",
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

function getServiceIdentityKey(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName"> | undefined) {
  const names = [
    service?.name,
    ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item]),
  ]
    .map(normalizeServiceIdentityPart)
    .filter(Boolean)
    .sort();
  return names[0] || "";
}

function getServiceCategoryDisplayName(category: string | undefined, localizedCategory: LocalizedText | undefined, language: AppLanguage, t: Record<string, string>) {
  const localized = localizeText(category, localizedCategory, language);
  return localizeCatalogCategory(localized || category, language, t);
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
  return [service?.name, ...SUPPORTED_APP_LANGUAGES.map((item) => service?.localizedName?.[item])]
    .filter(Boolean)
    .some((candidate) => String(candidate).trim().toLowerCase() === normalized);
}

function localizeServiceCategory(category: string | undefined, t: Record<string, string>) {
  const value = safeText(category).trim();
  if (!value || value === DEFAULT_SERVICE_CATEGORY || value === "Без категорії" || value === "Uncategorized") {
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
  const regionCode = Localization.getLocales()[0]?.regionCode?.toUpperCase();
  const phoneCountry = PHONE_COUNTRIES.find((country) => country.iso === regionCode) || PHONE_COUNTRIES.find((country) => country.iso === "UA") || PHONE_COUNTRIES[0];
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

function findRevenueCatPackage(packages: PurchasesPackage[], billing: "monthly" | "yearly") {
  const productId = billing === "yearly" ? REVENUECAT_YEARLY_PRODUCT_ID : REVENUECAT_MONTHLY_PRODUCT_ID;
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
      notificationsNewBooking: typeof settings.notificationsNewBooking === "boolean" ? settings.notificationsNewBooking : fallback?.settings.notificationsNewBooking ?? true,
      notificationsCabinetBooking: typeof settings.notificationsCabinetBooking === "boolean" ? settings.notificationsCabinetBooking : fallback?.settings.notificationsCabinetBooking ?? true,
      notificationsRescheduled: typeof settings.notificationsRescheduled === "boolean" ? settings.notificationsRescheduled : fallback?.settings.notificationsRescheduled ?? true,
      notificationsCancelled: typeof settings.notificationsCancelled === "boolean" ? settings.notificationsCancelled : fallback?.settings.notificationsCancelled ?? true,
      notificationsReminder: typeof settings.notificationsReminder === "boolean" ? settings.notificationsReminder : fallback?.settings.notificationsReminder ?? true,
      notificationsToday: typeof settings.notificationsToday === "boolean" ? settings.notificationsToday : fallback?.settings.notificationsToday ?? true,
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
      notificationsNewBooking: typeof settings.notificationsNewBooking === "boolean" ? settings.notificationsNewBooking : fallback?.settings.notificationsNewBooking ?? true,
      notificationsCabinetBooking: typeof settings.notificationsCabinetBooking === "boolean" ? settings.notificationsCabinetBooking : fallback?.settings.notificationsCabinetBooking ?? true,
      notificationsRescheduled: typeof settings.notificationsRescheduled === "boolean" ? settings.notificationsRescheduled : fallback?.settings.notificationsRescheduled ?? true,
      notificationsCancelled: typeof settings.notificationsCancelled === "boolean" ? settings.notificationsCancelled : fallback?.settings.notificationsCancelled ?? true,
      notificationsReminder: typeof settings.notificationsReminder === "boolean" ? settings.notificationsReminder : fallback?.settings.notificationsReminder ?? true,
      notificationsToday: typeof settings.notificationsToday === "boolean" ? settings.notificationsToday : fallback?.settings.notificationsToday ?? true,
      reminderLeadMinutes: typeof settings.reminderLeadMinutes === "number" ? settings.reminderLeadMinutes : fallback?.settings.reminderLeadMinutes ?? 120,
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
  return {
    token: String(result.token || ""),
    professionalId: String(result.professionalId || ""),
    email: String(result.profile?.email || fallbackEmail),
    displayName: String(result.profile?.displayName || result.profile?.email || fallbackEmail),
  };
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

function getScheduleForDate(workspace: WorkspaceSnapshot | null, date: string): WorkDayScheduleRecord {
  const custom = workspace?.memberSchedule?.customSchedule?.[date];
  if (custom) return normalizeScheduleDay(custom, date);
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  const schedule = workspace?.memberSchedule?.workSchedule?.[dayScheduleKeys[dayIndex]];
  return normalizeScheduleDay(schedule, date);
}

function getMemberScheduleForDate(member: CalendarMemberView | null, workspace: WorkspaceSnapshot | null, date: string): WorkDayScheduleRecord {
  if (!member?.memberSchedule) return getScheduleForDate(workspace, date);
  const custom = member.memberSchedule.customSchedule?.[date];
  if (custom) return normalizeScheduleDay(custom, date);
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

  return {
    ...day,
    enabled,
    startTime,
    endTime,
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
      breakStart: fallbackStart,
      breakEnd: fallbackStart,
      breaks: [],
      dayType: "day-off" as const,
    };
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const breaks: WorkBreakRecord[] = [];
  for (let index = 0; index < normalized.length - 1; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];
    breaks.push({ startTime: current.endTime, endTime: next.startTime });
  }

  return {
    enabled: true,
    startTime: first.startTime,
    endTime: last.endTime,
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
  if (duration < 180) return null;
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
  const desiredStart = Math.min(currentEnd + 60, 24 * 60 - 30);
  const desiredEnd = Math.min(24 * 60 - 1, desiredStart + 60);
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
  const [activeTab, setActiveTab] = useState<AppTab>("calendar");
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
  const [registerPhoneCountry, setRegisterPhoneCountry] = useState<PhoneCountryOption>(() => detectedCountry.phoneCountry);
  const [phoneCountryPickerOpen, setPhoneCountryPickerOpen] = useState(false);
  const [phoneCountryQuery, setPhoneCountryQuery] = useState("");
  const [customPhonePrefix, setCustomPhonePrefix] = useState("");
  const [visitDraft, setVisitDraft] = useState<VisitDraft>(() => createDefaultVisitDraft(selectedDate, "09:00"));
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null);
  const [timeAction, setTimeAction] = useState<{ date: string; time: string; targetProfessionalId?: string } | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [clientDraft, setClientDraft] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const pendingServiceSavesRef = useRef<Map<string, PendingServiceSave>>(new Map());
  const serviceSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceSaveInFlightRef = useRef(false);
  const workspaceLanguageAppliedRef = useRef(false);
  const autoPushRegisteringRef = useRef(false);
  const googleConfigured = Platform.select({
    ios: Boolean(GOOGLE_IOS_CLIENT_ID),
    android: Boolean(GOOGLE_ANDROID_CLIENT_ID),
    default: Boolean(GOOGLE_WEB_CLIENT_ID),
  });

  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        if (!url) return;
        if (url.includes("create-account")) setMode("register");
        if (url.includes("pro/login")) setMode("login");
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleSignInAvailable)
      .catch(() => setAppleSignInAvailable(false));
    hasBiometricUnlockAvailable()
      .then(setBiometricAvailable)
      .catch(() => setBiometricAvailable(false));
  }, []);

  function hasVisibleWorkspaceData() {
    return Boolean(workspace || calendar || clients.length || staffSnapshot);
  }

  function applyWorkspaceCache(cache: MobileWorkspaceCache) {
    setWorkspace(cache.workspace);
    setCalendar(cache.calendar);
    setCalendarDate(cache.selectedDate || selectedDate);
    setClients(Array.isArray(cache.clients) ? cache.clients : []);
    setServiceCatalog(Array.isArray(cache.serviceCatalog) ? cache.serviceCatalog : []);
    setStaffSnapshot(cache.staffSnapshot || null);
    if (!workspaceLanguageAppliedRef.current) {
      const profileLanguage = normalizeAppLanguage(cache.workspace?.professional?.language);
      if (profileLanguage) {
        setLanguage(profileLanguage);
        workspaceLanguageAppliedRef.current = true;
      }
    }
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

  function mergeWorkspaceServices(updater: (services: ServiceRecord[]) => ServiceRecord[]) {
    setWorkspace((current) => {
      if (!current) return current;
      return {
        ...current,
        services: updater(current.services || []),
      };
    });
  }

  function serviceMatchesPending(service: ServiceRecord, pending: PendingServiceSave) {
    return service.id === pending.optimisticService.id || serviceNameMatches(service, pending.optimisticService.name) || getServiceIdentityKey(service) === pending.key;
  }

  function hasServiceOrPendingSave(service: Pick<ServiceRecord | ServiceTemplateRecord, "name" | "localizedName">, key = getServiceIdentityKey(service)) {
    if (!key) return false;
    if (pendingServiceSavesRef.current.has(key)) return true;
    const pendingLookup: PendingServiceSave = {
      key,
      optimisticService: {
        id: "",
        name: service.name,
        localizedName: service.localizedName,
        price: 0,
      },
      payload: {
        name: service.name,
        category: DEFAULT_SERVICE_CATEGORY,
        durationMinutes: 60,
        price: 0,
        color: SERVICE_COLORS[0],
        source: "catalog",
      },
      attempts: 0,
    };
    return Boolean(workspace?.services.some((item) => serviceMatchesPending(item, pendingLookup)));
  }

  function withPendingServiceSaves(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
    const pending = Array.from(pendingServiceSavesRef.current.values());
    if (!pending.length) return snapshot;

    const nextServices = [...(snapshot.services || [])];
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

    setWorkspace((current) => {
      if (!current) return current;
      const nextServices = (current.services || []).filter((service) => !optimisticIds.has(service.id));

      savedServices.forEach((savedService) => {
        const existingIndex = nextServices.findIndex((service) => service.id === savedService.id || serviceNameMatches(service, savedService.name));
        if (existingIndex >= 0) {
          nextServices[existingIndex] = { ...nextServices[existingIndex], ...savedService };
        } else {
          nextServices.unshift(savedService);
        }
      });

      return {
        ...current,
        services: nextServices,
      };
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
    if (serviceSaveInFlightRef.current || !session) return;
    const pendingItems = Array.from(pendingServiceSavesRef.current.values()).slice(0, 5);
    if (!pendingItems.length) return;

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
    } catch {
      pendingItems.forEach((item) => {
        pendingServiceSavesRef.current.set(item.key, { ...item, attempts: item.attempts + 1 });
      });
      scheduleServiceSaveFlush(2500);
    } finally {
      serviceSaveInFlightRef.current = false;
      if (pendingServiceSavesRef.current.size) {
        scheduleServiceSaveFlush(650);
      }
    }
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
    if (!session || autoPushRegisteringRef.current) return;
    const storageKey = `${PUSH_AUTO_REGISTER_KEY_PREFIX}${session.professionalId}`;
    autoPushRegisteringRef.current = true;
    AsyncStorage.getItem(storageKey)
      .then(async (alreadyPrompted) => {
        if (alreadyPrompted === "1") return;
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
      setCalendar(result as CalendarSnapshot);
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
      const [workspaceResult, calendarResult, clientsResult, servicesResult, staffResult] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mobile/pro/workspace/${currentSession.professionalId}?media=${options.media ? "1" : "0"}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/clients`, { headers }).then((item) => item.json()),
        fetch(`${API_BASE_URL}/api/mobile/pro/services`, { headers }).then((item) => item.json()),
        fetch(`${API_BASE_URL}/api/mobile/pro/staff`, { headers }).then((item) => item.json().catch(() => null)).catch(() => null),
      ]);

      if (workspaceResult?.error) throw new Error(workspaceResult.error);
      if (calendarResult?.error) throw new Error(calendarResult.error);
      if (clientsResult?.error) throw new Error(clientsResult.error);
      if (servicesResult?.error) throw new Error(servicesResult.error);
      if (staffResult?.error) throw new Error(staffResult.error);

      const nextClients = Array.isArray(clientsResult.clients) ? clientsResult.clients : [];
      const nextCatalog = Array.isArray(servicesResult.catalog) ? servicesResult.catalog : [];
      const nextWorkspace = withPendingServiceSaves(workspaceResult);
      if (!workspaceLanguageAppliedRef.current) {
        const profileLanguage = normalizeAppLanguage(nextWorkspace.professional?.language);
        if (profileLanguage) setLanguage(profileLanguage);
        workspaceLanguageAppliedRef.current = true;
      }
      setWorkspace(nextWorkspace);
      setCalendar(calendarResult);
      setCalendarDate(date);
      setClients(nextClients);
      setServiceCatalog(nextCatalog);
      setStaffSnapshot(staffResult || null);
      persistWorkspaceCache(currentSession, date, {
        workspace: nextWorkspace,
        calendar: calendarResult,
        clients: nextClients,
        serviceCatalog: nextCatalog,
        staffSnapshot: staffResult || null,
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

  async function persistSession(nextSession: MobileSession) {
    const serialized = JSON.stringify(nextSession);
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
    await SecureStore.setItemAsync(SECURE_SESSION_KEY, serialized).catch(() => undefined);
    setPendingBiometricSession(null);
    setSession(nextSession);
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
      await persistSession(normalizeApiSession(result, String(result?.profile?.email || profile.email || "")));
    } catch (error) {
      Alert.alert(t.loginError, error instanceof Error ? error.message : t.socialAuthFailed);
    } finally {
      setSocialBusy(null);
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!googleConfigured) {
      Alert.alert("Google", t.socialAuthConfigMissing);
      return;
    }
    Alert.alert("Google", t.socialAuthConfigMissing);
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
    };

    if (
      !payload.firstName ||
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
    pendingServiceSavesRef.current.clear();
    workspaceLanguageAppliedRef.current = false;
    if (serviceSaveTimerRef.current) {
      clearTimeout(serviceSaveTimerRef.current);
      serviceSaveTimerRef.current = null;
    }
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
    setBusy(false);
  }

  function getNormalizedVisitItems() {
    return (Array.isArray(visitDraft.items) ? visitDraft.items : []).map((item) => ({
      ...item,
      serviceId: safeText(item.serviceId),
      serviceName: getServiceDisplayName(workspace?.services.find((service) => service.id === item.serviceId), language) || safeText(item.serviceName).trim() || t.withoutService,
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
    const items = getNormalizedVisitItems();
    const validationMessage = getVisitValidationMessage(items);
    if (validationMessage) {
      Alert.alert(t.requiredTitle, validationMessage);
      return false;
    }

    const appointmentDate = visitDraft.appointmentDate || selectedDate;
    const hadAppointmentsBefore = (calendar?.appointments || []).filter((appointment) => appointment.kind !== "blocked").length > 0;
    const customerName = safeText(visitDraft.customerName).trim();
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
    mergeCalendarAppointments(appointmentDate, (appointments) =>
      [...appointments, ...optimisticAppointments].sort((left, right) => left.startTime.localeCompare(right.startTime))
    );
    setVisitDraft(createDefaultVisitDraft(appointmentDate, items[0]?.startTime || "09:00"));
    void apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          targetProfessionalId: visitDraft.targetProfessionalId,
          items: items.map((item) => ({
            appointmentDate,
            startTime: item.startTime,
            endTime: item.endTime,
            customerName,
            customerPhone,
            serviceName: item.serviceName,
            priceAmount: item.priceAmount,
            attendance: "confirmed",
            notes,
          })),
        }),
      })
      .then(() => {
        if (!hadAppointmentsBefore) {
          Alert.alert("Timviz", t.firstAppointmentCreated);
        }
        return refreshCalendarOnly(session, appointmentDate);
      })
      .catch((error) => {
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
    const customerName = safeText(visitDraft.customerName).trim();
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
              customerPhone,
              serviceName: item.serviceName,
              priceAmount: item.priceAmount,
              attendance: editingAppointment.attendance,
              notes,
            })),
          }),
        });
      })
      .then(() => refreshCalendarOnly(session, appointmentDate))
      .catch((error) => {
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
      .then(() => refreshAll(session, selectedDate, { silent: true }))
      .catch((error) => {
        Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
        revalidateWorkspace();
      });
    return optimisticClient;
  }

  async function deleteAppointment(appointment: AppointmentRecord) {
    Alert.alert(t.delete, appointment.serviceName || t.newVisit, [
      { text: t.cancel || "Cancel", style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          const appointmentDate = appointment.appointmentDate || selectedDate;
          mergeCalendarAppointments(appointmentDate, (appointments) => appointments.filter((item) => item.id !== appointment.id));
          const target = appointment.professionalId ? `&targetProfessionalId=${encodeURIComponent(appointment.professionalId)}` : "";
          void apiFetch(`/api/mobile/pro/calendar?appointmentId=${encodeURIComponent(appointment.id)}${target}`, { method: "DELETE" })
            .then(() => refreshCalendarOnly(session, appointmentDate))
            .catch((error) => {
              Alert.alert(t.delete, error instanceof Error ? error.message : t.delete);
              revalidateWorkspace(appointmentDate);
            });
        },
      },
    ]);
  }

  async function updateAppointmentTime(appointment: AppointmentRecord, startTime: string, endTime: string) {
    const appointmentDate = appointment.appointmentDate || selectedDate;
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
      .then(() => refreshCalendarOnly(session, appointmentDate))
      .catch((error) => {
        Alert.alert(t.editVisit, error instanceof Error ? error.message : t.editVisit);
        revalidateWorkspace(appointmentDate);
      });
    return true;
  }

  function openVisitComposerAfterService(service: ServiceRecord) {
    const startTime = getRoundedTime(10);
    setSelectedDate(selectedDate);
    setActiveTab("calendar");
    setVisitDraft({
      ...createDefaultVisitDraft(selectedDate, startTime),
      serviceId: service.id,
      items: [createVisitServiceDraft(startTime, service, language)],
    });
    setVisitComposerOpen(true);
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
      .then(() => refreshCalendarOnly(session, date))
      .catch((error) => {
        Alert.alert(label, error instanceof Error ? error.message : label);
        revalidateWorkspace(date);
      });
  }

  async function createService() {
    if (!serviceDraft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }
    const isFirstService = !workspace?.services.length;

    const optimisticService: ServiceRecord = {
      id: createLocalId("service"),
      name: serviceDraft.name.trim(),
      localizedName: {
        ru: serviceDraft.name.trim(),
        uk: serviceDraft.name.trim(),
        en: serviceDraft.name.trim(),
      },
      category: serviceDraft.category.trim() || DEFAULT_SERVICE_CATEGORY,
      durationMinutes: Number(serviceDraft.durationMinutes || 60),
      price: Number(serviceDraft.price || 0),
      color: serviceDraft.color || SERVICE_COLORS[0],
      source: "custom",
    };
    mergeWorkspaceServices((services) => [optimisticService, ...services]);
    setServiceDraft({ name: "", category: serviceDraft.category || DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
    if (isFirstService) {
      openVisitComposerAfterService(optimisticService);
    }
    void apiFetch("/api/mobile/pro/services", {
        method: "POST",
        body: JSON.stringify({
          name: optimisticService.name,
          category: optimisticService.category,
          durationMinutes: optimisticService.durationMinutes,
          price: optimisticService.price,
          color: optimisticService.color,
          source: "custom",
        }),
      })
      .then(() => refreshAll(session, selectedDate, { silent: true }))
      .catch((error) => {
        Alert.alert(t.addService, error instanceof Error ? error.message : t.addService);
        revalidateWorkspace();
      });
    return true;
  }

  async function updateService(serviceId: string, draft: ServiceDraftState) {
    if (!draft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    const updatedService: ServiceRecord = {
      id: serviceId,
      name: draft.name.trim(),
      localizedName: {
        ru: draft.name.trim(),
        uk: draft.name.trim(),
        en: draft.name.trim(),
      },
      category: draft.category.trim() || DEFAULT_SERVICE_CATEGORY,
      durationMinutes: Number(draft.durationMinutes || 60),
      price: Number(draft.price || 0),
      color: draft.color || SERVICE_COLORS[0],
    };
    mergeWorkspaceServices((services) => services.map((service) => (service.id === serviceId ? { ...service, ...updatedService } : service)));
    void apiFetch("/api/mobile/pro/services", {
        method: "PATCH",
        body: JSON.stringify({
          serviceId,
          name: updatedService.name,
          category: updatedService.category,
          durationMinutes: updatedService.durationMinutes,
          price: updatedService.price,
          color: updatedService.color,
        }),
      })
      .then(() => refreshAll(session, selectedDate, { silent: true }))
      .catch((error) => {
        Alert.alert(t.editService, error instanceof Error ? error.message : t.editService);
        revalidateWorkspace();
      });
    return true;
  }

  async function addCatalogService(service: ServiceTemplateRecord & { category: string }) {
    const key = getServiceIdentityKey(service);
    if (!key) return;
    if (hasServiceOrPendingSave(service, key)) return;
    const isFirstService = !workspace?.services.length;
    const optimisticService: ServiceRecord = {
      id: createLocalId("service"),
      name: service.name,
      localizedName: service.localizedName,
      category: service.category || DEFAULT_SERVICE_CATEGORY,
      durationMinutes: Number(service.durationMinutes || 60),
      price: Number(service.price || 0),
      color: SERVICE_COLORS[((workspace?.services.length || 0) + pendingServiceSavesRef.current.size) % SERVICE_COLORS.length],
      source: "catalog",
    };
    const pendingSave: PendingServiceSave = {
      key,
      optimisticService,
      payload: {
        name: optimisticService.name,
        category: optimisticService.category || DEFAULT_SERVICE_CATEGORY,
        durationMinutes: optimisticService.durationMinutes || 60,
        price: optimisticService.price,
        color: optimisticService.color || SERVICE_COLORS[0],
        source: "catalog",
      },
      attempts: 0,
    };
    pendingServiceSavesRef.current.set(key, pendingSave);
    mergeWorkspaceServices((services) => (services.some((item) => serviceMatchesPending(item, pendingSave)) ? services : [optimisticService, ...services]));
    if (isFirstService) {
      openVisitComposerAfterService(optimisticService);
    }
    scheduleServiceSaveFlush();
  }

  async function saveStaffSchedule(
    member: StaffMemberRecord,
    workSchedule: WorkScheduleRecord,
    customSchedule: Record<string, WorkDayScheduleRecord> = member.membership.customSchedule || {},
    workScheduleMode: "fixed" | "flexible" = member.membership.workScheduleMode || "fixed"
  ) {
    setBusy(true);
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
      await refreshAll();
      return true;
    } catch (error) {
      Alert.alert(t.staffSchedule, error instanceof Error ? error.message : t.staffSchedule);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function removeService(serviceId: string) {
    mergeWorkspaceServices((services) => services.filter((service) => service.id !== serviceId));
    void apiFetch(`/api/mobile/pro/services?serviceId=${encodeURIComponent(serviceId)}`, { method: "DELETE" })
      .then(() => refreshAll(session, selectedDate, { silent: true }))
      .catch((error) => {
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
      .then(() => refreshAll(session, selectedDate, { silent: true }))
      .catch((error) => {
        Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
        revalidateWorkspace();
      });
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
          setLanguage={setLanguage}
          session={session}
          workspace={workspace}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiFetch={apiFetch}
          onRefreshWorkspace={() => refreshAll()}
          onOpenNotification={(item) => {
            setActiveTab("calendar");
            setSelectedDate(item.appointmentDate);
          }}
          onOpenSettingsSection={openSettingsSection}
          onSignOut={signOut}
        />

        {activeTab === "calendar" ? (
          <CalendarTab
            t={t}
            language={language}
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
            onOpenServices={() => setActiveTab("services")}
            onOpenSchedule={() => openSettingsSection("schedule")}
            busy={busy}
            refreshing={refreshing}
            onRefresh={() => refreshAll()}
            composerOpen={visitComposerOpen}
            setComposerOpen={setVisitComposerOpen}
            loadCalendarDays={loadCalendarDays}
          />
        ) : (
          <ScrollView
            style={styles.workspaceScroll}
            contentContainerStyle={styles.workspaceContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refreshAll()} tintColor="#7C3AED" />}
            showsVerticalScrollIndicator={false}
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
              />
            ) : null}
            {activeTab === "clients" ? (
              hasPremium ? (
                <ClientsTab
                  t={t}
                  clients={clients}
                  draft={clientDraft}
                  setDraft={setClientDraft}
                  onCreate={createClient}
                  onCreateVisit={() => {
                    setActiveTab("calendar");
                    setVisitDraft({
                      ...createDefaultVisitDraft(selectedDate, getRoundedTime(10)),
                      items: [{ ...createVisitServiceDraft(getRoundedTime(10)), serviceName: t.withoutService }],
                    });
                    setVisitComposerOpen(true);
                  }}
                  busy={busy}
                />
              ) : (
                <PremiumFeatureGate t={t} feature="clients" professional={workspace?.professional} onUpgrade={() => openSettingsSection("general")} />
              )
            ) : null}
            {activeTab === "staff" ? (
              hasPremium ? (
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
              ) : (
                <PremiumFeatureGate t={t} feature="staff" professional={workspace?.professional} onUpgrade={() => openSettingsSection("general")} />
              )
            ) : null}
            {activeTab === "settings" ? (
              <SettingsTab
                t={t}
                language={language}
                setLanguage={setLanguage}
                workspace={workspace}
                staff={staffSnapshot}
                apiFetch={apiFetch}
                onRefreshWorkspace={() => refreshAll(session, selectedDate)}
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
        )}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} lockedTabs={hasPremium ? [] : PREMIUM_LOCKED_TABS} t={t} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={[styles.authContent, mode === "register" && styles.authContentWithStickyFooter]}
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
	              googleEnabled={Boolean(googleConfigured)}
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
                <Field label={t.firstName} value={registerForm.firstName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, firstName: value }))} />
                <Field label={t.email} value={registerForm.email} onChangeText={(value) => setRegisterForm((current) => ({ ...current, email: value }))} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" />
                <Field label={t.companyName} value={registerForm.companyName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, companyName: value }))} />
                <RegisterPhoneField
                  label={t.phone}
                  selectedCountry={registerPhoneCountry}
                  language={language}
                  t={t}
                  value={getLocalPhoneNumber(registerForm.phone, registerPhoneCountry.callingCode)}
                  onChangeText={(value) => setRegisterForm((current) => ({ ...current, phone: getLocalPhoneNumber(value, registerPhoneCountry.callingCode) }))}
                  onOpenPicker={() => setPhoneCountryPickerOpen(true)}
                />
                <Field label={t.password} hint={t.passwordHint} value={registerForm.password} onChangeText={(value) => setRegisterForm((current) => ({ ...current, password: value }))} secureTextEntry />
                <Pressable style={styles.authDetailsToggle} onPress={() => setRegisterDetailsOpen((current) => !current)}>
                  <Text style={styles.authDetailsToggleText}>{t.optionalDetails}</Text>
                  <Ionicons name={registerDetailsOpen ? "chevron-up" : "chevron-down"} size={18} color="#6D4AFF" />
                </Pressable>
                {registerDetailsOpen ? (
                  <View style={styles.authOptionalBlock}>
                    <Field label={t.lastName} value={registerForm.lastName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, lastName: value }))} />
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
    const addMember = (member: CalendarMemberView) => {
      if (!member.id) return;
      map.set(member.id, { ...map.get(member.id), ...member, name: member.name.trim() || t.employee });
    };
    for (const member of makeStaffMembers(staff, workspace, t)) {
      addMember({
        id: member.professional.id,
        name: makeStaffMemberName(member, t.employee),
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
        name: `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.role || t.employee,
        avatarUrl: member.avatarUrl,
        role: member.role || t.employee,
        scope: member.scope,
        isViewer: member.isViewer,
      });
    }
    for (const member of calendar?.memberCalendars || []) {
      addMember({
        id: member.professionalId,
        name: `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.role || t.employee,
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
        name: `${workspace.professional.firstName || ""} ${workspace.professional.lastName || ""}`.trim() || "Timviz",
        avatarUrl: workspace.professional.avatarUrl,
        role: workspace.membership?.role || t.owner,
        scope: workspace.membership?.scope === "member" ? "member" : "owner",
        isViewer: true,
        memberSchedule: workspace.memberSchedule,
      });
    }
    return Array.from(map.values());
  }, [calendar?.memberCalendars, calendar?.teamMembers, staff, t, workspace]);
  const selectedMembers = calendarMembers.filter((member) => selectedMemberIds.includes(member.id));
  const primaryMember = selectedMembers[0] || calendarMembers[0] || null;
  const visibleCalendarMembers = selectedMembers.length ? selectedMembers : calendarMembers.slice(0, 1);
  const dayMemberColumnWidth = Math.floor(
    visibleCalendarMembers.length > 1
      ? Math.max(164, (screenWidth - CALENDAR_TIME_AXIS_WIDTH) / visibleCalendarMembers.length)
      : Math.max(280, screenWidth - CALENDAR_TIME_AXIS_WIDTH)
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
  const emptyCalendarPrimaryLabel = hasServices ? t.createAppointmentButton || t.addFirstVisit : `+ ${t.addService}`;
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
    openComposerAt(getRoundedTime(10), selectedDate, primaryMember?.id);
  }

  function openEmptyCalendarSecondaryAction() {
    setNoServicesHelper({ date: selectedDate, time: getRoundedTime(10), targetProfessionalId: primaryMember?.id, source: "time" });
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

  function getLocalizedAppointmentServiceName(appointment: Pick<AppointmentRecord, "serviceName">) {
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

  function markVisitItemWithoutService(index = editingServiceIndex) {
    const draftItems = Array.isArray(visitDraft.items) && visitDraft.items.length ? visitDraft.items : [createVisitServiceDraft(visitDraft.startTime || "09:00")];
    const currentItem = draftItems[index] || draftItems[0] || createVisitServiceDraft(visitDraft.startTime || "09:00");
    const startTime = safeText(currentItem.startTime) || visitDraft.startTime || getRoundedTime(10);
    const fallbackEndTime = addMinutes(startTime, Math.max(5, currentItem.durationMinutes || 15));
    const endTime = isValidTime(safeText(currentItem.endTime)) && timeToMinutes(currentItem.endTime) > timeToMinutes(startTime) ? currentItem.endTime : fallbackEndTime;
    updateVisitItem(index, {
      serviceId: "",
      serviceName: t.withoutService,
      startTime,
      endTime,
      durationMinutes: Math.max(5, timeToMinutes(endTime) - timeToMinutes(startTime)),
      priceAmount: Number(currentItem.priceAmount || 0),
    });
    setServiceQuery("");
    setVisitPickerMode(null);
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

  function openServicesFromCalendar() {
    setNoServicesHelper(null);
    setTimeAction(null);
    setVisitPickerMode(null);
    setComposerOpen(false);
    setEditingAppointment(null);
    onOpenServices();
  }

  function continueWithoutServiceFromHelper() {
    const helper = noServicesHelper;
    setNoServicesHelper(null);
    if (helper?.source === "visit") {
      markVisitItemWithoutService(editingServiceIndex);
      return;
    }
    const action = helper || timeAction;
    setTimeAction(null);
    if (action) {
      openComposerAt(action.time, action.date, action.targetProfessionalId, { withoutService: true });
    }
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

  function openComposerAt(time: string, date = selectedDate, targetProfessionalId = primaryMember?.id, options: { withoutService?: boolean } = {}) {
    if (!hasServices && !options.withoutService) {
      setNoServicesHelper({ date, time, targetProfessionalId, source: "time" });
      return;
    }
    setEditingAppointment(null);
    setSelectedDate(date);
    const nextDraft = createDefaultVisitDraft(date, time);
    if (options.withoutService) {
      nextDraft.items = [{ ...createVisitServiceDraft(time), serviceName: t.withoutService }];
    }
    setVisitDraft({ ...nextDraft, targetProfessionalId });
    setComposerOpen(true);
  }

  function openAppointmentEditor(appointment: AppointmentRecord) {
    const matchedService = services.find((service) => serviceNameMatches(service, appointment.serviceName)) || services[0];
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
          serviceName: getServiceDisplayName(matchedService, language) || appointment.serviceName,
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
                          <Text style={styles.teamPickerBadgeText}>{selectedMembers.length || 1}</Text>
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
                          <MemberAvatar member={member} size={34} />
                          <Text style={styles.masterName} numberOfLines={1}>{member.name}</Text>
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
          onCreateAt={(date, memberId) => openComposerAt("09:00", date, memberId)}
        />
      )}

      {!(composerOpen || blockedTimeDraft || timeAction || noServicesHelper || memberPickerOpen || viewMenuOpen) ? (
        <Pressable
          style={({ pressed }) => [styles.fabButton, pressed && styles.fabButtonPressed]}
          onPress={() => {
            setTimeAction({ date: selectedDate, time: getRoundedTime(10), targetProfessionalId: primaryMember?.id });
          }}
        >
          <Ionicons name="add" size={31} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Modal transparent visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalBackdrop}>
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
              <>
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
                <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
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
                </ScrollView>
              </>
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
                              <Text style={styles.firstRunPrimaryText}>{t.createServiceAction}</Text>
                            </Pressable>
                            <Pressable style={styles.firstRunSecondaryButton} onPress={() => markVisitItemWithoutService(editingServiceIndex)}>
                              <Text style={styles.firstRunSecondaryText}>{t.bookingWithoutService}</Text>
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
                        <Text style={styles.firstRunPrimaryText}>{t.createServiceAction}</Text>
                      </Pressable>
                      <Pressable style={styles.firstRunSecondaryButton} onPress={() => markVisitItemWithoutService(editingServiceIndex)}>
                        <Text style={styles.firstRunSecondaryText}>{t.bookingWithoutService}</Text>
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
        </View>
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
                  onPress={() => {
                    setTimeAction(null);
                    onOpenServices();
                  }}
                >
                  <Text style={styles.firstRunPrimaryText}>{t.addService}</Text>
                </Pressable>
                <Pressable
                  style={[styles.firstRunSecondaryButton, styles.noServicesFullButton]}
                  onPress={() => {
                    if (!timeAction) return;
                    const action = timeAction;
                    setTimeAction(null);
                    openComposerAt(action.time, action.date, action.targetProfessionalId, { withoutService: true });
                  }}
                >
                  <Text style={styles.firstRunSecondaryText}>{t.createVisitWithoutService}</Text>
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

      <Modal transparent visible={Boolean(noServicesHelper)} animationType="fade" onRequestClose={() => setNoServicesHelper(null)}>
        <Pressable style={styles.timeActionBackdrop} onPress={() => setNoServicesHelper(null)}>
          <View style={styles.timeActionMenu}>
            <View style={styles.noServicesActionSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.firstRunIcon}>
                <Ionicons name="pricetag-outline" size={22} color="#6D4AFF" />
              </View>
              <Text style={styles.noServicesActionTitle}>{t.onboardingStartTitle}</Text>
              <Text style={styles.noServicesActionText}>{t.onboardingStartText}</Text>
              <Pressable style={[styles.firstRunPrimaryButton, styles.noServicesFullButton]} onPress={openServicesFromCalendar}>
                <Text style={styles.firstRunPrimaryText}>{t.addService}</Text>
              </Pressable>
              <Pressable style={[styles.firstRunSecondaryButton, styles.noServicesFullButton]} onPress={continueWithoutServiceFromHelper}>
                <Text style={styles.firstRunSecondaryText}>{t.createVisitWithoutService}</Text>
              </Pressable>
              <Pressable style={styles.noServicesCancelButton} onPress={() => setNoServicesHelper(null)}>
                <Text style={styles.noServicesCancelText}>{t.cancel}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(blockedTimeDraft)} animationType="slide" onRequestClose={() => setBlockedTimeDraft(null)}>
        <View style={styles.modalBackdrop}>
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
        </View>
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
    .join("") || "T";
  return (
    <View style={[styles.masterAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={[styles.memberAvatarImage, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.masterAvatarText, { fontSize: Math.max(12, size / 2.2) }]}>{initials}</Text>
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
            <Text style={[styles.hourText, !showLabel && styles.hourTextHidden]}>{showLabel ? String(hour).padStart(2, "0") : ""}</Text>
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
                      <View key={`${appointment.id}-${appointment.startTime}-${index}`} style={[styles.monthVisitDot, { backgroundColor: index % 3 === 0 ? "#A78BFA" : index % 3 === 1 ? "#7DD3FC" : "#86EFAC" }]} />
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
                    const title = blocked ? appointment.serviceName || t.unavailableTime : appointment.customerName || appointment.serviceName || t.customer;
                    const subtitle = blocked ? t.unavailableTime : appointment.serviceName || member?.name || "";
                    return (
                      <Pressable
                        key={`${appointment.id}-${appointment.startTime}-${index}`}
                        style={[styles.mobileWeekAppointmentPill, blocked && styles.mobileWeekAppointmentPillBlocked]}
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
                    <View key={appointment.id} style={[styles.teamOverviewAppointmentBar, { backgroundColor: index % 3 === 0 ? "#BFEDE4" : index % 3 === 1 ? "#FFD4C8" : "#D9F5BE" }]}>
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
        const color = index % 4 === 0 ? "#FFF0EA" : index % 4 === 1 ? "#FFF6D7" : index % 4 === 2 ? "#E6F7FA" : "#EAF8DF";
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
              },
            ]}
            onPress={() => onAppointmentPress(appointment)}
            onLongPress={() => onAppointmentMove(appointment)}
          >
            <Text style={[styles.appointmentTime, isCompactCard && styles.appointmentTimeTight, isVeryTightCard && styles.appointmentTimeVeryTight]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.78}>
              {timeLabel}
            </Text>
            <Text style={[styles.appointmentClient, isCompactCard && styles.appointmentClientTight, isVeryTightCard && styles.appointmentClientVeryTight]} numberOfLines={1} ellipsizeMode="tail">
              {appointment.customerName || t.customer}
            </Text>
            <Text style={[styles.appointmentService, isCompactCard && styles.appointmentServiceTight, isVeryTightCard && styles.appointmentServiceVeryTight]} numberOfLines={1} ellipsizeMode="tail">
              {formatAppointmentServiceName ? formatAppointmentServiceName(appointment) : appointment.serviceName}
            </Text>
            <Text style={styles.appointmentPrice}>{formatMoney(appointment.priceAmount, currency)}</Text>
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
  onOpenNotification,
  onOpenSettingsSection,
  onSignOut,
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
  onOpenNotification: (item: MobileNotificationRecord) => void;
  onOpenSettingsSection: (section?: MobileSettingsSection) => void;
  onSignOut: () => void;
}) {
  const title = activeTab === "calendar" ? t.calendarHeaderTitle : t[activeTab];
  const [panel, setPanel] = useState<"setup" | "share" | "support" | "notifications" | "account" | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportTicketId, setSupportTicketId] = useState("");
  const [supportStatus, setSupportStatus] = useState("");
  const [notifications, setNotifications] = useState<MobileNotificationsPayload>({});
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [busy, setBusy] = useState(false);
  const publicBookingUrl = workspace?.business.publicBookingUrl || "";
  const onlineBookingEnabled = workspace?.business.allowOnlineBooking === true;
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
  const pendingCount = (notifications.pendingOnlineBookings?.length || 0) + (notifications.pendingJoinRequests?.length || 0);

  async function openPanel(nextPanel: typeof panel) {
    setPanel(nextPanel);
    if (nextPanel === "notifications") {
      setLoadingNotifications(true);
      try {
        const payload = await apiFetch("/api/mobile/pro/calendar?mode=notifications");
        setNotifications(payload || {});
      } catch {
        setNotifications({});
      } finally {
        setLoadingNotifications(false);
      }
    }
  }

  async function togglePublicBooking() {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ business: { allowOnlineBooking: !onlineBookingEnabled } }),
      });
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.bookingPage, error instanceof Error ? error.message : t.supportFailed);
    } finally {
      setBusy(false);
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

  async function sendSupportMessage() {
    const message = supportMessage.trim();
    if (!message) return;
    setBusy(true);
    setSupportStatus("");
    try {
      const payload = await apiFetch("/api/mobile/pro/support", {
        method: "POST",
        body: JSON.stringify({ message, ticketId: supportTicketId, language, page: "mobile-app" }),
      });
      setSupportTicketId(payload?.ticketId || supportTicketId);
      setSupportMessage("");
      setSupportStatus(t.supportSent);
    } catch {
      setSupportStatus(t.supportFailed);
    } finally {
      setBusy(false);
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
                  {panel === "setup" ? (setupComplete ? t.setupCompleteTitle : t.setupAssistant) : panel === "share" ? t.bookingPage : panel === "support" ? t.supportTitle : panel === "notifications" ? t.reminders : t.accountMenu || t.settings}
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
                <Pressable style={styles.shareToggleRow} onPress={togglePublicBooking} disabled={busy}>
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
                  <Pressable style={styles.headerPrimaryButton} onPress={shareBookingPage} disabled={!publicBookingUrl}>
                    <Text style={styles.headerPrimaryButtonText}>{t.sharePage}</Text>
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
                  <Text style={styles.supportBubble}>{t.supportGreeting}</Text>
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
                  <Text style={styles.notificationBadgeText}>{notifications.pendingOnlineBookings?.length || 0}</Text>
                </View>
                {loadingNotifications ? <ActivityIndicator color="#6D4AFF" /> : null}
                {!loadingNotifications && !(notifications.pendingOnlineBookings?.length || notifications.pendingJoinRequests?.length) ? (
                  <View style={styles.notificationEmptyCard}>
                    <Text style={styles.notificationCardTitle}>{t.reminders}</Text>
                    <Text style={styles.clientOptionCaption}>{t.notificationEmpty}</Text>
                  </View>
                ) : null}
                {(notifications.pendingOnlineBookings || []).map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    t={t}
                    language={language}
                    services={workspace?.services || []}
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
              <View style={styles.headerPanelBody}>
                <View style={styles.accountMenuHeader}>
                  <View style={styles.accountAvatarLarge}>
                    <Text style={styles.accountAvatarLargeText}>{session.displayName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.accountName}>{session.displayName}</Text>
                    <Text style={styles.clientOptionCaption}>{workspace?.business.name || session.email}</Text>
                  </View>
                </View>
                <Pressable style={styles.accountMenuItem} onPress={() => { close(); onOpenSettingsSection("general"); }}>
                  <Text style={styles.accountMenuItemText}>{t.myProfile}</Text>
                </Pressable>
                <Pressable style={styles.accountMenuItem} onPress={() => { close(); onOpenSettingsSection("general"); }}>
                  <Text style={styles.accountMenuItemText}>{t.personalSettings}</Text>
                </Pressable>
                <Pressable style={styles.accountMenuItem} onPress={() => setPanel("support")}>
                  <Text style={styles.accountMenuItemText}>{t.helpSupport}</Text>
                </Pressable>
                <Text style={styles.accountMenuLabel}>{t.language}</Text>
                <LanguageSwitch language={language} setLanguage={setLanguage} />
                <Pressable style={styles.accountLogout} onPress={() => { close(); void onSignOut(); }}>
                  <Text style={styles.accountLogoutText}>{t.signOut}</Text>
                </Pressable>
              </View>
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
        <AppIconButton icon={setupMissingCount ? "rocket" : "checkmark"} active={panel === "setup"} badge={setupMissingCount} badgeTone="red" onPress={() => void openPanel("setup")} />
        {activeTab !== "calendar" ? (
          <>
            <AppIconButton icon="cloud-upload-outline" active={panel === "share"} onPress={() => void openPanel("share")} />
            <AppIconButton icon="chatbubble-ellipses-outline" tone="cyan" active={panel === "support"} onPress={() => void openPanel("support")} />
          </>
        ) : null}
        <AppIconButton icon="notifications-outline" active={panel === "notifications"} badge={pendingCount} onPress={() => void openPanel("notifications")} />
        <Pressable style={styles.profilePill} onPress={() => void openPanel("account")}>
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarText}>{session.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Ionicons name="chevron-down" size={12} color="#64748B" />
        </Pressable>
      </View>
      {renderPanel()}
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

function NotificationCard({
  item,
  t,
  language,
  services,
  onPress,
}: {
  item: MobileNotificationRecord;
  t: Record<string, string>;
  language: AppLanguage;
  services: ServiceRecord[];
  onPress?: () => void;
}) {
  const statusText = item.status === "cancelled" ? t.statusCancelled : item.status === "confirmed" ? t.statusConfirmed : t.statusPending;
  const serviceName = getServiceDisplayName(services.find((service) => serviceNameMatches(service, item.serviceName)), language) || item.serviceName;
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
}) {
  const services = workspace?.services || [];
  const currency = workspace?.professional.currency;
  const [mode, setMode] = useState<"mine" | "custom" | "catalog">("mine");
  const [editId, setEditId] = useState("");
  const [editDraft, setEditDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [customCategory, setCustomCategory] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [activeCatalogCategory, setActiveCatalogCategory] = useState("");

  const categories = useMemo(() => {
    const names = [
      ...services.map((service) => service.category || ""),
      ...catalog.map((item) => item.title),
      draft.category,
      customCategory,
      DEFAULT_SERVICE_CATEGORY,
    ]
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [catalog, customCategory, draft.category, services]);

  const currentCatalogCategory = activeCatalogCategory || catalog[0]?.title || categories[0] || DEFAULT_SERVICE_CATEGORY;
  const catalogServices = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return catalog
      .filter((group) => query || group.title === currentCatalogCategory)
      .flatMap((group) => [...(group.topSuggestions || []), ...(group.popularServices || [])].map((service) => ({ ...service, category: group.title })))
      .filter((service) => !query || getServiceSearchText(service).includes(query));
  }, [catalog, catalogQuery, currentCatalogCategory]);
  const quickServiceSuggestions = useMemo(() => {
    const catalogSuggestions = catalog
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
  }, [catalog, language, t]);

  function startCustomServiceFromSuggestion(item?: { name?: string; category?: string; durationMinutes?: string; price?: string }) {
    setDraft({
      ...draft,
      name: item?.name || draft.name,
      category: item?.category || draft.category || DEFAULT_SERVICE_CATEGORY,
      durationMinutes: item?.durationMinutes || draft.durationMinutes || "60",
      price: item?.price || draft.price || "0",
    });
    setMode("custom");
  }

  function startEdit(service: ServiceRecord) {
    setEditId(service.id);
    setEditDraft({
      name: service.name,
      category: service.category || DEFAULT_SERVICE_CATEGORY,
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
    setDraft({ ...draft, category: value });
    setActiveCatalogCategory(value);
    setCustomCategory("");
  }

  function serviceExists(serviceName: string) {
    return services.some((service) => serviceNameMatches(service, serviceName));
  }

  async function saveCustomService() {
    const created = await onCreate();
    if (created) {
      setMode("mine");
    }
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
            <Pressable key={item.id} style={[styles.servicesModeButton, active && styles.servicesModeButtonActive]} onPress={() => setMode(item.id as "mine" | "custom" | "catalog")}>
              <Text style={[styles.servicesModeText, active && styles.servicesModeTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === "mine" ? (
        <Panel title={t.yourServices}>
          {services.length ? (
            <>
              <Text style={styles.compactHelperText}>{t.myServicesHint}</Text>
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
          <Field label={t.serviceName} value={draft.name} onChangeText={(value) => setDraft({ ...draft, name: value })} />
          <Text style={styles.label}>{t.selectedCategory}</Text>
          <CategoryChips t={t} language={language} categories={categories} selected={draft.category} onSelect={(category) => setDraft({ ...draft, category })} />
          <View style={styles.categoryAddRow}>
            <Field label={t.newCategory} value={customCategory} onChangeText={setCustomCategory} />
            <Pressable style={styles.categoryAddButton} onPress={addCustomCategory}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.twoColumns}>
            <Field label={t.duration} value={draft.durationMinutes} onChangeText={(value) => setDraft({ ...draft, durationMinutes: value })} keyboardType="number-pad" />
            <Field label={t.price} value={draft.price} onChangeText={(value) => setDraft({ ...draft, price: value })} keyboardType="number-pad" />
          </View>
          <ColorSwatches value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
          <PrimaryButton label={t.addService} onPress={() => void saveCustomService()} disabled={busy} />
        </Panel>
      ) : null}

      {mode === "catalog" ? (
        <Panel title={t.generalCatalog}>
          <Field label={t.search} value={catalogQuery} onChangeText={setCatalogQuery} placeholder={t.searchService} />
          <CategoryChips t={t} language={language} categories={catalog.map((item) => item.title)} selected={currentCatalogCategory} onSelect={setActiveCatalogCategory} />
          {catalogServices.length ? (
            catalogServices.map((service) => {
              const exists = serviceExists(service.name);
              return (
                <Pressable key={`${service.category}-${service.name}`} style={[styles.catalogServiceCard, exists && styles.catalogServiceCardActive]} onPress={() => !exists && onAddCatalog(service)} disabled={busy || exists}>
                  <View style={styles.serviceTextBlock}>
                    <Text style={styles.listTitle}>{getServiceDisplayName(service, language)}</Text>
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
  onSelect,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  const safeCategories = categories.length ? categories : [DEFAULT_SERVICE_CATEGORY];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicePicker}>
      {safeCategories.map((category) => {
        const active = category === selected;
        return (
          <Pressable key={category} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={() => onSelect(category)}>
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{localizeCatalogCategory(category, language, t)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
  onCreateVisit,
  busy,
}: {
  t: Record<string, string>;
  clients: ClientRecord[];
  draft: { firstName: string; lastName: string; phone: string; email: string };
  setDraft: (draft: { firstName: string; lastName: string; phone: string; email: string }) => void;
  onCreate: () => void;
  onCreateVisit: () => void;
  busy: boolean;
}) {
  const [clientFormOpen, setClientFormOpen] = useState(false);

  function handleCreateClient() {
    if (!draft.firstName.trim() && !draft.phone.trim()) {
      onCreate();
      return;
    }
    onCreate();
    setClientFormOpen(false);
  }

  return (
    <View style={styles.sectionStack}>
      <Panel title={t.clients}>
        {clients.length ? (
          <Pressable style={styles.compactAddRow} onPress={() => setClientFormOpen(true)}>
            <View style={styles.compactAddIcon}>
              <Ionicons name="add" size={18} color="#6D4AFF" />
            </View>
            <Text style={styles.compactAddText}>{t.addClient}</Text>
          </Pressable>
        ) : null}
        {clients.length ? (
          clients.map((client) => (
            <View key={client.id} style={styles.listItem}>
              <View>
                <Text style={styles.listTitle} numberOfLines={1}>{client.fullName || client.phone}</Text>
                <Text style={styles.listCaption} numberOfLines={1}>{client.phone || client.email}</Text>
              </View>
              <Text style={styles.badgeText}>{client.visitsCount}</Text>
            </View>
          ))
        ) : (
          <View style={styles.firstRunCard}>
            <View style={styles.firstRunIcon}>
              <Ionicons name="people-outline" size={22} color="#6D4AFF" />
            </View>
            <Text style={styles.firstRunTitle}>{t.clientsEmptyTitle}</Text>
            <Text style={styles.firstRunText}>{t.clientsEmptyText}</Text>
            <View style={styles.firstRunActions}>
              <Pressable style={styles.firstRunPrimaryButton} onPress={() => setClientFormOpen(true)}>
                <Text style={styles.firstRunPrimaryText}>{t.addClient}</Text>
              </Pressable>
              <Pressable style={styles.firstRunSecondaryButton} onPress={onCreateVisit}>
                <Text style={styles.firstRunSecondaryText}>{t.newVisit}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Panel>
      <Pressable style={styles.screenFabMini} onPress={() => setClientFormOpen(true)}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </Pressable>
      <Modal transparent visible={clientFormOpen} animationType="slide" onRequestClose={() => setClientFormOpen(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.clientFormSheetWrap}>
            <View style={styles.visitSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t.addClient}</Text>
                <Pressable style={styles.sheetClose} onPress={() => setClientFormOpen(false)}>
                  <Ionicons name="close" size={22} color="#0F172A" />
                </Pressable>
              </View>
              <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => setDraft({ ...draft, firstName: value })} />
              <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => setDraft({ ...draft, lastName: value })} />
              <Field label={t.phone} value={draft.phone} onChangeText={(value) => setDraft({ ...draft, phone: value })} keyboardType="phone-pad" />
              <Field label={t.email} value={draft.email} onChangeText={(value) => setDraft({ ...draft, email: value })} keyboardType="email-address" autoCapitalize="none" />
              <PrimaryButton label={t.addClient} onPress={handleCreateClient} disabled={busy} />
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
  return `${member.professional.firstName || ""} ${member.professional.lastName || ""}`.trim() || member.professional.email || fallback;
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
  onSaveSchedule: (member: StaffMemberRecord, workSchedule: WorkScheduleRecord, customSchedule?: Record<string, WorkDayScheduleRecord>, mode?: "fixed" | "flexible") => Promise<boolean>;
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
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState("");
  const [draft, setDraft] = useState({ fullName: "", role: t.employee, email: "", phone: "", sendInvitation: false });
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
    const parsed = splitStaffFullName(draft.fullName);
    if (!parsed.firstName) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }
    const ok = await staffAction({
      action: "createMember",
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: draft.role,
      email: draft.email,
      phone: draft.phone,
      sendInvitation: draft.sendInvitation,
    });
    if (ok) {
      setDraft({ fullName: "", role: t.employee, email: "", phone: "", sendInvitation: false });
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

  async function resolveJoinRequest(requestId: string, requestAction: "approve" | "reject") {
    await staffAction({ action: "resolveJoinRequest", requestId, requestAction });
  }

  return (
    <View style={styles.sectionStack}>
      <Panel title={t.teamMembers}>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.staffSchedule} onPress={onOpenSchedule} />
          <PrimaryButton label={addOpen ? t.cancel : t.addMember} onPress={() => setAddOpen(!addOpen)} disabled={busy || saving} />
        </View>
      </Panel>

      {addOpen ? (
        <Panel title={t.addMember}>
          <Field label={t.fullName} value={draft.fullName} onChangeText={(value) => setDraft({ ...draft, fullName: value })} />
          <Field label={t.role} value={draft.role} onChangeText={(value) => setDraft({ ...draft, role: value })} />
          <Field label={t.email} value={draft.email} onChangeText={(value) => setDraft({ ...draft, email: value })} keyboardType="email-address" autoCapitalize="none" />
          <Field label={t.phone} value={draft.phone} onChangeText={(value) => setDraft({ ...draft, phone: value })} keyboardType="phone-pad" />
          <Pressable style={styles.staffToggleRow} onPress={() => setDraft({ ...draft, sendInvitation: !draft.sendInvitation })}>
            <Text style={styles.settingsCardTitle}>{t.sendInvite}</Text>
            <View style={[styles.mobileSwitch, draft.sendInvitation && styles.mobileSwitchActive]}>
              <View style={[styles.mobileSwitchThumb, draft.sendInvitation && styles.mobileSwitchThumbActive]} />
            </View>
          </Pressable>
          <PrimaryButton label={t.addMember} onPress={() => void createMember()} disabled={busy || saving} />
        </Panel>
      ) : null}

      {members.map((member) => {
        const editing = editId === member.professional.id;
        const name = makeStaffMemberName(member, t.employee);
        const isOwner = member.membership.scope === "owner";
        const access = member.workspaceAccess === "owner" ? t.owner : member.workspaceAccess === "active" ? t.connected : member.workspaceAccess === "invited" ? t.pendingInvites : t.notConnected;
        return (
          <View key={member.professional.id} style={styles.staffMemberCard}>
            {editing ? (
              <View style={styles.sectionStack}>
                <Field label={t.fullName} value={editDraft.fullName} onChangeText={(value) => setEditDraft({ ...editDraft, fullName: value })} />
                <Field label={t.role} value={editDraft.role} onChangeText={(value) => setEditDraft({ ...editDraft, role: value })} editable={!isOwner} />
                <Field label={t.email} value={editDraft.email} onChangeText={(value) => setEditDraft({ ...editDraft, email: value })} keyboardType="email-address" autoCapitalize="none" editable={!isOwner} />
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
                  {!isOwner && member.pendingInvitation ? (
                    <SecondaryButton label={t.revokeInvite} onPress={() => void revokeInvitation(member.pendingInvitation?.id || "")} disabled={saving || busy} />
                  ) : !isOwner ? (
                    <SecondaryButton label={member.workspaceAccess === "invited" ? t.resendInvite : t.invite} onPress={() => void inviteMember(member)} disabled={saving || busy} />
                  ) : null}
                </View>
              </>
            )}
          </View>
        );
      })}

      <Panel title={t.joinRequests}>
        {staff?.joinRequests?.length ? (
          staff.joinRequests.map((request) => (
            <View key={request.id} style={styles.joinRequestCard}>
              <View>
                <Text style={styles.settingsMiniTitle}>{request.professional ? `${request.professional.firstName} ${request.professional.lastName}`.trim() || request.professional.email : t.empty}</Text>
                <Text style={styles.clientOptionCaption}>{request.professional?.email || request.professional?.phone || request.role}</Text>
              </View>
              <View style={styles.joinRequestActions}>
                <Pressable style={styles.joinRejectButton} onPress={() => void resolveJoinRequest(request.id, "reject")} disabled={saving}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                </Pressable>
                <Pressable style={styles.joinApproveButton} onPress={() => void resolveJoinRequest(request.id, "approve")} disabled={saving}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.noJoinRequests}</Text>
        )}
      </Panel>
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
  onSaveSchedule: (member: StaffMemberRecord, workSchedule: WorkScheduleRecord, customSchedule?: Record<string, WorkDayScheduleRecord>, mode?: "fixed" | "flexible") => Promise<boolean>;
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
  const [selectedMonthDates, setSelectedMonthDates] = useState<string[]>([]);
  const weekDates = getWeekDates(weekStart);
  const weekTitle = formatCalendarTitle("week", weekDates[0], language);
  const monthDates = getMonthGridDates(pickerMonth);
  const monthTitle = new Intl.DateTimeFormat(language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU", { month: "long", year: "numeric" }).format(new Date(`${pickerMonth}T12:00:00`));

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
  }, [selectedMember?.professional.id, weekStart]);

  function getDraftDay(key: string, date: string) {
    if (scheduleMode === "flexible") {
      return normalizeScheduleDay(customDraft[date] || selectedMember?.membership.customSchedule?.[date], date);
    }
    return normalizeScheduleDay(workDraft[key], date);
  }

  function setDaySchedule(key: string, date: string, next: WorkDayScheduleRecord) {
    if (scheduleMode === "flexible") {
      setCustomDraft({ ...customDraft, [date]: next });
      return;
    }
    setWorkDraft({ ...workDraft, [key]: next });
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

  function applyToWeekdays() {
    const monday = getDraftDay("monday", weekDates[0]);
    if (scheduleMode === "flexible") {
      const next = { ...customDraft };
      weekDates.slice(0, 5).forEach((date) => {
        next[date] = { ...monday };
      });
      setCustomDraft(next);
      return;
    }
    const next = { ...workDraft };
    staffWeekKeys.slice(0, 5).forEach((key) => {
      next[key] = { ...monday };
    });
    setWorkDraft(next);
  }

  function clearWeek() {
    if (scheduleMode === "flexible") {
      const next = { ...customDraft };
      weekDates.forEach((date, index) => {
        const current = getDraftDay(staffWeekKeys[index], date);
        next[date] = serializeIntervalsToDay(false, getDayIntervalsRecord(current), current);
      });
      setCustomDraft(next);
      return;
    }
    const next = { ...workDraft };
    staffWeekKeys.forEach((key, index) => {
      const current = getDraftDay(key, weekDates[index]);
      next[key] = serializeIntervalsToDay(false, getDayIntervalsRecord(current), current);
    });
    setWorkDraft(next);
  }

  function toggleMonthDate(date: string) {
    const selected = selectedMonthDates.includes(date);
    if (selected) {
      setSelectedMonthDates((current) => current.filter((item) => item !== date));
      return;
    }

    const existing = customDraft[date] || selectedMember?.membership.customSchedule?.[date];
    if (!existing) {
      setCustomDraft((current) => ({
        ...current,
        [date]: serializeIntervalsToDay(true, [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ], getFallbackSchedule(date)),
      }));
    }
    setSelectedMonthDates((current) => [...current, date].sort());
  }

  function getMonthDraftDay(date: string) {
    return normalizeScheduleDay(customDraft[date] || selectedMember?.membership.customSchedule?.[date], date);
  }

  function setMonthDateSchedule(date: string, next: WorkDayScheduleRecord) {
    setCustomDraft((current) => ({ ...current, [date]: next }));
  }

  function updateMonthDateEnabled(date: string, enabled: boolean) {
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

  function validateMonthSelectionBeforeSave() {
    for (const date of selectedMonthDates) {
      const day = getMonthDraftDay(date);
      if (!day.enabled) continue;
      const validation = validateWorkIntervals(getDayIntervalsRecord(day));
      if (!validation.ok) {
        Alert.alert(t.staffSchedule, validation.reason === "overlap" ? t.overlappingIntervals : t.invalidIntervalRange);
        return false;
      }
    }

    return true;
  }

  function applyMonthSelection() {
    if (!selectedMonthDates.length) {
      Alert.alert(t.monthPlanner, t.selectedDaysHint);
      return;
    }
    if (!validateMonthSelectionBeforeSave()) {
      return;
    }
    const nextWeek = getWeekDates(selectedMonthDates[0])[0];
    setWeekStart(nextWeek);
    setCalendarOpen(false);
  }
  function validateScheduleBeforeSave() {
    if (!validateMonthSelectionBeforeSave()) {
      return false;
    }

    const daysToCheck = scheduleMode === "flexible"
      ? weekDates.map((date, index) => getDraftDay(staffWeekKeys[index], date))
      : staffWeekKeys.map((key, index) => getDraftDay(key, weekDates[index]));

    for (const day of daysToCheck) {
      if (!day.enabled) continue;
      const validation = validateWorkIntervals(getDayIntervalsRecord(day));
      if (!validation.ok) {
        Alert.alert(t.staffSchedule, validation.reason === "overlap" ? t.overlappingIntervals : t.invalidIntervalRange);
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
      </View>

      <View style={styles.staffWeekCard}>
        <View style={styles.staffCalendarControls}>
          <Pressable style={styles.dateButton} onPress={() => setWeekStart(shiftDate(weekStart, -7))}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>
          <Pressable style={styles.staffWeekPickerButton} onPress={() => { setPickerMonth(weekStart.slice(0, 7) + "-01"); setCalendarOpen(!calendarOpen); }}>
            <Text style={styles.staffWeekPickerText}>{weekTitle}</Text>
          </Pressable>
          <Pressable style={styles.dateButton} onPress={() => setWeekStart(shiftDate(weekStart, 7))}>
            <Ionicons name="chevron-forward" size={22} color="#0F172A" />
          </Pressable>
        </View>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.currentWeek} onPress={() => setWeekStart(getWeekDates(getTodayIso())[0])} />
        </View>
        {calendarOpen ? (
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
            { id: "fixed", label: t.repeatingSchedule },
            { id: "flexible", label: t.calendar },
          ].map((item) => {
            const active = scheduleMode === item.id;
            return (
              <Pressable key={item.id} style={[styles.staffScheduleModeButton, active && styles.staffScheduleModeButtonActive]} onPress={() => setScheduleMode(item.id as "fixed" | "flexible")}>
                <Text style={[styles.staffScheduleModeText, active && styles.staffScheduleModeTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.applyToWeekdays} onPress={applyToWeekdays} />
          <SecondaryButton label={t.clearWeek} onPress={clearWeek} />
        </View>
        {scheduleMode === "flexible" ? (
          <View style={styles.staffMonthPlanner}>
            <View>
              <Text style={styles.settingsCardTitle}>{t.monthPlanner}</Text>
              <Text style={styles.clientOptionCaption}>{t.selectedDaysHint}</Text>
            </View>
            <View style={styles.staffCalendarGrid}>
              {monthDates.map((date) => {
                const inMonth = date.slice(0, 7) === pickerMonth.slice(0, 7);
                const selected = selectedMonthDates.includes(date);
                const working = customDraft[date]?.enabled === true;
                return (
                  <Pressable
                    key={`month-${date}`}
                    style={[
                      styles.staffCalendarDay,
                      !inMonth && styles.staffCalendarDayMuted,
                      working && styles.staffCalendarDayWork,
                      selected && styles.staffCalendarDayActive,
                    ]}
                    onPress={() => toggleMonthDate(date)}
                  >
                    <Text style={[styles.staffCalendarDayText, selected && styles.staffCalendarDayTextActive]}>{Number(date.slice(8, 10))}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedMonthDates.length ? (
              <View style={styles.staffSelectedDaysStack}>
                {selectedMonthDates.map((date) => {
                  const day = getMonthDraftDay(date);
                  const intervals = getDayIntervalsRecord(day);
                  return (
                    <View key={date} style={styles.staffSelectedDayCard}>
                      <View style={styles.staffDayHeader}>
                        <View>
                          <Text style={styles.staffDayTitle}>{formatShortDate(date, language)}</Text>
                          <Text style={styles.clientOptionCaption}>{day.enabled ? formatMoneylessHours(getIntervalsDurationMinutes(intervals), t.hoursShort) : t.noWork}</Text>
                        </View>
                        <Pressable style={[styles.mobileSwitch, day.enabled && styles.mobileSwitchActive]} onPress={() => updateMonthDateEnabled(date, !day.enabled)}>
                          <View style={[styles.mobileSwitchThumb, day.enabled && styles.mobileSwitchThumbActive]} />
                        </Pressable>
                      </View>
                      {day.enabled ? (
                        <View style={styles.staffIntervalsBox}>
                          <Text style={styles.staffTimeLabel}>{t.workIntervals}</Text>
                          <WorkIntervalsEditor
                            t={t}
                            intervals={intervals}
                            onChange={(intervalIndex, field, value) => updateMonthDateInterval(date, intervalIndex, field, value)}
                            onAddAfter={(intervalIndex) => addMonthDateInterval(date, intervalIndex)}
                            onRemove={(intervalIndex) => removeMonthDateInterval(date, intervalIndex)}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
            <View style={styles.settingsActionRow}>
              <Text style={styles.badgeText}>{selectedMonthDates.length}</Text>
              <PrimaryButton label={t.applyToSelectedDays} onPress={applyMonthSelection} disabled={busy} />
            </View>
          </View>
        ) : null}
        {staffWeekKeys.map((key, index) => {
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
        })}
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
    categoriesText: (workspace?.business.categories || []).join(", "),
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
  apiFetch,
  onRefreshWorkspace,
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
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
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
  const [statusText, setStatusText] = useState("");
  const [pendingJoinRequests, setPendingJoinRequests] = useState<NonNullable<MobileNotificationsPayload["pendingJoinRequests"]>>([]);
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [photoActionPhoto, setPhotoActionPhoto] = useState<BusinessPhotoRecord | null>(null);
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
  const isOwner = workspace?.membership?.scope !== "member";
  const publicBookingUrl = workspace?.business.publicBookingUrl || "";
  const photos = workspace?.business.photos?.filter((photo) => photo.status !== "blocked") || [];
  const hasPremium = isPremiumActive(workspace?.professional);
  const premiumStatusLabel = getPremiumStatusLabel(workspace?.professional, t);
  const premiumStatusDetail = getPremiumStatusDetail(workspace?.professional, t);
  const activeSectionLocked = !hasPremium && isPremiumSettingsSection(activeSection);

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

  async function syncPremiumCustomerInfo(customerInfo: CustomerInfo) {
    const entitlement = getCustomerInfoEntitlement(customerInfo);
    await apiFetch("/api/mobile/pro/subscription/app-store", {
      method: "POST",
      body: JSON.stringify({
        customerInfo: {
          originalAppUserId: customerInfo.originalAppUserId,
          activeSubscriptions: customerInfo.activeSubscriptions,
          latestExpirationDate: customerInfo.latestExpirationDate,
          entitlement: entitlement
            ? {
                identifier: entitlement.identifier,
                isActive: entitlement.isActive,
                productIdentifier: entitlement.productIdentifier,
                expirationDate: entitlement.expirationDate,
                periodType: entitlement.periodType,
                store: entitlement.store,
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
        const message = error instanceof Error && error.message === "revenuecat_not_configured" ? t.premiumMissingConfig : t.premiumUnavailable;
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
      const result = await Purchases.purchasePackage(targetPackage);
      await syncPremiumCustomerInfo(result.customerInfo);
    } catch (error: any) {
      if (error?.userCancelled) {
        setPremiumMessage(t.premiumPurchaseCancelled);
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
      } else {
        setPremiumMessage(error instanceof Error ? error.message : t.premiumSyncFailed);
      }
    } finally {
      setIsPremiumLoading(false);
    }
  }

  useEffect(() => {
    setDraft(makeSettingsDraft(workspace, language));
    setNewPassword("");
    setAddressSearchValue(workspace?.business.address || "");
  }, [workspace, language]);

  useEffect(() => {
    if (!workspace?.professional.id) return;
    void loadPremiumPackages(true);
  }, [workspace?.professional.id]);

  useEffect(() => {
    apiFetch("/api/mobile/pro/calendar?mode=notifications")
      .then((payload) => setPendingJoinRequests(payload?.pendingJoinRequests || []))
      .catch(() => setPendingJoinRequests([]));
  }, [workspace?.business.id]);

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
    setSaving(true);
    setStatusText("");
    try {
      const nextLanguage: AppLanguage = SUPPORTED_APP_LANGUAGES.includes(draft.language as AppLanguage) ? draft.language : language;
      await apiFetch("/api/mobile/pro/settings", {
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
                categories: draft.categoriesText.split(",").map((item) => item.trim()).filter(Boolean),
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
      setStatusText(t.settingsSaved);
      onRefreshWorkspace();
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
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setSaving(true);
    try {
      const avatarUrl = await uploadMediaDataUrl(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`, "avatar");
      updateDraft("avatarUrl", avatarUrl);
    } catch (error) {
      Alert.alert(t.avatarLink, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  function removeAvatar() {
    updateDraft("avatarUrl", "");
  }

  async function resolveJoinRequest(requestId: string, action: "approve" | "reject") {
    setSaving(true);
    try {
      await apiFetch("/api/mobile/pro/join-requests", {
        method: "POST",
        body: JSON.stringify({ requestId, action }),
      });
      setPendingJoinRequests((items) => items.filter((item) => item.id !== requestId));
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.joinRequests, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function saveBusinessPhotos(nextPhotos: BusinessPhotoRecord[]) {
    if (!workspace || !isOwner) return;
    setSaving(true);
    setStatusText("");
    try {
      await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ business: { photos: nextPhotos } }),
      });
      setStatusText(t.settingsSaved);
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.businessPhotos, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function addBusinessPhotoFromDataUrl(dataUrl: string) {
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
      quality: 0.5,
      base64: true,
    };
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setSaving(true);
    try {
      await addBusinessPhotoFromDataUrl(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`);
    } catch (error) {
      Alert.alert(t.businessPhotos, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function uploadDroppedBusinessPhoto(event: any) {
    event?.preventDefault?.();
    const file = event?.dataTransfer?.files?.[0];
    if (!file) return;
    setPhotoSourceOpen(false);
    setSaving(true);
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
      setSaving(false);
    }
  }

  function makePrimaryPhoto(photoId: string) {
    void saveBusinessPhotos(photos.map((photo) => ({ ...photo, isPrimary: photo.id === photoId })));
  }

  function removeBusinessPhoto(photoId: string) {
    const remaining = photos.filter((photo) => photo.id !== photoId);
    const hasPrimary = remaining.some((photo) => photo.isPrimary);
    void saveBusinessPhotos(remaining.map((photo, index) => ({ ...photo, isPrimary: hasPrimary ? photo.isPrimary : index === 0 })));
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
    updateDraft("address", suggestion.label);
    updateDraft("addressDetails", suggestion.details);
    updateDraft("addressLat", Number.isFinite(suggestion.lat) ? suggestion.lat : null);
    updateDraft("addressLon", Number.isFinite(suggestion.lon) ? suggestion.lon : null);
    if (suggestion.country) {
      updateDraft("country", suggestion.country);
      updateDraft("currency", inferCurrency(suggestion.country));
    }
    setAddressSearchValue(suggestion.label);
    setAddressSuggestions([]);
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
    setIsTelegramSaving(true);
    setTelegramError("");
    try {
      const payload = await apiFetch("/api/mobile/pro/telegram/connect", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setTelegramPanel(normalizeTelegramPanel(payload, telegramPanel));
      setStatusText(t.telegramSaved);
      onRefreshWorkspace();
    } catch (error) {
      setTelegramError(error instanceof Error ? error.message : t.telegramSaveFailed);
    } finally {
      setIsTelegramSaving(false);
    }
  }

  function toggleTelegramSetting(key: TelegramBooleanSettingKey) {
    if (!telegramPanel || isTelegramSaving) return;
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
        return;
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
    } catch (error) {
      setPushError(error instanceof Error && error.message === PUSH_PROJECT_ID_ERROR ? t.pushProjectMissing || t.pushSaveFailed : error instanceof Error ? error.message : t.pushSaveFailed);
    } finally {
      setIsPushSaving(false);
    }
  }

  async function updatePushSettings(patch: Partial<PushPanelState["settings"]>) {
    setIsPushSaving(true);
    setPushError("");
    try {
      const payload = await apiFetch("/api/mobile/pro/push", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setPushPanel(normalizePushPanel(payload, pushPanel));
      setStatusText(t.pushSaved);
    } catch (error) {
      setPushError(error instanceof Error ? error.message : t.pushSaveFailed);
    } finally {
      setIsPushSaving(false);
    }
  }

  function togglePushSetting(key: PushBooleanSettingKey) {
    if (!pushPanel || isPushSaving) return;
    void updatePushSettings({ [key]: !pushPanel.settings[key] });
  }

  const settingsBusinessName = workspace?.business.name || workspace?.professional.email || "";

  return (
    <View style={styles.settingsRoot}>
      <View style={styles.settingsTopPanel}>
        <View style={styles.settingsTopCopy}>
          <Text style={styles.settingsTopTitle}>{t.settings}</Text>
          <Text style={styles.settingsTopSubtitle} numberOfLines={1}>{settingsBusinessName}</Text>
        </View>
        {statusText ? (
          <View style={styles.settingsStatusBadge}>
            <Ionicons name="checkmark" size={13} color="#047857" />
            <Text style={styles.settingsStatusBadgeText} numberOfLines={1}>
              {statusText}
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
              <View>
                <Text style={styles.settingsCardTitle}>{t.premiumSubscriptionTitle}</Text>
                <Text style={styles.clientOptionCaption}>{t.premiumSubscriptionText}</Text>
                {premiumStatusDetail ? <Text style={styles.premiumMobileDetail}>{premiumStatusDetail}</Text> : null}
              </View>
              <View style={[styles.premiumMobileBadge, hasPremium && styles.premiumMobileBadgeActive]}>
                <Text style={[styles.premiumMobileBadgeText, hasPremium && styles.premiumMobileBadgeTextActive]}>{premiumStatusLabel}</Text>
              </View>
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
              <SecondaryButton label={t.premiumManage} onPress={() => Linking.openURL("https://apps.apple.com/account/subscriptions").catch(() => undefined)} disabled={Platform.OS !== "ios"} />
            </View>
            {isPremiumLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
            {premiumMessage ? <Text style={styles.settingsMutedNotice}>{premiumMessage}</Text> : null}
          </Panel>

          <Panel title={t.ownerContacts}>
            <View style={styles.settingsAvatarRow}>
              {draft.avatarUrl ? (
                <Image source={{ uri: draft.avatarUrl }} style={styles.settingsAvatarImage} />
              ) : (
                <View style={styles.settingsAvatar}>
                  <Text style={styles.settingsAvatarText}>{(draft.firstName || draft.email || "T").slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.settingsAvatarInfo}>
                <Text style={styles.settingsCardTitle}>{t.avatarLink}</Text>
                <Text style={styles.clientOptionCaption}>{t.avatarHint}</Text>
                <View style={styles.settingsAvatarActions}>
                  <SecondaryButton label={t.changeAvatar} onPress={pickAvatar} disabled={saving || busy} />
                  <SecondaryButton label={t.deleteAvatar} onPress={removeAvatar} disabled={saving || busy || !draft.avatarUrl} />
                </View>
              </View>
            </View>
            <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => updateDraft("firstName", value)} />
            <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => updateDraft("lastName", value)} />
	            <Field label={t.email} value={draft.email} onChangeText={(value) => updateDraft("email", value)} keyboardType="email-address" autoCapitalize="none" />
	            <Field label={t.phone} value={draft.phone} onChangeText={(value) => updateDraft("phone", value)} keyboardType="phone-pad" />
	            <Field label={t.newPassword} hint={t.leaveBlankPassword} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
	            <SettingsToggleRow label={t.unlockWithFaceId} value={biometricEnabled} onPress={onToggleBiometric} disabled={!biometricAvailable} />
	            {!biometricAvailable ? <Text style={styles.clientOptionCaption}>{t.biometricUnavailable}</Text> : null}
	          </Panel>

          <Panel title={t.businessFormat}>
            <Field label={t.companyName} value={draft.businessName} editable={isOwner} onChangeText={(value) => updateDraft("businessName", value)} />
            <Field label={t.website} value={draft.website} editable={isOwner} onChangeText={(value) => updateDraft("website", value)} placeholder="www.yoursite.com" autoCapitalize="none" />
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
                  onPress={() => updateDraft("accountType", item.value)}
                >
                  <Text style={[styles.settingsChoiceText, draft.accountType === item.value && styles.settingsChoiceTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Panel>

          {renderBusinessPhotosPanel()}

          <Panel title={t.localization}>
            <LanguageSwitch language={draft.language} setLanguage={(value) => updateDraft("language", value)} />
            <SettingsOptionRail label={t.country} value={draft.country} options={COUNTRY_OPTIONS} onSelect={(value) => updateDraft("country", value)} renderLabel={(value) => localizeCountry(value, language)} />
            <SettingsOptionRail label={t.timezone} value={draft.timezone} options={TIMEZONE_OPTIONS} onSelect={(value) => updateDraft("timezone", value)} renderLabel={(value) => TIMEZONE_LABELS[value] || value} />
            <SettingsOptionRail label={t.currency} value={draft.currency} options={CURRENCY_OPTIONS} onSelect={(value) => updateDraft("currency", value)} />
          </Panel>

          <Panel title={t.joinRequests}>
            {pendingJoinRequests.length === 0 ? <Text style={styles.emptyText}>{t.noJoinRequests}</Text> : null}
            {pendingJoinRequests.map((request) => (
              <View key={request.id} style={styles.joinRequestCard}>
                <View>
                  <Text style={styles.settingsMiniTitle}>{request.professionalName}</Text>
                  <Text style={styles.clientOptionCaption}>{request.role}</Text>
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
          <Pressable style={styles.shareToggleRow} onPress={() => updateDraft("allowOnlineBooking", !draft.allowOnlineBooking)} disabled={!isOwner}>
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
            <Text style={styles.label}>{t.serviceMode}</Text>
            <View style={styles.settingsStackedChoices}>
              {SERVICE_MODE_IDS.map((item) => (
                <Pressable
                  key={item}
                  disabled={!isOwner}
                  style={[styles.settingsLongChoice, getServiceModeId(draft.serviceMode) === item && styles.settingsChoiceActive]}
                  onPress={() => updateDraft("serviceMode", SERVICE_MODE_VALUES[item])}
                >
                  <Text style={[styles.settingsChoiceText, getServiceModeId(draft.serviceMode) === item && styles.settingsChoiceTextActive]}>{localizeServiceMode(SERVICE_MODE_VALUES[item], t)}</Text>
                </Pressable>
              ))}
            </View>
            <Field label={t.categoriesText} hint={t.categoriesHint} value={draft.categoriesText} editable={isOwner} onChangeText={(value) => updateDraft("categoriesText", value)} />
          </Panel>

          <Panel title={t.settingsServices}>
            <View style={styles.settingsSummaryGrid}>
              <View style={styles.settingsSummaryTile}>
                <Text style={styles.statValue}>{workspace?.services.length || 0}</Text>
                <Text style={styles.statLabel}>{t.yourServices}</Text>
              </View>
              <View style={styles.settingsSummaryTile}>
                <Text style={styles.statValue}>{workspace?.business.categories?.length || 0}</Text>
                <Text style={styles.statLabel}>{t.categoriesText}</Text>
              </View>
            </View>
            <Text style={styles.compactHelperText}>{t.myServicesHint}</Text>
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
          <Text style={styles.emptyText}>{t.staffScheduleHint}</Text>
          <SecondaryButton label={t.manageSchedule} onPress={() => setActiveTab("staff")} />
        </Panel>
      ) : null}

      {!activeSectionLocked && activeSection === "push" ? (
        <Panel title={t.pushTitle}>
          <View style={styles.telegramStatus}>
            <View style={[styles.telegramDot, pushPanel?.connected ? styles.telegramDotConnected : styles.telegramDotDisconnected]} />
            <View style={styles.settingsMiniInfo}>
              <Text style={styles.settingsCardTitle}>{pushPanel?.connected ? t.pushEnabled : t.pushDisabled}</Text>
              <Text style={styles.clientOptionCaption} numberOfLines={2}>{t.pushHint}</Text>
            </View>
          </View>
          {pushError ? <Text style={styles.settingsMutedNotice}>{pushError}</Text> : null}
          {isPushLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
          <View style={styles.settingsActionRow}>
            <SecondaryButton label={t.pushEnable} onPress={() => void registerPushNotifications()} disabled={isPushSaving} />
            {pushPermissionStatus === "denied" ? (
              <SecondaryButton label={t.pushOpenSettings} onPress={() => Linking.openSettings().catch(() => undefined)} />
            ) : null}
          </View>
          <InfoLine label={t.pushDeviceCount} value={String(pushPanel?.tokenCount || 0)} />
          {pushPanel ? (
            <>
              <SettingsToggleRow label={t.telegramOnlineBookings} value={pushPanel.settings.notificationsNewBooking} onPress={() => togglePushSetting("notificationsNewBooking")} disabled={isPushSaving} />
              <SettingsToggleRow label={t.telegramCabinetBookings} value={pushPanel.settings.notificationsCabinetBooking} onPress={() => togglePushSetting("notificationsCabinetBooking")} disabled={isPushSaving} />
              <SettingsToggleRow label={t.telegramRescheduled} value={pushPanel.settings.notificationsRescheduled} onPress={() => togglePushSetting("notificationsRescheduled")} disabled={isPushSaving} />
              <SettingsToggleRow label={t.telegramCancelled} value={pushPanel.settings.notificationsCancelled} onPress={() => togglePushSetting("notificationsCancelled")} disabled={isPushSaving} />
              <SettingsToggleRow label={t.telegramReminders} value={pushPanel.settings.notificationsReminder} onPress={() => togglePushSetting("notificationsReminder")} disabled={isPushSaving} />
              <SettingsToggleRow label={t.telegramToday} value={pushPanel.settings.notificationsToday} onPress={() => togglePushSetting("notificationsToday")} disabled={isPushSaving} />
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
              <Text style={styles.clientOptionCaption}>{telegramPanel?.chatId || workspace?.telegram?.chatId || t.telegramHint}</Text>
            </View>
          </View>
          {telegramError ? <Text style={styles.settingsMutedNotice}>{telegramError}</Text> : null}
          {isTelegramLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
          {telegramPanel ? (
            <>
              <InfoLine label={t.telegramTokenExpires} value={telegramPanel.tokenExpiresAt || t.empty} />
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
                  <SettingsToggleRow label={t.telegramOnlineBookings} value={telegramPanel.settings.notificationsNewBooking} onPress={() => toggleTelegramSetting("notificationsNewBooking")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramCabinetBookings} value={telegramPanel.settings.notificationsCabinetBooking} onPress={() => toggleTelegramSetting("notificationsCabinetBooking")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramRescheduled} value={telegramPanel.settings.notificationsRescheduled} onPress={() => toggleTelegramSetting("notificationsRescheduled")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramCancelled} value={telegramPanel.settings.notificationsCancelled} onPress={() => toggleTelegramSetting("notificationsCancelled")} disabled={isTelegramSaving} />
                </View>
              ) : null}
              {telegramSection === "reminders" ? (
                <View>
                  <SettingsToggleRow label={t.telegramReminders} value={telegramPanel.settings.notificationsReminder} onPress={() => toggleTelegramSetting("notificationsReminder")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramToday} value={telegramPanel.settings.notificationsToday} onPress={() => toggleTelegramSetting("notificationsToday")} disabled={isTelegramSaving} />
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
                  <Text style={styles.emptyText}>{t.telegramSupportHint}</Text>
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
          <Field label={t.streetAddress} value={draft.address} editable={isOwner} onChangeText={(value) => updateDraft("address", value)} />
          <View style={styles.field}>
            <Text style={styles.label}>{t.addressDetails}</Text>
            <TextInput
              value={draft.addressDetails}
              editable={isOwner}
              onChangeText={(value) => updateDraft("addressDetails", value)}
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
  const [anchor, setAnchor] = useState({ x: 16, y: 64, width: 112, height: 40 });
  const anchorRef = useRef<View>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const menuWidth = Math.min(220, Math.max(168, anchor.width));
  const menuTop = Math.min(anchor.y + anchor.height + 8, screenHeight - 390);
  const menuRight = Math.max(12, screenWidth - anchor.x - anchor.width);

  function openMenu() {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }

  function selectLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    setOpen(false);
  }

  return (
    <View ref={anchorRef} collapsable={false} style={styles.languageMenuAnchor}>
      <Pressable style={[styles.languageTrigger, open && styles.languageTriggerActive]} onPress={openMenu}>
        <Text style={styles.languageTriggerCode}>{languageNames[language]}</Text>
        <Text style={styles.languageTriggerLabel} numberOfLines={1}>
          {languageDisplayNames[language]}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={15} color="#64748B" />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.languageDropdownLayer}>
          <Pressable style={styles.languageDropdownBackdrop} onPress={() => setOpen(false)} />
          <View style={[styles.languageDropdownMenu, { top: menuTop, right: menuRight, width: menuWidth }]}>
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
}: {
  label: string;
  selectedCountry: PhoneCountryOption;
  language: AppLanguage;
  t: Record<string, string>;
  value: string;
  onChangeText: (value: string) => void;
  onOpenPicker: () => void;
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
          keyboardType="phone-pad"
          autoCorrect={false}
          placeholder="98 999 99 55"
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
      <TextInput {...props} autoCorrect={false} placeholderTextColor="#94A3B8" style={[styles.input, props.editable === false && styles.inputDisabled]} />
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
  languageDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
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
  supportBubble: {
    marginTop: 14,
    maxWidth: "86%",
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
    color: "#171717",
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: "#F1F2F4",
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
  notificationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
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
  accountMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  accountAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
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
    minHeight: 54,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  accountMenuItemText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
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
    justifyContent: "center",
  },
  accountLogoutText: {
    color: "#E11D48",
    fontSize: 15,
    fontWeight: "900",
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
    marginTop: 2,
    color: "#334155",
    fontSize: 10,
    fontWeight: "700",
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
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.36)",
    backgroundColor: "rgba(255,255,255,0.90)",
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
    height: 46,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.32)",
    borderBottomColor: "rgba(226, 232, 240, 0.36)",
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  teamPickerRailBody: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    alignSelf: "stretch",
    borderRightWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.42)",
    backgroundColor: "#FBFCFF",
  },
  timeAxisColumn: {
    width: CALENDAR_TIME_AXIS_WIDTH,
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.30)",
    backgroundColor: "#FBFCFF",
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
    width: 28,
    height: 28,
    marginTop: 9,
    marginLeft: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.78)",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  teamPickerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
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
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.34)",
    backgroundColor: "#FFFFFF",
  },
  teamDayHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "rgba(226, 232, 240, 0.34)",
    backgroundColor: "rgba(255,255,255,0.90)",
  },
  teamPickerMenu: {
    width: "82%",
    maxHeight: "72%",
    marginLeft: 48,
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
    backgroundColor: "#FEFFFF",
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
    paddingRight: 2,
    height: 16,
    lineHeight: 16,
    marginTop: -8,
    textAlign: "right",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  hourTextHidden: {
    opacity: 0,
  },
  hourGrid: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(226, 232, 240, 0.24)",
  },
  majorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(203, 213, 225, 0.22)",
  },
  minorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(226, 232, 240, 0.06)",
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
    height: 1,
    backgroundColor: "rgba(239, 71, 111, 0.64)",
    zIndex: 2,
  },
  currentTimeDot: {
    position: "absolute",
    left: -3,
    top: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#EF476F",
    backgroundColor: "#FFFFFF",
  },
  appointmentBlock: {
    position: "absolute",
    zIndex: 3,
    borderRadius: 17,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: "#243044",
    shadowOpacity: 0.075,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  appointmentBlockTight: {
    borderRadius: 14,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },
  appointmentBlockVeryTight: {
    borderRadius: 12,
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
    fontWeight: "600",
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
    lineHeight: 16,
    fontWeight: "700",
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
    color: "#667085",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
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
    paddingRight: 12,
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
  workspaceContent: {
    paddingHorizontal: DESIGN.spacing.screen,
    paddingTop: 10,
    paddingBottom: 132,
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
    borderColor: "#D8D0FF",
    backgroundColor: DESIGN.colors.primarySoft,
  },
  choiceText: {
    color: DESIGN.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  choiceTextActive: {
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
  categoryAddButton: {
    width: 50,
    height: 50,
    marginBottom: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
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
  staffCalendarDayText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
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
  settingsAvatar: {
    width: 54,
    height: 54,
    borderRadius: 17,
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
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
  },
  settingsAvatarInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingsAvatarActions: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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

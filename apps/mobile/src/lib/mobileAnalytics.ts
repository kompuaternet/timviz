import { Platform } from "react-native";

export type MobileAnalyticsEventName =
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

export type MobileAnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type MobileRegistrationConversionInput = {
  email?: string | null;
  phone?: string | null;
};

const firebaseEventMap: Record<MobileAnalyticsEventName, string> = {
  mobile_app_open: "app_open",
  mobile_sign_up_complete: "sign_up",
  mobile_login_complete: "login",
  mobile_social_auth_complete: "login",
  mobile_service_added: "tutorial_complete",
  mobile_appointment_created: "generate_lead",
  mobile_checkout_start: "begin_checkout",
  mobile_purchase_complete: "purchase",
  support_message_sent: "contact",
  premium_gate_view: "view_item",
};

let firebaseAnalyticsModule: Promise<any | null> | null = null;
let firebaseAnalyticsAvailable = true;

function loadFirebaseAnalytics() {
  if (Platform.OS === "web" || !firebaseAnalyticsAvailable) {
    return Promise.resolve(null);
  }
  if (!firebaseAnalyticsModule) {
    firebaseAnalyticsModule = import("@react-native-firebase/analytics")
      .then((module) => module.default)
      .catch(() => {
        firebaseAnalyticsAvailable = false;
        return null;
      });
  }
  return firebaseAnalyticsModule;
}

function sanitizeFirebaseParamKey(key: string) {
  return key
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[^a-zA-Z]+/, "")
    .slice(0, 40);
}

function sanitizeFirebasePayload(payload: MobileAnalyticsPayload) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => [sanitizeFirebaseParamKey(key), value] as const)
      .filter(([key, value]) => key && value !== undefined)
      .map(([key, value]) => {
        if (typeof value === "string") return [key, value.slice(0, 100)];
        if (typeof value === "number" || typeof value === "boolean" || value === null) return [key, value];
        return [key, String(value).slice(0, 100)];
      })
  );
}

function waitForFirebaseAttributionWindow() {
  return new Promise((resolve) => setTimeout(resolve, 800));
}

function normalizeEmailForConversion(value: string | null | undefined) {
  const email = String(value ?? "").trim().toLowerCase();
  return email.includes("@") && email.includes(".") ? email : "";
}

function normalizePhoneForConversion(value: string | null | undefined) {
  const phone = String(value ?? "").replace(/[^\d+]/g, "");
  if (!phone.startsWith("+")) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? phone : "";
}

export async function trackFirebaseMobileEvent(eventName: MobileAnalyticsEventName, payload: MobileAnalyticsPayload = {}) {
  const analyticsFactory = await loadFirebaseAnalytics();
  if (!analyticsFactory) return;
  try {
    const analytics = analyticsFactory();
    await analytics.logEvent(firebaseEventMap[eventName], sanitizeFirebasePayload(payload));
  } catch {
    firebaseAnalyticsAvailable = false;
  }
}

export async function initiateFirebaseMobileRegistrationConversion(input: MobileRegistrationConversionInput) {
  if (Platform.OS !== "ios") return;

  const analyticsFactory = await loadFirebaseAnalytics();
  if (!analyticsFactory) return;

  const email = normalizeEmailForConversion(input.email);
  const phone = normalizePhoneForConversion(input.phone);
  if (!email && !phone) return;

  try {
    const analytics = analyticsFactory();
    if (email && typeof analytics.initiateOnDeviceConversionMeasurementWithEmailAddress === "function") {
      await analytics.initiateOnDeviceConversionMeasurementWithEmailAddress(email);
    }
    if (phone && typeof analytics.initiateOnDeviceConversionMeasurementWithPhoneNumber === "function") {
      await analytics.initiateOnDeviceConversionMeasurementWithPhoneNumber(phone);
    }
    await waitForFirebaseAttributionWindow();
  } catch {
    // On-device conversion is best-effort; event logging should still continue.
  }
}

export async function setFirebaseMobileUser(userId: string | null, properties: MobileAnalyticsPayload = {}) {
  const analyticsFactory = await loadFirebaseAnalytics();
  if (!analyticsFactory) return;
  try {
    const analytics = analyticsFactory();
    await analytics.setUserId(userId);
    const safeProperties = sanitizeFirebasePayload(properties);
    await Promise.all(
      Object.entries(safeProperties).map(([key, value]) => analytics.setUserProperty(key, value == null ? null : String(value).slice(0, 36)))
    );
  } catch {
    firebaseAnalyticsAvailable = false;
  }
}

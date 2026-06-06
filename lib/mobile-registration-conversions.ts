import { createHash, randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase";

export type MobileRegistrationConversionProvider = "email" | "google" | "apple";

export type MobileRegistrationConversionInput = {
  professionalId: string;
  provider: MobileRegistrationConversionProvider;
  email?: string;
  phone?: string;
  displayName?: string;
  businessName?: string;
  registrationSource?: string;
  workspaceReady?: boolean;
  language?: string;
  country?: string;
  currency?: string;
  platform?: string;
  appInstanceId?: string;
  request?: Request;
};

type DeliveryResult = {
  sent: boolean;
  skipped?: string;
  status?: number;
  error?: string;
};

const internalProvider = "timviz_mobile_registration_conversion";
const internalEventType = "mobile_sign_up_complete";
const ga4EventName = "sign_up";
const defaultTimeoutMs = 2500;

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function isDisabled() {
  const value = env("MOBILE_REGISTRATION_SERVER_CONVERSIONS_DISABLED").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value: unknown) {
  return cleanText(value).replace(/[^\d+]/g, "");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getHashedUserData(input: MobileRegistrationConversionInput) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  return {
    email_sha256: email ? sha256(email) : "",
    phone_sha256: phone ? sha256(phone) : "",
    email_domain: email.includes("@") ? email.split("@").pop() || "" : ""
  };
}

function getEventId(input: MobileRegistrationConversionInput) {
  const stableKey = input.professionalId || normalizeEmail(input.email) || randomUUID();
  return `mobile_registration:${stableKey}`;
}

function getPlatform(input: MobileRegistrationConversionInput) {
  const raw = `${input.platform || ""} ${input.registrationSource || ""} ${input.request?.headers.get("user-agent") || ""}`.toLowerCase();
  if (raw.includes("ios") || raw.includes("iphone") || raw.includes("ipad") || raw.includes("apple")) return "ios";
  if (raw.includes("android")) return "android";
  return "mobile";
}

function getClientId(input: MobileRegistrationConversionInput) {
  const salt = env("MOBILE_REGISTRATION_CONVERSION_SALT") || "timviz-mobile-registration";
  const hash = sha256(`${salt}:${input.professionalId || normalizeEmail(input.email)}`);
  const first = Number.parseInt(hash.slice(0, 8), 16);
  const second = Number.parseInt(hash.slice(8, 16), 16);
  return `${first}.${second}`;
}

function getAppInstanceId(input: MobileRegistrationConversionInput) {
  const appInstanceId = cleanText(input.appInstanceId, 128);
  if (appInstanceId) return appInstanceId;

  const salt = env("MOBILE_REGISTRATION_CONVERSION_SALT") || "timviz-mobile-registration";
  return `srv_${sha256(`${salt}:app:${input.professionalId || normalizeEmail(input.email)}`).slice(0, 32)}`;
}

function cleanGa4Params(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key, value]) => key && value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        if (typeof value === "number" || typeof value === "boolean") return [key, value];
        return [key, cleanText(value, 100)];
      })
  );
}

function getGa4EventParams(input: MobileRegistrationConversionInput, eventId: string) {
  return cleanGa4Params({
    method: input.provider,
    event_id: eventId,
    source: "mobile_app",
    registration_source: input.registrationSource || "mobile_app",
    platform: getPlatform(input),
    professional_id: input.professionalId,
    workspace_ready: input.workspaceReady,
    language: input.language,
    country: input.country,
    currency: input.currency || "UAH",
    value: 1,
    engagement_time_msec: 1
  });
}

async function postJson(url: string, payload: unknown, headers: Record<string, string> = {}): Promise<DeliveryResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), defaultTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store"
    });

    return { sent: response.ok, status: response.status, error: response.ok ? undefined : await response.text().catch(() => "") };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Request failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendGa4WebEvent(input: MobileRegistrationConversionInput, eventId: string): Promise<DeliveryResult> {
  const measurementId = env("GA4_MEASUREMENT_ID", "GOOGLE_ANALYTICS_MEASUREMENT_ID", "NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID");
  const apiSecret = env("GA4_API_SECRET", "GOOGLE_ANALYTICS_API_SECRET", "GA4_MEASUREMENT_PROTOCOL_API_SECRET");

  if (!measurementId || !apiSecret) {
    return { sent: false, skipped: "missing_ga4_web_config" };
  }

  const payload = {
    client_id: getClientId(input),
    user_id: input.professionalId,
    non_personalized_ads: false,
    events: [
      {
        name: ga4EventName,
        params: getGa4EventParams(input, eventId)
      }
    ]
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  return postJson(url, payload);
}

async function sendGa4AppEvent(input: MobileRegistrationConversionInput, eventId: string): Promise<DeliveryResult> {
  const firebaseAppId = env("GA4_FIREBASE_APP_ID", "GOOGLE_ANALYTICS_FIREBASE_APP_ID", "FIREBASE_GA4_APP_ID");
  const apiSecret = env("GA4_APP_API_SECRET", "GA4_API_SECRET", "GOOGLE_ANALYTICS_API_SECRET", "GA4_MEASUREMENT_PROTOCOL_API_SECRET");

  if (!firebaseAppId || !apiSecret) {
    return { sent: false, skipped: "missing_ga4_app_config" };
  }

  const payload = {
    app_instance_id: getAppInstanceId(input),
    user_id: input.professionalId,
    non_personalized_ads: false,
    events: [
      {
        name: ga4EventName,
        params: getGa4EventParams(input, eventId)
      }
    ]
  };

  const url = `https://www.google-analytics.com/mp/collect?firebase_app_id=${encodeURIComponent(firebaseAppId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  return postJson(url, payload);
}

async function sendWebhookEvent(input: MobileRegistrationConversionInput, eventId: string): Promise<DeliveryResult> {
  const url = env("MOBILE_REGISTRATION_CONVERSION_WEBHOOK_URL");
  if (!url) {
    return { sent: false, skipped: "missing_webhook_url" };
  }

  const secret = env("MOBILE_REGISTRATION_CONVERSION_WEBHOOK_SECRET");
  const userData = getHashedUserData(input);
  const payload = {
    event_id: eventId,
    event_name: internalEventType,
    google_event_name: ga4EventName,
    occurred_at: new Date().toISOString(),
    source: "mobile_app",
    provider: input.provider,
    professional_id: input.professionalId,
    platform: getPlatform(input),
    registration_source: input.registrationSource || "mobile_app",
    workspace_ready: input.workspaceReady,
    business_name: cleanText(input.businessName, 100),
    language: cleanText(input.language, 20),
    country: cleanText(input.country, 80),
    currency: cleanText(input.currency || "UAH", 10),
    user_data: userData
  };

  return postJson(
    url,
    payload,
    secret
      ? {
          authorization: `Bearer ${secret}`
        }
      : {}
  );
}

async function hasProcessedEvent(eventId: string, professionalId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("webhook_events")
    .select("processed")
    .eq("provider", internalProvider)
    .eq("event_id", eventId)
    .eq("user_id", professionalId)
    .maybeSingle();

  if (error) return false;
  return data?.processed === true;
}

async function storeEvent(input: MobileRegistrationConversionInput, eventId: string, results: Record<string, DeliveryResult>) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const userData = getHashedUserData(input);
  const processed = Object.values(results).some((result) => result.sent);

  const { error } = await supabase.from("webhook_events").upsert(
    {
      id: `timviz_mobile_registration_${sha256(eventId).slice(0, 24)}`,
      provider: internalProvider,
      event_id: eventId,
      event_type: internalEventType,
      user_id: input.professionalId,
      processed,
      processed_at: processed ? new Date().toISOString() : null,
      raw_payload: {
        source: "mobile_app",
        google_event_name: ga4EventName,
        provider: input.provider,
        platform: getPlatform(input),
        registration_source: input.registrationSource || "mobile_app",
        workspace_ready: input.workspaceReady,
        business_name: cleanText(input.businessName, 100),
        language: cleanText(input.language, 20),
        country: cleanText(input.country, 80),
        currency: cleanText(input.currency || "UAH", 10),
        user_data: userData,
        delivery: results
      }
    },
    { onConflict: "provider,event_id" }
  );

  if (error) {
    console.error("[mobile-registration-conversions] Failed to store conversion event", error);
  }
}

export async function reportMobileRegistrationConversion(input: MobileRegistrationConversionInput) {
  try {
    if (isDisabled() || !input.professionalId) {
      return;
    }

    const eventId = getEventId(input);
    const duplicateProcessed = await hasProcessedEvent(eventId, input.professionalId);
    if (duplicateProcessed) {
      return;
    }

    const results = {
      ga4Web: await sendGa4WebEvent(input, eventId),
      ga4App: await sendGa4AppEvent(input, eventId),
      webhook: await sendWebhookEvent(input, eventId)
    };

    await storeEvent(input, eventId, results);
  } catch (error) {
    console.error("[mobile-registration-conversions] Conversion signal failed", error);
  }
}

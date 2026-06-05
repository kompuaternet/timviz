export type AdsEventName =
  | "page_view_signal"
  | "landing_view"
  | "cta_click"
  | "app_store_click"
  | "sign_up_start"
  | "sign_up_complete"
  | "business_profile_created"
  | "first_service_added"
  | "booking_link_copied"
  | "first_booking_received"
  | "pricing_view"
  | "pro_trial_started"
  | "login_complete"
  | "google_auth_start"
  | "google_auth_complete"
  | "checkout_start"
  | "checkout_redirect"
  | "subscription_purchase"
  | "support_message_sent"
  | "premium_gate_view"
  | "mobile_app_open"
  | "mobile_sign_up_complete"
  | "mobile_login_complete"
  | "mobile_social_auth_complete"
  | "mobile_checkout_start"
  | "mobile_purchase_complete";

type AdsEventPayload = Record<string, string | number | boolean | null | undefined>;
type AdsAttributionPayload = Record<string, string>;

const ADS_ATTRIBUTION_STORAGE_KEY = "timviz_ads_attribution_v1";
const ADS_ATTRIBUTION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const DEFAULT_GOOGLE_ADS_SIGNUP_CONVERSION_SEND_TO = "AW-18141706444/Cv3zCPWMnLkcEMzx0cpD";
const adsCarryPrefixes = ["utm_"];
const adsCarryKeys = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"];

const adsRecommendedEvents: Partial<Record<AdsEventName, string[]>> = {
  page_view_signal: ["page_view"],
  app_store_click: ["select_promotion"],
  sign_up_start: ["generate_lead"],
  sign_up_complete: ["sign_up"],
  business_profile_created: ["generate_lead"],
  first_service_added: ["tutorial_complete"],
  booking_link_copied: ["share"],
  first_booking_received: ["generate_lead"],
  pricing_view: ["view_item"],
  pro_trial_started: ["start_trial"],
  login_complete: ["login"],
  google_auth_complete: ["login"],
  checkout_start: ["begin_checkout"],
  checkout_redirect: ["add_payment_info"],
  subscription_purchase: ["purchase"],
  support_message_sent: ["contact"],
  premium_gate_view: ["view_item"],
  mobile_app_open: ["app_open"],
  mobile_sign_up_complete: ["sign_up"],
  mobile_login_complete: ["login"],
  mobile_social_auth_complete: ["login"],
  mobile_checkout_start: ["begin_checkout"],
  mobile_purchase_complete: ["purchase", "subscribe"]
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: "event", eventName: string, payload?: Record<string, unknown>) => void;
  }
}

function isAdsCarryKey(key: string) {
  return adsCarryKeys.includes(key) || adsCarryPrefixes.some((prefix) => key.startsWith(prefix));
}

function readAdsAttribution(): AdsAttributionPayload {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ADS_ATTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as AdsAttributionPayload & { captured_at?: string };
    const capturedAt = parsed.captured_at ? Date.parse(parsed.captured_at) : 0;
    if (!capturedAt || Date.now() - capturedAt > ADS_ATTRIBUTION_MAX_AGE_MS) {
      window.localStorage.removeItem(ADS_ATTRIBUTION_STORAGE_KEY);
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function getGoogleAdsSignupConversionSendTo() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_CONVERSION_SEND_TO ||
    DEFAULT_GOOGLE_ADS_SIGNUP_CONVERSION_SEND_TO
  ).trim();
}

function trackGoogleAdsSignupConversion(eventName: AdsEventName) {
  if (eventName !== "sign_up_complete" || typeof window.gtag !== "function") {
    return;
  }

  const sendTo = getGoogleAdsSignupConversionSendTo();
  if (!sendTo) {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: sendTo,
    value: 1.0,
    currency: "UAH"
  });
}

export function captureAdsAttribution() {
  if (typeof window === "undefined") {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);
  const attribution: AdsAttributionPayload = {};
  urlParams.forEach((value, key) => {
    if (value && isAdsCarryKey(key)) {
      attribution[key] = value;
    }
  });

  const existingAttribution = readAdsAttribution();
  const nextAttribution: AdsAttributionPayload = {
    ...existingAttribution,
    ...attribution
  };

  if (Object.keys(nextAttribution).length === 0) {
    return {};
  }

  nextAttribution.captured_at = new Date().toISOString();
  nextAttribution.landing_page = existingAttribution.landing_page || window.location.href;
  nextAttribution.referrer = existingAttribution.referrer || document.referrer || "";

  try {
    window.localStorage.setItem(ADS_ATTRIBUTION_STORAGE_KEY, JSON.stringify(nextAttribution));
  } catch {
    // Attribution must never block the product flow.
  }

  return nextAttribution;
}

export function trackAdsEvent(eventName: AdsEventName, payload: AdsEventPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const attributionPayload = captureAdsAttribution();
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
  const eventPayload = {
    ...attributionPayload,
    ...cleanPayload,
    timviz_event: eventName,
    page_location: window.location.href,
    page_path: window.location.pathname
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventPayload
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventPayload);
  }

  for (const recommendedEventName of adsRecommendedEvents[eventName] || []) {
    const recommendedPayload = {
      ...eventPayload,
      timviz_event: eventName
    };
    window.dataLayer.push({
      event: recommendedEventName,
      ...recommendedPayload
    });
    if (typeof window.gtag === "function") {
      window.gtag("event", recommendedEventName, recommendedPayload);
    }
  }

  trackGoogleAdsSignupConversion(eventName);
}

export function buildAdsCarryoverUrl(pathname: string) {
  if (typeof window === "undefined") {
    return pathname;
  }

  const baseUrl = new URL(pathname, window.location.origin);
  const sourceParams = new URLSearchParams(window.location.search);
  const nextParams = new URLSearchParams(baseUrl.search);
  const storedAttribution = readAdsAttribution();

  sourceParams.forEach((value, key) => {
    if (isAdsCarryKey(key)) {
      nextParams.set(key, value);
    }
  });

  Object.entries(storedAttribution).forEach(([key, value]) => {
    if (value && isAdsCarryKey(key) && !nextParams.has(key)) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query ? `${baseUrl.pathname}?${query}` : baseUrl.pathname;
}

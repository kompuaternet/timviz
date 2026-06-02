export type AdsEventName =
  | "landing_view"
  | "cta_click"
  | "sign_up_start"
  | "sign_up_complete"
  | "business_profile_created"
  | "first_service_added"
  | "booking_link_copied"
  | "first_booking_received"
  | "pricing_view"
  | "pro_trial_started";

type AdsEventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: "event", eventName: string, payload?: Record<string, unknown>) => void;
  }
}

export function trackAdsEvent(eventName: AdsEventName, payload: AdsEventPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
  const eventPayload = {
    ...cleanPayload,
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
}

export function buildAdsCarryoverUrl(pathname: string) {
  if (typeof window === "undefined") {
    return pathname;
  }

  const baseUrl = new URL(pathname, window.location.origin);
  const sourceParams = new URLSearchParams(window.location.search);
  const nextParams = new URLSearchParams(baseUrl.search);
  const carryPrefixes = ["utm_"];
  const carryKeys = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid"];

  sourceParams.forEach((value, key) => {
    if (carryKeys.includes(key) || carryPrefixes.some((prefix) => key.startsWith(prefix))) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query ? `${baseUrl.pathname}?${query}` : baseUrl.pathname;
}

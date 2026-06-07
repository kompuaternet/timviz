import { createHash } from "crypto";

type MetaWebRegistrationInput = {
  professionalId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  language?: string;
  source?: string;
  workspaceReady?: boolean;
  request?: Request;
};

const defaultMetaGraphApiVersion = "v25.0";
const defaultTimeoutMs = 2500;
const timvizSiteUrl = "https://timviz.com";

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
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

function parseCookie(header: string, name: string) {
  const cookies = header.split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const match = cookies.find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

function getClientIp(request?: Request) {
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request?.headers.get("x-real-ip") || "";
}

function getEventSourceUrl(request?: Request) {
  return request?.headers.get("referer") || `${timvizSiteUrl}/ru/for-masters`;
}

function getUserData(input: MetaWebRegistrationInput) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const firstName = cleanText(input.firstName).toLowerCase();
  const lastName = cleanText(input.lastName).toLowerCase();
  const country = cleanText(input.country || "Ukraine").toLowerCase();
  const cookieHeader = input.request?.headers.get("cookie") || "";

  return {
    em: email ? [sha256(email)] : undefined,
    ph: phone ? [sha256(phone)] : undefined,
    fn: firstName ? [sha256(firstName)] : undefined,
    ln: lastName ? [sha256(lastName)] : undefined,
    country: country ? [sha256(country)] : undefined,
    client_ip_address: getClientIp(input.request) || undefined,
    client_user_agent: input.request?.headers.get("user-agent") || undefined,
    fbp: parseCookie(cookieHeader, "_fbp") || undefined,
    fbc: parseCookie(cookieHeader, "_fbc") || undefined
  };
}

function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""));
}

export function getMetaWebRegistrationEventId(professionalId: string) {
  return `web_registration:${professionalId}`;
}

export async function reportMetaWebRegistrationConversion(input: MetaWebRegistrationInput) {
  const pixelId = env("META_PIXEL_ID", "NEXT_PUBLIC_META_PIXEL_ID");
  const accessToken = env("META_CONVERSIONS_API_ACCESS_TOKEN", "META_CAPI_ACCESS_TOKEN");

  if (!pixelId || !accessToken || !input.professionalId) {
    return;
  }

  const graphApiVersion = env("META_GRAPH_API_VERSION") || defaultMetaGraphApiVersion;
  const eventId = getMetaWebRegistrationEventId(input.professionalId);
  const eventTime = Math.floor(Date.now() / 1000);
  const eventSourceUrl = getEventSourceUrl(input.request);
  const userData = cleanPayload(getUserData(input));
  const customData = cleanPayload({
    currency: "UAH",
    value: 1,
    content_name: "Timviz master registration",
    registration_source: cleanText(input.source || "website", 100),
    language: cleanText(input.language, 20),
    workspace_ready: input.workspaceReady
  });
  const data = ["CompleteRegistration", "Lead"].map((eventName) => cleanPayload({
    event_name: eventName,
    event_time: eventTime,
    event_id: eventId,
    action_source: "website",
    event_source_url: eventSourceUrl,
    user_data: userData,
    custom_data: customData
  }));
  const testEventCode = env("META_TEST_EVENT_CODE");
  const payload = cleanPayload({
    data,
    test_event_code: testEventCode || undefined
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), defaultTimeoutMs);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const error = await response.text().catch(() => "");
      console.warn("[meta-conversions] Registration event failed", response.status, error);
    }
  } catch (error) {
    console.warn("[meta-conversions] Registration event failed", error);
  } finally {
    clearTimeout(timeout);
  }
}

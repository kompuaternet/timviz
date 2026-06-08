import { randomUUID } from "crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type ProfessionalAccessPlatform = "website" | "ios" | "android" | "mobile";

export function resolveProfessionalAccessPlatform(input: {
  platform?: unknown;
  source?: unknown;
  registrationSource?: unknown;
  userAgent?: unknown;
}) {
  const value = [
    input.platform,
    input.source,
    input.registrationSource,
    input.userAgent
  ]
    .map((part) => (typeof part === "string" ? part : ""))
    .join(" ")
    .toLowerCase();

  if (/(ios|iphone|ipad|apple)/i.test(value)) {
    return "ios" as const;
  }

  if (/android/i.test(value)) {
    return "android" as const;
  }

  if (/(mobile|мобиль)/i.test(value)) {
    return "mobile" as const;
  }

  return "website" as const;
}

export function getProfessionalAccessLabel(platform: ProfessionalAccessPlatform, context: "registration" | "access") {
  switch (platform) {
    case "ios":
      return "Приложение iOS";
    case "android":
      return "Приложение Android";
    case "mobile":
      return "Мобильное приложение";
    case "website":
    default:
      return context === "registration" ? "Только сайт" : "Сайт";
  }
}

export async function recordProfessionalAccessSource(input: {
  professionalId: string;
  eventType: "registration" | "login" | "activity";
  platform?: unknown;
  source?: unknown;
  method?: string;
  request?: Request;
}) {
  if (!input.professionalId || !isSupabaseConfigured()) {
    return { stored: false as const };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { stored: false as const };
  }

  const userAgent = input.request?.headers.get("user-agent") || "";
  const platform = resolveProfessionalAccessPlatform({
    platform: input.platform,
    source: input.source,
    userAgent
  });
  const now = new Date().toISOString();
  const eventId = `professional_access:${input.professionalId}:${input.eventType}:${now}:${randomUUID()}`;

  const { error } = await supabase.from("webhook_events").upsert(
    {
      id: `timviz_professional_access_${randomUUID()}`,
      provider: "timviz_professional_access",
      event_id: eventId,
      event_type: input.eventType,
      user_id: input.professionalId,
      processed: true,
      processed_at: now,
      raw_payload: {
        platform,
        source: input.source || getProfessionalAccessLabel(platform, "access"),
        method: input.method || "",
        user_agent: userAgent
      }
    },
    { onConflict: "provider,event_id" }
  );

  if (error) {
    console.warn("[pro-access-source] Failed to store access source", error.message);
    return { stored: false as const };
  }

  return { stored: true as const, platform };
}

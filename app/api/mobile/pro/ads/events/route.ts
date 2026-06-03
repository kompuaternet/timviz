import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../../lib/supabase";
import { getMobileProfessionalId } from "../../_auth";

const allowedEvents = new Set([
  "mobile_app_open",
  "mobile_sign_up_complete",
  "mobile_login_complete",
  "mobile_social_auth_complete",
  "mobile_checkout_start",
  "mobile_purchase_complete",
  "support_message_sent",
  "premium_gate_view"
]);

function cleanEventName(value: unknown) {
  const eventName = String(value ?? "").trim();
  return allowedEvents.has(eventName) ? eventName : "";
}

function cleanPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.length <= 80)
      .map(([key, item]) => {
        if (typeof item === "string") return [key, item.slice(0, 500)];
        if (typeof item === "number" || typeof item === "boolean" || item === null) return [key, item];
        return [key, String(item ?? "").slice(0, 500)];
      })
  );
}

export async function POST(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const eventName = cleanEventName(body.eventName);
  if (!eventName) {
    return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const eventId = `mobile_ads:${professionalId}:${eventName}:${Date.now()}:${randomUUID()}`;
  const rawPayload = {
    source: "mobile_app",
    eventName,
    platform: body.platform || "unknown",
    appVersion: body.appVersion || "",
    userAgent: request.headers.get("user-agent") || "",
    payload: cleanPayload(body.payload)
  };

  const { error } = await supabase.from("webhook_events").upsert(
    {
      id: `timviz_ads_${randomUUID()}`,
      provider: "timviz_ads",
      event_id: eventId,
      event_type: eventName,
      user_id: professionalId,
      processed: true,
      processed_at: new Date().toISOString(),
      raw_payload: rawPayload
    },
    { onConflict: "provider,event_id" }
  );

  if (error) {
    console.error("[mobile-ads-events] Failed to store event", error);
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: true });
}

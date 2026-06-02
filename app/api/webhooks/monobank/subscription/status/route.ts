import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  getMonobankEventDate,
  isValidMonobankSignature,
  mapMonobankStatus
} from "../../../../../../lib/monobank-billing";
import { updateProfessionalPremiumFromMonobank } from "../../../../../../lib/premium";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../../../../../lib/supabase";

export const dynamic = "force-dynamic";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-sign") || request.headers.get("X-Sign");
  const valid = await isValidMonobankSignature(body, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(body.toString("utf8")) as Record<string, unknown>;
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const subscriptionId = stringValue(payload.subscriptionId);
  if (!subscriptionId) {
    return NextResponse.json({ error: "Missing subscriptionId." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 500 });
  }

  const eventType = mapMonobankStatus(stringValue(payload.status));
  const eventDate = getMonobankEventDate(payload);
  const eventId = `subscription_status:${subscriptionId}:${eventType}:${stringValue(payload.modifiedDate) || stringValue(payload.createdDate) || stringValue(payload.date) || bodyHash}`;

  await supabase.from("webhook_events").upsert(
    {
      id: `monobank_${eventId}`,
      provider: "monobank",
      event_id: eventId,
      event_type: eventType,
      processed: false,
      raw_payload: payload
    },
    { onConflict: "provider,event_id" }
  );

  const { data: subscription, error: subscriptionError } = await supabase
    .from("monobank_subscriptions")
    .select("id, user_id, plan_code, active_until, mono_modified_date")
    .eq("subscription_id", subscriptionId)
    .maybeSingle();
  if (subscriptionError) throw new Error(subscriptionError.message);
  if (!subscription) {
    return NextResponse.json({ ok: true, ignored: "subscription_not_found" });
  }

  const incomingModified = eventDate.getTime();
  const existingModified = subscription.mono_modified_date ? new Date(subscription.mono_modified_date).getTime() : 0;
  if (existingModified && incomingModified && incomingModified < existingModified) {
    return NextResponse.json({ ok: true, ignored: "stale_event" });
  }

  const now = new Date().toISOString();
  const nextChargeAt = stringValue(payload.nextChargeDate) || null;
  const endDate = stringValue(payload.endDate) || null;
  const cancelled = eventType === "cancelled";
  const { error: updateError } = await supabase
    .from("monobank_subscriptions")
    .update({
      status: eventType,
      next_charge_at: nextChargeAt,
      cancelled_at: cancelled ? eventDate.toISOString() : null,
      active_until: endDate || undefined,
      mono_modified_date: eventDate.toISOString(),
      raw_payload: payload,
      updated_at: now
    })
    .eq("subscription_id", subscriptionId);
  if (updateError) throw new Error(updateError.message);

  if (cancelled) {
    await updateProfessionalPremiumFromMonobank({
      professionalId: subscription.user_id,
      status: "cancelled",
      premiumUntil: endDate || subscription.active_until || null,
      planCode: subscription.plan_code,
      invoiceId: subscriptionId,
      cancelAtPeriodEnd: true
    });
  }

  await supabase
    .from("webhook_events")
    .update({ processed: true, processed_at: now, user_id: subscription.user_id })
    .eq("provider", "monobank")
    .eq("event_id", eventId);

  return NextResponse.json({ ok: true });
}

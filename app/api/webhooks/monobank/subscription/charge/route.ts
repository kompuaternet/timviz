import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  addMonobankBillingPeriod,
  getMonobankCurrencyLabelByCode,
  getMonobankEventDate,
  isValidMonobankSignature,
  mapMonobankStatus
} from "../../../../../../lib/monobank-billing";
import {
  getProfessionalPremiumSnapshot,
  updateProfessionalPremiumFromMonobank
} from "../../../../../../lib/premium";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../../../../../lib/supabase";

export const dynamic = "force-dynamic";

function maxDate(left: Date, right: Date) {
  return left.getTime() >= right.getTime() ? left : right;
}

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
  const invoiceId = stringValue(payload.invoiceId);
  if (!subscriptionId) {
    return NextResponse.json({ error: "Missing subscriptionId." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 500 });
  }

  const eventType = mapMonobankStatus(stringValue(payload.status));
  const modifiedKey =
    stringValue(payload.modifiedDate) ||
    stringValue(payload.createdDate) ||
    stringValue(payload.date) ||
    bodyHash;
  const eventId = `subscription_charge:${subscriptionId}:${invoiceId || "no_invoice"}:${eventType}:${modifiedKey}`;

  const { data: existingEvent, error: existingEventError } = await supabase
    .from("webhook_events")
    .select("processed")
    .eq("provider", "monobank")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existingEventError) throw new Error(existingEventError.message);
  if (existingEvent?.processed) {
    return NextResponse.json({ ok: true, ignored: "duplicate_event" });
  }

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
    .select("id, user_id, plan_code, interval, period_months, amount, active_until")
    .eq("subscription_id", subscriptionId)
    .maybeSingle();
  if (subscriptionError) throw new Error(subscriptionError.message);
  if (!subscription) {
    return NextResponse.json({ ok: true, ignored: "subscription_not_found" });
  }

  const eventDate = getMonobankEventDate(payload);
  let activeUntil: string | null = null;

  if (eventType === "success") {
    const snapshot = await getProfessionalPremiumSnapshot({ professionalId: subscription.user_id });
    const currentAccessDate =
      subscription.active_until && Number.isFinite(new Date(subscription.active_until).getTime())
        ? new Date(subscription.active_until)
        : snapshot?.premium_until && Number.isFinite(new Date(snapshot.premium_until).getTime())
          ? new Date(snapshot.premium_until)
          : eventDate;
    activeUntil = addMonobankBillingPeriod(maxDate(currentAccessDate, eventDate), subscription.interval || "1m").toISOString();
  }

  const amount = typeof payload.amount === "number" ? payload.amount : subscription.amount;
  const currency = getMonobankCurrencyLabelByCode(payload.ccy);
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("monobank_subscriptions")
    .update({
      status: eventType,
      amount: typeof amount === "number" ? amount : undefined,
      currency,
      active_from: eventType === "success" ? eventDate.toISOString() : undefined,
      active_until: activeUntil || undefined,
      mono_modified_date: stringValue(payload.modifiedDate) || null,
      raw_payload: payload,
      updated_at: now
    })
    .eq("subscription_id", subscriptionId);
  if (updateError) throw new Error(updateError.message);

  if (invoiceId) {
    const { error: paymentError } = await supabase.from("monobank_payments").upsert(
      {
        id: `mono_${randomUUID()}`,
        user_id: subscription.user_id,
        invoice_id: invoiceId,
        plan_code: subscription.plan_code,
        amount: typeof amount === "number" ? amount : 0,
        currency,
        status: eventType,
        period_months: subscription.period_months || 1,
        active_from: eventType === "success" ? eventDate.toISOString() : null,
        active_until: activeUntil,
        mono_modified_date: stringValue(payload.modifiedDate) || null,
        raw_payload: payload,
        updated_at: now
      },
      { onConflict: "invoice_id" }
    );
    if (paymentError) throw new Error(paymentError.message);
  }

  if (eventType === "success") {
    await updateProfessionalPremiumFromMonobank({
      professionalId: subscription.user_id,
      status: "active",
      premiumUntil: activeUntil,
      planCode: subscription.plan_code,
      invoiceId: invoiceId || subscriptionId
    });
  }

  await supabase
    .from("webhook_events")
    .update({ processed: true, processed_at: now, user_id: subscription.user_id })
    .eq("provider", "monobank")
    .eq("event_id", eventId);

  return NextResponse.json({ ok: true });
}

import { createPublicKey, verify as verifySignature } from "crypto";
import { NextResponse } from "next/server";
import { updateProfessionalPremiumFromMonobank } from "../../../../lib/premium";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function getPublicKey() {
  const configured = process.env.MONOBANK_PUBLIC_KEY_BASE64?.trim();
  if (configured) return configured;

  const token = process.env.MONOBANK_TOKEN?.trim();
  if (!token) return "";

  const response = await fetch("https://api.monobank.ua/api/merchant/pubkey", {
    headers: { "X-Token": token },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as { key?: string };
  return response.ok ? payload.key || "" : "";
}

async function isValidSignature(body: Buffer, signatureHeader: string | null) {
  if (process.env.MONOBANK_SKIP_SIGNATURE_VERIFY === "true" && process.env.NODE_ENV !== "production") {
    return true;
  }
  if (!signatureHeader) return false;

  const publicKeyBase64 = await getPublicKey();
  if (!publicKeyBase64) return false;

  const publicKey = createPublicKey(Buffer.from(publicKeyBase64, "base64"));
  const signature = Buffer.from(signatureHeader, "base64");
  return verifySignature("sha256", body, publicKey, signature);
}

function mapWebhookStatus(status: string) {
  if (status === "success") return "success";
  if (status === "failure") return "failure";
  if (status === "expired") return "expired";
  if (status === "reversed") return "reversed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  return status || "processing";
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-sign") || request.headers.get("X-Sign");
  const valid = await isValidSignature(body, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(body.toString("utf8")) as {
    invoiceId?: string;
    status?: string;
    amount?: number;
    ccy?: number;
    modifiedDate?: string;
    createdDate?: string;
  };
  const invoiceId = payload.invoiceId || "";
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 500 });
  }

  const eventType = mapWebhookStatus(String(payload.status || ""));
  const eventId = `${invoiceId}:${eventType}:${payload.modifiedDate || payload.createdDate || ""}`;
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

  const { data: payment, error: paymentError } = await supabase
    .from("monobank_payments")
    .select("id, user_id, plan_code, period_months, mono_modified_date")
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (paymentError) throw new Error(paymentError.message);
  if (!payment) {
    return NextResponse.json({ ok: true, ignored: "payment_not_found" });
  }

  const incomingModified = payload.modifiedDate ? new Date(payload.modifiedDate).getTime() : 0;
  const existingModified = payment.mono_modified_date ? new Date(payment.mono_modified_date).getTime() : 0;
  if (existingModified && incomingModified && incomingModified < existingModified) {
    return NextResponse.json({ ok: true, ignored: "stale_event" });
  }

  const paidAt = payload.modifiedDate ? new Date(payload.modifiedDate) : new Date();
  const activeUntil = eventType === "success" ? addMonths(paidAt, payment.period_months || 1).toISOString() : null;
  const { error: updateError } = await supabase
    .from("monobank_payments")
    .update({
      status: eventType,
      amount: typeof payload.amount === "number" ? payload.amount : undefined,
      currency: payload.ccy === 980 ? "UAH" : "UAH",
      active_from: eventType === "success" ? paidAt.toISOString() : null,
      active_until: activeUntil,
      mono_modified_date: payload.modifiedDate || null,
      raw_payload: payload,
      updated_at: new Date().toISOString()
    })
    .eq("invoice_id", invoiceId);
  if (updateError) throw new Error(updateError.message);

  if (eventType === "success") {
    await updateProfessionalPremiumFromMonobank({
      professionalId: payment.user_id,
      status: "active",
      premiumUntil: activeUntil,
      planCode: payment.plan_code,
      invoiceId
    });
  }

  await supabase
    .from("webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString(), user_id: payment.user_id })
    .eq("provider", "monobank")
    .eq("event_id", eventId);

  return NextResponse.json({ ok: true });
}

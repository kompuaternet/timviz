import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getMonobankAmount,
  getMonobankCurrencyCode,
  getMonobankCurrencyLabel,
  getMonobankPlanCode,
  getMonobankToken,
  type MonobankBilling
} from "../../../../../lib/monobank-billing";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = getMonobankToken();
  if (!token) {
    return NextResponse.json({ error: "Monobank token is not configured." }, { status: 500 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value || "") || "";
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { billing?: string };
  const billing: MonobankBilling = body.billing === "yearly" ? "yearly" : "monthly";
  const amount = getMonobankAmount(billing);
  const currencyCode = getMonobankCurrencyCode();
  const currencyLabel = getMonobankCurrencyLabel();
  const planCode = getMonobankPlanCode(billing);
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://timviz.com").replace(/\/+$/, "");
  const reference = `timviz_${professionalId}_${Date.now()}`;

  const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Token": token,
      "X-Cms": "Timviz",
      "X-Cms-Version": "1.0"
    },
    body: JSON.stringify({
      amount,
      ccy: currencyCode,
      merchantPaymInfo: {
        reference,
        destination: billing === "yearly" ? "Timviz PRO Yearly" : "Timviz PRO Monthly"
      },
      redirectUrl: `${appUrl}/pro/settings?billing=success`,
      webHookUrl: `${appUrl}/api/webhooks/monobank`,
      validity: 24 * 60 * 60
    })
  });

  const payload = (await response.json().catch(() => ({}))) as { invoiceId?: string; pageUrl?: string; errText?: string };
  if (!response.ok || !payload.invoiceId || !payload.pageUrl) {
    return NextResponse.json({ error: payload.errText || "Could not create Monobank invoice." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 500 });
  }

  const { error } = await supabase.from("monobank_payments").upsert(
    {
      id: `mono_${randomUUID()}`,
      user_id: professionalId,
      invoice_id: payload.invoiceId,
      plan_code: planCode,
      amount,
      currency: currencyLabel,
      status: "created",
      period_months: billing === "yearly" ? 12 : 1,
      raw_payload: payload,
      updated_at: new Date().toISOString()
    },
    { onConflict: "invoice_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    invoiceId: payload.invoiceId,
    paymentUrl: payload.pageUrl,
    pageUrl: payload.pageUrl
  });
}

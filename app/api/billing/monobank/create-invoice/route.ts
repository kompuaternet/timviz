import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../../../../lib/supabase";

export const dynamic = "force-dynamic";

type Billing = "monthly" | "yearly";

function getAmount(billing: Billing) {
  const minorEnv =
    billing === "yearly"
      ? process.env.MONOBANK_AMOUNT_YEARLY
      : process.env.MONOBANK_AMOUNT_MONTHLY;
  const uahEnv =
    billing === "yearly"
      ? process.env.MONOBANK_PRICE_YEARLY_UAH
      : process.env.MONOBANK_PRICE_MONTHLY_UAH;

  const minor = Number(minorEnv);
  if (Number.isFinite(minor) && minor > 0) return Math.round(minor);

  const uah = Number(uahEnv);
  if (Number.isFinite(uah) && uah > 0) return Math.round(uah * 100);

  return billing === "yearly" ? 116000 : 12000;
}

function getPlanCode(billing: Billing) {
  return billing === "yearly" ? "pro_yearly" : "pro_monthly";
}

export async function POST(request: Request) {
  const token = process.env.MONOBANK_TOKEN?.trim();
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
  const billing: Billing = body.billing === "yearly" ? "yearly" : "monthly";
  const amount = getAmount(billing);
  const planCode = getPlanCode(billing);
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
      ccy: 980,
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
      currency: "UAH",
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

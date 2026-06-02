import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../lib/app-url";
import {
  getMonobankAmount,
  getMonobankInterval,
  getMonobankPeriodMonths,
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
  const interval = getMonobankInterval(billing);
  const planCode = getMonobankPlanCode(billing);
  const appUrl = getPublicAppUrl(request);

  const response = await fetch("https://api.monobank.ua/api/merchant/subscription/create", {
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
      redirectUrl: `${appUrl}/pro/settings?billing=success`,
      webHookUrls: {
        chargeUrl: `${appUrl}/api/webhooks/monobank/subscription/charge`,
        statusUrl: `${appUrl}/api/webhooks/monobank/subscription/status`
      },
      interval,
      validity: 24 * 60 * 60
    })
  });

  const payload = (await response.json().catch(() => ({}))) as {
    subscriptionId?: string;
    pageUrl?: string;
    errText?: string;
  };
  if (!response.ok || !payload.subscriptionId || !payload.pageUrl) {
    return NextResponse.json({ error: payload.errText || "Could not create Monobank subscription." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("monobank_subscriptions").upsert(
    {
      id: `mono_sub_${randomUUID()}`,
      user_id: professionalId,
      subscription_id: payload.subscriptionId,
      plan_code: planCode,
      amount,
      currency: "UAH",
      status: "created",
      interval,
      period_months: getMonobankPeriodMonths(interval),
      raw_payload: payload,
      updated_at: now
    },
    { onConflict: "subscription_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    subscriptionId: payload.subscriptionId,
    paymentUrl: payload.pageUrl,
    pageUrl: payload.pageUrl
  });
}


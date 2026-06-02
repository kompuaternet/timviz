import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getLatestMonobankSubscriptionForUser,
  getMonobankToken,
  isActiveMonobankSubscription
} from "../../../../../lib/monobank-billing";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { updateProfessionalPremiumFromMonobank } from "../../../../../lib/premium";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
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

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database is unavailable." }, { status: 500 });
  }

  const subscription = await getLatestMonobankSubscriptionForUser(professionalId);
  if (!subscription || !isActiveMonobankSubscription(subscription)) {
    return NextResponse.json({ error: "Active Monobank subscription was not found." }, { status: 404 });
  }

  const response = await fetch("https://api.monobank.ua/api/merchant/subscription/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Token": token,
      "X-Cms": "Timviz",
      "X-Cms-Version": "1.0"
    },
    body: JSON.stringify({
      subscriptionId: subscription.subscriptionId,
      action: "cancel"
    })
  });

  const payload = (await response.json().catch(() => ({}))) as { errText?: string };
  if (!response.ok) {
    return NextResponse.json({ error: payload.errText || "Could not cancel Monobank subscription." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("monobank_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: now,
      raw_payload: payload,
      updated_at: now
    })
    .eq("subscription_id", subscription.subscriptionId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await updateProfessionalPremiumFromMonobank({
    professionalId,
    status: "cancelled",
    premiumUntil: subscription.activeUntil || null,
    planCode: subscription.planCode,
    invoiceId: subscription.subscriptionId,
    cancelAtPeriodEnd: true
  });

  return NextResponse.json({
    ok: true,
    subscription: {
      ...subscription,
      status: "cancelled",
      cancelledAt: now
    }
  });
}

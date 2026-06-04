import {
  getMonobankAccessUntil,
  getMonobankCurrencyLabelByCode,
  getMonobankPaidUntil,
  getMonobankSubscriptionStatus,
  mapMonobankStatus,
  parseMonobankDate
} from "./monobank-billing";
import { updateProfessionalPremiumFromMonobank } from "./premium";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

type SyncMonobankSubscriptionResult =
  | {
      ok: true;
      active: boolean;
      status: string;
      premiumUntil: string | null;
      subscriptionId: string;
    }
  | {
      ok: false;
      reason: string;
      status?: string;
      subscriptionId?: string;
    };

export async function syncLatestMonobankSubscriptionForUser(professionalId: string): Promise<SyncMonobankSubscriptionResult> {
  if (!professionalId) return { ok: false, reason: "unauthorized" };
  if (!isSupabaseConfigured()) return { ok: false, reason: "database_not_configured" };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, reason: "database_unavailable" };

  const { data: subscription, error } = await supabase
    .from("monobank_subscriptions")
    .select("id, user_id, subscription_id, plan_code, amount, currency, status, interval, active_until")
    .eq("user_id", professionalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!subscription?.subscription_id) return { ok: false, reason: "subscription_not_found" };

  const payload = await getMonobankSubscriptionStatus(String(subscription.subscription_id));
  const status = mapMonobankStatus(String(payload.status || subscription.status || ""));
  const activeUntil = getMonobankAccessUntil({
    status,
    interval: typeof payload.interval === "string" ? payload.interval : String(subscription.interval || "1m"),
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    nextChargeDate: payload.nextChargeDate || null,
    fallbackDate: new Date()
  });
  const paidUntil = getMonobankPaidUntil({
    endDate: payload.endDate || null,
    nextChargeDate: payload.nextChargeDate || null,
    fallbackDate: typeof subscription.active_until === "string" ? subscription.active_until : null
  });
  const startDate = parseMonobankDate(payload.startDate);
  const nextChargeDate = parseMonobankDate(payload.nextChargeDate);
  const cancelled = status === "cancelled";
  const effectiveActiveUntil = activeUntil || (cancelled ? paidUntil : null);
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("monobank_subscriptions")
    .update({
      status,
      amount: typeof payload.amount === "number" ? payload.amount : subscription.amount,
      currency: payload.ccy ? getMonobankCurrencyLabelByCode(payload.ccy) : subscription.currency,
      interval: typeof payload.interval === "string" && payload.interval.trim() ? payload.interval.trim() : subscription.interval,
      active_from: startDate ? startDate.toISOString() : undefined,
      active_until: effectiveActiveUntil || undefined,
      next_charge_at: nextChargeDate ? nextChargeDate.toISOString() : null,
      cancelled_at: cancelled ? now : null,
      mono_modified_date: now,
      raw_payload: payload,
      updated_at: now
    })
    .eq("subscription_id", subscription.subscription_id);
  if (updateError) throw new Error(updateError.message);

  if (status === "active" || status === "success") {
    await updateProfessionalPremiumFromMonobank({
      professionalId,
      status: "active",
      premiumUntil: activeUntil,
      planCode: String(subscription.plan_code || "pro_monthly"),
      invoiceId: String(subscription.subscription_id)
    });
  } else if (cancelled) {
    await updateProfessionalPremiumFromMonobank({
      professionalId,
      status: "cancelled",
      premiumUntil: effectiveActiveUntil,
      planCode: String(subscription.plan_code || "pro_monthly"),
      invoiceId: String(subscription.subscription_id),
      cancelAtPeriodEnd: true
    });
  }

  return {
    ok: true,
    active: status === "active" || status === "success",
    status,
    premiumUntil: effectiveActiveUntil,
    subscriptionId: String(subscription.subscription_id)
  };
}

import { createPublicKey, verify as verifySignature } from "crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type MonobankBilling = "monthly" | "yearly";
export type MonobankMappedStatus =
  | "created"
  | "processing"
  | "success"
  | "failure"
  | "expired"
  | "reversed"
  | "cancelled"
  | "active";

export type MonobankSubscriptionSummary = {
  subscriptionId: string;
  planCode: string;
  amount: number;
  currency: string;
  status: string;
  activeUntil: string | null;
  nextChargeAt: string | null;
  cancelledAt: string | null;
};

export type MonobankSubscriptionStatusPayload = {
  subscriptionId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  ccy?: number;
  interval?: string;
  nextChargeDate?: string;
  cancellationDesc?: string;
  errText?: string;
};

const activeSubscriptionStatuses = ["active", "success", "processing"] as const;

export function getMonobankToken() {
  return process.env.MONOBANK_TOKEN?.trim() || "";
}

export function getMonobankCurrencyCode() {
  const code = Number(process.env.MONOBANK_CURRENCY_CODE || process.env.MONOBANK_CCY || "840");
  return Number.isFinite(code) && code > 0 ? Math.round(code) : 840;
}

export function getMonobankCurrencyLabel() {
  return getMonobankCurrencyLabelByCode(getMonobankCurrencyCode());
}

export function getMonobankCurrencyLabelByCode(code: unknown) {
  const numeric = typeof code === "number" ? code : Number(code);
  if (numeric === 980) return "UAH";
  if (numeric === 978) return "EUR";
  if (numeric === 826) return "GBP";
  if (numeric === 985) return "PLN";
  return "USD";
}

export function getMonobankAmount(billing: MonobankBilling) {
  const minorEnv =
    billing === "yearly"
      ? process.env.MONOBANK_AMOUNT_YEARLY
      : process.env.MONOBANK_AMOUNT_MONTHLY;
  const priceEnv =
    billing === "yearly"
      ? process.env.MONOBANK_PRICE_YEARLY_USD || process.env.MONOBANK_PRICE_YEARLY
      : process.env.MONOBANK_PRICE_MONTHLY_USD || process.env.MONOBANK_PRICE_MONTHLY;

  const minor = Number(minorEnv);
  if (Number.isFinite(minor) && minor > 0) return Math.round(minor);

  const price = Number(priceEnv);
  if (Number.isFinite(price) && price > 0) return Math.round(price * 100);

  return billing === "yearly" ? 2900 : 300;
}

export function getMonobankPlanCode(billing: MonobankBilling) {
  return billing === "yearly" ? "pro_yearly" : "pro_monthly";
}

export function getMonobankInterval(billing: MonobankBilling) {
  return billing === "yearly" ? "1y" : "1m";
}

export function getMonobankPeriodMonths(intervalOrBilling: string) {
  if (intervalOrBilling === "yearly" || intervalOrBilling.endsWith("y")) return 12;
  return 1;
}

export function addMonobankBillingPeriod(date: Date, intervalOrBilling: string) {
  const next = new Date(date);
  const periodMonths = getMonobankPeriodMonths(intervalOrBilling);
  next.setMonth(next.getMonth() + periodMonths);
  return next;
}

export function mapMonobankStatus(status: string): MonobankMappedStatus {
  const normalized = status.trim().toLowerCase();
  if (["success", "succeeded", "paid", "approved"].includes(normalized)) return "success";
  if (normalized === "failure" || normalized === "failed") return "failure";
  if (normalized === "expired") return "expired";
  if (normalized === "reversed") return "reversed";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "active") return "active";
  if (normalized === "created") return "created";
  return "processing";
}

export function getMonobankEventDate(payload: Record<string, unknown>) {
  const value =
    typeof payload.modifiedDate === "string"
      ? payload.modifiedDate
      : typeof payload.createdDate === "string"
        ? payload.createdDate
        : typeof payload.date === "string"
          ? payload.date
          : "";
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

export function parseMonobankDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getMonobankAccessUntil(input: {
  status: string;
  interval?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  nextChargeDate?: string | null;
  fallbackDate?: Date | string | null;
}) {
  const status = mapMonobankStatus(input.status);
  if (status !== "active" && status !== "success") return null;

  const nextChargeDate = parseMonobankDate(input.nextChargeDate);
  const endDate = parseMonobankDate(input.endDate);
  const explicitDates = [nextChargeDate, endDate].filter((date): date is Date => Boolean(date));
  if (explicitDates.length > 0) {
    return new Date(Math.max(...explicitDates.map((date) => date.getTime()))).toISOString();
  }

  const startDate =
    parseMonobankDate(input.startDate) ||
    (input.fallbackDate instanceof Date ? input.fallbackDate : parseMonobankDate(input.fallbackDate)) ||
    new Date();
  return addMonobankBillingPeriod(startDate, input.interval || "1m").toISOString();
}

export async function getMonobankSubscriptionStatus(subscriptionId: string) {
  const token = getMonobankToken();
  if (!token) throw new Error("Monobank token is not configured.");

  const url = new URL("https://api.monobank.ua/api/merchant/subscription/status");
  url.searchParams.set("subscriptionId", subscriptionId);
  const response = await fetch(url, {
    headers: { "X-Token": token },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as MonobankSubscriptionStatusPayload;
  if (!response.ok) {
    throw new Error(payload.errText || "Could not refresh Monobank subscription status.");
  }
  return payload;
}

async function getMonobankPublicKey() {
  const configured = process.env.MONOBANK_PUBLIC_KEY_BASE64?.trim();
  if (configured) return configured;

  const token = getMonobankToken();
  if (!token) return "";

  const response = await fetch("https://api.monobank.ua/api/merchant/pubkey", {
    headers: { "X-Token": token },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as { key?: string };
  return response.ok ? payload.key || "" : "";
}

export async function isValidMonobankSignature(body: Buffer, signatureHeader: string | null) {
  if (process.env.MONOBANK_SKIP_SIGNATURE_VERIFY === "true" && process.env.NODE_ENV !== "production") {
    return true;
  }
  if (!signatureHeader) return false;

  const publicKeyBase64 = await getMonobankPublicKey();
  if (!publicKeyBase64) return false;

  const publicKey = createPublicKey(Buffer.from(publicKeyBase64, "base64"));
  const signature = Buffer.from(signatureHeader, "base64");
  return verifySignature("sha256", body, publicKey, signature);
}

export async function getLatestMonobankSubscriptionForUser(userId: string): Promise<MonobankSubscriptionSummary | null> {
  if (!userId || !isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("monobank_subscriptions")
    .select("subscription_id, plan_code, amount, currency, status, active_until, next_charge_at, cancelled_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.subscription_id) return null;

  return {
    subscriptionId: String(data.subscription_id),
    planCode: typeof data.plan_code === "string" ? data.plan_code : "pro_monthly",
    amount: typeof data.amount === "number" ? data.amount : 0,
    currency: typeof data.currency === "string" ? data.currency : "USD",
    status: typeof data.status === "string" ? data.status : "created",
    activeUntil: typeof data.active_until === "string" ? data.active_until : null,
    nextChargeAt: typeof data.next_charge_at === "string" ? data.next_charge_at : null,
    cancelledAt: typeof data.cancelled_at === "string" ? data.cancelled_at : null
  };
}

export function isActiveMonobankSubscription(subscription: MonobankSubscriptionSummary | null) {
  return Boolean(
    subscription &&
      activeSubscriptionStatuses.includes(subscription.status as (typeof activeSubscriptionStatuses)[number]) &&
      !subscription.cancelledAt
  );
}

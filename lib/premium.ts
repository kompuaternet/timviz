import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { SiteLanguage } from "./site-language";

export type TimvizPlan = "free" | "premium";
export type PremiumStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";
export type PremiumBilling = "monthly" | "yearly";

export const FREE_APPOINTMENTS_PER_MONTH = 100;

const freeLimitMessages: Record<SiteLanguage, string> = {
  ru: "Вы достигли лимита бесплатного тарифа. Перейдите на Premium, чтобы создавать записи без ограничений.",
  uk: "Ви досягли ліміту безкоштовного тарифу. Перейдіть на Premium, щоб створювати записи без обмежень.",
  en: "You have reached the Free plan limit. Upgrade to Premium to create unlimited appointments."
};

export function normalizePlan(value: unknown): TimvizPlan {
  return value === "premium" ? "premium" : "free";
}

export function normalizePremiumStatus(value: unknown): PremiumStatus {
  return value === "trialing" ||
    value === "active" ||
    value === "past_due" ||
    value === "canceled"
    ? value
    : "inactive";
}

export function getFreePlanLimitMessage(language: unknown) {
  return freeLimitMessages[language === "uk" || language === "en" || language === "ru" ? language : "ru"];
}

export function isPremiumAccessActive(input: {
  plan?: unknown;
  premiumStatus?: unknown;
  premiumUntil?: string | null;
}) {
  if (normalizePlan(input.plan) !== "premium") {
    return false;
  }

  const status = normalizePremiumStatus(input.premiumStatus);
  if (status === "active" || status === "trialing") {
    return true;
  }

  if (status === "canceled" && input.premiumUntil) {
    return new Date(input.premiumUntil).getTime() > Date.now();
  }

  return false;
}

export function getPremiumBillingFromPriceId(priceId: string | null | undefined): PremiumBilling | null {
  const monthly = process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY?.trim();
  const yearly = process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY?.trim();

  if (priceId && monthly && priceId === monthly) return "monthly";
  if (priceId && yearly && priceId === yearly) return "yearly";
  return null;
}

function isFutureDate(value: string | null | undefined) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function maxIsoDate(left: string | null | undefined, right: string | null | undefined) {
  if (!left) return right ?? null;
  if (!right) return left;

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  if (!Number.isFinite(leftTime)) return right;
  if (!Number.isFinite(rightTime)) return left;

  return leftTime >= rightTime ? left : right;
}

export function getPremiumUntilAfterCheckout(input: {
  existingPremiumUntil?: string | null;
  billing?: PremiumBilling | null;
}) {
  if (isFutureDate(input.existingPremiumUntil) && input.billing) {
    const date = new Date(input.existingPremiumUntil as string);
    if (input.billing === "yearly") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString();
  }

  const trialUntil = new Date();
  trialUntil.setDate(trialUntil.getDate() + 14);
  return trialUntil.toISOString();
}

export async function getProfessionalPremiumSnapshot(input: {
  professionalId?: string | null;
  email?: string | null;
}) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  const columns = "id, premium_until, paddle_price_id, premium_status";

  if (input.professionalId) {
    const { data, error } = await supabase
      .from("professionals")
      .select(columns)
      .eq("id", input.professionalId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as { id: string; premium_until: string | null; paddle_price_id: string | null; premium_status: string | null };
  }

  const email = input.email?.trim().toLowerCase();
  if (email) {
    const { data, error } = await supabase
      .from("professionals")
      .select(columns)
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as { id: string; premium_until: string | null; paddle_price_id: string | null; premium_status: string | null };
  }

  return null;
}

export async function updateProfessionalPremiumFromPaddle(input: {
  professionalId?: string | null;
  email?: string | null;
  status: PremiumStatus;
  premiumUntil?: string | null;
  paddleCustomerId?: string | null;
  paddleSubscriptionId?: string | null;
  paddlePriceId?: string | null;
}) {
  if (!isSupabaseConfigured()) {
    console.info("[paddle] Supabase is not configured; skipping premium update.", {
      professionalId: input.professionalId,
      email: input.email,
      status: input.status
    });
    return { updated: false, reason: "supabase_not_configured" as const };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { updated: false, reason: "supabase_unavailable" as const };
  }

  const patch: Record<string, string | null> = {
    plan: input.status === "inactive" ? "free" : "premium",
    premium_status: input.status
  };

  if (input.premiumUntil !== undefined) {
    patch.premium_until = input.premiumUntil;
  }

  if (input.paddleCustomerId) {
    patch.paddle_customer_id = input.paddleCustomerId;
  }

  if (input.paddleSubscriptionId) {
    patch.paddle_subscription_id = input.paddleSubscriptionId;
  }

  if (input.paddlePriceId) {
    patch.paddle_price_id = input.paddlePriceId;
  }

  if (input.premiumUntil) {
    const existing = await getProfessionalPremiumSnapshot(input);
    patch.premium_until = maxIsoDate(existing?.premium_until, input.premiumUntil);
  }

  if (input.professionalId) {
    const { data, error } = await supabase
      .from("professionals")
      .update(patch)
      .eq("id", input.professionalId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) {
      return { updated: true, by: "id" as const, professionalId: data.id };
    }
  }

  const email = input.email?.trim().toLowerCase();
  if (email) {
    const { data, error } = await supabase
      .from("professionals")
      .update(patch)
      .eq("email", email)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) {
      return { updated: true, by: "email" as const, professionalId: data.id };
    }
  }

  return { updated: false, reason: input.professionalId || email ? "professional_not_found" as const : "no_user_reference" as const };
}

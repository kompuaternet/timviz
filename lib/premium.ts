import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { withEnglishFallback, type SiteLanguage } from "./site-language";

export type TimvizPlan = "free" | "premium";
export type PremiumStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";
export type PremiumBilling = "monthly" | "yearly";
export type EntitlementSource = "apple" | "monobank" | "manual" | "promo" | "free" | "mixed";

export type UserAccess = {
  plan: "free" | "pro";
  isPro: boolean;
  source: EntitlementSource;
  activeUntil: string | null;
  features: Record<string, boolean | number | string>;
};

export const FREE_APPOINTMENTS_PER_MONTH = 100;
export const PREMIUM_TRIAL_DAYS = 14;

const freeLimitMessages: Record<SiteLanguage, string> = withEnglishFallback<string>({
  ru: "В этом месяце бесплатные записи закончились. Premium откроет новые записи без ограничений.",
  uk: "Цього місяця безкоштовні записи закінчилися. Premium відкриє нові записи без обмежень.",
  en: "Free appointments are used up for this month. Premium unlocks unlimited appointments."
});

Object.assign(freeLimitMessages, {
  fr: "Les réservations gratuites de ce mois sont épuisées. Premium débloque les réservations illimitées.",
  pl: "Darmowe rezerwacje w tym miesiącu zostały wykorzystane. Premium odblokowuje rezerwacje bez limitów.",
  cs: "Bezplatné rezervace na tento měsíc jsou vyčerpány. Premium odemkne neomezené rezervace.",
  es: "Las reservas gratuitas de este mes se han agotado. Premium desbloquea reservas ilimitadas.",
  de: "Die kostenlosen Buchungen für diesen Monat sind aufgebraucht. Premium schaltet unbegrenzte Buchungen frei."
});

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
  return freeLimitMessages[typeof language === "string" && language in freeLimitMessages ? (language as SiteLanguage) : "ru"];
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
  if (status === "active") {
    return true;
  }

  if (status === "trialing") {
    return isFutureDate(input.premiumUntil);
  }

  if (status === "canceled" && input.premiumUntil) {
    return isFutureDate(input.premiumUntil);
  }

  return false;
}

export function getPremiumTrialUntil(startDate: Date | string = new Date()) {
  const date = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
  if (!Number.isFinite(date.getTime())) {
    date.setTime(Date.now());
  }
  date.setDate(date.getDate() + PREMIUM_TRIAL_DAYS);
  return date.toISOString();
}

export function getPremiumBillingFromAppStoreProductId(productId: string | null | undefined): PremiumBilling | null {
  const monthly =
    process.env.NEXT_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?.trim() ||
    process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?.trim() ||
    "timviz_premium_monthly";
  const yearly =
    process.env.NEXT_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID?.trim() ||
    process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID?.trim() ||
    "timviz_premium_yearly";

  if (productId && monthly && productId === monthly) return "monthly";
  if (productId && yearly && productId === yearly) return "yearly";
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

function entitlementStatusFromPremiumStatus(status: PremiumStatus) {
  if (status === "trialing") return "trial";
  if (status === "active" || status === "canceled") return "active";
  if (status === "past_due") return "grace";
  return "expired";
}

function isActiveEntitlement(status: unknown, activeUntil: unknown) {
  const normalizedStatus = String(status || "");
  if (!["active", "trial", "grace"].includes(normalizedStatus)) return false;
  if (!activeUntil) return normalizedStatus === "active";
  return isFutureDate(String(activeUntil));
}

function isMissingEntitlementsTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: unknown; message?: unknown };
  const code = typeof details.code === "string" ? details.code : "";
  const message = typeof details.message === "string" ? details.message : "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("user_entitlements") ||
    message.includes("apple_subscriptions")
  );
}

export async function upsertUserEntitlement(input: {
  userId: string;
  planCode: string;
  status: "free" | "trial" | "active" | "grace" | "expired" | "cancelled" | "blocked";
  source: Exclude<EntitlementSource, "mixed">;
  activeFrom?: string | null;
  activeUntil?: string | null;
  trialUntil?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  if (!isSupabaseConfigured()) return { updated: false, reason: "supabase_not_configured" as const };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { updated: false, reason: "supabase_unavailable" as const };

  const id = `${input.userId}:${input.source}:${input.planCode}`;
  const { error } = await supabase.from("user_entitlements").upsert(
    {
      id,
      user_id: input.userId,
      plan_code: input.planCode,
      status: input.status,
      source: input.source,
      active_from: input.activeFrom || new Date().toISOString(),
      active_until: input.activeUntil || null,
      trial_until: input.trialUntil || null,
      cancel_at_period_end: input.cancelAtPeriodEnd === true,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
  if (error) {
    if (isMissingEntitlementsTableError(error)) {
      return { updated: false, reason: "entitlements_table_missing" as const };
    }
    throw new Error(error.message);
  }
  return { updated: true };
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const freeAccess: UserAccess = {
    plan: "free",
    isPro: false,
    source: "free",
    activeUntil: null,
    features: {
      limitedAppointments: true,
      basicServices: true,
      basicCalendar: true
    }
  };

  if (!isSupabaseConfigured()) return freeAccess;
  const supabase = getSupabaseAdmin();
  if (!supabase) return freeAccess;

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("plan_code, status, source, active_until")
    .eq("user_id", userId);

  if (error) {
    if (isMissingEntitlementsTableError(error)) {
      const snapshot = await getProfessionalPremiumSnapshot({ professionalId: userId });
      if (snapshot && isPremiumAccessActive({ plan: "premium", premiumStatus: snapshot.premium_status, premiumUntil: snapshot.premium_until })) {
        return {
          plan: "pro",
          isPro: true,
          source: "manual",
          activeUntil: snapshot.premium_until || null,
          features: PRO_FEATURES
        };
      }
      return freeAccess;
    }
    throw new Error(error.message);
  }

  const active = (data || []).filter((item) => item.plan_code !== "free" && isActiveEntitlement(item.status, item.active_until));
  if (!active.length) {
    const snapshot = await getProfessionalPremiumSnapshot({ professionalId: userId });
    if (snapshot && isPremiumAccessActive({ plan: "premium", premiumStatus: snapshot.premium_status, premiumUntil: snapshot.premium_until })) {
      return {
        plan: "pro",
        isPro: true,
        source: "manual",
        activeUntil: snapshot.premium_until || null,
        features: PRO_FEATURES
      };
    }
    return freeAccess;
  }

  const sorted = [...active].sort((left, right) => {
    const leftTime = left.active_until ? new Date(left.active_until).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.active_until ? new Date(right.active_until).getTime() : Number.MAX_SAFE_INTEGER;
    return rightTime - leftTime;
  });
  const sources = Array.from(new Set(active.map((item) => String(item.source || "manual"))));

  return {
    plan: "pro",
    isPro: true,
    source: sources.length > 1 ? "mixed" : (sources[0] as EntitlementSource) || "manual",
    activeUntil: sorted[0]?.active_until || null,
    features: PRO_FEATURES
  };
}

export const PRO_FEATURES: Record<string, boolean | number | string> = {
  unlimitedAppointments: true,
  onlineBooking: true,
  telegramBot: true,
  reminders: true,
  analytics: true,
  team: true,
  advancedSchedule: true
};

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

  return getPremiumTrialUntil();
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

  const columns = "id, premium_until, premium_status";

  if (input.professionalId) {
    const { data, error } = await supabase
      .from("professionals")
      .select(columns)
      .eq("id", input.professionalId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as { id: string; premium_until: string | null; premium_status: string | null };
  }

  const email = input.email?.trim().toLowerCase();
  if (email) {
    const { data, error } = await supabase
      .from("professionals")
      .select(columns)
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as { id: string; premium_until: string | null; premium_status: string | null };
  }

  return null;
}

export async function updateProfessionalPremiumFromAppStore(input: {
  professionalId?: string | null;
  email?: string | null;
  status: PremiumStatus;
  premiumUntil?: string | null;
  productId?: string | null;
  transactionId?: string | null;
  originalTransactionId?: string | null;
}) {
  if (!isSupabaseConfigured()) {
    console.info("[app-store] Supabase is not configured; skipping premium update.", {
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
  const admin = supabase;

  const patch: Record<string, string | null> = {
    plan: input.status === "inactive" ? "free" : "premium",
    premium_status: input.status
  };

  if (input.premiumUntil !== undefined) {
    patch.premium_until = input.premiumUntil;
  }

  if (input.premiumUntil) {
    const existing = await getProfessionalPremiumSnapshot(input);
    patch.premium_until = maxIsoDate(existing?.premium_until, input.premiumUntil);
  }

  async function syncAppStoreEntitlement(professionalId: string) {
    const status = entitlementStatusFromPremiumStatus(input.status);
    await upsertUserEntitlement({
      userId: professionalId,
      planCode: getPremiumBillingFromAppStoreProductId(input.productId) === "yearly" ? "pro_yearly" : "pro_monthly",
      status,
      source: "apple",
      activeUntil: patch.premium_until || input.premiumUntil || null,
      trialUntil: status === "trial" ? patch.premium_until || input.premiumUntil || null : null,
      cancelAtPeriodEnd: input.status === "canceled"
    });

    if (input.originalTransactionId || input.transactionId) {
      const subscriptionId = input.originalTransactionId || input.transactionId || `${professionalId}:${input.productId || "apple"}`;
      const { error } = await admin.from("apple_subscriptions").upsert(
        {
          id: `apple_${subscriptionId}`,
          user_id: professionalId,
          original_transaction_id: subscriptionId,
          transaction_id: input.transactionId || null,
          product_id: input.productId || "",
          status,
          expires_at: patch.premium_until || input.premiumUntil || null,
          raw_payload: {
            productId: input.productId || null,
            transactionId: input.transactionId || null,
            originalTransactionId: input.originalTransactionId || null
          },
          updated_at: new Date().toISOString()
        },
        { onConflict: "original_transaction_id" }
      );
      if (error && !isMissingEntitlementsTableError(error)) throw new Error(error.message);
    }
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
      await syncAppStoreEntitlement(data.id);
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
      await syncAppStoreEntitlement(data.id);
      return { updated: true, by: "email" as const, professionalId: data.id };
    }
  }

  return { updated: false, reason: input.professionalId || email ? "professional_not_found" as const : "no_user_reference" as const };
}

export async function updateProfessionalPremiumFromMonobank(input: {
  professionalId: string;
  status: "active" | "expired" | "cancelled";
  premiumUntil?: string | null;
  planCode?: string | null;
  invoiceId?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  if (!isSupabaseConfigured()) {
    console.info("[monobank] Supabase is not configured; skipping premium update.", {
      professionalId: input.professionalId,
      status: input.status
    });
    return { updated: false, reason: "supabase_not_configured" as const };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { updated: false, reason: "supabase_unavailable" as const };
  }

  const active = input.status === "active";
  const existing = await getProfessionalPremiumSnapshot({ professionalId: input.professionalId });
  const premiumUntil =
    active || input.status === "cancelled"
      ? maxIsoDate(existing?.premium_until, input.premiumUntil)
      : existing?.premium_until || null;
  const cancelledWithRemainingAccess = input.status === "cancelled" && isFutureDate(premiumUntil);
  const premiumStatus = active ? "active" : cancelledWithRemainingAccess ? "canceled" : "inactive";
  const patch: Record<string, string | null> = {
    plan: isPremiumAccessActive({ plan: "premium", premiumStatus, premiumUntil }) ? "premium" : "free",
    premium_status: premiumStatus,
    premium_until: premiumUntil
  };

  const { data, error } = await supabase
    .from("professionals")
    .update(patch)
    .eq("id", input.professionalId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);

  await upsertUserEntitlement({
    userId: input.professionalId,
    planCode: input.planCode || "pro_monthly",
    status: active || cancelledWithRemainingAccess ? "active" : input.status,
    source: "monobank",
    activeUntil: premiumUntil,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd === true
  });

  return data?.id
    ? { updated: true, professionalId: data.id, invoiceId: input.invoiceId || null }
    : { updated: false, reason: "professional_not_found" as const };
}

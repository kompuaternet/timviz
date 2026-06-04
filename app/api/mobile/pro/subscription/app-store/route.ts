import { NextResponse } from "next/server";
import { updateProfessionalPremiumFromAppStore, type PremiumStatus } from "../../../../../../lib/premium";
import { getMobileProfessionalId } from "../../_auth";

export const dynamic = "force-dynamic";

const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "premium";
const monthlyProductId =
  process.env.NEXT_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?.trim() ||
  process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?.trim() ||
  "timviz_premium_monthly";
const yearlyProductId =
  process.env.NEXT_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID?.trim() ||
  process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID?.trim() ||
  "timviz_premium_yearly";

type NormalizedEntitlement = {
  isActive: boolean;
  productId: string;
  expirationDate: string | null;
  periodType: string;
  source: "apple" | "google";
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getBoolean(source: Record<string, unknown>, key: string) {
  return source[key] === true;
}

function isFuture(value: string | null) {
  if (!value) return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function normalizeStoreSource(value: unknown): "apple" | "google" {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("play") || normalized.includes("google") || normalized === "android") return "google";
  return "apple";
}

function isExpectedPremiumProductId(productId: string) {
  if (!productId) return false;
  return [monthlyProductId, yearlyProductId].some((expectedId) => productId === expectedId || productId.startsWith(`${expectedId}:`));
}

function getStatus(entitlement: NormalizedEntitlement | null): PremiumStatus {
  if (!entitlement || !entitlement.isActive) return "inactive";
  const periodType = entitlement.periodType.toLowerCase();
  if (periodType === "trial" || periodType === "intro") return "trialing";
  return "active";
}

function normalizeCustomerInfoEntitlement(body: Record<string, unknown>): NormalizedEntitlement | null {
  const customerInfo = asRecord(body.customerInfo);
  const entitlement = asRecord(customerInfo.entitlement);
  if (!Object.keys(entitlement).length) return null;
  const expirationDate = getString(entitlement, ["expirationDate", "expires_date"]) || null;
  const productId = getString(entitlement, ["productIdentifier", "product_identifier"]);
  if (!isExpectedPremiumProductId(productId)) return null;
  return {
    isActive: getBoolean(entitlement, "isActive") && isFuture(expirationDate),
    productId,
    expirationDate,
    periodType: getString(entitlement, ["periodType", "period_type"]),
    source: normalizeStoreSource(
      getString(entitlement, ["store", "storeType"]) ||
        getString(customerInfo, ["store", "platform"]) ||
        getString(body, ["store", "platform"])
    ),
  };
}

function normalizeStoreKitPurchase(body: Record<string, unknown>): NormalizedEntitlement | null {
  const purchase = asRecord(body.storeKitPurchase);
  if (!Object.keys(purchase).length) return null;

  const productId = getString(purchase, ["productId", "productIdentifier", "product_identifier"]);
  if (!isExpectedPremiumProductId(productId)) return null;

  const transactionId = getString(purchase, ["transactionId", "orderId"]);
  const receipt = getString(purchase, ["transactionReceipt", "receipt"]);
  if (!transactionId && !receipt) return null;

  const expirationDate = getString(purchase, ["premiumUntil", "expirationDate", "expires_date"]) || null;
  return {
    isActive: isFuture(expirationDate),
    productId,
    expirationDate,
    periodType: getString(purchase, ["periodType", "period_type"]) || "normal",
    source: normalizeStoreSource(getString(purchase, ["platform", "store"])),
  };
}

async function fetchRevenueCatEntitlement(professionalId: string): Promise<NormalizedEntitlement | null> {
  const apiKey = process.env.REVENUECAT_SECRET_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(professionalId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RevenueCat verification failed: HTTP ${response.status}`);
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const subscriber = asRecord(payload.subscriber);
  const entitlements = asRecord(subscriber.entitlements);
  const entitlement = asRecord(entitlements[entitlementId]);
  if (!Object.keys(entitlement).length) return null;

  const productId = getString(entitlement, ["product_identifier", "productIdentifier"]);
  if (!isExpectedPremiumProductId(productId)) return null;
  const expirationDate = getString(entitlement, ["expires_date", "expirationDate"]) || null;
  const subscriptions = asRecord(subscriber.subscriptions);
  const subscription = productId ? asRecord(subscriptions[productId]) : {};
  const periodType =
    getString(entitlement, ["period_type", "periodType"]) ||
    getString(subscription, ["period_type", "periodType"]);

  return {
    isActive: isFuture(expirationDate),
    productId,
    expirationDate,
    periodType,
    source: normalizeStoreSource(getString(entitlement, ["store"]) || getString(subscription, ["store"])),
  };
}

export async function POST(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const hasRevenueCatServerKey = Boolean(process.env.REVENUECAT_SECRET_API_KEY?.trim());
    const clientEntitlement = normalizeStoreKitPurchase(body) || normalizeCustomerInfoEntitlement(body);

    if (!hasRevenueCatServerKey && process.env.NODE_ENV === "production" && !clientEntitlement) {
      return NextResponse.json({ error: "RevenueCat server key is not configured." }, { status: 500 });
    }

    const verifiedEntitlement = hasRevenueCatServerKey ? await fetchRevenueCatEntitlement(professionalId) : null;
    if (hasRevenueCatServerKey && !verifiedEntitlement) {
      return NextResponse.json({ error: "Premium entitlement is not active." }, { status: 402 });
    }

    const entitlement = verifiedEntitlement || clientEntitlement;
    const status = getStatus(entitlement);
    const updateResult = await updateProfessionalPremiumFromAppStore({
      professionalId,
      status,
      premiumUntil: entitlement?.expirationDate ?? null,
      productId: entitlement?.productId || null,
      source: entitlement?.source || "apple",
    });

    return NextResponse.json({
      ok: true,
      status,
      premiumUntil: entitlement?.expirationDate ?? null,
      productId: entitlement?.productId || null,
      source: entitlement?.source || null,
      updateResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sync mobile store subscription.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

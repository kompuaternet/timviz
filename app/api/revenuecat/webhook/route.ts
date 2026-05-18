import { NextResponse } from "next/server";
import { updateProfessionalPremiumFromAppStore, type PremiumStatus } from "../../../../lib/premium";

export const dynamic = "force-dynamic";

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

function getDateFromMs(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return new Date(value).toISOString();
}

function isFuture(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function getStatus(event: Record<string, unknown>, premiumUntil: string | null): PremiumStatus {
  const type = getString(event, ["type", "event_type"]).toUpperCase();
  const periodType = getString(event, ["period_type", "periodType"]).toLowerCase();

  if (type.includes("BILLING_ISSUE")) return "past_due";
  if (type.includes("EXPIRATION")) return "inactive";
  if (type.includes("CANCELLATION")) return isFuture(premiumUntil) ? "canceled" : "inactive";
  if (periodType === "trial") return "trialing";
  return "active";
}

export async function POST(request: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET?.trim();
  if (secret) {
    const authorization = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = asRecord(payload.event || payload);
  const professionalId = getString(event, ["app_user_id", "appUserId", "original_app_user_id"]);
  const productId = getString(event, ["product_id", "productIdentifier", "product_identifier"]);
  const premiumUntil =
    getDateFromMs(event.expiration_at_ms) ||
    getString(event, ["expiration_at", "expirationDate", "expires_date"]) ||
    null;

  if (!professionalId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "missing_app_user_id" });
  }

  const status = getStatus(event, premiumUntil);

  try {
    const updateResult = await updateProfessionalPremiumFromAppStore({
      professionalId,
      status,
      premiumUntil,
      productId,
      transactionId: getString(event, ["transaction_id", "transactionId"]) || null,
      originalTransactionId: getString(event, ["original_transaction_id", "originalTransactionId"]) || null,
    });

    return NextResponse.json({ ok: true, status, premiumUntil, productId, updateResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RevenueCat webhook update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

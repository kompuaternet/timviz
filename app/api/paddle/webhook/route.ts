import { NextResponse } from "next/server";
import {
  getPremiumBillingFromPriceId,
  updateProfessionalPremiumFromPaddle,
  type PremiumStatus
} from "../../../../lib/premium";

export const dynamic = "force-dynamic";

function getEventType(payload: Record<string, unknown>) {
  return String(payload.event_type || payload.eventType || payload.type || "");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getNestedString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function getFirstItemPriceId(data: Record<string, unknown>) {
  const items = Array.isArray(data.items) ? data.items : [];
  const item = asRecord(items[0]);
  const price = asRecord(item.price);
  return getNestedString(price, ["id", "price_id"]) || getNestedString(item, ["price_id"]);
}

function getPeriodEnd(data: Record<string, unknown>) {
  const currentBillingPeriod = asRecord(data.current_billing_period);
  const nextBilledAt = getNestedString(data, ["next_billed_at", "current_period_end"]);
  return nextBilledAt || getNestedString(currentBillingPeriod, ["ends_at"]);
}

function getPremiumStatus(eventType: string, data: Record<string, unknown>): PremiumStatus {
  const paddleStatus = getNestedString(data, ["status"]).toLowerCase();

  if (eventType === "subscription.canceled") return "canceled";
  if (eventType === "subscription.past_due" || paddleStatus === "past_due") return "past_due";
  if (paddleStatus === "trialing") return "trialing";
  if (eventType === "transaction.completed") return "active";
  if (
    eventType === "subscription.created" ||
    eventType === "subscription.activated" ||
    eventType === "subscription.updated"
  ) {
    return "active";
  }

  return "inactive";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  // TODO: verify this signature with Paddle's webhook secret before enabling production mode.
  if (!signature) {
    console.warn("[paddle] Webhook received without paddle-signature header.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = getEventType(payload);
  const data = asRecord(payload.data);
  const customData = asRecord(data.custom_data || data.customData);
  const customer = asRecord(data.customer);
  const priceId = getFirstItemPriceId(data) || getNestedString(data, ["price_id"]);
  const status = getPremiumStatus(eventType, data);
  const supportedEvents = new Set([
    "subscription.created",
    "subscription.activated",
    "subscription.updated",
    "subscription.canceled",
    "subscription.past_due",
    "transaction.completed"
  ]);

  console.info("[paddle] webhook", {
    eventType,
    status,
    billing: getPremiumBillingFromPriceId(priceId),
    professionalId: getNestedString(customData, ["user_id", "professional_id"]),
    email: getNestedString(customData, ["email"]) || getNestedString(customer, ["email"])
  });

  if (!supportedEvents.has(eventType)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const updateResult = await updateProfessionalPremiumFromPaddle({
      professionalId: getNestedString(customData, ["user_id", "professional_id"]),
      email: getNestedString(customData, ["email"]) || getNestedString(customer, ["email"]),
      status,
      premiumUntil: getPeriodEnd(data) || null,
      paddleCustomerId:
        getNestedString(data, ["customer_id"]) || getNestedString(customer, ["id"]) || null,
      paddleSubscriptionId: getNestedString(data, ["subscription_id", "id"]) || null,
      paddlePriceId: priceId || null
    });

    return NextResponse.json({ ok: true, updateResult });
  } catch (error) {
    console.error("[paddle] webhook update failed", error);
    return NextResponse.json({ error: "Webhook update failed" }, { status: 500 });
  }
}

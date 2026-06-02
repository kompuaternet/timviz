import { createPublicKey, verify as verifySignature } from "crypto";

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

export function getMonobankToken() {
  return process.env.MONOBANK_TOKEN?.trim() || "";
}

export function getMonobankAmount(billing: MonobankBilling) {
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
  if (normalized === "success") return "success";
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


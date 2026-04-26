import { createHmac } from "crypto";

export type PublicCustomerSession = {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  locale: string;
};

const PUBLIC_CUSTOMER_COOKIE = "timviz_public_customer_session";

function getSessionSecret() {
  return process.env.SESSION_SECRET || "rezervo-dev-session-secret";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function getPublicCustomerCookieName() {
  return PUBLIC_CUSTOMER_COOKIE;
}

export function signPublicCustomerSession(session: PublicCustomerSession) {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyPublicCustomerSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const payload = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expectedSignature = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as Partial<PublicCustomerSession>;
    if (!parsed.email || !parsed.fullName) {
      return null;
    }

    return {
      email: parsed.email.trim().toLowerCase(),
      givenName: parsed.givenName?.trim() || "",
      familyName: parsed.familyName?.trim() || "",
      fullName: parsed.fullName.trim(),
      locale: parsed.locale?.trim() || ""
    } satisfies PublicCustomerSession;
  } catch {
    return null;
  }
}

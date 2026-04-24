import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { hashPassword, verifyPassword } from "./pro-auth";

const SUPERADMIN_SESSION_COOKIE = "timviz_superadmin_session";

function getSessionSecret() {
  return process.env.SESSION_SECRET || "rezervo-dev-session-secret";
}

export function getSuperadminSessionCookieName() {
  return SUPERADMIN_SESSION_COOKIE;
}

export function signSuperadminSession(email: string) {
  const payload = email.trim().toLowerCase();
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySuperadminSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const separatorIndex = value.lastIndexOf(".");
  const email = separatorIndex > 0 ? value.slice(0, separatorIndex) : "";
  const signature = separatorIndex > 0 ? value.slice(separatorIndex + 1) : "";
  if (!email || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getSessionSecret()).update(email).digest("hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer) ? email : null;
}

function getConfiguredCredentials() {
  return {
    email:
      process.env.SUPERADMIN_EMAIL ||
      process.env.TIMVIZ_SUPERADMIN_EMAIL ||
      "",
    password:
      process.env.SUPERADMIN_PASSWORD ||
      process.env.TIMVIZ_SUPERADMIN_PASSWORD ||
      "",
    passwordHash:
      process.env.SUPERADMIN_PASSWORD_HASH ||
      process.env.TIMVIZ_SUPERADMIN_PASSWORD_HASH ||
      ""
  };
}

export function isSuperadminConfigured() {
  const config = getConfiguredCredentials();
  return Boolean(config.email && (config.password || config.passwordHash));
}

export function getSuperadminSetupMessage() {
  return "Нужно добавить SUPERADMIN_EMAIL и SUPERADMIN_PASSWORD (или SUPERADMIN_PASSWORD_HASH) в переменные окружения.";
}

export function verifySuperadminCredentials(email: string, password: string) {
  const config = getConfiguredCredentials();
  const normalizedEmail = email.trim().toLowerCase();

  if (!config.email || (!config.password && !config.passwordHash)) {
    throw new Error(getSuperadminSetupMessage());
  }

  if (normalizedEmail !== config.email.trim().toLowerCase()) {
    return false;
  }

  if (config.passwordHash) {
    return verifyPassword(password, config.passwordHash);
  }

  return password === config.password;
}

export function getSuggestedSuperadminPasswordHash(password: string) {
  return hashPassword(password);
}

export async function requireSuperadminSession() {
  const cookieStore = await cookies();
  const email = verifySuperadminSession(cookieStore.get(getSuperadminSessionCookieName())?.value);

  if (!email) {
    throw new Error("SUPERADMIN_UNAUTHORIZED");
  }

  return { email };
}

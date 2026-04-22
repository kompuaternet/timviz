import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "rezervo_pro_session";

function getSessionSecret() {
  return process.env.SESSION_SECRET || "rezervo-dev-session-secret";
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (derivedHash.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, originalBuffer);
}

export function signSessionValue(professionalId: string) {
  const signature = createHmac("sha256", getSessionSecret())
    .update(professionalId)
    .digest("hex");

  return `${professionalId}.${signature}`;
}

export function verifySessionValue(sessionValue: string | undefined) {
  if (!sessionValue) {
    return null;
  }

  const [professionalId, signature] = sessionValue.split(".");

  if (!professionalId || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(professionalId)
    .digest("hex");

  if (signature !== expectedSignature) {
    return null;
  }

  return professionalId;
}

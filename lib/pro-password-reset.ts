import { createHmac, timingSafeEqual } from "crypto";

type PasswordResetPayload = {
  email: string;
  exp: number;
};

function getPasswordResetSecret() {
  return (
    process.env.PASSWORD_RESET_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "rezervo-dev-password-reset-secret"
  );
}

function encodePayload(payload: PasswordResetPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as PasswordResetPayload;
    if (!parsed?.email || typeof parsed.exp !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function signTokenPayload(encodedPayload: string, passwordHash: string) {
  return createHmac("sha256", getPasswordResetSecret())
    .update(`${encodedPayload}.${passwordHash}`)
    .digest("base64url");
}

export function createPasswordResetToken(email: string, passwordHash: string, expiresInMinutes = 60) {
  const payload: PasswordResetPayload = {
    email,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };
  const encodedPayload = encodePayload(payload);
  const signature = signTokenPayload(encodedPayload, passwordHash);
  return `${encodedPayload}.${signature}`;
}

export function verifyPasswordResetToken(token: string, passwordHash: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload || payload.exp < Date.now()) {
    return null;
  }

  const expectedSignature = signTokenPayload(encodedPayload, passwordHash);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  return payload;
}

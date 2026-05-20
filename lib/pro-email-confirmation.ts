import { createHmac, timingSafeEqual } from "crypto";

type EmailConfirmationPayload = {
  email: string;
  exp: number;
};

function getEmailConfirmationSecret() {
  return (
    process.env.EMAIL_CONFIRMATION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "rezervo-dev-email-confirmation-secret"
  );
}

function encodePayload(payload: EmailConfirmationPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as EmailConfirmationPayload;
    if (!parsed?.email || typeof parsed.exp !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function signTokenPayload(encodedPayload: string, passwordHash: string, createdAt: string) {
  return createHmac("sha256", getEmailConfirmationSecret())
    .update(`${encodedPayload}.${passwordHash}.${createdAt}`)
    .digest("base64url");
}

export function createEmailConfirmationToken(email: string, passwordHash: string, createdAt: string, expiresInMinutes = 60 * 24) {
  const payload: EmailConfirmationPayload = {
    email,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };
  const encodedPayload = encodePayload(payload);
  const signature = signTokenPayload(encodedPayload, passwordHash, createdAt);
  return `${encodedPayload}.${signature}`;
}

export function readEmailFromConfirmationToken(token: string) {
  const [encodedPayload] = token.split(".");
  if (!encodedPayload) {
    return "";
  }
  return decodePayload(encodedPayload)?.email?.trim().toLowerCase() || "";
}

export function verifyEmailConfirmationToken(token: string, passwordHash: string, createdAt: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload || payload.exp < Date.now()) {
    return null;
  }

  const expectedSignature = signTokenPayload(encodedPayload, passwordHash, createdAt);
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

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitState>();

const disposableEmailDomains = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "mailinator.com",
  "mailinator.net",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr"
]);

function normalizeKey(key: string) {
  return key.trim().toLowerCase() || "unknown";
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function checkRateLimit(key: string, rule: RateLimitRule) {
  const normalizedKey = normalizeKey(key);
  const now = Date.now();
  const current = attempts.get(normalizedKey);

  if (!current || current.resetAt <= now) {
    attempts.set(normalizedKey, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, remainingSeconds: Math.ceil(rule.windowMs / 1000) };
  }

  if (current.count >= rule.limit) {
    return {
      ok: false,
      remainingSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  attempts.set(normalizedKey, current);
  return { ok: true, remainingSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

export function hasHoneypotValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isDisposableEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@").pop() || "";
  return disposableEmailDomains.has(domain);
}

export function isValidBusinessEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isStrongEnoughPassword(password: string) {
  return password.length >= 8 && /[a-zа-яіїєґ]/i.test(password) && /\d/.test(password);
}

const MOBILE_CAPTCHA_TOKEN_PREFIX = "mobile-captcha-v1";
const MOBILE_CAPTCHA_TOKEN_TTL_MS = 10 * 60 * 1000;

function getMobileCaptchaSecret() {
  return (
    process.env.MOBILE_CAPTCHA_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.HCAPTCHA_SECRET_KEY ||
    "rezervo-dev-mobile-captcha-secret"
  );
}

function normalizeMobileCaptchaIp(remoteIp?: string) {
  return (remoteIp || "unknown").trim().toLowerCase() || "unknown";
}

function signMobileCaptchaPayload(timestamp: string, nonce: string, remoteIp?: string) {
  return createHmac("sha256", getMobileCaptchaSecret())
    .update(`${MOBILE_CAPTCHA_TOKEN_PREFIX}.${timestamp}.${nonce}.${normalizeMobileCaptchaIp(remoteIp)}`)
    .digest("hex");
}

export function createMobileCaptchaFallbackToken(remoteIp?: string) {
  const timestamp = String(Date.now());
  const nonce = randomBytes(16).toString("hex");
  const signature = signMobileCaptchaPayload(timestamp, nonce, remoteIp);
  return `${MOBILE_CAPTCHA_TOKEN_PREFIX}.${timestamp}.${nonce}.${signature}`;
}

function verifyMobileCaptchaFallbackToken(token: string, remoteIp?: string) {
  const [prefix, timestamp, nonce, signature] = token.split(".");
  if (prefix !== MOBILE_CAPTCHA_TOKEN_PREFIX || !timestamp || !nonce || !signature) {
    return false;
  }

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MOBILE_CAPTCHA_TOKEN_TTL_MS || issuedAt - Date.now() > 60_000) {
    return false;
  }

  const expected = signMobileCaptchaPayload(timestamp, nonce, remoteIp);
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function verifyCaptchaToken(token: unknown, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.HCAPTCHA_SECRET_KEY || "";
  const tokenText = typeof token === "string" ? token.trim() : "";
  if (tokenText && verifyMobileCaptchaFallbackToken(tokenText, remoteIp)) {
    return true;
  }

  if (!secret) {
    return true;
  }

  if (!tokenText) {
    return false;
  }

  const endpoint = process.env.TURNSTILE_SECRET_KEY
    ? "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    : "https://hcaptcha.com/siteverify";
  const body = new URLSearchParams({ secret, response: tokenText });
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000)
    });
    const payload = (await response.json()) as { success?: boolean };
    return Boolean(response.ok && payload.success);
  } catch {
    return false;
  }
}

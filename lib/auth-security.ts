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

export async function verifyCaptchaToken(token: unknown, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.HCAPTCHA_SECRET_KEY || "";
  if (!secret) {
    return true;
  }

  const tokenText = typeof token === "string" ? token.trim() : "";
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

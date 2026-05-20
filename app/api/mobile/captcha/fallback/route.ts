import { NextResponse } from "next/server";
import { checkRateLimit, createMobileCaptchaFallbackToken, getClientIp } from "../../../../../lib/auth-security";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`mobile-captcha-fallback:${ip}`, {
    limit: 8,
    windowMs: 10 * 60 * 1000
  });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many security checks. Try again later.", retryAfter: limit.remainingSeconds },
      { status: 429 }
    );
  }

  return NextResponse.json({ token: createMobileCaptchaFallbackToken(ip) });
}

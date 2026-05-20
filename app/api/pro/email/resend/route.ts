import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  hasHoneypotValue,
  isDisposableEmail,
  isValidBusinessEmail,
  verifyCaptchaToken
} from "../../../../../lib/auth-security";
import { authApiCopy, normalizeAuthLanguage } from "../../../../../lib/auth-api-i18n";
import { sendProfessionalConfirmationEmail } from "../../../../../lib/pro-confirmation-mail";
import { getProfessionalPasswordResetProfile } from "../../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const language = normalizeAuthLanguage(body.language);
    const t = authApiCopy[language];
    const responseMessage = {
      ok: true,
      message: t.resendResponse
    };
    const ip = getClientIp(request);

    if (hasHoneypotValue(body.website) || hasHoneypotValue(body.company)) {
      return NextResponse.json(responseMessage);
    }

    if (!email || !isValidBusinessEmail(email) || isDisposableEmail(email)) {
      return NextResponse.json(responseMessage);
    }

    const limit = checkRateLimit(`email-resend:${ip}:${email}`, { limit: 1, windowMs: 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: t.resendWait, retryAfter: limit.remainingSeconds }, { status: 429 });
    }

    const captchaOk = await verifyCaptchaToken(body.captchaToken, ip);
    if (!captchaOk) {
      return NextResponse.json({ error: t.captchaRequired }, { status: 400 });
    }

    const professional = await getProfessionalPasswordResetProfile(email);
    if (professional?.accountStatus === "pending_email") {
      await sendProfessionalConfirmationEmail({ request, professional, language }).catch((error) =>
        console.warn("[pro-email-resend] Confirmation email failed", error)
      );
    }

    return NextResponse.json(responseMessage);
  } catch (error) {
    console.error("[pro-email-resend] Failed to resend confirmation", error);
    return NextResponse.json({ error: authApiCopy.en.forgotFailed }, { status: 400 });
  }
}

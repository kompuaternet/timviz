import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  hasHoneypotValue,
  isDisposableEmail,
  isValidBusinessEmail,
  verifyCaptchaToken
} from "../../../../../lib/auth-security";
import { sendProfessionalConfirmationEmail } from "../../../../../lib/pro-confirmation-mail";
import { getProfessionalPasswordResetProfile } from "../../../../../lib/pro-data";

const responseMessage = {
  ok: true,
  message: "Якщо акаунт очікує підтвердження, ми надіслали лист ще раз."
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const language = String(body.language || "uk").trim().toLowerCase();
    const ip = getClientIp(request);

    if (hasHoneypotValue(body.website) || hasHoneypotValue(body.company)) {
      return NextResponse.json(responseMessage);
    }

    if (!email || !isValidBusinessEmail(email) || isDisposableEmail(email)) {
      return NextResponse.json(responseMessage);
    }

    const limit = checkRateLimit(`email-resend:${ip}:${email}`, { limit: 1, windowMs: 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: "Надіслати ще раз можна через 60 секунд.", retryAfter: limit.remainingSeconds }, { status: 429 });
    }

    const captchaOk = await verifyCaptchaToken(body.captchaToken, ip);
    if (!captchaOk) {
      return NextResponse.json({ error: "Підтвердіть, що ви не робот." }, { status: 400 });
    }

    const professional = await getProfessionalPasswordResetProfile(email);
    if (professional?.accountStatus === "pending_email") {
      await sendProfessionalConfirmationEmail({ request, professional, language }).catch((error) =>
        console.warn("[pro-email-resend] Confirmation email failed", error)
      );
    }

    return NextResponse.json(responseMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not resend email.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

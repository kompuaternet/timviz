import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  hasHoneypotValue,
  isDisposableEmail,
  isStrongEnoughPassword,
  isValidBusinessEmail,
  verifyCaptchaToken
} from "../../../../lib/auth-security";
import { sendProfessionalConfirmationEmail } from "../../../../lib/pro-confirmation-mail";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { createProfessionalSetup, getProfessionalPasswordResetProfile } from "../../../../lib/pro-data";
import {
  sendJoinRequestTelegramNotification,
  sendSuperadminTelegramNotification
} from "../../../../lib/telegram-bot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.account?.email || "").trim().toLowerCase();
    const password = String(body?.account?.password || "");
    const authProvider = body?.account?.authProvider === "google" || body?.account?.authProvider === "apple" ? body.account.authProvider : "email";
    const ip = getClientIp(request);

    if (hasHoneypotValue(body.website) || hasHoneypotValue(body.company)) {
      return NextResponse.json({ ok: true, emailConfirmationRequired: true });
    }

    const limit = checkRateLimit(`register:${ip}:${email}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: "Забагато спроб. Спробуйте трохи пізніше.", retryAfter: limit.remainingSeconds }, { status: 429 });
    }

    if (!isValidBusinessEmail(email)) {
      return NextResponse.json({ error: "Вкажіть коректний email." }, { status: 400 });
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: "Використайте справжню email-адресу." }, { status: 400 });
    }

    if (authProvider === "email" && !isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Пароль: мінімум 8 символів, літера і цифра." }, { status: 400 });
    }

    const shouldVerifyCaptcha = authProvider === "email" && !body?.account?.emailConfirmed;
    if (shouldVerifyCaptcha) {
      const captchaOk = await verifyCaptchaToken(body.captchaToken, ip);
      if (!captchaOk) {
        return NextResponse.json({ error: "Підтвердіть, що ви не робот." }, { status: 400 });
      }
    }

    const result = await createProfessionalSetup({
      account: {
        ...body.account,
        authProvider,
        emailConfirmed: authProvider !== "email"
      },
      setup: body.setup,
      invitationToken: typeof body.invitationToken === "string" ? body.invitationToken : undefined
    });

    const professionalName = `${String(body?.account?.firstName || "").trim()} ${String(
      body?.account?.lastName || ""
    ).trim()}`.trim();
    const ownerMode = String(body?.setup?.ownerMode || "owner").trim();
    const businessName =
      ownerMode === "owner"
        ? String(body?.setup?.companyName || "").trim()
        : String(body?.setup?.joinBusinessName || "").trim();
    const businessId = String(body?.setup?.joinBusinessId || "").trim();

    await sendSuperadminTelegramNotification({
      eventType: "user_registered",
      professionalId: result.professionalId,
      professionalName,
      professionalEmail: String(body?.account?.email || "").trim(),
      professionalPhone: String(body?.account?.phone || "").trim(),
      ownerMode,
      businessName: businessName || undefined,
      businessId: businessId || undefined,
      workspaceReady: result.workspaceReady
    }).catch(() => undefined);

    if (result.joinRequest) {
      await sendJoinRequestTelegramNotification({
        businessId: result.joinRequest.businessId,
        requestId: result.joinRequest.requestId,
        requesterProfessionalId: result.joinRequest.requesterProfessionalId,
        requesterName: result.joinRequest.requesterName,
        requesterEmail: result.joinRequest.requesterEmail,
        requesterPhone: result.joinRequest.requesterPhone,
        role: result.joinRequest.role
      }).catch(() => undefined);
    }

    if (authProvider === "email") {
      const professional = await getProfessionalPasswordResetProfile(email);
      if (professional) {
        const accountLanguage = String(body?.account?.language || "").trim().toLowerCase();
        const emailLanguage = accountLanguage.startsWith("ук")
          ? "uk"
          : accountLanguage.startsWith("en") || accountLanguage.startsWith("анг")
            ? "en"
            : "ru";
        await sendProfessionalConfirmationEmail({
          request,
          professional,
          language: emailLanguage
        }).catch((error) => console.warn("[pro-setup] Confirmation email failed", error));
      }

      return NextResponse.json({ ...result, emailConfirmationRequired: true, email });
    }

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(result.professionalId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create setup.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

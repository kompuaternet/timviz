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
import { authApiCopy, normalizeAuthLanguage } from "../../../../lib/auth-api-i18n";
import { sendProfessionalConfirmationEmail } from "../../../../lib/pro-confirmation-mail";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { createProfessionalSetup, getProfessionalPasswordResetProfile } from "../../../../lib/pro-data";
import {
  getMetaWebRegistrationEventId,
  reportMetaWebRegistrationConversion
} from "../../../../lib/meta-conversions";
import { recordProfessionalAccessSource } from "../../../../lib/pro-access-source";
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
    const signupSource = String(body?.account?.signupSource || "").trim().toLowerCase();
    const skipEmailConfirmation = signupSource === "for_masters";
    const language = normalizeAuthLanguage(body?.account?.language);
    const t = authApiCopy[language];
    const ip = getClientIp(request);

    if (hasHoneypotValue(body.website) || hasHoneypotValue(body.company)) {
      return NextResponse.json({ ok: true, emailConfirmationRequired: true });
    }

    const limit = checkRateLimit(`register:${ip}:${email}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: t.rateLimit, retryAfter: limit.remainingSeconds }, { status: 429 });
    }

    if (!isValidBusinessEmail(email)) {
      return NextResponse.json({ error: t.emailInvalid }, { status: 400 });
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: t.disposableEmail }, { status: 400 });
    }

    if (authProvider === "email" && !isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: t.passwordResetWeak }, { status: 400 });
    }

    const shouldVerifyCaptcha = authProvider === "email";
    if (shouldVerifyCaptcha) {
      const captchaOk = await verifyCaptchaToken(body.captchaToken, ip);
      if (!captchaOk) {
        return NextResponse.json({ error: t.captchaRequired }, { status: 400 });
      }
    }

    const result = await createProfessionalSetup({
      account: {
        ...body.account,
        authProvider,
        emailConfirmed: authProvider !== "email" || skipEmailConfirmation
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
      registrationSource: "сайт",
      ownerMode,
      businessName: businessName || undefined,
      businessId: businessId || undefined,
      workspaceReady: result.workspaceReady
    }).catch(() => undefined);

    await recordProfessionalAccessSource({
      professionalId: result.professionalId,
      eventType: "registration",
      platform: "website",
      source: "сайт",
      method: authProvider,
      request
    });

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

    if (authProvider === "email" && !skipEmailConfirmation) {
      const professional = await getProfessionalPasswordResetProfile(email);
      if (professional) {
        await sendProfessionalConfirmationEmail({
          request,
          professional,
          language
        }).catch((error) => console.warn("[pro-setup] Confirmation email failed", error));
      }

      return NextResponse.json({ ...result, emailConfirmationRequired: true, email });
    }

    const metaRegistrationEventId = getMetaWebRegistrationEventId(result.professionalId);
    await reportMetaWebRegistrationConversion({
      professionalId: result.professionalId,
      email: String(body?.account?.email || "").trim(),
      phone: String(body?.account?.phone || "").trim(),
      firstName: String(body?.account?.firstName || "").trim(),
      lastName: String(body?.account?.lastName || "").trim(),
      country: String(body?.account?.country || "Ukraine").trim(),
      language,
      source: signupSource || "pro_setup",
      workspaceReady: result.workspaceReady === true,
      request
    });

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(result.professionalId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ ...result, metaRegistrationEventId });
  } catch (error) {
    console.error("[pro-setup] Failed to create setup", error);
    return NextResponse.json({ error: authApiCopy.en.registrationFailed }, { status: 400 });
  }
}

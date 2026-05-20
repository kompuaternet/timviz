import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "../../../../lib/auth-security";
import { authApiCopy, normalizeAuthLanguage } from "../../../../lib/auth-api-i18n";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { acceptStaffInvitation, authenticateProfessional, getProfessionalProfileByEmail } from "../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const inviteToken = String(body.inviteToken ?? "").trim();
    const language = normalizeAuthLanguage(body.language);
    const t = authApiCopy[language];
    const ip = getClientIp(request);

    if (!email || !password) {
      return NextResponse.json({ error: t.loginMissing }, { status: 400 });
    }

    const limit = checkRateLimit(`login:${ip}:${email}`, { limit: 8, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: t.rateLimit, retryAfter: limit.remainingSeconds, captchaRequired: true },
        { status: 429 }
      );
    }

    const professionalId = await authenticateProfessional(email, password);

    if (!professionalId) {
      const profile = await getProfessionalProfileByEmail(email);
      if (profile?.accountStatus === "pending_email") {
        return NextResponse.json(
          { error: t.emailNotConfirmed, errorCode: "email_not_confirmed", email: profile.email },
          { status: 403 }
        );
      }
      if (profile?.accountStatus === "blocked") {
        return NextResponse.json(
          { error: t.accountBlocked, errorCode: "account_blocked" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: t.invalidLogin },
        { status: 401 }
      );
    }

    if (inviteToken) {
      await acceptStaffInvitation({
        professionalId,
        invitationToken: inviteToken
      });
    }

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(professionalId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ professionalId });
  } catch (error) {
    console.error("[pro-login] Failed to sign in", error);
    return NextResponse.json({ error: authApiCopy.en.loginFailed }, { status: 400 });
  }
}

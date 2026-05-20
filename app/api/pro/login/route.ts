import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "../../../../lib/auth-security";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { acceptStaffInvitation, authenticateProfessional, getProfessionalProfileByEmail } from "../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const inviteToken = String(body.inviteToken ?? "").trim();
    const ip = getClientIp(request);

    const limit = checkRateLimit(`login:${ip}:${email}`, { limit: 8, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Забагато спроб входу. Спробуйте трохи пізніше.", retryAfter: limit.remainingSeconds, captchaRequired: true },
        { status: 429 }
      );
    }

    const professionalId = await authenticateProfessional(email, password);

    if (!professionalId) {
      const profile = await getProfessionalProfileByEmail(email);
      if (profile?.accountStatus === "pending_email") {
        return NextResponse.json(
          { error: "Підтвердіть email, щоб увійти в кабінет.", errorCode: "email_not_confirmed", email: profile.email },
          { status: 403 }
        );
      }
      if (profile?.accountStatus === "blocked") {
        return NextResponse.json(
          { error: "Акаунт заблоковано.", errorCode: "account_blocked" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Неверный email или пароль." },
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
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

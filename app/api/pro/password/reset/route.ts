import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isStrongEnoughPassword } from "../../../../../lib/auth-security";
import { authApiCopy, normalizeAuthLanguage } from "../../../../../lib/auth-api-i18n";
import { getSessionCookieName, signSessionValue } from "../../../../../lib/pro-auth";
import { verifyPasswordResetToken } from "../../../../../lib/pro-password-reset";
import {
  getProfessionalPasswordResetProfile,
  updateProfessionalPasswordByEmail
} from "../../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const language = normalizeAuthLanguage(body.language);
    const t = authApiCopy[language];
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!token) {
      return NextResponse.json({ error: t.passwordMissingToken }, { status: 400 });
    }

    if (!isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: t.passwordResetWeak }, { status: 400 });
    }

    const rawPayload = token.split(".")[0];
    if (!rawPayload) {
      return NextResponse.json({ error: t.passwordResetInvalid }, { status: 400 });
    }

    let decoded: { email?: string };
    try {
      decoded = JSON.parse(Buffer.from(rawPayload, "base64url").toString("utf8")) as { email?: string };
    } catch {
      return NextResponse.json({ error: t.passwordResetInvalid }, { status: 400 });
    }
    const email = String(decoded.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: t.passwordResetInvalid }, { status: 400 });
    }

    const professional = await getProfessionalPasswordResetProfile(email);
    if (!professional) {
      return NextResponse.json({ error: t.passwordResetNotFound }, { status: 404 });
    }

    const payload = verifyPasswordResetToken(token, professional.passwordHash);
    if (!payload || payload.email.trim().toLowerCase() !== professional.email.trim().toLowerCase()) {
      return NextResponse.json({ error: t.passwordResetInvalid }, { status: 400 });
    }

    await updateProfessionalPasswordByEmail(professional.email, password);
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(professional.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ ok: true, professionalId: professional.id, email: professional.email });
  } catch (error) {
    console.error("[pro-password-reset] Failed to reset password", error);
    return NextResponse.json({ error: authApiCopy.en.passwordResetFailed }, { status: 400 });
  }
}

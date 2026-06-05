import { NextResponse } from "next/server";
import { authApiCopy, normalizeAuthLanguage } from "../../../../../lib/auth-api-i18n";
import { signSessionValue } from "../../../../../lib/pro-auth";
import { authenticateProfessional, getProfessionalProfileById } from "../../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const language = normalizeAuthLanguage(body.language);
    const t = authApiCopy[language];

    if (!email || !password) {
      return NextResponse.json({ error: t.loginMissing }, { status: 400 });
    }

    const professionalId = await authenticateProfessional(email, password);
    if (!professionalId) {
      return NextResponse.json({ error: t.invalidLogin }, { status: 401 });
    }

    const profile = await getProfessionalProfileById(professionalId);
    const displayName =
      `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || profile?.email || email;

    return NextResponse.json({
      professionalId,
      token: signSessionValue(professionalId),
      profile: {
        id: professionalId,
        email: profile?.email || email,
        displayName,
        language: profile?.language || language
      }
    });
  } catch (error) {
    console.error("[mobile-pro-login] Login failed", error);
    return NextResponse.json({ error: authApiCopy.en.loginFailed }, { status: 400 });
  }
}

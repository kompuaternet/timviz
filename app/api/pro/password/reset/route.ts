import { NextResponse } from "next/server";
import { verifyPasswordResetToken } from "../../../../../lib/pro-password-reset";
import {
  getProfessionalPasswordResetProfile,
  updateProfessionalPasswordByEmail
} from "../../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!token) {
      return NextResponse.json({ error: "Токен отсутствует." }, { status: 400 });
    }

    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Пароль должен быть не короче 6 символов." }, { status: 400 });
    }

    const rawPayload = token.split(".")[0];
    if (!rawPayload) {
      return NextResponse.json({ error: "Недействительная ссылка восстановления." }, { status: 400 });
    }

    const decoded = JSON.parse(Buffer.from(rawPayload, "base64url").toString("utf8")) as { email?: string };
    const email = String(decoded.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Недействительная ссылка восстановления." }, { status: 400 });
    }

    const professional = await getProfessionalPasswordResetProfile(email);
    if (!professional) {
      return NextResponse.json({ error: "Аккаунт не найден." }, { status: 404 });
    }

    const payload = verifyPasswordResetToken(token, professional.passwordHash);
    if (!payload || payload.email.trim().toLowerCase() !== professional.email.trim().toLowerCase()) {
      return NextResponse.json({ error: "Ссылка восстановления недействительна или устарела." }, { status: 400 });
    }

    await updateProfessionalPasswordByEmail(professional.email, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset password.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

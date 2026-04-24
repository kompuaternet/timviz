import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSuperadminSessionCookieName,
  isSuperadminConfigured,
  signSuperadminSession,
  verifySuperadminCredentials
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  try {
    if (!isSuperadminConfigured()) {
      return NextResponse.json(
        { error: "Суперадмин ещё не настроен в переменных окружения." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");

    if (!verifySuperadminCredentials(email, password)) {
      return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: getSuperadminSessionCookieName(),
      value: signSuperadminSession(email),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось выполнить вход." },
      { status: 400 }
    );
  }
}

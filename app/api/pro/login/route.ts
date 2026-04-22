import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { authenticateProfessional } from "../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    const professionalId = await authenticateProfessional(email, password);

    if (!professionalId) {
      return NextResponse.json(
        { error: "Неверный email или пароль." },
        { status: 401 }
      );
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

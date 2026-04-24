import { NextResponse } from "next/server";
import { getProfessionalWorkspaceForAdmin } from "../../../../lib/admin-data";
import { requireSuperadminSession } from "../../../../lib/admin-auth";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";

export async function POST(request: Request) {
  try {
    await requireSuperadminSession();
    const body = await request.json();
    const professionalId = String(body.professionalId || "");
    const workspace = await getProfessionalWorkspaceForAdmin(professionalId);

    if (!workspace) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true, redirectTo: "/pro/calendar" });
    response.cookies.set({
      name: getSessionCookieName(),
      value: signSessionValue(professionalId),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось войти под пользователем.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

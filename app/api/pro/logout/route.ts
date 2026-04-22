import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../../../lib/pro-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 0
  });

  return NextResponse.json({ ok: true });
}

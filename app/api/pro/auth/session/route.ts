import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";

export async function GET() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

  return NextResponse.json({
    authenticated: Boolean(professionalId),
    professionalId: professionalId || null
  });
}


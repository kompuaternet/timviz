import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { createProfessionalSetup } from "../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createProfessionalSetup(body);

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(result.professionalId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create setup.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

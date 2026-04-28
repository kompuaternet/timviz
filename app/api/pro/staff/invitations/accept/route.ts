import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../../lib/pro-auth";
import { acceptStaffInvitation } from "../../../../../../lib/pro-data";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    await acceptStaffInvitation({
      professionalId,
      invitationToken: String(body.token || "")
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not accept invitation." },
      { status: 400 }
    );
  }
}

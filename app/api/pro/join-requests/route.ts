import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { resolveJoinRequestForOwner } from "../../../../lib/pro-data";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const requestId = String(body.requestId || "").trim();
    const action = body.action === "reject" ? "reject" : "approve";

    if (!requestId) {
      return NextResponse.json({ error: "Request id is required." }, { status: 400 });
    }

    await resolveJoinRequestForOwner({
      ownerProfessionalId: professionalId,
      requestId,
      action
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update request." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { signSessionValue } from "../../../../../../lib/pro-auth";
import { authenticateProfessional, getProfessionalProfileById } from "../../../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const professionalId = await authenticateProfessional(email, password);
    if (!professionalId) {
      return NextResponse.json({ error: "Invalid login credentials." }, { status: 401 });
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
        displayName
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


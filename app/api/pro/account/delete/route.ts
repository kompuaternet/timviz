import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { deleteProfessionalAccount } from "../../../../../lib/pro-data";

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionCookieName = getSessionCookieName();
  const professionalId = verifySessionValue(cookieStore.get(sessionCookieName)?.value) || "";

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteProfessionalAccount(professionalId);
    cookieStore.set(sessionCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 0
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "TEAM_MEMBERS_CONNECTED") {
      return NextResponse.json(
        {
          code: "team_members_connected",
          error: "Delete the other team members or transfer the business before deleting this account."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the account." },
      { status: 400 }
    );
  }
}

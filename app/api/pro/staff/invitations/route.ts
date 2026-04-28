import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { createStaffInvitation, revokeStaffInvitation } from "../../../../../lib/pro-data";

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

export async function POST(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const invitation = await createStaffInvitation({
      ownerProfessionalId: professionalId,
      email: String(body.email || ""),
      role: String(body.role || ""),
      memberProfessionalId:
        typeof body.memberProfessionalId === "string" ? body.memberProfessionalId : undefined,
      request
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send invitation." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const invitationId = String(searchParams.get("invitationId") || "");

    await revokeStaffInvitation({
      ownerProfessionalId: professionalId,
      invitationId
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not revoke invitation." },
      { status: 400 }
    );
  }
}

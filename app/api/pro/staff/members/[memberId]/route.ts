import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../../lib/pro-auth";
import { updateStaffMemberByOwner } from "../../../../../../lib/pro-data";

type RouteProps = {
  params: Promise<{
    memberId: string;
  }>;
};

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { memberId } = await params;
    const body = await request.json();

    await updateStaffMemberByOwner({
      ownerProfessionalId: professionalId,
      memberProfessionalId: memberId,
      firstName: String(body.firstName || ""),
      lastName: typeof body.lastName === "string" ? body.lastName : "",
      role: typeof body.role === "string" ? body.role : "",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : ""
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update employee." },
      { status: 400 }
    );
  }
}

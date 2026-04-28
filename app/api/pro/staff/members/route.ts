import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { createManualStaffMember } from "../../../../../lib/pro-data";

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
    const result = await createManualStaffMember({
      ownerProfessionalId: professionalId,
      firstName: String(body.firstName || ""),
      lastName: typeof body.lastName === "string" ? body.lastName : "",
      role: typeof body.role === "string" ? body.role : "",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      sendInvitation: body.sendInvitation === true,
      request
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create employee." },
      { status: 400 }
    );
  }
}

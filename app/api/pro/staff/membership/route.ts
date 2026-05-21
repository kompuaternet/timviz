import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { leaveCurrentBusinessMembership } from "../../../../../lib/pro-data";

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

export async function DELETE(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId") || undefined;
    const result = await leaveCurrentBusinessMembership(professionalId, businessId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not leave company." },
      { status: 400 }
    );
  }
}

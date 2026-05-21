import { NextResponse } from "next/server";
import { requestProfessionalAccountDeletion } from "../../../../../lib/pro-data";
import { getMobileProfessionalId } from "../_auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await requestProfessionalAccountDeletion(professionalId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete account." },
      { status: 400 }
    );
  }
}

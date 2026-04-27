import { NextResponse } from "next/server";
import { professionalExistsByEmail } from "../../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    const exists = await professionalExistsByEmail(email);
    return NextResponse.json({ exists });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check email.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

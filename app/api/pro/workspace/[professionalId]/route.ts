import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../lib/pro-data";

type RouteProps = {
  params: Promise<{
    professionalId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { professionalId } = await params;

  try {
    const cookieStore = await cookies();
    const sessionProfessionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

    if (!sessionProfessionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (sessionProfessionalId !== professionalId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const snapshot = await getWorkspaceSnapshot(professionalId);

    if (!snapshot) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

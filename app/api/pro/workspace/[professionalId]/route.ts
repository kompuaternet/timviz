import { NextResponse } from "next/server";
import { getWorkspaceSnapshot } from "../../../../../lib/pro-data";

type RouteProps = {
  params: Promise<{
    professionalId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { professionalId } = await params;

  try {
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

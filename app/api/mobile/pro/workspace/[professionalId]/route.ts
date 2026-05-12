import { NextResponse } from "next/server";
import { verifySessionValue } from "../../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../../lib/pro-data";
import { getTelegramConnectionByProfessionalId } from "../../../../../../lib/telegram-bot";

type RouteProps = {
  params: Promise<{
    professionalId: string;
  }>;
};

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return "";
  const [type, value] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer") return "";
  return value || "";
}

export async function GET(request: Request, { params }: RouteProps) {
  const { professionalId } = await params;

  try {
    const token = getBearerToken(request);
    const sessionProfessionalId = verifySessionValue(token);

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

    let telegram = { connected: false, chatId: null as string | null };
    try {
      const connection = await getTelegramConnectionByProfessionalId(professionalId);
      telegram = {
        connected: Boolean(connection?.chatId && connection.connectedAt),
        chatId: connection?.chatId || null
      };
    } catch {
      telegram = { connected: false, chatId: null };
    }

    return NextResponse.json({ ...snapshot, telegram });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

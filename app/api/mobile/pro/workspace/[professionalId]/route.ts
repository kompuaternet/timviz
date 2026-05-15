import { NextResponse } from "next/server";
import { createApiTimer } from "../../../../../../lib/api-timing";
import { verifySessionValue } from "../../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../../lib/pro-data";
import { getTelegramConnectionByProfessionalId } from "../../../../../../lib/telegram-bot";
import type { WorkspaceSnapshot } from "../../../../../../lib/pro-data";

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

function compactWorkspaceMedia(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    professional: {
      ...snapshot.professional,
      avatarUrl: ""
    },
    business: {
      ...snapshot.business,
      photos: []
    }
  };
}

export async function GET(request: Request, { params }: RouteProps) {
  const timer = createApiTimer("api/mobile/pro/workspace GET");
  const { professionalId } = await params;

  try {
    const token = getBearerToken(request);
    const sessionProfessionalId = verifySessionValue(token);

    if (!sessionProfessionalId) {
      timer({ status: 401 });
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (sessionProfessionalId !== professionalId) {
      timer({ status: 403 });
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const snapshot = await getWorkspaceSnapshot(professionalId);
    if (!snapshot) {
      timer({ status: 404 });
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

    const url = new URL(request.url);
    const responseSnapshot = url.searchParams.get("media") === "0" ? compactWorkspaceMedia(snapshot) : snapshot;

    timer({ status: 200, telegram: telegram.connected });
    return NextResponse.json({ ...responseSnapshot, telegram });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    timer({ status: 400, error: true });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

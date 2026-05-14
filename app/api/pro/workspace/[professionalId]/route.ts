import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createApiTimer } from "../../../../../lib/api-timing";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../lib/pro-data";
import { getTelegramConnectionByProfessionalId } from "../../../../../lib/telegram-bot";

type RouteProps = {
  params: Promise<{
    professionalId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const timer = createApiTimer("api/pro/workspace GET");
  const { professionalId } = await params;

  try {
    const cookieStore = await cookies();
    const sessionProfessionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

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

    let telegram = {
      connected: false,
      chatId: null as string | null
    };

    try {
      const connection = await getTelegramConnectionByProfessionalId(professionalId);
      telegram = {
        connected: Boolean(connection?.chatId && connection.connectedAt),
        chatId: connection?.chatId || null
      };
    } catch {
      telegram = {
        connected: false,
        chatId: null
      };
    }

    timer({ status: 200, telegram: telegram.connected });
    return NextResponse.json({
      ...snapshot,
      telegram
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    timer({ status: 400, error: true });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

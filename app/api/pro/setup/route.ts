import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, signSessionValue } from "../../../../lib/pro-auth";
import { createProfessionalSetup } from "../../../../lib/pro-data";
import { sendJoinRequestTelegramNotification } from "../../../../lib/telegram-bot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createProfessionalSetup({
      account: body.account,
      setup: body.setup,
      invitationToken: typeof body.invitationToken === "string" ? body.invitationToken : undefined
    });

    if (result.joinRequest) {
      await sendJoinRequestTelegramNotification({
        businessId: result.joinRequest.businessId,
        requestId: result.joinRequest.requestId,
        requesterProfessionalId: result.joinRequest.requesterProfessionalId,
        requesterName: result.joinRequest.requesterName,
        requesterEmail: result.joinRequest.requesterEmail,
        requesterPhone: result.joinRequest.requesterPhone,
        role: result.joinRequest.role
      }).catch(() => undefined);
    }

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(result.professionalId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create setup.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

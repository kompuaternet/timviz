import { NextResponse } from "next/server";
import { createAppNotifications } from "../../../../lib/app-notifications";
import { getSuperadminUsers } from "../../../../lib/admin-data";
import { requireSuperadminSession } from "../../../../lib/admin-auth";
import { sendDirectPushNotification } from "../../../../lib/push-notifications";

export async function POST(request: Request) {
  try {
    await requireSuperadminSession();
    const body = await request.json().catch(() => ({}));
    const target = body.target === "all" ? "all" : "selected";
    const targetProfessionalId = String(body.professionalId || "").trim();
    const title = String(body.title || "").trim();
    const message = String(body.body || body.message || "").trim();

    if (!title || !message) {
      return NextResponse.json({ error: "Заполни заголовок и текст уведомления." }, { status: 400 });
    }

    const users = await getSuperadminUsers();
    const uniqueUsers = Array.from(
      new Map(users.map((user) => [user.professionalId, user])).values()
    );
    const recipients =
      target === "all"
        ? uniqueUsers
        : uniqueUsers.filter((user) => user.professionalId === targetProfessionalId);

    if (!recipients.length) {
      return NextResponse.json({ error: "Получатель не найден." }, { status: 404 });
    }

    await createAppNotifications(
      recipients.map((recipient) => ({
        professionalId: recipient.professionalId,
        businessId: recipient.businessId || undefined,
        type: "admin_message" as const,
        title,
        body: message,
        payload: {
          source: "superadmin",
          target
        }
      }))
    );

    const pushResults = await Promise.allSettled(
      recipients.map((recipient) =>
        sendDirectPushNotification({
          professionalId: recipient.professionalId,
          title,
          body: message,
          data: {
            type: "admin_message",
            source: "superadmin"
          }
        })
      )
    );
    const pushSent = pushResults.reduce((sum, result) => {
      if (result.status !== "fulfilled") return sum;
      return sum + result.value.sent;
    }, 0);

    return NextResponse.json({ ok: true, recipients: recipients.length, pushSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось отправить уведомление.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

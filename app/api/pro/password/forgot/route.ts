import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../lib/app-url";
import { isMailerConfigured, sendMail } from "../../../../../lib/mailer";
import { createPasswordResetToken } from "../../../../../lib/pro-password-reset";
import { getProfessionalPasswordResetProfile } from "../../../../../lib/pro-data";

const responseMessage = {
  ok: true,
  message: "Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля."
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const language = String(body.language ?? "ru").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(responseMessage);
    }

    if (!isMailerConfigured()) {
      console.warn("[pro-password-forgot] SMTP is not configured on the server.");
      return NextResponse.json(
        { error: "Восстановление пароля временно недоступно. Попробуйте чуть позже." },
        { status: 503 }
      );
    }

    const professional = await getProfessionalPasswordResetProfile(email);
    if (!professional) {
      console.info(`[pro-password-forgot] No professional found for email: ${email}`);
      return NextResponse.json(responseMessage);
    }

    const token = createPasswordResetToken(professional.email, professional.passwordHash);
    const resetUrl = `${getPublicAppUrl(request)}/pro/reset-password?token=${encodeURIComponent(token)}`;
    const name = [professional.firstName, professional.lastName].filter(Boolean).join(" ").trim() || professional.email;

    const copy =
      language === "uk"
        ? {
            subject: "Відновлення пароля Timviz",
            headline: `Привіт, ${name}!`,
            body: "Ми отримали запит на відновлення пароля для вашого бізнес-кабінету Timviz.",
            cta: "Оновити пароль",
            footnote: "Якщо це були не ви, просто проігноруйте цей лист. Посилання діє 60 хвилин."
          }
        : language === "en"
          ? {
              subject: "Reset your Timviz password",
              headline: `Hi, ${name}!`,
              body: "We received a request to reset the password for your Timviz business account.",
              cta: "Reset password",
              footnote: "If this was not you, you can ignore this email. The link is valid for 60 minutes."
            }
          : {
              subject: "Восстановление пароля Timviz",
              headline: `Здравствуйте, ${name}!`,
              body: "Мы получили запрос на восстановление пароля для вашего бизнес-кабинета Timviz.",
              cta: "Обновить пароль",
              footnote: "Если это были не вы, просто проигнорируйте письмо. Ссылка действует 60 минут."
            };

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#f6f4ff;padding:32px 16px;color:#171411">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(17,17,17,.08);border-radius:24px;padding:32px">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;margin-bottom:12px">Timviz</div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.03em;margin-bottom:12px">${copy.headline}</div>
          <p style="font-size:16px;line-height:1.6;color:#5f5a65;margin:0 0 24px">${copy.body}</p>
          <a href="${resetUrl}" style="display:inline-block;padding:16px 28px;border-radius:999px;background:linear-gradient(135deg,#6f4cff 0%,#4f46e5 52%,#171411 100%);color:#ffffff;font-weight:800;text-decoration:none">${copy.cta}</a>
          <p style="font-size:13px;line-height:1.6;color:#81766b;margin:24px 0 0">${copy.footnote}</p>
          <p style="font-size:13px;line-height:1.6;color:#81766b;margin:16px 0 0;word-break:break-all">${resetUrl}</p>
        </div>
      </div>
    `;

    await sendMail({
      to: professional.email,
      subject: copy.subject,
      html,
      text: `${copy.headline}\n\n${copy.body}\n\n${resetUrl}\n\n${copy.footnote}`
    });

    console.info(`[pro-password-forgot] Reset email sent to ${professional.email}`);

    return NextResponse.json(responseMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send reset email.";
    console.error("[pro-password-forgot] Failed to send reset email", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

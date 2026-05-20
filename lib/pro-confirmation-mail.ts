import { getPublicAppUrl } from "./app-url";
import { createEmailConfirmationToken } from "./pro-email-confirmation";
import { isMailerConfigured, sendMail } from "./mailer";

type ConfirmationProfile = {
  email: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  createdAt: string;
};

export async function sendProfessionalConfirmationEmail(input: {
  request: Request;
  professional: ConfirmationProfile;
  language?: string;
}) {
  if (!isMailerConfigured()) {
    console.warn("[pro-email-confirmation] Mailer is not configured.");
    return false;
  }

  const language = input.language === "uk" || input.language === "en" ? input.language : "ru";
  const token = createEmailConfirmationToken(
    input.professional.email,
    input.professional.passwordHash,
    input.professional.createdAt
  );
  const confirmUrl = `${getPublicAppUrl(input.request)}/pro/confirm-email?token=${encodeURIComponent(token)}`;
  const name =
    [input.professional.firstName, input.professional.lastName].filter(Boolean).join(" ").trim() ||
    input.professional.email;
  const copy =
    language === "uk"
      ? {
          subject: "Підтвердіть email для Timviz",
          headline: `Вітаємо, ${name}!`,
          body: "Натисніть кнопку нижче, щоб підтвердити email і почати користуватись Timviz.",
          cta: "Підтвердити email",
          footnote: "Якщо це були не ви, просто проігноруйте цей лист."
        }
      : language === "en"
        ? {
            subject: "Confirm your Timviz email",
            headline: `Welcome, ${name}!`,
            body: "Click the button below to confirm your email and start using Timviz.",
            cta: "Confirm email",
            footnote: "If this was not you, you can ignore this email."
          }
        : {
            subject: "Подтвердите email для Timviz",
            headline: `Здравствуйте, ${name}!`,
            body: "Нажмите кнопку ниже, чтобы подтвердить email и начать пользоваться Timviz.",
            cta: "Подтвердить email",
            footnote: "Если это были не вы, просто проигнорируйте это письмо."
          };

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:32px;box-shadow:0 12px 40px rgba(15,23,42,.08)">
        <div style="font-size:28px;font-weight:900;margin-bottom:12px;color:#5b21b6">Timviz</div>
        <div style="font-size:24px;font-weight:900;margin-bottom:12px">${copy.headline}</div>
        <p style="font-size:16px;line-height:1.6;color:#475569;margin:0 0 24px">${copy.body}</p>
        <a href="${confirmUrl}" style="display:inline-block;padding:16px 28px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-weight:800;text-decoration:none">${copy.cta}</a>
        <p style="font-size:13px;line-height:1.6;color:#64748b;margin:24px 0 0">${copy.footnote}</p>
        <p style="font-size:13px;line-height:1.6;color:#64748b;margin:16px 0 0;word-break:break-all">${confirmUrl}</p>
      </div>
    </div>
  `;

  await sendMail({
    to: input.professional.email,
    subject: copy.subject,
    html,
    text: `${copy.headline}\n\n${copy.body}\n\n${confirmUrl}\n\n${copy.footnote}`
  });

  return true;
}

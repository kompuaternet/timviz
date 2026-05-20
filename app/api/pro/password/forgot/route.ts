import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  hasHoneypotValue,
  isDisposableEmail,
  isValidBusinessEmail,
  verifyCaptchaToken
} from "../../../../../lib/auth-security";
import { getPublicAppUrl } from "../../../../../lib/app-url";
import { authApiCopy, normalizeAuthLanguage } from "../../../../../lib/auth-api-i18n";
import { isMailerConfigured, sendMail } from "../../../../../lib/mailer";
import { createPasswordResetToken } from "../../../../../lib/pro-password-reset";
import { getProfessionalPasswordResetProfile } from "../../../../../lib/pro-data";

const resetMailCopy = {
  ru: {
    subject: "Восстановление пароля Timviz",
    headline: (name: string) => `Здравствуйте, ${name}!`,
    body: "Мы получили запрос на восстановление пароля для вашего бизнес-кабинета Timviz.",
    cta: "Обновить пароль",
    footnote: "Если это были не вы, просто проигнорируйте письмо. Ссылка действует 60 минут."
  },
  uk: {
    subject: "Відновлення пароля Timviz",
    headline: (name: string) => `Привіт, ${name}!`,
    body: "Ми отримали запит на відновлення пароля для вашого бізнес-кабінету Timviz.",
    cta: "Оновити пароль",
    footnote: "Якщо це були не ви, просто проігноруйте цей лист. Посилання діє 60 хвилин."
  },
  en: {
    subject: "Reset your Timviz password",
    headline: (name: string) => `Hi, ${name}!`,
    body: "We received a request to reset the password for your Timviz business account.",
    cta: "Reset password",
    footnote: "If this was not you, you can ignore this email. The link is valid for 60 minutes."
  },
  fr: {
    subject: "Réinitialiser votre mot de passe Timviz",
    headline: (name: string) => `Bonjour, ${name} !`,
    body: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte professionnel Timviz.",
    cta: "Réinitialiser le mot de passe",
    footnote: "Si ce n'était pas vous, ignorez cet email. Le lien est valable 60 minutes."
  },
  pl: {
    subject: "Zresetuj hasło Timviz",
    headline: (name: string) => `Cześć, ${name}!`,
    body: "Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta firmowego Timviz.",
    cta: "Zresetuj hasło",
    footnote: "Jeśli to nie Ty, zignoruj tę wiadomość. Link jest ważny przez 60 minut."
  },
  cs: {
    subject: "Obnovení hesla Timviz",
    headline: (name: string) => `Dobrý den, ${name}!`,
    body: "Obdrželi jsme žádost o obnovení hesla k vašemu firemnímu účtu Timviz.",
    cta: "Obnovit heslo",
    footnote: "Pokud jste to nebyli vy, tento e-mail ignorujte. Odkaz platí 60 minut."
  },
  es: {
    subject: "Restablece tu contraseña de Timviz",
    headline: (name: string) => `Hola, ${name}!`,
    body: "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta profesional de Timviz.",
    cta: "Restablecer contraseña",
    footnote: "Si no fuiste tú, ignora este email. El enlace es válido durante 60 minutos."
  },
  de: {
    subject: "Timviz-Passwort zurücksetzen",
    headline: (name: string) => `Hallo, ${name}!`,
    body: "Wir haben eine Anfrage zum Zurücksetzen des Passworts für dein Timviz-Geschäftskonto erhalten.",
    cta: "Passwort zurücksetzen",
    footnote: "Wenn du das nicht warst, ignoriere diese E-Mail. Der Link ist 60 Minuten gültig."
  }
} as const;

function getMobileResetReturnTo(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "timviz-master:" && url.hostname === "password-reset" ? raw : "";
  } catch {
    return "";
  }
}

function getResetPageLanguage(language: string) {
  return language === "ru" || language === "uk" || language === "en" ? language : "en";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const language = normalizeAuthLanguage(body.language);
    const t = authApiCopy[language];
    const source = String(body.source ?? "").trim().toLowerCase();
    const mobileReturnTo = source === "mobile" ? getMobileResetReturnTo(body.returnTo) : "";
    const responseMessage = {
      ok: true,
      message: t.forgotResponse
    };
    const ip = getClientIp(request);

    if (hasHoneypotValue(body.website) || hasHoneypotValue(body.company)) {
      return NextResponse.json(responseMessage);
    }

    if (!email || !isValidBusinessEmail(email) || isDisposableEmail(email)) {
      return NextResponse.json(responseMessage);
    }

    const limit = checkRateLimit(`forgot:${ip}:${email}`, { limit: 3, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: t.rateLimit, retryAfter: limit.remainingSeconds }, { status: 429 });
    }

    const captchaOk = await verifyCaptchaToken(body.captchaToken, ip);
    if (!captchaOk) {
      return NextResponse.json({ error: t.captchaRequired }, { status: 400 });
    }

    if (!isMailerConfigured()) {
      console.warn("[pro-password-forgot] SMTP is not configured on the server.");
      return NextResponse.json({ error: t.smtpUnavailable }, { status: 503 });
    }

    const professional = await getProfessionalPasswordResetProfile(email);
    if (!professional) {
      console.info(`[pro-password-forgot] No professional found for email: ${email}`);
      return NextResponse.json(responseMessage);
    }

    const token = createPasswordResetToken(professional.email, professional.passwordHash);
    const resetParams = new URLSearchParams({ token, lang: getResetPageLanguage(language) });
    if (mobileReturnTo) {
      resetParams.set("source", "mobile");
      resetParams.set("return_to", mobileReturnTo);
    }
    const resetUrl = `${getPublicAppUrl(request)}/pro/reset-password?${resetParams.toString()}`;
    const name = [professional.firstName, professional.lastName].filter(Boolean).join(" ").trim() || professional.email;

    const copy = resetMailCopy[language];
    const headline = copy.headline(name);

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#f6f4ff;padding:32px 16px;color:#171411">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(17,17,17,.08);border-radius:24px;padding:32px">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;margin-bottom:12px">Timviz</div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.03em;margin-bottom:12px">${headline}</div>
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
      text: `${headline}\n\n${copy.body}\n\n${resetUrl}\n\n${copy.footnote}`,
      from: process.env.PASSWORD_RESET_SMTP_FROM || "Timviz <no-reply@timviz.com>"
    });

    console.info(`[pro-password-forgot] Reset email sent to ${professional.email}`);

    return NextResponse.json(responseMessage);
  } catch (error) {
    console.error("[pro-password-forgot] Failed to send reset email", error);
    return NextResponse.json({ error: authApiCopy.en.forgotFailed }, { status: 400 });
  }
}

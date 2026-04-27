import nodemailer from "nodemailer";

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
  const requireTLS = String(process.env.SMTP_REQUIRE_TLS || "").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return { host, port, secure, requireTLS, user, pass, from };
}

export function isMailerConfigured() {
  return Boolean(readSmtpConfig());
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const config = readSmtpConfig();
  if (!config) {
    throw new Error("SMTP is not configured.");
  }

  const isZoho = config.host.includes("zoho");
  const zohoHosts = isZoho
    ? Array.from(
        new Set(
          [
            config.host,
            config.host.includes(".eu") ? "smtp.zoho.eu" : null,
            config.host.includes(".eu") ? "smtppro.zoho.eu" : null
          ].filter(Boolean) as string[]
        )
      )
    : [config.host];

  const attempts = isZoho
    ? zohoHosts.flatMap((host) => [
        {
          host,
          port: 587,
          secure: false,
          requireTLS: true,
          label: `zoho-587-starttls:${host}`
        },
        {
          host,
          port: 465,
          secure: true,
          requireTLS: false,
          label: `zoho-465-ssl:${host}`
        }
      ])
    : [
        {
          host: config.host,
          port: config.port,
          secure: config.secure,
          requireTLS: config.requireTLS,
          label: "configured"
        }
      ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const transporter = nodemailer.createTransport({
        host: attempt.host,
        port: attempt.port,
        secure: attempt.secure,
        requireTLS: attempt.requireTLS,
        family: isZoho ? 4 : undefined,
        tls: {
          servername: attempt.host
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: config.user,
          pass: config.pass
        }
      } as Parameters<typeof nodemailer.createTransport>[0]);

      await transporter.sendMail({
        from: config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      });

      return;
    } catch (error) {
      console.warn(
        `[mailer] SMTP attempt failed (${attempt.label} ${attempt.host}:${attempt.port} secure=${attempt.secure} requireTLS=${attempt.requireTLS})`,
        error
      );
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("SMTP send failed.");
}

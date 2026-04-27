import nodemailer from "nodemailer";
import { getZohoOAuthSettings } from "./zoho-mail";

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
  return Boolean(readSmtpConfig()) || isZohoMailApiConfigured();
}

function readZohoApiConfig() {
  const clientId = process.env.ZOHO_MAIL_CLIENT_ID;
  const clientSecret = process.env.ZOHO_MAIL_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_MAIL_REFRESH_TOKEN;
  const accountId = process.env.ZOHO_MAIL_ACCOUNT_ID;
  const from = process.env.ZOHO_MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!clientId || !clientSecret || !refreshToken || !accountId || !from) {
    return null;
  }

  return { clientId, clientSecret, refreshToken, accountId, from };
}

function isZohoMailApiConfigured() {
  return Boolean(readZohoApiConfig());
}

async function sendViaZohoApi(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const config = readZohoApiConfig();
  if (!config) {
    throw new Error("Zoho Mail API is not configured.");
  }

  const settings = getZohoOAuthSettings();
  const tokenBody = new URLSearchParams({
    refresh_token: config.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token"
  });

  const tokenResponse = await fetch(`https://${settings.accountsHost}/oauth/v2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: tokenBody,
    signal: AbortSignal.timeout(15000)
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok || tokenPayload.error || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Zoho Mail token refresh failed.");
  }

  const sendResponse = await fetch(`${settings.mailApiBase}/accounts/${config.accountId}/messages`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${tokenPayload.access_token}`
    },
    body: JSON.stringify({
      fromAddress: config.from,
      toAddress: input.to,
      subject: input.subject,
      content: input.html,
      mailFormat: "html",
      askReceipt: "no"
    }),
    signal: AbortSignal.timeout(15000)
  });

  const sendPayload = await sendResponse.json();
  if (!sendResponse.ok || sendPayload.status?.code >= 400 || sendPayload.data?.errorCode) {
    throw new Error(
      sendPayload?.status?.description ||
        sendPayload?.data?.message ||
        sendPayload?.data?.errorCode ||
        "Zoho Mail API send failed."
    );
  }
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (isZohoMailApiConfigured()) {
    await sendViaZohoApi(input);
    return;
  }

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

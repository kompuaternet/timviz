import { getPublicAppUrl } from "./app-url";

const ZOHO_ACCOUNTS_HOST = process.env.ZOHO_ACCOUNTS_HOST || "accounts.zoho.eu";
const ZOHO_MAIL_API_BASE = process.env.ZOHO_MAIL_API_BASE || "https://mail.zoho.eu/api";

function normalizeHost(value: string) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

export function getZohoOAuthSettings(request?: Request) {
  const clientId = process.env.ZOHO_MAIL_CLIENT_ID || "";
  const clientSecret = process.env.ZOHO_MAIL_CLIENT_SECRET || "";
  const redirectUri = `${getPublicAppUrl(request)}/api/zoho/oauth/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    accountsHost: normalizeHost(ZOHO_ACCOUNTS_HOST),
    mailApiBase: ZOHO_MAIL_API_BASE.replace(/\/+$/, "")
  };
}

export function buildZohoAuthUrl(request?: Request) {
  const settings = getZohoOAuthSettings(request);
  const url = new URL(`https://${settings.accountsHost}/oauth/v2/auth`);
  url.searchParams.set("scope", "ZohoMail.messages.CREATE,ZohoMail.accounts.READ");
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("redirect_uri", settings.redirectUri);
  return url.toString();
}

export async function exchangeZohoCodeForTokens(code: string, request?: Request) {
  const settings = getZohoOAuthSettings(request);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    redirect_uri: settings.redirectUri,
    code
  });

  const response = await fetch(`https://${settings.accountsHost}/oauth/v2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || "Zoho token exchange failed.");
  }

  return payload as {
    access_token: string;
    refresh_token?: string;
    api_domain?: string;
    token_type?: string;
    expires_in?: number;
  };
}

export async function getZohoMailAccountId(accessToken: string, request?: Request) {
  const settings = getZohoOAuthSettings(request);
  const response = await fetch(`${settings.mailApiBase}/accounts`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to read Zoho Mail accounts.");
  }

  const account =
    payload?.data?.find?.((item: { primaryEmailAddress?: string }) => item.primaryEmailAddress) ||
    payload?.data?.[0];

  const accountId = String(account?.accountId || "").trim();
  if (!accountId) {
    throw new Error("Zoho Mail account ID was not found.");
  }

  return accountId;
}

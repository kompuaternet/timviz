import { NextResponse } from "next/server";
import {
  exchangeZohoCodeForTokens,
  getZohoMailAccountId,
  getZohoOAuthSettings
} from "../../../../../lib/zoho-mail";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const error = url.searchParams.get("error")?.trim() || "";
  const settings = getZohoOAuthSettings(request);

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:Inter,Arial,sans-serif;padding:40px"><h1>Zoho OAuth error</h1><p>${escapeHtml(
        error
      )}</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  if (!settings.clientId || !settings.clientSecret) {
    return new NextResponse(
      `<html><body style="font-family:Inter,Arial,sans-serif;padding:40px"><h1>Zoho Mail OAuth is not configured</h1><p>Add <code>ZOHO_MAIL_CLIENT_ID</code> and <code>ZOHO_MAIL_CLIENT_SECRET</code> to Railway and redeploy.</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }

  if (!code) {
    return new NextResponse(
      `<html><body style="font-family:Inter,Arial,sans-serif;padding:40px"><h1>Missing code</h1><p>Zoho did not return an authorization code.</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  try {
    const tokens = await exchangeZohoCodeForTokens(code, request);
    const refreshToken = tokens.refresh_token || "";
    const accountId = await getZohoMailAccountId(tokens.access_token, request);

    return new NextResponse(
      `<!doctype html>
      <html>
        <body style="font-family:Inter,Arial,sans-serif;background:#f6f4ff;padding:40px;color:#171411">
          <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:24px;padding:32px">
            <h1 style="margin:0 0 16px;font-size:32px">Zoho Mail connected</h1>
            <p style="margin:0 0 24px;color:#5f5a65">Paste these values into Railway Variables, then redeploy.</p>
            <div style="display:grid;gap:16px">
              <div>
                <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6f4cff;margin-bottom:6px">ZOHO_MAIL_REFRESH_TOKEN</div>
                <pre style="margin:0;padding:16px;border-radius:16px;background:#f7f7fb;white-space:pre-wrap;word-break:break-all">${escapeHtml(
                  refreshToken
                )}</pre>
              </div>
              <div>
                <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6f4cff;margin-bottom:6px">ZOHO_MAIL_ACCOUNT_ID</div>
                <pre style="margin:0;padding:16px;border-radius:16px;background:#f7f7fb;white-space:pre-wrap;word-break:break-all">${escapeHtml(
                  accountId
                )}</pre>
              </div>
            </div>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Zoho OAuth exchange failed.";
    return new NextResponse(
      `<html><body style="font-family:Inter,Arial,sans-serif;padding:40px"><h1>Zoho OAuth failed</h1><p>${escapeHtml(
        message
      )}</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }
}

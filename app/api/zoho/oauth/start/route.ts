import { NextResponse } from "next/server";
import { buildZohoAuthUrl, getZohoOAuthSettings } from "../../../../../lib/zoho-mail";

export async function GET(request: Request) {
  const settings = getZohoOAuthSettings(request);

  if (!settings.clientId || !settings.clientSecret) {
    return NextResponse.json(
      {
        error:
          "Zoho Mail OAuth is not configured. Add ZOHO_MAIL_CLIENT_ID and ZOHO_MAIL_CLIENT_SECRET to Railway first."
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(buildZohoAuthUrl(request));
}

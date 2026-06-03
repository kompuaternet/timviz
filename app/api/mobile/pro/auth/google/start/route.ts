import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../../lib/app-url";
import {
  buildGoogleAuthUrl,
  createGooglePkcePair,
  getGoogleOAuthSettings
} from "../../../../../../../lib/google-oauth";

const GOOGLE_OAUTH_STATE_COOKIE = "timviz_mobile_google_oauth_state";
const GOOGLE_OAUTH_PKCE_COOKIE = "timviz_mobile_google_oauth_pkce";
const GOOGLE_OAUTH_LANGUAGE_COOKIE = "timviz_mobile_google_oauth_language";
const GOOGLE_OAUTH_COUNTRY_COOKIE = "timviz_mobile_google_oauth_country";
const GOOGLE_OAUTH_TIMEZONE_COOKIE = "timviz_mobile_google_oauth_timezone";
const GOOGLE_OAUTH_CURRENCY_COOKIE = "timviz_mobile_google_oauth_currency";

function setOAuthCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, name: string, value: string, secure: boolean) {
  cookieStore.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: 60 * 10
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isSecure = url.protocol === "https:";
    const settings = getGoogleOAuthSettings(request, "/api/mobile/pro/auth/google/callback");
    const state = randomBytes(24).toString("hex");
    const { codeVerifier, codeChallenge } = createGooglePkcePair();
    const cookieStore = await cookies();

    setOAuthCookie(cookieStore, GOOGLE_OAUTH_STATE_COOKIE, state, isSecure);
    setOAuthCookie(cookieStore, GOOGLE_OAUTH_PKCE_COOKIE, codeVerifier, isSecure);
    setOAuthCookie(cookieStore, GOOGLE_OAUTH_LANGUAGE_COOKIE, url.searchParams.get("language") || "uk", isSecure);
    setOAuthCookie(cookieStore, GOOGLE_OAUTH_COUNTRY_COOKIE, url.searchParams.get("country") || "Ukraine", isSecure);
    setOAuthCookie(cookieStore, GOOGLE_OAUTH_TIMEZONE_COOKIE, url.searchParams.get("timezone") || "Europe/Kyiv", isSecure);
    setOAuthCookie(cookieStore, GOOGLE_OAUTH_CURRENCY_COOKIE, url.searchParams.get("currency") || "UAH", isSecure);

    const authUrl = buildGoogleAuthUrl({
      clientId: settings.clientId,
      redirectUri: settings.redirectUri,
      state,
      codeChallenge
    });

    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.redirect(new URL("timviz-master://google-auth?error=config", getPublicAppUrl(request)));
  }
}

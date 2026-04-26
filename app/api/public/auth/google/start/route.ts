import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import {
  buildGoogleAuthUrl,
  createGooglePkcePair,
  getGoogleOAuthSettings
} from "../../../../../../lib/google-oauth";

const GOOGLE_OAUTH_STATE_COOKIE = "timviz_public_google_oauth_state";
const GOOGLE_OAUTH_RETURN_TO_COOKIE = "timviz_public_google_return_to";
const GOOGLE_OAUTH_PKCE_COOKIE = "timviz_public_google_oauth_pkce";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isSecure = url.protocol === "https:";
    const returnTo = url.searchParams.get("returnTo")?.trim() || "/";
    const settings = getGoogleOAuthSettings(request, "/api/public/auth/google/callback");
    const state = randomBytes(24).toString("hex");
    const { codeVerifier, codeChallenge } = createGooglePkcePair();

    const cookieStore = await cookies();
    cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 60 * 10
    });
    cookieStore.set(GOOGLE_OAUTH_RETURN_TO_COOKIE, returnTo, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 60 * 10
    });
    cookieStore.set(GOOGLE_OAUTH_PKCE_COOKIE, codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 60 * 10
    });

    const authUrl = buildGoogleAuthUrl({
      clientId: settings.clientId,
      redirectUri: settings.redirectUri,
      state,
      codeChallenge
    });

    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.redirect(new URL("/?google_error=config", getPublicAppUrl(request)));
  }
}

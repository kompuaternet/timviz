import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import {
  buildGoogleAuthUrl,
  createGooglePkcePair,
  getGoogleOAuthSettings
} from "../../../../../../lib/google-oauth";

const GOOGLE_OAUTH_STATE_COOKIE = "rezervo_google_oauth_state";
const GOOGLE_OAUTH_MODE_COOKIE = "rezervo_google_oauth_mode";
const GOOGLE_OAUTH_PKCE_COOKIE = "rezervo_google_oauth_pkce";
const GOOGLE_OAUTH_INVITE_COOKIE = "rezervo_google_oauth_invite";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") === "register" ? "register" : "login";
    const inviteToken = url.searchParams.get("invite")?.trim() || "";
    const isSecure = url.protocol === "https:";
    const settings = getGoogleOAuthSettings(request);
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
    cookieStore.set(GOOGLE_OAUTH_MODE_COOKIE, mode, {
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
    cookieStore.set(GOOGLE_OAUTH_INVITE_COOKIE, inviteToken, {
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
    return NextResponse.redirect(new URL("/pro/login?google_error=config", getPublicAppUrl(request)));
  }
}

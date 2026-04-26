import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import {
  getPublicCustomerCookieName,
  signPublicCustomerSession
} from "../../../../../../lib/public-customer-auth";

const GOOGLE_OAUTH_STATE_COOKIE = "timviz_public_google_oauth_state";
const GOOGLE_OAUTH_RETURN_TO_COOKIE = "timviz_public_google_return_to";
const GOOGLE_OAUTH_PKCE_COOKIE = "timviz_public_google_oauth_pkce";

function clearOAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(GOOGLE_OAUTH_RETURN_TO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(GOOGLE_OAUTH_PKCE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = getPublicAppUrl(request);
  const isSecure = url.protocol === "https:";
  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value || "";
  const codeVerifier = cookieStore.get(GOOGLE_OAUTH_PKCE_COOKIE)?.value || "";
  const returnTo = cookieStore.get(GOOGLE_OAUTH_RETURN_TO_COOKIE)?.value || "/";

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    return NextResponse.redirect(new URL(returnTo, appUrl));
  }

  try {
    const settings = getGoogleOAuthSettings(request, "/api/public/auth/google/callback");
    const profile = await exchangeCodeForGoogleProfile({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri: settings.redirectUri,
      codeVerifier
    });

    clearOAuthCookies(cookieStore, isSecure);

    const response = NextResponse.redirect(new URL(returnTo, appUrl));
    response.cookies.set(getPublicCustomerCookieName(), signPublicCustomerSession(profile), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch {
    clearOAuthCookies(cookieStore, isSecure);
    return NextResponse.redirect(new URL(returnTo, appUrl));
  }
}

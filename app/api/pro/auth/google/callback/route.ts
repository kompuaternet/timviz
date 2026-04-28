import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { getSessionCookieName, signSessionValue } from "../../../../../../lib/pro-auth";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import {
  acceptStaffInvitation,
  getProfessionalProfileByEmail,
  updateProfessionalAvatar
} from "../../../../../../lib/pro-data";

const GOOGLE_OAUTH_STATE_COOKIE = "rezervo_google_oauth_state";
const GOOGLE_OAUTH_MODE_COOKIE = "rezervo_google_oauth_mode";
const GOOGLE_OAUTH_PKCE_COOKIE = "rezervo_google_oauth_pkce";
const GOOGLE_OAUTH_INVITE_COOKIE = "rezervo_google_oauth_invite";

function clearOAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(GOOGLE_OAUTH_MODE_COOKIE, "", {
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
  cookieStore.set(GOOGLE_OAUTH_INVITE_COOKIE, "", {
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
  const mode = cookieStore.get(GOOGLE_OAUTH_MODE_COOKIE)?.value === "register" ? "register" : "login";
  const inviteToken = cookieStore.get(GOOGLE_OAUTH_INVITE_COOKIE)?.value?.trim() || "";

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    return NextResponse.redirect(new URL("/pro/login?google_error=state", appUrl));
  }

  try {
    const settings = getGoogleOAuthSettings(request);
    const profile = await exchangeCodeForGoogleProfile({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri: settings.redirectUri,
      codeVerifier
    });
    const professional = await getProfessionalProfileByEmail(profile.email);

    clearOAuthCookies(cookieStore, isSecure);

    if (professional && professional.accountStatus === "active") {
      if (profile.avatarUrl) {
        await updateProfessionalAvatar(professional.id, profile.avatarUrl).catch(() => undefined);
      }

      if (inviteToken) {
        await acceptStaffInvitation({
          professionalId: professional.id,
          invitationToken: inviteToken
        }).catch(() => undefined);
      }

      cookieStore.set(getSessionCookieName(), signSessionValue(professional.id), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 7
      });
      return NextResponse.redirect(new URL("/pro/workspace", appUrl));
    }

    const createAccountUrl = new URL("/pro/create-account", appUrl);
    createAccountUrl.searchParams.set("google", "1");
    createAccountUrl.searchParams.set("email", profile.email);
    if (inviteToken) {
      createAccountUrl.searchParams.set("invite", inviteToken);
    }
    if (profile.givenName) {
      createAccountUrl.searchParams.set("firstName", profile.givenName);
    }
    if (profile.familyName) {
      createAccountUrl.searchParams.set("lastName", profile.familyName);
    }
    if (profile.locale) {
      createAccountUrl.searchParams.set("locale", profile.locale);
    }
    if (profile.avatarUrl) {
      createAccountUrl.searchParams.set("avatarUrl", profile.avatarUrl);
    }
    if (mode === "login") {
      createAccountUrl.searchParams.set("google_from", "login");
    }

    return NextResponse.redirect(createAccountUrl);
  } catch {
    clearOAuthCookies(cookieStore, isSecure);
    return NextResponse.redirect(new URL("/pro/login?google_error=oauth", appUrl));
  }
}

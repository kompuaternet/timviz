import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { getSessionCookieName, signSessionValue } from "../../../../../../lib/pro-auth";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import { getTelegramStartAppLinkSync } from "../../../../../../lib/telegram-bot";
import {
  acceptStaffInvitation,
  getProfessionalProfileByEmail,
  updateProfessionalAvatar
} from "../../../../../../lib/pro-data";

const GOOGLE_OAUTH_STATE_COOKIE = "rezervo_google_oauth_state";
const GOOGLE_OAUTH_MODE_COOKIE = "rezervo_google_oauth_mode";
const GOOGLE_OAUTH_PKCE_COOKIE = "rezervo_google_oauth_pkce";
const GOOGLE_OAUTH_INVITE_COOKIE = "rezervo_google_oauth_invite";
const GOOGLE_OAUTH_RETURN_TO_COOKIE = "rezervo_google_oauth_return_to";

function normalizeReturnTo(value: string, fallback = "/pro/workspace") {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  return trimmed;
}

function isTelegramSourceReturn(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    return parsed.pathname.startsWith("/telegram") || parsed.searchParams.get("source") === "telegram";
  } catch {
    return false;
  }
}

function resolveFinalRedirectTarget(input: {
  appUrl: string;
  returnTo: string;
  googleError?: "state" | "oauth";
}) {
  const fallbackUrl = new URL(input.returnTo, input.appUrl);
  if (input.googleError) {
    fallbackUrl.searchParams.set("google_error", input.googleError);
  }

  if (!isTelegramSourceReturn(input.returnTo, input.appUrl)) {
    return fallbackUrl;
  }

  if (input.googleError) {
    return fallbackUrl;
  }

  const startParam = extractTelegramStartParam(input.returnTo, input.appUrl);
  const telegramLaunchLink = getTelegramStartAppLinkSync(startParam);
  if (telegramLaunchLink) {
    try {
      return new URL(telegramLaunchLink);
    } catch {
      return fallbackUrl;
    }
  }

  return fallbackUrl;
}

function extractTelegramStartParam(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    const startParam =
      parsed.searchParams.get("startapp") ||
      parsed.searchParams.get("start_param") ||
      parsed.searchParams.get("tgWebAppStartParam") ||
      "";
    return startParam.trim() || "setup";
  } catch {
    return "setup";
  }
}

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
  cookieStore.set(GOOGLE_OAUTH_RETURN_TO_COOKIE, "", {
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
  const returnTo = normalizeReturnTo(
    cookieStore.get(GOOGLE_OAUTH_RETURN_TO_COOKIE)?.value?.trim() || "",
    "/pro/workspace"
  );

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    const target = resolveFinalRedirectTarget({
      appUrl,
      returnTo,
      googleError: "state"
    });
    return NextResponse.redirect(target);
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
      const target = resolveFinalRedirectTarget({
        appUrl,
        returnTo
      });
      return NextResponse.redirect(target);
    }

    const createAccountUrl = new URL("/pro/create-account", appUrl);
    if (isTelegramSourceReturn(returnTo, appUrl)) {
      createAccountUrl.searchParams.set("source", "telegram");
      createAccountUrl.searchParams.set(
        "startapp",
        extractTelegramStartParam(returnTo, appUrl)
      );
    }
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
    const target = resolveFinalRedirectTarget({
      appUrl,
      returnTo,
      googleError: "oauth"
    });
    return NextResponse.redirect(target);
  }
}

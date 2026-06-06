import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { getSessionCookieName, signSessionValue } from "../../../../../../lib/pro-auth";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import { reportMobileRegistrationConversion } from "../../../../../../lib/mobile-registration-conversions";
import { createMobileSocialSession } from "../../../../../../lib/mobile-social-auth";
import { getTelegramStartAppLinkSync } from "../../../../../../lib/telegram-bot";
import { encodeTelegramGoogleSignupStartParam } from "../../../../../../lib/telegram-startapp";
import {
  acceptStaffInvitation,
  activateProfessionalEmailByEmail,
  getProfessionalProfileByEmail,
  updateProfessionalAvatar
} from "../../../../../../lib/pro-data";

const GOOGLE_OAUTH_STATE_COOKIE = "rezervo_google_oauth_state";
const GOOGLE_OAUTH_MODE_COOKIE = "rezervo_google_oauth_mode";
const GOOGLE_OAUTH_PKCE_COOKIE = "rezervo_google_oauth_pkce";
const GOOGLE_OAUTH_INVITE_COOKIE = "rezervo_google_oauth_invite";
const GOOGLE_OAUTH_RETURN_TO_COOKIE = "rezervo_google_oauth_return_to";
const MOBILE_GOOGLE_OAUTH_LANGUAGE_COOKIE = "timviz_mobile_google_oauth_language";
const MOBILE_GOOGLE_OAUTH_COUNTRY_COOKIE = "timviz_mobile_google_oauth_country";
const MOBILE_GOOGLE_OAUTH_TIMEZONE_COOKIE = "timviz_mobile_google_oauth_timezone";
const MOBILE_GOOGLE_OAUTH_CURRENCY_COOKIE = "timviz_mobile_google_oauth_currency";
const MOBILE_GOOGLE_OAUTH_BRIDGE_COOKIE = "timviz_mobile_google_oauth_bridge";
const adsCarryPrefixes = ["utm_"];
const adsCarryKeys = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"];

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

function isCreateAccountReturn(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    return parsed.pathname === "/pro/create-account";
  } catch {
    return false;
  }
}

function isAdsCarryKey(key: string) {
  return adsCarryKeys.includes(key) || adsCarryPrefixes.some((prefix) => key.startsWith(prefix));
}

function copySignupAttributionFromReturnTo(target: URL, returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    parsed.searchParams.forEach((value, key) => {
      if ((key === "source" || isAdsCarryKey(key)) && value && !target.searchParams.has(key)) {
        target.searchParams.set(key, value);
      }
    });
  } catch {
    // OAuth should still complete if attribution data is malformed.
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

function mobileRedirect(params: Record<string, string>) {
  const url = new URL("timviz-master://google-auth");
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

function clearMobileOAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
  [
    MOBILE_GOOGLE_OAUTH_LANGUAGE_COOKIE,
    MOBILE_GOOGLE_OAUTH_COUNTRY_COOKIE,
    MOBILE_GOOGLE_OAUTH_TIMEZONE_COOKIE,
    MOBILE_GOOGLE_OAUTH_CURRENCY_COOKIE,
    MOBILE_GOOGLE_OAUTH_BRIDGE_COOKIE,
    "timviz_mobile_google_oauth_state",
    "timviz_mobile_google_oauth_pkce",
  ].forEach((name) => {
    cookieStore.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 0
    });
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
  const isMobileOAuth = cookieStore.get(MOBILE_GOOGLE_OAUTH_BRIDGE_COOKIE)?.value === "1";
  const returnTo = normalizeReturnTo(
    cookieStore.get(GOOGLE_OAUTH_RETURN_TO_COOKIE)?.value?.trim() || "",
    "/pro/workspace"
  );

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    if (isMobileOAuth) {
      clearMobileOAuthCookies(cookieStore, isSecure);
      return mobileRedirect({ error: "state" });
    }
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
    if (isMobileOAuth) {
      const session = await createMobileSocialSession({
        provider: "google",
        profile: {
          email: profile.email,
          givenName: profile.givenName,
          familyName: profile.familyName,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl
        },
        language: cookieStore.get(MOBILE_GOOGLE_OAUTH_LANGUAGE_COOKIE)?.value,
        country: cookieStore.get(MOBILE_GOOGLE_OAUTH_COUNTRY_COOKIE)?.value,
        timezone: cookieStore.get(MOBILE_GOOGLE_OAUTH_TIMEZONE_COOKIE)?.value,
        currency: cookieStore.get(MOBILE_GOOGLE_OAUTH_CURRENCY_COOKIE)?.value
      });

      if (session.isNewRegistration) {
        await reportMobileRegistrationConversion({
          professionalId: session.professionalId,
          provider: "google",
          email: session.profile.email,
          displayName: session.profile.displayName,
          businessName: session.businessName,
          registrationSource: "мобильное приложение Google OAuth",
          workspaceReady: session.workspaceReady,
          language: session.profile.language,
          country: cookieStore.get(MOBILE_GOOGLE_OAUTH_COUNTRY_COOKIE)?.value,
          currency: cookieStore.get(MOBILE_GOOGLE_OAUTH_CURRENCY_COOKIE)?.value,
          platform: "ios",
          request
        });
      }

      clearOAuthCookies(cookieStore, isSecure);
      clearMobileOAuthCookies(cookieStore, isSecure);

      return mobileRedirect({
        token: session.token,
        professionalId: session.professionalId,
        email: session.profile.email,
        displayName: session.profile.displayName,
        isNewRegistration: session.isNewRegistration ? "true" : "false"
      });
    }

    const professional = await getProfessionalProfileByEmail(profile.email);

    clearOAuthCookies(cookieStore, isSecure);

    if (professional?.accountStatus === "pending_email") {
      await activateProfessionalEmailByEmail(profile.email);
    }

    const activeProfessional =
      professional?.accountStatus === "pending_email"
        ? await getProfessionalProfileByEmail(profile.email)
        : professional;

    if (activeProfessional && activeProfessional.accountStatus === "active") {
      if (profile.avatarUrl && !activeProfessional.avatarUrl) {
        await updateProfessionalAvatar(activeProfessional.id, profile.avatarUrl).catch(() => undefined);
      }

      if (inviteToken) {
        await acceptStaffInvitation({
          professionalId: activeProfessional.id,
          invitationToken: inviteToken
        }).catch(() => undefined);
      }

      cookieStore.set(getSessionCookieName(), signSessionValue(activeProfessional.id), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 7
      });
      const target = resolveFinalRedirectTarget({
        appUrl,
        returnTo: isCreateAccountReturn(returnTo, appUrl) ? "/pro/workspace" : returnTo
      });
      return NextResponse.redirect(target);
    }

    if (isTelegramSourceReturn(returnTo, appUrl)) {
      const signupStartParam = encodeTelegramGoogleSignupStartParam({
        email: profile.email,
        firstName: profile.givenName || "",
        lastName: profile.familyName || "",
        locale: profile.locale || "",
        avatarUrl: profile.avatarUrl || "",
        inviteToken,
        mode
      });
      const signupDeepLink = signupStartParam ? getTelegramStartAppLinkSync(signupStartParam) : null;
      if (signupDeepLink) {
        try {
          return NextResponse.redirect(new URL(signupDeepLink));
        } catch {
          // Fallback to web create-account redirect below.
        }
      }
    }

    const createAccountUrl = new URL("/pro/create-account", appUrl);
    if (isTelegramSourceReturn(returnTo, appUrl)) {
      createAccountUrl.searchParams.set("source", "telegram");
      createAccountUrl.searchParams.set(
        "startapp",
        extractTelegramStartParam(returnTo, appUrl)
      );
    } else {
      copySignupAttributionFromReturnTo(createAccountUrl, returnTo, appUrl);
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
    if (isMobileOAuth) {
      clearMobileOAuthCookies(cookieStore, isSecure);
      return mobileRedirect({ error: "oauth" });
    }
    const target = resolveFinalRedirectTarget({
      appUrl,
      returnTo,
      googleError: "oauth"
    });
    return NextResponse.redirect(target);
  }
}

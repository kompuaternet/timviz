import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../../lib/google-oauth";
import { reportMobileRegistrationConversion } from "../../../../../../../lib/mobile-registration-conversions";
import { createMobileSocialSession } from "../../../../../../../lib/mobile-social-auth";
import { sendSuperadminTelegramNotification } from "../../../../../../../lib/telegram-bot";

const GOOGLE_OAUTH_STATE_COOKIE = "timviz_mobile_google_oauth_state";
const GOOGLE_OAUTH_PKCE_COOKIE = "timviz_mobile_google_oauth_pkce";
const GOOGLE_OAUTH_LANGUAGE_COOKIE = "timviz_mobile_google_oauth_language";
const GOOGLE_OAUTH_COUNTRY_COOKIE = "timviz_mobile_google_oauth_country";
const GOOGLE_OAUTH_TIMEZONE_COOKIE = "timviz_mobile_google_oauth_timezone";
const GOOGLE_OAUTH_CURRENCY_COOKIE = "timviz_mobile_google_oauth_currency";

function mobileRedirect(params: Record<string, string>) {
  const url = new URL("timviz-master://google-auth");
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

function clearOAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, secure: boolean) {
  [
    GOOGLE_OAUTH_STATE_COOKIE,
    GOOGLE_OAUTH_PKCE_COOKIE,
    GOOGLE_OAUTH_LANGUAGE_COOKIE,
    GOOGLE_OAUTH_COUNTRY_COOKIE,
    GOOGLE_OAUTH_TIMEZONE_COOKIE,
    GOOGLE_OAUTH_CURRENCY_COOKIE,
  ].forEach((name) => {
    cookieStore.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure,
      maxAge: 0
    });
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isSecure = url.protocol === "https:";
  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value || "";
  const codeVerifier = cookieStore.get(GOOGLE_OAUTH_PKCE_COOKIE)?.value || "";

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    return mobileRedirect({ error: "state" });
  }

  try {
    const settings = getGoogleOAuthSettings(request, "/api/mobile/pro/auth/google/callback");
    const googleProfile = await exchangeCodeForGoogleProfile({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri: settings.redirectUri,
      codeVerifier
    });
    const session = await createMobileSocialSession({
      provider: "google",
      profile: {
        email: googleProfile.email,
        givenName: googleProfile.givenName,
        familyName: googleProfile.familyName,
        fullName: googleProfile.fullName,
        avatarUrl: googleProfile.avatarUrl
      },
      language: cookieStore.get(GOOGLE_OAUTH_LANGUAGE_COOKIE)?.value,
      country: cookieStore.get(GOOGLE_OAUTH_COUNTRY_COOKIE)?.value,
      timezone: cookieStore.get(GOOGLE_OAUTH_TIMEZONE_COOKIE)?.value,
      currency: cookieStore.get(GOOGLE_OAUTH_CURRENCY_COOKIE)?.value
    });

    if (session.isNewRegistration) {
      await sendSuperadminTelegramNotification({
        eventType: "user_registered",
        professionalId: session.professionalId,
        professionalName: session.profile.displayName,
        professionalEmail: session.profile.email,
        professionalPhone: "",
        registrationSource: "мобильное приложение iOS",
        ownerMode: "owner",
        businessName: session.businessName || undefined,
        workspaceReady: session.workspaceReady
      }).catch(() => undefined);

      await reportMobileRegistrationConversion({
        professionalId: session.professionalId,
        provider: "google",
        email: session.profile.email,
        displayName: session.profile.displayName,
        businessName: session.businessName,
        registrationSource: "мобильное приложение iOS",
        workspaceReady: session.workspaceReady,
        language: session.profile.language,
        country: cookieStore.get(GOOGLE_OAUTH_COUNTRY_COOKIE)?.value,
        currency: cookieStore.get(GOOGLE_OAUTH_CURRENCY_COOKIE)?.value,
        platform: "ios",
        request
      });
    }

    clearOAuthCookies(cookieStore, isSecure);

    return mobileRedirect({
      token: session.token,
      professionalId: session.professionalId,
      email: session.profile.email,
      displayName: session.profile.displayName,
      language: session.profile.language,
      isNewRegistration: session.isNewRegistration ? "true" : "false"
    });
  } catch {
    clearOAuthCookies(cookieStore, isSecure);
    return mobileRedirect({ error: "oauth" });
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { getSessionCookieName, signSessionValue } from "../../../../../../lib/pro-auth";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import { getTelegramStartAppLink } from "../../../../../../lib/telegram-bot";
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

function isTelegramWebViewRequest(request: Request) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  return userAgent.includes("telegram");
}

function resolveStartParamFromReturnTo(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    const raw =
      parsed.searchParams.get("startapp") ||
      parsed.searchParams.get("start_param") ||
      parsed.searchParams.get("tgWebAppStartParam") ||
      "";
    const normalized = raw.trim().toLowerCase();
    if (!normalized) {
      return "calendar";
    }
    if (normalized.includes("settings") || normalized.includes("setup")) return "settings";
    if (normalized.includes("notifications") || normalized.includes("inbox")) return "notifications";
    if (normalized.includes("clients")) return "clients";
    if (normalized.includes("services")) return "services";
    if (normalized.includes("staff") || normalized.includes("team") || normalized.includes("schedule")) {
      return "staff";
    }
    if (normalized.includes("support") || normalized.includes("help")) return "support";
    return "calendar";
  } catch {
    return "calendar";
  }
}

function buildTelegramProtocolLink(input: string) {
  try {
    const parsed = new URL(input);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const botUsername = segments[0]?.trim().replace(/^@/, "");
    if (!botUsername) {
      return null;
    }

    const protocolUrl = new URL("tg://resolve");
    protocolUrl.searchParams.set("domain", botUsername);
    if (segments[1]) {
      protocolUrl.searchParams.set("appname", segments[1]);
    }

    const startApp = parsed.searchParams.get("startapp")?.trim();
    if (startApp) {
      protocolUrl.searchParams.set("startapp", startApp);
    }
    return protocolUrl.toString();
  } catch {
    return null;
  }
}

function buildTelegramBridgeResponse(input: {
  deepLink: string;
  fallbackUrl: URL;
  title: string;
  subtitle: string;
  continueText: string;
  openAppText: string;
}) {
  const protocolLink = buildTelegramProtocolLink(input.deepLink);
  const deepLinkJson = JSON.stringify(input.deepLink);
  const protocolJson = JSON.stringify(protocolLink || "");
  const fallbackJson = JSON.stringify(input.fallbackUrl.toString());
  const title = input.title;
  const subtitle = input.subtitle;
  const continueText = input.continueText;
  const openAppText = input.openAppText;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f4f5fb; color: #1f2433; }
      main { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
      .card { width: min(520px, 100%); background: #fff; border: 1px solid #e6e9f6; border-radius: 20px; padding: 22px; box-shadow: 0 20px 60px rgba(83, 83, 132, 0.14); }
      h1 { margin: 0; font-size: 1.32rem; line-height: 1.2; }
      p { margin: 10px 0 0; color: #5f6883; line-height: 1.45; }
      .row { display: grid; gap: 10px; margin-top: 18px; }
      a { display: inline-flex; min-height: 44px; border-radius: 12px; align-items: center; justify-content: center; text-decoration: none; font-weight: 700; }
      .primary { background: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%); color: #fff; }
      .ghost { border: 1px solid #d8ddf0; color: #23283a; background: #fff; }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <div class="row">
          <a id="open-app" class="primary" href=${deepLinkJson}>${openAppText}</a>
          <a class="ghost" href=${fallbackJson}>${continueText}</a>
        </div>
      </section>
    </main>
    <script>
      const protocolLink = ${protocolJson};
      const deepLink = ${deepLinkJson};
      const fallbackUrl = ${fallbackJson};
      const openVia = (target) => {
        if (!target) return;
        try {
          window.location.replace(target);
        } catch {}
      };
      if (protocolLink) {
        openVia(protocolLink);
      }
      window.setTimeout(() => openVia(deepLink), protocolLink ? 360 : 120);
      window.setTimeout(() => openVia(fallbackUrl), 2600);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0"
    }
  });
}

async function resolveFinalRedirectTarget(input: {
  request: Request;
  appUrl: string;
  returnTo: string;
  googleError?: "state" | "oauth";
}) {
  const fallbackUrl = new URL(input.returnTo, input.appUrl);
  if (input.googleError) {
    fallbackUrl.searchParams.set("google_error", input.googleError);
  }

  if (!isTelegramSourceReturn(input.returnTo, input.appUrl)) {
    return { type: "url" as const, url: fallbackUrl };
  }

  if (isTelegramWebViewRequest(input.request)) {
    return { type: "url" as const, url: fallbackUrl };
  }

  const startParam = resolveStartParamFromReturnTo(input.returnTo, input.appUrl);
  const deepLink = await getTelegramStartAppLink(startParam);
  if (deepLink) {
    return {
      type: "bridge" as const,
      response: buildTelegramBridgeResponse({
        deepLink,
        fallbackUrl,
        title: "Повертаємо в Telegram",
        subtitle: "Якщо Mini App не відкрилась автоматично, натисніть кнопку нижче.",
        continueText: "Продовжити у веб-версії",
        openAppText: "Відкрити Mini App"
      })
    };
  }

  return { type: "url" as const, url: fallbackUrl };
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
    const target = await resolveFinalRedirectTarget({
      request,
      appUrl,
      returnTo,
      googleError: "state"
    });
    return target.type === "bridge" ? target.response : NextResponse.redirect(target.url);
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
      const target = await resolveFinalRedirectTarget({
        request,
        appUrl,
        returnTo
      });
      return target.type === "bridge" ? target.response : NextResponse.redirect(target.url);
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
    const target = await resolveFinalRedirectTarget({
      request,
      appUrl,
      returnTo,
      googleError: "oauth"
    });
    return target.type === "bridge" ? target.response : NextResponse.redirect(target.url);
  }
}

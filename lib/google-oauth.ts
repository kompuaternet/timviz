import { createHash, randomBytes } from "crypto";

type GoogleUserProfile = {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  locale: string;
};

function ensureEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getGoogleOAuthSettings(origin: string) {
  const clientId = ensureEnv("GOOGLE_CLIENT_ID");
  const clientSecret = ensureEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = `${origin}/api/pro/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri
  };
}

export function buildGoogleAuthUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "select_account",
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256"
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function base64UrlEncode(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createGooglePkcePair() {
  const codeVerifier = base64UrlEncode(randomBytes(64));
  const codeChallenge = base64UrlEncode(createHash("sha256").update(codeVerifier).digest());

  return {
    codeVerifier,
    codeChallenge
  };
}

export async function exchangeCodeForGoogleProfile(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<GoogleUserProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
      grant_type: "authorization_code"
    })
  });

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Google token exchange failed.");
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  const profile = (await userInfoResponse.json()) as {
    email?: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    locale?: string;
  };

  if (!userInfoResponse.ok || !profile.email) {
    throw new Error("Could not fetch Google profile.");
  }

  return {
    email: profile.email.trim().toLowerCase(),
    givenName: (profile.given_name || "").trim(),
    familyName: (profile.family_name || "").trim(),
    fullName: (profile.name || "").trim(),
    locale: (profile.locale || "").trim()
  };
}

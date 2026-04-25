const PUBLIC_APP_URL_ENV_KEYS = [
  "APP_URL",
  "SITE_URL",
  "BASE_URL",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL"
] as const;

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function readConfiguredPublicUrl() {
  for (const key of PUBLIC_APP_URL_ENV_KEYS) {
    const value = process.env[key];
    if (!value) {
      continue;
    }

    const normalized = normalizeUrl(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function readForwardedOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "";
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || "";

  if (!forwardedHost || forwardedHost === "0.0.0.0" || forwardedHost.startsWith("0.0.0.0:")) {
    return "";
  }

  const protocol = forwardedProto || (forwardedHost.includes("localhost") ? "http" : "https");
  return normalizeUrl(`${protocol}://${forwardedHost}`);
}

function readOriginFromRequestUrl(request: Request) {
  const url = new URL(request.url);

  if (url.hostname === "0.0.0.0") {
    return "";
  }

  return normalizeUrl(url.origin);
}

export function getPublicAppUrl(request?: Request) {
  const configuredUrl = readConfiguredPublicUrl();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (request) {
    const forwardedOrigin = readForwardedOrigin(request);
    if (forwardedOrigin) {
      return forwardedOrigin;
    }

    const requestOrigin = readOriginFromRequestUrl(request);
    if (requestOrigin) {
      return requestOrigin;
    }
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://timviz.com";
}


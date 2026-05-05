"use client";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: unknown;
  };
};

function normalizeStartParam(value: string | null | undefined, fallback = "calendar") {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized.includes("notifications") || normalized.includes("inbox")) return "notifications";
  if (normalized.includes("settings") || normalized.includes("setup")) return "settings";
  if (normalized.includes("support") || normalized.includes("help")) return "support";
  if (normalized.includes("clients")) return "clients";
  if (normalized.includes("services")) return "services";
  if (
    normalized.includes("staff") ||
    normalized.includes("team") ||
    normalized.includes("schedule")
  ) {
    return "staff";
  }
  if (normalized.includes("calendar") || normalized.includes("home") || normalized.includes("workspace")) {
    return "calendar";
  }
  return fallback;
}

function inferStartParamFromPathname(pathname: string, fallback = "calendar") {
  const value = pathname.trim().toLowerCase();
  if (!value) return fallback;
  if (value.includes("/pro/settings")) return "settings";
  if (value.includes("/pro/clients")) return "clients";
  if (value.includes("/pro/services")) return "services";
  if (value.includes("/pro/staff") || value.includes("/pro/schedule")) return "staff";
  if (value.includes("/pro/calendar") || value.includes("/pro/workspace")) return "calendar";
  return fallback;
}

export function isTelegramContext() {
  if (typeof window === "undefined") {
    return false;
  }
  const runtime = (window as TelegramWindow).Telegram?.WebApp;
  if (runtime) {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  const source = params.get("source")?.trim().toLowerCase();
  if (source === "telegram") {
    return true;
  }
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("telegram");
}

export function getTelegramStartParamFromLocation(fallback = "calendar") {
  if (typeof window === "undefined") {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);
  const raw =
    params.get("startapp") ||
    params.get("start_param") ||
    params.get("tgWebAppStartParam");
  if (raw?.trim()) {
    return normalizeStartParam(raw, fallback);
  }

  return inferStartParamFromPathname(window.location.pathname, fallback);
}

export function getPostLogoutRedirectPath(fallbackStartParam = "calendar") {
  if (!isTelegramContext()) {
    return "/pro/login";
  }

  const startParam = getTelegramStartParamFromLocation(fallbackStartParam);
  const query = new URLSearchParams();
  query.set("source", "telegram");
  if (startParam) {
    query.set("startapp", startParam);
  }

  return `/telegram?${query.toString()}`;
}


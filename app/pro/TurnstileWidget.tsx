"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          appearance?: "always" | "execute" | "interaction-only";
          size?: "normal" | "compact" | "flexible";
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
};

const turnstileScriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const copy = {
  ru: {
    loading: "Проверка безопасности загружается...",
    fallback: "Завершаем проверку...",
    unavailable: "Не удалось загрузить проверку. Обновите страницу."
  },
  uk: {
    loading: "Перевірка безпеки завантажується...",
    fallback: "Завершуємо перевірку...",
    unavailable: "Не вдалося завантажити перевірку. Оновіть сторінку."
  },
  en: {
    loading: "Security check is loading...",
    fallback: "Finishing the security check...",
    unavailable: "Could not load the security check. Refresh the page."
  }
} as const;

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.turnstile) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${turnstileScriptSrc}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = turnstileScriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const { language } = useProLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const fallbackRequestedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "unavailable">("loading");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const t = copy[language];

  async function requestFallbackToken() {
    if (fallbackRequestedRef.current) return;
    fallbackRequestedRef.current = true;
    setStatus("fallback");
    try {
      const response = await fetch("/api/mobile/captcha/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "web-captcha", language })
      });
      const payload = (await response.json().catch(() => ({}))) as { token?: string };
      if (!response.ok || !payload.token) {
        onToken("");
        setStatus("unavailable");
        onExpire?.();
        return;
      }
      onToken(payload.token);
      setStatus("ready");
    } catch {
      onToken("");
      setStatus("unavailable");
      onExpire?.();
    }
  }

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    fallbackRequestedRef.current = false;
    setStatus("loading");

    const slowLoadTimer = window.setTimeout(() => {
      void requestFallbackToken();
    }, 8000);

    loadTurnstileScript().then((loaded) => {
      if (cancelled || !loaded || !window.turnstile || !containerRef.current) {
        if (!cancelled) void requestFallbackToken();
        return;
      }

      window.clearTimeout(slowLoadTimer);
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        appearance: "always",
        size: "normal",
        theme: "light",
        callback: (token) => {
          setStatus("ready");
          onToken(token);
        },
        "expired-callback": () => {
          onToken("");
          fallbackRequestedRef.current = false;
          setStatus("loading");
          onExpire?.();
        },
        "error-callback": () => {
          onToken("");
          void requestFallbackToken();
        }
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(slowLoadTimer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onExpire, onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <div className={styles.turnstileBox}>
      <div ref={containerRef} />
      {status === "loading" ? <span>{t.loading}</span> : null}
      {status === "fallback" ? <span>{t.fallback}</span> : null}
      {status === "unavailable" ? <span>{t.unavailable}</span> : null}
    </div>
  );
}

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
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      resolve(Boolean(loaded && window.turnstile));
    };

    let script = document.querySelector<HTMLScriptElement>(`script[src="${turnstileScriptSrc}"]`);
    if (script?.dataset.turnstileStatus === "loaded" && !window.turnstile) {
      script.remove();
      script = null;
    }

    if (script) {
      script.addEventListener("load", () => finish(true), { once: true });
      script.addEventListener("error", () => finish(false), { once: true });
      window.setTimeout(() => finish(Boolean(window.turnstile)), 3500);
      return;
    }

    script = document.createElement("script");
    script.src = turnstileScriptSrc;
    script.async = true;
    script.defer = true;
    script.dataset.turnstileStatus = "loading";
    script.onload = () => {
      script.dataset.turnstileStatus = "loaded";
      finish(true);
    };
    script.onerror = () => {
      script.dataset.turnstileStatus = "failed";
      finish(false);
    };
    document.head.appendChild(script);
    window.setTimeout(() => finish(Boolean(window.turnstile)), 8000);
  });
}

export default function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const { language } = useProLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const fallbackRequestedRef = useRef(false);
  const tokenReceivedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "unavailable">("loading");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const t = (copy as unknown as Record<string, typeof copy.en>)[language] ?? copy.en;

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
    if (!siteKey || !containerRef.current) {
      void requestFallbackToken();
      return;
    }
    let cancelled = false;
    fallbackRequestedRef.current = false;
    tokenReceivedRef.current = false;
    setStatus("loading");

    const slowLoadTimer = window.setTimeout(() => {
      void requestFallbackToken();
    }, 8000);
    let noTokenTimer: number | null = null;

    loadTurnstileScript().then((loaded) => {
      if (cancelled || !loaded || !window.turnstile || !containerRef.current) {
        if (!cancelled) void requestFallbackToken();
        return;
      }

      window.clearTimeout(slowLoadTimer);
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          appearance: "always",
          size: "normal",
          theme: "light",
          callback: (token) => {
            tokenReceivedRef.current = true;
            if (noTokenTimer) window.clearTimeout(noTokenTimer);
            setStatus("ready");
            onToken(token);
          },
          "expired-callback": () => {
            tokenReceivedRef.current = false;
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
      } catch {
        void requestFallbackToken();
        return;
      }
      noTokenTimer = window.setTimeout(() => {
        if (!cancelled && !tokenReceivedRef.current) void requestFallbackToken();
      }, 4500);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(slowLoadTimer);
      if (noTokenTimer) window.clearTimeout(noTokenTimer);
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

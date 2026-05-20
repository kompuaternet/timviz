"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
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

const turnstileScriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const copy = {
  ru: {
    title: "Проверка безопасности",
    text: "Подтвердите, что аккаунт создаёт реальный мастер. Это помогает защитить Timviz от спама.",
    loading: "Загружаем проверку...",
    error: "Проверка не загрузилась. Закройте окно и попробуйте ещё раз.",
    fallback: "Завершаем проверку...",
    done: "Готово, возвращаемся в приложение..."
  },
  uk: {
    title: "Перевірка безпеки",
    text: "Підтвердіть, що акаунт створює реальний майстер. Це допомагає захистити Timviz від спаму.",
    loading: "Завантажуємо перевірку...",
    error: "Перевірка не завантажилась. Закрийте вікно і спробуйте ще раз.",
    fallback: "Завершуємо перевірку...",
    done: "Готово, повертаємось у застосунок..."
  },
  en: {
    title: "Security check",
    text: "Confirm that a real professional is creating this account. This helps protect Timviz from spam.",
    loading: "Loading check...",
    error: "The check could not load. Close this window and try again.",
    fallback: "Finishing the check...",
    done: "Done, returning to the app..."
  },
  fr: {
    title: "Vérification de sécurité",
    text: "Confirmez qu'un vrai professionnel crée ce compte. Cela aide à protéger Timviz du spam.",
    loading: "Chargement de la vérification...",
    error: "La vérification n'a pas pu se charger. Fermez la fenêtre et réessayez.",
    fallback: "Finalisation de la vérification...",
    done: "Terminé, retour à l'application..."
  },
  pl: {
    title: "Kontrola bezpieczeństwa",
    text: "Potwierdź, że konto tworzy prawdziwy specjalista. To pomaga chronić Timviz przed spamem.",
    loading: "Ładujemy kontrolę...",
    error: "Nie udało się załadować kontroli. Zamknij okno i spróbuj ponownie.",
    fallback: "Kończymy kontrolę...",
    done: "Gotowe, wracamy do aplikacji..."
  },
  cs: {
    title: "Bezpečnostní kontrola",
    text: "Potvrďte, že účet vytváří skutečný profesionál. Pomáhá to chránit Timviz před spamem.",
    loading: "Načítáme kontrolu...",
    error: "Kontrolu se nepodařilo načíst. Zavřete okno a zkuste to znovu.",
    fallback: "Dokončujeme kontrolu...",
    done: "Hotovo, vracíme se do aplikace..."
  },
  es: {
    title: "Verificación de seguridad",
    text: "Confirma que una persona real está creando esta cuenta. Esto ayuda a proteger Timviz del spam.",
    loading: "Cargando verificación...",
    error: "La verificación no pudo cargarse. Cierra la ventana e inténtalo de nuevo.",
    fallback: "Finalizando la verificación...",
    done: "Listo, volviendo a la app..."
  },
  de: {
    title: "Sicherheitsprüfung",
    text: "Bestätige, dass ein echter Profi dieses Konto erstellt. So schützen wir Timviz vor Spam.",
    loading: "Prüfung wird geladen...",
    error: "Die Prüfung konnte nicht geladen werden. Schließe das Fenster und versuche es erneut.",
    fallback: "Prüfung wird abgeschlossen...",
    done: "Fertig, zurück zur App..."
  }
} as const;
type CaptchaLanguage = keyof typeof copy;

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

function getSafeReturnTo(raw: string | null) {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "timviz-master:" && url.hostname === "captcha" ? raw : "";
  } catch {
    return "";
  }
}

function normalizeCaptchaLanguage(value: string | null): CaptchaLanguage {
  const language = String(value ?? "").trim().toLowerCase();
  if (language === "ua" || language.startsWith("uk")) return "uk";
  if (language.startsWith("en")) return "en";
  if (language.startsWith("fr")) return "fr";
  if (language.startsWith("pl")) return "pl";
  if (language.startsWith("cs") || language.startsWith("cz")) return "cs";
  if (language.startsWith("es")) return "es";
  if (language.startsWith("de")) return "de";
  return "en";
}

export default function MobileCaptchaPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const fallbackRequestedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "done" | "error">("loading");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
  const requestedLanguage = params.get("language");
  const language = normalizeCaptchaLanguage(requestedLanguage);
  const returnTo = getSafeReturnTo(params.get("return_to"));
  const t = copy[language];

  function deliverToken(token: string) {
    setStatus("done");
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "turnstile-token", token }));
      return;
    }
    if (returnTo) {
      const target = new URL(returnTo);
      target.searchParams.set("token", token);
      window.location.href = target.toString();
    }
  }

  async function requestFallbackToken() {
    if (fallbackRequestedRef.current) return;
    fallbackRequestedRef.current = true;
    setStatus("fallback");
    try {
      const response = await fetch("/api/mobile/captcha/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "mobile-captcha", language })
      });
      const payload = (await response.json().catch(() => ({}))) as { token?: string };
      if (!response.ok || !payload.token) {
        setStatus("error");
        return;
      }
      deliverToken(payload.token);
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      void requestFallbackToken();
      return;
    }

    let cancelled = false;

    loadTurnstileScript().then((loaded) => {
      if (cancelled || !loaded || !window.turnstile || !containerRef.current) {
        if (!cancelled) void requestFallbackToken();
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        appearance: "always",
        size: "normal",
        theme: "light",
        callback: (token) => {
          deliverToken(token);
        },
        "expired-callback": () => setStatus("ready"),
        "error-callback": () => void requestFallbackToken()
      });
      setStatus("ready");
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [returnTo, siteKey]);

  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <div style={styles.logo}>Timviz</div>
        <h1 style={styles.title}>{t.title}</h1>
        <p style={styles.text}>{t.text}</p>
        <div style={styles.widget}>
          <div ref={containerRef} />
        </div>
        {status === "loading" ? <p style={styles.muted}>{t.loading}</p> : null}
        {status === "fallback" ? <p style={styles.muted}>{t.fallback}</p> : null}
        {status === "done" ? <p style={styles.success}>{t.done}</p> : null}
        {status === "error" ? <p style={styles.error}>{t.error}</p> : null}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    padding: "24px 18px",
    background: "#f8fafc",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 24,
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    background: "#ffffff",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)"
  },
  logo: {
    color: "#6d4aff",
    fontSize: 18,
    fontWeight: 900
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 900
  },
  text: {
    margin: 0,
    color: "#64748b",
    fontSize: 16,
    lineHeight: 1.45,
    fontWeight: 650
  },
  widget: {
    minHeight: 70,
    display: "flex",
    alignItems: "center"
  },
  muted: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
    fontWeight: 700
  },
  success: {
    margin: 0,
    color: "#166534",
    fontSize: 14,
    fontWeight: 800
  },
  error: {
    margin: 0,
    padding: 12,
    borderRadius: 14,
    background: "#fff7ed",
    color: "#9a3412",
    fontSize: 14,
    fontWeight: 800
  }
};

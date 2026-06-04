"use client";

import { useEffect } from "react";

type MonobankReturnViewProps = {
  redirectHref: string;
};

export default function MonobankReturnView({ redirectHref }: MonobankReturnViewProps) {
  useEffect(() => {
    let cancelled = false;
    const redirectUrl = new URL(redirectHref, window.location.origin).toString();

    function redirectToSettings() {
      try {
        if (window.top && window.top !== window) {
          window.top.location.assign(redirectUrl);
          return;
        }
      } catch {
        // Cross-origin frames can block top navigation; replacing the current frame is still better than hanging.
      }
      window.location.replace(redirectUrl);
    }

    async function refreshSubscription() {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (cancelled) return;
        try {
          const response = await fetch("/api/billing/monobank/refresh-subscription", {
            method: "POST",
            cache: "no-store"
          });
          const payload = (await response.json().catch(() => ({}))) as { active?: boolean };
          if (response.ok && payload.active) break;
        } catch {
          // The webhook can still finish the update; keep the return flow moving.
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }

      if (cancelled) return;
      window.parent?.postMessage({ type: "timviz:monobank:subscription-return" }, window.location.origin);
      redirectToSettings();
    }

    void refreshSubscription();
    return () => {
      cancelled = true;
    };
  }, [redirectHref]);

  return null;
}

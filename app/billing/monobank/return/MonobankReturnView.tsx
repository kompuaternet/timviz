"use client";

import { useEffect } from "react";

type MonobankReturnViewProps = {
  redirectHref: string;
};

export default function MonobankReturnView({ redirectHref }: MonobankReturnViewProps) {
  useEffect(() => {
    window.parent?.postMessage({ type: "timviz:monobank:subscription-return" }, window.location.origin);

    if (window.parent === window) {
      const timeout = window.setTimeout(() => {
        window.location.replace(redirectHref);
      }, 1400);
      return () => window.clearTimeout(timeout);
    }
  }, [redirectHref]);

  return null;
}

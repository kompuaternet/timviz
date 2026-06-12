"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackAdsEvent, trackMetaPageView } from "../lib/ads-events";

export default function AdsSignals() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const previousPath = previousPathRef.current;
    const isInitialPageView = previousPath === null;
    previousPathRef.current = pathname;

    trackAdsEvent("page_view_signal", {
      source: "site",
      route: pathname,
      navigation_type: isInitialPageView ? "initial" : "client"
    });

    if (!isInitialPageView) {
      trackMetaPageView({
        source: "client_navigation",
        route: pathname
      });
    }
  }, [pathname]);

  return null;
}

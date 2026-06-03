"use client";

import { useEffect } from "react";
import { captureAdsAttribution, trackAdsEvent } from "../lib/ads-events";

export default function AdsSignals() {
  useEffect(() => {
    captureAdsAttribution();
    trackAdsEvent("page_view_signal", {
      source: "site"
    });
  }, []);

  return null;
}

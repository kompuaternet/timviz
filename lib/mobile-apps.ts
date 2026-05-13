function envEnabled(value: string | undefined) {
  return value === "true" || value === "1";
}

export const mobileApps = {
  enabled: envEnabled(process.env.NEXT_PUBLIC_ENABLE_MOBILE_APPS),
  ios: {
    enabled: envEnabled(process.env.NEXT_PUBLIC_ENABLE_IOS_APP),
    url: process.env.NEXT_PUBLIC_IOS_APP_URL?.trim() || ""
  },
  android: {
    enabled: envEnabled(process.env.NEXT_PUBLIC_ENABLE_ANDROID_APP),
    url: process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim() || ""
  }
} as const;

export function areMobileAppsAvailable() {
  return (
    mobileApps.enabled &&
    ((mobileApps.ios.enabled && Boolean(mobileApps.ios.url)) ||
      (mobileApps.android.enabled && Boolean(mobileApps.android.url)))
  );
}

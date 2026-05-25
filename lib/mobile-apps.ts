function envEnabled(value: string | undefined) {
  return value === "true" || value === "1";
}

function envDisabled(value: string | undefined) {
  return value === "false" || value === "0";
}

function envFlag(value: string | undefined, fallback: boolean) {
  if (envEnabled(value)) return true;
  if (envDisabled(value)) return false;
  return fallback;
}

export const timvizMasterAppStoreUrl = "https://apps.apple.com/app/timviz-master/id6771003105";

export const mobileApps = {
  enabled: envFlag(process.env.NEXT_PUBLIC_ENABLE_MOBILE_APPS, true),
  ios: {
    enabled: envFlag(process.env.NEXT_PUBLIC_ENABLE_IOS_APP, true),
    url: process.env.NEXT_PUBLIC_IOS_APP_URL?.trim() || timvizMasterAppStoreUrl
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

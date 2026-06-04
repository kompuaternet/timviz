const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const BILLING_PERMISSION = "com.android.vending.BILLING";

function hasPermission(manifest, permissionName) {
  const permissions = manifest["uses-permission"] || [];
  return permissions.some((permission) => permission?.$?.["android:name"] === permissionName);
}

function withAndroidPlayBilling(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const manifest = configWithManifest.modResults.manifest;
    if (!hasPermission(manifest, BILLING_PERMISSION)) {
      manifest["uses-permission"] = [
        ...(manifest["uses-permission"] || []),
        { $: { "android:name": BILLING_PERMISSION } },
      ];
    }

    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(configWithManifest.modResults);
    mainActivity.$["android:launchMode"] = "singleTop";

    return configWithManifest;
  });
}

module.exports = withAndroidPlayBilling;

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const profile = process.argv.find((arg) => arg.startsWith("--profile="))?.split("=")[1] || "production";
const skipServerEnv = process.argv.includes("--skip-server-env");

function loadDotenv(filePath) {
  const absolutePath = path.join(root, filePath);
  if (!fs.existsSync(absolutePath)) return;
  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

[".env", ".env.local", "apps/mobile/.env", "apps/mobile/.env.local"].forEach(loadDotenv);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(root, filePath), "utf8"));
}

function isSet(value) {
  return typeof value === "string" && value.trim() && !value.includes("YOUR_") && !value.includes("xxx");
}

const appConfig = readJson("apps/mobile/app.json").expo;
const easConfig = readJson("apps/mobile/eas.json");
const buildProfile = easConfig.build?.[profile] || {};
const buildEnv = buildProfile.env || {};
const productionSubmit = easConfig.submit?.production?.android || {};

function configuredValue(key) {
  return process.env[key] || buildEnv[key] || "";
}

const plugins = appConfig.plugins || [];
const pluginNames = plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin));
const androidPermissions = appConfig.android?.permissions || [];
const serviceAccountPath = productionSubmit.serviceAccountKeyPath
  ? path.join(root, "apps/mobile", productionSubmit.serviceAccountKeyPath)
  : "";

const checks = [
  {
    ok: appConfig.android?.package === "com.timviz.master",
    label: "Android package is com.timviz.master",
  },
  {
    ok: androidPermissions.includes("com.android.vending.BILLING"),
    label: "Google Play Billing permission is declared in app.json",
  },
  {
    ok: pluginNames.includes("./plugins/with-android-play-billing"),
    label: "Android Play Billing config plugin is enabled",
  },
  {
    ok: buildProfile.android?.buildType === "app-bundle",
    label: `EAS ${profile} Android build produces an AAB`,
  },
  {
    ok: productionSubmit.track === "production" && productionSubmit.releaseStatus === "draft",
    label: "EAS Android submit target is production draft",
  },
  {
    ok: Boolean(serviceAccountPath && fs.existsSync(serviceAccountPath)),
    label: "Google Play service account JSON exists locally for submit",
  },
  {
    ok: isSet(configuredValue("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY")),
    label: "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY is available to the mobile build",
  },
  {
    ok: configuredValue("EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID") === "premium",
    label: "RevenueCat entitlement id is premium",
  },
  {
    ok: configuredValue("EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID") === "timviz_premium_monthly",
    label: "Monthly product id is timviz_premium_monthly",
  },
  {
    ok: configuredValue("EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID") === "timviz_premium_yearly",
    label: "Yearly product id is timviz_premium_yearly",
  },
];

if (!skipServerEnv) {
  checks.push(
    {
      ok: isSet(process.env.REVENUECAT_SECRET_API_KEY),
      label: "REVENUECAT_SECRET_API_KEY is available in the server deploy environment",
    },
    {
      ok: process.env.REVENUECAT_ENTITLEMENT_ID === "premium" || !process.env.REVENUECAT_ENTITLEMENT_ID,
      label: "Server RevenueCat entitlement id is premium or uses the default",
    },
    {
      ok: isSet(process.env.REVENUECAT_WEBHOOK_SECRET),
      label: "REVENUECAT_WEBHOOK_SECRET is available in the server deploy environment",
    }
  );
}

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "FAIL"} ${check.label}`);
}

if (failed.length) {
  console.error(`\nAndroid subscription readiness failed: ${failed.length} check(s) need attention.`);
  process.exit(1);
}

console.log("\nAndroid subscription readiness checks passed.");

const fs = require("fs");
const path = require("path");

const baseConfig = require("./app.json");

function resolveOptionalFile(value) {
  if (!value) return "";
  const absolutePath = path.isAbsolute(value) ? value : path.resolve(__dirname, value);
  return fs.existsSync(absolutePath) ? value : "";
}

function resolveFirstOptionalFile(values) {
  for (const value of values) {
    const resolved = resolveOptionalFile(value);
    if (resolved) return resolved;
  }
  return "";
}

module.exports = () => {
  const config = JSON.parse(JSON.stringify(baseConfig));
  const expo = config.expo;
  const buildPlatform = process.env.EAS_BUILD_PLATFORM || process.env.EXPO_BUILD_PLATFORM || "";
  const iosGoogleServicesFile = resolveFirstOptionalFile([
    process.env.GOOGLE_SERVICES_PLIST,
    process.env.EXPO_PUBLIC_FIREBASE_IOS_PLIST,
    "./firebase/GoogleService-Info.plist",
  ]);
  const androidGoogleServicesFile = resolveFirstOptionalFile([
    process.env.GOOGLE_SERVICES_JSON,
    process.env.EXPO_PUBLIC_FIREBASE_ANDROID_JSON,
    "./firebase/google-services.json",
  ]);
  const shouldConfigureIosFirebase = buildPlatform !== "android" && Boolean(iosGoogleServicesFile);
  const shouldConfigureAndroidFirebase = buildPlatform !== "ios" && Boolean(androidGoogleServicesFile);

  expo.extra = {
    ...expo.extra,
    firebaseAnalyticsEnabled: shouldConfigureIosFirebase || shouldConfigureAndroidFirebase,
  };

  if (shouldConfigureIosFirebase) {
    expo.ios = {
      ...expo.ios,
      googleServicesFile: iosGoogleServicesFile,
    };
  }

  if (shouldConfigureAndroidFirebase) {
    expo.android = {
      ...expo.android,
      googleServicesFile: androidGoogleServicesFile,
    };
  }

  if (shouldConfigureIosFirebase || shouldConfigureAndroidFirebase) {
    expo.plugins = [...(expo.plugins || []), "@react-native-firebase/app"];
  }

  if (shouldConfigureIosFirebase) {
    expo.plugins = [...(expo.plugins || []), "./plugins/with-ios-firebase-on-device-conversion"];
  }

  return config;
};

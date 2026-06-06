const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const ON_DEVICE_CONVERSION_FLAG = "$RNFirebaseAnalyticsGoogleAppMeasurementOnDeviceConversion = true";

function withIosFirebaseOnDeviceConversion(config) {
  return withDangerousMod(config, [
    "ios",
    async (configWithMod) => {
      const podfilePath = path.join(configWithMod.modRequest.platformProjectRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) return configWithMod;

      const contents = fs.readFileSync(podfilePath, "utf8");
      if (contents.includes(ON_DEVICE_CONVERSION_FLAG)) return configWithMod;

      fs.writeFileSync(podfilePath, `${ON_DEVICE_CONVERSION_FLAG}\n${contents}`);
      return configWithMod;
    },
  ]);
}

module.exports = withIosFirebaseOnDeviceConversion;

const { withEntitlementsPlist } = require("expo/config-plugins");

function withTestflightNoIosPushEntitlement(config) {
  return withEntitlementsPlist(config, (configWithEntitlements) => {
    delete configWithEntitlements.modResults["aps-environment"];
    return configWithEntitlements;
  });
}

module.exports = withTestflightNoIosPushEntitlement;

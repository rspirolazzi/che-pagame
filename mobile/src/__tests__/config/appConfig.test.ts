import type { ConfigContext, ExpoConfig } from "expo/config";

import appConfig from "../../../app.config";

const { versionCodeFrom } = require("../../../plugins/versionCode");

const config: ExpoConfig = appConfig({ config: {} } as ConfigContext);

describe("app.config", () => {
  it("blocks the Android permissions the App does not use (feature 010)", () => {
    expect([...(config.android?.blockedPermissions ?? [])].sort()).toEqual([
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ]);
  });

  it("registers the release signing plugin", () => {
    expect(config.plugins).toContain("./plugins/withReleaseSigning");
  });

  it("derives the Android versionCode from the visible version", () => {
    expect(config.android?.versionCode).toBe(versionCodeFrom(config.version));
  });
});

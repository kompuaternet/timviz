import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "webkit-desktop",
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "iphone-se",
      use: { ...devices["iPhone SE"] }
    },
    {
      name: "iphone-12",
      use: { ...devices["iPhone 12"] }
    },
    {
      name: "iphone-14-pro-max",
      use: { ...devices["iPhone 14 Pro Max"] }
    },
    {
      name: "pixel-5",
      use: { ...devices["Pixel 5"] }
    },
    {
      name: "mobile-360",
      use: { ...devices["iPhone SE"], viewport: { width: 360, height: 740 } }
    },
    {
      name: "mobile-375",
      use: { ...devices["iPhone 12"], viewport: { width: 375, height: 812 } }
    },
    {
      name: "mobile-390",
      use: { ...devices["iPhone 12"], viewport: { width: 390, height: 844 } }
    },
    {
      name: "mobile-414",
      use: { ...devices["iPhone 12"], viewport: { width: 414, height: 896 } }
    },
    {
      name: "mobile-430",
      use: { ...devices["iPhone 14 Pro Max"], viewport: { width: 430, height: 932 } }
    }
  ]
});

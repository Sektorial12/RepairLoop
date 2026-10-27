import { defineConfig, devices } from "@playwright/test";

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromiumLaunch = localChromium
  ? {
      launchOptions: {
        executablePath: localChromium,
        args: ["--no-sandbox", "--disable-dev-shm-usage"]
      }
    }
  : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...chromiumLaunch } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], ...chromiumLaunch } },
    ...(process.env.CI || process.env.PLAYWRIGHT_WEBKIT === "1"
      ? [{ name: "mobile-webkit", use: { ...devices["iPhone 13"] } }]
      : [])
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL:
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000"
    }
  }
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    actionTimeout: 10_000,
  },
  webServer: {
    command: "npm run dev -- --webpack",
    port: 3000,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        browserName: "chromium",
        isMobile: true,
      },
    },
  ],
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:8787", ...devices["Pixel 7"], browserName: "chromium" },
  webServer: {
    command: "npx wrangler d1 migrations apply peta-syariah-db --local && npx wrangler dev --local --port 8787 --ip 127.0.0.1",
    url: "http://127.0.0.1:8787/api/config",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

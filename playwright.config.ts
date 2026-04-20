import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./artifacts/mahalle/e2e",
  use: {
    baseURL: "http://localhost:8081",
  },
  webServer: {
    command: "pnpm --filter @workspace/mahalle run web",
    port: 8081,
    reuseExistingServer: true,
  },
});

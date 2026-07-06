import { defineConfig } from "@playwright/test";

/**
 * QA DEF-02 fix: @playwright/test was missing from devDependencies, so tests/e2e/*.spec.ts
 * could not even compile. This is a minimal config - DevOps/QA should extend it (webServer
 * auto-start, browser matrix, CI reporters) once a full Docker/MySQL environment is available
 * (see defects.md ENV-01). Not runnable in this sandbox (no DB, no browser binaries installed -
 * `npx playwright install` still needs to be run once network/disk allows).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173"
  }
});

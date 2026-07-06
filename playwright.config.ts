import { defineConfig } from "@playwright/test";

/**
 * QA DEF-02 fix: @playwright/test was missing from devDependencies, so tests/e2e/*.spec.ts
 * could not even compile. This is a minimal config - DevOps/QA should extend it (webServer
 * auto-start, browser matrix, CI reporters) once a full Docker/MySQL environment is available
 * (see defects.md ENV-01). Not runnable in this sandbox (no DB, no browser binaries installed -
 * `npx playwright install` still needs to be run once network/disk allows).
 *
 * Engineer fix (defect-fix-3, QA verify-3 OPEN-1/OPEN-2 investigation): several
 * tests/e2e/realtimeStock.spec.ts assertions intentionally use
 * `expect(...).toContainText(..., { timeout: 60000 })` / `toHaveCount(0, { timeout: 60000 })`
 * because ECP-007 AC1 / ECP-028 AC2 explicitly allow up to 60s for an update to become visible
 * (socket push is near-instant; the documented worst case is the 30s polling fallback, which
 * needs up to ~60s of wall-clock room to be observed reliably). The GLOBAL test `timeout` here
 * was only 30_000ms, i.e. shorter than the per-assertion timeout the specs ask for - Playwright
 * kills the whole test at the 30s test-level timeout regardless of the assertion's own 60s
 * budget. This is a config bug, not a frontend/backend bug: raise the global timeout so a
 * 60s-budget assertion actually gets to run to completion (with headroom for page navigation,
 * login, etc. around it).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173"
  }
});

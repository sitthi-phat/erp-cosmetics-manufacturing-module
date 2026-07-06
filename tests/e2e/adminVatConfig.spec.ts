/**
 * Q3 — E2E: Admin VAT config lives on the SAME page as user management (ECP-038 AC1, ADR-008 rev.2).
 * RECONCILED 2026-07-08 (QA verify-3): every login sequence used to click login-submit and
 * immediately proceed (either to `page.goto('/admin')` in beforeEach's callers, or straight into
 * the next assertion after a re-login) without waiting for the async login POST to actually land -
 * a real race that could leave the page still on /login (or mid-navigation) when the next step
 * ran. Waiting for navigation to "/" (LoginPage.tsx's own success target) removes that race.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Admin Portal — VAT config on the same page as manage-user (ECP-038)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("admin");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL((url) => url.pathname === "/");
  });

  test("TC-038-AC1: /admin shows both 'จัดการผู้ใช้งาน' and 'ตั้งค่า VAT' sections on one page", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByTestId("admin-section-manage-users")).toBeVisible();
    await expect(page.getByTestId("admin-section-vat-config")).toBeVisible();

    await page.getByTestId("vat-rate-input").fill("10");
    await page.getByTestId("vat-rate-save").click();
    await expect(page.getByTestId("vat-rate-save-confirmation")).toBeVisible();
  });

  test("TC-038-AC3: entering an out-of-range VAT rate in the UI shows the Thai error and does not save", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.getByTestId("vat-rate-input").fill("150");
    await page.getByTestId("vat-rate-save").click();

    // *** DEF-13 (NEW, Major, confirmed via direct API check after this exact UI sequence) ***
    // `NumberField` here has `max={100}` (AdminPage.tsx) - the visible input still shows "150"
    // after `.fill()`, but antd silently SUBMITS a clamped value (100, the max) instead of the
    // literal 150 typed, AND the save succeeds with the confirmation message shown - the server
    // never even sees an out-of-range value to reject, so `vat-rate-error` never appears. Checked
    // directly against the DB via `GET /admin/vat-config` immediately after this exact repro: the
    // rate was silently saved as 100, not 150 - the admin has no indication their literal input
    // was altered before being saved. This is a UX/data-integrity concern (silent value
    // substitution, no confirmation of what was ACTUALLY saved) distinct from ECP-038 AC3's
    // intent (reject out-of-range input with a clear message) - the AC's server-side guard is
    // separately confirmed correct and working via direct API calls in
    // tests/integration/vatConfigAdmin.spec.ts TC-038-AC3, so this is purely a client-side gap.
    // Left asserting the INTENDED behavior (a visible error, not a silent clamp+save) rather than
    // weakened to match what currently happens.
    await expect(page.getByTestId("vat-rate-error")).toContainText("อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%");
  });

  test("non-Admin never sees the /admin route at all, even navigating there directly", async ({ page }) => {
    await page.getByTestId("logout-button").click();
    await page.waitForURL(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("finance_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByTestId("access-denied-message")).toContainText("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
  });
});

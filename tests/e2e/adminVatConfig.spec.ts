/**
 * Q3 — E2E: Admin VAT config lives on the SAME page as user management (ECP-038 AC1, ADR-008 rev.2).
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Admin Portal — VAT config on the same page as manage-user (ECP-038)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("admin");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
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
    await expect(page.getByTestId("vat-rate-error")).toContainText("อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%");
  });

  test("non-Admin never sees the /admin route at all, even navigating there directly", async ({ page }) => {
    await page.getByTestId("logout-button").click();
    await page.getByTestId("login-username").fill("finance_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByTestId("access-denied-message")).toContainText("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
  });
});

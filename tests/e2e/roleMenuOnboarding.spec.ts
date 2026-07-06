/**
 * Q3 — E2E: role-based menu + onboarding (ECP-034).
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Role-based menu and onboarding (ECP-034)", () => {
  test("TC-034-AC1: production role sees only production-relevant menu items, never invoice/permission menus", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("production_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("nav-production-queue")).toBeVisible();
    await expect(page.getByTestId("nav-traceability")).toBeVisible();
    await expect(page.getByTestId("nav-invoice-list")).toHaveCount(0);
    await expect(page.getByTestId("nav-manage-permissions")).toHaveCount(0);
  });

  test("TC-034-AC2: first-ever login shows at least one onboarding tooltip without opening a separate manual", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("brand_new_user_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("onboarding-tooltip")).toBeVisible();
  });

  test("TC-034-AC3: a user whose role has no configured menu sees a clear 'contact Admin' message, not a blank home page", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("role_with_no_menu_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("no-menu-message")).toContainText("ยังไม่มีเมนูที่กำหนดให้บทบาทนี้ กรุณาติดต่อ Admin");
  });
});

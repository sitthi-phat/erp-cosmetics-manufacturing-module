/**
 * Q3 — E2E: invoice revision -> v2 timeline demo (ECP-037, architecture.md §5.4, seed §8
 * "1 demo set showing revise invoice -> v2 + payment carry-over").
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Invoice revision timeline demo (ECP-037)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("finance_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
  });

  test("TC-037-AC1/AC2: revising the seeded demo invoice creates v2 and the timeline shows both versions", async ({ page }) => {
    await page.getByTestId("nav-invoice-list").click();
    await page.getByTestId("demo-invoice-row").click();
    await page.getByTestId("revise-invoice-button").click();
    await page.getByTestId("revise-line-qty-0").fill("90");
    await page.getByTestId("revise-submit").click();

    await expect(page.getByTestId("invoice-version-badge")).toHaveText(/v2|version 2/i);

    await page.getByTestId("view-version-history").click();
    const versionRows = page.getByTestId("invoice-version-row");
    await expect(versionRows).toHaveCount(2);
    await expect(versionRows.nth(0)).toContainText(/Superseded|ถูกแทนที่/i);
    // original v1 data must still be viewable, not blanked out
    await versionRows.nth(0).click();
    await expect(page.getByTestId("invoice-detail-subtotal")).toBeVisible();
  });

  test("TC-037-AC3: opening the superseded (v1) invoice via a stale/cached link shows a block + link to latest", async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/SEEDED_INVOICE_V1_SUPERSEDED/edit`);
    await expect(page.getByTestId("invoice-blocked-message")).toContainText(/ถูกแทนที่ด้วย version ใหม่กว่าแล้ว/);
    await expect(page.getByTestId("link-to-latest-version")).toBeVisible();
  });

  test("TC-037-AC4: removing all lines from the revise form blocks submission with a clear message", async ({ page }) => {
    await page.getByTestId("nav-invoice-list").click();
    await page.getByTestId("demo-invoice-row").click();
    await page.getByTestId("revise-invoice-button").click();
    await page.getByTestId("remove-line-0").click(); // remove the only line
    await page.getByTestId("revise-submit").click();
    await expect(page.getByTestId("form-error")).toContainText(/อย่างน้อย 1 รายการ/);
  });

  test("§5.5: revising an invoice with existing payments shows a reconciliation warning before submit", async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/SEEDED_INVOICE_PARTIALLY_PAID/revise`);
    await expect(page.getByTestId("payment-reconciliation-warning")).toContainText(/รับชำระแล้ว/);
  });
});

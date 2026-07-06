/**
 * Q3 — E2E: full demo flow, end-to-end, no external escape hatch
 * (brief.md DoD #1, ECP-004->009->010->011->012->013->015->018->020->021).
 * Framework: Playwright (see test-plan.md §0). Assumes the frontend runs at BASE_URL
 * (default http://localhost:5173 per Vite) and the backend/API at API_BASE_URL.
 * Login page route and selectors are best-guesses aligned with architecture.md's page list
 * (`src/frontend/pages/`) — adjust selectors once Engineer's actual markup/test-ids exist.
 * Prefer `data-testid` attributes; Engineer should add them per common component (see §7 note).
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

async function login(page: import("@playwright/test").Page, username: string, password = "Password123!") {
  await page.goto(`${BASE_URL}/login`);
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(/\/(home|dashboard)/);
}

test.describe("Full order-to-cash demo flow (brief.md DoD #1)", () => {
  test("Sales -> stock check -> production -> QC -> shipping -> invoice, all inside one system, no external escape", async ({ page }) => {
    // 1. Sales creates and confirms a PO (ECP-004)
    await login(page, "sales_demo");
    await page.getByTestId("nav-po-create").click();
    await page.getByTestId("po-customer-search").fill("บริษัท ABC");
    await page.getByTestId("po-customer-result-0").click();
    await page.getByTestId("po-add-line").click();
    await page.getByTestId("po-line-product-0").selectOption({ label: "PRODUCT_WITH_BOM" });
    await page.getByTestId("po-line-qty-0").fill("100");
    await page.getByTestId("po-confirm-button").click();
    await expect(page.getByTestId("po-stock-sufficient-banner")).toBeVisible();
    await expect(page.getByTestId("po-status-badge")).toHaveText(/Confirmed/i);
    const poNumber = await page.getByTestId("po-number").innerText();

    // 2. Production assigns and produces (ECP-011/012/013) — switch user
    await page.getByTestId("logout-button").click();
    await login(page, "production_demo");
    await page.getByTestId("nav-production-queue").click();
    await page.getByTestId(`queue-row-${poNumber}`).getByTestId("assign-button").click();
    await page.getByTestId("assign-worker-select").selectOption({ label: "somchai" });
    await page.getByTestId("assign-confirm").click();
    await page.getByTestId("produce-button").click();
    await page.getByTestId("produce-lot-select-0").selectOption({ index: 0 });
    await page.getByTestId("produce-lot-qty-0").fill("50");
    await page.getByTestId("produce-output-qty").fill("500");
    await page.getByTestId("produce-submit").click();
    await expect(page.getByTestId("batch-number")).toBeVisible();
    const batchNumber = await page.getByTestId("batch-number").innerText();

    // 3. QA approves the batch (ECP-015)
    await page.getByTestId("logout-button").click();
    await login(page, "qc_demo");
    await page.getByTestId("nav-qc-batches").click();
    await page.getByTestId(`batch-row-${batchNumber}`).getByTestId("inspect-button").click();
    await page.getByTestId("qc-result-approved").check();
    await page.getByTestId("qc-remarks").fill("ผ่านมาตรฐาน");
    await page.getByTestId("qc-submit").click();
    await expect(page.getByTestId(`batch-row-${batchNumber}`).getByTestId("status-badge")).toHaveText(/QC Approved/i);

    // 4. Logistics ships (ECP-018)
    await page.getByTestId("logout-button").click();
    await login(page, "logistics_demo");
    await page.getByTestId("nav-shipping-create").click();
    await page.getByTestId(`selectable-batch-${batchNumber}`).click();
    await page.getByTestId("shipment-date").fill(new Date().toISOString().slice(0, 10));
    await page.getByTestId("shipment-submit").click();
    await expect(page.getByTestId("shipment-status-badge")).toHaveText(/Shipped/i);

    // 5. Finance issues invoice with VAT and records payment (ECP-020/021)
    await page.getByTestId("logout-button").click();
    await login(page, "finance_demo");
    await page.getByTestId("nav-invoice-list").click();
    await page.getByTestId(`po-${poNumber}-issue-invoice`).click();
    await expect(page.getByTestId("invoice-vat-amount")).toContainText("3,500.00");
    await expect(page.getByTestId("invoice-total-amount")).toContainText("53,500.00");
    await page.getByTestId("record-payment-button").click();
    await page.getByTestId("payment-amount").fill("53500");
    await page.getByTestId("payment-date").fill(new Date().toISOString().slice(0, 10));
    await page.getByTestId("payment-submit").click();
    await expect(page.getByTestId("invoice-status-badge")).toHaveText(/Paid/i);

    // 6. Back to Sales — full timeline visible in one page (ECP-006 AC1), no dead ends
    await page.getByTestId("logout-button").click();
    await login(page, "sales_demo");
    await page.getByTestId("nav-po-list").click();
    await page.getByTestId(`po-${poNumber}-view`).click();
    const timelineSteps = page.getByTestId("po-timeline-step");
    await expect(timelineSteps).toHaveCount(5);
    for (const label of ["Confirmed", "InProduction", "QC Approved", "Shipped", "Invoiced"]) {
      await expect(page.getByTestId("po-timeline")).toContainText(label);
    }
  });
});

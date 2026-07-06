/**
 * Q3 — E2E: full demo flow, end-to-end, no external escape hatch
 * (brief.md DoD #1, ECP-004->009->010->011->012->013->015->018->020->021).
 * Framework: Playwright (see test-plan.md §0). Assumes the frontend runs at BASE_URL
 * (default http://localhost:5173 per Vite) and the backend/API at API_BASE_URL.
 *
 * RECONCILED 2026-07-07 (QA re-verify, DEF-03): updated against Engineer's real markup + the 4
 * flow divergences Engineer documented when adding testids:
 *   (a) PO create is 2 separate pages (PoListPage "+ create" -> PoCreatePage creates a Draft ->
 *       navigate to PoDetailPage where a *separate* "ยืนยัน PO" button does the actual confirm),
 *       not a single page that creates+confirms in one step.
 *   (b) The customer/product/worker/material pickers are Ant Design `<Select>` components (a
 *       custom div-based combobox, NOT a native HTML `<select>`) - Playwright's `.selectOption()`
 *       only works on native `<select>` elements, so every one of these needs "click the control
 *       to open the popup, then click the option by its visible text" instead. Engineer's own
 *       inline comment describes the customer picker as "searchable"; the actual `SelectField`
 *       component (src/frontend/ui/Form.tsx) does not set antd's `showSearch`, so it does NOT
 *       type-to-filter today - noted as MIN-04 in defects.md, worked around here by opening the
 *       dropdown and clicking the option directly instead of typing+filtering.
 *   (c) The QC result control is a single `<Select>` dropdown (Approved/Rejected options), not
 *       two separate radio-style controls to `.check()`.
 *   (d) Login navigates to `/` (exact), not `/home` or `/dashboard`.
 * Also fixed: `po-number` is rendered in a `display:none` div - Playwright's `innerText()`
 * respects visibility and returns "" for hidden elements, so `.textContent()` is used there
 * instead. NOT executed in this sandbox (no Docker/MySQL, no `npx playwright install` browsers
 * yet - see defects.md ENV-01/ENV-02); `npx playwright test --list` does confirm this file
 * compiles and collects correctly against the real `@playwright/test` package.
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

async function login(page: Page, username: string, password = "Password123!") {
  await page.goto(`${BASE_URL}/login`);
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  // (d) LoginPage.tsx navigates to "/" on success, not /home or /dashboard.
  await page.waitForURL((url) => url.pathname === "/");
}

/** (b) antd `<Select>` is a custom combobox, not a native <select> - open then pick by text. */
async function selectAntdOption(page: Page, testId: string, optionText: string) {
  await page.getByTestId(testId).click();
  await page.getByRole("option", { name: optionText, exact: false }).click();
}

test.describe("Full order-to-cash demo flow (brief.md DoD #1)", () => {
  test("Sales -> stock check -> production -> QC -> shipping -> invoice, all inside one system, no external escape", async ({ page }) => {
    // 1. Sales creates a PO as Draft, then confirms it on a SEPARATE detail page (ECP-004).
    await login(page, "sales_demo");
    await page.getByTestId("nav-po-list").click();
    await page.getByTestId("nav-po-create").click(); // "+ create" button on PoListPage -> /pos/new

    await selectAntdOption(page, "po-customer-search", "บริษัท ABC");
    await page.getByTestId("requestedDeliveryDate").fill(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    // Add one order line via the separate "เพิ่มรายการสินค้า" mini-form BEFORE submitting create -
    // both are independent antd <Form> instances, so filling this one does not submit the outer one.
    await selectAntdOption(page, "po-line-product-0", "PRODUCT_WITH_BOM");
    await page.getByTestId("po-line-qty-0").fill("100");
    await page.getByTestId("unitPrice").fill("500"); // NumberField without an explicit testId defaults to its field name
    await page.getByTestId("po-add-line").click();
    await page.getByTestId("po-create-submit").click();
    await page.waitForURL(/\/pos\/\d+/); // PoCreatePage navigates to PoDetailPage on success

    const poNumber = await page.getByTestId("po-number").textContent(); // hidden element - use textContent(), not innerText()

    // (a) Confirm happens on THIS page (PoDetailPage), as a separate action from creation.
    await page.getByTestId("po-confirm-button").click();
    await expect(page.getByTestId("po-status-badge")).toHaveText(/Confirmed/i);

    // 2. Production assigns and produces (ECP-011/012/013) — switch user
    await page.getByTestId("logout-button").click();
    await login(page, "production_demo");
    await page.getByTestId("nav-production-queue").click();
    await page.getByTestId(`queue-row-${poNumber}`).getByTestId("assign-button").click();
    await selectAntdOption(page, "assign-worker-select", "somchai");
    await page.getByTestId("assign-confirm").click();
    // No per-PO testid exists on the "assigned, awaiting produce" table (ProductionPage.tsx does
    // not pass getRowTestId there) - best-effort: click the first (only, in a fresh demo run) row.
    await page.getByTestId("produce-button").first().click();
    await selectAntdOption(page, "produce-lot-select-0", "RAW_MATERIAL_FOR_PRODUCT_WITH_BOM");
    await page.getByTestId("lotId").fill("1");
    await page.getByTestId("produce-lot-qty-0").fill("50");
    // NOTE: the "+ เพิ่ม Lot" button has no explicit testId, so it defaults to the SHARED
    // "form-submit" id (SubmitButton's default) - scope by the currently-open modal to avoid
    // matching an unrelated submit button elsewhere on the page.
    await page.getByRole("dialog").getByTestId("form-submit").click();
    await page.getByTestId("produce-output-qty").fill("500");
    await page.getByTestId("produce-submit").click();
    await expect(page.getByTestId("batch-number")).toBeVisible();
    const batchNumber = await page.getByTestId("batch-number").innerText();

    // 3. QA approves the batch (ECP-015)
    await page.getByTestId("logout-button").click();
    await login(page, "qc_demo");
    await page.getByTestId("nav-qc-batches").click();
    await page.getByTestId(`batch-row-${batchNumber}`).getByTestId("inspect-button").click();
    // (c) QC result is a single dropdown (Approved/Rejected), not two separate radios to .check().
    await selectAntdOption(page, "qc-result-approved", "ผ่าน (Approved)");
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

    // 5. Finance issues invoice with VAT (derived from ALL of the PO's lines, DEF-05) and records payment (ECP-020/021)
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

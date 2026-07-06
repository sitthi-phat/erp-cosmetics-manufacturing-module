/**
 * Q10 — E2E: regression guard for pond's 5 reported Gate 2 defects (A-E) + a BOM management
 * smoke flow, per tasks.md Q10 and pond-gate2-feedback.md.
 *
 * RECONCILED (QA gate2-verify): every testid below was guessed before Engineer's real code
 * existed (parallel-phase policy) - all 6 tests originally failed on testid mismatches alone,
 * per Engineer's mapping table. Corrected against the real markup (read directly from
 * PoCreatePage.tsx, StockPage.tsx, TracePage.tsx, ProductionPage.tsx, InvoicesPage.tsx/
 * InvoiceDetailPage.tsx/InvoiceDocument.tsx, BomManagementPage.tsx, useMenu.ts):
 *   nav-trace -> nav-traceability, nav-bom-management -> nav-bom, nav-customer-list ->
 *   nav-customers (unused in this file), stock-search -> stock-search-input,
 *   stock-clear-search -> stock-search-clear, stock-empty-state -> stock-search-empty,
 *   stock-table -> stock-page-card (DataTable has no wrapper testid of its own),
 *   material-plan-panel -> material-plan-card (this one guess was actually already correct),
 *   confirm-proposed-lots -> accept-material-plan, invoice-row-0 -> per-row
 *   `demo-invoice-row-${invoiceNo}` (dynamic, not index-based) + a separate `view-invoice-detail`
 *   button inside that row (not the row itself), trace-search-box -> trace-search-input,
 *   trace-search-submit -> trace-search-button, trace-result-chain -> per-lot
 *   `trace-result-${lotNumber}` (dynamic). Also: "ครีมกันแดด SPF50" does not exist in the seed -
 *   real product names are ครีมบำรุงผิวหน้า 50ml / เซรั่มวิตามินซี 30ml / โลชั่นบำรุงผิวกาย 200ml /
 *   สบู่เหลวอาบน้ำ 250ml / ลิปมันบำรุงริมฝีปาก (the only one seeded with NO BOM, per prisma/seed.ts).
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:4000";

async function login(page: Page, username: string, password = "Password123!") {
  await page.goto(`${BASE_URL}/login`);
  // RECONCILED (QA gate2-verify): HomePage.tsx's first-login onboarding Tour (ECP-034 AC2) is
  // tracked via a LOCALSTORAGE flag (`erp_onboarding_seen`, not server-side per-user), so every
  // fresh Playwright context sees it as a first-ever login - its footer buttons can end up
  // positioned over nav items and intercept clicks (observed directly in a real run against
  // responsiveGate2.spec.ts's `nav-po-create`/`nav-stock`). Pre-seed the flag so it never opens
  // in these regression-guard tests, which aren't testing onboarding itself.
  await page.evaluate(() => localStorage.setItem("erp_onboarding_seen", "1"));
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => url.pathname === "/");
}

async function selectAntdOption(page: Page, testId: string, optionText: string) {
  await page.getByTestId(testId).click();
  await page.locator(".ant-select-item-option", { hasText: optionText }).first().click();
}

test.describe("Gate 2 regression guard — pond's 5 defects (A-E)", () => {
  test("(A, ECP-004 AC1/AC2) PO line shows real product name/qty/price/line-total, never 'Product #<id> x <qty> @ <price>', and a line can be deleted before confirm", async ({ page }) => {
    await login(page, "sales_demo");
    await page.getByTestId("nav-po-list").click();
    await page.getByTestId("nav-po-create").click();
    await selectAntdOption(page, "po-customer-search", "บริษัท ABC");
    await page.getByTestId("requestedDeliveryDate").fill(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    await page.keyboard.press("Escape");

    // Add TWO lines so the delete test (AC2) has something left over to verify afterwards.
    await selectAntdOption(page, "po-line-product-0", "ครีมบำรุงผิวหน้า 50ml");
    await page.getByTestId("po-line-qty-0").fill("100");
    await page.getByTestId("unitPrice").fill("150");
    await page.getByTestId("po-add-line").click();

    await selectAntdOption(page, "po-line-product-0", "เซรั่มวิตามินซี 30ml");
    await page.getByTestId("po-line-qty-0").fill("10");
    await page.getByTestId("unitPrice").fill("300");
    await page.getByTestId("po-add-line").click();

    // AC1: the rendered lines table must show real, readable text - and MUST NEVER show the raw
    // regression pattern pond explicitly complained about (regardless of exact wording elsewhere).
    const linesTable = page.getByTestId("po-draft-lines-table");
    await expect(linesTable).toContainText("ครีมบำรุงผิวหน้า 50ml");
    await expect(linesTable).toContainText("100");
    await expect(linesTable).toContainText("150.00");
    // RECONCILED (QA gate2-verify): PoCreatePage.tsx renders line totals via plain
    // `(quantity * unitPrice).toFixed(2)` - no thousands-separator comma grouping (same
    // no-toLocaleString convention already confirmed elsewhere in this app, e.g. invoice VAT/total
    // display) - "15000.00", not "15,000.00".
    await expect(linesTable).toContainText("15000.00"); // line total = 100 x 150
    const wholeTableText = await linesTable.innerText();
    expect(wholeTableText).not.toMatch(/Product\s*#\d+\s*x\s*\d+(\.\d+)?\s*@\s*\d+(\.\d+)?/i);
    expect(wholeTableText).not.toMatch(/#\d+/); // no raw internal id anywhere in this table

    // AC2: delete the FIRST line before confirming; only the 2nd (เซรั่มวิตามินซี) line should remain.
    await page.getByTestId("po-draft-line-remove-0").click();
    await expect(linesTable).not.toContainText("ครีมบำรุงผิวหน้า 50ml");
    await expect(linesTable).toContainText("เซรั่มวิตามินซี 30ml");

    await page.getByTestId("po-create-submit").click();
    await page.waitForURL(/\/pos\/\d+/);
    // Confirming must succeed using only the REMAINING line - no ghost of the deleted line.
    await page.getByTestId("po-confirm-button").click();
    await expect(page.getByTestId("po-status-badge")).toHaveText(/Confirmed/i);
  });

  test("(B, ECP-007 AC4/AC5) stock page search filters by name/code case-insensitively within 2s, and shows a clear empty-state with a clear-search button on no match", async ({ page }) => {
    await login(page, "warehouse_demo");
    await page.getByTestId("nav-stock").click();

    const start = Date.now();
    await page.getByTestId("stock-search-input").fill("มะพร้าว");
    await expect(page.getByTestId("stock-page-card")).toContainText("น้ำมันมะพร้าว");
    expect(Date.now() - start).toBeLessThan(2000); // ECP-007 AC4 / NFR #5 ceiling
    // A material name that does NOT contain "มะพร้าว" must be filtered out.
    await expect(page.getByTestId("stock-page-card")).not.toContainText("แอลกอฮอล์");

    await page.getByTestId("stock-search-input").fill("XYZ999NOMATCH");
    await expect(page.getByTestId("stock-search-empty")).toBeVisible();
    await expect(page.getByTestId("stock-search-empty")).toContainText("ไม่พบวัตถุดิบที่ตรงกับคำค้นหา");
    await page.getByTestId("stock-search-clear").click();
    await expect(page.getByTestId("stock-page-card")).toContainText("น้ำมันมะพร้าว");
  });

  test("(C, ECP-014 AC1/AC2/AC3) trace search for L-SEED-1 succeeds (regression guard for the exact defect pond hit), and the Lot-vs-Batch legend is always visible", async ({ page }) => {
    await login(page, "warehouse_demo");
    await page.getByTestId("nav-traceability").click();

    await page.getByTestId("trace-search-input").fill("L-SEED-1");
    await page.getByTestId("trace-search-button").click();
    // Must NOT show a not-found error - this is the exact scenario pond reported failing.
    await expect(page.getByTestId("trace-not-found")).not.toBeVisible();
    await expect(page.getByTestId("trace-result-L-SEED-1")).toBeVisible();

    // AC3: legend explaining Lot vs Batch must always be visible alongside any result.
    await expect(page.getByTestId("trace-legend")).toBeVisible();
    await expect(page.getByTestId("trace-legend-lot")).toContainText("ล็อตวัตถุดิบ");
    await expect(page.getByTestId("trace-legend-batch")).toContainText("รอบการผลิต");
  });

  test("(D, ECP-013 AC1/AC2) production page shows an auto-calculated material plan on open, and accepting the system-proposed lot(s) produces successfully with no manual lot-id typing", async ({ page }) => {
    // Ensure there's a real Assigned production order with usable stock before opening the modal,
    // via an isolated side-effect context (same pattern demoFlow.spec.ts uses) - this test focuses
    // on the production screen's own auto-calc + accept UX, not re-deriving the whole PO->assign
    // chain through the UI again (already covered end-to-end by demoFlow.spec.ts).
    const setup = await page.context().browser()!.newContext();
    await setup.request.post(`${API_BASE_URL}/api/v1/auth/login`, { data: { username: "sales_demo", password: "Password123!" } });
    const customers = await (await setup.request.get(`${API_BASE_URL}/api/v1/customers`, { params: { q: "ABC" } })).json();
    const products = await (await setup.request.get(`${API_BASE_URL}/api/v1/products`)).json();
    const product = products.data.find((p: any) => p.hasBom);
    const draftRes = await setup.request.post(`${API_BASE_URL}/api/v1/pos`, {
      data: {
        customerId: customers.data[0].id,
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        lines: [{ productId: product.id, quantity: 1, unitPrice: 100, uom: "unit" }],
      },
    });
    const draft = await draftRes.json();
    await setup.request.post(`${API_BASE_URL}/api/v1/pos/${draft.data.id}/confirm`);

    await setup.request.post(`${API_BASE_URL}/api/v1/auth/login`, { data: { username: "production_demo", password: "Password123!" } });
    const me = await (await setup.request.get(`${API_BASE_URL}/api/v1/auth/me`)).json();
    await setup.request.post(`${API_BASE_URL}/api/v1/production/${draft.data.lines[0].id}/assign`, { data: { assignedTo: me.data.id } });

    const bom = await (await setup.request.get(`${API_BASE_URL}/api/v1/products/${product.id}/bom`)).json();
    const materialId = bom.data.lines[0].materialId;
    await setup.request.post(`${API_BASE_URL}/api/v1/auth/login`, { data: { username: "warehouse_demo", password: "Password123!" } });
    const receiptRes = await setup.request.post(`${API_BASE_URL}/api/v1/stock/receipts`, {
      data: { materialId, quantity: 100000, lotNumber: `E2E-GATE2-GUARD-${Date.now()}` },
    });
    // RECONCILED (QA gate2-verify): the receipt response ITSELF already returns the new lotId -
    // no need for a separate /stock/transactions re-query (which failed as QC, since that
    // endpoint needs `stock.view`/warehouse-side permission QC doesn't hold - "Cannot read
    // properties of undefined (reading 'length')" on a 403 body with no `.data` field).
    const receipt = await receiptRes.json();
    await setup.request.post(`${API_BASE_URL}/api/v1/auth/login`, { data: { username: "qc_demo", password: "Password123!" } });
    await setup.request.post(`${API_BASE_URL}/api/v1/qc/lots/${receipt.data.lotId}/inspect`, { data: { result: "Passed" } });
    await setup.close();

    await login(page, "production_demo");
    await page.getByTestId("nav-production-queue").click();
    await page.getByTestId("produce-button").first().click();

    // AC1: the material plan panel/table must show numbers ALREADY computed, not blank inputs to fill.
    await expect(page.getByTestId("material-plan-card")).toBeVisible();
    await expect(page.getByTestId("material-plan-table")).toBeVisible();

    // AC2 (regression guard for defect D exactly): confirming the SYSTEM'S proposed lot must work,
    // with NO free-text lot-id field to type into anywhere on this screen.
    await expect(page.getByTestId("lotId")).toHaveCount(0); // the old raw NumberField must be gone
    await page.getByTestId("accept-material-plan").click();
    await page.getByTestId("produce-output-qty").fill("1");
    await page.getByTestId("produce-submit").click();
    await expect(page.getByTestId("batch-number")).toBeVisible();
  });

  test("(E, ECP-040/042) invoice detail opens from the list, and the print view renders every required section", async ({ page }) => {
    await login(page, "finance_demo");
    await page.getByTestId("nav-invoice-list").click();
    // demo-invoice-row-<invoiceNo> is per-row (dynamic), not a fixed index - take whichever row
    // exists first (list is non-empty on the shared seed/demo dev DB), and click the dedicated
    // "view detail" button inside it, not the row itself (regression guard: this used to be
    // un-openable at all - ECP-040's whole root cause).
    const firstRow = page.locator('[data-testid^="demo-invoice-row-"]').first();
    await expect(firstRow).toBeVisible();
    await firstRow.getByTestId("view-invoice-detail").click();
    await expect(page.getByTestId("invoice-detail-card")).toBeVisible();

    await page.getByTestId("invoice-detail-print-link").click();
    await page.waitForURL(/\/invoices\/\d+\/print/);
    const printView = page.getByTestId("invoice-document");
    await expect(printView).toBeVisible();
    await expect(printView).toContainText("ใบแจ้งหนี้");
    await expect(printView).toContainText("ใบกำกับภาษี");
    await expect(page.getByTestId("invoice-document-vat")).toBeVisible();
    // No dedicated testid on the signature blocks (InvoiceDocument.tsx renders them as plain text
    // inside `.signature-row`/`.signature-box`) - assert on the exact Thai labels instead.
    await expect(printView).toContainText("ผู้รับใบแจ้งหนี้");
    await expect(printView).toContainText("ผู้ออกใบแจ้งหนี้");
  });

  test("BOM Management smoke flow (ECP-039): a newly created BOM is immediately usable (E26 -> E27 integration)", async ({ page }) => {
    await login(page, "production_demo");
    await page.getByTestId("nav-bom").click();
    // "ลิปมันบำรุงริมฝีปาก" is the ONE seeded product intentionally left without a BOM
    // (prisma/seed.ts) - the "สร้าง BOM ใหม่" form only ever lists products without one already.
    await selectAntdOption(page, "bom-create-product", "ลิปมันบำรุงริมฝีปาก");
    await selectAntdOption(page, "bom-create-material", "น้ำมันมะพร้าว");
    await page.getByTestId("bom-create-qty").fill("2");
    await page.getByTestId("bom-create-submit").click();
    // Confirmed via the management table now listing it - the create form clears/re-renders once
    // `useBoms()` refetches, so re-query the list rather than relying on a transient toast.
    await expect(page.getByTestId("bom-management-card")).toContainText("ลิปมันบำรุงริมฝีปาก");
  });
});

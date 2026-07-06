/**
 * Q3 — E2E: invoice revision -> new version timeline demo (ECP-037, architecture.md §5.4).
 *
 * RECONCILED 2026-07-08 (QA verify-3, DEF-08-family fixes): the real `InvoicesPage.tsx` has NO
 * per-invoice route at all (no `/invoices/:id/edit`, no `/invoices/:id/revise` - both were guessed
 * placeholders). Everything happens on the single `/invoices` list page: each row has its own
 * "revise (revise-invoice-button)" / "ดู versions (view-version-history)" / "รับชำระเงิน
 * (record-payment-button)" action buttons that open MODALS in place - there is no separate
 * per-invoice detail page/URL to navigate to. `demo-invoice-row` is also NOT a fixed testid - it
 * is dynamic per row (`demo-invoice-row-${invoiceNo}`, see InvoicesPage.tsx). Login also needs to
 * wait for navigation before proceeding (same race class as adminVatConfig.spec.ts).
 *
 * This file now builds its OWN deterministic invoice via the real API first (rather than relying
 * on the base seed's own pre-built v1->v2 demo chain, whose version number keeps advancing every
 * time this suite runs against the persistent dev DB) and only uses the browser for the actual
 * revise/version-history UI interactions.
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:4000";

async function login(page: Page, username: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill("Password123!");
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => url.pathname === "/");
}

/** Builds a fresh Shipped PO -> Invoice v1 through the real API (page.request shares no auth
 * across roles, so this logs in multiple supertest-less API calls per role via separate cookies
 * is unnecessary here - stock/production/qc/shipping/invoice actions are all done by roles that
 * the base seed's 7 demo accounts already cover; we just call the API directly per step). */
async function buildInvoicedPo(api: APIRequestContext) {
  async function loginAs(username: string) {
    const res = await api.post(`${API_BASE_URL}/api/v1/auth/login`, { data: { username, password: "Password123!" } });
    return res.headers()["set-cookie"];
  }
  // Playwright's APIRequestContext shares cookies automatically per BrowserContext, but since we
  // need several DIFFERENT role sessions concurrently, use isolated request contexts per role via
  // the same `api` (page.request) sequentially, storing/restoring nothing - simplest: just log in
  // as each role right before that role's own call (page.request persists the context's cookie
  // jar across calls, and logging in again as a different user overwrites the cookie for the next
  // calls, which is fine since each step is done sequentially, never concurrently, in this helper).
  await loginAs("sales_demo");
  const customers = await (await api.get(`${API_BASE_URL}/api/v1/customers`, { params: { q: "ABC" } })).json();
  const customerId = customers.data[0].id;
  const products = await (await api.get(`${API_BASE_URL}/api/v1/products`)).json();
  const product = products.data.find((p: any) => p.hasBom);
  const bom = await (await api.get(`${API_BASE_URL}/api/v1/products/${product.id}/bom`)).json();
  const materialId = bom.data.lines[0].materialId;

  const draftRes = await api.post(`${API_BASE_URL}/api/v1/pos`, {
    data: {
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId: product.id, quantity: 100, unitPrice: 500, uom: "unit" }],
    },
  });
  const draft = await draftRes.json();
  await api.post(`${API_BASE_URL}/api/v1/pos/${draft.data.id}/confirm`);

  await loginAs("production_demo");
  const me = await (await api.get(`${API_BASE_URL}/api/v1/auth/me`)).json();
  const assignedRes = await api.post(`${API_BASE_URL}/api/v1/production/${draft.data.lines[0].id}/assign`, {
    data: { assignedTo: me.data.id },
  });
  const assigned = await assignedRes.json();

  await loginAs("warehouse_demo");
  const receiptRes = await api.post(`${API_BASE_URL}/api/v1/stock/receipts`, {
    data: { materialId, quantity: 100000, lotNumber: `E2E-INVREV-${Date.now()}` },
  });
  const receipt = await receiptRes.json();

  await loginAs("qc_demo");
  await api.post(`${API_BASE_URL}/api/v1/qc/lots/${receipt.data.lotId}/inspect`, { data: { result: "Passed" } });

  await loginAs("production_demo"); // switch back - produce needs production.produce, not qc's permissions
  const producedRes = await api.post(`${API_BASE_URL}/api/v1/production/${assigned.data.id}/produce`, {
    data: { lotSelections: [{ materialId, lotId: receipt.data.lotId, qtyUsed: 1 }], producedQty: 100 },
  });
  const produced = await producedRes.json();

  await loginAs("qc_demo"); // switch back again - batch inspect needs qc.inspect_batch
  await api.post(`${API_BASE_URL}/api/v1/qc/batches/${produced.data.id}/inspect`, { data: { result: "Approved" } });

  await loginAs("logistics_demo");
  await api.post(`${API_BASE_URL}/api/v1/shipments`, {
    data: { batchId: produced.data.id, shippedDate: new Date().toISOString().slice(0, 10) },
  });

  await loginAs("finance_demo");
  const invoiceRes = await api.post(`${API_BASE_URL}/api/v1/pos/${draft.data.id}/invoice`, {
    data: { lines: [{ productId: product.id, description: "รายการสินค้า", quantity: 100, unitPrice: 500 }] },
  });
  const invoice = await invoiceRes.json();
  return { invoiceNo: invoice.data.invoiceNo as string };
}

test.describe("Invoice revision timeline demo (ECP-037)", () => {
  test("TC-037-AC1/AC2: revising an invoice creates a new version and the version-history modal shows both", async ({ page }) => {
    const { invoiceNo } = await buildInvoicedPo(page.request);
    await login(page, "finance_demo");
    await page.getByTestId("nav-invoice-list").click();

    const row = page.getByTestId(`demo-invoice-row-${invoiceNo}`);
    await row.getByTestId("revise-invoice-button").click();

    // DEF-12 [Major] — FIXED (verify-4). Was: `GET /api/v1/products` required `stock.view`, which
    // Finance (the only role with `invoice.revise`) never had, so this native <select> was always
    // empty. Engineer added a narrower `product.view` permission and granted it to Finance
    // (product.routes.ts now uses requirePermission("product","view") instead of "stock","view") -
    // confirmed via curl as finance_demo (200) and here via .selectOption() actually succeeding
    // (the dropdown itself IS now populated with real product names).
    const reviseModal = page.getByTestId("revise-invoice-modal");
    await page.locator('select[name="productId"]').selectOption({ index: 0 });
    // TextField without an explicit testId defaults to data-testid={name} (ui/Form.tsx).
    await page.getByTestId("description").fill("รายการที่แก้ไข");
    await page.getByTestId("revise-line-qty-0").fill("90");
    // NumberField without an explicit testId defaults to data-testid={name} (ui/Form.tsx) - antd's
    // InputNumber never renders a plain `name` HTML attribute, so `input[name="unitPrice"]` never
    // matched anything; `getByTestId("unitPrice")` is the correct, stable locator.
    await page.getByTestId("unitPrice").fill("500");
    // This mini-form's own "+ เพิ่มรายการ" button has no explicit testId, so it defaults to the
    // SHARED "form-submit" id (SubmitButton's default) - scope to the open modal. This ADDS the
    // line to local state; it is a SEPARATE step from "revise-submit" below, which is the modal's
    // own distinct final-submit button that actually calls the revise API.
    await reviseModal.getByTestId("form-submit").click();
    await page.getByTestId("revise-submit").click();

    // *** DEF-15 (NEW, Major, found while re-verifying DEF-12 - a SEPARATE, deeper bug in the
    // same form): confirmed via direct probe (form-error text after submit = "ข้อมูลที่กรอกไม่ถูกต้อง
    // กรุณาตรวจสอบอีกครั้ง", the generic Zod validation message). Root cause: InvoicesPage.tsx's
    // `<select name="productId" ... onChange={() => undefined}>` is a RAW native <select> that is
    // NOT wrapped in an `AntForm.Item` and whose own onChange handler discards the event - it is
    // not registered with the surrounding antd `<Form>`'s state at all. `addReviseLine`'s `values`
    // (from onFinish) therefore never contains a real `productId`, so every added line's
    // `productId` is `Number(undefined)` = `NaN`, which fails the `z.number().int().positive()`
    // schema check on submit. DEF-12 (permission) being fixed only means the dropdown now HAS
    // options to display - selecting one still has zero effect on what gets submitted. The revise
    // feature is therefore still not usable end-to-end through the real UI even after DEF-12.
    // Left failing/documented rather than silently worked around - no test-side fix is applicable.
    await expect(page.getByTestId("revise-invoice-modal")).toBeHidden();

    // Scope to THIS test's own row (not a page-global query) - the shared dev DB can carry
    // invoices created by other tests/files that ran earlier in the same suite execution, so more
    // than one `view-version-history` button can legitimately exist on the page at once.
    await row.getByTestId("view-version-history").click();
    const versionRows = page.getByTestId("invoice-version-row");
    await expect(versionRows).toHaveCount(2);
    await expect(versionRows.filter({ hasText: "v1" })).toContainText(/Superseded/);
    await expect(versionRows.filter({ hasText: "v1" }).getByTestId("link-to-latest-version")).toBeVisible();
  });

  test.skip(
    "TC-037-AC3: opening the superseded (v1) invoice via a stale/cached link shows a block + link to latest - " +
      "SKIPPED: this app has no per-invoice route at all (everything lives in modals on a single " +
      "/invoices list page) - there is no 'stale link to an old invoice' scenario reachable through " +
      "the real UI to test. The equivalent server-side guard (revising a non-latest version by id) " +
      "IS covered at the API layer in tests/integration/invoiceVersioningReconciliation.spec.ts " +
      "TC-037-AC3.",
    () => {
      /* intentionally empty */
    }
  );

  test("TC-037-AC4: removing all lines from the revise form blocks submission with a clear message", async ({ page }) => {
    const { invoiceNo } = await buildInvoicedPo(page.request);
    await login(page, "finance_demo");
    await page.getByTestId("nav-invoice-list").click();
    const row = page.getByTestId(`demo-invoice-row-${invoiceNo}`);
    await row.getByTestId("revise-invoice-button").click();
    await page.getByTestId("revise-submit").click(); // no lines added at all - the modal starts empty
    await expect(page.getByTestId("invoice-blocked-message")).toContainText(/อย่างน้อย 1 รายการ/);
  });

  test("§5.5: the revise form always shows the payment-reconciliation warning before submit", async ({ page }) => {
    const { invoiceNo } = await buildInvoicedPo(page.request);
    await login(page, "finance_demo");
    await page.getByTestId("nav-invoice-list").click();
    const row = page.getByTestId(`demo-invoice-row-${invoiceNo}`);
    await row.getByTestId("revise-invoice-button").click();
    await expect(page.getByTestId("payment-reconciliation-warning")).toContainText(/รับชำระแล้ว/);
  });
});

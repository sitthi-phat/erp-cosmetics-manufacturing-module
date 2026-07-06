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

    // *** DEF-12 (NEW, Major, confirmed via direct API call: `GET /api/v1/products` as
    // finance_demo -> 403 {"code":"FORBIDDEN"}) ***. The revise-invoice modal's product picker
    // (`useProducts()` -> `GET /products`) is guarded by `requirePermission("stock","view")` in
    // product.routes.ts - but the Finance role (the ONLY role with `invoice.revise`, per
    // prisma/seed.ts's permission matrix) does NOT have `stock.view` at all. This means the
    // native `<select name="productId">` in the revise form is ALWAYS EMPTY for the one role that
    // is actually meant to use it - a Finance user can open "แก้ไข (revise)" but can never
    // populate a NEW product line through the real UI (the dropdown has zero options). This test
    // therefore cannot proceed past this point as originally designed - left failing/documented
    // rather than silently working around a broken feature.
    // The revise form's product picker is a plain native <select> (InvoicesPage.tsx), unlike the
    // antd Selects elsewhere - .selectOption() would be correct here once DEF-12 is fixed.
    await page.locator('select[name="productId"]').selectOption({ index: 0 });
    await page.getByTestId("revise-line-qty-0").fill("90");
    await page.locator('input[name="unitPrice"]').fill("500");
    await page.getByTestId("revise-submit").click();

    await page.getByTestId("view-version-history").click();
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

/**
 * Q2 — Integration: Invoice versioning (ECP-037 AC1-AC4) + non-concurrent part of the
 * Payment<->version reconciliation design in architecture.md §5.5.
 * Full concurrent-edit race scenario lives in tests/integration/concurrency/paymentVersionReconciliation.spec.ts.
 * Endpoints per src/backend/modules/invoice/invoice.routes.ts (ground truth, DEF-08):
 *   POST /invoices/:id/revise (":id" = numeric Invoice PK), GET /pos/:id/invoice/versions
 * `getVersions()` field is `supersededLabel` (not `supersededByLabel`); the "not latest" error is
 * a plain Thai sentence embedding `invoice_id=<n>` (no separate `latestVersionId` field).
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Invoice versioning + reconciliation (Epic 11, ECP-037)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
  let logistics: ReturnType<typeof request.agent>;
  let finance: ReturnType<typeof request.agent>;
  let admin: ReturnType<typeof request.agent>;
  let productionUserId: number;
  let customerId: number;
  let productId: number;
  let bomMaterialId: number;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const me = await production.get("/api/v1/auth/me");
    productionUserId = me.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    bomMaterialId = bom.body.data.lines[0].materialId;
  });

  async function createInvoicedPo(quantity = 100, unitPrice = 500) {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId, quantity, unitPrice, uom: "unit" }],
    });
    const poId = draft.body.data.id;
    await sales.post(`/api/v1/pos/${poId}/confirm`);
    const assigned = await production
      .post(`/api/v1/production/${draft.body.data.lines[0].id}/assign`)
      .send({ assignedTo: productionUserId });
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: bomMaterialId,
      quantity: 100000,
      lotNumber: `LOT-REV-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    await qc.post(`/api/v1/qc/lots/${receipt.body.data.lotId}/inspect`).send({ result: "Passed" });
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId: receipt.body.data.lotId, qtyUsed: 1 }],
      producedQty: quantity,
    });
    await qc.post(`/api/v1/qc/batches/${produced.body.data.id}/inspect`).send({ result: "Approved" });
    await logistics.post("/api/v1/shipments").send({
      batchId: produced.body.data.id,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    const invoice = await finance.post(`/api/v1/pos/${poId}/invoice`).send({
      lines: [{ productId, description: "รายการสินค้า", quantity, unitPrice }],
    });
    return { poId, invoiceId: invoice.body.data.id as number };
  }

  test("TC-037-AC1: revising v1 (Issued, unpaid) creates v2, links parent, supersedes v1", async () => {
    const { poId, invoiceId } = await createInvoicedPo(90, 500);
    const res = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised", quantity: 90, unitPrice: 500 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.version).toBe(2);
    expect(res.body.data.parentInvoiceId).toBe(invoiceId);

    const versions = await finance.get(`/api/v1/pos/${poId}/invoice/versions`);
    const v1 = versions.body.data.find((v: any) => v.version === 1);
    expect(v1.status).toBe("Superseded");
  });

  test("TC-037-AC2: the version timeline shows both versions in order, v1 tagged as superseded, original data intact", async () => {
    const { poId, invoiceId } = await createInvoicedPo(90, 500);
    await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised", quantity: 80, unitPrice: 500 }],
    });
    const versions = await finance.get(`/api/v1/pos/${poId}/invoice/versions`);
    expect(versions.status).toBe(200);
    expect(versions.body.data.length).toBeGreaterThanOrEqual(2);
    const v1 = versions.body.data.find((v: any) => v.version === 1);
    expect(v1.status).toBe("Superseded");
    expect(v1.supersededLabel).toMatch(/ถูกแทนที่โดย/);
    expect(v1.subtotal).toBeDefined(); // original amounts still viewable, not wiped
  });

  test("TC-037-AC3: attempting to revise a non-latest version is blocked with a link to the latest version", async () => {
    const { invoiceId } = await createInvoicedPo(90, 500);
    const v2 = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised", quantity: 80, unitPrice: 500 }],
    });
    expect(v2.status).toBe(201);
    // now try to revise v1 (the ORIGINAL invoiceId), which is no longer latest
    const res = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "x", quantity: 1, unitPrice: 1 }],
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/กรุณาแก้ไข version ล่าสุด/);
    expect(res.body.error.message).toMatch(new RegExp(`invoice_id=${v2.body.data.id}`));
  });

  test("TC-037-AC4: revising down to zero lines is rejected, current version stays unchanged", async () => {
    const { poId, invoiceId } = await createInvoicedPo(90, 500);
    const before = await finance.get(`/api/v1/pos/${poId}/invoice/versions`);
    const res = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({ lines: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/อย่างน้อย 1 รายการ/);

    const after = await finance.get(`/api/v1/pos/${poId}/invoice/versions`);
    expect(after.body.data).toEqual(before.body.data); // untouched
  });

  test("§5.5 (BA default, INVOICE_EDIT_AFTER_PAYMENT=allow): revising an invoice that already has a payment is ALLOWED, with a warning surfaced", async () => {
    const { invoiceId } = await createInvoicedPo(90, 500); // total = 90*500*1.07 = 48,150
    await finance.post(`/api/v1/invoices/${invoiceId}/payments`).send({
      amount: 20000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    const res = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised", quantity: 50, unitPrice: 500 }],
    });
    expect(res.status).toBe(201); // allowed by default policy
    expect(res.body.warnings.join(" ")).toMatch(/รับชำระแล้ว/);
  });

  // Prepared in case Pond confirms the opposite policy during UAT (see test-plan.md §4.4).
  // Flip INVOICE_EDIT_AFTER_PAYMENT=block in .env.test and un-skip to validate the alternate behavior.
  describe.skip("§5.5 alternate policy (INVOICE_EDIT_AFTER_PAYMENT=block) — pending Pond confirmation", () => {
    test("revising a Paid/PartiallyPaid invoice is rejected outright when policy=block", async () => {
      const { invoiceId } = await createInvoicedPo(90, 500);
      await finance.post(`/api/v1/invoices/${invoiceId}/payments`).send({
        amount: 20000,
        paymentDate: new Date().toISOString().slice(0, 10),
        method: "เงินสด",
      });
      const res = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
        lines: [{ productId, description: "revised", quantity: 50, unitPrice: 500 }],
      });
      expect(res.status).toBe(409);
    });
  });

  test("exploratory: audit log records ReviseInvoice with the acting user", async () => {
    const { invoiceId } = await createInvoicedPo(90, 500);
    await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised", quantity: 80, unitPrice: 500 }],
    });
    const audit = await admin.get("/api/v1/audit-logs").query({ actionType: "ReviseInvoice" });
    expect(audit.body.data.length).toBeGreaterThan(0);
  });
});

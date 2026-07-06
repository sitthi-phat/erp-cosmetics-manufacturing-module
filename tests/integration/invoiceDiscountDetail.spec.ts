/**
 * Q9 — Integration: Invoice discount (ECP-020 AC4/AC5) + invoice detail view (ECP-040 all AC).
 * Additive to the existing `tests/integration/invoice.spec.ts` (already green, pre-Gate-2
 * baseline for issue/payment/list — ground truth for field names used below: invoice `id`,
 * `version`, `parentInvoiceId`, `subtotal`, `vatRateApplied`, `vatAmount`, `totalAmount`,
 * `status`, `invoiceNo` — NOT `invoiceNumber`). Confirmed today (E30 not landed yet): the current
 * `POST /pos/:id/invoice` body is only `{lines:[...]}` with NO discount field and there is NO
 * `GET /invoices/:id` endpoint at all — both are exactly the Gate 2 gaps this file specs against.
 *
 * CONTRACT ASSUMPTION (E30 not implemented yet at spec-writing time): assumes
 * `POST /pos/:id/invoice` body gains an optional top-level `discountAmount` (default 0) sibling
 * to `lines`, and a new `GET /invoices/:id` returns `{data:{...invoice, discountAmount, lines:[...],
 * customer:{...}, payments:[...]}}`. TODO(verify, when E30 lands): reconcile field names/shape.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Invoice discount (ECP-020 AC4/AC5) + detail view (ECP-040)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
  let logistics: ReturnType<typeof request.agent>;
  let finance: ReturnType<typeof request.agent>;
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
    const me = await production.get("/api/v1/auth/me");
    productionUserId = me.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    bomMaterialId = bom.body.data.lines[0].materialId;
  });

  /** Same helper shape as invoice.spec.ts's createShippedPo, duplicated here (kept spec files
   * independent/self-contained per the established one-file-per-concern convention). */
  async function createShippedPo(quantity = 100, unitPrice = 500) {
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
      lotNumber: `LOT-DISC-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
    return { poId, productId, unitPrice, quantity };
  }

  test("TC-Q9-INVDISC-01 (ECP-020 AC4 worked example): discount 2,000 on a 50,000 subtotal PO => VAT 3,360.00, total 51,360.00", async () => {
    const po = await createShippedPo(100, 500); // subtotal 50,000
    const res = await finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "รายการสินค้า", quantity: po.quantity, unitPrice: po.unitPrice }],
      discountAmount: 2000,
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.subtotal)).toBeCloseTo(50000, 2);
    expect(Number(res.body.data.discountAmount)).toBeCloseTo(2000, 2);
    expect(Number(res.body.data.vatAmount)).toBeCloseTo(3360, 2);
    expect(Number(res.body.data.totalAmount)).toBeCloseTo(51360, 2);
  });

  test("TC-Q9-INVDISC-02 (ECP-020 AC5, exact message): discount greater than subtotal is rejected, invoice not created", async () => {
    const po = await createShippedPo(1, 10000); // subtotal 10,000
    const res = await finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "x", quantity: po.quantity, unitPrice: po.unitPrice }],
      discountAmount: 12000,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/ส่วนลดต้องไม่เกินยอดรวมก่อนหักส่วนลด/);
    expect(res.body.error.message).toMatch(/10,000\.00|10000\.00/);
  });

  test("TC-Q9-INVDISC-03: omitting discountAmount defaults to 0.00 (backward compatible with pre-Gate-2 issue flow)", async () => {
    const po = await createShippedPo(1, 500);
    const res = await finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "x", quantity: po.quantity, unitPrice: po.unitPrice }],
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.discountAmount ?? 0)).toBe(0);
  });

  test("TC-Q9-DETAIL-01 (ECP-040 AC1): GET /invoices/:id returns full detail — customer, all line items, subtotal/discount/vat/total, status, payment history", async () => {
    const po = await createShippedPo(100, 500);
    const issued = await finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "รายการสินค้า", quantity: po.quantity, unitPrice: po.unitPrice }],
      discountAmount: 2000,
    });
    const invoiceId = issued.body.data.id;

    const detail = await finance.get(`/api/v1/invoices/${invoiceId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.customer).toBeDefined();
    expect(Array.isArray(detail.body.data.lines)).toBe(true);
    expect(detail.body.data.lines.length).toBeGreaterThan(0);
    expect(Number(detail.body.data.subtotal)).toBeCloseTo(50000, 2);
    expect(Number(detail.body.data.discountAmount)).toBeCloseTo(2000, 2);
    expect(Number(detail.body.data.vatAmount)).toBeCloseTo(3360, 2);
    expect(Number(detail.body.data.totalAmount)).toBeCloseTo(51360, 2);
    expect(detail.body.data.status).toBe("Issued");
    expect(Array.isArray(detail.body.data.payments)).toBe(true); // empty array, not undefined/missing
  });

  test("TC-Q9-DETAIL-02 (ECP-040 AC2, version-aware): after a revise, GET /invoices/:id for the latest version does not mix numbers with the Superseded version", async () => {
    const po = await createShippedPo(1, 1000);
    const v1 = await finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "v1 line", quantity: 1, unitPrice: 1000 }],
    });
    const revised = await finance.post(`/api/v1/invoices/${v1.body.data.id}/revise`).send({
      lines: [{ productId: po.productId, description: "v2 line", quantity: 1, unitPrice: 800 }],
    });
    expect(revised.status).toBe(201);

    const v2Detail = await finance.get(`/api/v1/invoices/${revised.body.data.id}`);
    expect(v2Detail.status).toBe(200);
    expect(Number(v2Detail.body.data.subtotal)).toBeCloseTo(800, 2); // v2's own number, not v1's 1000

    const v1Detail = await finance.get(`/api/v1/invoices/${v1.body.data.id}`);
    expect(v1Detail.status).toBe(200);
    expect(v1Detail.body.data.status).toBe("Superseded");
    expect(Number(v1Detail.body.data.subtotal)).toBeCloseTo(1000, 2); // v1's OWN number preserved, not overwritten by v2
  });

  test("TC-Q9-DETAIL-03 (ECP-040 AC3, exact message): a non-existent invoice id returns 404, not 500", async () => {
    const res = await finance.get("/api/v1/invoices/999999999");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/ไม่พบ invoice นี้ในระบบ/);
  });

  test("TC-Q9-DETAIL-04 (ECP-040 AC4): a role without invoice-view access (e.g. Logistics) is denied direct detail access", async () => {
    const po = await createShippedPo(1, 500);
    const issued = await finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "x", quantity: 1, unitPrice: 500 }],
    });
    const res = await logistics.get(`/api/v1/invoices/${issued.body.data.id}`);
    expect(res.status).toBe(403);
  });
});

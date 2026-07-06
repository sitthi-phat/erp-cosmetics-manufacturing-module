/**
 * Q2 — Integration: Invoice & Payment module (ECP-020, ECP-021, ECP-022).
 * Versioning/revise (ECP-037) and payment<->version reconciliation live in
 * tests/integration/invoiceVersioningReconciliation.spec.ts and the Q7 concurrency spec.
 * Endpoints per src/backend/modules/invoice/invoice.routes.ts (ground truth, DEF-08):
 *   GET /invoices?status=<exact status> (no `statusGroup` filter exists - only an exact match)
 *   POST /pos/:id/invoice { lines: [{productId,description,quantity,unitPrice}] } (lines must be
 *   supplied by the caller, NOT auto-derived server-side from the PO)
 *   POST /invoices/:id/payments (":id" is the numeric Invoice PK, NOT the invoiceNo string) ->
 *   { data: { payment, status, outstanding } }
 * No seeded PO/invoice fixtures exist under placeholder names - every scenario builds its own
 * real PO -> Confirm -> Assign -> Produce -> QC Approve -> Ship -> Invoice chain first.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Invoice & Payment module (Epic 7)", () => {
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

  /** Full chain PO -> Confirm -> Assign -> Produce -> QC Approve -> Ship, returns { poId, productId, unitPrice, quantity }. */
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
      lotNumber: `LOT-INV-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  async function issueInvoiceFor(po: { poId: number; productId: number; unitPrice: number; quantity: number }) {
    return finance.post(`/api/v1/pos/${po.poId}/invoice`).send({
      lines: [{ productId: po.productId, description: "รายการสินค้า", quantity: po.quantity, unitPrice: po.unitPrice }],
    });
  }

  test("TC-020-AC1: issuing invoice v1 from a Shipped PO snapshots the current VAT rate (7%) and computes totals correctly", async () => {
    const po = await createShippedPo(100, 500); // subtotal 50,000
    const res = await issueInvoiceFor(po);
    expect(res.status).toBe(201);
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.parentInvoiceId).toBeNull();
    expect(Number(res.body.data.subtotal)).toBeCloseTo(50000, 2);
    expect(Number(res.body.data.vatRateApplied)).toBeCloseTo(7, 2);
    expect(Number(res.body.data.vatAmount)).toBeCloseTo(3500, 2);
    expect(Number(res.body.data.totalAmount)).toBeCloseTo(53500, 2);
    expect(res.body.data.status).toBe("Issued");

    // *** DEF-10 (NEW, Major, confirmed live - not a spec bug): neither invoice.service.ts nor
    // invoice.routes.ts ever updates PurchaseOrder.status to "Invoiced", nor creates a
    // POStatusEvent(status:"Invoiced") anywhere in the codebase (`grep -rn '"Invoiced"'
    // src/backend/modules` only matches the type union in po.rules.ts, never an actual
    // assignment). This means: (a) po.status stays "Shipped" forever even after the invoice is
    // fully issued/paid, and (b) the ECP-006 AC1 5-step timeline (Confirmed/InProduction/QC
    // Approved/Shipped/Invoiced) - the exact requirement Gate 1 called out by name - can NEVER
    // reach its final "Invoiced" step. This asserts the CORRECT/intended behavior (per
    // po.rules.ts's own POStatus type and the FE's TIMELINE_STEPS in PoDetailPage.tsx) rather
    // than being weakened to match the current gap - do not "fix" this assertion without first
    // wiring the status/timeline update in invoice.service.ts#issueInvoice.
    const poRes = await sales.get(`/api/v1/pos/${po.poId}`);
    expect(poRes.body.data.status).toBe("Invoiced");
  });

  test("TC-020-AC2: issuing a second invoice chain for the same PO is blocked and points to revise", async () => {
    const po = await createShippedPo(10, 500);
    await issueInvoiceFor(po);
    const second = await issueInvoiceFor(po);
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/ออกไปแล้ว/);
    expect(second.body.error.message).toMatch(/แก้ไข invoice/);
  });

  test("TC-020-AC3: issuing an invoice for a PO not yet Shipped is rejected", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId, quantity: 1, unitPrice: 100, uom: "unit" }],
    });
    await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    // still Confirmed, not Shipped
    const res = await finance.post(`/api/v1/pos/${draft.body.data.id}/invoice`).send({
      lines: [{ productId, description: "x", quantity: 1, unitPrice: 100 }],
    });
    // invoice.service.ts#issueInvoice throws AppError.validation() (not conflict) -> 400
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/ยังไม่ถูกจัดส่ง/);
  });

  test("TC-021-AC1: full payment moves invoice to Paid with 0.00 outstanding", async () => {
    const po = await createShippedPo(100, 500); // total 53,500
    const invoice = await issueInvoiceFor(po);
    const res = await finance.post(`/api/v1/invoices/${invoice.body.data.id}/payments`).send({
      amount: 53500,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Paid");
    expect(res.body.data.outstanding).toBe(0);
  });

  test("TC-021-AC2: partial payment moves invoice to PartiallyPaid with correct outstanding", async () => {
    const po = await createShippedPo(100, 500); // total 53,500
    const invoice = await issueInvoiceFor(po);
    const res = await finance.post(`/api/v1/invoices/${invoice.body.data.id}/payments`).send({
      amount: 40000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PartiallyPaid");
    expect(res.body.data.outstanding).toBeCloseTo(13500, 2);
  });

  test("TC-021-AC3: overpayment beyond outstanding is rejected with the exact outstanding figure", async () => {
    const po = await createShippedPo(1, 500); // subtotal 500, total 535
    const invoice = await issueInvoiceFor(po);
    const res = await finance.post(`/api/v1/invoices/${invoice.body.data.id}/payments`).send({
      amount: 1000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/เกินยอดคงค้าง/);
    expect(res.body.error.message).toMatch(/535\.00/);
  });

  test("TC-022-AC1: filtering by an exact status (e.g. Issued) returns only matching invoices", async () => {
    const po = await createShippedPo(2, 500);
    await issueInvoiceFor(po);
    const res = await finance.get("/api/v1/invoices").query({ status: "Issued" });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((i: any) => i.status === "Issued")).toBe(true);
  });

  test("TC-022-AC3: a role other than Finance/Admin is denied direct access", async () => {
    const res = await logistics.get("/api/v1/invoices");
    expect(res.status).toBe(403);
  });

  test("exploratory: negative payment amount is rejected outright (Data Rules: amount > 0)", async () => {
    const po = await createShippedPo(1, 500);
    const invoice = await issueInvoiceFor(po);
    const res = await finance.post(`/api/v1/invoices/${invoice.body.data.id}/payments`).send({
      amount: -100,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });
    expect(res.status).toBe(400);
  });
});

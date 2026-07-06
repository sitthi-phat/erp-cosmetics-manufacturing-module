/**
 * Q2 — Integration: VATConfig Admin Portal (ECP-038).
 * Endpoints per src/backend/modules/vatConfig/vatConfig.routes.ts (ground truth, DEF-08):
 *   GET/PUT /admin/vat-config -> { data: { id, rate, ... } } (there is no GET /invoices/:id single
 *   endpoint - re-fetch a specific invoice via GET /invoices + find by id instead)
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom, buildExactLotSelections } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD, SEED_FACTS } from "../helpers/fixtures";
import request from "supertest";

describe("VATConfig Admin Portal (Epic 11, ECP-038)", () => {
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

  async function issueFreshInvoice(quantity = 10, unitPrice = 500) {
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
      lotNumber: `LOT-VAT-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    await qc.post(`/api/v1/qc/lots/${receipt.body.data.lotId}/inspect`).send({ result: "Passed" });
    // RECONCILED (QA gate2-verify): E27 quantity re-validation - use the server's own exact FIFO split.
    const lotSelections = await buildExactLotSelections(production, assigned.body.data.id);
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections,
      producedQty: quantity,
    });
    await qc.post(`/api/v1/qc/batches/${produced.body.data.id}/inspect`).send({ result: "Approved" });
    await logistics.post("/api/v1/shipments").send({
      batchId: produced.body.data.id,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    return finance.post(`/api/v1/pos/${poId}/invoice`).send({
      lines: [{ productId, description: "รายการสินค้า", quantity, unitPrice }],
    });
  }

  test(`seed sanity: default VAT rate is ${SEED_FACTS.vatDefaultRate}%`, async () => {
    const res = await admin.get("/api/v1/admin/vat-config");
    expect(res.status).toBe(200);
    expect(Number(res.body.data.rate)).toBeCloseTo(SEED_FACTS.vatDefaultRate, 2);
  });

  test("TC-038-AC1: updating the rate to 10% takes effect immediately and applies to newly issued invoices", async () => {
    const update = await admin.put("/api/v1/admin/vat-config").send({ rate: 10 });
    expect(update.status).toBe(200);
    expect(Number(update.body.data.rate)).toBe(10);

    const invoice = await issueFreshInvoice();
    expect(Number(invoice.body.data.vatRateApplied)).toBe(10);
  });

  test("TC-038-AC2: a previously issued invoice keeps its original VAT snapshot after the config rate changes", async () => {
    const before = await issueFreshInvoice(10, 500); // issued at whatever rate is in effect right now
    expect(before.status).toBe(201);
    const originalRate = Number(before.body.data.vatRateApplied);
    const originalTotal = Number(before.body.data.totalAmount);

    await admin.put("/api/v1/admin/vat-config").send({ rate: 15 });

    const list = await finance.get("/api/v1/invoices");
    const after = list.body.data.find((i: any) => i.id === before.body.data.id);
    expect(Number(after.vatRateApplied)).toBeCloseTo(originalRate, 2); // unchanged snapshot
    expect(Number(after.totalAmount)).toBeCloseTo(originalTotal, 2);
  });

  test("TC-038-AC3: rate outside 0-100 is rejected, old value stays in effect", async () => {
    const beforeRes = await admin.get("/api/v1/admin/vat-config");
    const beforeRate = Number(beforeRes.body.data.rate);

    const negative = await admin.put("/api/v1/admin/vat-config").send({ rate: -5 });
    expect(negative.status).toBe(400);
    expect(negative.body.error.message).toMatch(/อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%/);

    const tooHigh = await admin.put("/api/v1/admin/vat-config").send({ rate: 150 });
    expect(tooHigh.status).toBe(400);

    const stillValid = await admin.get("/api/v1/admin/vat-config");
    expect(Number(stillValid.body.data.rate)).toBe(beforeRate);
  });

  test("RBAC: only Admin can read/write vat-config — Finance (which manages invoices) must still be denied", async () => {
    const read = await finance.get("/api/v1/admin/vat-config");
    expect(read.status).toBe(403);
    const write = await finance.put("/api/v1/admin/vat-config").send({ rate: 20 });
    expect(write.status).toBe(403);
  });

  test("exploratory: audit log records UpdateVATConfig with the acting admin", async () => {
    await admin.put("/api/v1/admin/vat-config").send({ rate: 8 });
    const audit = await admin.get("/api/v1/audit-logs").query({ actionType: "UpdateVATConfig" });
    expect(audit.body.data.length).toBeGreaterThan(0);
  });
});

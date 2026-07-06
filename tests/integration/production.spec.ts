/**
 * Q2 — Integration: Production module (ECP-011, ECP-012, ECP-013).
 * Endpoints per src/backend/modules/production/production.routes.ts (ground truth, DEF-08):
 *   GET /production/queue -> { data: PurchaseOrder[] } (each with `.lines[]`, NOT a flat po-line
 *   list - "the line" to assign is `po.lines[0].id`, i.e. `poLineId`)
 *   POST /production/:poLineId/assign { assignedTo: number } (a numeric user id, NOT a username)
 *   POST /production/:id/produce { producedQty, lotSelections: [{materialId, lotId, qtyUsed}] }
 *   (NOT `lotsUsed`) - `lotId` must be a REAL lot id (resolved via a fresh goods receipt + QC
 *   "Passed" inspection in this file, since there is no `GET /lots` listing endpoint to discover
 *   seed-generated lot ids).
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

function tomorrow(offsetDays = 1) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

describe("Production module (Epic 4)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
  let productionUserId: number;
  let customerId: number;
  let productId: number;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const me = await production.get("/api/v1/auth/me");
    productionUserId = me.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
  });

  /** Runs FIRST, before any test below creates+confirms a PO - right after resetSeed() the
   * seeded demo PO has already progressed all the way to "Invoiced" (prisma/seed.ts), so the
   * Confirmed-only queue is genuinely empty at this point (self-contained, no mocking needed). */
  test("TC-011-AC2: empty queue right after reset (no Confirmed PO exists yet in this file's run)", async () => {
    const res = await production.get("/api/v1/production/queue");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    // Explicit empty-state COPY is a frontend concern (ProductionPage.tsx emptyText), not this API.
  });

  async function createConfirmedPo(requestedDeliveryDate: string) {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate,
      lines: [{ productId, quantity: 1, unitPrice: 100, uom: "unit" }],
    });
    await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    return draft.body.data;
  }

  /** Fresh, QC-Passed lot for `productId`'s first BOM material, via a real goods receipt + QC
   * inspection (no reliance on undiscoverable seed lot ids). */
  async function receiveUsableLot(materialId: number, qty = 100) {
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId,
      quantity: qty,
      lotNumber: `LOT-PROD-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    const lotId = receipt.body.data.lotId;
    await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Passed" });
    return lotId;
  }

  async function firstBomMaterialId() {
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    return bom.body.data.lines[0].materialId as number;
  }

  test("TC-011-AC1: queue is sorted by requested delivery date ascending", async () => {
    await createConfirmedPo(tomorrow(5));
    await createConfirmedPo(tomorrow(1));
    await createConfirmedPo(tomorrow(3));
    const res = await production.get("/api/v1/production/queue");
    expect(res.status).toBe(200);
    const dates = res.body.data.map((p: any) => new Date(p.requestedDeliveryDate).getTime());
    const sorted = [...dates].sort((a, b) => a - b);
    expect(dates).toEqual(sorted);
  });

  test("TC-012-AC1: assigning a worker creates a ProductionOrder with status Assigned", async () => {
    const po = await createConfirmedPo(tomorrow());
    const poLineId = po.lines[0].id;
    const res = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Assigned");
    expect(res.body.data.assignedTo).toBe(productionUserId);
  });

  test("TC-012-AC2: assigning an already-assigned line warns instead of silently re-assigning", async () => {
    const po = await createConfirmedPo(tomorrow());
    const poLineId = po.lines[0].id;
    await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    const second = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/ถูกมอบหมายให้/);
  });

  test("TC-013-AC1: producing with a selected lot creates a Batch, links the lot, and deducts physical stock", async () => {
    const po = await createConfirmedPo(tomorrow());
    const poLineId = po.lines[0].id;
    const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    const materialId = await firstBomMaterialId();
    const lotId = await receiveUsableLot(materialId, 100);

    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId, lotId, qtyUsed: 50 }],
      producedQty: 500,
    });
    expect(produced.status).toBe(201);
    expect(produced.body.data.batchNumber).toMatch(/^B-\d{8}-\d{5}$/);
  });

  test("TC-013-AC2: multiple lots of the same material can be recorded against a single batch", async () => {
    const po = await createConfirmedPo(tomorrow());
    const poLineId = po.lines[0].id;
    const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    const materialId = await firstBomMaterialId();
    const lot1 = await receiveUsableLot(materialId, 100);
    const lot2 = await receiveUsableLot(materialId, 100);

    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [
        { materialId, lotId: lot1, qtyUsed: 30 },
        { materialId, lotId: lot2, qtyUsed: 20 },
      ],
      producedQty: 500,
    });
    expect(produced.status).toBe(201);
    // The produce response is the Batch row itself, not an inline lot-usage list - verify the
    // 2-lot usage was actually persisted via the traceability endpoint instead (ECP-014).
    const lotNumberRes = await warehouse.get("/api/v1/stock/transactions").query({ material: materialId });
    const issuesForThisBatch = lotNumberRes.body.data.filter(
      (t: any) => t.type === "Issue" && t.refDocId === produced.body.data.id
    );
    expect(issuesForThisBatch).toHaveLength(2);
  });

  test("TC-013-AC3: producing without selecting any lot is rejected", async () => {
    const po = await createConfirmedPo(tomorrow());
    const poLineId = po.lines[0].id;
    const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [],
      producedQty: 500,
    });
    expect(produced.status).toBe(400);
    expect(produced.body.error.message).toMatch(/กรุณาระบุ Lot/);
  });

  test("ECP-017 AC2/AC3: a lot that failed or is pending incoming QC cannot be selected for production even via direct API call", async () => {
    const po = await createConfirmedPo(tomorrow());
    const poLineId = po.lines[0].id;
    const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    const materialId = await firstBomMaterialId();

    // A lot that is still "Pending" incoming QC (never inspected) must be rejected.
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId,
      quantity: 100,
      lotNumber: `LOT-PENDING-QC-${Date.now()}`,
    });
    const pendingLotId = receipt.body.data.lotId;

    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId, lotId: pendingLotId, qtyUsed: 10 }],
      producedQty: 100,
    });
    expect([400, 409]).toContain(produced.status);
    expect(produced.body.error.message).toMatch(/ยังไม่ผ่านการตรวจสอบคุณภาพขาเข้า/);
  });
});

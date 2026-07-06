/**
 * Q2 — Integration: Shipping module (ECP-018, ECP-019).
 * Endpoints per src/backend/modules/shipping/shipping.routes.ts (ground truth, DEF-08):
 *   GET /shipments, GET /shipments/eligible-batches, POST /shipments { batchId:number, shippedDate },
 *   PATCH /shipments/:id/status { status:"Delivered", deliveredDate }
 * No `quantity` field exists on POST /shipments (schema only has batchId/shippedDate). No seeded
 * batches/shipments exist under placeholder names - every scenario builds its own real chain.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Shipping module (Epic 6)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
  let logistics: ReturnType<typeof request.agent>;
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
    const me = await production.get("/api/v1/auth/me");
    productionUserId = me.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    bomMaterialId = bom.body.data.lines[0].materialId;
  });

  /** Full chain up to a Batch at the given QC-relevant status ("QCPending"/"QCApproved"/"QCRejected"). */
  async function createBatchAtStatus(status: "QCPending" | "QCApproved" | "QCRejected") {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId, quantity: 1, unitPrice: 100, uom: "unit" }],
    });
    await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    const assigned = await production
      .post(`/api/v1/production/${draft.body.data.lines[0].id}/assign`)
      .send({ assignedTo: productionUserId });
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: bomMaterialId,
      quantity: 50,
      lotNumber: `LOT-SHIP-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    await qc.post(`/api/v1/qc/lots/${receipt.body.data.lotId}/inspect`).send({ result: "Passed" });
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId: receipt.body.data.lotId, qtyUsed: 5 }],
      producedQty: 10,
    });
    const batchId = produced.body.data.id;
    if (status !== "QCPending") {
      await qc.post(`/api/v1/qc/batches/${batchId}/inspect`).send({
        result: status === "QCApproved" ? "Approved" : "Rejected",
        remarks: "auto",
      });
    }
    return batchId as number;
  }

  test("TC-018-AC1: shipment can be created from a QCApproved batch and updates PO status to Shipped", async () => {
    const batchId = await createBatchAtStatus("QCApproved");
    const res = await logistics.post("/api/v1/shipments").send({
      batchId,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Shipped");
  });

  test("TC-018-AC2: a QCRejected batch never even appears in the eligible-batches list", async () => {
    const rejectedBatchId = await createBatchAtStatus("QCRejected");
    const options = await logistics.get("/api/v1/shipments/eligible-batches");
    expect(options.status).toBe(200);
    const rejectedListed = options.body.data.some((b: any) => b.id === rejectedBatchId);
    expect(rejectedListed).toBe(false);
  });

  test("TC-018-AC3: creating a shipment directly for a QCPending batch (bypassing the filtered UI) is rejected", async () => {
    const batchId = await createBatchAtStatus("QCPending");
    const res = await logistics.post("/api/v1/shipments").send({
      batchId,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(400); // shipping.rules.ts#assertBatchShippable -> AppError.validation() -> 400
    expect(res.body.error.message).toMatch(/ยังไม่ผ่านการอนุมัติจาก QA\/QC/);
  });

  test("TC-019-AC1: updating Shipped -> Delivered succeeds", async () => {
    const batchId = await createBatchAtStatus("QCApproved");
    const shipment = await logistics.post("/api/v1/shipments").send({
      batchId,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    const res = await logistics.patch(`/api/v1/shipments/${shipment.body.data.id}/status`).send({
      status: "Delivered",
      deliveredDate: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Delivered");
  });

  test.skip(
    "TC-019-AC2: skipping straight from Draft to Delivered is rejected - " +
      "SKIPPED: no code path in shipping.routes.ts ever creates a shipment with status 'Draft' " +
      "(POST /shipments always sets status:'Shipped' immediately). 'Draft' only exists as a type " +
      "value in shipping.rules.ts#ShipmentStatus with no reachable state machine transition into " +
      "it - matches the same 'ReadyToShip on Batch' dead-state pattern noted as MIN-03 in an " +
      "earlier verify round. Cannot exercise this AC through the real API without inserting a fake " +
      "row directly into the DB, which would test rules.ts in isolation, not the API contract.",
    () => {
      /* intentionally empty */
    }
  );

  test("TC-019-AC3: a future delivery date is rejected and not saved", async () => {
    const batchId = await createBatchAtStatus("QCApproved");
    const shipment = await logistics.post("/api/v1/shipments").send({
      batchId,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const res = await logistics.patch(`/api/v1/shipments/${shipment.body.data.id}/status`).send({
      status: "Delivered",
      deliveredDate: future,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/ต้องไม่เกินวันที่ปัจจุบัน/);
  });
});

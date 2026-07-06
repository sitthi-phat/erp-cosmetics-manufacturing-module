/**
 * Q2 — Integration: QC module (ECP-015, ECP-016, ECP-017).
 * Endpoints per src/backend/modules/qc/qc.routes.ts (ground truth, DEF-08):
 *   POST /qc/batches/:id/inspect { result: "Approved"|"Rejected", remarks? } -> { data: QCInspection }
 *     (the response is the INSPECTION row, not the batch - it has no `.status`/`.relatedPoId`
 *     field; re-fetch the batch/PO separately to observe the resulting state)
 *   GET /qc/batches?status=... -> { data: Batch[] }
 *   POST /qc/lots/:id/inspect { result: "Passed"|"Failed" } -> { data: Lot } (has `.incomingQcStatus`)
 * No seeded batches/lots exist under the placeholder names this file originally guessed
 * (SEEDED_BATCH_PENDING, etc.) - every scenario below builds its own real PO -> Confirm -> Assign
 * -> Produce chain first, exactly like production.spec.ts.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("QC module (Epic 5)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
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
    const me = await production.get("/api/v1/auth/me");
    productionUserId = me.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    bomMaterialId = bom.body.data.lines[0].materialId;
  });

  /** Full happy-path setup ending in a fresh Batch (status QCPending) - returns { poId, batchId }. */
  async function createPendingBatch() {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId, quantity: 1, unitPrice: 100, uom: "unit" }],
    });
    const poId = draft.body.data.id;
    await sales.post(`/api/v1/pos/${poId}/confirm`);
    const poLineId = draft.body.data.lines[0].id;
    const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });

    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: bomMaterialId,
      quantity: 100,
      lotNumber: `LOT-QC-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    const lotId = receipt.body.data.lotId;
    await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Passed" });

    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId, qtyUsed: 5 }],
      producedQty: 10,
    });
    return { poId, batchId: produced.body.data.id as number };
  }

  async function fetchBatch(batchId: number) {
    const res = await qc.get("/api/v1/qc/batches");
    return res.body.data.find((b: any) => b.id === batchId);
  }

  test("TC-015-AC1: approving a QCPending batch sets QCApproved", async () => {
    const { batchId } = await createPendingBatch();
    const res = await qc.post(`/api/v1/qc/batches/${batchId}/inspect`).send({
      result: "Approved",
      remarks: "ผ่านมาตรฐาน",
    });
    expect(res.status).toBe(201); // qc.routes.ts returns 201 for a newly-created inspection row
    expect(res.body.data.result).toBe("Approved");
    const batch = await fetchBatch(batchId);
    expect(batch.status).toBe("QCApproved");
  });

  test("TC-015-AC2: rejecting sets QCRejected, PO derivedStatusLabel shows 'รอผลิตใหม่'", async () => {
    const { poId, batchId } = await createPendingBatch();
    const res = await qc.post(`/api/v1/qc/batches/${batchId}/inspect`).send({
      result: "Rejected",
      remarks: "พบสิ่งปนเปื้อน",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.result).toBe("Rejected");
    const batch = await fetchBatch(batchId);
    expect(batch.status).toBe("QCRejected");

    const poRes = await sales.get(`/api/v1/pos/${poId}`);
    expect(poRes.body.data.derivedStatusLabel).toMatch(/รอผลิตใหม่/);
  });

  test("TC-015-AC3: re-inspecting an already-approved batch requires explicit re-confirmation, names the prior inspector/time", async () => {
    const { batchId } = await createPendingBatch();
    await qc.post(`/api/v1/qc/batches/${batchId}/inspect`).send({ result: "Approved", remarks: "ครั้งแรก" });
    const res = await qc.post(`/api/v1/qc/batches/${batchId}/inspect`).send({ result: "Approved", remarks: "ตรวจซ้ำ" });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ถูกอนุมัติไปแล้ว/);
  });

  test("TC-016-AC1: filtering QC Pending returns only pending batches", async () => {
    await createPendingBatch();
    const res = await qc.get("/api/v1/qc/batches").query({ status: "QCPending" });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((b: any) => b.status === "QCPending")).toBe(true);
  });

  test("TC-016-AC3: a non-QC role is denied even via direct URL", async () => {
    const res = await sales.get("/api/v1/qc/batches");
    expect(res.status).toBe(403);
  });

  test("TC-017-AC1: incoming lot QC pass makes the lot usable in production", async () => {
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: bomMaterialId,
      quantity: 50,
      lotNumber: `LOT-AC1-${Date.now()}`,
    });
    const res = await qc.post(`/api/v1/qc/lots/${receipt.body.data.lotId}/inspect`).send({ result: "Passed" });
    expect(res.status).toBe(200);
    expect(res.body.data.incomingQcStatus).toBe("Passed");
  });

  test("TC-017-AC2: a failed lot is rejected even if requested directly via API for production use", async () => {
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
      lotNumber: `LOT-FAILED-${Date.now()}`,
    });
    const lotId = receipt.body.data.lotId;
    await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Failed" });

    const res = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId, qtyUsed: 5 }],
      producedQty: 50,
    });
    expect([400, 409]).toContain(res.status);
    expect(res.body.error.message).toMatch(/ไม่ผ่านการตรวจสอบคุณภาพ ไม่สามารถนำไปใช้ผลิตได้/);
  });

  test("TC-017-AC3: a lot with no incoming QC result at all (still Pending) is also rejected for production use", async () => {
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
      lotNumber: `LOT-NEVER-INSPECTED-${Date.now()}`,
    });
    const lotId = receipt.body.data.lotId; // never inspected -> incomingQcStatus stays "Pending"

    const res = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId, qtyUsed: 5 }],
      producedQty: 50,
    });
    expect([400, 409]).toContain(res.status);
    expect(res.body.error.message).toMatch(/ยังไม่ผ่านการตรวจสอบคุณภาพขาเข้า/);
  });
});

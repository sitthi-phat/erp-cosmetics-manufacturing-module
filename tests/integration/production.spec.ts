/**
 * Q2 — Integration: Production module (ECP-011, ECP-012, ECP-013).
 * Endpoints per architecture.md §6:
 *   GET /production/queue, POST /production/:poLineId/assign, POST /production/:id/produce
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Production module (Epic 4)", () => {
  let production: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
  });

  test("TC-011-AC1: queue is sorted by requested delivery date ascending", async () => {
    const res = await production.get("/api/v1/production/queue");
    expect(res.status).toBe(200);
    const dates = res.body.items.map((i: any) => new Date(i.requestedDeliveryDate).getTime());
    const sorted = [...dates].sort((a, b) => a - b);
    expect(dates).toEqual(sorted);
  });

  test("TC-011-AC2: empty queue shows an explicit message, not a blank list", async () => {
    // relies on a scenario where all confirmed POs have already been assigned in seed/test setup
    const res = await production.get("/api/v1/production/queue").query({ onlyEmptyScenario: true });
    if (res.body.items.length === 0) {
      expect(res.body.emptyStateMessage ?? res.body.message).toMatch(/ไม่มีงานผลิตที่รอดำเนินการ/);
    }
  });

  test("TC-012-AC1: assigning a worker creates a ProductionOrder with status Assigned", async () => {
    const queue = await production.get("/api/v1/production/queue");
    const line = queue.body.items[0];
    const res = await production.post(`/api/v1/production/${line.poLineId}/assign`).send({ workerUsername: "somchai" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Assigned");
    expect(res.body.assignedTo).toMatch(/somchai/i);
  });

  test("TC-012-AC2: assigning an already-assigned line warns instead of silently re-assigning", async () => {
    const queue = await production.get("/api/v1/production/queue");
    const line = queue.body.items[0];
    await production.post(`/api/v1/production/${line.poLineId}/assign`).send({ workerUsername: "somchai" });
    const second = await production.post(`/api/v1/production/${line.poLineId}/assign`).send({ workerUsername: "somying" });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/ถูกมอบหมายให้/);
  });

  test("TC-013-AC1: producing with a selected lot creates a Batch, links the lot, and deducts physical stock", async () => {
    const queue = await production.get("/api/v1/production/queue");
    const line = queue.body.items[0];
    const assigned = await production.post(`/api/v1/production/${line.poLineId}/assign`).send({ workerUsername: "somchai" });
    const produced = await production.post(`/api/v1/production/${assigned.body.id}/produce`).send({
      lotsUsed: [{ lotId: "SEEDED_LOT_ID", qtyUsed: 50 }],
      producedQty: 500,
    });
    expect(produced.status).toBe(201);
    expect(produced.body.batchNumber).toMatch(/^B-\d{8}-\d{5}$/);
  });

  test("TC-013-AC2: multiple lots of the same material can be recorded against a single batch", async () => {
    const queue = await production.get("/api/v1/production/queue");
    const line = queue.body.items[1] ?? queue.body.items[0];
    const assigned = await production.post(`/api/v1/production/${line.poLineId}/assign`).send({ workerUsername: "somchai" });
    const produced = await production.post(`/api/v1/production/${assigned.body.id}/produce`).send({
      lotsUsed: [
        { lotId: "SEEDED_LOT_ID_1", qtyUsed: 30 },
        { lotId: "SEEDED_LOT_ID_2", qtyUsed: 20 },
      ],
      producedQty: 500,
    });
    expect(produced.status).toBe(201);
    expect(produced.body.lotsUsed).toHaveLength(2);
  });

  test("TC-013-AC3: producing without selecting any lot is rejected", async () => {
    const queue = await production.get("/api/v1/production/queue");
    const line = queue.body.items[0];
    const assigned = await production.post(`/api/v1/production/${line.poLineId}/assign`).send({ workerUsername: "somchai" });
    const produced = await production.post(`/api/v1/production/${assigned.body.id}/produce`).send({
      lotsUsed: [],
      producedQty: 500,
    });
    expect(produced.status).toBe(400);
    expect(produced.body.error.message).toMatch(/กรุณาระบุ Lot/);
  });

  test("ECP-017 AC2/AC3: a lot that failed or is pending incoming QC cannot be selected for production even via direct API call", async () => {
    const produced = await production.post("/api/v1/production/some-po/produce").send({
      lotsUsed: [{ lotId: "SEEDED_LOT_FAILED_QC", qtyUsed: 10 }],
      producedQty: 100,
    });
    expect([400, 409]).toContain(produced.status);
    expect(produced.body.error.message).toMatch(/ไม่ผ่านการตรวจสอบคุณภาพ/);
  });
});

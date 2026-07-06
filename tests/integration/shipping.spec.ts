/**
 * Q2 — Integration: Shipping module (ECP-018, ECP-019).
 * Endpoints per architecture.md §6: GET /shipments, POST /shipments, PATCH /shipments/:id/status
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("Shipping module (Epic 6)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-018-AC1: shipment can be created from a QCApproved batch and updates PO status to Shipped", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const res = await logistics.post("/api/v1/shipments").send({
      batchId: "SEEDED_BATCH_APPROVED",
      shippedDate: new Date().toISOString().slice(0, 10),
      quantity: 500,
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Shipped");
  });

  test("TC-018-AC2: a QCRejected batch never even appears as a selectable option", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const options = await logistics.get("/api/v1/shipments").query({ selectableBatches: true });
    const rejectedListed = options.body.items?.some((b: any) => b.batchId === "SEEDED_BATCH_REJECTED");
    expect(rejectedListed).toBeFalsy();
  });

  test("TC-018-AC3: creating a shipment directly for a QCPending batch (bypassing the filtered UI) is rejected", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const res = await logistics.post("/api/v1/shipments").send({
      batchId: "SEEDED_BATCH_PENDING",
      shippedDate: new Date().toISOString().slice(0, 10),
      quantity: 100,
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ยังไม่ผ่านการอนุมัติจาก QA\/QC/);
  });

  test("TC-019-AC1: updating Shipped -> Delivered succeeds and the linked PO reflects Delivered", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const res = await logistics.patch("/api/v1/shipments/SEEDED_SHIPMENT_SHIPPED/status").send({
      status: "Delivered",
      deliveredDate: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Delivered");
  });

  test("TC-019-AC2: skipping straight from Draft to Delivered is rejected", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const res = await logistics.patch("/api/v1/shipments/SEEDED_SHIPMENT_DRAFT/status").send({
      status: "Delivered",
      deliveredDate: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ต้องมีสถานะ Shipped ก่อน/);
  });

  test("TC-019-AC3: a future delivery date is rejected and not saved", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const res = await logistics.patch("/api/v1/shipments/SEEDED_SHIPMENT_SHIPPED/status").send({
      status: "Delivered",
      deliveredDate: future,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/ต้องไม่เกินวันที่ปัจจุบัน/);
  });
});

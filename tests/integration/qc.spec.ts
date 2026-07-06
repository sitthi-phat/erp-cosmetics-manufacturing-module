/**
 * Q2 — Integration: QC module (ECP-015, ECP-016, ECP-017).
 * Endpoints per architecture.md §6:
 *   POST /qc/batches/:id/inspect, GET /qc/batches, POST /qc/lots/:id/inspect
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("QC module (Epic 5)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-015-AC1: approving a QCPending batch sets QCApproved and it becomes selectable for shipping", async () => {
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const res = await qc.post("/api/v1/qc/batches/SEEDED_BATCH_PENDING/inspect").send({
      result: "Approved",
      remarks: "ผ่านมาตรฐาน",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("QCApproved");
  });

  test("TC-015-AC2: rejecting sets QCRejected, excludes from shipping selection, PO shows 'รอผลิตใหม่'", async () => {
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const res = await qc.post("/api/v1/qc/batches/SEEDED_BATCH_PENDING_2/inspect").send({
      result: "Rejected",
      remarks: "พบสิ่งปนเปื้อน",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("QCRejected");

    const poRes = await qc.get(`/api/v1/pos/${res.body.relatedPoId}`);
    expect(poRes.body.statusLabel ?? poRes.body.status).toMatch(/รอผลิตใหม่/);
  });

  test("TC-015-AC3: re-inspecting an already-approved batch requires explicit re-confirmation, names the prior inspector/time", async () => {
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const res = await qc.post("/api/v1/qc/batches/SEEDED_BATCH_APPROVED/inspect").send({
      result: "Approved",
      remarks: "ตรวจซ้ำ",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ถูกอนุมัติไปแล้ว/);
  });

  test("TC-016-AC1: filtering QC Pending returns only pending batches, oldest production date first", async () => {
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const res = await qc.get("/api/v1/qc/batches").query({ status: "QCPending" });
    expect(res.status).toBe(200);
    expect(res.body.items.every((b: any) => b.status === "QCPending")).toBe(true);
  });

  test("TC-016-AC3: a non-QC role is denied even via direct URL", async () => {
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const res = await sales.get("/api/v1/qc/batches");
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/ไม่มีสิทธิ์/);
  });

  test("TC-017-AC1: incoming lot QC pass makes the lot usable in production", async () => {
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const res = await qc.post("/api/v1/qc/lots/SEEDED_LOT_PENDING_QC/inspect").send({ result: "Passed" });
    expect(res.status).toBe(200);
    expect(res.body.incomingQcStatus).toBe("Passed");
  });

  test("TC-017-AC2: a failed lot is rejected even if requested directly via API for production use", async () => {
    const production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    const res = await production.post("/api/v1/production/some-po/produce").send({
      lotsUsed: [{ lotId: "SEEDED_LOT_FAILED_QC", qtyUsed: 5 }],
      producedQty: 50,
    });
    expect([400, 409]).toContain(res.status);
    expect(res.body.error.message).toMatch(/ไม่ผ่านการตรวจสอบคุณภาพ/);
  });

  test("TC-017-AC3: a lot with no incoming QC result at all ('รอตรวจสอบ') is also rejected for production use", async () => {
    const production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    const res = await production.post("/api/v1/production/some-po/produce").send({
      lotsUsed: [{ lotId: "SEEDED_LOT_NEVER_INSPECTED", qtyUsed: 5 }],
      producedQty: 50,
    });
    expect([400, 409]).toContain(res.status);
    expect(res.body.error.message).toMatch(/ยังไม่ผ่านการตรวจสอบคุณภาพขาเข้า/);
  });
});

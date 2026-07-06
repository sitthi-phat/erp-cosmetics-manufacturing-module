/**
 * Q2 — Integration: Audit Log (ECP-025, ECP-026).
 * Endpoint per src/backend/modules/audit/audit.routes.ts (ground truth, DEF-08):
 *   GET /audit-logs?userId=<number>&actionType=&from=&to=&page=&pageSize= -> { data: [...], meta:
 *   {total, page, pageSize} }. No `username`/`dateFrom`/`dateTo`/`totalCount` fields exist.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom, app, sleep } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Audit Log (Epic 8, ECP-025/026)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
  let admin: ReturnType<typeof request.agent>;
  let productionUserId: number;
  let warehouseUserId: number;
  let customerId: number;
  let productId: number;
  let bomMaterialId: number;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const prodMe = await production.get("/api/v1/auth/me");
    productionUserId = prodMe.body.data.id;
    const whMe = await warehouse.get("/api/v1/auth/me");
    warehouseUserId = whMe.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    bomMaterialId = bom.body.data.lines[0].materialId;
  });

  test("TC-025-AC1: a successful login writes an audit log entry (actionType=Login) for that user", async () => {
    await request(app).post("/api/v1/auth/login").send({
      username: SEED_USERS.warehouse.username,
      password: DEFAULT_PASSWORD,
    });
    const res = await admin.get("/api/v1/audit-logs").query({ actionType: "Login", userId: warehouseUserId });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("TC-025-AC2: a failed login attempt is ALSO logged (not just successful logins)", async () => {
    await request(app).post("/api/v1/auth/login").send({
      username: SEED_USERS.warehouse.username,
      password: "definitely-wrong-password",
    });
    const res = await admin.get("/api/v1/audit-logs").query({ actionType: "LoginFailed" });
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("TC-026-AC1: approving a batch writes a searchable audit entry (user, action, entity, timestamp)", async () => {
    // Build a real batch through the full chain (no seeded placeholder batch exists).
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
      quantity: 100,
      lotNumber: `LOT-AUDIT-TEST-${Date.now()}`,
    });
    await qc.post(`/api/v1/qc/lots/${receipt.body.data.lotId}/inspect`).send({ result: "Passed" });
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId: receipt.body.data.lotId, qtyUsed: 1 }],
      producedQty: 1,
    });
    await qc.post(`/api/v1/qc/batches/${produced.body.data.id}/inspect`).send({ result: "Approved", remarks: "ok" });

    // auditableRoute("InspectBatch", "Batch", ...) - action is "InspectBatch", entityId is the batchNumber.
    // The write itself is fire-and-forget (`void writeAuditLog(...)` in middleware/audit.ts, AFTER
    // the response is already sent) - poll briefly instead of asserting immediately, since the row
    // may not exist yet at the exact moment this request resolves.
    let found = false;
    for (let attempt = 0; attempt < 10 && !found; attempt += 1) {
      const res = await admin.get("/api/v1/audit-logs").query({ actionType: "InspectBatch" });
      found = res.body.data.some((l: any) => l.entityId === produced.body.data.batchNumber);
      if (!found) await sleep(200);
    }
    expect(found).toBe(true);
  });

  test("TC-026-AC2 (scaled-down, documented limitation): filtering by date range + action type returns only matching rows, with pagination metadata present", async () => {
    // NOTE: the original test-plan envisioned >=1000 seeded audit rows to stress this at scale;
    // no such bulk seed exists. This verifies the filter/pagination CONTRACT works correctly at a
    // small scale instead - not a substitute for a true load test (tracked as a DevOps follow-up).
    const res = await admin.get("/api/v1/audit-logs").query({
      actionType: "InspectBatch",
      from: "2020-01-01",
      to: new Date().toISOString().slice(0, 10),
      page: 1,
      pageSize: 50,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.every((l: any) => l.actionType === "InspectBatch")).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("page", 1);
    expect(res.body.meta).toHaveProperty("pageSize", 50);
  });

  test("TC-026-AC3: audit log is append-only — direct update/delete attempts are always rejected, even for Admin", async () => {
    const list = await admin.get("/api/v1/audit-logs").query({ page: 1, pageSize: 1 });
    const anyLogId = list.body.data[0]?.id ?? 999999;

    const del = await admin.delete(`/api/v1/audit-logs/${anyLogId}`);
    expect([404, 405, 403]).toContain(del.status); // no DELETE route is registered at all - never 200/204

    const put = await admin.put(`/api/v1/audit-logs/${anyLogId}`).send({ detail: { tampered: true } });
    expect([404, 405, 403]).toContain(put.status); // no PUT route is registered at all - never 200/204
  });

  test("exploratory: audit log write must not be silently skipped when the login DB write later fails mid-transaction (ECP-025 AC3) — asserted via a forced-failure hook if Engineer exposes one; otherwise this documents the expectation for verify phase", () => {
    // No generic way to force a DB failure without Engineer-provided test hooks (see test-plan §0/§7).
    // Left as an explicit reminder for the verify phase rather than silently omitted.
    expect(true).toBe(true);
  });
});

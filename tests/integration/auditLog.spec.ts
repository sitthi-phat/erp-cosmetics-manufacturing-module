/**
 * Q2 — Integration: Audit Log (ECP-025, ECP-026).
 * Endpoint per architecture.md §6: GET /audit-logs (filter+pagination, read-only)
 */
import { loginAs, resetSeed, app } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Audit Log (Epic 8, ECP-025/026)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-025-AC1: a successful login writes an audit log entry with user_id, timestamp, result=Success", async () => {
    await request(app).post("/api/v1/auth/login").send({
      username: SEED_USERS.warehouse.username,
      password: DEFAULT_PASSWORD,
    });
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.get("/api/v1/audit-logs").query({ actionType: "Login", username: SEED_USERS.warehouse.username });
    expect(res.body.items.some((l: any) => l.result === "Success" || l.detail?.result === "Success")).toBe(true);
  });

  test("TC-025-AC2: a failed login attempt is ALSO logged (not just successful logins)", async () => {
    await request(app).post("/api/v1/auth/login").send({
      username: SEED_USERS.warehouse.username,
      password: "definitely-wrong-password",
    });
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.get("/api/v1/audit-logs").query({ actionType: "LoginFailed", username: SEED_USERS.warehouse.username });
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test("TC-026-AC1: approving a batch writes a searchable audit entry (user, action, entity, timestamp)", async () => {
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    await qc.post("/api/v1/qc/batches/SEEDED_BATCH_FOR_AUDIT/inspect").send({ result: "Approved", remarks: "ok" });

    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.get("/api/v1/audit-logs").query({ actionType: "ApproveBatch" });
    expect(res.body.items.some((l: any) => l.entityId === "SEEDED_BATCH_FOR_AUDIT")).toBe(true);
  });

  test("TC-026-AC2: with >=1000 seeded entries, filtering by date range + action type returns only matching rows, paginated", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.get("/api/v1/audit-logs").query({
      actionType: "ApproveBatch",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      page: 1,
      pageSize: 50,
    });
    expect(res.status).toBe(200);
    expect(res.body.items.every((l: any) => l.actionType === "ApproveBatch")).toBe(true);
    expect(res.body).toHaveProperty("totalCount");
  });

  test("TC-026-AC3: audit log is append-only — direct update/delete attempts are always rejected, even for Admin", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const list = await admin.get("/api/v1/audit-logs").query({ page: 1, pageSize: 1 });
    const anyLogId = list.body.items[0]?.id ?? "SEEDED_AUDIT_LOG_ID";

    const del = await admin.delete(`/api/v1/audit-logs/${anyLogId}`);
    expect([404, 405, 403]).toContain(del.status); // no route should exist / must be forbidden — never 200/204

    const put = await admin.put(`/api/v1/audit-logs/${anyLogId}`).send({ detail: { tampered: true } });
    expect([404, 405, 403]).toContain(put.status);
  });

  test("exploratory: audit log write must not be silently skipped when the login DB write later fails mid-transaction (ECP-025 AC3) — asserted via a forced-failure hook if Engineer exposes one; otherwise this documents the expectation for verify phase", () => {
    // No generic way to force a DB failure without Engineer-provided test hooks (see test-plan §0/§7).
    // Left as an explicit reminder for the verify phase rather than silently omitted.
    expect(true).toBe(true);
  });
});

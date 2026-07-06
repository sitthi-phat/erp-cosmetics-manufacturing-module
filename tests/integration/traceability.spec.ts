/**
 * Q2/Q4 — Integration: Traceability lookup (ECP-014, NFR N3 — ≤5 minutes / N3 indexing).
 * Endpoint per architecture.md §6: GET /trace?lot=...
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("Traceability (Epic 4, ECP-014)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-014-AC1: full chain lot -> batch -> finished goods -> PO resolves within 5 minutes (measured well under in an automated run)", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const start = Date.now();
    const res = await wh.get("/api/v1/trace").query({ lot: "L2026-001" });
    const elapsedMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsedMs).toBeLessThan(5 * 60 * 1000); // NFR N3 / ECP-014 AC1 ceiling
    // In an automated integration test this should realistically be near-instant (<2s);
    // assert a much tighter internal SLA too, to catch performance regressions early:
    expect(elapsedMs).toBeLessThan(3000);
    expect(res.body.batches?.length).toBeGreaterThan(0);
    expect(res.body.finishedGoods?.length).toBeGreaterThan(0);
    expect(res.body.relatedPOs?.length).toBeGreaterThan(0);
  });

  test("TC-014-AC2: a lot reused across multiple batches returns ALL batches, not just the most recent", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ lot: "L2026-REUSED" });
    expect(res.status).toBe(200);
    expect(res.body.batches.length).toBeGreaterThanOrEqual(2);
  });

  test("TC-014-AC3: a non-existent lot number returns a clear message, not a blank page", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ lot: "L-DOES-NOT-EXIST-999" });
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/ไม่พบ Lot นี้/);
  });

  test("RBAC: role without traceability.view (e.g. Sales/CS) is denied", async () => {
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const res = await sales.get("/api/v1/trace").query({ lot: "L2026-001" });
    expect(res.status).toBe(403);
  });

  test("NFR N3: lookup stays fast even with a large audit/transaction history (seed >= 1000 stock transactions)", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const start = Date.now();
    const res = await wh.get("/api/v1/trace").query({ lot: "L2026-HEAVY-HISTORY" });
    expect(Date.now() - start).toBeLessThan(3000);
    expect(res.status).toBe(200);
  });
});

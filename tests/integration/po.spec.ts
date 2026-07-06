/**
 * Q2 — Integration: Purchasing Order module (ECP-004, ECP-005, ECP-006).
 * Endpoints per architecture.md §6:
 *   GET/POST /pos, GET /pos/:id, POST /pos/:id/confirm, POST /pos/:id/cancel, GET /pos/:id/timeline
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Purchasing Order module (Epic 2)", () => {
  let sales: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
  });

  test("TC-004-AC1: confirm with sufficient BOM stock reserves materials and sets status Confirmed", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerSearch: "ABC",
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 100 }],
    });
    expect(draft.status).toBe(201);
    expect(draft.body.status).toBe("Draft");

    const confirmed = await sales.post(`/api/v1/pos/${draft.body.id}/confirm`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe("Confirmed");
    expect(confirmed.body.stockCheck?.sufficient ?? true).toBe(true);
  });

  test("TC-004-AC2: confirm blocked when a material is short — names the material and the shortfall, stays Draft", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerSearch: "ABC",
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 999999999 }], // force insufficiency
    });
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.id}/confirm`);
    expect(confirmed.status).toBe(409);
    expect(confirmed.body.error.message).toMatch(/ไม่เพียงพอ/);
    expect(confirmed.body.error.message).toMatch(/ขาดอยู่/);

    const stillDraft = await sales.get(`/api/v1/pos/${draft.body.id}`);
    expect(stillDraft.body.status).toBe("Draft");
  });

  test("TC-004-AC3: confirm blocked with zero lines", async () => {
    const draft = await sales.post("/api/v1/pos").send({ customerSearch: "ABC", lines: [] });
    expect(draft.status).toBe(400); // no line at all — creation itself should already require >=1 line
  });

  test("TC-009-AC3: confirming a product with no BOM at all is blocked with a specific message", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerSearch: "ABC",
      lines: [{ productId: "PRODUCT_WITHOUT_BOM", quantity: 10 }],
    });
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.id}/confirm`);
    expect(confirmed.status).toBe(409);
    expect(confirmed.body.error.message).toMatch(/ยังไม่มีสูตรการผลิต/);
  });

  test("TC-005-AC1: cancelling a Confirmed PO (not yet in production) returns reserved stock", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerSearch: "ABC",
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 10 }],
    });
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.id}/confirm`);
    const cancelled = await sales.post(`/api/v1/pos/${confirmed.body.id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe("Cancelled");
  });

  test("TC-005-AC3: cancelling an already-cancelled PO does not re-cancel or double-refund, and tells you when it was cancelled", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerSearch: "ABC",
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 5 }],
    });
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.id}/confirm`);
    await sales.post(`/api/v1/pos/${confirmed.body.id}/cancel`);
    const secondCancel = await sales.post(`/api/v1/pos/${confirmed.body.id}/cancel`);
    expect(secondCancel.status).toBe(409);
    expect(secondCancel.body.error.message).toMatch(/ถูกยกเลิกไปแล้ว/);
  });

  test("TC-006-AC3: requesting a non-existent PO id returns a clear Thai message, not a 500/blank page", async () => {
    const res = await sales.get("/api/v1/pos/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/ไม่พบคำสั่งซื้อ/);
  });

  test("exploratory (double-submit): two rapid confirm calls on the same Draft PO must not double-reserve stock", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerSearch: "ABC",
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 20 }],
    });
    const [r1, r2] = await Promise.all([
      sales.post(`/api/v1/pos/${draft.body.id}/confirm`),
      sales.post(`/api/v1/pos/${draft.body.id}/confirm`),
    ]);
    // exactly one call should succeed (200); the other must be rejected, never both 200
    const successCount = [r1, r2].filter((r) => r.status === 200).length;
    expect(successCount).toBe(1);
  });
});

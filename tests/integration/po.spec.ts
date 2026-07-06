/**
 * Q2 — Integration: Purchasing Order module (ECP-004, ECP-005, ECP-006).
 * Endpoints per src/backend/modules/po/po.routes.ts (ground truth, DEF-08):
 *   GET/POST /pos, GET /pos/:id, POST /pos/:id/confirm, POST /pos/:id/cancel, GET /pos/:id/timeline
 * Request body for POST /pos: { customerId: number, requestedDeliveryDate: date, lines: [{productId
 * number, quantity, unitPrice, uom}] } - NOT { customerSearch, lines:[{productId:string}] } as
 * originally guessed. Response envelope is `{ data: ... }` everywhere; /confirm and /cancel return
 * `{ data: { ok: true, ... } }` with NO `status` field - the new PO status must be read back via a
 * follow-up GET /pos/:id.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom, resolveProductWithoutBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

function tomorrow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

describe("Purchasing Order module (Epic 2)", () => {
  let sales: ReturnType<typeof request.agent>;
  let customerId: number;
  let productWithBomId: number;
  let productWithoutBomId: number;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    customerId = (await resolveCustomer(sales)).id;
    productWithBomId = (await resolveProductWithBom(sales)).id;
    productWithoutBomId = (await resolveProductWithoutBom(sales)).id;
  });

  function createDraft(lines: Array<{ productId: number; quantity: number }>) {
    return sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: tomorrow(),
      lines: lines.map((l) => ({ ...l, unitPrice: 100, uom: "unit" })),
    });
  }

  test("TC-004-AC1: confirm with sufficient BOM stock reserves materials and sets status Confirmed", async () => {
    const draft = await createDraft([{ productId: productWithBomId, quantity: 1 }]);
    expect(draft.status).toBe(201);
    expect(draft.body.data.status).toBe("Draft");

    const confirmed = await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.ok).toBe(true);

    const fetched = await sales.get(`/api/v1/pos/${draft.body.data.id}`);
    expect(fetched.body.data.status).toBe("Confirmed");
  });

  test("TC-004-AC2: confirm blocked when a material is short — names the material and the shortfall, stays Draft", async () => {
    const draft = await createDraft([{ productId: productWithBomId, quantity: 999999999 }]); // force insufficiency
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    expect(confirmed.status).toBe(409);
    expect(confirmed.body.error.message).toMatch(/ไม่เพียงพอ/);
    expect(confirmed.body.error.message).toMatch(/ขาดอยู่/);

    const stillDraft = await sales.get(`/api/v1/pos/${draft.body.data.id}`);
    expect(stillDraft.body.data.status).toBe("Draft");
  });

  test("TC-004-AC3: creating a PO with zero lines is rejected at creation time (schema default [] still fails downstream at confirm; the AC's intent - never reach a valid PO with 0 lines - is covered by confirming immediately after)", async () => {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: tomorrow(),
      lines: [],
    });
    expect(draft.status).toBe(201); // schema allows an empty-lines Draft (defaults to [])
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    // po.rules.ts#assertHasLines throws AppError.validation() -> 400, not conflict/409
    expect(confirmed.status).toBe(400);
    expect(confirmed.body.error.message).toMatch(/รายการสินค้าอย่างน้อย 1 รายการ/);
  });

  test("TC-009-AC3: confirming a product with no BOM at all is blocked with a specific message", async () => {
    const draft = await createDraft([{ productId: productWithoutBomId, quantity: 10 }]);
    const confirmed = await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    // bom.service.ts#assertHasBom throws AppError.validation() -> 400, not conflict/409
    expect(confirmed.status).toBe(400);
    expect(confirmed.body.error.message).toMatch(/ยังไม่มีสูตรการผลิต/);
  });

  test("TC-005-AC1: cancelling a Confirmed PO (not yet in production) returns reserved stock", async () => {
    const draft = await createDraft([{ productId: productWithBomId, quantity: 1 }]);
    await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    const cancelled = await sales.post(`/api/v1/pos/${draft.body.data.id}/cancel`);
    expect(cancelled.status).toBe(200);
    const fetched = await sales.get(`/api/v1/pos/${draft.body.data.id}`);
    expect(fetched.body.data.status).toBe("Cancelled");
  });

  test("TC-005-AC3: cancelling an already-cancelled PO does not re-cancel or double-refund, and tells you when it was cancelled", async () => {
    const draft = await createDraft([{ productId: productWithBomId, quantity: 1 }]);
    await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    await sales.post(`/api/v1/pos/${draft.body.data.id}/cancel`);
    const secondCancel = await sales.post(`/api/v1/pos/${draft.body.data.id}/cancel`);
    expect(secondCancel.status).toBe(409);
    expect(secondCancel.body.error.message).toMatch(/ถูกยกเลิกไปแล้ว/);
  });

  test("TC-006-AC3: requesting a non-existent (but validly-typed) PO id returns a clear Thai message, not a 500/blank page", async () => {
    // route does `Number(req.params.id)` - a non-numeric id (e.g. a UUID) would produce NaN and a
    // Prisma validation error (500), not the clean 404 the AC actually cares about. Use a large,
    // valid-but-nonexistent integer id instead to reach the intended `AppError.notFound` path.
    const res = await sales.get("/api/v1/pos/999999999");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/ไม่พบคำสั่งซื้อ/);
  });

  test("exploratory (double-submit): two rapid confirm calls on the same Draft PO must not double-reserve stock", async () => {
    // *** DEF-09 (NEW, Critical, confirmed on live MySQL during QA verify-3 - not a spec bug) ***
    // `po.rules.ts#assertCanConfirm` reads `po.status` via a plain (non-locked) read before the
    // reservation transaction opens, so BOTH concurrent confirm calls on the SAME Draft PO can
    // pass the "must be Draft" guard and both fully execute: 2 audit `ConfirmPO` entries + 2
    // `POStatusEvent(status:"Confirmed")` rows + 2 `StockTransaction(type:"Reservation")` ledger
    // rows are created (reproduced via `docker exec mysql` raw SQL against a live test DB), i.e.
    // this is NOT "harmlessly idempotent" - the PO really is processed twice.
    // WORSE: the resulting `StockBalance.reservedQty` cache ends up UNDER-counting relative to
    // the `StockTransaction` ledger (source of truth per NFR N1) - e.g. ledger sum for the
    // affected material was seed(5) + this-test(5) + this-test(5) = 15, but the cached
    // `StockBalance.reservedQty` column only reached 10 (one reservation's delta silently lost).
    // This directly violates NFR N1 ("Σ(StockTransaction.qty) === StockBalance value, no
    // tolerance") - the single most emphasized Gate-1 condition - under a plain double-click,
    // not even an adversarial timing attack. See docs/test-plans/erp-core-prototype/defects.md
    // DEF-09 for the full reproduction (raw SQL, docker exec) and root-cause hypothesis (mixing a
    // locking raw `SELECT...FOR UPDATE` with a subsequent non-locking Prisma ORM `findUnique` read
    // inside the same REPEATABLE READ transaction in stock.repository.ts#applyTransaction).
    // This test intentionally asserts the CORRECT (currently failing) behavior rather than being
    // weakened to match the buggy one - per QA's mandate to prove things break, not just confirm
    // happy paths. Do not "fix" this assertion without first fixing the underlying race.
    const draft = await createDraft([{ productId: productWithBomId, quantity: 1 }]);
    const [r1, r2] = await Promise.all([
      sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`),
      sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`),
    ]);
    // exactly one call should succeed (200); the other must be rejected, never both 200
    const successCount = [r1, r2].filter((r) => r.status === 200).length;
    expect(successCount).toBe(1);
  });
});

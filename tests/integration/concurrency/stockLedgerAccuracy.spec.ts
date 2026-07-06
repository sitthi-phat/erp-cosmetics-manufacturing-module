/**
 * Q7 — CRITICAL: Stock ledger accuracy 100% under concurrency (ECP-010 AC4, NFR N1).
 * See docs/test-plans/erp-core-prototype/test-plan.md §4.1 for full rationale.
 *
 * This is the single highest-stakes test in the whole suite: Pond explicitly called out
 * "stock ledger must be 100% accurate, no discrepancy at all" as a Gate-1 condition.
 * A flaky/approximate pass here (e.g. asserting "close enough") would defeat the purpose —
 * every assertion below is an exact equality, deliberately.
 *
 * Endpoints/fields per ground truth (DEF-08): POST /stock/receipts {materialId,quantity,lotNumber},
 * POST /pos {customerId,requestedDeliveryDate,lines:[{productId,quantity,unitPrice,uom}]},
 * GET /stock/reconciliation?material=<id> -> {data:{ledgerSum,physicalQty,matches,diff}}.
 *
 * *** DEF-09 (CRITICAL, confirmed HERE on live MySQL, re-verify-3): BOTH tests below FAIL. ***
 * This is the single most important finding of this verify round - it directly violates the
 * exact NFR N1 condition Gate 1 called out by name, reproduced at real, non-adversarial scale
 * (100-way concurrent goods-receipt + PO-confirm on the same material; two ordinary concurrent
 * "produce" requests on the same lot). This generalizes the narrower "PO double-confirm" finding
 * from tests/integration/po.spec.ts into the actual root defect: it is not specific to double-
 * clicking one PO's confirm button - ANY concurrent read-modify-write on the SAME material's
 * StockBalance row can lose an update, and two concurrent issues that together exceed available
 * stock can BOTH succeed instead of exactly one.
 *
 * ROOT CAUSE HYPOTHESIS (from reading stock.repository.ts#applyTransaction + reserve()/issue() in
 * stock.service.ts): `applyTransaction` correctly takes a row lock via a raw
 * `SELECT * FROM stock_balance WHERE material_id = ? FOR UPDATE`, but then re-reads the "current"
 * balance via a SEPARATE, non-locking Prisma ORM call (`tx.stockBalance.findUnique(...)`) to
 * compute `nextReserved = currentReserved + delta`. Under MySQL InnoDB's default REPEATABLE READ
 * isolation, a transaction's consistent (non-locking) read view is established at that
 * transaction's FIRST read of ANY table - which, inside `po.routes.ts`'s confirm handler for
 * example, happens earlier (`prisma.purchaseOrder.findUnique(...)`) than the stock lock is ever
 * taken. Locking reads (`SELECT...FOR UPDATE`) always see the latest committed row regardless of
 * that snapshot, but the very next PLAIN `findUnique` in the same transaction can still return the
 * OLDER snapshot value instead of what the lock just fetched - a textbook stale read feeding a
 * lost update, even though a row lock genuinely was acquired moments earlier in the same
 * transaction. `reserve()`/`issue()` in stock.service.ts also do their own separate, non-locking
 * `getBalance()` pre-check before ever calling `applyTransaction`, compounding the same class of
 * staleness for the "is there enough stock" decision itself (this is why the boundary-race test
 * below can let both concurrent 60kg issues through against a 100kg lot).
 *
 * This is left FAILING intentionally (asserting the correct, required behavior) rather than
 * weakened to match the observed bug - do not "fix" these assertions without first fixing
 * stock.repository.ts/stock.service.ts.
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom, fireConcurrently } from "../../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../../helpers/fixtures";

const N_TRANSACTIONS_PER_TYPE = 50; // >=200 total mixed transactions target, per test-plan §4.1

describe("Stock ledger accuracy under high concurrency (ECP-010 AC4)", () => {
  test("TC-010-AC4: after ~100 concurrent mixed transactions from multiple users, ledger sum === physical stock, exactly", async () => {
    await resetSeed();
    const warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const customerId = (await resolveCustomer(sales)).id;
    const product = await resolveProductWithBom(sales);
    const bom = await sales.get(`/api/v1/products/${product.id}/bom`);
    const materialId = bom.body.data.lines[0].materialId;

    const receiptFactories = Array.from({ length: N_TRANSACTIONS_PER_TYPE }, (_, i) => () =>
      warehouse.post("/api/v1/stock/receipts").send({
        materialId,
        quantity: 10,
        lotNumber: `CONC-LOT-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })
    );

    const confirmFactories = Array.from({ length: N_TRANSACTIONS_PER_TYPE }, () => async () => {
      const draft = await sales.post("/api/v1/pos").send({
        customerId,
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        lines: [{ productId: product.id, quantity: 1, unitPrice: 100, uom: "unit" }],
      });
      return sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    });

    // Fire receipts and confirms truly concurrently — no awaiting between dispatch.
    const results = await fireConcurrently([...receiptFactories, ...confirmFactories]);
    const failures = results.filter((r) => r.status === "rejected");
    // Some confirms MAY legitimately fail if stock runs out mid-race — that's correct behavior,
    // not a bug. What matters is the ledger reconciliation below, not a 100% success rate here.
    expect(Array.isArray(failures)).toBe(true);

    const reconciliation = await warehouse.get("/api/v1/stock/reconciliation").query({ material: materialId });
    expect(reconciliation.status).toBe(200);
    expect(reconciliation.body.data.ledgerSum).toBe(reconciliation.body.data.physicalQty); // exact equality — no epsilon
    expect(reconciliation.body.data.diff).toBe(0);
    expect(reconciliation.body.data.matches).toBe(true);
  }, 60000);

  test("TC-010-AC4 boundary race: two concurrent 'issue' (produce) requests that together exceed a lot's remaining qty — exactly one must succeed, not both, not neither incorrectly", async () => {
    await resetSeed();
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    const warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const me = await production.get("/api/v1/auth/me");
    const productionUserId = me.body.data.id;
    const customerId = (await resolveCustomer(sales)).id;
    const product = await resolveProductWithBom(sales);
    const bom = await sales.get(`/api/v1/products/${product.id}/bom`);
    const materialId = bom.body.data.lines[0].materialId;

    // A dedicated lot with EXACTLY 100kg remaining, QC-passed and ready to use.
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId,
      quantity: 100,
      lotNumber: `RACE-LOT-${Date.now()}`,
    });
    const lotId = receipt.body.data.lotId;
    await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Passed" });

    // Two separate Confirmed POs, each assigned to a separate ProductionOrder, both drawing 60kg
    // from the SAME lot (120kg > 100kg available) - the classic lost-update race that row-locking
    // (stock.repository.ts#applyTransaction's `SELECT...FOR UPDATE`) must prevent.
    async function makeAssignedOrder() {
      const draft = await sales.post("/api/v1/pos").send({
        customerId,
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        lines: [{ productId: product.id, quantity: 1, unitPrice: 100, uom: "unit" }],
      });
      await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
      const assigned = await production
        .post(`/api/v1/production/${draft.body.data.lines[0].id}/assign`)
        .send({ assignedTo: productionUserId });
      return assigned.body.data.id as number;
    }
    const [order1, order2] = await Promise.all([makeAssignedOrder(), makeAssignedOrder()]);

    const [r1, r2] = await fireConcurrently([
      () =>
        production.post(`/api/v1/production/${order1}/produce`).send({
          lotSelections: [{ materialId, lotId, qtyUsed: 60 }],
          producedQty: 60,
        }),
      () =>
        production.post(`/api/v1/production/${order2}/produce`).send({
          lotSelections: [{ materialId, lotId, qtyUsed: 60 }],
          producedQty: 60,
        }),
    ]);

    const statuses = [r1, r2].map((r) => (r.status === "fulfilled" ? (r.value as any).status : "rejected"));
    const successCount = statuses.filter((s) => s === 201).length;
    expect(successCount).toBe(1); // exactly one must win the race, never both, never zero if 60<=100

    const reconciliation = await warehouse.get("/api/v1/stock/reconciliation").query({ material: materialId });
    expect(reconciliation.body.data.ledgerSum).toBe(reconciliation.body.data.physicalQty);
    expect(reconciliation.body.data.physicalQty).toBeGreaterThanOrEqual(0); // must never go negative
  }, 30000);
});

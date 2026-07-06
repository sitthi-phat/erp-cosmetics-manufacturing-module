/**
 * Q2/Q4 — Integration: Traceability lookup (ECP-014, NFR N3 - <=5 minutes / N3 indexing).
 * Endpoint per src/backend/modules/stock/trace.routes.ts (ground truth, DEF-08): GET /trace?lot=...
 * Response envelope: `{ data: [{lotId, lotNumber, materialName, batches: [...]}] }` (an array, one
 * entry per Lot row matching that lot number - NOT a flat `{batches, finishedGoods, relatedPOs}`
 * object). Seed lot numbers follow the pattern `L-SEED-<materialId>` (prisma/seed.ts), not
 * `L2026-001`/`L2026-REUSED`/etc placeholders which do not exist in the real seed data.
 */
import { loginAs, resetSeed, resolveCustomer, resolveMaterials, resolveProductWithBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("Traceability (Epic 4, ECP-014)", () => {
  let materialId: number;
  let seedLotNumber: string;

  beforeAll(async () => {
    await resetSeed();
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const materials = await resolveMaterials(wh);
    materialId = materials[0].id;
    seedLotNumber = `L-SEED-${materialId}`; // matches prisma/seed.ts's naming convention exactly
  });

  test("TC-014-AC1: full chain lot -> batch -> finished goods -> PO resolves within 5 minutes (measured well under in an automated run)", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const start = Date.now();
    const res = await wh.get("/api/v1/trace").query({ lot: seedLotNumber });
    const elapsedMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsedMs).toBeLessThan(5 * 60 * 1000); // NFR N3 / ECP-014 AC1 ceiling
    expect(elapsedMs).toBeLessThan(3000); // tighter internal SLA for an automated run
    expect(Array.isArray(res.body.data)).toBe(true);
    const entry = res.body.data.find((l: any) => l.lotNumber === seedLotNumber);
    expect(entry).toBeDefined();
    expect(entry.batches.length).toBeGreaterThan(0); // this lot fed the seed's happy-path batch
    expect(entry.batches[0].po).toBeTruthy(); // batch -> PO chain resolved
  });

  test("TC-014-AC2: a lot reused across multiple batches returns ALL batches, not just the most recent", async () => {
    // Build a real reused-lot scenario (not present in the base seed): receive one fresh lot,
    // pass its incoming QC, then produce TWO separate batches drawing from that same lot.
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    const warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const me = await production.get("/api/v1/auth/me");
    const productionUserId = me.body.data.id;
    const customerId = (await resolveCustomer(sales)).id;
    const productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    const bomMaterialId = bom.body.data.lines[0].materialId;

    const reusedLotNumber = `L-REUSE-TEST-${Date.now()}`;
    const receipt = await warehouse
      .post("/api/v1/stock/receipts")
      .send({ materialId: bomMaterialId, quantity: 100, lotNumber: reusedLotNumber });
    const reusedLotId = receipt.body.data.lotId;
    await qc.post(`/api/v1/qc/lots/${reusedLotId}/inspect`).send({ result: "Passed" });

    async function produceOneBatch() {
      const draft = await sales.post("/api/v1/pos").send({
        customerId,
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        lines: [{ productId, quantity: 1, unitPrice: 100, uom: "unit" }],
      });
      await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
      const poLineId = draft.body.data.lines[0].id;
      const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
      await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
        lotSelections: [{ materialId: bomMaterialId, lotId: reusedLotId, qtyUsed: 5 }],
        producedQty: 10,
      });
    }
    await produceOneBatch();
    await produceOneBatch();

    const wh = warehouse;
    const res = await wh.get("/api/v1/trace").query({ lot: reusedLotNumber });
    expect(res.status).toBe(200);
    const entry = res.body.data.find((l: any) => l.lotNumber === reusedLotNumber);
    expect(entry.batches.length).toBeGreaterThanOrEqual(2);
  });

  test("TC-014-AC3: a non-existent lot number returns a clear message, not a blank page", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ lot: "L-DOES-NOT-EXIST-999" });
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/ไม่พบ Lot นี้/);
  });

  test("RBAC: role without traceability.view (e.g. Sales/CS) is denied", async () => {
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const res = await sales.get("/api/v1/trace").query({ lot: seedLotNumber });
    expect(res.status).toBe(403);
  });

  test("NFR N3 (scaled-down, documented limitation): lookup stays fast with a modest amount of extra stock-transaction history", async () => {
    // NOTE: the original test-plan envisioned seeding >=1000 StockTransaction rows to stress N3;
    // prisma/seed.ts does not create bulk data at that scale, and generating 1000 rows through the
    // real HTTP API in a single test would itself take much longer than the SLA being measured.
    // This creates a modest 20 extra receipts against the SAME material as a smoke check instead -
    // it is NOT a substitute for a true 1000+-row load test (that requires a dedicated seed/load
    // script from DevOps, tracked as a follow-up, not asserted as passing evidence for N3 at scale).
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    for (let i = 0; i < 20; i += 1) {
      await wh.post("/api/v1/stock/receipts").send({
        materialId,
        quantity: 1,
        lotNumber: `L-N3-FILLER-${Date.now()}-${i}`,
      });
    }
    const start = Date.now();
    const res = await wh.get("/api/v1/trace").query({ lot: seedLotNumber });
    expect(Date.now() - start).toBeLessThan(3000);
    expect(res.status).toBe(200);
  });
});

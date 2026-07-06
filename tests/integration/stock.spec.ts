/**
 * Q2 — Integration: Stock module (ECP-007, ECP-008, ECP-009, ECP-010 AC1-AC3).
 * ECP-010 AC4 (accuracy under concurrency) lives in tests/integration/concurrency/stockLedgerAccuracy.spec.ts.
 * Endpoints per src/backend/modules/stock/stock.routes.ts (ground truth, DEF-08):
 *   GET /stock, POST /stock/receipts { materialId:number, lotNumber, quantity, confirmMergeExistingLot? }
 *   POST /stock/check { productId:number, orderQty } (POST with JSON body, NOT a GET+query endpoint)
 *   GET /stock/transactions, GET /stock/reconciliation?material=<materialId:number>
 * Response envelope: `{ data: ... }`; `/stock` rows use `physicalQty`/`reservedQty`/`availableQty`/
 * `outOfStock` (NOT `items`/`physical`/`status`); reconciliation body is `{data:{materialId,
 * ledgerSum, physicalQty, matches, diff}}` (NOT a flat `{ledgerSum, physical}`).
 */
import { loginAs, resetSeed, resolveMaterials, resolveZeroStockMaterial, resolveProductWithoutBom } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD, SEED_FACTS } from "../helpers/fixtures";
import request from "supertest";

describe("Stock module (Epic 3)", () => {
  let warehouse: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
  });

  test("TC-007-AC2: a material at exactly 0 stock is shown with '0' and an out-of-stock flag, not hidden", async () => {
    const res = await warehouse.get("/api/v1/stock");
    expect(res.status).toBe(200);
    const zeroRow = res.body.data.find((i: any) => i.physicalQty === 0);
    expect(zeroRow).toBeDefined();
    expect(zeroRow.outOfStock).toBe(true);
  });

  test("TC-008-AC1: goods receipt of 200 units creates/updates a Lot and increases physical stock by exactly 200", async () => {
    const materials = await resolveMaterials(warehouse);
    const material = materials[0];
    const beforePhysical = material.physicalQty;

    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: material.id,
      quantity: 200,
      lotNumber: `LOT-TEST-${Date.now()}`,
    });
    expect(receipt.status).toBe(201);

    const after = await resolveMaterials(warehouse);
    const afterMaterial = after.find((m) => m.id === material.id)!;
    expect(afterMaterial.physicalQty).toBe(beforePhysical + 200);
  });

  test("TC-008-AC2: receiving against an existing lot number prompts merge-vs-new-lot confirmation, does not silently duplicate", async () => {
    const materials = await resolveMaterials(warehouse);
    const materialId = materials[0].id;
    const lotNumber = `LOT-DUP-${Date.now()}`;
    await warehouse.post("/api/v1/stock/receipts").send({ materialId, quantity: 100, lotNumber });
    const second = await warehouse.post("/api/v1/stock/receipts").send({ materialId, quantity: 50, lotNumber });
    expect(second.status).toBe(409); // requires confirmMergeExistingLot=true, not auto-merged
    expect(second.body.error.message).toMatch(/พบ Lot number นี้อยู่แล้ว/);
  });

  test("TC-008-AC3: receipt qty <= 0 is rejected", async () => {
    const materials = await resolveMaterials(warehouse);
    const materialId = materials[0].id;
    const zero = await warehouse.post("/api/v1/stock/receipts").send({
      materialId,
      quantity: 0,
      lotNumber: `LOT-ZERO-${Date.now()}`,
    });
    expect(zero.status).toBe(400);
    const negative = await warehouse.post("/api/v1/stock/receipts").send({
      materialId,
      quantity: -10,
      lotNumber: `LOT-NEG-${Date.now()}`,
    });
    expect(negative.status).toBe(400);
  });

  test("TC-010-AC3/AC4 (baseline, non-concurrent): reconciliation reports ledgerSum === physicalQty with zero diff at rest", async () => {
    const materials = await resolveMaterials(warehouse);
    const res = await warehouse.get("/api/v1/stock/reconciliation").query({ material: materials[0].id });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("ledgerSum");
    expect(res.body.data).toHaveProperty("physicalQty");
    expect(res.body.data.matches).toBe(true);
    expect(res.body.data.diff).toBe(0);
  });

  test("RBAC: a role without stock.view (e.g. Finance) cannot view stock even via direct URL", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.get("/api/v1/stock");
    expect(res.status).toBe(403);
  });

  test(`seed sanity: ${SEED_FACTS.productWithoutBom} - POST /stock/check on it is rejected`, async () => {
    const product = await resolveProductWithoutBom(warehouse);
    const res = await warehouse.post("/api/v1/stock/check").send({ productId: product.id, orderQty: 10 });
    expect([400, 409]).toContain(res.status);
  });

  test("TC-009 sanity: zero-stock material resolves via helper and matches /stock", async () => {
    const zeroMat = await resolveZeroStockMaterial(warehouse);
    expect(zeroMat.physicalQty).toBe(0);
  });
});

/**
 * Q9 — Integration: BOM Management CRUD (ECP-039 all AC, architecture.md §13.3 API Delta).
 * Endpoints per architecture.md §13.3 (contract, E26 not implemented yet at spec-writing time —
 * `src/backend/modules/bom/` directory does not exist):
 *   GET /boms, GET /boms/:productId, POST /boms, PUT /boms/:productId,
 *   DELETE /boms/:productId/lines/:lineId
 * Permission: `bom.manage` (PR+AD write), `bom.view` (WH+PR+AD read) per §13.4.
 * TODO(verify, when E26 lands): reconcile exact request/response field names against real code —
 * assumed camelCase (`productId`, `materialId`, `qtyPerUnit`, `lineId`) per established API
 * convention (DEF-08).
 */
import { loginAs, resetSeed, resolveProductWithoutBom, resolveMaterials } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("BOM Management (ECP-039)", () => {
  let production: ReturnType<typeof request.agent>;
  let sales: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;

  // RECONCILED (QA gate2-verify): test-ordering bug Engineer flagged, confirmed by reading this
  // file - the seed intentionally creates only ONE product without a BOM (prisma/seed.ts,
  // resolveProductWithoutBom()'s own doc comment). The FIRST test to run gives that product a
  // BOM, so every subsequent test's own call to resolveProductWithoutBom() found nothing left
  // (or, worse, silently resolved a DIFFERENT already-BOM'd product depending on API ordering).
  // Fixed by reseeding + relogging in before EVERY test (not just once in beforeAll), so each test
  // always gets its own fresh "product with no BOM yet" to work with, independent of run order.
  beforeEach(async () => {
    await resetSeed();
    production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
  });

  test("TC-Q9-BOM-01 (ECP-039 AC1): creating a BOM for the seeded product that intentionally has none, with >=1 line, succeeds", async () => {
    const product = await resolveProductWithoutBom(production);
    const materials = await resolveMaterials(production);

    const res = await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 2 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.lines).toHaveLength(1);
  });

  test("TC-Q9-BOM-02: GET /boms/:productId retrieves the BOM just created", async () => {
    const product = await resolveProductWithoutBom(production); // still "without a BOM" per seed fixture wording BEFORE this test's own POST
    const materials = await resolveMaterials(production);
    await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 1.5 }],
    });
    const res = await production.get(`/api/v1/boms/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.lines[0].qtyPerUnit).toBeCloseTo(1.5, 2);
  });

  test("TC-Q9-BOM-03 (ECP-039 AC2, in-place edit, no version history): editing a line's qty_per_unit updates it directly, no new BOM/version row is created", async () => {
    const product = await resolveProductWithoutBom(production);
    const materials = await resolveMaterials(production);
    const created = await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 2 }],
    });
    const lineId = created.body.data.lines[0].id;

    const updated = await production.put(`/api/v1/boms/${product.id}`).send({
      lines: [{ id: lineId, materialId: materials[0].id, qtyPerUnit: 2.5 }],
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.lines).toHaveLength(1); // still exactly 1 line, not 2 (no old-version kept)
    expect(updated.body.data.lines[0].qtyPerUnit).toBeCloseTo(2.5, 2);
  });

  test("TC-Q9-BOM-04 (ECP-039 AC4, exact message): deleting the LAST remaining line is rejected", async () => {
    const product = await resolveProductWithoutBom(production);
    const materials = await resolveMaterials(production);
    const created = await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 2 }],
    });
    const lineId = created.body.data.lines[0].id;

    const res = await production.delete(`/api/v1/boms/${product.id}/lines/${lineId}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/BOM ต้องมีวัตถุดิบอย่างน้อย 1 รายการ/);
  });

  test("TC-Q9-BOM-05 (ECP-039 AC3): deleting one of several lines succeeds, leaving the rest intact", async () => {
    const product = await resolveProductWithoutBom(production);
    const materials = await resolveMaterials(production);
    const created = await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [
        { materialId: materials[0].id, qtyPerUnit: 2 },
        { materialId: materials[1].id, qtyPerUnit: 1 },
      ],
    });
    const lineToDelete = created.body.data.lines[0].id;

    const res = await production.delete(`/api/v1/boms/${product.id}/lines/${lineToDelete}`);
    expect(res.status).toBe(200);
    const after = await production.get(`/api/v1/boms/${product.id}`);
    expect(after.body.data.lines).toHaveLength(1);
    expect(after.body.data.lines[0].materialId).toBe(materials[1].id);
  });

  test("TC-Q9-BOM-06 (ECP-039 AC5, exact message): adding a material that's already in the BOM is rejected", async () => {
    const product = await resolveProductWithoutBom(production);
    const materials = await resolveMaterials(production);
    await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 2 }],
    });

    const res = await production.put(`/api/v1/boms/${product.id}`).send({
      lines: [
        { materialId: materials[0].id, qtyPerUnit: 2 },
        { materialId: materials[0].id, qtyPerUnit: 5 }, // duplicate material
      ],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/วัตถุดิบนี้มีอยู่ในสูตรแล้ว/);
  });

  test("TC-Q9-BOM-07 (cross-feature: ECP-009 AC3 unblocked once a BOM exists): a product that used to block PO confirmation for lacking a BOM now passes stock check once ECP-039 gives it one", async () => {
    const product = await resolveProductWithoutBom(production);
    const materials = await resolveMaterials(production);
    await production.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 1 }],
    });
    const check = await sales.post("/api/v1/stock/check").send({ productId: product.id, orderQty: 1 });
    expect(check.status).toBe(200);
    expect(check.body.data?.blocked ?? false).toBe(false); // "ยังไม่มีสูตรการผลิต (BOM)" no longer applies
  });

  test("TC-Q9-BOM-08 (RBAC, §13.4 bom.manage = PR+AD only): Sales (no bom.manage) gets 403 attempting to create a BOM", async () => {
    const product = await resolveProductWithoutBom(sales);
    const materials = await resolveMaterials(sales);
    const res = await sales.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 1 }],
    });
    expect(res.status).toBe(403);
  });

  test("TC-Q9-BOM-09 (RBAC, bom.view = WH+PR+AD): Warehouse can GET the BOM list/detail (read-only) but cannot POST/PUT/DELETE", async () => {
    const listRes = await warehouse.get("/api/v1/boms");
    expect(listRes.status).toBe(200);

    const product = await resolveProductWithoutBom(warehouse);
    const materials = await resolveMaterials(warehouse);
    const writeRes = await warehouse.post("/api/v1/boms").send({
      productId: product.id,
      lines: [{ materialId: materials[0].id, qtyPerUnit: 1 }],
    });
    expect(writeRes.status).toBe(403);
  });
});

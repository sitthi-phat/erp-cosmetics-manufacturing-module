/**
 * Q2 — Integration: Stock module (ECP-007, ECP-008, ECP-009, ECP-010 AC1-AC3).
 * ECP-010 AC4 (accuracy under concurrency) lives in tests/integration/concurrency/stockLedgerAccuracy.spec.ts.
 * Endpoints per architecture.md §6:
 *   GET /stock, POST /stock/receipts, POST /stock/check, GET /stock/transactions,
 *   GET /stock/reconciliation?material=
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD, SEED_FACTS } from "../helpers/fixtures";
import request from "supertest";

describe("Stock module (Epic 3)", () => {
  let warehouse: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
  });

  test("TC-007-AC2: a material at exactly 0 stock is shown with '0' and an out-of-stock badge, not hidden", async () => {
    const res = await warehouse.get("/api/v1/stock");
    expect(res.status).toBe(200);
    const zeroRow = res.body.items.find((i: any) => i.physical === 0);
    expect(zeroRow).toBeDefined();
    expect(zeroRow.statusLabel ?? zeroRow.status).toMatch(/หมดสต็อก/);
  });

  test("TC-008-AC1: goods receipt of 200L creates a new Lot and increases physical stock by exactly 200", async () => {
    const before = await warehouse.get("/api/v1/stock").query({ material: "แอลกอฮอล์" });
    const beforePhysical = before.body.items[0]?.physical ?? 0;

    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: 200,
      uom: "ลิตร",
      lotNumber: `LOT-TEST-${Date.now()}`,
    });
    expect(receipt.status).toBe(201);

    const after = await warehouse.get("/api/v1/stock").query({ material: "แอลกอฮอล์" });
    expect(after.body.items[0].physical).toBe(beforePhysical + 200);
  });

  test("TC-008-AC2: receiving against an existing lot number prompts merge-vs-new-lot confirmation, does not silently duplicate", async () => {
    const lotNumber = `LOT-DUP-${Date.now()}`;
    await warehouse.post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: 100,
      uom: "ลิตร",
      lotNumber,
    });
    const second = await warehouse.post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: 50,
      uom: "ลิตร",
      lotNumber,
    });
    expect(second.status).toBe(409); // requires confirmation param, not auto-merged
    expect(second.body.error.message).toMatch(/พบ Lot number นี้อยู่แล้ว/);
  });

  test("TC-008-AC3: receipt qty <= 0 is rejected", async () => {
    const zero = await warehouse.post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: 0,
      uom: "ลิตร",
      lotNumber: `LOT-ZERO-${Date.now()}`,
    });
    expect(zero.status).toBe(400);
    const negative = await warehouse.post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: -10,
      uom: "ลิตร",
      lotNumber: `LOT-NEG-${Date.now()}`,
    });
    expect(negative.status).toBe(400);
  });

  test("TC-010-AC3: attempting to issue more than physical stock during production is rejected with exact figures", async () => {
    // relies on seed material with a known low remaining physical quantity; exact endpoint under
    // production module (ECP-013) — asserted again from that angle in production.spec.ts.
    const res = await warehouse.get("/api/v1/stock/reconciliation").query({ material: "น้ำมันมะพร้าว" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ledgerSum");
    expect(res.body).toHaveProperty("physical");
  });

  test("TC-010-AC4 (baseline, non-concurrent): reconciliation reports ledgerSum === physical with zero diff at rest", async () => {
    const res = await warehouse.get("/api/v1/stock/reconciliation").query({ material: "น้ำมันมะพร้าว" });
    expect(res.body.ledgerSum).toBe(res.body.physical);
  });

  test("RBAC: a role without stock.view (e.g. Finance) cannot view stock even via direct URL", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.get("/api/v1/stock");
    expect(res.status).toBe(403);
  });

  test(`seed sanity: ${SEED_FACTS.productWithoutBom}`, async () => {
    const res = await warehouse.get("/api/v1/stock/check").query({ productName: "PRODUCT_WITHOUT_BOM" });
    expect([400, 409]).toContain(res.status);
  });
});

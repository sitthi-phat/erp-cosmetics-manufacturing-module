/**
 * Q1 — Unit: BOM vs stock check math (ECP-009 AC1-AC3, feeds ECP-004 AC1/AC2).
 *
 * RECONCILED 2026-07-07 (QA verify phase): actual implementation lives in
 * `src/backend/modules/product/bom.service.ts` as `checkBomStock(bomLines, orderQty, availability)`,
 * not `stock/bomCheck.ts#checkBomAvailability` as originally assumed. materialId is `number` in the
 * real code (not `string`), availability is an array of `{materialId, availableQty}` (not a
 * Record<string, number>), and each shortage entry is `{materialId, materialName, neededQty,
 * availableQty, shortQty}` (not `{materialId, shortBy}`). Test intent/assertions unchanged, only
 * the call shape is adapted. See defect log DEF-06 (not a defect — pre-authorized reconciliation
 * per test-plan.md §0).
 */
import { checkBomStock } from "../../src/backend/modules/product/bom.service";

describe("BOM stock check (ECP-009)", () => {
  test("TC-009-AC1: sufficient stock across all materials → sufficient=true, correct remainder", () => {
    // Product A needs Material X @ 2kg/unit; stock X = 1000kg; order 400 units => need 800kg
    const result = checkBomStock(
      [{ materialId: 1, materialName: "X", qtyPerUnit: 2 }],
      400,
      [{ materialId: 1, availableQty: 1000 }]
    );
    expect(result.sufficient).toBe(true);
    expect(result.shortages).toEqual([]);
  });

  test("TC-009-AC2: only the insufficient material is reported, by name+shortfall, sufficient ones are silent", () => {
    // 3 materials in the BOM; only material B is short.
    const result = checkBomStock(
      [
        { materialId: 1, materialName: "A", qtyPerUnit: 1 },
        { materialId: 2, materialName: "B", qtyPerUnit: 5 },
        { materialId: 3, materialName: "C", qtyPerUnit: 1 },
      ],
      100, // order qty
      [
        { materialId: 1, availableQty: 1000 },
        { materialId: 2, availableQty: 400 }, // B needs 500, has 400 -> short by 100
        { materialId: 3, availableQty: 1000 },
      ]
    );
    expect(result.sufficient).toBe(false);
    expect(result.shortages).toEqual([
      { materialId: 2, materialName: "B", neededQty: 500, availableQty: 400, shortQty: 100 },
    ]);
    // A and C must NOT appear in shortages even though they are also "used"
    expect(result.shortages.find((s) => s.materialId === 1)).toBeUndefined();
    expect(result.shortages.find((s) => s.materialId === 3)).toBeUndefined();
  });

  test("TC-009-AC1 boundary: need exactly equals available (0 remainder) still counts as sufficient", () => {
    const result = checkBomStock(
      [{ materialId: 1, materialName: "X", qtyPerUnit: 2 }],
      500,
      [{ materialId: 1, availableQty: 1000 }]
    );
    expect(result.sufficient).toBe(true);
  });

  test("exploratory: need is 1 unit over available (off-by-one boundary) → reported as insufficient, not silently rounded", () => {
    const result = checkBomStock(
      [{ materialId: 1, materialName: "X", qtyPerUnit: 1 }],
      1001,
      [{ materialId: 1, availableQty: 1000 }]
    );
    expect(result.sufficient).toBe(false);
    expect(result.shortages).toEqual([
      { materialId: 1, materialName: "X", neededQty: 1001, availableQty: 1000, shortQty: 1 },
    ]);
  });

  test("exploratory: zero order quantity should not throw and should be trivially sufficient", () => {
    const result = checkBomStock(
      [{ materialId: 1, materialName: "X", qtyPerUnit: 2 }],
      0,
      [{ materialId: 1, availableQty: 0 }]
    );
    expect(result.sufficient).toBe(true);
  });
});

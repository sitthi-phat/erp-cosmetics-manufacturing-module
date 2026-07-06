/**
 * Q1 — Unit: BOM vs stock check math (ECP-009 AC1-AC3, feeds ECP-004 AC1/AC2).
 *
 * ASSUMED API (Engineer/E9, module `src/backend/modules/stock/bomCheck.ts`):
 *   checkBomAvailability(bomLines: {materialId: string; qtyPerUnit: number}[],
 *                         orderQty: number,
 *                         availableByMaterial: Record<string, number>)
 *     => { sufficient: boolean; shortages: {materialId: string; shortBy: number}[] }
 *
 * If Engineer names this differently, only the import + call-site here need updating —
 * the test intent/assertions map 1:1 to the AC and should not change.
 */
import { checkBomAvailability } from "../../src/backend/modules/stock/bomCheck"; // TODO(Engineer): confirm path/signature

describe("BOM stock check (ECP-009)", () => {
  test("TC-009-AC1: sufficient stock across all materials → sufficient=true, correct remainder", () => {
    // Product A needs Material X @ 2kg/unit; stock X = 1000kg; order 400 units => need 800kg
    const result = checkBomAvailability(
      [{ materialId: "X", qtyPerUnit: 2 }],
      400,
      { X: 1000 }
    );
    expect(result.sufficient).toBe(true);
    expect(result.shortages).toEqual([]);
  });

  test("TC-009-AC2: only the insufficient material is reported, by name+shortfall, sufficient ones are silent", () => {
    // 3 materials in the BOM; only material B is short.
    const result = checkBomAvailability(
      [
        { materialId: "A", qtyPerUnit: 1 },
        { materialId: "B", qtyPerUnit: 5 },
        { materialId: "C", qtyPerUnit: 1 },
      ],
      100, // order qty
      { A: 1000, B: 400, C: 1000 } // B needs 500, has 400 -> short by 100
    );
    expect(result.sufficient).toBe(false);
    expect(result.shortages).toEqual([{ materialId: "B", shortBy: 100 }]);
    // A and C must NOT appear in shortages even though they are also "used"
    expect(result.shortages.find((s) => s.materialId === "A")).toBeUndefined();
    expect(result.shortages.find((s) => s.materialId === "C")).toBeUndefined();
  });

  test("TC-009-AC1 boundary: need exactly equals available (0 remainder) still counts as sufficient", () => {
    const result = checkBomAvailability([{ materialId: "X", qtyPerUnit: 2 }], 500, { X: 1000 });
    expect(result.sufficient).toBe(true);
  });

  test("exploratory: need is 1 unit over available (off-by-one boundary) → reported as insufficient, not silently rounded", () => {
    const result = checkBomAvailability([{ materialId: "X", qtyPerUnit: 1 }], 1001, { X: 1000 });
    expect(result.sufficient).toBe(false);
    expect(result.shortages).toEqual([{ materialId: "X", shortBy: 1 }]);
  });

  test("exploratory: zero order quantity should not throw and should be trivially sufficient", () => {
    const result = checkBomAvailability([{ materialId: "X", qtyPerUnit: 2 }], 0, { X: 0 });
    expect(result.sufficient).toBe(true);
  });
});

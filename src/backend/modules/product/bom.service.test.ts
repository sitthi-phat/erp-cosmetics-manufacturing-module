import { assertHasBom, checkBomStock } from "./bom.service";

describe("assertHasBom (ECP-009 AC3)", () => {
  it("throws when a product has no BOM at all", () => {
    expect(() => assertHasBom([])).toThrow(/ยังไม่มีสูตรการผลิต/);
    expect(() => assertHasBom(null)).toThrow();
    expect(() => assertHasBom(undefined)).toThrow();
  });

  it("does not throw when BOM lines exist", () => {
    expect(() => assertHasBom([{ materialId: 1, materialName: "X", qtyPerUnit: 2 }])).not.toThrow();
  });
});

describe("checkBomStock (ECP-009 AC1/AC2, ECP-004 AC1/AC2)", () => {
  it("reports sufficient when every material has enough (AC1 - 400 units of X needing 2/unit, 1000kg on hand)", () => {
    const result = checkBomStock(
      [{ materialId: 1, materialName: "X", qtyPerUnit: 2 }],
      400,
      [{ materialId: 1, availableQty: 1000 }]
    );
    expect(result.sufficient).toBe(true);
    expect(result.shortages).toHaveLength(0);
  });

  it("flags only the specific short material and the exact shortfall (AC2)", () => {
    const result = checkBomStock(
      [
        { materialId: 1, materialName: "Oil", qtyPerUnit: 2 },
        { materialId: 2, materialName: "Alcohol", qtyPerUnit: 1 },
        { materialId: 3, materialName: "Fragrance", qtyPerUnit: 0.5 }
      ],
      100,
      [
        { materialId: 1, availableQty: 1000 }, // needs 200, plenty
        { materialId: 2, availableQty: 50 }, // needs 100, short by 50
        { materialId: 3, availableQty: 1000 } // needs 50, plenty
      ]
    );
    expect(result.sufficient).toBe(false);
    expect(result.shortages).toHaveLength(1);
    expect(result.shortages[0]).toMatchObject({
      materialId: 2,
      materialName: "Alcohol",
      neededQty: 100,
      availableQty: 50,
      shortQty: 50
    });
  });
});

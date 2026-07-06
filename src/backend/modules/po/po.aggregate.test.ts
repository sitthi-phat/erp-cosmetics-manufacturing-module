import { aggregateMaterialNeed } from "./po.aggregate";

describe("aggregateMaterialNeed (ECP-004/009/010 - multi-line POs sharing materials)", () => {
  it("sums needs for the same material across two different product lines", () => {
    const need = aggregateMaterialNeed(
      [
        { productId: 1, quantity: 100 },
        { productId: 2, quantity: 50 }
      ],
      {
        1: [{ materialId: 10, materialName: "Oil", qtyPerUnit: 2 }],
        2: [{ materialId: 10, materialName: "Oil", qtyPerUnit: 1 }]
      }
    );
    expect(need.get(10)).toEqual({ materialName: "Oil", qty: 250 }); // 100*2 + 50*1
  });

  it("keeps materials from different products separate", () => {
    const need = aggregateMaterialNeed(
      [{ productId: 1, quantity: 10 }],
      { 1: [{ materialId: 1, materialName: "A", qtyPerUnit: 1 }, { materialId: 2, materialName: "B", qtyPerUnit: 3 }] }
    );
    expect(need.size).toBe(2);
    expect(need.get(2)?.qty).toBe(30);
  });
});

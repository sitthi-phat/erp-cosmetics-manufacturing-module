import { assertAssignable, assertHasLotSelections } from "./production.rules";

describe("production.rules (ECP-012/013)", () => {
  it("allows assignment when nothing is assigned yet", () => {
    expect(() => assertAssignable(null)).not.toThrow();
  });

  it("blocks re-assignment and reports the current assignee + time (ECP-012 AC2)", () => {
    const at = new Date("2026-07-01T09:00:00Z");
    expect(() => assertAssignable({ assignedToName: "สมชาย", assignedAt: at })).toThrow(
      /สมชาย.*2026-07-01/s
    );
  });

  it("blocks producing a batch with zero lot selections (ECP-013 AC3)", () => {
    expect(() => assertHasLotSelections([])).toThrow(/Lot วัตถุดิบ/);
  });

  it("allows producing when at least one lot is selected, including multi-lot for one material (ECP-013 AC2)", () => {
    expect(() =>
      assertHasLotSelections([
        { materialId: 1, lotId: 10, qtyUsed: 30 },
        { materialId: 1, lotId: 11, qtyUsed: 20 }
      ])
    ).not.toThrow();
  });
});

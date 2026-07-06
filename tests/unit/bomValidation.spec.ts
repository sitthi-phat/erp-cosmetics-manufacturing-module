/**
 * Q8 — Unit: BOM CRUD business rules (ECP-039 AC4/AC5). NOT to be confused with
 * `tests/unit/bomCheck.spec.ts` (existing, already green) which tests `checkBomStock` — the
 * stock-SUFFICIENCY math used when confirming a PO (ECP-009). This file tests the separate
 * validation rules for MANAGING the BOM recipe itself via the new ECP-039 CRUD screens/endpoints:
 * - AC4: a BOM must always have >= 1 line (cannot save/delete down to zero lines)
 * - AC5: the same raw material cannot appear twice in one product's BOM
 *
 * CONTRACT ASSUMPTION (E26 not implemented yet — no `src/backend/modules/bom/` directory exists
 * at spec-writing time, confirmed by directory listing). Assumed a pure validation fn
 * `validateBomLines(lines: {materialId:number; qtyPerUnit:number}[]): void` living in
 * `src/backend/modules/bom/bom.rules.ts`, throwing `AppError.validation(...)` with the EXACT
 * Thai messages given in the AC text (so ECP-036 error-message-audit style checks still hold).
 * TODO(verify, when E26 lands): reconcile path/signature/exact thrown message text.
 */
import { validateBomLines } from "../../src/backend/modules/bom/bom.rules";

describe("BOM line validation (ECP-039 AC4/AC5)", () => {
  test("TC-Q8-BOM-01: 2 distinct materials, valid qty_per_unit each -> does not throw", () => {
    expect(() =>
      validateBomLines([
        { materialId: 1, qtyPerUnit: 2 },
        { materialId: 2, qtyPerUnit: 0.5 },
      ])
    ).not.toThrow();
  });

  test("TC-Q8-BOM-02 (ECP-039 AC4, exact message): zero lines is rejected with the specified Thai message", () => {
    expect(() => validateBomLines([])).toThrow("BOM ต้องมีวัตถุดิบอย่างน้อย 1 รายการ");
  });

  test("TC-Q8-BOM-03 (ECP-039 AC5, exact message): the same materialId appearing twice is rejected", () => {
    expect(() =>
      validateBomLines([
        { materialId: 1, qtyPerUnit: 2 },
        { materialId: 1, qtyPerUnit: 3 }, // duplicate material
      ])
    ).toThrow("วัตถุดิบนี้มีอยู่ในสูตรแล้ว กรุณาแก้ไขปริมาณของบรรทัดเดิมแทนการเพิ่มซ้ำ");
  });

  test("TC-Q8-BOM-04: exactly 1 line is the minimum valid case (boundary of AC4, not itself an error)", () => {
    expect(() => validateBomLines([{ materialId: 1, qtyPerUnit: 1 }])).not.toThrow();
  });

  test("exploratory (gap, not covered by any explicit AC): qtyPerUnit <= 0 - flagging for BA/Engineer confirmation, since a 0 or negative recipe quantity would make ECP-013's auto-calc propose 0/negative material needs silently", () => {
    // Documents current expected-but-unconfirmed behavior; if this test fails once E26 lands
    // because Engineer decided qtyPerUnit<=0 IS allowed, this is a genuine open question to raise
    // with BA, not necessarily a defect.
    expect(() => validateBomLines([{ materialId: 1, qtyPerUnit: 0 }])).toThrow();
    expect(() => validateBomLines([{ materialId: 1, qtyPerUnit: -5 }])).toThrow();
  });

  test("exploratory: 3+ duplicate entries of the same material (not just 2) are still caught, not just a pairwise adjacent check", () => {
    expect(() =>
      validateBomLines([
        { materialId: 1, qtyPerUnit: 1 },
        { materialId: 2, qtyPerUnit: 1 },
        { materialId: 1, qtyPerUnit: 2 }, // duplicate of the FIRST line, not adjacent
      ])
    ).toThrow("วัตถุดิบนี้มีอยู่ในสูตรแล้ว กรุณาแก้ไขปริมาณของบรรทัดเดิมแทนการเพิ่มซ้ำ");
  });
});

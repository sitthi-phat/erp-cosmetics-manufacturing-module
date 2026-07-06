import { AppError } from "../../lib/errors";

export interface BomLineInput {
  materialId: number;
  qtyPerUnit: number;
}

/**
 * ECP-039 AC4/AC5: a BOM must always have >=1 line (never saved/deleted down to zero), and the
 * same raw material can never appear twice in one product's BOM. Also rejects a non-positive
 * qty_per_unit (not covered by an explicit AC, but a 0/negative recipe quantity would make
 * ECP-013's auto-calc silently propose 0/negative material needs - flagged as an open item in
 * tests/unit/bomValidation.spec.ts, treated here as a genuine input error).
 */
export function validateBomLines(lines: BomLineInput[]): void {
  if (lines.length === 0) {
    throw AppError.validation("BOM ต้องมีวัตถุดิบอย่างน้อย 1 รายการ");
  }
  const seen = new Set<number>();
  for (const line of lines) {
    if (seen.has(line.materialId)) {
      throw AppError.validation(
        "วัตถุดิบนี้มีอยู่ในสูตรแล้ว กรุณาแก้ไขปริมาณของบรรทัดเดิมแทนการเพิ่มซ้ำ"
      );
    }
    seen.add(line.materialId);
    if (!(line.qtyPerUnit > 0)) {
      throw AppError.validation("ปริมาณต่อหน่วยของวัตถุดิบในสูตรต้องมากกว่า 0");
    }
  }
}

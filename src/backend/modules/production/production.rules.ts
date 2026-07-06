import { AppError } from "../../lib/errors";

export interface ExistingAssignment {
  assignedToName: string;
  assignedAt: Date;
}

/** ECP-012 AC2: re-assigning an already-assigned order warns with who/when instead of silently overwriting. */
export function assertAssignable(existing: ExistingAssignment | null): void {
  if (existing) {
    throw AppError.conflict(
      `งานนี้ถูกมอบหมายให้${existing.assignedToName}แล้วเมื่อ ${existing.assignedAt.toISOString()}`
    );
  }
}

export interface LotSelection {
  materialId: number;
  lotId: number;
  qtyUsed: number;
}

/** ECP-013 AC3: must select >= 1 lot for the produce action to create a Batch at all. */
export function assertHasLotSelections(selections: LotSelection[]): void {
  if (selections.length === 0) {
    throw AppError.validation(
      "กรุณาระบุ Lot วัตถุดิบที่ใช้ในการผลิตอย่างน้อย 1 Lot ต่อวัตถุดิบแต่ละชนิดตามสูตร"
    );
  }
}

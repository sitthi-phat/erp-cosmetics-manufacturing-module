import { AppError } from "../../lib/errors";

export type POStatus =
  | "Draft"
  | "Confirmed"
  | "InProduction"
  | "Shipped"
  | "Invoiced"
  | "Closed"
  | "Cancelled";

/** ECP-004 AC3: at least 1 line before confirming. */
export function assertHasLines(lineCount: number): void {
  if (lineCount < 1) {
    throw AppError.validation("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการก่อนยืนยัน");
  }
}

/** Confirm only from Draft. */
export function assertCanConfirm(status: POStatus): void {
  if (status !== "Draft") {
    throw AppError.conflict("PO นี้ไม่อยู่ในสถานะที่สามารถยืนยันได้");
  }
}

/**
 * ECP-005: cancel allowed only from Draft/Confirmed (before production). Already-cancelled is
 * reported with the original cancellation time and never re-processed (AC3, no double refund).
 */
export function assertCanCancel(status: POStatus, cancelledAt?: Date | null): void {
  if (status === "Cancelled") {
    throw AppError.conflict(
      `PO นี้ถูกยกเลิกไปแล้วเมื่อ ${cancelledAt ? cancelledAt.toISOString() : "-"}`
    );
  }
  if (status !== "Draft" && status !== "Confirmed") {
    throw AppError.conflict("ไม่สามารถยกเลิก PO นี้ได้ เนื่องจากเริ่มกระบวนการผลิตแล้ว");
  }
}

/** Invoice can only be issued once PO has shipped (ECP-020 AC3), enforced also in invoice.service. */
export function assertShippedForInvoice(status: POStatus): void {
  if (status !== "Shipped") {
    throw AppError.validation("ไม่สามารถออก invoice ได้ PO นี้ยังไม่ถูกจัดส่ง");
  }
}

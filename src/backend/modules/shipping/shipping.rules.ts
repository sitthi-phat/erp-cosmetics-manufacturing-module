import { AppError } from "../../lib/errors";

export type BatchStatus =
  | "InProgress"
  | "Completed"
  | "QCPending"
  | "QCApproved"
  | "QCRejected"
  | "ReadyToShip"
  | "Shipped";

export type ShipmentStatus = "Draft" | "Shipped" | "Delivered";

/** ECP-018 AC3: only a QCApproved batch may become a shipment, even via a direct API call. */
export function assertBatchShippable(status: BatchStatus): void {
  if (status !== "QCApproved") {
    throw AppError.validation("Batch นี้ยังไม่ผ่านการอนุมัติจาก QA/QC ไม่สามารถจัดส่งได้");
  }
}

/** ECP-019 AC2: Shipped -> Delivered only, no skipping steps. */
export function assertCanMarkDelivered(status: ShipmentStatus): void {
  if (status !== "Shipped") {
    throw AppError.validation("ไม่สามารถเปลี่ยนเป็น Delivered ได้ ต้องมีสถานะ Shipped ก่อน");
  }
}

/** ECP-019 AC3: delivered date must not be in the future. */
export function assertDateNotInFuture(date: Date, now: Date = new Date()): void {
  if (date.getTime() > now.getTime()) {
    throw AppError.validation("วันที่ส่งถึงต้องไม่เกินวันที่ปัจจุบัน");
  }
}

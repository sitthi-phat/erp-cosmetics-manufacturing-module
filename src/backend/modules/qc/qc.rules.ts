import { AppError } from "../../lib/errors";

export type BatchStatus =
  | "InProgress"
  | "Completed"
  | "QCPending"
  | "QCApproved"
  | "QCRejected"
  | "ReadyToShip"
  | "Shipped";

export interface PreviousInspection {
  result: "Approved" | "Rejected";
  inspectedAt: Date;
  inspectorName: string;
}

/** ECP-015 AC3: block re-inspecting an already-decided batch (require explicit override upstream). */
export function assertInspectable(status: BatchStatus, previous: PreviousInspection | null): void {
  if (status === "QCApproved" && previous) {
    throw AppError.conflict(
      `Batch นี้ถูกอนุมัติไปแล้วเมื่อ ${previous.inspectedAt.toISOString()} โดย ${previous.inspectorName}`
    );
  }
  if (status !== "QCPending" && status !== "QCApproved") {
    throw AppError.conflict("Batch นี้ไม่อยู่ในสถานะที่รอการตรวจสอบคุณภาพ");
  }
}

export type IncomingQcStatus = "Pending" | "Passed" | "Failed";

/** ECP-017 AC2/AC3: only a Passed lot can be selected for production. */
export function assertLotUsable(status: IncomingQcStatus): void {
  if (status === "Failed") {
    throw AppError.validation("Lot นี้ไม่ผ่านการตรวจสอบคุณภาพ ไม่สามารถนำไปใช้ผลิตได้");
  }
  if (status === "Pending") {
    throw AppError.validation("Lot นี้ยังไม่ผ่านการตรวจสอบคุณภาพขาเข้า");
  }
}

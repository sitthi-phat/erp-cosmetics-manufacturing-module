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
  // Gate 2 rework (E27): nullable to allow the server-side quantity re-validation (ECP-013 AC5)
  // to run and reject a malformed request BEFORE any real Lot lookup happens.
  lotId: number | null;
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

export interface CandidateLot {
  lotId: number;
  lotNumber: string;
  receivedDate: string;
  remainingQty: number;
}

export interface FifoAllocation {
  lotId: number;
  lotNumber: string;
  allocQty: number;
}

export interface FifoAllocationResult {
  allocations: FifoAllocation[];
  /** 0 when requiredQty is fully covered; >0 = how much is still short after using everything
   * available (ECP-013 AC1/AC5). */
  shortfall: number;
}

/**
 * FIFO lot allocation (ECP-013 AC1/AC3/AC5, architecture.md §13.3.2): proposes Lots for a
 * required quantity of one material, oldest received_date first, splitting across multiple Lots
 * when the oldest alone isn't enough. Pure/deterministic - sorts a COPY of the input (never
 * trusts caller order), skips non-positive remainingQty entirely, and never over-allocates
 * beyond what's actually available. Ties (identical receivedDate) break by lotId for a
 * deterministic result across runs.
 */
export function allocateFifoLots(requiredQty: number, candidateLots: CandidateLot[]): FifoAllocationResult {
  const sorted = [...candidateLots]
    .filter((l) => l.remainingQty > 0)
    .sort((a, b) => {
      const dateDiff = new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.lotId - b.lotId;
    });

  const allocations: FifoAllocation[] = [];
  let remaining = requiredQty;
  for (const lot of sorted) {
    if (remaining <= 0) break;
    const allocQty = Math.min(lot.remainingQty, remaining);
    if (allocQty > 0) {
      allocations.push({ lotId: lot.lotId, lotNumber: lot.lotNumber, allocQty });
      remaining = Number((remaining - allocQty).toFixed(6));
    }
  }

  return { allocations, shortfall: Math.max(0, Number(remaining.toFixed(6))) };
}

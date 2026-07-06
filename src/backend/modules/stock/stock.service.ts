import { AppError } from "../../lib/errors";
import { StockBalanceSnapshot, StockLedgerStore } from "./stock.repository";

export interface RefDoc {
  refDocType?: string;
  refDocId?: number;
}

export interface ReconciliationResult {
  materialId: number;
  ledgerSum: number;
  physicalQty: number;
  matches: boolean;
  diff: number;
}

/**
 * Business rules for the real-time stock ledger (ADR-004, NFR N1/N2, ECP-007..010).
 * Store-agnostic: works against the Prisma-backed store in production and an in-memory fake
 * in unit tests, so the rules below are verified without needing a live MySQL instance.
 */
export class StockService {
  constructor(private readonly store: StockLedgerStore) {}

  async getBalance(materialId: number): Promise<StockBalanceSnapshot & { availableQty: number }> {
    const balance = await this.store.getBalance(materialId);
    return { ...balance, availableQty: balance.physicalQty - balance.reservedQty };
  }

  /** Goods receipt (ECP-008): physical += qty. Rejects qty <= 0. */
  async receive(materialId: number, qty: number, lotId: number | null, ref: RefDoc = {}) {
    if (!(qty > 0)) {
      throw AppError.validation("จำนวนรับเข้าต้องมากกว่า 0");
    }
    return this.store.applyTransaction({
      materialId,
      lotId,
      type: "Receipt",
      physicalDelta: qty,
      reservedDelta: 0,
      ...ref
    });
  }

  /** Reserve stock at PO confirm (ECP-010 AC1). Rejects if available < qty. */
  async reserve(materialId: number, qty: number, ref: RefDoc = {}) {
    if (!(qty > 0)) {
      throw AppError.validation("จำนวนที่ต้องการจองต้องมากกว่า 0");
    }
    const balance = await this.store.getBalance(materialId);
    const available = balance.physicalQty - balance.reservedQty;
    if (available < qty) {
      throw AppError.conflict(
        `วัตถุดิบไม่เพียงพอ ขาดอยู่ ${(qty - available).toFixed(3)} หน่วย`
      );
    }
    return this.store.applyTransaction({
      materialId,
      type: "Reservation",
      physicalDelta: 0,
      reservedDelta: qty,
      ...ref
    });
  }

  /** Release a reservation exactly once (ECP-005/010 AC2: cancel PO before production). */
  async release(materialId: number, qty: number, ref: RefDoc = {}) {
    if (!(qty > 0)) {
      throw AppError.validation("จำนวนที่ต้องการคืนจองต้องมากกว่า 0");
    }
    return this.store.applyTransaction({
      materialId,
      type: "ReservationRelease",
      physicalDelta: 0,
      reservedDelta: -qty,
      ...ref
    });
  }

  /**
   * Issue stock for production (ECP-013). Rejects if physical < qty even if reserved allows it
   * (ECP-010 AC3: real physical stock is the hard limit). Also releases the matching reservation.
   */
  async issue(
    materialId: number,
    qty: number,
    lotId: number | null,
    releaseReservedQty: number,
    ref: RefDoc = {}
  ) {
    if (!(qty > 0)) {
      throw AppError.validation("จำนวนที่เบิกต้องมากกว่า 0");
    }
    const balance = await this.store.getBalance(materialId);
    if (balance.physicalQty < qty) {
      throw AppError.conflict(
        `วัตถุดิบคงเหลือจริงไม่พอ (มี ${balance.physicalQty} ต้องการ ${qty})`
      );
    }
    return this.store.applyTransaction({
      materialId,
      lotId,
      type: "Issue",
      physicalDelta: -qty,
      reservedDelta: -releaseReservedQty,
      ...ref
    });
  }

  /** Manual adjustment (+/-). */
  async adjust(materialId: number, signedQty: number, ref: RefDoc = {}) {
    if (signedQty === 0) {
      throw AppError.validation("จำนวนที่ปรับต้องไม่เป็น 0");
    }
    return this.store.applyTransaction({
      materialId,
      type: "Adjustment",
      physicalDelta: signedQty,
      reservedDelta: 0,
      ...ref
    });
  }

  /** GET /stock/reconciliation (ECP-010 AC4, NFR N1): Sum(ledger) must equal physical 100%. */
  async reconcile(materialId: number): Promise<ReconciliationResult> {
    const [ledgerSum, balance] = await Promise.all([
      this.store.getPhysicalLedgerSum(materialId),
      this.store.getBalance(materialId)
    ]);
    const diff = Number((balance.physicalQty - ledgerSum).toFixed(6));
    return { materialId, ledgerSum, physicalQty: balance.physicalQty, matches: diff === 0, diff };
  }
}

/**
 * Q1 — Unit: reservation/release/issue math (ECP-010 AC1-AC3, ECP-008 AC3).
 * Pure math over StockBalance-shaped objects — no DB. DB-transaction correctness under
 * real concurrency is covered separately in tests/integration/concurrency/stockLedgerAccuracy.spec.ts.
 *
 * ASSUMED API (Engineer/E8, `src/backend/modules/stock/balanceMath.ts`):
 *   applyReservation(balance, qty) => { physical, reserved, available }
 *   applyRelease(balance, qty) => { physical, reserved, available }
 *   applyIssue(balance, qty) => { physical, reserved, available } | throws InsufficientPhysicalStockError
 *   applyReceipt(balance, qty) => { physical, reserved, available } | throws for qty <= 0
 */
import {
  applyReservation,
  applyRelease,
  applyIssue,
  applyReceipt,
} from "../../src/backend/modules/stock/balanceMath"; // TODO(Engineer): confirm path/signature

const baseBalance = { physical: 1000, reserved: 0 };

describe("Stock reservation/release/issue math (ECP-010)", () => {
  test("TC-010-AC1: confirm PO reserves qty — available drops, physical unchanged", () => {
    const result = applyReservation(baseBalance, 300);
    expect(result.physical).toBe(1000); // physical stock untouched
    expect(result.reserved).toBe(300);
    expect(result.available).toBe(700); // physical - reserved
  });

  test("TC-010-AC2: cancel before production releases the exact reserved qty, once", () => {
    const reserved = applyReservation(baseBalance, 300);
    const released = applyRelease(reserved, 300);
    expect(released.reserved).toBe(0);
    expect(released.available).toBe(1000);
  });

  test("TC-010-AC3: issuing more than physical stock is rejected, not silently clamped", () => {
    const balance = { physical: 250, reserved: 250 };
    expect(() => applyIssue(balance, 300)).toThrow(/insufficient|ไม่พอ/i);
  });

  test("TC-010-AC3 boundary: issuing exactly the remaining physical stock succeeds (0 left, not negative)", () => {
    const balance = { physical: 300, reserved: 300 };
    const result = applyIssue(balance, 300);
    expect(result.physical).toBe(0);
  });

  test("ECP-008 AC3: goods receipt with qty <= 0 is rejected", () => {
    expect(() => applyReceipt(baseBalance, 0)).toThrow();
    expect(() => applyReceipt(baseBalance, -5)).toThrow();
  });

  test("exploratory: double-release of the same reservation must not go negative (idempotency boundary)", () => {
    // Represents ECP-005 AC3 at the math level: cancelling an already-cancelled reservation
    // must not release twice. The service layer is responsible for not calling release twice,
    // but the math function itself should never push reserved_qty below 0.
    const reserved = applyReservation(baseBalance, 300);
    const releasedOnce = applyRelease(reserved, 300);
    expect(() => applyRelease(releasedOnce, 300)).toThrow(/reserved|จอง/i);
  });
});

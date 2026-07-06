/**
 * Q1 — Unit: payment outstanding/status math (ECP-021 AC1-AC3, §5.5 reconciliation math).
 *
 * RECONCILED 2026-07-07 (QA verify phase): actual export is
 * `computeReconciliation(totalAmount: number, paidAmount: number)` in
 * `src/backend/modules/invoice/invoice.calc.ts` (not `invoice/paymentMath.ts#computePaymentStatus`).
 * Result shape matches what was assumed: `{status, outstanding, overpaid}`.
 *
 * *** This reconciliation exposed DEF-01 (see docs/test-plans/erp-core-prototype/defects.md): ***
 * the overpaid test below (§4.4 of test-plan.md / TC-037-REC1) FAILS against the real
 * implementation - `status` is reported as "Paid" even when `overpaid` is true, which is exactly
 * the "mislabeled as Paid" bug test-plan.md §4.4 called out as a critical risk to check for.
 */
import { computeReconciliation as computePaymentStatus } from "../../src/backend/modules/invoice/invoice.calc";

describe("Payment outstanding/status math (ECP-021, §5.5)", () => {
  test("TC-021-AC1: full payment => Paid, outstanding 0.00", () => {
    const result = computePaymentStatus(50000, 50000);
    expect(result.status).toBe("Paid");
    expect(result.outstanding).toBe(0);
    expect(result.overpaid).toBe(false);
  });

  test("TC-021-AC2: partial payment => PartiallyPaid, correct outstanding", () => {
    const result = computePaymentStatus(30000, 20000);
    expect(result.status).toBe("PartiallyPaid");
    expect(result.outstanding).toBeCloseTo(10000, 2);
  });

  test("TC-021-AC3: attempting payment beyond outstanding must be rejected by the caller — this function must at least expose outstanding correctly to make that check possible", () => {
    // 10,000 invoice, no rejection logic lives here (that's a service-layer guard tested in
    // integration), but the outstanding value this function returns is what the guard relies on.
    const result = computePaymentStatus(10000, 0);
    expect(result.outstanding).toBe(10000);
  });

  test("zero payments => Issued, outstanding = total", () => {
    const result = computePaymentStatus(10000, 0);
    expect(result.status).toBe("Issued");
  });

  test("§5.5: overpaid — new (revised) total is LESS than what was already paid", () => {
    // Invoice revised down to 30,000 total after 40,000 was already paid on the prior version.
    const result = computePaymentStatus(30000, 40000);
    expect(result.overpaid).toBe(true);
    expect(result.status).not.toBe("Paid" as any); // must not silently mark "Paid" when overpaid — must flag distinctly
    // outstanding must not be reported as a misleading positive number implying money still owed
    expect(result.outstanding).toBeLessThanOrEqual(0);
  });

  test("§5.5: revised total INCREASES after partial payment — status recomputed from new total, not frozen at old status", () => {
    // Previously PartiallyPaid at 53,500 total with 40,000 paid; revised total becomes 80,000.
    const result = computePaymentStatus(80000, 40000);
    expect(result.status).toBe("PartiallyPaid");
    expect(result.outstanding).toBeCloseTo(40000, 2); // 80000 - 40000, not the old 13500
  });

  test("exploratory: payments summing to exactly total minus 0.01 must stay PartiallyPaid, not round up to Paid", () => {
    const result = computePaymentStatus(100.0, 99.99);
    expect(result.status).toBe("PartiallyPaid");
    expect(result.outstanding).toBeCloseTo(0.01, 2);
  });
});

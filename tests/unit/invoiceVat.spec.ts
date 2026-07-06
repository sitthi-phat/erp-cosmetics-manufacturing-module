/**
 * Q1 — Unit: invoice subtotal/VAT/total math (ECP-020 AC1, architecture.md §3.2).
 * subtotal = Σ(qty × unit_price); vat_amount = round(subtotal × rate/100, 2) round-half-up;
 * total = subtotal + vat_amount. Calculated once at issue/revise time, stored as snapshot.
 *
 * ASSUMED API (`src/backend/modules/invoice/vatMath.ts`):
 *   computeInvoiceTotals(lines: {qty:number; unitPrice:number}[], vatRatePercent:number)
 *     => { subtotal: number; vatAmount: number; totalAmount: number }
 */
import { computeInvoiceTotals } from "../../src/backend/modules/invoice/vatMath"; // TODO(Engineer): confirm path

describe("Invoice VAT/total math (ECP-020 AC1)", () => {
  test("TC-020-AC1: 50,000 subtotal @ 7% VAT => 3,500 VAT, 53,500 total", () => {
    const result = computeInvoiceTotals([{ qty: 100, unitPrice: 500 }], 7);
    expect(result.subtotal).toBeCloseTo(50000, 2);
    expect(result.vatAmount).toBeCloseTo(3500, 2);
    expect(result.totalAmount).toBeCloseTo(53500, 2);
  });

  test("subtotal is the sum across multiple lines, not just the first line", () => {
    const result = computeInvoiceTotals(
      [
        { qty: 10, unitPrice: 100 },
        { qty: 5, unitPrice: 50 },
      ],
      7
    );
    expect(result.subtotal).toBeCloseTo(1250, 2); // 1000 + 250
  });

  test("VAT rate 0% => vat_amount = 0, total = subtotal (VATConfig can be set to 0)", () => {
    const result = computeInvoiceTotals([{ qty: 1, unitPrice: 1000 }], 0);
    expect(result.vatAmount).toBe(0);
    expect(result.totalAmount).toBeCloseTo(1000, 2);
  });

  test("exploratory: rounding at the half-cent boundary uses round-half-up, not banker's rounding or raw float", () => {
    // subtotal chosen so subtotal * rate/100 lands exactly on X.XX5 to expose float/rounding bugs
    // 133.335 rounds to 133.34 under round-half-up (not 133.33 as naive float math might produce)
    const result = computeInvoiceTotals([{ qty: 1, unitPrice: 1905.5 }], 7); // 1905.5*0.07=133.385
    expect(result.vatAmount).toBeCloseTo(133.39, 2); // round-half-up of 133.385 -> 133.39, not 133.38
  });

  test("exploratory: classic JS float trap (0.1 + 0.2 style) must not leak into totals", () => {
    const result = computeInvoiceTotals(
      [
        { qty: 1, unitPrice: 0.1 },
        { qty: 1, unitPrice: 0.2 },
      ],
      0
    );
    expect(result.subtotal).toBe(0.3); // not 0.30000000000000004
  });

  test("negative unit_price should never reach this function meaningfully — defensive check", () => {
    // Data Rules say unit_price >= 0; this is a defense-in-depth unit test, not a substitute
    // for input validation at the API boundary (covered in integration tests).
    expect(() => computeInvoiceTotals([{ qty: 1, unitPrice: -1 }], 7)).toThrow();
  });
});

/**
 * Q1 — Unit: invoice subtotal/VAT/total math (ECP-020 AC1, architecture.md §3.2).
 * subtotal = Σ(qty × unit_price); vat_amount = round(subtotal × rate/100, 2) round-half-up;
 * total = subtotal + vat_amount. Calculated once at issue/revise time, stored as snapshot.
 *
 * RECONCILED 2026-07-07 (QA verify phase): actual export is
 * `computeInvoiceAmounts(lines: {quantity:number; unitPrice:number}[], vatRatePercent: number)`
 * in `src/backend/modules/invoice/invoice.calc.ts` (not `invoice/vatMath.ts#computeInvoiceTotals`),
 * field name is `quantity` not `qty`, and the result shape is
 * `{subtotal, vatRateApplied, vatAmount, totalAmount}`.
 */
import { computeInvoiceAmounts } from "../../src/backend/modules/invoice/invoice.calc";

describe("Invoice VAT/total math (ECP-020 AC1)", () => {
  test("TC-020-AC1: 50,000 subtotal @ 7% VAT => 3,500 VAT, 53,500 total", () => {
    const result = computeInvoiceAmounts([{ quantity: 100, unitPrice: 500 }], 7);
    expect(result.subtotal).toBeCloseTo(50000, 2);
    expect(result.vatAmount).toBeCloseTo(3500, 2);
    expect(result.totalAmount).toBeCloseTo(53500, 2);
  });

  test("subtotal is the sum across multiple lines, not just the first line", () => {
    const result = computeInvoiceAmounts(
      [
        { quantity: 10, unitPrice: 100 },
        { quantity: 5, unitPrice: 50 },
      ],
      7
    );
    expect(result.subtotal).toBeCloseTo(1250, 2); // 1000 + 250
  });

  test("VAT rate 0% => vat_amount = 0, total = subtotal (VATConfig can be set to 0)", () => {
    const result = computeInvoiceAmounts([{ quantity: 1, unitPrice: 1000 }], 0);
    expect(result.vatAmount).toBe(0);
    expect(result.totalAmount).toBeCloseTo(1000, 2);
  });

  test("exploratory: rounding at the half-cent boundary uses round-half-up, not banker's rounding or raw float", () => {
    // subtotal chosen so subtotal * rate/100 lands exactly on X.XX5 to expose float/rounding bugs
    // 1905.5*0.07=133.385 -> round-half-up should give 133.39, not 133.38
    const result = computeInvoiceAmounts([{ quantity: 1, unitPrice: 1905.5 }], 7);
    expect(result.vatAmount).toBeCloseTo(133.39, 2);
  });

  test("exploratory: classic JS float trap (0.1 + 0.2 style) must not leak into totals", () => {
    const result = computeInvoiceAmounts(
      [
        { quantity: 1, unitPrice: 0.1 },
        { quantity: 1, unitPrice: 0.2 },
      ],
      0
    );
    expect(result.subtotal).toBe(0.3); // not 0.30000000000000004
  });

  test("OBSERVATION (not asserted as a failure): computeInvoiceAmounts itself does not reject a negative " +
    "unit_price - it will happily compute a negative subtotal/total. Not exploitable through the real " +
    "API today because both POST /pos/:id/invoice and POST /invoices/:id/revise validate each line with " +
    "zod's `unitPrice: z.number().nonnegative()` (src/backend/modules/invoice/invoice.routes.ts) before " +
    "this function ever runs. Logged as a minor defense-in-depth gap (see defect log), not a blocking " +
    "defect, since there is no reachable path through the HTTP API today.", () => {
    const result = computeInvoiceAmounts([{ quantity: 1, unitPrice: -1 }], 7);
    expect(result.subtotal).toBe(-1);
  });
});

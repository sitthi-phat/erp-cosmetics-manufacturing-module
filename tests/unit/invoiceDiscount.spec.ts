/**
 * Q8 — Unit: invoice discount math (ECP-020 AC4/AC5, ECP-042 AC2/AC5).
 * Formula (architecture.md §13.2 Data Rules — Invoice row, Gate 2 delta):
 *   vat_amount   = round((subtotal - discount_amount) x vat_rate_applied / 100, 2)
 *   total_amount = subtotal - discount_amount + vat_amount
 * discount_amount is a FIXED BAHT AMOUNT per invoice (⚠ BA default per tasks.md §E "discount =
 * จำนวนเงินคงที่ต่อใบ ไม่ใช่ %/ต่อบรรทัด" — %/per-line is explicitly out of scope/backlog).
 *
 * CONTRACT ASSUMPTION (E30 not implemented yet at spec-writing time): extends the existing
 * `computeInvoiceAmounts(lines, vatRatePercent)` in `src/backend/modules/invoice/invoice.calc.ts`
 * (see tests/unit/invoiceVat.spec.ts, already verified/green) with a 3rd optional
 * `discountAmount = 0` param, adding a `discountAmount` field to the returned shape, plus a
 * sibling `validateDiscount(subtotal, discountAmount)` that throws (mirrors the existing
 * `validateVatRate` pattern in the same file) when discount > subtotal.
 * TODO(verify, when E30 lands): reconcile the exact function/param names — Engineer may instead
 * apply the discount at the call site before invoking computeInvoiceAmounts. If so, adjust the
 * import below, but the underlying MATH assertions (the actual business rule under test) must
 * still hold against whatever the real call site produces.
 */
import { computeInvoiceAmounts, validateDiscount } from "../../src/backend/modules/invoice/invoice.calc";

describe("Invoice discount math (ECP-020 AC4/AC5)", () => {
  test("TC-Q8-DISC-01 (ECP-020 AC4 worked example): subtotal 50,000 - discount 2,000 => VAT 3,360.00, total 51,360.00", () => {
    const result = computeInvoiceAmounts([{ quantity: 100, unitPrice: 500 }], 7, 2000);
    expect(result.subtotal).toBeCloseTo(50000, 2);
    expect(result.vatAmount).toBeCloseTo(3360, 2);
    expect(result.totalAmount).toBeCloseTo(51360, 2);
  });

  test("TC-Q8-DISC-02: omitting discountAmount defaults to 0 — backward compatible with pre-Gate-2 callers (ECP-020 AC1)", () => {
    const result = computeInvoiceAmounts([{ quantity: 100, unitPrice: 500 }], 7);
    expect(result.vatAmount).toBeCloseTo(3500, 2);
    expect(result.totalAmount).toBeCloseTo(53500, 2);
  });

  test("TC-Q8-DISC-03 (ECP-042 AC2): explicit discount=0 is a valid, distinct input — still full VAT, no special-casing breaks it", () => {
    const result = computeInvoiceAmounts([{ quantity: 1, unitPrice: 1000 }], 7, 0);
    expect(result.vatAmount).toBeCloseTo(70, 2);
    expect(result.totalAmount).toBeCloseTo(1070, 2);
  });

  test("TC-Q8-DISC-04 (ECP-042 AC5 boundary): discount exactly equals subtotal => VAT=0, total=0 exactly (not a rounding artifact like 0.00...1)", () => {
    const result = computeInvoiceAmounts([{ quantity: 1, unitPrice: 10000 }], 7, 10000);
    expect(result.subtotal).toBeCloseTo(10000, 2);
    expect(result.vatAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  test("TC-Q8-DISC-05 (ECP-020 AC5): discount > subtotal must be rejected by validateDiscount, not silently clamped or made negative", () => {
    expect(() => validateDiscount(10000, 12000)).toThrow();
  });

  test("TC-Q8-DISC-05b: discount exactly == subtotal passes validateDiscount (boundary is strictly '>', not '>=')", () => {
    expect(() => validateDiscount(10000, 10000)).not.toThrow();
  });

  test("exploratory: rounding after discount at a half-cent boundary uses the same round-half-up rule as the no-discount case", () => {
    // (3905.5 - 2000) * 0.07 = 133.385 -> round-half-up = 133.39, not 133.38 (banker's rounding)
    const result = computeInvoiceAmounts([{ quantity: 1, unitPrice: 3905.5 }], 7, 2000);
    expect(result.vatAmount).toBeCloseTo(133.39, 2);
  });

  test("OBSERVATION (documents a possible gap, not asserted as a hard failure): validateDiscount as designed only checks discount > subtotal — a NEGATIVE discount_amount (e.g. -500) is not '> subtotal' so it passes this particular check silently. No AC explicitly forbids a negative discount, but it would inflate the total beyond subtotal+VAT if it ever reached this function. The real defense today should be a zod schema at the API layer (nonnegative()) before this pure fn ever runs — QA verifies THAT at the integration level (see invoiceDiscountDetail.spec.ts) once E30 lands, not here.", () => {
    expect(() => validateDiscount(10000, -500)).not.toThrow();
  });
});

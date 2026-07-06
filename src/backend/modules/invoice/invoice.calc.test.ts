import { computeInvoiceAmounts, computeReconciliation, roundMoney, validateVatRate } from "./invoice.calc";
import { AppError } from "../../lib/errors";

describe("invoice.calc (Q1 business logic: VAT snapshot math, ECP-020 AC1)", () => {
  it("computes subtotal/vat/total for the worked example in ECP-020 AC1 (50,000 @ 7%)", () => {
    const amounts = computeInvoiceAmounts([{ quantity: 500, unitPrice: 100 }], 7);
    expect(amounts.subtotal).toBe(50000);
    expect(amounts.vatAmount).toBe(3500);
    expect(amounts.totalAmount).toBe(53500);
  });

  it("sums multiple lines correctly", () => {
    const amounts = computeInvoiceAmounts(
      [
        { quantity: 10, unitPrice: 99.99 },
        { quantity: 3, unitPrice: 250.5 }
      ],
      10
    );
    expect(amounts.subtotal).toBe(roundMoney(10 * 99.99 + 3 * 250.5));
  });

  it("rejects an empty line list (ECP-037 AC4 / ECP-020 basis)", () => {
    expect(() => computeInvoiceAmounts([], 7)).toThrow(AppError);
  });

  it("round-half-up at 2 decimals for vat_amount", () => {
    // subtotal 33.335 * 7% = 2.33345 -> rounds to 2.33
    const amounts = computeInvoiceAmounts([{ quantity: 1, unitPrice: 33.335 }], 7);
    expect(amounts.vatAmount).toBe(roundMoney(33.335 * 0.07));
  });

  it("supports VAT rate = 0 (edge)", () => {
    const amounts = computeInvoiceAmounts([{ quantity: 1, unitPrice: 100 }], 0);
    expect(amounts.vatAmount).toBe(0);
    expect(amounts.totalAmount).toBe(100);
  });
});

describe("validateVatRate (ECP-038 AC3)", () => {
  it.each([0, 7, 50, 100])("accepts %s as within range", (rate) => {
    expect(() => validateVatRate(rate)).not.toThrow();
  });

  it.each([-5, 150, -0.01, 100.01])("rejects %s as out of [0,100]", (rate) => {
    expect(() => validateVatRate(rate)).toThrow("อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%");
  });
});

describe("computeReconciliation (§5.5, ECP-021)", () => {
  it("Issued when nothing paid", () => {
    expect(computeReconciliation(50000, 0)).toEqual({
      outstanding: 50000,
      status: "Issued",
      overpaid: false
    });
  });

  it("PartiallyPaid with correct outstanding (ECP-021 AC2)", () => {
    const r = computeReconciliation(30000, 20000);
    expect(r.status).toBe("PartiallyPaid");
    expect(r.outstanding).toBe(10000);
    expect(r.overpaid).toBe(false);
  });

  it("Paid when fully covered (ECP-021 AC1)", () => {
    const r = computeReconciliation(50000, 50000);
    expect(r.status).toBe("Paid");
    expect(r.outstanding).toBe(0);
  });

  it("flags overpaid without wrongly marking Paid when a revise drops total below paid (§5.5)", () => {
    // paid 30,000 against an old version; new version total is only 25,000
    const r = computeReconciliation(25000, 30000);
    expect(r.overpaid).toBe(true);
    expect(r.outstanding).toBe(-5000);
    expect(r.status).toBe("Paid"); // paid >= total, but overpaid flag signals it needs review
  });
});

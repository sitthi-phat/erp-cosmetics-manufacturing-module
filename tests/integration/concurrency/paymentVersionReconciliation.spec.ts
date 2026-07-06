/**
 * Q7 — Payment <-> Invoice-version reconciliation under concurrent/racing edits (§5.5).
 * The non-concurrent behavior (revise allowed, warning shown) is covered in
 * tests/integration/invoiceVersioningReconciliation.spec.ts — this file focuses specifically
 * on the *race* and *overpaid* edges called out in test-plan.md §4.4.
 */
import { loginAs, resetSeed, fireConcurrently } from "../../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../../helpers/fixtures";

describe("Payment <-> invoice-version reconciliation races (§5.5)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("overpaid flag: revising total DOWN below what's already been paid never mislabels the invoice as Paid", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);

    // Invoice v1 total 53,500; pay 40,000 (PartiallyPaid, outstanding 13,500).
    await finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_OVERPAID/payments").send({
      amount: 40000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });

    // Revise down to a new total of 30,000 (< 40,000 already paid).
    const revised = await finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_OVERPAID/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 60, unitPrice: 500 }], // 30,000 subtotal pre-VAT logic aside
    });
    expect(revised.status).toBe(201);
    expect(revised.body.overpaid).toBe(true);
    expect(revised.body.status).not.toBe("Paid");
    expect(revised.body.warningMessage ?? revised.body.message).toMatch(/ยอดชำระเกินยอด/);

    // Payment record itself must still exist untouched (no auto-refund/auto-delete).
    const payments = await finance.get("/api/v1/invoices/SEEDED_INVOICE_FOR_OVERPAID/payments");
    expect(payments.body.items.reduce((sum: number, p: any) => sum + p.amount, 0)).toBe(40000);
  });

  test("revising total UP after a partial payment recomputes outstanding from the NEW total, not the old one", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    await finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_UPSIZE/payments").send({
      amount: 40000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    const revised = await finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_UPSIZE/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 160, unitPrice: 500 }], // pushes total up
    });
    expect(revised.body.status).toBe("PartiallyPaid");
    expect(revised.body.outstanding).toBeGreaterThan(0);
    expect(revised.body.outstanding).not.toBeCloseTo(13500, 2); // must not be the stale v1 figure
  });

  test("race: two concurrent revise requests against the same latest version must not both succeed and fork the chain", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const [r1, r2] = await fireConcurrently([
      () =>
        finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_RACE_REVISE/revise").send({
          lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 10, unitPrice: 500 }],
        }),
      () =>
        finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_RACE_REVISE/revise").send({
          lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 20, unitPrice: 500 }],
        }),
    ]);
    const successCount = [r1, r2].filter(
      (r) => r.status === "fulfilled" && (r.value as any).status === 201
    ).length;
    expect(successCount).toBe(1); // exactly one revise should win; the other must fail cleanly, not fork v2a/v2b

    // Verify the chain has exactly one v2, not two divergent v2 rows under the same parent v1.
    const versions = await finance.get("/api/v1/pos/SEEDED_PO_FOR_RACE_REVISE/invoice/versions");
    const v2s = versions.body.items.filter((v: any) => v.version === 2);
    expect(v2s.length).toBe(1);
  }, 20000);

  test("carry-over: payments recorded before a revise remain attached to the chain (not lost) after multiple successive revisions", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    await finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_MULTI_REVISE/payments").send({
      amount: 5000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    const v2 = await finance.post("/api/v1/invoices/SEEDED_INVOICE_FOR_MULTI_REVISE/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 30, unitPrice: 500 }],
    });
    const v3 = await finance.post(`/api/v1/invoices/${v2.body.id}/revise`).send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 40, unitPrice: 500 }],
    });
    const payments = await finance.get(`/api/v1/invoices/${v3.body.id}/payments`);
    expect(payments.body.items.reduce((sum: number, p: any) => sum + p.amount, 0)).toBe(5000);
  });
});

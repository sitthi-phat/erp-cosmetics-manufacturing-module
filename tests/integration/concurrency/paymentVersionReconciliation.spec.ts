/**
 * Q7 — Payment <-> Invoice-version reconciliation under concurrent/racing edits (§5.5).
 * The non-concurrent behavior (revise allowed, warning shown) is covered in
 * tests/integration/invoiceVersioningReconciliation.spec.ts — this file focuses specifically
 * on the *race* and *overpaid* edges called out in test-plan.md §4.4.
 *
 * Ground truth (DEF-08): there is no `GET /invoices/:id/payments` endpoint at all - payment
 * totals must be inferred from the `outstanding`/`status` fields returned directly by
 * POST /invoices/:id/payments and POST /invoices/:id/revise instead. DEF-01's fix means the
 * overpaid case reports `status: "Overpaid"` (a distinct 4th state), not a boolean `overpaid`
 * field in the response body (only the `warnings` array mentions it, in Thai text).
 */
import { loginAs, resetSeed, resolveCustomer, resolveProductWithBom, fireConcurrently, buildExactLotSelections } from "../../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../../helpers/fixtures";
import request from "supertest";

describe("Payment <-> invoice-version reconciliation races (§5.5)", () => {
  let sales: ReturnType<typeof request.agent>;
  let production: ReturnType<typeof request.agent>;
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;
  let logistics: ReturnType<typeof request.agent>;
  let finance: ReturnType<typeof request.agent>;
  let productionUserId: number;
  let customerId: number;
  let productId: number;
  let bomMaterialId: number;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const me = await production.get("/api/v1/auth/me");
    productionUserId = me.body.data.id;
    customerId = (await resolveCustomer(sales)).id;
    productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    bomMaterialId = bom.body.data.lines[0].materialId;
  }, 30000);

  async function createInvoicedPo(quantity: number, unitPrice = 500) {
    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId, quantity, unitPrice, uom: "unit" }],
    });
    const poId = draft.body.data.id;
    await sales.post(`/api/v1/pos/${poId}/confirm`);
    const assigned = await production
      .post(`/api/v1/production/${draft.body.data.lines[0].id}/assign`)
      .send({ assignedTo: productionUserId });
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: bomMaterialId,
      quantity: 100000,
      lotNumber: `LOT-PAYVER-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    await qc.post(`/api/v1/qc/lots/${receipt.body.data.lotId}/inspect`).send({ result: "Passed" });
    // RECONCILED (QA gate2-verify): E27 quantity re-validation - use the server's own exact FIFO split.
    const lotSelections = await buildExactLotSelections(production, assigned.body.data.id);
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections,
      producedQty: quantity,
    });
    await qc.post(`/api/v1/qc/batches/${produced.body.data.id}/inspect`).send({ result: "Approved" });
    await logistics.post("/api/v1/shipments").send({
      batchId: produced.body.data.id,
      shippedDate: new Date().toISOString().slice(0, 10),
    });
    const invoice = await finance.post(`/api/v1/pos/${poId}/invoice`).send({
      lines: [{ productId, description: "รายการสินค้า", quantity, unitPrice }],
    });
    return { poId, invoiceId: invoice.body.data.id as number };
  }

  test("overpaid flag: revising total DOWN below what's already been paid never mislabels the invoice as Paid (DEF-01 regression guard)", async () => {
    const { invoiceId } = await createInvoicedPo(100, 500); // total 53,500
    await finance.post(`/api/v1/invoices/${invoiceId}/payments`).send({
      amount: 40000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });

    // Revise down to a new subtotal of 30,000 (< 40,000 already paid).
    const revised = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised down", quantity: 60, unitPrice: 500 }],
    });
    expect(revised.status).toBe(201);
    expect(revised.body.data.status).toBe("Overpaid"); // DEF-01 fix: distinct 4th state, never "Paid"
    expect(revised.body.warnings.join(" ")).toMatch(/ยอดชำระเกินยอด/);
  });

  test("revising total UP after a partial payment recomputes outstanding from the NEW total, not the old one", async () => {
    const { invoiceId } = await createInvoicedPo(100, 500); // total 53,500
    await finance.post(`/api/v1/invoices/${invoiceId}/payments`).send({
      amount: 40000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    // Revise UP to subtotal 80,000 (total ~85,600) - pushes outstanding well above the stale 13,500 figure.
    const revised = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revised up", quantity: 160, unitPrice: 500 }],
    });
    expect(revised.body.data.status).toBe("PartiallyPaid");
    // Confirm the NEW outstanding by attempting to pay exactly (newTotal - 40000) and expecting success.
    const newTotal = Number(revised.body.data.totalAmount);
    const expectedOutstanding = Number((newTotal - 40000).toFixed(2));
    expect(expectedOutstanding).not.toBeCloseTo(13500, 2); // must not be the stale v1 figure
    const finalPayment = await finance.post(`/api/v1/invoices/${invoiceId}/payments`).send({
      amount: expectedOutstanding,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    expect(finalPayment.body.data.status).toBe("Paid");
    expect(finalPayment.body.data.outstanding).toBe(0);
  });

  test("race: two concurrent revise requests against the same latest version must not both succeed and fork the chain", async () => {
    const { poId, invoiceId } = await createInvoicedPo(100, 500);
    const [r1, r2] = await fireConcurrently([
      () =>
        finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
          lines: [{ productId, description: "race a", quantity: 10, unitPrice: 500 }],
        }),
      () =>
        finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
          lines: [{ productId, description: "race b", quantity: 20, unitPrice: 500 }],
        }),
    ]);
    const successCount = [r1, r2].filter(
      (r) => r.status === "fulfilled" && (r.value as any).status === 201
    ).length;
    expect(successCount).toBe(1); // exactly one revise should win; the other must fail cleanly, not fork v2a/v2b

    // Verify the chain has exactly one v2, not two divergent v2 rows under the same parent v1.
    const versions = await finance.get(`/api/v1/pos/${poId}/invoice/versions`);
    const v2s = versions.body.data.filter((v: any) => v.version === 2);
    expect(v2s.length).toBe(1);
  }, 20000);

  test("carry-over: payments recorded before a revise remain attached to the chain (not lost) after multiple successive revisions", async () => {
    const { invoiceId } = await createInvoicedPo(100, 500); // total 53,500
    await finance.post(`/api/v1/invoices/${invoiceId}/payments`).send({
      amount: 5000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    const v2 = await finance.post(`/api/v1/invoices/${invoiceId}/revise`).send({
      lines: [{ productId, description: "revise 1", quantity: 30, unitPrice: 500 }],
    });
    const v3 = await finance.post(`/api/v1/invoices/${v2.body.data.id}/revise`).send({
      lines: [{ productId, description: "revise 2", quantity: 40, unitPrice: 500 }],
    });
    // If the original 5,000 payment had been lost across 2 revisions, this exact remaining-balance
    // payment (v3 total - 5000) would either overpay or leave a nonzero outstanding afterward.
    const v3Total = Number(v3.body.data.totalAmount);
    const remaining = Number((v3Total - 5000).toFixed(2));
    const finalPayment = await finance.post(`/api/v1/invoices/${v3.body.data.id}/payments`).send({
      amount: remaining,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    expect(finalPayment.body.data.status).toBe("Paid");
    expect(finalPayment.body.data.outstanding).toBe(0);
  });
});

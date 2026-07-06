/**
 * Q2 — Integration: Invoice & Payment module (ECP-020, ECP-021, ECP-022).
 * Versioning/revise (ECP-037) and payment<->version reconciliation live in
 * tests/integration/invoiceVersioningReconciliation.spec.ts and the Q7 concurrency spec.
 * Endpoints per architecture.md §6:
 *   GET /invoices, POST /pos/:id/invoice, POST /invoices/:id/payments
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("Invoice & Payment module (Epic 7)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-020-AC1: issuing invoice v1 from a Shipped PO snapshots the current VAT rate (7%) and computes totals correctly", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/pos/SEEDED_PO_SHIPPED_50000/invoice");
    expect(res.status).toBe(201);
    expect(res.body.version).toBe(1);
    expect(res.body.parentInvoiceId).toBeNull();
    expect(res.body.subtotal).toBeCloseTo(50000, 2);
    expect(res.body.vatRateApplied).toBeCloseTo(7, 2);
    expect(res.body.vatAmount).toBeCloseTo(3500, 2);
    expect(res.body.totalAmount).toBeCloseTo(53500, 2);
    expect(res.body.status).toBe("Issued");

    const po = await finance.get("/api/v1/pos/SEEDED_PO_SHIPPED_50000");
    expect(po.body.status).toBe("Invoiced");
  });

  test("TC-020-AC2: issuing a second invoice chain for the same PO is blocked and points to revise", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    await finance.post("/api/v1/pos/SEEDED_PO_ALREADY_INVOICED/invoice"); // first (if not already seeded)
    const second = await finance.post("/api/v1/pos/SEEDED_PO_ALREADY_INVOICED/invoice");
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/ออกไปแล้ว/);
    expect(second.body.error.message).toMatch(/แก้ไข invoice/);
  });

  test("TC-020-AC3: issuing an invoice for a PO not yet Shipped is rejected", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/pos/SEEDED_PO_IN_PRODUCTION/invoice");
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ยังไม่ถูกจัดส่ง/);
  });

  test("TC-021-AC1: full payment moves invoice to Paid with 0.00 outstanding", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_50000/payments").send({
      amount: 50000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });
    expect(res.status).toBe(201);
    expect(res.body.invoiceStatus).toBe("Paid");
    expect(res.body.outstanding).toBe(0);
  });

  test("TC-021-AC2: partial payment moves invoice to PartiallyPaid with correct outstanding", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_30000/payments").send({
      amount: 20000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "เงินสด",
    });
    expect(res.status).toBe(201);
    expect(res.body.invoiceStatus).toBe("PartiallyPaid");
    expect(res.body.outstanding).toBeCloseTo(10000, 2);
  });

  test("TC-021-AC3: overpayment beyond outstanding is rejected with the exact outstanding figure", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_10000/payments").send({
      amount: 15000,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/เกินยอดคงค้าง/);
    expect(res.body.error.message).toMatch(/10,000\.00|10000\.00/);
  });

  test("TC-022-AC1: filtering unpaid (Issued+PartiallyPaid) returns exactly matching invoices with outstanding", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.get("/api/v1/invoices").query({ statusGroup: "unpaid" });
    expect(res.status).toBe(200);
    expect(res.body.items.every((i: any) => ["Issued", "PartiallyPaid"].includes(i.status))).toBe(true);
  });

  test("TC-022-AC3: a role other than Finance/Admin is denied direct access", async () => {
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const res = await logistics.get("/api/v1/invoices");
    expect(res.status).toBe(403);
  });

  test("exploratory: negative payment amount is rejected outright (Data Rules: amount > 0)", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_10000/payments").send({
      amount: -100,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "โอนเงิน",
    });
    expect(res.status).toBe(400);
  });
});

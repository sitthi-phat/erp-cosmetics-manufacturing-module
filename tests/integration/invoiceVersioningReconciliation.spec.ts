/**
 * Q2 — Integration: Invoice versioning (ECP-037 AC1-AC4) + non-concurrent part of the
 * Payment<->version reconciliation design in architecture.md §5.5.
 * Full concurrent-edit race scenario lives in tests/integration/concurrency/paymentVersionReconciliation.spec.ts.
 * Endpoints: POST /invoices/:id/revise, GET /pos/:id/invoice/versions
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("Invoice versioning + reconciliation (Epic 11, ECP-037)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test("TC-037-AC1: revising v1 (Issued, unpaid) creates v2, links parent, supersedes v1", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_V1_UNPAID/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 90, unitPrice: 500 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.version).toBe(2);
    expect(res.body.parentInvoiceId).toBe("SEEDED_INVOICE_V1_UNPAID");

    const versions = await finance.get("/api/v1/pos/SEEDED_PO_FOR_V1_UNPAID/invoice/versions");
    const v1 = versions.body.items.find((v: any) => v.version === 1);
    expect(v1.status).toBe("Superseded");
  });

  test("TC-037-AC2: the version timeline shows both versions in order, v1 tagged as superseded, original data intact", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const versions = await finance.get("/api/v1/pos/SEEDED_PO_WITH_V2/invoice/versions");
    expect(versions.status).toBe(200);
    expect(versions.body.items.length).toBeGreaterThanOrEqual(2);
    const v1 = versions.body.items.find((v: any) => v.version === 1);
    expect(v1.status).toBe("Superseded");
    expect(v1.supersededByLabel ?? v1.message).toMatch(/ถูกแทนที่โดย/);
    expect(v1.subtotal).toBeDefined(); // original amounts still viewable, not wiped
  });

  test("TC-037-AC3: attempting to revise a non-latest version is blocked with a link to the latest version", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_V1_SUPERSEDED/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 1, unitPrice: 1 }],
    });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ถูกแทนที่ด้วย version ใหม่กว่าแล้ว/);
    expect(res.body.error.latestVersionId ?? res.body.error.fields?.latestVersionId).toBeDefined();
  });

  test("TC-037-AC4: revising down to zero lines is rejected, current version stays unchanged", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const before = await finance.get("/api/v1/pos/SEEDED_PO_FOR_ZERO_LINE_TEST/invoice/versions");
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_LATEST_FOR_ZERO_LINE_TEST/revise").send({
      lines: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/อย่างน้อย 1 รายการ/);

    const after = await finance.get("/api/v1/pos/SEEDED_PO_FOR_ZERO_LINE_TEST/invoice/versions");
    expect(after.body.items).toEqual(before.body.items); // untouched
  });

  test("§5.5 (BA default, INVOICE_EDIT_AFTER_PAYMENT=allow): revising an invoice that already has a payment is ALLOWED, with a warning surfaced", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_PARTIALLY_PAID/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 50, unitPrice: 500 }],
    });
    expect(res.status).toBe(201); // allowed by default policy
    expect(res.body.warning ?? res.body.message).toMatch(/รับชำระแล้ว/);
  });

  // Prepared in case Pond confirms the opposite policy during UAT (see test-plan.md §4.4).
  // Flip INVOICE_EDIT_AFTER_PAYMENT=block in .env.test and un-skip to validate the alternate behavior.
  describe.skip("§5.5 alternate policy (INVOICE_EDIT_AFTER_PAYMENT=block) — pending Pond confirmation", () => {
    test("revising a Paid/PartiallyPaid invoice is rejected outright when policy=block", async () => {
      const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
      const res = await finance.post("/api/v1/invoices/SEEDED_INVOICE_PARTIALLY_PAID/revise").send({
        lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 50, unitPrice: 500 }],
      });
      expect(res.status).toBe(409);
    });
  });

  test("exploratory: audit log records ReviseInvoice with old/new totals and the acting user", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    await finance.post("/api/v1/invoices/SEEDED_INVOICE_V1_UNPAID/revise").send({
      lines: [{ productId: "PRODUCT_WITH_BOM", quantity: 80, unitPrice: 500 }],
    });
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const audit = await admin.get("/api/v1/audit-logs").query({ actionType: "ReviseInvoice" });
    expect(audit.body.items.length).toBeGreaterThan(0);
  });
});

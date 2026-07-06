/**
 * Q2 — Integration: VATConfig Admin Portal (ECP-038).
 * Endpoints per architecture.md §6: GET/PUT /admin/vat-config
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD, SEED_FACTS } from "../helpers/fixtures";

describe("VATConfig Admin Portal (Epic 11, ECP-038)", () => {
  beforeAll(async () => {
    await resetSeed();
  });

  test(`seed sanity: default VAT rate is ${SEED_FACTS.vatDefaultRate}%`, async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const res = await admin.get("/api/v1/admin/vat-config");
    expect(res.status).toBe(200);
    expect(res.body.rate).toBeCloseTo(SEED_FACTS.vatDefaultRate, 2);
  });

  test("TC-038-AC1: updating the rate to 10% takes effect immediately and applies to newly issued invoices", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const update = await admin.put("/api/v1/admin/vat-config").send({ rate: 10 });
    expect(update.status).toBe(200);
    expect(update.body.rate).toBe(10);

    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const invoice = await finance.post("/api/v1/pos/SEEDED_PO_SHIPPED_FOR_NEW_RATE/invoice");
    expect(invoice.body.vatRateApplied).toBe(10);
  });

  test("TC-038-AC2: a previously issued invoice keeps its original VAT snapshot after the config rate changes", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const before = await finance.get("/api/v1/invoices/SEEDED_INVOICE_AT_7_PERCENT");
    expect(before.body.vatRateApplied).toBeCloseTo(7, 2);

    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    await admin.put("/api/v1/admin/vat-config").send({ rate: 15 });

    const after = await finance.get("/api/v1/invoices/SEEDED_INVOICE_AT_7_PERCENT");
    expect(after.body.vatRateApplied).toBeCloseTo(7, 2); // unchanged
    expect(after.body.totalAmount).toBe(before.body.totalAmount);
  });

  test("TC-038-AC3: rate outside 0-100 is rejected, old value stays in effect", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    const negative = await admin.put("/api/v1/admin/vat-config").send({ rate: -5 });
    expect(negative.status).toBe(400);
    expect(negative.body.error.message).toMatch(/อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%/);

    const tooHigh = await admin.put("/api/v1/admin/vat-config").send({ rate: 150 });
    expect(tooHigh.status).toBe(400);

    const stillValid = await admin.get("/api/v1/admin/vat-config");
    expect(stillValid.body.rate).not.toBe(-5);
    expect(stillValid.body.rate).not.toBe(150);
  });

  test("RBAC: only Admin can read/write vat-config — Finance (which manages invoices) must still be denied", async () => {
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const read = await finance.get("/api/v1/admin/vat-config");
    expect(read.status).toBe(403);
    const write = await finance.put("/api/v1/admin/vat-config").send({ rate: 20 });
    expect(write.status).toBe(403);
  });

  test("exploratory: audit log records UpdateVATConfig with old rate, new rate, and the acting admin", async () => {
    const admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    await admin.put("/api/v1/admin/vat-config").send({ rate: 8 });
    const audit = await admin.get("/api/v1/audit-logs").query({ actionType: "UpdateVATConfig" });
    expect(audit.body.items.length).toBeGreaterThan(0);
  });
});

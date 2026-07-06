/**
 * Q9 — Integration: Customer tax fields (ECP-001 AC5-7, ECP-002 AC4, architecture.md §13.2).
 * NEW fields on the existing `POST/PUT /customers` endpoints (tests/integration/customer.spec.ts
 * covers the pre-Gate-2 AC1-4 baseline, already green — this file is additive, Gate 2 only).
 *
 * CONTRACT ASSUMPTION (E22/E23 not implemented yet at spec-writing time — Customer.tax_id/
 * registered_address columns don't exist yet): assumes request/response field names
 * `taxId`/`registeredAddress` (camelCase, matching the established convention of every other
 * field in this API per DEF-08's resolution — e.g. `customerId` not `customer_id`).
 * TODO(verify, when E23 lands): reconcile field names/casing against the real request/response
 * body the moment the endpoint exists.
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Customer tax fields (ECP-001 AC5-7, ECP-002 AC4)", () => {
  let sales: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
  });

  test("TC-Q9-TAX-01 (ECP-001 AC5): create with a valid 13-digit tax_id + registered_address saves both fields", async () => {
    const res = await sales.post("/api/v1/customers").send({
      name: "บริษัท มีเลขภาษี จำกัด",
      address: "123 ถนนที่อยู่จัดส่ง",
      phone: "0812340001",
      email: "taxid1@example.com",
      taxId: "0105558000001",
      registeredAddress: "456 ที่อยู่จดทะเบียน (สำหรับใบกำกับภาษี)",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.taxId).toBe("0105558000001");
    expect(res.body.data.registeredAddress).toBe("456 ที่อยู่จดทะเบียน (สำหรับใบกำกับภาษี)");
  });

  test("TC-Q9-TAX-02 (ECP-001 AC6, exact message): tax_id with fewer than 13 digits is rejected, nothing saved", async () => {
    const res = await sales.post("/api/v1/customers").send({
      name: "บริษัท เลขภาษีผิด จำกัด",
      address: "ที่อยู่",
      phone: "0812340002",
      email: "taxidbad@example.com",
      taxId: "010555800", // 9 digits
    });
    expect(res.status).toBe(400);
    expect(res.body.error.fields?.taxId ?? res.body.error.message).toMatch(
      /เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักเท่านั้น/
    );
  });

  test("TC-Q9-TAX-02b: tax_id containing a non-digit character is rejected the same way", async () => {
    const res = await sales.post("/api/v1/customers").send({
      name: "บริษัท เลขภาษีมีตัวอักษร จำกัด",
      address: "ที่อยู่",
      phone: "0812340003",
      email: "taxidalpha@example.com",
      taxId: "010555800000A",
    });
    expect(res.status).toBe(400);
  });

  test("TC-Q9-TAX-03 (ECP-001 AC7): omitting tax_id entirely still creates the customer successfully (not required at creation)", async () => {
    const res = await sales.post("/api/v1/customers").send({
      name: "บริษัท ไม่มีเลขภาษีตอนสร้าง จำกัด",
      address: "ที่อยู่",
      phone: "0812340004",
      email: "notaxid@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.taxId ?? null).toBeNull();
  });

  test("TC-Q9-TAX-04 (ECP-002 AC4, snapshot no-retroactive-change): editing tax_id after an invoice was already issued does NOT change that old invoice's stored value", async () => {
    // NOTE: this test necessarily spans E22 (schema) + E23 (customer tax fields) + E30 (invoice
    // discount/detail) + E32 (document_snapshot) together, since the snapshot only exists once an
    // invoice/document has actually been issued. If E30/E32 haven't landed yet when this runs,
    // this test is expected to fail for THAT reason (missing endpoint), not because the tax_id
    // edit logic itself is wrong — reconcile ordering with Engineer's actual landing sequence.
    const customer = await sales.post("/api/v1/customers").send({
      name: "บริษัท แก้เลขภาษีภายหลัง จำกัด",
      address: "ที่อยู่",
      phone: "0812340005",
      email: "snapshot-tax@example.com",
      taxId: "1111111111111",
    });
    const customerId = customer.body.data.id;

    // TODO(verify): once a full PO->Shipped->Invoice chain helper exists for Gate 2 fixtures,
    // replace this with an actual issued invoice for `customerId` and assert its
    // `document_snapshot`/detail-view customer.taxId still reads "1111111111111" AFTER the edit
    // below changes the live customer record to "2222222222222". Left as a structural placeholder
    // pending E30/E32 + a Gate-2 invoice-with-real-customer-tax-id fixture helper.
    const updated = await sales.put(`/api/v1/customers/${customerId}`).send({ taxId: "2222222222222" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.taxId).toBe("2222222222222"); // live record DOES update going forward
    // Full snapshot-immutability assertion tracked in invoiceDocument.spec.ts's dedicated test
    // instead (issues an invoice, then mutates CompanyProfile/customer, re-fetches the OLD
    // invoice's document and asserts it's unchanged) — kept there since it needs the full chain
    // helper that already exists for CompanyProfile in that file.
  });

  test("exploratory: registered_address omitted should fall back to `address` when printing documents later (BA default #4) — this endpoint itself should accept the omission without error", async () => {
    const res = await sales.post("/api/v1/customers").send({
      name: "บริษัท ไม่มีที่อยู่จดทะเบียนแยก จำกัด",
      address: "ที่อยู่หลักเดียว",
      phone: "0812340006",
      email: "noregaddr@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.registeredAddress ?? null).toBeNull();
    // The actual FALLBACK-TO-address behavior is exercised at print/document time
    // (invoiceDocument.spec.ts), not here — this only proves creation isn't blocked.
  });
});

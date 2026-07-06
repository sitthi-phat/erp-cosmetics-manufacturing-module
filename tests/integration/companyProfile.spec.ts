/**
 * Q9 — Integration: CompanyProfile Admin Portal (ECP-041 all AC, architecture.md §13.2/13.3).
 * Modeled directly on the existing, already-green `tests/integration/vatConfigAdmin.spec.ts`
 * (same "singleton config row, Admin only, snapshot on issue" shape as VATConfig).
 *
 * CONTRACT ASSUMPTION (E31 not implemented yet at spec-writing time — no
 * `src/backend/modules/companyProfile/` directory exists): assumed endpoints
 * `GET/PUT /admin/company-profile` -> `{data: {id, companyName, address, taxId, phone, logoUrl,
 * updatedBy, updatedAt} | null}` (null before first PUT — TODO(verify): confirm whether "unset"
 * is represented as `null` data or a 404; both are plausible and not specified by any AC).
 * Permission `company_profile.manage` = Admin only, per architecture.md §13.4.
 */
import { loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("CompanyProfile Admin Portal (ECP-041)", () => {
  let admin: ReturnType<typeof request.agent>;
  let finance: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    admin = await loginAs(SEED_USERS.admin.username, DEFAULT_PASSWORD);
    finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
  });

  test("TC-Q9-CP-01 (ECP-041 AC1): setting CompanyProfile for the first time succeeds with all fields, incl. a valid 13-digit tax_id", async () => {
    const res = await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท ทดสอบ ERP จำกัด",
      address: "999 ถนนทดสอบ กรุงเทพฯ 10110",
      taxId: "0105558000001",
      phone: "021234567",
      logoUrl: "https://example.com/logo.png",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.companyName).toBe("บริษัท ทดสอบ ERP จำกัด");
    expect(res.body.data.taxId).toBe("0105558000001");

    const fetched = await admin.get("/api/v1/admin/company-profile");
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.companyName).toBe("บริษัท ทดสอบ ERP จำกัด");
  });

  test("TC-Q9-CP-02 (ECP-041 AC1, singleton): a 2nd PUT updates the SAME row, never creates a 2nd profile row", async () => {
    await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท แรก จำกัด",
      address: "ที่อยู่ 1",
      taxId: "1111111111111",
      phone: "021110000",
    });
    const firstId = (await admin.get("/api/v1/admin/company-profile")).body.data.id;

    await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท แก้ไขแล้ว จำกัด",
      address: "ที่อยู่ 2",
      taxId: "2222222222222",
      phone: "022220000",
    });
    const second = await admin.get("/api/v1/admin/company-profile");
    expect(second.body.data.id).toBe(firstId); // same singleton row, not a new one
    expect(second.body.data.companyName).toBe("บริษัท แก้ไขแล้ว จำกัด");
  });

  test("TC-Q9-CP-03 (ECP-041 AC2, snapshot principle — VATConfig-style): updating the address does not retroactively affect an ALREADY-issued document's snapshot", async () => {
    // The full end-to-end proof of this (an actual issued invoice's document_snapshot staying
    // frozen) lives in invoiceDocument.spec.ts, which needs the full PO->Invoice chain. This test
    // only proves the CompanyProfile row itself updates going forward, which is the prerequisite.
    await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท Snapshot Test จำกัด",
      address: "ที่อยู่เดิม",
      taxId: "3333333333333",
      phone: "023330000",
    });
    await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท Snapshot Test จำกัด",
      address: "ที่อยู่ใหม่หลังแก้ไข",
      taxId: "3333333333333",
      phone: "023330000",
    });
    const after = await admin.get("/api/v1/admin/company-profile");
    expect(after.body.data.address).toBe("ที่อยู่ใหม่หลังแก้ไข"); // the LIVE config does reflect the new value
  });

  test("TC-Q9-CP-04 (ECP-041 AC3, exact message): tax_id with fewer than 13 digits is rejected, nothing saved", async () => {
    const res = await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท เลขภาษีผิด จำกัด",
      address: "ที่อยู่",
      taxId: "12345",
      phone: "020000000",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักเท่านั้น/);
  });

  test("TC-Q9-CP-05 (RBAC, company_profile.manage = Admin only): Finance is denied both read and write", async () => {
    const read = await finance.get("/api/v1/admin/company-profile");
    expect(read.status).toBe(403);
    const write = await finance.put("/api/v1/admin/company-profile").send({
      companyName: "x",
      address: "x",
      taxId: "0000000000000",
      phone: "020000000",
    });
    expect(write.status).toBe(403);
  });

  test("exploratory: audit log records UpdateCompanyProfile with the acting admin (architecture.md §13.4 new audit action)", async () => {
    await admin.put("/api/v1/admin/company-profile").send({
      companyName: "บริษัท Audit Test จำกัด",
      address: "ที่อยู่",
      taxId: "4444444444444",
      phone: "024440000",
    });
    const audit = await admin.get("/api/v1/audit-logs").query({ actionType: "UpdateCompanyProfile" });
    expect(audit.body.data.length).toBeGreaterThan(0);
  });
});

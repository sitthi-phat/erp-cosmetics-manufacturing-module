/**
 * Q9 — Integration: RBAC delta for Gate 2 permissions (architecture.md §13.4 Permission Matrix
 * Delta). New permissions added this round: `product.view` (SA/WH/PR/FI/AD), `bom.view`
 * (WH/PR/AD), `bom.manage` (PR/AD), `company_profile.manage` (AD only), `invoice.print`
 * (FI/AD). `user.view_basic` (PR/AD) is already covered/confirmed by the Gate 1 DEF-14 fix
 * verification (see defects.md) - not re-tested here to avoid duplicate coverage.
 *
 * NOTE: `bom.*` and `company_profile.*`/`invoice.print` positive-path assertions already live
 * inline in bom.spec.ts / companyProfile.spec.ts / invoiceDocument.spec.ts respectively (closer
 * to the feature they gate) - THIS file is the consolidated NEGATIVE-path matrix sweep across
 * every role, so a gap in any one role is caught even if the feature-specific file only checked
 * one or two roles for brevity.
 *
 * CONTRACT ASSUMPTION: exact endpoint paths per the other Gate 2 Round 2 spec files in this same
 * directory (bom.spec.ts, companyProfile.spec.ts, invoiceDocument.spec.ts) - not implemented yet
 * at spec-writing time, see those files' own contract-assumption headers.
 */
import { loginAs, resetSeed, resolveProductWithoutBom, resolveMaterials } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD, ROLES } from "../helpers/fixtures";
import request from "supertest";

describe("RBAC delta — Gate 2 new permissions (architecture.md §13.4)", () => {
  let agents: Record<string, ReturnType<typeof request.agent>>;

  beforeAll(async () => {
    await resetSeed();
    agents = {};
    for (const role of ROLES) {
      const seedUser = Object.values(SEED_USERS).find((u) => u.role === role)!;
      agents[role] = await loginAs(seedUser.username, DEFAULT_PASSWORD);
    }
  });

  test("TC-Q9-RBAC-01 (product.view = SA/WH/PR/FI/AD): QC and Logistics are NOT granted product.view — GET /products returns 403 for them", async () => {
    for (const role of ["QA", "LO"] as const) {
      const res = await agents[role].get("/api/v1/products");
      expect(res.status).toBe(403);
    }
    for (const role of ["SA", "WH", "PR", "FI", "AD"] as const) {
      const res = await agents[role].get("/api/v1/products");
      expect(res.status).toBe(200);
    }
  });

  test("TC-Q9-RBAC-02 (bom.manage = PR/AD only): every OTHER role gets 403 attempting to write a BOM", async () => {
    const product = await resolveProductWithoutBom(agents.PR);
    const materials = await resolveMaterials(agents.PR);
    for (const role of ["SA", "WH", "QA", "LO", "FI"] as const) {
      const res = await agents[role].post("/api/v1/boms").send({
        productId: product.id,
        lines: [{ materialId: materials[0].id, qtyPerUnit: 1 }],
      });
      expect(res.status).toBe(403);
    }
  });

  test("TC-Q9-RBAC-03 (bom.view = WH/PR/AD): QA/LO/FI/SA are denied even READ access to BOM list", async () => {
    for (const role of ["SA", "QA", "LO", "FI"] as const) {
      const res = await agents[role].get("/api/v1/boms");
      expect(res.status).toBe(403);
    }
    for (const role of ["WH", "PR", "AD"] as const) {
      const res = await agents[role].get("/api/v1/boms");
      expect(res.status).toBe(200);
    }
  });

  test("TC-Q9-RBAC-04 (company_profile.manage = AD only): every other role is denied both read and write", async () => {
    for (const role of ["SA", "WH", "PR", "QA", "LO", "FI"] as const) {
      const read = await agents[role].get("/api/v1/admin/company-profile");
      expect(read.status).toBe(403);
      const write = await agents[role].put("/api/v1/admin/company-profile").send({
        companyName: "x",
        address: "x",
        taxId: "0000000000000",
        phone: "020000000",
      });
      expect(write.status).toBe(403);
    }
  });

  test("TC-Q9-RBAC-05 (invoice.print = FI/AD only): every other role is denied the document-print endpoint (using an obviously-invalid id — RBAC must be checked BEFORE existence, i.e. 403 not 404, per the established permission-before-not-found convention already used elsewhere in this API)", async () => {
    for (const role of ["SA", "WH", "PR", "QA", "LO"] as const) {
      const res = await agents[role].get("/api/v1/invoices/999999999/document");
      expect(res.status).toBe(403);
    }
  });

  test("exploratory: Admin, as the superuser role, always has every Gate 2 permission above without needing an explicit grant per-permission check (sanity, not a specific AC)", async () => {
    const res1 = await agents.AD.get("/api/v1/products");
    const res2 = await agents.AD.get("/api/v1/boms");
    const res3 = await agents.AD.get("/api/v1/admin/company-profile");
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
  });
});

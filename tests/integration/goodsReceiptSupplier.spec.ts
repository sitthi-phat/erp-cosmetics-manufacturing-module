/**
 * Q9 — Integration: supplier_name capture on goods receipt + incoming QC display (ECP-008 AC4,
 * ECP-017 AC1/AC4). Additive to `tests/integration/stock.spec.ts` (existing, already green,
 * pre-Gate-2 baseline for `POST /stock/receipts` without supplier_name) and
 * `tests/integration/qc.spec.ts` (existing incoming-inspection tests, pre-Gate-2 baseline without
 * supplier display).
 *
 * CONTRACT ASSUMPTION (E22/E29 not implemented yet — Lot.supplier_name column doesn't exist yet):
 * assumes `POST /stock/receipts` body gains an optional `supplierName` field, persisted on the
 * created Lot, and that `GET /qc/lots/:id` (or wherever the incoming-inspection form's read data
 * comes from — TODO(verify): confirm the exact read endpoint once E29 lands) surfaces it as
 * `supplierName`, falling back to the literal string "ไม่ระบุ" for legacy Lots with no value.
 */
import { loginAs, resetSeed, resolveMaterials } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Goods-receipt supplier_name + incoming QC display (ECP-008 AC4, ECP-017 AC1/AC4)", () => {
  let warehouse: ReturnType<typeof request.agent>;
  let qc: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
  });

  test("TC-Q9-SUPP-01 (ECP-008 AC4): supplying supplierName on a goods receipt persists it on the created Lot", async () => {
    const materials = await resolveMaterials(warehouse);
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: materials[0].id,
      quantity: 100,
      lotNumber: `LOT-SUPP-${Date.now()}`,
      supplierName: "บริษัท ผู้จำหน่าย ทดสอบ จำกัด",
    });
    expect(receipt.status).toBe(201);
    expect(receipt.body.data.supplierName).toBe("บริษัท ผู้จำหน่าย ทดสอบ จำกัด");
  });

  test("TC-Q9-SUPP-02 (ECP-017 AC1): the incoming-QC inspect endpoint's read data (or response) surfaces the supplier_name automatically, without QC having to re-enter it", async () => {
    const materials = await resolveMaterials(warehouse);
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: materials[0].id,
      quantity: 50,
      lotNumber: `LOT-SUPP2-${Date.now()}`,
      supplierName: "บริษัท ผู้จำหน่าย B จำกัด",
    });
    const lotId = receipt.body.data.lotId;

    // TODO(verify, when E29 lands): confirm the real "fetch this lot's incoming-QC form data"
    // endpoint - assumed to be a GET on the lot resource; if instead this data only ever appears
    // embedded in a lots-listing endpoint, adjust the request below accordingly.
    const lotDetail = await qc.get(`/api/v1/qc/lots/${lotId}`);
    expect(lotDetail.status).toBe(200);
    expect(lotDetail.body.data.supplierName).toBe("บริษัท ผู้จำหน่าย B จำกัด");

    const inspect = await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Passed" });
    expect(inspect.status).toBe(200);
  });

  test("TC-Q9-SUPP-03 (ECP-017 AC4, exact fallback text): omitting supplierName does not block the receipt, and the incoming-QC view shows 'ไม่ระบุ' instead of erroring", async () => {
    const materials = await resolveMaterials(warehouse);
    const receipt = await warehouse.post("/api/v1/stock/receipts").send({
      materialId: materials[0].id,
      quantity: 30,
      lotNumber: `LOT-NOSUPP-${Date.now()}`,
      // supplierName omitted entirely - simulates both "legacy lot" and "warehouse chose not to fill it in"
    });
    expect(receipt.status).toBe(201);
    const lotId = receipt.body.data.lotId;

    const lotDetail = await qc.get(`/api/v1/qc/lots/${lotId}`);
    expect(lotDetail.status).toBe(200);
    expect(lotDetail.body.data.supplierName).toBe("ไม่ระบุ");

    // Must not block the actual inspection action either - the whole form must stay usable.
    const inspect = await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Passed" });
    expect(inspect.status).toBe(200);
  });
});

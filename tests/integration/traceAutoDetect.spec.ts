/**
 * Q9 — Integration: Trace auto-detect via the single new `GET /trace?q=<term>` endpoint
 * (ECP-014 AC1/AC2/AC4/AC5, architecture.md §13.3.1). Additive to the existing
 * `tests/integration/traceability.spec.ts` (already green, tests the pre-Gate-2 `?lot=` param
 * specifically) — this file is Gate 2 ONLY: the new single-box `?q=` param that must
 * auto-detect Lot/Batch/PO/Invoice from the SAME free-text input, per feedback item 3.
 *
 * RESOLVED (QA gate2-verify): the risk flagged here about traceability.spec.ts's stale
 * `L-SEED-${materialId}` pattern was confirmed real once E27/E28 landed - fixed directly in that
 * file (hardcoded to the deterministic `L-SEED-1`, per E22's actual root-cause fix).
 *
 * CONTRACT ASSUMPTION (E28 not implemented yet at spec-writing time): `GET /trace?q=<term>`
 * returns the same response envelope shape as the existing `?lot=` endpoint
 * (`{data:[{lotId, lotNumber, materialName, batches:[...]}]}`), auto-detecting entry type
 * per §13.3.1, and resolving to the SAME full chain regardless of which node you searched from.
 * The legacy `?lot=` param must keep working unchanged (explicit backward-compat requirement).
 *
 * RECONCILED (QA gate2-verify, real-run bug found in this file's OWN setup): originally used
 * buildExactLotSelections() (the server's FIFO proposal) to produce the batch in beforeAll - but
 * FIFO can legitimately draw from an OLDER seed-created lot instead of THIS test's own freshly
 * received lot, which then never appears in the resulting Batch/PO/Invoice's trace chain at all
 * (breaking TC-Q9-TRACEQ-02/03/04, which all search BY that chain and expect to find `lotNumber`
 * in it). Fixed by forcing produce() to use this specific lot explicitly, with its exact
 * BOM-required qty, instead of leaving the choice to FIFO.
 */
import {
  loginAs,
  resetSeed,
  resolveCustomer,
  resolveProductWithBom,
} from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";

describe("Trace auto-detect via ?q= (ECP-014 AC1/AC2/AC4/AC5)", () => {
  let poNumber: string;
  let batchNumber: string;
  let invoiceNumber: string;
  let lotNumber: string;

  beforeAll(async () => {
    await resetSeed();
    const sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
    const production = await loginAs(SEED_USERS.production.username, DEFAULT_PASSWORD);
    const warehouse = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const qc = await loginAs(SEED_USERS.qc.username, DEFAULT_PASSWORD);
    const logistics = await loginAs(SEED_USERS.logistics.username, DEFAULT_PASSWORD);
    const finance = await loginAs(SEED_USERS.finance.username, DEFAULT_PASSWORD);
    const me = await production.get("/api/v1/auth/me");
    const productionUserId = me.body.data.id;
    const customerId = (await resolveCustomer(sales)).id;
    const productId = (await resolveProductWithBom(sales)).id;
    const bom = await sales.get(`/api/v1/products/${productId}/bom`);
    const bomMaterialId = bom.body.data.lines[0].materialId;
    const bomQtyPerUnit = Number(bom.body.data.lines[0].qtyPerUnit);

    lotNumber = `L-QTRACE-TEST-${Date.now()}`;
    const receipt = await warehouse
      .post("/api/v1/stock/receipts")
      .send({ materialId: bomMaterialId, quantity: 100000, lotNumber });
    const lotId = receipt.body.data.lotId;
    await qc.post(`/api/v1/qc/lots/${lotId}/inspect`).send({ result: "Passed" });

    const draft = await sales.post("/api/v1/pos").send({
      customerId,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [{ productId, quantity: 1, unitPrice: 100, uom: "unit" }],
    });
    poNumber = draft.body.data.poNumber;
    await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    const poLineId = draft.body.data.lines[0].id;

    const assigned = await production.post(`/api/v1/production/${poLineId}/assign`).send({ assignedTo: productionUserId });
    // RECONCILED (QA gate2-verify): buildExactLotSelections() (server's own FIFO proposal) would
    // be WRONG here - it could draw from an OLDER seed-created lot instead of the SPECIFIC lot
    // this whole test needs to search for by number afterward, defeating the point. Force the
    // produce() call to use THIS lot explicitly, with the exact BOM-required qty (qty_per_unit x
    // plannedQty=1, matching this PO line's quantity:1) so E27's re-validation still passes.
    const produced = await production.post(`/api/v1/production/${assigned.body.data.id}/produce`).send({
      lotSelections: [{ materialId: bomMaterialId, lotId, qtyUsed: bomQtyPerUnit * 1 }],
      producedQty: 1,
    });
    if (produced.status !== 201) {
      throw new Error(`beforeAll produce() failed (status ${produced.status}): ${JSON.stringify(produced.body)}`);
    }
    batchNumber = produced.body.data.batchNumber;
    await qc.post(`/api/v1/qc/batches/${produced.body.data.id}/inspect`).send({ result: "Approved" });

    await logistics.post("/api/v1/shipments").send({
      batchId: produced.body.data.id,
      shippedDate: new Date().toISOString().slice(0, 10),
    });

    const invoiceRes = await finance.post(`/api/v1/pos/${draft.body.data.id}/invoice`).send({
      lines: [{ productId, description: "รายการสินค้า", quantity: 1, unitPrice: 100 }],
    });
    // Real field is `invoiceNo` (confirmed via src/backend/modules/invoice/invoice.routes.ts),
    // NOT `invoiceNumber` - corrected from an earlier guess before checking ground truth.
    invoiceNumber = invoiceRes.body.data.invoiceNo;
  });

  test("TC-Q9-TRACEQ-01 (ECP-014 AC1, regression guard defect C): searching the exact Lot number returns the full chain, not a not-found error", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ q: lotNumber });
    expect(res.status).toBe(200);
    const entry = res.body.data.find((l: any) => l.lotNumber === lotNumber);
    expect(entry).toBeDefined();
  });

  test("TC-Q9-TRACEQ-02 (ECP-014 AC2, auto-detect from Batch number): searching by the Batch number resolves back to the SAME lot/chain", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ q: batchNumber });
    expect(res.status).toBe(200);
    const entry = res.body.data.find((l: any) => l.lotNumber === lotNumber);
    expect(entry).toBeDefined();
  });

  test("TC-Q9-TRACEQ-03 (ECP-014 AC2, auto-detect from PO number): searching by the PO number resolves the SAME chain", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ q: poNumber });
    expect(res.status).toBe(200);
    const entry = res.body.data.find((l: any) => l.lotNumber === lotNumber);
    expect(entry).toBeDefined();
  });

  test("TC-Q9-TRACEQ-04 (ECP-014 AC2, auto-detect from Invoice number): searching by the Invoice number resolves the SAME chain", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ q: invoiceNumber });
    expect(res.status).toBe(200);
    const entry = res.body.data.find((l: any) => l.lotNumber === lotNumber);
    expect(entry).toBeDefined();
  });

  test("TC-Q9-TRACEQ-05 (ECP-014 AC5, exact message): a query matching no known type/record returns a friendly message, not a 500", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ q: "TOTALLY-UNRELATED-GARBAGE-999" });
    expect([200, 404]).toContain(res.status);
    if (res.status === 404) {
      expect(res.body.error.message).toMatch(/ไม่พบข้อมูลที่ตรงกับคำค้นหา/);
    } else {
      expect(res.body.data).toEqual([]);
    }
  });

  test("TC-Q9-TRACEQ-06 (backward compat, architecture.md §13.3.1 'คง ?lot= backward-compat'): the OLD ?lot= param still works after ?q= is added", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ lot: lotNumber });
    expect(res.status).toBe(200);
  });

  test("exploratory: whitespace-padded query is trimmed before detection (architecture.md §13.3.1)", async () => {
    const wh = await loginAs(SEED_USERS.warehouse.username, DEFAULT_PASSWORD);
    const res = await wh.get("/api/v1/trace").query({ q: `  ${lotNumber}  ` });
    expect(res.status).toBe(200);
  });
});

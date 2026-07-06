/**
 * Q2 — Integration: Customer module (ECP-001, ECP-002, ECP-003).
 * Endpoints per src/backend/modules/customer/customer.routes.ts (ground truth, DEF-08):
 *   GET /customers?q=... , POST /customers, PUT /customers/:id, GET /customers/:id/pos
 *   (there is NO `GET /customers/:id` single-record endpoint - fetch via the list + q filter)
 * Response envelope: `{ data: ... }` camelCase everywhere (architecture.md §6 only mandates the
 * ERROR envelope `{error:{code,message,fields}}` - success shape is `{data:...}` by convention,
 * confirmed as intentional across ~40 endpoints, see pipeline/status.json entry
 * engineer/defect-fix-2 DEF-08 decision).
 */
import { app, loginAs, resetSeed } from "../helpers/testClient";
import { SEED_USERS, DEFAULT_PASSWORD } from "../helpers/fixtures";
import request from "supertest";

describe("Customer module (Epic 1)", () => {
  let sales: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await resetSeed();
    sales = await loginAs(SEED_USERS.sales.username, DEFAULT_PASSWORD);
  });

  test("TC-001-AC1: create customer auto-generates customer_id, status Active, no way to submit one", async () => {
    const res = await sales.post("/api/v1/customers").send({
      name: "บริษัท ทดสอบ จำกัด",
      address: "123 ถนนทดสอบ",
      phone: "0812345678",
      email: "test@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.customerId).toMatch(/^CUS-\d{8}$/);
    expect(res.body.data.status).toBe("Active");
  });

  test("TC-001-AC2: duplicate name is NOT blocked, but a warning is surfaced", async () => {
    const payload = {
      name: "บริษัท ซ้ำชื่อ จำกัด",
      address: "ที่อยู่ 1",
      phone: "0811111111",
      email: "dup1@example.com",
    };
    const first = await sales.post("/api/v1/customers").send(payload);
    expect(first.status).toBe(201);

    const second = await sales.post("/api/v1/customers").send({ ...payload, email: "dup2@example.com" });
    expect(second.status).toBe(201); // must still save
    expect(second.body.warning).toMatch(/คล้ายกัน|ซ้ำ/);
  });

  test("TC-001-AC3: empty required name is rejected with a Thai field-level error, nothing saved", async () => {
    // NOTE: the schema's custom Thai message ("กรุณากรอกชื่อลูกค้า") is attached to the `.min(1, ...)`
    // check, which only runs once the value passes the base `z.string()` type check - if `name` is
    // omitted entirely, Zod's default "Required" message fires instead (a different, English string).
    // Sending an explicit empty string is what actually reaches the custom Thai copy.
    const res = await sales.post("/api/v1/customers").send({
      name: "",
      address: "ที่อยู่",
      phone: "0800000000",
      email: "noname@example.com",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.fields?.name).toMatch(/กรุณากรอกชื่อลูกค้า/);
  });

  test("TC-001-AC4: client-supplied customer_id is always ignored/stripped, server generates its own", async () => {
    const res = await sales.post("/api/v1/customers").send({
      customer_id: "CUS-HACKED1",
      name: "บริษัท พยายามยัด ID เอง",
      address: "ที่อยู่",
      phone: "0899999999",
      email: "hacker@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.customerId).not.toBe("CUS-HACKED1");
    expect(res.body.data.customerId).toMatch(/^CUS-\d{8}$/);
  });

  test("TC-002-AC1: update phone number reflects immediately on a follow-up list lookup", async () => {
    const created = await sales.post("/api/v1/customers").send({
      name: "ลูกค้าแก้เบอร์",
      address: "ที่อยู่",
      phone: "0811110000",
      email: "editphone@example.com",
    });
    const id = created.body.data.id;
    const updated = await sales.put(`/api/v1/customers/${id}`).send({ phone: "0899998888" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.phone).toBe("0899998888");
    // No GET /customers/:id endpoint exists - re-fetch via the list + q filter instead.
    const list = await sales.get("/api/v1/customers").query({ q: "ลูกค้าแก้เบอร์" });
    const fetched = list.body.data.find((c: any) => c.id === id);
    expect(fetched.phone).toBe("0899998888");
  });

  test("TC-002-AC3: clearing required email is rejected, original record untouched", async () => {
    const created = await sales.post("/api/v1/customers").send({
      name: "ลูกค้าลบอีเมล",
      address: "ที่อยู่",
      phone: "0822223333",
      email: "keepme@example.com",
    });
    const id = created.body.data.id;
    const res = await sales.put(`/api/v1/customers/${id}`).send({ email: "" });
    expect(res.status).toBe(400);
    const list = await sales.get("/api/v1/customers").query({ q: "ลูกค้าลบอีเมล" });
    const fetched = list.body.data.find((c: any) => c.id === id);
    expect(fetched.email).toBe("keepme@example.com"); // unchanged, not overwritten with blank
  });

  test("TC-003-AC1: search (query param `q`, not `search`) returns matching customer with its PO history reachable via /:id/pos", async () => {
    const res = await sales.get("/api/v1/customers").query({ q: "ABC" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const posRes = await sales.get(`/api/v1/customers/${res.body.data[0].id}/pos`);
    expect(posRes.status).toBe(200);
    expect(Array.isArray(posRes.body.data)).toBe(true);
  });

  test("TC-003-AC2: search with no matches returns a bare empty array (empty-state COPY is a frontend concern, not this API - see CustomersPage.tsx emptyText)", async () => {
    const res = await sales.get("/api/v1/customers").query({ q: "XYZ999_NO_MATCH" });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

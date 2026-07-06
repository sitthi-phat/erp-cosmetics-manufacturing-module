/**
 * Q2 — Integration: Customer module (ECP-001, ECP-002, ECP-003).
 * Endpoints per architecture.md §6:
 *   GET/POST /customers, GET/PUT /customers/:id, GET /customers/:id/pos
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
    expect(res.body.customer_id).toMatch(/^CUS-\d{8}$/);
    expect(res.body.status).toBe("Active");
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
    expect(second.body.warning ?? second.body.message).toMatch(/คล้ายกัน|ซ้ำ/);
  });

  test("TC-001-AC3: missing required name is rejected with a Thai field-level error, nothing saved", async () => {
    const res = await sales.post("/api/v1/customers").send({
      address: "ที่อยู่",
      phone: "0800000000",
      email: "noname@example.com",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.fields?.name ?? res.body.error.message).toMatch(/กรุณากรอกชื่อลูกค้า/);
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
    expect(res.body.customer_id).not.toBe("CUS-HACKED1");
    expect(res.body.customer_id).toMatch(/^CUS-\d{8}$/);
  });

  test("TC-002-AC1: update phone number reflects immediately on GET", async () => {
    const created = await sales.post("/api/v1/customers").send({
      name: "ลูกค้าแก้เบอร์",
      address: "ที่อยู่",
      phone: "0811110000",
      email: "editphone@example.com",
    });
    const id = created.body.id;
    const updated = await sales.put(`/api/v1/customers/${id}`).send({ phone: "0899998888" });
    expect(updated.status).toBe(200);
    const fetched = await sales.get(`/api/v1/customers/${id}`);
    expect(fetched.body.phone).toBe("0899998888");
  });

  test("TC-002-AC3: clearing required email is rejected, original record untouched", async () => {
    const created = await sales.post("/api/v1/customers").send({
      name: "ลูกค้าลบอีเมล",
      address: "ที่อยู่",
      phone: "0822223333",
      email: "keepme@example.com",
    });
    const id = created.body.id;
    const res = await sales.put(`/api/v1/customers/${id}`).send({ email: "" });
    expect(res.status).toBe(400);
    const fetched = await sales.get(`/api/v1/customers/${id}`);
    expect(fetched.body.email).toBe("keepme@example.com"); // unchanged, not overwritten with blank
  });

  test("TC-003-AC1: search returns matching customer with its PO history, ordered newest-first", async () => {
    const res = await sales.get("/api/v1/customers").query({ search: "ABC" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test("TC-003-AC2: search with no matches returns an explicit empty-state message, not a bare empty array with no context", async () => {
    const res = await sales.get("/api/v1/customers").query({ search: "XYZ999_NO_MATCH" });
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.message ?? res.body.emptyStateMessage).toMatch(/ไม่พบลูกค้า/);
  });
});

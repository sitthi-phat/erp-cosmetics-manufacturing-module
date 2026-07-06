/**
 * Q5 — Error message audit (ECP-036). Combines:
 *  (a) an automated static/regex sweep of API error responses (integration-level, via supertest)
 *  (b) a Playwright pass over key screens checking rendered error text
 * Per test-plan.md §2 (ECP-036 AC3 = Partial automation): a human must still do a final
 * "does this actually make sense to a non-technical user" pass — this file only catches the
 * mechanical failure modes (null/undefined/stack/English-only technical strings).
 *
 * RECONCILED 2026-07-08 (QA verify-3, DEF-08-family fixes):
 * - Every probed endpoint requires authentication (customer.create/po.create/admin.manage_vat_config) -
 *   an anonymous request 401s before ever reaching the validation logic being probed, so every
 *   probe now logs in first via a real supertest agent.
 * - The leak-scan used to `JSON.stringify` the ENTIRE response body and reject any literal
 *   "null" substring - but a well-formed error envelope's `fields: null` (no field-level errors)
 *   is valid JSON structure, not a technical leak to the user. Scoped the null/undefined/stack
 *   checks to `error.message` (the only field actually rendered to a human) instead.
 * - "unknown resource -> 404" used a UUID-shaped id; `Number("...")` on that yields `NaN`, which
 *   Prisma treats as an invalid argument (500), not the clean 404 this probe is meant to exercise -
 *   use a large, validly-typed, nonexistent integer id instead.
 * - Request bodies now match the real Zod schemas (numeric customerId/requestedDeliveryDate for
 *   PO creation, not `{customerSearch, lines:[]}`).
 */
import { test, expect } from "@playwright/test";
import request from "supertest";

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:4000";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

async function loginAgent(username: string) {
  const agent = request.agent(API_BASE_URL);
  await agent.post("/api/v1/auth/login").send({ username, password: "Password123!" });
  return agent;
}

test.describe("Error message audit — API layer (ECP-036 AC1/AC2/AC3, automated portion)", () => {
  test('"ECP-001 AC3 missing name" response body contains no null/undefined/stack/technical leakage', async () => {
    const sales = await loginAgent("sales_demo");
    const res = await sales.post("/api/v1/customers").send({ name: "", address: "-", phone: "0800000000", email: "a@b.com" });
    expect(res.status).toBe(400);
    const message = res.body.error?.message ?? "";
    expect(message).toBeTruthy();
    expect(message).not.toMatch(/\bnull\b/);
    expect(message).not.toMatch(/\bundefined\b/);
    expect(message).not.toMatch(/Error:\s/);
    expect(message).not.toMatch(/at\s+\w+\s+\(.*:\d+:\d+\)/);
    expect(message).toMatch(/[฀-๿]/); // contains at least one Thai character
  });

  test('"ECP-004 AC3 PO no lines (via confirm, since creation itself allows an empty-lines Draft)" response body contains no null/undefined/stack/technical leakage', async () => {
    const sales = await loginAgent("sales_demo");
    const customers = await sales.get("/api/v1/customers").query({ q: "ABC" });
    const draft = await sales.post("/api/v1/pos").send({
      customerId: customers.body.data[0].id,
      requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      lines: [],
    });
    const res = await sales.post(`/api/v1/pos/${draft.body.data.id}/confirm`);
    expect(res.status).toBe(400);
    const message = res.body.error?.message ?? "";
    expect(message).not.toMatch(/\bnull\b/);
    expect(message).not.toMatch(/\bundefined\b/);
    expect(message).not.toMatch(/Error:\s/);
    expect(message).toMatch(/[฀-๿]/);
  });

  test('"ECP-038 AC3 invalid VAT rate" response body contains no null/undefined/stack/technical leakage', async () => {
    const admin = await loginAgent("admin");
    const res = await admin.put("/api/v1/admin/vat-config").send({ rate: 999 });
    expect(res.status).toBe(400);
    const message = res.body.error?.message ?? "";
    expect(message).not.toMatch(/\bnull\b/);
    expect(message).not.toMatch(/\bundefined\b/);
    expect(message).toMatch(/[฀-๿]/);
  });

  test('"unknown resource -> 404" response body contains no null/undefined/stack/technical leakage', async () => {
    const sales = await loginAgent("sales_demo");
    const res = await sales.get("/api/v1/pos/999999999"); // valid int type, just nonexistent
    expect(res.status).toBe(404);
    const message = res.body.error?.message ?? "";
    expect(message).not.toMatch(/\bnull\b/);
    expect(message).not.toMatch(/\bundefined\b/);
    expect(message).not.toMatch(/Error:\s/);
    expect(message).toMatch(/[฀-๿]/);
  });
});

test.describe("Error message audit — UI layer (ECP-036 AC2, unexpected error path)", () => {
  test("an unexpected server error is shown via the central Notify component with the generic Thai fallback, not a raw stack trace", async ({ page, context }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("sales_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL((url) => url.pathname === "/");

    // Force a 500 by intercepting a known API call and returning garbage — validates that the
    // frontend's central error handler (ui/Notify, ADR-008) degrades gracefully.
    await context.route("**/api/v1/customers*", (route) =>
      route.fulfill({ status: 500, body: "not json at all <html>boom</html>" })
    );
    await page.goto(`${BASE_URL}/customers`);
    await expect(page.getByTestId("notify-error")).toContainText(
      "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"
    );
    await expect(page.getByTestId("notify-error")).not.toContainText(/<html>|TypeError|stack/i);
  });
});

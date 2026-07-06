/**
 * Q5 — Error message audit (ECP-036). Combines:
 *  (a) an automated static/regex sweep of API error responses (integration-level, via supertest)
 *  (b) a Playwright pass over key screens checking rendered error text
 * Per test-plan.md §2 (ECP-036 AC3 = Partial automation): a human must still do a final
 * "does this actually make sense to a non-technical user" pass — this file only catches the
 * mechanical failure modes (null/undefined/stack/English-only technical strings).
 */
import { test, expect } from "@playwright/test";
import request from "supertest";

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:3000";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

// Representative sample of error-producing requests across the API surface (architecture.md §6) —
// not exhaustive; extend during verify phase as new error paths are discovered.
const ERROR_PROBES: Array<{ label: string; run: () => Promise<request.Response> }> = [
  {
    label: "ECP-001 AC3 missing name",
    run: () =>
      request(API_BASE_URL)
        .post("/api/v1/customers")
        .send({ address: "-", phone: "0800000000", email: "a@b.com" }),
  },
  {
    label: "ECP-004 AC3 PO no lines",
    run: () => request(API_BASE_URL).post("/api/v1/pos").send({ customerSearch: "ABC", lines: [] }),
  },
  {
    label: "ECP-038 AC3 invalid VAT rate",
    run: () => request(API_BASE_URL).put("/api/v1/admin/vat-config").send({ rate: 999 }),
  },
  {
    label: "unknown resource -> 404",
    run: () => request(API_BASE_URL).get("/api/v1/pos/00000000-0000-0000-0000-000000000000"),
  },
];

test.describe("Error message audit — API layer (ECP-036 AC1/AC2/AC3, automated portion)", () => {
  for (const probe of ERROR_PROBES) {
    test(`"${probe.label}" response body contains no null/undefined/stack/technical leakage`, async () => {
      const res = await probe.run();
      const bodyText = JSON.stringify(res.body);
      expect(bodyText).not.toMatch(/\bnull\b/); // literal "null" string leaking to the user
      expect(bodyText).not.toMatch(/\bundefined\b/);
      expect(bodyText).not.toMatch(/Error:\s/);
      expect(bodyText).not.toMatch(/at\s+\w+\s+\(.*:\d+:\d+\)/);
      expect(res.body.error?.message).toBeDefined();
      // Thai text should be present in the user-facing message (contains at least one Thai character)
      expect(res.body.error.message).toMatch(/[฀-๿]/);
    });
  }
});

test.describe("Error message audit — UI layer (ECP-036 AC2, unexpected error path)", () => {
  test("an unexpected server error is shown via the central Notify component with the generic Thai fallback, not a raw stack trace", async ({ page, context }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("sales_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();

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

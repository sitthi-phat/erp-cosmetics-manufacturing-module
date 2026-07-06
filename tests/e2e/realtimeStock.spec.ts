/**
 * Q3/Q4 — E2E: real-time stock update without refresh, within <=1 minute (ECP-007 AC1,
 * ECP-028 AC2, brief.md BKV #1, ADR-004). This is the headline "pain point" scenario —
 * treat any flake here as high-signal, not a test artifact to loosen.
 */
import { test, expect } from "@playwright/test";
import request from "supertest";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:3000";

test.describe("Real-time stock visibility (ECP-007 AC1)", () => {
  test("a goods receipt made via the API reflects on an already-open stock page within 60s, with no manual refresh", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("warehouse_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();

    await page.goto(`${BASE_URL}/stock`);
    const materialRow = page.getByTestId("stock-row-แอลกอฮอล์");
    const before = await materialRow.getByTestId("stock-physical").innerText();
    const beforeQty = Number(before.replace(/[^0-9.]/g, ""));

    const start = Date.now();
    // Simulate a goods receipt happening from another user/device via direct API call,
    // NOT through this page — this is the "someone else changed stock" scenario.
    await request(API_BASE_URL).post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: 100,
      uom: "ลิตร",
      lotNumber: `E2E-RT-${Date.now()}`,
    });

    // No page.reload() call anywhere in this test — the whole point is it must update itself.
    await expect(materialRow.getByTestId("stock-physical")).toContainText(String(beforeQty + 100), {
      timeout: 60000,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(60000); // ECP-007 AC1 ceiling
  });

  test("ECP-028 AC2: a material that drops out of the low-stock threshold disappears from the warehouse dashboard within 60s, unprompted", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("warehouse_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.goto(`${BASE_URL}/dashboard/warehouse`);

    await expect(page.getByTestId("low-stock-material-row")).toBeVisible();

    await request(API_BASE_URL).post("/api/v1/stock/receipts").send({
      materialName: "SEEDED_LOW_STOCK_MATERIAL",
      quantity: 100000,
      uom: "kg",
      lotNumber: `E2E-RT-DASH-${Date.now()}`,
    });

    await expect(page.getByTestId("low-stock-material-row")).toHaveCount(0, { timeout: 60000 });
  });

  test("fallback polling: if the WebSocket connection is dropped, stock still updates within 60s via polling", async ({ page, context }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId("login-username").fill("warehouse_demo");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.goto(`${BASE_URL}/stock`);

    // Simulate socket drop by blocking the websocket endpoint at the network layer.
    await context.route("**/socket.io/**", (route) => route.abort());

    const materialRow = page.getByTestId("stock-row-แอลกอฮอล์");
    const before = await materialRow.getByTestId("stock-physical").innerText();
    const beforeQty = Number(before.replace(/[^0-9.]/g, ""));

    await request(API_BASE_URL).post("/api/v1/stock/receipts").send({
      materialName: "แอลกอฮอล์",
      quantity: 25,
      uom: "ลิตร",
      lotNumber: `E2E-POLL-${Date.now()}`,
    });

    await expect(materialRow.getByTestId("stock-physical")).toContainText(String(beforeQty + 25), {
      timeout: 60000,
    });
  });
});

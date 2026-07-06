/**
 * Q3/Q4 — E2E: real-time stock update without refresh, within <=1 minute (ECP-007 AC1,
 * ECP-028 AC2, brief.md BKV #1, ADR-004). This is the headline "pain point" scenario —
 * treat any flake here as high-signal, not a test artifact to loosen.
 *
 * RECONCILED 2026-07-08 (QA verify-3, DEF-08-family fixes):
 * - login() now waits for navigation to "/" before proceeding (was a race: some subsequent
 *   `page.goto()` calls could beat the async login POST, landing back on /login).
 * - `POST /stock/receipts` needs `{materialId:number, quantity, lotNumber}` (ground truth:
 *   src/backend/modules/stock/stock.routes.ts) - not `{materialName, uom}` which do not exist
 *   in the real schema. Uses `page.request` (shares the browser's auth cookie) instead of a
 *   separate unauthenticated `supertest` client - the receipt endpoint requires
 *   `stock.goods_receipt` permission, so an anonymous request would 401 before ever reaching
 *   the business logic.
 * - The WebSocket path is `config.socketPath` = "/rt" (.env `SOCKET_PATH`), NOT socket.io's
 *   default "/socket.io/" - the network-block pattern for the "fallback polling" test must
 *   target the real path or it silently blocks nothing.
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

async function login(page: Page, username: string, password = "Password123!") {
  await page.goto(`${BASE_URL}/login`);
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => url.pathname === "/");
}

async function resolveMaterialId(page: Page, materialName: string): Promise<number> {
  const res = await page.request.get(`${BASE_URL.replace("5173", "4000")}/api/v1/stock`);
  const body = await res.json();
  const match = body.data.find((m: any) => m.materialName === materialName);
  if (!match) throw new Error(`resolveMaterialId: no material named "${materialName}" in /stock`);
  return match.materialId;
}

test.describe("Real-time stock visibility (ECP-007 AC1)", () => {
  test("a goods receipt made via the API reflects on an already-open stock page within 60s, with no manual refresh", async ({ page }) => {
    await login(page, "warehouse_demo");
    const materialId = await resolveMaterialId(page, "แอลกอฮอล์");

    await page.goto(`${BASE_URL}/stock`);
    const materialRow = page.getByTestId("stock-row-แอลกอฮอล์");
    const before = await materialRow.getByTestId("stock-physical").innerText();
    const beforeQty = Number(before.replace(/[^0-9.]/g, ""));

    const start = Date.now();
    // Simulate a goods receipt happening from another user/device via direct API call,
    // NOT through this page — this is the "someone else changed stock" scenario.
    await page.request.post(`${BASE_URL.replace("5173", "4000")}/api/v1/stock/receipts`, {
      data: { materialId, quantity: 100, lotNumber: `E2E-RT-${Date.now()}` },
    });

    // No page.reload() call anywhere in this test — the whole point is it must update itself.
    await expect(materialRow.getByTestId("stock-physical")).toContainText(String(beforeQty + 100), {
      timeout: 60000,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(60000); // ECP-007 AC1 ceiling
  });

  test("ECP-028 AC2: a material that drops out of the low-stock threshold disappears from the warehouse dashboard within 60s, unprompted", async ({ page }) => {
    await login(page, "warehouse_demo");
    // prisma/seed.ts: the second-to-last material is seeded with physicalQty=50 (< 100 threshold).
    const stockRes = await page.request.get(`${BASE_URL.replace("5173", "4000")}/api/v1/stock`);
    const stockBody = await stockRes.json();
    const lowStockMaterial = stockBody.data.find((m: any) => m.physicalQty > 0 && m.physicalQty < 100);
    if (!lowStockMaterial) throw new Error("no low-stock (0 < qty < 100) material found in seed");

    await page.goto(`${BASE_URL}/dashboard/warehouse`);
    await expect(page.getByTestId(`low-stock-material-row-${lowStockMaterial.materialName}`)).toBeVisible();

    await page.request.post(`${BASE_URL.replace("5173", "4000")}/api/v1/stock/receipts`, {
      data: { materialId: lowStockMaterial.materialId, quantity: 100000, lotNumber: `E2E-RT-DASH-${Date.now()}` },
    });

    await expect(page.getByTestId(`low-stock-material-row-${lowStockMaterial.materialName}`)).toHaveCount(0, {
      timeout: 60000,
    });
  });

  test("fallback polling: if the WebSocket connection is dropped, stock still updates within 60s via polling", async ({ page, context }) => {
    await login(page, "warehouse_demo");
    const materialId = await resolveMaterialId(page, "แอลกอฮอล์");
    await page.goto(`${BASE_URL}/stock`);

    // Simulate socket drop by blocking the websocket endpoint at the network layer.
    // ADR-004 / .env `SOCKET_PATH` = "/rt" (config.socketPath), NOT socket.io's default path.
    await context.route("**/rt/**", (route) => route.abort());
    await context.route("**/rt?*", (route) => route.abort());

    const materialRow = page.getByTestId("stock-row-แอลกอฮอล์");
    const before = await materialRow.getByTestId("stock-physical").innerText();
    const beforeQty = Number(before.replace(/[^0-9.]/g, ""));

    await page.request.post(`${BASE_URL.replace("5173", "4000")}/api/v1/stock/receipts`, {
      data: { materialId, quantity: 25, lotNumber: `E2E-POLL-${Date.now()}` },
    });

    await expect(materialRow.getByTestId("stock-physical")).toContainText(String(beforeQty + 25), {
      timeout: 60000,
    });
  });
});

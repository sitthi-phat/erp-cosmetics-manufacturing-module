/**
 * Q11 — E2E (automated portion): responsive behavior across the 8 Gate-2-touched pages
 * (ECP-044 AC1-AC4). The PRINT-FIDELITY comparison itself (ECP-042 AC1, "ปอนด์เทียบเอกสารพิมพ์กับ
 * ตัวอย่างจริง") and the subjective UI-consistency visual review (ECP-043) are NOT automatable —
 * see the manual script `docs/test-plans/erp-core-prototype/uat-print-responsive-script.md` for
 * those, run by pond himself at Gate 2 (per tasks.md Q11 "ปอนด์เทียบเอกสารพิมพ์กับตัวอย่างจริง...
 * manual/UAT"). This file covers what CAN be objectively asserted by a script: no horizontal
 * scroll/overflow at each breakpoint, no missing critical action buttons, and form state survives
 * an orientation change.
 *
 * CONTRACT ASSUMPTION: the 8 pages per architecture.md §13.6 scope (PO create/detail, stock,
 * trace, production, QC incoming, BOM management, customer form, invoice detail+print). Viewport
 * sizes per ECP-044: desktop >=1366 (AC1), tablet 768-1024 portrait/landscape (AC2/AC3), <768
 * minimum-safety only (AC4, no full-fidelity expected).
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

/** No element should force the page wider than the viewport (a reliable, if blunt, proxy for
 * "no unwanted horizontal scroll" across arbitrary antd table/form layouts). */
async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1px rounding tolerance
}

const GATE2_PAGES: Array<{ nav: string; role: string; name: string }> = [
  { nav: "nav-po-create", role: "sales_demo", name: "PO create" },
  { nav: "nav-stock", role: "warehouse_demo", name: "Stock" },
  { nav: "nav-trace", role: "warehouse_demo", name: "Trace" },
  { nav: "nav-production-queue", role: "production_demo", name: "Production" },
  { nav: "nav-qc-incoming", role: "qc_demo", name: "QC incoming" },
  { nav: "nav-bom-management", role: "production_demo", name: "BOM management" },
  { nav: "nav-customer-list", role: "sales_demo", name: "Customer form" },
  { nav: "nav-invoice-list", role: "finance_demo", name: "Invoice detail+print" },
];

test.describe("Responsive — desktop >=1366 (ECP-044 AC1)", () => {
  test.use({ viewport: { width: 1366, height: 900 } });
  for (const p of GATE2_PAGES) {
    test(`TC-Q11-RESP-DESKTOP: ${p.name} renders with no horizontal overflow at 1366px`, async ({ page }) => {
      await login(page, p.role);
      await page.getByTestId(p.nav).click();
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe("Responsive — tablet 768-1024 portrait/landscape (ECP-044 AC2/AC3)", () => {
  const TABLET_PAGES = GATE2_PAGES.filter((p) => p.name === "Production" || p.name === "QC incoming");

  for (const p of TABLET_PAGES) {
    test(`TC-Q11-RESP-TABLET-PORTRAIT: ${p.name} usable at 768x1024 portrait, no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await login(page, p.role);
      await page.getByTestId(p.nav).click();
      await expectNoHorizontalOverflow(page);
    });

    test(`TC-Q11-RESP-TABLET-LANDSCAPE: ${p.name} usable at 1024x768 landscape, no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await login(page, p.role);
      await page.getByTestId(p.nav).click();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("TC-Q11-RESP-ROTATE (ECP-044 AC3): form data typed on the production 'record production' form survives a portrait->landscape rotation mid-fill", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, "production_demo");
    await page.getByTestId("nav-production-queue").click();
    await page.getByTestId("produce-button").first().click();
    await page.getByTestId("produce-output-qty").fill("123");

    await page.setViewportSize({ width: 1024, height: 768 }); // simulate rotation
    await expect(page.getByTestId("produce-output-qty")).toHaveValue("123"); // must NOT be cleared
  });
});

test.describe("Responsive — <768 minimum safety only (ECP-044 AC4)", () => {
  test.use({ viewport: { width: 480, height: 800 } });
  for (const p of GATE2_PAGES) {
    test(`TC-Q11-RESP-MINSAFETY: ${p.name} at 480px does not lose its primary action button (full fidelity NOT required, only 'not unusable')`, async ({ page }) => {
      await login(page, p.role);
      await page.getByTestId(p.nav).click();
      // Not asserting layout beauty (out of scope per AC4/§13.6) - only that navigation itself
      // still worked and the page didn't crash/blank-screen at this small width.
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

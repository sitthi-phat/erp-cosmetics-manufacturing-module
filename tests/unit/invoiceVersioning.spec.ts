/**
 * Q1 — Unit: invoice versioning rules (ECP-037 AC1/AC3/AC4, ADR-006 rev.2 §2).
 *
 * RECONCILED 2026-07-07 (QA verify phase): there is no standalone `invoice/versioningRules.ts`
 * module. Engineer implemented "is this the latest version in the chain" / "does a revision have
 * at least 1 line" / "next version number" directly inside `InvoiceService.reviseInvoice`
 * (src/backend/modules/invoice/invoice.service.ts), which needs a repository round-trip
 * (`findLatestByPoId`) to know whether `target` is the latest - i.e. it is not a pure function
 * of the invoice row alone, so it cannot be unit-tested without a fake `InvoiceRepository`.
 *
 * Every scenario below is ALREADY covered end-to-end, against the real `InvoiceService`, by
 * Engineer's own colocated `src/backend/modules/invoice/invoice.service.test.ts` (part of the
 * 123/123 passing suite QA re-ran during verify phase - see verify-report.md):
 *   - "creates v2, links parent, and supersedes v1 (AC1)"
 *   - "blocks revising a version that is not the latest, points to the latest (AC3)"
 *   - "blocks a revision with zero lines (AC4)"
 *   - "flags overpaid when a revise drops the total below already-paid amount (§5.5)" <- BUT see
 *     DEF-01 in docs/test-plans/erp-core-prototype/defects.md: that Engineer test only asserts
 *     `overpaid === true` and never asserts `status !== "Paid"`, which is why the critical
 *     mislabeling bug (confirmed empirically via tests/unit/paymentOutstanding.spec.ts in this
 *     verify phase) slipped through Engineer's own suite too.
 *
 * This file is left as `describe.skip` (not deleted, not force-compiled against a fake API)
 * pending a QA rewrite against the real async `InvoiceService` + a fake `InvoiceRepository` -
 * tracked as reconciliation debt, NOT a blocking defect on its own, per test-plan.md §0.
 */
describe.skip("Invoice versioning rules (ECP-037) — superseded by invoice.service.test.ts, needs async rewrite", () => {
  const assertCanRevise = (..._args: unknown[]) => undefined as any;
  const assertHasLines = (..._args: unknown[]) => undefined as any;
  const nextVersion = (v: number) => v + 1;
  test("TC-037-AC3: revising a non-latest version in the chain is rejected", () => {
    expect(() => assertCanRevise({ version: 1, isLatestInChain: false })).toThrow(/version|เวอร์ชัน/i);
  });

  test("revising the latest version in the chain is allowed", () => {
    expect(() => assertCanRevise({ version: 2, isLatestInChain: true })).not.toThrow();
  });

  test("TC-037-AC4: a revision with zero lines is rejected before any version is created", () => {
    expect(() => assertHasLines([])).toThrow(/1 รายการ|at least 1|line/i);
  });

  test("a revision with >= 1 line passes the line-count guard", () => {
    expect(() => assertHasLines([{ productId: "P1", qty: 1 }])).not.toThrow();
  });

  test("nextVersion increments by exactly 1 regardless of the starting number", () => {
    expect(nextVersion(1)).toBe(2);
    expect(nextVersion(5)).toBe(6);
  });

  test("exploratory: nextVersion must not skip or wrap when given a very large version number (no artificial ceiling)", () => {
    expect(nextVersion(999999)).toBe(1000000);
  });
});

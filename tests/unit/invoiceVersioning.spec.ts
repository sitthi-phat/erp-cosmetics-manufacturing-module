/**
 * Q1 — Unit: invoice versioning rules (ECP-037 AC1/AC3/AC4, ADR-006 rev.2 §2).
 * Pure rule checks — DB-level chain integrity (parent_invoice_id, Superseded transition)
 * is verified end-to-end in tests/integration/invoiceVersioningReconciliation.spec.ts.
 *
 * ASSUMED API (`src/backend/modules/invoice/versioningRules.ts`):
 *   assertCanRevise(invoice: {version:number; isLatestInChain:boolean}) => void | throws
 *   assertHasLines(lines: unknown[]) => void | throws
 *   nextVersion(currentVersion: number) => number
 */
import {
  assertCanRevise,
  assertHasLines,
  nextVersion,
} from "../../src/backend/modules/invoice/versioningRules"; // TODO(Engineer): confirm path

describe("Invoice versioning rules (ECP-037)", () => {
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

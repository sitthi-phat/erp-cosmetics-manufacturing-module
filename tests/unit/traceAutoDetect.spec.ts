/**
 * Q8 — Unit: trace query auto-detect (ECP-014 AC1/AC2/AC5, architecture.md §13.3.1).
 * Detection order (structure first, fallback to Lot free-text last):
 *   1. `^INV-\d{4}-\d{6}` (optionally with a `-vNN` version suffix) -> Invoice
 *   2. `^PO-\d{6}-\d{6}` -> PO
 *   3. `^B-\d{8}-\d{5}` -> Batch
 *   4. else -> Lot (free text fallback, because Lot numbers have no enforced format per
 *      architecture.md/ADR-006 — this is also why defect C existed in the first place: Lot is
 *      the ONLY type without a strict regex, so it must always be the last/fallback branch)
 *
 * CONTRACT ASSUMPTION (E28 not implemented yet at spec-writing time): a pure detection function
 * exists so QA can unit-test the regex/priority logic without a live DB. Assumed path/signature:
 * `detectTraceQueryType(rawQuery: string): "Invoice" | "PO" | "Batch" | "Lot"` in
 * `src/backend/modules/stock/traceDetect.ts` (sibling to the existing `trace.routes.ts`).
 * TODO(verify, when E28 lands): reconcile path/export/return-value casing against the real code —
 * if Engineer inlines detection directly into trace.routes.ts instead of a separate pure fn, ask
 * for it to be extracted (same rationale as ADR-009 did for thaiBahtText) so this stays unit
 * testable without a DB; if refused, downgrade these to integration-level assertions only.
 */
import { detectTraceQueryType } from "../../src/backend/modules/stock/traceDetect";

describe("Trace query auto-detect (ECP-014 AC1/AC2/AC5)", () => {
  test("TC-Q8-TRACE-01: Invoice number format -> Invoice", () => {
    expect(detectTraceQueryType("INV-2026-000001")).toBe("Invoice");
  });

  test("TC-Q8-TRACE-02: Invoice number WITH a version suffix (-vNN) still detects as Invoice", () => {
    expect(detectTraceQueryType("INV-2026-000001-v2")).toBe("Invoice");
  });

  test("TC-Q8-TRACE-03: PO number format -> PO", () => {
    expect(detectTraceQueryType("PO-202607-000005")).toBe("PO");
  });

  test("TC-Q8-TRACE-04: Batch number format -> Batch", () => {
    expect(detectTraceQueryType("B-20260707-00010")).toBe("Batch");
  });

  test("TC-Q8-TRACE-05 (regression guard, DEF/defect C root cause): free-text Lot number (no enforced format) falls back to Lot, e.g. the exact seed value that used to fail: L-SEED-1", () => {
    expect(detectTraceQueryType("L-SEED-1")).toBe("Lot");
  });

  test("TC-Q8-TRACE-06: leading/trailing whitespace is trimmed before detection (architecture.md §13.3.1 'trim input')", () => {
    expect(detectTraceQueryType("  L-SEED-1  ")).toBe("Lot");
    expect(detectTraceQueryType("  PO-202607-000005  ")).toBe("PO");
  });

  test("TC-Q8-TRACE-07: an arbitrary string matching none of the 3 structured formats still falls back to Lot (bucket fallback), not an error/undefined", () => {
    expect(detectTraceQueryType("randomgarbage123")).toBe("Lot");
  });

  test("exploratory: a near-miss format (right prefix, wrong digit count) does NOT falsely match the structured type — falls back to Lot instead of mis-detecting", () => {
    // "PO-1234-5" has the PO- prefix but wrong digit grouping vs `^PO-\d{6}-\d{6}`
    expect(detectTraceQueryType("PO-1234-5")).toBe("Lot");
    expect(detectTraceQueryType("INV-26-1")).toBe("Lot");
    expect(detectTraceQueryType("B-2026-1")).toBe("Lot");
  });

  test("exploratory: empty string / whitespace-only input — documents current behavior (needs BA confirmation of exact UX, not asserted as a specific error type here)", () => {
    // No AC explicitly covers an empty query. Flagging as needing confirmation whether this
    // should throw, return null, or fall back to Lot (and get a 0-result 'not found' downstream) —
    // whatever it does must not crash the whole /trace request (see integration-level test).
    expect(() => detectTraceQueryType("   ")).not.toThrow();
  });

  test("exploratory: lowercase input for a structured format — case sensitivity not specified by any AC, flagging for BA/Engineer confirmation", () => {
    // If real document numbers are always generated uppercase (per ADR-006 NumberSequence format),
    // a lowercase "inv-2026-000001" typed by a user should arguably still detect as Invoice for a
    // good UX (case-insensitive), but this is NOT explicitly required by any AC — documenting
    // current expected behavior as case-SENSITIVE (matches the literal regex in architecture.md
    // §13.3.1 with no `i` flag mentioned) until BA says otherwise.
    expect(detectTraceQueryType("inv-2026-000001")).toBe("Lot");
  });
});

/**
 * Q1 — Unit: NumberSequence format/padding (ADR-006 rev.2). Concurrency/uniqueness under
 * real parallel load is covered in tests/integration/concurrency/numberSequence.spec.ts —
 * this file only checks the pure string-formatting rule (no DB).
 *
 * ASSUMED API (`src/backend/lib/numberSequence.ts`):
 *   formatSequenceNumber(prefix: string, counter: number, digits: number) => string
 */
import { formatSequenceNumber } from "../../src/backend/lib/numberSequence"; // TODO(Engineer): confirm path

describe("NumberSequence format & padding (ADR-006 rev.2)", () => {
  test("Customer ID: CUS-8 digits, zero-padded", () => {
    expect(formatSequenceNumber("CUS", 42, 8)).toBe("CUS-00000042");
  });

  test("User ID: USR-8 digits, zero-padded", () => {
    expect(formatSequenceNumber("USR", 15, 8)).toBe("USR-00000015");
  });

  test("PO number: PO-6 digits (period-scoped, period_key composed by caller)", () => {
    expect(formatSequenceNumber("PO-202607", 1, 6)).toBe("PO-202607-000001");
  });

  test("Batch/Shipment number: 5 digits", () => {
    expect(formatSequenceNumber("B-20260706", 1, 5)).toBe("B-20260706-00001");
  });

  test("Invoice number: 6 digits, per-year", () => {
    expect(formatSequenceNumber("INV-2026", 123, 6)).toBe("INV-2026-000123");
  });

  test("ADR-006 rule: padding overflow must NOT truncate — counter wider than `digits` still produces a unique, longer string", () => {
    // e.g. the 100,000,000th customer must not wrap back to CUS-00000000 or throw
    expect(formatSequenceNumber("CUS", 100000000, 8)).toBe("CUS-100000000");
  });

  test("exploratory: counter=0 or negative must be rejected — a sequence must never issue a non-positive number", () => {
    expect(() => formatSequenceNumber("CUS", 0, 8)).toThrow();
    expect(() => formatSequenceNumber("CUS", -1, 8)).toThrow();
  });
});

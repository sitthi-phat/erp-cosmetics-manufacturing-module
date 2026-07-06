/**
 * Trace query auto-detect (ECP-014 AC1/AC2/AC5, architecture.md §13.3.1). Pure/deterministic -
 * no DB access - so trace.routes.ts can resolve the right lookup strategy from a single free-text
 * search box. Detection order (structured formats first, Lot free-text last since Lot numbers
 * have no enforced format per ADR-006 - this lack of structure is exactly why defect C existed:
 * Lot MUST always be the fallback branch, never a structured match target itself):
 *   1. `^INV-\d{4}-\d{6}` (optionally with a `-vNN` version suffix) -> Invoice
 *   2. `^PO-\d{6}-\d{6}` -> PO
 *   3. `^B-\d{8}-\d{5}` -> Batch
 *   4. else -> Lot (bucket fallback)
 */
export type TraceQueryType = "Invoice" | "PO" | "Batch" | "Lot";

const INVOICE_PATTERN = /^INV-\d{4}-\d{6}(-v\d+)?$/;
const PO_PATTERN = /^PO-\d{6}-\d{6}$/;
const BATCH_PATTERN = /^B-\d{8}-\d{5}$/;

export function detectTraceQueryType(rawQuery: string): TraceQueryType {
  const q = rawQuery.trim();
  if (INVOICE_PATTERN.test(q)) return "Invoice";
  if (PO_PATTERN.test(q)) return "PO";
  if (BATCH_PATTERN.test(q)) return "Batch";
  return "Lot";
}

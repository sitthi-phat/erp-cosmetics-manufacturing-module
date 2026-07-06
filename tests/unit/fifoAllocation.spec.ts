/**
 * Q8 — Unit: FIFO lot allocation for production material-plan (ECP-013 AC1/AC3/AC5,
 * architecture.md §13.3.2).
 * Rule: for each BOM material, requiredQty = qty_per_unit x plannedQty; propose Lots where
 * incoming_qc_status=Passed AND remaining_qty>0, ordered by received_date ASC (oldest first =
 * FIFO), allocating greedily until requiredQty is met (splitting across multiple Lots if the
 * oldest Lot alone isn't enough).
 *
 * CONTRACT ASSUMPTION (E27 not implemented yet at spec-writing time): a pure allocation function
 * exists so QA can unit-test the FIFO/split logic without a live DB. Assumed signature:
 * `allocateFifoLots(requiredQty: number, candidateLots: {lotId:number; lotNumber:string;
 * receivedDate:string; remainingQty:number}[]): {allocations:{lotId:number; lotNumber:string;
 * allocQty:number}[]; shortfall:number}` — `shortfall` is 0 when fully allocated, >0 when the
 * candidate lots together can't cover requiredQty (server still returns the partial proposal so
 * the FE can show it for review, per ECP-013 AC1 "เสนอ...ให้ครบตามจำนวนที่ต้องใช้" implying full
 * coverage is the happy path, but AC3 implies Production can still see partial proposals for edge
 * cases). Assumed path: `src/backend/modules/production/production.rules.ts` (existing file,
 * already has other production business rules per production.rules.test.ts).
 * TODO(verify, when E27 lands): reconcile function name/signature/shortfall-representation against
 * the real implementation.
 */
import { allocateFifoLots } from "../../src/backend/modules/production/production.rules";

const iso = (d: string) => new Date(d).toISOString();

/** Local type alias mirroring the CONTRACT ASSUMPTION above (module doesn't exist yet at
 * spec-writing time, so there's no real type to infer callback param types from) - only used to
 * keep `--strict`/noImplicitAny happy in this file's own callbacks; not a claim about the real
 * exported type once E27 lands (TODO(verify) applies here too). */
type Allocation = { lotId: number; lotNumber: string; allocQty: number };

describe("FIFO lot allocation (ECP-013 AC1/AC3/AC5)", () => {
  test("TC-Q8-FIFO-01: single lot with enough remaining stock fully covers the requirement alone", () => {
    const result = allocateFifoLots(1000, [
      { lotId: 1, lotNumber: "L-SEED-1", receivedDate: iso("2026-01-01"), remainingQty: 5000 },
    ]);
    expect(result.allocations).toEqual([{ lotId: 1, lotNumber: "L-SEED-1", allocQty: 1000 }]);
    expect(result.shortfall).toBe(0);
  });

  test("TC-Q8-FIFO-02: allocation always starts from the OLDEST received_date first, regardless of input array order", () => {
    // Deliberately given out of chronological order to prove the fn sorts, not just trusts input order.
    const result = allocateFifoLots(100, [
      { lotId: 2, lotNumber: "L-002", receivedDate: iso("2026-02-01"), remainingQty: 500 },
      { lotId: 1, lotNumber: "L-001", receivedDate: iso("2026-01-01"), remainingQty: 500 },
    ]);
    expect(result.allocations[0].lotId).toBe(1); // the Jan 1 lot, not the Feb 1 lot, despite being 2nd in input
  });

  test("TC-Q8-FIFO-03 (multi-lot split, ECP-013 AC3): oldest lot insufficient alone -> proposes a 2nd (next-oldest) lot to make up the exact remainder", () => {
    const result = allocateFifoLots(150, [
      { lotId: 1, lotNumber: "L-001", receivedDate: iso("2026-01-01"), remainingQty: 100 },
      { lotId: 2, lotNumber: "L-002", receivedDate: iso("2026-02-01"), remainingQty: 200 },
    ]);
    expect(result.allocations).toEqual([
      { lotId: 1, lotNumber: "L-001", allocQty: 100 },
      { lotId: 2, lotNumber: "L-002", allocQty: 50 },
    ]);
    const total = result.allocations.reduce((s: number, a: Allocation) => s + a.allocQty, 0);
    expect(total).toBe(150); // exact - not a single kg over or under
    expect(result.shortfall).toBe(0);
  });

  test("TC-Q8-FIFO-04: lots with remainingQty <= 0 are skipped entirely, never proposed with a 0 alloc line", () => {
    const result = allocateFifoLots(50, [
      { lotId: 1, lotNumber: "L-001", receivedDate: iso("2026-01-01"), remainingQty: 0 },
      { lotId: 2, lotNumber: "L-002", receivedDate: iso("2026-02-01"), remainingQty: 100 },
    ]);
    expect(result.allocations.find((a: Allocation) => a.lotId === 1)).toBeUndefined();
    expect(result.allocations).toEqual([{ lotId: 2, lotNumber: "L-002", allocQty: 50 }]);
  });

  test("TC-Q8-FIFO-05 (ECP-013 AC5, insufficient total): all candidate lots together still fall short -> shortfall reflects the exact gap, and total allocated never exceeds what's actually available", () => {
    const result = allocateFifoLots(1000, [
      { lotId: 1, lotNumber: "L-001", receivedDate: iso("2026-01-01"), remainingQty: 300 },
      { lotId: 2, lotNumber: "L-002", receivedDate: iso("2026-02-01"), remainingQty: 200 },
    ]);
    const totalAllocated = result.allocations.reduce((s: number, a: Allocation) => s + a.allocQty, 0);
    expect(totalAllocated).toBe(500); // everything available, no more
    expect(result.shortfall).toBe(500); // 1000 required - 500 available
  });

  test("TC-Q8-FIFO-06: empty candidate list -> shortfall equals the full required qty, no allocations, no throw", () => {
    const result = allocateFifoLots(100, []);
    expect(result.allocations).toEqual([]);
    expect(result.shortfall).toBe(100);
  });

  test("exploratory: requiredQty of exactly 0 (e.g. a BOM line with qty_per_unit effectively 0) allocates nothing and is trivially satisfied, does not throw", () => {
    const result = allocateFifoLots(0, [
      { lotId: 1, lotNumber: "L-001", receivedDate: iso("2026-01-01"), remainingQty: 500 },
    ]);
    expect(result.allocations).toEqual([]);
    expect(result.shortfall).toBe(0);
  });

  test("exploratory: two lots with the EXACT same received_date (tie) - allocation must still be deterministic (e.g. stable secondary sort by lotId), not flaky between runs", () => {
    const sameDate = iso("2026-01-01");
    const result = allocateFifoLots(50, [
      { lotId: 2, lotNumber: "L-002", receivedDate: sameDate, remainingQty: 100 },
      { lotId: 1, lotNumber: "L-001", receivedDate: sameDate, remainingQty: 100 },
    ]);
    // Only asserting *some* single lot was picked deterministically as first choice, not which one
    // specifically (BA/Engineer have not specified a tie-break rule) - documented as an open item.
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].allocQty).toBe(50);
  });
});

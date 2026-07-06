import { StockService } from "./stock.service";
import { ApplyTransactionInput, InsufficientStockError, StockBalanceSnapshot, StockLedgerStore } from "./stock.repository";

/**
 * In-memory store that simulates the row-lock behaviour of a single atomic conditional
 * `UPDATE ... WHERE material_id = ? AND <guard>` (see stock.repository.ts, DEF-09 fix): the
 * guard check AND the delta application happen inside the SAME per-material critical section,
 * with no separate/earlier "pre-check" read - exactly matching the real store's contract after
 * the DEF-09 fix. Concurrent `applyTransaction` calls for the SAME material are serialized
 * through a per-key async mutex, like MySQL serializes concurrent UPDATEs on the same locked
 * row (NFR N1). This lets the business rules (including lost-update/TOCTOU prevention under
 * concurrency) be unit tested without a live MySQL instance; the real row-lock SQL is exercised
 * by QA against MySQL (Q7).
 */
class InMemoryStockLedgerStore implements StockLedgerStore {
  private balances = new Map<number, StockBalanceSnapshot>();
  private ledger: Array<{ materialId: number; type: string; qty: number }> = [];
  private locks = new Map<number, Promise<unknown>>();

  private withLock<T>(materialId: number, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(materialId) ?? Promise.resolve();
    const next = previous.then(async () => {
      await new Promise((r) => setTimeout(r, 1)); // simulate DB round-trip so races actually overlap
      return fn();
    });
    this.locks.set(
      materialId,
      next.catch(() => undefined)
    );
    return next;
  }

  async getBalance(materialId: number): Promise<StockBalanceSnapshot> {
    return this.balances.get(materialId) ?? { materialId, physicalQty: 0, reservedQty: 0 };
  }

  async applyTransaction(input: ApplyTransactionInput): Promise<StockBalanceSnapshot> {
    return this.withLock(input.materialId, async () => {
      const current = this.balances.get(input.materialId) ?? {
        materialId: input.materialId,
        physicalQty: 0,
        reservedQty: 0
      };

      // DEF-09 fix: guard is checked HERE, atomically, using the value held under this same
      // per-material critical section - never a separate, earlier, un-locked read.
      const available = current.physicalQty - current.reservedQty;
      if (input.minAvailable !== undefined && available < input.minAvailable) {
        throw new InsufficientStockError(input.materialId, current.physicalQty, current.reservedQty);
      }
      if (input.minPhysical !== undefined && current.physicalQty < input.minPhysical) {
        throw new InsufficientStockError(input.materialId, current.physicalQty, current.reservedQty);
      }

      const updated: StockBalanceSnapshot = {
        materialId: input.materialId,
        physicalQty: current.physicalQty + input.physicalDelta,
        reservedQty: current.reservedQty + input.reservedDelta
      };
      this.balances.set(input.materialId, updated);
      this.ledger.push({
        materialId: input.materialId,
        type: input.type,
        qty:
          input.type === "Reservation" || input.type === "ReservationRelease"
            ? input.reservedDelta
            : input.physicalDelta
      });
      return updated;
    });
  }

  async getPhysicalLedgerSum(materialId: number): Promise<number> {
    return this.ledger
      .filter((e) => e.materialId === materialId && ["Receipt", "Issue", "Adjustment"].includes(e.type))
      .reduce((sum, e) => sum + e.qty, 0);
  }
}

describe("StockService (ADR-004, NFR N1, ECP-007..010)", () => {
  let store: InMemoryStockLedgerStore;
  let service: StockService;

  beforeEach(() => {
    store = new InMemoryStockLedgerStore();
    service = new StockService(store);
  });

  it("goods receipt increases physical stock and rejects qty <= 0 (ECP-008 AC1/AC3)", async () => {
    await service.receive(1, 200, null);
    const balance = await service.getBalance(1);
    expect(balance.physicalQty).toBe(200);

    await expect(service.receive(1, 0, null)).rejects.toThrow("จำนวนรับเข้าต้องมากกว่า 0");
    await expect(service.receive(1, -5, null)).rejects.toThrow("จำนวนรับเข้าต้องมากกว่า 0");
  });

  it("reserve reduces available while physical stays unchanged (ECP-010 AC1)", async () => {
    await service.receive(1, 1000, null);
    await service.reserve(1, 300);
    const balance = await service.getBalance(1);
    expect(balance.physicalQty).toBe(1000);
    expect(balance.reservedQty).toBe(300);
    expect(balance.availableQty).toBe(700);
  });

  it("blocks reserve when insufficient available stock (ECP-004 AC2/ECP-009 AC2)", async () => {
    await service.receive(1, 100, null);
    await expect(service.reserve(1, 300)).rejects.toThrow(/ไม่เพียงพอ/);
  });

  it("release returns the exact reserved quantity exactly once (ECP-005 AC1/ECP-010 AC2)", async () => {
    await service.receive(1, 1000, null);
    await service.reserve(1, 300);
    await service.release(1, 300);
    const balance = await service.getBalance(1);
    expect(balance.reservedQty).toBe(0);
    expect(balance.availableQty).toBe(1000);
  });

  it("rejects issuing more than the real physical stock even if reserved allows it (ECP-010 AC3)", async () => {
    await service.receive(1, 250, null);
    await service.reserve(1, 250);
    await expect(service.issue(1, 300, null, 250)).rejects.toThrow(/คงเหลือจริงไม่พอ/);
  });

  it("issue reduces physical and releases the matching reservation (ECP-013)", async () => {
    await service.receive(1, 1000, null);
    await service.reserve(1, 300);
    await service.issue(1, 300, null, 300);
    const balance = await service.getBalance(1);
    expect(balance.physicalQty).toBe(700);
    expect(balance.reservedQty).toBe(0);
  });

  it("reconciliation matches 100% after a mix of receive/reserve/release/issue (ECP-010 AC4)", async () => {
    await service.receive(1, 1000, null);
    await service.reserve(1, 400);
    await service.release(1, 100);
    await service.reserve(1, 100);
    await service.issue(1, 200, null, 200);

    const result = await service.reconcile(1);
    expect(result.matches).toBe(true);
    expect(result.diff).toBe(0);
    expect(result.physicalQty).toBe(800); // 1000 - 200 issued
  });

  it("accuracy 100% under many concurrent transactions from multiple 'users' (ECP-010 AC4, Q7)", async () => {
    await service.receive(1, 10_000, null);

    const ops: Array<Promise<unknown>> = [];
    for (let i = 0; i < 50; i += 1) {
      ops.push(service.receive(1, 10, null));
      ops.push(
        service
          .reserve(1, 5)
          .then(() => service.issue(1, 5, null, 5))
          .catch(() => undefined)
      );
    }
    await Promise.all(ops);

    const result = await service.reconcile(1);
    expect(result.matches).toBe(true);
    expect(result.diff).toBe(0);
  });

  it("DEF-09 regression: two concurrent issues that together exceed physical stock - exactly one must win, never both", async () => {
    await service.receive(1, 100, null);
    await service.reserve(1, 100);

    const results = await Promise.allSettled([
      service.issue(1, 60, null, 60),
      service.issue(1, 60, null, 60)
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1); // exactly one must succeed, not both, not neither
    expect(rejected).toHaveLength(1);

    const balance = await service.getBalance(1);
    expect(balance.physicalQty).toBe(40); // only the winning issue actually applied (100 - 60)

    const reconciliation = await service.reconcile(1);
    expect(reconciliation.matches).toBe(true);
    expect(reconciliation.diff).toBe(0); // ledger must exactly equal physical, no discrepancy
  });

  it("DEF-09 regression: many concurrent receipt+reserve+issue ops on one material never lose an update (ledger === physical exactly)", async () => {
    await service.receive(1, 1000, null);

    const ops: Array<() => Promise<unknown>> = [];
    for (let i = 0; i < 100; i += 1) {
      ops.push(() => service.receive(1, 10, null));
    }
    for (let i = 0; i < 50; i += 1) {
      ops.push(() =>
        service
          .reserve(1, 20)
          .then(() => service.issue(1, 20, null, 20))
          .catch(() => undefined)
      );
    }

    await Promise.all(ops.map((op) => op()));

    const reconciliation = await service.reconcile(1);
    expect(reconciliation.diff).toBe(0);
    expect(reconciliation.matches).toBe(true);
  });
});

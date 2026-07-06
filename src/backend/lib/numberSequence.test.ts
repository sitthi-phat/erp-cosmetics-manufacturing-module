import { nextNumber, SequenceExecutor } from "./numberSequence";

/**
 * In-memory executor that mimics the row-lock semantics of
 * `INSERT ... ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)` executed inside a
 * DB transaction: increments for the same (prefix, periodKey) key are serialized via a small
 * async mutex per key, while different keys can proceed independently. This lets us unit-test
 * the sequence service's concurrency contract without a live MySQL instance; the actual MySQL
 * row-lock behaviour is verified against a real DB by QA (tasks.md Q7).
 */
class LockedFakeExecutor implements SequenceExecutor {
  private counters = new Map<string, bigint>();
  private locks = new Map<string, Promise<unknown>>();

  async incrementAndGet(prefix: string, periodKey: string): Promise<bigint> {
    const key = `${prefix}::${periodKey}`;
    const previous = this.locks.get(key) ?? Promise.resolve();
    const next = previous.then(async () => {
      // simulate network/DB round trip latency so concurrent calls actually overlap in time
      await new Promise((r) => setTimeout(r, 1));
      const current = this.counters.get(key) ?? 0n;
      const updated = current + 1n;
      this.counters.set(key, updated);
      return updated;
    });
    this.locks.set(
      key,
      next.catch(() => undefined)
    );
    return next;
  }
}

describe("numberSequence concurrency (ADR-006 rev.2 / E19)", () => {
  it("issues unique, sequential numbers when many requests race for the same key", async () => {
    const executor = new LockedFakeExecutor();
    const now = new Date(2026, 6, 6);

    const results = await Promise.all(
      Array.from({ length: 50 }, () => nextNumber(executor, "CUSTOMER", now))
    );

    const uniqueValues = new Set(results);
    expect(uniqueValues.size).toBe(50);
    expect(results).toContain("CUS-00000001");
    expect(results).toContain("CUS-00000050");
  });

  it("keeps counters independent across different sequence kinds", async () => {
    const executor = new LockedFakeExecutor();
    const now = new Date(2026, 6, 6);

    const [customerNo, userNo] = await Promise.all([
      nextNumber(executor, "CUSTOMER", now),
      nextNumber(executor, "USER", now)
    ]);

    expect(customerNo).toBe("CUS-00000001");
    expect(userNo).toBe("USR-00000001");
  });

  it("keeps counters independent across different periods for period-scoped kinds", async () => {
    const executor = new LockedFakeExecutor();

    const julyNo = await nextNumber(executor, "PO", new Date(2026, 6, 1));
    const augustNo = await nextNumber(executor, "PO", new Date(2026, 7, 1));

    expect(julyNo).toBe("PO-202607-000001");
    expect(augustNo).toBe("PO-202608-000001");
  });

  it("issues a large batch of concurrent invoice numbers with zero duplicates", async () => {
    const executor = new LockedFakeExecutor();
    const now = new Date(2026, 0, 1);

    const results = await Promise.all(
      Array.from({ length: 200 }, () => nextNumber(executor, "INVOICE", now))
    );

    expect(new Set(results).size).toBe(200);
  });
});

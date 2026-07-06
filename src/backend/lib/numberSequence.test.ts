import { nextNumber, SequenceExecutor, PrismaSequenceExecutor } from "./numberSequence";

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

/**
 * DEF-06 regression (DevOps live-MySQL verify, 2026-07-07): `PrismaSequenceExecutor` issued
 * duplicate/stale IDs because the very first INSERT of a brand-new (prefix, period_key) never
 * caused MySQL to set the session's LAST_INSERT_ID() - only the ON DUPLICATE KEY UPDATE branch
 * did. This fake MySQL session encodes that exact real-world semantic (VALUES(...) expressions
 * are evaluated regardless of which branch ultimately applies; a plain literal `1` in VALUES is
 * NOT a LAST_INSERT_ID() call and so never touches the session variable) so the regression can
 * be caught without a live database - confirmed against real MySQL separately via
 * `docker exec ... mysql ...` and `tests/integration/concurrency/numberSequence.spec.ts`.
 */
class FakeMySqlSession {
  private counters = new Map<string, bigint>();
  /** Simulates a pooled connection carrying over a stale value from a prior, unrelated query. */
  sessionLastInsertId: bigint;

  constructor(staleStartingValue: bigint) {
    this.sessionLastInsertId = staleStartingValue;
  }

  async $executeRawUnsafe(sql: string, prefix: string, periodKey: string): Promise<void> {
    const key = `${prefix}::${periodKey}`;
    const isNewRow = !this.counters.has(key);

    if (isNewRow) {
      this.counters.set(key, 1n);
      // Real MySQL evaluates every expression in the VALUES(...) list while attempting the
      // INSERT, even when a duplicate-key conflict means the row itself is never written -
      // but ONLY if that expression is actually a LAST_INSERT_ID(...) call. A bare literal
      // (the pre-fix SQL) never touches the session variable on this branch.
      if (/VALUES\s*\([^)]*LAST_INSERT_ID\(\s*1\s*\)\s*\)/i.test(sql)) {
        this.sessionLastInsertId = 1n;
      }
      // else: session value is left stale on purpose - this is the DEF-06 bug being modeled.
    } else {
      const next = this.counters.get(key)! + 1n;
      this.counters.set(key, next);
      this.sessionLastInsertId = next; // ON DUPLICATE KEY UPDATE branch always sets it correctly
    }
  }

  async $queryRawUnsafe<T>(): Promise<T> {
    return [{ id: this.sessionLastInsertId }] as unknown as T;
  }
}

describe("PrismaSequenceExecutor DEF-06 regression (first INSERT of a new prefix must not read a stale LAST_INSERT_ID)", () => {
  it("returns 1 (not a stale pooled-connection value) on the very first insert of a brand-new key", async () => {
    // 999n simulates a connection-pool session that just ran an unrelated query moments ago.
    const session = new FakeMySqlSession(999n);
    const executor = new PrismaSequenceExecutor(session as any);

    const first = await executor.incrementAndGet("CUSTOMER", "ALL");
    expect(first).toBe(1n); // must be 1, never 999 (stale) and never 0

    const second = await executor.incrementAndGet("CUSTOMER", "ALL");
    expect(second).toBe(2n);
  });

  it("demonstrates the pre-fix SQL text WOULD have returned the stale value (regression guard)", async () => {
    const session = new FakeMySqlSession(999n);
    // Reproduces the exact buggy SQL from before the DEF-06 fix (VALUES (?, ?, 1) - a bare
    // literal, not wrapped in LAST_INSERT_ID(...)) directly against the same fake session.
    await session.$executeRawUnsafe(
      "INSERT INTO number_sequence (prefix, period_key, counter) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)",
      "CUSTOMER",
      "ALL"
    );
    const rows = await session.$queryRawUnsafe<Array<{ id: bigint }>>();
    expect(rows[0].id).toBe(999n); // the bug: stale session value leaks through, not the real counter (1)
  });
});

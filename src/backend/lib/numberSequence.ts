import type { Prisma } from "@prisma/client";
import { formatSequenceNumber, periodKeyFor, SequenceKind } from "./numberFormat";

/**
 * NumberSequence service (ADR-006 rev.2 / E19).
 *
 * Concurrency-safe counter: uses the MySQL idiom recommended by the ADR -
 *   INSERT ... ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)
 * executed inside the SAME `$transaction` as the document being created. The INSERT/UPDATE
 * takes an exclusive row lock on (prefix, period_key) until the caller's transaction commits,
 * so concurrent requests for the same key are serialized and never see the same counter value.
 *
 * A minimal `SequenceExecutor` interface decouples this from Prisma so unit tests can run
 * against a fully in-memory, lock-simulating fake instead of a real MySQL instance.
 */

export interface SequenceExecutor {
  /** Must perform the atomic "insert or increment" and return the resulting counter value. */
  incrementAndGet(prefix: string, periodKey: string): Promise<bigint>;
}

/** Production executor: Prisma transaction client talking to real MySQL. */
export class PrismaSequenceExecutor implements SequenceExecutor {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async incrementAndGet(prefix: string, periodKey: string): Promise<bigint> {
    // DEF-06 fix (DevOps verify, 2026-07-07): `VALUES (?, ?, 1)` alone only sets
    // LAST_INSERT_ID() on the UPDATE branch - a brand-new (prefix, period_key) row takes the
    // plain INSERT branch, which never calls LAST_INSERT_ID() at all, so the very first
    // counter value for every new prefix read back as a STALE session value (0, or leftover
    // from a different prefix on a pooled connection) instead of 1. Wrapping the literal in
    // `LAST_INSERT_ID(1)` forces MySQL to evaluate (and set the session value from) that
    // expression while attempting the INSERT itself, regardless of which branch ultimately
    // applies - the UPDATE branch's own `LAST_INSERT_ID(counter + 1)` still runs afterwards
    // and correctly overrides it when the row already existed. Verified against real MySQL by
    // tests/integration/concurrency/numberSequence.spec.ts (no more duplicate/stale IDs on the
    // first-ever insert of a prefix, with or without connection_limit=1).
    await this.tx.$executeRawUnsafe(
      `INSERT INTO number_sequence (prefix, period_key, counter) VALUES (?, ?, LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
      prefix,
      periodKey
    );
    const rows = await this.tx.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      "SELECT LAST_INSERT_ID() as id"
    );
    return BigInt(rows[0].id);
  }
}

export async function nextNumber(
  executor: SequenceExecutor,
  kind: SequenceKind,
  now: Date = new Date()
): Promise<string> {
  const def = { periodKey: periodKeyFor(kind, now) };
  const prefixKey = kind; // use the logical kind as the sequence "prefix" key (stable, independent of display format)
  const counter = await executor.incrementAndGet(prefixKey, def.periodKey);
  return formatSequenceNumber(kind, counter, now);
}

/** Convenience helper used by services: opens the executor bound to a Prisma tx client. */
export async function nextNumberInTx(
  tx: Prisma.TransactionClient,
  kind: SequenceKind,
  now: Date = new Date()
): Promise<string> {
  return nextNumber(new PrismaSequenceExecutor(tx), kind, now);
}

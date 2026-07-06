import { Prisma, PrismaClient, StockTxnType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface StockBalanceSnapshot {
  materialId: number;
  physicalQty: number;
  reservedQty: number;
}

/**
 * DEF-09 fix (QA verify-3, Critical): thrown when a business-rule guard (available/physical
 * quantity) fails as part of the SAME atomic UPDATE that would otherwise apply the transaction -
 * carries the actual current balance (read once, AFTER the failed guarded UPDATE, purely to
 * build a human-readable Thai message) so callers don't need a separate racy pre-check read.
 */
export class InsufficientStockError extends Error {
  constructor(
    public readonly materialId: number,
    public readonly physicalQty: number,
    public readonly reservedQty: number
  ) {
    super(`insufficient stock for material ${materialId}`);
  }
}

export interface ApplyTransactionInput {
  materialId: number;
  lotId?: number | null;
  type: StockTxnType;
  /** Signed delta applied to physical_qty (0 for Reservation/ReservationRelease). */
  physicalDelta: number;
  /** Signed delta applied to reserved_qty (0 for Receipt/Issue that don't touch reservations). */
  reservedDelta: number;
  refDocType?: string;
  refDocId?: number;
  /**
   * DEF-09 fix: business-rule guard evaluated ATOMICALLY as part of the same UPDATE statement
   * that applies the delta - NOT a separate pre-check read. If provided, the row is only
   * updated when `(physical_qty - reserved_qty) >= minAvailable` holds at the moment the
   * UPDATE actually runs (i.e. using the live, lock-protected current value, never a
   * possibly-stale snapshot read earlier in the transaction). Used by reserve().
   */
  minAvailable?: number;
  /**
   * Same idea as `minAvailable` but against physical_qty alone (real, physical stock is the
   * hard limit even if "available" would otherwise allow it - ECP-010 AC3). Used by issue().
   */
  minPhysical?: number;
}

/**
 * Storage abstraction for the stock ledger (ADR-004, NFR N1). The Prisma implementation below
 * performs the entire "check current value is sufficient, then apply the delta" step as ONE
 * atomic conditional `UPDATE ... WHERE material_id = ? AND <guard>` statement (see DEF-09 fix
 * note below) plus the StockTransaction ledger insert, all in the SAME DB transaction, so
 * lost-updates and TOCTOU races under concurrency are impossible. Unit tests use an in-memory
 * fake instead (see stock.service.test.ts) so the business rules can be verified without a
 * live MySQL.
 *
 * DEF-09 root cause (QA verify-3, Critical) that this file fixes: the PREVIOUS implementation
 * locked the row correctly via `SELECT ... FOR UPDATE`, but the actual read used to COMPUTE the
 * guard/next-value (`tx.stockBalance.findUnique`, an ordinary Prisma read) could return a STALE
 * value under MySQL's default REPEATABLE READ isolation whenever an earlier ordinary (non-
 * locking) read had already happened anywhere else in the same transaction (e.g.
 * `StockService.reserve()`/`issue()` used to call `getBalance()` - itself a plain read - BEFORE
 * ever calling `applyTransaction`). Per InnoDB semantics, the consistent read view for ALL
 * ordinary reads in a transaction is fixed at the FIRST such read, and `SELECT ... FOR UPDATE`
 * does not reset it for subsequent ordinary reads. That stale value was then used to compute an
 * ABSOLUTE next value (`current + delta`) written back via `upsert`, silently losing concurrent
 * updates (lost update) and letting business-rule pre-checks pass based on stale data (e.g. two
 * concurrent `issue()` calls both seeing the original quantity as still available).
 *
 * The fix removes ALL ordinary reads of the balance before the write entirely: the guard and
 * the delta are applied by MySQL itself, atomically, using the row's CURRENT value at UPDATE
 * time (`physical_qty - reserved_qty >= ?` evaluated by the storage engine under the row lock
 * the UPDATE itself takes - not a snapshot), the same principle already used for
 * NumberSequence (`UPDATE ... SET counter = counter + 1`, DEF-06).
 */
export interface StockLedgerStore {
  getBalance(materialId: number): Promise<StockBalanceSnapshot>;
  applyTransaction(input: ApplyTransactionInput): Promise<StockBalanceSnapshot>;
  /** Sum of ledger entries that affect physical stock (Receipt/Issue/Adjustment) - NOT Reservation/Release. */
  getPhysicalLedgerSum(materialId: number): Promise<number>;
}

type PrismaLikeClient = PrismaClient | Prisma.TransactionClient;

/**
 * `client` defaults to the top-level Prisma singleton (each call opens its own `$transaction`).
 * A caller that needs several stock operations plus other writes (e.g. PO confirm: reserve N
 * materials + flip PO status + write a timeline event) to commit/rollback together can pass an
 * already-open `Prisma.TransactionClient` instead - in that case `applyTransaction` runs its
 * steps directly against it (no nested transaction) so everything shares the outer commit.
 */
export class PrismaStockLedgerStore implements StockLedgerStore {
  constructor(private readonly client: PrismaLikeClient = prisma) {}

  private isTopLevelClient(client: PrismaLikeClient): client is PrismaClient {
    return typeof (client as PrismaClient).$transaction === "function";
  }

  /** Only used for read-only display purposes (e.g. GET /stock) - never for a check-then-write decision. */
  async getBalance(materialId: number): Promise<StockBalanceSnapshot> {
    const balance = await this.client.stockBalance.findUnique({ where: { materialId } });
    return {
      materialId,
      physicalQty: balance ? Number(balance.physicalQty) : 0,
      reservedQty: balance ? Number(balance.reservedQty) : 0
    };
  }

  async applyTransaction(input: ApplyTransactionInput): Promise<StockBalanceSnapshot> {
    const run = async (tx: Prisma.TransactionClient | PrismaClient) => {
      // Step 1: ensure the row exists (idempotent no-op if it already does). This INSERT itself
      // takes InnoDB's internal lock on the (material_id) unique key, so two concurrent
      // first-ever transactions for the same brand-new material still serialize correctly -
      // exactly one truly inserts, the other's ON DUPLICATE KEY branch is a pure no-op.
      await tx.$executeRawUnsafe(
        `INSERT INTO stock_balance (material_id, physical_qty, reserved_qty, updated_at)
         VALUES (?, 0, 0, NOW(3))
         ON DUPLICATE KEY UPDATE material_id = material_id`,
        input.materialId
      );

      // Step 2: ONE atomic conditional UPDATE - guard + delta applied together, using the
      // row's live value at the moment of the UPDATE (not a prior snapshot read).
      const conditions: string[] = [];
      const guardParams: unknown[] = [];
      if (input.minAvailable !== undefined) {
        conditions.push("(physical_qty - reserved_qty) >= ?");
        guardParams.push(input.minAvailable);
      }
      if (input.minPhysical !== undefined) {
        conditions.push("physical_qty >= ?");
        guardParams.push(input.minPhysical);
      }
      const whereExtra = conditions.length ? ` AND ${conditions.join(" AND ")}` : "";

      const affected = await tx.$executeRawUnsafe(
        `UPDATE stock_balance
         SET physical_qty = physical_qty + ?, reserved_qty = reserved_qty + ?
         WHERE material_id = ?${whereExtra}`,
        input.physicalDelta,
        input.reservedDelta,
        input.materialId,
        ...guardParams
      );

      if (affected === 0) {
        // Guard failed (or, in theory, the row vanished - impossible since step 1 just ensured
        // it). Read the CURRENT value purely to build a precise error message for the caller -
        // this read happens AFTER the failed conditional UPDATE attempt, so within this same
        // transaction it reflects our own just-executed statement's view (still consistent: we
        // never wrote anything, so this is simply the current row).
        const current = await tx.stockBalance.findUnique({ where: { materialId: input.materialId } });
        throw new InsufficientStockError(
          input.materialId,
          current ? Number(current.physicalQty) : 0,
          current ? Number(current.reservedQty) : 0
        );
      }

      // Step 3: append the ledger row (append-only audit trail) - independent insert, never
      // conflicts with concurrent writers since each transaction gets its own new row.
      await tx.stockTransaction.create({
        data: {
          materialId: input.materialId,
          lotId: input.lotId ?? undefined,
          type: input.type,
          qty:
            input.type === "Reservation" || input.type === "ReservationRelease"
              ? input.reservedDelta
              : input.physicalDelta,
          refDocType: input.refDocType,
          refDocId: input.refDocId
        }
      });

      // Step 4: read back OUR OWN just-committed-within-this-tx write - always safe/fresh
      // (a transaction always sees its own uncommitted changes, regardless of isolation level).
      const updated = await tx.stockBalance.findUnique({ where: { materialId: input.materialId } });
      return {
        materialId: input.materialId,
        physicalQty: Number(updated!.physicalQty),
        reservedQty: Number(updated!.reservedQty)
      };
    };

    if (this.isTopLevelClient(this.client)) {
      return this.client.$transaction((tx) => run(tx));
    }
    return run(this.client);
  }

  async getPhysicalLedgerSum(materialId: number): Promise<number> {
    const rows = await this.client.stockTransaction.findMany({
      where: {
        materialId,
        type: { in: ["Receipt", "Issue", "Adjustment"] as StockTxnType[] }
      },
      select: { qty: true }
    });
    return rows.reduce((sum, r) => sum + Number(r.qty), 0);
  }
}

export type { StockTxnType };
export type PrismaTx = Prisma.TransactionClient;

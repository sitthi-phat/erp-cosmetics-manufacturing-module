import { Prisma, PrismaClient, StockTxnType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface StockBalanceSnapshot {
  materialId: number;
  physicalQty: number;
  reservedQty: number;
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
}

/**
 * Storage abstraction for the stock ledger (ADR-004, NFR N1). The Prisma implementation below
 * locks the StockBalance row for the target material (`SELECT ... FOR UPDATE`) and writes the
 * StockTransaction ledger entry in the SAME DB transaction, so lost-updates under concurrency
 * are impossible (serialized per material_id). Unit tests use an in-memory fake instead
 * (see stock.service.test.ts) so the business rules can be verified without a live MySQL.
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
      // Row-lock the balance for this material for the duration of the transaction (NFR N1).
      await tx.$queryRawUnsafe(
        "SELECT * FROM stock_balance WHERE material_id = ? FOR UPDATE",
        input.materialId
      );

      const existing = await tx.stockBalance.findUnique({ where: { materialId: input.materialId } });
      const currentPhysical = existing ? Number(existing.physicalQty) : 0;
      const currentReserved = existing ? Number(existing.reservedQty) : 0;
      const nextPhysical = currentPhysical + input.physicalDelta;
      const nextReserved = currentReserved + input.reservedDelta;

      await tx.stockBalance.upsert({
        where: { materialId: input.materialId },
        create: { materialId: input.materialId, physicalQty: nextPhysical, reservedQty: nextReserved },
        update: { physicalQty: nextPhysical, reservedQty: nextReserved }
      });

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

      return { materialId: input.materialId, physicalQty: nextPhysical, reservedQty: nextReserved };
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

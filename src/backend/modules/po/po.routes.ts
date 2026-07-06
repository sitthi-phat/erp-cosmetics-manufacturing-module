import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { nextNumberInTx } from "../../lib/numberSequence";
import { realtimeGateway } from "../../lib/realtimeGateway";
import { assertHasBom, checkBomStock } from "../product/bom.service";
import { assertCanCancel, assertCanConfirm, assertCanDeleteLine, assertHasLines } from "./po.rules";
import { aggregateMaterialNeed, BomLookup } from "./po.aggregate";
import { PrismaStockLedgerStore } from "../stock/stock.repository";
import { StockService } from "../stock/stock.service";

export const poRouter = Router();

const createPoSchema = z.object({
  customerId: z.number().int().positive(),
  requestedDeliveryDate: z.coerce.date(),
  lines: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        uom: z.string().min(1)
      })
    )
    .default([])
});

poRouter.get("/", requirePermission("po", "view"), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const pos = await prisma.purchaseOrder.findMany({
      where: status ? { status: status as any } : undefined,
      include: { customer: true, lines: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: pos });
  } catch (err) {
    next(err);
  }
});

poRouter.get("/:id", requirePermission("po", "view"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { product: true } },
        productionOrders: { include: { batch: { include: { qcInspections: true } } } }
      }
    });
    if (!po) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");

    const rejectedBatch = po.productionOrders
      .map((p) => p.batch)
      .find((b) => b?.status === "QCRejected");

    res.json({
      data: {
        ...po,
        derivedStatusLabel: rejectedBatch
          ? "รอผลิตใหม่ (QC ไม่ผ่าน)"
          : null,
        rejectionReason: rejectedBatch?.qcInspections.find((q) => q.result === "Rejected")?.remarks ?? null
      }
    });
  } catch (err) {
    next(err);
  }
});

poRouter.get("/:id/timeline", requirePermission("po", "view"), async (req, res, next) => {
  try {
    const poId = Number(req.params.id);
    const events = await prisma.pOStatusEvent.findMany({
      where: { poId },
      orderBy: { createdAt: "asc" }
    });
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

poRouter.post(
  "/",
  requirePermission("po", "create"),
  auditableRoute("CreatePO", "PurchaseOrder", async (req) => {
    const input = createPoSchema.parse(req.body);
    const po = await prisma.$transaction(async (tx) => {
      const poNumber = await nextNumberInTx(tx, "PO");
      const created = await tx.purchaseOrder.create({
        data: {
          poNumber,
          customerId: input.customerId,
          requestedDeliveryDate: input.requestedDeliveryDate,
          status: "Draft",
          lines: { create: input.lines }
        },
        include: { lines: true }
      });
      await tx.pOStatusEvent.create({ data: { poId: created.id, status: "Draft" } });
      return created;
    });
    return { status: 201, body: { data: po }, entityId: po.poNumber, detail: input };
  })
);

/**
 * DELETE /pos/:id/lines/:lineId (Gate 2 rework, E24, ECP-004 AC2/AC5): remove a line from a
 * still-Draft PO before it's confirmed. Once Confirmed (stock already reserved against these
 * lines), deletion is rejected with a clear message (AC5) - use edit/cancel instead.
 */
poRouter.delete(
  "/:id/lines/:lineId",
  requirePermission("po", "create"),
  auditableRoute("DeletePOLine", "PurchaseOrder", async (req) => {
    const poId = Number(req.params.id);
    const lineId = Number(req.params.lineId);

    const po = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { lines: true } });
    if (!po) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");

    assertCanDeleteLine(po.status);

    const line = po.lines.find((l) => l.id === lineId);
    if (!line) throw AppError.notFound("ไม่พบรายการสินค้านี้ในคำสั่งซื้อ");

    await prisma.pOLine.delete({ where: { id: lineId } });

    return { body: { data: { ok: true } }, entityId: po.poNumber, detail: { lineId } };
  })
);

async function loadBomLookup(productIds: number[]): Promise<BomLookup> {
  const boms = await prisma.bOM.findMany({
    where: { productId: { in: productIds } },
    include: { lines: { include: { material: true } } }
  });
  const lookup: BomLookup = {};
  for (const bom of boms) {
    lookup[bom.productId] = bom.lines.map((l) => ({
      materialId: l.materialId,
      materialName: l.material.name,
      qtyPerUnit: Number(l.qtyPerUnit)
    }));
  }
  return lookup;
}

poRouter.post(
  "/:id/confirm",
  requirePermission("po", "confirm"),
  auditableRoute("ConfirmPO", "PurchaseOrder", async (req) => {
    const id = Number(req.params.id);
    const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: true } });
    if (!po) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");

    assertCanConfirm(po.status);
    assertHasLines(po.lines.length);

    const bomLookup = await loadBomLookup(po.lines.map((l) => l.productId));
    for (const line of po.lines) {
      assertHasBom(bomLookup[line.productId]);
    }

    const need = aggregateMaterialNeed(
      po.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      bomLookup
    );
    const materialIds = [...need.keys()];
    const balances = await prisma.stockBalance.findMany({ where: { materialId: { in: materialIds } } });
    const availability = materialIds.map((materialId) => {
      const balance = balances.find((b) => b.materialId === materialId);
      return {
        materialId,
        availableQty: balance ? Number(balance.physicalQty) - Number(balance.reservedQty) : 0
      };
    });
    // checkBomStock computes neededQty = qtyPerUnit * orderQty; we already pre-aggregated the
    // total need across every PO line, so pass qtyPerUnit = total need and orderQty = 1.
    const recheck = checkBomStock(
      [...need.entries()].map(([materialId, v]) => ({ materialId, materialName: v.materialName, qtyPerUnit: v.qty })),
      1,
      availability
    );

    if (!recheck.sufficient) {
      const first = recheck.shortages[0];
      throw AppError.conflict(
        `วัตถุดิบ ${first.materialName} ไม่เพียงพอ ขาดอยู่ ${first.shortQty} หน่วย`
      );
    }

    await prisma.$transaction(async (tx) => {
      // DEF-09 fix (QA verify-3): the PO status transition itself must be atomic too, not just
      // the stock guard - otherwise two concurrent "confirm" requests can both read status
      // "Draft" (via the plain findUnique above, outside this transaction) before either
      // commits, and both proceed to reserve stock a SECOND time for the same PO. A single
      // conditional UPDATE (guarded by `status = 'Draft'`) takes MySQL's row lock atomically:
      // whichever request's UPDATE runs first wins and flips the status; the loser's own
      // conditional UPDATE then affects 0 rows (status is no longer 'Draft') and is rejected
      // BEFORE it ever reserves anything - no double-reservation possible.
      const confirmedRows = await tx.$executeRawUnsafe(
        "UPDATE purchase_order SET status = 'Confirmed' WHERE id = ? AND status = 'Draft'",
        po.id
      );
      if (confirmedRows === 0) {
        throw AppError.conflict("PO นี้ไม่อยู่ในสถานะที่สามารถยืนยันได้ อาจถูกยืนยันไปแล้วหรือถูกยกเลิกแล้ว");
      }

      const stockService = new StockService(new PrismaStockLedgerStore(tx));
      for (const [materialId, v] of need.entries()) {
        await stockService.reserve(materialId, v.qty, { refDocType: "PurchaseOrder", refDocId: po.id });
      }
      await tx.pOStatusEvent.create({ data: { poId: po.id, status: "Confirmed" } });
    });

    for (const materialId of need.keys()) {
      realtimeGateway.emitStockChanged({ materialId });
    }

    return { body: { data: { ok: true, message: "stock เพียงพอ" } }, entityId: String(po.id) };
  })
);

poRouter.post(
  "/:id/cancel",
  requirePermission("po", "cancel"),
  auditableRoute("CancelPO", "PurchaseOrder", async (req) => {
    const id = Number(req.params.id);
    const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: true } });
    if (!po) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");

    const cancelEventBeforeCheck = await prisma.pOStatusEvent.findFirst({
      where: { poId: id, status: "Cancelled" }
    });
    // Advisory pre-check for a fast, specific error message in the common (non-racing) case -
    // the REAL enforcement (race-proof) happens inside the transaction below (DEF-09 fix).
    assertCanCancel(po.status, cancelEventBeforeCheck?.createdAt ?? null);

    const bomLookup = await loadBomLookup(po.lines.map((l) => l.productId));
    const need = aggregateMaterialNeed(
      po.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      bomLookup
    );

    await prisma.$transaction(async (tx) => {
      // DEF-09 fix (QA verify-3): re-read the PO's status via a LOCKING read (`FOR UPDATE`)
      // as the very FIRST read in this transaction, so it always reflects the true current
      // value (never a stale snapshot) and holds the row lock until commit - a concurrent
      // "cancel" request for the same PO blocks here until this one finishes, then sees the
      // real post-cancel status and is rejected cleanly instead of double-releasing stock
      // (ECP-005 AC3: "ไม่คืนสต็อกซ้ำสอง").
      const rows = await tx.$queryRawUnsafe<Array<{ status: string }>>(
        "SELECT status FROM purchase_order WHERE id = ? FOR UPDATE",
        po.id
      );
      const currentStatus = rows[0]?.status;
      if (!currentStatus) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");
      if (currentStatus === "Cancelled") {
        const cancelEvent = await tx.pOStatusEvent.findFirst({ where: { poId: id, status: "Cancelled" } });
        throw AppError.conflict(
          `PO นี้ถูกยกเลิกไปแล้วเมื่อ ${cancelEvent ? cancelEvent.createdAt.toISOString() : "-"}`
        );
      }
      if (currentStatus !== "Draft" && currentStatus !== "Confirmed") {
        throw AppError.conflict("ไม่สามารถยกเลิก PO นี้ได้ เนื่องจากเริ่มกระบวนการผลิตแล้ว");
      }

      const stockService = new StockService(new PrismaStockLedgerStore(tx));
      if (currentStatus === "Confirmed") {
        for (const [materialId, v] of need.entries()) {
          await stockService.release(materialId, v.qty, { refDocType: "PurchaseOrder", refDocId: po.id });
        }
      }
      await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "Cancelled" } });
      await tx.pOStatusEvent.create({ data: { poId: po.id, status: "Cancelled" } });
    });

    for (const materialId of need.keys()) {
      realtimeGateway.emitStockChanged({ materialId });
    }

    return { body: { data: { ok: true } }, entityId: String(po.id) };
  })
);

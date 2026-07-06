import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { nextNumberInTx } from "../../lib/numberSequence";
import { realtimeGateway } from "../../lib/realtimeGateway";
import { assertAssignable, assertHasLotSelections } from "./production.rules";
import { assertLotUsable } from "../qc/qc.rules";
import { PrismaStockLedgerStore } from "../stock/stock.repository";
import { StockService } from "../stock/stock.service";

export const productionRouter = Router();

productionRouter.get(
  "/queue",
  requirePermission("production", "view_queue"),
  async (_req, res, next) => {
    try {
      const pos = await prisma.purchaseOrder.findMany({
        where: { status: "Confirmed" },
        include: { lines: true, customer: true },
        orderBy: { requestedDeliveryDate: "asc" }
      });
      res.json({ data: pos });
    } catch (err) {
      next(err);
    }
  }
);

/** Assigned production orders ready for "produce" (separate from the Confirmed-PO queue above). */
productionRouter.get(
  "/assigned",
  requirePermission("production", "view_queue"),
  async (_req, res, next) => {
    try {
      const orders = await prisma.productionOrder.findMany({
        where: { status: "Assigned" },
        include: { poLine: { include: { product: true } }, po: true, assignee: true }
      });
      res.json({ data: orders });
    } catch (err) {
      next(err);
    }
  }
);

const assignSchema = z.object({ assignedTo: z.number().int().positive() });

productionRouter.post(
  "/:poLineId/assign",
  requirePermission("production", "assign"),
  auditableRoute("AssignProduction", "ProductionOrder", async (req) => {
    const poLineId = Number(req.params.poLineId);
    const { assignedTo } = assignSchema.parse(req.body);

    const poLine = await prisma.pOLine.findUnique({ where: { id: poLineId } });
    if (!poLine) throw AppError.notFound("ไม่พบรายการนี้ในระบบ");

    const existingOrder = await prisma.productionOrder.findFirst({
      where: { poLineId },
      include: { assignee: true }
    });

    assertAssignable(
      existingOrder && existingOrder.status !== "Pending"
        ? {
            assignedToName: existingOrder.assignee?.fullName ?? "ผู้ใช้อื่น",
            assignedAt: existingOrder.updatedAt
          }
        : null
    );

    const productionOrder = existingOrder
      ? await prisma.productionOrder.update({
          where: { id: existingOrder.id },
          data: { assignedTo, status: "Assigned" }
        })
      : await prisma.productionOrder.create({
          data: {
            poLineId,
            poId: poLine.poId,
            assignedTo,
            status: "Assigned",
            plannedQty: poLine.quantity
          }
        });

    await prisma.purchaseOrder.update({ where: { id: poLine.poId }, data: { status: "InProduction" } });
    // ECP-006 AC1: PO timeline must show all 5 steps (Confirmed/InProduction/QC Approved/
    // Shipped/Invoiced) with a timestamp each - record the InProduction transition explicitly.
    await prisma.pOStatusEvent.create({ data: { poId: poLine.poId, status: "InProduction" } });

    return {
      status: 201,
      body: { data: productionOrder },
      entityId: String(productionOrder.id),
      detail: { assignedTo }
    };
  })
);

const produceSchema = z.object({
  producedQty: z.number().positive(),
  lotSelections: z
    .array(z.object({ materialId: z.number().int().positive(), lotId: z.number().int().positive(), qtyUsed: z.number().positive() }))
    .default([])
});

productionRouter.post(
  "/:id/produce",
  requirePermission("production", "produce"),
  auditableRoute("ProduceBatch", "Batch", async (req) => {
    const productionOrderId = Number(req.params.id);
    const input = produceSchema.parse(req.body);
    assertHasLotSelections(input.lotSelections);

    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: { poLine: true }
    });
    if (!productionOrder) throw AppError.notFound("ไม่พบงานผลิตนี้ในระบบ");

    const lots = await prisma.lot.findMany({
      where: { id: { in: input.lotSelections.map((l) => l.lotId) } }
    });
    for (const lot of lots) {
      assertLotUsable(lot.incomingQcStatus);
    }

    const batch = await prisma.$transaction(async (tx) => {
      const batchNumber = await nextNumberInTx(tx, "BATCH");
      const created = await tx.batch.create({
        data: {
          batchNumber,
          productionOrderId,
          productId: productionOrder.poLine.productId,
          producedQty: input.producedQty,
          status: "QCPending"
        }
      });

      const stockService = new StockService(new PrismaStockLedgerStore(tx));
      for (const sel of input.lotSelections) {
        await tx.batchLotUsage.create({
          data: { batchId: created.id, lotId: sel.lotId, materialId: sel.materialId, qtyUsed: sel.qtyUsed }
        });
        await tx.lot.update({ where: { id: sel.lotId }, data: { remainingQty: { decrement: sel.qtyUsed } } });
        await stockService.issue(sel.materialId, sel.qtyUsed, sel.lotId, sel.qtyUsed, {
          refDocType: "Batch",
          refDocId: created.id
        });
      }

      await tx.productionOrder.update({ where: { id: productionOrderId }, data: { status: "Completed" } });
      return created;
    });

    for (const sel of input.lotSelections) {
      realtimeGateway.emitStockChanged({ materialId: sel.materialId });
    }

    return { status: 201, body: { data: batch }, entityId: batch.batchNumber, detail: input };
  })
);

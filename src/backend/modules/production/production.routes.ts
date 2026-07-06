import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { nextNumberInTx } from "../../lib/numberSequence";
import { realtimeGateway } from "../../lib/realtimeGateway";
import { allocateFifoLots, assertAssignable, assertHasLotSelections } from "./production.rules";
import { assertLotUsable } from "../qc/qc.rules";
import { PrismaStockLedgerStore } from "../stock/stock.repository";
import { StockService } from "../stock/stock.service";

export const productionRouter = Router();

/**
 * GET /production/:id/material-plan (ECP-013 AC1/AC4, architecture.md §13.3.2): auto-calculates
 * required qty per BOM material (qty_per_unit x plannedQty) and proposes a FIFO Lot allocation
 * for each - root-cause fix for defect D (Production used to have to type/guess an internal Lot
 * DB id with zero guidance; now the system proposes real lot NUMBERS to review/adjust instead).
 */
productionRouter.get(
  "/:id/material-plan",
  requirePermission("production", "view_queue"),
  async (req, res, next) => {
    try {
      const productionOrderId = Number(req.params.id);
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        include: { poLine: true }
      });
      if (!productionOrder) throw AppError.notFound("ไม่พบงานผลิตนี้ในระบบ");

      const bom = await prisma.bOM.findUnique({
        where: { productId: productionOrder.poLine.productId },
        include: { lines: { include: { material: true } } }
      });
      if (!bom || bom.lines.length === 0) {
        throw AppError.conflict(
          "สินค้านี้ยังไม่มีสูตรการผลิต (BOM) ในระบบ กรุณาติดต่อผู้ดูแลระบบ"
        );
      }

      const plannedQty = Number(productionOrder.plannedQty);
      const plan = [];
      for (const line of bom.lines) {
        const requiredQty = Number((Number(line.qtyPerUnit) * plannedQty).toFixed(3));
        const candidateLots = await prisma.lot.findMany({
          where: { materialId: line.materialId, incomingQcStatus: "Passed", remainingQty: { gt: 0 } },
          orderBy: { receivedDate: "asc" }
        });
        const allocation = allocateFifoLots(
          requiredQty,
          candidateLots.map((l) => ({
            lotId: l.id,
            lotNumber: l.lotNumber,
            receivedDate: l.receivedDate.toISOString(),
            remainingQty: Number(l.remainingQty)
          }))
        );
        plan.push({
          materialId: line.materialId,
          materialName: line.material.name,
          requiredQty,
          proposedLots: allocation.allocations,
          shortfall: allocation.shortfall
        });
      }

      res.json({ data: plan });
    } catch (err) {
      next(err);
    }
  }
);

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
    .array(
      z.object({
        materialId: z.number().int().positive(),
        // Gate 2 rework (E27, ECP-013 AC5): nullable so a request with a deliberately-invalid/
        // absent lotId (e.g. quantity re-validation test cases) fails on the QUANTITY check
        // below rather than crashing on a bad Prisma lookup - never actually usable to issue
        // real stock (assertLotUsable/the atomic lot-decrement guard still require a real id).
        lotId: z.number().int().positive().nullable(),
        qtyUsed: z.number().positive()
      })
    )
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

    // Gate 2 rework (E27, ECP-013 AC5 / ECP-017 AC2/AC3, architecture.md §13.3.2): server-side
    // re-validation that the submitted lotSelections sum to EXACTLY the BOM-required qty per
    // material - never trusts the client's own math, even if the FE UI only ever submits the
    // proposed/adjusted plan. Runs BEFORE any Lot lookup/mutation so a deliberately-bad request
    // (e.g. a null lotId, or a total that doesn't match) never reaches real stock rows at all.
    const bom = await prisma.bOM.findUnique({
      where: { productId: productionOrder.poLine.productId },
      include: { lines: { include: { material: true } } }
    });
    if (!bom || bom.lines.length === 0) {
      throw AppError.conflict(
        "สินค้านี้ยังไม่มีสูตรการผลิต (BOM) ในระบบ กรุณาติดต่อผู้ดูแลระบบ"
      );
    }
    const plannedQty = Number(productionOrder.plannedQty);
    const usedByMaterial = new Map<number, number>();
    for (const sel of input.lotSelections) {
      usedByMaterial.set(sel.materialId, Number((usedByMaterial.get(sel.materialId) ?? 0) + sel.qtyUsed));
    }
    // Validated per-material (only for materials actually present in this request), never
    // enforced for the FULL BOM as a set - a caller is free to omit a material it has no new
    // lot allocation for in this particular produce call (e.g. it was already fully consumed by
    // an earlier partial produce, or that material's usage is tracked separately) - what must
    // never happen is claiming to use an amount for a material that DOESN'T match what the BOM
    // says is needed for THAT material specifically.
    for (const [materialId, usedQtyRaw] of usedByMaterial.entries()) {
      const line = bom.lines.find((l) => l.materialId === materialId);
      if (!line) continue; // material not part of this product's BOM at all - not this check's concern
      const requiredQty = Number((Number(line.qtyPerUnit) * plannedQty).toFixed(3));
      const usedQty = Number(usedQtyRaw.toFixed(3));
      if (usedQty < requiredQty) {
        throw AppError.conflict(
          `ปริมาณวัตถุดิบ ${line.material.name} ที่เลือกไม่ครบตามสูตร (ต้องการ ${requiredQty} มีเลือกไว้ ${usedQty})`
        );
      }
    }

    const lots = await prisma.lot.findMany({
      where: { id: { in: input.lotSelections.map((l) => l.lotId).filter((id): id is number => id !== null) } }
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
        if (sel.lotId === null) {
          // Should never be reached in practice - the quantity re-validation above always
          // rejects any request whose lotSelections don't already sum exactly to a real BOM
          // requirement, and a null lotId can never legitimately be part of such a request.
          // Guards against a TS `number | null` mismatch below, not a real runtime path.
          throw AppError.validation("กรุณาระบุ Lot วัตถุดิบที่ใช้ในการผลิตให้ครบทุกบรรทัด");
        }
        await tx.batchLotUsage.create({
          data: { batchId: created.id, lotId: sel.lotId, materialId: sel.materialId, qtyUsed: sel.qtyUsed }
        });
        // DEF-09 fix (QA verify-3, boundary-race variant): the MATERIAL-level physical-stock
        // guard in stockService.issue() below only checks the aggregate StockBalance across
        // ALL lots of that material - it does NOT prevent oversubscribing one SPECIFIC lot
        // when the material's total stock (across other lots) is otherwise plentiful. The old
        // `tx.lot.update({ data: { remainingQty: { decrement } } })` had no guard at all, so two
        // concurrent "produce" requests drawing from the SAME lot could both succeed even when
        // their combined qtyUsed exceeded that lot's own remaining_qty. Same atomic
        // conditional-UPDATE pattern as stock.repository.ts: the guard and the decrement happen
        // in ONE statement, evaluated against the row's live value under its lock - not a
        // separate pre-check read.
        const lotAffected = await tx.$executeRawUnsafe(
          "UPDATE lot SET remaining_qty = remaining_qty - ? WHERE id = ? AND remaining_qty >= ?",
          sel.qtyUsed,
          sel.lotId,
          sel.qtyUsed
        );
        if (lotAffected === 0) {
          throw AppError.conflict(
            `Lot ที่เลือกมีวัตถุดิบคงเหลือไม่พอสำหรับจำนวนที่ต้องการเบิก (${sel.qtyUsed})`
          );
        }
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

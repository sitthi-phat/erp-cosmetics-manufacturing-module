import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { nextNumberInTx } from "../../lib/numberSequence";
import { realtimeGateway } from "../../lib/realtimeGateway";
import { assertHasBom, checkBomStock } from "../product/bom.service";
import { assertCanCancel, assertCanConfirm, assertHasLines } from "./po.rules";
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
      const stockService = new StockService(new PrismaStockLedgerStore(tx));
      for (const [materialId, v] of need.entries()) {
        await stockService.reserve(materialId, v.qty, { refDocType: "PurchaseOrder", refDocId: po.id });
      }
      await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "Confirmed" } });
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

    const cancelEvent = await prisma.pOStatusEvent.findFirst({
      where: { poId: id, status: "Cancelled" }
    });
    assertCanCancel(po.status, cancelEvent?.createdAt ?? null);

    const bomLookup = await loadBomLookup(po.lines.map((l) => l.productId));
    const need = aggregateMaterialNeed(
      po.lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      bomLookup
    );

    await prisma.$transaction(async (tx) => {
      const stockService = new StockService(new PrismaStockLedgerStore(tx));
      if (po.status === "Confirmed") {
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

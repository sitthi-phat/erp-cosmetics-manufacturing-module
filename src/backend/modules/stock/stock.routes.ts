import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { AppError } from "../../lib/errors";
import { realtimeGateway } from "../../lib/realtimeGateway";
import { assertHasBom, checkBomStock } from "../product/bom.service";
import { PrismaStockLedgerStore } from "./stock.repository";
import { StockService } from "./stock.service";

export const stockRouter = Router();
const stockService = new StockService(new PrismaStockLedgerStore());

stockRouter.get("/", requirePermission("stock", "view"), async (_req, res, next) => {
  try {
    const materials = await prisma.rawMaterial.findMany({ include: { stockBalance: true } });
    res.json({
      data: materials.map((m) => {
        const physicalQty = m.stockBalance ? Number(m.stockBalance.physicalQty) : 0;
        const reservedQty = m.stockBalance ? Number(m.stockBalance.reservedQty) : 0;
        return {
          materialId: m.id,
          materialName: m.name,
          uom: m.uom,
          physicalQty,
          reservedQty,
          availableQty: physicalQty - reservedQty,
          outOfStock: physicalQty === 0,
          updatedAt: m.stockBalance?.updatedAt ?? null
        };
      })
    });
  } catch (err) {
    next(err);
  }
});

stockRouter.get(
  "/reconciliation",
  requirePermission("stock", "view_reconciliation"),
  async (req, res, next) => {
    try {
      const materialId = Number(req.query.material);
      if (!materialId) throw AppError.validation("กรุณาระบุ material");
      const result = await stockService.reconcile(materialId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

stockRouter.get("/transactions", requirePermission("stock", "view"), async (req, res, next) => {
  try {
    const materialId = req.query.material ? Number(req.query.material) : undefined;
    const transactions = await prisma.stockTransaction.findMany({
      where: materialId ? { materialId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json({ data: transactions });
  } catch (err) {
    next(err);
  }
});

const receiptSchema = z.object({
  materialId: z.number().int().positive(),
  lotNumber: z.string().min(1, "กรุณากรอกเลข Lot"),
  quantity: z.number(),
  confirmMergeExistingLot: z.boolean().optional(),
  // Gate 2 rework (E29, ECP-008 AC4): captured alongside the Lot so QA/QC's incoming inspection
  // form can display it without re-entry (ECP-017 AC1).
  supplierName: z.string().optional()
});

stockRouter.post(
  "/receipts",
  requirePermission("stock", "goods_receipt"),
  auditableRoute("GoodsReceipt", "StockTransaction", async (req) => {
    const input = receiptSchema.parse(req.body);
    if (!(input.quantity > 0)) {
      throw AppError.validation("จำนวนรับเข้าต้องมากกว่า 0");
    }

    const existingLot = await prisma.lot.findUnique({
      where: { materialId_lotNumber: { materialId: input.materialId, lotNumber: input.lotNumber } }
    });

    if (existingLot && !input.confirmMergeExistingLot) {
      return {
        status: 409,
        body: {
          error: {
            code: "CONFLICT",
            message: "พบ Lot number นี้อยู่แล้ว ต้องการรวมยอดเข้ากับ Lot เดิมหรือสร้าง Lot ใหม่?",
            fields: { requiresConfirmation: "true" }
          }
        },
        entityId: String(existingLot.id)
      };
    }

    const lot = existingLot
      ? await prisma.lot.update({
          where: { id: existingLot.id },
          data: {
            receivedQty: { increment: input.quantity },
            remainingQty: { increment: input.quantity }
          }
        })
      : await prisma.lot.create({
          data: {
            materialId: input.materialId,
            lotNumber: input.lotNumber,
            receivedQty: input.quantity,
            remainingQty: input.quantity,
            receivedDate: new Date(),
            incomingQcStatus: "Pending",
            supplierName: input.supplierName
          }
        });

    await stockService.receive(input.materialId, input.quantity, lot.id, {
      refDocType: "Lot",
      refDocId: lot.id
    });
    realtimeGateway.emitStockChanged({ materialId: input.materialId });

    return {
      status: 201,
      body: { data: { lotId: lot.id, supplierName: lot.supplierName ?? "ไม่ระบุ" } },
      entityId: String(lot.id),
      detail: input
    };
  })
);

const checkSchema = z.object({
  productId: z.number().int().positive(),
  orderQty: z.number().positive()
});

stockRouter.post("/check", requirePermission("stock", "check_bom"), async (req, res, next) => {
  try {
    const input = checkSchema.parse(req.body);
    const bom = await prisma.bOM.findUnique({
      where: { productId: input.productId },
      include: { lines: { include: { material: true } } }
    });
    assertHasBom(bom?.lines.map((l) => ({ materialId: l.materialId, materialName: l.material.name, qtyPerUnit: Number(l.qtyPerUnit) })));

    const materialIds = bom.lines.map((l) => l.materialId);
    const balances = await prisma.stockBalance.findMany({ where: { materialId: { in: materialIds } } });
    const availability = balances.map((b) => ({
      materialId: b.materialId,
      availableQty: Number(b.physicalQty) - Number(b.reservedQty)
    }));

    const result = checkBomStock(
      bom.lines.map((l) => ({
        materialId: l.materialId,
        materialName: l.material.name,
        qtyPerUnit: Number(l.qtyPerUnit)
      })),
      input.orderQty,
      availability
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

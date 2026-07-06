import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";

export const traceRouter = Router();

/** GET /trace?lot=... (ECP-014): Lot -> Batch(es) -> finished goods -> PO, full chain. */
traceRouter.get("/", requirePermission("traceability", "view"), async (req, res, next) => {
  try {
    const lotNumber = String(req.query.lot ?? "").trim();
    if (!lotNumber) throw AppError.validation("กรุณาระบุเลข Lot");

    const lots = await prisma.lot.findMany({
      where: { lotNumber },
      include: {
        material: true,
        batchLotUsages: {
          include: {
            batch: {
              include: {
                product: true,
                productionOrder: { include: { po: { include: { customer: true } } } }
              }
            }
          }
        }
      }
    });

    if (lots.length === 0) {
      throw AppError.notFound("ไม่พบ Lot นี้ในระบบ กรุณาตรวจสอบเลข Lot อีกครั้ง");
    }

    const results = lots.map((lot) => ({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      materialName: lot.material.name,
      batches: lot.batchLotUsages.map((usage) => ({
        batchId: usage.batch.id,
        batchNumber: usage.batch.batchNumber,
        productName: usage.batch.product.name,
        status: usage.batch.status,
        qtyUsedFromThisLot: Number(usage.qtyUsed),
        po: usage.batch.productionOrder
          ? {
              poId: usage.batch.productionOrder.po.id,
              poNumber: usage.batch.productionOrder.po.poNumber,
              customerName: usage.batch.productionOrder.po.customer.name
            }
          : null
      }))
    }));

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

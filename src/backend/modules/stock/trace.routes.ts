import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { detectTraceQueryType } from "./traceDetect";

export const traceRouter = Router();

const LOT_INCLUDE = {
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
} as const;

function mapLotsToResponse(lots: Array<any>) {
  return lots.map((lot) => ({
    lotId: lot.id,
    lotNumber: lot.lotNumber,
    materialName: lot.material.name,
    batches: lot.batchLotUsages.map((usage: any) => ({
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
}

/** Resolves every distinct Lot ever used to produce any Batch belonging to the given PO ids. */
async function lotsForPoIds(poIds: number[]) {
  if (poIds.length === 0) return [];
  const batches = await prisma.batch.findMany({
    where: { productionOrder: { poId: { in: poIds } } },
    include: { lotUsages: true }
  });
  const lotIds = [...new Set(batches.flatMap((b) => b.lotUsages.map((u) => u.lotId)))];
  if (lotIds.length === 0) return [];
  return prisma.lot.findMany({ where: { id: { in: lotIds } }, include: LOT_INCLUDE });
}

/**
 * GET /trace?q=<term> (ECP-014 AC1/AC2/AC4/AC5, architecture.md §13.3.1): single search box,
 * auto-detects Lot/Batch/PO/Invoice from the term's format and resolves the SAME full chain
 * (Lot -> Batch -> Product -> PO -> Invoice) regardless of which node the user searched from.
 * Also accepts the legacy `?lot=` param unchanged (backward-compat, ECP-014's own AC1 baseline).
 */
traceRouter.get("/", requirePermission("traceability", "view"), async (req, res, next) => {
  try {
    const legacyLot = req.query.lot !== undefined ? String(req.query.lot).trim() : null;
    const q = req.query.q !== undefined ? String(req.query.q).trim() : null;

    if (legacyLot === null && q === null) {
      throw AppError.validation("กรุณาระบุคำค้นหา (Lot/Batch/PO/Invoice)");
    }

    let lots: Array<any> = [];

    if (legacyLot !== null) {
      // Legacy exact-match-by-lot-number path, unchanged.
      lots = await prisma.lot.findMany({ where: { lotNumber: legacyLot }, include: LOT_INCLUDE });
      if (lots.length === 0) {
        throw AppError.notFound("ไม่พบ Lot นี้ในระบบ กรุณาตรวจสอบเลข Lot อีกครั้ง");
      }
      res.json({ data: mapLotsToResponse(lots) });
      return;
    }

    const term = q as string;
    const type = detectTraceQueryType(term);

    if (type === "Invoice") {
      // Invoice number may be given with or without the "-vNN" version suffix (§13.3.1).
      const invoiceNo = term.replace(/-v\d+$/i, "");
      const invoice = await prisma.invoice.findFirst({ where: { invoiceNo } });
      if (invoice) lots = await lotsForPoIds([invoice.poId]);
    } else if (type === "PO") {
      const po = await prisma.purchaseOrder.findUnique({ where: { poNumber: term } });
      if (po) lots = await lotsForPoIds([po.id]);
    } else if (type === "Batch") {
      const batch = await prisma.batch.findUnique({
        where: { batchNumber: term },
        include: { productionOrder: true }
      });
      if (batch) lots = await lotsForPoIds([batch.productionOrder.poId]);
    } else {
      // Lot (free-text fallback - Lot numbers have no enforced format, ADR-006).
      lots = await prisma.lot.findMany({ where: { lotNumber: term }, include: LOT_INCLUDE });
    }

    if (lots.length === 0) {
      throw AppError.notFound(
        "ไม่พบข้อมูลที่ตรงกับคำค้นหา กรุณาตรวจสอบเลข Lot/Batch/PO/Invoice อีกครั้ง"
      );
    }

    res.json({ data: mapLotsToResponse(lots) });
  } catch (err) {
    next(err);
  }
});

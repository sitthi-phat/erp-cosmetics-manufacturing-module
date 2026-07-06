import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requirePermission } from "../../middleware/requirePermission";

export const productRouter = Router();

productRouter.get("/products", requirePermission("stock", "view"), async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({ include: { bom: true } });
    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        uom: p.uom,
        status: p.status,
        hasBom: Boolean(p.bom)
      }))
    });
  } catch (err) {
    next(err);
  }
});

productRouter.get("/materials", requirePermission("stock", "view"), async (_req, res, next) => {
  try {
    const materials = await prisma.rawMaterial.findMany({ include: { stockBalance: true } });
    res.json({
      data: materials.map((m) => ({
        id: m.id,
        name: m.name,
        uom: m.uom,
        status: m.status,
        physicalQty: m.stockBalance ? Number(m.stockBalance.physicalQty) : 0,
        reservedQty: m.stockBalance ? Number(m.stockBalance.reservedQty) : 0
      }))
    });
  } catch (err) {
    next(err);
  }
});

productRouter.get(
  "/products/:id/bom",
  requirePermission("stock", "check_bom"),
  async (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const bom = await prisma.bOM.findUnique({
        where: { productId },
        include: { lines: { include: { material: true } } }
      });
      if (!bom) {
        res.json({ data: null });
        return;
      }
      res.json({
        data: {
          id: bom.id,
          productId: bom.productId,
          lines: bom.lines.map((l) => ({
            materialId: l.materialId,
            materialName: l.material.name,
            qtyPerUnit: Number(l.qtyPerUnit)
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requirePermission } from "../../middleware/requirePermission";

export const productRouter = Router();

// DEF-12 fix (QA verify-3, Major): this endpoint used to require `stock.view`, but Finance
// (the ONLY role with `invoice.revise`) never had `stock.view` on the permission matrix - so
// the product picker in the "revise invoice" modal was always empty for the one role that
// actually needs it. Granting Finance the full `stock.view` permission would be over-broad
// (it also guards the raw-material stock list/dashboard, which Finance has no business need
// for - DEF-12 explicitly warns against over-provisioning). Introduced a dedicated, read-only
// `product.view` permission instead, scoped to exactly this endpoint, and granted it to every
// role that already had `stock.view` (SA/WH/PR, no behavior change for them) PLUS Finance
// (the actual fix) - see prisma/seed.ts's permission matrix.
productRouter.get("/products", requirePermission("product", "view"), async (_req, res, next) => {
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

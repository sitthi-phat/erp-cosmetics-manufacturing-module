import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { validateBomLines } from "./bom.rules";

export const bomRouter = Router();

function toBomDto(bom: { id: number; productId: number; lines: Array<{ id: number; materialId: number; qtyPerUnit: any; material?: { name: string } }> }) {
  return {
    id: bom.id,
    productId: bom.productId,
    lines: bom.lines.map((l) => ({
      id: l.id,
      materialId: l.materialId,
      materialName: l.material?.name,
      qtyPerUnit: Number(l.qtyPerUnit)
    }))
  };
}

/** GET /boms (ECP-039): list every product's BOM (read-only, bom.view = WH+PR+AD). */
bomRouter.get("/", requirePermission("bom", "view"), async (_req, res, next) => {
  try {
    const boms = await prisma.bOM.findMany({
      include: { lines: { include: { material: true } }, product: true }
    });
    res.json({
      data: boms.map((b) => ({ ...toBomDto(b), productName: b.product.name }))
    });
  } catch (err) {
    next(err);
  }
});

/** GET /boms/:productId (ECP-039): a single product's BOM detail. */
bomRouter.get("/:productId", requirePermission("bom", "view"), async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const bom = await prisma.bOM.findUnique({
      where: { productId },
      include: { lines: { include: { material: true } } }
    });
    if (!bom) {
      res.json({ data: null });
      return;
    }
    res.json({ data: toBomDto(bom) });
  } catch (err) {
    next(err);
  }
});

const bomLineSchema = z.object({
  id: z.number().int().positive().optional(),
  materialId: z.number().int().positive(),
  qtyPerUnit: z.number()
});

const createBomSchema = z.object({
  productId: z.number().int().positive(),
  lines: z.array(bomLineSchema).default([])
});

/** POST /boms (ECP-039 AC1): create a BOM for a product that doesn't have one yet. */
bomRouter.post(
  "/",
  requirePermission("bom", "manage"),
  auditableRoute("ManageBOM", "BOM", async (req) => {
    const input = createBomSchema.parse(req.body);
    validateBomLines(input.lines);

    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw AppError.notFound("ไม่พบสินค้านี้ในระบบ");

    const existing = await prisma.bOM.findUnique({ where: { productId: input.productId } });
    if (existing) {
      throw AppError.conflict("สินค้านี้มี BOM อยู่แล้ว กรุณาใช้ฟังก์ชันแก้ไขแทน");
    }

    const bom = await prisma.bOM.create({
      data: {
        productId: input.productId,
        status: "Active",
        lines: { create: input.lines.map((l) => ({ materialId: l.materialId, qtyPerUnit: l.qtyPerUnit })) }
      },
      include: { lines: { include: { material: true } } }
    });

    return {
      status: 201,
      body: { data: toBomDto(bom) },
      entityId: String(bom.id),
      detail: { productId: input.productId, lineCount: input.lines.length }
    };
  })
);

const updateBomSchema = z.object({
  lines: z.array(bomLineSchema).default([])
});

/**
 * PUT /boms/:productId (ECP-039 AC2/AC3/AC5): full in-place replace of the line set (no version
 * history kept, per BA default) - delete every existing line and recreate the submitted set in
 * one transaction, after validating the WHOLE proposed set (>=1 line, no duplicate material) so
 * a rejected submission never partially applies.
 */
bomRouter.put(
  "/:productId",
  requirePermission("bom", "manage"),
  auditableRoute("ManageBOM", "BOM", async (req) => {
    const productId = Number(req.params.productId);
    const input = updateBomSchema.parse(req.body);
    validateBomLines(input.lines);

    const bom = await prisma.bOM.findUnique({ where: { productId } });
    if (!bom) throw AppError.notFound("ไม่พบ BOM ของสินค้านี้ในระบบ");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.bOMLine.deleteMany({ where: { bomId: bom.id } });
      await tx.bOMLine.createMany({
        data: input.lines.map((l) => ({ bomId: bom.id, materialId: l.materialId, qtyPerUnit: l.qtyPerUnit }))
      });
      return tx.bOM.findUniqueOrThrow({
        where: { id: bom.id },
        include: { lines: { include: { material: true } } }
      });
    });

    return {
      body: { data: toBomDto(updated) },
      entityId: String(bom.id),
      detail: { productId, lineCount: input.lines.length }
    };
  })
);

/** DELETE /boms/:productId/lines/:lineId (ECP-039 AC3/AC4): remove one line, unless it's the last one. */
bomRouter.delete(
  "/:productId/lines/:lineId",
  requirePermission("bom", "manage"),
  auditableRoute("ManageBOM", "BOM", async (req) => {
    const productId = Number(req.params.productId);
    const lineId = Number(req.params.lineId);

    const bom = await prisma.bOM.findUnique({ where: { productId }, include: { lines: true } });
    if (!bom) throw AppError.notFound("ไม่พบ BOM ของสินค้านี้ในระบบ");

    const lineExists = bom.lines.some((l) => l.id === lineId);
    if (!lineExists) throw AppError.notFound("ไม่พบบรรทัดวัตถุดิบนี้ในสูตร");

    if (bom.lines.length <= 1) {
      throw AppError.validation("BOM ต้องมีวัตถุดิบอย่างน้อย 1 รายการ");
    }

    await prisma.bOMLine.delete({ where: { id: lineId } });

    return { body: { data: { ok: true } }, entityId: String(bom.id), detail: { lineId } };
  })
);

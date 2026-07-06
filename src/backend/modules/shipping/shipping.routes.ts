import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { nextNumberInTx } from "../../lib/numberSequence";
import { assertBatchShippable, assertCanMarkDelivered, assertDateNotInFuture } from "./shipping.rules";

export const shippingRouter = Router();

shippingRouter.get("/", requirePermission("shipping", "view"), async (_req, res, next) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: { po: { include: { customer: true } }, batch: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: shipments });
  } catch (err) {
    next(err);
  }
});

/** Batches eligible for a new shipment - filtered server-side (ECP-018 AC2), never just hidden client-side. */
shippingRouter.get(
  "/eligible-batches",
  requirePermission("shipping", "create"),
  async (_req, res, next) => {
    try {
      const batches = await prisma.batch.findMany({
        where: { status: "QCApproved", shipments: { none: {} } },
        include: { product: true, productionOrder: { include: { po: true } } }
      });
      res.json({ data: batches });
    } catch (err) {
      next(err);
    }
  }
);

const createShipmentSchema = z.object({
  batchId: z.number().int().positive(),
  shippedDate: z.coerce.date()
});

shippingRouter.post(
  "/",
  requirePermission("shipping", "create"),
  auditableRoute("CreateShipment", "Shipment", async (req) => {
    const input = createShipmentSchema.parse(req.body);
    assertDateNotInFuture(input.shippedDate);

    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: { productionOrder: true }
    });
    if (!batch) throw AppError.notFound("ไม่พบ Batch นี้ในระบบ");
    assertBatchShippable(batch.status);

    const poId = batch.productionOrder.poId;
    const shipment = await prisma.$transaction(async (tx) => {
      const shipmentNumber = await nextNumberInTx(tx, "SHIPMENT");
      const created = await tx.shipment.create({
        data: {
          shipmentNumber,
          poId,
          batchId: batch.id,
          shippedDate: input.shippedDate,
          status: "Shipped"
        }
      });
      await tx.batch.update({ where: { id: batch.id }, data: { status: "Shipped" } });
      await tx.purchaseOrder.update({ where: { id: poId }, data: { status: "Shipped" } });
      await tx.pOStatusEvent.create({ data: { poId, status: "Shipped" } });
      return created;
    });

    return { status: 201, body: { data: shipment }, entityId: shipment.shipmentNumber, detail: input };
  })
);

const updateStatusSchema = z.object({
  status: z.enum(["Delivered"]),
  deliveredDate: z.coerce.date()
});

shippingRouter.patch(
  "/:id/status",
  requirePermission("shipping", "update_status"),
  auditableRoute("UpdateShipmentStatus", "Shipment", async (req) => {
    const id = Number(req.params.id);
    const input = updateStatusSchema.parse(req.body);
    assertDateNotInFuture(input.deliveredDate);

    const shipment = await prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw AppError.notFound("ไม่พบรายการจัดส่งนี้ในระบบ");
    assertCanMarkDelivered(shipment.status);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.shipment.update({
        where: { id },
        data: { status: "Delivered", deliveredDate: input.deliveredDate }
      });
      await tx.pOStatusEvent.create({ data: { poId: shipment.poId, status: "Delivered" } });
      return result;
    });

    return { body: { data: updated }, entityId: updated.shipmentNumber, detail: input };
  })
);

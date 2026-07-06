import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { assertInspectable } from "./qc.rules";

export const qcRouter = Router();

qcRouter.get("/batches", requirePermission("qc", "view_batches"), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const batches = await prisma.batch.findMany({
      where: status ? { status: status as any } : undefined,
      include: { product: true, qcInspections: true },
      orderBy: { createdAt: "asc" }
    });
    res.json({ data: batches });
  } catch (err) {
    next(err);
  }
});

const inspectBatchSchema = z.object({
  result: z.enum(["Approved", "Rejected"]),
  remarks: z.string().optional()
});

qcRouter.post(
  "/batches/:id/inspect",
  requirePermission("qc", "inspect_batch"),
  auditableRoute("InspectBatch", "Batch", async (req) => {
    const batchId = Number(req.params.id);
    const input = inspectBatchSchema.parse(req.body);

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        qcInspections: { include: { inspector: true }, orderBy: { inspectedAt: "desc" } },
        productionOrder: true
      }
    });
    if (!batch) throw AppError.notFound("ไม่พบ Batch นี้ในระบบ");

    const lastApproved = batch.qcInspections.find((q) => q.result === "Approved");
    assertInspectable(
      batch.status as any,
      lastApproved
        ? {
            result: "Approved",
            inspectedAt: lastApproved.inspectedAt,
            inspectorName: lastApproved.inspector.fullName
          }
        : null
    );

    const [inspection] = await prisma.$transaction([
      prisma.qCInspection.create({
        data: {
          batchId,
          inspectorId: req.userId!,
          result: input.result,
          remarks: input.remarks
        }
      }),
      prisma.batch.update({
        where: { id: batchId },
        data: { status: input.result === "Approved" ? "QCApproved" : "QCRejected" }
      })
    ]);

    // ECP-006 AC1: PO timeline needs a "QC Approved" step; AC2 (rejected -> "รอผลิตใหม่") is
    // already derived from Batch status in po.routes.ts#GET /:id (derivedStatusLabel).
    if (input.result === "Approved") {
      await prisma.pOStatusEvent.create({
        data: { poId: batch.productionOrder.poId, status: "QC Approved" }
      });
    }

    return {
      status: 201,
      body: { data: inspection },
      entityId: batch.batchNumber,
      detail: input
    };
  })
);

const inspectLotSchema = z.object({ result: z.enum(["Passed", "Failed"]) });

qcRouter.post(
  "/lots/:id/inspect",
  requirePermission("qc", "inspect_incoming_lot"),
  auditableRoute("InspectIncomingLot", "Lot", async (req) => {
    const lotId = Number(req.params.id);
    const input = inspectLotSchema.parse(req.body);
    const lot = await prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) throw AppError.notFound("ไม่พบ Lot นี้ในระบบ");

    const updated = await prisma.lot.update({
      where: { id: lotId },
      data: { incomingQcStatus: input.result }
    });

    return { body: { data: updated }, entityId: String(lotId), detail: input };
  })
);

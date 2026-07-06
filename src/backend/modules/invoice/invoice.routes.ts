import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { InvoiceService } from "./invoice.service";
import { PrismaInvoiceRepository } from "./invoice.repository";
import { getCurrentVatRate } from "../vatConfig/vatConfig.repository";
import { config } from "../../config";

export const invoiceRouter = Router();
export const poInvoiceRouter = Router();

const repo = new PrismaInvoiceRepository();
const service = new InvoiceService(repo, getCurrentVatRate, config.invoiceEditAfterPayment);

invoiceRouter.get("/", requirePermission("invoice", "view"), async (req, res, next) => {
  try {
    const statusFilter = req.query.status ? String(req.query.status) : undefined;
    const invoices = await prisma.invoice.findMany({
      where: statusFilter ? { status: statusFilter as any } : { status: { not: "Superseded" } },
      include: { po: { include: { customer: true } } },
      orderBy: { issueDate: "desc" }
    });
    res.json({ data: invoices });
  } catch (err) {
    next(err);
  }
});

const invoiceLineSchema = z.object({
  productId: z.number().int().positive(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative()
});

poInvoiceRouter.post(
  "/:id/invoice",
  requirePermission("invoice", "create"),
  auditableRoute("IssueInvoice", "Invoice", async (req) => {
    const poId = Number(req.params.id);
    const { lines } = z.object({ lines: z.array(invoiceLineSchema).default([]) }).parse(req.body);

    const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");

    const invoice = await service.issueInvoice({
      poId,
      poStatus: po.status,
      lines,
      issuedById: req.userId!
    });

    // DEF-10 fix (QA verify-3): PO never transitioned to "Invoiced" anywhere in the codebase,
    // so ECP-006 AC1's 5-step timeline (Confirmed/InProduction/QC Approved/Shipped/Invoiced)
    // could never actually complete. Mirrors the same pattern already used for the
    // InProduction (production.routes.ts) and QC Approved (qc.routes.ts) timeline steps.
    await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "Invoiced" } });
    await prisma.pOStatusEvent.create({ data: { poId, status: "Invoiced" } });

    return {
      status: 201,
      body: { data: invoice },
      entityId: invoice.invoiceNo,
      detail: { version: invoice.version }
    };
  })
);

poInvoiceRouter.get(
  "/:id/invoice/versions",
  requirePermission("invoice", "view"),
  async (req, res, next) => {
    try {
      const poId = Number(req.params.id);
      const latest = await repo.findLatestByPoId(poId);
      const anyVersion = latest ?? (await prisma.invoice.findFirst({ where: { poId } }));
      if (!anyVersion) {
        res.json({ data: [] });
        return;
      }
      const versions = await service.getVersions(anyVersion.invoiceNo);
      res.json({ data: versions });
    } catch (err) {
      next(err);
    }
  }
);

invoiceRouter.post(
  "/:id/revise",
  requirePermission("invoice", "revise"),
  auditableRoute("ReviseInvoice", "Invoice", async (req) => {
    const invoiceId = Number(req.params.id);
    const { lines } = z.object({ lines: z.array(invoiceLineSchema).default([]) }).parse(req.body);

    const result = await service.reviseInvoice({ invoiceId, lines, actorId: req.userId! });

    return {
      status: 201,
      body: {
        data: result.invoice,
        warnings: [
          result.hadExistingPayments
            ? "invoice นี้มีการรับชำระแล้ว การแก้ไขจะสร้าง version ใหม่ที่อาจมียอดต่างจากที่บันทึกรับชำระไว้ กรุณาตรวจสอบยอดชำระซ้ำ"
            : null,
          result.overpaid
            ? "ยอดชำระเกินยอด invoice version ล่าสุด ต้องคืนเงิน/ปรับปรุง กรุณาตรวจสอบ"
            : null
        ].filter(Boolean)
      },
      entityId: result.invoice.invoiceNo,
      detail: { version: result.invoice.version }
    };
  })
);

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  method: z.string().min(1)
});

invoiceRouter.post(
  "/:id/payments",
  requirePermission("invoice", "record_payment"),
  auditableRoute("RecordPayment", "Payment", async (req) => {
    const invoiceId = Number(req.params.id);
    const input = paymentSchema.parse(req.body);
    const invoice = await repo.findById(invoiceId);
    if (!invoice) throw AppError.notFound("ไม่พบ invoice นี้ในระบบ");

    const result = await service.recordPayment({
      invoiceNo: invoice.invoiceNo,
      amount: input.amount,
      paymentDate: input.paymentDate,
      method: input.method,
      recordedById: req.userId!
    });

    return {
      status: 201,
      body: { data: result },
      entityId: invoice.invoiceNo,
      detail: input
    };
  })
);

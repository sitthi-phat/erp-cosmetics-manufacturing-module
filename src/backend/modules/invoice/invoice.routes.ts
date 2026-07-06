import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { requirePermission } from "../../middleware/requirePermission";
import { auditableRoute } from "../../middleware/audit";
import { InvoiceService } from "./invoice.service";
import { DocumentSnapshot, PrismaInvoiceRepository } from "./invoice.repository";
import { getCurrentVatRate } from "../vatConfig/vatConfig.repository";
import { getCurrentCompanyProfile } from "../companyProfile/companyProfile.repository";
import { config } from "../../config";
import { thaiBahtText } from "../../../shared/thaiBahtText";

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

/**
 * GET /invoices/:id (Gate 2 rework, E30, ECP-040 - root cause fix for "เปิดดูไม่ได้"): full
 * detail for ONE invoice - customer, every line, subtotal/discount/vat/total, status, payment
 * history. Version-aware by construction (reads exactly the requested id/version, AC2); a
 * non-existent id is a clean 404 (AC3, not a 500); RBAC via the same `invoice.view` permission
 * as the list (AC4).
 */
invoiceRouter.get("/:id", requirePermission("invoice", "view"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const detail = await service.getDetail(id);
    res.json({ data: detail });
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

/**
 * GET /invoices/:id/document (Gate 2 rework, E32, ECP-042, ADR-009): assembles print-ready data
 * from the invoice's own FROZEN `document_snapshot` (never live CompanyProfile/Customer data -
 * ECP-041 AC2/ECP-002 AC4) plus the Thai-baht-text of the total. Blocks when either half of the
 * snapshot was never captured in the first place (ECP-041 AC4 - no CompanyProfile ever set /
 * ECP-042 AC4 - customer had no tax_id at issue time) rather than ever silently printing blank
 * issuer/customer fields.
 */
invoiceRouter.get("/:id/document", requirePermission("invoice", "print"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const invoice = await repo.findById(id);
    if (!invoice) throw AppError.notFound("ไม่พบ invoice นี้ในระบบ");

    const snapshot = invoice.documentSnapshot;
    if (!snapshot || !snapshot.issuer?.taxId) {
      throw AppError.validation(
        "กรุณาตั้งค่าข้อมูลบริษัทผู้ออกเอกสารก่อน (ติดต่อ Admin)"
      );
    }
    if (!snapshot.customer?.taxId) {
      throw AppError.validation(
        "ลูกค้ารายนี้ยังไม่มีเลขประจำตัวผู้เสียภาษีในระบบ กรุณาแก้ไขข้อมูลลูกค้าก่อนออกใบกำกับภาษี"
      );
    }

    // ECP-042 AC3: a Superseded invoice can still be printed (audit trail) but must carry a
    // watermark pointing to the real latest version. `invoiceNo` is constant across the whole
    // chain (only `version` changes on revise) - `latestInvoiceNo` + `latestVersion` together
    // identify the real current document to redirect to.
    let latestInvoiceNo: string | null = null;
    let latestVersion: number | null = null;
    if (invoice.status === "Superseded") {
      const chain = await repo.findChainByInvoiceNo(invoice.invoiceNo);
      const latest = chain[chain.length - 1];
      if (latest && latest.id !== invoice.id) {
        latestInvoiceNo = latest.invoiceNo;
        latestVersion = latest.version;
      }
    }

    res.json({
      data: {
        invoiceNo: invoice.invoiceNo,
        version: invoice.version,
        displayNo: `${invoice.invoiceNo}-v${String(invoice.version).padStart(2, "0")}`,
        issueDate: invoice.issueDate,
        status: invoice.status,
        isSuperseded: invoice.status === "Superseded",
        latestInvoiceNo,
        latestVersion,
        issuer: snapshot.issuer,
        customer: snapshot.customer,
        lines: invoice.lines,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        afterDiscount: Number((invoice.subtotal - invoice.discountAmount).toFixed(2)),
        vatRateApplied: invoice.vatRateApplied,
        vatAmount: invoice.vatAmount,
        totalAmount: invoice.totalAmount,
        totalAmountText: thaiBahtText(invoice.totalAmount)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Gate 2 rework (E32, ADR-009 §2): assembles the frozen issuer/customer snapshot at issue/revise
 * time from CompanyProfile + the PO's own Customer - `null` if either piece is missing (printing
 * itself is blocked elsewhere, ECP-041 AC4/ECP-042 AC4; issuing the invoice is NOT blocked by a
 * missing snapshot so pre-Gate-2 behavior for issuing keeps working even before Admin/Sales fill
 * in the new fields).
 */
async function assembleDocumentSnapshot(poId: number): Promise<DocumentSnapshot | null> {
  const [profile, po] = await Promise.all([
    getCurrentCompanyProfile(),
    prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { customer: true } })
  ]);
  if (!profile || !po) return null;
  return {
    issuer: {
      companyName: profile.companyName,
      address: profile.address,
      taxId: profile.taxId,
      phone: profile.phone,
      logoUrl: profile.logoUrl
    },
    customer: {
      name: po.customer.name,
      address: po.customer.registeredAddress ?? po.customer.address ?? "",
      taxId: po.customer.taxId,
      phone: po.customer.phone
    }
  };
}

const issueInvoiceSchema = z.object({
  lines: z.array(invoiceLineSchema).default([]),
  // Gate 2 rework (E30, ECP-020 AC4/AC5): optional fixed baht-amount discount, defaults to 0.
  discountAmount: z.number().nonnegative().optional()
});

poInvoiceRouter.post(
  "/:id/invoice",
  requirePermission("invoice", "create"),
  auditableRoute("IssueInvoice", "Invoice", async (req) => {
    const poId = Number(req.params.id);
    const { lines, discountAmount } = issueInvoiceSchema.parse(req.body);

    const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw AppError.notFound("ไม่พบคำสั่งซื้อนี้ในระบบ");

    const documentSnapshot = await assembleDocumentSnapshot(poId);

    const invoice = await service.issueInvoice({
      poId,
      poStatus: po.status,
      lines,
      issuedById: req.userId!,
      discountAmount,
      documentSnapshot
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

const reviseInvoiceSchema = z.object({
  lines: z.array(invoiceLineSchema).default([]),
  discountAmount: z.number().nonnegative().optional()
});

invoiceRouter.post(
  "/:id/revise",
  requirePermission("invoice", "revise"),
  auditableRoute("ReviseInvoice", "Invoice", async (req) => {
    const invoiceId = Number(req.params.id);
    const { lines, discountAmount } = reviseInvoiceSchema.parse(req.body);

    const target = await repo.findById(invoiceId);
    const documentSnapshot = target ? await assembleDocumentSnapshot(target.poId) : null;

    const result = await service.reviseInvoice({ invoiceId, lines, actorId: req.userId!, discountAmount, documentSnapshot });

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

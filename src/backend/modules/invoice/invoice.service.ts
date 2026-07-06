import { AppError } from "../../lib/errors";
import { computeInvoiceAmounts, computeReconciliation, InvoiceLineInput } from "./invoice.calc";
import { InvoiceRecord, InvoiceRepository, PaymentRecord } from "./invoice.repository";

export interface IssueInvoiceInput {
  poId: number;
  poStatus: string;
  lines: (InvoiceLineInput & { productId: number; description: string })[];
  issuedById: number;
}

export interface ReviseInvoiceInput {
  invoiceId: number;
  lines: (InvoiceLineInput & { productId: number; description: string })[];
  actorId: number;
}

export interface RecordPaymentInput {
  invoiceNo: string;
  amount: number;
  paymentDate: Date;
  method: string;
  recordedById: number;
}

export type InvoiceEditAfterPaymentPolicy = "allow" | "block";

export class InvoiceService {
  constructor(
    private readonly repo: InvoiceRepository,
    private readonly getCurrentVatRate: () => Promise<number>,
    /** §5.5 INVOICE_EDIT_AFTER_PAYMENT: default "allow" (BA default) - switchable via config. */
    private readonly editAfterPaymentPolicy: InvoiceEditAfterPaymentPolicy = "allow"
  ) {}

  /** POST /pos/:id/invoice - issue version 1 (ECP-020). */
  async issueInvoice(input: IssueInvoiceInput): Promise<InvoiceRecord> {
    if (input.poStatus !== "Shipped") {
      throw AppError.validation("ไม่สามารถออก invoice ได้ PO นี้ยังไม่ถูกจัดส่ง");
    }
    const existing = await this.repo.findLatestByPoId(input.poId);
    if (existing) {
      throw AppError.conflict(
        `PO นี้มี invoice เลขที่ ${existing.invoiceNo} (version ${existing.version}) ออกไปแล้วเมื่อ ${existing.issueDate.toISOString()} หากต้องการแก้ไขกรุณาใช้ฟังก์ชันแก้ไข invoice แทน`
      );
    }
    const rate = await this.getCurrentVatRate();
    const amounts = computeInvoiceAmounts(input.lines, rate);
    const lines = input.lines.map((l) => ({
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: Number((l.quantity * l.unitPrice).toFixed(2))
    }));
    return this.repo.createInvoice({
      poId: input.poId,
      issuedById: input.issuedById,
      ...amounts,
      lines
    });
  }

  /** POST /invoices/:id/revise (ECP-037). */
  async reviseInvoice(input: ReviseInvoiceInput): Promise<{
    invoice: InvoiceRecord;
    hadExistingPayments: boolean;
    overpaid: boolean;
  }> {
    const target = await this.repo.findById(input.invoiceId);
    if (!target) {
      throw AppError.notFound("ไม่พบ invoice นี้ในระบบ");
    }
    const latest = await this.repo.findLatestByPoId(target.poId);
    if (!latest) {
      throw AppError.notFound("ไม่พบ invoice นี้ในระบบ");
    }
    if (latest.id !== target.id) {
      throw AppError.conflict(
        `ไม่สามารถแก้ไข invoice version นี้ได้ กรุณาแก้ไข version ล่าสุด (v${latest.version}, invoice_id=${latest.id}) แทน`
      );
    }

    const existingPayments = await this.repo.getPaymentsByChainKey(latest.invoiceNo);
    const existingPaidSum = existingPayments.reduce((s, p) => s + p.amount, 0);
    if (this.editAfterPaymentPolicy === "block" && existingPaidSum > 0) {
      throw AppError.conflict(
        "ไม่สามารถแก้ไข invoice นี้ได้ เนื่องจากมีการรับชำระเงินแล้ว (นโยบาย INVOICE_EDIT_AFTER_PAYMENT=block)"
      );
    }

    const rate = await this.getCurrentVatRate();
    const amounts = computeInvoiceAmounts(input.lines, rate); // throws on empty lines (AC4)

    const paidSum = existingPaidSum;
    const recon = computeReconciliation(amounts.totalAmount, paidSum);

    const lines = input.lines.map((l) => ({
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: Number((l.quantity * l.unitPrice).toFixed(2))
    }));

    const created = await this.repo.createRevision({
      invoiceNo: latest.invoiceNo,
      version: latest.version + 1,
      parentInvoiceId: latest.id,
      poId: latest.poId,
      issuedById: input.actorId,
      ...amounts,
      status: recon.status,
      lines
    });

    return { invoice: created, hadExistingPayments: paidSum > 0, overpaid: recon.overpaid };
  }

  /** GET /pos/:id/invoice/versions (ECP-037 AC2). */
  async getVersions(invoiceNo: string): Promise<
    Array<InvoiceRecord & { supersededLabel: string | null }>
  > {
    const chain = await this.repo.findChainByInvoiceNo(invoiceNo);
    return chain.map((row, idx) => {
      const child = chain[idx + 1];
      const supersededLabel = child
        ? `ถูกแทนที่โดย v${child.version} เมื่อ ${child.issueDate.toISOString()} โดย ${
            child.issuedByName ?? child.issuedById
          }`
        : null;
      return { ...row, supersededLabel };
    });
  }

  /** Payment reconciliation read model (§5.5). */
  async getReconciliation(invoiceNo: string) {
    const latest = await this.repo.findLatestByInvoiceNo(invoiceNo);
    if (!latest) throw AppError.notFound("ไม่พบ invoice นี้ในระบบ");
    const payments = await this.repo.getPaymentsByChainKey(invoiceNo);
    const paidSum = payments.reduce((s, p) => s + p.amount, 0);
    const recon = computeReconciliation(latest.totalAmount, paidSum);
    return { latest, payments, paidSum, ...recon };
  }

  /** POST /invoices/:id/payments (ECP-021). Rejects payment beyond current outstanding (AC3). */
  async recordPayment(input: RecordPaymentInput): Promise<{ payment: PaymentRecord; status: string; outstanding: number }> {
    if (!(input.amount > 0)) {
      throw AppError.validation("จำนวนเงินที่รับชำระต้องมากกว่า 0");
    }
    const latest = await this.repo.findLatestByInvoiceNo(input.invoiceNo);
    if (!latest) throw AppError.notFound("ไม่พบ invoice นี้ในระบบ");

    const payments = await this.repo.getPaymentsByChainKey(input.invoiceNo);
    const paidSum = payments.reduce((s, p) => s + p.amount, 0);
    const before = computeReconciliation(latest.totalAmount, paidSum);

    if (input.amount > before.outstanding) {
      throw AppError.validation(
        `จำนวนเงินที่รับชำระเกินยอดคงค้างของ invoice นี้ (คงค้าง ${before.outstanding.toFixed(2)} บาท)`
      );
    }

    const payment = await this.repo.recordPayment({
      invoiceChainKey: input.invoiceNo,
      amount: input.amount,
      paymentDate: input.paymentDate,
      method: input.method,
      recordedById: input.recordedById
    });

    const after = computeReconciliation(latest.totalAmount, paidSum + input.amount);
    await this.repo.updateStatus(latest.id, after.status);

    return { payment, status: after.status, outstanding: after.outstanding };
  }
}

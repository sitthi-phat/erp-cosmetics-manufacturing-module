import { prisma } from "../../lib/prisma";
import { nextNumberInTx } from "../../lib/numberSequence";
import { InvoiceStatus } from "@prisma/client";

export interface InvoiceLineRecord {
  productId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceRecord {
  id: number;
  invoiceNo: string;
  version: number;
  parentInvoiceId: number | null;
  poId: number;
  issuedById: number;
  issuedByName?: string;
  issueDate: Date;
  subtotal: number;
  vatRateApplied: number;
  vatAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  lines: InvoiceLineRecord[];
}

export interface PaymentRecord {
  id: number;
  invoiceChainKey: string;
  amount: number;
  paymentDate: Date;
  method: string;
  recordedById: number;
}

export interface CreateInvoiceInput {
  poId: number;
  issuedById: number;
  subtotal: number;
  vatRateApplied: number;
  vatAmount: number;
  totalAmount: number;
  lines: InvoiceLineRecord[];
}

export interface CreateRevisionInput extends CreateInvoiceInput {
  invoiceNo: string;
  parentInvoiceId: number;
  version: number;
  status: InvoiceStatus;
}

export interface RecordPaymentInput {
  invoiceChainKey: string;
  amount: number;
  paymentDate: Date;
  method: string;
  recordedById: number;
}

export interface InvoiceRepository {
  findById(id: number): Promise<InvoiceRecord | null>;
  findLatestByPoId(poId: number): Promise<InvoiceRecord | null>;
  findLatestByInvoiceNo(invoiceNo: string): Promise<InvoiceRecord | null>;
  findChainByInvoiceNo(invoiceNo: string): Promise<InvoiceRecord[]>;
  createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord>;
  createRevision(input: CreateRevisionInput): Promise<InvoiceRecord>;
  getPaymentsByChainKey(chainKey: string): Promise<PaymentRecord[]>;
  recordPayment(input: RecordPaymentInput): Promise<PaymentRecord>;
  updateStatus(id: number, status: InvoiceStatus): Promise<void>;
}

function toRecord(row: any): InvoiceRecord {
  return {
    id: row.id,
    invoiceNo: row.invoiceNo,
    version: row.version,
    parentInvoiceId: row.parentInvoiceId,
    poId: row.poId,
    issuedById: row.issuedById,
    issuedByName: row.issuedBy?.fullName,
    issueDate: row.issueDate,
    subtotal: Number(row.subtotal),
    vatRateApplied: Number(row.vatRateApplied),
    vatAmount: Number(row.vatAmount),
    totalAmount: Number(row.totalAmount),
    status: row.status,
    lines: (row.lines ?? []).map((l: any) => ({
      productId: l.productId,
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal)
    }))
  };
}

export class PrismaInvoiceRepository implements InvoiceRepository {
  async findById(id: number): Promise<InvoiceRecord | null> {
    const row = await prisma.invoice.findUnique({
      where: { id },
      include: { lines: true, issuedBy: true }
    });
    return row ? toRecord(row) : null;
  }

  async findLatestByPoId(poId: number): Promise<InvoiceRecord | null> {
    const row = await prisma.invoice.findFirst({
      where: { poId, status: { not: "Superseded" } },
      orderBy: { version: "desc" },
      include: { lines: true, issuedBy: true }
    });
    return row ? toRecord(row) : null;
  }

  async findLatestByInvoiceNo(invoiceNo: string): Promise<InvoiceRecord | null> {
    const row = await prisma.invoice.findFirst({
      where: { invoiceNo, status: { not: "Superseded" } },
      orderBy: { version: "desc" },
      include: { lines: true, issuedBy: true }
    });
    return row ? toRecord(row) : null;
  }

  async findChainByInvoiceNo(invoiceNo: string): Promise<InvoiceRecord[]> {
    const rows = await prisma.invoice.findMany({
      where: { invoiceNo },
      orderBy: { version: "asc" },
      include: { lines: true, issuedBy: true }
    });
    return rows.map(toRecord);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    const row = await prisma.$transaction(async (tx) => {
      const invoiceNo = await nextNumberInTx(tx, "INVOICE");
      return tx.invoice.create({
        data: {
          invoiceNo,
          version: 1,
          parentInvoiceId: null,
          poId: input.poId,
          issuedById: input.issuedById,
          subtotal: input.subtotal,
          vatRateApplied: input.vatRateApplied,
          vatAmount: input.vatAmount,
          totalAmount: input.totalAmount,
          status: "Issued",
          lines: { create: input.lines }
        },
        include: { lines: true, issuedBy: true }
      });
    });
    return toRecord(row);
  }

  async createRevision(input: CreateRevisionInput): Promise<InvoiceRecord> {
    const row = await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: input.parentInvoiceId },
        data: { status: "Superseded" }
      });
      return tx.invoice.create({
        data: {
          invoiceNo: input.invoiceNo,
          version: input.version,
          parentInvoiceId: input.parentInvoiceId,
          poId: input.poId,
          issuedById: input.issuedById,
          subtotal: input.subtotal,
          vatRateApplied: input.vatRateApplied,
          vatAmount: input.vatAmount,
          totalAmount: input.totalAmount,
          status: input.status,
          lines: { create: input.lines }
        },
        include: { lines: true, issuedBy: true }
      });
    });
    return toRecord(row);
  }

  async getPaymentsByChainKey(chainKey: string): Promise<PaymentRecord[]> {
    const rows = await prisma.payment.findMany({ where: { invoiceChainKey: chainKey } });
    return rows.map((r) => ({
      id: r.id,
      invoiceChainKey: r.invoiceChainKey,
      amount: Number(r.amount),
      paymentDate: r.paymentDate,
      method: r.method,
      recordedById: r.recordedById
    }));
  }

  async recordPayment(input: RecordPaymentInput): Promise<PaymentRecord> {
    const row = await prisma.payment.create({ data: input });
    return {
      id: row.id,
      invoiceChainKey: row.invoiceChainKey,
      amount: Number(row.amount),
      paymentDate: row.paymentDate,
      method: row.method,
      recordedById: row.recordedById
    };
  }

  async updateStatus(id: number, status: InvoiceStatus): Promise<void> {
    await prisma.invoice.update({ where: { id }, data: { status } });
  }
}

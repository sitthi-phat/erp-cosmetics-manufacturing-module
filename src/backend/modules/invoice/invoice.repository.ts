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

export interface DocumentSnapshot {
  issuer: { companyName: string; address: string; taxId: string; phone: string; logoUrl?: string | null };
  customer: { name: string; address: string; taxId: string | null; phone: string | null };
}

export interface CustomerSummary {
  id: number;
  customerId: string;
  name: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
  registeredAddress: string | null;
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
  /** Gate 2 rework (E30, ECP-020 AC4/AC5): fixed baht-amount discount, defaults to 0 for every
   * pre-Gate-2 row/caller. */
  discountAmount: number;
  vatRateApplied: number;
  vatAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  /** Gate 2 rework (E32, ADR-009 §2): issuer/customer data frozen at issue/revise time so a
   * later CompanyProfile/Customer edit never changes an already-printed document. */
  documentSnapshot?: DocumentSnapshot | null;
  lines: InvoiceLineRecord[];
  /** Populated only by findByIdWithCustomer (ECP-040 AC1 detail view). */
  customer?: CustomerSummary;
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
  discountAmount?: number;
  vatRateApplied: number;
  vatAmount: number;
  totalAmount: number;
  documentSnapshot?: DocumentSnapshot | null;
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
  /** ECP-040 AC1: detail view needs the customer row alongside the invoice. */
  findByIdWithCustomer(id: number): Promise<InvoiceRecord | null>;
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
    discountAmount: Number(row.discountAmount ?? 0),
    vatRateApplied: Number(row.vatRateApplied),
    vatAmount: Number(row.vatAmount),
    totalAmount: Number(row.totalAmount),
    status: row.status,
    documentSnapshot: (row.documentSnapshot as DocumentSnapshot | null | undefined) ?? null,
    lines: (row.lines ?? []).map((l: any) => ({
      productId: l.productId,
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal)
    })),
    customer: row.po?.customer
      ? {
          id: row.po.customer.id,
          customerId: row.po.customer.customerId,
          name: row.po.customer.name,
          address: row.po.customer.address,
          phone: row.po.customer.phone,
          taxId: row.po.customer.taxId,
          registeredAddress: row.po.customer.registeredAddress
        }
      : undefined
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

  async findByIdWithCustomer(id: number): Promise<InvoiceRecord | null> {
    const row = await prisma.invoice.findUnique({
      where: { id },
      include: { lines: true, issuedBy: true, po: { include: { customer: true } } }
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
          discountAmount: input.discountAmount ?? 0,
          vatRateApplied: input.vatRateApplied,
          vatAmount: input.vatAmount,
          totalAmount: input.totalAmount,
          documentSnapshot: (input.documentSnapshot ?? undefined) as any,
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
          discountAmount: input.discountAmount ?? 0,
          vatRateApplied: input.vatRateApplied,
          vatAmount: input.vatAmount,
          totalAmount: input.totalAmount,
          documentSnapshot: (input.documentSnapshot ?? undefined) as any,
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

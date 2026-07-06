import { InvoiceStatus } from "@prisma/client";
import { InvoiceService } from "./invoice.service";
import {
  CreateInvoiceInput,
  CreateRevisionInput,
  InvoiceRecord,
  InvoiceRepository,
  PaymentRecord,
  RecordPaymentInput
} from "./invoice.repository";

/** Simple in-memory fake so business rules are tested without Prisma/MySQL. */
class InMemoryInvoiceRepository implements InvoiceRepository {
  invoices: InvoiceRecord[] = [];
  payments: PaymentRecord[] = [];
  private nextInvoiceId = 1;
  private nextPaymentId = 1;
  private invoiceCounter = 0;

  async findById(id: number): Promise<InvoiceRecord | null> {
    return this.invoices.find((i) => i.id === id) ?? null;
  }

  async findByIdWithCustomer(id: number): Promise<InvoiceRecord | null> {
    // Fake repo doesn't model a separate Customer entity - detail-view tests for the customer
    // join live at the integration level (tests/integration/invoiceDiscountDetail.spec.ts).
    return this.findById(id);
  }

  async findLatestByPoId(poId: number): Promise<InvoiceRecord | null> {
    const rows = this.invoices
      .filter((i) => i.poId === poId && i.status !== "Superseded")
      .sort((a, b) => b.version - a.version);
    return rows[0] ?? null;
  }

  async findLatestByInvoiceNo(invoiceNo: string): Promise<InvoiceRecord | null> {
    const rows = this.invoices
      .filter((i) => i.invoiceNo === invoiceNo && i.status !== "Superseded")
      .sort((a, b) => b.version - a.version);
    return rows[0] ?? null;
  }

  async findChainByInvoiceNo(invoiceNo: string): Promise<InvoiceRecord[]> {
    return this.invoices
      .filter((i) => i.invoiceNo === invoiceNo)
      .sort((a, b) => a.version - b.version);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    this.invoiceCounter += 1;
    const record: InvoiceRecord = {
      id: this.nextInvoiceId++,
      invoiceNo: `INV-2026-${String(this.invoiceCounter).padStart(6, "0")}`,
      version: 1,
      parentInvoiceId: null,
      poId: input.poId,
      issuedById: input.issuedById,
      issuedByName: "Finance User",
      issueDate: new Date(),
      subtotal: input.subtotal,
      discountAmount: input.discountAmount ?? 0,
      vatRateApplied: input.vatRateApplied,
      vatAmount: input.vatAmount,
      totalAmount: input.totalAmount,
      status: "Issued" as InvoiceStatus,
      documentSnapshot: input.documentSnapshot ?? null,
      lines: input.lines
    };
    this.invoices.push(record);
    return record;
  }

  async createRevision(input: CreateRevisionInput): Promise<InvoiceRecord> {
    await this.updateStatus(input.parentInvoiceId, "Superseded" as InvoiceStatus);
    const record: InvoiceRecord = {
      id: this.nextInvoiceId++,
      invoiceNo: input.invoiceNo,
      version: input.version,
      parentInvoiceId: input.parentInvoiceId,
      poId: input.poId,
      issuedById: input.issuedById,
      issuedByName: "Finance User 2",
      issueDate: new Date(),
      subtotal: input.subtotal,
      discountAmount: input.discountAmount ?? 0,
      vatRateApplied: input.vatRateApplied,
      vatAmount: input.vatAmount,
      totalAmount: input.totalAmount,
      status: input.status,
      documentSnapshot: input.documentSnapshot ?? null,
      lines: input.lines
    };
    this.invoices.push(record);
    return record;
  }

  async getPaymentsByChainKey(chainKey: string): Promise<PaymentRecord[]> {
    return this.payments.filter((p) => p.invoiceChainKey === chainKey);
  }

  async recordPayment(input: RecordPaymentInput): Promise<PaymentRecord> {
    const payment: PaymentRecord = { id: this.nextPaymentId++, ...input };
    this.payments.push(payment);
    return payment;
  }

  async updateStatus(id: number, status: InvoiceStatus): Promise<void> {
    const inv = this.invoices.find((i) => i.id === id);
    if (inv) inv.status = status;
  }
}

function makeService(rate = 7, policy: "allow" | "block" = "allow") {
  const repo = new InMemoryInvoiceRepository();
  const service = new InvoiceService(repo, async () => rate, policy);
  return { repo, service };
}

const oneLine = [{ productId: 1, description: "Cream 100ml", quantity: 500, unitPrice: 100 }];

describe("InvoiceService.issueInvoice (ECP-020)", () => {
  it("issues version 1 with VAT snapshot when PO is Shipped (AC1)", async () => {
    const { service } = makeService(7);
    const invoice = await service.issueInvoice({
      poId: 1,
      poStatus: "Shipped",
      lines: oneLine,
      issuedById: 9
    });
    expect(invoice.version).toBe(1);
    expect(invoice.parentInvoiceId).toBeNull();
    expect(invoice.subtotal).toBe(50000);
    expect(invoice.vatAmount).toBe(3500);
    expect(invoice.totalAmount).toBe(53500);
    expect(invoice.status).toBe("Issued");
  });

  it("blocks issuing a second chain for the same PO, points to revise (AC2)", async () => {
    const { service } = makeService();
    await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await expect(
      service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 })
    ).rejects.toThrow(/ใช้ฟังก์ชันแก้ไข invoice แทน/);
  });

  it("DEF-10 regression: still gives the specific 'already issued' message even once the PO has genuinely moved to Invoiced status (not just Shipped)", async () => {
    const { service } = makeService();
    await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    // Real flow after DEF-10's fix: invoice.routes.ts flips the PO to "Invoiced" right after the
    // first issue succeeds, so a second attempt's poStatus is realistically "Invoiced", not
    // "Shipped" - this must still be reported as "already issued, use revise", NOT the generic
    // "not shipped yet" message (which would be misleading and wrong here).
    await expect(
      service.issueInvoice({ poId: 1, poStatus: "Invoiced", lines: oneLine, issuedById: 9 })
    ).rejects.toThrow(/ใช้ฟังก์ชันแก้ไข invoice แทน/);
  });

  it("blocks issuing when PO has not shipped yet (AC3)", async () => {
    const { service } = makeService();
    await expect(
      service.issueInvoice({ poId: 2, poStatus: "InProduction", lines: oneLine, issuedById: 9 })
    ).rejects.toThrow("ไม่สามารถออก invoice ได้ PO นี้ยังไม่ถูกจัดส่ง");
  });
});

describe("InvoiceService.reviseInvoice (ECP-037)", () => {
  it("creates v2, links parent, and supersedes v1 (AC1)", async () => {
    const { repo, service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });

    const result = await service.reviseInvoice({
      invoiceId: v1.id,
      lines: [{ productId: 1, description: "Cream 100ml", quantity: 600, unitPrice: 100 }],
      actorId: 10
    });

    expect(result.invoice.version).toBe(2);
    expect(result.invoice.parentInvoiceId).toBe(v1.id);
    const oldRow = await repo.findById(v1.id);
    expect(oldRow?.status).toBe("Superseded");
  });

  it("blocks revising a version that is not the latest, points to the latest (AC3)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 }); // -> v2

    await expect(
      service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 })
    ).rejects.toThrow(/แก้ไข version ล่าสุด/);
  });

  it("blocks a revision with zero lines (AC4)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await expect(service.reviseInvoice({ invoiceId: v1.id, lines: [], actorId: 10 })).rejects.toThrow();
  });

  it("INVOICE_EDIT_AFTER_PAYMENT=allow (default): still allows revising after a payment (§5.5)", async () => {
    const { service } = makeService(7, "allow");
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 10000,
      paymentDate: new Date(),
      method: "cash",
      recordedById: 9
    });
    await expect(service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 })).resolves.toBeDefined();
  });

  it("INVOICE_EDIT_AFTER_PAYMENT=block: rejects revising once any payment has been recorded (§5.5)", async () => {
    const { service } = makeService(7, "block");
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 10000,
      paymentDate: new Date(),
      method: "cash",
      recordedById: 9
    });
    await expect(service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 })).rejects.toThrow(
      /มีการรับชำระเงินแล้ว/
    );
  });

  it("INVOICE_EDIT_AFTER_PAYMENT=block: still allows revising when nothing has been paid yet", async () => {
    const { service } = makeService(7, "block");
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await expect(service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 })).resolves.toBeDefined();
  });

  it("returns hadExistingPayments=true so the caller can show the pre-revise warning (§5.5)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 20000,
      paymentDate: new Date(),
      method: "bank_transfer",
      recordedById: 9
    });

    const result = await service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 });
    expect(result.hadExistingPayments).toBe(true);
  });

  it("flags overpaid (and never mislabels it 'Paid') when a revise drops the total below already-paid amount (§5.5, QA DEF-01)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    // subtotal 50,000 + 7% = 53,500; pay in full
    await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 53500,
      paymentDate: new Date(),
      method: "bank_transfer",
      recordedById: 9
    });

    // revise down to a much smaller order
    const result = await service.reviseInvoice({
      invoiceId: v1.id,
      lines: [{ productId: 1, description: "Cream 100ml", quantity: 10, unitPrice: 100 }],
      actorId: 10
    });

    expect(result.overpaid).toBe(true);
    expect(result.invoice.status).not.toBe("Paid");
    expect(result.invoice.status).toBe("Overpaid");
  });
});

describe("InvoiceService.getVersions (ECP-037 AC2)", () => {
  it("returns the full chain in order with a superseded label on old versions", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await service.reviseInvoice({ invoiceId: v1.id, lines: oneLine, actorId: 10 });

    const versions = await service.getVersions(v1.invoiceNo);
    expect(versions).toHaveLength(2);
    expect(versions[0].supersededLabel).toMatch(/ถูกแทนที่โดย v2/);
    expect(versions[1].supersededLabel).toBeNull();
  });
});

describe("InvoiceService.recordPayment (ECP-021)", () => {
  it("marks Paid and outstanding=0 on full payment (AC1)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    const result = await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 53500,
      paymentDate: new Date(),
      method: "cash",
      recordedById: 9
    });
    expect(result.status).toBe("Paid");
    expect(result.outstanding).toBe(0);
  });

  it("marks PartiallyPaid with correct outstanding on partial payment (AC2)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    const result = await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 20000,
      paymentDate: new Date(),
      method: "cash",
      recordedById: 9
    });
    expect(result.status).toBe("PartiallyPaid");
    expect(result.outstanding).toBe(33500);
  });

  it("rejects a payment beyond the outstanding balance (AC3)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await expect(
      service.recordPayment({
        invoiceNo: v1.invoiceNo,
        amount: 999999,
        paymentDate: new Date(),
        method: "cash",
        recordedById: 9
      })
    ).rejects.toThrow(/เกินยอดคงค้าง/);
  });

  it("carries payments over across a revision and recomputes outstanding from the new total (§5.5)", async () => {
    const { service } = makeService();
    const v1 = await service.issueInvoice({ poId: 1, poStatus: "Shipped", lines: oneLine, issuedById: 9 });
    await service.recordPayment({
      invoiceNo: v1.invoiceNo,
      amount: 20000,
      paymentDate: new Date(),
      method: "cash",
      recordedById: 9
    });

    await service.reviseInvoice({
      invoiceId: v1.id,
      lines: [{ productId: 1, description: "Cream 100ml", quantity: 600, unitPrice: 100 }],
      actorId: 10
    });

    const recon = await service.getReconciliation(v1.invoiceNo);
    // new subtotal 60,000 * 1.07 = 64,200; paid 20,000 carried over -> outstanding 44,200
    expect(recon.paidSum).toBe(20000);
    expect(recon.outstanding).toBe(44200);
    expect(recon.status).toBe("PartiallyPaid");
  });
});

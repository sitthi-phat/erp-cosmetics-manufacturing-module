import { AppError } from "../../lib/errors";

/** Round-half-up to 2 decimal places (THB, DECIMAL(12,2) - architecture.md §3.2). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface InvoiceLineInput {
  quantity: number;
  unitPrice: number;
}

export interface InvoiceAmounts {
  subtotal: number;
  vatRateApplied: number;
  vatAmount: number;
  totalAmount: number;
}

/**
 * subtotal = Sum(qty x unit_price); vat_amount = round(subtotal x rate/100, 2);
 * total = subtotal + vat_amount (architecture.md §3.2, ECP-020 AC1). Computed once at
 * issue/revise time and stored as an immutable snapshot - never recomputed on the fly.
 */
export function computeInvoiceAmounts(
  lines: InvoiceLineInput[],
  vatRatePercent: number
): InvoiceAmounts {
  if (lines.length === 0) {
    throw AppError.validation(
      "กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการก่อนออก invoice"
    );
  }
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
  const vatAmount = roundMoney(subtotal * (vatRatePercent / 100));
  const totalAmount = roundMoney(subtotal + vatAmount);
  return { subtotal, vatRateApplied: vatRatePercent, vatAmount, totalAmount };
}

/** ECP-038 AC3: rate must be within [0, 100]. */
export function validateVatRate(rate: number): void {
  if (!(rate >= 0 && rate <= 100)) {
    throw AppError.validation("อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%");
  }
}

export interface ReconciliationResult {
  outstanding: number;
  status: "Issued" | "PartiallyPaid" | "Paid" | "Overpaid";
  overpaid: boolean;
}

/**
 * Payment <-> invoice-version reconciliation (§5.5). Payments are attached to the CHAIN (not a
 * version row), so this recomputes status purely from `total_amount` of the ACTIVE (latest)
 * version vs the sum of all payments ever recorded against the chain.
 *
 * QA DEF-01 (Critical, Gate 1 condition): when a revise() drops the new total BELOW what was
 * already paid, this must NEVER report "Paid" - that would tell Finance the invoice is "fully and
 * correctly settled" when in fact money needs to be refunded/adjusted. Status is "Overpaid"
 * (distinct 4th state) whenever paidAmount exceeds totalAmount; `overpaid` stays as a convenience
 * boolean flag for callers that only care about the binary condition.
 */
export function computeReconciliation(totalAmount: number, paidAmount: number): ReconciliationResult {
  const outstanding = roundMoney(totalAmount - paidAmount);
  let status: ReconciliationResult["status"];
  if (outstanding < 0) status = "Overpaid";
  else if (paidAmount <= 0) status = "Issued";
  else if (outstanding === 0) status = "Paid";
  else status = "PartiallyPaid";
  return { outstanding, status, overpaid: outstanding < 0 };
}

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Descriptions,
  Steps,
  Button,
  Modal,
  Form,
  NumberField,
  DateField,
  TextField,
  SubmitButton,
  Notify,
  StatusTag
} from "../ui";
import { usePO, usePOTimeline, useConfirmPO, useCancelPO } from "../hooks/usePo";
import { useIssueInvoice, useRecordPayment } from "../hooks/useInvoices";
import { ApiError } from "../lib/apiClient";

// ECP-006 AC1: 5-step timeline in the exact order the AC specifies.
const TIMELINE_STEPS = ["Confirmed", "InProduction", "QC Approved", "Shipped", "Invoiced"];

export function PoDetailPage() {
  const { id } = useParams();
  const poId = id ? Number(id) : null;
  const { data: po, isLoading } = usePO(poId);
  const { data: timeline } = usePOTimeline(poId);
  const confirmPO = useConfirmPO();
  const cancelPO = useCancelPO();
  const issueInvoice = useIssueInvoice();
  const recordPayment = useRecordPayment();
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  // QA DEF-05 fix: invoice lines are derived directly from the PO's OWN lines (each keeping its
  // real productId/quantity/unitPrice) instead of a free-text form that used to hardcode
  // productId to the PO's first line for every entry. One invoice line per PO line, always.
  const invoiceLines = useMemo<
    Array<{ productId: number; description: string; quantity: number; unitPrice: number }>
  >(
    () =>
      (po?.lines ?? []).map((l: any) => ({
        productId: l.productId,
        description: l.product?.name ?? `product #${l.productId}`,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice)
      })),
    [po]
  );

  if (isLoading || !po) return <Card title="กำลังโหลด...">{null}</Card>;

  const currentStepIndex = TIMELINE_STEPS.indexOf(po.status);

  async function handleConfirm() {
    try {
      await confirmPO.mutateAsync(po.id);
      Notify.success("stock เพียงพอ - ยืนยัน PO สำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleCancel() {
    try {
      await cancelPO.mutateAsync(po.id);
      Notify.success("ยกเลิก PO สำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleIssueInvoice() {
    try {
      const result: any = await issueInvoice.mutateAsync({ poId: po.id, lines: invoiceLines });
      Notify.success("ออก invoice สำเร็จ (version 1)");
      setIssuedInvoice(result.data);
      setInvoiceModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handlePay(values: Record<string, unknown>) {
    if (!issuedInvoice) return;
    try {
      const result: any = await recordPayment.mutateAsync({
        invoiceId: issuedInvoice.id,
        amount: Number(values.amount),
        paymentDate: String(values.paymentDate),
        method: String(values.method)
      });
      setIssuedInvoice((prev: any) => ({ ...prev, status: result.data.status }));
      Notify.success(`บันทึกรับชำระสำเร็จ - สถานะ ${result.data.status}`);
      setPayModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  const invoiceSubtotal = invoiceLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  return (
    <Card title={`PO ${po.poNumber}`} testId="po-detail-card">
      <div data-testid="po-number" style={{ display: "none" }}>
        {po.poNumber}
      </div>
      <Descriptions
        items={[
          { label: "ลูกค้า", value: po.customer?.name },
          { label: "วันที่ต้องการส่งมอบ", value: new Date(po.requestedDeliveryDate).toLocaleDateString("th-TH") }
        ]}
      />
      {po.derivedStatusLabel ? <p>{po.derivedStatusLabel}</p> : null}
      <StatusTag status={po.status} testId="po-status-badge" />
      <div style={{ margin: "24px 0" }}>
        <Steps
          current={currentStepIndex < 0 ? 0 : currentStepIndex}
          items={TIMELINE_STEPS.map((s) => ({ title: s }))}
        />
      </div>
      {po.status === "Draft" && (
        <Button variant="primary" onClick={handleConfirm} testId="po-confirm-button">
          ยืนยัน PO
        </Button>
      )}
      {(po.status === "Draft" || po.status === "Confirmed") && (
        <Button variant="danger" onClick={handleCancel} testId="po-cancel-button">
          ยกเลิก PO
        </Button>
      )}
      {po.status === "Shipped" && (
        <Button variant="primary" onClick={() => setInvoiceModalOpen(true)} testId={`po-${po.poNumber}-issue-invoice`}>
          ออก invoice
        </Button>
      )}

      {issuedInvoice && (
        <Card title={`Invoice ${issuedInvoice.invoiceNo} (v${issuedInvoice.version})`}>
          <p>Subtotal: {Number(issuedInvoice.subtotal).toFixed(2)} บาท</p>
          <p data-testid="invoice-vat-amount">VAT: {Number(issuedInvoice.vatAmount).toFixed(2)} บาท</p>
          <p data-testid="invoice-total-amount">รวมทั้งสิ้น: {Number(issuedInvoice.totalAmount).toFixed(2)} บาท</p>
          <StatusTag status={issuedInvoice.status} testId="invoice-status-badge" />
          <div style={{ marginTop: 12 }}>
            <Button variant="primary" onClick={() => setPayModalOpen(true)} testId="record-payment-button">
              บันทึกรับชำระเงิน
            </Button>
          </div>
        </Card>
      )}

      <Card title="Timeline" testId="po-timeline">
        <ul>
          {(timeline ?? []).map((e: any) => (
            <li key={e.id} data-testid="po-timeline-step">
              {e.status} - {new Date(e.createdAt).toLocaleString("th-TH")}
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={invoiceModalOpen}
        title="ออก invoice (version 1) - ตามรายการสินค้าของ PO นี้"
        onCancel={() => setInvoiceModalOpen(false)}
        onOk={handleIssueInvoice}
        confirmLoading={issueInvoice.isPending}
        testId="issue-invoice-modal"
      >
        <table style={{ width: "100%", marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>สินค้า</th>
              <th style={{ textAlign: "right" }}>จำนวน</th>
              <th style={{ textAlign: "right" }}>ราคา/หน่วย</th>
              <th style={{ textAlign: "right" }}>รวม</th>
            </tr>
          </thead>
          <tbody>
            {invoiceLines.map((l, i) => (
              <tr key={i}>
                <td>{l.description}</td>
                <td style={{ textAlign: "right" }}>{l.quantity}</td>
                <td style={{ textAlign: "right" }}>{l.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>{(l.quantity * l.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong data-testid="invoice-subtotal-preview">Subtotal: {invoiceSubtotal.toFixed(2)} บาท</strong> (VAT
          จะคำนวณจากอัตราปัจจุบันตอนออกเอกสารจริง)
        </p>
      </Modal>

      <Modal open={payModalOpen} title="บันทึกรับชำระเงิน" onCancel={() => setPayModalOpen(false)} testId="payment-modal">
        <Form onSubmit={handlePay}>
          <NumberField name="amount" label="จำนวนเงิน" required min={0.01} testId="payment-amount" />
          <DateField name="paymentDate" label="วันที่รับเงิน" required testId="payment-date" />
          <TextField name="method" label="ช่องทางชำระเงิน" required placeholder="bank_transfer / cash" />
          <SubmitButton loading={recordPayment.isPending} testId="payment-submit">
            บันทึก
          </SubmitButton>
        </Form>
      </Modal>
    </Card>
  );
}

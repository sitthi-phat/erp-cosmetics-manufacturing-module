import { useState } from "react";
import {
  Card,
  DataTable,
  Button,
  Modal,
  Form,
  NumberField,
  DateField,
  TextField,
  NativeSelectField,
  SubmitButton,
  StatusTag,
  Notify,
  normalizeSelectValues
} from "../ui";
import { useInvoices, useInvoiceVersions, useRecordPayment, useReviseInvoice } from "../hooks/useInvoices";
import { useProducts } from "../hooks/useProducts";
import { ApiError } from "../lib/apiClient";

export function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: products } = useProducts();
  const recordPayment = useRecordPayment();
  const reviseInvoice = useReviseInvoice();
  const [payTarget, setPayTarget] = useState<{ id: number; invoiceNo: string } | null>(null);
  const [versionsTarget, setVersionsTarget] = useState<number | null>(null);
  const [reviseTarget, setReviseTarget] = useState<number | null>(null);
  const [reviseLines, setReviseLines] = useState<Array<{ productId: number; description: string; quantity: number; unitPrice: number }>>([]);
  const [reviseError, setReviseError] = useState<string | null>(null);
  const { data: versions } = useInvoiceVersions(versionsTarget);

  async function handlePay(values: Record<string, unknown>) {
    if (!payTarget) return;
    try {
      const result: any = await recordPayment.mutateAsync({
        invoiceId: payTarget.id,
        amount: Number(values.amount),
        paymentDate: String(values.paymentDate),
        method: String(values.method)
      });
      Notify.success(`บันทึกรับชำระสำเร็จ - สถานะ ${result.data.status}, คงค้าง ${result.data.outstanding}`);
      setPayTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  function addReviseLine(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    setReviseLines((prev) => [
      ...prev,
      {
        productId: Number(values.productId),
        description: String(values.description),
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice)
      }
    ]);
  }

  function removeReviseLine(index: number) {
    setReviseLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitRevise() {
    if (reviseTarget === null) return;
    setReviseError(null);
    // ECP-037 AC4: block a revision with zero lines client-side too (backend also enforces it).
    if (reviseLines.length === 0) {
      setReviseError("กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการก่อนบันทึก");
      return;
    }
    try {
      const result = await reviseInvoice.mutateAsync({ invoiceId: reviseTarget, lines: reviseLines });
      result.warnings.forEach((w) => Notify.warning(w));
      Notify.success("แก้ไข invoice สำเร็จ (สร้าง version ใหม่)");
      setReviseTarget(null);
      setReviseLines([]);
    } catch (err) {
      if (err instanceof ApiError) setReviseError(err.message);
    }
  }

  return (
    <Card title="Invoice / การเรียกเก็บเงิน" testId="invoice-list-card">
      <DataTable
        loading={isLoading}
        rows={invoices ?? []}
        rowKey={(i: any) => i.id}
        getRowTestId={(i: any) => `demo-invoice-row-${i.invoiceNo}`}
        columns={[
          { key: "invoiceNo", title: "เลขที่ invoice", render: (i: any) => `${i.invoiceNo} (v${i.version})` },
          { key: "total", title: "ยอดรวม (บาท)", render: (i: any) => Number(i.totalAmount).toFixed(2) },
          { key: "status", title: "สถานะ", render: (i: any) => <StatusTag status={i.status} testId="invoice-status-badge" /> },
          {
            key: "actions",
            title: "",
            render: (i: any) => (
              <>
                <Button onClick={() => setPayTarget({ id: i.id, invoiceNo: i.invoiceNo })} testId="record-payment-button">
                  รับชำระเงิน
                </Button>{" "}
                <Button onClick={() => setVersionsTarget(i.poId)} testId="view-version-history">
                  ดู versions
                </Button>{" "}
                <Button
                  onClick={() => {
                    setReviseTarget(i.id);
                    setReviseError(null);
                  }}
                  testId="revise-invoice-button"
                >
                  แก้ไข (revise)
                </Button>
              </>
            )
          }
        ]}
      />

      <Modal open={payTarget !== null} title={`รับชำระเงิน - ${payTarget?.invoiceNo}`} onCancel={() => setPayTarget(null)}>
        <Form onSubmit={handlePay}>
          <NumberField name="amount" label="จำนวนเงิน" required min={0.01} testId="payment-amount" />
          <DateField name="paymentDate" label="วันที่รับเงิน" required testId="payment-date" />
          <TextField name="method" label="ช่องทางชำระเงิน" required placeholder="bank_transfer / cash" />
          <SubmitButton loading={recordPayment.isPending} testId="payment-submit">
            บันทึก
          </SubmitButton>
        </Form>
      </Modal>

      <Modal open={versionsTarget !== null} title="ประวัติ version ของ invoice" onCancel={() => setVersionsTarget(null)}>
        <ul>
          {(versions ?? []).map((v: any) => (
            <li key={v.id} data-testid="invoice-version-row">
              v{v.version} - {Number(v.totalAmount).toFixed(2)} บาท -{" "}
              <span data-testid="invoice-version-badge">{v.status}</span>
              {v.supersededLabel ? ` (${v.supersededLabel})` : ""}
              {v.status === "Superseded" && (
                <>
                  {" "}
                  <a data-testid="link-to-latest-version" href="#" onClick={(e) => e.preventDefault()}>
                    ไปที่ version ล่าสุด
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={reviseTarget !== null}
        title="แก้ไข invoice (สร้าง version ใหม่)"
        onCancel={() => {
          setReviseTarget(null);
          setReviseLines([]);
          setReviseError(null);
        }}
        onOk={submitRevise}
        confirmLoading={reviseInvoice.isPending}
        testId="revise-invoice-modal"
      >
        <p data-testid="payment-reconciliation-warning" style={{ color: "#ad6800" }}>
          หาก invoice นี้มีการรับชำระแล้ว การแก้ไขจะสร้าง version ใหม่ที่อาจมียอดต่างจากที่บันทึกรับชำระไว้
          กรุณาตรวจสอบยอดชำระซ้ำ
        </p>
        {reviseError && (
          <p data-testid="form-error" style={{ color: "red" }}>
            <span data-testid="invoice-blocked-message">{reviseError}</span>
          </p>
        )}
        <Form onSubmit={addReviseLine}>
          <NativeSelectField
            name="productId"
            label="สินค้า"
            required
            options={(products ?? []).map((p: any) => ({ value: p.id, label: p.name }))}
          />
          <TextField name="description" label="รายละเอียด" required />
          <NumberField name="quantity" label="จำนวน" required min={0.001} testId="revise-line-qty-0" />
          <NumberField name="unitPrice" label="ราคาต่อหน่วย" required min={0} />
          <SubmitButton>+ เพิ่มรายการ</SubmitButton>
        </Form>
        <ul>
          {reviseLines.map((l, i) => (
            <li key={i}>
              {l.description} x {l.quantity} @ {l.unitPrice}{" "}
              <a data-testid={`remove-line-${i}`} href="#" onClick={(e) => {
                e.preventDefault();
                removeReviseLine(i);
              }}>
                ลบ
              </a>
            </li>
          ))}
        </ul>
        <Button onClick={submitRevise} testId="revise-submit">
          บันทึกการแก้ไข
        </Button>
      </Modal>
    </Card>
  );
}
